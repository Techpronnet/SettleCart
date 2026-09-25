import pytest
from httpx import AsyncClient
from decimal import Decimal
from app.models.enums import UserRole, DeliveryTaskStatus, VendorOrderStatus, OrderStatus, WithdrawalStatus

@pytest.mark.asyncio
async def test_full_settlement_ledger_and_withdrawal_lifecycle(client: AsyncClient):
    # 1. Register Admin
    admin_res = await client.post("/api/v1/auth/register", json={
        "email": "ledger_admin@test.com", "password": "Password123!", "full_name": "Ledger Admin", "role": "admin"
    })
    admin_token = admin_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Register Vendor
    vendor_res = await client.post("/api/v1/auth/register", json={
        "email": "ledger_vendor@test.com", "password": "Password123!", "full_name": "Ledger Vendor", "role": "vendor"
    })
    vendor_token = vendor_res.json()["access_token"]
    vendor_headers = {"Authorization": f"Bearer {vendor_token}"}

    # 3. Register Dispatch Rider
    rider_res = await client.post("/api/v1/auth/register", json={
        "email": "ledger_rider@test.com", "password": "Password123!", "full_name": "Ledger Rider", "role": "dispatch"
    })
    rider_token = rider_res.json()["access_token"]
    rider_headers = {"Authorization": f"Bearer {rider_token}"}
    rider_id = (await client.get("/api/v1/users/me", headers=rider_headers)).json()["id"]

    # 4. Register Customer
    cust_res = await client.post("/api/v1/auth/register", json={
        "email": "ledger_cust@test.com", "password": "Password123!", "full_name": "Ledger Cust", "role": "customer"
    })
    cust_token = cust_res.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # 5. Store & Product (₦50,000 price)
    biz = await client.post("/api/v1/businesses/", json={"name": "Audio World", "business_type": "Retail"}, headers=vendor_headers)
    store = await client.post("/api/v1/stores/", json={"name": "Audio Store", "business_id": biz.json()["id"]}, headers=vendor_headers)
    await client.post(f"/api/v1/stores/{store.json()['id']}/publish", headers=vendor_headers)

    prod = await client.post(f"/api/v1/catalogue/stores/{store.json()['id']}/products", json={
        "name": "Noise Cancelling Headphones", "price": 50000.00, "track_inventory": True, "inventory_count": 5
    }, headers=vendor_headers)
    prod_id = prod.json()["id"]

    # 6. Customer creates order
    order_res = await client.post("/api/v1/orders/", json={
        "items": [{"product_id": prod_id, "quantity": 1}],
        "delivery_address": "10 Marina, Lagos", "delivery_city": "Lagos", "delivery_phone": "+2348011223344"
    }, headers=cust_headers)
    order_data = order_res.json()
    vo_id = order_data["vendor_orders"][0]["id"]

    # 7. Create delivery task & progress to IN_TRANSIT
    task_res = await client.post(f"/api/v1/dispatch/tasks/from-vendor-order/{vo_id}", headers=vendor_headers)
    task_id = task_res.json()["id"]

    await client.post(f"/api/v1/dispatch/tasks/{task_id}/assign", json={"rider_id": rider_id}, headers=admin_headers)
    await client.post(f"/api/v1/dispatch/tasks/{task_id}/accept", headers=rider_headers)
    await client.post(f"/api/v1/dispatch/tasks/{task_id}/pickup", headers=rider_headers)
    await client.post(f"/api/v1/dispatch/tasks/{task_id}/start", headers=rider_headers)

    # 8. Customer fetches OTP
    code_res = await client.get(f"/api/v1/dispatch/tasks/{task_id}/verification-code", headers=cust_headers)
    otp_code = code_res.json()["verification_code"]

    # 9. Initial Vendor Wallet balance -> ₦0.00
    vendor_wallet_before = await client.get("/api/v1/wallets/me", headers=vendor_headers)
    assert vendor_wallet_before.status_code == 200
    assert Decimal(str(vendor_wallet_before.json()["available_balance"])) == Decimal("0.00")

    # 10. Rider enters OTP -> DELIVERED & Automatic Settlement Triggered!
    verify_res = await client.post(
        f"/api/v1/dispatch/tasks/{task_id}/verify-delivery",
        json={"code": otp_code},
        headers=rider_headers
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["status"] == DeliveryTaskStatus.DELIVERED.value

    # 11. Verify Vendor Wallet is credited with 95% of ₦50,000 = ₦47,500.00
    vendor_wallet_after = await client.get("/api/v1/wallets/me", headers=vendor_headers)
    assert vendor_wallet_after.status_code == 200
    vendor_balance = Decimal(str(vendor_wallet_after.json()["available_balance"]))
    assert vendor_balance == Decimal("47500.00")

    # 12. Verify Rider Wallet is credited with delivery earnings
    rider_wallet = await client.get("/api/v1/wallets/me", headers=rider_headers)
    assert rider_wallet.status_code == 200
    assert Decimal(str(rider_wallet.json()["available_balance"])) > Decimal("0.00")

    # 13. Verify Vendor Ledger audit trail
    ledger_res = await client.get("/api/v1/wallets/ledger", headers=vendor_headers)
    assert ledger_res.status_code == 200
    entries = ledger_res.json()["entries"]
    assert len(entries) >= 1
    assert entries[0]["category"] == "vendor_earnings"
    assert Decimal(str(entries[0]["amount"])) == Decimal("47500.00")

    # 14. Vendor requests Withdrawal of ₦20,000
    wd_res = await client.post("/api/v1/wallets/withdraw", json={
        "amount": 20000.00,
        "bank_name": "Access Bank",
        "account_number": "0123456789",
        "account_name": "Ledger Vendor Enterprise"
    }, headers=vendor_headers)
    assert wd_res.status_code == 201
    wd_id = wd_res.json()["id"]

    # Available balance immediately drops to ₦27,500.00 (Escrow Debit)
    vendor_wallet_after_wd = await client.get("/api/v1/wallets/me", headers=vendor_headers)
    assert Decimal(str(vendor_wallet_after_wd.json()["available_balance"])) == Decimal("27500.00")

    # 15. Admin approves withdrawal
    approve_res = await client.post(
        f"/api/v1/wallets/withdrawals/{wd_id}/review",
        json={"action": "approve"},
        headers=admin_headers
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == WithdrawalStatus.APPROVED.value

    # 16. Test Rejection & Compensating Credit
    wd2_res = await client.post("/api/v1/wallets/withdraw", json={
        "amount": 10000.00,
        "bank_name": "GTBank",
        "account_number": "0987654321",
        "account_name": "Ledger Vendor Enterprise"
    }, headers=vendor_headers)
    assert wd2_res.status_code == 201
    wd2_id = wd2_res.json()["id"]

    # Balance temporarily at ₦17,500
    assert Decimal(str((await client.get("/api/v1/wallets/me", headers=vendor_headers)).json()["available_balance"])) == Decimal("17500.00")

    # Admin rejects withdrawal
    reject_res = await client.post(
        f"/api/v1/wallets/withdrawals/{wd2_id}/review",
        json={"action": "reject", "reason": "Incorrect account name mismatch"},
        headers=admin_headers
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == WithdrawalStatus.REJECTED.value

    # Compensating CREDIT restores balance back to ₦27,500.00
    vendor_wallet_restored = await client.get("/api/v1/wallets/me", headers=vendor_headers)
    assert Decimal(str(vendor_wallet_restored.json()["available_balance"])) == Decimal("27500.00")

