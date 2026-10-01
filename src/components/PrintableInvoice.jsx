import React from 'react';

export function PrintableInvoice({ invoice, company }) {
  if (!invoice) return null;

  const items = invoice.items || [];
  const totalQty = items.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);
  const nowTime = invoice.time || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  // Format currency
  const fmt = (num) => Number(num || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return (
    <div className="print-invoice-sheet" style={{
      width: '100%',
      maxWidth: '800px',
      margin: '0 auto',
      background: '#FFFFFF',
      color: '#0F172A',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      padding: '24px 28px',
      boxSizing: 'border-box',
      fontSize: '12px',
      lineHeight: '1.4'
    }}>

      {/* TOP HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E2E8F0', paddingBottom: '14px' }}>
        
        {/* Left: Brand Details */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          {/* Logo Badge */}
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF6B35 0%, #EA580C 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: '900',
            fontSize: '22px',
            boxShadow: '0 4px 10px rgba(255, 107, 53, 0.3)',
            flexShrink: 0
          }}>
            SK
          </div>

          <div>
            <h1 style={{ margin: '0 0 2px 0', fontSize: '20px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.3px' }}>
              {company?.name || 'Shri Gugan Crackers'}
            </h1>
            <div style={{ fontSize: '9px', fontWeight: '800', color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
              {company?.tagline || 'DIRECT SIVAKASI FIREWORKS • RETAIL & WHOLESALE'}
            </div>
            <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.4' }}>
              Address: {company?.address || 'Maraneri, Sivakasi - 626123, Virudhunagar Dist, Tamil Nadu'}
            </div>
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
              <span>Ph: <b>{company?.mobile || '+91 9489280123'}</b></span>
              <span style={{ margin: '0 6px', color: '#CBD5E1' }}>•</span>
              <span>Email: {company?.email || 'sales@srikaliswaricrackers.com'}</span>
            </div>
            {company?.gstin && (
              <div style={{ fontSize: '11px', color: '#1E293B', fontWeight: '700', marginTop: '2px' }}>
                GSTIN: <span style={{ color: '#2563EB' }}>{company.gstin}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Premium Quality Badge */}
        <div style={{
          border: '1px dashed #CBD5E1',
          borderRadius: '8px',
          padding: '8px 12px',
          background: '#F8FAFC',
          textAlign: 'left',
          minWidth: '150px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#EA580C' }}>Premium Quality</div>
          <div style={{ fontSize: '10px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>Crackers</div>
          <div style={{ fontSize: '9px', color: '#059669', display: 'flex', flexDirection: 'column', gap: '2px', fontWeight: '600' }}>
            <span>✓ Safe & Reliable</span>
            <span>✓ Wide Range</span>
            <span>✓ Best Prices</span>
          </div>
        </div>
      </div>

      {/* INVOICE TITLE & META BAR */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid #E2E8F0'
      }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#1E293B', letterSpacing: '0.5px' }}>
            {invoice.type === 'estimate' ? 'ESTIMATE' : (invoice.type === 'quotation' ? 'QUOTATION' : 'INVOICE')}
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', fontStyle: 'italic' }}>
            Thank you for your purchase!
          </div>
        </div>

        <div style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          padding: '6px 14px',
          fontSize: '11px',
          display: 'grid',
          gridTemplateColumns: 'auto auto',
          columnGap: '12px',
          rowGap: '2px'
        }}>
          <span style={{ color: '#64748B', fontWeight: '600' }}>Invoice No</span>
          <span style={{ fontWeight: '800', color: '#EA580C', textAlign: 'right' }}>: INV-{invoice.billNo || '1'}</span>
          
          <span style={{ color: '#64748B', fontWeight: '600' }}>Date</span>
          <span style={{ fontWeight: '700', color: '#1E293B', textAlign: 'right' }}>: {invoice.date || new Date().toISOString().split('T')[0]}</span>
          
          <span style={{ color: '#64748B', fontWeight: '600' }}>Time</span>
          <span style={{ fontWeight: '700', color: '#1E293B', textAlign: 'right' }}>: {nowTime}</span>
        </div>
      </div>

      {/* CUSTOMER DETAILS CARD */}
      <div style={{
        margin: '12px 0',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        padding: '10px 14px',
        background: '#FAFBFC'
      }}>
        <div style={{ fontSize: '11px', fontWeight: '800', color: '#2563EB', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>👤 Customer Details</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px', fontSize: '11.5px' }}>
          <div>
            <span style={{ color: '#64748B' }}>Name : </span>
            <strong style={{ color: '#0F172A' }}>{invoice.customerName || 'Direct Cash Customer'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748B' }}>Phone : </span>
            <strong style={{ color: '#0F172A' }}>{invoice.customerMobile || '-'}</strong>
          </div>
        </div>
        <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
          <span style={{ color: '#64748B' }}>Address : </span>
          <span>{invoice.customerAddress || 'Direct Counter Sale, Sivakasi'}</span>
        </div>
        {invoice.customerGstin && invoice.customerGstin !== '-' && (
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
            <span style={{ color: '#64748B' }}>GSTIN : </span>
            <strong style={{ color: '#1E293B' }}>{invoice.customerGstin}</strong>
          </div>
        )}
      </div>

      {/* ITEMS TABLE */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '11px',
        marginBottom: '14px',
        border: '1px solid #CBD5E1'
      }}>
        <thead>
          <tr style={{ background: '#1E293B', color: '#FFFFFF', textAlign: 'left', fontWeight: '700' }}>
            <th style={{ padding: '7px 8px', width: '36px', textAlign: 'center' }}>S.N</th>
            <th style={{ padding: '7px 8px' }}>Cracker Name</th>
            <th style={{ padding: '7px 8px', width: '90px' }}>Category</th>
            <th style={{ padding: '7px 8px', width: '90px' }}>Brand / Packing</th>
            <th style={{ padding: '7px 8px', width: '65px', textAlign: 'right' }}>MRP (₹)</th>
            <th style={{ padding: '7px 8px', width: '65px', textAlign: 'right' }}>Sell Price</th>
            <th style={{ padding: '7px 8px', width: '42px', textAlign: 'center' }}>Qty</th>
            <th style={{ padding: '7px 8px', width: '48px', textAlign: 'center' }}>Disc %</th>
            <th style={{ padding: '7px 8px', width: '70px', textAlign: 'right' }}>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => {
            const rowTotal = (Number(it.qty) || 1) * (Number(it.rate) || 0);
            return (
              <tr key={idx} style={{
                borderBottom: '1px solid #E2E8F0',
                background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'
              }}>
                <td style={{ padding: '6px 8px', textAlign: 'center', color: '#64748B' }}>{idx + 1}</td>
                <td style={{ padding: '6px 8px', fontWeight: '700', color: '#1E293B' }}>{it.name}</td>
                <td style={{ padding: '6px 8px', color: '#64748B' }}>{it.category || 'Standard'}</td>
                <td style={{ padding: '6px 8px', color: '#64748B' }}>{it.content || '1 Box'}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', color: '#64748B' }}>{fmt(it.rate)}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>
                  {fmt(it.rate * (1 - (Number(invoice.discountPercent) || 0) / 100))}
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: '800', color: '#2563EB' }}>{it.qty}</td>
                <td style={{ padding: '6px 8px', textAlign: 'center', color: '#DC2626', fontWeight: '600' }}>
                  {invoice.discountPercent || 0}%
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '800', color: '#0F172A' }}>
                  {fmt(rowTotal * (1 - (Number(invoice.discountPercent) || 0) / 100))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* SUMMARY & TERMS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', alignItems: 'start', marginBottom: '14px' }}>
        
        {/* Left: Terms & Conditions */}
        <div style={{
          border: '1px solid #FED7AA',
          borderRadius: '8px',
          background: '#FFF7ED',
          padding: '10px 12px',
          fontSize: '10px',
          color: '#7C2D12'
        }}>
          <div style={{ fontWeight: '800', marginBottom: '5px', textTransform: 'uppercase', color: '#C2410C' }}>
            ℹ Terms & Conditions
          </div>
          <ol style={{ margin: 0, paddingLeft: '16px', lineHeight: '1.5' }}>
            <li>Goods once sold will not be exchanged or refunded.</li>
            <li>Store crackers in a cool, dry place away from heat.</li>
            <li>Always light crackers under adult supervision.</li>
            <li>Subject to Sivakasi jurisdiction only.</li>
          </ol>
        </div>

        {/* Right: Calculations Box */}
        <div style={{
          border: '1px solid #CBD5E1',
          borderRadius: '8px',
          background: '#FAFBFC',
          padding: '10px 14px',
          fontSize: '11px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
            <span style={{ color: '#64748B', fontWeight: '600' }}>Total Qty</span>
            <strong style={{ color: '#1E293B' }}>{totalQty} Items</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
            <span style={{ color: '#64748B', fontWeight: '600' }}>Subtotal (Gross)</span>
            <span style={{ fontWeight: '700', color: '#1E293B' }}>₹ {fmt(invoice.grossTotal)}</span>
          </div>

          {Number(invoice.discountAmount) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#DC2626' }}>
              <span>Discount ({invoice.discountPercent || 0}%)</span>
              <span style={{ fontWeight: '700' }}>- ₹ {fmt(invoice.discountAmount)}</span>
            </div>
          )}

          {Number(invoice.additionalDiscountAmount) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#DC2626' }}>
              <span>Extra Discount</span>
              <span style={{ fontWeight: '700' }}>- ₹ {fmt(invoice.additionalDiscountAmount)}</span>
            </div>
          )}

          {Number(invoice.packingCharge) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
              <span style={{ color: '#64748B' }}>Packing Charge</span>
              <span style={{ fontWeight: '700' }}>+ ₹ {fmt(invoice.packingCharge)}</span>
            </div>
          )}

          {Number(invoice.gstAmount) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
              <span style={{ color: '#2563EB', fontWeight: '600' }}>GST ({invoice.gstPercent}%)</span>
              <span style={{ fontWeight: '700', color: '#2563EB' }}>+ ₹ {fmt(invoice.gstAmount)}</span>
            </div>
          )}

          {/* Grand Total Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '2px solid #0F172A',
            borderBottom: '2px solid #0F172A',
            padding: '6px 0',
            marginTop: '6px',
            fontSize: '13px'
          }}>
            <strong style={{ color: '#0F172A', fontWeight: '900' }}>Grand Total</strong>
            <strong style={{ color: '#EA580C', fontSize: '16px', fontWeight: '900' }}>
              ₹ {fmt(invoice.netAmount)}
            </strong>
          </div>

          {/* Payment Status */}
          <div style={{
            marginTop: '8px',
            padding: '6px',
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '6px',
            textAlign: 'center',
            fontSize: '10.5px',
            fontWeight: '800',
            color: '#065F46'
          }}>
            ✓ {invoice.paymentMode ? invoice.paymentMode.toUpperCase() : 'CASH'} ₹ {fmt(invoice.netAmount)} (PAID)
          </div>
        </div>

      </div>

      {/* THANK YOU VISIT AGAIN */}
      <div style={{ textAlign: 'center', margin: '14px 0 10px 0' }}>
        <div style={{
          fontFamily: "'Brush Script MT', 'Dancing Script', cursive, sans-serif",
          fontSize: '24px',
          color: '#1E3A8A',
          fontWeight: '700'
        }}>
          Thank You!
        </div>
        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', letterSpacing: '0.5px' }}>
          Visit Again
        </div>
      </div>

      {/* BOTTOM FOOTER BAR */}
      <div style={{
        background: '#0F172A',
        color: '#FFFFFF',
        padding: '7px 12px',
        borderRadius: '6px',
        textAlign: 'center',
        fontSize: '9.5px',
        fontWeight: '500',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap'
      }}>
        <span>{company?.name || 'Shri Gugan Crackers'}</span>
        <span>|</span>
        <span>Maraneri, Sivakasi</span>
        <span>|</span>
        <span>Ph: {company?.mobile || '+91 9489280123'}</span>
        <span>|</span>
        <span>Web: www.srikaliswaricrackers.com</span>
        <span>|</span>
        <span>Email: {company?.email || 'shrigugancrackers@gmail.com'}</span>
      </div>

    </div>
  );
}
