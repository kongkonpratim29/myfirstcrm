const { pool } = require('../config/database');

// @route   GET /api/activities
// @desc    Get activities
// @access  Private
const getActivities = async (req, res) => {
  try {
    const { relatedTo, relatedType, type, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT a.*, u.firstName, u.lastName
      FROM activities a
      LEFT JOIN users u ON a.createdBy = u.id
      WHERE 1=1
    `;
    const params = [];

    if (relatedTo && relatedType) {
      query += ` AND a.relatedTo = ? AND a.relatedType = ?`;
      params.push(relatedTo, relatedType);
    }

    if (type) {
      query += ` AND a.type = ?`;
      params.push(type);
    }

    query += ` ORDER BY a.createdAt DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [activities] = await pool.query(query, params);

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   POST /api/activities
// @desc    Create activity
// @access  Private
const createActivity = async (req, res) => {
  try {
    const { type, description, relatedTo, relatedType } = req.body;

    const [result] = await pool.query(
      `INSERT INTO activities (type, description, relatedTo, relatedType, createdBy)
       VALUES (?, ?, ?, ?, ?)`,
      [type, description, relatedTo, relatedType, req.user.id]
    );

    const [activities] = await pool.query(
      `SELECT a.*, u.firstName, u.lastName
       FROM activities a
       LEFT JOIN users u ON a.createdBy = u.id
       WHERE a.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: activities[0]
    });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   GET /api/notes
// @desc    Get notes
// @access  Private
const getNotes = async (req, res) => {
  try {
    const { relatedTo, relatedType } = req.query;

    let query = `
      SELECT n.*, u.firstName, u.lastName
      FROM notes n
      LEFT JOIN users u ON n.createdBy = u.id
      WHERE 1=1
    `;
    const params = [];

    if (relatedTo && relatedType) {
      query += ` AND n.relatedTo = ? AND n.relatedType = ?`;
      params.push(relatedTo, relatedType);
    }

    query += ` ORDER BY n.createdAt DESC`;

    const [notes] = await pool.query(query, params);

    res.json({
      success: true,
      data: notes
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   POST /api/notes
// @desc    Create note
// @access  Private
const createNote = async (req, res) => {
  try {
    const { content, relatedTo, relatedType } = req.body;

    const [result] = await pool.query(
      `INSERT INTO notes (content, relatedTo, relatedType, createdBy)
       VALUES (?, ?, ?, ?)`,
      [content, relatedTo, relatedType, req.user.id]
    );

    // Also log as activity
    await pool.query(
      `INSERT INTO activities (type, description, relatedTo, relatedType, createdBy)
       VALUES ('Note', ?, ?, ?, ?)`,
      [content.substring(0, 200), relatedTo, relatedType, req.user.id]
    );

    const [notes] = await pool.query(
      `SELECT n.*, u.firstName, u.lastName
       FROM notes n
       LEFT JOIN users u ON n.createdBy = u.id
       WHERE n.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: notes[0]
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   PUT /api/notes/:id
// @desc    Update note
// @access  Private
const updateNote = async (req, res) => {
  try {
    const { content } = req.body;

    const [result] = await pool.query(
      `UPDATE notes SET content = ? WHERE id = ?`,
      [content, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    const [notes] = await pool.query(
      `SELECT n.*, u.firstName, u.lastName
       FROM notes n
       LEFT JOIN users u ON n.createdBy = u.id
       WHERE n.id = ?`,
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'Note updated successfully',
      data: notes[0]
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   DELETE /api/notes/:id
// @desc    Delete note
// @access  Private
const deleteNote = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM notes WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getActivities,
  createActivity,
  getNotes,
  createNote,
  updateNote,
  deleteNote
};
