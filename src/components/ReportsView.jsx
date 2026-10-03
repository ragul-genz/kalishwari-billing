import React from 'react';
import {
  TrendingUp,
  Receipt,
  Search,
  Filter,
  RefreshCw,
  Printer,
  Download,
  Share2,
  Trash2,
  Eye,
  Calendar,
  CreditCard,
  Percent,
  CheckCircle,
  FileSpreadsheet,
  PieChart,
  BarChart3,
  DollarSign
} from 'lucide-react';
import { formatNumber, generatePdfDocument } from '../utils/pdfGenerator';
import { cleanPhoneNumber, openWhatsAppChat, shareInvoicePdf, createInvoiceWhatsAppMessage } from '../utils/whatsapp';
import { deleteInvoice as apiDeleteInvoice, clearAllInvoices as apiClearAllInvoices, uploadInvoicePdf, sendInvoicePdfViaWhatsAppBot } from '../utils/api';

export function ReportsView({
  savedInvoices = [],
  setSavedInvoices,
  company = {},
  showToast,
  activeYear = '2026',
  setPreviewInvoice,
  loadInvoices,
  reloadProducts,
  setWhatsappModal,
  setPrintingInvoice,
  promptConfirm,
  activeSubTab = 'history' // 'history' | 'profit'
}) {
  const [currentTab, setCurrentTab] = React.useState(activeSubTab || 'history');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('All'); // 'All' | 'invoice' | 'quotation'
  const [isReloading, setIsReloading] = React.useState(false);

  // Financial calculations
  const totalRevenue = savedInvoices.reduce((acc, curr) => acc + (Number(curr.netAmount) || 0), 0);
  const totalGross = savedInvoices.reduce((acc, curr) => acc + (Number(curr.grossTotal) || 0), 0);
  const totalDiscount = savedInvoices.reduce((acc, curr) => acc + (Number(curr.discountAmount) || 0), 0);
  const totalGst = savedInvoices.reduce((acc, curr) => acc + (Number(curr.gstAmount) || 0), 0);
  const avgBillValue = savedInvoices.length > 0 ? Math.round(totalRevenue / savedInvoices.length) : 0;

  // Payment mode analytics
  const cashTotal = savedInvoices.filter(i => (i.paymentMode || 'Cash').toLowerCase() === 'cash')
    .reduce((acc, curr) => acc + (Number(curr.netAmount) || 0), 0);
  const upiTotal = savedInvoices.filter(i => (i.paymentMode || '').toLowerCase().includes('upi') || (i.paymentMode || '').toLowerCase().includes('gpay'))
    .reduce((acc, curr) => acc + (Number(curr.netAmount) || 0), 0);
  const otherTotal = Math.max(0, totalRevenue - cashTotal - upiTotal);

  const handleRefresh = async () => {
    setIsReloading(true);
    try {
      if (loadInvoices) await loadInvoices();
      showToast('Invoices refreshed from TiDB Cloud!');
    } catch (e) {
      showToast('Refresh failed');
    } finally {
      setIsReloading(false);
    }
  };

  const handleDownloadPdf = (inv) => {
    const doc = generatePdfDocument(inv, company);
    const safeCustomer = (inv.customerName || 'Customer').replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`Sri_Kaliswari_Bill_SKC_${inv.billNo}_${safeCustomer}.pdf`);
  };

  const handleDeleteInvoice = (inv) => {
    const bNo = inv.billNo || inv.id;
    const cust = inv.customerName || 'Customer';
    const doDelete = async () => {
      setSavedInvoices(prev => prev.filter(i => String(i.billNo) !== String(bNo) && String(i.id) !== String(bNo)));
      try {
        await apiDeleteInvoice(bNo, activeYear);
        if (reloadProducts) await reloadProducts();
        if (loadInvoices) await loadInvoices();
        showToast(`✓ Bill #SKC ${bNo} removed & product stock restored in TiDB!`);
      } catch (err) {
        showToast(`Bill #SKC ${bNo} removed locally`);
      }
    };

    if (promptConfirm) {
      promptConfirm({
        title: `Delete Invoice #SKC ${bNo}?`,
        message: `Delete invoice for ${cust} (₹${inv.netAmount || 0})? This will permanently remove the bill and restore cracker item stocks in TiDB Cloud.`,
        confirmLabel: 'Yes, Delete Bill',
        confirmColor: '#DC2626',
        onConfirm: doDelete
      });
    } else {
      doDelete();
    }
  };

  const filteredInvoices = savedInvoices.filter(inv => {
    const matchesSearch =
      String(inv.billNo).includes(searchTerm) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inv.customerMobile && String(inv.customerMobile).includes(searchTerm)) ||
      (inv.date && inv.date.includes(searchTerm));

    const matchesType =
      typeFilter === 'All' ||
      (typeFilter === 'invoice' && (inv.type === 'invoice' || inv.type === 'tax')) ||
      (typeFilter === 'quotation' && (inv.type === 'quotation' || inv.type === 'estimate'));

    return matchesSearch && matchesType;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

      {/* Header & Sub-Tab Switcher */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '20px 24px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#FFF7ED',
            color: '#EA580C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0F172A' }}>
              Sales Reports &amp; Profit Center (விற்பனை &amp; லாப அறிக்கை)
            </h2>
            <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#64748B' }}>
              Track revenue, GST breakdown, customer bills &amp; business profitability for {activeYear}
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '12px', gap: '4px' }}>
          <button
            type="button"
            onClick={() => setCurrentTab('history')}
            style={{
              padding: '8px 16px',
              borderRadius: '9px',
              border: 'none',
              background: currentTab === 'history' ? '#FFFFFF' : 'transparent',
              color: currentTab === 'history' ? '#0F172A' : '#64748B',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: currentTab === 'history' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            📋 All Invoices ({savedInvoices.length})
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('profit')}
            style={{
              padding: '8px 16px',
              borderRadius: '9px',
              border: 'none',
              background: currentTab === 'profit' ? '#FFFFFF' : 'transparent',
              color: currentTab === 'profit' ? '#EA580C' : '#64748B',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: currentTab === 'profit' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            📈 Profit &amp; Analytics
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #FF6B35 0%, #EA580C 100%)',
          borderRadius: '16px',
          padding: '20px',
          color: '#FFFFFF',
          boxShadow: '0 8px 24px rgba(255, 107, 53, 0.28)'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', opacity: 0.9 }}>Total Net Revenue</div>
          <div style={{ fontSize: '28px', fontWeight: '900', marginTop: '8px' }}>₹{formatNumber(totalRevenue)}</div>
          <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.85 }}>Realised Cash &amp; Payments</div>
        </div>

        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Gross Catalog Sales</div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#0F172A', marginTop: '8px' }}>₹{formatNumber(totalGross)}</div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>Before Discounts Applied</div>
        </div>

        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Discounts Provided</div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#EF4444', marginTop: '8px' }}>- ₹{formatNumber(totalDiscount)}</div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>Festive &amp; Special Concessions</div>
        </div>

        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>GST 18% Output</div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#2563EB', marginTop: '8px' }}>+ ₹{formatNumber(totalGst)}</div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>Tax Liability for Sivakasi Sales</div>
        </div>
      </div>

      {/* TAB 1: ALL INVOICES HISTORY */}
      {currentTab === 'history' && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
          overflow: 'hidden'
        }}>
          {/* Filter Bar */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
              <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
                <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search by Bill #, Customer, Mobile..."
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px'
                  }}
                />
              </div>

              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                <option value="All">All Formats</option>
                <option value="invoice">Tax Invoice Only</option>
                <option value="quotation">Estimate / Quotation</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isReloading}
                style={{
                  background: '#F1F5F9',
                  color: '#334155',
                  border: '1px solid #CBD5E1',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={13} className={isReloading ? 'spin' : ''} />
                <span>{isReloading ? 'Syncing...' : 'Refresh TiDB'}</span>
              </button>

              {savedInvoices.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const doClear = async () => {
                      setSavedInvoices([]);
                      try {
                        await apiClearAllInvoices(activeYear);
                        if (loadInvoices) await loadInvoices();
                        showToast('All invoices cleared from TiDB Cloud. Counter reset to #1.');
                      } catch (err) {
                        showToast('All invoices cleared locally.');
                      }
                    };

                    if (promptConfirm) {
                      promptConfirm({
                        title: 'Clear All Saved Invoices History?',
                        message: `Are you sure you want to delete all ${savedInvoices.length} invoices for Year ${activeYear}? This will reset the invoice counter to #1.`,
                        confirmLabel: 'Yes, Clear All Invoices',
                        confirmColor: '#DC2626',
                        onConfirm: doClear
                      });
                    } else {
                      doClear();
                    }
                  }}
                  style={{
                    background: '#FEE2E2',
                    color: '#DC2626',
                    border: '1px solid #FCA5A5',
                    padding: '7px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Clear All &amp; Start from #1
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: '700' }}>
                  <th style={{ padding: '14px 16px', width: '90px', textAlign: 'center' }}>Bill No</th>
                  <th style={{ padding: '14px 16px', width: '100px' }}>Date</th>
                  <th style={{ padding: '14px 16px', width: '100px' }}>Type</th>
                  <th style={{ padding: '14px 16px' }}>Customer Details</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Gross Total (₹)</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Discount</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Net Payable (₹)</th>
                  <th style={{ padding: '14px 16px', width: '150px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                      No invoices found matching criteria. Click <b>Quick Billing</b> to create your first bill!
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map(inv => (
                    <tr key={inv.billNo || inv.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '800', color: '#EA580C' }}>
                        SKC {inv.billNo}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748B' }}>{inv.date}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: inv.type === 'tax' || inv.type === 'invoice' ? '#DBEAFE' : '#FEF3C7',
                          color: inv.type === 'tax' || inv.type === 'invoice' ? '#1E40AF' : '#92400E'
                        }}>
                          {inv.type ? inv.type.toUpperCase() : 'ESTIMATE'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                        <div style={{ color: '#0F172A' }}>{inv.customerName || 'Direct Counter'}</div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>{inv.customerMobile || '-'} · {inv.customerAddress || '-'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#64748B' }}>
                        ₹{formatNumber(inv.grossTotal)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: '#EF4444', fontWeight: '700' }}>
                        {inv.discountPercent}%
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '800', color: '#0F172A' }}>
                        ₹{formatNumber(inv.netAmount)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            title="View invoice preview"
                            onClick={() => setPreviewInvoice && setPreviewInvoice(inv)}
                            style={{
                              background: '#F1F5F9',
                              border: '1px solid #CBD5E1',
                              color: '#334155',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Eye size={13} />
                          </button>

                          <button
                            type="button"
                            title="Print A4 bill"
                            onClick={() => setPrintingInvoice && setPrintingInvoice(inv)}
                            style={{
                              background: '#FFF7ED',
                              border: '1px solid #FED7AA',
                              color: '#EA580C',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: '700',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <Printer size={12} /> Print
                          </button>

                          <button
                            type="button"
                            title="Share on WhatsApp"
                            onClick={async () => {
                              const clean = cleanPhoneNumber(inv.customerMobile);
                              if (!clean || clean.length < 10) {
                                showToast('Valid 10-digit mobile number required to send WhatsApp!');
                                return;
                              }
                              let pdfBase64 = null;
                              const safeCustomer = (inv.customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
                              const filename = `Sri_Kaliswari_Bill_SKC_${inv.billNo}_${safeCustomer}.pdf`;
                              try {
                                const doc = generatePdfDocument(inv, company);
                                pdfBase64 = doc.output('datauristring');
                                if (pdfBase64) uploadInvoicePdf(inv.billNo, pdfBase64, filename);
                              } catch (e) {}

                              const invoiceMsg = createInvoiceWhatsAppMessage(inv, company);
                              const res = openWhatsAppChat(clean, invoiceMsg, false);
                              if (setWhatsappModal) {
                                setWhatsappModal({
                                  isOpen: true,
                                  phone: clean,
                                  customerName: inv.customerName,
                                  billNo: inv.billNo,
                                  netAmount: inv.netAmount,
                                  waUrl: res.waUrl,
                                  invoice: inv,
                                  pdfBase64: pdfBase64,
                                  filename: filename,
                                  popupBlocked: false
                                });
                              }
                            }}
                            style={{
                              background: '#DCFCE7',
                              border: '1px solid #BBF7D0',
                              color: '#16A34A',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: '700',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <Share2 size={12} /> WA
                          </button>

                          <button
                            type="button"
                            title="Delete bill and restore stock in TiDB"
                            onClick={() => handleDeleteInvoice(inv)}
                            style={{
                              background: '#FEE2E2',
                              border: '1px solid #FECACA',
                              color: '#EF4444',
                              cursor: 'pointer',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PROFIT & ANALYTICS */}
      {currentTab === 'profit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Key Insights Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '18px'
          }}>
            {/* Card 1: Sales Realisation Breakdown */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '22px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={17} color="#FF6B35" />
                <span>Sales Realisation Breakdown (விற்பனை நிலவரம்)</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed #E2E8F0' }}>
                  <span style={{ color: '#64748B' }}>Gross Catalog Value:</span>
                  <span style={{ fontWeight: '800', color: '#0F172A' }}>₹{formatNumber(totalGross)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed #E2E8F0' }}>
                  <span style={{ color: '#64748B' }}>Average Discount Given:</span>
                  <span style={{ fontWeight: '800', color: '#EF4444' }}>
                    {totalGross > 0 ? Math.round((totalDiscount / totalGross) * 100) : 0}% (₹{formatNumber(totalDiscount)})
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed #E2E8F0' }}>
                  <span style={{ color: '#64748B' }}>Average Bill Value (ABV):</span>
                  <span style={{ fontWeight: '800', color: '#2563EB' }}>₹{formatNumber(avgBillValue)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
                  <span style={{ fontWeight: '800', color: '#0F172A' }}>Total Net Realised Revenue:</span>
                  <span style={{ fontWeight: '900', fontSize: '16px', color: '#16A34A' }}>₹{formatNumber(totalRevenue)}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Payment Mode Realisation */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '22px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={17} color="#2563EB" />
                <span>Payment Mode Collection (பணம் வசூல் விபரம்)</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed #E2E8F0' }}>
                  <span style={{ color: '#64748B' }}>💵 Cash Collections:</span>
                  <span style={{ fontWeight: '800', color: '#16A34A' }}>₹{formatNumber(cashTotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed #E2E8F0' }}>
                  <span style={{ color: '#64748B' }}>📱 UPI / GPay Collections:</span>
                  <span style={{ fontWeight: '800', color: '#2563EB' }}>₹{formatNumber(upiTotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed #E2E8F0' }}>
                  <span style={{ color: '#64748B' }}>🏦 Bank / Credit Realisation:</span>
                  <span style={{ fontWeight: '800', color: '#6D28D9' }}>₹{formatNumber(otherTotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
                  <span style={{ fontWeight: '800', color: '#0F172A' }}>Total Collections:</span>
                  <span style={{ fontWeight: '900', fontSize: '16px', color: '#0F172A' }}>₹{formatNumber(totalRevenue)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
