import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Printer,
  Download,
  Share2,
  Percent,
  CheckCircle,
  AlertCircle,
  Plus,
  RefreshCw,
  Sparkles,
  Phone,
  Tag
} from 'lucide-react';
import { initialCategories } from '../data/defaultData';
import { formatCurrency } from '../utils/pdfGenerator';

export function PriceListView({ products, setProducts, company, showToast, onSelectProductForBill }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [discountPercent, setDiscountPercent] = useState(60);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('code'); // 'code' | 'name' | 'rate_asc' | 'rate_desc'

  const categories = useMemo(() => {
    return ['All', ...initialCategories];
  }, []);

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
        const matchesSearch =
          (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (p.code && String(p.code).toLowerCase().includes(searchTerm.toLowerCase())) ||
          (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStock = inStockOnly ? Number(p.stock) > 0 : true;
        return matchesCat && matchesSearch && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'rate_asc') return Number(a.rate) - Number(b.rate);
        if (sortBy === 'rate_desc') return Number(b.rate) - Number(a.rate);
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
        // Default: Sort by code numeric or alphabetic
        const codeA = parseInt(a.code, 10);
        const codeB = parseInt(b.code, 10);
        if (!isNaN(codeA) && !isNaN(codeB)) return codeA - codeB;
        return String(a.code || '').localeCompare(String(b.code || ''));
      });
  }, [products, selectedCategory, searchTerm, inStockOnly, sortBy]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredProducts.length === 0) {
      showToast('No products to export!');
      return;
    }
    const headers = ['Code', 'Cracker Name', 'Category', 'Packing/Content', 'MRP (Rs)', 'Discount %', 'Net Rate (Rs)', 'Stock Availability'];
    const rows = filteredProducts.map(p => {
      const mrp = Number(p.rate) || 0;
      const netRate = Math.round(mrp * (1 - discountPercent / 100));
      const stockStatus = Number(p.stock) > 0 ? 'In Stock' : 'Out of Stock';
      return [
        `"SKC-${String(p.code).padStart(2, '0')}"`,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${p.category || ''}"`,
        `"${p.content || ''}"`,
        mrp,
        `${discountPercent}%`,
        netRate,
        `"${stockStatus}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sri_Kaliswari_Crackers_Price_List_${discountPercent}pct.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Price list exported to CSV successfully!');
  };

  // WhatsApp Share Price List
  const handleWhatsAppShare = () => {
    let msg = `*🎇 SRI KALISWARI CRACKERS - SIVAKASI*\n`;
    msg += `*SPECIAL FESTIVAL PRICE LIST (${discountPercent}% FLAT DISCOUNT)*\n`;
    if (company?.mobile) msg += `📞 Contact / Orders: ${company.mobile}\n`;
    msg += `----------------------------------------\n\n`;

    const sampleItems = filteredProducts.slice(0, 35);
    sampleItems.forEach(p => {
      const mrp = Number(p.rate) || 0;
      const netRate = Math.round(mrp * (1 - discountPercent / 100));
      msg += `🔹 *${p.name}*\n`;
      msg += `   MRP: ~Rs.${mrp}~ ➡️ *Offer: Rs.${netRate}* (${p.content || '1 Box'})\n`;
    });

    if (filteredProducts.length > 35) {
      msg += `\n...and ${filteredProducts.length - 35} more items available!\n`;
    }

    msg += `\n✨ Minimum Order: Rs. 3,000 | Safe All-India Transport Delivery!`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Print Price List
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pricelist-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Card */}
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
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#FFF7ED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EA580C'
            }}>
              <FileText size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0F172A' }}>
                Crackers Price List Master (விலைப் பட்டியல்)
              </h1>
              <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#64748B' }}>
                Official catalog rates, wholesale tiers &amp; Sivakasi festival discount sheets.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          {/* Discount Pill Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: '10px',
            padding: '4px 10px'
          }}>
            <Percent size={15} color="#EA580C" />
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Discount:</span>
            {[50, 60, 70, 75, 80].map(pct => (
              <button
                key={pct}
                type="button"
                onClick={() => setDiscountPercent(pct)}
                style={{
                  border: 'none',
                  background: discountPercent === pct ? '#EA580C' : 'transparent',
                  color: discountPercent === pct ? '#FFFFFF' : '#475569',
                  fontWeight: discountPercent === pct ? '800' : '600',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {pct}%
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
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
              cursor: 'pointer'
            }}
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#25D366',
              border: 'none',
              color: '#FFFFFF',
              padding: '9px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <Share2 size={15} />
            <span>WhatsApp Rates</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#0F172A',
              border: 'none',
              color: '#FFFFFF',
              padding: '9px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <Printer size={15} />
            <span>Print Price List</span>
          </button>
        </div>
      </div>

      {/* Filter and Category Ribbon */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '16px 20px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {/* Search, Sort and In-stock Toggle */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '8px 14px',
            width: '340px'
          }}>
            <Search size={16} color="#94A3B8" />
            <input
              type="text"
              placeholder="Search cracker name, code (1, 2, 3), category..."
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Sort Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B' }}>
              <span>Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#334155'
                }}
              >
                <option value="code">Code (1, 2, 3...)</option>
                <option value="name">Cracker Name (A-Z)</option>
                <option value="rate_asc">Rate: Low to High</option>
                <option value="rate_desc">Rate: High to Low</option>
              </select>
            </div>

            {/* In-Stock Only Toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                style={{ accentColor: '#EA580C', width: '15px', height: '15px' }}
              />
              <span>In-Stock Only</span>
            </label>

            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', background: '#F1F5F9', padding: '4px 10px', borderRadius: '8px' }}>
              {filteredProducts.length} Items Found
            </span>
          </div>
        </div>

        {/* Horizontal Category Filter Pills */}
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
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: selectedCategory === cat ? '700' : '500',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {cat === 'All' ? 'All Items' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Printable / Viewable Price List Table */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
      }}>
        {/* Printable Header (Visible only on print or clean preview) */}
        <div className="print-only" style={{ padding: '20px 24px', borderBottom: '2px solid #EA580C', textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#0F172A' }}>
            SRI KALISWARI CRACKERS (ஸ்ரீ காளீஸ்வரி கிராக்கர்ஸ்)
          </h2>
          <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
            Sivakasi, Tamil Nadu | Wholesale &amp; Retail Fireworks
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#EA580C', marginTop: '6px' }}>
            Official Festival Price List — Flat {discountPercent}% Discount Applied
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748B', letterSpacing: '0.05em' }}>CODE</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748B', letterSpacing: '0.05em' }}>CRACKER NAME</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748B', letterSpacing: '0.05em' }}>CATEGORY</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748B', letterSpacing: '0.05em' }}>PACKING / CONTENT</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748B', letterSpacing: '0.05em', textAlign: 'right' }}>MRP (₹)</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748B', letterSpacing: '0.05em', textAlign: 'center' }}>DISC %</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#EA580C', letterSpacing: '0.05em', textAlign: 'right' }}>OFFER RATE (₹)</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748B', letterSpacing: '0.05em', textAlign: 'center' }}>STOCK</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748B', letterSpacing: '0.05em', textAlign: 'center' }} className="no-print">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    No crackers match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p, idx) => {
                  const mrp = Number(p.rate) || 0;
                  const netRate = Math.round(mrp * (1 - discountPercent / 100));
                  const stockNum = Number(p.stock) || 0;

                  return (
                    <tr
                      key={p.id || idx}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#FFFBF7'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: '700', fontSize: '12px' }}>
                        <span style={{
                          background: '#FFF7ED',
                          color: '#C2410C',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid #FFEDD5',
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

                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#64748B', fontWeight: '500' }}>
                        {p.content || '1 Box'}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '13px', color: '#94A3B8', textDecoration: 'line-through' }}>
                        ₹{mrp.toFixed(2)}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          color: '#16A34A',
                          background: '#DCFCE7',
                          padding: '2px 7px',
                          borderRadius: '6px'
                        }}>
                          {discountPercent}%
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '900', fontSize: '14px', color: '#EA580C' }}>
                        ₹{netRate.toFixed(2)}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {stockNum > 0 ? (
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#16A34A' }}>
                            ● In Stock ({stockNum})
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#DC2626' }}>
                            ● Sold Out
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }} className="no-print">
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectProductForBill) onSelectProductForBill(p);
                            showToast(`Added "${p.name}" to Quick Bill!`);
                          }}
                          style={{
                            background: '#FFF7ED',
                            border: '1px solid #FED7AA',
                            color: '#EA580C',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Plus size={12} />
                          <span>Bill</span>
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
    </div>
  );
}
