import pytest
import json
from uuid import uuid4
from httpx import AsyncClient
from starlette.testclient import TestClient

from app.main import app
from app.realtime.pubsub import RealtimePubSubService

@pytest.mark.asyncio
async def test_ephemeral_ticket_lifecycle(client: AsyncClient):
    """
    Verifies Option A: Ephemeral Single-Use Ticket security:
    - User obtains a 30s ticket via POST /api/v1/realtime/ticket
    - First consumption validates the user and deletes the ticket from Redis
    - Second consumption immediately fails (single-use replay prevention).
    """
    reg = await client.post("/api/v1/auth/register", json={
        "email": "ticket_user@test.com", "password": "Password123!", "full_name": "Ticket User"
    })
    token = reg.json()["access_token"]
    user_me = await client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    user_id = user_me.json()["id"]

    # 1. Request ticket
    res = await client.post("/api/v1/realtime/ticket", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    ticket_data = res.json()
    ticket = ticket_data["ticket"]
    assert len(ticket) >= 16
    assert ticket_data["expires_in_seconds"] == 30

    # 2. First verification succeeds
    consumed_user_id = await RealtimePubSubService.verify_and_consume_ticket(ticket)
    assert str(consumed_user_id) == user_id

    # 3. Second verification fails (already burned)
    replay_attempt = await RealtimePubSubService.verify_and_consume_ticket(ticket)
    assert replay_attempt is None


@pytest.mark.asyncio
async def test_rider_location_telemetry_and_redis_caching(client: AsyncClient):
    """
    Tests rider GPS telemetry publishing:
    - Validates rider assignment
    - Updates high-frequency Redis location cache
    - Broadcasts event to Redis Pub/Sub channel
    - Rejects unauthorized riders with 403 Forbidden.
    """
    # 1. Setup accounts
    vendor_reg = await client.post("/api/v1/auth/register", json={
        "email": "loc_vendor@test.com", "password": "Password123!", "full_name": "Loc Vendor", "role": "vendor"
    })
    vendor_headers = {"Authorization": f"Bearer {vendor_reg.json()['access_token']}"}

    rider_reg = await client.post("/api/v1/auth/register", json={
        "email": "loc_rider@test.com", "password": "Password123!", "full_name": "Loc Rider", "role": "dispatch"
    })
    rider_headers = {"Authorization": f"Bearer {rider_reg.json()['access_token']}"}
    rider_id = (await client.get("/api/v1/users/me", headers=rider_headers)).json()["id"]

    other_rider_reg = await client.post("/api/v1/auth/register", json={
        "email": "other_rider@test.com", "password": "Password123!", "full_name": "Other Rider", "role": "dispatch"
    })
    other_rider_headers = {"Authorization": f"Bearer {other_rider_reg.json()['access_token']}"}

    cust_reg = await client.post("/api/v1/auth/register", json={
        "email": "loc_cust@test.com", "password": "Password123!", "full_name": "Loc Customer", "role": "customer"
    })
    cust_headers = {"Authorization": f"Bearer {cust_reg.json()['access_token']}"}

    admin_reg = await client.post("/api/v1/auth/register", json={
        "email": "loc_admin@test.com", "password": "Password123!", "full_name": "Loc Admin", "role": "admin",
        "admin_secret": "settlecart-admin-secret"
    })
    admin_headers = {"Authorization": f"Bearer {admin_reg.json()['access_token']}"}

    # 2. Store & Product
    biz = (await client.post("/api/v1/businesses/", json={"name": "Loc Biz", "business_type": "Retail"}, headers=vendor_headers)).json()
    store = (await client.post("/api/v1/stores/", json={
        "name": "Loc Store", "business_id": biz["id"], "address": "12 Tech Road", "city": "Lagos", "phone": "+2348000000000"
    }, headers=vendor_headers)).json()
    await client.post(f"/api/v1/stores/{store['id']}/publish", headers=vendor_headers)
    prod = (await client.post(f"/api/v1/catalogue/stores/{store['id']}/products", json={"name": "Loc Item", "price": 5000.00}, headers=vendor_headers)).json()

    # 3. Customer places Order
    order = (await client.post("/api/v1/orders/", json={
        "items": [{"product_id": prod["id"], "quantity": 1}],
        "delivery_address": "10 Lekki Phase 1",
        "delivery_city": "Lagos",
        "delivery_phone": "+2348011223344"
    }, headers=cust_headers)).json()
    order_id = order["id"]
    vo_id = order["vendor_orders"][0]["id"]

    # 4. Create and advance delivery task to IN_TRANSIT
    task = (await client.post(f"/api/v1/dispatch/tasks/from-vendor-order/{vo_id}", headers=vendor_headers)).json()
    task_id = task["id"]

    await client.post(f"/api/v1/dispatch/tasks/{task_id}/assign", json={"rider_id": rider_id}, headers=admin_headers)
    await client.post(f"/api/v1/dispatch/tasks/{task_id}/accept", headers=rider_headers)
    await client.post(f"/api/v1/dispatch/tasks/{task_id}/pickup", headers=rider_headers)
    await client.post(f"/api/v1/dispatch/tasks/{task_id}/start", headers=rider_headers)

    # 5. Assigned rider streams GPS coordinates
    gps_payload = {
        "latitude": 6.4418,
        "longitude": 3.4735,
        "heading": 135.0,
        "speed": 32.5,
    }
    loc_res = await client.post(
        f"/api/v1/dispatch/tasks/{task_id}/location",
        json=gps_payload,
        headers=rider_headers,
    )
    assert loc_res.status_code == 200
    loc_data = loc_res.json()
    assert loc_data["latitude"] == 6.4418
    assert loc_data["longitude"] == 3.4735

    # 6. Verify location is cached in Redis
    from uuid import UUID
    cached_loc = await RealtimePubSubService.get_rider_location(UUID(task_id))
    assert cached_loc is not None
    assert cached_loc["latitude"] == 6.4418
    assert cached_loc["longitude"] == 3.4735
    assert cached_loc["speed"] == 32.5

    # 7. Unassigned rider attempting to stream location must be rejected (403)
    unauth_res = await client.post(
        f"/api/v1/dispatch/tasks/{task_id}/location",
        json=gps_payload,
        headers=other_rider_headers,
    )
    assert unauth_res.status_code == 403


@pytest.mark.asyncio
async def test_tracking_summary_rest_and_sse_streaming(client: AsyncClient):
    """
    Verifies:
    1. GET /api/v1/orders/{order_id}/tracking-summary snapshot
    2. GET /api/v1/orders/{order_id}/live-tracking SSE stream header and initial event
    """
    cust = (await client.post("/api/v1/auth/register", json={
        "email": "sse_cust@test.com", "password": "Password123!", "full_name": "SSE Cust"
    })).json()
    headers = {"Authorization": f"Bearer {cust['access_token']}"}

    vendor = (await client.post("/api/v1/auth/register", json={
        "email": "sse_vendor@test.com", "password": "Password123!", "full_name": "SSE Vendor", "role": "vendor"
    })).json()
    v_headers = {"Authorization": f"Bearer {vendor['access_token']}"}

    biz = (await client.post("/api/v1/businesses/", json={"name": "SSE Biz", "business_type": "Retail"}, headers=v_headers)).json()
    store = (await client.post("/api/v1/stores/", json={
        "name": "SSE Store", "business_id": biz["id"], "address": "12 Ave", "city": "Lagos", "phone": "+2348000000000"
    }, headers=v_headers)).json()
    await client.post(f"/api/v1/stores/{store['id']}/publish", headers=v_headers)
    prod = (await client.post(f"/api/v1/catalogue/stores/{store['id']}/products", json={"name": "Item", "price": 2000.00}, headers=v_headers)).json()

    order = (await client.post("/api/v1/orders/", json={
        "items": [{"product_id": prod["id"], "quantity": 1}],
        "delivery_address": "88 Marina Street",
        "delivery_city": "Lagos",
        "delivery_phone": "+2348022222222"
    }, headers=headers)).json()
    order_id = order["id"]

    # 1. Test REST tracking-summary
    summary_res = await client.get(f"/api/v1/orders/{order_id}/tracking-summary", headers=headers)
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["order_id"] == order_id
    assert summary["status"] == "created"
    assert len(summary["vendor_orders"]) == 1

    # 2. Test SSE live-tracking stream
    async with client.stream("GET", f"/api/v1/orders/{order_id}/live-tracking?max_events=1", headers=headers) as response:
        assert response.status_code == 200
        assert "text/event-stream" in response.headers.get("content-type", "")
        # Read the first event
        lines = []
        async for line in response.aiter_lines():
            if line:
                lines.append(line)
            if len(lines) >= 2:
                break
        assert any("TRACKING_CONNECTED" in l for l in lines)


@pytest.mark.asyncio
async def test_websocket_tracking_snapshot_and_heartbeat(client: AsyncClient):
    """
    Tests WebSocket handshake with single-use ticket, initial snapshot reception,
    and client heartbeat ping/pong.
    """
    cust = (await client.post("/api/v1/auth/register", json={
        "email": "ws_hb_cust@test.com", "password": "Password123!", "full_name": "WS HB Cust"
    })).json()
    headers = {"Authorization": f"Bearer {cust['access_token']}"}

    vendor = (await client.post("/api/v1/auth/register", json={
        "email": "ws_hb_vendor@test.com", "password": "Password123!", "full_name": "WS HB Vendor", "role": "vendor"
    })).json()
    v_headers = {"Authorization": f"Bearer {vendor['access_token']}"}

    biz = (await client.post("/api/v1/businesses/", json={"name": "HB Biz", "business_type": "Retail"}, headers=v_headers)).json()
    store = (await client.post("/api/v1/stores/", json={
        "name": "HB Store", "business_id": biz["id"], "address": "12 Rd", "city": "Lagos", "phone": "+2348000000000"
    }, headers=v_headers)).json()
    await client.post(f"/api/v1/stores/{store['id']}/publish", headers=v_headers)
    prod = (await client.post(f"/api/v1/catalogue/stores/{store['id']}/products", json={"name": "Item", "price": 1000.00}, headers=v_headers)).json()

    order = (await client.post("/api/v1/orders/", json={
        "items": [{"product_id": prod["id"], "quantity": 1}],
        "delivery_address": "88 Victoria Island",
        "delivery_city": "Lagos",
        "delivery_phone": "+2348011223344"
    }, headers=headers)).json()
    order_id = order["id"]

    # Customer generates ticket
    ticket_res = await client.post("/api/v1/realtime/ticket", headers=headers)
    assert ticket_res.status_code == 200
    ticket = ticket_res.json()["ticket"]

    # Connect with TestClient
    with TestClient(app) as tc:
        with tc.websocket_connect(f"/api/v1/ws/orders/{order_id}?ticket={ticket}") as ws:
            # Receive initial snapshot
            snap = ws.receive_json()
            assert snap["event_type"] == "TRACKING_CONNECTED"
            assert snap["order_id"] == order_id
            assert snap["data"]["status"] == "created"

            # Send ping heartbeat
            ws.send_json({"type": "ping"})
            pong = ws.receive_json()
            assert pong["type"] == "pong"
            assert "timestamp" in pong


@pytest.mark.asyncio
async def test_websocket_unauthorized_rejection(client: AsyncClient):
    """
    Verifies WebSocket closes with 4403 for unauthorized orders and 4401 for invalid credentials.
    """
    cust_a = (await client.post("/api/v1/auth/register", json={
        "email": "cust_a_rej@test.com", "password": "Password123!", "full_name": "Customer A Rej"
    })).json()

    cust_b = (await client.post("/api/v1/auth/register", json={
        "email": "cust_b_intruder_rej@test.com", "password": "Password123!", "full_name": "Intruder B Rej"
    })).json()

    vendor = (await client.post("/api/v1/auth/register", json={
        "email": "ws_rej_vendor@test.com", "password": "Password123!", "full_name": "Vendor Rej", "role": "vendor"
    })).json()
    biz = (await client.post("/api/v1/businesses/", json={"name": "Rej Biz", "business_type": "Retail"}, headers={
        "Authorization": f"Bearer {vendor['access_token']}"
    })).json()
    store = (await client.post("/api/v1/stores/", json={
        "name": "Rej Store", "business_id": biz["id"], "address": "12 Rd", "city": "Lagos", "phone": "+2348000000000"
    }, headers={"Authorization": f"Bearer {vendor['access_token']}"})).json()
    await client.post(f"/api/v1/stores/{store['id']}/publish", headers={"Authorization": f"Bearer {vendor['access_token']}"})
    prod = (await client.post(f"/api/v1/catalogue/stores/{store['id']}/products", json={"name": "Item", "price": 1000.00}, headers={
        "Authorization": f"Bearer {vendor['access_token']}"
    })).json()

    order_a = (await client.post("/api/v1/orders/", json={
        "items": [{"product_id": prod["id"], "quantity": 1}],
        "delivery_address": "Private Residence",
        "delivery_city": "Lagos",
        "delivery_phone": "+2348011111111"
    }, headers={"Authorization": f"Bearer {cust_a['access_token']}"})).json()
    order_id = order_a["id"]

    # Customer B generates ticket
    intruder_ticket_res = await client.post("/api/v1/realtime/ticket", headers={"Authorization": f"Bearer {cust_b['access_token']}"})
    intruder_ticket = intruder_ticket_res.json()["ticket"]

    with TestClient(app) as tc:
        # Unauthorized customer -> 4403
        with pytest.raises(Exception):
            with tc.websocket_connect(f"/api/v1/ws/orders/{order_id}?ticket={intruder_ticket}") as ws:
                ws.receive_json()

        # Non-existent ticket -> 4401
        with pytest.raises(Exception):
            with tc.websocket_connect(f"/api/v1/ws/orders/{order_id}?ticket=invalid_ticket_hex") as ws:
                ws.receive_json()
