import pytest
from httpx import AsyncClient
from uuid import uuid4

@pytest.mark.asyncio
async def test_login_rate_limiting_and_ip_isolation(client: AsyncClient):
    """
    Verifies Redis-backed rate limiting on /api/v1/auth/login:
    - Enforces 5 requests per minute per IP against brute-force/credential stuffing.
    - Exceeding limit returns 429 with standard error payload and Retry-After header.
    - Requests from a different IP are not affected (IP isolation).
    """
    prefix = uuid4().int % 200
    attacker_ip = f"198.51.{prefix}.1"
    legitimate_ip = f"198.51.{prefix}.2"
    setup_ip = f"198.51.{prefix}.3"

    # Register legitimate user
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": f"target_user_{prefix}@test.com", "password": "TargetPassword123!", "full_name": "Target User"},
        headers={"X-Forwarded-For": setup_ip},
    )
    assert reg.status_code == 201

    # Attacker attempts 5 logins with wrong passwords
    for i in range(5):
        res = await client.post(
            "/api/v1/auth/login",
            data={"username": f"target_user_{prefix}@test.com", "password": f"WrongPass{i}!"},
            headers={"X-Forwarded-For": attacker_ip},
        )
        assert res.status_code == 401

    # 6th attempt from attacker MUST trigger rate limiter (HTTP 429)
    blocked_res = await client.post(
        "/api/v1/auth/login",
        data={"username": f"target_user_{prefix}@test.com", "password": "WrongPass6!"},
        headers={"X-Forwarded-For": attacker_ip},
    )
    assert blocked_res.status_code == 429
    body = blocked_res.json()
    assert body["error"]["code"] == "rate_limit_exceeded"
    assert "Rate limit exceeded" in body["error"]["message"]
    assert "retry-after" in blocked_res.headers

    # Legitimate user from different IP can still log in successfully
    legit_res = await client.post(
        "/api/v1/auth/login",
        data={"username": f"target_user_{prefix}@test.com", "password": "TargetPassword123!"},
        headers={"X-Forwarded-For": legitimate_ip},
    )
    assert legit_res.status_code == 200
    assert "access_token" in legit_res.json()


@pytest.mark.asyncio
async def test_register_rate_limiting(client: AsyncClient):
    """
    Verifies that /api/v1/auth/register throttles bot registration spam (10 per minute per IP).
    """
    prefix = uuid4().int % 200
    client_ip = f"198.51.{prefix}.10"

    # 10 registrations from the same IP
    for i in range(10):
        res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": f"bot_user_{prefix}_{i}@test.com",
                "password": "Password123!",
                "full_name": f"Bot User {i}",
            },
            headers={"X-Forwarded-For": client_ip},
        )
        assert res.status_code == 201

    # 11th registration from same IP must be blocked
    throttled = await client.post(
        "/api/v1/auth/register",
        json={
            "email": f"bot_user_{prefix}_11@test.com",
            "password": "Password123!",
            "full_name": "Bot User 11",
        },
        headers={"X-Forwarded-For": client_ip},
    )
    assert throttled.status_code == 429
    assert throttled.json()["error"]["code"] == "rate_limit_exceeded"


