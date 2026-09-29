import React from 'react';
import './App.css';
import {
  Sparkles,
  FileSpreadsheet,
  Users,
  Package,
  Receipt,
  TrendingUp,
  Settings,
  PlusCircle,
  Search,
  Percent,
  Download,
  Printer,
  Trash2,
  CheckCircle,
  Clock,
  Building2,
  RefreshCw,
  Eye,
  EyeOff,
  Edit,
  ArrowRight,
  Folder,
  User,
  CreditCard,
  Tag,
  Calendar,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { initialCategories, defaultProducts, defaultCustomers, defaultCompany } from './data/defaultData';
import { formatCurrency, formatNumber, generatePdfDocument } from './utils/pdfGenerator';

export default function App() {
  // Navigation tabs: 'estimate' | 'taxbill' | 'quotation' | 'products' | 'customers' | 'reports' | 'settings'
  const [activeTab, setActiveTab] = React.useState('estimate');
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [loginEmail, setLoginEmail] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');
  const [loginError, setLoginError] = React.useState('');
  const [loginYear, setLoginYear] = React.useState('');
  const [activeYear, setActiveYear] = React.useState('');
  const [yearMissingPrompt, setYearMissingPrompt] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginEmail === 'Billing@admin.com' && loginPassword === 'Billing@123') {
      if (!loginYear) {
        setLoginError('Please enter a year.');
        return;
      }
      const existingYears = JSON.parse(localStorage.getItem('kalieswari_years') || '["2026"]'); // Default allow 2026
      if (existingYears.includes(loginYear)) {
        setActiveYear(loginYear);
        setLoggedIn(true);
        setLoginError('');
        setYearMissingPrompt(false);
      } else {
        setYearMissingPrompt(true);
        setLoginError(`Year ${loginYear} does not exist.`);
      }
    } else {
      setLoginError('Invalid credentials');
    }
  };

  const handleCreateYear = () => {
    const existingYears = JSON.parse(localStorage.getItem('kalieswari_years') || '["2026"]');
    if (!existingYears.includes(loginYear)) {
      existingYears.push(loginYear);
      localStorage.setItem('kalieswari_years', JSON.stringify(existingYears));
    }
    setActiveYear(loginYear);
    setLoggedIn(true);
    setYearMissingPrompt(false);
    setLoginError('');
  };

  // Master Data with LocalStorage Persistence mapped to activeYear
  const [company, setCompany] = React.useState(defaultCompany);
  const [products, setProducts] = React.useState(defaultProducts);
  const [customers, setCustomers] = React.useState(defaultCustomers);
  const [savedInvoices, setSavedInvoices] = React.useState([]);

  React.useEffect(() => {
    if (!activeYear) return;

    // Helper: load from localStorage; if nothing saved yet (or empty array), use fallback
    const loadData = (key, fallback) => {
      const saved = localStorage.getItem(`${key}_${activeYear}`);
      if (!saved) return fallback;
      const parsed = JSON.parse(saved);
      // If it's an empty array, seed with fallback defaults
      if (Array.isArray(parsed) && parsed.length === 0) return fallback;
      return parsed;
    };

    // Company settings carry over across years (same shop)
    setCompany(loadData('kalieswari_company', defaultCompany));

    // Products, Customers, Invoices — strictly per-year.
    // First login to a year → load defaultProducts/defaultCustomers as seed data.
    // Subsequent logins → saved data from localStorage.
    setProducts(loadData('kalieswari_products', defaultProducts));
    setCustomers(loadData('kalieswari_customers', defaultCustomers));

    const loadedInvoices = loadData('kalieswari_invoices', []);
    setSavedInvoices(loadedInvoices);

    // Reset billing form to a clean slate for this year
    setBillItems([]);
    setCustomerName('');
    setCustomerMobile('');
    setCustomerAddress('');
    setSelectedCustomerId('');
    setSelectedProductCode('');
    setSelectedProductId('');
    setItemQty(1);
    setDiscountPercent(0);
    setAdditionalDiscPercent(0);
    setPackingPercent(0);

    // Bill number = one after the highest saved bill in this year, or 1 if no bills exist
    const nextBillNo = loadedInvoices.length > 0
      ? Math.max(...loadedInvoices.map(inv => Number(inv.billNo) || 0)) + 1
      : 1;
    setBillNo(nextBillNo);
  }, [activeYear]);

  // Sync to local storage for the active year
  React.useEffect(() => {
    if (!activeYear) return;
    localStorage.setItem(`kalieswari_company_${activeYear}`, JSON.stringify(company));
  }, [company, activeYear]);

  React.useEffect(() => {
    if (!activeYear) return;
    localStorage.setItem(`kalieswari_products_${activeYear}`, JSON.stringify(products));
  }, [products, activeYear]);

  React.useEffect(() => {
    if (!activeYear) return;
    localStorage.setItem(`kalieswari_customers_${activeYear}`, JSON.stringify(customers));
  }, [customers, activeYear]);

  React.useEffect(() => {
    if (!activeYear) return;
    localStorage.setItem(`kalieswari_invoices_${activeYear}`, JSON.stringify(savedInvoices));
  }, [savedInvoices, activeYear]);

  // Billing Form State
  const [billNo, setBillNo] = React.useState(1);
  const [billDate, setBillDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [priceMap, setPriceMap] = React.useState('Retail sales');
  const [docFormat, setDocFormat] = React.useState('INVOICE');
  const [paymentMode, setPaymentMode] = React.useState('Cash');
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [currentTime, setCurrentTime] = React.useState(new Date().toLocaleTimeString());

  // Customer selection / input
  const [selectedCustomerId, setSelectedCustomerId] = React.useState('');
  const [customerName, setCustomerName] = React.useState('');
  const [customerMobile, setCustomerMobile] = React.useState('');
  const [customerAddress, setCustomerAddress] = React.useState('');
  const [customerGstin, setCustomerGstin] = React.useState('');

  // Item adding row
  const [selectedProductCode, setSelectedProductCode] = React.useState('');
  const [selectedProductId, setSelectedProductId] = React.useState('');
  const [itemQty, setItemQty] = React.useState(1);

  // Cart / Bill Items — starts empty; populated after year loads
  const [billItems, setBillItems] = React.useState([]);

  // Discounts and Additions — defaults reset per year in the useEffect above
  const [discountPercent, setDiscountPercent] = React.useState(0);
  const [additionalDiscPercent, setAdditionalDiscPercent] = React.useState(0);
  const [packingPercent, setPackingPercent] = React.useState(0);
  const [gstPercent, setGstPercent] = React.useState(18);

  // Search & Filter in dialogs/masters
  const [productSearch, setProductSearch] = React.useState('');
  const [customerSearch, setCustomerSearch] = React.useState('');
  const [toastMessage, setToastMessage] = React.useState('');
  const [previewInvoice, setPreviewInvoice] = React.useState(null); // invoice side drawer

  const customerNameRef = React.useRef(null);
  const productSearchRef = React.useRef(null);

  // Live timer for Status Bar
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Synchronize customer select
  const handleSelectCustomer = (id) => {
    setSelectedCustomerId(id);
    if (!id) {
      setCustomerName('');
      setCustomerMobile('');
      setCustomerAddress('');
      setCustomerGstin('');
      return;
    }
    const found = customers.find(c => String(c.id) === String(id));
    if (found) {
      setCustomerName(found.name);
      setCustomerMobile(found.mobile);
      setCustomerAddress(found.address);
      setCustomerGstin(found.gstin || '');
    }
  };

  // Synchronize product select via Code or Dropdown
  const handleCodeChange = (code) => {
    setSelectedProductCode(code);
    const found = products.find(p => String(p.code) === String(code));
    if (found) {
      setSelectedProductId(found.id);
    } else {
      setSelectedProductId('');
    }
  };

  const handleProductSelectChange = (id) => {
    setSelectedProductId(id);
    const found = products.find(p => String(p.id) === String(id));
    if (found) {
      setSelectedProductCode(found.code);
    } else {
      setSelectedProductCode('');
    }
  };

  // One-click quick add product to cart/bill
  const handleQuickAddProduct = (prod, qtyToAdd = 1) => {
    const q = Number(qtyToAdd) || 1;
    const existingIndex = billItems.findIndex(i => i.id === prod.id);
    if (existingIndex > -1) {
      const updated = [...billItems];
      updated[existingIndex].qty += q;
      setBillItems(updated);
    } else {
      setBillItems([
        ...billItems,
        {
          id: prod.id,
          code: prod.code,
          name: prod.name,
          category: prod.category,
          content: prod.content,
          qty: q,
          rate: Number(prod.rate)
        }
      ]);
    }
    showToast(`Added: ${prod.name}`);
  };

  const handleAddItem = (e) => {
    if (e) e.preventDefault();
    if (!selectedProductId) {
      showToast('Please select a product first!');
      return;
    }
    const prod = products.find(p => String(p.id) === String(selectedProductId));
    if (!prod) return;

    // Check if already in list
    const existingIndex = billItems.findIndex(i => i.id === prod.id);
    if (existingIndex > -1) {
      const updated = [...billItems];
      updated[existingIndex].qty += Number(itemQty) || 1;
      setBillItems(updated);
    } else {
      setBillItems([
        ...billItems,
        {
          id: prod.id,
          code: prod.code,
          name: prod.name,
          content: prod.content,
          qty: Number(itemQty) || 1,
          rate: Number(prod.rate)
        }
      ]);
    }
    // Reset add inputs
    setSelectedProductId('');
    setSelectedProductCode('');
    setItemQty(1);
  };

  const handleRemoveItem = (index) => {
    const updated = billItems.filter((_, idx) => idx !== index);
    setBillItems(updated);
  };

  const handleUpdateItemQty = (index, newQty) => {
    const updated = [...billItems];
    updated[index].qty = Math.max(1, Number(newQty) || 1);
    setBillItems(updated);
  };

  const handleUpdateItemRate = (index, newRate) => {
    const updated = [...billItems];
    updated[index].rate = Math.max(0, Number(newRate) || 0);
    setBillItems(updated);
  };

  // Math Calculations
  const grossTotal = billItems.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  const discountAmount = Math.round((grossTotal * (Number(discountPercent) || 0)) / 100);
  const afterDiscount = grossTotal - discountAmount;

  const additionalDiscountAmount = Math.round((afterDiscount * (Number(additionalDiscPercent) || 0)) / 100);
  const afterAdditionalDisc = afterDiscount - additionalDiscountAmount;

  const packingCharge = Math.round((afterAdditionalDisc * (Number(packingPercent) || 0)) / 100);

  const isTaxBill = docFormat === 'INVOICE' || activeTab === 'taxbill';
  const gstAmount = isTaxBill ? Math.round((afterAdditionalDisc * (Number(gstPercent) || 0)) / 100) : 0;

  const netAmount = afterAdditionalDisc + packingCharge + gstAmount;
  const totalCases = billItems.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);

  // Filtered Products for the Quick Selection Shelf
  const filteredProducts = React.useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const searchLower = productSearch.trim().toLowerCase();
      const matchSearch = !searchLower ||
        p.name.toLowerCase().includes(searchLower) ||
        String(p.code).toLowerCase() === searchLower ||
        String(p.code).toLowerCase().includes(searchLower) ||
        (p.category && p.category.toLowerCase().includes(searchLower));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, productSearch]);

  // Keyboard Shortcuts: F2 (New Bill), F3 (Customer), F4 (Product Search), F5 (Save & Print)
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        handleResetBill();
      } else if (e.key === 'F3') {
        e.preventDefault();
        customerNameRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        productSearchRef.current?.focus();
      } else if (e.key === 'F5') {
        e.preventDefault();
        handleSaveAndPrint(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [billItems, billNo, customerName, customerMobile, customerAddress, customerGstin, billDate, grossTotal, discountPercent, netAmount, docFormat, paymentMode]);

  // Reset current bill
  const handleResetBill = () => {
    setBillItems([]);
    setSelectedCustomerId('');
    setCustomerName('');
    setCustomerMobile('');
    setCustomerAddress('');
    setCustomerGstin('');
    setSelectedProductCode('');
    setSelectedProductId('');
    setProductSearch('');
    setItemQty(1);
    setDiscountPercent(0);
    setAdditionalDiscPercent(0);
    setPackingPercent(0);
    // Auto-update to latest bill number based on saved invoices
    const nextNo = savedInvoices.length > 0
      ? Math.max(...savedInvoices.map(inv => Number(inv.billNo) || 0)) + 1
      : 1;
    setBillNo(nextNo);
    showToast(`New Bill #SKC ${nextNo} Ready`);
  };

  // Save / Print Bill
  const handleSaveAndPrint = (shouldPrint = true) => {
    if (billItems.length === 0) {
      showToast('Please add at least one product to the bill!');
      return;
    }

    const newInvoice = {
      billNo,
      type: docFormat.toLowerCase(),
      date: billDate,
      customerName: customerName || 'Direct Counter Sale',
      customerMobile: customerMobile || '-',
      customerAddress: customerAddress || '-',
      customerGstin: customerGstin || '-',
      paymentMode,
      items: [...billItems],
      grossTotal,
      discountPercent,
      discountAmount,
      additionalDiscountPercent: additionalDiscPercent,
      additionalDiscountAmount,
      afterAdditionalDisc,
      packingPercent,
      packingCharge,
      gstPercent: isTaxBill ? gstPercent : 0,
      gstAmount,
      netAmount,
      status: 'Completed',
      createdAt: new Date().toISOString()
    };

    setSavedInvoices(prev => [newInvoice, ...prev]);

    // Confetti celebration
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    showToast(`Bill #SKC ${billNo} Saved Successfully!`);

    if (shouldPrint) {
      // Show invoice preview drawer on the left
      setPreviewInvoice(newInvoice);
      // Also auto-download the PDF immediately
      const doc = generatePdfDocument(newInvoice, company);
      doc.save(`Sri_Kaliswari_Bill_SKC_${billNo}_${customerName || 'Customer'}.pdf`);
    }

    // Auto-clear form for next bill and auto-advance to next sequential bill number
    setBillItems([]);
    setSelectedCustomerId('');
    setCustomerName('');
    setCustomerMobile('');
    setCustomerAddress('');
    setCustomerGstin('');
    setSelectedProductCode('');
    setSelectedProductId('');
    setItemQty(1);

    // Auto increment bill number
    setBillNo(prev => (Number(prev) || 0) + 1);
  };

  if (!loggedIn) {
    return (
      <div className="login-wrapper">
        <div className="login-card animate-fade-in">

          {/* Brand Header */}
          <div className="login-brand">
            <div className="login-logo">🎆</div>
            <h1 className="login-title">Sri Kaliswari Crackers</h1>
            <p className="login-subtitle">Billing &amp; Inventory Management</p>
          </div>

          {/* Error */}
          {loginError && !yearMissingPrompt && (
            <p className="login-error">{loginError}</p>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="login-form">

            {/* 1. Username */}
            <div className="login-field">
              <label className="login-label" htmlFor="loginEmail">
                <span className="login-field-num">1</span> Username
              </label>
              <input
                id="loginEmail"
                type="text"
                placeholder="Enter your username"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="login-input"
                autoComplete="username"
                required
              />
            </div>

            {/* 2. Password */}
            <div className="login-field">
              <label className="login-label" htmlFor="loginPassword">
                <span className="login-field-num">2</span> Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="loginPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="login-input"
                  autoComplete="current-password"
                  style={{ paddingRight: '48px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* 3. Financial Year */}
            <div className="login-field">
              <label className="login-label" htmlFor="loginYear">
                <span className="login-field-num">3</span> Financial Year
              </label>
              <input
                id="loginYear"
                type="number"
                placeholder="e.g. 2026"
                min="2000"
                max="2099"
                value={loginYear}
                onChange={e => { setLoginYear(e.target.value); setYearMissingPrompt(false); setLoginError(''); }}
                className="login-input"
                required
              />
              <p className="login-year-hint">📅 Enter the year whose data you want to open</p>
            </div>

            {/* Year missing: show create prompt */}
            {yearMissingPrompt ? (
              <div className="login-year-missing">
                <p className="login-year-missing-text">⚠️ Year <strong>{loginYear}</strong> does not exist.</p>
                <p className="login-year-missing-sub">Create a new empty workspace for {loginYear}?</p>
                <button type="button" onClick={handleCreateYear} className="login-button login-btn-create">
                  ✚ Create Year {loginYear}
                </button>
                <button type="button" onClick={() => { setYearMissingPrompt(false); setLoginError(''); }} className="login-button login-btn-cancel">
                  Cancel
                </button>
              </div>
            ) : (
              /* 4. Login Button */
              <button type="submit" className="login-button">
                Login →
              </button>
            )}

          </form>

          <p className="login-footer">
            Sivakasi · Tamil Nadu · India &nbsp;•&nbsp; Developed by <strong style={{ color: '#A78BFA' }}>Genz Neural-x</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="app-toast">
          <CheckCircle size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Header */}
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-header-logo" style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #EA580C 100%)' }}>
            <Sparkles size={22} color="#FFF" />
          </div>
          <div className="app-header-text">
            <div className="app-header-title-row">
              <h1 className="app-header-title">{company.name}</h1>
              <span className="app-header-badge" style={{ background: '#FFEDD5', color: '#C2410C' }}>Sivakasi POS 2026</span>
            </div>
            <p className="app-header-subtitle">{company.tagline} • Direct Factory Outlet</p>
          </div>
        </div>
        <div className="app-header-right">
          <div className="app-date-pill">
            <Clock size={15} />
            <span>{billDate} {currentTime}</span>
          </div>
          <button
            onClick={() => handleResetBill()}
            className="app-new-bill-btn"
            style={{
              background: '#FF6B35',
              color: '#FFF',
              border: 'none',
              boxShadow: '0 4px 12px rgba(255,107,53,0.3)'
            }}
          >
            <RefreshCw size={14} />
            <span className="app-new-bill-btn-label">+ New Bill (F2)</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></span>
            Admin
          </div>
        </div>
      </header>

      {/* Desktop Navigation Tabs */}
      <nav className="app-nav">
        {[
          { id: 'estimate', label: 'Quick Billing', badge: 'F2', icon: FileSpreadsheet },
          { id: 'products', label: 'Products Master', icon: Package },
          { id: 'customers', label: 'Customers', icon: Users },
          { id: 'reports', label: 'Sales History', icon: TrendingUp },
          { id: 'settings', label: 'Shop Settings', icon: Settings },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id || (activeTab === 'taxbill' && tab.id === 'estimate');
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="app-nav-tab"
              style={{
                borderBottom: isActive ? '3px solid #FF6B35' : '3px solid transparent',
                color: isActive ? '#FF6B35' : '#64748B',
                fontWeight: isActive ? '700' : '500',
                fontSize: '14px',
              }}
            >
              <Icon size={17} color={isActive ? '#FF6B35' : '#64748B'} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span style={{ background: isActive ? '#FFEDD5' : '#F1F5F9', color: isActive ? '#C2410C' : '#94A3B8', fontSize: '10px', fontWeight: '800', padding: '1px 6px', borderRadius: '6px' }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <div className="mobile-bottom-nav-inner">
          {[
            { id: 'estimate', label: 'Billing', icon: FileSpreadsheet },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'reports', label: 'History', icon: TrendingUp },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id || (activeTab === 'taxbill' && tab.id === 'estimate');
            return (
              <button
                key={tab.id}
                className="mobile-nav-btn"
                onClick={() => setActiveTab(tab.id)}
                style={{ color: isActive ? '#FF6B35' : '#94A3B8' }}
              >
                <Icon size={20} color={isActive ? '#FF6B35' : '#94A3B8'} />
                <span className="mob-label" style={{ color: isActive ? '#FF6B35' : '#94A3B8' }}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace Content */}
      <main className="app-main">

        {/* VIEW 1: QUICK BILLING ENGINE (Matching Shri Gugan Crackers reference) */}
        {(activeTab === 'estimate' || activeTab === 'taxbill' || activeTab === 'quickbilling') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* 1. TOP STATUS BAR (Shortcuts & Bill Metadata) */}
            <div className="qb-status-bar">
              <div className="qb-status-group">
                <div className="qb-status-item">
                  <span className="qb-label">BILL NO:</span>
                  <span className="qb-val-highlight">SKC {billNo}</span>
                </div>
                <div className="qb-status-item">
                  <span className="qb-label">FORMAT:</span>
                  <span className="qb-val">{docFormat === 'INVOICE' ? 'TAX INVOICE (GST 18%)' : (docFormat === 'ESTIMATE' ? 'ESTIMATE (Wholesale)' : 'QUOTATION')}</span>
                </div>
                <div className="qb-status-item">
                  <span className="qb-label">DATE & TIME:</span>
                  <span className="qb-val">{billDate} {currentTime}</span>
                </div>
              </div>
              <div className="qb-status-keys">
                <span className="qb-key-item"><span className="qb-key-badge">F2</span> New Bill</span>
                <span className="qb-key-item"><span className="qb-key-badge">F3</span> Customer</span>
                <span className="qb-key-item"><span className="qb-key-badge">F4</span> Product Search</span>
                <span className="qb-key-item"><span className="qb-key-badge">F5</span> Save & Print</span>
              </div>
            </div>

            {/* 2. CUSTOMER DETAILS (M/s Selection) CARD */}
            <div className="qb-card">
              <div className="qb-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="qb-icon-badge">
                    <User size={18} color="#FF6B35" />
                  </div>
                  <div>
                    <h3 className="qb-card-title">Customer Details (M/s Selection)</h3>
                    <p className="qb-card-desc">Select existing client or type billing details</p>
                  </div>
                </div>

                <div className="qb-quick-pick">
                  <span className="qb-quick-label">Quick Pick:</span>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="qb-quick-select"
                  >
                    <option value="">-- Pick Saved Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.mobile}) - {c.address.substring(0, 25)}
                      </option>
                    ))}
                  </select>
                  {selectedCustomerId && (
                    <button
                      type="button"
                      onClick={() => handleSelectCustomer('')}
                      className="qb-reset-mini-btn"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="qb-customer-grid">
                <div className="qb-field-group">
                  <label className="qb-field-label">Customer Name *</label>
                  <input
                    ref={customerNameRef}
                    type="text"
                    placeholder="e.g. M/S. K.R. TRADERS"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="qb-input"
                  />
                </div>

                <div className="qb-field-group">
                  <label className="qb-field-label">City / Station / Address</label>
                  <input
                    type="text"
                    placeholder="e.g. BANGALORE / SIVAKASI"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="qb-input"
                  />
                </div>

                <div className="qb-field-group">
                  <label className="qb-field-label">
                    Mobile Number <span className="qb-hint-badge">F3</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    className="qb-input"
                  />
                </div>

                <div className="qb-field-group">
                  <label className="qb-field-label">GSTIN / PAN (Optional)</label>
                  <input
                    type="text"
                    placeholder="33AAAAA0000A1Z5 (OPTIONAL)"
                    value={customerGstin}
                    onChange={(e) => setCustomerGstin(e.target.value)}
                    className="qb-input"
                  />
                </div>
              </div>

              <div className="qb-customer-meta-grid">
                <div className="qb-field-group">
                  <label className="qb-field-label">Bill Number</label>
                  <div style={{ display: 'flex', alignItems: 'stretch', borderRadius: '8px', overflow: 'hidden', border: '1px solid #CBD5E1', background: '#FFF' }}>
                    <span style={{
                      background: '#FFEDD5',
                      color: '#C2410C',
                      fontWeight: '800',
                      fontSize: '13px',
                      padding: '9px 12px',
                      borderRight: '1px solid #FDBA74',
                      display: 'flex',
                      alignItems: 'center',
                      userSelect: 'none'
                    }}>
                      SKC
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={billNo}
                      onChange={(e) => setBillNo(e.target.value)}
                      className="qb-input"
                      style={{
                        border: 'none',
                        borderRadius: 0,
                        fontWeight: '800',
                        color: '#0F172A',
                        fontSize: '14px',
                        padding: '9px 12px'
                      }}
                      placeholder="1"
                    />
                  </div>
                </div>

                <div className="qb-field-group">
                  <label className="qb-field-label">Despatch / Bill Date</label>
                  <input
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="qb-input"
                  />
                </div>

                <div className="qb-field-group">
                  <label className="qb-field-label">Invoice Document Type</label>
                  <select
                    value={docFormat}
                    onChange={(e) => setDocFormat(e.target.value)}
                    className="qb-select"
                  >
                    <option value="INVOICE">INVOICE (Official GST 18%)</option>
                    <option value="ESTIMATE">ESTIMATE (Wholesale / Supply)</option>
                    <option value="QUOTATION">QUOTATION (Proforma Price)</option>
                  </select>
                </div>

                <div className="qb-field-group">
                  <label className="qb-field-label">Price Mapping</label>
                  <select
                    value={priceMap}
                    onChange={(e) => setPriceMap(e.target.value)}
                    className="qb-select"
                  >
                    <option value="Retail sales">Retail Sales Rate</option>
                    <option value="Wholesale">Wholesale Standard</option>
                    <option value="Special Dealer">Special Dealer Direct</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 3. SELECT PRODUCT CARD (Category pills + Live search + Shelf) */}
            <div className="qb-card">
              <div className="qb-card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Search size={18} color="#FF6B35" />
                  <h3 className="qb-card-title">Select Product</h3>
                  <span className="qb-count-badge">{filteredProducts.length} Products Available</span>
                </div>

                {/* Category Filter Pills */}
                <div className="qb-category-scroll">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('All')}
                    className={`qb-cat-pill ${selectedCategory === 'All' ? 'active' : ''}`}
                  >
                    All ({products.length})
                  </button>
                  {initialCategories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`qb-cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Live Search Bar & Quick Code Input */}
              <div className="qb-search-bar-wrap">
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                  <input
                    ref={productSearchRef}
                    type="text"
                    placeholder="Search cracker product by Name, Code (e.g. 1, 15), Category... (Press F4)"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="qb-search-input"
                  />
                  {productSearch && (
                    <button
                      onClick={() => setProductSearch('')}
                      style={{ position: 'absolute', right: '12px', top: '12px', border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', fontSize: '13px' }}
                    >✕</button>
                  )}
                </div>

                {/* Quick Code & Qty Adder */}
                <div className="qb-quick-code-box">
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Code:</span>
                    <input
                      type="text"
                      placeholder="e.g. 1"
                      value={selectedProductCode}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const found = products.find(p => String(p.code) === String(selectedProductCode));
                          if (found) {
                            handleQuickAddProduct(found, itemQty);
                            setSelectedProductCode('');
                          } else {
                            showToast(`Product code ${selectedProductCode} not found!`);
                          }
                        }
                      }}
                      className="qb-code-input"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Qty:</span>
                    <input
                      type="number"
                      min="1"
                      value={itemQty}
                      onChange={(e) => setItemQty(e.target.value)}
                      className="qb-qty-input"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const found = products.find(p => String(p.code) === String(selectedProductCode));
                      if (found) {
                        handleQuickAddProduct(found, itemQty);
                        setSelectedProductCode('');
                      } else {
                        showToast('Please enter a valid product code first!');
                      }
                    }}
                    className="qb-add-btn"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Quick Product Shelf / Grid (Tap to add instantly) */}
              <div className="qb-product-shelf">
                {filteredProducts.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8', width: '100%' }}>
                    No products matching "<b>{productSearch}</b>" in {selectedCategory}.
                  </div>
                ) : (
                  filteredProducts.slice(0, 24).map(p => (
                    <div
                      key={p.id}
                      className="qb-product-card"
                      onClick={() => handleQuickAddProduct(p, 1)}
                    >
                      <div className="qb-pc-top">
                        <span className="qb-pc-code">#{p.code}</span>
                        <span className="qb-pc-cat">{p.category}</span>
                      </div>
                      <div className="qb-pc-name">{p.name}</div>
                      <div className="qb-pc-meta">
                        <span className="qb-pc-content">{p.content}</span>
                        <span className="qb-pc-stock">Stock: {p.stock}</span>
                      </div>
                      <div className="qb-pc-bottom">
                        <span className="qb-pc-rate">₹{formatNumber(p.rate)}</span>
                        <button
                          type="button"
                          className="qb-pc-add-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickAddProduct(p, 1);
                          }}
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Split Screen: Items Table (Left) & Real-time Calculation Panel (Right) */}
            <div className="billing-split-view">

              {/* Product Table */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#FAFAFC'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '800', fontSize: '15px', color: '#1E293B' }}>Product Items List</span>
                    <span style={{ background: '#EEF2FF', color: '#4B4DFF', fontSize: '12px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px' }}>
                      {billItems.length} items
                    </span>
                  </div>

                  {billItems.length > 0 && (
                    <button
                      onClick={() => setBillItems([])}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#EF4444',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={13} /> Clear Table
                    </button>
                  )}
                </div>

                <div style={{ overflowX: 'auto', flex: 1, minHeight: '320px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9', color: '#475569', fontWeight: '700', borderBottom: '1px solid #CBD5E1' }}>
                        <th style={{ padding: '12px 14px', width: '50px', textAlign: 'center' }}>SNo</th>
                        <th style={{ padding: '12px 14px', width: '70px', textAlign: 'center' }}>Code</th>
                        <th style={{ padding: '12px 14px' }}>Product Description</th>
                        <th style={{ padding: '12px 14px', width: '130px' }}>Content</th>
                        <th style={{ padding: '12px 14px', width: '80px', textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '12px 14px', width: '100px', textAlign: 'right' }}>Rate (₹)</th>
                        <th style={{ padding: '12px 14px', width: '110px', textAlign: 'right' }}>Total (₹)</th>
                        <th style={{ padding: '12px 14px', width: '50px', textAlign: 'center' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {billItems.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ padding: '60px 20px', textAlign: 'center', color: '#94A3B8' }}>
                            <Package size={42} strokeWidth={1.5} style={{ marginBottom: '10px', color: '#CBD5E1' }} />
                            <p style={{ fontWeight: '600', fontSize: '15px', color: '#64748B' }}>No products added to this invoice</p>
                            <p style={{ fontSize: '13px' }}>Use the quick-add selector above to add firecracker products.</p>
                          </td>
                        </tr>
                      ) : (
                        billItems.map((item, index) => {
                          const rowTotal = item.qty * item.rate;
                          return (
                            <tr key={index} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}>
                              <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '600', color: '#94A3B8' }}>
                                {index + 1}
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '700', color: '#4B4DFF' }}>
                                {item.code}
                              </td>
                              <td style={{ padding: '10px 14px', fontWeight: '600', color: '#1E293B' }}>
                                {item.name}
                              </td>
                              <td style={{ padding: '10px 14px', color: '#64748B', fontSize: '12px' }}>
                                {item.content}
                              </td>
                              <td style={{ padding: '6px 14px', textAlign: 'center' }}>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.qty}
                                  onChange={(e) => handleUpdateItemQty(index, e.target.value)}
                                  style={{
                                    width: '60px',
                                    padding: '5px 6px',
                                    textAlign: 'center',
                                    borderRadius: '6px',
                                    border: '1px solid #CBD5E1',
                                    fontWeight: '700',
                                    background: '#F8FAFC'
                                  }}
                                />
                              </td>
                              <td style={{ padding: '6px 14px', textAlign: 'right' }}>
                                <input
                                  type="number"
                                  value={item.rate}
                                  onChange={(e) => handleUpdateItemRate(index, e.target.value)}
                                  style={{
                                    width: '80px',
                                    padding: '5px 6px',
                                    textAlign: 'right',
                                    borderRadius: '6px',
                                    border: '1px solid #CBD5E1',
                                    fontWeight: '600',
                                    background: '#F8FAFC'
                                  }}
                                />
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>
                                {formatNumber(rowTotal)}
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                <button
                                  onClick={() => handleRemoveItem(index)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#CBD5E1',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    transition: 'color 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                                  onMouseLeave={(e) => e.currentTarget.style.color = '#CBD5E1'}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Bar: Total Qty Count */}
                {billItems.length > 0 && (
                  <div style={{
                    padding: '12px 20px',
                    background: '#F8FAFC',
                    borderTop: '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#64748B'
                  }}>
                    <span>Total Unique Items: <b>{billItems.length}</b></span>
                    <span>Total Item Quantity: <b>{billItems.reduce((acc, curr) => acc + curr.qty, 0)} Pkts/Boxes</b></span>
                  </div>
                )}
              </div>

              {/* Right Side: Exact Reference Amount Info Calculation Panel */}
              <div className="calc-panel">
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#1E293B', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                  Amount Info & Calculations
                </div>

                {/* Gross Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: '#64748B', fontWeight: '600' }}>Disc. Item Total (Rs.) :</span>
                  <span style={{ fontWeight: '800', fontSize: '16px', color: '#0F172A' }}>{formatNumber(grossTotal)}</span>
                </div>

                {/* Main Discount % (Ref shows: Discount (%) [ 90 ] [29295] [3255]) */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: '13px' }}>
                  <span style={{ color: '#64748B', fontWeight: '600', minWidth: '95px' }}>Discount (%) :</span>
                  <input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    style={{
                      width: '54px',
                      padding: '6px 4px',
                      textAlign: 'center',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontWeight: '700',
                      background: '#FFF'
                    }}
                  />
                  <span style={{ color: '#EF4444', fontWeight: '600', fontSize: '12px' }}>
                    - ₹{formatNumber(discountAmount)}
                  </span>
                  <span style={{ fontWeight: '700', color: '#0F172A' }}>
                    {formatNumber(afterDiscount)}
                  </span>
                </div>

                {/* Additional Discount % */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: '13px' }}>
                  <span style={{ color: '#64748B', fontWeight: '600', minWidth: '95px' }}>Addl. Disc (%) :</span>
                  <input
                    type="number"
                    value={additionalDiscPercent}
                    onChange={(e) => setAdditionalDiscPercent(e.target.value)}
                    style={{
                      width: '54px',
                      padding: '6px 4px',
                      textAlign: 'center',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontWeight: '700',
                      background: '#FFF'
                    }}
                  />
                  <span style={{ color: '#EF4444', fontWeight: '600', fontSize: '12px' }}>
                    - ₹{formatNumber(additionalDiscountAmount)}
                  </span>
                  <span style={{ fontWeight: '700', color: '#0F172A' }}>
                    {formatNumber(afterAdditionalDisc)}
                  </span>
                </div>

                {/* After Additional Disc */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', paddingTop: '4px', borderTop: '1px dashed #E2E8F0' }}>
                  <span style={{ color: '#64748B', fontWeight: '600' }}>After Additional Disc :</span>
                  <span style={{ fontWeight: '700', color: '#0F172A' }}>{formatNumber(afterAdditionalDisc)}</span>
                </div>

                {/* Packing Charges % */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: '13px' }}>
                  <span style={{ color: '#64748B', fontWeight: '600' }}>Pack (%) :</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      value={packingPercent}
                      onChange={(e) => setPackingPercent(e.target.value)}
                      style={{
                        width: '54px',
                        padding: '6px 4px',
                        textAlign: 'center',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontWeight: '700',
                        background: '#FFF'
                      }}
                    />
                    <span style={{ fontWeight: '700', color: '#0F172A' }}>₹{formatNumber(packingCharge)}</span>
                  </div>
                </div>

                {/* GST (If Tax Bill active) */}
                {isTaxBill && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: '13px', background: '#F8FAFC', padding: '8px', borderRadius: '8px' }}>
                    <span style={{ color: '#4B4DFF', fontWeight: '700' }}>GST Rate (%) :</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        value={gstPercent}
                        onChange={(e) => setGstPercent(e.target.value)}
                        style={{
                          width: '54px',
                          padding: '6px 4px',
                          textAlign: 'center',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          fontWeight: '700',
                          background: '#FFF'
                        }}
                      />
                      <span style={{ fontWeight: '700', color: '#4B4DFF' }}>+ ₹{formatNumber(gstAmount)}</span>
                    </div>
                  </div>
                )}

                {/* Payment Mode Selector */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    Payment Mode
                  </label>
                  <div className="qb-payment-modes">
                    {['Cash', 'GPay / UPI', 'Bank', 'Credit'].map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMode(mode)}
                        className={`qb-pay-btn ${paymentMode === mode ? 'active' : ''}`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Net Final Payable Box */}
                <div style={{
                  background: 'linear-gradient(135deg, #FF6B35 0%, #EA580C 100%)',
                  borderRadius: '12px',
                  padding: '16px',
                  color: '#FFFFFF',
                  marginTop: '8px',
                  boxShadow: '0 8px 20px rgba(255, 107, 53, 0.28)'
                }}>
                  <div style={{ fontSize: '11px', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Net Final Amount (₹)
                  </div>
                  <div className="net-amount-value" style={{ fontSize: '28px', fontWeight: '800', marginTop: '4px' }}>
                    ₹ {formatNumber(netAmount)}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '2px' }}>
                    {docFormat === 'INVOICE' ? 'Official GST Tax Invoice' : (docFormat === 'ESTIMATE' ? 'Estimate of Supply' : 'Official Quotation')}
                  </div>
                </div>

                {/* Action Buttons (Save & Print, Delete, Clear, Convert to Estimate) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                  <button
                    onClick={() => handleSaveAndPrint(true)}
                    style={{
                      background: '#FF6B35',
                      color: '#FFF',
                      border: 'none',
                      padding: '13px',
                      borderRadius: '10px',
                      fontWeight: '800',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(255, 107, 53, 0.35)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Printer size={18} /> Save & Print Bill (F5)
                  </button>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      onClick={() => handleSaveAndPrint(false)}
                      style={{
                        background: '#F1F5F9',
                        color: '#334155',
                        border: '1px solid #CBD5E1',
                        padding: '10px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Save Only
                    </button>
                    <button
                      onClick={handleResetBill}
                      style={{
                        background: '#FEE2E2',
                        color: '#DC2626',
                        border: '1px solid #FECACA',
                        padding: '10px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      New Bill (F2)
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* VIEW 2: PRODUCT MASTER */}
        {activeTab === 'products' && (
          <ProductMasterView
            products={products}
            setProducts={setProducts}
            showToast={showToast}
          />
        )}

        {/* VIEW 3: CUSTOMER MASTER */}
        {activeTab === 'customers' && (
          <CustomerMasterView
            customers={customers}
            setCustomers={setCustomers}
            showToast={showToast}
          />
        )}

        {/* VIEW 4: REPORTS & SAVED INVOICES */}
        {activeTab === 'reports' && (
          <ReportsView
            savedInvoices={savedInvoices}
            setSavedInvoices={setSavedInvoices}
            company={company}
            showToast={showToast}
          />
        )}

        {/* VIEW 5: SETTINGS */}
        {activeTab === 'settings' && (
          <SettingsView
            company={company}
            setCompany={setCompany}
            showToast={showToast}
          />
        )}

      </main>

      {/* Modern Sivakasi Crackers Footer */}
      <footer className="app-footer">
        {/* Left: Store info */}
        <div className="app-footer-left">
          <Building2 size={16} color="#FF6B35" style={{ flexShrink: 0 }} />
          <span><b>{company.name}</b> - {company.address}</span>
        </div>

        {/* Center: Developed by Genz Neural-x */}
        <div className="app-footer-center">
          <span className="app-footer-badge">
            <span style={{ color: '#F59E0B' }}>⚡</span> Developed by <strong style={{ color: '#38BDF8', fontWeight: '800' }}>Genz Neural-x</strong>
          </span>
        </div>

        {/* Right: GSTIN & Contact */}
        <div className="app-footer-right">
          <span>GSTIN: <b>{company.gstin}</b></span>
          <span>Contact: <b>{company.mobile}</b></span>
        </div>
      </footer>

      {/* ── INVOICE PREVIEW SIDE DRAWER ─────────────────────────── */}
      {previewInvoice && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setPreviewInvoice(null)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(15,23,42,0.55)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
              animation: 'fadeIn 0.2s ease'
            }}
          />

          {/* Drawer Panel */}
          <div className="invoice-drawer" style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '480px',
            maxWidth: '95vw',
            height: '100vh',
            background: '#FFFFFF',
            boxShadow: '8px 0 40px rgba(0,0,0,0.18)',
            zIndex: 1001,
            display: 'flex',
            flexDirection: 'column',
            animation: 'drawerSlideIn 0.32s cubic-bezier(0.16,1,0.3,1) forwards',
            overflowY: 'hidden'
          }}>

            {/* Drawer Header */}
            <div style={{
              background: 'linear-gradient(135deg,#4B4DFF 0%,#6D3DFF 100%)',
              padding: '18px 22px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <div>
                <div style={{ color: '#fff', fontWeight: '800', fontSize: '16px' }}>
                  🧾 Invoice Preview
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: '2px' }}>
                  Bill #SKC {previewInvoice.billNo} · {previewInvoice.type === 'tax' ? 'GST Tax Bill' : 'Estimate'}
                </div>
              </div>
              <button
                onClick={() => setPreviewInvoice(null)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff',
                  width: '36px', height: '36px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '700'
                }}
              >×</button>
            </div>

            {/* Scrollable Invoice Content */}
            <div style={{ padding: '20px 22px', flex: 1, overflowY: 'auto' }}>

              {/* Company Block */}
              <div style={{
                textAlign: 'center',
                padding: '16px',
                background: '#F8FAFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                marginBottom: '16px'
              }}>
                <div style={{ fontWeight: '900', fontSize: '15px', color: '#1E293B', letterSpacing: '0.5px' }}>
                  {company.name}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px' }}>{company.tagline}</div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{company.address}</div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                  📞 {company.mobile} &nbsp;|&nbsp; GSTIN: {company.gstin}
                </div>
              </div>

              {/* Bill Meta */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: '#F1F5F9', borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Bill No</div>
                  <div style={{ fontWeight: '800', fontSize: '20px', color: '#EA580C' }}>SKC {previewInvoice.billNo}</div>
                </div>
                <div style={{ background: '#F1F5F9', borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Date</div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#1E293B' }}>{previewInvoice.date}</div>
                </div>
              </div>

              {/* Customer */}
              <div style={{
                background: '#FFFBEB', border: '1px solid #FDE68A',
                borderRadius: '10px', padding: '13px 15px', marginBottom: '16px'
              }}>
                <div style={{ fontSize: '10px', color: '#92400E', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>
                  👤 Customer Details
                </div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#1E293B' }}>{previewInvoice.customerName}</div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px' }}>📱 {previewInvoice.customerMobile}</div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>📍 {previewInvoice.customerAddress}</div>
              </div>

              {/* Items Table */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{
                  background: '#1E293B', color: '#fff',
                  padding: '9px 12px', fontSize: '11px', fontWeight: '700',
                  textTransform: 'uppercase', letterSpacing: '0.5px'
                }}>
                  📦 Items ({previewInvoice.items.length})
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', color: '#64748B', fontWeight: '700' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'center', width: '28px' }}>#</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Product</th>
                      <th style={{ padding: '8px 6px', textAlign: 'center', width: '38px' }}>Qty</th>
                      <th style={{ padding: '8px 6px', textAlign: 'right', width: '62px' }}>Rate</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', width: '72px' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewInvoice.items.map((item, i) => (
                      <tr key={i} style={{
                        borderTop: '1px solid #F1F5F9',
                        background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFE'
                      }}>
                        <td style={{ padding: '7px 10px', textAlign: 'center', color: '#94A3B8', fontWeight: '600' }}>{i + 1}</td>
                        <td style={{ padding: '7px 10px' }}>
                          <div style={{ fontWeight: '600', color: '#1E293B' }}>{item.name}</div>
                          <div style={{ fontSize: '10px', color: '#94A3B8' }}>{item.content}</div>
                        </td>
                        <td style={{ padding: '7px 6px', textAlign: 'center', fontWeight: '700', color: '#4B4DFF' }}>{item.qty}</td>
                        <td style={{ padding: '7px 6px', textAlign: 'right', color: '#475569' }}>₹{formatNumber(item.rate)}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>
                          ₹{formatNumber(item.qty * item.rate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div style={{
                background: '#F8FAFC', border: '1px solid #E2E8F0',
                borderRadius: '10px', padding: '14px 16px', marginBottom: '8px',
                display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                  <span>Gross Total</span>
                  <span style={{ fontWeight: '700', color: '#1E293B' }}>₹{formatNumber(previewInvoice.grossTotal)}</span>
                </div>
                {Number(previewInvoice.discountPercent) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                    <span>Discount ({previewInvoice.discountPercent}%)</span>
                    <span style={{ fontWeight: '600', color: '#EF4444' }}>- ₹{formatNumber(previewInvoice.discountAmount)}</span>
                  </div>
                )}
                {Number(previewInvoice.additionalDiscountPercent) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                    <span>Addl. Discount ({previewInvoice.additionalDiscountPercent}%)</span>
                    <span style={{ fontWeight: '600', color: '#EF4444' }}>- ₹{formatNumber(previewInvoice.additionalDiscountAmount)}</span>
                  </div>
                )}
                {Number(previewInvoice.packingCharge) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                    <span>Packing ({previewInvoice.packingPercent}%)</span>
                    <span style={{ fontWeight: '600', color: '#10B981' }}>+ ₹{formatNumber(previewInvoice.packingCharge)}</span>
                  </div>
                )}
                {Number(previewInvoice.gstAmount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B4DFF' }}>
                    <span>GST ({previewInvoice.gstPercent}%)</span>
                    <span style={{ fontWeight: '600' }}>+ ₹{formatNumber(previewInvoice.gstAmount)}</span>
                  </div>
                )}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  borderTop: '2px solid #CBD5E1', paddingTop: '10px', marginTop: '4px'
                }}>
                  <span style={{ fontWeight: '800', fontSize: '15px', color: '#1E293B' }}>Net Payable</span>
                  <span style={{ fontWeight: '900', fontSize: '20px', color: '#4B4DFF' }}>
                    ₹{formatNumber(previewInvoice.netAmount)}
                  </span>
                </div>
              </div>

            </div>

            {/* Drawer Footer */}
            <div style={{
              padding: '16px 22px',
              borderTop: '1px solid #E2E8F0',
              display: 'flex', gap: '10px',
              flexShrink: 0, background: '#FAFBFF'
            }}>
              <button
                onClick={() => {
                  const doc = generatePdfDocument(previewInvoice, company);
                  doc.save(`Sri_Kaliswari_Bill_SKC_${previewInvoice.billNo}_${previewInvoice.customerName}.pdf`);
                }}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg,#4B4DFF 0%,#6D3DFF 100%)',
                  color: '#fff', border: 'none',
                  padding: '13px', borderRadius: '12px',
                  fontWeight: '800', fontSize: '14px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '8px', boxShadow: '0 6px 20px rgba(75,77,255,0.35)'
                }}
              >
                <Download size={18} /> Download PDF
              </button>
              <button
                onClick={() => setPreviewInvoice(null)}
                style={{
                  background: '#F1F5F9', color: '#64748B',
                  border: '1px solid #E2E8F0',
                  padding: '13px 18px', borderRadius: '12px',
                  fontWeight: '700', fontSize: '14px', cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>

          </div>
        </>
      )}

    </div>
  );
}

// -------------------------------------------------------------
// SUB-VIEW: Product Master Component
// -------------------------------------------------------------
function ProductMasterView({ products, setProducts, showToast }) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  // New Product Modal Form
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [newCode, setNewCode] = React.useState('');
  const [newName, setNewName] = React.useState('');
  const [newCat, setNewCat] = React.useState(initialCategories[0]);
  const [newContent, setNewContent] = React.useState('1 Box (10 pcs)');
  const [newRate, setNewRate] = React.useState('');
  const [newStock, setNewStock] = React.useState('100');

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.code).includes(searchTerm);
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleCreateProduct = (e) => {
    e.preventDefault();
    if (!newName || !newRate) {
      showToast('Please fill required product name and rate!');
      return;
    }
    const newProduct = {
      id: Date.now(),
      code: newCode || String(products.length + 1),
      name: newName,
      category: newCat,
      content: newContent,
      rate: Number(newRate),
      stock: Number(newStock) || 0,
      taxPercent: 18
    };
    setProducts([...products, newProduct]);
    setIsModalOpen(false);
    setNewName('');
    setNewCode('');
    setNewRate('');
    showToast('New Cracker Item Added Successfully!');
  };

  const handleDeleteProduct = (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== id));
      showToast('Product removed from catalog');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Top action header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#FFFFFF',
        padding: '20px 24px',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>Product Master Catalog</h2>
          <p style={{ fontSize: '13px', color: '#64748B' }}>Manage all cracker items, standard rates, packing units and live inventory.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            background: '#4B4DFF',
            color: '#FFF',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(75, 77, 255, 0.28)'
          }}
        >
          <PlusCircle size={17} /> Add New Cracker Item
        </button>
      </div>

      {/* Filters Bar */}
      <div style={{
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        background: '#FFFFFF',
        padding: '16px 24px',
        borderRadius: '16px',
        border: '1px solid #E2E8F0'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          <input
            type="text"
            placeholder="Search by product name, item code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '13px'
            }}
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '9px 14px',
            borderRadius: '8px',
            border: '1px solid #CBD5E1',
            fontSize: '13px',
            fontWeight: '600',
            background: '#FFF'
          }}
        >
          <option value="All">All Categories ({products.length})</option>
          {initialCategories.map((c, i) => (
            <option key={i} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Product Table */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
              <th style={{ padding: '14px 16px', width: '70px', textAlign: 'center' }}>Code</th>
              <th style={{ padding: '14px 16px' }}>Product Name</th>
              <th style={{ padding: '14px 16px', width: '200px' }}>Category</th>
              <th style={{ padding: '14px 16px', width: '140px' }}>Packing / Content</th>
              <th style={{ padding: '14px 16px', width: '120px', textAlign: 'right' }}>Standard Rate (₹)</th>
              <th style={{ padding: '14px 16px', width: '100px', textAlign: 'center' }}>Stock Qty</th>
              <th style={{ padding: '14px 16px', width: '80px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: '#4B4DFF' }}>
                  {p.code}
                </td>
                <td style={{ padding: '12px 16px', fontWeight: '600', color: '#1E293B' }}>
                  {p.name}
                </td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>
                  <span style={{ background: '#F1F5F9', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                    {p.category}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>
                  {p.content}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>
                  ₹{formatNumber(p.rate)}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                    background: p.stock > 50 ? '#DCFCE7' : '#FEF3C7',
                    color: p.stock > 50 ? '#15803D' : '#B45309'
                  }}>
                    {p.stock}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#EF4444',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '24px',
            width: '480px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', color: '#0F172A' }}>
              Add New Cracker to Master
            </h3>
            <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 44"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>Product Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. 7cm Electric Sparklers"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>Category</label>
                <select
                  value={newCat}
                  onChange={e => setNewCat(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                >
                  {initialCategories.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>Content / Pack</label>
                  <input
                    type="text"
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>Rate (₹) *</label>
                  <input
                    type="number"
                    placeholder="750"
                    value={newRate}
                    onChange={e => setNewRate(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>Stock</label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={e => setNewStock(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#4B4DFF', color: '#FFF', cursor: 'pointer', fontWeight: '700' }}
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// -------------------------------------------------------------
// SUB-VIEW: Customer Master Component
// -------------------------------------------------------------
function CustomerMasterView({ customers, setCustomers, showToast }) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const [address, setAddress] = React.useState('');

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mobile.includes(searchTerm) ||
    c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCustomer = (e) => {
    e.preventDefault();
    if (!name || !mobile) {
      showToast('Name and mobile are required');
      return;
    }
    const newCust = {
      id: Date.now(),
      name,
      mobile,
      address: address || 'Sivakasi',
      totalOrders: 0,
      balance: 0
    };
    setCustomers([newCust, ...customers]);
    setIsModalOpen(false);
    setName('');
    setMobile('');
    setAddress('');
    showToast('New Customer Added Successfully!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div className="master-action-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#FFFFFF',
        padding: '20px 24px',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>Customer Directory</h2>
          <p style={{ fontSize: '13px', color: '#64748B' }}>Client database, contact numbers, order histories and billing profiles.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            background: '#4B4DFF',
            color: '#FFF',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(75, 77, 255, 0.28)'
          }}
        >
          <PlusCircle size={17} /> Add New Customer
        </button>
      </div>

      <div style={{
        background: '#FFFFFF',
        padding: '14px 24px',
        borderRadius: '16px',
        border: '1px solid #E2E8F0'
      }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          <input
            type="text"
            placeholder="Search customers by name, phone or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '13px'
            }}
          />
        </div>
      </div>

      <div className="product-table-wrapper" style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
      }}>
        <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
              <th style={{ padding: '14px 16px', width: '60px' }}>#</th>
              <th style={{ padding: '14px 16px' }}>Customer Name</th>
              <th style={{ padding: '14px 16px', width: '160px' }}>Mobile No</th>
              <th style={{ padding: '14px 16px' }}>Address & Location</th>
              <th style={{ padding: '14px 16px', width: '120px', textAlign: 'center' }}>Total Orders</th>
              <th style={{ padding: '14px 16px', width: '80px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '12px 16px', fontWeight: '600', color: '#94A3B8' }}>{i + 1}</td>
                <td style={{ padding: '12px 16px', fontWeight: '700', color: '#1E293B' }}>{c.name}</td>
                <td style={{ padding: '12px 16px', color: '#4B4DFF', fontWeight: '600' }}>{c.mobile}</td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>{c.address}</td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <span style={{ background: '#EEF2FF', color: '#4B4DFF', padding: '3px 8px', borderRadius: '12px', fontWeight: '700', fontSize: '11px' }}>
                    {c.totalOrders || 0} Bills
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <button
                    onClick={() => {
                      setCustomers(customers.filter(item => item.id !== c.id));
                      showToast('Customer deleted');
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', width: '420px', maxWidth: '100%', boxSizing: 'border-box' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>Add Customer Profile</h3>
            <form onSubmit={handleAddCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>Customer Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>Mobile Number *</label>
                <input type="text" value={mobile} onChange={e => setMobile(e.target.value)} required style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>Address</label>
                <textarea value={address} onChange={e => setAddress(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', minHeight: '60px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#4B4DFF', color: '#FFF', cursor: 'pointer', fontWeight: '700' }}>Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// -------------------------------------------------------------
// SUB-VIEW: Reports & Saved Invoices
// -------------------------------------------------------------
function ReportsView({ savedInvoices, setSavedInvoices, company, showToast }) {
  const totalRevenue = savedInvoices.reduce((acc, curr) => acc + curr.netAmount, 0);
  const totalGross = savedInvoices.reduce((acc, curr) => acc + curr.grossTotal, 0);

  const handleDownloadPdf = (inv) => {
    const doc = generatePdfDocument(inv, company);
    doc.save(`Sri_Kaliswari_Bill_${inv.billNo}_${inv.customerName}.pdf`);
  };

  const handleDeleteInvoice = (billNo) => {
    if (confirm(`Are you sure you want to delete Invoice #${billNo}?`)) {
      setSavedInvoices(savedInvoices.filter(i => i.billNo !== billNo));
      showToast(`Bill #${billNo} removed`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Metric Cards */}
      <div className="reports-metric-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Total Invoices Generated</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#4B4DFF', marginTop: '6px' }}>{savedInvoices.length}</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Gross Sales Value</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0F172A', marginTop: '6px' }}>₹{formatNumber(totalGross)}</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #4B4DFF 0%, #6D3DFF 100%)', padding: '20px', borderRadius: '16px', color: '#FFF', boxShadow: '0 8px 24px rgba(75, 77, 255, 0.28)' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', opacity: 0.9, textTransform: 'uppercase' }}>Total Net Realised Revenue</div>
          <div style={{ fontSize: '26px', fontWeight: '800', marginTop: '6px' }}>₹{formatNumber(totalRevenue)}</div>
        </div>
      </div>

      {/* History Table */}
      <div className="product-table-wrapper" style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', fontWeight: '800', fontSize: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span>Recent Invoices & Quotations History</span>
          {savedInvoices.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear all saved invoices history and reset bill number to 1?')) {
                  setSavedInvoices([]);
                  showToast('All invoices cleared. Bill counter reset to #1.');
                }
              }}
              style={{
                background: '#FEE2E2',
                color: '#DC2626',
                border: '1px solid #FCA5A5',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Clear All & Start from #1
            </button>
          )}
        </div>
        <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
              <th style={{ padding: '14px 16px', width: '80px', textAlign: 'center' }}>Bill No</th>
              <th style={{ padding: '14px 16px', width: '110px' }}>Date</th>
              <th style={{ padding: '14px 16px', width: '110px' }}>Type</th>
              <th style={{ padding: '14px 16px' }}>Customer Details</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Gross Total (₹)</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>Discount</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Net Payable (₹)</th>
              <th style={{ padding: '14px 16px', width: '120px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {savedInvoices.map((inv) => (
              <tr key={inv.billNo} style={{ borderBottom: '1px solid #F1F5F9' }}>
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
                    background: inv.type === 'tax' ? '#DBEAFE' : '#FEF3C7',
                    color: inv.type === 'tax' ? '#1E40AF' : '#92400E'
                  }}>
                    {inv.type ? inv.type.toUpperCase() : 'ESTIMATE'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                  <div>{inv.customerName}</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>{inv.customerMobile}</div>
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
                <td style={{ padding: '12px 16px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handleDownloadPdf(inv)}
                    style={{
                      background: '#EEF2FF',
                      border: '1px solid #C7D2FE',
                      color: '#4B4DFF',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Download size={13} /> PDF
                  </button>
                  <button
                    onClick={() => handleDeleteInvoice(inv.billNo)}
                    style={{ background: 'transparent', border: 'none', color: '#CBD5E1', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

// -------------------------------------------------------------
// SUB-VIEW: Settings
// -------------------------------------------------------------
function SettingsView({ company, setCompany, showToast }) {
  const [formData, setFormData] = React.useState({ ...company });

  const handleSave = (e) => {
    e.preventDefault();
    setCompany(formData);
    showToast('Company details & Print header updated!');
  };

  return (
    <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '28px', border: '1px solid #E2E8F0', maxWidth: '800px', margin: '0 auto', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>
        Firm & Bill Print Settings
      </h2>
      <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>
        Configure header branding, GST number, bank information and print terms for Sri Kaliswari Crackers.
      </p>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Company Business Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontWeight: '700' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Tagline</label>
          <input
            type="text"
            value={formData.tagline}
            onChange={e => setFormData({ ...formData, tagline: e.target.value })}
            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Factory / Store Address</label>
          <input
            type="text"
            value={formData.address}
            onChange={e => setFormData({ ...formData, address: e.target.value })}
            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
          />
        </div>

        <div className="settings-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Phone / Mobile Contacts</label>
            <input
              type="text"
              value={formData.mobile}
              onChange={e => setFormData({ ...formData, mobile: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>GSTIN Number</label>
            <input
              type="text"
              value={formData.gstin}
              onChange={e => setFormData({ ...formData, gstin: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontWeight: '600' }}
            />
          </div>
        </div>

        <div className="settings-3col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Bank Name</label>
            <input
              type="text"
              value={formData.bankName}
              onChange={e => setFormData({ ...formData, bankName: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Bank Account No</label>
            <input
              type="text"
              value={formData.accountNo}
              onChange={e => setFormData({ ...formData, accountNo: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>IFSC Code</label>
            <input
              type="text"
              value={formData.ifscCode}
              onChange={e => setFormData({ ...formData, ifscCode: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
            />
          </div>
        </div>

        <button
          type="submit"
          style={{
            background: '#4B4DFF',
            color: '#FFF',
            border: 'none',
            padding: '12px',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Save Configuration
        </button>
      </form>
    </div>
  );
}
