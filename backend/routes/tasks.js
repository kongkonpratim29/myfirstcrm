const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getTasks, getTask, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Validation rules
const taskValidation = [
  body('title').notEmpty().withMessage('Task title is required')
];

// All routes require authentication
router.use(auth);

// @route   GET /api/tasks
router.get('/', getTasks);

// @route   GET /api/tasks/:id
router.get('/:id', getTask);

// @route   POST /api/tasks
router.post('/', taskValidation, validate, createTask);

// @route   PUT /api/tasks/:id
router.put('/:id', taskValidation, validate, updateTask);

// @route   DELETE /api/tasks/:id
router.delete('/:id', deleteTask);

module.exports = router;
