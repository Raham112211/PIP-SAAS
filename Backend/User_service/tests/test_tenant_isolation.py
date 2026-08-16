from fastapi import status
from app.core.security import create_access_token


def test_cross_organization_staff_view_forbidden(client, seed_data):
    # Org 2 user attempts to access Org 1 staff member
    headers_org2 = {
        "X-User-Id": seed_data["user3_id"],
        "X-Organization-Id": seed_data["org2_id"],
        "X-User-Role": "company_admin"
    }
    response = client.get(f"/staff/{seed_data['user2_id']}", headers=headers_org2)
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_cross_organization_staff_update_forbidden(client, seed_data):
    # Org 2 user attempts to update Org 1 staff member
    headers_org2 = {
        "X-User-Id": seed_data["user3_id"],
        "X-Organization-Id": seed_data["org2_id"],
        "X-User-Role": "company_admin"
    }
    payload = {"full_name": "Hacked Name"}
    response = client.put(f"/staff/{seed_data['user2_id']}", json=payload, headers=headers_org2)
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_cross_organization_custom_role_isolation(client, seed_data):
    # Org 1 creates custom role
    headers_org1 = {
        "X-User-Id": seed_data["user1_id"],
        "X-Organization-Id": seed_data["org1_id"],
        "X-User-Role": "company_admin"
    }
    create_resp = client.post(
        "/roles",
        json={"name": "Org 1 Secret Role", "slug": "org1_secret_role"},
        headers=headers_org1
    )
    org1_role_id = create_resp.json()["id"]

    # Org 2 lists roles - should NOT include org1_secret_role
    headers_org2 = {
        "X-User-Id": seed_data["user3_id"],
        "X-Organization-Id": seed_data["org2_id"],
        "X-User-Role": "company_admin"
    }
    org2_roles_resp = client.get("/roles", headers=headers_org2)
    org2_slugs = [r["slug"] for r in org2_roles_resp.json()]
    assert "org1_secret_role" not in org2_slugs

    # Org 2 attempts to get Org 1 custom role details directly - should return 404
    direct_get_resp = client.get(f"/roles/{org1_role_id}", headers=headers_org2)
    assert direct_get_resp.status_code == status.HTTP_404_NOT_FOUND


def test_unauthenticated_request_rejected(client, seed_data):
    # No headers provided
    response = client.get("/staff")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_bearer_jwt_auth_supported(client, seed_data):
    token = create_access_token(
        subject=seed_data["user1_id"],
        org_id=seed_data["org1_id"],
        role="company_admin"
    )
    headers = {
        "Authorization": f"Bearer {token}"
    }
    response = client.get("/staff", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["total"] == 2
