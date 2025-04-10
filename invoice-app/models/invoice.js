const dbModule = require('./db');
const db = dbModule.getDb();

class Invoice {
    // Get all invoices
    static getAll(callback) {
        const sql = 'SELECT * FROM invoices ORDER BY id DESC';
        db.all(sql, [], (err, rows) => {
            if (err) {
                return callback(err, null);
            }
            return callback(null, rows);
        });
    }

    // Get a single invoice by ID with its items
    static getById(id, callback) {
        // First get the invoice
        const invoiceSql = 'SELECT * FROM invoices WHERE id = ?';
        db.get(invoiceSql, [id], (err, invoice) => {
            if (err) {
                return callback(err, null);
            }
            if (!invoice) {
                return callback(null, null);
            }

            // Then get all items for this invoice
            const itemsSql = 'SELECT * FROM invoice_items WHERE invoice_id = ?';
            db.all(itemsSql, [id], (err, items) => {
                if (err) {
                    return callback(err, null);
                }

                // Combine invoice with its items
                invoice.items = items;
                return callback(null, invoice);
            });
        });
    }

    // Create a new invoice with its items
    static create(invoice, callback) {
        // Start a transaction
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            // Insert the invoice
            const invoiceSql = `INSERT INTO invoices
                (customer_name, invoice_date, invoice_number, tax_rate, subtotal, tax_amount, grand_total, currency_symbol)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

            db.run(invoiceSql, [
                invoice.customer_name,
                invoice.invoice_date,
                invoice.invoice_number,
                invoice.tax_rate,
                invoice.subtotal,
                invoice.tax_amount,
                invoice.grand_total,
                invoice.currency_symbol
            ], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    return callback(err, null);
                }

                const invoiceId = this.lastID;

                // If there are no items, commit and return
                if (!invoice.items || invoice.items.length === 0) {
                    db.run('COMMIT');
                    return callback(null, { id: invoiceId, ...invoice });
                }

                // Prepare statement for inserting items
                const itemSql = `INSERT INTO invoice_items
                    (invoice_id, product_id, product_name, price, quantity, total)
                    VALUES (?, ?, ?, ?, ?, ?)`;

                const stmt = db.prepare(itemSql);

                // Insert each item
                let itemsProcessed = 0;
                let hasError = false;

                invoice.items.forEach(item => {
                    stmt.run([
                        invoiceId,
                        item.product_id,
                        item.product_name,
                        item.price,
                        item.quantity,
                        item.total
                    ], function(err) {
                        itemsProcessed++;

                        if (err && !hasError) {
                            hasError = true;
                            db.run('ROLLBACK');
                            stmt.finalize();
                            return callback(err, null);
                        }

                        // If all items are processed, commit and return
                        if (itemsProcessed === invoice.items.length && !hasError) {
                            stmt.finalize();
                            db.run('COMMIT');
                            return callback(null, { id: invoiceId, ...invoice });
                        }
                    });
                });
            });
        });
    }

    // Delete an invoice (will cascade delete its items)
    static delete(id, callback) {
        const sql = 'DELETE FROM invoices WHERE id = ?';
        db.run(sql, [id], function(err) {
            if (err) {
                return callback(err, null);
            }
            return callback(null, { id });
        });
    }
}

module.exports = Invoice;
