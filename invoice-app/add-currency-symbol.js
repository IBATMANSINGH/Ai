const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create a new database or open existing one
const dbPath = path.resolve(__dirname, './data/invoice.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        process.exit(1);
    } else {
        console.log('Connected to the SQLite database.');
        
        // Check if currency_symbol column exists
        db.all("PRAGMA table_info(invoices)", (err, rows) => {
            if (err) {
                console.error('Error getting table info:', err);
                db.close();
                process.exit(1);
            }

            // Check if currency_symbol column exists
            const columnExists = rows.some(row => row.name === 'currency_symbol');

            if (!columnExists) {
                console.log('Adding currency_symbol column to invoices table...');
                db.run("ALTER TABLE invoices ADD COLUMN currency_symbol TEXT DEFAULT '₹'", function(err) {
                    if (err) {
                        console.error('Error adding column:', err);
                    } else {
                        console.log('Currency symbol column added successfully!');
                    }
                    db.close();
                });
            } else {
                console.log('Currency symbol column already exists.');
                db.close();
            }
        });
    }
});
