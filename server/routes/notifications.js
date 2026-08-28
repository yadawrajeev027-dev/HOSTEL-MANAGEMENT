const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// 1. GET USER NOTIFICATIONS
router.get('/', authenticateToken, (req, res) => {
  const notifs = db.find('notifications', n => n.userId === req.user.id);
  notifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const unreadCount = notifs.filter(n => !n.read).length;
  res.json({ notifications: notifs, unreadCount });
});

// 2. MARK NOTIFICATION AS READ
router.put('/:id/read', authenticateToken, (req, res) => {
  const notif = db.findById('notifications', req.params.id);
  if (!notif) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  if (notif.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const updated = db.update('notifications', req.params.id, { read: true });
  res.json({ success: true, notification: updated });
});

// 3. MARK ALL AS READ
router.put('/read-all', authenticateToken, (req, res) => {
  const notifs = db.find('notifications', n => n.userId === req.user.id && !n.read);
  notifs.forEach(n => {
    db.update('notifications', n.id, { read: true });
  });
  res.json({ success: true, message: 'All notifications marked as read' });
});

// 4. DELETE NOTIFICATION
router.delete('/:id', authenticateToken, (req, res) => {
  const notif = db.findById('notifications', req.params.id);
  if (!notif) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  if (notif.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  db.remove('notifications', req.params.id);
  res.json({ success: true, message: 'Notification deleted' });
});

module.exports = router;
