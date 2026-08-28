const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET WARDENS DIRECTORY
router.get('/', authenticateToken, (req, res) => {
  const wardens = db.find('users', u => u.role !== 'Student');
  const safeWardens = wardens.map(({ passwordHash, ...safe }) => safe);
  res.json({ wardens: safeWardens });
});

// CREATE NEW WARDEN (Chief Warden only)
router.post('/', authenticateToken, requireRole('Chief Warden'), (req, res) => {
  const { name, username, password, role, designation, phone, email, assignedHostel, assignedFloor, assignedDepartment } = req.body;

  if (!name || !username || !password || !role) {
    return res.status(400).json({ error: 'Name, username, password, and role are required' });
  }

  const existing = db.findOne('users', u => u.username.toLowerCase() === username.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Username already in use' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newWarden = db.insert('users', {
    name,
    username,
    passwordHash,
    role,
    designation: designation || role,
    phone: phone || '',
    email: email || '',
    assignedHostel: assignedHostel || null,
    assignedFloor: assignedFloor || null,
    assignedDepartment: assignedDepartment || null,
    avatar: ''
  });

  const { passwordHash: _, ...safe } = newWarden;
  res.status(201).json({ success: true, message: 'Warden account created', warden: safe });
});

// UPDATE WARDEN
router.put('/:id', authenticateToken, requireRole('Chief Warden'), (req, res) => {
  const { name, phone, email, assignedHostel, assignedFloor, assignedDepartment, designation } = req.body;
  const warden = db.findById('users', req.params.id);
  if (!warden || warden.role === 'Student') {
    return res.status(404).json({ error: 'Warden not found' });
  }

  const updates = {};
  if (name) updates.name = name;
  if (phone) updates.phone = phone;
  if (email) updates.email = email;
  if (assignedHostel !== undefined) updates.assignedHostel = assignedHostel;
  if (assignedFloor !== undefined) updates.assignedFloor = assignedFloor;
  if (assignedDepartment !== undefined) updates.assignedDepartment = assignedDepartment;
  if (designation) updates.designation = designation;

  const updated = db.update('users', req.params.id, updates);
  const { passwordHash: _, ...safe } = updated;
  res.json({ success: true, message: 'Warden details updated', warden: safe });
});

// DELETE WARDEN
router.delete('/:id', authenticateToken, requireRole('Chief Warden'), (req, res) => {
  const warden = db.findById('users', req.params.id);
  if (!warden || warden.role === 'Student') {
    return res.status(404).json({ error: 'Warden not found' });
  }
  if (warden.id === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own Chief Warden account' });
  }

  db.remove('users', req.params.id);
  res.json({ success: true, message: 'Warden removed successfully' });
});

module.exports = router;
