import pytest
import hmac
import hashlib
import json
from httpx import AsyncClient
from app.core.config import settings
from app.models.enums import UserRole, OrderStatus, VendorOrderStatus, PaymentStatus

@pytest.mark.asyncio
async def test_full_payment_lifecycle_and_webhook(client: AsyncClient):
    # 1. Register Customer & Vendor
    cust_reg = await client.post("/api/v1/auth/register", json={
        "email": "pay_cust@test.com", "password": "Password123!", "full_name": "Paying Customer", "role": "customer"
    })
    cust_token = cust_reg.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    vendor_reg = await client.post("/api/v1/auth/register", json={
        "email": "pay_vendor@test.com", "password": "Password123!", "full_name": "Selling Merchant", "role": "vendor"
    })
    vendor_token = vendor_reg.json()["access_token"]
    vendor_headers = {"Authorization": f"Bearer {vendor_token}"}

    # 2. Store & Product
    biz = await client.post("/api/v1/businesses/", json={"name": "Tech Hub", "business_type": "Retail"}, headers=vendor_headers)
    store = await client.post("/api/v1/stores/", json={"name": "Tech Store Lekki", "business_id": biz.json()["id"]}, headers=vendor_headers)
    await client.post(f"/api/v1/stores/{store.json()['id']}/publish", headers=vendor_headers)

    prod = await client.post(f"/api/v1/catalogue/stores/{store.json()['id']}/products", json={
        "name": "Smart Watch", "price": 45000.00, "track_inventory": True, "inventory_count": 5
    }, headers=vendor_headers)
    prod_id = prod.json()["id"]

    # 3. Create Order
    order_res = await client.post("/api/v1/orders/", json={
        "items": [{"product_id": prod_id, "quantity": 1}],
        "delivery_address": "Admiralty Way, Lekki",
        "delivery_city": "Lagos",
        "delivery_phone": "+2348011223344"
    }, headers=cust_headers)
    assert order_res.status_code == 201
    order_data = order_res.json()
    order_id = order_data["id"]
    assert order_data["status"] == OrderStatus.CREATED.value

    # 4. Initialize Payment
    init_res = await client.post("/api/v1/payments/initialize", json={
        "order_id": order_id,
        "callback_url": "https://settle-cart.vercel.app/checkout/callback"
    }, headers=cust_headers)
    assert init_res.status_code == 200
    init_data = init_res.json()
    reference = init_data["reference"]
    assert reference.startswith("PAY-")
    assert "authorization_url" in init_data

    # Verify Order is now PAYMENT_PENDING
    order_after_init = await client.get(f"/api/v1/orders/{order_id}", headers=cust_headers)
    assert order_after_init.json()["status"] == OrderStatus.PAYMENT_PENDING.value

    # 5. Webhook: Reject Tampered / Missing Signature
    webhook_body = {
        "event": "charge.success",
        "data": {
            "id": 987654321,
            "reference": reference,
            "amount": 4500000,
            "currency": "NGN",
            "channel": "card",
            "status": "success"
        }
    }
    raw_payload = json.dumps(webhook_body).encode("utf-8")

    tampered_res = await client.post(
        "/api/v1/payments/webhook",
        content=raw_payload,
        headers={"Content-Type": "application/json", "x-paystack-signature": "invalid_signature"}
    )
    assert tampered_res.status_code == 400

    # 6. Webhook: Compute valid HMAC SHA512 signature & Process
    secret_key = settings.PAYSTACK_SECRET_KEY or "fallback-secret"
    valid_signature = hmac.new(secret_key.encode("utf-8"), raw_payload, hashlib.sha512).hexdigest()

    valid_webhook_res = await client.post(
        "/api/v1/payments/webhook",
        content=raw_payload,
        headers={"Content-Type": "application/json", "x-paystack-signature": valid_signature}
    )
    assert valid_webhook_res.status_code == 200

    # 7. Check Order & VendorOrder State Transition
    order_confirmed = await client.get(f"/api/v1/orders/{order_id}", headers=cust_headers)
    assert order_confirmed.status_code == 200
    assert order_confirmed.json()["status"] == OrderStatus.PAYMENT_CONFIRMED.value
    assert order_confirmed.json()["vendor_orders"][0]["status"] == VendorOrderStatus.ACCEPTED.value

    # 8. FR-FIN-003 Idempotency: Send Duplicate Webhook -> Must succeed without error or state distortion
    duplicate_res = await client.post(
        "/api/v1/payments/webhook",
        content=raw_payload,
        headers={"Content-Type": "application/json", "x-paystack-signature": valid_signature}
    )
    assert duplicate_res.status_code == 200

    # 9. Cannot initialize payment on an already paid order -> Conflict 409
    double_init = await client.post("/api/v1/payments/initialize", json={
        "order_id": order_id
    }, headers=cust_headers)
    assert double_init.status_code in [400, 409]

