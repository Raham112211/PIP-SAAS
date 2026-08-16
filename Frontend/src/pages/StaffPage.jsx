import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Shield, CheckCircle2, Users, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import { dbSelect } from '../db/database';
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
      const [staffData, rolesData, branchRows] = await Promise.all([
        userService.getStaff().catch((err) => {
          console.warn('User service staff load failed:', err);
          return { items: [] };
        }),
        userService.getRoles().catch((err) => {
          console.warn('User service roles load failed:', err);
          return [];
        }),
        dbSelect(`SELECT * FROM branches ORDER BY name ASC`).catch(() => []),
      ]);

      const mappedStaff = (staffData.items || []).map((sItem) => {
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

      setStaffList(mappedStaff);
      setRolesList(rolesData || []);
      setBranchesList(branchRows || []);
    } catch (err) {
      showToast(`Error loading data: ${err.message}`, true);
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
          designation: form.department.trim(),
        };

        await userService.createStaff(payload);
        showToast(`Staff member "${form.name}" enrolled successfully!`);
        setShowModal(false);
        loadData(false);
      } else {
        const payload = {
          full_name: form.name.trim(),
          phone: form.phone.trim(),
          role_id: form.role_id || undefined,
          branch_ids: form.branch_id ? [form.branch_id] : [],
          designation: form.department.trim(),
          is_active: form.status === 'active',
        };

        await userService.updateStaff(selectedStaff.id, payload);
        showToast(`Profile for "${form.name}" updated successfully.`);
        setShowModal(false);
        loadData(false);
      }
    } catch (err) {
      showToast(`Action failed: ${err.message}`, true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (staff) => {
    if (!window.confirm(`Are you sure you want to remove staff account for "${staff.name}"?`)) return;
    try {
      await userService.deleteStaff(staff.id);
      showToast(`Staff account for "${staff.name}" has been removed.`);
      loadData(false);
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, true);
    }
  };

  return (
    <div className={s.page}>
      {toast && (
        <div className={`${s.alert} ${toast.isError ? s.alertError : s.alertSuccess}`} style={{ marginBottom: 16 }}>
          <CheckCircle2 size={16} />
          <span>{toast.message || toast}</span>
        </div>
      )}

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>Staff Directory</h1>
          <p className={s.pageSubtitle}>Manage staff profiles, role allocations, branches, and account permissions</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className={`${s.btn} ${s.btnSecondary}`} onClick={() => navigate('/roles')}>
            <Shield size={15} /> Manage Roles
          </button>
          <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={openCreate}>
            <Plus size={16} /> Add Staff
          </button>
        </div>
      </div>

      {/* Filter Toolbar (Transparent, Clean) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 0',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, minWidth: 280, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 320 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--color-text-muted)' }} />
            <input
              className={s.input}
              style={{ paddingLeft: 36, height: 38, fontSize: 13 }}
              placeholder="Search staff by name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className={s.select}
            style={{ width: 140, height: 38, fontSize: 13 }}
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
            style={{ width: 150, height: 38, fontSize: 13 }}
            value={selectedBranchFilter}
            onChange={(e) => setSelectedBranchFilter(e.target.value)}
          >
            <option value="ALL">All Branches</option>
            {branchesList.map((b) => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>

          <select
            className={s.select}
            style={{ width: 120, height: 38, fontSize: 13 }}
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Staff Table / Empty State */}
      {filteredStaff.length === 0 ? (
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

          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px', fontFamily: 'var(--font-heading)' }}>
            No Staff Members Found
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--color-text-muted)', maxWidth: 400, margin: '0 0 18px', lineHeight: 1.5 }}>
            No staff records match your current filter criteria or directory is empty.
          </p>
          <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={openCreate}>
            <Plus size={15} /> Add First Staff Member
          </button>
        </div>
      ) : (
        <div className={s.tableContainer} style={{ background: '#ffffff', borderRadius: 14, border: '1px solid var(--color-border)' }}>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th>Branch</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((staff) => (
                  <tr key={staff.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: 'var(--color-accent-soft)',
                            color: 'var(--color-accent-dark)',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12.5,
                            border: '1px solid var(--color-accent-border)',
                          }}
                        >
                          {staff.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{staff.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{staff.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${s.badge} ${s.badgeWarning}`}>
                        {staff.role}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-text)', fontWeight: 500 }}>{staff.branchName}</td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: 12.5 }}>{staff.department}</td>
                    <td>
                      <span className={`${s.badge} ${staff.status === 'active' ? s.badgeActive : s.badgeInactive}`}>
                        <span className={s.badgeDot} />
                        {staff.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button className={`${s.btn} ${s.btnSecondary}`} style={{ padding: '5px 9px', fontSize: 12 }} onClick={() => openEdit(staff)} title="Edit profile">
                          <Edit2 size={13} />
                        </button>
                        <button className={`${s.btn} ${s.btnDanger}`} style={{ padding: '5px 9px', fontSize: 12 }} onClick={() => handleDelete(staff)} title="Remove staff">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff Enrollment & Edit Modal */}
      {showModal && (
        <div className={s.modalBackdrop} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className={s.modal} style={{ maxWidth: 580 }}>
            <div className={s.modalHeader}>
              <span className={s.modalTitle}>
                {formMode === 'create' ? 'Enroll New Staff Member' : `Edit Profile: ${selectedStaff?.name}`}
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
                        placeholder="Enter full name"
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
                        placeholder="name@organization.com"
                        disabled={formMode === 'edit'}
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
                        placeholder="e.g. Accounts, Operations"
                      />
                    </div>
                  </div>

                  <div className={s.formRow}>
                    <div className={s.field}>
                      <label className={s.label}>System Role</label>
                      <select
                        className={s.select}
                        value={form.role_id}
                        onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                      >
                        {rolesList.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className={s.field}>
                      <label className={s.label}>Branch Assignment</label>
                      <select
                        className={s.select}
                        value={form.branch_id}
                        onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                      >
                        <option value="">Unassigned</option>
                        {branchesList.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className={s.modalFooter}>
                <button type="button" className={`${s.btn} ${s.btnSecondary}`} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
                  {saving ? 'Saving...' : formMode === 'create' ? 'Enroll Staff' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
