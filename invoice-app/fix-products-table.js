const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Connect to the database
const dbPath = path.join(__dirname, 'data/invoice.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1);
    }
    console.log('Connected to the SQLite database.');

    // Check if the products table exists
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='products'", (err, table) => {
        if (err) {
            console.error('Error checking if products table exists:', err);
            db.close();
            return;
        }

        if (!table) {
            console.log('Products table does not exist. Creating it...');
            createProductsTable();
        } else {
            console.log('Products table exists. Checking columns...');
            checkColumns();
        }
    });
});

function createProductsTable() {
    db.run(`
        CREATE TABLE products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            image_path TEXT
        )
    `, (err) => {
        if (err) {
            console.error('Error creating products table:', err);
        } else {
            console.log('Products table created successfully.');
        }
        db.close();
    });
}

function checkColumns() {
    db.all("PRAGMA table_info(products)", (err, columns) => {
        if (err) {
            console.error('Error getting columns info:', err);
            db.close();
            return;
        }

        console.log('Products table columns:');
        columns.forEach(col => {
            console.log(`${col.cid}: ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
        });

        // Check if image_path column exists
        const hasImagePath = columns.some(col => col.name === 'image_path');

        if (!hasImagePath) {
            console.log('Adding image_path column to products table...');
            addImagePathColumn();
        } else {
            console.log('image_path column already exists.');
            db.close();
        }
    });
}

function addImagePathColumn() {
    db.run("ALTER TABLE products ADD COLUMN image_path TEXT", (err) => {
        if (err) {
            console.error('Error adding image_path column:', err);
            recreateProductsTable();
        } else {
            console.log('image_path column added successfully.');
            db.close();
        }
    });
}

function recreateProductsTable() {
    console.log('Attempting to recreate products table with correct schema...');

    db.serialize(() => {
        // First, create a backup of the products table
        db.run("CREATE TABLE products_backup AS SELECT id, name, price FROM products", (err) => {
            if (err) {
                console.error('Error creating backup table:', err);
                db.close();
                return;
            }

            console.log('Backup table created.');

            // Drop the original table
            db.run("DROP TABLE products", (err) => {
                if (err) {
                    console.error('Error dropping products table:', err);
                    db.close();
                    return;
                }

                console.log('Original products table dropped.');

                // Create a new table with the correct schema
                db.run(`
                    CREATE TABLE products (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        price REAL NOT NULL,
                        image_path TEXT
                    )
                `, (err) => {
                    if (err) {
                        console.error('Error creating new products table:', err);
                        db.close();
                        return;
                    }

                    console.log('New products table created with correct schema.');

                    // Restore data from backup
                    db.run("INSERT INTO products (id, name, price) SELECT id, name, price FROM products_backup", (err) => {
                        if (err) {
                            console.error('Error restoring data from backup:', err);
                        } else {
                            console.log('Data restored from backup.');
                        }

                        // Drop the backup table
                        db.run("DROP TABLE products_backup", (err) => {
                            if (err) {
                                console.error('Error dropping backup table:', err);
                            } else {
                                console.log('Backup table dropped.');
                            }

                            console.log('Products table recreation completed.');
                            db.close();
                        });
                    });
                });
            });
        });
    });
}
