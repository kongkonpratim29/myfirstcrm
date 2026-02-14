const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getContacts, getContact, createContact, updateContact, deleteContact } = require('../controllers/contactController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Validation rules
const contactValidation = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').optional().isEmail().withMessage('Please provide a valid email')
];

// All routes require authentication
router.use(auth);

// @route   GET /api/contacts
router.get('/', getContacts);

// @route   GET /api/contacts/:id
router.get('/:id', getContact);

// @route   POST /api/contacts
router.post('/', contactValidation, validate, createContact);

// @route   PUT /api/contacts/:id
router.put('/:id', contactValidation, validate, updateContact);

// @route   DELETE /api/contacts/:id
router.delete('/:id', deleteContact);

module.exports = router;
