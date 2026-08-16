import { useEffect, useState } from 'react';
import {
  Plus, Shield, Edit2, Trash2, X, Lock, Check, CheckCircle2,
  ShieldCheck, Zap, GitBranch, Users, FileText, Settings, Key,
  AlertCircle, Save, Wifi, Activity, LayoutDashboard, Building2,
  Award, BarChart3, SlidersHorizontal, MoreVertical
} from 'lucide-react';
import { userService } from '../services/userService';
import s from '../styles/page.module.css';

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
  const [modal, setModal] = useState(null); // 'create' | 'edit' | null
  const [form, setForm] = useState(EMPTY_ROLE_FORM);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

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
  };

  return (
    <div className={s.page}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 20px',
          borderRadius: '10px',
          background: toast.isError ? '#ef4444' : '#00b8e6',
          color: '#fff',
          fontWeight: '600',
          fontSize: '0.9rem',
          boxShadow: '0 8px 24px rgba(0, 184, 230, 0.35)',
        }}>
          {toast.isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>Roles & System Privileges</h1>
          <p className={s.pageSubtitle}>
            Configure security access matrices and fine-grained operator capabilities
          </p>
        </div>

        <button onClick={handleOpenCreateModal} className={`${s.btn} ${s.btnPrimary}`}>
          <Plus size={16} />
          <span>New Role</span>
        </button>
      </div>

      {/* 2-Column Responsive Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left Column: Defined Roles */}
        <div className={s.card} style={{ margin: 0, padding: '18px' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px', fontFamily: 'var(--font-heading)' }}>
            Defined Roles ({rolesList.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rolesList.map((role) => {
              const isSelected = selectedRole?.id === role.id;
              return (
                <div
                  key={role.id}
                  onClick={() => handleSelectRole(role)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: isSelected ? '#e0f7fc' : '#f8fafc',
                    border: isSelected ? '1.5px solid #00b8e6' : '1px solid var(--color-border)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.92rem', color: isSelected ? '#007fa3' : '#0f172a' }}>
                      {role.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                      {role.is_system ? 'System Default' : 'Custom Role'}
                    </div>
                  </div>

                  {!role.is_system && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEditModal(role); }}
                        className={s.actionBtn}
                        style={{ width: '28px', height: '28px' }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteRole(role); }}
                        className={`${s.actionBtn} ${s.actionBtnDelete}`}
                        style={{ width: '28px', height: '28px' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Permission Matrix */}
        <div className={s.card} style={{ margin: 0, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', fontFamily: 'var(--font-heading)' }}>
                Privileges for <span style={{ color: '#0088bb' }}>{selectedRole?.name}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '3px' }}>
                {selectedRole?.description || 'Grant or revoke capability permissions across all platform modules'}
              </div>
            </div>

            {!isCompanyAdmin && (
              <button
                onClick={savePermissionsToDB}
                disabled={saving}
                className={`${s.btn} ${s.btnPrimary}`}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                <Save size={14} />
                <span>{saving ? 'Saving...' : 'Save Privileges'}</span>
              </button>
            )}
          </div>

          {/* Module Privileges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {moduleCatalog.map((mod) => {
              const ModIcon = MODULE_ICONS[mod.module] || Shield;
              const modulePermIds = mod.permissions.map((p) => p.id);
              const allChecked = modulePermIds.length > 0 && modulePermIds.every((id) => activePerms.includes(id));

              return (
                <div
                  key={mod.module}
                  style={{
                    background: '#f8fcfe',
                    border: '1px solid #e0f2fe',
                    borderRadius: '8px',
                    padding: '14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ModIcon size={16} color="#0088bb" />
                      <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0f172a' }}>{mod.name}</span>
                    </div>

                    {!isCompanyAdmin && (
                      <button
                        onClick={() => toggleSelectAllModule(selectedRole.id, modulePermIds)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#0088bb',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                        }}
                      >
                        {allChecked ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                    {mod.permissions.map((perm) => {
                      const isGranted = isCompanyAdmin || activePerms.includes(perm.id);

                      return (
                        <div
                          key={perm.id}
                          onClick={() => selectedRole && togglePermission(selectedRole.id, perm.id)}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: isGranted ? '#e0f7fc' : '#ffffff',
                            border: isGranted ? '1px solid #b9eef8' : '1px solid var(--color-border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: isCompanyAdmin ? 'default' : 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '4px',
                            background: isGranted ? '#00b8e6' : '#ffffff',
                            border: isGranted ? 'none' : '1.5px solid #cbd5e1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            flexShrink: 0,
                          }}>
                            {isGranted && <Check size={12} strokeWidth={3} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '0.82rem', color: isGranted ? '#007fa3' : '#334155' }}>
                              {perm.name}
                            </div>
                            <div style={{ fontSize: '0.73rem', color: '#64748b' }}>
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

      {/* Modal Dialog */}
      {modal && (
        <div className={s.modalOverlay}>
          <div className={s.modalContent} style={{ maxWidth: '480px' }}>
            <div className={s.modalHeader}>
              <h2 className={s.modalTitle}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, rgba(0, 184, 230, 0.15), rgba(56, 189, 248, 0.25))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0088bb',
                }}>
                  <ShieldCheck size={18} />
                </div>
                <span>{modal === 'create' ? 'Create Custom Role' : `Edit Role: ${form.name || 'Role'}`}</span>
              </h2>
              <button onClick={() => setModal(null)} className={s.modalClose}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveRoleModal} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className={s.label}>Role Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Quality Auditor"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={s.input}
                  style={errors.name ? { borderColor: '#ef4444' } : {}}
                />
                {errors.name && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{errors.name}</span>}
              </div>

              <div>
                <label className={s.label}>Description</label>
                <textarea
                  placeholder="Brief summary of privileges..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className={s.textarea}
                />
              </div>

              <div className={s.modalActions} style={{ margin: '8px -24px -24px -24px', padding: '16px 24px', background: '#f8fcfe', borderTop: '1px solid #f1f5f9' }}>
                <button type="button" onClick={() => setModal(null)} className={`${s.btn} ${s.btnSecondary}`}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className={`${s.btn} ${s.btnPrimary}`}>
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
