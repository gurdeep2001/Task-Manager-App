const express = require('express');
const { body, validationResult } = require('express-validator');
const { Task, Project, User } = require('../models');
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
    .populate('assignee', 'name email')
    .populate('comments.user', 'name')
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
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
  body('dueDate').optional().isISO8601().toDate(),
  body('parentTaskId').optional().isMongoId(),
  body('assigneeId').optional().isMongoId(),
  body('order').optional().isInt(),
  body('tags').optional().isArray(),
  body('estimatedHours').optional().isFloat({ min: 0 }),
  body('actualHours').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { projectId } = req.params;
    const { 
      parentTaskId, 
      assigneeId, 
      tags,
      ...taskData 
    } = req.body;

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

    // Verify assignee exists
    if (assigneeId) {
      const assignee = await User.findById(assigneeId);
      if (!assignee) {
        return res.status(400).json({ error: 'Assignee not found' });
      }
    }

    const task = await Task.create({
      ...taskData,
      project: projectId,
      parentTask: parentTaskId,
      assignee: assigneeId,
      tags: tags || []
    });

    // Populate the created task
    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email')
      .populate('comments.user', 'name');

    res.status(201).json(populatedTask);
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
      priority,
      startDate,
      endDate,
      search,
      assigneeId,
      tags,
      parentTaskId = null // Default to root tasks
    } = req.query;

    const query = { project: projectId };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by priority
    if (priority) {
      query.priority = priority;
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

    // Filter by assignee
    if (assigneeId) {
      query.assignee = assigneeId;
    }

    // Filter by tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
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
      .populate('assignee', 'name email')
      .populate('comments.user', 'name')
      .populate({
        path: 'subTasks',
        populate: [
          { path: 'assignee', select: 'name email' },
          { path: 'comments.user', select: 'name' },
          {
            path: 'subTasks',
            populate: [
              { path: 'assignee', select: 'name email' },
              { path: 'comments.user', select: 'name' }
            ]
          }
        ]
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
    })
    .populate('assignee', 'name email')
    .populate('comments.user', 'name')
    .populate({
      path: 'subTasks',
      populate: [
        { path: 'assignee', select: 'name email' },
        { path: 'comments.user', select: 'name' },
        {
          path: 'subTasks',
          populate: [
            { path: 'assignee', select: 'name email' },
            { path: 'comments.user', select: 'name' }
          ]
        }
      ]
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
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
  body('dueDate').optional().isISO8601().toDate(),
  body('parentTaskId').optional().isMongoId(),
  body('assigneeId').optional().isMongoId(),
  body('order').optional().isInt(),
  body('tags').optional().isArray(),
  body('estimatedHours').optional().isFloat({ min: 0 }),
  body('actualHours').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { projectId, taskId } = req.params;
    const { 
      parentTaskId, 
      assigneeId, 
      tags,
      ...updateData 
    } = req.body;

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

    // Verify assignee exists
    if (assigneeId) {
      const assignee = await User.findById(assigneeId);
      if (!assignee) {
        return res.status(400).json({ error: 'Assignee not found' });
      }
    }

    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'description', 'status', 'priority', 'dueDate', 'parentTaskId', 'assigneeId', 'order', 'tags', 'estimatedHours', 'actualHours'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid updates' });
    }

    // Convert IDs to ObjectIds for MongoDB
    if (req.body.parentTaskId) {
      updateData.parentTask = req.body.parentTaskId;
    }
    if (req.body.assigneeId) {
      updateData.assignee = req.body.assigneeId;
    }
    if (tags) {
      updateData.tags = tags;
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
    .populate('assignee', 'name email')
    .populate('comments.user', 'name');

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add comment to task
router.post('/:projectId/tasks/:taskId/comments', auth, checkProjectAccess('Viewer'), [
  body('content').trim().notEmpty().withMessage('Comment content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { projectId, taskId } = req.params;
    const { content } = req.body;

    const task = await Task.findOne({
      _id: taskId,
      project: projectId
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    task.comments.push({
      user: req.user._id,
      content
    });

    await task.save();

    const updatedTask = await Task.findById(taskId)
      .populate('assignee', 'name email')
      .populate('comments.user', 'name');

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