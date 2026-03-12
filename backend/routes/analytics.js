const express = require('express');
const router = express.Router();
const {
  getDealTrends,
  getCustomerBehavior,
  getPipelineAnalytics,
  getAnalyticsSummary
} = require('../controllers/analyticsController');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// @route   GET /api/analytics/summary
router.get('/summary', getAnalyticsSummary);

// @route   GET /api/analytics/deal-trends
router.get('/deal-trends', getDealTrends);

// @route   GET /api/analytics/customer-behavior
router.get('/customer-behavior', getCustomerBehavior);

// @route   GET /api/analytics/pipeline
router.get('/pipeline', getPipelineAnalytics);

module.exports = router;
