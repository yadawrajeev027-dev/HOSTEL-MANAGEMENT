const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all users (switchable profiles)
router.get('/', (req, res) => {
  try {
    const users = db.find('users');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET single user
router.get('/:id', (req, res) => {
  const user = db.findById('users', req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

module.exports = router;
