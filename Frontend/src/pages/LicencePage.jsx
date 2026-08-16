import { useState } from 'react';
import { CheckCircle2, ShieldCheck, Sparkles, Calendar, Zap, Building2, Users, Layers, Award } from 'lucide-react';
import s from '../styles/page.module.css';

export function LicencePage() {
  const [expandPlanOpen, setExpandPlanOpen] = useState(false);
  const [selectedUpgrade, setSelectedUpgrade] = useState('Enterprise Pro');
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleRequestExpansion = (e) => {
    e.preventDefault();
    showToast(`Expansion request for ${selectedUpgrade} submitted successfully. Account manager will contact you.`);
    setExpandPlanOpen(false);
  };

  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>Subscription & Billing Overview</h1>
          <p className={s.pageSubtitle}>Manage corporate licence validity, active subscription plan, and capacity expansion details</p>
        </div>
        <button className={`${s.btn} ${s.btnPrimary}`} onClick={() => setExpandPlanOpen(!expandPlanOpen)}>
          <Sparkles size={15} /> {expandPlanOpen ? 'Hide Expansion Options' : 'Expand / Upgrade Plan'}
        </button>
      </div>

      {toast && (
        <div className={`${s.alert} ${s.alertSuccess}`} style={{ marginBottom: 16 }}>
          <CheckCircle2 size={15} /> {toast}
        </div>
      )}

      {/* Premium Deep Navy Corporate Active Licence Card */}
      <div
        style={{
          marginBottom: 24,
          padding: '28px 32px',
          background: 'linear-gradient(135deg, #0B1324 0%, #162035 100%)',
          borderRadius: 18,
          border: '1px solid rgba(8, 182, 232, 0.25)',
          borderTop: '3px solid var(--color-accent)',
          boxShadow: '0 10px 30px rgba(11, 19, 36, 0.15), 0 0 20px rgba(8, 182, 232, 0.12)',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, letterSpacing: '0.06em', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: 4 }}>
              <Award size={14} /> Corporate Active Licence
            </div>
            <h2 style={{ margin: '4px 0 6px', fontSize: '1.55rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Enterprise Utility Subscription Tier
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
              Licence Key:{' '}
              <code style={{ color: '#38CDF4', background: 'rgba(8, 182, 232, 0.15)', border: '1px solid rgba(8, 182, 232, 0.35)', padding: '3px 8px', borderRadius: 6, fontWeight: 700, fontSize: 12.5 }}>
                LIC-PIP-2026-9981X
              </code>
            </p>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 999, color: '#047857', fontSize: 12.5, fontWeight: 700, boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)' }}>
            <ShieldCheck size={16} /> Subscription Active & Verified
          </div>
        </div>

        {/* Licence Timeline & Expiry Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div>
            <span style={{ fontSize: 11.5, color: '#94a3b8', display: 'block', fontWeight: 600 }}>Licence Purchased Date</span>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 7, marginTop: 4 }}>
              <Calendar size={15} color="var(--color-accent)" /> Jan 01, 2026
            </span>
          </div>

          <div>
            <span style={{ fontSize: 11.5, color: '#94a3b8', display: 'block', fontWeight: 600 }}>Valid Until / Expiry Date</span>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: 7, marginTop: 4 }}>
              <Calendar size={15} color="#34d399" /> Dec 31, 2026 (322 Days Left)
            </span>
          </div>

          <div>
            <span style={{ fontSize: 11.5, color: '#94a3b8', display: 'block', fontWeight: 600 }}>Billing Cycle</span>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: '#ffffff', marginTop: 4, display: 'block' }}>
              Annual Auto-Renewal
            </span>
          </div>

          <div>
            <span style={{ fontSize: 11.5, color: '#94a3b8', display: 'block', fontWeight: 600 }}>Branch Limit</span>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--color-accent-light)', marginTop: 4, display: 'block' }}>
              15 Active Branches
            </span>
          </div>
        </div>
      </div>

      {/* Expand / Upgrade Subscription Plan Inline Panel */}
      {expandPlanOpen && (
        <div className={s.card} style={{ marginBottom: 24, padding: 24, border: '2px solid var(--color-accent)', background: 'var(--color-accent-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Sparkles size={20} color="var(--color-accent-dark)" />
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Expand & Upgrade Licence Capacity</h3>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Select a plan expansion package to increase branch limits and scraping operations</p>
            </div>
          </div>

          <form onSubmit={handleRequestExpansion}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div
                style={{ padding: 16, background: selectedUpgrade === 'Enterprise Plus' ? '#ffffff' : '#f8fafc', borderRadius: 12, border: `2px solid ${selectedUpgrade === 'Enterprise Plus' ? 'var(--color-accent)' : '#e2e8f0'}`, cursor: 'pointer', transition: 'all 0.15s ease' }}
                onClick={() => setSelectedUpgrade('Enterprise Plus')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Enterprise Plus</h4>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-accent)' }}>+5 Branches</span>
                </div>
                <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                  <li>20 Active Organization Branches</li>
                  <li>200 Connection Meter Ledgers</li>
                  <li>5,000 DISCO Scrapes / Month</li>
                </ul>
              </div>

              <div
                style={{ padding: 16, background: selectedUpgrade === 'Enterprise Pro' ? '#ffffff' : '#f8fafc', borderRadius: 12, border: `2px solid ${selectedUpgrade === 'Enterprise Pro' ? 'var(--color-accent)' : '#e2e8f0'}`, cursor: 'pointer', transition: 'all 0.15s ease' }}
                onClick={() => setSelectedUpgrade('Enterprise Pro')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Enterprise Pro</h4>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-accent)' }}>+15 Branches</span>
                </div>
                <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                  <li>30 Active Organization Branches</li>
                  <li>400 Connection Meter Ledgers</li>
                  <li>15,000 DISCO Scrapes / Month</li>
                </ul>
              </div>

              <div
                style={{ padding: 16, background: selectedUpgrade === 'Custom Unlimited' ? '#ffffff' : '#f8fafc', borderRadius: 12, border: `2px solid ${selectedUpgrade === 'Custom Unlimited' ? 'var(--color-accent)' : '#e2e8f0'}`, cursor: 'pointer', transition: 'all 0.15s ease' }}
                onClick={() => setSelectedUpgrade('Custom Unlimited')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Custom Dedicated</h4>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-accent)' }}>Custom Quote</span>
                </div>
                <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                  <li>Unlimited Branches & Meters</li>
                  <li>Dedicated IP Scraper Cluster</li>
                  <li>Custom SLA & Support Agent</li>
                </ul>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className={`${s.btn} ${s.btnSecondary}`} onClick={() => setExpandPlanOpen(false)}>Cancel</button>
              <button type="submit" className={`${s.btn} ${s.btnPrimary}`}>
                Submit Expansion Request for {selectedUpgrade}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Entitlements Table */}
      <div className={s.tableContainer} style={{ background: '#ffffff', borderRadius: 14, border: '1px solid var(--color-border)' }}>
        <div className={s.tableToolbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={18} color="var(--color-accent)" />
            <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--color-text)' }}>Active Licence Entitlement Matrix</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>Enterprise Corporate Plan</span>
        </div>

        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Plan Area / Feature</th>
                <th>Entitlement Limit</th>
                <th>Access Status</th>
                <th style={{ textAlign: 'right' }}>Management</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>Branch Locations</td>
                <td>Up to 15 Active Branches</td>
                <td><span className={`${s.badge} ${s.badgeActive}`}><span className={s.badgeDot} /> Included</span></td>
                <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--color-text-muted)' }}>Managed in Branches</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>Meter Connections</td>
                <td>Up to 150 Connections</td>
                <td><span className={`${s.badge} ${s.badgeActive}`}><span className={s.badgeDot} /> Included</span></td>
                <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--color-text-muted)' }}>Managed in Bills</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>Monthly Scraping Jobs</td>
                <td>Up to 2,000 Extractions / Mo</td>
                <td><span className={`${s.badge} ${s.badgeActive}`}><span className={s.badgeDot} /> Included</span></td>
                <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--color-text-muted)' }}>Automated Cron Engine</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>Organization Staff Users</td>
                <td>Up to 25 Accounts</td>
                <td><span className={`${s.badge} ${s.badgeActive}`}><span className={s.badgeDot} /> Included</span></td>
                <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--color-text-muted)' }}>Managed in Staff</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
