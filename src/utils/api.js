// TiDB Cloud API client for Sri Kaliswari Crackers Billing POS

let currentApiBase = null;

export async function getApiBase() {
  if (currentApiBase) return currentApiBase;

  const candidates = [
    '/api',
    'http://localhost:5000/api',
    'http://localhost:3000/api'
  ];

  for (const base of candidates) {
    try {
      const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const data = await res.json();
        if (data && data.ok) {
          currentApiBase = base;
          return base;
        }
      }
    } catch (e) {
      // try next candidate
    }
  }

  return '/api';
}

async function apiFetch(endpoint, options = {}) {
  const base = await getApiBase();
  try {
    const res = await fetch(`${base}${endpoint}`, options);
    if (res.ok) return res;
    throw new Error(`API returned HTTP ${res.status}`);
  } catch (err) {
    const alternates = ['/api', 'http://localhost:5000/api', 'http://localhost:3000/api'].filter(b => b !== base);
    for (const alt of alternates) {
      try {
        const altRes = await fetch(`${alt}${endpoint}`, options);
        if (altRes.ok) {
          currentApiBase = alt;
          return altRes;
        }
      } catch (e2) {}
    }
    throw err;
  }
}

export async function checkDbStatus() {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const base = await getApiBase();
      const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const data = await res.json();
        if (data && data.ok) return data;
      }

      // Check alternate ports if base failed
      const alternates = ['/api', 'http://localhost:5000/api', 'http://localhost:3000/api'].filter(b => b !== base);
      for (const alt of alternates) {
        try {
          const altRes = await fetch(`${alt}/health`, { signal: AbortSignal.timeout(5000) });
          if (altRes.ok) {
            const d = await altRes.json();
            if (d && d.ok) {
              currentApiBase = alt;
              return d;
            }
          }
        } catch (e) {}
      }
    } catch (err) {
      if (attempt === 1) {
        await new Promise(r => setTimeout(r, 600));
        continue;
      }
      return { ok: false, error: err.message };
    }
  }
  return { ok: false, error: 'Database unreachable' };
}

export async function fetchYears() {
  try {
    const res = await apiFetch('/years');
    if (!res.ok) throw new Error('Failed to fetch years');
    return await res.json();
  } catch (err) {
    console.warn('API error fetching years, fallback to localStorage', err);
    return JSON.parse(localStorage.getItem('kalieswari_years') || '["2026"]');
  }
}

export async function createYear(year) {
  try {
    const res = await apiFetch('/years', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year })
    });
    return await res.json();
  } catch (err) {
    console.warn('API error creating year', err);
  }
}

export async function fetchCompany() {
  try {
    const res = await apiFetch('/company');
    if (!res.ok) throw new Error('Failed to fetch company');
    return await res.json();
  } catch (err) {
    console.warn('API error fetching company', err);
    return null;
  }
}

export async function saveCompany(companyData) {
  try {
    const res = await apiFetch('/company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyData)
    });
    return await res.json();
  } catch (err) {
    console.warn('API error saving company', err);
  }
}

export async function fetchProducts(year) {
  try {
    const res = await apiFetch(`/products?year=${encodeURIComponent(year)}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return await res.json();
  } catch (err) {
    console.warn('API error fetching products', err);
    return null;
  }
}

export async function addProduct(product) {
  try {
    const res = await apiFetch('/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return await res.json();
  } catch (err) {
    console.warn('API error adding product', err);
    throw err;
  }
}

export async function updateProduct(id, product) {
  try {
    const res = await apiFetch(`/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return await res.json();
  } catch (err) {
    console.warn('API error updating product', err);
    throw err;
  }
}

export async function deleteProduct(id) {
  try {
    const res = await apiFetch(`/products/${id}`, {
      method: 'DELETE'
    });
    return await res.json();
  } catch (err) {
    console.warn('API error deleting product', err);
    throw err;
  }
}

export async function fetchCustomers(year) {
  try {
    const res = await apiFetch(`/customers?year=${encodeURIComponent(year)}`);
    if (!res.ok) throw new Error('Failed to fetch customers');
    return await res.json();
  } catch (err) {
    console.warn('API error fetching customers', err);
    return null;
  }
}

export async function addCustomer(customer) {
  try {
    const res = await apiFetch('/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer)
    });
    return await res.json();
  } catch (err) {
    console.warn('API error adding customer', err);
    throw err;
  }
}

