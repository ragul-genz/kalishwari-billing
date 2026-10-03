import { dbQuery, pool } from './server/db.js';

async function testDatabaseConnection() {
  console.log('--------------------------------------------------');
  console.log('🚀 Connecting to TiDB Cloud MySQL Database...');
  console.log('--------------------------------------------------');

  try {
    // 1. Test ping & database status
    const [status] = await dbQuery('SELECT 1 as connected, DATABASE() as current_db, NOW() as srv_time, VERSION() as ver');
    console.log('✓ TiDB Cloud Database Connection Successful!');
    console.log(`📌 Database Name: ${status[0].current_db}`);
    console.log(`📌 Server Time:   ${status[0].srv_time}`);
    console.log(`📌 MySQL Version: ${status[0].ver}`);
    console.log('--------------------------------------------------');

    // 2. Query Products count
    const [productCount] = await dbQuery('SELECT COUNT(*) as total FROM products');
    console.log(`📦 Total Products in TiDB:  ${productCount[0].total}`);

    // 3. Query Customers count
    const [customerCount] = await dbQuery('SELECT COUNT(*) as total FROM customers');
    console.log(`👥 Total Customers in TiDB: ${customerCount[0].total}`);

    // 4. Query Invoices count & revenue
    const [invoiceStats] = await dbQuery('SELECT COUNT(*) as total_bills, COALESCE(SUM(net_amount), 0) as total_revenue FROM invoices');
    console.log(`🧾 Total Invoices in TiDB:  ${invoiceStats[0].total_bills}`);
    console.log(`💰 Total Revenue in TiDB:   ₹${Number(invoiceStats[0].total_revenue).toLocaleString('en-IN')}`);
    console.log('--------------------------------------------------');
    console.log('🟢 Status: Database is Live, Connected & Operational!');

  } catch (err) {
    console.error('❌ Database Connection Error:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

testDatabaseConnection();
