from fastapi import status


def test_list_roles(client, seed_data):
    headers = {
        "X-User-Id": seed_data["user1_id"],
        "X-Organization-Id": seed_data["org1_id"],
        "X-User-Role": "company_admin"
    }
    response = client.get("/roles", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    roles = response.json()
    assert len(roles) >= 1
    slugs = [r["slug"] for r in roles]
    assert "company_admin" in slugs
    # branch_manager removed
    assert "staff" in slugs


def test_get_role_details(client, seed_data):
    headers = {
        "X-User-Id": seed_data["user1_id"],
        "X-Organization-Id": seed_data["org1_id"],
        "X-User-Role": "company_admin"
    }
    response = client.get(f"/roles/{seed_data['admin_role_id']}", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["slug"] == "company_admin"
    assert data["is_system"] is True
    assert len(data["permissions"]) > 0


def test_create_custom_role(client, seed_data):
    headers = {
        "X-User-Id": seed_data["user1_id"],
        "X-Organization-Id": seed_data["org1_id"],
        "X-User-Role": "company_admin"
    }
    # Get some permission IDs
    perms_resp = client.get("/permissions", headers=headers)
    all_perms = perms_resp.json()
    selected_pids = [all_perms[0]["id"], all_perms[1]["id"]]

    payload = {
        "name": "Billing Supervisor",
        "slug": "billing_supervisor",
        "description": "Supervisor for billing operations",
        "permission_ids": selected_pids
    }
    response = client.post("/roles", json=payload, headers=headers)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == "Billing Supervisor"
    assert data["slug"] == "billing_supervisor"
    assert data["is_system"] is False
    assert len(data["permissions"]) == 2


def test_update_custom_role(client, seed_data):
    headers = {
        "X-User-Id": seed_data["user1_id"],
        "X-Organization-Id": seed_data["org1_id"],
        "X-User-Role": "company_admin"
    }
    # Create custom role
    create_resp = client.post(
        "/roles",
        json={"name": "Auditor", "slug": "auditor", "description": "Internal auditor"},
        headers=headers
    )
    role_id = create_resp.json()["id"]

    # Update role
    update_resp = client.put(
        f"/roles/{role_id}",
        json={"name": "Senior Auditor", "description": "Senior auditor role"},
        headers=headers
    )
    assert update_resp.status_code == status.HTTP_200_OK
    assert update_resp.json()["name"] == "Senior Auditor"


def test_system_role_modification_protected(client, seed_data):
    headers = {
        "X-User-Id": seed_data["user1_id"],
        "X-Organization-Id": seed_data["org1_id"],
        "X-User-Role": "company_admin"
    }
    response = client.put(
        f"/roles/{seed_data['admin_role_id']}",
        json={"name": "Hacked Admin"},
        headers=headers
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "cannot be modified" in response.json()["detail"]


def test_system_role_deletion_protected(client, seed_data):
    headers = {
        "X-User-Id": seed_data["user1_id"],
        "X-Organization-Id": seed_data["org1_id"],
        "X-User-Role": "company_admin"
    }
    response = client.delete(f"/roles/{seed_data['admin_role_id']}", headers=headers)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "cannot be deleted" in response.json()["detail"]


def test_delete_custom_role(client, seed_data):
    headers = {
        "X-User-Id": seed_data["user1_id"],
        "X-Organization-Id": seed_data["org1_id"],
        "X-User-Role": "company_admin"
    }
    # Create custom role
    create_resp = client.post(
        "/roles",
        json={"name": "Temp Role", "slug": "temp_role"},
        headers=headers
    )
    role_id = create_resp.json()["id"]

    # Delete custom role
    del_resp = client.delete(f"/roles/{role_id}", headers=headers)
    assert del_resp.status_code == status.HTTP_200_OK

    # Verify not found
    get_resp = client.get(f"/roles/{role_id}", headers=headers)
    assert get_resp.status_code == status.HTTP_404_NOT_FOUND
