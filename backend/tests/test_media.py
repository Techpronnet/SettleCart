import pytest
from httpx import AsyncClient
import io

@pytest.mark.asyncio
async def test_general_image_upload_and_validation(client: AsyncClient):
    """Tests general image upload, file format enforcement, and presigned signatures."""
    # Register user
    reg = await client.post("/api/v1/auth/register", json={
        "email": "media_user@test.com",
        "password": "Password123!",
        "full_name": "Media User"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Valid PNG upload
    fake_png = io.BytesIO(b"\x89PNG\r\n\x1a\n" + b"\x00" * 200)
    res = await client.post(
        "/api/v1/media/upload/image",
        files={"file": ("test_avatar.png", fake_png, "image/png")},
        headers=headers,
    )
    assert res.status_code == 201
    data = res.json()
    assert "secure_url" in data
    assert "public_id" in data
    assert data["resource_type"] == "image"

    # 2. Invalid file type rejection (e.g. text/plain)
    fake_txt = io.BytesIO(b"Hello world this is not an image")
    bad_res = await client.post(
        "/api/v1/media/upload/image",
        files={"file": ("notes.txt", fake_txt, "text/plain")},
        headers=headers,
    )
    assert bad_res.status_code == 400
    assert "Unsupported image format" in bad_res.json()["error"]["message"]

    # 3. Presigned upload signature generation
    sig_res = await client.post(
        "/api/v1/media/presigned-signature",
        json={"folder": "settlecart/direct", "resource_type": "image"},
        headers=headers,
    )
    assert sig_res.status_code == 200
    sig_data = sig_res.json()
    assert "signature" in sig_data
    assert "timestamp" in sig_data
    assert "upload_url" in sig_data


@pytest.mark.asyncio
async def test_store_branding_and_product_media(client: AsyncClient):
    """Tests store logo, storefront banner, and product catalog image uploads with tenant authorization."""
    # 1. Vendor A
    vendor_a_res = await client.post("/api/v1/auth/register", json={
        "email": "vendor_media_a@test.com", "password": "Password123!", "full_name": "Vendor A", "role": "vendor"
    })
    token_a = vendor_a_res.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 2. Vendor B (Intruder)
    vendor_b_res = await client.post("/api/v1/auth/register", json={
        "email": "vendor_media_b@test.com", "password": "Password123!", "full_name": "Vendor B", "role": "vendor"
    })
    token_b = vendor_b_res.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Vendor A creates Business & Store
    biz = await client.post("/api/v1/businesses/", json={"name": "Branded Electronics", "business_type": "Retail"}, headers=headers_a)
    store = await client.post("/api/v1/stores/", json={"name": "Branded Store Ikeja", "business_id": biz.json()["id"]}, headers=headers_a)
    store_id = store.json()["id"]

    # Vendor A creates Product
    prod = await client.post(f"/api/v1/catalogue/stores/{store_id}/products", json={
        "name": "Wireless Headset", "price": 15000.00
    }, headers=headers_a)
    prod_id = prod.json()["id"]

    # 3. Upload Store Logo
    fake_logo = io.BytesIO(b"\xff\xd8\xff\xe0" + b"\x00" * 300)
    logo_res = await client.post(
        f"/api/v1/media/upload/store/{store_id}/logo",
        files={"file": ("logo.jpg", fake_logo, "image/jpeg")},
        headers=headers_a,
    )
    assert logo_res.status_code == 201
    assert "logo_url" in logo_res.json()
    assert logo_res.json()["logo_url"] is not None

    # 4. Upload Store Banner
    fake_banner = io.BytesIO(b"\x89PNG\r\n\x1a\n" + b"\x00" * 400)
    banner_res = await client.post(
        f"/api/v1/media/upload/store/{store_id}/banner",
        files={"file": ("banner.png", fake_banner, "image/png")},
        headers=headers_a,
    )
    assert banner_res.status_code == 201
    assert banner_res.json()["banner_url"] is not None

    # 5. Intruder Vendor B cannot modify Vendor A's store logo
    forbidden_logo = await client.post(
        f"/api/v1/media/upload/store/{store_id}/logo",
        files={"file": ("hacked.jpg", io.BytesIO(b"\xff\xd8\xff\xe0"), "image/jpeg")},
        headers=headers_b,
    )
    assert forbidden_logo.status_code == 403

    # 6. Upload Product Picture
    fake_prod_img = io.BytesIO(b"\x89PNG\r\n\x1a\n" + b"\x00" * 500)
    prod_img_res = await client.post(
        f"/api/v1/media/upload/product/{prod_id}/image",
        files={"file": ("headset.png", fake_prod_img, "image/png")},
        headers=headers_a,
    )
    assert prod_img_res.status_code == 201
    updated_prod = prod_img_res.json()
    assert len(updated_prod["images"]) == 1
    assert "headset.png" in updated_prod["images"][0] or "products" in updated_prod["images"][0]


@pytest.mark.asyncio
async def test_kyc_document_private_storage_and_signed_urls(client: AsyncClient):
    """
    Verifies secure handling of confidential KYC documents:
    - Direct upload of Government ID and CAC Certificate
    - Strict access control for time-limited signed delivery URLs (Owner and Admin only).
    """
    # 1. Admin
    admin_res = await client.post("/api/v1/auth/register", json={
        "email": "kyc_admin@test.com", "password": "Password123!", "full_name": "Compliance Admin", "role": "admin"
    })
    admin_token = admin_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Business Owner
    owner_res = await client.post("/api/v1/auth/register", json={
        "email": "kyc_owner@test.com", "password": "Password123!", "full_name": "Business Owner", "role": "vendor"
    })
    owner_token = owner_res.json()["access_token"]
    owner_headers = {"Authorization": f"Bearer {owner_token}"}

    # 3. Third-party customer (unauthorized)
    cust_res = await client.post("/api/v1/auth/register", json={
        "email": "kyc_curious@test.com", "password": "Password123!", "full_name": "Curious Customer", "role": "customer"
    })
    cust_token = cust_res.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # Owner creates business
    biz_res = await client.post("/api/v1/businesses/", json={
        "name": "Lekki Gadgets Ltd", "business_type": "Wholesale"
    }, headers=owner_headers)
    biz_id = biz_res.json()["id"]

    # 4. Upload Government ID (PDF)
    fake_id_pdf = io.BytesIO(b"%PDF-1.5\n%fake government id content\n%%EOF")
    id_res = await client.post(
        f"/api/v1/media/upload/kyc/{biz_id}",
        data={"document_type": "government_id"},
        files={"file": ("nin_slip.pdf", fake_id_pdf, "application/pdf")},
        headers=owner_headers,
    )
    assert id_res.status_code == 201
    assert id_res.json()["document_type"] == "government_id"

    # 5. Upload CAC Certificate (JPG)
    fake_cac_jpg = io.BytesIO(b"\xff\xd8\xff\xe0" + b"\x00" * 300)
    cac_res = await client.post(
        f"/api/v1/media/upload/kyc/{biz_id}",
        data={"document_type": "cac_certificate"},
        files={"file": ("cac_cert.jpg", fake_cac_jpg, "image/jpeg")},
        headers=owner_headers,
    )
    assert cac_res.status_code == 201
    assert cac_res.json()["document_type"] == "cac_certificate"

    # Verify business record updated
    biz_check = (await client.get(f"/api/v1/businesses/{biz_id}", headers=owner_headers)).json()
    assert biz_check["government_id_url"] is not None
    assert biz_check["cac_document_url"] is not None

    # 6. Request signed preview URL as Business Owner -> Allowed
    owner_signed_url = await client.get(
        f"/api/v1/media/kyc/{biz_id}/government_id/signed-url",
        headers=owner_headers,
    )
    assert owner_signed_url.status_code == 200
    assert "signed_url" in owner_signed_url.json()

    # 7. Request signed preview URL as Admin -> Allowed
    admin_signed_url = await client.get(
        f"/api/v1/media/kyc/{biz_id}/cac_certificate/signed-url",
        headers=admin_headers,
    )
    assert admin_signed_url.status_code == 200
    assert "signed_url" in admin_signed_url.json()

    # 8. Request signed preview URL as Unauthorized Customer -> Forbidden (403)
    forbidden_signed_url = await client.get(
        f"/api/v1/media/kyc/{biz_id}/government_id/signed-url",
        headers=cust_headers,
    )
    assert forbidden_signed_url.status_code == 403

