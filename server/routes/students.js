const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET STUDENTS DIRECTORY
router.get('/', authenticateToken, (req, res) => {
  const { search, department, hostel, year, floor } = req.query;
  const userRole = req.user.role;

  let students = db.find('users', u => u.role === 'Student');

  // If department warden, filter to their dept by default
  if (userRole === 'Department Warden' && req.user.assignedDepartment) {
    students = students.filter(s => s.department && s.department.toLowerCase() === req.user.assignedDepartment.toLowerCase());
  }

  // If floor warden, filter to their hostel by default
  if (userRole === 'Floor Warden' && req.user.assignedHostel) {
    const hostelShort = req.user.assignedHostel.split(' ')[0].toLowerCase();
    students = students.filter(s => s.hostel && s.hostel.toLowerCase().includes(hostelShort));
  }

  // Query filters
  if (search) {
    const s = search.toLowerCase();
    students = students.filter(std => 
      std.name.toLowerCase().includes(s) ||
      (std.registrationNumber && std.registrationNumber.toLowerCase().includes(s)) ||
      (std.roomNumber && std.roomNumber.toLowerCase().includes(s))
    );
  }

  if (department) {
    students = students.filter(std => std.department === department);
  }

  if (hostel) {
    students = students.filter(std => std.hostel === hostel);
  }

  if (year) {
    students = students.filter(std => std.year === year);
  }

  const safeStudents = students.map(({ passwordHash, ...safe }) => safe);
  res.json({ students: safeStudents, total: safeStudents.length });
});

// GET SINGLE STUDENT
router.get('/:id', authenticateToken, (req, res) => {
  const student = db.findById('users', req.params.id);
  if (!student || student.role !== 'Student') {
    return res.status(404).json({ error: 'Student not found' });
  }
  const { passwordHash, ...safe } = student;
  
  // Attach student's outpasses & complaints for profile view
  const outpasses = db.find('outpasses', o => o.studentId === student.id);
  const complaints = db.find('complaints', c => c.studentId === student.id);
  const calls = db.find('callRequests', c => c.studentId === student.id);

  res.json({ student: safe, outpasses, complaints, calls });
});

// DELETE STUDENT
router.delete('/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'Chief Warden') {
    return res.status(403).json({ error: 'Only Chief Warden can delete students' });
  }

  const student = db.findById('users', req.params.id);
  if (!student || student.role !== 'Student') {
    return res.status(404).json({ error: 'Student not found' });
  }

  // Find their bed and free it up
  const bed = db.findOne('beds', b => b.studentId === req.params.id);
  if (bed) {
    db.update('beds', bed.id, {
      status: 'Available',
      studentId: null,
      studentName: null
    });
    
    // Decrement occupiedBeds on hostel
    const hostel = db.findById('hostels', bed.hostelId);
    if (hostel && hostel.occupiedBeds > 0) {
      db.update('hostels', hostel.id, { occupiedBeds: hostel.occupiedBeds - 1 });
    }
  }

  // Remove their outpasses, complaints, calls (optional, but good for cleanup)
  const outpasses = db.find('outpasses', o => o.studentId === req.params.id);
  outpasses.forEach(o => db.remove('outpasses', o.id));

  const complaints = db.find('complaints', c => c.studentId === req.params.id);
  complaints.forEach(c => db.remove('complaints', c.id));

  const calls = db.find('callRequests', c => c.studentId === req.params.id);
  calls.forEach(c => db.remove('callRequests', c.id));

  // Delete student
  db.remove('users', req.params.id);

  res.json({ success: true, message: 'Student deleted successfully' });
});

module.exports = router;
