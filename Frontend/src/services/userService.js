const BASE_URL = import.meta.env.VITE_USER_SERVICE_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '/api' : 'http://localhost:8001');

function getAuthHeaders() {
  let user = null;
  try {
    const raw = localStorage.getItem('pip_auth_user');
    if (raw) user = JSON.parse(raw);
  } catch (e) {
    // ignore parse error
  }

  const token = localStorage.getItem('pip_auth_token');

  const headers = {
    'Content-Type': 'application/json',
  };

  if (user) {
    if (user.id) headers['X-User-Id'] = String(user.id);
    if (user.organizationId || user.organization_id) {
      headers['X-Organization-Id'] = String(user.organizationId || user.organization_id);
    } else {
      headers['X-Organization-Id'] = 'org-1001';
    }
    if (user.role) headers['X-User-Role'] = String(user.role);
  } else {
    headers['X-User-Id'] = 'user-101';
    headers['X-Organization-Id'] = 'org-1001';
    headers['X-User-Role'] = 'company_admin';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let data = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    console.error(`[API Error Details for ${endpoint}]:`, data);
    const errorMsg =
      (data && typeof data === 'object' && (data.detail || data.message || data.error)) ||
      (typeof data === 'string' && data) ||
      `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const userService = {
  // Staff Endpoints
  async getStaff(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.role_id) query.append('role_id', params.role_id);
    if (params.branch_id) query.append('branch_id', params.branch_id);
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.page) query.append('page', params.page);
    if (params.page_size) query.append('page_size', params.page_size);

    const queryString = query.toString();
    return request(`/staff${queryString ? `?${queryString}` : ''}`);
  },

  async getStaffById(staffId) {
    return request(`/staff/${staffId}`);
  },

  async createStaff(payload) {
    return request('/staff', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateStaff(staffId, payload) {
    return request(`/staff/${staffId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteStaff(staffId, hardDelete = false) {
    return request(`/staff/${staffId}?hard_delete=${hardDelete}`, {
      method: 'DELETE',
    });
  },

  async assignStaffBranches(staffId, branchIds) {
    return request(`/staff/${staffId}/branches`, {
      method: 'POST',
      body: JSON.stringify({ branch_ids: branchIds }),
    });
  },

  async assignStaffRole(staffId, roleData) {
    return request(`/staff/${staffId}/role`, {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  },

  // Role Endpoints
  async getRoles() {
    return request('/roles');
  },

  async getRoleDetails(roleId) {
    return request(`/roles/${roleId}`);
  },

  async createRole(payload) {
    return request('/roles', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateRole(roleId, payload) {
    return request(`/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteRole(roleId) {
    return request(`/roles/${roleId}`, {
      method: 'DELETE',
    });
  },

  // Permission Endpoints
  async getPermissions() {
    return request('/permissions');
  },

  async getModulePermissions() {
    return request('/permissions/modules');
  },

  async getRolePermissions(roleId) {
    return request(`/roles/${roleId}/permissions`);
  },

  async updateRolePermissions(roleId, permissionIds) {
    return request(`/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permission_ids: permissionIds }),
    });
  },
};
