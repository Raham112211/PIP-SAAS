import { useState, useRef } from 'react';
import { Eye, EyeOff, Lock, Mail, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import s from '../styles/page.module.css';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const videoRef = useRef(null);

  const onChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined, form: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.email.trim()) next.email = 'Email address is required.';
    else if (!validateEmail(form.email.trim())) next.email = 'Enter a valid email address.';
    if (!form.password) next.password = 'Password is required.';
    else if (form.password.length < 8) next.password = 'Password must be at least 8 characters.';
    if (Object.keys(next).length) { setErrors(next); return; }

    setIsSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
    } catch {
      setErrors({ form: "Invalid email or password. Please try again." });
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
      {/* 100% Uncropped Ambient Video Background */}
      <video
        ref={videoRef}
        src="/Login-Video.mp4"
        autoPlay
        muted
        playsInline
        onEnded={(e) => {
          e.target.pause();
        }}
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
          border: '1.5px solid var(--color-accent)',
          borderRadius: 999,
          color: '#ffffff',
          fontSize: 12,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.9), 0 0 15px rgba(0, 184, 230, 0.4)',
        }}
      >
        <Zap size={15} color="var(--color-accent)" />
        <span>PIP Utility Engine • V2.0 Enterprise</span>
      </div>

      {/* Transparent Spacious Form */}
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
        {/* High-Res Extracted Logo & Typography */}
        <div style={{ marginBottom: 24, display: 'inline-flex', alignItems: 'center', gap: 14 }}>
          <img
            src="/pip-icon.png"
            alt="PIP"
            style={{
              height: 52,
              width: 'auto',
              maxHeight: 52,
              objectFit: 'contain',
              display: 'block',
              filter: 'drop-shadow(0 4px 16px rgba(8, 182, 232, 0.5))',
            }}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/Logo-cropped.png'; }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.1, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
              PIP <span style={{ fontSize: 13, color: '#38CDF4', fontWeight: 800, background: 'rgba(8,182,232,0.2)', border: '1px solid rgba(8,182,232,0.4)', padding: '1px 6px', borderRadius: 4 }}>V2.0</span>
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#38CDF4', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 3 }}>
              Power Intelligence Platform
            </span>
          </div>
        </div>

        {/* Form Title */}
        <div style={{ marginBottom: 24 }}>
          <h2
            style={{
              fontSize: 'clamp(1.8rem, 2.5vw, 2.3rem)',
              fontWeight: 700,
              color: '#ffffff',
              margin: '0 0 6px',
              letterSpacing: '-0.03em',
              textShadow: '0 2px 12px rgba(0,0,0,0.95)',
            }}
          >
            Welcome Back
          </h2>
          <p
            style={{
              fontSize: 'clamp(13px, 1vw, 15px)',
              color: '#f1f5f9',
              margin: 0,
              textShadow: '0 2px 10px rgba(0,0,0,0.95)',
            }}
          >
            Sign in to access your organization portal
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
              boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
            }}
          >
            {errors.form}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Email Field */}
          <div className={s.field}>
            <label
              className={s.label}
              style={{
                color: '#ffffff',
                fontSize: 12.5,
                fontWeight: 600,
                marginBottom: 5,
                display: 'block',
                textShadow: '0 2px 8px rgba(0,0,0,0.95)',
              }}
            >
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: 13,
                  color: focusedField === 'email' ? 'var(--color-accent)' : '#ffffff',
                  transition: 'color 0.3s ease',
                }}
              />
              <input
                type="email"
                className={s.input}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                style={{
                  paddingLeft: 42,
                  height: 42,
                  fontSize: 13.5,
                  fontWeight: 500,
                  background: focusedField === 'email' ? 'rgba(15, 23, 42, 0.88)' : 'rgba(15, 23, 42, 0.65)',
                  border: focusedField === 'email' ? '2px solid var(--color-accent)' : '1.5px solid rgba(255, 255, 255, 0.45)',
                  color: '#ffffff',
                  borderRadius: 9,
                  boxShadow: focusedField === 'email' ? '0 0 16px rgba(0, 184, 230, 0.4)' : '0 3px 10px rgba(0,0,0,0.3)',
                  transition: 'all 0.25s ease',
                  outline: 'none',
                }}
                placeholder="name@organization.com"
                value={form.email}
                onChange={(e) => onChange('email', e.target.value)}
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <span className={s.fieldError} style={{ color: '#fca5a5', fontSize: 11.5, marginTop: 3, display: 'block', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                {errors.email}
              </span>
            )}
          </div>

          {/* Password Field */}
          <div className={s.field}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <label
                className={s.label}
                style={{ color: '#ffffff', fontSize: 12.5, fontWeight: 600, textShadow: '0 2px 8px rgba(0,0,0,0.95)' }}
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: 12,
                  color: 'var(--color-accent)',
                  fontWeight: 700,
                  textDecoration: 'none',
                  textShadow: '0 1px 6px rgba(0,0,0,0.95)',
                }}
              >
                Forgot password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: 13,
                  color: focusedField === 'password' ? 'var(--color-accent)' : '#ffffff',
                  transition: 'color 0.3s ease',
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                className={s.input}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                style={{
                  paddingLeft: 42,
                  paddingRight: 42,
                  height: 42,
                  fontSize: 13.5,
                  fontWeight: 500,
                  background: focusedField === 'password' ? 'rgba(15, 23, 42, 0.88)' : 'rgba(15, 23, 42, 0.65)',
                  border: focusedField === 'password' ? '2px solid var(--color-accent)' : '1.5px solid rgba(255, 255, 255, 0.45)',
                  color: '#ffffff',
                  borderRadius: 9,
                  boxShadow: focusedField === 'password' ? '0 0 16px rgba(0, 184, 230, 0.4)' : '0 3px 10px rgba(0,0,0,0.3)',
                  transition: 'all 0.25s ease',
                  outline: 'none',
                }}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => onChange('password', e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: 13,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#ffffff',
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <span className={s.fieldError} style={{ color: '#fca5a5', fontSize: 11.5, marginTop: 3, display: 'block', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                {errors.password}
              </span>
            )}
          </div>

          {/* Glowing Animated Submit Button */}
          <button
            type="submit"
            className={`${s.btn} ${s.btnPrimary}`}
            style={{
              width: '100%',
              height: 42,
              fontSize: 14,
              fontWeight: 700,
              justifyContent: 'center',
              marginTop: 4,
              background: 'var(--grad-cyan-button)',
              borderColor: 'var(--color-accent)',
              boxShadow: 'var(--shadow-cyan)',
              borderRadius: 9,
              transition: 'all 0.25s ease',
              cursor: 'pointer',
              color: '#ffffff',
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? <><span className={s.spinner} /> Signing In...</> : 'Sign In to Portal'}
          </button>
        </form>

        {/* Footer Note */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 22,
            fontSize: 11.5,
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
