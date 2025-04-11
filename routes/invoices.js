const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

// GET all invoices
router.get('/', invoiceController.getAllInvoices);

// GET next invoice number
router.get('/next-number', invoiceController.getNextInvoiceNumber);

// GET invoice history routes
router.get('/history/year', invoiceController.getInvoicesByYear);
router.get('/history/month', invoiceController.getInvoicesByMonth);
router.get('/history/week', invoiceController.getInvoicesByWeek);
router.get('/history/day', invoiceController.getInvoicesByDay);

// GET invoices for a specific period
router.get('/history/:period/:value', invoiceController.getInvoicesByPeriod);

// GET most ordered products
router.get('/stats/most-ordered', invoiceController.getMostOrderedProducts);

// GET export invoices
router.get('/export', invoiceController.exportInvoices);

// GET a single invoice - must be after other specific routes
router.get('/:id', invoiceController.getInvoiceById);

// POST create a new invoice
router.post('/', invoiceController.createInvoice);

// DELETE an invoice
router.delete('/:id', invoiceController.deleteInvoice);

module.exports = router;