@pytest.mark.asyncio
async def test_delivery_verification_code_throttling(client: AsyncClient):
    """
    Verifies brute-force protection on /api/v1/dispatch/tasks/{task_id}/verify-delivery:
    - 5 verification attempts per minute limit
    - Prevents automated 6-digit OTP guessing attacks.
    """
    prefix = uuid4().int % 200
    ip_setup = f"198.51.{prefix}.30"
    rider_ip = f"198.51.{prefix}.31"

    # Register admin, customer, vendor, rider
    admin = (await client.post("/api/v1/auth/register", json={
        "email": f"admin_rl_{prefix}@test.com", "password": "Password123!", "full_name": "Admin RL", "role": "admin",
        "admin_secret": "settlecart-admin-secret"
    }, headers={"X-Forwarded-For": ip_setup})).json()

    vendor = (await client.post("/api/v1/auth/register", json={
        "email": f"vendor_rl_{prefix}@test.com", "password": "Password123!", "full_name": "Vendor RL", "role": "vendor"
    }, headers={"X-Forwarded-For": ip_setup})).json()

    rider = (await client.post("/api/v1/auth/register", json={
        "email": f"rider_rl_{prefix}@test.com", "password": "Password123!", "full_name": "Rider RL", "role": "dispatch"
    }, headers={"X-Forwarded-For": ip_setup})).json()

    cust = (await client.post("/api/v1/auth/register", json={
        "email": f"cust_rl_{prefix}@test.com", "password": "Password123!", "full_name": "Customer RL", "role": "customer"
    }, headers={"X-Forwarded-For": ip_setup})).json()

    # Vendor creates store and product
    biz = (await client.post("/api/v1/businesses/", json={"name": f"RL Biz {prefix}", "business_type": "Retail"}, headers={
        "Authorization": f"Bearer {vendor['access_token']}", "X-Forwarded-For": ip_setup
    })).json()

    store = (await client.post("/api/v1/stores/", json={
        "name": f"RL Store {prefix}",
        "business_id": biz["id"],
        "address": "12 RL St",
        "city": "Lagos",
        "phone": "+2348011223344"
    }, headers={"Authorization": f"Bearer {vendor['access_token']}", "X-Forwarded-For": ip_setup})).json()

    # Publish store
    await client.post(f"/api/v1/stores/{store['id']}/publish", headers={
        "Authorization": f"Bearer {vendor['access_token']}", "X-Forwarded-For": ip_setup
    })

    prod = (await client.post(f"/api/v1/catalogue/stores/{store['id']}/products", json={
        "name": "RL Item", "price": 4000.00
    }, headers={"Authorization": f"Bearer {vendor['access_token']}", "X-Forwarded-For": ip_setup})).json()

    # Customer places order
    order_res = await client.post("/api/v1/orders/", json={
        "items": [{"product_id": prod["id"], "quantity": 1}],
        "delivery_address": "10 Rate Limit Ave",
        "delivery_city": "Lagos",
        "delivery_phone": "+2348000000000"
    }, headers={"Authorization": f"Bearer {cust['access_token']}", "X-Forwarded-For": ip_setup})
    assert order_res.status_code == 201
    order = order_res.json()

    vendor_order_id = order["vendor_orders"][0]["id"]

    # Dispatch task created and assigned
    task = (await client.post(f"/api/v1/dispatch/tasks/from-vendor-order/{vendor_order_id}", headers={
        "Authorization": f"Bearer {vendor['access_token']}", "X-Forwarded-For": ip_setup
    })).json()
    task_id = task["id"]

    rider_me = (await client.get("/api/v1/users/me", headers={
        "Authorization": f"Bearer {rider['access_token']}", "X-Forwarded-For": ip_setup
    })).json()
    rider_id = rider_me["id"]

    await client.post(f"/api/v1/dispatch/tasks/{task_id}/assign", json={"rider_id": rider_id}, headers={
        "Authorization": f"Bearer {admin['access_token']}", "X-Forwarded-For": ip_setup
    })
    await client.post(f"/api/v1/dispatch/tasks/{task_id}/accept", headers={
        "Authorization": f"Bearer {rider['access_token']}", "X-Forwarded-For": ip_setup
    })
    await client.post(f"/api/v1/dispatch/tasks/{task_id}/pickup", headers={
        "Authorization": f"Bearer {rider['access_token']}", "X-Forwarded-For": ip_setup
    })
    await client.post(f"/api/v1/dispatch/tasks/{task_id}/start", headers={
        "Authorization": f"Bearer {rider['access_token']}", "X-Forwarded-For": ip_setup
    })

    # Rider attempts 5 wrong OTP codes
    rider_auth = {"Authorization": f"Bearer {rider['access_token']}", "X-Forwarded-For": rider_ip}
    for code in ["111111", "222222", "333333", "444444", "555555"]:
        res = await client.post(
            f"/api/v1/dispatch/tasks/{task_id}/verify-delivery",
            json={"code": code},
            headers=rider_auth,
        )
        assert res.status_code in (400, 403)


    # 6th attempt from rider IP must be throttled (HTTP 429)
    throttled_otp = await client.post(
        f"/api/v1/dispatch/tasks/{task_id}/verify-delivery",
        json={"code": "666666"},
        headers=rider_auth,
    )
    assert throttled_otp.status_code == 429
    assert throttled_otp.json()["error"]["code"] == "rate_limit_exceeded"
    assert "retry-after" in throttled_otp.headers


@pytest.mark.asyncio
async def test_payment_initialize_rate_limiting(client: AsyncClient):
    """
    Verifies that /api/v1/payments/initialize throttles rapid automated checkouts (10 per minute per IP).
    """
    prefix = uuid4().int % 200
    ip_setup = f"198.51.{prefix}.40"
    client_ip = f"198.51.{prefix}.41"

    # Register user
    cust = (await client.post("/api/v1/auth/register", json={
        "email": f"pay_rate_user_{prefix}@test.com", "password": "Password123!", "full_name": "Pay Rate User"
    }, headers={"X-Forwarded-For": ip_setup})).json()

    # Create dummy order id
    dummy_order_id = str(uuid4())

    # Make 10 payment init attempts
    for _ in range(10):
        res = await client.post(
            "/api/v1/payments/initialize",
            json={"order_id": dummy_order_id, "callback_url": "https://example.com/cb"},
            headers={"Authorization": f"Bearer {cust['access_token']}", "X-Forwarded-For": client_ip},
        )
        # Order doesn't exist so it returns 404, but it counted against rate limit
        assert res.status_code == 404

    # 11th payment initialization attempt must trigger 429
    throttled = await client.post(
        "/api/v1/payments/initialize",
        json={"order_id": dummy_order_id, "callback_url": "https://example.com/cb"},
        headers={"Authorization": f"Bearer {cust['access_token']}", "X-Forwarded-For": client_ip},
    )
    assert throttled.status_code == 429
    assert throttled.json()["error"]["code"] == "rate_limit_exceeded"
