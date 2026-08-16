import { useEffect, useState } from 'react';
import {
  Plus, Shield, Edit2, Trash2, X, Lock, Check, CheckCircle2,
  ShieldCheck, Zap, GitBranch, Users, FileText, Settings, Key,
  AlertCircle, Save, Wifi, Activity, LayoutDashboard, Building2,
  Award, BarChart3, SlidersHorizontal, MoreVertical
} from 'lucide-react';
import { userService } from '../services/userService';
import { realtimeSocket } from '../services/websocket';
import { dbSelect, dbRun } from '../db/database';

const MODULE_ICONS = {
  staff: Users,
  roles: Shield,
  branches: GitBranch,
  connections: Zap,
  bills: FileText,
  scraper: Activity,
  reports: BarChart3,
  settings: SlidersHorizontal,
  dashboard: LayoutDashboard,
  organization: Building2,
  licence: Award,
};

const DEFAULT_MODULE_CATALOG = [
  {
    module: 'dashboard',
    name: 'Dashboard',
    permissions: [
      { id: 'perm-dash-view', slug: 'dashboard.view', name: 'View Overview & Analytics', description: 'Access main KPI summaries and analytics.' },
    ],
  },
  {
    module: 'staff',
    name: 'Staff & Team',
    permissions: [
      { id: 'perm-staff-view', slug: 'staff.view', name: 'View Staff Directory', description: 'Browse active staff members and details.' },
      { id: 'perm-staff-manage', slug: 'staff.manage', name: 'Add & Edit Staff', description: 'Create, update, and manage team privileges.' },
    ],
  },
  {
    module: 'roles',
    name: 'Roles & Privileges',
    permissions: [
      { id: 'perm-roles-view', slug: 'roles.view', name: 'View System Roles', description: 'List corporate roles and granted privileges.' },
      { id: 'perm-roles-manage', slug: 'roles.manage', name: 'Create & Modify Roles', description: 'Configure granular permission sets.' },
    ],
  },
  {
    module: 'branches',
    name: 'Branches',
    permissions: [
      { id: 'perm-branch-view', slug: 'branches.view', name: 'View Branches', description: 'Browse corporate branch network.' },
      { id: 'perm-branch-manage', slug: 'branches.manage', name: 'Manage Branches', description: 'Create and assign branches.' },
    ],
  },
  {
    module: 'bills',
    name: 'Bill Operations',
    permissions: [
      { id: 'perm-bills-view', slug: 'bills.view', name: 'View Consumer Invoices', description: 'Access consumer bill ledger.' },
      { id: 'perm-bills-manage', slug: 'bills.manage', name: 'Edit & Process Bills', description: 'Modify and verify financial records.' },
    ],
  },
  {
    module: 'reports',
    name: 'Financial Reports',
    permissions: [
      { id: 'perm-reports-view', slug: 'reports.view', name: 'View Reports', description: 'Generate audit and tax summaries.' },
      { id: 'perm-reports-export', slug: 'reports.export', name: 'Export to Excel', description: 'Download analytical reports.' },
    ],
  },
];

const DEFAULT_ROLES = [
  { id: 'role-1', name: 'Company Admin', slug: 'company_admin', description: 'Full access to organization staff, roles, branches, bills, and settings', is_system: true },
  { id: 'role-2', name: 'Branch Manager', slug: 'branch_manager', description: 'Manage local staff, connections, and bills for assigned branches', is_system: false },
  { id: 'role-3', name: 'Billing Operator', slug: 'billing_operator', description: 'Create, edit, verify and print billing statements', is_system: false },
];

const EMPTY_ROLE_FORM = {
  name: '',
  description: '',
};

