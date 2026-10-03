import React from 'react';
import {
  PackagePlus,
  Search,
  CheckCircle,
  Truck,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Receipt,
  RotateCcw,
  Database
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatNumber } from '../utils/pdfGenerator';
import { updateProduct as apiUpdateProduct } from '../utils/api';

export function StockInwardView({
  products = [],
  setProducts,
  suppliers = [],
  activeYear = '2026',
  showToast,
  loadProducts
}) {
  const [selectedProductId, setSelectedProductId] = React.useState(products[0]?.id ? String(products[0].id) : '');
  const [inwardQty, setInwardQty] = React.useState('100');
  const [supplierName, setSupplierName] = React.useState(suppliers[0]?.name || 'Sri Kaliswari Unit 1 - Sivakasi');
  const [inwardRate, setInwardRate] = React.useState('');
  const [challanNo, setChallanNo] = React.useState('DC-' + Math.floor(1000 + Math.random() * 9000));
  const [inwardDate, setInwardDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = React.useState('Fresh Factory Production Stock');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Inward history state (persisted in localStorage)
  const [inwardHistory, setInwardHistory] = React.useState(() => {
    try {
      const saved = localStorage.getItem(`kalieswari_inward_history_${activeYear}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const selectedProduct = products.find(p => String(p.id) === String(selectedProductId)) || products[0];

  const handleInwardSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      showToast('Please select a valid cracker product!');
      return;
    }

    const qtyToAdd = Number(inwardQty) || 0;
    if (qtyToAdd <= 0) {
      showToast('Inward Quantity must be greater than 0!');
      return;
    }

    setIsSubmitting(true);
    const currentStock = Number(selectedProduct.stock) || 0;
    const newStock = currentStock + qtyToAdd;

    // Optimistically update product in React state
    const updatedProduct = { ...selectedProduct, stock: newStock };
    setProducts(prev => prev.map(p => p.id === selectedProduct.id ? updatedProduct : p));

    // Create history entry
    const newEntry = {
      id: Date.now(),
      date: inwardDate,
      challanNo,
      productId: selectedProduct.id,
      productCode: selectedProduct.code,
      productName: selectedProduct.name,
      qty: qtyToAdd,
      previousStock: currentStock,
      newStock: newStock,
      supplier: supplierName,
      rate: Number(inwardRate) || selectedProduct.rate,
      totalValue: (Number(inwardRate) || selectedProduct.rate) * qtyToAdd,
      notes
    };

    const newHistory = [newEntry, ...inwardHistory];
    setInwardHistory(newHistory);
    try {
      localStorage.setItem(`kalieswari_inward_history_${activeYear}`, JSON.stringify(newHistory));
    } catch (e) {}

    try {
      await apiUpdateProduct(selectedProduct.id, updatedProduct);
      if (loadProducts) await loadProducts();
      showToast(`✅ +${qtyToAdd} Stock Inward Recorded! New Stock for "${selectedProduct.name}": ${newStock}`);
      try { confetti({ particleCount: 50, spread: 60 }); } catch (c) {}
    } catch (err) {
      console.warn('Updated locally, TiDB error:', err);
      showToast(`Stock updated locally (+${qtyToAdd}) for "${selectedProduct.name}" (${newStock})`);
    } finally {
      setIsSubmitting(false);
      // Generate next challan
      setChallanNo('DC-' + Math.floor(1000 + Math.random() * 9000));
      setInwardQty('100');
    }
  };

  const totalInwardUnits = inwardHistory.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);
  const totalInwardValue = inwardHistory.reduce((acc, curr) => acc + (Number(curr.totalValue) || 0), 0);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(p.code).includes(searchTerm) ||
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

      {/* Header */}
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
            background: '#F0FDF4',
            color: '#16A34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <PackagePlus size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0F172A' }}>
              Stock Inward Entry (சரக்கு வரவு பதிவு)
            </h2>
            <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#64748B' }}>
              Record fresh purchase batches arriving from Sivakasi factory units &amp; update TiDB stock
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ background: '#F8FAFC', padding: '10px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Total Inward Units</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#16A34A' }}>+{formatNumber(totalInwardUnits)}</div>
          </div>
          <div style={{ background: '#F8FAFC', padding: '10px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Purchase Value</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>₹{formatNumber(totalInwardValue)}</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Entry Form (Left) & Recent Inward History (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px'
      }}>
        {/* Left: Inward Form */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={17} color="#16A34A" />
            <span>New Cracker Arrival (புதிய சரக்கு வரவு)</span>
          </h3>

          <form onSubmit={handleInwardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 1. Cracker Product Selection */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                Select Cracker Item (பட்டாசு தேர்வு) *
              </label>
              <select
                value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 12px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  color: '#0F172A'
                }}
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    #{p.code} - {p.name} (Current Stock: {p.stock})
                  </option>
                ))}
              </select>
            </div>

            {/* Current Stock Preview Banner */}
            {selectedProduct && (
              <div style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '11.5px', color: '#166534', fontWeight: '700' }}>CURRENT INVENTORY STOCK</div>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: '#16A34A' }}>
                    {selectedProduct.stock} Units
                  </div>
                </div>
                <ArrowRight size={18} color="#16A34A" />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11.5px', color: '#166534', fontWeight: '700' }}>NEW ESTIMATED STOCK</div>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: '#0F172A' }}>
                    {(Number(selectedProduct.stock) || 0) + (Number(inwardQty) || 0)} Units
                  </div>
                </div>
              </div>
            )}

            {/* 2. Inward Quantity & Inward Rate */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Inward Quantity (வரவு எண்ணிக்கை) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={inwardQty}
                  onChange={e => setInwardQty(e.target.value)}
                  placeholder="e.g. 100"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    fontWeight: '800',
                    color: '#16A34A'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Purchase Cost / Rate (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={inwardRate}
                  onChange={e => setInwardRate(e.target.value)}
                  placeholder={selectedProduct ? String(selectedProduct.rate) : '0'}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    fontWeight: '700'
                  }}
                />
              </div>
            </div>

            {/* 3. Supplier / Manufacturer */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                Supplier / Factory Unit (விநியோகஸ்தர் / தயாரிப்பாளர்)
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={e => setSupplierName(e.target.value)}
                placeholder="e.g. Sri Kaliswari Fireworks Unit 1"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13.5px'
                }}
              />
            </div>

            {/* 4. DC / Challan No & Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  DC / Challan No
                </label>
                <input
                  type="text"
                  value={challanNo}
                  onChange={e => setChallanNo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    fontWeight: '700'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Arrival Date (வரவு தேதி)
                </label>
                <input
                  type="date"
                  value={inwardDate}
                  onChange={e => setInwardDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>

            {/* 5. Notes */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                Warehouse Notes / Remarks
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Sivakasi Main Godown Batch A"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: '8px',
                background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '13px 20px',
                borderRadius: '12px',
                fontWeight: '800',
                fontSize: '14.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)'
              }}
            >
              <PackagePlus size={18} />
              <span>{isSubmitting ? 'Saving to TiDB Cloud...' : '📥 Record Inward Stock & Update TiDB'}</span>
            </button>
          </form>
        </div>

        {/* Right: Inward Stock History Table */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontWeight: '800', fontSize: '15px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={17} color="#16A34A" />
              <span>Inward Arrival Log (வரவு பதிவுகள்)</span>
            </div>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>
              {inwardHistory.length} Batches
            </span>
          </div>

          <div style={{ flex: 1, overflowX: 'auto', maxHeight: '520px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '11.5px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 14px' }}>Date / DC</th>
                  <th style={{ padding: '10px 14px' }}>Cracker Item</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Inward Qty</th>
                  <th style={{ padding: '10px 14px' }}>Supplier</th>
                </tr>
              </thead>
              <tbody>
                {inwardHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                      No stock inward batches logged yet. Fill the form on the left to record incoming cracker stocks!
                    </td>
                  </tr>
                ) : (
                  inwardHistory.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: '700', color: '#0F172A' }}>{item.date}</div>
                        <div style={{ fontSize: '11px', color: '#EA580C', fontWeight: '800' }}>{item.challanNo}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: '700', color: '#0F172A' }}>{item.productName}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>Code #{item.productCode} • Stock: {item.previousStock} ➔ <b>{item.newStock}</b></div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <span style={{
                          background: '#DCFCE7',
                          color: '#15803D',
                          fontWeight: '800',
                          fontSize: '12px',
                          padding: '3px 8px',
                          borderRadius: '6px'
                        }}>
                          +{item.qty}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#475569', fontSize: '12px' }}>
                        {item.supplier}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
