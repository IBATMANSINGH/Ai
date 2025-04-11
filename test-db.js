const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the SQLite database.');
    
    // Check the settings table schema
    db.all("PRAGMA table_info(settings)", (err, rows) => {
        if (err) {
            console.error('Error getting table info:', err);
            return;
        }
        
        console.log('Settings table schema:');
        rows.forEach(row => {
            console.log(`${row.cid}: ${row.name} (${row.type}) ${row.notnull ? 'NOT NULL' : ''} ${row.pk ? 'PRIMARY KEY' : ''}`);
        });
        
        // Get all settings
        db.get("SELECT * FROM settings WHERE id = 1", (err, row) => {
            if (err) {
                console.error('Error getting settings:', err);
                return;
            }
            
            console.log('\nCurrent settings:');
            console.log(row);
            
            // Try to update the settings
            const sql = `UPDATE settings SET 
                currency_code = ?, 
                currency_symbol = ?, 
                tax_rate = ?, 
                tax_name = ?, 
                tax_enabled = ?,
                company_name = ?,
                company_address = ?,
                company_phone = ?,
                company_email = ?,
                invoice_prefix = ?,
                invoice_starting_number = ?,
                date_format = ?,
                product_images_enabled = ?
                WHERE id = ?`;
            
            const params = [
                'INR',
                '₹',
                18.0,
                'GST',
                1,
                'Test Company',
                'Test Address',
                '1234567890',
                'test@example.com',
                'INV-',
                1000,
                'DD/MM/YYYY',
                1,
                1
            ];
            
            db.run(sql, params, function(err) {
                if (err) {
                    console.error('Error updating settings:', err);
                    return;
                }
                
                console.log('\nSettings updated successfully!');
                
                // Get updated settings
                db.get("SELECT * FROM settings WHERE id = 1", (err, row) => {
                    if (err) {
                        console.error('Error getting updated settings:', err);
                        return;
                    }
                    
                    console.log('\nUpdated settings:');
                    console.log(row);
                    
                    // Close the database connection
                    db.close();
                });
            });
        });
    });
});
