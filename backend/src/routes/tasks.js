const express = require('express');
const { body, validationResult } = require('express-validator');
const { Task, Project } = require('../models');
const { auth, checkProjectAccess } = require('../middleware/auth');

const router = express.Router();

// Get all tasks for current user across all projects
router.get('/', auth, async (req, res) => {
  try {
    // First get all projects the user has access to
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'sharedWith.user': req.user._id }
      ]
    });

    const projectIds = projects.map(project => project._id);

    // Get all tasks from those projects
    const tasks = await Task.find({
      project: { $in: projectIds }
    })
    .populate('project', 'name')
    .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new task
router.post('/:projectId/tasks', auth, checkProjectAccess('Editor'), [
  body('name').trim().notEmpty().withMessage('Task name is required'),
  body('description').optional().trim(),
  body('status').optional().isIn(['To Do', 'In Progress', 'Done']),
  body('dueDate').optional().isISO8601().toDate(),
  body('parentTaskId').optional().isMongoId(),
  body('order').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { projectId } = req.params;
    const { parentTaskId } = req.body;

    // Verify parent task exists and belongs to the same project
    if (parentTaskId) {
      const parentTask = await Task.findOne({
        _id: parentTaskId,
        project: projectId
      });

      if (!parentTask) {
        return res.status(400).json({ error: 'Parent task not found or does not belong to this project' });
      }
    }

    const task = await Task.create({
      ...req.body,
      project: projectId,
      parentTask: parentTaskId
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all tasks for a project with filtering
router.get('/:projectId/tasks', auth, checkProjectAccess('Viewer'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      status,
      startDate,
      endDate,
      search,
      parentTaskId = null // Default to root tasks
    } = req.query;

    const query = { project: projectId };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.dueDate = {};
      if (startDate) {
        query.dueDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.dueDate.$lte = new Date(endDate);
      }
    }

    // Filter by parent task
    if (parentTaskId === 'null') {
      query.parentTask = null;
    } else if (parentTaskId) {
      query.parentTask = parentTaskId;
    }

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const tasks = await Task.find(query)
      .populate({
        path: 'subTasks',
        populate: {
          path: 'subTasks'
        }
      })
      .sort({ order: 1, 'subTasks.order': 1, 'subTasks.subTasks.order': 1 });

    // Filter out sub-tasks from root level
    const rootTasks = tasks.filter(task => !task.parentTask);

    res.json(rootTasks);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get task by ID
router.get('/:projectId/tasks/:taskId', auth, checkProjectAccess('Viewer'), async (req, res) => {
  try {
    const { projectId, taskId } = req.params;

    const task = await Task.findOne({
      _id: taskId,
      project: projectId
    }).populate({
      path: 'subTasks',
      populate: {
        path: 'subTasks'
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update task
router.patch('/:projectId/tasks/:taskId', auth, checkProjectAccess('Editor'), [
  body('name').optional().trim().notEmpty().withMessage('Task name cannot be empty'),
  body('description').optional().trim(),
  body('status').optional().isIn(['To Do', 'In Progress', 'Done']),
  body('dueDate').optional().isISO8601().toDate(),
  body('parentTaskId').optional().isMongoId(),
  body('order').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { projectId, taskId } = req.params;
    const { parentTaskId } = req.body;

    const task = await Task.findOne({
      _id: taskId,
      project: projectId
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Verify new parent task exists and belongs to the same project
    if (parentTaskId && parentTaskId !== task.parentTask?.toString()) {
      const parentTask = await Task.findOne({
        _id: parentTaskId,
        project: projectId
      });

      if (!parentTask) {
        return res.status(400).json({ error: 'Parent task not found or does not belong to this project' });
      }

      // Prevent circular references
      if (parentTaskId === taskId) {
        return res.status(400).json({ error: 'Task cannot be its own parent' });
      }

      // Check if new parent is not a descendant of this task
      let currentParent = await Task.findById(parentTaskId);
      while (currentParent) {
        if (currentParent.parentTask?.toString() === taskId) {
          return res.status(400).json({ error: 'Cannot move task to its own descendant' });
        }
        currentParent = await Task.findById(currentParent.parentTask);
      }
    }

    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'description', 'status', 'dueDate', 'parentTaskId', 'order'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid updates' });
    }

    // Convert parentTaskId to parentTask for MongoDB
    if (req.body.parentTaskId) {
      req.body.parentTask = req.body.parentTaskId;
      delete req.body.parentTaskId;
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete task
router.delete('/:projectId/tasks/:taskId', auth, checkProjectAccess('Editor'), async (req, res) => {
  try {
    const { projectId, taskId } = req.params;

    const task = await Task.findOne({
      _id: taskId,
      project: projectId
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Recursive function to delete task and all its subtasks
    const deleteTaskAndSubtasks = async (taskId) => {
      const task = await Task.findById(taskId);
      if (!task) return;

      // Delete all subtasks first
      const subtasks = await Task.find({ parentTask: taskId });
      for (const subtask of subtasks) {
        await deleteTaskAndSubtasks(subtask._id);
      }

      // Delete the task itself
      await Task.findByIdAndDelete(taskId);
    };

    await deleteTaskAndSubtasks(taskId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Reorder tasks
router.post('/:projectId/tasks/reorder', auth, checkProjectAccess('Editor'), [
  body('taskIds').isArray().withMessage('Task IDs array is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { projectId } = req.params;
    const { taskIds } = req.body;

    // Verify all tasks belong to the project
    const tasks = await Task.find({
      _id: { $in: taskIds },
      project: projectId
    });

    if (tasks.length !== taskIds.length) {
      return res.status(400).json({ error: 'Some tasks do not belong to this project' });
    }

    // Update order for each task
    await Promise.all(taskIds.map((taskId, index) => {
      return Task.findByIdAndUpdate(
        taskId,
        { $set: { order: index } },
        { new: true, runValidators: true }
      );
    }));

    res.status(200).json({ message: 'Tasks reordered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Recent tasks endpoint
router.get('/recent', auth, async (req, res) => {
  try {
    // Get all projects the user has access to
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'sharedWith.user': req.user._id }
      ]
    });
    const projectIds = projects.map(project => project._id);
    // Get 5 most recent tasks from those projects
    const tasks = await Task.find({
      project: { $in: projectIds }
    })
      .populate('project', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 