import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Shield, CheckCircle2, Users, AlertCircle, Building2, Mail, Phone, UserCheck, UserPlus } from 'lucide-react';
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
      setRolesList(Array.isArray(remoteRoles) ? remoteRoles : []);
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
      (item.branchName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.department || '').toLowerCase().includes(searchTerm.toLowerCase());
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
          if (apiErr.message && apiErr.message.toLowerCase().includes('already exists')) {
            setErrors({ email: 'A user with this email address already exists.' });
            showToast('A user with this email already exists!', true);
            setSaving(false);
            return;
          }
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

      {/* Filter Toolbar (Exact Same Structure as BillsPage) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 0',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 12,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, minWidth: 280 }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--color-text-muted)' }} />
            <input
              className={s.input}
              style={{ paddingLeft: 36, height: 38, fontSize: 13 }}
              placeholder="Search staff by name, email, branch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className={s.select}
            style={{ width: 160, height: 38, fontSize: 13 }}
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
          >
            <option value="ALL">All Roles</option>
            {rolesList.map((r) => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>

          <select
            className={s.select}
            style={{ width: 140, height: 38, fontSize: 13 }}
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {(selectedRoleFilter !== 'ALL' || selectedStatusFilter !== 'ALL' || searchTerm) && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {selectedRoleFilter !== 'ALL' && (
              <span className={s.chip}>
                Role: {selectedRoleFilter}
                <X size={12} className={s.chipRemove} onClick={() => setSelectedRoleFilter('ALL')} />
              </span>
            )}
            {selectedStatusFilter !== 'ALL' && (
              <span className={s.chip}>
                Status: {selectedStatusFilter}
                <X size={12} className={s.chipRemove} onClick={() => setSelectedStatusFilter('ALL')} />
              </span>
            )}
            <button
              className={`${s.btn} ${s.btnSecondary}`}
              style={{ padding: '4px 8px', fontSize: 11 }}
              onClick={() => { setSelectedRoleFilter('ALL'); setSelectedStatusFilter('ALL'); setSearchTerm(''); }}
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Empty State OR Data Table (Exact Same as BillsPage) */}
      {filteredStaff.length === 0 && !loading ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            textAlign: 'center',
            background: 'transparent',
          }}
        >
          <div
            className={s.emptyStateBadge}
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: 'var(--color-accent-soft)',
              border: '1.5px solid var(--color-accent-border)',
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Users size={30} />
          </div>

          <h3
            style={{
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--color-text)',
              margin: '0 0 6px',
              fontFamily: 'var(--font-heading)',
            }}
          >
            No Staff Members Found
          </h3>

          <p
            style={{
              fontSize: 13.5,
              color: 'var(--color-text-muted)',
              maxWidth: 440,
              margin: '0 0 20px',
              lineHeight: 1.55,
            }}
          >
            Click below to enroll your corporate operators and assign system privileges.
          </p>

          <button className={`${s.btn} ${s.btnPrimary}`} style={{ padding: '10px 22px', fontSize: 13 }} onClick={openCreate}>
            <Plus size={16} /> Add First Staff Member
          </button>
        </div>
      ) : (
        <div className={s.tableContainer} style={{ background: '#ffffff', borderRadius: 14, border: '1px solid var(--color-border)' }}>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th style={{ width: '28%' }}>Staff Member</th>
                  <th style={{ width: '20%' }}>Role & Access</th>
                  <th style={{ width: '20%' }}>Branch / Location</th>
                  <th style={{ width: '16%' }}>Department</th>
                  <th style={{ width: '8%' }}>Status</th>
                  <th style={{ width: '8%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      Loading staff members...
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => (
                    <tr key={staff.id}>
                      {/* Name & Avatar */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, rgba(0, 184, 230, 0.12), rgba(56, 189, 248, 0.2))',
                            border: '1px solid rgba(0, 184, 230, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0088bb',
                            fontWeight: '800',
                            fontSize: '0.85rem',
                            flexShrink: 0,
                          }}>
                            {staff.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#0f172a' }}>{staff.name}</div>
                            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '1px' }}>{staff.email}</div>
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
                      <td style={{ color: '#334155', fontWeight: '500', fontSize: '13px' }}>
                        {staff.branchName}
                      </td>

                      {/* Department / Designation */}
                      <td style={{ color: '#64748b', fontSize: '12.5px', fontWeight: '500' }}>
                        {staff.department}
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
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(staff)}
                            className={`${s.actionBtn} ${s.actionBtnDelete}`}
                            title="Delete staff"
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

          {/* Integrated Pagination Footer */}
          <div className={s.tablePagination}>
            <span>Showing 1 to {filteredStaff.length} of {filteredStaff.length} staff members</span>
            <div className={s.pageButtons}>
              <button className={s.pageBtn} disabled>Previous</button>
              <button className={`${s.pageBtn} ${s.pageBtnActive}`}>1</button>
              <button className={s.pageBtn} disabled>Next</button>
            </div>
          </div>
        </div>
      )}

      {/* Exact Same Modal Structure as Bills Page */}
      {showModal && (
        <div className={s.modalBackdrop} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className={s.modal} style={{ maxWidth: 640 }}>
            <div className={s.modalHeader}>
              <span className={s.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <UserCheck size={20} color="var(--color-accent)" />
                {formMode === 'create' ? 'Add New Corporate Staff Member' : `Edit Staff Profile: ${form.name || 'Staff'}`}
              </span>
              <button className={s.modalClose} onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className={s.modalBody}>
                <div className={s.form}>
                  <div className={s.formRow}>
                    <div className={s.field}>
                      <label className={s.label}>Full Name *</label>
                      <input
                        className={`${s.input} ${errors.name ? s.inputError : ''}`}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Admin Director"
                      />
                      {errors.name && <span className={s.fieldError}>{errors.name}</span>}
                    </div>
                    <div className={s.field}>
                      <label className={s.label}>Email Address *</label>
                      <input
                        type="email"
                        className={`${s.input} ${errors.email ? s.inputError : ''}`}
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="admin@pip.com"
                      />
                      {errors.email && <span className={s.fieldError}>{errors.email}</span>}
                    </div>
                  </div>

                  <div className={s.formRow}>
                    <div className={s.field}>
                      <label className={s.label}>Phone Number</label>
                      <input
                        className={s.input}
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="0300-1234567"
                      />
                    </div>
                    <div className={s.field}>
                      <label className={s.label}>Department / Designation</label>
                      <input
                        className={s.input}
                        value={form.department}
                        onChange={(e) => setForm({ ...form, department: e.target.value })}
                        placeholder="Director / Operations"
                      />
                    </div>
                  </div>

                  <div className={s.formRow}>
                    <div className={s.field}>
                      <label className={s.label}>System Role *</label>
                      <select
                        className={s.select}
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                      >
                        {rolesList.map((r) => (
                          <option key={r.id} value={r.name}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className={s.field}>
                      <label className={s.label}>Branch Assignment</label>
                      <select
                        className={s.select}
                        value={form.branchName}
                        onChange={(e) => setForm({ ...form, branchName: e.target.value })}
                      >
                        <option value="Main Office">Main Office</option>
                        {branchesList.map((br) => (
                          <option key={br.id} value={br.name}>{br.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className={s.modalFooter}>
                <button type="button" className={`${s.btn} ${s.btnSecondary}`} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
                  {saving ? 'Saving...' : formMode === 'create' ? 'Save & Enroll Staff' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
