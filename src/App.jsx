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
  Database,
  Server,
  AlertCircle,
  Share2,
  Send,
  Copy,
  ExternalLink,
  Check,
  MinusCircle,
  Plus,
  Minus,
  Layers,
  Boxes,
  PackagePlus,
  PackageMinus,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard,
  History,
  Truck,
  AlertTriangle,
  FileText,
  QrCode
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { initialCategories, defaultProducts, defaultCustomers, defaultCompany } from './data/defaultData';
import { formatCurrency, formatNumber, generatePdfDocument } from './utils/pdfGenerator';
import { PrintableInvoice } from './components/PrintableInvoice';
import { cleanPhoneNumber, openWhatsAppChat, shareInvoicePdf, copyInvoiceImageToClipboard, createInvoiceWhatsAppMessage } from './utils/whatsapp';
import { PriceListView } from './components/PriceListView';
import { StockAlertsView } from './components/StockAlertsView';

import {
  checkDbStatus,
  fetchYears,
  createYear as apiCreateYear,
  fetchCompany,
  saveCompany as apiSaveCompany,
  fetchProducts,
  addProduct as apiAddProduct,
  updateProduct as apiUpdateProduct,
  deleteProduct as apiDeleteProduct,
  fetchCustomers,
  addCustomer as apiAddCustomer,
  updateCustomer as apiUpdateCustomer,
  deleteCustomer as apiDeleteCustomer,
  fetchInvoices,
  saveInvoice as apiSaveInvoice,
  deleteInvoice as apiDeleteInvoice,
  clearAllInvoices as apiClearAllInvoices,
  syncLocalStorageToDb,
  fetchStats,
  getWhatsAppBotStatus,
  connectWhatsAppBot,
  logoutWhatsAppBot,
  sendInvoicePdfViaWhatsAppBot
} from './utils/api';

