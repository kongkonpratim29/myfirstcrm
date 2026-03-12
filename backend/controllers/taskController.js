const { pool } = require('../config/database');

// @route   GET /api/tasks
// @desc    Get all tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const { status, assignedTo, relatedTo, relatedType, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT t.*, 
             u1.firstName as assignedToFirstName, u1.lastName as assignedToLastName,
             u2.firstName as createdByFirstName, u2.lastName as createdByLastName
      FROM tasks t
      LEFT JOIN users u1 ON t.assignedTo = u1.id
      LEFT JOIN users u2 ON t.createdBy = u2.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND t.status = ?`;
      params.push(status);
    }

    if (assignedTo) {
      query += ` AND t.assignedTo = ?`;
      params.push(assignedTo);
    }

    if (relatedTo && relatedType) {
      query += ` AND t.relatedTo = ? AND t.relatedType = ?`;
      params.push(relatedTo, relatedType);
    }

    query += ` ORDER BY t.dueDate ASC, t.priority DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [tasks] = await pool.query(query, params);

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Private
const getTask = async (req, res) => {
  try {
    const [tasks] = await pool.query(
      `SELECT t.*, 
              u1.firstName as assignedToFirstName, u1.lastName as assignedToLastName,
              u2.firstName as createdByFirstName, u2.lastName as createdByLastName
       FROM tasks t
       LEFT JOIN users u1 ON t.assignedTo = u1.id
       LEFT JOIN users u2 ON t.createdBy = u2.id
       WHERE t.id = ?`,
      [req.params.id]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({
      success: true,
      data: tasks[0]
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   POST /api/tasks
// @desc    Create task
// @access  Private
const createTask = async (req, res) => {
  try {
    const { title, description, dueDate, priority, status, category, assignedTo, relatedTo, relatedType } = req.body;

    const [result] = await pool.query(
      `INSERT INTO tasks (title, description, dueDate, priority, status, category, assignedTo, relatedTo, relatedType, createdBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, dueDate, priority || 'Medium', status || 'Pending', category || 'Other', assignedTo, relatedTo, relatedType, req.user.id]
    );

    // Log activity if related to something
    if (relatedTo && relatedType) {
      await pool.query(
        `INSERT INTO activities (type, description, relatedTo, relatedType, createdBy)
         VALUES ('Task', ?, ?, ?, ?)`,
        [`Task created: ${title}`, relatedTo, relatedType, req.user.id]
      );
    }

    const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: tasks[0]
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
const updateTask = async (req, res) => {
  try {
    const { title, description, dueDate, priority, status, category, assignedTo, relatedTo, relatedType } = req.body;

    const [result] = await pool.query(
      `UPDATE tasks 
       SET title = ?, description = ?, dueDate = ?, priority = ?, status = ?, category = ?, assignedTo = ?, relatedTo = ?, relatedType = ?
       WHERE id = ?`,
      [title, description, dueDate, priority, status, category, assignedTo, relatedTo, relatedType, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: tasks[0]
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask
};
