from fastapi import status


def test_list_permissions(client, seed_data):
    headers = {
        "X-User-Id": seed_data["user1_id"],
        "X-Organization-Id": seed_data["org1_id"],
        "X-User-Role": "company_admin"
    }
    response = client.get("/permissions", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    perms = response.json()
    assert len(perms) >= 20
    slugs = [p["slug"] for p in perms]
    assert "staff:view" in slugs
    assert "staff:create" in slugs
    assert "roles:view" in slugs
    assert "branches:view" in slugs
    assert "bills:view" in slugs
    assert "scraper:run" in slugs


def test_list_permissions_by_module(client, seed_data):
    headers = {
        "X-User-Id": seed_data["user1_id"],
        "X-Organization-Id": seed_data["org1_id"],
        "X-User-Role": "company_admin"
    }
    response = client.get("/permissions/modules", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    modules = response.json()
    module_names = [m["module"] for m in modules]
    assert "staff" in module_names
    assert "roles" in module_names
    assert "branches" in module_names
    assert "bills" in module_names
    assert "scraper" in module_names
    assert "reports" in module_names
    assert "settings" in module_names


def test_get_role_permissions(client, seed_data):
    headers = {
        "X-User-Id": seed_data["user1_id"],
        "X-Organization-Id": seed_data["org1_id"],
        "X-User-Role": "company_admin"
    }
    response = client.get(f"/roles/{seed_data['staff_role_id']}/permissions", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    perms = response.json()
    assert len(perms) > 0
    slugs = [p["slug"] for p in perms]
    assert "bills:view" in slugs


def test_update_role_permissions_custom_role(client, seed_data):
    headers = {
        "X-User-Id": seed_data["user1_id"],
        "X-Organization-Id": seed_data["org1_id"],
        "X-User-Role": "company_admin"
    }
    # Create custom role
    create_resp = client.post(
        "/roles",
        json={"name": "Report Viewer", "slug": "report_viewer"},
        headers=headers
    )
    role_id = create_resp.json()["id"]

    # Get permission IDs
    perms_resp = client.get("/permissions", headers=headers)
    all_perms = perms_resp.json()
    report_perms = [p["id"] for p in all_perms if p["module"] == "reports"]

    # Update role permissions
    update_resp = client.put(
        f"/roles/{role_id}/permissions",
        json={"permission_ids": report_perms},
        headers=headers
    )
    assert update_resp.status_code == status.HTTP_200_OK
    updated_list = update_resp.json()
    assert len(updated_list) == len(report_perms)


def test_update_role_permissions_system_role_protected(client, seed_data):
    headers = {
        "X-User-Id": seed_data["user1_id"],
        "X-Organization-Id": seed_data["org1_id"],
        "X-User-Role": "company_admin"
    }
    response = client.put(
        f"/roles/{seed_data['admin_role_id']}/permissions",
        json={"permission_ids": []},
        headers=headers
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Company Admin" in response.json()["detail"]