export async function updateCustomer(id, customer) {
  try {
    const res = await apiFetch(`/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer)
    });
    return await res.json();
  } catch (err) {
    console.warn('API error updating customer', err);
    throw err;
  }
}

export async function deleteCustomer(id) {
  try {
    const res = await apiFetch(`/customers/${id}`, {
      method: 'DELETE'
    });
    return await res.json();
  } catch (err) {
    console.warn('API error deleting customer', err);
    throw err;
  }
}

export async function fetchInvoices(year) {
  try {
    const res = await apiFetch(`/invoices?year=${encodeURIComponent(year)}`);
    if (!res.ok) throw new Error('Failed to fetch invoices');
    return await res.json();
  } catch (err) {
    console.warn('API error fetching invoices', err);
    return null;
  }
}

export async function saveInvoice(invoiceData) {
  try {
    const res = await apiFetch('/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData)
    });
    return await res.json();
  } catch (err) {
    console.warn('API error saving invoice', err);
    throw err;
  }
}

export async function deleteInvoice(billNo, year) {
  try {
    const res = await apiFetch(`/invoices/${billNo}?year=${encodeURIComponent(year)}`, {
      method: 'DELETE'
    });
    return await res.json();
  } catch (err) {
    console.warn('API error deleting invoice', err);
    throw err;
  }
}

export async function clearAllInvoices(year) {
  try {
    const res = await apiFetch(`/invoices-all?year=${encodeURIComponent(year)}`, {
      method: 'DELETE'
    });
    return await res.json();
  } catch (err) {
    console.warn('API error clearing all invoices', err);
    throw err;
  }
}

export async function syncLocalStorageToDb(payload) {
  try {
    const res = await apiFetch('/sync/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.warn('API error syncing to DB', err);
    throw err;
  }
}

export async function fetchStats(year) {
  try {
    const res = await apiFetch(`/stats?year=${encodeURIComponent(year)}`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return await res.json();
  } catch (err) {
    console.warn('API error fetching stats', err);
    return null;
  }
}

// ── WHATSAPP SERVER BOT API CLIENT ──────────────────────────────
export async function getWhatsAppBotStatus() {
  try {
    const res = await apiFetch('/whatsapp/status');
    if (!res.ok) throw new Error('Failed to get WhatsApp status');
    return await res.json();
  } catch (err) {
    return { status: 'disconnected', connected: false, error: err.message };
  }
}

export async function connectWhatsAppBot() {
  try {
    const res = await apiFetch('/whatsapp/connect', { method: 'POST' });
    return await res.json();
  } catch (err) {
    return { status: 'disconnected', connected: false, error: err.message };
  }
}

export async function logoutWhatsAppBot() {
  try {
    const res = await apiFetch('/whatsapp/logout', { method: 'POST' });
    return await res.json();
  } catch (err) {
    return { status: 'disconnected', connected: false, error: err.message };
  }
}

export async function sendInvoicePdfViaWhatsAppBot(payload) {
  try {
    const res = await apiFetch('/whatsapp/send-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send WhatsApp PDF');
    return data;
  } catch (err) {
    console.error('Error sending WhatsApp invoice PDF:', err);
    throw err;
  }
}

export async function uploadInvoicePdf(billNo, pdfBase64, filename) {
  try {
    const res = await apiFetch(`/invoices/${encodeURIComponent(billNo)}/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdfBase64, filename })
    });
    return await res.json();
  } catch (err) {
    console.warn('Could not cache PDF on server:', err);
    return null;
  }
}


