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

    // Deal conversion rates
    const [wonDeals] = await pool.query('SELECT COUNT(*) as count FROM deals WHERE stage = "Closed Won"');
    const [lostDeals] = await pool.query('SELECT COUNT(*) as count FROM deals WHERE stage = "Closed Lost"');
    const totalClosedDeals = wonDeals[0].count + lostDeals[0].count;
    const conversionRate = totalClosedDeals > 0 ? (wonDeals[0].count / totalClosedDeals * 100).toFixed(2) : 0;

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

    // Revenue analytics
    const [paidInvoices] = await pool.query(`
      SELECT SUM(total) as totalRevenue, COUNT(*) as count
      FROM invoices
      WHERE status = 'Paid'
    `);

    const [pendingInvoices] = await pool.query(`
      SELECT SUM(total) as totalPending, COUNT(*) as count
      FROM invoices
      WHERE status = 'Sent'
    `);

    const [overdueInvoices] = await pool.query(`
      SELECT SUM(total) as totalOverdue, COUNT(*) as count
      FROM invoices
      WHERE status = 'Overdue'
    `);

    // Monthly revenue
    const [monthlyRevenue] = await pool.query(`
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        SUM(total) as revenue
      FROM invoices
      WHERE status = 'Paid'
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `);

    // Top performing deals
    const [topDeals] = await pool.query(`
      SELECT d.*, c.name as companyName
      FROM deals d
      LEFT JOIN companies c ON d.companyId = c.id
      WHERE d.stage = 'Closed Won'
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
        revenue: {
          total: paidInvoices[0].totalRevenue || 0,
          totalInvoices: paidInvoices[0].count || 0,
          pending: pendingInvoices[0].totalPending || 0,
          pendingInvoices: pendingInvoices[0].count || 0,
          overdue: overdueInvoices[0].totalOverdue || 0,
          overdueInvoices: overdueInvoices[0].count || 0,
          monthly: monthlyRevenue
        },
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
