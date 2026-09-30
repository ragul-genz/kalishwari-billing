import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: parseInt(process.env.DB_PORT || '4000', 10),
  user: process.env.DB_USER || '2jfg5VSYFYcSWGr.root',
  password: process.env.DB_PASSWORD || 'fbKhrByYkqOlhF6S',
  database: process.env.DB_NAME || 'kalishwaribilling',
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

export const pool = mysql.createPool(dbConfig);

// Initialize schema
export async function initDatabase() {
  const conn = await pool.getConnection();
  try {
    console.log('Connecting to TiDB Cloud and verifying tables...');

    // 1. Years table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS years (
        year VARCHAR(20) PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Company profile table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS company (
        id INT PRIMARY KEY DEFAULT 1,
        name VARCHAR(255) NOT NULL,
        tagline VARCHAR(255),
        address TEXT,
        mobile VARCHAR(100),
        email VARCHAR(100),
        gstin VARCHAR(50),
        state VARCHAR(100),
        state_code VARCHAR(20),
        bank_name VARCHAR(100),
        account_no VARCHAR(100),
        ifsc_code VARCHAR(50),
        branch VARCHAR(100),
        terms JSON,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Products table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS products (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        year VARCHAR(20) NOT NULL,
        code VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        content VARCHAR(100),
        rate DECIMAL(12, 2) NOT NULL DEFAULT 0,
        stock INT NOT NULL DEFAULT 0,
        tax_percent DECIMAL(5, 2) DEFAULT 18,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_products_year (year)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Customers table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        year VARCHAR(20) NOT NULL,
        name VARCHAR(255) NOT NULL,
        mobile VARCHAR(50),
        address TEXT,
        gstin VARCHAR(50),
        total_orders INT DEFAULT 0,
        balance DECIMAL(12, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_customers_year (year)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Invoices table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        year VARCHAR(20) NOT NULL,
        bill_no INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        date VARCHAR(30) NOT NULL,
        customer_name VARCHAR(255),
        customer_mobile VARCHAR(50),
        customer_address TEXT,
        customer_gstin VARCHAR(50),
        payment_mode VARCHAR(50),
        items JSON NOT NULL,
        gross_total DECIMAL(12, 2) DEFAULT 0,
        discount_percent DECIMAL(5, 2) DEFAULT 0,
        discount_amount DECIMAL(12, 2) DEFAULT 0,
        additional_discount_percent DECIMAL(5, 2) DEFAULT 0,
        additional_discount_amount DECIMAL(12, 2) DEFAULT 0,
        after_additional_disc DECIMAL(12, 2) DEFAULT 0,
        packing_percent DECIMAL(5, 2) DEFAULT 0,
        packing_charge DECIMAL(12, 2) DEFAULT 0,
        gst_percent DECIMAL(5, 2) DEFAULT 0,
        gst_amount DECIMAL(12, 2) DEFAULT 0,
        net_amount DECIMAL(12, 2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_invoices_year (year),
        INDEX idx_invoices_bill (year, bill_no)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('TiDB database tables created / verified successfully!');
  } finally {
    conn.release();
  }
}
