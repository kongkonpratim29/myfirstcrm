const { pool } = require('../config/database');

// @route   GET /api/companies
// @desc    Get all companies
// @access  Private
const getCompanies = async (req, res) => {
  try {
    const { search, industry, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, u.firstName as createdByFirstName, u.lastName as createdByLastName
      FROM companies c
      LEFT JOIN users u ON c.createdBy = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (c.name LIKE ? OR c.industry LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (industry) {
      query += ` AND c.industry = ?`;
      params.push(industry);
    }

    query += ` ORDER BY c.createdAt DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [companies] = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM companies WHERE 1=1';
    const countParams = [];
    
    if (search) {
      countQuery += ` AND (name LIKE ? OR industry LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (industry) {
      countQuery += ` AND industry = ?`;
      countParams.push(industry);
    }

    const [countResult] = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: companies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total
      }
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   GET /api/companies/:id
// @desc    Get single company
// @access  Private
const getCompany = async (req, res) => {
  try {
    const [companies] = await pool.query(
      `SELECT c.*, u.firstName as createdByFirstName, u.lastName as createdByLastName
       FROM companies c
       LEFT JOIN users u ON c.createdBy = u.id
       WHERE c.id = ?`,
      [req.params.id]
    );

    if (companies.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Get associated contacts
    const [contacts] = await pool.query(
      'SELECT * FROM contacts WHERE companyId = ?',
      [req.params.id]
    );

    // Get associated deals
    const [deals] = await pool.query(
      'SELECT * FROM deals WHERE companyId = ?',
      [req.params.id]
    );

    // Get activities
    const [activities] = await pool.query(
      `SELECT a.*, u.firstName, u.lastName
       FROM activities a
       LEFT JOIN users u ON a.createdBy = u.id
       WHERE a.relatedTo = ? AND a.relatedType = 'Company'
       ORDER BY a.createdAt DESC
       LIMIT 20`,
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        ...companies[0],
        contacts,
        deals,
        activities
      }
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   POST /api/companies
// @desc    Create company
// @access  Private
const createCompany = async (req, res) => {
  try {
    const { name, industry, website, address, phone, email, employeeCount } = req.body;

    const [result] = await pool.query(
      `INSERT INTO companies (name, industry, website, address, phone, email, employeeCount, createdBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, industry, website, address, phone, email, employeeCount, req.user.id]
    );

    // Log activity
    await pool.query(
      `INSERT INTO activities (type, description, relatedTo, relatedType, createdBy)
       VALUES ('Note', ?, ?, 'Company', ?)`,
      [`Company created: ${name}`, result.insertId, req.user.id]
    );

    const [companies] = await pool.query('SELECT * FROM companies WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: companies[0]
    });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   PUT /api/companies/:id
// @desc    Update company
// @access  Private
const updateCompany = async (req, res) => {
  try {
    const { name, industry, website, address, phone, email, employeeCount } = req.body;

    const [result] = await pool.query(
      `UPDATE companies 
       SET name = ?, industry = ?, website = ?, address = ?, phone = ?, email = ?, employeeCount = ?
       WHERE id = ?`,
      [name, industry, website, address, phone, email, employeeCount, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Log activity
    await pool.query(
      `INSERT INTO activities (type, description, relatedTo, relatedType, createdBy)
       VALUES ('Note', ?, ?, 'Company', ?)`,
      [`Company updated: ${name}`, req.params.id, req.user.id]
    );

    const [companies] = await pool.query('SELECT * FROM companies WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Company updated successfully',
      data: companies[0]
    });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   DELETE /api/companies/:id
// @desc    Delete company
// @access  Private
const deleteCompany = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM companies WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    res.json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany
};
