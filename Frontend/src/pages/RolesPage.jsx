import { useEffect, useState } from 'react';
import {
  Plus, Shield, Edit2, Trash2, X, Lock, Check, CheckCircle2,
  ShieldCheck, Zap, GitBranch, Users, FileText, Settings, Key,
  AlertCircle, Save, Wifi, Activity, LayoutDashboard, Building2,
  Award, BarChart3, SlidersHorizontal, MoreVertical
} from 'lucide-react';
import { userService } from '../services/userService';
import { realtimeSocket } from '../services/websocket';

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

const EMPTY_ROLE_FORM = {
  name: '',
  description: '',
};

export function RolesPage() {
  const [rolesList, setRolesList] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [moduleCatalog, setModuleCatalog] = useState([]);
  const [rolePermissionsMap, setRolePermissionsMap] = useState({});
  const [loading, setLoading] = useState(true);
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

  const loadData = async (isInitial = false) => {
    if (isInitial && rolesList.length === 0) {
      setLoading(true);
    }
    try {
      const [roles, modules] = await Promise.all([
        userService.getRoles().catch((err) => {
          console.warn('Failed to load roles from User Service:', err);
          return [];
        }),
        userService.getModulePermissions().catch((err) => {
          console.warn('Failed to load module permissions:', err);
          return [];
        }),
      ]);

      setRolesList(roles || []);
      setModuleCatalog(modules || []);

      if (roles && roles.length > 0) {
        if (!selectedRole || !roles.find((r) => r.id === selectedRole.id)) {
          setSelectedRole(roles[0]);
          await loadRolePermissions(roles[0].id);
        }
      }
    } catch (err) {
      showToast(`Error loading data: ${err.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const loadRolePermissions = async (roleId) => {
    try {
      const perms = await userService.getRolePermissions(roleId);
      const permIds = (perms || []).map((p) => p.id);
      setRolePermissionsMap((prev) => ({
        ...prev,
        [roleId]: permIds,
      }));
    } catch (err) {
      console.warn(`Could not load permissions for role ${roleId}:`, err);
    }
  };

  useEffect(() => {
    loadData(true);

    const unsubscribe = realtimeSocket.subscribe((event) => {
      if (['ROLE_CREATED', 'ROLE_UPDATED', 'ROLE_DELETED', 'PERMISSIONS_UPDATED'].includes(event.type)) {
        loadData(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSelectRole = async (role) => {
    setSelectedRole(role);
    setActionMenuRoleId(null);
    if (!rolePermissionsMap[role.id]) {
      await loadRolePermissions(role.id);
    }
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
        ? current.filter((id) => id !== permId) // remove permission
        : [...current, permId];                 // add permission
      return { ...prev, [roleId]: updated };
    });
  };

  const toggleSelectAllModule = (roleId, modulePermIds) => {
    if (isCompanyAdmin) return;

    setRolePermissionsMap((prev) => {
      const current = prev[roleId] || [];
      const allSelected = modulePermIds.every((id) => current.includes(id));
      const updated = allSelected
        ? current.filter((id) => !modulePermIds.includes(id)) // remove all
        : Array.from(new Set([...current, ...modulePermIds])); // add all
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
      await userService.updateRolePermissions(selectedRole.id, activePerms);
      showToast(`Permissions updated for role "${selectedRole.name}"!`);
      permissionSocket.emit('PERMISSIONS_SYNCED', { roleId: selectedRole.id });
    } catch (err) {
      showToast(`Save failed: ${err.message}`, true);
    } finally {
      setSaving(false);
    }
  };

  const openCreateModal = () => {
    setForm(EMPTY_ROLE_FORM);
    setErrors({});
    setModal('create');
  };

  const openEditModal = (role) => {
    if (role.slug === 'company_admin') {
      showToast('Company Admin title is managed by system.', true);
      return;
    }
    setForm({ name: role.name, description: role.description || '' });
    setErrors({});
    setModal('edit');
    setActionMenuRoleId(null);
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: 'Role title is required' });
      return;
    }

    setSaving(true);
    try {
      if (modal === 'create') {
        const newRole = await userService.createRole({
          name: form.name.trim(),
          description: form.description.trim(),
          permission_ids: [],
        });
        setRolesList((prev) => [...prev, newRole]);
        setSelectedRole(newRole);
        setRolePermissionsMap((prev) => ({ ...prev, [newRole.id]: [] }));
        showToast(`Role "${newRole.name}" created successfully!`);
      } else if (modal === 'edit' && selectedRole) {
        const updatedRole = await userService.updateRole(selectedRole.id, {
          name: form.name.trim(),
          description: form.description.trim(),
        });
        setRolesList((prev) => prev.map((r) => (r.id === updatedRole.id ? updatedRole : r)));
        setSelectedRole(updatedRole);
        showToast(`Role details updated!`);
      }
      setModal(null);
    } catch (err) {
      showToast(`Error: ${err.message}`, true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (role) => {
    if (role.slug === 'company_admin') {
      showToast('Master Company Admin role cannot be deleted.', true);
      return;
    }
    if (!window.confirm(`Are you sure you want to delete/remove the role "${role.name}"?`)) return;

    try {
      await userService.deleteRole(role.id);
      const remaining = rolesList.filter((r) => r.id !== role.id);
      setRolesList(remaining);
      if (selectedRole?.id === role.id && remaining.length > 0) {
        setSelectedRole(remaining[0]);
        await loadRolePermissions(remaining[0].id);
      }
      showToast(`Role "${role.name}" has been removed from database.`);
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, true);
    }
    setActionMenuRoleId(null);
  };

  return (
    <div style={{ padding: '20px 28px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'inherit' }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: toast.isError ? '#ef4444' : '#10b981',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: 8,
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            zIndex: 1000,
            fontSize: 12.5,
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={15} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>Roles & Permissions</h1>
          <p style={{ fontSize: 12.5, color: '#64748b', margin: '3px 0 0' }}>
            Manage roles, define custom roles, and add or remove permissions.
          </p>
        </div>
        <div>
          <button
            onClick={openCreateModal}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 15px',
              borderRadius: 8, border: 'none', background: 'var(--grad-cyan-button)',
              color: '#ffffff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              boxShadow: 'var(--shadow-cyan)'
            }}
          >
            <Plus size={15} /> Define Custom Role
          </button>
        </div>
      </div>

      {/* Main Grid: Left Roles Directory | Right Permissions Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Roles List Card */}
        <div style={{ background: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              ROLES DIRECTORY ({rolesList.length})
            </span>
          </div>

          {loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 12 }}>Loading roles from User Service...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rolesList.map((role) => {
                const isSelected = selectedRole?.id === role.id;
                const roleDescriptionText = role.description
                  ? role.description
                  : role.is_system
                  ? 'System Managed Role'
                  : 'Custom Organization Role';

                return (
                  <div
                    key={role.id}
                    onClick={() => handleSelectRole(role)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: `1.5px solid ${isSelected ? '#38bdf8' : '#f1f5f9'}`,
                      background: isSelected ? '#f0f9ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                      <div style={{ position: 'relative', width: 30, height: 30, flexShrink: 0 }}>
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            background: isSelected ? '#e0f2fe' : '#f8fafc',
                            border: '1px solid #e2e8f0',
                            color: isSelected ? 'var(--color-accent)' : '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Shield size={14} />
                        </div>
                        {/* Status Dot */}
                        <span
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: '#22c55e',
                            border: '1px solid #ffffff',
                          }}
                        />
                      </div>

                      <div style={{ minWidth: 0, flex: 1, paddingRight: 6 }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {role.name}
                        </div>
                        <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {roleDescriptionText}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 7px',
                          borderRadius: 6,
                          background: role.is_system ? '#eff6ff' : '#f0fdf4',
                          border: `1px solid ${role.is_system ? '#bfdbfe' : '#bbf7d0'}`,
                          color: role.is_system ? '#2563eb' : '#16a34a',
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {role.is_system ? 'System' : 'Custom'}
                      </span>

                      {/* 3-Dots Action Menu for removing / editing roles */}
                      {role.slug !== 'company_admin' && (
                        <div style={{ position: 'relative' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuRoleId(actionMenuRoleId === role.id ? null : role.id);
                            }}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}
                            title="Role Options"
                          >
                            <MoreVertical size={13} />
                          </button>

                          {actionMenuRoleId === role.id && (
                            <div
                              style={{
                                position: 'absolute', right: 0, top: 24, background: '#fff',
                                border: '1px solid #e2e8f0', borderRadius: 6, boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                                zIndex: 10, minWidth: 90, padding: 3,
                              }}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(role);
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: 5, width: '100%', padding: '5px 8px', fontSize: 11.5, border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
                              >
                                <Edit2 size={11} /> Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRole(role);
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: 5, width: '100%', padding: '5px 8px', fontSize: 11.5, border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', color: '#dc2626' }}
                              >
                                <Trash2 size={11} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Permissions Matrix Panel */}
        {selectedRole && (
          <div style={{ background: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                    {selectedRole.name}
                  </h2>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: 6,
                      background: isCompanyAdmin ? '#eff6ff' : '#f0fdf4',
                      color: isCompanyAdmin ? '#2563eb' : '#16a34a',
                      fontSize: 10.5,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {isCompanyAdmin ? 'Full Access Master Admin' : 'Configurable Role'}
                  </div>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#64748b' }}>
                  {isCompanyAdmin
                    ? 'Company Admin has full system access to all modules.'
                    : 'Toggle permissions ON or OFF to grant or revoke access, then click Save Permissions.'}
                </p>
              </div>

              <button
                onClick={savePermissionsToDB}
                disabled={saving || isCompanyAdmin}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                  borderRadius: 6, border: 'none',
                  background: isCompanyAdmin ? '#e2e8f0' : 'var(--color-accent)',
                  color: isCompanyAdmin ? '#94a3b8' : '#ffffff',
                  fontSize: 12, fontWeight: 600,
                  cursor: isCompanyAdmin ? 'not-allowed' : 'pointer',
                  boxShadow: isCompanyAdmin ? 'none' : '0 2px 5px rgba(2, 132, 199, 0.25)'
                }}
              >
                <Save size={13} />
                <span>{saving ? 'Saving...' : 'Save Permissions'}</span>
              </button>
            </div>

            {/* Dynamic Module Permission Cards with Compact Toggle Switches */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {moduleCatalog.map((cat) => {
                const ModuleIcon = MODULE_ICONS[cat.module.toLowerCase()] || Shield;
                const modulePermIds = cat.permissions.map((p) => p.id);
                const selectedInModule = modulePermIds.filter((id) => activePerms.includes(id)).length;

                return (
                  <div
                    key={cat.module}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ModuleIcon size={14} color="var(--color-accent)" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>
                          {cat.module} Module
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 5,
                            background: selectedInModule === modulePermIds.length && modulePermIds.length > 0 ? '#ecfdf5' : 'var(--color-accent-soft)',
                            border: `1px solid ${selectedInModule === modulePermIds.length && modulePermIds.length > 0 ? '#a7f3d0' : 'var(--color-accent-border)'}`,
                            color: selectedInModule === modulePermIds.length && modulePermIds.length > 0 ? '#059669' : 'var(--color-accent-dark)',
                            fontSize: 10.5,
                            fontWeight: 700,
                          }}
                        >
                          {selectedInModule} / {modulePermIds.length} Active
                        </span>
                        {!isCompanyAdmin && (
                          <button
                            type="button"
                            onClick={() => toggleSelectAllModule(selectedRole.id, modulePermIds)}
                            style={{ padding: '2px 7px', borderRadius: 5, border: '1px solid #cbd5e1', background: '#fff', fontSize: 10.5, cursor: 'pointer', color: '#475569' }}
                          >
                            Toggle All
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Permissions Grid with Compact Toggle Switches */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 8 }}>
                      {cat.permissions.map((perm) => {
                        const isChecked = activePerms.includes(perm.id);
                        return (
                          <div
                            key={perm.id}
                            onClick={() => !isCompanyAdmin && togglePermission(selectedRole.id, perm.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 10,
                              padding: '7px 10px',
                              background: '#ffffff',
                              border: `1.5px solid ${isChecked ? '#7dd3fc' : '#e2e8f0'}`,
                              borderRadius: 6,
                              cursor: isCompanyAdmin ? 'not-allowed' : 'pointer',
                              transition: 'all 0.15s ease',
                              boxShadow: isChecked ? '0 1px 3px rgba(56, 189, 248, 0.12)' : 'none',
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: 11.5, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {perm.name}
                              </div>
                              {perm.description && (
                                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {perm.description}
                                </div>
                              )}
                            </div>

                            {/* Compact Toggle Switch Button */}
                            <div
                              style={{
                                position: 'relative',
                                width: 28,
                                height: 16,
                                borderRadius: 999,
                                background: isChecked ? 'var(--color-accent)' : '#cbd5e1',
                                transition: 'background-color 0.2s ease',
                                flexShrink: 0,
                                opacity: isCompanyAdmin ? 0.75 : 1,
                              }}
                            >
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 2,
                                  left: isChecked ? 14 : 2,
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  background: '#ffffff',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
                                  transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 14, marginTop: 18, fontSize: 11.5, color: '#64748b' }}>
              <span>Total Active: <strong style={{ color: '#0f172a' }}>{activePerms.length} Enabled</strong></span>
              <button
                onClick={savePermissionsToDB}
                disabled={saving || isCompanyAdmin}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                  borderRadius: 6, border: 'none',
                  background: isCompanyAdmin ? '#e2e8f0' : 'var(--color-accent)',
                  color: isCompanyAdmin ? '#94a3b8' : '#ffffff',
                  fontSize: 12, fontWeight: 600,
                  cursor: isCompanyAdmin ? 'not-allowed' : 'pointer',
                  boxShadow: isCompanyAdmin ? 'none' : '0 2px 5px rgba(2, 132, 199, 0.25)'
                }}
              >
                <Save size={13} />
                <span>{saving ? 'Saving...' : 'Save Permissions'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {(modal === 'create' || modal === 'edit') && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div style={{ background: '#ffffff', borderRadius: 10, width: '100%', maxWidth: 440, padding: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                {modal === 'create' ? 'Define New Custom Role' : 'Edit Role Details'}
              </h3>
              <button onClick={() => setModal(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleRoleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#475569', marginBottom: 5 }}>Role Title *</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${errors.name ? '#ef4444' : '#cbd5e1'}`, fontSize: 12.5, outline: 'none' }}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Finance Cashier, Tax Accountant"
                  />
                  {errors.name && <span style={{ color: '#ef4444', fontSize: 10.5 }}>{errors.name}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#475569', marginBottom: 5 }}>Role Description</label>
                  <textarea
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12.5, outline: 'none' }}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe duties and access scope..."
                    rows={3}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', fontSize: 12, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  {saving ? 'Saving...' : modal === 'create' ? 'Define Role' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

