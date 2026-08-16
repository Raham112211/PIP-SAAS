import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Shield, CheckCircle2, Users, AlertCircle, Building2, Mail, Phone, UserCheck } from 'lucide-react';
import { userService } from '../services/userService';
import { dbSelect, dbRun } from '../db/database';
import s from '../styles/page.module.css';

const EMPTY_STAFF = {
  name: '',
  email: '',
  phone: '',
  role_id: '',
  role: 'Staff',
  branch_id: '',
  branchName: 'Main Office',
  status: 'active',
  department: 'Operations',
};

export function StaffPage() {
  const [staffList, setStaffList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

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
    if (isInitial && staffList.length === 0) setLoading(true);
    try {
      let remoteStaff = null;
      let remoteRoles = null;

      try {
        const staffRes = await userService.getStaff();
        if (staffRes && staffRes.items) remoteStaff = staffRes.items;
      } catch (err) {
        console.warn('API staff load fallback:', err.message);
      }

      try {
        const rolesRes = await userService.getRoles();
        if (Array.isArray(rolesRes)) remoteRoles = rolesRes;
      } catch (err) {
        console.warn('API roles load fallback:', err.message);
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
            department: sItem.designation || 'Operations',
            status: sItem.status || 'active',
            isActive: sItem.is_active,
            createdAt: sItem.created_at
              ? new Date(sItem.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Active',
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
          branchName: u.organizationName || 'Main Office',
          department: 'Operations',
          status: 'active',
          isActive: true,
          createdAt: 'Active',
        }));
      }

      setStaffList(mappedStaff);
      setRolesList(remoteRoles && remoteRoles.length > 0 ? remoteRoles : [
        { id: 'role-1', name: 'Company Admin', slug: 'company_admin' },
        { id: 'role-2', name: 'Branch Manager', slug: 'branch_manager' },
        { id: 'role-3', name: 'Billing Operator', slug: 'billing_operator' },
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
    const matchesStatus = selectedStatusFilter === 'ALL' || item.status === selectedStatusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const openCreate = () => {
    const defaultRole = rolesList.length > 0 ? rolesList[0] : null;
    const defaultBranch = branchesList.length > 0 ? branchesList[0] : null;

    setForm({
      ...EMPTY_STAFF,
      role_id: defaultRole ? defaultRole.id : '',
      role: defaultRole ? defaultRole.name : 'Staff',
      branch_id: defaultBranch ? defaultBranch.id : '',
      branchName: defaultBranch ? defaultBranch.name : 'Main Office',
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
          console.warn('API creation fallback:', apiErr.message);
        }

        const newId = `usr-${Date.now()}`;
        await dbRun(
          `INSERT OR REPLACE INTO users (id, email, name, organizationName, phone, role, password) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [newId, form.email.trim(), form.name.trim(), form.branchName || 'Main Office', form.phone.trim(), form.role || 'Staff', 'demo123']
        ).catch(() => {});

        showToast(`Staff member "${form.name}" enrolled successfully!`);
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
          console.warn('API update fallback:', apiErr.message);
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
          <h1 className={s.pageTitle}>Staff & Operators</h1>
          <p className={s.pageSubtitle}>
            Manage corporate team members, branches, and system privileges
          </p>
        </div>

        <button onClick={openCreate} className={`${s.btn} ${s.btnPrimary}`}>
          <Plus size={16} />
          <span>Add Staff</span>
        </button>
      </div>

      {/* Table Container */}
      <div className={s.tableContainer}>
        {/* Toolbar */}
        <div className={s.tableToolbar}>
          <div className={s.searchWrap} style={{ maxWidth: '340px', flex: '1' }}>
            <Search size={16} className={s.searchIcon} />
            <input
              type="text"
              placeholder="Search staff by name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={s.searchInput}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className={s.select}
              style={{ minWidth: '140px' }}
            >
              <option value="ALL">All Roles</option>
              {rolesList.map((r) => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className={s.select}
              style={{ minWidth: '130px' }}
            >
              <option value="ALL">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Role & Access</th>
                <th>Branch / Location</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
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
                  <tr key={staff.id}>
                    {/* Name & Avatar */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, rgba(0, 184, 230, 0.15), rgba(56, 189, 248, 0.25))',
                          border: '1px solid rgba(0, 184, 230, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#0088bb',
                          fontWeight: '700',
                          fontSize: '0.9rem',
                        }}>
                          {staff.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: '#0f172a' }}>{staff.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{staff.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        background: '#e0f7fc',
                        color: '#007fa3',
                        border: '1px solid #b9eef8',
                      }}>
                        <Shield size={12} />
                        {staff.role}
                      </span>
                    </td>

                    {/* Branch */}
                    <td style={{ color: '#334155', fontWeight: '500' }}>
                      {staff.branchName}
                    </td>

                    {/* Status */}
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '3px 9px',
                        borderRadius: '999px',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        background: staff.status === 'active' ? '#ecfdf5' : '#fef2f2',
                        color: staff.status === 'active' ? '#059669' : '#dc2626',
                        border: staff.status === 'active' ? '1px solid #a7f3d0' : '1px solid #fecaca',
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: staff.status === 'active' ? '#10b981' : '#ef4444',
                        }} />
                        {staff.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => openEdit(staff)}
                          className={s.actionBtn}
                          title="Edit profile"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(staff)}
                          className={`${s.actionBtn} ${s.actionBtnDelete}`}
                          title="Delete staff"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className={s.modalOverlay}>
          <div className={s.modalContent} style={{ maxWidth: '560px' }}>
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
                  <UserCheck size={18} />
                </div>
                <span>{formMode === 'create' ? 'Add New Staff Member' : `Edit Profile: ${form.name || 'Staff'}`}</span>
              </h2>
              <button onClick={() => setShowModal(false)} className={s.modalClose}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className={s.label}>Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Admin Director"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={s.input}
                    style={errors.name ? { borderColor: '#ef4444' } : {}}
                  />
                  {errors.name && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{errors.name}</span>}
                </div>

                <div>
                  <label className={s.label}>Email Address *</label>
                  <input
                    type="email"
                    placeholder="admin@pip.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={s.input}
                    style={errors.email ? { borderColor: '#ef4444' } : {}}
                  />
                  {errors.email && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{errors.email}</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className={s.label}>Phone Number</label>
                  <input
                    type="text"
                    placeholder="0300-1234567"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={s.input}
                  />
                </div>

                <div>
                  <label className={s.label}>Department / Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Director"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className={s.input}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className={s.label}>System Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className={s.select}
                    style={{ width: '100%' }}
                  >
                    {rolesList.map((r) => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={s.label}>Branch Assignment</label>
                  <select
                    value={form.branchName}
                    onChange={(e) => setForm({ ...form, branchName: e.target.value })}
                    className={s.select}
                    style={{ width: '100%' }}
                  >
                    <option value="Main Office">Main Office</option>
                    {branchesList.map((b) => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={s.modalActions} style={{ margin: '8px -24px -24px -24px', padding: '16px 24px', background: '#f8fcfe', borderTop: '1px solid #f1f5f9' }}>
                <button type="button" onClick={() => setShowModal(false)} className={`${s.btn} ${s.btnSecondary}`}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className={`${s.btn} ${s.btnPrimary}`}>
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
