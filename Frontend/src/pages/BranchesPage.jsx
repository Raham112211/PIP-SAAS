import { GitBranch, Clock } from 'lucide-react';
import s from '../styles/page.module.css';

export function BranchesPage() {
  return (
    <div
      className={s.page}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 120px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '40px 20px',
        }}
      >
        <div
          className={s.emptyStateBadge}
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-accent-soft)',
            border: '1.5px solid var(--color-accent-border)',
            color: 'var(--color-accent)',
          }}
        >
          <GitBranch size={36} />
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 14px',
            background: '#fef3c7',
            border: '1px solid #fde68a',
            borderRadius: 999,
            color: '#b45309',
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          <Clock size={14} /> Pending
        </div>

        <h2
          style={{
            margin: '0 0 6px',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--color-text)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          Branch Management
        </h2>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--color-text-muted)' }}>
          Pending
        </p>
      </div>
    </div>
  );
}
