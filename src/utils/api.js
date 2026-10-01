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
      const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(2500) });
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
    const alternates = ['http://localhost:5000/api', 'http://localhost:3000/api', '/api'].filter(b => b !== base);
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
  try {
    const base = await getApiBase();
    const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.ok) return data;
    }
    if (base !== 'http://localhost:5000/api') {
      try {
        const alt5000 = await fetch('http://localhost:5000/api/health', { signal: AbortSignal.timeout(3000) });
        if (alt5000.ok) {
          const d = await alt5000.json();
          if (d && d.ok) {
            currentApiBase = 'http://localhost:5000/api';
            return d;
          }
        }
      } catch (e) {}
    }
    return { ok: false, error: 'Database unreachable' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
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

