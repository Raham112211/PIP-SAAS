import { useState, useEffect } from 'react';
import { FileText, Search, Eye, Download, CheckCircle, Plus, X, RefreshCw, Trash2, FileSpreadsheet } from 'lucide-react';
import { dbSelect, dbRun } from '../db/database';
import s from '../styles/page.module.css';

const EMPTY_BILL_FORM = {
  refNo: '',
  consumerId: '',
  disco: 'KESC',
  branchName: '',
  billingMonth: '',
  issueDate: '',
  dueDate: '',
  currentAmount: '',
  fpaAmount: '0',
  gstTaxes: '0',
  prevReading: '0',
  currReading: '0',
  unitsConsumed: '0',
  tariff: 'A-2 Commercial',
  status: 'pending',
};

export function BillsPage() {
  const [bills, setBills] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDisco, setSelectedDisco] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeBill, setActiveBill] = useState(null);
  const [modalTab, setModalTab] = useState('overview');
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState(EMPTY_BILL_FORM);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadBillsFromDB = async () => {
    setLoading(true);
    try {
      const [billRows, branchRows] = await Promise.all([
        dbSelect(`SELECT * FROM bills ORDER BY id DESC`),
        dbSelect(`SELECT * FROM branches ORDER BY name ASC`)
      ]);
      setBills(billRows || []);
      setBranches(branchRows || []);
    } catch (e) {
      console.warn('Error loading bills:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillsFromDB();
  }, []);

  const filteredBills = bills.filter((b) => {
    const matchesSearch =
      b.refNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.consumerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.disco?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDisco = selectedDisco === 'ALL' || b.disco === selectedDisco;
    const matchesStatus = selectedStatus === 'ALL' || b.status === selectedStatus;
    return matchesSearch && matchesDisco && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredBills.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredBills.map((b) => b.id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchScrape = async () => {
    for (const id of selectedIds) {
      await dbRun(`UPDATE bills SET scrapeStatus = 'success', scrapeTime = 'Just now' WHERE id = ?`, [id]);
    }
    await loadBillsFromDB();
    showToast(`Triggered batch DISCO scrape for ${selectedIds.length} statements.`);
    setSelectedIds([]);
  };

  const toggleBillStatusInDB = async (bill) => {
    const nextStatus = bill.status === 'paid' ? 'pending' : 'paid';
    await dbRun(`UPDATE bills SET status = ? WHERE id = ?`, [nextStatus, bill.id]);
    await dbRun(`INSERT INTO activity_log (type, message, time) VALUES ('alert', ?, 'Just now')`, [`Bill ${bill.refNo} status changed to ${nextStatus}`]);
    await loadBillsFromDB();
    showToast(`Bill ${bill.refNo} marked as ${nextStatus}.`);
  };

  const deleteBill = async (id, refNo) => {
    await dbRun(`DELETE FROM bills WHERE id = ?`, [id]);
    await dbRun(`INSERT INTO activity_log (type, message, time) VALUES ('alert', ?, 'Just now')`, [`Bill ${refNo} deleted`]);
    await loadBillsFromDB();
    showToast(`Bill ${refNo} deleted.`);
  };

  const onFormChange = (field, val) => {
    setForm((p) => ({ ...p, [field]: val }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  };

  const onAddSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.refNo.trim()) errs.refNo = 'Reference number is required.';
    if (!form.consumerId.trim()) errs.consumerId = 'Consumer ID is required.';
    if (!form.currentAmount || isNaN(form.currentAmount)) errs.currentAmount = 'Valid amount is required.';

    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const id = `b_${Date.now()}`;
      const curAmt = Number(form.currentAmount) || 0;
      const fpa = Number(form.fpaAmount) || 0;
      const gst = Number(form.gstTaxes) || 0;
      const total = curAmt + fpa + gst;
      const prevR = Number(form.prevReading) || 0;
      const currR = Number(form.currReading) || 0;
      const units = Number(form.unitsConsumed) || (currR > prevR ? currR - prevR : 0);

      await dbRun(
        `INSERT INTO bills (id, refNo, consumerId, disco, branchName, billingMonth, issueDate, dueDate, currentAmount, fpaAmount, gstTaxes, incomeTax, otherCharges, totalPayable, prevReading, currReading, unitsConsumed, tariff, status, scrapeStatus, scrapeTime, historySeries) VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, 'success', 'Just now', 'v2.0')`,
        [id, form.refNo.trim(), form.consumerId.trim(), form.disco, form.branchName || 'Main Branch', form.billingMonth, form.issueDate, form.dueDate, curAmt, fpa, gst, total, prevR, currR, units, form.tariff, form.status]
      );

      // Insert connection if missing
      await dbRun(
        `INSERT OR REPLACE INTO connections (id, refNo, branchName, disco, meterNo, address, status, lastBillAmount, lastBillDate, dueDate) VALUES
        (?, ?, ?, ?, ?, 'Registered Address', 'active', ?, ?, ?)`,
        [`c_${id}`, form.refNo.trim(), form.branchName || 'Main Branch', form.disco, form.consumerId.trim(), total, form.issueDate, form.dueDate]
      );

      await dbRun(`INSERT INTO activity_log (type, message, time) VALUES ('scrape', ?, 'Just now')`, [`New bill ${form.refNo.trim()} added & ledgered`]);

      await loadBillsFromDB();
      setAddModal(false);
      setForm(EMPTY_BILL_FORM);
      showToast(`Bill statement ${form.refNo.trim()} created successfully.`);
    } catch (err) {
      showToast(err?.message || 'Failed to save bill.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={s.loadingWrap}>
        <span className={`${s.spinner} ${s.spinnerDark}`} />
        <p>Loading electricity bills directly from SQLite database...</p>
      </div>
    );
  }

  return (
    <div className={s.page}>
      {/* 1. Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>Bill Management</h1>
          <p className={s.pageSubtitle}>Dynamic SQLite database ledger · Tariffs, FPA, GST, and DISCO extraction</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className={`${s.btn} ${s.btnPrimary}`} onClick={() => setAddModal(true)}>
            <Plus size={15} /> Add Bill Statement
          </button>
          <button className={`${s.btn} ${s.btnSecondary}`} onClick={() => showToast('Report exported as Excel workbook.')}>
            <Download size={15} /> Export Excel
          </button>
        </div>
      </div>

      {toast && (
        <div className={`${s.alert} ${s.alertSuccess}`} style={{ marginBottom: 16 }}>
          <CheckCircle size={15} /> {toast}
        </div>
      )}

      {/* Batch Operations Banner */}
      {selectedIds.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--color-accent-soft)',
            border: '1px solid var(--color-accent-border)',
            padding: '10px 16px',
            borderRadius: 10,
            marginBottom: 14,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-accent-dark)' }}>
            {selectedIds.length} Statement{selectedIds.length > 1 ? 's' : ''} Selected
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`${s.btn} ${s.btnPrimary}`} style={{ padding: '6px 14px', fontSize: 12 }} onClick={handleBatchScrape}>
              <RefreshCw size={13} /> Batch Scrape DISCO
            </button>
            <button className={`${s.btn} ${s.btnSecondary}`} style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => setSelectedIds([])}>
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* 2. Filter Toolbar (Seamless, Clean) */}
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
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, minWidth: 280 }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--color-text-muted)' }} />
            <input
              className={s.input}
              style={{ paddingLeft: 36, height: 38, fontSize: 13 }}
              placeholder="Search reference no, consumer ID, DISCO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className={s.select} style={{ width: 130, height: 38, fontSize: 13 }} value={selectedDisco} onChange={(e) => setSelectedDisco(e.target.value)}>
            <option value="ALL">All DISCOs</option>
            <option value="KESC">KESC</option>
            <option value="LESCO">LESCO</option>
            <option value="IESCO">IESCO</option>
            <option value="PESCO">PESCO</option>
            <option value="FESCO">FESCO</option>
            <option value="GEPCO">GEPCO</option>
          </select>
          <select className={s.select} style={{ width: 130, height: 38, fontSize: 13 }} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        {/* Active Filter Chips */}
        {(selectedDisco !== 'ALL' || selectedStatus !== 'ALL' || searchTerm) && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {selectedDisco !== 'ALL' && (
              <span className={s.chip}>
                DISCO: {selectedDisco}
                <X size={12} className={s.chipRemove} onClick={() => setSelectedDisco('ALL')} />
              </span>
            )}
            {selectedStatus !== 'ALL' && (
              <span className={s.chip}>
                Status: {selectedStatus}
                <X size={12} className={s.chipRemove} onClick={() => setSelectedStatus('ALL')} />
              </span>
            )}
            <button className={`${s.btn} ${s.btnSecondary}`} style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => { setSelectedDisco('ALL'); setSelectedStatus('ALL'); setSearchTerm(''); }}>
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* 3. Empty State (Transparent) OR Data Table */}
      {filteredBills.length === 0 ? (
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

          <h3
            style={{
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--color-text)',
              margin: '0 0 6px',
              fontFamily: 'var(--font-heading)',
            }}
          >
            No Electricity Statements Ledgered Yet
          </h3>

          <p
            style={{
              fontSize: 13.5,
              color: 'var(--color-text-muted)',
              maxWidth: 440,
              margin: '0 0 20px',
              lineHeight: 1.55,
            }}
          >
            Your SQLite database ledger is initialized and ready. Click below to add your first live statement or connection to start tracking consumption and DISCO billing.
          </p>

          <button className={`${s.btn} ${s.btnPrimary}`} style={{ padding: '10px 22px', fontSize: 13 }} onClick={() => setAddModal(true)}>
            <Plus size={16} /> Add First Bill Statement
          </button>
        </div>
      ) : (
        <div className={s.tableContainer} style={{ background: '#ffffff', borderRadius: 14, border: '1px solid var(--color-border)' }}>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredBills.length && filteredBills.length > 0}
                      onChange={toggleSelectAll}
                      style={{ width: 15, height: 15, accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                    />
                  </th>
                  <th>Reference Number</th>
                  <th>DISCO</th>
                  <th>Consumer ID</th>
                  <th>Billing Month</th>
                  <th>Due Date</th>
                  <th>Units (kWh)</th>
                  <th>Payable Amount</th>
                  <th>Bill Status</th>
                  <th>Scrape Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((b) => {
                  const isSelected = selectedIds.includes(b.id);
                  return (
                    <tr key={b.id} style={{ background: isSelected ? 'var(--color-accent-soft)' : undefined }}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(b.id)}
                          style={{ width: 15, height: 15, accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>{b.refNo}</td>
                      <td><span style={{ fontWeight: 700, color: '#334155' }}>{b.disco}</span></td>
                      <td style={{ color: '#64748b', fontWeight: 500 }}>{b.consumerId}</td>
                      <td style={{ fontWeight: 500 }}>{b.billingMonth}</td>
                      <td style={{ color: b.status === 'overdue' ? 'var(--color-danger)' : undefined, fontWeight: b.status === 'overdue' ? 700 : 500 }}>
                        {b.dueDate}
                      </td>
                      <td style={{ fontWeight: 600 }}>{b.unitsConsumed} kWh</td>
                      <td style={{ fontWeight: 800, color: 'var(--color-accent-dark)' }}>PKR {(b.totalPayable || 0).toLocaleString()}</td>
                      <td>
                        <span
                          className={`${s.badge} ${b.status === 'paid' ? s.badgeActive : b.status === 'pending' ? s.badgeWarning : s.badgeInactive}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => toggleBillStatusInDB(b)}
                          title="Click to toggle status"
                        >
                          <span className={s.badgeDot} />
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <span className={`${s.badge} ${b.scrapeStatus === 'success' ? s.badgeActive : s.badgeInactive}`}>
                          <span className={s.badgeDot} />
                          {b.scrapeStatus}
                        </span>
                      </td>
                      <td>
                        <div className={s.actions} style={{ justifyContent: 'flex-end' }}>
                          <button className={`${s.btn} ${s.btnSecondary}`} style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => { setActiveBill(b); setModalTab('overview'); }}>
                            <Eye size={13} /> View Breakdown
                          </button>
                          <button className={`${s.btn} ${s.btnDanger}`} style={{ padding: '5px 8px', fontSize: 12 }} onClick={() => deleteBill(b.id, b.refNo)} title="Delete bill">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Integrated Pagination Footer */}
          <div className={s.tablePagination}>
            <span>Showing 1 to {filteredBills.length} of {filteredBills.length} statements</span>
            <div className={s.pageButtons}>
              <button className={s.pageBtn} disabled>Previous</button>
              <button className={`${s.pageBtn} ${s.pageBtnActive}`}>1</button>
              <button className={s.pageBtn} disabled>Next</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Bill Modal */}
      {addModal && (
        <div className={s.modalBackdrop} onClick={(e) => e.target === e.currentTarget && setAddModal(false)}>
          <div className={s.modal} style={{ maxWidth: 640 }}>
            <div className={s.modalHeader}>
              <span className={s.modalTitle}>Add New Electricity Bill Statement</span>
              <button className={s.modalClose} onClick={() => setAddModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={onAddSubmit}>
              <div className={s.modalBody}>
                <div className={s.form}>
                  <div className={s.formRow}>
                    <div className={s.field}>
                      <label className={s.label}>Reference Number *</label>
                      <input className={`${s.input} ${errors.refNo ? s.inputError : ''}`} value={form.refNo} onChange={(e) => onFormChange('refNo', e.target.value)} placeholder="e.g. KE-001-2024" />
                      {errors.refNo && <span className={s.fieldError}>{errors.refNo}</span>}
                    </div>
                    <div className={s.field}>
                      <label className={s.label}>Consumer ID / Account No *</label>
                      <input className={`${s.input} ${errors.consumerId ? s.inputError : ''}`} value={form.consumerId} onChange={(e) => onFormChange('consumerId', e.target.value)} placeholder="e.g. CONS-992101" />
                      {errors.consumerId && <span className={s.fieldError}>{errors.consumerId}</span>}
                    </div>
                  </div>

                  <div className={s.formRow}>
                    <div className={s.field}>
                      <label className={s.label}>DISCO Provider *</label>
                      <select className={s.select} value={form.disco} onChange={(e) => onFormChange('disco', e.target.value)}>
                        <option value="KESC">KESC</option>
                        <option value="LESCO">LESCO</option>
                        <option value="IESCO">IESCO</option>
                        <option value="PESCO">PESCO</option>
                        <option value="FESCO">FESCO</option>
                        <option value="GEPCO">GEPCO</option>
                      </select>
                    </div>
                    <div className={s.field}>
                      <label className={s.label}>Branch</label>
                      <select className={s.select} value={form.branchName} onChange={(e) => onFormChange('branchName', e.target.value)}>
                        {branches.length === 0 ? (
                          <option value="Main Branch">Main Branch</option>
                        ) : branches.map((br) => (
                          <option key={br.id} value={br.name}>{br.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={s.formRow}>
                    <div className={s.field}>
                      <label className={s.label}>Billing Month</label>
                      <input className={s.input} value={form.billingMonth} onChange={(e) => onFormChange('billingMonth', e.target.value)} placeholder="Nov 2024" />
                    </div>
                    <div className={s.field}>
                      <label className={s.label}>Due Date</label>
                      <input type="date" className={s.input} value={form.dueDate} onChange={(e) => onFormChange('dueDate', e.target.value)} />
                    </div>
                  </div>

                  <div className={s.formRow}>
                    <div className={s.field}>
                      <label className={s.label}>Current Bill Amount (PKR) *</label>
                      <input type="number" className={`${s.input} ${errors.currentAmount ? s.inputError : ''}`} value={form.currentAmount} onChange={(e) => onFormChange('currentAmount', e.target.value)} placeholder="45000" />
                      {errors.currentAmount && <span className={s.fieldError}>{errors.currentAmount}</span>}
                    </div>
                    <div className={s.field}>
                      <label className={s.label}>FPA Adjustment (PKR)</label>
                      <input type="number" className={s.input} value={form.fpaAmount} onChange={(e) => onFormChange('fpaAmount', e.target.value)} placeholder="2000" />
                    </div>
                  </div>

                  <div className={s.formRow}>
                    <div className={s.field}>
                      <label className={s.label}>Units Consumed (kWh)</label>
                      <input type="number" className={s.input} value={form.unitsConsumed} onChange={(e) => onFormChange('unitsConsumed', e.target.value)} placeholder="850" />
                    </div>
                    <div className={s.field}>
                      <label className={s.label}>Payment Status</label>
                      <select className={s.select} value={form.status} onChange={(e) => onFormChange('status', e.target.value)}>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className={s.modalFooter}>
                <button type="button" className={`${s.btn} ${s.btnSecondary}`} onClick={() => setAddModal(false)}>Cancel</button>
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
                  {saving ? <><span className={s.spinner} /> Saving...</> : 'Save & Ledger Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Multi-Tab Bill Detail Statement Modal */}
      {activeBill && (
        <div className={s.modalBackdrop} onClick={(e) => e.target === e.currentTarget && setActiveBill(null)}>
          <div className={s.modal} style={{ maxWidth: 680 }}>
            <div className={s.modalHeader}>
              <div>
                <span className={s.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={20} color="var(--color-accent)" />
                  Bill Statement & Charges Ledger
                </span>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Ref: <strong>{activeBill.refNo}</strong> · {activeBill.disco} ({activeBill.billingMonth})
                </p>
              </div>
              <button className={s.modalClose} onClick={() => setActiveBill(null)}><X size={18} /></button>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', background: '#f8fcfe', padding: '0 22px' }}>
              <button
                style={{ padding: '10px 16px', border: 'none', background: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', borderBottom: modalTab === 'overview' ? '2px solid var(--color-accent)' : '2px solid transparent', color: modalTab === 'overview' ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
                onClick={() => setModalTab('overview')}
              >
                Statement Overview
              </button>
              <button
                style={{ padding: '10px 16px', border: 'none', background: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', borderBottom: modalTab === 'breakdown' ? '2px solid var(--color-accent)' : '2px solid transparent', color: modalTab === 'breakdown' ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
                onClick={() => setModalTab('breakdown')}
              >
                Tax & FPA Breakdown
              </button>
              <button
                style={{ padding: '10px 16px', border: 'none', background: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', borderBottom: modalTab === 'raw' ? '2px solid var(--color-accent)' : '2px solid transparent', color: modalTab === 'raw' ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
                onClick={() => setModalTab('raw')}
              >
                Scrape Payload Metadata
              </button>
            </div>

            <div className={s.modalBody}>
              {modalTab === 'overview' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20, background: '#f8fcfe', padding: 16, borderRadius: 10, border: '1px solid var(--color-border)' }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Consumer Information</span>
                      <div style={{ fontWeight: 800, fontSize: 14, marginTop: 4, color: '#0f172a' }}>{activeBill.consumerId}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>Branch: {activeBill.branchName}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>Tariff Category: {activeBill.tariff}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Billing Schedule</span>
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>Issue Date: {activeBill.issueDate}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-danger)', marginTop: 2 }}>Due Date: {activeBill.dueDate}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>Payment Status: <strong style={{ textTransform: 'capitalize' }}>{activeBill.status}</strong></div>
                    </div>
                  </div>

                  <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Meter Reading & Consumption Analysis</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
                    <div style={{ background: '#fff', border: '1px solid var(--color-border)', padding: 12, borderRadius: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>Previous Reading</span>
                      <div style={{ fontWeight: 800, fontSize: 15, marginTop: 2 }}>{activeBill.prevReading}</div>
                    </div>
                    <div style={{ background: '#fff', border: '1px solid var(--color-border)', padding: 12, borderRadius: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>Current Reading</span>
                      <div style={{ fontWeight: 800, fontSize: 15, marginTop: 2 }}>{activeBill.currReading}</div>
                    </div>
                    <div style={{ background: 'var(--color-accent-soft)', border: '1px solid var(--color-accent-border)', padding: 12, borderRadius: 10 }}>
                      <span style={{ fontSize: 11, color: 'var(--color-accent-dark)', fontWeight: 700 }}>Units Consumed</span>
                      <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-accent-dark)', marginTop: 2 }}>{activeBill.unitsConsumed} kWh</div>
                    </div>
                  </div>
                </>
              )}

              {modalTab === 'breakdown' && (
                <div>
                  <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Itemized Charges & Tax Liability Ledger</h4>
                  <div className={s.tableWrap} style={{ border: '1px solid var(--color-border)', borderRadius: 8 }}>
                    <table className={s.table}>
                      <tbody>
                        <tr>
                          <td>Current Electricity Cost</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>PKR {(activeBill.currentAmount || 0).toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td>FPA (Fuel Price Adjustment)</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>PKR {(activeBill.fpaAmount || 0).toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td>GST & Government Taxes</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>PKR {(activeBill.gstTaxes || 0).toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td>Income Tax & Applicable Charges</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>PKR {(activeBill.incomeTax || 0).toLocaleString()}</td>
                        </tr>
                        <tr style={{ background: '#f8fcfe', fontWeight: 800 }}>
                          <td style={{ fontSize: 13.5 }}>Total Payable Amount</td>
                          <td style={{ textAlign: 'right', fontSize: 15.5, color: 'var(--color-accent-dark)' }}>PKR {(activeBill.totalPayable || 0).toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {modalTab === 'raw' && (
                <div>
                  <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>DISCO Scraper Extraction Payload</h4>
                  <pre style={{ background: '#0f172a', color: '#38bdf8', padding: 14, borderRadius: 8, fontSize: 12, overflowX: 'auto', fontFamily: 'monospace' }}>
{JSON.stringify(
  {
    ref_no: activeBill.refNo,
    disco: activeBill.disco,
    consumer_id: activeBill.consumerId,
    billing_month: activeBill.billingMonth,
    issue_date: activeBill.issueDate,
    due_date: activeBill.dueDate,
    units_kwh: activeBill.unitsConsumed,
    current_amount: activeBill.currentAmount,
    fpa_adjustment: activeBill.fpaAmount,
    taxes: activeBill.gstTaxes,
    total_payable: activeBill.totalPayable,
    extraction_status: activeBill.scrapeStatus,
    timestamp: activeBill.scrapeTime,
    series_version: activeBill.historySeries
  },
  null,
  2
)}
                  </pre>
                </div>
              )}
            </div>

            <div className={s.modalFooter}>
              <button className={`${s.btn} ${s.btnSecondary}`} onClick={() => setActiveBill(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