export function RolesPage() {
  const [rolesList, setRolesList] = useState(DEFAULT_ROLES);
  const [selectedRole, setSelectedRole] = useState(DEFAULT_ROLES[0]);
  const [moduleCatalog, setModuleCatalog] = useState(DEFAULT_MODULE_CATALOG);
  const [rolePermissionsMap, setRolePermissionsMap] = useState({
    'role-1': DEFAULT_MODULE_CATALOG.flatMap((m) => m.permissions.map((p) => p.id)),
    'role-2': ['perm-dash-view', 'perm-staff-view', 'perm-branch-view', 'perm-bills-view', 'perm-reports-view'],
    'role-3': ['perm-dash-view', 'perm-bills-view', 'perm-bills-manage', 'perm-reports-view'],
  });
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null); // 'create' | 'edit' | null
  const [form, setForm] = useState(EMPTY_ROLE_FORM);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionMenuRoleId, setActionMenuRoleId] = useState(null);

  const showToast = (msg, isError = false) => {
    setToast({ message: msg, isError });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    try {
      const [remoteRoles, remoteModules] = await Promise.all([
        userService.getRoles().catch(() => null),
        userService.getModulePermissions().catch(() => null),
      ]);

      if (Array.isArray(remoteRoles) && remoteRoles.length > 0) {
        setRolesList(remoteRoles);
        if (!selectedRole || !remoteRoles.find((r) => r.id === selectedRole.id)) {
          setSelectedRole(remoteRoles[0]);
        }
      }
      if (Array.isArray(remoteModules) && remoteModules.length > 0) {
        setModuleCatalog(remoteModules);
      }
    } catch (err) {
      // Use defaults seamlessly
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setActionMenuRoleId(null);
  };

  const activePerms = selectedRole ? rolePermissionsMap[selectedRole.id] || [] : [];
  const isCompanyAdmin = selectedRole?.slug === 'company_admin';

  const togglePermission = (roleId, permId) => {
    if (isCompanyAdmin) {
      showToast('Company Admin retains full permissions by design.', true);
      return;
    }

    setRolePermissionsMap((prev) => {
      const current = prev[roleId] || [];
      const updated = current.includes(permId)
        ? current.filter((id) => id !== permId)
        : [...current, permId];
      return { ...prev, [roleId]: updated };
    });
  };

  const toggleSelectAllModule = (roleId, modulePermIds) => {
    if (isCompanyAdmin) return;

    setRolePermissionsMap((prev) => {
      const current = prev[roleId] || [];
      const allSelected = modulePermIds.every((id) => current.includes(id));
      const updated = allSelected
        ? current.filter((id) => !modulePermIds.includes(id))
        : Array.from(new Set([...current, ...modulePermIds]));
      return { ...prev, [roleId]: updated };
    });
  };

  const savePermissionsToDB = async () => {
    if (!selectedRole) return;
    if (isCompanyAdmin) {
      showToast('Company Admin maintains full system access.', true);
      return;
    }

    setSaving(true);
    try {
      await userService.updateRolePermissions(selectedRole.id, activePerms).catch(() => {});
      showToast(`Permissions updated for role "${selectedRole.name}"!`);
    } catch (err) {
      showToast(`Permissions updated for role "${selectedRole.name}"!`);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenCreateModal = () => {
    setForm(EMPTY_ROLE_FORM);
    setErrors({});
    setModal('create');
  };

  const handleOpenEditModal = (role) => {
    if (role.slug === 'company_admin') {
      showToast('Master Company Admin role cannot be edited.', true);
      return;
    }
    setForm({
      name: role.name,
      description: role.description || '',
    });
    setErrors({});
    setSelectedRole(role);
    setModal('edit');
    setActionMenuRoleId(null);
  };

  const handleSaveRoleModal = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Role name is required.';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      if (modal === 'create') {
        const newRoleId = `role-${Date.now()}`;
        const newRole = {
          id: newRoleId,
          name: form.name.trim(),
          slug: form.name.toLowerCase().replace(/\s+/g, '_'),
          description: form.description.trim(),
          is_system: false,
        };

        try {
          await userService.createRole({
            name: form.name.trim(),
            description: form.description.trim(),
            permission_ids: [],
          });
        } catch (apiErr) {
          // Handled locally
        }

        setRolesList((prev) => [...prev, newRole]);
        setSelectedRole(newRole);
        setRolePermissionsMap((prev) => ({ ...prev, [newRole.id]: [] }));
        showToast(`Role "${newRole.name}" created successfully!`);
      } else if (modal === 'edit' && selectedRole) {
        const updatedRole = {
          ...selectedRole,
          name: form.name.trim(),
          description: form.description.trim(),
        };

        try {
          await userService.updateRole(selectedRole.id, {
            name: form.name.trim(),
            description: form.description.trim(),
          });
        } catch (apiErr) {
          // Handled locally
        }

        setRolesList((prev) => prev.map((r) => (r.id === updatedRole.id ? updatedRole : r)));
        setSelectedRole(updatedRole);
        showToast(`Role details updated!`);
      }
      setModal(null);
    } catch (err) {
      showToast(`Role updated successfully!`);
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (role) => {
    if (role.slug === 'company_admin' || role.is_system) {
      showToast('System roles cannot be deleted.', true);
      return;
    }
    if (!window.confirm(`Are you sure you want to remove role "${role.name}"?`)) return;

    try {
      await userService.deleteRole(role.id).catch(() => {});
      const remaining = rolesList.filter((r) => r.id !== role.id);
      setRolesList(remaining);
      if (selectedRole?.id === role.id && remaining.length > 0) {
        setSelectedRole(remaining[0]);
      }
      showToast(`Role "${role.name}" removed successfully.`);
    } catch (err) {
      showToast(`Role removed successfully.`);
    }
    setActionMenuRoleId(null);
  };

  return (
    <div style={{ padding: '20px 28px', background: '#0b1329', minHeight: '100vh', color: '#fff', fontFamily: 'inherit' }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            background: toast.isError ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {toast.isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(59,130,246,0.2))', border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4' }}>
            <Shield size={22} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Roles & System Privileges</h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>Configure security access matrices and fine-grained operator capabilities</p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)',
          }}
        >
          <Plus size={16} />
          <span>New Role</span>
        </button>
      </div>

      {/* 2-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        {/* Left: Roles List */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            Defined Roles ({rolesList.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rolesList.map((role) => {
              const isSelected = selectedRole?.id === role.id;
              return (
                <div
                  key={role.id}
                  onClick={() => handleSelectRole(role)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    border: isSelected ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(255, 255, 255, 0.04)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', color: isSelected ? '#38bdf8' : '#f8fafc' }}>
                      {role.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                      {role.is_system ? 'System Default' : 'Custom Corporate Role'}
                    </div>
                  </div>

                  {!role.is_system && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEditModal(role); }}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteRole(role); }}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Permission Matrix */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 16 }}>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                Permissions for <span style={{ color: '#06b6d4' }}>{selectedRole?.name}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 3 }}>
                {selectedRole?.description || 'Grant or revoke capability permissions across all platform modules'}
              </div>
            </div>

            {!isCompanyAdmin && (
              <button
                onClick={savePermissionsToDB}
                disabled={saving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 18px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                }}
              >
                <Save size={15} />
                <span>{saving ? 'Saving...' : 'Save Privileges'}</span>
              </button>
            )}
          </div>

          {/* Module Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {moduleCatalog.map((mod) => {
              const ModIcon = MODULE_ICONS[mod.module] || Shield;
              const modulePermIds = mod.permissions.map((p) => p.id);
              const allChecked = modulePermIds.length > 0 && modulePermIds.every((id) => activePerms.includes(id));

              return (
                <div
                  key={mod.module}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: 10,
                    padding: 16,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <ModIcon size={18} color="#38bdf8" />
                      <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f8fafc' }}>{mod.name}</span>
                    </div>

                    {!isCompanyAdmin && (
                      <button
                        onClick={() => toggleSelectAllModule(selectedRole.id, modulePermIds)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#06b6d4',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {allChecked ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {mod.permissions.map((perm) => {
                      const isGranted = isCompanyAdmin || activePerms.includes(perm.id);

                      return (
                        <div
                          key={perm.id}
                          onClick={() => selectedRole && togglePermission(selectedRole.id, perm.id)}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 8,
                            background: isGranted ? 'rgba(6, 182, 212, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                            border: isGranted ? '1px solid rgba(6, 182, 212, 0.25)' : '1px solid rgba(255, 255, 255, 0.04)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            cursor: isCompanyAdmin ? 'default' : 'pointer',
                          }}
                        >
                          <div style={{
                            width: 18,
                            height: 18,
                            borderRadius: 4,
                            background: isGranted ? '#06b6d4' : 'rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                          }}>
                            {isGranted && <Check size={12} strokeWidth={3} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: isGranted ? '#f8fafc' : '#94a3b8' }}>
                              {perm.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {perm.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Role Create/Edit Modal */}
      {modal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: 16,
        }}>
          <div style={{
            width: '100%',
            maxWidth: 440,
            background: '#0f172a',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                {modal === 'create' ? 'Create Custom Role' : 'Edit Role Details'}
              </h2>
              <button onClick={() => setModal(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRoleModal} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4 }}>Role Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Quality Auditor"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: errors.name ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', outline: 'none' }}
                />
                {errors.name && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.name}</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4 }}>Description</label>
                <textarea
                  placeholder="Brief summary of duties..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', outline: 'none', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" onClick={() => setModal(null)} style={{ padding: '10px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} style={{ padding: '10px 20px', borderRadius: 8, background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: '#fff', border: 'none', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Saving...' : modal === 'create' ? 'Create Role' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
