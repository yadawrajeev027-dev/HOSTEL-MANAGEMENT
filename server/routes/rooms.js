const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// Helper to assemble room with its beds and occupant details
function getEnrichedRoom(room) {
  const beds = db.find('beds', b => b.roomId === room.id);
  const students = db.find('students');

  const enrichedBeds = beds.map(bed => {
    const student = bed.studentId ? students.find(s => s.id === bed.studentId) : null;
    return {
      ...bed,
      student: student ? {
        id: student.id,
        name: student.name,
        rollNo: student.rollNo,
        phone: student.phone,
        email: student.email,
        course: student.course,
        photo: student.photo
      } : null
    };
  });

  const occupiedCount = enrichedBeds.filter(b => b.status === 'Occupied').length;
  let status = 'Available';
  if (occupiedCount >= (room.capacity || 1)) {
    status = 'Occupied';
  } else if (occupiedCount > 0) {
    status = 'Partially Occupied';
  }

  return {
    ...room,
    occupied: occupiedCount,
    status,
    beds: enrichedBeds
  };
}

// GET all rooms
router.get('/', (req, res) => {
  try {
    const { block, floor, type, status } = req.query;
    let rooms = db.find('rooms');

    if (block && block !== 'All') {
      rooms = rooms.filter(r => r.block.toLowerCase() === block.toLowerCase());
    }
    if (floor && floor !== 'All') {
      rooms = rooms.filter(r => String(r.floor) === String(floor));
    }
    if (type && type !== 'All') {
      rooms = rooms.filter(r => r.type.toLowerCase().includes(type.toLowerCase()));
    }

    let enriched = rooms.map(getEnrichedRoom);

    if (status && status !== 'All') {
      enriched = enriched.filter(r => r.status.toLowerCase() === status.toLowerCase());
    }

    res.json(enriched);
  } catch (err) {
    console.error('Error fetching rooms:', err);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// GET single room
router.get('/:id', (req, res) => {
  const room = db.findById('rooms', req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(getEnrichedRoom(room));
});

// POST create new room
router.post('/', (req, res) => {
  try {
    const { number, block, floor, type, capacity, pricePerMonth, amenities } = req.body;
    if (!number || !block || !capacity) {
      return res.status(400).json({ error: 'Room number, block, and capacity are required' });
    }

    const roomId = `room-${block.toLowerCase().replace(/\s+/g, '')}-${number}`;
    const newRoom = db.insert('rooms', {
      id: roomId,
      number: String(number),
      block: block || 'Block A',
      floor: Number(floor) || 1,
      type: type || 'Double AC',
      capacity: Number(capacity) || 2,
      occupied: 0,
      pricePerMonth: Number(pricePerMonth) || 7500,
      amenities: Array.isArray(amenities) ? amenities : ['Wi-Fi', 'Attached Washroom'],
      status: 'Available'
    });

    // Automatically create beds for this room
    const bedLabels = ['Bed A', 'Bed B', 'Bed C', 'Bed D', 'Bed E', 'Bed F'];
    for (let i = 0; i < (Number(capacity) || 2); i++) {
      db.insert('beds', {
        id: `bed-${roomId}-${i + 1}`,
        roomId: newRoom.id,
        bedNumber: bedLabels[i] || `Bed ${i + 1}`,
        studentId: null,
        status: 'Available'
      });
    }

    res.status(201).json(getEnrichedRoom(newRoom));
  } catch (err) {
    console.error('Error creating room:', err);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// PUT update room
router.put('/:id', (req, res) => {
  try {
    const updated = db.update('rooms', req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Room not found' });
    res.json(getEnrichedRoom(updated));
  } catch (err) {
    console.error('Error updating room:', err);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// DELETE room
router.delete('/:id', (req, res) => {
  try {
    // Check if any bed is occupied
    const beds = db.find('beds', b => b.roomId === req.params.id);
    const occupied = beds.some(b => b.status === 'Occupied');
    if (occupied) {
      return res.status(400).json({ error: 'Cannot delete room with active resident students. Deallocate beds first.' });
    }

    // Delete beds
    beds.forEach(b => db.remove('beds', b.id));
    const deleted = db.remove('rooms', req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Room not found' });

    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (err) {
    console.error('Error deleting room:', err);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

// POST allocate bed to student
router.post('/:id/allocate', (req, res) => {
  try {
    const { bedId, studentId } = req.body;
    const room = db.findById('rooms', req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const student = db.findById('students', studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const bed = db.findById('beds', bedId);
    if (!bed || bed.roomId !== room.id) return res.status(404).json({ error: 'Bed not found in this room' });
    if (bed.status === 'Occupied' && bed.studentId !== studentId) {
      return res.status(400).json({ error: 'Bed is already occupied' });
    }

    // If student had a previous bed, free it
    if (student.bedId && student.bedId !== bedId) {
      db.update('beds', student.bedId, { studentId: null, status: 'Available' });
    }

    // Update bed
    db.update('beds', bedId, { studentId, status: 'Occupied' });

    // Update student
    db.update('students', studentId, {
      roomId: room.id,
      roomNumber: room.number,
      block: room.block,
      bedId: bed.id,
      bedNumber: bed.bedNumber
    });

    res.json({ success: true, message: `Bed allocated to ${student.name}`, room: getEnrichedRoom(room) });
  } catch (err) {
    console.error('Error allocating bed:', err);
    res.status(500).json({ error: 'Failed to allocate bed' });
  }
});

// POST deallocate bed
router.post('/:id/deallocate', (req, res) => {
  try {
    const { bedId } = req.body;
    const bed = db.findById('beds', bedId);
    if (!bed) return res.status(404).json({ error: 'Bed not found' });

    if (bed.studentId) {
      db.update('students', bed.studentId, {
        roomId: null,
        roomNumber: null,
        block: null,
        bedId: null,
        bedNumber: null
      });
    }

    db.update('beds', bedId, { studentId: null, status: 'Available' });
    const room = db.findById('rooms', req.params.id);

    res.json({ success: true, message: 'Bed deallocated successfully', room: getEnrichedRoom(room) });
  } catch (err) {
    console.error('Error deallocating bed:', err);
    res.status(500).json({ error: 'Failed to deallocate bed' });
  }
});

module.exports = router;
