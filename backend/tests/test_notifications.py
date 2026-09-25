import pytest
from httpx import AsyncClient
from uuid import uuid4

from app.models.enums import NotificationChannel, NotificationEventType, UserRole
from app.tasks.email import send_email_notification
from app.tasks.sms import send_sms_notification, normalize_nigerian_phone
from app.tasks.notifications import reconcile_abandoned_payments, cleanup_old_notifications
import app.tasks.templates as templates

@pytest.mark.asyncio
async def test_email_and_sms_celery_tasks():
    """Tests asynchronous worker functions for email and SMS delivery."""
    # 1. Email task execution
    email_res = send_email_notification(
        to_email="customer@example.com",
        subject="Your SettleCart Order",
        html_body="<h1>Order Confirmed</h1>",
        text_body="Order Confirmed",
    )
    assert email_res["status"] == "simulated"
    assert email_res["to"] == "customer@example.com"
    assert email_res["subject"] == "Your SettleCart Order"

    # 2. SMS normalization & execution
    normalized = normalize_nigerian_phone("08012345678")
    assert normalized == "2348012345678"

    normalized_intl = normalize_nigerian_phone("+2348012345678")
    assert normalized_intl == "2348012345678"

    sms_res = send_sms_notification(
        to_phone="08012345678",
        message="SettleCart: Your OTP code is 123456.",
    )
    assert sms_res["status"] == "simulated"
    assert sms_res["to"] == "2348012345678"

    # 3. Periodic Celery Beat tasks
    recon_res = reconcile_abandoned_payments()
    assert recon_res["status"] == "success"

    cleanup_res = cleanup_old_notifications()
    assert cleanup_res["status"] == "success"


@pytest.mark.asyncio
async def test_in_app_notification_lifecycle_and_api(client: AsyncClient):
    """Verifies in-app notification center, listing, unread counts, and read status."""
    # 1. Register User A
    user_a = await client.post("/api/v1/auth/register", json={
        "email": "notif_user_a@test.com",
        "password": "Password123!",
        "full_name": "Notif User A",
    })
    token_a = user_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register User B
    user_b = await client.post("/api/v1/auth/register", json={
        "email": "notif_user_b@test.com",
        "password": "Password123!",
        "full_name": "Notif User B",
    })
    token_b = user_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Initial unread count should be 0
    unread_res = await client.get("/api/v1/notifications/unread-count", headers=headers_a)
    assert unread_res.status_code == 200
    assert unread_res.json()["unread_count"] == 0

    # 2. Create simulated notifications via NotificationService
    from tests.conftest import TestSessionLocal
    from app.notifications.service import NotificationService

    user_a_me = (await client.get("/api/v1/auth/me", headers=headers_a)).json()
    user_a_id = user_a_me["id"]

    # We use test session
    async with TestSessionLocal() as session:
        from uuid import UUID
        uid = UUID(user_a_id)
        await NotificationService.create_notification(
            session,
            user_id=uid,
            title="Order Placed",
            message="Your order #ORD-1001 has been received.",
            channel=NotificationChannel.IN_APP,
            event_type=NotificationEventType.ORDER_CREATED,
            data={"order_id": str(uuid4())},
        )
        await NotificationService.create_notification(
            session,
            user_id=uid,
            title="Delivery in Transit",
            message="Rider is on the way.",
            channel=NotificationChannel.IN_APP,
            event_type=NotificationEventType.DELIVERY_IN_TRANSIT,
        )
        await session.commit()

    # 3. Check updated unread count
    unread_res2 = await client.get("/api/v1/notifications/unread-count", headers=headers_a)
    assert unread_res2.json()["unread_count"] == 2

    # 4. List notifications
    list_res = await client.get("/api/v1/notifications/", headers=headers_a)
    assert list_res.status_code == 200
    data = list_res.json()
    assert data["total"] == 2
    assert data["unread_count"] == 2
    assert len(data["notifications"]) == 2
    notif_id_1 = data["notifications"][0]["id"]
    notif_id_2 = data["notifications"][1]["id"]

    # 5. Mark single notification as read
    read_res = await client.patch(f"/api/v1/notifications/{notif_id_1}/read", headers=headers_a)
    assert read_res.status_code == 200
    assert read_res.json()["is_read"] is True

    # Check unread count is now 1
    unread_res3 = await client.get("/api/v1/notifications/unread-count", headers=headers_a)
    assert unread_res3.json()["unread_count"] == 1

    # 6. Tenant isolation: User B cannot read User A's notification
    forbidden_res = await client.patch(f"/api/v1/notifications/{notif_id_2}/read", headers=headers_b)
    assert forbidden_res.status_code == 403

    # 7. Mark all notifications as read
    mark_all_res = await client.post("/api/v1/notifications/mark-all-read", headers=headers_a)
    assert mark_all_res.status_code == 200
    assert mark_all_res.json()["marked_read"] == 1

    # Final unread count should be 0
    unread_res4 = await client.get("/api/v1/notifications/unread-count", headers=headers_a)
    assert unread_res4.json()["unread_count"] == 0


