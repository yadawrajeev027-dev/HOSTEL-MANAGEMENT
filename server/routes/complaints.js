const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

function generateComplaintNumber() {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `CMP-${year}-${randomNum}`;
}

// 1. SUBMIT COMPLAINT (Student only)
router.post('/', authenticateToken, (req, res) => {
  if (req.user.role !== 'Student') {
    return res.status(403).json({ error: 'Only students can submit complaints' });
  }

  const {
    complaintTo,
    studentName,
    registrationNumber,
    hostelName,
    roomNumber,
    description
  } = req.body;

  const validTargets = ['Floor Warden', 'Department Warden', 'Deputy Chief Warden', 'Chief Warden'];
  if (!complaintTo || !validTargets.includes(complaintTo)) {
    return res.status(400).json({ error: `Complaint To must be one of: ${validTargets.join(', ')}` });
  }

  if (!description || description.trim().length < 5) {
    return res.status(400).json({ error: 'Complaint description is required (minimum 5 characters)' });
  }

  const studentUser = db.findById('users', req.user.id);
  const effectiveName = studentName || (studentUser ? studentUser.name : req.user.name);
  const effectiveRegNo = registrationNumber || (studentUser ? studentUser.registrationNumber : req.user.registrationNumber);
  const effectiveHostel = hostelName || (studentUser ? studentUser.hostel : req.user.hostel) || 'Block A (Ganga Hostel)';
  const effectiveRoom = roomNumber || (studentUser ? studentUser.roomNumber : req.user.roomNumber) || '204';
  const effectiveFloor = (studentUser ? studentUser.floor : req.user.floor) || '2nd Floor';
  const effectiveDept = (studentUser ? studentUser.department : req.user.department) || 'Computer Science & Engineering';

  const newComplaint = db.insert('complaints', {
    complaintNumber: generateComplaintNumber(),
    complaintTo: complaintTo,
    assignedRole: complaintTo, // Strict role targeting
    studentId: req.user.id,
    studentName: effectiveName,
    registrationNumber: effectiveRegNo,
    hostel: effectiveHostel,
    roomNumber: effectiveRoom,
    floor: effectiveFloor,
    department: effectiveDept,
    description: description.trim(),
    status: 'Submitted',
    response: null,
    respondedBy: null,
    respondedAt: null
  });

  // Notify student
  db.insert('notifications', {
    userId: req.user.id,
    title: 'Complaint Submitted',
    message: `Your complaint (${newComplaint.complaintNumber}) has been submitted to ${complaintTo}.`,
    type: 'COMPLAINT_SUBMITTED',
    read: false
  });

  // Notify the exact target authority
  const targetAuthorities = db.find('users', u => {
    if (u.role !== complaintTo) return false;
    if (complaintTo === 'Floor Warden' && u.assignedHostel) {
      return u.assignedHostel.toLowerCase().includes(effectiveHostel.toLowerCase().split(' ')[0]);
    }
    if (complaintTo === 'Department Warden' && u.assignedDepartment) {
      return u.assignedDepartment.toLowerCase() === effectiveDept.toLowerCase();
    }
    return true;
  });

  targetAuthorities.forEach(auth => {
    db.insert('notifications', {
      userId: auth.id,
      title: 'New Complaint Received',
      message: `New complaint (${newComplaint.complaintNumber}) submitted by ${effectiveName} (${effectiveRegNo}) directed to ${complaintTo}.`,
      type: 'COMPLAINT_RECEIVED',
      read: false
    });
  });

  res.status(201).json({
    success: true,
    message: `Complaint submitted successfully to ${complaintTo}`,
    complaint: newComplaint
  });
});

