const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getActivities, createActivity, getNotes, createNote, updateNote, deleteNote } = require('../controllers/activityController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// All routes require authentication
router.use(auth);

// Activities routes
router.get('/activities', getActivities);
router.post('/activities', 
  [
    body('type').notEmpty().withMessage('Activity type is required'),
    body('description').notEmpty().withMessage('Description is required')
  ],
  validate,
  createActivity
);

// Notes routes
router.get('/notes', getNotes);
router.post('/notes',
  [
    body('content').notEmpty().withMessage('Note content is required')
  ],
  validate,
  createNote
);
router.put('/notes/:id', updateNote);
router.delete('/notes/:id', deleteNote);

module.exports = router;