@pytest.mark.asyncio
async def test_end_to_end_delivery_and_settlement_notification_pipeline(client: AsyncClient):
    """
    Verifies that real business flows (order placement, task creation, OTP generation,
    and settlement ledger crediting) create proper in-app notifications.
    """
    # 1. Accounts
    admin_res = await client.post("/api/v1/auth/register", json={
        "email": "pipeline_admin@test.com", "password": "Password123!", "full_name": "Pipeline Admin", "role": "admin"
    })
    admin_token = admin_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    vendor_res = await client.post("/api/v1/auth/register", json={
        "email": "pipeline_vendor@test.com", "password": "Password123!", "full_name": "Pipeline Vendor", "role": "vendor"
    })
    vendor_token = vendor_res.json()["access_token"]
    vendor_headers = {"Authorization": f"Bearer {vendor_token}"}

    rider_res = await client.post("/api/v1/auth/register", json={
        "email": "pipeline_rider@test.com", "password": "Password123!", "full_name": "Pipeline Rider", "role": "dispatch"
    })
    rider_token = rider_res.json()["access_token"]
    rider_headers = {"Authorization": f"Bearer {rider_token}"}
    rider_id = (await client.get("/api/v1/users/me", headers=rider_headers)).json()["id"]

    cust_res = await client.post("/api/v1/auth/register", json={
        "email": "pipeline_cust@test.com", "password": "Password123!", "full_name": "Pipeline Customer", "role": "customer"
    })
    cust_token = cust_res.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # 2. Store & Product
    biz = await client.post("/api/v1/businesses/", json={"name": "Pipeline Hub", "business_type": "Electronics"}, headers=vendor_headers)
    store = await client.post("/api/v1/stores/", json={"name": "Pipeline Store", "business_id": biz.json()["id"]}, headers=vendor_headers)
    await client.post(f"/api/v1/stores/{store.json()['id']}/publish", headers=vendor_headers)
    prod = await client.post(f"/api/v1/catalogue/stores/{store.json()['id']}/products", json={
        "name": "Smart Speaker", "price": 25000.00, "track_inventory": True, "inventory_count": 10
    }, headers=vendor_headers)

    # 3. Order
    order_res = await client.post("/api/v1/orders/", json={
        "items": [{"product_id": prod.json()["id"], "quantity": 1}],
        "delivery_address": "5 Admiralty Way, Lekki", "delivery_city": "Lagos", "delivery_phone": "+2348011223344"
    }, headers=cust_headers)
    vo_id = order_res.json()["vendor_orders"][0]["id"]

    # 4. Create delivery task (Triggers customer OTP notification)
    task_res = await client.post(f"/api/v1/dispatch/tasks/from-vendor-order/{vo_id}", headers=vendor_headers)
    task_id = task_res.json()["id"]

    # Customer should now have the OTP delivery notification!
    cust_notifs = await client.get("/api/v1/notifications/", headers=cust_headers)
    assert cust_notifs.status_code == 200
    assert cust_notifs.json()["total"] >= 1
    otp_notif = cust_notifs.json()["notifications"][0]
    assert otp_notif["event_type"] == NotificationEventType.DELIVERY_OTP_GENERATED.value
    assert "handover code" in otp_notif["message"].lower() or "verification code" in otp_notif["title"].lower()

    # 5. Assign rider (Triggers rider assignment notification)
    await client.post(f"/api/v1/dispatch/tasks/{task_id}/assign", json={"rider_id": rider_id}, headers=admin_headers)

    rider_notifs = await client.get("/api/v1/notifications/", headers=rider_headers)
    assert rider_notifs.status_code == 200
    assert rider_notifs.json()["total"] >= 1
    rider_task_notif = rider_notifs.json()["notifications"][0]
    assert rider_task_notif["event_type"] == NotificationEventType.DISPATCH_ASSIGNED.value
    assert "assignment" in rider_task_notif["title"].lower()

    # 6. Rider accepts, picks up, and delivers with OTP
    await client.post(f"/api/v1/dispatch/tasks/{task_id}/accept", headers=rider_headers)
    await client.post(f"/api/v1/dispatch/tasks/{task_id}/pickup", headers=rider_headers)
    await client.post(f"/api/v1/dispatch/tasks/{task_id}/start", headers=rider_headers)

    otp_code = (await client.get(f"/api/v1/dispatch/tasks/{task_id}/verification-code", headers=cust_headers)).json()["verification_code"]
    verify_res = await client.post(f"/api/v1/dispatch/tasks/{task_id}/verify-delivery", json={"code": otp_code}, headers=rider_headers)
    assert verify_res.status_code == 200

    # 7. Settlement triggers automatically on delivery completion!
    # Vendor should now have received settlement credit notification!
    vendor_notifs = await client.get("/api/v1/notifications/", headers=vendor_headers)
    assert vendor_notifs.status_code == 200
    assert vendor_notifs.json()["total"] >= 1
    settle_notif = vendor_notifs.json()["notifications"][0]
    assert settle_notif["event_type"] == NotificationEventType.SETTLEMENT_CREDITED.value
    assert "wallet credited" in settle_notif["title"].lower()
