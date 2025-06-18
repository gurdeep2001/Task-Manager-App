const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { auth } = require('../middleware/auth');
const cors = require('cors');
const { Project, Task } = require('../models');

const router = express.Router();

// Register new user
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  try {
    console.log('Registration attempt - Request body:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    console.log('Extracted data:', { name, email, password: password ? '***' : 'undefined' });
    console.log('Password type:', typeof password);
    console.log('Password length:', password ? password.length : 'N/A');

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    console.log('Creating user with data:', { name, email, password: password ? '***' : 'undefined' });
    
    // Create new user
    user = new User({
      name,
      email,
      password
    });

    console.log('User object created, attempting to save...');
    await user.save();

    // Create JWT token
    const payload = {
      user: {
        id: user._id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        // Convert user to plain object and remove password
        const userResponse = user.toObject();
        delete userResponse.password;
        res.json({ user: userResponse, token });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    console.log('Login attempt:', { email: req.body.email });
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    console.log('User found:', user ? 'Yes' : 'No');
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch ? 'Yes' : 'No');
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const payload = {
      user: {
        id: user._id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) {
          console.error('JWT sign error:', err);
          throw err;
        }
        // Convert user to plain object and remove password
        const userResponse = user.toObject();
        delete userResponse.password;
        console.log('Login successful for:', email);
        res.json({ user: userResponse, token });
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('currentPassword').optional().isLength({ min: 6 }),
  body('newPassword').optional().isLength({ min: 6 }),
  body('status').optional().isIn(['todo', 'in_progress', 'completed'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, currentPassword, newPassword, status } = req.body;
    const user = await User.findById(req.user.id);

    // Update basic info
    if (name) user.name = name;
    if (email) user.email = email;

    // Update password if provided
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    res.json(userResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

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
    const toDateString = (date) => date ? new Date(date).toISOString().slice(0, 10) : null;
    const filteredTasks = tasks?.filter((task) => {
      // Status filter
      if (filters.status && task.status !== filters.status) return false;

      // Date range filter (compare only date part)
      const taskDateStr = toDateString(task.dueDate);
      const startDateStr = filters.startDate;
      const endDateStr = filters.endDate;

      if (startDateStr && taskDateStr && taskDateStr < startDateStr) return false;
      if (endDateStr && taskDateStr && taskDateStr > endDateStr) return false;

      // Keyword search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = task.name.toLowerCase().includes(searchLower);
        const matchesDescription = task.description.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesDescription) return false;
      }
      return true;
    }) ?? [];
    console.log('DEBUG filteredTasks:', filteredTasks, 'filters:', filters, 'tasks:', tasks);
    res.json(filteredTasks);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 