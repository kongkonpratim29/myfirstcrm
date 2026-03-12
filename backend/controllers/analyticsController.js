const { pool } = require('../config/database');

// @route   GET /api/analytics/deal-trends
// @desc    Get deal trends over time (monthly)
// @access  Private
const getDealTrends = async (req, res) => {
  try {
    const { period = '12' } = req.query;
    const months = Math.min(parseInt(period, 10) || 12, 24);

    const [dealTrends] = await pool.query(`
      SELECT 
        DATE_FORMAT(createdAt, '%Y-%m') as month,
        COUNT(*) as totalDeals,
        SUM(value) as totalValue,
        AVG(value) as avgValue
      FROM deals
      WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
      GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
      ORDER BY month ASC
    `, [months]);

    const [dealsByStage] = await pool.query(`
      SELECT 
        DATE_FORMAT(createdAt, '%Y-%m') as month,
        stage,
        COUNT(*) as count
      FROM deals
      WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
      GROUP BY DATE_FORMAT(createdAt, '%Y-%m'), stage
      ORDER BY month ASC
    `, [months]);

    res.json({
      success: true,
      data: { dealTrends, dealsByStage }
    });
  } catch (error) {
    console.error('Get deal trends error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   GET /api/analytics/customer-behavior
// @desc    Get customer behavior analytics
// @access  Private
const getCustomerBehavior = async (req, res) => {
  try {
    // Contacts added per month
    const [contactGrowth] = await pool.query(`
      SELECT 
        DATE_FORMAT(createdAt, '%Y-%m') as month,
        COUNT(*) as newContacts
      FROM contacts
      WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
      ORDER BY month ASC
    `);

    // Companies by industry
    const [companiesByIndustry] = await pool.query(`
      SELECT 
        COALESCE(industry, 'Unknown') as industry,
        COUNT(*) as count
      FROM companies
      GROUP BY industry
      ORDER BY count DESC
      LIMIT 10
    `);

    // Top companies by deal value
    const [topCompaniesByDeals] = await pool.query(`
      SELECT 
        c.name as companyName,
        COUNT(d.id) as dealCount,
        SUM(d.value) as totalValue
      FROM companies c
      INNER JOIN deals d ON d.companyId = c.id
      GROUP BY c.id, c.name
      ORDER BY totalValue DESC
      LIMIT 10
    `);

    // Activity types distribution
    const [activityDistribution] = await pool.query(`
      SELECT 
        type,
        COUNT(*) as count
      FROM activities
      GROUP BY type
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      data: {
        contactGrowth,
        companiesByIndustry,
        topCompaniesByDeals,
        activityDistribution
      }
    });
  } catch (error) {
    console.error('Get customer behavior error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   GET /api/analytics/pipeline
// @desc    Get deal pipeline analytics
// @access  Private
const getPipelineAnalytics = async (req, res) => {
  try {
    // Current pipeline snapshot
    const [pipelineSnapshot] = await pool.query(`
      SELECT 
        stage,
        COUNT(*) as count,
        SUM(value) as totalValue,
        AVG(value) as avgValue
      FROM deals
      GROUP BY stage
      ORDER BY FIELD(stage,
        'New Lead', 'Initial Contact', 'Requirement Discussion',
        'Proposal / Quotation Sent', 'Follow-up / Re-approach',
        'Deal Confirmed', 'Invoice Sent', 'Payment Pending',
        'Payment Received', 'Work in Progress',
        'Client Feedback / Revision', 'Project Completed', 'Closed')
    `);

    // Win/loss rate
    const [winLossData] = await pool.query(`
      SELECT 
        CASE 
          WHEN stage IN ('Payment Received', 'Project Completed') THEN 'Won'
          WHEN stage = 'Closed' THEN 'Lost'
          ELSE 'Open'
        END as outcome,
        COUNT(*) as count,
        SUM(value) as totalValue
      FROM deals
      GROUP BY outcome
    `);

    // Average deal cycle time (days from creation to Payment Received)
    const [avgCycleTime] = await pool.query(`
      SELECT 
        AVG(DATEDIFF(updatedAt, createdAt)) as avgDays
      FROM deals
      WHERE stage IN ('Payment Received', 'Project Completed')
    `);

    // Monthly conversion (deals reaching Payment Received)
    const [monthlyConversions] = await pool.query(`
      SELECT 
        DATE_FORMAT(updatedAt, '%Y-%m') as month,
        COUNT(*) as conversions,
        SUM(value) as convertedValue
      FROM deals
      WHERE stage IN ('Payment Received', 'Project Completed')
        AND updatedAt >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(updatedAt, '%Y-%m')
      ORDER BY month ASC
    `);

    res.json({
      success: true,
      data: {
        pipelineSnapshot,
        winLossData,
        avgCycleTime: avgCycleTime[0]?.avgDays || 0,
        monthlyConversions
      }
    });
  } catch (error) {
    console.error('Get pipeline analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   GET /api/analytics/summary
// @desc    Get overall analytics summary
// @access  Private
const getAnalyticsSummary = async (req, res) => {
  try {
    const [totalRevenue] = await pool.query(`
      SELECT SUM(value) as revenue FROM deals 
      WHERE stage IN ('Payment Received', 'Project Completed')
    `);

    const [totalPipelineValue] = await pool.query(`
      SELECT SUM(value) as pipelineValue FROM deals 
      WHERE stage NOT IN ('Closed', 'Payment Received', 'Project Completed')
    `);

    const [thisMonthDeals] = await pool.query(`
      SELECT COUNT(*) as count, SUM(value) as value FROM deals
      WHERE DATE_FORMAT(createdAt, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
    `);

    const [lastMonthDeals] = await pool.query(`
      SELECT COUNT(*) as count, SUM(value) as value FROM deals
      WHERE DATE_FORMAT(createdAt, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m')
    `);

    const [thisMonthContacts] = await pool.query(`
      SELECT COUNT(*) as count FROM contacts
      WHERE DATE_FORMAT(createdAt, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
    `);

    const [lastMonthContacts] = await pool.query(`
      SELECT COUNT(*) as count FROM contacts
      WHERE DATE_FORMAT(createdAt, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m')
    `);

    // Task completion rate
    const [taskStats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed
      FROM tasks
    `);

    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenue[0]?.revenue || 0,
        totalPipelineValue: totalPipelineValue[0]?.pipelineValue || 0,
        thisMonth: {
          deals: thisMonthDeals[0]?.count || 0,
          dealsValue: thisMonthDeals[0]?.value || 0,
          contacts: thisMonthContacts[0]?.count || 0
        },
        lastMonth: {
          deals: lastMonthDeals[0]?.count || 0,
          dealsValue: lastMonthDeals[0]?.value || 0,
          contacts: lastMonthContacts[0]?.count || 0
        },
        taskCompletionRate: taskStats[0]?.total > 0
          ? ((taskStats[0]?.completed / taskStats[0]?.total) * 100).toFixed(1)
          : 0
      }
    });
  } catch (error) {
    console.error('Get analytics summary error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getDealTrends,
  getCustomerBehavior,
  getPipelineAnalytics,
  getAnalyticsSummary
};