export default function App() {
  // Navigation tabs: 'estimate' | 'taxbill' | 'quotation' | 'products' | 'customers' | 'reports' | 'settings'
  const [activeTab, setActiveTab] = React.useState('estimate');
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [loginEmail, setLoginEmail] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');
  const [loginError, setLoginError] = React.useState('');
  const [loginYear, setLoginYear] = React.useState('2026');
  const [availableYears, setAvailableYears] = React.useState(['2026']);
  const [activeYear, setActiveYear] = React.useState('');
  const [yearMissingPrompt, setYearMissingPrompt] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  // Database Connection State
  const [dbConnected, setDbConnected] = React.useState(null);
  const [dbInfo, setDbInfo] = React.useState(null);
  const [isLoadingData, setIsLoadingData] = React.useState(false);
  const dbFailCountRef = React.useRef(0);

  const refreshDbStatus = React.useCallback(async () => {
    try {
      const status = await checkDbStatus();
      if (status && status.ok) {
        dbFailCountRef.current = 0;
        setDbConnected(true);
        setDbInfo(status);
      } else {
        dbFailCountRef.current += 1;
        // Require 4 consecutive checks (over 100 seconds) before declaring offline
        if (dbFailCountRef.current >= 4) {
          setDbConnected(false);
        }
      }
    } catch (err) {
      dbFailCountRef.current += 1;
      if (dbFailCountRef.current >= 4) {
        setDbConnected(false);
      }
    }
  }, []);

  React.useEffect(() => {
    refreshDbStatus();

    // Recheck immediately when window regains focus or comes back online
    const handleFocus = () => refreshDbStatus();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleFocus);

    // Regular poll every 25 seconds
    const interval = setInterval(refreshDbStatus, 25000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleFocus);
      clearInterval(interval);
    };
  }, [refreshDbStatus]);

  // WhatsApp Bot State (for direct automated PDF sending)
  const [waBotStatus, setWaBotStatus] = React.useState({ status: 'disconnected', connected: false });
  const [isWaModalOpen, setIsWaModalOpen] = React.useState(false);

  const fetchWaStatus = React.useCallback(async () => {
    try {
      const st = await getWhatsAppBotStatus();
      setWaBotStatus(st);
    } catch (e) {}
  }, []);

  React.useEffect(() => {
    fetchWaStatus();
    const interval = setInterval(fetchWaStatus, 4000);
    return () => clearInterval(interval);
  }, [fetchWaStatus]);

  // Load registered database years on mount
  React.useEffect(() => {
    fetchYears().then(yrs => {
      if (Array.isArray(yrs) && yrs.length > 0) {
        setAvailableYears(yrs);
        if (!loginYear || !yrs.includes(loginYear)) {
          setLoginYear(yrs[yrs.length - 1]);
        }
      }
    }).catch(err => {
      console.warn('Could not load years from TiDB on mount:', err);
    });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loginEmail === 'Billing@admin.com' && loginPassword === 'Billing@123') {
      if (!loginYear) {
        setLoginError('Please enter a year.');
        return;
      }
      let existingYears = [];
      try {
        existingYears = await fetchYears();
        if (Array.isArray(existingYears) && existingYears.length > 0) {
          setAvailableYears(existingYears);
        }
      } catch (err) {
        existingYears = availableYears;
      }
      if (Array.isArray(existingYears) && existingYears.includes(loginYear)) {
        setActiveYear(loginYear);
        setLoggedIn(true);
        setLoginError('');
        setYearMissingPrompt(false);
      } else {
        setYearMissingPrompt(true);
        setLoginError(`Year ${loginYear} does not exist in database.`);
      }
    } else {
      setLoginError('Invalid credentials');
    }
  };

  const handleCreateYear = async () => {
    try {
      await apiCreateYear(loginYear);
    } catch (err) {
      console.warn('Could not create year in TiDB:', err);
    }
    const updated = Array.from(new Set([...availableYears, String(loginYear)]));
    setAvailableYears(updated);
    localStorage.setItem('kalieswari_years', JSON.stringify(updated));
    setActiveYear(loginYear);
    setLoggedIn(true);
    setYearMissingPrompt(false);
    setLoginError('');
  };

  // Master Data with TiDB Cloud persistence + LocalStorage caching
  const [company, setCompany] = React.useState(defaultCompany);
  const [products, setProducts] = React.useState(defaultProducts);
  const [customers, setCustomers] = React.useState(defaultCustomers);
  const [savedInvoices, setSavedInvoices] = React.useState([]);

  // Load all data from TiDB Cloud with fallback caching
  const loadAllData = React.useCallback(async (targetYear = activeYear) => {
    if (!targetYear) return;
    setIsLoadingData(true);

    const loadFallback = (key, fallback) => {
      const saved = localStorage.getItem(`${key}_${targetYear}`);
      if (!saved) return fallback;
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 0) return fallback;
        return parsed;
      } catch (e) {
        return fallback;
      }
    };

    try {
      const [c, p, cust, inv] = await Promise.all([
        fetchCompany(),
        fetchProducts(targetYear),
        fetchCustomers(targetYear),
        fetchInvoices(targetYear)
      ]);

      if (c && typeof c === 'object') {
        setCompany(c);
        localStorage.setItem(`kalieswari_company_${targetYear}`, JSON.stringify(c));
      } else {
        setCompany(loadFallback('kalieswari_company', defaultCompany));
      }

      if (Array.isArray(p) && p.length > 0) {
        setProducts(p);
        localStorage.setItem(`kalieswari_products_${targetYear}`, JSON.stringify(p));
      } else {
        setProducts(loadFallback('kalieswari_products', defaultProducts));
      }

      if (Array.isArray(cust) && cust.length > 0) {
        setCustomers(cust);
        localStorage.setItem(`kalieswari_customers_${targetYear}`, JSON.stringify(cust));
      } else {
        setCustomers(loadFallback('kalieswari_customers', defaultCustomers));
      }

      let loadedInvoices = [];
      if (Array.isArray(inv)) {
        loadedInvoices = inv;
        setSavedInvoices(inv);
        localStorage.setItem(`kalieswari_invoices_${targetYear}`, JSON.stringify(inv));
      } else {
        loadedInvoices = loadFallback('kalieswari_invoices', []);
        setSavedInvoices(loadedInvoices);
      }

      const nextBillNo = loadedInvoices.length > 0
        ? Math.max(...loadedInvoices.map(i => Number(i.billNo) || 0)) + 1
        : 1;
      setBillNo(nextBillNo);
    } catch (err) {
      console.error('Error connecting to TiDB, using fallback:', err);
      setCompany(loadFallback('kalieswari_company', defaultCompany));
      setProducts(loadFallback('kalieswari_products', defaultProducts));
      setCustomers(loadFallback('kalieswari_customers', defaultCustomers));
      const loadedInvoices = loadFallback('kalieswari_invoices', []);
      setSavedInvoices(loadedInvoices);
      const nextBillNo = loadedInvoices.length > 0
        ? Math.max(...loadedInvoices.map(i => Number(i.billNo) || 0)) + 1
        : 1;
      setBillNo(nextBillNo);
    } finally {
      setIsLoadingData(false);
    }
  }, [activeYear]);

  React.useEffect(() => {
    if (!activeYear) return;
    loadAllData(activeYear);

    // Reset billing form to a clean slate for this year
    setBillItems([]);
    setCustomerName('');
    setCustomerMobile('');
    setCustomerAddress('');
    setSelectedCustomerId('');
    setSelectedProductCode('');
    setSelectedProductId('');
    setItemQty(1);
    setDiscountPercent(90);
    setAdditionalDiscPercent(0);
    setPackingPercent(0);
  }, [activeYear, loadAllData]);

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
  const [discountPercent, setDiscountPercent] = React.useState(90);
  const [additionalDiscPercent, setAdditionalDiscPercent] = React.useState(0);
  const [packingPercent, setPackingPercent] = React.useState(0);
  const [gstPercent, setGstPercent] = React.useState(18);

  // Search & Filter in dialogs/masters
  const [productSearch, setProductSearch] = React.useState('');
  const [customerSearch, setCustomerSearch] = React.useState('');
  const [toastMessage, setToastMessage] = React.useState('');
  const [previewInvoice, setPreviewInvoice] = React.useState(null); // invoice side drawer
  const [printingInvoice, setPrintingInvoice] = React.useState(null); // active invoice sent to browser print
  const [whatsappModal, setWhatsappModal] = React.useState(null); // whatsapp status popup modal

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
      } else if (e.key === 'F6') {
        e.preventDefault();
        handleSaveAndPrint(false);
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
    setDiscountPercent(90);
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

    // Persist invoice to TiDB Cloud database
    apiSaveInvoice({ ...newInvoice, year: activeYear })
      .then(() => {
        // Refresh product stock and customers from TiDB
        Promise.all([
          fetchProducts(activeYear),
          fetchCustomers(activeYear)
        ]).then(([updatedProducts, updatedCustomers]) => {
          if (Array.isArray(updatedProducts) && updatedProducts.length > 0) {
            setProducts(updatedProducts);
          }
          if (Array.isArray(updatedCustomers) && updatedCustomers.length > 0) {
            setCustomers(updatedCustomers);
          }
        }).catch(() => {});
      })
      .catch(err => {
        console.warn('Saved bill locally; TiDB cloud error:', err);
      });

    // Confetti celebration
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    // 1. AUTOMATIC COMPUTER PDF DOWNLOAD (Save bill automatically to PC)
    let pdfBase64 = null;
    let safePdfName = `Sri_Kaliswari_Bill_SKC_${billNo}.pdf`;
    try {
      const doc = generatePdfDocument(newInvoice, company);
      const safeCustomerName = (customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
      safePdfName = `Sri_Kaliswari_Bill_SKC_${billNo}_${safeCustomerName}.pdf`;
      doc.save(safePdfName);
      pdfBase64 = doc.output('datauristring');
    } catch (err) {
      console.warn('PDF auto-download error:', err);
    }

    // 2. AUTOMATIC WHATSAPP INVOICE DISPATCH TO CUSTOMER
    const cleanMobile = cleanPhoneNumber(customerMobile);
    if (cleanMobile && cleanMobile.length >= 10) {
      // If WhatsApp Bot is connected, automatically send the actual PDF document directly to the customer!
      if (waBotStatus.connected && pdfBase64) {
        sendInvoicePdfViaWhatsAppBot({
          phone: cleanMobile,
          billNo: newInvoice.billNo,
          customerName: newInvoice.customerName,
          netAmount: newInvoice.netAmount,
          pdfBase64: pdfBase64,
          filename: safePdfName
        })
          .then(() => {
            showToast(`✓ Official PDF Invoice #SKC ${billNo} auto-sent to customer WhatsApp (+${cleanMobile})!`);
          })
          .catch((err) => {
            console.warn('WhatsApp Bot send failed:', err);
          });
      }

      const invoiceMsg = createInvoiceWhatsAppMessage(newInvoice, company);
      const waResult = openWhatsAppChat(cleanMobile, invoiceMsg);
      setWhatsappModal({
        isOpen: true,
        phone: cleanMobile,
        customerName: newInvoice.customerName,
        billNo: newInvoice.billNo,
        netAmount: newInvoice.netAmount,
        waUrl: waResult.waUrl,
        invoice: newInvoice,
        pdfBase64: pdfBase64,
        filename: safePdfName,
        popupBlocked: waResult.popupBlocked
      });
      showToast(`Bill #SKC ${billNo} Saved & Processed for WhatsApp (+${cleanMobile})!`);
      setTimeout(() => {
        copyInvoiceImageToClipboard('printable-invoice-container')
          .catch(() => {});
      }, 350);
    } else {
      showToast(`Bill #SKC ${billNo} Saved & Downloaded to Computer!`);
    }

    // 3. AUTOMATIC BROWSER PRINT PREVIEW (Matches exactly the A4 printable format)
    if (shouldPrint) {
      setPrintingInvoice(newInvoice);
      setPreviewInvoice(newInvoice);
      setTimeout(() => {
        window.print();
      }, 350);
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
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '10px',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: '700',
              background: dbConnected === true ? 'rgba(16, 185, 129, 0.15)' : dbConnected === false ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              border: `1px solid ${dbConnected === true ? 'rgba(16, 185, 129, 0.35)' : dbConnected === false ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
              color: dbConnected === true ? '#34D399' : dbConnected === false ? '#F87171' : '#FBBF24',
              cursor: 'pointer'
            }}
            onClick={refreshDbStatus}
            title={dbConnected === true ? 'TiDB Cloud MySQL is Online & Connected. Click to recheck.' : 'Click to retry connection to TiDB Cloud'}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: dbConnected === true ? '#10B981' : dbConnected === false ? '#EF4444' : '#F59E0B',
                boxShadow: dbConnected === true ? '0 0 6px #10B981' : 'none'
              }}></span>
              <Database size={12} />
              <span>TiDB Cloud: {dbConnected === true ? 'Online (kalishwaribilling)' : dbConnected === false ? 'Offline / Local' : 'Connecting...'}</span>
            </div>
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
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Database Years:</span>
                {availableYears.map(yr => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => { setLoginYear(yr); setYearMissingPrompt(false); setLoginError(''); }}
                    style={{
                      background: String(loginYear) === String(yr) ? '#FF6B35' : 'rgba(255,255,255,0.12)',
                      color: '#FFF',
                      border: `1px solid ${String(loginYear) === String(yr) ? '#FF6B35' : 'rgba(255,255,255,0.25)'}`,
                      padding: '2px 9px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: '700'
                    }}
                  >
                    {yr}
                  </button>
                ))}
              </div>
              <p className="login-year-hint">📅 Choose an existing database year or enter a new one</p>
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

  const lowStockCount = products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 20).length;

  return (
    <div className="sidebar-layout-root">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="app-toast">
          <CheckCircle size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── LEFT SIDEBAR (MATCHING REFERENCE UI) ── */}
      <aside className="sidebar-aside">
        {/* Brand Header */}
        <div className="sidebar-brand-box">
          <div className="sidebar-logo-circle">
            🎆
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="sidebar-brand-title">Sri Kaliswari Crackers</div>
            <div className="sidebar-brand-sub">Billing &amp; Inventory</div>
          </div>
        </div>

        {/* Section: MAIN MENU */}
        <div className="sidebar-section-title">MAIN MENU</div>

        {/* Nav Items */}
        <nav className="sidebar-nav-list">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'estimate', label: 'Quick Billing', badge: 'F2', badgeType: 'orange', icon: FileSpreadsheet },
            { id: 'products', label: 'Products Master', icon: Package },
            { id: 'pricelist', label: 'Price List', icon: FileText },
            { id: 'stockalerts', label: 'Stock & Alerts', badge: lowStockCount > 0 ? String(lowStockCount) : null, badgeType: 'red', icon: AlertTriangle },
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'reports', label: 'Sales History', icon: History },
            { id: 'stockinward', label: 'Stock Inward', icon: PackagePlus },
            { id: 'suppliers', label: 'Suppliers', icon: Truck },
            { id: 'profit', label: 'Reports & Profit', icon: TrendingUp },
            { id: 'settings', label: 'Shop Settings', icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id || (tab.id === 'estimate' && activeTab === 'taxbill');
            return (
              <button
                key={tab.id}
                type="button"
                className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (tab.id === 'stockinward') {
                    setActiveTab('stockalerts');
                  } else if (tab.id === 'dashboard' || tab.id === 'profit') {
                    setActiveTab('reports');
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
              >
                <Icon size={18} color={isActive ? '#FF6B35' : '#64748B'} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`sidebar-badge ${tab.badgeType === 'red' ? 'sidebar-badge-red' : 'sidebar-badge-orange'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Low Stock Alert in Sidebar */}
        {lowStockCount > 0 && (
          <div
            className="sidebar-bottom-alert"
            onClick={() => setActiveTab('stockalerts')}
            title="Click to view and alter low stock items"
          >
            <AlertTriangle size={15} color="#DC2626" />
            <span>⚠️ {lowStockCount} Low Stock Items</span>
          </div>
        )}

        {/* Bottom User Profile */}
        <div className="sidebar-profile">
          <div className="sidebar-avatar-circle">
            <User size={18} color="#FF6B35" />
          </div>
          <div>
            <div className="sidebar-profile-name">Shop Owner (Admin)</div>
            <div className="sidebar-profile-role">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
              Admin Role
            </div>
          </div>
        </div>
      </aside>

      {/* ── RIGHT MAIN WORKSPACE ── */}
      <div className="sidebar-main-area">

        {/* TOP HEADER BAR (MATCHING REFERENCE UI) */}
        <header className="top-header-bar">
          <div className="top-header-left">
            <div className="top-header-title">
              {activeTab === 'products' ? 'Products Inventory' : (
                activeTab === 'pricelist' ? 'Price List Master' : (
                  activeTab === 'stockalerts' || activeTab === 'stockinward' ? 'Stock & Inventory Alerts' : (
                    activeTab === 'estimate' ? 'Quick Billing Engine' : (
                      activeTab === 'customers' ? 'Customers Directory' : (
                        activeTab === 'reports' ? 'Sales History & Invoices' : 'Shop Settings'
                      )
                    )
                  )
                )
              )}
            </div>
            <div className="top-header-sub">
              Sri Kaliswari Crackers • Sivakasi
            </div>
          </div>

          <div className="top-header-right">
            {/* Year Switcher */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#FFF7ED',
              border: '1px solid #FED7AA',
              padding: '6px 10px',
              borderRadius: '9px'
            }}>
              <Calendar size={13} color="#EA580C" />
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#9A3412' }}>Year:</span>
              <select
                value={activeYear}
                onChange={(e) => setActiveYear(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontWeight: '800',
                  color: '#C2410C',
                  fontSize: '12px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {availableYears.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            {/* + New Bill Button */}
            <button
              type="button"
              onClick={() => {
                handleResetBill();
                setActiveTab('estimate');
              }}
              className="header-orange-btn"
            >
              <Receipt size={15} />
              <span>+ New Bill</span>
            </button>

            {/* Price List Button */}
            <button
              type="button"
              onClick={() => setActiveTab('pricelist')}
              className={`header-outline-btn ${activeTab === 'pricelist' ? 'active' : ''}`}
            >
              <FileText size={15} />
              <span>Price List</span>
            </button>

            {/* Live Clock Pill: 🕒 08:46:24 pm */}
            <div className="header-clock-pill">
              <Clock size={14} color="#64748B" />
              <span>{currentTime}</span>
            </div>

            {/* Admin Pill */}
            <div className="header-admin-pill">
              <User size={14} color="#EA580C" />
              <span>Admin</span>
            </div>

            {/* Staff Pill */}
            <div className="header-staff-pill">
              <span>Staff</span>
            </div>

            {/* TiDB Live Status */}
            <div
              onClick={async () => {
                await refreshDbStatus();
                await loadAllData(activeYear);
                showToast('Refreshed & Synced with TiDB Cloud!');
              }}
              title={dbConnected ? 'TiDB Cloud: Online & Live' : 'TiDB Cloud: Offline'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: dbConnected ? '#ECFDF5' : '#FEF2F2',
                border: `1px solid ${dbConnected ? '#A7F3D0' : '#FECACA'}`,
                padding: '6px 12px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: '700',
                color: dbConnected ? '#065F46' : '#991B1B',
                cursor: 'pointer'
              }}
            >
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: dbConnected ? '#10B981' : '#EF4444',
                boxShadow: dbConnected ? '0 0 6px #10B981' : 'none'
              }}></span>
              <Database size={12} />
              <span>{dbConnected ? 'TiDB Live' : 'Offline'}</span>
            </div>

            {/* WhatsApp Bot Status */}
            <div
              onClick={() => {
                setIsWaModalOpen(true);
                fetchWaStatus();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: waBotStatus.connected ? '#DCFCE7' : '#FEF3C7',
                border: `1px solid ${waBotStatus.connected ? '#86EFAC' : '#FCD34D'}`,
                padding: '6px 12px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: '700',
                color: waBotStatus.connected ? '#15803D' : '#B45309',
                cursor: 'pointer'
              }}
            >
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: waBotStatus.connected ? '#16A34A' : '#F59E0B'
              }}></span>
              <Send size={12} />
              <span>{waBotStatus.connected ? 'WA Live' : 'Link WA'}</span>
            </div>
          </div>
        </header>

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
                <span className="qb-key-item"><span className="qb-key-badge">F6</span> Save & PDF</span>
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
                    <Package size={18} color="#FF6B35" />
                    <span style={{ fontWeight: '800', fontSize: '15px', color: '#1E293B' }}>
                      Invoice Items ({billItems.length}) • Total Cases: {billItems.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0)}
                    </span>
                  </div>

                  {billItems.length > 0 && (
                    <button
                      onClick={() => setBillItems([])}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #FECACA',
                        color: '#EF4444',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '700',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      Clear Items
                    </button>
                  )}
                </div>

                <div style={{ overflowX: 'auto', flex: 1, minHeight: '320px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', color: '#475569', fontWeight: '700', borderBottom: '1px solid #CBD5E1' }}>
                        <th style={{ padding: '12px 14px', width: '45px', textAlign: 'center' }}>S.N</th>
                        <th style={{ padding: '12px 14px' }}>CRACKER NAME</th>
                        <th style={{ padding: '12px 14px', width: '130px' }}>CATEGORY</th>
                        <th style={{ padding: '12px 14px', width: '140px' }}>BRAND / PACKING</th>
                        <th style={{ padding: '12px 14px', width: '90px', textAlign: 'right' }}>MRP (₹)</th>
                        <th style={{ padding: '12px 14px', width: '105px', textAlign: 'right' }}>SELL PRICE (₹)</th>
                        <th style={{ padding: '12px 14px', width: '120px', textAlign: 'center' }}>QTY</th>
                        <th style={{ padding: '12px 14px', width: '40px', textAlign: 'center' }}></th>
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
                          const disc = Number(discountPercent) || 0;
                          const sellPrice = item.rate * (1 - disc / 100);
                          return (
                            <tr key={index} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}>
                              <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '600', color: '#94A3B8' }}>
                                {index + 1}
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <div style={{ fontWeight: '700', color: '#1E293B', fontSize: '13.5px' }}>{item.name}</div>
                                {item.code && (
                                  <span style={{ fontSize: '10.5px', background: '#FFF7ED', color: '#EA580C', padding: '1px 6px', borderRadius: '4px', fontWeight: '800', border: '1px solid #FED7AA' }}>
                                    {item.code}
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '12px 14px', color: '#64748B', fontSize: '12px' }}>
                                {item.category || 'Sound Crackers'}
                              </td>
                              <td style={{ padding: '12px 14px', color: '#64748B', fontSize: '12px' }}>
                                {item.content || '1 Box'}
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right', color: '#94A3B8', textDecoration: disc > 0 ? 'line-through' : 'none' }}>
                                ₹{formatNumber(item.rate)}
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', color: '#EA580C', fontSize: '14px' }}>
                                ₹{formatNumber(sellPrice)}
                              </td>
                              <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '8px', background: '#FFFFFF', overflow: 'hidden' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateItemQty(index, Math.max(1, item.qty - 1))}
                                    style={{
                                      border: 'none',
                                      background: '#F8FAFC',
                                      color: '#475569',
                                      width: '28px',
                                      height: '32px',
                                      cursor: 'pointer',
                                      fontWeight: '800',
                                      fontSize: '15px'
                                    }}
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.qty}
                                    onChange={(e) => handleUpdateItemQty(index, e.target.value)}
                                    style={{
                                      width: '44px',
                                      height: '32px',
                                      border: 'none',
                                      textAlign: 'center',
                                      fontWeight: '800',
                                      fontSize: '14px',
                                      color: '#0F172A',
                                      outline: 'none'
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateItemQty(index, item.qty + 1)}
                                    style={{
                                      border: 'none',
                                      background: '#F8FAFC',
                                      color: '#475569',
                                      width: '28px',
                                      height: '32px',
                                      cursor: 'pointer',
                                      fontWeight: '800',
                                      fontSize: '15px'
                                    }}
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                <button
                                  onClick={() => handleRemoveItem(index)}
                                  title="Remove item"
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    {[90, 85, 80, 0].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setDiscountPercent(pct)}
                        style={{
                          background: Number(discountPercent) === pct ? '#4B4DFF' : '#F1F5F9',
                          color: Number(discountPercent) === pct ? '#FFF' : '#475569',
                          border: '1px solid #CBD5E1',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
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
                  <div className="qb-payment-modes" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                    {['Cash', 'UPI', 'Card', 'Credit', 'Split'].map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMode(mode)}
                        style={{
                          padding: '10px 4px',
                          borderRadius: '8px',
                          border: paymentMode === mode ? '2px solid #FF6B35' : '1px solid #CBD5E1',
                          background: paymentMode === mode ? '#FFF7ED' : '#FFFFFF',
                          color: paymentMode === mode ? '#EA580C' : '#475569',
                          fontWeight: '700',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
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
                    Net Total:
                  </div>
                  <div className="net-amount-value" style={{ fontSize: '30px', fontWeight: '900', marginTop: '4px' }}>
                    ₹{formatNumber(netAmount)}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '2px' }}>
                    {docFormat === 'INVOICE' ? 'Official GST Tax Invoice' : (docFormat === 'ESTIMATE' ? 'Estimate of Supply' : 'Official Quotation')}
                  </div>
                </div>

                {/* Action Buttons (Save & Print, Save & Download PDF, Save & WhatsApp, Clear Bill Screen) */}
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
                      boxShadow: '0 6px 18px rgba(255, 107, 53, 0.38)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Printer size={18} /> SAVE &amp; PRINT BILL (F5)
                  </button>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      onClick={() => handleSaveAndPrint(false)}
                      title="Save bill and download PDF to computer"
                      style={{
                        background: '#0F172A',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '11px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)'
                      }}
                    >
                      <Download size={15} /> Save &amp; PDF (F6)
                    </button>

                    <button
                      onClick={() => {
                        if (!customerMobile || customerMobile.trim().length < 10) {
                          showToast('Please enter customer mobile number to send WhatsApp!');
                          customerMobileRef.current?.focus();
                          return;
                        }
                        if (!waBotStatus.connected) {
                          setIsWaModalOpen(true);
                          connectWhatsAppBot().then(fetchWaStatus);
                          showToast('Scan QR code once to enable Direct PDF sending to WhatsApp!');
                          return;
                        }
                        handleSaveAndPrint(false);
                      }}
                      title="Save and dispatch invoice directly as PDF to customer WhatsApp"
                      style={{
                        background: waBotStatus.connected ? '#16A34A' : '#F59E0B',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '11px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: waBotStatus.connected ? '0 4px 12px rgba(22, 163, 74, 0.25)' : '0 4px 12px rgba(245, 158, 11, 0.25)'
                      }}
                    >
                      <Share2 size={15} /> {waBotStatus.connected ? 'WhatsApp PDF' : 'Link WA for PDF'}
                    </button>
                  </div>

                  <button
                    onClick={handleResetBill}
                    style={{
                      background: '#FFFFFF',
                      color: '#EF4444',
                      border: '1px solid #FECACA',
                      padding: '10px',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Trash2 size={15} /> Clear Bill Form
                  </button>
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
            activeYear={activeYear}
            isLoadingData={isLoadingData}
            loadProducts={async () => {
              const p = await fetchProducts(activeYear);
              if (Array.isArray(p) && p.length > 0) setProducts(p);
            }}
          />
        )}

        {/* VIEW: PRICE LIST MASTER (விலைப் பட்டியல்) */}
        {activeTab === 'pricelist' && (
          <PriceListView
            products={products}
            setProducts={setProducts}
            company={company}
            showToast={showToast}
            onSelectProductForBill={(p) => {
              handleSelectProduct(p);
              setActiveTab('estimate');
            }}
          />
        )}

        {/* VIEW: STOCK & ALERTS / ALTER (சரக்கு இருப்பு & திருத்தம்) */}
        {(activeTab === 'stockalerts' || activeTab === 'stockinward') && (
          <StockAlertsView
            products={products}
            setProducts={setProducts}
            showToast={showToast}
            activeYear={activeYear}
            loadProducts={async () => {
              const p = await fetchProducts(activeYear);
              if (Array.isArray(p) && p.length > 0) setProducts(p);
            }}
          />
        )}

        {/* VIEW 3: CUSTOMER MASTER */}
        {activeTab === 'customers' && (
          <CustomerMasterView
            customers={customers}
            setCustomers={setCustomers}
            showToast={showToast}
            activeYear={activeYear}
            isLoadingData={isLoadingData}
            loadCustomers={async () => {
              const c = await fetchCustomers(activeYear);
              if (Array.isArray(c) && c.length > 0) setCustomers(c);
            }}
          />
        )}

        {/* VIEW 4: REPORTS & SAVED INVOICES */}
        {activeTab === 'reports' && (
          <ReportsView
            savedInvoices={savedInvoices}
            setSavedInvoices={setSavedInvoices}
            company={company}
            showToast={showToast}
            activeYear={activeYear}
            setPreviewInvoice={setPreviewInvoice}
            setWhatsappModal={setWhatsappModal}
            setPrintingInvoice={setPrintingInvoice}
            loadInvoices={async () => {
              const inv = await fetchInvoices(activeYear);
              if (Array.isArray(inv)) setSavedInvoices(inv);
            }}
            reloadProducts={async () => {
              const p = await fetchProducts(activeYear);
              if (Array.isArray(p) && p.length > 0) setProducts(p);
            }}
          />
        )}

        {/* VIEW 5: SETTINGS */}
        {activeTab === 'settings' && (
          <SettingsView
            company={company}
            setCompany={setCompany}
            showToast={showToast}
            activeYear={activeYear}
            setActiveYear={setActiveYear}
            availableYears={availableYears}
            setAvailableYears={setAvailableYears}
            dbConnected={dbConnected}
            dbInfo={dbInfo}
            refreshDbStatus={refreshDbStatus}
            products={products}
            customers={customers}
            savedInvoices={savedInvoices}
            loadAllData={loadAllData}
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
          <span>Developed by <b>Genz Neural-x</b></span>
        </div>

        {/* Right: GSTIN & Contact */}
        <div className="app-footer-right">
          <span>GSTIN: <b>{company.gstin}</b></span>
          <span>Contact: <b>{company.mobile}</b></span>
        </div>
      </footer>

      </div> {/* End sidebar-main-area */}

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
              padding: '16px 20px',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              flexShrink: 0,
              background: '#FAFBFF'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  onClick={() => {
                    const doc = generatePdfDocument(previewInvoice, company);
                    const safeName = (previewInvoice.customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
                    doc.save(`Sri_Kaliswari_Bill_SKC_${previewInvoice.billNo}_${safeName}.pdf`);
                    showToast('PDF downloaded to computer!');
                  }}
                  style={{
                    background: '#EEF2FF',
                    border: '1px solid #C7D2FE',
                    color: '#4B4DFF',
                    padding: '11px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={16} /> Download PDF
                </button>

                <button
                  onClick={() => {
                    setPrintingInvoice(previewInvoice);
                    setTimeout(() => {
                      window.print();
                    }, 350);
                  }}
                  style={{
                    background: '#FF6B35',
                    color: '#FFF',
                    border: 'none',
                    padding: '11px',
                    borderRadius: '10px',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(255,107,53,0.3)'
                  }}
                >
                  <Printer size={16} /> Print Bill (A4)
                </button>
              </div>

              {/* WhatsApp Action Button in Drawer */}
              <button
                onClick={() => {
                  const clean = cleanPhoneNumber(previewInvoice.customerMobile);
                  if (!clean || clean.length < 10) {
                    showToast('No valid customer phone number found in this bill');
                    return;
                  }
                  const invoiceMsg = createInvoiceWhatsAppMessage(previewInvoice, company);
                  const waRes = openWhatsAppChat(clean, invoiceMsg);
                  setWhatsappModal({
                    isOpen: true,
                    phone: clean,
                    customerName: previewInvoice.customerName,
                    billNo: previewInvoice.billNo,
                    netAmount: previewInvoice.netAmount,
                    waUrl: waRes.waUrl,
                    invoice: previewInvoice,
                    popupBlocked: waRes.popupBlocked
                  });
                }}
                style={{
                  background: '#25D366',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)'
                }}
              >
                <Share2 size={16} /> Send Bill to Customer WhatsApp
              </button>

              <button
                onClick={() => setPreviewInvoice(null)}
                style={{
                  background: '#F1F5F9',
                  color: '#64748B',
                  border: '1px solid #E2E8F0',
                  padding: '10px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Close Preview
              </button>
            </div>

          </div>
        </>
      )}

      {/* ── PRINT & SCREENSHOT CONTAINER FOR INVOICE CAPTURE ────────────── */}
      <div id="printable-invoice-container" className="invoice-offscreen-render">
        <PrintableInvoice
          invoice={printingInvoice || previewInvoice || whatsappModal?.invoice}
          company={company}
        />
      </div>

      {/* ── WHATSAPP INVOICE ACTION MODAL (DOCUMENT & IMAGE FIRST) ──────────── */}
      {whatsappModal && whatsappModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2500,
          padding: '16px',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: '28px',
            width: '490px',
            maxWidth: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            border: '1px solid #E2E8F0',
            textAlign: 'center',
            position: 'relative'
          }}>
            {/* Header Icon */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#DCFCE7',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              fontSize: '32px',
              boxShadow: '0 6px 18px rgba(22, 163, 74, 0.25)'
            }}>
              📄
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', margin: '0 0 6px 0' }}>
              Send Invoice to WhatsApp
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748B', margin: '0 0 16px 0' }}>
              Bill #SKC <b>{whatsappModal.billNo}</b> • <b>{whatsappModal.customerName}</b> (₹{formatNumber(whatsappModal.netAmount)})
            </p>

            {/* Recipient Details */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '12px 16px',
              marginBottom: '16px',
              textAlign: 'left',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ color: '#64748B', fontSize: '12px' }}>Customer Mobile:</span>
                <span style={{ fontSize: '11px', background: '#DCFCE7', color: '#16A34A', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>WhatsApp Ready</span>
              </div>
              <div style={{ fontWeight: '800', fontSize: '17px', color: '#16A34A' }}>
                +{whatsappModal.phone}
              </div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px', lineHeight: '1.4' }}>
                {whatsappModal.popupBlocked
                  ? '⚠️ Pop-up blocked by browser. Click "Open WhatsApp Chat" below.'
                  : '✓ WhatsApp chat opened cleanly without any text clutter.'}
              </div>
            </div>

            {/* WhatsApp Bot Auto-Dispatch Indicator */}
            {waBotStatus.connected ? (
              <div style={{
                background: '#DCFCE7',
                border: '1px solid #86EFAC',
                borderRadius: '14px',
                padding: '14px',
                marginBottom: '16px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803D', fontWeight: '800', fontSize: '13.5px' }}>
                  <Check size={18} /> Official PDF Document Sent Automatically!
                </div>
                <div style={{ fontSize: '12px', color: '#166534', marginTop: '4px' }}>
                  The real <b>PDF Invoice file</b> has been directly sent to <b>+{whatsappModal.phone}</b> via your connected WhatsApp!
                </div>
              </div>
            ) : (
              <div
                onClick={() => {
                  setWhatsappModal(null);
                  setIsWaModalOpen(true);
                  connectWhatsAppBot().then(fetchWaStatus);
                }}
                style={{
                  background: '#FEF3C7',
                  border: '1px solid #FCD34D',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  marginBottom: '16px',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '800', color: '#92400E', fontSize: '13px' }}>
                    📱 Link WhatsApp Bot for Auto PDF Sending
                  </span>
                  <span style={{ fontSize: '11px', background: '#F59E0B', color: '#FFF', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                    Click to Scan QR
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#B45309', marginTop: '4px' }}>
                  Scan QR code once to automatically dispatch real PDF files directly to customer WhatsApp on every bill!
                </div>
              </div>
            )}

            {/* Instruction Banner */}
            <div style={{
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '18px',
              textAlign: 'left',
              fontSize: '12.5px',
              color: '#1E40AF',
              lineHeight: '1.5'
            }}>
              <div style={{ fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>💡</span> <span>How to send the Invoice in WhatsApp Web:</span>
              </div>
              <div><b>1. Click "Copy Invoice Image"</b> then press <b>Ctrl + V</b> in WhatsApp chat!</div>
              <div><b>2. OR Drag & Drop</b> the downloaded PDF file directly into WhatsApp!</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* PRIMARY ACTION: Direct PDF Document Sending */}
              {waBotStatus.connected ? (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      showToast('Sending direct PDF file to customer WhatsApp...');
                      await sendInvoicePdfViaWhatsAppBot({
                        phone: whatsappModal.phone,
                        billNo: whatsappModal.billNo,
                        customerName: whatsappModal.customerName,
                        netAmount: whatsappModal.netAmount,
                        pdfBase64: whatsappModal.pdfBase64,
                        filename: whatsappModal.filename
                      });
                      showToast('✓ Official PDF Invoice Document sent to customer WhatsApp!');
                    } catch (e) {
                      showToast('Error sending via bot: ' + e.message);
                    }
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '14px 20px',
                    borderRadius: '12px',
                    fontWeight: '800',
                    fontSize: '15px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)'
                  }}
                >
                  <Send size={18} /> 🚀 Send Direct PDF Document to Customer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setWhatsappModal(null);
                    setIsWaModalOpen(true);
                    connectWhatsAppBot().then(fetchWaStatus);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '14px 20px',
                    borderRadius: '12px',
                    fontWeight: '800',
                    fontSize: '15px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)'
                  }}
                >
                  <QrCode size={18} /> 📱 Scan QR Code to Send Real PDF to WhatsApp
                </button>
              )}

              {/* Button 2: Copy Invoice Image for Ctrl + V in WhatsApp */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    await copyInvoiceImageToClipboard('printable-invoice-container');
                    showToast('✓ Invoice Image copied! Now press Ctrl + V in WhatsApp chat.');
                  } catch (e) {
                    showToast('Could not copy image directly. Please drag the downloaded PDF into WhatsApp!');
                  }
                }}
                style={{
                  background: '#3B82F6',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
              >
                <Copy size={16} /> 📋 Copy Invoice Image (Ctrl + V in WhatsApp)
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* Button 3: Open Clean WhatsApp Chat */}
                <a
                  href={whatsappModal.waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#F0FDF4',
                    border: '1px solid #86EFAC',
                    color: '#15803D',
                    textDecoration: 'none',
                    padding: '10px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <ExternalLink size={14} /> Open Chat
                </a>

                {/* Button 4: Download PDF */}
                <button
                  type="button"
                  onClick={() => {
                    if (whatsappModal.invoice) {
                      const doc = generatePdfDocument(whatsappModal.invoice, company);
                      const safeName = (whatsappModal.customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
                      doc.save(`Sri_Kaliswari_Bill_SKC_${whatsappModal.billNo}_${safeName}.pdf`);
                      showToast('PDF downloaded to Downloads folder!');
                    }
                  }}
                  style={{
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    color: '#334155',
                    padding: '10px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={14} /> Download PDF
                </button>
              </div>

              <button
                type="button"
                onClick={() => setWhatsappModal(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  padding: '8px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '12px',
                  cursor: 'pointer',
                  marginTop: '4px'
                }}
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── WHATSAPP DEVICE LINKING MODAL (QR CODE BOT) ────────────────── */}
      {isWaModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2600,
          padding: '16px',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: '30px',
            width: '480px',
            maxWidth: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            border: '1px solid #E2E8F0',
            textAlign: 'center',
            position: 'relative'
          }}>
            {/* Header Icon */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: waBotStatus.connected ? '#DCFCE7' : '#EFF6FF',
              color: waBotStatus.connected ? '#16A34A' : '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              fontSize: '32px',
              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.08)'
            }}>
              {waBotStatus.connected ? '🟢' : '📱'}
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', margin: '0 0 6px 0' }}>
              {waBotStatus.connected ? 'WhatsApp Bot Connected!' : 'Link WhatsApp (Automated PDF)'}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 20px 0' }}>
              {waBotStatus.connected
                ? `Connected to WhatsApp (+${waBotStatus.phone}). All customer bills will automatically be sent as real PDF documents!`
                : 'Scan this QR code from your mobile WhatsApp to automatically dispatch PDF invoices to customers.'}
            </p>

            {/* If Connected */}
            {waBotStatus.connected ? (
              <div style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16A34A', fontWeight: '800', fontSize: '15px', marginBottom: '8px' }}>
                  <Check size={18} />
                  <span>Device Linked &amp; Active</span>
                </div>
                <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>
                  Linked Number: <b>+{waBotStatus.phone}</b>
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '8px', lineHeight: '1.4' }}>
                  Whenever you create a bill, the customer will directly receive the <b>Official A4 PDF Document</b> in their WhatsApp inbox automatically!
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('Disconnect WhatsApp Bot from this computer?')) {
                      await logoutWhatsAppBot();
                      fetchWaStatus();
                      showToast('WhatsApp Bot disconnected.');
                    }
                  }}
                  style={{
                    marginTop: '16px',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    color: '#DC2626',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Disconnect WhatsApp
                </button>
              </div>
            ) : (
              /* If Not Connected - Show QR Code or Connect Button */
              <div>
                {waBotStatus.qrCode ? (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{
                      display: 'inline-block',
                      background: '#FFFFFF',
                      padding: '14px',
                      borderRadius: '16px',
                      border: '2px solid #E2E8F0',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
                    }}>
                      <img
                        src={waBotStatus.qrCode}
                        alt="WhatsApp QR Code"
                        style={{ width: '230px', height: '230px', display: 'block', borderRadius: '8px' }}
                      />
                    </div>

                    <div style={{
                      marginTop: '16px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      textAlign: 'left',
                      fontSize: '12.5px',
                      color: '#475569',
                      lineHeight: '1.6'
                    }}>
                      <div style={{ fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>
                        How to Link WhatsApp:
                      </div>
                      <div>1. Open <b>WhatsApp</b> on your mobile phone</div>
                      <div>2. Tap <b>Settings</b> (or 3 dots) &gt; <b>Linked Devices</b></div>
                      <div>3. Tap <b>Link a Device</b> and point camera at this QR code</div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '24px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ fontSize: '14px', color: '#475569', marginBottom: '16px' }}>
                      Click below to generate the WhatsApp QR Code:
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        showToast('Generating WhatsApp QR Code...');
                        await connectWhatsAppBot();
                        fetchWaStatus();
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #25D366 0%, #16A34A 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        fontWeight: '800',
                        fontSize: '14px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <Send size={16} /> Generate WhatsApp QR Code
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsWaModalOpen(false)}
              style={{
                background: '#F1F5F9',
                border: '1px solid #CBD5E1',
                color: '#475569',
                padding: '10px 20px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}


    </div>
  );
}


// -------------------------------------------------------------
// SUB-VIEW: Product Master Component
// -------------------------------------------------------------
// -------------------------------------------------------------
// SUB-VIEW: Product Master & Stock Inventory Component
// -------------------------------------------------------------
function ProductMasterView({ products, setProducts, showToast, activeYear, loadProducts }) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [stockFilter, setStockFilter] = React.useState('All'); // 'All' | 'in_stock' | 'low_stock' | 'out_of_stock'
  const [isReloading, setIsReloading] = React.useState(false);

  // New Product Modal Form
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [newCode, setNewCode] = React.useState('');
  const [newName, setNewName] = React.useState('');
  const [newCat, setNewCat] = React.useState(initialCategories[0]);
  const [newContent, setNewContent] = React.useState('1 Box (10 pcs)');
  const [newRate, setNewRate] = React.useState('');
  const [newStock, setNewStock] = React.useState('100');

  // Edit Product Modal Form
  const [editProduct, setEditProduct] = React.useState(null);

  // Stock In / Stock Out (Add / Less Stock) Modal State
  const [stockModal, setStockModal] = React.useState({
    isOpen: false,
    mode: 'add', // 'add' (வரவு) | 'less' (கழிவு)
    productId: '',
    qty: 10,
    reason: 'New Purchase / Stock In'
  });

  // Calculate live inventory stats
  const totalItems = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  const inStockCount = products.filter(p => Number(p.stock) > 20).length;
  const lowStockCount = products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 20).length;
  const outOfStockCount = products.filter(p => Number(p.stock) <= 0).length;

  const filteredProducts = products.filter(p => {
    const stock = Number(p.stock) || 0;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.code).includes(searchTerm) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;

    let matchesStock = true;
    if (stockFilter === 'in_stock') matchesStock = stock > 20;
    else if (stockFilter === 'low_stock') matchesStock = stock > 0 && stock <= 20;
    else if (stockFilter === 'out_of_stock') matchesStock = stock <= 0;

    return matchesSearch && matchesCat && matchesStock;
  });

  const handleRefresh = async () => {
    setIsReloading(true);
    try {
      if (loadProducts) await loadProducts();
      showToast('Products refreshed from TiDB Cloud!');
    } catch (e) {
      showToast('Refresh failed');
    } finally {
      setIsReloading(false);
    }
  };

  // Direct In-line Quick Adjust (+/- delta on table row)
  const handleQuickAdjust = async (product, delta) => {
    const currentStock = Number(product.stock) || 0;
    const newStock = Math.max(0, currentStock + delta);
    if (newStock === currentStock && delta < 0) {
      showToast(`"${product.name}" is already out of stock (0)!`);
      return;
    }

    const updated = { ...product, stock: newStock };
    setProducts(prev => prev.map(p => p.id === product.id ? updated : p));

    try {
      await apiUpdateProduct(product.id, updated);
      showToast(
        delta > 0
          ? `+${delta} Added to "${product.name}" (Stock: ${newStock})`
          : `${delta} Deducted from "${product.name}" (Stock: ${newStock})`
      );
    } catch (err) {
      console.warn('Updated locally, TiDB error:', err);
      showToast(`Stock updated locally for "${product.name}" (${newStock})`);
    }
  };

  // Open the Add/Less Stock Modal
  const openStockModal = (mode = 'add', product = null) => {
    const initialId = product ? String(product.id) : (products[0] ? String(products[0].id) : '');
    setStockModal({
      isOpen: true,
      mode,
      productId: initialId,
      qty: 10,
      reason: mode === 'add' ? 'New Purchase / Stock Arrival' : 'Damage / Defective'
    });
  };

  // Submit Stock In / Stock Out (Add / Less)
  const handleStockSubmit = async (e) => {
    e.preventDefault();
    const targetProduct = products.find(p => String(p.id) === String(stockModal.productId));
    if (!targetProduct) {
      showToast('Please select a valid product!');
      return;
    }
    const adjustQty = Number(stockModal.qty) || 0;
    if (adjustQty <= 0) {
      showToast('Please enter a valid quantity greater than 0!');
      return;
    }

    const currentStock = Number(targetProduct.stock) || 0;
    let newStock = currentStock;

    if (stockModal.mode === 'add') {
      newStock = currentStock + adjustQty;
    } else {
      if (currentStock < adjustQty) {
        if (!confirm(`Current stock is ${currentStock}. Deducting ${adjustQty} will reduce stock to 0. Continue?`)) {
          return;
        }
        newStock = 0;
      } else {
        newStock = currentStock - adjustQty;
      }
    }

    const updated = { ...targetProduct, stock: newStock };
    setProducts(prev => prev.map(p => p.id === targetProduct.id ? updated : p));
    setStockModal(prev => ({ ...prev, isOpen: false }));

    try {
      await apiUpdateProduct(targetProduct.id, updated);
      showToast(
        stockModal.mode === 'add'
          ? `✅ +${adjustQty} Added (சரக்கு வரவு)! New stock for "${targetProduct.name}": ${newStock}`
          : `🔻 -${adjustQty} Less (சரக்கு கழிவு)! New stock for "${targetProduct.name}": ${newStock}`
      );
    } catch (err) {
      console.warn('Updated locally, TiDB error:', err);
      showToast(`Stock updated locally for "${targetProduct.name}" (${newStock})`);
    }
  };

  // Create new product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newName || !newRate) {
      showToast('Please fill required product name and rate!');
      return;
    }
    const tempId = Date.now();
    const newProduct = {
      id: tempId,
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

    try {
      const saved = await apiAddProduct({ ...newProduct, year: activeYear });
      if (saved && saved.id) {
        setProducts(prev => prev.map(p => p.id === tempId ? { ...p, id: saved.id } : p));
      }
      showToast('New Cracker Item Added & Saved to TiDB Cloud!');
      try { confetti({ particleCount: 50, spread: 60 }); } catch (c) {}
    } catch (err) {
      console.warn('Saved locally, TiDB error:', err);
      showToast('Item Added (Saved locally)');
    }
  };

  // Update existing product
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editProduct) return;
    const updated = {
      ...editProduct,
      rate: Number(editProduct.rate) || 0,
      stock: Number(editProduct.stock) || 0
    };
    setProducts(prev => prev.map(p => p.id === editProduct.id ? updated : p));
    setEditProduct(null);

    try {
      await apiUpdateProduct(editProduct.id, updated);
      showToast(`Updated "${updated.name}" in TiDB Cloud!`);
    } catch (err) {
      console.warn('Updated locally, TiDB error:', err);
      showToast(`Updated "${updated.name}" locally`);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id, name) => {
    if (confirm(`Are you sure you want to delete "${name || 'this item'}" from TiDB catalog?`)) {
      setProducts(products.filter(p => p.id !== id));
      try {
        await apiDeleteProduct(id);
        showToast('Product deleted from TiDB Cloud');
      } catch (err) {
        console.warn('Deleted locally, TiDB error:', err);
        showToast('Product removed locally');
      }
    }
  };

  // Active product for stock modal preview
  const selectedModalProduct = products.find(p => String(p.id) === String(stockModal.productId)) || products[0];
  const curModalStock = selectedModalProduct ? (Number(selectedModalProduct.stock) || 0) : 0;
  const numModalQty = Number(stockModal.qty) || 0;
  const previewModalNewStock = stockModal.mode === 'add'
    ? (curModalStock + numModalQty)
    : Math.max(0, curModalStock - numModalQty);

  // Category pills matching reference screenshot
  const categoryPills = [
    { id: 'All', label: 'All Items' },
    { id: 'Sound Crackers', label: 'Sound Crackers' },
    { id: 'Fancy Crackers', label: 'Fancy Crackers' },
    { id: 'Ground Chakkars', label: 'Ground Chakkars' },
    { id: 'Rockets', label: 'Rockets' },
    { id: 'Bombs', label: 'Bombs' },
    { id: 'Sparklers', label: 'Sparklers' },
    { id: 'Flower Pots', label: 'Flower Pots' },
    { id: 'Multi Shots', label: 'Multi Shots' },
    { id: 'Gift Boxes', label: 'Gift Boxes' },
    { id: 'Kids Crackers', label: 'Kids Crackers' },
    { id: 'Other Items', label: 'Other Items' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Top Header Bar Matching Reference Screenshot */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '-0.3px' }}>
              Crackers Product Master
            </h1>
            <span style={{
              background: '#FFEDD5',
              color: '#C2410C',
              fontSize: '12px',
              fontWeight: '800',
              padding: '3px 12px',
              borderRadius: '999px'
            }}>
              {products.length} Products
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
            Manage Sivakasi cracker catalog, brands, rates, discounts, bundles &amp; minimum stock.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Quick Add Stock (+) Button */}
          <button
            type="button"
            onClick={() => openStockModal('add')}
            className="header-outline-btn"
            style={{ borderColor: '#86EFAC', color: '#15803D', background: '#F0FDF4' }}
            title="Add stock to catalog"
          >
            <PackagePlus size={15} color="#15803D" />
            <span>+ Add Stock</span>
          </button>

          {/* Quick Less Stock (-) Button */}
          <button
            type="button"
            onClick={() => openStockModal('less')}
            className="header-outline-btn"
            style={{ borderColor: '#FECACA', color: '#DC2626', background: '#FEF2F2' }}
            title="Deduct stock / Damage / Sample"
          >
            <PackageMinus size={15} color="#DC2626" />
            <span>- Less Stock</span>
          </button>

          {/* Manage Categories Button */}
          <button
            type="button"
            onClick={() => openStockModal('add')}
            className="header-outline-btn"
          >
            <Tag size={15} color="#475569" />
            <span>Manage Categories</span>
          </button>

          {/* + Add New Cracker Button */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="header-orange-btn"
          >
            <Plus size={16} />
            <span>+ Add New Cracker</span>
          </button>
        </div>
      </div>

      {/* Filter & Category Pills Box Matching Reference Screenshot */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        {/* Row 1: Search & Dropdowns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 2fr) minmax(180px, 1fr) minmax(180px, 1fr)',
          gap: '14px',
          alignItems: 'center'
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '12px' }} />
            <input
              type="text"
              placeholder="Search by Name, Code (SC001), Brand..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                fontSize: '13px',
                color: '#0F172A',
                outline: 'none'
              }}
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              fontSize: '13px',
              fontWeight: '600',
              color: '#334155',
              outline: 'none'
            }}
          >
            <option value="All">All Categories ({initialCategories.length})</option>
            {initialCategories.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>

          {/* Stock Status Dropdown */}
          <select
            value={stockFilter}
            onChange={e => setStockFilter(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              fontSize: '13px',
              fontWeight: '600',
              color: '#334155',
              outline: 'none'
            }}
          >
            <option value="All">All Stock Status</option>
            <option value="in_stock">In Stock (&gt;0)</option>
            <option value="low_stock">Low Stock (&le;20)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>
        </div>

        {/* Row 2: Category Horizontal Pills Matching Reference Screenshot */}
        <div className="category-pills-scroll">
          {categoryPills.map(cat => {
            const isAct = (cat.id === 'All' && selectedCategory === 'All') || selectedCategory === cat.label;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id === 'All' ? 'All' : cat.label)}
                className={`cat-pill-btn ${isAct ? 'active' : ''}`}
              >
                {cat.id === 'All' ? `All Items (${products.length})` : cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Table Matching Reference Screenshot */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', minWidth: '920px' }}>
            <thead>
              <tr style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '11px', fontWeight: '800', letterSpacing: '0.6px' }}>
                <th style={{ padding: '14px 18px', width: '80px' }}>CODE</th>
                <th style={{ padding: '14px 18px' }}>CRACKER NAME</th>
                <th style={{ padding: '14px 18px', width: '150px' }}>CATEGORY</th>
                <th style={{ padding: '14px 18px', width: '160px' }}>BRAND / PACKING</th>
                <th style={{ padding: '14px 18px', width: '100px', textAlign: 'right' }}>MRP (₹)</th>
                <th style={{ padding: '14px 18px', width: '120px', textAlign: 'right' }}>SELL PRICE (₹)</th>
                <th style={{ padding: '14px 18px', width: '80px', textAlign: 'center' }}>DISC %</th>
                <th style={{ padding: '14px 18px', width: '160px', textAlign: 'center' }}>CURRENT STOCK</th>
                <th style={{ padding: '14px 18px', width: '110px', textAlign: 'center' }}>STATUS</th>
                <th style={{ padding: '14px 18px', width: '90px', textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '50px 20px', textAlign: 'center', color: '#94A3B8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Package size={36} color="#CBD5E1" />
                      <span style={{ fontWeight: '600', fontSize: '14px' }}>No crackers found matching "{searchTerm}".</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const stock = Number(p.stock) || 0;
                  const isOut = stock <= 0;
                  const sellPrice = Number(p.rate) || 0;
                  const mrp = p.mrp ? Number(p.mrp) : Math.round(sellPrice * 2.5);
                  const disc = mrp > 0 ? Math.round(((mrp - sellPrice) / mrp) * 100) : 60;
                  const codeStr = String(p.code || '').trim();
                  const codeFormatted = codeStr.toUpperCase().startsWith('SKC')
                    ? codeStr
                    : `SKC-${codeStr.padStart(2, '0')}`;

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}>
                      {/* CODE (Orange Badge from Reference Screenshot) */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          background: '#FFF7ED',
                          color: '#EA580C',
                          border: '1px solid #FED7AA',
                          borderRadius: '8px',
                          padding: '4px 8px',
                          fontWeight: '800',
                          fontSize: '11.5px',
                          display: 'inline-block',
                          letterSpacing: '0.3px'
                        }}>
                          {codeFormatted}
                        </span>
                      </td>

                      {/* CRACKER NAME */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '13.5px' }}>
                          {p.name}
                        </div>
                      </td>

                      {/* CATEGORY */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          background: '#F1F5F9',
                          color: '#475569',
                          borderRadius: '999px',
                          padding: '3px 10px',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}>
                          {p.category}
                        </span>
                      </td>

                      {/* BRAND / PACKING */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ color: '#334155', fontWeight: '600', fontSize: '12.5px' }}>
                          {p.content || 'Sivakasi Spark'}
                        </span>
                      </td>

                      {/* MRP (₹) */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <span style={{ color: '#94A3B8', textDecoration: 'line-through', fontWeight: '600' }}>
                          ₹{formatNumber(mrp)}
                        </span>
                      </td>

                      {/* SELL PRICE (₹) (Bold Bright Orange) */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <span style={{ color: '#FF6B35', fontWeight: '900', fontSize: '14px' }}>
                          ₹{formatNumber(sellPrice)}
                        </span>
                      </td>

                      {/* DISC % (Bold Green) */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <span style={{ color: '#10B981', fontWeight: '800', fontSize: '13px' }}>
                          {disc}%
                        </span>
                      </td>

                      {/* CURRENT STOCK WITH INTERACTIVE ADD & LESS */}
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {/* Less Stock (-) */}
                            <button
                              type="button"
                              onClick={() => handleQuickAdjust(p, -1)}
                              disabled={stock <= 0}
                              title="Less 1 Box"
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '5px',
                                border: '1px solid #FECACA',
                                background: stock <= 0 ? '#F1F5F9' : '#FEE2E2',
                                color: stock <= 0 ? '#CBD5E1' : '#DC2626',
                                cursor: stock <= 0 ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '900'
                              }}
                            >
                              <Minus size={12} />
                            </button>

                            {/* Stock Display */}
                            <span style={{
                              fontWeight: '800',
                              fontSize: '13px',
                              color: isOut ? '#DC2626' : '#15803D',
                              minWidth: '60px'
                            }}>
                              {stock} Box
                            </span>

                            {/* Add Stock (+) */}
                            <button
                              type="button"
                              onClick={() => handleQuickAdjust(p, 1)}
                              title="Add 1 Box"
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '5px',
                                border: '1px solid #A7F3D0',
                                background: '#DCFCE7',
                                color: '#15803D',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '900'
                              }}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                            Min: {p.minStock || (isOut ? 20 : 15)}
                          </span>
                        </div>
                      </td>

                      {/* STATUS (Active / Out of Stock) */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <span style={{
                          background: isOut ? '#FEF2F2' : '#ECFDF5',
                          color: isOut ? '#DC2626' : '#15803D',
                          border: `1px solid ${isOut ? '#FECACA' : '#A7F3D0'}`,
                          borderRadius: '999px',
                          padding: '3px 12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          display: 'inline-block'
                        }}>
                          {isOut ? 'Out of Stock' : 'Active'}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            title="Edit product"
                            onClick={() => setEditProduct({ ...p })}
                            style={{
                              background: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              color: '#64748B',
                              cursor: 'pointer',
                              padding: '5px',
                              borderRadius: '7px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            title="Delete product"
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            style={{
                              background: '#FEF2F2',
                              border: '1px solid #FECACA',
                              color: '#EF4444',
                              cursor: 'pointer',
                              padding: '5px',
                              borderRadius: '7px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: STOCK IN / STOCK OUT (PRODUCT ADD & LESS) MODAL       */}
      {/* ============================================================== */}
      {stockModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '16px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '28px',
            width: '520px',
            maxWidth: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #E2E8F0',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A', margin: 0 }}>
                  Stock Adjustment (சரக்கு வரவு / கழிவு)
                </h3>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0 0' }}>
                  Update live cracker inventory count in TiDB Cloud
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStockModal(prev => ({ ...prev, isOpen: false }))}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontWeight: '700',
                  color: '#64748B'
                }}
              >
                ✕
              </button>
            </div>

            {/* Toggle: Add Stock vs Less Stock */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              background: '#F1F5F9',
              padding: '6px',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <button
                type="button"
                onClick={() => setStockModal(prev => ({
                  ...prev,
                  mode: 'add',
                  reason: 'New Purchase / Stock Arrival'
                }))}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: stockModal.mode === 'add' ? '#10B981' : 'transparent',
                  color: stockModal.mode === 'add' ? '#FFFFFF' : '#475569',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  boxShadow: stockModal.mode === 'add' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                }}
              >
                <PackagePlus size={16} />
                <span>+ Add Stock (வரவு)</span>
              </button>

              <button
                type="button"
                onClick={() => setStockModal(prev => ({
                  ...prev,
                  mode: 'less',
                  reason: 'Damage / Defective'
                }))}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: stockModal.mode === 'less' ? '#EF4444' : 'transparent',
                  color: stockModal.mode === 'less' ? '#FFFFFF' : '#475569',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  boxShadow: stockModal.mode === 'less' ? '0 4px 12px rgba(239, 68, 68, 0.3)' : 'none'
                }}
              >
                <PackageMinus size={16} />
                <span>- Less Stock (கழிவு)</span>
              </button>
            </div>

            <form onSubmit={handleStockSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Product Selection */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Select Cracker Product *
                </label>
                <select
                  value={stockModal.productId}
                  onChange={e => setStockModal(prev => ({ ...prev, productId: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: '#FFF'
                  }}
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      #{p.code} - {p.name} (Current: {p.stock || 0} units)
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity to Add or Less */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  {stockModal.mode === 'add' ? 'Quantity to Add (+)' : 'Quantity to Deduct / Less (-)'} *
                </label>
                <input
                  type="number"
                  min="1"
                  value={stockModal.qty}
                  onChange={e => setStockModal(prev => ({ ...prev, qty: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: stockModal.mode === 'add' ? '2px solid #10B981' : '2px solid #EF4444',
                    fontSize: '18px',
                    fontWeight: '800',
                    color: '#0F172A',
                    outline: 'none'
                  }}
                  required
                />

                {/* Preset Chips */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {[5, 10, 25, 50, 100].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setStockModal(prev => ({ ...prev, qty: amt }))}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid #E2E8F0',
                        background: Number(stockModal.qty) === amt ? (stockModal.mode === 'add' ? '#DCFCE7' : '#FEE2E2') : '#F8FAFC',
                        color: Number(stockModal.qty) === amt ? (stockModal.mode === 'add' ? '#15803D' : '#DC2626') : '#475569',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {stockModal.mode === 'add' ? `+${amt}` : `-${amt}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason / Category */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Reason / Reference Note
                </label>
                <select
                  value={stockModal.reason}
                  onChange={e => setStockModal(prev => ({ ...prev, reason: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    background: '#FFF'
                  }}
                >
                  {stockModal.mode === 'add' ? (
                    <>
                      <option value="New Purchase / Stock Arrival">New Purchase / Factory Stock Arrival (சரக்கு வரவு)</option>
                      <option value="Customer Return">Customer Return (வாடிக்கையாளர் திருப்பியது)</option>
                      <option value="Opening Stock / Bonus">Opening Balance / Bonus Stock</option>
                      <option value="Inventory Correction">Physical Audit Correction (கூடுதல் வரவு)</option>
                    </>
                  ) : (
                    <>
                      <option value="Damage / Defective">Damaged / Broken / Defective (சேதாரம்)</option>
                      <option value="Direct Cash Sale">Direct Cash Counter Sale</option>
                      <option value="Sample / Tasting">Free Sample / Testing (பரிசோதனை)</option>
                      <option value="Expired / Wet Crackers">Wet / Expired Crackers (ஈரம்/பயன்படாதவை)</option>
                      <option value="Shortage Correction">Inventory Shortage Correction (குறைவு கழிவு)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Real-Time Calculation Preview Card */}
              <div style={{
                background: stockModal.mode === 'add' ? '#ECFDF5' : '#FEF2F2',
                borderRadius: '12px',
                padding: '14px 16px',
                border: `1px solid ${stockModal.mode === 'add' ? '#A7F3D0' : '#FECACA'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: stockModal.mode === 'add' ? '#047857' : '#B91C1C' }}>
                    Current Stock: <b>{curModalStock} units</b>
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                    Adjustment: <b style={{ color: stockModal.mode === 'add' ? '#059669' : '#DC2626' }}>
                      {stockModal.mode === 'add' ? `+${numModalQty}` : `-${numModalQty}`} units
                    </b>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>New Resulting Stock:</div>
                  <div style={{
                    fontSize: '22px',
                    fontWeight: '900',
                    color: stockModal.mode === 'add' ? '#059669' : '#DC2626'
                  }}>
                    {previewModalNewStock} Units
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setStockModal(prev => ({ ...prev, isOpen: false }))}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    background: '#F8FAFC',
                    cursor: 'pointer',
                    fontWeight: '700',
                    color: '#64748B'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    padding: '10px 22px',
                    borderRadius: '10px',
                    border: 'none',
                    background: stockModal.mode === 'add'
                      ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    color: '#FFF',
                    cursor: 'pointer',
                    fontWeight: '800',
                    fontSize: '13px',
                    boxShadow: stockModal.mode === 'add'
                      ? '0 4px 14px rgba(16, 185, 129, 0.4)'
                      : '0 4px 14px rgba(239, 68, 68, 0.4)'
                  }}
                >
                  {stockModal.mode === 'add'
                    ? `Confirm Add +${numModalQty} Units`
                    : `Confirm Less -${numModalQty} Units`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: EDIT CRACKER ITEM                                    */}
      {/* ============================================================== */}
      {editProduct && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '16px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '18px',
            padding: '24px',
            width: '500px',
            maxWidth: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            border: '1px solid #E2E8F0'
          }}>
            <h3 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '16px', color: '#0F172A' }}>
              Edit Cracker Item (TiDB Cloud)
            </h3>
            <form onSubmit={handleUpdateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>Code</label>
                  <input
                    type="text"
                    value={editProduct.code}
                    onChange={e => setEditProduct({ ...editProduct, code: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>Product Name *</label>
                  <input
                    type="text"
                    value={editProduct.name}
                    onChange={e => setEditProduct({ ...editProduct, name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>Category</label>
                <select
                  value={editProduct.category}
                  onChange={e => setEditProduct({ ...editProduct, category: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFF' }}
                >
                  {initialCategories.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>Content / Pack</label>
                  <input
                    type="text"
                    value={editProduct.content}
                    onChange={e => setEditProduct({ ...editProduct, content: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>Rate (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editProduct.rate}
                    onChange={e => setEditProduct({ ...editProduct, rate: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>Current Stock</label>
                  <input
                    type="number"
                    value={editProduct.stock}
                    onChange={e => setEditProduct({ ...editProduct, stock: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditProduct(null)}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer', fontWeight: '700', color: '#64748B' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', background: '#4B4DFF', color: '#FFF', cursor: 'pointer', fontWeight: '700' }}
                >
                  Save Changes to TiDB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: ADD NEW PRODUCT                                      */}
      {/* ============================================================== */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '16px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '18px',
            padding: '24px',
            width: '490px',
            maxWidth: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
            border: '1px solid #E2E8F0'
          }}>
            <h3 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '16px', color: '#0F172A' }}>
              Add New Cracker to Master
            </h3>
            <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 44"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>Product Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. 7cm Electric Sparklers"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>Category</label>
                <select
                  value={newCat}
                  onChange={e => setNewCat(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFF' }}
                >
                  {initialCategories.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>Content / Pack</label>
                  <input
                    type="text"
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>Rate (₹) *</label>
                  <input
                    type="number"
                    placeholder="750"
                    value={newRate}
                    onChange={e => setNewRate(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>Opening Stock</label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={e => setNewStock(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer', fontWeight: '700', color: '#64748B' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', background: '#4B4DFF', color: '#FFF', cursor: 'pointer', fontWeight: '700' }}
                >
                  Save Product to TiDB
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
function CustomerMasterView({ customers, setCustomers, showToast, activeYear, loadCustomers }) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isReloading, setIsReloading] = React.useState(false);
  const [name, setName] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [gstin, setGstin] = React.useState('');

  // Edit Customer Modal Form
  const [editCustomer, setEditCustomer] = React.useState(null);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(c.mobile || '').includes(searchTerm) ||
    String(c.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(c.gstin || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefresh = async () => {
    setIsReloading(true);
    try {
      if (loadCustomers) await loadCustomers();
      showToast('Customers refreshed from TiDB Cloud!');
    } catch (e) {
      showToast('Refresh failed');
    } finally {
      setIsReloading(false);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!name || !mobile) {
      showToast('Name and mobile are required');
      return;
    }
    const tempId = Date.now();
    const newCust = {
      id: tempId,
      name,
      mobile,
      address: address || 'Sivakasi',
      gstin: gstin || '',
      totalOrders: 0,
      balance: 0
    };
    setCustomers([newCust, ...customers]);
    setIsModalOpen(false);
    setName('');
    setMobile('');
    setAddress('');
    setGstin('');

    try {
      const saved = await apiAddCustomer({ ...newCust, year: activeYear });
      if (saved && saved.id) {
        setCustomers(prev => prev.map(c => c.id === tempId ? { ...c, id: saved.id } : c));
      }
      showToast('New Customer Added & Saved to TiDB Cloud!');
    } catch (err) {
      console.warn('Saved customer locally, TiDB error:', err);
      showToast('Customer Added (Saved locally)');
    }
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    if (!editCustomer) return;
    const updated = {
      ...editCustomer,
      balance: Number(editCustomer.balance) || 0
    };
    setCustomers(prev => prev.map(c => c.id === editCustomer.id ? updated : p));
    setEditCustomer(null);

    try {
      await apiUpdateCustomer(editCustomer.id, updated);
      showToast(`Customer "${updated.name}" updated in TiDB Cloud!`);
    } catch (err) {
      console.warn('Updated customer locally, TiDB error:', err);
      showToast(`Customer "${updated.name}" updated locally`);
    }
  };

  const handleDeleteCustomer = async (id, custName) => {
    if (confirm(`Delete customer "${custName}" from TiDB Cloud?`)) {
      setCustomers(customers.filter(item => item.id !== id));
      try {
        await apiDeleteCustomer(id);
        showToast('Customer deleted from TiDB Cloud');
      } catch (err) {
        showToast('Customer deleted locally');
      }
    }
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
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Customer Directory</h2>
            <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '999px' }}>
              TiDB Connected ({customers.length} Clients)
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>Client database, contact numbers, order histories and billing profiles in TiDB Cloud.</p>
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
              padding: '10px 14px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} className={isReloading ? 'spin' : ''} />
            <span>{isReloading ? 'Syncing...' : 'Refresh from TiDB'}</span>
          </button>

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
            placeholder="Search customers by name, phone, address, or GSTIN..."
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
        <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
              <th style={{ padding: '14px 16px', width: '50px' }}>#</th>
              <th style={{ padding: '14px 16px' }}>Customer Name</th>
              <th style={{ padding: '14px 16px', width: '140px' }}>Mobile No</th>
              <th style={{ padding: '14px 16px' }}>Address & Location</th>
              <th style={{ padding: '14px 16px', width: '110px', textAlign: 'center' }}>Total Bills</th>
              <th style={{ padding: '14px 16px', width: '120px', textAlign: 'right' }}>Credit Balance</th>
              <th style={{ padding: '14px 16px', width: '100px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>
                  No customer profiles found matching "{searchTerm}".
                </td>
              </tr>
            ) : (
              filtered.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: '#94A3B8' }}>{i + 1}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: '#1E293B' }}>
                    <div>{c.name}</div>
                    {c.gstin && <div style={{ fontSize: '11px', color: '#94A3B8' }}>GSTIN: {c.gstin}</div>}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#4B4DFF', fontWeight: '600' }}>{c.mobile || '-'}</td>
                  <td style={{ padding: '12px 16px', color: '#64748B' }}>{c.address || '-'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{ background: '#EEF2FF', color: '#4B4DFF', padding: '3px 8px', borderRadius: '12px', fontWeight: '700', fontSize: '11px' }}>
                      {c.totalOrders || 0} Bills
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: Number(c.balance) > 0 ? '#DC2626' : '#059669' }}>
                    ₹{formatNumber(c.balance || 0)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        title="Edit customer in TiDB Cloud"
                        onClick={() => setEditCustomer({ ...c })}
                        style={{
                          background: '#EEF2FF',
                          border: '1px solid #C7D2FE',
                          color: '#4B4DFF',
                          cursor: 'pointer',
                          padding: '5px 7px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        title="Delete from TiDB Cloud"
                        onClick={() => handleDeleteCustomer(c.id, c.name)}
                        style={{
                          background: '#FEE2E2',
                          border: '1px solid #FECACA',
                          color: '#EF4444',
                          cursor: 'pointer',
                          padding: '5px 7px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Customer Modal */}
      {editCustomer && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', width: '450px', maxWidth: '100%', boxSizing: 'border-box' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', color: '#0F172A' }}>Edit Customer Profile (TiDB Cloud)</h3>
            <form onSubmit={handleUpdateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>Customer Name *</label>
                <input
                  type="text"
                  value={editCustomer.name}
                  onChange={e => setEditCustomer({ ...editCustomer, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>Mobile Number *</label>
                <input
                  type="text"
                  value={editCustomer.mobile}
                  onChange={e => setEditCustomer({ ...editCustomer, mobile: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>Address & Location</label>
                <textarea
                  value={editCustomer.address}
                  onChange={e => setEditCustomer({ ...editCustomer, address: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', minHeight: '55px' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>GSTIN / PAN</label>
                  <input
                    type="text"
                    value={editCustomer.gstin || ''}
                    onChange={e => setEditCustomer({ ...editCustomer, gstin: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>Balance (₹)</label>
                  <input
                    type="number"
                    value={editCustomer.balance || 0}
                    onChange={e => setEditCustomer({ ...editCustomer, balance: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditCustomer(null)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#4B4DFF', color: '#FFF', cursor: 'pointer', fontWeight: '700' }}
                >
                  Update Customer in TiDB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
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
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>GSTIN / PAN (Optional)</label>
                <input type="text" value={gstin} onChange={e => setGstin(e.target.value)} placeholder="33AAAAA0000A1Z5" style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#4B4DFF', color: '#FFF', cursor: 'pointer', fontWeight: '700' }}>Save Customer to TiDB</button>
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
function ReportsView({ savedInvoices, setSavedInvoices, company, showToast, activeYear, setPreviewInvoice, loadInvoices, reloadProducts, setWhatsappModal, setPrintingInvoice }) {
  const [isReloading, setIsReloading] = React.useState(false);
  const totalRevenue = savedInvoices.reduce((acc, curr) => acc + (Number(curr.netAmount) || 0), 0);
  const totalGross = savedInvoices.reduce((acc, curr) => acc + (Number(curr.grossTotal) || 0), 0);

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
    doc.save(`Sri_Kaliswari_Bill_SKC_${inv.billNo}_${inv.customerName || 'Customer'}.pdf`);
  };

  const handleDeleteInvoice = async (billNo) => {
    if (confirm(`Are you sure you want to delete Invoice #SKC ${billNo}? Product stocks will be restored in TiDB.`)) {
      setSavedInvoices(savedInvoices.filter(i => i.billNo !== billNo));
      try {
        await apiDeleteInvoice(billNo, activeYear);
        if (reloadProducts) await reloadProducts();
        showToast(`Bill #SKC ${billNo} removed & product stock restored in TiDB!`);
      } catch (err) {
        showToast(`Bill #SKC ${billNo} removed locally`);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Metric Cards */}
      <div className="reports-metric-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Total Invoices Generated</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#4B4DFF', marginTop: '6px' }}>{savedInvoices.length}</div>
          <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '600', marginTop: '4px' }}>✓ Synced with TiDB Cloud</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Gross Sales Value</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0F172A', marginTop: '6px' }}>₹{formatNumber(totalGross)}</div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>Year {activeYear} Catalog Rates</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #EA580C 100%)', padding: '20px', borderRadius: '16px', color: '#FFF', boxShadow: '0 8px 24px rgba(255, 107, 53, 0.28)' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', opacity: 0.9, textTransform: 'uppercase' }}>Total Net Realised Revenue</div>
          <div style={{ fontSize: '26px', fontWeight: '800', marginTop: '6px' }}>₹{formatNumber(totalRevenue)}</div>
          <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '4px' }}>Actual Cash & Billed Realisation</div>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Recent Invoices & Quotations History</span>
            <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '999px' }}>
              TiDB Connected ({savedInvoices.length} Bills)
            </span>
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
                padding: '6px 12px',
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
              <span>{isReloading ? 'Syncing...' : 'Refresh from TiDB'}</span>
            </button>

            {savedInvoices.length > 0 && (
              <button
                onClick={async () => {
                  if (confirm('Clear all saved invoices history and reset bill number to 1?')) {
                    setSavedInvoices([]);
                    try {
                      await apiClearAllInvoices(activeYear);
                      showToast('All invoices cleared from TiDB Cloud. Counter reset to #1.');
                    } catch (err) {
                      showToast('All invoices cleared locally.');
                    }
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
        </div>

        <table style={{ width: '100%', minWidth: '750px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
              <th style={{ padding: '14px 16px', width: '90px', textAlign: 'center' }}>Bill No</th>
              <th style={{ padding: '14px 16px', width: '110px' }}>Date</th>
              <th style={{ padding: '14px 16px', width: '110px' }}>Type</th>
              <th style={{ padding: '14px 16px' }}>Customer Details</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Gross Total (₹)</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>Discount</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Net Payable (₹)</th>
              <th style={{ padding: '14px 16px', width: '150px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {savedInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: '#94A3B8' }}>
                  No saved invoices found for Year {activeYear}. Create bills from Quick Billing!
                </td>
              </tr>
            ) : (
              savedInvoices.map((inv) => (
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
                      background: inv.type === 'tax' || inv.type === 'invoice' ? '#DBEAFE' : '#FEF3C7',
                      color: inv.type === 'tax' || inv.type === 'invoice' ? '#1E40AF' : '#92400E'
                    }}>
                      {inv.type ? inv.type.toUpperCase() : 'ESTIMATE'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                    <div style={{ color: '#0F172A' }}>{inv.customerName}</div>
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
                        onClick={() => setPreviewInvoice(inv)}
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
                        title="Print A4 Bill"
                        onClick={() => {
                          if (setPrintingInvoice) setPrintingInvoice(inv);
                          setTimeout(() => window.print(), 350);
                        }}
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
                        <Printer size={12} />
                      </button>

                      <button
                        type="button"
                        title="Download PDF to Computer"
                        onClick={() => handleDownloadPdf(inv)}
                        style={{
                          background: '#EEF2FF',
                          border: '1px solid #C7D2FE',
                          color: '#4B4DFF',
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
                        <Download size={12} /> PDF
                      </button>

                      <button
                        type="button"
                        title="Send WhatsApp Bill to Customer"
                        onClick={() => {
                          const clean = cleanPhoneNumber(inv.customerMobile);
                          if (!clean || clean.length < 10) {
                            showToast('No customer phone number found in this bill');
                            return;
                          }
                          const invoiceMsg = createInvoiceWhatsAppMessage(inv, company);
                          const res = openWhatsAppChat(clean, invoiceMsg);
                          if (setWhatsappModal) {
                            setWhatsappModal({
                              isOpen: true,
                              phone: clean,
                              customerName: inv.customerName,
                              billNo: inv.billNo,
                              netAmount: inv.netAmount,
                              waUrl: res.waUrl,
                              invoice: inv,
                              popupBlocked: res.popupBlocked
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
                        <Share2 size={12} /> WhatsApp
                      </button>

                      <button
                        type="button"
                        title="Delete bill and restore stock in TiDB"
                        onClick={() => handleDeleteInvoice(inv.billNo)}
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
  );
}

// -------------------------------------------------------------
// SUB-VIEW: Settings
// -------------------------------------------------------------
function SettingsView({
  company,
  setCompany,
  showToast,
  activeYear,
  setActiveYear,
  availableYears,
  setAvailableYears,
  dbConnected,
  dbInfo,
  refreshDbStatus,
  products,
  customers,
  savedInvoices,
  loadAllData
}) {
  const [formData, setFormData] = React.useState({ ...company });
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [testResult, setTestResult] = React.useState(null);
  const [dbStats, setDbStats] = React.useState(null);
  const [newYearInput, setNewYearInput] = React.useState('');
  const [isCreatingYear, setIsCreatingYear] = React.useState(false);

  // Load database stats
  const fetchDbStats = React.useCallback(async () => {
    try {
      const stats = await fetchStats(activeYear);
      if (stats && stats.ok) setDbStats(stats);
    } catch (e) {
      console.warn('Could not load DB stats:', e);
    }
  }, [activeYear]);

  React.useEffect(() => {
    fetchDbStats();
  }, [fetchDbStats]);

  const handleSave = async (e) => {
    e.preventDefault();
    setCompany(formData);
    try {
      await apiSaveCompany(formData);
      showToast('Company details & Print header saved to TiDB Cloud!');
    } catch (err) {
      showToast('Saved locally (TiDB Cloud offline)');
    }
  };

  const handleManualTest = async () => {
    setTestResult('testing');
    try {
      const res = await checkDbStatus();
      if (res.ok) {
        setTestResult({ ok: true, msg: `Connected! Ping OK at ${new Date(res.connectedAt).toLocaleTimeString()}` });
        if (refreshDbStatus) refreshDbStatus();
        fetchDbStats();
      } else {
        setTestResult({ ok: false, msg: res.error || 'Connection failed' });
      }
    } catch (e) {
      setTestResult({ ok: false, msg: e.message });
    }
  };

  const handleCreateNewYear = async (e) => {
    e.preventDefault();
    const yr = newYearInput.trim();
    if (!yr || isNaN(yr) || yr.length !== 4) {
      showToast('Please enter a valid 4-digit year (e.g. 2027)');
      return;
    }
    setIsCreatingYear(true);
    try {
      await apiCreateYear(yr);
      const updatedYears = Array.from(new Set([...availableYears, yr]));
      setAvailableYears(updatedYears);
      localStorage.setItem('kalieswari_years', JSON.stringify(updatedYears));
      setNewYearInput('');
      showToast(`Financial Year ${yr} created in TiDB Cloud!`);
    } catch (err) {
      showToast('Created year locally');
    } finally {
      setIsCreatingYear(false);
    }
  };

  const handleSwitchYear = async (yr) => {
    if (yr === activeYear) return;
    setActiveYear(yr);
    if (loadAllData) await loadAllData(yr);
    showToast(`Switched active workspace to Financial Year ${yr}!`);
  };

  const handleSyncToDb = async () => {
    if (!confirm(`Sync all current products (${products.length}), customers (${customers.length}), and bills (${savedInvoices.length}) for Year ${activeYear} to TiDB Cloud?`)) {
      return;
    }
    setIsSyncing(true);
    try {
      const res = await syncLocalStorageToDb({
        year: activeYear,
        company: formData,
        products,
        customers,
        invoices: savedInvoices
      });
      if (res && res.success) {
        showToast('All data successfully synced to TiDB Cloud!');
        fetchDbStats();
      } else {
        showToast(res?.error || 'Sync completed with warnings');
      }
    } catch (err) {
      showToast('Sync failed: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      year: activeYear,
      company: formData,
      products,
      customers,
      invoices: savedInvoices
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sri_Kaliswari_Backup_${activeYear}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Database backup downloaded successfully!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '850px', margin: '0 auto', width: '100%' }}>

      {/* 1. Live TiDB Cloud Database Status & Metrics Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF'
            }}>
              <Database size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                TiDB Cloud Database Connection
              </h2>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>
                Serverless MySQL Cloud DB for Sri Kaliswari Crackers
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: dbConnected ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${dbConnected ? '#A7F3D0' : '#FECACA'}`,
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: '700',
            color: dbConnected ? '#065F46' : '#991B1B'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: dbConnected ? '#10B981' : '#EF4444',
              boxShadow: dbConnected ? '0 0 8px #10B981' : 'none'
            }}></span>
            {dbConnected ? 'Status: Live & Connected' : 'Status: Offline / Disconnected'}
          </div>
        </div>

        {/* Database parameters grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          background: '#F8FAFC',
          padding: '14px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          fontSize: '12px',
          marginBottom: '16px'
        }}>
          <div>
            <div style={{ color: '#64748B', fontWeight: '600' }}>Host</div>
            <div style={{ color: '#0F172A', fontWeight: '700', wordBreak: 'break-all' }}>
              gateway01.ap-southeast-1.prod.aws.tidbcloud.com
            </div>
          </div>
          <div>
            <div style={{ color: '#64748B', fontWeight: '600' }}>Port</div>
            <div style={{ color: '#0F172A', fontWeight: '700' }}>4000 (TLS/SSL Encrypted)</div>
          </div>
          <div>
            <div style={{ color: '#64748B', fontWeight: '600' }}>Database</div>
            <div style={{ color: '#0F172A', fontWeight: '700' }}>kalishwaribilling</div>
          </div>
          <div>
            <div style={{ color: '#64748B', fontWeight: '600' }}>Active Year</div>
            <div style={{ color: '#EA580C', fontWeight: '800' }}>{activeYear}</div>
          </div>
        </div>

        {/* Live Database Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '10px',
          marginBottom: '16px'
        }}>
          <div style={{ background: '#EEF2FF', padding: '12px', borderRadius: '10px', border: '1px solid #C7D2FE' }}>
            <div style={{ fontSize: '11px', color: '#4338CA', fontWeight: '700', textTransform: 'uppercase' }}>Products in TiDB</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#1E1B4B', marginTop: '3px' }}>
              {dbStats ? dbStats.productsCount : products.length} Items
            </div>
          </div>
          <div style={{ background: '#ECFDF5', padding: '12px', borderRadius: '10px', border: '1px solid #A7F3D0' }}>
            <div style={{ fontSize: '11px', color: '#047857', fontWeight: '700', textTransform: 'uppercase' }}>Customers in TiDB</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#064E3B', marginTop: '3px' }}>
              {dbStats ? dbStats.customersCount : customers.length} Clients
            </div>
          </div>
          <div style={{ background: '#FFF7ED', padding: '12px', borderRadius: '10px', border: '1px solid #FED7AA' }}>
            <div style={{ fontSize: '11px', color: '#C2410C', fontWeight: '700', textTransform: 'uppercase' }}>Invoices in TiDB</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#7C2D12', marginTop: '3px' }}>
              {dbStats ? dbStats.invoicesCount : savedInvoices.length} Bills
            </div>
          </div>
          <div style={{ background: '#FAF5FF', padding: '12px', borderRadius: '10px', border: '1px solid #E9D5FF' }}>
            <div style={{ fontSize: '11px', color: '#7E22CE', fontWeight: '700', textTransform: 'uppercase' }}>Net Revenue</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#581C87', marginTop: '3px' }}>
              ₹{formatNumber(dbStats ? dbStats.totalNet : savedInvoices.reduce((a, b) => a + (Number(b.netAmount) || 0), 0))}
            </div>
          </div>
        </div>

        {testResult && testResult !== 'testing' && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '14px',
            fontSize: '12px',
            fontWeight: '600',
            background: testResult.ok ? '#ECFDF5' : '#FEF2F2',
            color: testResult.ok ? '#065F46' : '#991B1B',
            border: `1px solid ${testResult.ok ? '#A7F3D0' : '#FECACA'}`
          }}>
            {testResult.ok ? '✓ ' : '✕ '} {testResult.msg}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleManualTest}
            disabled={testResult === 'testing'}
            style={{
              background: '#0F172A',
              color: '#FFF',
              border: 'none',
              padding: '9px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={13} className={testResult === 'testing' ? 'spin' : ''} />
            {testResult === 'testing' ? 'Testing Ping...' : 'Test Connection'}
          </button>

          <button
            type="button"
            onClick={handleSyncToDb}
            disabled={isSyncing}
            style={{
              background: '#10B981',
              color: '#FFF',
              border: 'none',
              padding: '9px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Server size={13} />
            {isSyncing ? 'Syncing...' : `Sync All Local Data to TiDB (${activeYear})`}
          </button>

          <button
            type="button"
            onClick={handleExportBackup}
            style={{
              background: '#EEF2FF',
              color: '#4B4DFF',
              border: '1px solid #C7D2FE',
              padding: '9px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={13} />
            Download Full Backup JSON
          </button>
        </div>
      </div>

      {/* 2. Financial Years Management Card */}
      <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Calendar size={18} color="#EA580C" />
          <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
            Financial Years Management
          </h2>
        </div>
        <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
          Switch between financial years or initialize a new financial year in TiDB Cloud.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Registered Years:</span>
          {availableYears.map(yr => {
            const isActive = String(yr) === String(activeYear);
            return (
              <button
                key={yr}
                type="button"
                onClick={() => handleSwitchYear(yr)}
                style={{
                  background: isActive ? '#FF6B35' : '#F1F5F9',
                  color: isActive ? '#FFF' : '#334155',
                  border: `1px solid ${isActive ? '#FF6B35' : '#CBD5E1'}`,
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{yr}</span>
                {isActive && <span style={{ fontSize: '10px', opacity: 0.9 }}>✓ Active</span>}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleCreateNewYear} style={{ display: 'flex', gap: '10px', alignItems: 'center', maxWidth: '380px' }}>
          <input
            type="number"
            placeholder="e.g. 2027"
            min="2000"
            max="2099"
            value={newYearInput}
            onChange={e => setNewYearInput(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
          />
          <button
            type="submit"
            disabled={isCreatingYear}
            style={{
              background: '#0F172A',
              color: '#FFF',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {isCreatingYear ? 'Creating...' : '+ Add Year to TiDB'}
          </button>
        </form>
      </div>

      {/* 3. Firm & Bill Print Settings Form */}
      <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '28px', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>
          Firm &amp; Bill Print Settings (TiDB Cloud)
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
            Save Configuration to TiDB Cloud
          </button>
        </form>
      </div>

    </div>
  );
}
