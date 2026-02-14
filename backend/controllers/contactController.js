const { pool } = require('../config/database');

// @route   GET /api/contacts
// @desc    Get all contacts
// @access  Private
const getContacts = async (req, res) => {
  try {
    const { search, companyId, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, comp.name as companyName,
             u.firstName as createdByFirstName, u.lastName as createdByLastName
      FROM contacts c
      LEFT JOIN companies comp ON c.companyId = comp.id
      LEFT JOIN users u ON c.createdBy = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (c.firstName LIKE ? OR c.lastName LIKE ? OR c.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (companyId) {
      query += ` AND c.companyId = ?`;
      params.push(companyId);
    }

    query += ` ORDER BY c.createdAt DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [contacts] = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM contacts WHERE 1=1';
    const countParams = [];
    
    if (search) {
      countQuery += ` AND (firstName LIKE ? OR lastName LIKE ? OR email LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (companyId) {
      countQuery += ` AND companyId = ?`;
      countParams.push(companyId);
    }

    const [countResult] = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   GET /api/contacts/:id
// @desc    Get single contact
// @access  Private
const getContact = async (req, res) => {
  try {
    const [contacts] = await pool.query(
      `SELECT c.*, comp.name as companyName,
              u.firstName as createdByFirstName, u.lastName as createdByLastName
       FROM contacts c
       LEFT JOIN companies comp ON c.companyId = comp.id
       LEFT JOIN users u ON c.createdBy = u.id
       WHERE c.id = ?`,
      [req.params.id]
    );

    if (contacts.length === 0) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    // Get activities for this contact
    const [activities] = await pool.query(
      `SELECT a.*, u.firstName, u.lastName
       FROM activities a
       LEFT JOIN users u ON a.createdBy = u.id
       WHERE a.relatedTo = ? AND a.relatedType = 'Contact'
       ORDER BY a.createdAt DESC
       LIMIT 20`,
      [req.params.id]
    );

    res.json({
      success: true,
      data: { ...contacts[0], activities }
    });
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   POST /api/contacts
// @desc    Create contact
// @access  Private
const createContact = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, position, companyId, address, notes } = req.body;

    const [result] = await pool.query(
      `INSERT INTO contacts (firstName, lastName, email, phone, position, companyId, address, notes, createdBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, email, phone, position, companyId, address, notes, req.user.id]
    );

    // Log activity
    await pool.query(
      `INSERT INTO activities (type, description, relatedTo, relatedType, createdBy)
       VALUES ('Note', ?, ?, 'Contact', ?)`,
      [`Contact created: ${firstName} ${lastName}`, result.insertId, req.user.id]
    );

    const [contacts] = await pool.query('SELECT * FROM contacts WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      data: contacts[0]
    });
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   PUT /api/contacts/:id
// @desc    Update contact
// @access  Private
const updateContact = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, position, companyId, address, notes } = req.body;

    const [result] = await pool.query(
      `UPDATE contacts 
       SET firstName = ?, lastName = ?, email = ?, phone = ?, position = ?, 
           companyId = ?, address = ?, notes = ?
       WHERE id = ?`,
      [firstName, lastName, email, phone, position, companyId, address, notes, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    // Log activity
    await pool.query(
      `INSERT INTO activities (type, description, relatedTo, relatedType, createdBy)
       VALUES ('Note', ?, ?, 'Contact', ?)`,
      [`Contact updated: ${firstName} ${lastName}`, req.params.id, req.user.id]
    );

    const [contacts] = await pool.query('SELECT * FROM contacts WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: contacts[0]
    });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   DELETE /api/contacts/:id
// @desc    Delete contact
// @access  Private
const deleteContact = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM contacts WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact
};
