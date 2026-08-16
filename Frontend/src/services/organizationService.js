const BASE_URL =
  import.meta.env.VITE_ORGANIZATION_SERVICE_URL ||
  import.meta.env.VITE_ORG_SERVICE_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '/api' : 'http://localhost:8002');

async function request(path, options = {}) {
  let user = null;
  try {
    const raw = localStorage.getItem('pip_auth_user');
    if (raw) user = JSON.parse(raw);
  } catch (e) {}

  const orgId = user?.organization_id || user?.organizationId || localStorage.getItem('org_id') || 'org-1001';
  const userId = user?.id || localStorage.getItem('user_id') || 'user-101';
  const userRole = user?.role || localStorage.getItem('user_role') || 'company_admin';
  const token = localStorage.getItem('pip_auth_token');

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'X-User-Id': String(userId),
    'X-Organization-Id': String(orgId),
    'X-User-Role': String(userRole),
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...defaultHeaders, ...(options.headers || {}) },
  });

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      errorMsg = data.detail || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  return res.json();
}

export const organizationService = {
  // Get all settings for organization
  getSettings: (orgId = 'org-1001') => request(`/organizations/${orgId}/settings`),

  // Get specific setting key
  getSetting: (orgId = 'org-1001', key) => request(`/organizations/${orgId}/settings/${key}`),

  // Bulk update settings
  updateSettings: (orgId = 'org-1001', settingsObj) =>
    request(`/organizations/${orgId}/settings`, {
      method: 'PUT',
      body: JSON.stringify({ settings: settingsObj }),
    }),

  // Update single setting key
  updateSingleSetting: (orgId = 'org-1001', key, value) =>
    request(`/organizations/${orgId}/settings/${key}`, {
      method: 'PATCH',
      body: JSON.stringify({ value }),
    }),
};
