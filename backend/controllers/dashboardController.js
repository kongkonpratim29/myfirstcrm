const { pool } = require('../config/database');

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    // Total counts
    const [contactsCount] = await pool.query('SELECT COUNT(*) as count FROM contacts');
    const [companiesCount] = await pool.query('SELECT COUNT(*) as count FROM companies');
    const [dealsCount] = await pool.query('SELECT COUNT(*) as count FROM deals');
    const [tasksCount] = await pool.query('SELECT COUNT(*) as count FROM tasks WHERE status != "Completed"');

    // Deal pipeline value by stage
    const [dealsByStage] = await pool.query(`
      SELECT stage, COUNT(*) as count, SUM(value) as totalValue
      FROM deals
      GROUP BY stage
    `);

    // Conversion from confirmed deal to paid deal.
    const [confirmedDeals] = await pool.query('SELECT COUNT(*) as count FROM deals WHERE stage = "Deal Confirmed"');
    const [paidDeals] = await pool.query('SELECT COUNT(*) as count FROM deals WHERE stage = "Payment Received"');
    const conversionRate = confirmedDeals[0].count > 0
      ? (paidDeals[0].count / confirmedDeals[0].count * 100).toFixed(2)
      : 0;

    // Recent activities
    const [recentActivities] = await pool.query(`
      SELECT a.*, u.firstName, u.lastName
      FROM activities a
      LEFT JOIN users u ON a.createdBy = u.id
      ORDER BY a.createdAt DESC
      LIMIT 10
    `);

    // Upcoming tasks
    const [upcomingTasks] = await pool.query(`
      SELECT t.*, u.firstName, u.lastName
      FROM tasks t
      LEFT JOIN users u ON t.assignedTo = u.id
      WHERE t.status != 'Completed' AND t.dueDate >= CURDATE()
      ORDER BY t.dueDate ASC
      LIMIT 10
    `);

    // Top performing closed/completed deals
    const [topDeals] = await pool.query(`
      SELECT d.*, c.name as companyName
      FROM deals d
      LEFT JOIN companies c ON d.companyId = c.id
      WHERE d.stage IN ('Payment Received', 'Project Completed', 'Closed')
      ORDER BY d.value DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        counts: {
          contacts: contactsCount[0].count,
          companies: companiesCount[0].count,
          deals: dealsCount[0].count,
          tasks: tasksCount[0].count
        },
        dealsPipeline: dealsByStage,
        conversionRate,
        recentActivities,
        upcomingTasks,
        topDeals
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getDashboardStats
};
