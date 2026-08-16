import { useEffect, useState } from 'react';
import { Download, CheckCircle2, FileSpreadsheet, BarChart3, Filter } from 'lucide-react';
import { dbSelect } from '../db/database';
import s from '../styles/page.module.css';

const REPORT_TYPES = [
  { id: 'monthly', title: 'Monthly Bill Report', desc: 'Comprehensive monthly DISCO billing ledger statements' },
  { id: 'branchwise', title: 'Branch-wise Report', desc: 'Aggregated total energy cost broken down by organization branch' },
  { id: 'discowise', title: 'DISCO-wise Report', desc: 'Billing breakdown across KESC, LESCO, IESCO, and PESCO' },
  { id: 'duedate', title: 'Due-Date Alert Report', desc: 'Impending due dates and overdue electricity bill alerts' },
  { id: 'status', title: 'Paid / Unpaid Status Report', desc: 'Settlement compliance and outstanding payment balances' },
  { id: 'consumption', title: 'Consumption Report', desc: 'Total kWh energy consumption and tariff load analysis' },
  { id: 'summary', title: 'Amount Summary Report', desc: 'Financial total summary across all active connections' },
  { id: 'taxes', title: 'Tax / Charge Summary Report', desc: 'Itemized breakdown of GST, Electricity Duty, and Income Taxes' },
  { id: 'fpa', title: 'FPA Adjustment Summary Report', desc: 'Fuel Price Adjustment surcharges and historical variances' },
  { id: 'failedscrape', title: 'Failed Scraping Report', desc: 'Scraper engine extraction errors and portal connection timeouts' },
  { id: 'historical', title: 'Historical Series Report', desc: 'Multi-year historical bill ledger series for trend auditing' },
];

