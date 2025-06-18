const express = require('express');
const { User } = require('../models');
const router = express.Router();

// Get all users (for sharing projects)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, 'name email');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 