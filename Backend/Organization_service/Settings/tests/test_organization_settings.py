import pytest
from fastapi.testclient import TestClient


def test_get_organization_settings_success(client: TestClient, seed_data: dict):
    """Test retrieving all settings for an organization."""
    org_id = seed_data["org1_id"]
    headers = {
        "X-User-Id": "user-1",
        "X-Organization-Id": org_id,
        "X-User-Role": "member"
    }
    
    response = client.get(f"/organizations/{org_id}/settings", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "settings" in data
    assert data["settings"]["timezone"] == "Asia/Karachi"
    assert data["settings"]["currency"] == "PKR"


def test_get_specific_setting_success(client: TestClient, seed_data: dict):
    """Test retrieving a specific setting by key."""
    org_id = seed_data["org1_id"]
    headers = {
        "X-User-Id": "user-1",
        "X-Organization-Id": org_id
    }
    
    response = client.get(f"/organizations/{org_id}/settings/timezone", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["key"] == "timezone"
    assert data["value"] == "Asia/Karachi"


def test_get_specific_setting_nonexistent_returns_404(client: TestClient, seed_data: dict):
    """Test 404 when setting key does not exist."""
    org_id = seed_data["org1_id"]
    headers = {
        "X-User-Id": "user-1",
        "X-Organization-Id": org_id
    }
    
    response = client.get(f"/organizations/{org_id}/settings/non_existing_key", headers=headers)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_put_bulk_settings_success(client: TestClient, seed_data: dict):
    """Test updating multiple settings (PUT) with various JSON data types."""
    org_id = seed_data["org1_id"]
    headers = {
        "X-User-Id": "user-1",
        "X-Organization-Id": org_id
    }
    
    payload = {
        "settings": {
            "timezone": "America/New_York",
            "currency": "USD",
            "date_format": "YYYY-MM-DD",
            "notifications_enabled": True,
            "max_team_size": 25,
            "metadata": {"theme": "dark", "locale": "en-US"}
        }
    }
    
    response = client.put(f"/organizations/{org_id}/settings", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Settings updated successfully"
    assert data["settings"]["timezone"] == "America/New_York"
    assert data["settings"]["currency"] == "USD"
    assert data["settings"]["date_format"] == "YYYY-MM-DD"
    assert data["settings"]["notifications_enabled"] is True
    assert data["settings"]["max_team_size"] == 25
    assert data["settings"]["metadata"] == {"theme": "dark", "locale": "en-US"}

    # Verify persistence with subsequent GET
    get_res = client.get(f"/organizations/{org_id}/settings", headers=headers)
    assert get_res.json()["settings"]["currency"] == "USD"
    assert get_res.json()["settings"]["notifications_enabled"] is True


def test_patch_single_setting_success(client: TestClient, seed_data: dict):
    """Test updating a single setting (PATCH)."""
    org_id = seed_data["org1_id"]
    headers = {
        "X-User-Id": "user-1",
        "X-Organization-Id": org_id
    }
    
    payload = {"value": "Europe/London"}
    
    response = client.patch(f"/organizations/{org_id}/settings/timezone", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Setting updated successfully"
    assert data["key"] == "timezone"
    assert data["value"] == "Europe/London"

    # Verify updated value
    get_res = client.get(f"/organizations/{org_id}/settings/timezone", headers=headers)
    assert get_res.json()["value"] == "Europe/London"


def test_bearer_token_authentication(client: TestClient, seed_data: dict):
    """Test Bearer token authentication header."""
    org_id = seed_data["org1_id"]
    headers = {
        "Authorization": f"Bearer user-1:{org_id}:admin"
    }
    response = client.get(f"/organizations/{org_id}/settings", headers=headers)
    assert response.status_code == 200
    assert "settings" in response.json()


def test_invalid_payload_validation(client: TestClient, seed_data: dict):
    """Test validation errors for invalid payload."""
    org_id = seed_data["org1_id"]
    headers = {
        "X-User-Id": "user-1",
        "X-Organization-Id": org_id
    }
    
    # Empty settings dict
    response = client.put(f"/organizations/{org_id}/settings", json={"settings": {}}, headers=headers)
    assert response.status_code == 422


def test_cross_organization_access_forbidden(client: TestClient, seed_data: dict):
    """Test 403 Forbidden when user attempts to access another organization."""
    org1_id = seed_data["org1_id"]
    org2_id = seed_data["org2_id"]
    
    # User belongs to org2, but attempts to read org1
    headers = {
        "X-User-Id": "user-2",
        "X-Organization-Id": org2_id,
        "X-User-Role": "member"
    }
    
    response = client.get(f"/organizations/{org1_id}/settings", headers=headers)
    assert response.status_code == 403
    assert "Forbidden" in response.json()["detail"]


def test_organization_not_found_returns_404(client: TestClient):
    """Test 404 Not Found when organization does not exist."""
    non_existent_org = "non-existent-org-999"
    headers = {
        "X-User-Id": "user-1",
        "X-Organization-Id": non_existent_org
    }
    
    response = client.get(f"/organizations/{non_existent_org}/settings", headers=headers)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_unauthenticated_request_returns_401(client: TestClient, seed_data: dict):
    """Test 401 Unauthorized when no auth credentials are provided."""
    org_id = seed_data["org1_id"]
    response = client.get(f"/organizations/{org_id}/settings")
    assert response.status_code == 401
