const express = require('express');
const { body, validationResult } = require('express-validator');
const { Project, User } = require('../models');
const { auth, checkProjectAccess } = require('../middleware/auth');

const router = express.Router();

// Create new project
router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.create({
      ...req.body,
      owner: req.user._id,
      sharedWith: [] // Don't add owner to sharedWith since they are the owner
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all projects for current user
router.get('/', auth, async (req, res) => {
  try {
    console.log('Getting projects for user:', req.user._id);
    
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'sharedWith.user': req.user._id }
      ]
    })
    .populate('owner', 'name email')
    .populate('sharedWith.user', 'name email');

    console.log('Found projects:', projects.length);

    // Add role information
    const projectsWithRoles = projects.map(project => {
      const projectObj = project.toObject();
      if (project.owner._id.toString() === req.user._id.toString()) {
        projectObj.userRole = 'Owner';
      } else {
        const share = project.sharedWith.find(
          share => share.user._id.toString() === req.user._id.toString()
        );
        projectObj.userRole = share.role;
      }
      return projectObj;
    });

    console.log('Projects with roles:', projectsWithRoles.length);
    res.json(projectsWithRoles);
  } catch (error) {
    console.error('Error getting projects:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get project by ID
router.get('/:projectId', auth, checkProjectAccess('Viewer'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('owner', 'name email')
      .populate('sharedWith.user', 'name email');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectObj = project.toObject();
    projectObj.userRole = req.projectRole;

    res.json(projectObj);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update project
router.patch('/:projectId', auth, checkProjectAccess('Editor'), [
  body('name').optional().trim().notEmpty().withMessage('Project name cannot be empty'),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'description'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid updates' });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.projectId,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete project
router.delete('/:projectId', auth, checkProjectAccess('Owner'), async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Share project with user
router.post('/:projectId/share', auth, checkProjectAccess('Owner'), [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('role').isIn(['Owner', 'Editor', 'Viewer']).withMessage('Valid role is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, role } = req.body;
    const projectId = req.params.projectId;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent sharing with yourself
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot share project with yourself' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if project is already shared with user
    const existingShareIndex = project.sharedWith.findIndex(
      share => share.user.toString() === userId
    );

    if (existingShareIndex !== -1) {
      project.sharedWith[existingShareIndex].role = role;
    } else {
      project.sharedWith.push({ user: userId, role });
    }

    await project.save();
    
    // Return populated project
    const populatedProject = await Project.findById(projectId)
      .populate('owner', 'name email')
      .populate('sharedWith.user', 'name email');
    
    res.json(populatedProject);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove user from project
router.delete('/:projectId/share/:userId', auth, checkProjectAccess('Owner'), async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    project.sharedWith = project.sharedWith.filter(
      share => share.user.toString() !== userId
    );

    await project.save();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 