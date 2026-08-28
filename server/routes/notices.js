const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all notices
router.get('/', (req, res) => {
  try {
    const { category, importance } = req.query;
    let notices = db.find('notices');

    if (category && category !== 'All') {
      notices = notices.filter(n => n.category.toLowerCase() === category.toLowerCase());
    }
    if (importance && importance !== 'All') {
      notices = notices.filter(n => n.importance.toLowerCase() === importance.toLowerCase());
    }

    res.json(notices);
  } catch (err) {
    console.error('Error fetching notices:', err);
    res.status(500).json({ error: 'Failed to fetch notices' });
  }
});

// POST create notice
router.post('/', (req, res) => {
  try {
    const { title, content, category, importance, author, targetAudience } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const newNotice = db.insert('notices', {
      title,
      content,
      category: category || 'General',
      importance: importance || 'Normal',
      author: author || 'Hostel Administration',
      date: new Date().toISOString().split('T')[0],
      targetAudience: targetAudience || 'All Residents'
    });

    res.status(201).json(newNotice);
  } catch (err) {
    console.error('Error publishing notice:', err);
    res.status(500).json({ error: 'Failed to publish notice' });
  }
});

// DELETE notice
router.delete('/:id', (req, res) => {
  try {
    const deleted = db.remove('notices', req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Notice not found' });
    res.json({ success: true, message: 'Notice deleted successfully' });
  } catch (err) {
    console.error('Error deleting notice:', err);
    res.status(500).json({ error: 'Failed to delete notice' });
  }
});

module.exports = router;
