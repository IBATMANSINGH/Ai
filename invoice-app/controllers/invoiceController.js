const Invoice = require('../models/invoice');
const Setting = require('../models/setting');

// Get next invoice number
exports.getNextInvoiceNumber = (req, res) => {
    Setting.getAll((settingErr, settings) => {
        if (settingErr) {
            return res.status(500).json({ error: settingErr.message });
        }

        // Get prefix and starting number from settings
        const prefix = settings ? settings.invoice_prefix : 'INV-';
        const startingNumber = settings ? settings.invoice_starting_number : 1000;

        // Get the highest invoice number from the database
        Invoice.getHighestInvoiceNumber(prefix, (err, highestNumber) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // If no invoices exist yet, use the starting number from settings
            // Otherwise, increment the highest number by 1
            let nextNumber;
            if (highestNumber === null) {
                nextNumber = startingNumber;
            } else {
                nextNumber = highestNumber + 1;
            }

            res.json({ nextInvoiceNumber: `${prefix}${nextNumber}`, numericPart: nextNumber });
        });
    });
};

// Get all invoices with filtering, search and pagination
exports.getAllInvoices = (req, res) => {
    // Extract query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const customer = req.query.customer || '';
    const product = req.query.product || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';

    const options = { page, limit, search, customer, product, startDate, endDate };

    Invoice.getAll(options, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(result);
    });
};

// Get a single invoice by ID
exports.getInvoiceById = (req, res) => {
    const id = req.params.id;

    Invoice.getById(id, (err, invoice) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        res.json(invoice);
    });
};

// Create a new invoice
exports.createInvoice = (req, res) => {
    console.log('Creating invoice with data:', req.body);

    // Validate request
    if (!req.body.invoice_number || !req.body.invoice_date) {
        console.log('Validation failed: Missing invoice number or date');
        return res.status(400).json({ error: 'Invoice number and date are required' });
    }

    // Get settings for default values
    Setting.getAll((settingErr, settings) => {
        if (settingErr) {
            console.error('Error getting settings:', settingErr);
            return res.status(500).json({ error: settingErr.message });
        }

        // Get default tax rate from settings
        const defaultTaxRate = settings && settings.tax_enabled ? settings.tax_rate : 0;
        console.log(`Default tax rate from settings: ${defaultTaxRate}`);

        // Prepare invoice object
        const invoice = {
            customer_name: req.body.customer_name || 'N/A',
            invoice_date: req.body.invoice_date,
            invoice_number: req.body.invoice_number,
            tax_rate: parseFloat(req.body.tax_rate) || defaultTaxRate,
            subtotal: parseFloat(req.body.subtotal) || 0,
            tax_amount: parseFloat(req.body.tax_amount) || 0,
            grand_total: parseFloat(req.body.grand_total) || 0,
            currency_symbol: settings ? settings.currency_symbol : '₹',
            items: req.body.items || []
        };

        console.log(`Using tax rate: ${invoice.tax_rate}%`);

        console.log('Prepared invoice object:', invoice);

        Invoice.create(invoice, (err, newInvoice) => {
            if (err) {
                console.error('Error creating invoice:', err);
                return res.status(500).json({ error: err.message });
            }
            console.log('Invoice created successfully:', newInvoice);
            res.status(201).json(newInvoice);
        });
    });
};

// Delete an invoice
exports.deleteInvoice = (req, res) => {
    const id = req.params.id;

    Invoice.delete(id, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Invoice deleted successfully' });
    });
};

// Get invoices grouped by year
exports.getInvoicesByYear = (req, res) => {
    Invoice.getByYear((err, data) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(data);
    });
};

// Get invoices grouped by month
exports.getInvoicesByMonth = (req, res) => {
    Invoice.getByMonth((err, data) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(data);
    });
};

// Get invoices grouped by week
exports.getInvoicesByWeek = (req, res) => {
    Invoice.getByWeek((err, data) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(data);
    });
};

// Get invoices grouped by day
exports.getInvoicesByDay = (req, res) => {
    Invoice.getByDay((err, data) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(data);
    });
};

// Get invoices for a specific period
exports.getInvoicesByPeriod = (req, res) => {
    const { period, value } = req.params;

    if (!period || !value) {
        return res.status(400).json({ error: 'Period and value are required' });
    }

    Invoice.getByPeriod(period, value, (err, data) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(data);
    });
};

// Get most ordered products with pagination and search
exports.getMostOrderedProducts = (req, res) => {
    // Extract query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const options = { page, limit, search };

    Invoice.getMostOrderedProducts(options, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(result);
    });
};

// Export invoice data
exports.exportInvoices = (req, res) => {
    // Extract query parameters for filtering
    const search = req.query.search || '';
    const customer = req.query.customer || '';
    const product = req.query.product || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';
    const period = req.query.period || '';
    const value = req.query.value || '';
    const format = req.query.format || 'csv'; // csv or excel

    // Function to process and send the data
    const processExport = (invoices) => {
        if (!invoices || invoices.length === 0) {
            return res.status(404).json({ error: 'No invoices found to export' });
        }

        // Prepare data for export
        const exportData = invoices.map(invoice => ({
            'Invoice Number': invoice.invoice_number,
            'Date': invoice.invoice_date,
            'Customer': invoice.customer_name || 'N/A',
            'Subtotal': invoice.subtotal,
            'Tax Rate': invoice.tax_rate + '%',
            'Tax Amount': invoice.tax_amount,
            'Grand Total': invoice.grand_total,
            'Currency': invoice.currency_symbol
        }));

        // Set response headers based on format
        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=invoices.csv');

            // Create CSV content
            const headers = Object.keys(exportData[0]).join(',');
            const rows = exportData.map(row =>
                Object.values(row).map(value =>
                    `"${value}"`
                ).join(',')
            ).join('\n');

            res.send(`${headers}\n${rows}`);
        } else {
            // For Excel, we'll send JSON that the client will convert to Excel
            res.json({
                success: true,
                data: exportData,
                filename: 'invoices.xlsx'
            });
        }
    };

    // Determine which data to export based on parameters
    if (period && value) {
        // Export data for a specific period
        Invoice.getByPeriod(period, value, (err, invoices) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            processExport(invoices);
        });
    } else {
        // Export filtered data
        const options = {
            page: 1,
            limit: 1000, // Export up to 1000 invoices
            search,
            customer,
            product,
            startDate,
            endDate
        };

        Invoice.getAll(options, (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            processExport(result.data);
        });
    }
};
