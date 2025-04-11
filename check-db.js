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
        
        // Check invoices table
        db.all("SELECT * FROM invoices", (err, rows) => {
            if (err) {
                console.error('Error querying invoices:', err);
                db.close();
                process.exit(1);
            }

            console.log('Found', rows.length, 'invoices in the database:');
            rows.forEach(row => {
                console.log('Invoice ID:', row.id);
                console.log('Customer:', row.customer_name);
                console.log('Invoice Number:', row.invoice_number);
                console.log('Date:', row.invoice_date);
                console.log('Grand Total:', row.grand_total);
                console.log('-------------------');
            });

            // Close the database connection
            db.close();
        });
    }
});
