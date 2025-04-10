const Invoice = require('../models/invoice');

// Get all invoices
exports.getAllInvoices = (req, res) => {
    Invoice.getAll((err, invoices) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(invoices);
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
    // Validate request
    if (!req.body.invoice_number || !req.body.invoice_date) {
        return res.status(400).json({ error: 'Invoice number and date are required' });
    }

    // Prepare invoice object
    const invoice = {
        customer_name: req.body.customer_name || 'N/A',
        invoice_date: req.body.invoice_date,
        invoice_number: req.body.invoice_number,
        tax_rate: parseFloat(req.body.tax_rate) || 10,
        subtotal: parseFloat(req.body.subtotal) || 0,
        tax_amount: parseFloat(req.body.tax_amount) || 0,
        grand_total: parseFloat(req.body.grand_total) || 0,
        items: req.body.items || []
    };

    Invoice.create(invoice, (err, newInvoice) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json(newInvoice);
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
