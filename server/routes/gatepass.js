const express = require('express');
const router = express.Router();
const db = require('../db');

// GET gatepasses
router.get('/', (req, res) => {
  try {
    const { studentId, status, passType } = req.query;
    let passes = db.find('gatepasses');

    if (studentId) {
      passes = passes.filter(g => g.studentId === studentId);
    }
    if (status && status !== 'All') {
      passes = passes.filter(g => g.status.toLowerCase() === status.toLowerCase());
    }
    if (passType && passType !== 'All') {
      passes = passes.filter(g => g.passType && g.passType.toLowerCase().includes(passType.toLowerCase()));
    }

    res.json(passes);
  } catch (err) {
    console.error('Error fetching gate passes:', err);
    res.status(500).json({ error: 'Failed to fetch gate passes' });
  }
});

// POST apply for gate pass
router.post('/', (req, res) => {
  try {
    const {
      studentId, passType, destination, departureDate,
      departureTime, returnDate, returnTime, reason, emergencyPhone
    } = req.body;

    if (!departureDate || !returnDate || !reason) {
      return res.status(400).json({ error: 'Dates and reason are required' });
    }

    let studentName = 'Resident Student';
    let rollNo = 'N/A';
    let roomNumber = 'N/A';
    let phone = emergencyPhone || '';

    if (studentId) {
      const student = db.findById('students', studentId);
      if (student) {
        studentName = student.name;
        rollNo = student.rollNo;
        roomNumber = `${student.block ? student.block.replace('Block ', '') + '-' : ''}${student.roomNumber || 'N/A'}`;
        if (!phone) phone = student.guardianPhone || student.emergencyContact || student.phone;
      }
    } else if (req.body.studentName) {
      studentName = req.body.studentName;
      rollNo = req.body.rollNo || 'N/A';
      roomNumber = req.body.roomNumber || 'A-101';
    }

    const newPass = db.insert('gatepasses', {
      studentId: studentId || null,
      studentName,
      rollNo,
      roomNumber,
      passType: passType || 'General Outpass',
      destination: destination || 'City Center',
      departureDate,
      departureTime: departureTime || '10:00',
      returnDate,
      returnTime: returnTime || '20:00',
      reason,
      emergencyPhone: phone,
      status: 'Pending',
      appliedAt: new Date().toISOString(),
      reviewedAt: null,
      remarks: null
    });

    res.status(201).json(newPass);
  } catch (err) {
    console.error('Error applying for gate pass:', err);
    res.status(500).json({ error: 'Failed to apply for gate pass' });
  }
});

// PUT review gate pass (Approve / Reject)
router.put('/:id', (req, res) => {
  try {
    const { status, remarks } = req.body;
    const updates = {
      ...req.body,
      reviewedAt: new Date().toISOString()
    };

    const updated = db.update('gatepasses', req.params.id, updates);
    if (!updated) return res.status(404).json({ error: 'Gate pass not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error reviewing gate pass:', err);
    res.status(500).json({ error: 'Failed to review gate pass' });
  }
});

// DELETE gate pass
router.delete('/:id', (req, res) => {
  try {
    const deleted = db.remove('gatepasses', req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Gate pass not found' });
    res.json({ success: true, message: 'Gate pass deleted' });
  } catch (err) {
    console.error('Error deleting gate pass:', err);
    res.status(500).json({ error: 'Failed to delete gate pass' });
  }
});

module.exports = router;
