const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET ALL HOSTELS FOR ALLOTMENT
router.get('/hostels', authenticateToken, (req, res) => {
  const hostels = db.find('hostels');
  res.json({ hostels });
});

// GET FLOORS FOR A HOSTEL (derived from the hostel totalFloors)
router.get('/hostels/:id/floors', authenticateToken, (req, res) => {
  const hostel = db.findById('hostels', req.params.id);
  if (!hostel) return res.status(404).json({ error: 'Hostel not found' });
  
  const floors = [];
  for(let i=1; i<=hostel.totalFloors; i++) {
    floors.push(i);
  }
  res.json({ floors });
});

// GET ROOMS FOR A HOSTEL & FLOOR
router.get('/rooms', authenticateToken, (req, res) => {
  const { hostelId, floor } = req.query;
  let rooms = db.find('rooms');
  
  if (hostelId) rooms = rooms.filter(r => r.hostelId === hostelId);
  if (floor) rooms = rooms.filter(r => parseInt(r.floorNumber, 10) === parseInt(floor, 10));
  
  res.json({ rooms });
});

// GET BEDS FOR A ROOM
router.get('/beds', authenticateToken, (req, res) => {
  const { roomId } = req.query;
  if (!roomId) return res.status(400).json({ error: 'roomId is required' });
  
  const beds = db.find('beds', b => b.roomId === roomId);
  res.json({ beds });
});

// GET ALLOTMENT HISTORY
router.get('/history', authenticateToken, requireRole('Deputy Chief Warden'), (req, res) => {
  const history = db.find('allotmentHistory');
  res.json({ history });
});

// GET ALL ALLOTTED STUDENTS (For the Table)
router.get('/allotted', authenticateToken, (req, res) => {
  // Find students who have an assigned bed (i.e. hostel != 'Unassigned')
  const students = db.find('users', u => u.role === 'Student' && u.hostel && u.hostel !== 'Unassigned');
  const safeStudents = students.map(({ passwordHash, ...safe }) => safe);
  res.json({ allotted: safeStudents });
});

// ASSIGN / TRANSFER BED
router.post('/assign', authenticateToken, requireRole('Deputy Chief Warden'), (req, res) => {
  const { studentId, bedId } = req.body;

  const student = db.findById('users', studentId);
  if (!student || student.role !== 'Student') {
    return res.status(404).json({ error: 'Student not found' });
  }

  const newBed = db.findById('beds', bedId);
  if (!newBed) {
    return res.status(404).json({ error: 'Target bed not found' });
  }
  if (newBed.status === 'Occupied') {
    return res.status(400).json({ error: 'Target bed is already occupied' });
  }

  const newRoom = db.findById('rooms', newBed.roomId);
  const newHostel = db.findById('hostels', newRoom.hostelId);

  const isTransfer = !!(student.hostel && student.hostel !== 'Unassigned');
  let oldDetails = null;

  // If transferring, free the old bed and decrement old hostel
  if (isTransfer) {
    oldDetails = {
      hostel: student.hostel,
      floor: student.floor,
      roomNumber: student.roomNumber,
      bedNumber: student.bedNumber
    };

    // Find the old bed and free it
    const oldBed = db.findOne('beds', b => b.studentId === student.id);
    if (oldBed) {
      db.update('beds', oldBed.id, { status: 'Available', studentId: null, studentName: null });
    }

    const oldHostel = db.findOne('hostels', h => h.name === student.hostel);
    if (oldHostel) {
      db.update('hostels', oldHostel.id, { occupiedBeds: Math.max(0, (oldHostel.occupiedBeds || 0) - 1) });
    }
  }

  // Assign to new bed
  db.update('beds', bedId, { status: 'Occupied', studentId: student.id, studentName: student.name });
  
  // Increment new hostel
  db.update('hostels', newHostel.id, { occupiedBeds: (newHostel.occupiedBeds || 0) + 1 });

  // Update student profile
  const updatedStudent = db.update('users', student.id, {
    hostel: newHostel.name,
    floor: newRoom.floorNumber,
    roomNumber: newRoom.roomNumber,
    bedNumber: newBed.bedNumber
  });

  // Log history
  db.insert('allotmentHistory', {
    studentId: student.id,
    studentName: student.name,
    action: isTransfer ? 'TRANSFERRED' : 'ALLOTTED',
    oldBedDetails: oldDetails,
    newBedDetails: {
      hostel: newHostel.name,
      floor: newRoom.floorNumber,
      roomNumber: newRoom.roomNumber,
      bedNumber: newBed.bedNumber
    },
    date: new Date().toISOString(),
    changedBy: req.user.name
  });

  res.json({ success: true, message: isTransfer ? 'Student transferred successfully' : 'Room allotted successfully', student: updatedStudent });
});

// REMOVE ALLOTMENT
router.post('/remove', authenticateToken, requireRole('Deputy Chief Warden'), (req, res) => {
  const { studentId } = req.body;

  const student = db.findById('users', studentId);
  if (!student || student.role !== 'Student') {
    return res.status(404).json({ error: 'Student not found' });
  }

  if (!student.hostel || student.hostel === 'Unassigned') {
    return res.status(400).json({ error: 'Student does not have a room allotment' });
  }

  const oldDetails = {
    hostel: student.hostel,
    floor: student.floor,
    roomNumber: student.roomNumber,
    bedNumber: student.bedNumber
  };

  // Find the old bed and free it
  const oldBed = db.findOne('beds', b => b.studentId === student.id);
  if (oldBed) {
    db.update('beds', oldBed.id, { status: 'Available', studentId: null, studentName: null });
  }

  const oldHostel = db.findOne('hostels', h => h.name === student.hostel);
  if (oldHostel) {
    db.update('hostels', oldHostel.id, { occupiedBeds: Math.max(0, (oldHostel.occupiedBeds || 0) - 1) });
  }

  // Update student profile
  db.update('users', student.id, {
    hostel: 'Unassigned',
    floor: null,
    roomNumber: 'Unassigned',
    bedNumber: 'Unassigned'
  });

  // Log history
  db.insert('allotmentHistory', {
    studentId: student.id,
    studentName: student.name,
    action: 'REMOVED',
    oldBedDetails: oldDetails,
    newBedDetails: null,
    date: new Date().toISOString(),
    changedBy: req.user.name
  });

  res.json({ success: true, message: 'Room allotment removed successfully' });
});

module.exports = router;
