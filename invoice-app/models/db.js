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
            price REAL NOT NULL,
            image_path TEXT
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
            grand_total REAL NOT NULL,
            currency_symbol TEXT DEFAULT '₹'
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

        // Create settings table
        db.run(`CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            currency_code TEXT DEFAULT 'INR',
            currency_symbol TEXT DEFAULT '₹',
            tax_rate REAL DEFAULT 18.0,
            tax_name TEXT DEFAULT 'GST',
            tax_enabled INTEGER DEFAULT 1,
            company_name TEXT DEFAULT '',
            company_address TEXT DEFAULT '',
            company_phone TEXT DEFAULT '',
            company_email TEXT DEFAULT '',
            invoice_prefix TEXT DEFAULT 'INV-',
            invoice_starting_number INTEGER DEFAULT 1000,
            date_format TEXT DEFAULT 'DD/MM/YYYY'
        )`, (err) => {
            if (err) {
                console.error('Error creating settings table:', err.message);
            } else {
                console.log('Settings table ready');

                // Check if product_images_enabled column exists
                db.all("PRAGMA table_info(settings)", (err, rows) => {
                    if (err) {
                        console.error('Error getting table info:', err);
                        return;
                    }

                    // Check if product_images_enabled column exists
                    const columnExists = rows.some(row => row.name === 'product_images_enabled');

                    if (!columnExists) {
                        console.log('Adding product_images_enabled column...');
                        db.run("ALTER TABLE settings ADD COLUMN product_images_enabled INTEGER DEFAULT 1", function(err) {
                            if (err) {
                                console.error('Error adding column:', err);
                                return;
                            }
                            console.log('product_images_enabled column added successfully!');
                        });
                    }
                });
            }
        });

        // Check if settings exist, if not insert default settings
        db.get('SELECT COUNT(*) as count FROM settings', (err, row) => {
            if (err) {
                console.error('Error checking settings', err.message);
            } else if (row.count === 0) {
                // Insert default settings
                db.run(`INSERT INTO settings (
                    currency_code, currency_symbol, tax_rate, tax_name, tax_enabled,
                    company_name, company_address, company_phone, company_email,
                    invoice_prefix, invoice_starting_number, date_format, product_images_enabled
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                ['INR', '₹', 18.0, 'GST', 1, '', '', '', '', 'INV-', 1000, 'DD/MM/YYYY', 1],
                (err) => {
                    if (err) {
                        console.error('Error inserting default settings', err.message);
                    } else {
                        console.log('Default settings inserted');
                    }
                });
            }
        });
    }
});

// Export the database connection
module.exports = {
    getDb: () => db
};
