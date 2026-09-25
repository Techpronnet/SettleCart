import pytest
from httpx import AsyncClient
from app.models.enums import UserRole

@pytest.mark.asyncio
async def test_security_headers_present(client: AsyncClient):
    """Verifies that security headers are injected into HTTP responses."""
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "DENY"
    assert response.headers.get("x-xss-protection") == "1; mode=block"
    assert "max-age=31536000" in response.headers.get("strict-transport-security", "")
    assert response.headers.get("referrer-policy") == "strict-origin-when-cross-origin"

@pytest.mark.asyncio
async def test_password_complexity_enforcement(client: AsyncClient):
    """Ensures weak passwords fail validation with standard error response."""
    # 1. Too short (< 8 chars)
    short_res = await client.post("/api/v1/auth/register", json={
        "email": "short@test.com",
        "password": "p1a",
        "full_name": "Short Pwd"
    })
    assert short_res.status_code == 422
    assert short_res.json()["error"]["code"] == "validation_error"

    # 2. No digits
    no_num_res = await client.post("/api/v1/auth/register", json={
        "email": "nonum@test.com",
        "password": "PasswordOnly",
        "full_name": "No Num"
    })
    assert no_num_res.status_code == 422
    assert "numerical digit" in str(no_num_res.json())

    # 3. No letters
    no_alpha_res = await client.post("/api/v1/auth/register", json={
        "email": "noalpha@test.com",
        "password": "1234567890",
        "full_name": "No Alpha"
    })
    assert no_alpha_res.status_code == 422
    assert "alphabetical character" in str(no_alpha_res.json())

    # 4. Valid password
    valid_res = await client.post("/api/v1/auth/register", json={
        "email": "valid@test.com",
        "password": "ValidPassword123!",
        "full_name": "Valid User"
    })
    assert valid_res.status_code == 201

@pytest.mark.asyncio
async def test_admin_registration_lockdown(client: AsyncClient):
    """Ensures unauthorized users cannot register as admin once an admin exists."""
    # 1. First admin registration (bootstrap) succeeds
    first_admin = await client.post("/api/v1/auth/register", json={
        "email": "admin1@test.com",
        "password": "Password123!",
        "full_name": "Initial Admin",
        "role": "admin"
    })
    assert first_admin.status_code == 201
    admin_token = first_admin.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Public attempt to register second admin without key fails with 403
    rogue_admin = await client.post("/api/v1/auth/register", json={
        "email": "hacker_admin@test.com",
        "password": "Password123!",
        "full_name": "Rogue Admin",
        "role": "admin"
    })
    assert rogue_admin.status_code == 403
    assert rogue_admin.json()["error"]["code"] == "forbidden"
    assert "Public administrator registration is disabled" in rogue_admin.json()["error"]["message"]

    # 3. Attempt with wrong secret fails
    wrong_key_admin = await client.post("/api/v1/auth/register", json={
        "email": "wrong_key@test.com",
        "password": "Password123!",
        "full_name": "Wrong Key Admin",
        "role": "admin",
        "admin_secret": "incorrect-secret"
    })
    assert wrong_key_admin.status_code == 403

    # 4. Attempt with valid secret succeeds
    valid_key_admin = await client.post("/api/v1/auth/register", json={
        "email": "admin2@test.com",
        "password": "Password123!",
        "full_name": "Second Admin",
        "role": "admin",
        "admin_secret": "settlecart-admin-secret"
    })
    assert valid_key_admin.status_code == 201

    # 5. Admin creating another admin via authenticated /api/v1/admin/users succeeds
    admin_created = await client.post("/api/v1/admin/users", json={
        "email": "admin3@test.com",
        "password": "Password123!",
        "full_name": "Third Admin",
        "role": "admin"
    }, headers=admin_headers)
    assert admin_created.status_code == 201
    assert admin_created.json()["email"] == "admin3@test.com"

@pytest.mark.asyncio
async def test_token_type_enforcement(client: AsyncClient):
    """Ensures access tokens cannot be used as refresh tokens and vice versa."""
    # Register user
    reg = await client.post("/api/v1/auth/register", json={
        "email": "tokentest@test.com",
        "password": "Password123!",
        "full_name": "Token Tester"
    })
    assert reg.status_code == 201
    tokens = reg.json()
    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]

    # 1. Attempt to use refresh token in an authenticated endpoint (e.g. GET /auth/me)
    refresh_as_bearer = await client.get("/api/v1/auth/me", headers={
        "Authorization": f"Bearer {refresh_token}"
    })
    assert refresh_as_bearer.status_code == 401
    assert "expected access token" in refresh_as_bearer.json()["error"]["message"]

    # 2. Attempt to use access token on POST /auth/refresh
    access_on_refresh = await client.post("/api/v1/auth/refresh", json={
        "refresh_token": access_token
    })
    assert access_on_refresh.status_code == 401
    assert "expected refresh token" in access_on_refresh.json()["error"]["message"]

    # 3. Legitimate refresh succeeds
    valid_refresh = await client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token
    })
    assert valid_refresh.status_code == 200
    assert "access_token" in valid_refresh.json()

@pytest.mark.asyncio
async def test_role_and_tenant_authorization(client: AsyncClient):
    """Ensures customers cannot access restricted admin endpoints."""
    # Register customer
    cust_res = await client.post("/api/v1/auth/register", json={
        "email": "regular_customer@test.com",
        "password": "Password123!",
        "full_name": "Regular Customer",
        "role": "customer"
    })
    cust_token = cust_res.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # Attempt to view admin dashboard
    dash_res = await client.get("/api/v1/admin/dashboard", headers=cust_headers)
    assert dash_res.status_code == 403
    assert dash_res.json()["error"]["code"] == "forbidden"

