// TiDB Cloud API client for Sri Kaliswari Crackers Billing POS

const API_BASE = '/api';

export async function checkDbStatus() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Database unreachable');
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function fetchYears() {
  try {
    const res = await fetch(`${API_BASE}/years`);
    if (!res.ok) throw new Error('Failed to fetch years');
    return await res.json();
  } catch (err) {
    console.warn('API error fetching years, fallback to localStorage', err);
    return JSON.parse(localStorage.getItem('kalieswari_years') || '["2026"]');
  }
}

export async function createYear(year) {
  try {
    const res = await fetch(`${API_BASE}/years`, {
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
    const res = await fetch(`${API_BASE}/company`);
    if (!res.ok) throw new Error('Failed to fetch company');
    return await res.json();
  } catch (err) {
    console.warn('API error fetching company', err);
    return null;
  }
}

export async function saveCompany(companyData) {
  try {
    const res = await fetch(`${API_BASE}/company`, {
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
    const res = await fetch(`${API_BASE}/products?year=${encodeURIComponent(year)}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return await res.json();
  } catch (err) {
    console.warn('API error fetching products', err);
    return null;
  }
}

export async function addProduct(product) {
  try {
    const res = await fetch(`${API_BASE}/products`, {
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
    const res = await fetch(`${API_BASE}/products/${id}`, {
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
    const res = await fetch(`${API_BASE}/products/${id}`, {
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
    const res = await fetch(`${API_BASE}/customers?year=${encodeURIComponent(year)}`);
    if (!res.ok) throw new Error('Failed to fetch customers');
    return await res.json();
  } catch (err) {
    console.warn('API error fetching customers', err);
    return null;
  }
}

export async function addCustomer(customer) {
  try {
    const res = await fetch(`${API_BASE}/customers`, {
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
    const res = await fetch(`${API_BASE}/customers/${id}`, {
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
    const res = await fetch(`${API_BASE}/customers/${id}`, {
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
    const res = await fetch(`${API_BASE}/invoices?year=${encodeURIComponent(year)}`);
    if (!res.ok) throw new Error('Failed to fetch invoices');
    return await res.json();
  } catch (err) {
    console.warn('API error fetching invoices', err);
    return null;
  }
}

export async function saveInvoice(invoiceData) {
  try {
    const res = await fetch(`${API_BASE}/invoices`, {
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
    const res = await fetch(`${API_BASE}/invoices/${billNo}?year=${encodeURIComponent(year)}`, {
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
    const res = await fetch(`${API_BASE}/invoices-all?year=${encodeURIComponent(year)}`, {
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
    const res = await fetch(`${API_BASE}/sync/import`, {
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
    const res = await fetch(`${API_BASE}/stats?year=${encodeURIComponent(year)}`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return await res.json();
  } catch (err) {
    console.warn('API error fetching stats', err);
    return null;
  }
}

