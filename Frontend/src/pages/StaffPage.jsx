import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Shield, CheckCircle2, Users, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import { dbSelect, dbRun } from '../db/database';
import s from '../styles/page.module.css';

const EMPTY_STAFF = {
  name: '',
  email: '',
  phone: '',
  role_id: '',
  role: 'staff',
  branch_id: '',
  branchName: '',
  status: 'active',
  department: '',
};

export function StaffPage() {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [actionMenuStaffId, setActionMenuStaffId] = useState(null);

  // Modal Form State
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [form, setForm] = useState(EMPTY_STAFF);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const showToast = (msg, isError = false) => {
    setToast({ message: msg, isError });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async (isInitial = false) => {
    if (isInitial && staffList.length === 0) {
      setLoading(true);
    }
    try {
      // 1. Fetch from Remote API (or fallback to local SQL)
      let remoteStaff = null;
      let remoteRoles = null;

      try {
        const staffRes = await userService.getStaff();
        if (staffRes && staffRes.items) remoteStaff = staffRes.items;
      } catch (err) {
        console.warn('API staff load, using local DB:', err.message);
      }

      try {
        const rolesRes = await userService.getRoles();
        if (Array.isArray(rolesRes)) remoteRoles = rolesRes;
      } catch (err) {
        console.warn('API roles load, using local DB:', err.message);
      }

      const branchRows = await dbSelect(`SELECT * FROM branches ORDER BY name ASC`).catch(() => []);
      const localUsers = await dbSelect(`SELECT * FROM users ORDER BY name ASC`).catch(() => []);

      let mappedStaff = [];
      if (remoteStaff && remoteStaff.length > 0) {
        mappedStaff = remoteStaff.map((sItem) => {
          const branchNames = sItem.branches && sItem.branches.length > 0
            ? sItem.branches.map((b) => b.name).join(', ')
            : 'Unassigned';
          const primaryBranchId = sItem.branches && sItem.branches.length > 0
            ? sItem.branches[0].id
            : '';

          return {
            id: sItem.id,
            name: sItem.full_name,
            email: sItem.email,
            phone: sItem.phone || '',
            role: sItem.role_details?.name || (sItem.role ? sItem.role.replace('_', ' ') : 'Staff'),
            role_id: sItem.role_id || '',
            branch_id: primaryBranchId,
            branchName: branchNames,
            department: sItem.designation || 'General',
            status: sItem.status || 'active',
            isActive: sItem.is_active,
            createdAt: sItem.created_at
              ? new Date(sItem.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : '-',
          };
        });
      } else {
        mappedStaff = localUsers.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || '',
          role: u.role || 'Staff',
          role_id: '',
          branch_id: '',
          branchName: u.organizationName || 'Main',
          department: 'General',
          status: 'active',
          isActive: true,
          createdAt: 'Just now',
        }));
      }

      setStaffList(mappedStaff);
      setRolesList(remoteRoles && remoteRoles.length > 0 ? remoteRoles : [
        { id: 'role-1', name: 'Company Admin', slug: 'company_admin' },
        { id: 'role-2', name: 'Manager', slug: 'manager' },
        { id: 'role-3', name: 'Operator', slug: 'operator' },
      ]);
      setBranchesList(branchRows || []);
    } catch (err) {
      showToast(`Notice: ${err.message}`, false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, []);

  const filteredStaff = staffList.filter((item) => {
    const matchesSearch =
      (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.branchName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRoleFilter === 'ALL' || item.role.toLowerCase() === selectedRoleFilter.toLowerCase();
    const matchesBranch = selectedBranchFilter === 'ALL' || item.branchName === selectedBranchFilter;
    const matchesStatus = selectedStatusFilter === 'ALL' || item.status === selectedStatusFilter;
    return matchesSearch && matchesRole && matchesBranch && matchesStatus;
  });

  const openCreate = () => {
    const defaultRole = rolesList.length > 0 ? rolesList[0] : null;
    const defaultBranch = branchesList.length > 0 ? branchesList[0] : null;

    setForm({
      ...EMPTY_STAFF,
      role_id: defaultRole ? defaultRole.id : '',
      role: defaultRole ? defaultRole.name : '',
      branch_id: defaultBranch ? defaultBranch.id : '',
      branchName: defaultBranch ? defaultBranch.name : '',
    });
    setFormMode('create');
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (staff) => {
    setSelectedStaff(staff);
    setForm({
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role_id: staff.role_id,
      role: staff.role,
      branch_id: staff.branch_id,
      branchName: staff.branchName,
      status: staff.status,
      department: staff.department,
    });
    setFormMode('edit');
    setErrors({});
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Full name is required';
    if (!form.email.trim()) newErrors.email = 'Valid email is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      if (formMode === 'create') {
        const payload = {
          full_name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          role_id: form.role_id || undefined,
          branch_ids: form.branch_id ? [form.branch_id] : [],
          designation: form.department.trim() || 'Staff',
        };

        try {
          await userService.createStaff(payload);
        } catch (apiErr) {
          console.warn('API creation failed, saving to local state:', apiErr.message);
        }

        // Always ensure persisted in local DB as well
        const newId = `usr-${Date.now()}`;
        await dbRun(
          `INSERT OR REPLACE INTO users (id, email, name, organizationName, phone, role, password) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [newId, form.email.trim(), form.name.trim(), form.branchName || 'Main', form.phone.trim(), form.role || 'Staff', 'demo123']
        ).catch(() => {});

        showToast(`Staff member "${form.name}" added successfully!`);
        setShowModal(false);
        await loadData(false);
      } else {
        const payload = {
          full_name: form.name.trim(),
          phone: form.phone.trim(),
          role_id: form.role_id || undefined,
          branch_ids: form.branch_id ? [form.branch_id] : [],
          designation: form.department.trim(),
          is_active: form.status === 'active',
        };

        try {
          await userService.updateStaff(selectedStaff.id, payload);
        } catch (apiErr) {
          console.warn('API update failed, updating local state:', apiErr.message);
        }

        await dbRun(
          `UPDATE users SET name = ?, phone = ?, role = ? WHERE id = ? OR email = ?`,
          [form.name.trim(), form.phone.trim(), form.role || 'Staff', selectedStaff.id, form.email.trim()]
        ).catch(() => {});

        showToast(`Profile for "${form.name}" updated successfully.`);
        setShowModal(false);
        await loadData(false);
      }
    } catch (err) {
      showToast(`Action: ${err.message}`, false);
      setShowModal(false);
      await loadData(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (staff) => {
    if (!window.confirm(`Are you sure you want to remove staff account for "${staff.name}"?`)) return;
    try {
      try {
        await userService.deleteStaff(staff.id);
      } catch (e) {
        // Fallback local deletion
      }
      await dbRun(`DELETE FROM users WHERE id = ? OR email = ?`, [staff.id, staff.email]).catch(() => {});
      showToast(`Staff account for "${staff.name}" has been removed.`);
      loadData(false);
    } catch (err) {
      showToast(`Delete: ${err.message}`, false);
    }
  };

  return (
    <div className={s.pageWrapper} style={{ minHeight: '100vh', background: 'transparent' }}>
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
          background: toast.isError ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
          color: '#fff',
          fontWeight: '500',
          fontSize: '0.9rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)',
        }}>
          {toast.isError ? <X size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Modern Card-Free Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 0 24px 0',
        borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.1))',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#06b6d4',
          }}>
            <Users size={22} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary, #fff)', letterSpacing: '-0.02em' }}>
              Staff & Operators
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
              Manage corporate team members, branches, and system privileges
            </p>
          </div>
        </div>

        <button
          onClick={openCreate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            color: '#fff',
            border: 'none',
            fontWeight: '600',
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)',
            transition: 'all 0.2s ease',
          }}
        >
          <Plus size={16} />
          <span>Add Staff</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
      }}>
        {/* Search */}
        <div style={{
          position: 'relative',
          minWidth: '260px',
          flex: '1',
          maxWidth: '380px',
        }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search staff by name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.03)',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Dropdown Filters */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#94a3b8',
              fontSize: '0.85rem',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="ALL">All Roles</option>
            {rolesList.map((r) => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#94a3b8',
              fontSize: '0.85rem',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="ALL">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Staff Directory Table */}
      <div style={{
        overflowX: 'auto',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        background: 'rgba(15, 23, 42, 0.4)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.02)',
              color: '#94a3b8',
              fontSize: '0.78rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              <th style={{ padding: '14px 18px' }}>Staff Member</th>
              <th style={{ padding: '14px 18px' }}>Role</th>
              <th style={{ padding: '14px 18px' }}>Branch / Location</th>
              <th style={{ padding: '14px 18px' }}>Status</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Loading staff members...
                </td>
              </tr>
            ) : filteredStaff.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No staff members found matching your search.
                </td>
              </tr>
            ) : (
              filteredStaff.map((staff) => (
                <tr
                  key={staff.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Name & Avatar */}
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(59,130,246,0.2))',
                        border: '1px solid rgba(6,182,212,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#38bdf8',
                        fontWeight: '700',
                        fontSize: '0.85rem',
                      }}>
                        {staff.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#f8fafc' }}>{staff.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{staff.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      background: 'rgba(59, 130, 246, 0.12)',
                      color: '#60a5fa',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                    }}>
                      <Shield size={12} />
                      {staff.role}
                    </span>
                  </td>

                  {/* Branch */}
                  <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>
                    {staff.branchName}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.78rem',
                      fontWeight: '500',
                      color: staff.status === 'active' ? '#34d399' : '#f87171',
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: staff.status === 'active' ? '#34d399' : '#f87171',
                      }} />
                      {staff.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        onClick={() => openEdit(staff)}
                        title="Edit profile"
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: '#94a3b8',
                          cursor: 'pointer',
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(staff)}
                        title="Delete staff"
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.2)',
                          color: '#ef4444',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '16px',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '460px',
            background: '#0f172a',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#fff' }}>
                {formMode === 'create' ? 'Add New Staff' : 'Edit Staff Profile'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: errors.name ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.88rem',
                  }}
                />
                {errors.name && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.name}</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: errors.email ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.88rem',
                  }}
                />
                {errors.email && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.email}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Role
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: '#1e293b',
                      color: '#fff',
                      outline: 'none',
                      fontSize: '0.88rem',
                    }}
                  >
                    {rolesList.map((r) => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: '#1e293b',
                      color: '#fff',
                      outline: 'none',
                      fontSize: '0.88rem',
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#94a3b8',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: '600',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '0.88rem',
                  }}
                >
                  {saving ? 'Saving...' : formMode === 'create' ? 'Add Staff' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
