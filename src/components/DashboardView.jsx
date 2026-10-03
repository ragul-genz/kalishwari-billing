import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  Package,
  Users,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Truck,
  PackagePlus,
  ArrowRight,
  Database,
  Printer,
  Eye,
  CheckCircle,
  Clock,
  Sparkles,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { formatNumber } from '../utils/pdfGenerator';

export function DashboardView({
  products = [],
  savedInvoices = [],
  customers = [],
  activeYear = '2026',
  company = {},
  dbConnected = true,
  dbInfo = {},
  setActiveTab,
  setPreviewInvoice,
  setPrintingInvoice,
  showToast
}) {
  // Calculations
  const totalRevenue = savedInvoices.reduce((acc, curr) => acc + (Number(curr.netAmount) || 0), 0);
  const totalGross = savedInvoices.reduce((acc, curr) => acc + (Number(curr.grossTotal) || 0), 0);
  const totalDiscount = savedInvoices.reduce((acc, curr) => acc + (Number(curr.discountAmount) || 0), 0);
  const totalStockUnits = products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  const lowStockItems = products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 20);
  const outOfStockItems = products.filter(p => Number(p.stock) <= 0);
  const inStockCount = products.filter(p => Number(p.stock) > 20).length;

  const recentInvoices = savedInvoices.slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

      {/* 1. Welcome & Command Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        borderRadius: '20px',
        padding: '24px 28px',
        color: '#FFFFFF',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{
              background: 'linear-gradient(135deg, #FF6B35 0%, #EA580C 100%)',
              color: '#FFF',
              fontSize: '11px',
              fontWeight: '800',
              padding: '3px 10px',
              borderRadius: '999px',
              letterSpacing: '0.5px'
            }}>
              ✨ SIVAKASI HEADQUARTERS
            </span>
            <span style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} /> Financial Year {activeYear}
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>
            {company.name || 'SRI KALIESWARI CRACKERS'}
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94A3B8' }}>
            Billing &amp; Stock Command Center • Direct Factory Outlet • 365 Days Sivakasi Sales
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('estimate')}
            style={{
              background: 'linear-gradient(135deg, #FF6B35 0%, #EA580C 100%)',
              color: '#FFFFFF',
              border: 'none',
              padding: '12px 22px',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(255, 107, 53, 0.35)',
              transition: 'transform 0.15s ease'
            }}
          >
            <FileSpreadsheet size={16} />
            <span>+ Create Bill (F2)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stockinward')}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '12px 18px',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px'
            }}
          >
            <PackagePlus size={16} />
            <span>Stock Inward</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '16px'
      }}>
        {/* Metric 1: Total Realised Revenue */}
        <div style={{
          background: 'linear-gradient(135deg, #FF6B35 0%, #EA580C 100%)',
          borderRadius: '16px',
          padding: '20px',
          color: '#FFFFFF',
          boxShadow: '0 8px 24px rgba(255, 107, 53, 0.28)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', opacity: 0.9 }}>Total Revenue (Sales)</span>
            <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '6px', borderRadius: '8px' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', marginTop: '10px' }}>
            ₹{formatNumber(totalRevenue)}
          </div>
          <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.85 }}>
            Gross: ₹{formatNumber(totalGross)} • Net Realisation
          </div>
        </div>

        {/* Metric 2: Total Invoices Generated */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#64748B' }}>Total Invoices</span>
            <div style={{ background: '#EFF6FF', color: '#2563EB', padding: '6px', borderRadius: '8px' }}>
              <Receipt size={16} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#2563EB', marginTop: '10px' }}>
            {savedInvoices.length} <span style={{ fontSize: '14px', fontWeight: '600', color: '#94A3B8' }}>Bills</span>
          </div>
          <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '700', marginTop: '4px' }}>
            ✓ Synced with TiDB Cloud
          </div>
        </div>

        {/* Metric 3: Active Cracker Catalog */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#64748B' }}>Inventory Catalog</span>
            <div style={{ background: '#ECFDF5', color: '#16A34A', padding: '6px', borderRadius: '8px' }}>
              <Package size={16} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#0F172A', marginTop: '10px' }}>
            {products.length} <span style={{ fontSize: '14px', fontWeight: '600', color: '#94A3B8' }}>Items</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
            Stock: <b>{formatNumber(totalStockUnits)}</b> units in store
          </div>
        </div>

        {/* Metric 4: Customers Registered */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#64748B' }}>Customers</span>
            <div style={{ background: '#F5F3FF', color: '#7C3AED', padding: '6px', borderRadius: '8px' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#7C3AED', marginTop: '10px' }}>
            {customers.length} <span style={{ fontSize: '14px', fontWeight: '600', color: '#94A3B8' }}>Registered</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
            Direct counter &amp; wholesale buyers
          </div>
        </div>
      </div>

      {/* 3. Quick Action Hub */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
      }}>
        <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="#FF6B35" />
          <span>Quick Launch Actions (விரைவுச் செயல்பாடுகள்)</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('estimate')}
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              border: '1px solid #FED7AA',
              background: '#FFF7ED',
              color: '#EA580C',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <FileSpreadsheet size={18} />
            <div>
              <div style={{ fontWeight: '800' }}>Quick Billing</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>Create invoice (F2)</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stockinward')}
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              border: '1px solid #BBF7D0',
              background: '#F0FDF4',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <PackagePlus size={18} />
            <div>
              <div style={{ fontWeight: '800' }}>Stock Inward</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>சரக்கு வரவு வைக்க</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pricelist')}
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <FileText size={18} />
            <div>
              <div style={{ fontWeight: '800' }}>Price List</div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>விலைப் பட்டியல்</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stockalerts')}
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              border: '1px solid #FECACA',
              background: '#FEF2F2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <AlertTriangle size={18} />
            <div>
              <div style={{ fontWeight: '800' }}>Stock Alerts</div>
              <div style={{ fontSize: '11px', opacity: 0.85 }}>{lowStockItems.length + outOfStockItems.length} items low</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('suppliers')}
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              border: '1px solid #E0E7FF',
              background: '#EEF2FF',
              color: '#4338CA',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <Truck size={18} />
            <div>
              <div style={{ fontWeight: '800' }}>Suppliers</div>
              <div style={{ fontSize: '11px', opacity: 0.85 }}>விநியோகஸ்தர்கள்</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              border: '1px solid #DDD6FE',
              background: '#F5F3FF',
              color: '#6D28D9',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <TrendingUp size={18} />
            <div>
              <div style={{ fontWeight: '800' }}>Reports &amp; Profit</div>
              <div style={{ fontSize: '11px', opacity: 0.85 }}>விற்பனை விவரம்</div>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Two-Column Layout: Recent Invoices (Left) + Stock Status (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '20px'
      }}>
        {/* Left: Recent Invoices */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontWeight: '800', fontSize: '15px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt size={17} color="#2563EB" />
              <span>Recent Sales Invoices (சமீபத்திய பில்கள்)</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#2563EB',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '11.5px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 14px' }}>Bill No</th>
                  <th style={{ padding: '10px 14px' }}>Customer</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '36px', textAlign: 'center', color: '#94A3B8' }}>
                      No bills created yet for Year {activeYear}. Click <b>+ Create Bill</b> to start selling!
                    </td>
                  </tr>
                ) : (
                  recentInvoices.map(inv => (
                    <tr key={inv.billNo || inv.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 14px', fontWeight: '800', color: '#EA580C' }}>
                        SKC {inv.billNo}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: '700', color: '#0F172A' }}>{inv.customerName || 'Direct Counter'}</div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>{inv.date} · {inv.customerMobile || '-'}</div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', color: '#0F172A' }}>
                        ₹{formatNumber(inv.netAmount)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            title="Preview Bill"
                            onClick={() => setPreviewInvoice && setPreviewInvoice(inv)}
                            style={{
                              background: '#F1F5F9',
                              border: '1px solid #CBD5E1',
                              color: '#334155',
                              padding: '4px 7px',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            type="button"
                            title="Print Bill"
                            onClick={() => setPrintingInvoice && setPrintingInvoice(inv)}
                            style={{
                              background: '#FFF7ED',
                              border: '1px solid #FED7AA',
                              color: '#EA580C',
                              padding: '4px 7px',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            <Printer size={13} />
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

        {/* Right: Low Stock Alerts & Database Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Urgent Stock Watchlist */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: lowStockItems.length > 0 ? '#FEF2F2' : '#FFFFFF'
            }}>
              <div style={{ fontWeight: '800', fontSize: '14.5px', color: lowStockItems.length > 0 ? '#DC2626' : '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={17} />
                <span>Urgent Stock Watchlist ({lowStockItems.length} Low)</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('stockinward')}
                style={{
                  background: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                + Inward Now
              </button>
            </div>

            <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
              {lowStockItems.length === 0 ? (
                <div style={{ padding: '28px', textAlign: 'center', color: '#16A34A', fontSize: '13px' }}>
                  <CheckCircle size={24} style={{ margin: '0 auto 6px auto', display: 'block' }} />
                  <b>All Cracker Stock Levels Healthy!</b>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>No items below threshold (20 units)</div>
                </div>
              ) : (
                lowStockItems.slice(0, 5).map(p => (
                  <div
                    key={p.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #F1F5F9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Code #{p.code} • Rate: ₹{p.rate}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        background: '#FEE2E2',
                        color: '#DC2626',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontWeight: '800',
                        fontSize: '12px'
                      }}>
                        {p.stock} left
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* TiDB Cloud Live Status */}
          <div style={{
            background: '#F8FAFC',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#DCFCE7',
                color: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Database size={20} />
              </div>
              <div>
                <div style={{ fontWeight: '800', fontSize: '13.5px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>TiDB Cloud MySQL:</span>
                  <span style={{ color: '#16A34A', fontWeight: '900' }}>
                    🟢 Connected (Online)
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                  Database: <b>{dbInfo?.database || 'kalishwaribilling'}</b> • Year <b>{activeYear}</b>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                color: '#334155',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              DB Settings
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
