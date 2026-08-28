const express = require('express');
const router = express.Router();
const db = require('../db');

// GET mess weekly menu
router.get('/', (req, res) => {
  try {
    const menu = db.find('mess');
    res.json(menu);
  } catch (err) {
    console.error('Error fetching mess menu:', err);
    res.status(500).json({ error: 'Failed to fetch mess menu' });
  }
});

// PUT update day menu
router.put('/:id', (req, res) => {
  try {
    const updated = db.update('mess', req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Day menu not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error updating mess menu:', err);
    res.status(500).json({ error: 'Failed to update mess menu' });
  }
});

// POST submit meal rating/feedback
router.post('/:id/feedback', (req, res) => {
  try {
    const { rating } = req.body;
    const day = db.findById('mess', req.params.id);
    if (!day) return res.status(404).json({ error: 'Day not found' });

    const currentCount = day.reviewsCount || 0;
    const currentRating = day.rating || 4.5;
    const newRating = Number(rating);

    const updatedAvg = Number(((currentRating * currentCount + newRating) / (currentCount + 1)).toFixed(1));

    const updated = db.update('mess', req.params.id, {
      rating: updatedAvg,
      reviewsCount: currentCount + 1
    });

    res.json({ success: true, message: 'Feedback submitted successfully', day: updated });
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

module.exports = router;
