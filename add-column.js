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
    
    // Check if the column exists
    db.all("PRAGMA table_info(settings)", (err, rows) => {
        if (err) {
            console.error('Error getting table info:', err);
            db.close();
            return;
        }
        
        console.log('Settings table schema:');
        rows.forEach(row => {
            console.log(`${row.cid}: ${row.name} (${row.type}) ${row.notnull ? 'NOT NULL' : ''} ${row.pk ? 'PRIMARY KEY' : ''}`);
        });
        
        // Check if product_images_enabled column exists
        const columnExists = rows.some(row => row.name === 'product_images_enabled');
        
        if (columnExists) {
            console.log('Column product_images_enabled already exists.');
            db.close();
            return;
        }
        
        // Add the column
        console.log('Adding product_images_enabled column...');
        db.run("ALTER TABLE settings ADD COLUMN product_images_enabled INTEGER DEFAULT 1", function(err) {
            if (err) {
                console.error('Error adding column:', err);
                db.close();
                return;
            }
            
            console.log('Column added successfully!');
            
            // Verify the column was added
            db.all("PRAGMA table_info(settings)", (err, rows) => {
                if (err) {
                    console.error('Error getting updated table info:', err);
                    db.close();
                    return;
                }
                
                console.log('Updated settings table schema:');
                rows.forEach(row => {
                    console.log(`${row.cid}: ${row.name} (${row.type}) ${row.notnull ? 'NOT NULL' : ''} ${row.pk ? 'PRIMARY KEY' : ''}`);
                });
                
                // Close the database connection
                db.close();
            });
        });
    });
});
