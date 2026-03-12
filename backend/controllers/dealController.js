const { pool } = require('../config/database');

const WORK_PROGRESS_STAGES = [
  'New Lead',
  'Initial Contact',
  'Requirement Discussion',
  'Proposal / Quotation Sent',
  'Follow-up / Re-approach',
  'Deal Confirmed',
  'Invoice Sent',
  'Payment Pending',
  'Payment Received',
  'Work in Progress',
  'Client Feedback / Revision',
  'Project Completed',
  'Closed'
];

const WORK_SUB_STAGES = [
  'Design in Progress',
  'Development in Progress',
  'Testing / Review'
];

const normalizeWorkSubStage = (stage, workSubStage) => {
  if (stage !== 'Work in Progress') {
    return null;
  }

  if (!workSubStage) {
    return null;
  }

  return WORK_SUB_STAGES.includes(workSubStage) ? workSubStage : null;
};

// @route   GET /api/deals
// @desc    Get all deals
// @access  Private
const getDeals = async (req, res) => {
  try {
    const { stage, companyId, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT d.*, 
             c.name as companyName,
             cont.firstName as contactFirstName, cont.lastName as contactLastName,
             u.firstName as createdByFirstName, u.lastName as createdByLastName
      FROM deals d
      LEFT JOIN companies c ON d.companyId = c.id
      LEFT JOIN contacts cont ON d.contactId = cont.id
      LEFT JOIN users u ON d.createdBy = u.id
      WHERE 1=1
    `;
    const params = [];

    if (stage) {
      query += ` AND d.stage = ?`;
      params.push(stage);
    }

    if (companyId) {
      query += ` AND d.companyId = ?`;
      params.push(companyId);
    }

    query += ` ORDER BY d.createdAt DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [deals] = await pool.query(query, params);

    res.json({
      success: true,
      data: deals
    });
  } catch (error) {
    console.error('Get deals error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   GET /api/deals/:id
// @desc    Get single deal
// @access  Private
const getDeal = async (req, res) => {
  try {
    const [deals] = await pool.query(
      `SELECT d.*, 
              c.name as companyName,
              cont.firstName as contactFirstName, cont.lastName as contactLastName,
              u.firstName as createdByFirstName, u.lastName as createdByLastName
       FROM deals d
       LEFT JOIN companies c ON d.companyId = c.id
       LEFT JOIN contacts cont ON d.contactId = cont.id
       LEFT JOIN users u ON d.createdBy = u.id
       WHERE d.id = ?`,
      [req.params.id]
    );

    if (deals.length === 0) {
      return res.status(404).json({ success: false, message: 'Deal not found' });
    }

    // Get activities for this deal
    const [activities] = await pool.query(
      `SELECT a.*, u.firstName, u.lastName
       FROM activities a
       LEFT JOIN users u ON a.createdBy = u.id
       WHERE a.relatedTo = ? AND a.relatedType = 'Deal'
       ORDER BY a.createdAt DESC`,
      [req.params.id]
    );

    res.json({
      success: true,
      data: { ...deals[0], activities }
    });
  } catch (error) {
    console.error('Get deal error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   POST /api/deals
// @desc    Create deal
// @access  Private
const createDeal = async (req, res) => {
  try {
    const { title, value, stage, workSubStage, probability, expectedCloseDate, companyId, contactId } = req.body;
    const selectedStage = stage || 'New Lead';

    if (!WORK_PROGRESS_STAGES.includes(selectedStage)) {
      return res.status(400).json({ success: false, message: 'Invalid work progress stage' });
    }

    const selectedWorkSubStage = normalizeWorkSubStage(selectedStage, workSubStage);

    const [result] = await pool.query(
      `INSERT INTO deals (title, value, stage, workSubStage, probability, expectedCloseDate, companyId, contactId, createdBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, value, selectedStage, selectedWorkSubStage, probability || 0, expectedCloseDate, companyId, contactId, req.user.id]
    );

    // Log activity
    await pool.query(
      `INSERT INTO activities (type, description, relatedTo, relatedType, createdBy)
       VALUES ('Note', ?, ?, 'Deal', ?)`,
      [`Deal created: ${title}`, result.insertId, req.user.id]
    );

    const [deals] = await pool.query('SELECT * FROM deals WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Deal created successfully',
      data: deals[0]
    });
  } catch (error) {
    console.error('Create deal error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   PUT /api/deals/:id
// @desc    Update deal
// @access  Private
const updateDeal = async (req, res) => {
  try {
    const { title, value, stage, workSubStage, probability, expectedCloseDate, companyId, contactId } = req.body;

    const [existingDeal] = await pool.query('SELECT * FROM deals WHERE id = ?', [req.params.id]);
    if (existingDeal.length === 0) {
      return res.status(404).json({ success: false, message: 'Deal not found' });
    }

    const oldDeal = existingDeal[0];
    const selectedStage = stage || oldDeal.stage;
    if (!WORK_PROGRESS_STAGES.includes(selectedStage)) {
      return res.status(400).json({ success: false, message: 'Invalid work progress stage' });
    }

    const selectedWorkSubStage = normalizeWorkSubStage(
      selectedStage,
      workSubStage !== undefined ? workSubStage : oldDeal.workSubStage
    );

    const updatedDeal = {
      title: title !== undefined ? title : oldDeal.title,
      value: value !== undefined ? value : oldDeal.value,
      stage: selectedStage,
      workSubStage: selectedWorkSubStage,
      probability: probability !== undefined ? probability : oldDeal.probability,
      expectedCloseDate: expectedCloseDate !== undefined ? expectedCloseDate : oldDeal.expectedCloseDate,
      companyId: companyId !== undefined ? companyId : oldDeal.companyId,
      contactId: contactId !== undefined ? contactId : oldDeal.contactId
    };
    
    const [result] = await pool.query(
      `UPDATE deals 
       SET title = ?, value = ?, stage = ?, workSubStage = ?, probability = ?, expectedCloseDate = ?, companyId = ?, contactId = ?
       WHERE id = ?`,
      [
        updatedDeal.title,
        updatedDeal.value,
        updatedDeal.stage,
        updatedDeal.workSubStage,
        updatedDeal.probability,
        updatedDeal.expectedCloseDate,
        updatedDeal.companyId,
        updatedDeal.contactId,
        req.params.id
      ]
    );

    if (oldDeal.stage !== updatedDeal.stage || oldDeal.workSubStage !== updatedDeal.workSubStage) {
      const oldProgress = oldDeal.workSubStage ? `${oldDeal.stage} (${oldDeal.workSubStage})` : oldDeal.stage;
      const newProgress = updatedDeal.workSubStage ? `${updatedDeal.stage} (${updatedDeal.workSubStage})` : updatedDeal.stage;

      await pool.query(
        `INSERT INTO activities (type, description, relatedTo, relatedType, createdBy)
         VALUES ('Deal Stage Change', ?, ?, 'Deal', ?)`,
        [`Work progress changed from ${oldProgress} to ${newProgress}`, req.params.id, req.user.id]
      );
    }

    const [deals] = await pool.query('SELECT * FROM deals WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Deal updated successfully',
      data: deals[0]
    });
  } catch (error) {
    console.error('Update deal error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   DELETE /api/deals/:id
// @desc    Delete deal
// @access  Private
const deleteDeal = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM deals WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Deal not found' });
    }

    res.json({
      success: true,
      message: 'Deal deleted successfully'
    });
  } catch (error) {
    console.error('Delete deal error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getDeals,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal
};
