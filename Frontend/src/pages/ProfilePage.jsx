import { useEffect, useState } from 'react';
import { User, Lock, Save, Edit2 } from 'lucide-react';
import { dbSelectOne, dbRun } from '../db/database';
import { useAuth } from '../context/AuthContext';
import s from '../styles/page.module.css';

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [profileAlert, setProfileAlert] = useState(null);
  const [saving, setSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwAlert, setPwAlert] = useState(null);
  const [pwSaving, setPwSaving] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    const dbUser = await dbSelectOne(`SELECT * FROM users WHERE id = ?`, [user?.id || '1']);
    if (dbUser) {
      setProfile(dbUser);
      setForm({ name: dbUser.name, phone: dbUser.phone || '', email: dbUser.email });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setProfileAlert(null);
    try {
      await dbRun(`UPDATE users SET name = ?, phone = ? WHERE id = ?`, [form.name.trim(), form.phone.trim(), profile.id]);
      const updated = { ...profile, name: form.name.trim(), phone: form.phone.trim() };
      setProfile(updated);
      updateUser({ ...user, name: form.name.trim(), phone: form.phone.trim() });
      setEditing(false);
      setProfileAlert({ type: 'success', message: 'Profile updated successfully in SQLite database.' });
    } catch (err) {
      setProfileAlert({ type: 'error', message: err?.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    const next = {};
    if (!pwForm.currentPassword) next.currentPassword = 'Current password is required.';
    if (!pwForm.newPassword || pwForm.newPassword.length < 8) next.newPassword = 'Password must be at least 8 characters.';
    if (pwForm.newPassword !== pwForm.confirm) next.confirm = 'Passwords do not match.';
    if (Object.keys(next).length) { setPwErrors(next); return; }

    setPwSaving(true);
    setPwAlert(null);
    try {
      const dbUser = await dbSelectOne(`SELECT password FROM users WHERE id = ?`, [profile.id]);
      if (!dbUser || dbUser.password !== pwForm.currentPassword) {
        setPwAlert({ type: 'error', message: 'Current password entered is incorrect.' });
        setPwSaving(false);
        return;
      }

      await dbRun(`UPDATE users SET password = ?, mustResetPassword = 0 WHERE id = ?`, [pwForm.newPassword, profile.id]);
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      setPwAlert({ type: 'success', message: 'Password updated successfully in SQLite database.' });
    } catch (err) {
      setPwAlert({ type: 'error', message: err?.message || 'Failed to update password.' });
    } finally {
      setPwSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className={s.loadingWrap}>
        <span className={`${s.spinner} ${s.spinnerDark}`} />
        <p>Loading user profile...</p>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>User Profile</h1>
          <p className={s.pageSubtitle}>Manage personal credentials, contact info, and security credentials</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28, alignItems: 'start' }}>
        <div className={s.card}>
          <p className={s.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={16} /> Personal Information
          </p>
          {profileAlert && <div className={`${s.alert} ${profileAlert.type === 'success' ? s.alertSuccess : s.alertError}`} style={{ marginBottom: 20 }}>{profileAlert.message}</div>}
          <form className={s.form} onSubmit={saveProfile}>
            <div className={s.field}>
              <label className={s.label}>Full Name</label>
              <input className={s.input} value={form.name} onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setProfileAlert(null); }} disabled={!editing} />
            </div>
            <div className={s.field}>
              <label className={s.label}>Email Address</label>
              <input className={s.input} value={form.email} disabled style={{ opacity: 0.6 }} />
            </div>
            <div className={s.field}>
              <label className={s.label}>Phone Number</label>
              <input className={s.input} value={form.phone} onChange={(e) => { setForm((p) => ({ ...p, phone: e.target.value })); setProfileAlert(null); }} disabled={!editing} placeholder="+92 300 0000000" />
            </div>
            <div className={s.field}>
              <label className={s.label}>Assigned System Role</label>
              <input className={s.input} value={profile?.role ?? '—'} disabled style={{ opacity: 0.6 }} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              {editing ? (
                <>
                  <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
                    {saving ? <><span className={s.spinner} /> Saving...</> : <><Save size={16} /> Save Changes</>}
                  </button>
                  <button type="button" className={`${s.btn} ${s.btnSecondary}`} onClick={() => setEditing(false)}>Cancel</button>
                </>
              ) : (
                <button type="button" className={`${s.btn} ${s.btnSecondary}`} onClick={() => setEditing(true)}><Edit2 size={16} /> Edit Profile</button>
              )}
            </div>
          </form>
        </div>

        <div className={s.card}>
          <p className={s.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={16} /> Change Password
          </p>
          {pwAlert && <div className={`${s.alert} ${pwAlert.type === 'success' ? s.alertSuccess : s.alertError}`} style={{ marginBottom: 20 }}>{pwAlert.message}</div>}
          <form className={s.form} onSubmit={savePassword}>
            <div className={s.field}>
              <label className={s.label}>Current Password</label>
              <input type="password" className={`${s.input} ${pwErrors.currentPassword ? s.inputError : ''}`}
                value={pwForm.currentPassword} onChange={(e) => { setPwForm((p) => ({ ...p, currentPassword: e.target.value })); setPwErrors({}); setPwAlert(null); }} placeholder="••••••••" />
              {pwErrors.currentPassword && <span className={s.fieldError}>{pwErrors.currentPassword}</span>}
            </div>
            <div className={s.field}>
              <label className={s.label}>New Password</label>
              <input type="password" className={`${s.input} ${pwErrors.newPassword ? s.inputError : ''}`}
                value={pwForm.newPassword} onChange={(e) => { setPwForm((p) => ({ ...p, newPassword: e.target.value })); setPwErrors({}); setPwAlert(null); }} placeholder="At least 8 characters" />
              {pwErrors.newPassword && <span className={s.fieldError}>{pwErrors.newPassword}</span>}
            </div>
            <div className={s.field}>
              <label className={s.label}>Confirm New Password</label>
              <input type="password" className={`${s.input} ${pwErrors.confirm ? s.inputError : ''}`}
                value={pwForm.confirm} onChange={(e) => { setPwForm((p) => ({ ...p, confirm: e.target.value })); setPwErrors({}); setPwAlert(null); }} placeholder="Re-enter new password" />
              {pwErrors.confirm && <span className={s.fieldError}>{pwErrors.confirm}</span>}
            </div>
            <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={pwSaving} style={{ marginTop: 8 }}>
              {pwSaving ? <><span className={s.spinner} /> Updating Password...</> : <><Lock size={16} /> Update Password</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
