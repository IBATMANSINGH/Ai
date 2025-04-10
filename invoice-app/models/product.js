const db = require('./db');

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
        const sql = 'INSERT INTO products (name, price) VALUES (?, ?)';
        db.run(sql, [product.name, product.price], function(err) {
            if (err) {
                return callback(err, null);
            }
            return callback(null, { id: this.lastID, ...product });
        });
    }

    // Update a product
    static update(id, product, callback) {
        const sql = 'UPDATE products SET name = ?, price = ? WHERE id = ?';
        db.run(sql, [product.name, product.price, id], function(err) {
            if (err) {
                return callback(err, null);
            }
            return callback(null, { id, ...product });
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
