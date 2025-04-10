const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

// GET all invoices
router.get('/', invoiceController.getAllInvoices);

// GET a single invoice
router.get('/:id', invoiceController.getInvoiceById);

// POST create a new invoice
router.post('/', invoiceController.createInvoice);

// DELETE an invoice
router.delete('/:id', invoiceController.deleteInvoice);

module.exports = router;
