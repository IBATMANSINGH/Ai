const dbModule = require('./db');
const db = dbModule.getDb();

class Product {
    // Get all products
    static getAll(callback) {
        const sql = 'SELECT * FROM products ORDER BY name ASC';
        db.all(sql, [], (err, rows) => {
            if (err) {
                return callback(err, null);
            }
            return callback(null, rows);
        });
    }

    // Get a single product by ID
    static getById(id, callback) {
        const sql = 'SELECT * FROM products WHERE id = ?';
        db.get(sql, [id], (err, row) => {
            if (err) {
                return callback(err, null);
            }
            return callback(null, row);
        });
    }

    // Create a new product
    static create(product, callback) {
        console.log('Creating product in database:', product);

        // First check if image_path column exists
        db.all("PRAGMA table_info(products)", (err, columns) => {
            if (err) {
                console.error('Error getting columns info:', err);
                return callback(err, null);
            }

            // Check if image_path column exists
            const hasImagePath = columns.some(col => col.name === 'image_path');

            let sql, params;

            if (hasImagePath) {
                // If image_path column exists, use it
                sql = 'INSERT INTO products (name, price, image_path) VALUES (?, ?, ?)';
                params = [product.name, product.price, product.image_path || null];
            } else {
                // If image_path column doesn't exist, don't use it
                sql = 'INSERT INTO products (name, price) VALUES (?, ?)';
                params = [product.name, product.price];

                console.warn('image_path column does not exist in products table. Image will not be saved.');
            }

            console.log('SQL:', sql);
            console.log('Params:', params);

            db.run(sql, params, function(err) {
                if (err) {
                    console.error('Database error creating product:', err);
                    return callback(err, null);
                }

                console.log('Product created successfully with ID:', this.lastID);
                return callback(null, { id: this.lastID, ...product });
            });
        });
    }

    // Update a product
    static update(id, product, callback) {
        // First check if image_path column exists
        db.all("PRAGMA table_info(products)", (err, columns) => {
            if (err) {
                console.error('Error getting columns info:', err);
                return callback(err, null);
            }

            // Check if image_path column exists
            const hasImagePath = columns.some(col => col.name === 'image_path');

            if (hasImagePath && product.image_path !== undefined) {
                // If image_path column exists and image_path is provided, update it
                const sql = 'UPDATE products SET name = ?, price = ?, image_path = ? WHERE id = ?';
                console.log('SQL:', sql);
                console.log('Params:', [product.name, product.price, product.image_path, id]);

                db.run(sql, [product.name, product.price, product.image_path, id], function(err) {
                    if (err) {
                        console.error('Database error updating product:', err);
                        return callback(err, null);
                    }
                    console.log('Product updated successfully with ID:', id);
                    return callback(null, { id, ...product });
                });
            } else {
                // Don't update the image_path if not provided or if column doesn't exist
                const sql = 'UPDATE products SET name = ?, price = ? WHERE id = ?';
                console.log('SQL:', sql);
                console.log('Params:', [product.name, product.price, id]);

                if (product.image_path !== undefined && !hasImagePath) {
                    console.warn('image_path column does not exist in products table. Image will not be saved.');
                }

                db.run(sql, [product.name, product.price, id], function(err) {
                    if (err) {
                        console.error('Database error updating product:', err);
                        return callback(err, null);
                    }
                    console.log('Product updated successfully with ID:', id);
                    return callback(null, { id, ...product });
                });
            }
        });
    }

    // Delete a product
    static delete(id, callback) {
        const sql = 'DELETE FROM products WHERE id = ?';
        db.run(sql, [id], function(err) {
            if (err) {
                return callback(err, null);
            }
            return callback(null, { id });
        });
    }
}

module.exports = Product;
