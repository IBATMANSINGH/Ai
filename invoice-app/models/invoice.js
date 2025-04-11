const dbModule = require('./db');
const db = dbModule.getDb();

class Invoice {
    // Get all invoices with optional filtering and pagination
    static getAll(options = {}, callback) {
        const { page = 1, limit = 10, search = '', customer = '', product = '', startDate = '', endDate = '' } = options;
        const offset = (page - 1) * limit;

        let params = [];
        let whereClause = [];

        // Add search condition if provided
        if (search) {
            whereClause.push('(customer_name LIKE ? OR invoice_number LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        // Add customer filter if provided
        if (customer) {
            whereClause.push('customer_name LIKE ?');
            params.push(`%${customer}%`);
        }

        // Add date range filter if provided
        if (startDate) {
            whereClause.push('invoice_date >= ?');
            params.push(startDate);
        }

        if (endDate) {
            whereClause.push('invoice_date <= ?');
            params.push(endDate);
        }

        // Build the WHERE clause
        const whereSQL = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

        // First get total count for pagination
        const countSQL = `SELECT COUNT(*) as total FROM invoices ${whereSQL}`;

        db.get(countSQL, params, (err, countRow) => {
            if (err) {
                return callback(err, null);
            }

            const total = countRow.total;
            const totalPages = Math.ceil(total / limit);

            // If product filter is provided, we need to join with invoice_items
            let sql;
            let queryParams;

            if (product) {
                sql = `
                    SELECT DISTINCT i.*
                    FROM invoices i
                    JOIN invoice_items ii ON i.id = ii.invoice_id
                    ${whereSQL ? whereSQL + ' AND' : 'WHERE'} ii.product_name LIKE ?
                    ORDER BY i.id DESC
                    LIMIT ? OFFSET ?
                `;
                queryParams = [...params, `%${product}%`, limit, offset];
            } else {
                sql = `
                    SELECT * FROM invoices
                    ${whereSQL}
                    ORDER BY id DESC
                    LIMIT ? OFFSET ?
                `;
                queryParams = [...params, limit, offset];
            }

            db.all(sql, queryParams, (err, rows) => {
                if (err) {
                    return callback(err, null);
                }

                return callback(null, {
                    data: rows,
                    pagination: {
                        total,
                        totalPages,
                        currentPage: page,
                        limit
                    }
                });
            });
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
        console.log('Creating invoice in database:', invoice);

        // Start a transaction
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            // Insert the invoice
            const invoiceSql = `INSERT INTO invoices
                (customer_name, invoice_date, invoice_number, tax_rate, subtotal, tax_amount, grand_total, currency_symbol)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

            const params = [
                invoice.customer_name,
                invoice.invoice_date,
                invoice.invoice_number,
                invoice.tax_rate,
                invoice.subtotal,
                invoice.tax_amount,
                invoice.grand_total,
                invoice.currency_symbol
            ];

            console.log('SQL:', invoiceSql);
            console.log('Params:', params);

            db.run(invoiceSql, params, function(err) {
                if (err) {
                    console.error('Error inserting invoice:', err);
                    db.run('ROLLBACK');
                    return callback(err, null);
                }

                const invoiceId = this.lastID;
                console.log('Invoice inserted with ID:', invoiceId);

                // If there are no items, commit and return
                if (!invoice.items || invoice.items.length === 0) {
                    console.log('No items to insert, committing transaction');
                    db.run('COMMIT');
                    return callback(null, { id: invoiceId, ...invoice });
                }

                // Prepare statement for inserting items
                const itemSql = `INSERT INTO invoice_items
                    (invoice_id, product_id, product_name, price, quantity, total)
                    VALUES (?, ?, ?, ?, ?, ?)`;

                console.log('Item SQL:', itemSql);
                console.log('Items to insert:', invoice.items);

                const stmt = db.prepare(itemSql);

                // Insert each item
                let itemsProcessed = 0;
                let hasError = false;

                invoice.items.forEach(item => {
                    const itemParams = [
                        invoiceId,
                        item.product_id,
                        item.product_name,
                        item.price,
                        item.quantity,
                        item.total
                    ];

                    console.log('Inserting item:', item);
                    console.log('Item params:', itemParams);

                    stmt.run(itemParams, function(err) {
                        itemsProcessed++;
                        console.log(`Item ${itemsProcessed}/${invoice.items.length} processed`);

                        if (err && !hasError) {
                            console.error('Error inserting item:', err);
                            hasError = true;
                            db.run('ROLLBACK');
                            stmt.finalize();
                            return callback(err, null);
                        }

                        // If all items are processed, commit and return
                        if (itemsProcessed === invoice.items.length && !hasError) {
                            console.log('All items processed successfully, committing transaction');
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

    // Get the highest invoice number
    static getHighestInvoiceNumber(prefix, callback) {
        console.log(`Getting highest invoice number with prefix: ${prefix}`);

        // SQL to extract the numeric part of invoice_number and find the highest
        // Using a more robust approach to handle different formats
        const sql = `
            SELECT invoice_number
            FROM invoices
            WHERE invoice_number LIKE ?
            ORDER BY LENGTH(invoice_number) DESC, invoice_number DESC
            LIMIT 1
        `;

        db.get(sql, [`${prefix}%`], (err, row) => {
            if (err) {
                console.error('Error getting highest invoice number:', err);
                return callback(err, null);
            }

            if (!row) {
                console.log('No invoices found with this prefix');
                // No invoices found with this prefix
                return callback(null, null);
            }

            console.log(`Found highest invoice number: ${row.invoice_number}`);

            // Extract the numeric part from the invoice number using regex
            // This will match any digits after the prefix
            const regex = new RegExp(`^${prefix.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}(\\d+)$`);
            const match = row.invoice_number.match(regex);

            let highestNumber;
            if (match && match[1]) {
                highestNumber = parseInt(match[1], 10);
                console.log(`Extracted numeric part: ${match[1]}, parsed as: ${highestNumber}`);
            } else {
                // Fallback to simple replace if regex doesn't match
                const numericPart = row.invoice_number.replace(prefix, '');
                highestNumber = parseInt(numericPart, 10);
                console.log(`Fallback extraction: ${numericPart}, parsed as: ${highestNumber}`);
            }

            return callback(null, isNaN(highestNumber) ? null : highestNumber);
        });
    }

    // Get invoices grouped by year
    static getByYear(callback) {
        // Improved date format handling
        const sql = `
            SELECT
                CASE
                    WHEN invoice_date LIKE '____-__-__' THEN substr(invoice_date, 1, 4)
                    WHEN invoice_date LIKE '__/__/____' THEN substr(invoice_date, 7, 4)
                    WHEN invoice_date LIKE '__-__-____' THEN substr(invoice_date, 7, 4)
                    WHEN invoice_date LIKE '____/__/__' THEN substr(invoice_date, 1, 4)
                    WHEN invoice_date LIKE '____-__-__' THEN substr(invoice_date, 1, 4)
                    ELSE strftime('%Y', invoice_date)
                END as year,
                COUNT(*) as count,
                SUM(grand_total) as total
            FROM invoices
            GROUP BY year
            ORDER BY year DESC
        `;

        console.log('Executing SQL for yearly history:', sql);

        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('Error getting yearly history:', err);
                return callback(err, null);
            }
            console.log('Yearly history results:', rows);
            return callback(null, rows);
        });
    }

    // Get invoices grouped by month
    static getByMonth(callback) {
        // Improved date format handling
        const sql = `
            SELECT
                CASE
                    WHEN invoice_date LIKE '____-__-__' THEN substr(invoice_date, 1, 7)
                    WHEN invoice_date LIKE '__/__/____' THEN substr(invoice_date, 7, 4) || '-' || substr(invoice_date, 4, 2)
                    WHEN invoice_date LIKE '__-__-____' THEN substr(invoice_date, 7, 4) || '-' || substr(invoice_date, 4, 2)
                    WHEN invoice_date LIKE '____/__/__' THEN substr(invoice_date, 1, 4) || '-' || substr(invoice_date, 6, 2)
                    WHEN invoice_date LIKE '____-__-__' THEN substr(invoice_date, 1, 7)
                    ELSE strftime('%Y-%m', invoice_date)
                END as month,
                COUNT(*) as count,
                SUM(grand_total) as total
            FROM invoices
            GROUP BY month
            ORDER BY month DESC
        `;

        console.log('Executing SQL for monthly history:', sql);

        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('Error getting monthly history:', err);
                return callback(err, null);
            }
            console.log('Monthly history results:', rows);
            return callback(null, rows);
        });
    }

    // Get invoices grouped by week
    static getByWeek(callback) {
        // Improved date format handling for weekly grouping
        const sql = `
            SELECT
                CASE
                    WHEN invoice_date LIKE '____-__-__' THEN substr(invoice_date, 1, 7) || '-W' || (cast(substr(invoice_date, 9, 2) as integer) / 7 + 1)
                    WHEN invoice_date LIKE '__/__/____' THEN substr(invoice_date, 7, 4) || '-' || substr(invoice_date, 4, 2) || '-W' || (cast(substr(invoice_date, 1, 2) as integer) / 7 + 1)
                    WHEN invoice_date LIKE '__-__-____' THEN substr(invoice_date, 7, 4) || '-' || substr(invoice_date, 4, 2) || '-W' || (cast(substr(invoice_date, 1, 2) as integer) / 7 + 1)
                    WHEN invoice_date LIKE '____/__/__' THEN substr(invoice_date, 1, 4) || '-' || substr(invoice_date, 6, 2) || '-W' || (cast(substr(invoice_date, 9, 2) as integer) / 7 + 1)
                    ELSE strftime('%Y-%m-W%W', invoice_date)
                END as week,
                MIN(invoice_date) as week_start,
                COUNT(*) as count,
                SUM(grand_total) as total
            FROM invoices
            GROUP BY week
            ORDER BY week DESC
        `;

        console.log('Executing SQL for weekly history:', sql);

        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('Error getting weekly history:', err);
                return callback(err, null);
            }
            console.log('Weekly history results:', rows);
            return callback(null, rows);
        });
    }

    // Get invoices grouped by day
    static getByDay(callback) {
        const sql = `
            SELECT
                invoice_date as day,
                COUNT(*) as count,
                SUM(grand_total) as total
            FROM invoices
            GROUP BY day
            ORDER BY day DESC
        `;

        console.log('Executing SQL for daily history:', sql);

        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('Error getting daily history:', err);
                return callback(err, null);
            }
            console.log('Daily history results:', rows);
            return callback(null, rows);
        });
    }

    // Get invoices for a specific time period
    static getByPeriod(period, value, callback) {
        let sql;
        let params = [];

        switch(period) {
            case 'year':
                sql = 'SELECT * FROM invoices WHERE strftime("%Y", invoice_date) = ? ORDER BY invoice_date DESC';
                params = [value];
                break;
            case 'month':
                sql = 'SELECT * FROM invoices WHERE strftime("%Y-%m", invoice_date) = ? ORDER BY invoice_date DESC';
                params = [value];
                break;
            case 'week':
                sql = 'SELECT * FROM invoices WHERE strftime("%Y-%W", invoice_date) = ? ORDER BY invoice_date DESC';
                params = [value];
                break;
            case 'day':
                sql = 'SELECT * FROM invoices WHERE invoice_date = ? ORDER BY id DESC';
                params = [value];
                break;
            default:
                return callback(new Error('Invalid period specified'), null);
        }

        db.all(sql, params, (err, rows) => {
            if (err) {
                return callback(err, null);
            }
            return callback(null, rows);
        });
    }

    // Get most ordered products with pagination and search
    static getMostOrderedProducts(options = {}, callback) {
        const { page = 1, limit = 10, search = '' } = options;
        const offset = (page - 1) * limit;

        // First get total count for pagination
        let countSQL = `
            SELECT COUNT(*) as total FROM (
                SELECT
                    product_id,
                    product_name
                FROM
                    invoice_items
                ${search ? 'WHERE product_name LIKE ?' : ''}
                GROUP BY
                    product_id, product_name
            )
        `;

        const countParams = search ? [`%${search}%`] : [];

        db.get(countSQL, countParams, (err, countRow) => {
            if (err) {
                return callback(err, null);
            }

            const total = countRow.total;
            const totalPages = Math.ceil(total / limit);

            // Now get the actual data
            const sql = `
                SELECT
                    product_id,
                    product_name,
                    SUM(quantity) as total_quantity,
                    COUNT(DISTINCT invoice_id) as invoice_count,
                    MAX(invoice_date) as last_ordered
                FROM
                    invoice_items
                JOIN
                    invoices ON invoice_items.invoice_id = invoices.id
                ${search ? 'WHERE product_name LIKE ?' : ''}
                GROUP BY
                    product_id, product_name
                ORDER BY
                    total_quantity DESC
                LIMIT ? OFFSET ?;
            `;

            const params = search ? [`%${search}%`, limit, offset] : [limit, offset];

            db.all(sql, params, (err, rows) => {
                if (err) {
                    return callback(err, null);
                }
                return callback(null, {
                    data: rows,
                    pagination: {
                        total,
                        totalPages,
                        currentPage: page,
                        limit
                    }
                });
            });
        });
    }
}

module.exports = Invoice;
