const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getCompanies, getCompany, createCompany, updateCompany, deleteCompany } = require('../controllers/companyController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Validation rules
const companyValidation = [
  body('name').notEmpty().withMessage('Company name is required'),
  body('email').optional().isEmail().withMessage('Please provide a valid email')
];

// All routes require authentication
router.use(auth);

// @route   GET /api/companies
router.get('/', getCompanies);

// @route   GET /api/companies/:id
router.get('/:id', getCompany);

// @route   POST /api/companies
router.post('/', companyValidation, validate, createCompany);

// @route   PUT /api/companies/:id
router.put('/:id', companyValidation, validate, updateCompany);

// @route   DELETE /api/companies/:id
router.delete('/:id', deleteCompany);

module.exports = router;