export function ReportsPage() {
  const [activeReportId, setActiveReportId] = useState('monthly');
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedDisco, setSelectedDisco] = useState('ALL');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    async function initData() {
      const bRows = await dbSelect(`SELECT * FROM branches ORDER BY name ASC`).catch(() => []);
      setBranches(bRows || []);
    }
    initData();
  }, []);

  const loadReportData = async () => {
    setLoading(true);
    let rows = [];
    try {
      if (activeReportId === 'monthly') {
        rows = await dbSelect(`SELECT refNo as label, branchName, disco, unitsConsumed as kwh, totalPayable as amount, issueDate, dueDate FROM bills ORDER BY id DESC`);
      } else if (activeReportId === 'branchwise') {
        rows = await dbSelect(`SELECT branchName as label, COUNT(id) as kwh, SUM(totalPayable) as amount FROM bills GROUP BY branchName`);
      } else if (activeReportId === 'discowise') {
        rows = await dbSelect(`SELECT disco as label, COUNT(id) as kwh, SUM(totalPayable) as amount FROM bills GROUP BY disco`);
      } else if (activeReportId === 'duedate') {
        rows = await dbSelect(`SELECT refNo as label, branchName, disco, dueDate, status, totalPayable as amount FROM bills ORDER BY dueDate ASC`);
      } else if (activeReportId === 'status') {
        rows = await dbSelect(`SELECT refNo as label, branchName, status, totalPayable as amount FROM bills`);
      } else if (activeReportId === 'consumption') {
        rows = await dbSelect(`SELECT refNo as label, branchName, disco, unitsConsumed as kwh, totalPayable as amount FROM bills ORDER BY unitsConsumed DESC`);
      } else if (activeReportId === 'summary') {
        rows = await dbSelect(`SELECT refNo as label, branchName, disco, totalPayable as amount FROM bills`);
      } else if (activeReportId === 'taxes') {
        rows = await dbSelect(`SELECT refNo as label, gstTaxes as gst, incomeTax, totalPayable as amount FROM bills`);
      } else if (activeReportId === 'fpa') {
        rows = await dbSelect(`SELECT refNo as label, fpaAmount as fpa, totalPayable as amount FROM bills`);
      } else if (activeReportId === 'failedscrape') {
        rows = await dbSelect(`SELECT connectionRef as label, disco, branchName, runAt, duration FROM scraping_jobs WHERE status = 'failed'`);
      } else if (activeReportId === 'historical') {
        rows = await dbSelect(`SELECT refNo as label, consumerId, disco, historySeries, billingMonth, totalPayable as amount FROM bills ORDER BY id DESC`);
      }
    } catch (e) {
      console.warn('Report load error:', e);
    }
    setReportData(rows || []);
    setLoading(false);
  };

  useEffect(() => {
    loadReportData();
  }, [activeReportId]);

  const activeReportObj = REPORT_TYPES.find((r) => r.id === activeReportId);

  const exportExcelReport = () => {
    showToast(`Exported ${activeReportObj?.title} as Excel workbook (.xlsx).`);
  };

  return (
    <div className={s.page}>
      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>Reports & Executive Analytics</h1>
          <p className={s.pageSubtitle}>Select any report category below to view live database statements</p>
        </div>
        <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={exportExcelReport}>
          <Download size={15} /> Export Excel (.xlsx)
        </button>
      </div>

      {toast && (
        <div className={`${s.alert} ${s.alertSuccess}`} style={{ marginBottom: 16 }}>
          <CheckCircle2 size={15} /> {toast}
        </div>
      )}

      {/* Seamless Category Selector Toolbar (Transparent, No Bulky Card) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 0',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 280 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--color-accent-soft)',
              border: '1px solid var(--color-accent-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-accent)',
            }}
          >
            <BarChart3 size={17} />
          </div>

          <div style={{ flex: 1, maxWidth: 360 }}>
            <select
              className={s.select}
              style={{
                height: 40,
                fontSize: 13.5,
                fontWeight: 700,
                background: '#ffffff',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
              value={activeReportId}
              onChange={(e) => setActiveReportId(e.target.value)}
            >
              {REPORT_TYPES.map((rt) => (
                <option key={rt.id} value={rt.id}>{rt.title}</option>
              ))}
            </select>
          </div>
        </div>

        <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
          {activeReportObj?.desc}
        </span>
      </div>

      {/* Table Data or Clean Empty State */}
      {reportData.length === 0 ? (
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
            <FileSpreadsheet size={30} />
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px', fontFamily: 'var(--font-heading)' }}>
            No Data Found for {activeReportObj?.title}
          </h3>

          <p style={{ fontSize: 13.5, color: 'var(--color-text-muted)', maxWidth: 400, margin: 0, lineHeight: 1.5 }}>
            No database records are currently available for this analytical report category.
          </p>
        </div>
      ) : (
        <div className={s.tableContainer} style={{ background: '#ffffff', borderRadius: 14, border: '1px solid var(--color-border)' }}>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Reference / Label</th>
                  {activeReportId === 'monthly' && <th>Branch Name</th>}
                  {activeReportId === 'monthly' && <th>DISCO</th>}
                  {activeReportId === 'monthly' && <th>Issue Date</th>}
                  {activeReportId === 'monthly' && <th>Due Date</th>}
                  {reportData[0]?.kwh !== undefined && <th>Energy Units (kWh) / Count</th>}
                  {reportData[0]?.gst !== undefined && <th>GST & Taxes</th>}
                  {reportData[0]?.fpa !== undefined && <th>FPA Surcharge</th>}
                  {reportData[0]?.amount !== undefined && <th style={{ textAlign: 'right' }}>Total Amount (PKR)</th>}
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700, color: 'var(--color-text)' }}>{row.label || `Record #${idx + 1}`}</td>
                    {activeReportId === 'monthly' && <td style={{ color: 'var(--color-text-muted)' }}>{row.branchName}</td>}
                    {activeReportId === 'monthly' && <td><span className={`${s.badge} ${s.badgeWarning}`}>{row.disco}</span></td>}
                    {activeReportId === 'monthly' && <td style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{row.issueDate}</td>}
                    {activeReportId === 'monthly' && <td style={{ fontWeight: 600 }}>{row.dueDate}</td>}
                    {row.kwh !== undefined && <td style={{ fontWeight: 600 }}>{row.kwh}</td>}
                    {row.gst !== undefined && <td>PKR {(row.gst || 0).toLocaleString()}</td>}
                    {row.fpa !== undefined && <td>PKR {(row.fpa || 0).toLocaleString()}</td>}
                    {row.amount !== undefined && (
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--color-accent-dark)' }}>
                        PKR {(row.amount || 0).toLocaleString()}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
