import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Zap, CheckCircle2 } from 'lucide-react';
import s from '../styles/page.module.css';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email address is required.'); return; }
    if (!validateEmail(email.trim())) { setError('Enter a valid email address.'); return; }
    setError('');
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSubmitted(true);
    setIsSubmitting(false);
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

      {/* Transparent Form Container (Shifted Left & Balanced Width) */}
      <div
        className={s.authFormContainer}
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: 'min(420px, 92vw)',
          marginRight: 'max(13vw, 60px)',
          padding: 0,
          background: 'transparent',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        {/* Back Link */}
        <div style={{ marginBottom: 16 }}>
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: '#38CDF4',
              fontSize: 12.5,
              fontWeight: 700,
              textDecoration: 'none',
              padding: '4px 10px',
              borderRadius: 8,
              background: 'rgba(8, 182, 232, 0.12)',
              border: '1px solid rgba(8, 182, 232, 0.28)',
              transition: 'all 0.2s ease',
              textShadow: '0 1px 4px rgba(0,0,0,0.8)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(8, 182, 232, 0.28)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(8, 182, 232, 0.12)';
              e.currentTarget.style.color = '#38CDF4';
            }}
          >
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 20 }}>
          <h2
            style={{
              fontSize: 'clamp(1.6rem, 2.2vw, 2rem)',
              fontWeight: 700,
              color: '#ffffff',
              margin: '0 0 5px',
              letterSpacing: '-0.03em',
              textShadow: '0 2px 12px rgba(0,0,0,0.95)',
            }}
          >
            Reset Password
          </h2>
          <p
            style={{
              fontSize: '13.5px',
              color: '#f1f5f9',
              margin: 0,
              textShadow: '0 2px 10px rgba(0,0,0,0.95)',
            }}
          >
            Enter your account email to receive recovery instructions
          </p>
        </div>

        {isSubmitted ? (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1.5px solid #10b981',
              borderRadius: 12,
              padding: '18px 20px',
              backdropFilter: 'blur(12px)',
              color: '#ffffff',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#34d399', fontWeight: 700, fontSize: 15 }}>
              <CheckCircle2 size={18} />
              <span>Recovery Link Dispatched</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#e2e8f0', lineHeight: 1.5 }}>
              If an active organization account matches <strong>{email}</strong>, a secure password reset link has been dispatched to your inbox.
            </p>
            <div style={{ marginTop: 16 }}>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 18px',
                  borderRadius: 8,
                  background: 'var(--grad-cyan-button)',
                  border: '1px solid var(--color-accent)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: 'none',
                  boxShadow: 'var(--shadow-cyan)',
                }}
              >
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                Account Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: 14,
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
                    height: 44,
                    fontSize: 13.5,
                    fontWeight: 500,
                    background: focusedField === 'email' ? 'rgba(15, 23, 42, 0.88)' : 'rgba(15, 23, 42, 0.65)',
                    border: focusedField === 'email' ? '1.5px solid var(--color-accent)' : '1px solid rgba(255, 255, 255, 0.45)',
                    color: '#ffffff',
                    borderRadius: 9,
                    boxShadow: focusedField === 'email' ? '0 0 16px rgba(0, 184, 230, 0.4)' : '0 3px 10px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                  }}
                  placeholder="name@organization.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  autoComplete="email"
                />
              </div>
              {error && (
                <span className={s.fieldError} style={{ color: '#fca5a5', fontSize: 11.5, marginTop: 3, display: 'block', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                  {error}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`${s.btn} ${s.btnPrimary}`}
              style={{
                width: '100%',
                height: 44,
                fontSize: 14,
                fontWeight: 700,
                justifyContent: 'center',
                marginTop: 4,
                background: 'var(--grad-cyan-button)',
                borderColor: 'var(--color-accent)',
                boxShadow: 'var(--shadow-cyan)',
                borderRadius: 9,
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                color: '#ffffff',
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? <><span className={s.spinner} /> Sending Recovery Link...</> : 'Send Recovery Link'}
            </button>
          </form>
        )}

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
