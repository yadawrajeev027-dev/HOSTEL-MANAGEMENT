const express = require('express');
const router = express.Router();
const db = require('../db');

// GET visitor logs
router.get('/', (req, res) => {
  try {
    const { date, studentId, search } = req.query;
    let visitors = db.find('visitors');

    if (date) {
      visitors = visitors.filter(v => v.date === date);
    }
    if (studentId) {
      visitors = visitors.filter(v => v.studentId === studentId);
    }
    if (search) {
      const q = search.toLowerCase();
      visitors = visitors.filter(v =>
        (v.visitorName && v.visitorName.toLowerCase().includes(q)) ||
        (v.studentName && v.studentName.toLowerCase().includes(q)) ||
        (v.relation && v.relation.toLowerCase().includes(q)) ||
        (v.roomNumber && v.roomNumber.toLowerCase().includes(q))
      );
    }

    res.json(visitors);
  } catch (err) {
    console.error('Error fetching visitor log:', err);
    res.status(500).json({ error: 'Failed to fetch visitor log' });
  }
});

// POST log new visitor entry
router.post('/', (req, res) => {
  try {
    const {
      studentId, visitorName, relation, phone,
      purpose, idProofType, idProofNumber, inTime
    } = req.body;

    if (!visitorName || !relation) {
      return res.status(400).json({ error: 'Visitor name and relation are required' });
    }

    let studentName = req.body.studentName || 'Resident Student';
    let roomNumber = req.body.roomNumber || 'A-101';

    if (studentId) {
      const student = db.findById('students', studentId);
      if (student) {
        studentName = student.name;
        roomNumber = `${student.block ? student.block.replace('Block ', '') + '-' : ''}${student.roomNumber || 'N/A'}`;
      }
    }

    const now = new Date();
    const formattedTime = inTime || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newLog = db.insert('visitors', {
      studentId: studentId || null,
      studentName,
      roomNumber,
      visitorName,
      relation,
      phone: phone || '',
      date: now.toISOString().split('T')[0],
      inTime: formattedTime,
      outTime: null,
      purpose: purpose || 'General Visit',
      idProofType: idProofType || 'National ID',
      idProofNumber: idProofNumber || ''
    });

    res.status(201).json(newLog);
  } catch (err) {
    console.error('Error logging visitor entry:', err);
    res.status(500).json({ error: 'Failed to log visitor entry' });
  }
});

// PUT record visitor exit
router.put('/:id/checkout', (req, res) => {
  try {
    const now = new Date();
    const formattedTime = req.body.outTime || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updated = db.update('visitors', req.params.id, {
      outTime: formattedTime
    });

    if (!updated) return res.status(404).json({ error: 'Visitor record not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error updating visitor exit:', err);
    res.status(500).json({ error: 'Failed to update visitor exit' });
  }
});

module.exports = router;
