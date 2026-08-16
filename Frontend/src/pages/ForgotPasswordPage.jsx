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
      {/* 100% Video Background - Plays exactly once without repeating */}
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
        {/* Back Link */}
        <div style={{ marginBottom: 18 }}>
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: '#f97316',
              fontSize: 13.5,
              fontWeight: 700,
              textDecoration: 'none',
              textShadow: '0 2px 6px rgba(0,0,0,0.9)',
            }}
          >
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>

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
            Reset Password
          </h2>
          <p
            style={{
              fontSize: 'clamp(13.5px, 1.1vw, 15px)',
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
              background: 'rgba(16, 185, 129, 0.25)',
              border: '1.5px solid #10b981',
              borderRadius: 14,
              padding: '20px',
              backdropFilter: 'blur(12px)',
              color: '#ffffff',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, color: '#34d399', fontWeight: 700, fontSize: 16 }}>
              <CheckCircle2 size={20} />
              <span>Recovery Link Dispatched</span>
            </div>
            <p style={{ margin: 0, fontSize: 13.5, color: '#e2e8f0', lineHeight: 1.5 }}>
              If an active organization account matches <strong>{email}</strong>, a secure password reset link has been dispatched to your inbox.
            </p>
            <div style={{ marginTop: 18 }}>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 20px',
                  borderRadius: 10,
                  background: '#10b981',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 13.5,
                  textDecoration: 'none',
                }}
              >
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Email Field */}
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
                Account Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={20}
                  style={{
                    position: 'absolute',
                    left: 16,
                    top: 16,
                    color: focusedField === 'email' ? '#f97316' : '#ffffff',
                    transition: 'color 0.3s ease',
                  }}
                />
                <input
                  type="email"
                  className={s.input}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    paddingLeft: 50,
                    height: 52,
                    fontSize: 15,
                    fontWeight: 500,
                    background: focusedField === 'email' ? 'rgba(15, 23, 42, 0.88)' : 'rgba(15, 23, 42, 0.65)',
                    border: focusedField === 'email' ? '2px solid #f97316' : '1.5px solid rgba(255, 255, 255, 0.45)',
                    color: '#ffffff',
                    borderRadius: 14,
                    boxShadow: focusedField === 'email' ? '0 0 20px rgba(249, 115, 22, 0.45)' : '0 4px 14px rgba(0,0,0,0.4)',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    outline: 'none',
                  }}
                  placeholder="name@organization.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  autoComplete="email"
                />
              </div>
              {error && (
                <span className={s.fieldError} style={{ color: '#fca5a5', fontSize: 12.5, marginTop: 5, display: 'block', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
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
              {isSubmitting ? <><span className={s.spinner} /> Sending Recovery Link...</> : 'Send Recovery Link'}
            </button>
          </form>
        )}

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
