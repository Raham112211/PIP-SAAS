from fastapi import status


def test_list_staff(client, seed_data):
    headers = {
        "X-User-Id": seed_data["user1_id"],
        "X-Organization-Id": seed_data["org1_id"],
        "X-User-Role": "company_admin"
    }
    response = client.get("/staff", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "items" in data
    assert data["total"] == 2
    assert len(data["items"]) == 2
    
    # Check that assigned branches are mapped
    john = next(s for s in data["items"] if s["email"] == "john.staff@acme.com")
    assert len(john["branches"]) == 1
    assert john["branches"][0]["id"] == seed_data["branch1_id"]


def test_list_staff_filters(client, seed_data):
    headers = {
        "X-User-Id": seed_data["user1_id"],
        "X-Organization-Id": seed_data["org1_id"],
        "X-User-Role": "company_admin"
    }
    # Filter by search
    response = client.get("/staff?search=John", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["email"] == "john.staff@acme.com"

    # Filter by branch
    response_branch = client.get(f"/staff?branch_id={seed_data['branch1_id']}", headers=headers)
    assert response_branch.status_code == status.HTTP_200_OK
    assert response_branch.json()["total"] == 1


def test_get_staff_details(client, seed_data):
    headers = {
        "X-User-Id": seed_data["user1_id"],
        "X-Organization-Id": seed_data["org1_id"],
        "X-User-Role": "company_admin"
    }
    response = client.get(f"/staff/{seed_data['user2_id']}", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == seed_data["user2_id"]
    assert data["email"] == "john.staff@acme.com"
    assert data["role"] == "staff"
    assert len(data["branches"]) == 1


def test_create_staff_success(client, seed_data):
    headers = {
        "X-User-Id": seed_data["user1_id"],
        "X-Organization-Id": seed_data["org1_id"],
        "X-User-Role": "company_admin"
    }
    payload = {
        "email": "sarah.finance@acme.com",
        "password": "Password123!",
        "full_name": "Sarah Finance",
        "phone": "+923009998877",
        "designation": "Accounts Executive",
        "role_id": seed_data["staff_role_id"],
        "branch_ids": [seed_data["branch1_id"], seed_data["branch2_id"]]
    }
    response = client.post("/staff", json=payload, headers=headers)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == "sarah.finance@acme.com"
    assert data["full_name"] == "Sarah Finance"
    assert len(data["branches"]) == 2


def test_create_staff_duplicate_email(client, seed_data):
    headers = {
        "X-User-Id": seed_data["user1_id"],
        "X-Organization-Id": seed_data["org1_id"],
        "X-User-Role": "company_admin"
    }
    payload = {
        "email": "john.staff@acme.com",
        "full_name": "Duplicate John"
    }
    response = client.post("/staff", json=payload, headers=headers)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already exists" in response.json()["detail"]


def test_create_staff_invalid_branch(client, seed_data):
    headers = {
        "X-User-Id": seed_data["user1_id"],
        "X-Organization-Id": seed_data["org1_id"],
        "X-User-Role": "company_admin"
    }
    # branch3_id belongs to org 2
    payload = {
        "email": "attacker@acme.com",
        "full_name": "Attacker Staff",
        "branch_ids": [seed_data["branch3_id"]]
    }
    response = client.post("/staff", json=payload, headers=headers)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Invalid branch IDs" in response.json()["detail"]


def test_update_staff_details(client, seed_data):
    headers = {
        "X-User-Id": seed_data["user1_id"],
        "X-Organization-Id": seed_data["org1_id"],
        "X-User-Role": "company_admin"
    }
    payload = {
        "full_name": "John Updated",
        "designation": "Senior Billing Lead",
        "status": "suspended"
    }
    response = client.put(f"/staff/{seed_data['user2_id']}", json=payload, headers=headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["full_name"] == "John Updated"
    assert data["designation"] == "Senior Billing Lead"
    assert data["status"] == "suspended"


def test_assign_staff_branches(client, seed_data):
    headers = {
        "X-User-Id": seed_data["user1_id"],
        "X-Organization-Id": seed_data["org1_id"],
        "X-User-Role": "company_admin"
    }
    payload = {
        "branch_ids": [seed_data["branch1_id"], seed_data["branch2_id"]]
    }
    response = client.post(f"/staff/{seed_data['user2_id']}/branches", json=payload, headers=headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["branches"]) == 2
    branch_ids = [b["id"] for b in data["branches"]]
    assert seed_data["branch1_id"] in branch_ids
    assert seed_data["branch2_id"] in branch_ids


def test_assign_staff_role(client, seed_data):
    headers = {
        "X-User-Id": seed_data["user1_id"],
        "X-Organization-Id": seed_data["org1_id"],
        "X-User-Role": "company_admin"
    }
    payload = {
        "role_id": seed_data["admin_role_id"]
    }
    response = client.post(f"/staff/{seed_data['user2_id']}/role", json=payload, headers=headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["role"] == "company_admin"
    assert data["role_id"] == seed_data["admin_role_id"]


def test_delete_staff_soft_and_hard(client, seed_data):
    headers = {
        "X-User-Id": seed_data["user1_id"],
        "X-Organization-Id": seed_data["org1_id"],
        "X-User-Role": "company_admin"
    }
    # Soft delete (deactivate)
    response_soft = client.delete(f"/staff/{seed_data['user2_id']}", headers=headers)
    assert response_soft.status_code == status.HTTP_200_OK
    
    # Verify status changed to inactive
    get_resp = client.get(f"/staff/{seed_data['user2_id']}", headers=headers)
    assert get_resp.json()["is_active"] is False
    assert get_resp.json()["status"] == "inactive"

    # Hard delete
    response_hard = client.delete(f"/staff/{seed_data['user2_id']}?hard_delete=true", headers=headers)
    assert response_hard.status_code == status.HTTP_200_OK
    
    # Verify 404 after hard delete
    get_resp_404 = client.get(f"/staff/{seed_data['user2_id']}", headers=headers)
    assert get_resp_404.status_code == status.HTTP_404_NOT_FOUND
