import pytest
from httpx import AsyncClient
from decimal import Decimal
from datetime import datetime, timezone, timedelta
from app.models.enums import UserRole, DeliveryTaskStatus, VendorOrderStatus, OrderStatus

@pytest.mark.asyncio
async def test_full_dispatch_and_otp_verification_lifecycle(client: AsyncClient):
    # 1. Register Admin
    admin_reg = await client.post("/api/v1/auth/register", json={
        "email": "dispatch_admin@test.com",
        "password": "Password123!",
        "full_name": "Dispatch Admin",
        "role": UserRole.ADMIN.value
    })
    assert admin_reg.status_code == 201
    admin_token = admin_reg.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Register Customer
    cust_reg = await client.post("/api/v1/auth/register", json={
        "email": "customer_dispatch@test.com",
        "password": "Password123!",
        "full_name": "Happy Customer",
        "role": UserRole.CUSTOMER.value
    })
    assert cust_reg.status_code == 201
    cust_token = cust_reg.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # 3. Register Vendor
    vendor_reg = await client.post("/api/v1/auth/register", json={
        "email": "vendor_dispatch@test.com",
        "password": "Password123!",
        "full_name": "Vendor Merchant",
        "role": UserRole.VENDOR.value
    })
    assert vendor_reg.status_code == 201
    vendor_token = vendor_reg.json()["access_token"]
    vendor_headers = {"Authorization": f"Bearer {vendor_token}"}

    # 4. Register Dispatch Rider
    rider_reg = await client.post("/api/v1/auth/register", json={
        "email": "rider_dispatch@test.com",
        "password": "Password123!",
        "full_name": "Swift Rider",
        "role": UserRole.DISPATCH.value
    })
    assert rider_reg.status_code == 201
    rider_token = rider_reg.json()["access_token"]
    rider_headers = {"Authorization": f"Bearer {rider_token}"}

    # Get Rider ID
    rider_me = await client.get("/api/v1/users/me", headers=rider_headers)
    rider_id = rider_me.json()["id"]

    # 5. Vendor creates Business & Store
    biz_res = await client.post("/api/v1/businesses/", json={
        "name": "Lagos Tech Store",
        "business_type": "Electronics"
    }, headers=vendor_headers)
    assert biz_res.status_code == 201
    biz_id = biz_res.json()["id"]

    store_res = await client.post("/api/v1/stores/", json={
        "name": "Gadget Hub Ikeja",
        "business_id": biz_id,
        "address": "12 Allen Avenue",
        "city": "Ikeja, Lagos",
        "phone": "+2348011223344"
    }, headers=vendor_headers)
    assert store_res.status_code == 201
    store_id = store_res.json()["id"]

    # Publish store
    await client.post(f"/api/v1/stores/{store_id}/publish", headers=vendor_headers)

    # 6. Create Product
    prod_res = await client.post(f"/api/v1/catalogue/stores/{store_id}/products", json={
        "name": "Wireless PowerBank",
        "price": 25000.00,
        "track_inventory": True,
        "inventory_count": 10
    }, headers=vendor_headers)
    assert prod_res.status_code == 201
    prod_id = prod_res.json()["id"]

    # 7. Customer creates Order
    order_res = await client.post("/api/v1/orders/", json={
        "items": [{"product_id": prod_id, "quantity": 1}],
        "delivery_address": "45 Victoria Island, Lagos",
        "delivery_city": "Lagos",
        "delivery_phone": "+2348099887766"
    }, headers=cust_headers)
    assert order_res.status_code == 201

    order_data = order_res.json()
    order_id = order_data["id"]
    vendor_order_id = order_data["vendor_orders"][0]["id"]

    # 8. Create Delivery Task for the vendor order
    task_res = await client.post(
        f"/api/v1/dispatch/tasks/from-vendor-order/{vendor_order_id}",
        headers=vendor_headers
    )
    assert task_res.status_code == 201
    task_data = task_res.json()
    task_id = task_data["id"]
    assert task_data["status"] == DeliveryTaskStatus.PENDING.value
    assert task_data["pickup_city"] == "Ikeja, Lagos"
    assert task_data["dropoff_city"] == "Lagos"

    # 9. Test Security: Rider attempts to fetch the verification code -> MUST BE FORBIDDEN
    forbidden_code = await client.get(
        f"/api/v1/dispatch/tasks/{task_id}/verification-code",
        headers=rider_headers
    )
    assert forbidden_code.status_code == 403

    # Customer fetches their verification code -> SUCCEEDS
    cust_code_res = await client.get(
        f"/api/v1/dispatch/tasks/{task_id}/verification-code",
        headers=cust_headers
    )
    assert cust_code_res.status_code == 200
    otp_data = cust_code_res.json()
    correct_otp = otp_data["verification_code"]
    assert len(correct_otp) == 6
    assert otp_data["is_verified"] is False

    # 10. Admin assigns Rider
    assign_res = await client.post(
        f"/api/v1/dispatch/tasks/{task_id}/assign",
        json={"rider_id": rider_id},
        headers=admin_headers
    )
    assert assign_res.status_code == 200
    assert assign_res.json()["status"] == DeliveryTaskStatus.ASSIGNED.value

    # 11. Rider accepts assignment
    accept_res = await client.post(
        f"/api/v1/dispatch/tasks/{task_id}/accept",
        headers=rider_headers
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == DeliveryTaskStatus.ACCEPTED.value

    # 12. Rider confirms pickup at Vendor Store
    pickup_res = await client.post(
        f"/api/v1/dispatch/tasks/{task_id}/pickup",
        headers=rider_headers
    )
    assert pickup_res.status_code == 200
    assert pickup_res.json()["status"] == DeliveryTaskStatus.PICKED_UP.value

    # 13. Rider starts delivery journey
    start_res = await client.post(
        f"/api/v1/dispatch/tasks/{task_id}/start",
        headers=rider_headers
    )
    assert start_res.status_code == 200
    assert start_res.json()["status"] == DeliveryTaskStatus.IN_TRANSIT.value

    # 14. Rider attempts verification with WRONG code -> FAILS with remaining attempts
    wrong_verify = await client.post(
        f"/api/v1/dispatch/tasks/{task_id}/verify-delivery",
        json={"code": "000000"},
        headers=rider_headers
    )
    assert wrong_verify.status_code == 400
    assert "remaining" in wrong_verify.json()["error"]["message"]

    # 15. Rider submits CORRECT customer verification code -> SUCCEEDS & TRANSITIONS TO DELIVERED
    valid_verify = await client.post(
        f"/api/v1/dispatch/tasks/{task_id}/verify-delivery",
        json={"code": correct_otp},
        headers=rider_headers
    )
    assert valid_verify.status_code == 200
    assert valid_verify.json()["status"] == DeliveryTaskStatus.DELIVERED.value

    # 16. Verify Order and VendorOrder have transitioned to DELIVERED or auto-settled SETTLED
    order_check = await client.get(f"/api/v1/orders/{order_id}", headers=cust_headers)
    assert order_check.status_code == 200
    assert order_check.json()["status"] in [OrderStatus.DELIVERED.value, OrderStatus.SETTLED.value]
    assert order_check.json()["vendor_orders"][0]["status"] in [VendorOrderStatus.DELIVERED.value, VendorOrderStatus.SETTLED.value]


@pytest.mark.asyncio
async def test_max_verification_attempts_locks_delivery(client: AsyncClient):
    # Setup roles
    admin = await client.post("/api/v1/auth/register", json={
        "email": "lock_admin@test.com", "password": "Password123!", "full_name": "Lock Admin", "role": "admin"
    })
    admin_headers = {"Authorization": f"Bearer {admin.json()['access_token']}"}

    vendor = await client.post("/api/v1/auth/register", json={
        "email": "lock_vendor@test.com", "password": "Password123!", "full_name": "Lock Vendor", "role": "vendor"
    })
    vendor_headers = {"Authorization": f"Bearer {vendor.json()['access_token']}"}

    rider = await client.post("/api/v1/auth/register", json={
        "email": "lock_rider@test.com", "password": "Password123!", "full_name": "Lock Rider", "role": "dispatch"
    })
    rider_headers = {"Authorization": f"Bearer {rider.json()['access_token']}"}
    rider_id = (await client.get("/api/v1/users/me", headers=rider_headers)).json()["id"]

    cust = await client.post("/api/v1/auth/register", json={
        "email": "lock_cust@test.com", "password": "Password123!", "full_name": "Lock Cust", "role": "customer"
    })
    cust_headers = {"Authorization": f"Bearer {cust.json()['access_token']}"}

    # Store & Product
    biz = await client.post("/api/v1/businesses/", json={"name": "Lock Biz", "business_type": "Retail"}, headers=vendor_headers)
    store = await client.post("/api/v1/stores/", json={"name": "Lock Store", "business_id": biz.json()["id"]}, headers=vendor_headers)
    await client.post(f"/api/v1/stores/{store.json()['id']}/publish", headers=vendor_headers)
    prod = await client.post(f"/api/v1/catalogue/stores/{store.json()['id']}/products", json={"name": "Lock Item", "price": 5000.00}, headers=vendor_headers)

    # Order & Delivery Task
    order = await client.post("/api/v1/orders/", json={
        "items": [{"product_id": prod.json()["id"], "quantity": 1}],
        "delivery_address": "Marina, Lagos", "delivery_city": "Lagos", "delivery_phone": "08012345678"
    }, headers=cust_headers)
    vo_id = order.json()["vendor_orders"][0]["id"]

    task = await client.post(f"/api/v1/dispatch/tasks/from-vendor-order/{vo_id}", headers=vendor_headers)
    task_id = task.json()["id"]

    # Assign & Progress to IN_TRANSIT
    await client.post(f"/api/v1/dispatch/tasks/{task_id}/assign", json={"rider_id": rider_id}, headers=admin_headers)
    await client.post(f"/api/v1/dispatch/tasks/{task_id}/accept", headers=rider_headers)
    await client.post(f"/api/v1/dispatch/tasks/{task_id}/pickup", headers=rider_headers)
    await client.post(f"/api/v1/dispatch/tasks/{task_id}/start", headers=rider_headers)

    # Fail 4 times (returns 400 with remaining count)
    for _ in range(4):
        res = await client.post(f"/api/v1/dispatch/tasks/{task_id}/verify-delivery", json={"code": "111111"}, headers=rider_headers)
        assert res.status_code == 400

    # 5th attempt exhausts limit -> returns 403 Forbidden
    fifth = await client.post(f"/api/v1/dispatch/tasks/{task_id}/verify-delivery", json={"code": "111111"}, headers=rider_headers)
    assert fifth.status_code == 403
    assert "exhausted" in fifth.json()["error"]["message"]

    # Subsequent attempt is locked
    locked = await client.post(f"/api/v1/dispatch/tasks/{task_id}/verify-delivery", json={"code": "111111"}, headers=rider_headers)
    assert locked.status_code == 403
    assert "locked for administrative review" in locked.json()["error"]["message"]