// 2. GET COMPLAINTS (Strictly authorized role-based filter)
router.get('/', authenticateToken, (req, res) => {
  const { role, id, department, assignedHostel, assignedFloor, assignedDepartment } = req.user;

  let complaints = [];

  if (role === 'Student') {
    // Student sees ONLY their own complaints
    complaints = db.find('complaints', c => c.studentId === id || c.registrationNumber === req.user.registrationNumber);
  } else if (role === 'Floor Warden') {
    // Floor Warden sees ONLY complaints specifically addressed to 'Floor Warden'
    // for their hostel/floor
    complaints = db.find('complaints', c => {
      if (c.assignedRole !== 'Floor Warden' && c.complaintTo !== 'Floor Warden') return false;
      if (!assignedHostel) return true;
      const hostelMatch = c.hostel && c.hostel.toLowerCase().includes(assignedHostel.toLowerCase().split(' ')[0]);
      if (assignedFloor) {
        return hostelMatch && (c.floor === assignedFloor || !c.floor);
      }
      return hostelMatch;
    });
  } else if (role === 'Department Warden') {
    // Department Warden sees ONLY complaints addressed to 'Department Warden' for their department
    complaints = db.find('complaints', c => {
      if (c.assignedRole !== 'Department Warden' && c.complaintTo !== 'Department Warden') return false;
      if (!assignedDepartment) return true;
      return c.department && c.department.toLowerCase() === assignedDepartment.toLowerCase();
    });
  } else if (role === 'Deputy Chief Warden') {
    // Deputy Chief Warden sees ONLY complaints addressed to 'Deputy Chief Warden'
    complaints = db.find('complaints', c => c.assignedRole === 'Deputy Chief Warden' || c.complaintTo === 'Deputy Chief Warden');
  } else if (role === 'Chief Warden') {
    // Chief Warden sees ONLY complaints addressed to 'Chief Warden' (per strict rule #10)
    complaints = db.find('complaints', c => c.assignedRole === 'Chief Warden' || c.complaintTo === 'Chief Warden');
  } else {
    complaints = [];
  }

  complaints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ complaints });
});

// 3. GET SINGLE COMPLAINT WITH STRICT AUTHORIZATION
router.get('/:id', authenticateToken, (req, res) => {
  const complaint = db.findById('complaints', req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  // Strict Authorization Check
  if (req.user.role === 'Student') {
    if (complaint.studentId !== req.user.id && complaint.registrationNumber !== req.user.registrationNumber) {
      return res.status(403).json({ error: 'Forbidden: You cannot view other students complaints' });
    }
  } else {
    // If Admin/Warden, check if the complaint was addressed to their role
    if (complaint.assignedRole !== req.user.role && complaint.complaintTo !== req.user.role) {
      return res.status(403).json({ 
        error: `Forbidden: This complaint was submitted specifically to '${complaint.complaintTo}', not accessible by '${req.user.role}'` 
      });
    }
  }

  res.json({ complaint });
});

// 4. RESPOND TO COMPLAINT & UPDATE STATUS
router.put('/:id/respond', authenticateToken, (req, res) => {
  if (req.user.role === 'Student') {
    return res.status(403).json({ error: 'Students cannot respond to complaints' });
  }

  const { response, status } = req.body;
  const complaint = db.findById('complaints', req.params.id);
  
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  // Strict role check
  if (complaint.assignedRole !== req.user.role && complaint.complaintTo !== req.user.role) {
    return res.status(403).json({ 
      error: `Forbidden: This complaint is assigned to '${complaint.complaintTo}'` 
    });
  }

  const validStatuses = ['Submitted', 'Received', 'In Progress', 'Resolved', 'Closed'];
  const newStatus = status && validStatuses.includes(status) ? status : 'In Progress';

  const updates = {
    status: newStatus,
    response: response || complaint.response,
    respondedBy: `${req.user.name} (${req.user.role})`,
    respondedAt: new Date().toISOString()
  };

  const updatedComplaint = db.update('complaints', req.params.id, updates);

  // Notify student about response
  db.insert('notifications', {
    userId: complaint.studentId,
    title: 'Complaint Update Received',
    message: `${req.user.role} responded to your complaint (${complaint.complaintNumber}): Status updated to '${newStatus}'`,
    type: 'COMPLAINT_RESPONSE',
    read: false
  });

  res.json({
    success: true,
    message: 'Complaint response recorded successfully',
    complaint: updatedComplaint
  });
});

module.exports = router;
