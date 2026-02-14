const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice, generateInvoicePDF } = require('../controllers/invoiceController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Validation rules
const invoiceValidation = [
  body('date').notEmpty().withMessage('Invoice date is required'),
  body('dueDate').notEmpty().withMessage('Due date is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required')
];

// All routes require authentication
router.use(auth);

// @route   GET /api/invoices
router.get('/', getInvoices);

// @route   GET /api/invoices/:id
router.get('/:id', getInvoice);

// @route   GET /api/invoices/:id/pdf
router.get('/:id/pdf', generateInvoicePDF);

// @route   POST /api/invoices
router.post('/', invoiceValidation, validate, createInvoice);

// @route   PUT /api/invoices/:id
router.put('/:id', invoiceValidation, validate, updateInvoice);

// @route   DELETE /api/invoices/:id
router.delete('/:id', deleteInvoice);

module.exports = router;
