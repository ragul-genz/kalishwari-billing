import express from 'express';
import { pool } from './db.js';
import { defaultCompany, defaultProducts, defaultCustomers } from '../src/data/defaultData.js';

const router = express.Router();

// 1. Health check & status
router.get('/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 as connected, DATABASE() as db, NOW() as time');
    res.json({
      ok: true,
      database: rows[0].db,
      connectedAt: rows[0].time,
      host: process.env.DB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
      message: 'TiDB Cloud MySQL connected successfully'
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 2. Years
router.get('/years', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT year FROM years ORDER BY year ASC');
    if (rows.length === 0) {
      // Seed default year 2026
      await pool.query('INSERT IGNORE INTO years (year) VALUES (?)', ['2026']);
      return res.json(['2026']);
    }
    res.json(rows.map(r => String(r.year)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/years', async (req, res) => {
  const { year } = req.body;
  if (!year) return res.status(400).json({ error: 'Year is required' });
  try {
    await pool.query('INSERT IGNORE INTO years (year) VALUES (?)', [String(year)]);
    res.json({ success: true, year: String(year) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Company settings
router.get('/company', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM company WHERE id = 1');
    if (rows.length === 0) {
      // Seed with default company
      const c = defaultCompany;
      await pool.query(
        `INSERT INTO company (id, name, tagline, address, mobile, email, gstin, state, state_code, bank_name, account_no, ifsc_code, branch, terms)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          c.name, c.tagline, c.address, c.mobile, c.email, c.gstin,
          c.state, c.stateCode, c.bankName, c.accountNo, c.ifscCode, c.branch,
          JSON.stringify(c.terms || [])
        ]
      );
      return res.json(defaultCompany);
    }
    const row = rows[0];
    res.json({
      name: row.name,
      tagline: row.tagline,
      address: row.address,
      mobile: row.mobile,
      email: row.email,
      gstin: row.gstin,
      state: row.state,
      stateCode: row.state_code,
      bankName: row.bank_name,
      accountNo: row.account_no,
      ifscCode: row.ifsc_code,
      branch: row.branch,
      terms: typeof row.terms === 'string' ? JSON.parse(row.terms || '[]') : (row.terms || [])
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/company', async (req, res) => {
  const c = req.body;
  try {
    await pool.query(
      `INSERT INTO company (id, name, tagline, address, mobile, email, gstin, state, state_code, bank_name, account_no, ifsc_code, branch, terms)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        name = VALUES(name), tagline = VALUES(tagline), address = VALUES(address),
        mobile = VALUES(mobile), email = VALUES(email), gstin = VALUES(gstin),
        state = VALUES(state), state_code = VALUES(state_code), bank_name = VALUES(bank_name),
        account_no = VALUES(account_no), ifsc_code = VALUES(ifsc_code), branch = VALUES(branch),
        terms = VALUES(terms)`,
      [
        c.name || '', c.tagline || '', c.address || '', c.mobile || '', c.email || '', c.gstin || '',
        c.state || '', c.stateCode || '', c.bankName || '', c.accountNo || '', c.ifscCode || '', c.branch || '',
        JSON.stringify(c.terms || [])
      ]
    );
    res.json({ success: true, company: c });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Products (by year)
router.get('/products', async (req, res) => {
  const year = req.query.year || '2026';
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE year = ? ORDER BY id ASC', [year]);
    if (rows.length === 0) {
      // Seed default products for this year
      for (const p of defaultProducts) {
        await pool.query(
          `INSERT INTO products (year, code, name, category, content, rate, stock, tax_percent)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [year, String(p.code), p.name, p.category, p.content, p.rate, p.stock, p.taxPercent || 18]
        );
      }
      const [seeded] = await pool.query('SELECT * FROM products WHERE year = ? ORDER BY id ASC', [year]);
      return res.json(seeded.map(formatProduct));
    }
    res.json(rows.map(formatProduct));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function formatProduct(p) {
  return {
    id: p.id,
    year: p.year,
    code: String(p.code),
    name: p.name,
    category: p.category,
    content: p.content,
    rate: Number(p.rate),
    stock: Number(p.stock),
    taxPercent: Number(p.tax_percent)
  };
}

router.post('/products', async (req, res) => {
  const { year = '2026', code, name, category, content = '', rate = 0, stock = 0, taxPercent = 18 } = req.body;
  if (!name || !category) return res.status(400).json({ error: 'Name and category are required' });
  try {
    const [result] = await pool.query(
      `INSERT INTO products (year, code, name, category, content, rate, stock, tax_percent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [year, String(code || ''), name, category, content, rate, stock, taxPercent]
    );
    res.json({
      id: result.insertId,
      year,
      code: String(code || ''),
      name,
      category,
      content,
      rate: Number(rate),
      stock: Number(stock),
      taxPercent: Number(taxPercent)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/products/:id', async (req, res) => {
  const id = req.params.id;
  const { code, name, category, content, rate, stock, taxPercent } = req.body;
  try {
    await pool.query(
      `UPDATE products SET
        code = COALESCE(?, code),
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        content = COALESCE(?, content),
        rate = COALESCE(?, rate),
        stock = COALESCE(?, stock),
        tax_percent = COALESCE(?, tax_percent)
       WHERE id = ?`,
      [code != null ? String(code) : null, name, category, content, rate, stock, taxPercent, id]
    );
    res.json({ success: true, id: Number(id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ success: true, id: Number(id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Customers (by year)
router.get('/customers', async (req, res) => {
  const year = req.query.year || '2026';
  try {
    const [rows] = await pool.query('SELECT * FROM customers WHERE year = ? ORDER BY id ASC', [year]);
    if (rows.length === 0) {
      for (const c of defaultCustomers) {
        await pool.query(
          `INSERT INTO customers (year, name, mobile, address, gstin, total_orders, balance)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [year, c.name, c.mobile, c.address, c.gstin || '', c.totalOrders || 0, c.balance || 0]
        );
      }
      const [seeded] = await pool.query('SELECT * FROM customers WHERE year = ? ORDER BY id ASC', [year]);
      return res.json(seeded.map(formatCustomer));
    }
    res.json(rows.map(formatCustomer));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function formatCustomer(c) {
  return {
    id: c.id,
    year: c.year,
    name: c.name,
    mobile: c.mobile,
    address: c.address,
    gstin: c.gstin,
    totalOrders: Number(c.total_orders || 0),
    balance: Number(c.balance || 0)
  };
}

router.post('/customers', async (req, res) => {
  const { year = '2026', name, mobile = '', address = '', gstin = '', totalOrders = 0, balance = 0 } = req.body;
  if (!name) return res.status(400).json({ error: 'Customer name is required' });
  try {
    const [result] = await pool.query(
      `INSERT INTO customers (year, name, mobile, address, gstin, total_orders, balance)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [year, name, mobile, address, gstin, totalOrders, balance]
    );
    res.json({
      id: result.insertId,
      year,
      name,
      mobile,
      address,
      gstin,
      totalOrders: Number(totalOrders),
      balance: Number(balance)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/customers/:id', async (req, res) => {
  const id = req.params.id;
  const { name, mobile, address, gstin, totalOrders, balance } = req.body;
  try {
    await pool.query(
      `UPDATE customers SET
        name = COALESCE(?, name),
        mobile = COALESCE(?, mobile),
        address = COALESCE(?, address),
        gstin = COALESCE(?, gstin),
        total_orders = COALESCE(?, total_orders),
        balance = COALESCE(?, balance)
       WHERE id = ?`,
      [name, mobile, address, gstin, totalOrders, balance, id]
    );
    res.json({ success: true, id: Number(id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/customers/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM customers WHERE id = ?', [id]);
    res.json({ success: true, id: Number(id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Invoices (by year)
router.get('/invoices', async (req, res) => {
  const year = req.query.year || '2026';
  try {
    const [rows] = await pool.query('SELECT * FROM invoices WHERE year = ? ORDER BY bill_no DESC', [year]);
    res.json(rows.map(formatInvoice));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function formatInvoice(inv) {
  let items = [];
  try {
    items = typeof inv.items === 'string' ? JSON.parse(inv.items) : (inv.items || []);
  } catch (e) {
    items = [];
  }
  return {
    id: inv.id,
    year: inv.year,
    billNo: Number(inv.bill_no),
    type: inv.type,
    date: inv.date,
    customerName: inv.customer_name,
    customerMobile: inv.customer_mobile,
    customerAddress: inv.customer_address,
    customerGstin: inv.customer_gstin,
    paymentMode: inv.payment_mode,
    items,
    grossTotal: Number(inv.gross_total),
    discountPercent: Number(inv.discount_percent),
    discountAmount: Number(inv.discount_amount),
    additionalDiscountPercent: Number(inv.additional_discount_percent),
    additionalDiscountAmount: Number(inv.additional_discount_amount),
    afterAdditionalDisc: Number(inv.after_additional_disc),
    packingPercent: Number(inv.packing_percent),
    packingCharge: Number(inv.packing_charge),
    gstPercent: Number(inv.gst_percent),
    gstAmount: Number(inv.gst_amount),
    netAmount: Number(inv.net_amount),
    status: inv.status,
    createdAt: inv.created_at
  };
}

router.post('/invoices', async (req, res) => {
  const inv = req.body;
  const year = inv.year || '2026';
  if (!inv.billNo) return res.status(400).json({ error: 'Bill number is required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Insert invoice
    const [result] = await conn.query(
      `INSERT INTO invoices (
        year, bill_no, type, date, customer_name, customer_mobile, customer_address, customer_gstin,
        payment_mode, items, gross_total, discount_percent, discount_amount,
        additional_discount_percent, additional_discount_amount, after_additional_disc,
        packing_percent, packing_charge, gst_percent, gst_amount, net_amount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        year,
        inv.billNo,
        inv.type || 'invoice',
        inv.date,
        inv.customerName || 'Direct Counter Sale',
        inv.customerMobile || '-',
        inv.customerAddress || '-',
        inv.customerGstin || '-',
        inv.paymentMode || 'Cash',
        JSON.stringify(inv.items || []),
        inv.grossTotal || 0,
        inv.discountPercent || 0,
        inv.discountAmount || 0,
        inv.additionalDiscountPercent || 0,
        inv.additionalDiscountAmount || 0,
        inv.afterAdditionalDisc || 0,
        inv.packingPercent || 0,
        inv.packingCharge || 0,
        inv.gstPercent || 0,
        inv.gstAmount || 0,
        inv.netAmount || 0,
        inv.status || 'Completed'
      ]
    );

    // Decrement stock for invoiced products if it's an invoice or taxbill (not quotation)
    if (inv.type !== 'quotation' && Array.isArray(inv.items)) {
      for (const item of inv.items) {
        if (item.productId || item.code) {
          const qty = Number(item.qty) || 0;
          if (qty > 0) {
            await conn.query(
              'UPDATE products SET stock = GREATEST(0, stock - ?) WHERE year = ? AND (id = ? OR code = ?)',
              [qty, year, item.productId || 0, String(item.code || '')]
            );
          }
        }
      }
    }

    await conn.commit();
    res.json({ success: true, id: result.insertId, billNo: inv.billNo });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
});

router.delete('/invoices/:billNo', async (req, res) => {
  const billNo = req.params.billNo;
  const year = req.query.year || '2026';
  try {
    await pool.query('DELETE FROM invoices WHERE year = ? AND bill_no = ?', [year, billNo]);
    res.json({ success: true, billNo: Number(billNo) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/invoices-all', async (req, res) => {
  const year = req.query.year || '2026';
  try {
    await pool.query('DELETE FROM invoices WHERE year = ?', [year]);
    res.json({ success: true, message: `Cleared all invoices for year ${year}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Bulk Sync / Import from LocalStorage
router.post('/sync/import', async (req, res) => {
  const { year, company, products, customers, invoices } = req.body;
  if (!year) return res.status(400).json({ error: 'Year is required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Ensure year exists
    await conn.query('INSERT IGNORE INTO years (year) VALUES (?)', [String(year)]);

    // 2. Company
    if (company && typeof company === 'object') {
      await conn.query(
        `INSERT INTO company (id, name, tagline, address, mobile, email, gstin, state, state_code, bank_name, account_no, ifsc_code, branch, terms)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          name = VALUES(name), tagline = VALUES(tagline), address = VALUES(address),
          mobile = VALUES(mobile), email = VALUES(email), gstin = VALUES(gstin),
          state = VALUES(state), state_code = VALUES(state_code), bank_name = VALUES(bank_name),
          account_no = VALUES(account_no), ifsc_code = VALUES(ifsc_code), branch = VALUES(branch),
          terms = VALUES(terms)`,
        [
          company.name || '', company.tagline || '', company.address || '', company.mobile || '',
          company.email || '', company.gstin || '', company.state || '', company.stateCode || '',
          company.bankName || '', company.accountNo || '', company.ifscCode || '', company.branch || '',
          JSON.stringify(company.terms || [])
        ]
      );
    }

    // 3. Products
    if (Array.isArray(products) && products.length > 0) {
      await conn.query('DELETE FROM products WHERE year = ?', [year]);
      for (const p of products) {
        await conn.query(
          `INSERT INTO products (year, code, name, category, content, rate, stock, tax_percent)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [year, String(p.code || ''), p.name, p.category, p.content || '', p.rate || 0, p.stock || 0, p.taxPercent || 18]
        );
      }
    }

    // 4. Customers
    if (Array.isArray(customers) && customers.length > 0) {
      await conn.query('DELETE FROM customers WHERE year = ?', [year]);
      for (const c of customers) {
        await conn.query(
          `INSERT INTO customers (year, name, mobile, address, gstin, total_orders, balance)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [year, c.name, c.mobile || '', c.address || '', c.gstin || '', c.totalOrders || 0, c.balance || 0]
        );
      }
    }

    // 5. Invoices
    if (Array.isArray(invoices) && invoices.length > 0) {
      for (const inv of invoices) {
        await conn.query(
          `INSERT INTO invoices (
            year, bill_no, type, date, customer_name, customer_mobile, customer_address, customer_gstin,
            payment_mode, items, gross_total, discount_percent, discount_amount,
            additional_discount_percent, additional_discount_amount, after_additional_disc,
            packing_percent, packing_charge, gst_percent, gst_amount, net_amount, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE status = VALUES(status)`,
          [
            year,
            inv.billNo,
            inv.type || 'invoice',
            inv.date || new Date().toISOString().split('T')[0],
            inv.customerName || 'Direct Counter Sale',
            inv.customerMobile || '-',
            inv.customerAddress || '-',
            inv.customerGstin || '-',
            inv.paymentMode || 'Cash',
            JSON.stringify(inv.items || []),
            inv.grossTotal || 0,
            inv.discountPercent || 0,
            inv.discountAmount || 0,
            inv.additionalDiscountPercent || 0,
            inv.additionalDiscountAmount || 0,
            inv.afterAdditionalDisc || 0,
            inv.packingPercent || 0,
            inv.packingCharge || 0,
            inv.gstPercent || 0,
            inv.gstAmount || 0,
            inv.netAmount || 0,
            inv.status || 'Completed'
          ]
        );
      }
    }

    await conn.commit();
    res.json({ success: true, message: 'Sync and import to TiDB completed successfully!' });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
});

export default router;
