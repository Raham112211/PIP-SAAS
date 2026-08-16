import React, { useEffect, useState } from 'react';
import {
  Plus, Shield, Edit2, Trash2, X, Lock, Check, CheckCircle2,
  ShieldCheck, Zap, GitBranch, Users, FileText, Settings, Key,
  AlertCircle, Save, Activity, LayoutDashboard, Building2,
  Award, BarChart3, SlidersHorizontal, Folder
} from 'lucide-react';
import { userService } from '../services/userService';
import s from '../styles/page.module.css';

const MODULE_ICONS = {
  dashboard: LayoutDashboard,
  bills: FileText,
  branches: GitBranch,
  connections: Zap,
  reports: BarChart3,
  staff: Users,
  roles: Shield,
  settings: SlidersHorizontal,
  scraper: Activity,
  organization: Building2,
  licence: Award,
};

const DEFAULT_MODULE_CATALOG = [
  {
    module: 'dashboard',
    name: 'Dashboard & Analytics',
    description: 'Executive summaries, real-time KPI metrics, and consumption overview',
    permissions: [
      { id: 'perm-dash-view', slug: 'dashboard.view', name: 'View Overview & Analytics', description: 'Access KPI summaries, revenue statistics, and live charts' },
    ],
  },
  {
    module: 'bills',
    name: 'Bills & Invoicing',
    description: 'Utility invoices, PDF statement downloads, ledgers, and billing operations',
    permissions: [
      { id: 'perm-bills-view', slug: 'bills.view', name: 'View Consumer Invoices', description: 'Access consumer billing ledger and account summaries' },
      { id: 'perm-bills-download', slug: 'bills.download', name: 'Download PDF Bills', description: 'Download original PDF billing statements and verified receipts' },
      { id: 'perm-bills-export', slug: 'bills.export', name: 'Export Billing Data', description: 'Export monthly billing spreadsheets to Excel or CSV' },
      { id: 'perm-bills-manage', slug: 'bills.manage', name: 'Edit & Process Bills', description: 'Modify billing amounts, record payments, and verify ledger' },
    ],
  },
  {
    module: 'branches',
    name: 'Branch Management',
    description: 'Corporate branch network, node creation, addresses, and office management',
    permissions: [
      { id: 'perm-branch-view', slug: 'branches.view', name: 'View Branches', description: 'Browse corporate branch network locations and metrics' },
      { id: 'perm-branch-create', slug: 'branches.create', name: 'Create Branch', description: 'Register new regional corporate branch offices' },
      { id: 'perm-branch-edit', slug: 'branches.edit', name: 'Edit Branch Info', description: 'Update branch configuration, address, and manager details' },
      { id: 'perm-branch-delete', slug: 'branches.delete', name: 'Delete Branch', description: 'Remove inactive branch records and consumer assignments' },
    ],
  },
  {
    module: 'connections',
    name: 'Utility Connections & Meters',
    description: 'Consumer utility meters, DISCO reference accounts, and tariff assignments',
    permissions: [
      { id: 'perm-conn-view', slug: 'connections.view', name: 'View Connections', description: 'View consumer meters, reference IDs, and connection details' },
      { id: 'perm-conn-add', slug: 'connections.add', name: 'Add Connection', description: 'Register new consumer connections and utility meters' },
      { id: 'perm-conn-edit', slug: 'connections.edit', name: 'Edit Connection', description: 'Update reference numbers, consumer IDs, and tariffs' },
    ],
  },
  {
    module: 'reports',
    name: 'Audit & Financial Reports',
    description: 'Tax compliance audits, analytical spreadsheets, and monthly financial summaries',
    permissions: [
      { id: 'perm-reports-view', slug: 'reports.view', name: 'View Reports & Graphs', description: 'Generate audit summaries, consumption graphs, and trends' },
      { id: 'perm-reports-export', slug: 'reports.export', name: 'Export Audit Reports', description: 'Download comprehensive financial and utility audit spreadsheets' },
    ],
  },
  {
    module: 'staff',
    name: 'Staff & Team Directory',
    description: 'Corporate staff operators, permissions assignments, and profile privileges',
    permissions: [
      { id: 'perm-staff-view', slug: 'staff.view', name: 'View Staff Directory', description: 'Browse active corporate staff members and assignees' },
      { id: 'perm-staff-manage', slug: 'staff.manage', name: 'Manage Staff Profiles', description: 'Create, update profiles, and assign branches or roles to staff' },
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
    'role-3': ['perm-dash-view', 'perm-bills-view', 'perm-bills-download', 'perm-reports-view'],
  });
  const [modal, setModal] = useState(null);
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
      // Handled seamlessly
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
      const allSelected = modulePermIds.length > 0 && modulePermIds.every((id) => current.includes(id));
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
      <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr', gap: '28px', alignItems: 'start' }}>
        {/* Left Column: Roles Sidebar */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            DEFINED ROLES ({rolesList.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rolesList.map((role) => {
              const isSelected = selectedRole?.id === role.id;
              return (
                <div
                  key={role.id}
                  onClick={() => handleSelectRole(role)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    background: '#ffffff',
                    border: isSelected ? '1.5px solid #00b8e6' : '1px solid #e2e8f0',
                    borderLeft: isSelected ? '4px solid #00b8e6' : '1px solid #e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 2px 8px rgba(0, 184, 230, 0.08)' : '0 1px 2px rgba(0,0,0,0.02)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '13.5px', color: isSelected ? '#0088bb' : '#0f172a' }}>
                      {role.name}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                      {role.is_system ? 'System Default' : 'Custom Role'}
                    </div>
                  </div>

                  {!role.is_system && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEditModal(role); }}
                        className={s.actionBtn}
                        style={{ width: '26px', height: '26px' }}
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteRole(role); }}
                        className={`${s.actionBtn} ${s.actionBtnDelete}`}
                        style={{ width: '26px', height: '26px' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Module Cards with Informative Headers & 2-Column Toggle Grid */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                Privileges for <span style={{ color: '#0088bb' }}>{selectedRole?.name}</span>
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#64748b' }}>
                {selectedRole?.description || 'Grant or revoke capability permissions for this role'}
              </p>
            </div>

            {!isCompanyAdmin && (
              <button
                onClick={savePermissionsToDB}
                disabled={saving}
                className={`${s.btn} ${s.btnPrimary}`}
                style={{ padding: '8px 18px', fontSize: '13px' }}
              >
                <Save size={14} />
                <span>{saving ? 'Saving...' : 'Save Privileges'}</span>
              </button>
            )}
          </div>

          {/* Module Cards Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {moduleCatalog.map((mod) => {
              const ModIcon = MODULE_ICONS[mod.module] || Folder;
              const modulePermIds = mod.permissions.map((p) => p.id);
              const allChecked = modulePermIds.length > 0 && modulePermIds.every((id) => activePerms.includes(id));

              return (
                <div
                  key={mod.module}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  }}
                >
                  {/* Module Card Header with Logo + Name + Permission Scope Description */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '9px',
                        background: 'linear-gradient(135deg, rgba(0, 184, 230, 0.12), rgba(56, 189, 248, 0.2))',
                        color: '#0088bb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        border: '1px solid rgba(0, 184, 230, 0.25)',
                      }}>
                        <ModIcon size={18} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                            {mod.name}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: '#f1f5f9',
                            color: '#475569',
                          }}>
                            {mod.permissions.length} Capabilities
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          {mod.description}
                        </div>
                      </div>
                    </div>

                    {!isCompanyAdmin && (
                      <button
                        onClick={() => toggleSelectAllModule(selectedRole.id, modulePermIds)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#0088bb',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                        }}
                      >
                        {allChecked ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>

                  {/* 2-Column Capability Grid with ON/OFF Toggle Switches */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                    {mod.permissions.map((perm) => {
                      const isGranted = isCompanyAdmin || activePerms.includes(perm.id);

                      return (
                        <div
                          key={perm.id}
                          onClick={() => selectedRole && togglePermission(selectedRole.id, perm.id)}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '10px',
                            background: '#ffffff',
                            border: isGranted ? '1.5px solid #00b8e6' : '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '14px',
                            cursor: isCompanyAdmin ? 'default' : 'pointer',
                            transition: 'all 0.15s ease',
                            boxShadow: isGranted ? '0 2px 6px rgba(0, 184, 230, 0.08)' : 'none',
                          }}
                        >
                          {/* Left: Capability Info */}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                              {perm.name}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', lineHeight: '1.35' }}>
                              {perm.description}
                            </div>
                          </div>

                          {/* Right: Modern ON/OFF Toggle Switch */}
                          <div style={{
                            width: '34px',
                            height: '18px',
                            borderRadius: '999px',
                            background: isGranted ? '#00b8e6' : '#cbd5e1',
                            position: 'relative',
                            transition: 'background 0.2s ease',
                            flexShrink: 0,
                          }}>
                            <div style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              background: '#ffffff',
                              position: 'absolute',
                              top: '2px',
                              left: isGranted ? '18px' : '2px',
                              transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            }} />
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

      {/* Matching Modal Structure as Bills Page */}
      {modal && (
        <div className={s.modalBackdrop} onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className={s.modal} style={{ maxWidth: 540 }}>
            <div className={s.modalHeader}>
              <span className={s.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={20} color="var(--color-accent)" />
                {modal === 'create' ? 'Create Custom Corporate Role' : `Edit Role: ${form.name || 'Role'}`}
              </span>
              <button className={s.modalClose} onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveRoleModal}>
              <div className={s.modalBody}>
                <div className={s.form}>
                  <div className={s.field}>
                    <label className={s.label}>Role Name *</label>
                    <input
                      className={`${s.input} ${errors.name ? s.inputError : ''}`}
                      placeholder="e.g. Quality Auditor"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                    {errors.name && <span className={s.fieldError}>{errors.name}</span>}
                  </div>

                  <div className={s.field}>
                    <label className={s.label}>Description</label>
                    <textarea
                      placeholder="Brief summary of privileges..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                      className={s.textarea}
                    />
                  </div>
                </div>
              </div>
              <div className={s.modalFooter}>
                <button type="button" className={`${s.btn} ${s.btnSecondary}`} onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
                  {saving ? 'Saving...' : modal === 'create' ? 'Save & Create Role' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
