import { useEffect, useState } from 'react';
import { Zap, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { dbSelect } from '../db/database';
import s from '../styles/page.module.css';

export function ScrapingPage() {
  const [jobs, setJobs] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadScrapingData = async () => {
    setRefreshing(true);
    try {
      const jobRows = await dbSelect(`SELECT * FROM scraping_jobs ORDER BY runAt DESC`);
      setJobs(jobRows || []);
    } catch (e) {
      console.warn('Scraping logs load error:', e);
    } finally {
      setLoading(false);
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  useEffect(() => {
    loadScrapingData();
  }, []);

  const successJobs = jobs.filter((j) => j.status === 'success');
  const failedJobs = jobs.filter((j) => j.status === 'failed');

  const filteredJobs = jobs.filter((j) => {
    if (statusFilter === 'SUCCESS') return j.status === 'success';
    if (statusFilter === 'FAILED') return j.status === 'failed';
    return true;
  });

  return (
    <div className={s.page}>
      {/* Header with Title & Refresh */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>DISCO Scraping Execution Logs</h1>
          <p className={s.pageSubtitle}>Monitor DISCO portal scraping execution success and failure status</p>
        </div>
        <div>
          <button
            type="button"
            className={`${s.btn} ${s.btnSecondary}`}
            onClick={loadScrapingData}
            disabled={refreshing}
            style={{ padding: '8px 16px', fontSize: 13, gap: 7 }}
          >
            <RefreshCw size={14} className={refreshing ? s.spinner : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Seamless Filter Toolbar (Transparent, No Boxed Card) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 0',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={18} color="var(--color-accent)" />
          <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--color-text)' }}>Execution Logs</span>
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            style={{
              padding: '5px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              border: statusFilter === 'ALL' ? '1px solid var(--color-accent-dark)' : '1px solid var(--color-border)',
              background: statusFilter === 'ALL' ? 'var(--color-accent)' : '#ffffff',
              color: statusFilter === 'ALL' ? '#ffffff' : 'var(--color-text-muted)',
              boxShadow: statusFilter === 'ALL' ? '0 2px 8px rgba(8, 182, 232, 0.25)' : 'none',
              transition: 'all 0.15s ease',
            }}
            onClick={() => setStatusFilter('ALL')}
          >
            All ({jobs.length})
          </button>
          <button
            type="button"
            style={{
              padding: '5px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              border: statusFilter === 'SUCCESS' ? '1px solid #16A34A' : '1px solid var(--color-border)',
              background: statusFilter === 'SUCCESS' ? '#16A34A' : '#ffffff',
              color: statusFilter === 'SUCCESS' ? '#ffffff' : 'var(--color-text-muted)',
              boxShadow: statusFilter === 'SUCCESS' ? '0 2px 8px rgba(22, 163, 74, 0.25)' : 'none',
              transition: 'all 0.15s ease',
            }}
            onClick={() => setStatusFilter('SUCCESS')}
          >
            Success ({successJobs.length})
          </button>
          <button
            type="button"
            style={{
              padding: '5px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              border: statusFilter === 'FAILED' ? '1px solid #DC2626' : '1px solid var(--color-border)',
              background: statusFilter === 'FAILED' ? '#DC2626' : '#ffffff',
              color: statusFilter === 'FAILED' ? '#ffffff' : 'var(--color-text-muted)',
              boxShadow: statusFilter === 'FAILED' ? '0 2px 8px rgba(220, 38, 38, 0.25)' : 'none',
              transition: 'all 0.15s ease',
            }}
            onClick={() => setStatusFilter('FAILED')}
          >
            Failed ({failedJobs.length})
          </button>
        </div>
      </div>

      {/* Transparent Logs Area */}
      {filteredJobs.length === 0 ? (
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
          {/* Centered Zap Badge */}
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
            <Zap size={30} />
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
            No Execution Logs Found
          </h3>

          <p
            style={{
              fontSize: 13.5,
              color: 'var(--color-text-muted)',
              maxWidth: 400,
              margin: '0 0 18px',
              lineHeight: 1.5,
            }}
          >
            No {statusFilter === 'ALL' ? '' : statusFilter.toLowerCase()} execution records found in SQLite database.
          </p>

          <button
            type="button"
            className={`${s.btn} ${s.btnSecondary}`}
            onClick={loadScrapingData}
            style={{ padding: '7px 18px', fontSize: 13, gap: 6 }}
          >
            <RefreshCw size={14} className={refreshing ? s.spinner : ''} />
            <span>Refresh Logs</span>
          </button>
        </div>
      ) : (
        <div className={s.tableWrap} style={{ background: '#ffffff', borderRadius: 12, border: '1px solid var(--color-border)' }}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Execution Ref No</th>
                <th>DISCO Provider</th>
                <th>Branch Name</th>
                <th>Run Date & Time</th>
                <th>Duration</th>
                <th style={{ textAlign: 'right' }}>Execution Outcome</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => (
                <tr key={job.id}>
                  <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>{job.connectionRef || job.id}</td>
                  <td><span className={`${s.badge} ${s.badgeWarning}`}>{job.disco}</span></td>
                  <td>{job.branchName || 'Main Branch'}</td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{job.runAt}</td>
                  <td>{job.duration || '2.8s'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`${s.badge} ${job.status === 'success' ? s.badgeActive : s.badgeInactive}`}>
                      {job.status === 'success' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {job.status === 'success' ? 'Execution Success' : 'Execution Failed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
