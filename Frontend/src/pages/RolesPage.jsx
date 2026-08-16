import React, { useEffect, useState } from 'react';
import {
  Plus, Shield, Edit2, Trash2, X, Lock, Check, CheckCircle2,
  ShieldCheck, Zap, GitBranch, Users, FileText, Settings, Key,
  AlertCircle, Save, Activity, LayoutDashboard, Building2,
  Award, BarChart3, SlidersHorizontal, Folder, Loader2
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

export function RolesPage() {
  const [rolesList, setRolesList] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [moduleCatalog, setModuleCatalog] = useState([]);
  const [rolePermissionsMap, setRolePermissionsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const showToast = (msg, isError = false) => {
    setToast({ message: msg, isError });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [remoteRoles, remoteModules] = await Promise.all([
        userService.getRoles().catch(() => []),
        userService.getModulePermissions().catch(() => []),
      ]);

      const roles = Array.isArray(remoteRoles) ? remoteRoles : [];
      const modules = Array.isArray(remoteModules) ? remoteModules : [];

      setRolesList(roles);
      setModuleCatalog(modules);

      if (roles.length > 0) {
        const active = selectedRole && roles.find((r) => r.id === selectedRole.id)
          ? roles.find((r) => r.id === selectedRole.id)
          : roles[0];
        setSelectedRole(active);

        // Fetch real permissions for all roles directly from PostgreSQL
        const permMap = {};
        await Promise.all(
          roles.map(async (r) => {
            if (r.slug === 'company_admin') {
              permMap[r.id] = modules.flatMap((m) => m.permissions.map((p) => p.id));
            } else {
              try {
                const rolePerms = await userService.getRolePermissions(r.id);
                permMap[r.id] = Array.isArray(rolePerms) ? rolePerms.map((p) => p.id) : [];
              } catch (e) {
                permMap[r.id] = [];
              }
            }
          })
        );
        setRolePermissionsMap(permMap);
      }
    } catch (err) {
      console.error('PostgreSQL roles fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
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
      await userService.updateRolePermissions(selectedRole.id, activePerms);
      showToast(`Permissions saved in PostgreSQL for role "${selectedRole.name}"!`);
    } catch (err) {
      showToast(`Error saving: ${err.message}`, true);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenCreateModal = () => {
    setForm({ name: '', description: '' });
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
        const createdRole = await userService.createRole({
          name: form.name.trim(),
          description: form.description.trim(),
          permission_ids: [],
        });

        setSelectedRole(createdRole);
        showToast(`Role "${form.name}" created in PostgreSQL!`);
        setModal(null);
        await loadData(false);
      } else if (modal === 'edit' && selectedRole) {
        await userService.updateRole(selectedRole.id, {
          name: form.name.trim(),
          description: form.description.trim(),
        });

        showToast(`Role details updated in PostgreSQL!`);
        setModal(null);
        await loadData(false);
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (role) => {
    if (role.slug === 'company_admin' || role.is_system) {
      showToast('System roles cannot be deleted.', true);
      return;
    }
    if (!window.confirm(`Are you sure you want to remove role "${role.name}" from PostgreSQL?`)) return;

    try {
      await userService.deleteRole(role.id);
      showToast(`Role "${role.name}" removed from PostgreSQL.`);
      await loadData(false);
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, true);
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

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', color: '#64748b' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#00b8e6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '14px' }} />
          <span style={{ fontWeight: '600', fontSize: '14px' }}>Loading roles & permissions...</span>
        </div>
      ) : rolesList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <Shield size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '1.1rem' }}>No Roles Defined</h3>
          <p style={{ margin: '0 0 16px', fontSize: '13px' }}>Create your first corporate role to assign permissions.</p>
          <button onClick={handleOpenCreateModal} className={`${s.btn} ${s.btnPrimary}`}>
            <Plus size={16} /> Create Role
          </button>
        </div>
      ) : (
        <>
          {/* Top Role Selector Tabs Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 0 12px',
              borderBottom: '1.5px solid #e2e8f0',
              marginBottom: '16px',
              gap: '16px',
            }}
          >
            {/* Scrollable Tabs Track with Right Edge Gradient Fade Indicator */}
            <div style={{ position: 'relative', flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
              <div
                className={s.tabsScrollTrack}
                style={{
                  maskImage: 'linear-gradient(to right, black calc(100% - 36px), transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 36px), transparent 100%)',
                  paddingRight: '16px',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '4px', flexShrink: 0 }}>
                  Select Role:
                </span>

              {rolesList.map((role) => {
                const isSelected = selectedRole?.id === role.id;
                return (
                  <div
                    key={role.id}
                    onClick={() => handleSelectRole(role)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '8px',
                      background: isSelected ? '#00b8e6' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#334155',
                      border: isSelected ? '1.5px solid #00b8e6' : '1.5px solid #e2e8f0',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '700',
                      fontSize: '13px',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                      boxShadow: isSelected ? '0 3px 10px rgba(0, 184, 230, 0.25)' : '0 1px 2px rgba(0,0,0,0.02)',
                    }}
                  >
                    <Shield size={14} color={isSelected ? '#ffffff' : '#0088bb'} />
                    <span>{role.name}</span>

                    {!role.is_system && (
                      <div style={{ display: 'inline-flex', gap: '3px', marginLeft: '4px' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenEditModal(role); }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: isSelected ? '#ffffff' : '#64748b',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Edit role title"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteRole(role); }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: isSelected ? '#ffffff' : '#ef4444',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Delete role"
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

            {/* Right: Save Privileges Action Pin */}
            {!isCompanyAdmin && (
              <button
                onClick={savePermissionsToDB}
                disabled={saving}
                className={`${s.btn} ${s.btnPrimary}`}
                style={{ padding: '8px 20px', fontSize: '13px', flexShrink: 0 }}
              >
                <Save size={14} />
                <span>{saving ? 'Saving...' : 'Save Privileges'}</span>
              </button>
            )}
          </div>

          {/* Full-Width Module Permission Cards Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {moduleCatalog.map((mod) => {
              const ModIcon = MODULE_ICONS[mod.module] || Folder;
              const modulePermIds = mod.permissions.map((p) => p.id);
              const allChecked = modulePermIds.length > 0 && modulePermIds.every((id) => activePerms.includes(id));
              const displayName = mod.name || (mod.module ? mod.module.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'Module');

              return (
                <div
                  key={mod.module}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '12px 18px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  }}
                >
                  {/* Module Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, rgba(0, 184, 230, 0.12), rgba(56, 189, 248, 0.2))',
                        color: '#0088bb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        border: '1px solid rgba(0, 184, 230, 0.25)',
                      }}>
                        <ModIcon size={16} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>
                            {displayName}
                          </span>
                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: '600',
                            padding: '1.5px 7px',
                            borderRadius: '999px',
                            background: '#f1f5f9',
                            color: '#475569',
                          }}>
                            {mod.permissions.length} Capabilities
                          </span>
                        </div>
                        {mod.description && (
                          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                            {mod.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {!isCompanyAdmin && (
                      <button
                        onClick={() => toggleSelectAllModule(selectedRole.id, modulePermIds)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#0088bb',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                        }}
                      >
                        {allChecked ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>

                  {/* Balanced Comfortable Capability Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
                    {mod.permissions.map((perm) => {
                      const isGranted = isCompanyAdmin || activePerms.includes(perm.id);

                      return (
                        <div
                          key={perm.id}
                          onClick={() => selectedRole && togglePermission(selectedRole.id, perm.id)}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '9px',
                            background: '#ffffff',
                            border: isGranted ? '1.5px solid #00b8e6' : '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
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
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', lineHeight: '1.3' }}>
                              {perm.description || perm.slug}
                            </div>
                          </div>

                          {/* Right: Modern ON/OFF Toggle Switch */}
                          <div style={{
                            width: '32px',
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
                              left: isGranted ? '16px' : '2px',
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
        </>
      )}

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
