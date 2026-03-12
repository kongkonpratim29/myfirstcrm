const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getDeals, getDeal, createDeal, updateDeal, deleteDeal } = require('../controllers/dealController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Validation rules
const dealValidation = [
  body('title').notEmpty().withMessage('Deal title is required'),
  body('value').optional().isNumeric().withMessage('Deal value must be a number')
];

// All routes require authentication
router.use(auth);

// @route   GET /api/deals
router.get('/', getDeals);

// @route   GET /api/deals/:id
router.get('/:id', getDeal);

// @route   POST /api/deals
router.post('/', dealValidation, validate, createDeal);

// @route   PUT /api/deals/:id
router.put('/:id', dealValidation, validate, updateDeal);

// @route   DELETE /api/deals/:id
router.delete('/:id', deleteDeal);

module.exports = router;
