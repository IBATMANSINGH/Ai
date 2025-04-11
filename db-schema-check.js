const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Create a new database or open existing one
const dbPath = path.resolve(__dirname, 'data/invoice.db');
console.log('Database path:', dbPath);

// Check if database file exists
if (!fs.existsSync(dbPath)) {
    console.error('Database file does not exist at path:', dbPath);
    console.log('Creating data directory if it doesn\'t exist...');

    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('Created data directory:', dataDir);
    }
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to the SQLite database.');

    // Check and fix products table
    checkProductsTable();
});

function checkProductsTable() {
    console.log('Checking products table...');

    db.all("PRAGMA table_info(products)", (err, rows) => {
        if (err) {
            console.error('Error getting products table info:', err);
            checkInvoicesTable();
            return;
        }

        console.log('Products table schema:');
        rows.forEach(row => {
            console.log(`${row.cid}: ${row.name} (${row.type}) ${row.notnull ? 'NOT NULL' : ''} ${row.pk ? 'PRIMARY KEY' : ''}`);
        });

        // Check if image_path column exists
        const hasImagePath = rows.some(row => row.name === 'image_path');
        if (!hasImagePath) {
            console.log('Adding image_path column to products table...');
            db.run("ALTER TABLE products ADD COLUMN image_path TEXT", function(err) {
                if (err) {
                    console.error('Error adding image_path column:', err);
                    // Try to recreate the table with the correct schema if altering fails
                    console.log('Attempting to recreate products table with correct schema...');
                    db.serialize(() => {
                        // First, create a backup of the products table
                        db.run("CREATE TABLE IF NOT EXISTS products_backup (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, price REAL)", (err) => {
                            if (err) {
                                console.error('Error creating backup table:', err);
                                checkInvoicesTable();
                                return;
                            }

                            // Copy data to backup table
                            db.run("INSERT INTO products_backup SELECT id, name, price FROM products", (err) => {
                                if (err) {
                                    console.error('Error copying data to backup table:', err);
                                    checkInvoicesTable();
                                    return;
                                }

                                // Drop the original table
                                db.run("DROP TABLE products", (err) => {
                                    if (err) {
                                        console.error('Error dropping products table:', err);
                                        checkInvoicesTable();
                                        return;
                                    }

                                    // Create a new table with the correct schema
                                    db.run("CREATE TABLE products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, price REAL, image_path TEXT)", (err) => {
                                        if (err) {
                                            console.error('Error creating new products table:', err);
                                            checkInvoicesTable();
                                            return;
                                        }

                                        // Restore data from backup
                                        db.run("INSERT INTO products (id, name, price) SELECT id, name, price FROM products_backup", (err) => {
                                            if (err) {
                                                console.error('Error restoring data from backup:', err);
                                            } else {
                                                console.log('Products table recreated with image_path column');
                                            }

                                            // Drop the backup table
                                            db.run("DROP TABLE products_backup", (err) => {
                                                if (err) {
                                                    console.error('Error dropping backup table:', err);
                                                }
                                                checkInvoicesTable();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                } else {
                    console.log('Added image_path column to products table');
                    checkInvoicesTable();
                }
            });
        } else {
            checkInvoicesTable();
        }
    });
}

function checkInvoicesTable() {
    console.log('Checking invoices table...');

    db.all("PRAGMA table_info(invoices)", (err, rows) => {
        if (err) {
            console.error('Error getting invoices table info:', err);
            checkInvoiceItemsTable();
            return;
        }

        console.log('Invoices table schema:');
        rows.forEach(row => {
            console.log(`${row.cid}: ${row.name} (${row.type}) ${row.notnull ? 'NOT NULL' : ''} ${row.pk ? 'PRIMARY KEY' : ''}`);
        });

        // Check if currency_symbol column exists
        const hasCurrencySymbol = rows.some(row => row.name === 'currency_symbol');
        if (!hasCurrencySymbol) {
            console.log('Adding currency_symbol column to invoices table...');
            db.run("ALTER TABLE invoices ADD COLUMN currency_symbol TEXT DEFAULT '₹'", function(err) {
                if (err) {
                    console.error('Error adding currency_symbol column:', err);
                } else {
                    console.log('Added currency_symbol column to invoices table');
                }
                checkInvoiceItemsTable();
            });
        } else {
            checkInvoiceItemsTable();
        }
    });
}

function checkInvoiceItemsTable() {
    console.log('Checking invoice_items table...');

    db.all("PRAGMA table_info(invoice_items)", (err, rows) => {
        if (err) {
            console.error('Error getting invoice_items table info:', err);
            checkSettingsTable();
            return;
        }

        console.log('Invoice items table schema:');
        rows.forEach(row => {
            console.log(`${row.cid}: ${row.name} (${row.type}) ${row.notnull ? 'NOT NULL' : ''} ${row.pk ? 'PRIMARY KEY' : ''}`);
        });

        // Check if unit_price column exists
        const hasUnitPrice = rows.some(row => row.name === 'unit_price');
        if (!hasUnitPrice) {
            console.log('Adding unit_price column to invoice_items table...');
            db.run("ALTER TABLE invoice_items ADD COLUMN unit_price REAL DEFAULT 0", function(err) {
                if (err) {
                    console.error('Error adding unit_price column:', err);
                } else {
                    console.log('Added unit_price column to invoice_items table');
                }
                checkSettingsTable();
            });
        } else {
            checkSettingsTable();
        }
    });
}

function checkSettingsTable() {
    console.log('Checking settings table...');

    db.all("PRAGMA table_info(settings)", (err, rows) => {
        if (err) {
            console.error('Error getting settings table info:', err);
            closeDatabase();
            return;
        }

        console.log('Settings table schema:');
        rows.forEach(row => {
            console.log(`${row.cid}: ${row.name} (${row.type}) ${row.notnull ? 'NOT NULL' : ''} ${row.pk ? 'PRIMARY KEY' : ''}`);
        });

        // Check if product_images_enabled column exists
        const hasProductImagesEnabled = rows.some(row => row.name === 'product_images_enabled');
        if (!hasProductImagesEnabled) {
            console.log('Adding product_images_enabled column to settings table...');
            db.run("ALTER TABLE settings ADD COLUMN product_images_enabled INTEGER DEFAULT 1", function(err) {
                if (err) {
                    console.error('Error adding product_images_enabled column:', err);
                } else {
                    console.log('Added product_images_enabled column to settings table');
                }
                closeDatabase();
            });
        } else {
            closeDatabase();
        }
    });
}

function closeDatabase() {
    console.log('Database schema check completed.');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
    });
}
