import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

async function setup() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    port: parseInt(process.env.DB_PORT || "3306"),
    ssl: process.env.DB_HOST?.includes("aivencloud.com") ? { rejectUnauthorized: false } : undefined,
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || "invoice_app"}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  console.log(`Database "${process.env.DB_NAME || "invoice_app"}" created or already exists.`);

  await connection.query(`USE \`${process.env.DB_NAME || "invoice_app"}\``);

  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      profile_image VARCHAR(500),
      company_name VARCHAR(255),
      company_address TEXT,
      company_logo VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS clients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      address TEXT,
      company VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS invoices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      client_id INT NOT NULL,
      invoice_number VARCHAR(50) UNIQUE NOT NULL,
      issue_date DATE NOT NULL,
      due_date DATE NOT NULL,
      subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
      tax DECIMAL(12,2) NOT NULL DEFAULT 0,
      tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
      discount DECIMAL(12,2) NOT NULL DEFAULT 0,
      total DECIMAL(12,2) NOT NULL DEFAULT 0,
      notes TEXT,
      status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
      merchant_id INT,
      payment_link VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS invoice_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      invoice_id INT NOT NULL,
      description VARCHAR(500) NOT NULL,
      quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
      unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
      total DECIMAL(12,2) NOT NULL DEFAULT 0,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS merchants (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      type ENUM('stripe', 'paypal', 'payoneer', 'razorpay', 'square', 'bank_transfer', 'other') NOT NULL,
      api_key VARCHAR(500),
      api_secret VARCHAR(500),
      webhook_secret VARCHAR(500),
      account_email VARCHAR(255),
      account_holder VARCHAR(255),
      account_number VARCHAR(255),
      bank_name VARCHAR(255),
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      invoice_id INT NOT NULL,
      merchant_id INT,
      amount DECIMAL(12,2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'USD',
      status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
      transaction_id VARCHAR(255),
      payment_method VARCHAR(50),
      paid_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    )`,
  ];

  for (const sql of tables) {
    await connection.query(sql);
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/i)?.[1];
    if (tableName) console.log(`Table "${tableName}" ready.`);
  }

  console.log("\n✓ Database setup complete!");
  await connection.end();
}

setup().catch(console.error);
