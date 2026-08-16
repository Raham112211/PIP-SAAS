import { useState } from 'react';
import { Eye, EyeOff, Lock, Zap, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import s from '../styles/page.module.css';

export function FirstLoginResetPage() {
  const { updateUser, user } = useAuth();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const onChange = (field, val) => {
    setForm((p) => ({ ...p, [field]: val }));
    setErrors((p) => ({ ...p, [field]: undefined, form: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.password || form.password.length < 8) next.password = 'Password must be at least 8 characters.';
    if (form.password !== form.confirm) next.confirm = 'Passwords do not match.';
    if (Object.keys(next).length) { setErrors(next); return; }

    setIsSubmitting(true);
    try {
      await updateUser({ ...user, mustResetPassword: false });
    } catch {
      setErrors({ form: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#090d16',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        boxSizing: 'border-box',
      }}
    >
      {/* 100% Video Background */}
      <video
        src="/Login-Video.mp4"
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'fill',
          zIndex: 1,
        }}
      />

      {/* Floating Brand Badge */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          zIndex: 20,
          padding: '8px 18px',
          background: 'rgba(15, 23, 42, 0.96)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid #f97316',
          borderRadius: 999,
          color: '#ffffff',
          fontSize: 12,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.9), 0 0 15px rgba(249, 115, 22, 0.5)',
        }}
      >
        <Zap size={15} color="#f97316" />
        <span>PIP Utility Engine • V2.0 Enterprise</span>
      </div>

      {/* Right-Aligned Spacious Form Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: 'min(480px, 92vw)',
          marginRight: 'max(7vw, 30px)',
          padding: 0,
          background: 'transparent',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        {/* Title */}
        <div style={{ marginBottom: 28 }}>
          <h2
            style={{
              fontSize: 'clamp(1.8rem, 2.5vw, 2.4rem)',
              fontWeight: 700,
              color: '#ffffff',
              margin: '0 0 8px',
              letterSpacing: '-0.03em',
              textShadow: '0 2px 12px rgba(0,0,0,0.95)',
            }}
          >
            First Time Setup
          </h2>
          <p
            style={{
              fontSize: 'clamp(13.5px, 1.1vw, 15px)',
              color: '#f1f5f9',
              margin: 0,
              textShadow: '0 2px 10px rgba(0,0,0,0.95)',
            }}
          >
            Please set a permanent password for your organization account
          </p>
        </div>

        {errors.form && (
          <div
            className={`${s.alert} ${s.alertDanger}`}
            style={{
              marginBottom: 18,
              background: 'rgba(239, 68, 68, 0.6)',
              borderColor: 'rgba(239, 68, 68, 0.9)',
              color: '#ffffff',
              fontSize: 13.5,
              borderRadius: 12,
              padding: '12px 16px',
            }}
          >
            {errors.form}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* New Password */}
          <div className={s.field}>
            <label
              className={s.label}
              style={{
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 8,
                display: 'block',
                textShadow: '0 2px 8px rgba(0,0,0,0.95)',
              }}
            >
              Permanent Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={20}
                style={{
                  position: 'absolute',
                  left: 16,
                  top: 16,
                  color: focusedField === 'password' ? '#f97316' : '#ffffff',
                  transition: 'color 0.3s ease',
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                className={s.input}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                style={{
                  paddingLeft: 50,
                  paddingRight: 50,
                  height: 52,
                  fontSize: 15,
                  fontWeight: 500,
                  background: focusedField === 'password' ? 'rgba(15, 23, 42, 0.88)' : 'rgba(15, 23, 42, 0.65)',
                  border: focusedField === 'password' ? '2px solid #f97316' : '1.5px solid rgba(255, 255, 255, 0.45)',
                  color: '#ffffff',
                  borderRadius: 14,
                  boxShadow: focusedField === 'password' ? '0 0 20px rgba(249, 115, 22, 0.45)' : '0 4px 14px rgba(0,0,0,0.4)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  outline: 'none',
                }}
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => onChange('password', e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 16, top: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#ffffff', padding: 0 }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <span className={s.fieldError} style={{ color: '#fca5a5', fontSize: 12.5, marginTop: 5, display: 'block', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                {errors.password}
              </span>
            )}
          </div>

          {/* Confirm Password */}
          <div className={s.field}>
            <label
              className={s.label}
              style={{
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 8,
                display: 'block',
                textShadow: '0 2px 8px rgba(0,0,0,0.95)',
              }}
            >
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={20}
                style={{
                  position: 'absolute',
                  left: 16,
                  top: 16,
                  color: focusedField === 'confirm' ? '#f97316' : '#ffffff',
                  transition: 'color 0.3s ease',
                }}
              />
              <input
                type={showConfirm ? 'text' : 'password'}
                className={s.input}
                onFocus={() => setFocusedField('confirm')}
                onBlur={() => setFocusedField(null)}
                style={{
                  paddingLeft: 50,
                  paddingRight: 50,
                  height: 52,
                  fontSize: 15,
                  fontWeight: 500,
                  background: focusedField === 'confirm' ? 'rgba(15, 23, 42, 0.88)' : 'rgba(15, 23, 42, 0.65)',
                  border: focusedField === 'confirm' ? '2px solid #f97316' : '1.5px solid rgba(255, 255, 255, 0.45)',
                  color: '#ffffff',
                  borderRadius: 14,
                  boxShadow: focusedField === 'confirm' ? '0 0 20px rgba(249, 115, 22, 0.45)' : '0 4px 14px rgba(0,0,0,0.4)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  outline: 'none',
                }}
                placeholder="Re-enter your password"
                value={form.confirm}
                onChange={(e) => onChange('confirm', e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ position: 'absolute', right: 16, top: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#ffffff', padding: 0 }}
              >
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirm && (
              <span className={s.fieldError} style={{ color: '#fca5a5', fontSize: 12.5, marginTop: 5, display: 'block', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                {errors.confirm}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`${s.btn} ${s.btnPrimary}`}
            style={{
              width: '100%',
              height: 52,
              fontSize: 16,
              fontWeight: 700,
              justifyContent: 'center',
              marginTop: 6,
              background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
              borderColor: '#f97316',
              boxShadow: '0 8px 25px rgba(249, 115, 22, 0.55)',
              borderRadius: 14,
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              color: '#ffffff',
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? <><span className={s.spinner} /> Setting Password...</> : 'Save Password & Continue'}
          </button>
        </form>

        {/* Footer Note */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 24,
            fontSize: 12,
            color: '#ffffff',
            fontWeight: 500,
            opacity: 0.95,
            textShadow: '0 1px 6px rgba(0,0,0,0.95)',
          }}
        >
          Protected by PIP Enterprise Authentication Engine
        </div>
      </div>
    </div>
  );
}
