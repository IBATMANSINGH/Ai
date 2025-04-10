const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create a new database or open existing one
const dbPath = path.resolve(__dirname, '../data/invoice.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        
        // Create products table
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL
        )`, (err) => {
            if (err) {
                console.error('Error creating products table', err.message);
            } else {
                console.log('Products table ready');
            }
        });

        // Create invoices table
        db.run(`CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT,
            invoice_date TEXT NOT NULL,
            invoice_number TEXT NOT NULL,
            tax_rate REAL DEFAULT 10,
            subtotal REAL NOT NULL,
            tax_amount REAL NOT NULL,
            grand_total REAL NOT NULL
        )`, (err) => {
            if (err) {
                console.error('Error creating invoices table', err.message);
            } else {
                console.log('Invoices table ready');
            }
        });

        // Create invoice_items table
        db.run(`CREATE TABLE IF NOT EXISTS invoice_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            product_name TEXT NOT NULL,
            price REAL NOT NULL,
            quantity INTEGER NOT NULL,
            total REAL NOT NULL,
            FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products (id)
        )`, (err) => {
            if (err) {
                console.error('Error creating invoice_items table', err.message);
            } else {
                console.log('Invoice items table ready');
            }
        });
    }
});

module.exports = db;
