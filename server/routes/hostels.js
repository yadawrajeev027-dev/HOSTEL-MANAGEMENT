const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET ALL HOSTELS
router.get('/', authenticateToken, (req, res) => {
  const hostels = db.find('hostels');
  
  // Calculate dynamic fields
  const enrichedHostels = hostels.map(h => {
    const occupiedBeds = h.occupiedBeds || 0;
    const totalBeds = h.totalBeds || h.capacity || 0;
    return {
      ...h,
      occupiedBeds,
      totalBeds,
      availableBeds: totalBeds - occupiedBeds,
      status: h.status || 'Active'
    };
  });

  res.json({ hostels: enrichedHostels });
});

// CREATE NEW HOSTEL & WARDEN (Chief Warden only)
router.post('/', authenticateToken, requireRole('Chief Warden'), (req, res) => {
  const { 
    name, type, wardenName, wardenUsername, wardenPhone, 
    capacity, totalBeds, totalFloors, roomsPerFloor, roomCapacity, description, status 
  } = req.body;

  if (!name || !type || !capacity || !totalBeds) {
    return res.status(400).json({ error: 'Name, type, capacity, and total beds are required.' });
  }

  const existing = db.findOne('hostels', h => h.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'A hostel with this name already exists.' });
  }

  let assignedWardenId = null;

  // Create Warden if requested
  if (wardenName && wardenUsername) {
    const existingWarden = db.findOne('users', u => u.username.toLowerCase() === wardenUsername.toLowerCase());
    if (existingWarden) {
      return res.status(400).json({ error: 'Warden username already in use.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(wardenUsername + '123', salt); // Default password

    const newWarden = db.insert('users', {
      name: wardenName,
      username: wardenUsername,
      passwordHash,
      role: 'Floor Warden', // Or specific Hostel Warden role if exists
      designation: 'Hostel Warden',
      phone: wardenPhone || '',
      assignedHostel: name,
      avatar: ''
    });
    assignedWardenId = newWarden.id;
  }

  const newHostel = db.insert('hostels', {
    name,
    type,
    capacity: parseInt(capacity, 10),
    totalBeds: parseInt(totalBeds, 10),
    totalFloors: parseInt(totalFloors, 10) || 1,
    roomsPerFloor: parseInt(roomsPerFloor, 10) || 0,
    roomCapacity: parseInt(roomCapacity, 10) || 0,
    description: description || '',
    status: status || 'Active',
    wardenName: wardenName || 'Unassigned',
    wardenId: assignedWardenId,
    occupiedBeds: 0, // Starts at 0, strictly no dummy data
  });

  // Auto-generate Rooms and Beds based on totalFloors, roomsPerFloor, roomCapacity
  const numFloors = newHostel.totalFloors;
  
  if (newHostel.roomsPerFloor > 0 && newHostel.roomCapacity > 0) {
    // Precise Generation
    const numRooms = newHostel.roomsPerFloor;
    const bedsPerRoom = newHostel.roomCapacity;
    
    for (let f = 1; f <= numFloors; f++) {
      for (let r = 1; r <= numRooms; r++) {
        const roomNumber = `${f}${r.toString().padStart(2, '0')}`; // e.g. 101, 102
        
        const newRoom = db.insert('rooms', {
          hostelId: newHostel.id,
          hostelName: newHostel.name,
          floorNumber: f,
          roomNumber: roomNumber
        });

        for (let b = 1; b <= bedsPerRoom; b++) {
          db.insert('beds', {
            roomId: newRoom.id,
            roomNumber: newRoom.roomNumber,
            hostelId: newHostel.id,
            floorNumber: f,
            bedNumber: `Bed ${b}`,
            status: 'Available',
            studentId: null,
            studentName: null
          });
        }
      }
    }
  } else {
    // Legacy fallback generation
    const tBeds = newHostel.totalBeds;
    const bedsPerFloor = Math.floor(tBeds / numFloors);
    let remainingBeds = tBeds % numFloors;

    let bedCounter = 1;
    for (let f = 1; f <= numFloors; f++) {
      const bedsOnThisFloor = bedsPerFloor + (remainingBeds > 0 ? 1 : 0);
      remainingBeds--;

      if (bedsOnThisFloor <= 0) continue;

      const numRooms = Math.ceil(bedsOnThisFloor / 2);
      let floorBedCounter = 0;

      for (let r = 1; r <= numRooms; r++) {
        const roomNumber = `${f}${r.toString().padStart(2, '0')}`;
        
        const newRoom = db.insert('rooms', {
          hostelId: newHostel.id,
          hostelName: newHostel.name,
          floorNumber: f,
          roomNumber: roomNumber
        });

        const bedsInThisRoom = (r === numRooms && floorBedCounter + 1 < bedsOnThisFloor) 
                                ? (bedsOnThisFloor - floorBedCounter) 
                                : 2;

        for (let b = 1; b <= bedsInThisRoom; b++) {
          if (floorBedCounter >= bedsOnThisFloor) break;
          db.insert('beds', {
            roomId: newRoom.id,
            roomNumber: newRoom.roomNumber,
            hostelId: newHostel.id,
            floorNumber: f,
            bedNumber: `Bed ${b}`,
            status: 'Available',
            studentId: null,
            studentName: null
          });
          floorBedCounter++;
        }
      }
    }
  }

  res.status(201).json({ success: true, message: 'Hostel added successfully', hostel: newHostel });
});

// GET SINGLE HOSTEL
router.get('/:id', authenticateToken, (req, res) => {
  const hostel = db.findById('hostels', req.params.id);
  if (!hostel) {
    return res.status(404).json({ error: 'Hostel not found' });
  }
  
  const occupiedBeds = hostel.occupiedBeds || 0;
  const totalBeds = hostel.totalBeds || hostel.capacity || 0;
  
  const enrichedHostel = {
    ...hostel,
    occupiedBeds,
    totalBeds,
    availableBeds: totalBeds - occupiedBeds,
    status: hostel.status || 'Active'
  };

  res.json({ hostel: enrichedHostel });
});

// GET HOSTEL STUDENTS
router.get('/:id/students', authenticateToken, (req, res) => {
  const hostel = db.findById('hostels', req.params.id);
  if (!hostel) {
    return res.status(404).json({ error: 'Hostel not found' });
  }

  // Find all students assigned to this hostel name
  const students = db.find('users', u => u.role === 'Student' && u.hostel === hostel.name);
  
  // Clean out password hashes before sending
  const safeStudents = students.map(({ passwordHash, ...safe }) => safe);

  res.json({ students: safeStudents });
});

// UPDATE HOSTEL
router.put('/:id', authenticateToken, requireRole('Chief Warden'), (req, res) => {
  const { name, type, wardenName, wardenContact, capacity, totalBeds, totalFloors, roomsPerFloor, roomCapacity, description, status } = req.body;
  
  const hostel = db.findById('hostels', req.params.id);
  if (!hostel) {
    return res.status(404).json({ error: 'Hostel not found' });
  }

  const newTotalBeds = parseInt(totalBeds, 10);
  const currentOccupied = hostel.occupiedBeds || 0;

  if (newTotalBeds < currentOccupied) {
    return res.status(400).json({ error: `Cannot reduce total beds to ${newTotalBeds}. ${currentOccupied} beds are currently occupied.` });
  }

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (type !== undefined) updates.type = type;
  if (wardenName !== undefined) updates.wardenName = wardenName;
  if (wardenContact !== undefined) updates.wardenContact = wardenContact;
  if (capacity !== undefined) updates.capacity = parseInt(capacity, 10);
  if (totalBeds !== undefined) updates.totalBeds = newTotalBeds;
  if (totalFloors !== undefined) updates.totalFloors = parseInt(totalFloors, 10);
  if (roomsPerFloor !== undefined) updates.roomsPerFloor = parseInt(roomsPerFloor, 10);
  if (roomCapacity !== undefined) updates.roomCapacity = parseInt(roomCapacity, 10);
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;

  // If name changed, we theoretically should update students/rooms pointing to this hostel name,
  // but for simplicity in JSON DB we might just update the hostel record. In a real DB we'd use foreign keys.
  // We'll update students if they exist.
  if (name && name !== hostel.name) {
    const students = db.find('users', u => u.role === 'Student' && u.hostel === hostel.name);
    students.forEach(s => db.update('users', s.id, { hostel: name }));
  }

  const updatedHostel = db.update('hostels', req.params.id, updates);

  res.json({ success: true, message: 'Hostel updated successfully', hostel: updatedHostel });
});

// DEACTIVATE / CHANGE STATUS
router.patch('/:id/status', authenticateToken, requireRole('Chief Warden'), (req, res) => {
  const { status } = req.body;
  const hostel = db.findById('hostels', req.params.id);
  if (!hostel) {
    return res.status(404).json({ error: 'Hostel not found' });
  }

  db.update('hostels', req.params.id, { status });
  res.json({ success: true, message: `Hostel status changed to ${status}` });
});

// DELETE HOSTEL
router.delete('/:id', authenticateToken, requireRole('Chief Warden'), (req, res) => {
  const hostel = db.findById('hostels', req.params.id);
  if (!hostel) {
    return res.status(404).json({ error: 'Hostel not found' });
  }

  if (hostel.occupiedBeds && hostel.occupiedBeds > 0) {
    return res.status(400).json({ error: 'Cannot delete hostel because it has currently occupied beds. Please un-allocate students first.' });
  }

  // Delete associated rooms
  const rooms = db.find('rooms', r => r.hostelId === req.params.id);
  rooms.forEach(r => db.remove('rooms', r.id));

  // Delete associated beds
  const beds = db.find('beds', b => b.hostelId === req.params.id);
  beds.forEach(b => db.remove('beds', b.id));

  // Delete the hostel itself
  db.remove('hostels', req.params.id);

  res.json({ success: true, message: 'Hostel and its rooms/beds deleted successfully.' });
});

// KEEP DEPUTY CHIEF WARDEN ALLOCATION RULES FOR COMPATIBILITY
router.put('/allocation-rules', authenticateToken, requireRole('Deputy Chief Warden'), (req, res) => {
  const { rules } = req.body;
  if (!rules || typeof rules !== 'object') {
    return res.status(400).json({ error: 'Rules object is required' });
  }
  let setting = db.findOne('settings', s => s.id === 'allocationRules');
  if (setting) {
    db.update('settings', 'allocationRules', { rules });
  } else {
    db.insert('settings', { id: 'allocationRules', rules });
  }
  res.json({ success: true, message: 'Allocation rules updated successfully', rules });
});
router.get('/allocation-rules/all', authenticateToken, (req, res) => {
  const rules = db.find('settings', s => s.id === 'allocationRules')[0] || { rules: {} };
  res.json({ rules: rules.rules || {} });
});

module.exports = router;
