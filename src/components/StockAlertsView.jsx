import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Package,
  Plus,
  Minus,
  Search,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  CheckCircle,
  XCircle,
  Edit,
  Sliders,
  ArrowRight,
  PackagePlus,
  PackageMinus,
  History,
  ShieldAlert
} from 'lucide-react';
import { updateProduct as apiUpdateProduct } from '../utils/api';

export function StockAlertsView({ products, setProducts, showToast, activeYear, loadProducts }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('low_and_out'); // 'all' | 'low_and_out' | 'out_of_stock' | 'low_stock' | 'adequate'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Alteration Modal State
  const [alterModal, setAlterModal] = useState({
    isOpen: false,
    product: null,
    mode: 'set_exact', // 'set_exact' | 'add_stock' | 'less_stock'
    newQty: 0,
    adjustQty: 10,
    reason: 'Physical Stock Audit (நேரடி சரிபார்ப்பு)'
  });

  // Calculate KPIs
  const totalItems = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  const outOfStockItems = products.filter(p => Number(p.stock) <= 0);
  const lowStockItems = products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 20);
  const adequateStockItems = products.filter(p => Number(p.stock) > 20);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const stock = Number(p.stock) || 0;
      const matchesSearch =
        (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.code && String(p.code).toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;

      let matchesStock = true;
      if (filterType === 'low_and_out') matchesStock = stock <= 20;
      else if (filterType === 'out_of_stock') matchesStock = stock <= 0;
      else if (filterType === 'low_stock') matchesStock = stock > 0 && stock <= 20;
      else if (filterType === 'adequate') matchesStock = stock > 20;

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, searchTerm, selectedCategory, filterType]);

  // Direct Inline Stock +/- Quick Adjust
  const handleQuickAdjust = async (product, delta) => {
    const currentStock = Number(product.stock) || 0;
    const newStock = Math.max(0, currentStock + delta);
    if (newStock === currentStock && delta < 0) {
      showToast(`"${product.name}" is already 0!`);
      return;
    }

    const updated = { ...product, stock: newStock };
    setProducts(prev => prev.map(p => (p.id === product.id ? updated : p)));

    try {
      await apiUpdateProduct(product.id, updated);
      showToast(
        delta > 0
          ? `+${delta} Added to "${product.name}" (Now: ${newStock} Boxes)`
          : `${delta} Deducted from "${product.name}" (Now: ${newStock} Boxes)`
      );
    } catch (err) {
      showToast(`Stock updated locally for "${product.name}" (${newStock})`);
    }
  };

  // Open Alter Modal
  const openAlterModal = (product, mode = 'set_exact') => {
    const stock = Number(product.stock) || 0;
    setAlterModal({
      isOpen: true,
      product,
      mode,
      newQty: stock,
      adjustQty: 10,
      reason: mode === 'add_stock' ? 'Supplier Inward (வரவு)' : (mode === 'less_stock' ? 'Damp / Damaged (சேதம்)' : 'Physical Stock Audit (நேரடி சரிபார்ப்பு)')
    });
  };

  // Save Alteration Modal to TiDB
  const handleSaveAlteration = async (e) => {
    e.preventDefault();
    if (!alterModal.product) return;

    const currentStock = Number(alterModal.product.stock) || 0;
    let finalStock = currentStock;

    if (alterModal.mode === 'set_exact') {
      finalStock = Math.max(0, Number(alterModal.newQty) || 0);
    } else if (alterModal.mode === 'add_stock') {
      finalStock = currentStock + Math.max(0, Number(alterModal.adjustQty) || 0);
    } else if (alterModal.mode === 'less_stock') {
      finalStock = Math.max(0, currentStock - Math.max(0, Number(alterModal.adjustQty) || 0));
    }

    const updatedProduct = { ...alterModal.product, stock: finalStock };

    // Update frontend state
    setProducts(prev => prev.map(p => (p.id === alterModal.product.id ? updatedProduct : p)));
    setAlterModal({ ...alterModal, isOpen: false });

    // Sync to TiDB Cloud
    try {
      await apiUpdateProduct(alterModal.product.id, updatedProduct);
      showToast(`Stock altered for "${alterModal.product.name}" -> ${finalStock} Boxes!`);
    } catch (err) {
      showToast(`Stock updated locally (${finalStock} Boxes)`);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (loadProducts) await loadProducts();
      showToast('Inventory stock refreshed from TiDB Cloud!');
    } catch (e) {
      showToast('Refresh failed');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="stock-alerts-view" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: '#FEF2F2',
            border: '1px solid #FEE2E2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#DC2626'
          }}>
            <ShieldAlert size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0F172A' }}>
                Stock &amp; Inventory Alerts (சரக்கு இருப்பு &amp; திருத்தம்)
              </h1>
              <span style={{
                background: '#FEE2E2',
                color: '#DC2626',
                fontSize: '11px',
                fontWeight: '800',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                {lowStockItems.length + outOfStockItems.length} Needs Attention
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>
              Real-time stock audit, out-of-stock monitor &amp; quick stock alteration / adjustment tools.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#334155',
              padding: '9px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: isRefreshing ? 'wait' : 'pointer'
            }}
          >
            <RefreshCw size={15} className={isRefreshing ? 'spin-anim' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh TiDB'}</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px'
      }}>
        {/* Out of Stock Card */}
        <div
          onClick={() => setFilterType('out_of_stock')}
          style={{
            background: filterType === 'out_of_stock' ? '#FEF2F2' : '#FFFFFF',
            border: filterType === 'out_of_stock' ? '2px solid #DC2626' : '1px solid #FEE2E2',
            borderRadius: '14px',
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#991B1B' }}>OUT OF STOCK (0)</span>
            <XCircle size={18} color="#DC2626" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#DC2626', marginTop: '6px' }}>
            {outOfStockItems.length} <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748B' }}>Items</span>
          </div>
          <div style={{ fontSize: '11px', color: '#B91C1C', marginTop: '4px', fontWeight: '600' }}>
            Immediate stock reorder required
          </div>
        </div>

        {/* Low Stock Card */}
        <div
          onClick={() => setFilterType('low_stock')}
          style={{
            background: filterType === 'low_stock' ? '#FFFBEB' : '#FFFFFF',
            border: filterType === 'low_stock' ? '2px solid #D97706' : '1px solid #FEF3C7',
            borderRadius: '14px',
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#92400E' }}>LOW STOCK (1-20 BOXES)</span>
            <AlertTriangle size={18} color="#D97706" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#D97706', marginTop: '6px' }}>
            {lowStockItems.length} <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748B' }}>Items</span>
          </div>
          <div style={{ fontSize: '11px', color: '#B45309', marginTop: '4px', fontWeight: '600' }}>
            Stock nearing threshold limit
          </div>
        </div>

        {/* Adequate Stock Card */}
        <div
          onClick={() => setFilterType('adequate')}
          style={{
            background: filterType === 'adequate' ? '#F0FDF4' : '#FFFFFF',
            border: filterType === 'adequate' ? '2px solid #16A34A' : '1px solid #DCFCE7',
            borderRadius: '14px',
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#166534' }}>ADEQUATE STOCK (&gt;20)</span>
            <CheckCircle size={18} color="#16A34A" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#16A34A', marginTop: '6px' }}>
            {adequateStockItems.length} <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748B' }}>Items</span>
          </div>
          <div style={{ fontSize: '11px', color: '#15803D', marginTop: '4px', fontWeight: '600' }}>
            Sufficient warehouse reserves
          </div>
        </div>

        {/* Total Stock Units Card */}
        <div
          onClick={() => setFilterType('all')}
          style={{
            background: filterType === 'all' ? '#FFF7ED' : '#FFFFFF',
            border: filterType === 'all' ? '2px solid #EA580C' : '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#9A3412' }}>TOTAL UNITS IN GODOWN</span>
            <Package size={18} color="#EA580C" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#EA580C', marginTop: '6px' }}>
            {totalStockUnits.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748B' }}>Boxes</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', fontWeight: '600' }}>
            Across {totalItems} catalog items
          </div>
        </div>
      </div>

      {/* 3. Filters and Search Ribbon */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '16px 20px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '8px 14px',
            width: '320px'
          }}>
            <Search size={16} color="#94A3B8" />
            <input
              type="text"
              placeholder="Search by code (1, 2) or cracker name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '13px',
                color: '#0F172A',
                width: '100%'
              }}
            />
          </div>

          {/* Quick Filter Pill Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            {[
              { id: 'low_and_out', label: `⚠️ Low & Out (${lowStockItems.length + outOfStockItems.length})` },
              { id: 'out_of_stock', label: `❌ Out of Stock (${outOfStockItems.length})` },
              { id: 'low_stock', label: `⚠️ Low Stock (${lowStockItems.length})` },
              { id: 'adequate', label: `✅ Adequate (${adequateStockItems.length})` },
              { id: 'all', label: `All Items (${totalItems})` },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id)}
                style={{
                  border: filterType === f.id ? '1px solid #EA580C' : '1px solid #E2E8F0',
                  background: filterType === f.id ? '#FFF7ED' : '#FFFFFF',
                  color: filterType === f.id ? '#C2410C' : '#475569',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: filterType === f.id ? '800' : '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px'
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                border: selectedCategory === cat ? '1px solid #EA580C' : '1px solid #E2E8F0',
                background: selectedCategory === cat ? '#EA580C' : '#FFFFFF',
                color: selectedCategory === cat ? '#FFFFFF' : '#475569',
                padding: '5px 12px',
                borderRadius: '16px',
                fontSize: '11px',
                fontWeight: selectedCategory === cat ? '700' : '500',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {cat === 'All' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Stock Table with Inline Alteration Controls */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748B' }}>CODE</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748B' }}>CRACKER NAME</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748B' }}>CATEGORY</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748B' }}>PACKING</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748B', textAlign: 'center' }}>MIN REORDER</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748B', textAlign: 'center' }}>CURRENT STOCK</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748B', textAlign: 'center' }}>STATUS / DEFICIT</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#EA580C', textAlign: 'center' }}>QUICK STOCK ALTER (கழிவு/வரவு)</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748B', textAlign: 'center' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    No crackers match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p, idx) => {
                  const stockNum = Number(p.stock) || 0;
                  const isOut = stockNum <= 0;
                  const isLow = stockNum > 0 && stockNum <= 20;

                  return (
                    <tr
                      key={p.id || idx}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        background: isOut ? '#FEF2F2' : (isLow ? '#FFFDF5' : '#FFFFFF'),
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: '700' }}>
                        <span style={{
                          background: isOut ? '#FEE2E2' : '#FFF7ED',
                          color: isOut ? '#991B1B' : '#C2410C',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: isOut ? '1px solid #FECACA' : '1px solid #FFEDD5',
                          fontSize: '11px',
                          fontWeight: '800'
                        }}>
                          SKC-{String(p.code).padStart(2, '0')}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A' }}>
                          {p.name}
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          padding: '3px 9px',
                          borderRadius: '12px',
                          background: '#F1F5F9',
                          color: '#475569'
                        }}>
                          {p.category || 'General'}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#64748B' }}>
                        {p.content || '1 Box'}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>
                        20 Boxes
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '900',
                          color: isOut ? '#DC2626' : (isLow ? '#D97706' : '#16A34A')
                        }}>
                          {stockNum} <span style={{ fontSize: '11px', fontWeight: '600' }}>Box</span>
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {isOut ? (
                          <span style={{
                            background: '#FEE2E2',
                            color: '#DC2626',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '800'
                          }}>
                            ❌ Out of Stock
                          </span>
                        ) : isLow ? (
                          <span style={{
                            background: '#FEF3C7',
                            color: '#D97706',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '800'
                          }}>
                            ⚠️ Low ({20 - stockNum} deficit)
                          </span>
                        ) : (
                          <span style={{
                            background: '#DCFCE7',
                            color: '#16A34A',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '800'
                          }}>
                            ✅ Adequate
                          </span>
                        )}
                      </td>

                      {/* QUICK STOCK ALTERATION CONTROLS (+ / - buttons) */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          padding: '2px 4px'
                        }}>
                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(p, -1)}
                            disabled={stockNum <= 0}
                            title="Quick Deduct 1 Box (கழிவு)"
                            style={{
                              width: '24px',
                              height: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: 'none',
                              borderRadius: '4px',
                              background: stockNum <= 0 ? '#E2E8F0' : '#FEE2E2',
                              color: stockNum <= 0 ? '#94A3B8' : '#DC2626',
                              cursor: stockNum <= 0 ? 'not-allowed' : 'pointer',
                              fontWeight: '900'
                            }}
                          >
                            <Minus size={13} />
                          </button>

                          <span style={{
                            fontSize: '12px',
                            fontWeight: '800',
                            minWidth: '32px',
                            color: isOut ? '#DC2626' : '#0F172A'
                          }}>
                            {stockNum}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(p, 1)}
                            title="Quick Add 1 Box (வரவு)"
                            style={{
                              width: '24px',
                              height: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: 'none',
                              borderRadius: '4px',
                              background: '#DCFCE7',
                              color: '#16A34A',
                              cursor: 'pointer',
                              fontWeight: '900'
                            }}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </td>

                      {/* ACTION: ALTER STOCK MODAL BUTTON */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => openAlterModal(p, 'set_exact')}
                          style={{
                            background: '#FFF7ED',
                            border: '1px solid #FED7AA',
                            color: '#EA580C',
                            padding: '5px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <Sliders size={13} />
                          <span>Alter Stock</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. INTERACTIVE STOCK ALTER MODAL */}
      {alterModal.isOpen && alterModal.product && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #E2E8F0',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              background: '#0F172A',
              color: '#FFFFFF',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sliders size={20} color="#EA580C" />
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800' }}>
                  Alter Stock (இருப்பு திருத்தம்)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAlterModal({ ...alterModal, isOpen: false })}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '20px',
                  cursor: 'pointer',
                  fontWeight: '700'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSaveAlteration} style={{ padding: '24px' }}>
              {/* Product Info Banner */}
              <div style={{
                background: '#FFF7ED',
                border: '1px solid #FED7AA',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#9A3412', textTransform: 'uppercase' }}>
                  SKC-{String(alterModal.product.code).padStart(2, '0')} • {alterModal.product.category}
                </div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>
                  {alterModal.product.name}
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Current Warehouse Stock: <strong style={{ color: '#EA580C', fontSize: '14px' }}>{alterModal.product.stock} Boxes</strong> ({alterModal.product.content})
                </div>
              </div>

              {/* Mode Tabs: Set Exact / Add Inward / Less Outward */}
              <div style={{
                display: 'flex',
                background: '#F1F5F9',
                borderRadius: '10px',
                padding: '4px',
                marginBottom: '20px'
              }}>
                <button
                  type="button"
                  onClick={() => setAlterModal({ ...alterModal, mode: 'set_exact' })}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: alterModal.mode === 'set_exact' ? '#FFFFFF' : 'transparent',
                    color: alterModal.mode === 'set_exact' ? '#0F172A' : '#64748B',
                    fontWeight: alterModal.mode === 'set_exact' ? '800' : '600',
                    fontSize: '12px',
                    boxShadow: alterModal.mode === 'set_exact' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Set Exact Stock
                </button>
                <button
                  type="button"
                  onClick={() => setAlterModal({ ...alterModal, mode: 'add_stock' })}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: alterModal.mode === 'add_stock' ? '#DCFCE7' : 'transparent',
                    color: alterModal.mode === 'add_stock' ? '#166534' : '#64748B',
                    fontWeight: alterModal.mode === 'add_stock' ? '800' : '600',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  ➕ Add Inward (வரவு)
                </button>
                <button
                  type="button"
                  onClick={() => setAlterModal({ ...alterModal, mode: 'less_stock' })}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: alterModal.mode === 'less_stock' ? '#FEE2E2' : 'transparent',
                    color: alterModal.mode === 'less_stock' ? '#991B1B' : '#64748B',
                    fontWeight: alterModal.mode === 'less_stock' ? '800' : '600',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  ➖ Less Outward (கழிவு)
                </button>
              </div>

              {/* Mode 1: Set Exact Stock */}
              {alterModal.mode === 'set_exact' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    New Actual Stock Count (Boxes):
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={alterModal.newQty}
                    onChange={(e) => setAlterModal({ ...alterModal, newQty: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '16px',
                      fontWeight: '800',
                      color: '#0F172A',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                    Previous was {alterModal.product.stock}. Difference: {Number(alterModal.newQty) - Number(alterModal.product.stock)} boxes.
                  </div>
                </div>
              )}

              {/* Mode 2: Add Inward */}
              {alterModal.mode === 'add_stock' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#166534', marginBottom: '6px' }}>
                    Quantity to Add (+ வரவு Boxes):
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={alterModal.adjustQty}
                    onChange={(e) => setAlterModal({ ...alterModal, adjustQty: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #86EFAC',
                      fontSize: '16px',
                      fontWeight: '800',
                      color: '#166534',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {/* Preset Buttons */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    {[5, 10, 25, 50, 100].map(qty => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setAlterModal({ ...alterModal, adjustQty: qty })}
                        style={{
                          flex: 1,
                          padding: '5px',
                          borderRadius: '6px',
                          border: '1px solid #BBF7D0',
                          background: '#F0FDF4',
                          color: '#15803D',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        +{qty}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: '12px', color: '#15803D', marginTop: '6px', fontWeight: '600' }}>
                    New Total will be: <strong>{Number(alterModal.product.stock) + (Number(alterModal.adjustQty) || 0)} Boxes</strong>
                  </div>
                </div>
              )}

              {/* Mode 3: Less Outward */}
              {alterModal.mode === 'less_stock' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#991B1B', marginBottom: '6px' }}>
                    Quantity to Deduct (- கழிவு Boxes):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={alterModal.product.stock}
                    required
                    value={alterModal.adjustQty}
                    onChange={(e) => setAlterModal({ ...alterModal, adjustQty: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #FCA5A5',
                      fontSize: '16px',
                      fontWeight: '800',
                      color: '#991B1B',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {/* Preset Buttons */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    {[1, 5, 10, 20].map(qty => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setAlterModal({ ...alterModal, adjustQty: qty })}
                        style={{
                          flex: 1,
                          padding: '5px',
                          borderRadius: '6px',
                          border: '1px solid #FECACA',
                          background: '#FEF2F2',
                          color: '#B91C1C',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        -{qty}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: '12px', color: '#B91C1C', marginTop: '6px', fontWeight: '600' }}>
                    New Total will be: <strong>{Math.max(0, Number(alterModal.product.stock) - (Number(alterModal.adjustQty) || 0))} Boxes</strong>
                  </div>
                </div>
              )}

              {/* Reason Selector */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Reason for Alteration (காரணம்):
                </label>
                <select
                  value={alterModal.reason}
                  onChange={(e) => setAlterModal({ ...alterModal, reason: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    color: '#0F172A',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Physical Stock Audit (நேரடி சரிபார்ப்பு)">Physical Stock Audit (நேரடி சரிபார்ப்பு)</option>
                  <option value="Supplier Batch Arrival (வரவு சரக்கு சேர்க்கை)">Supplier Batch Arrival (வரவு சரக்கு சேர்க்கை)</option>
                  <option value="Damage / Moisture / Wet (சேதம் / ஈரம்)">Damage / Moisture / Wet (சேதம் / ஈரம்)</option>
                  <option value="Customer Return (திரும்பப் பெறப்பட்டது)">Customer Return (திரும்பப் பெறப்பட்டது)</option>
                  <option value="Direct Counter Sale Adjustment">Direct Counter Sale Adjustment</option>
                </select>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setAlterModal({ ...alterModal, isOpen: false })}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    padding: '11px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#EA580C',
                    color: '#FFFFFF',
                    fontWeight: '800',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)'
                  }}
                >
                  Save &amp; Sync to TiDB Cloud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
