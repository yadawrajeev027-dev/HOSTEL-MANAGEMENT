const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Helper to generate outpass ticket number
function generateOutpassNumber() {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `OP-${year}-${randomNum}`;
}

// 1. SUBMIT OUTPASS REQUEST (Student only)
router.post('/', authenticateToken, (req, res) => {
  if (req.user.role !== 'Student') {
    return res.status(403).json({ error: 'Only students can submit outpass requests' });
  }

  const {
    studentName,
    registrationNumber,
    purpose,
    outTime,
    inTime,
    guardianPhone,
    department,
    year,
    branch,
    section,
    hostelName,
    roomNumber,
    selectedWardenId // NEW: Explicitly selected floor warden
  } = req.body;

  if (!purpose || !outTime || !inTime || !guardianPhone || !selectedWardenId) {
    return res.status(400).json({ error: 'Purpose, Out Time, In Time, Guardian Phone, and Warden selection are required' });
  }

  const studentUser = db.findById('users', req.user.id);
  const effectiveName = studentName || (studentUser ? studentUser.name : req.user.name);
  const effectiveRegNo = registrationNumber || (studentUser ? studentUser.registrationNumber : req.user.registrationNumber);
  const effectiveHostel = hostelName || (studentUser ? studentUser.hostel : req.user.hostel) || 'Unassigned';
  const effectiveRoom = roomNumber || (studentUser ? studentUser.roomNumber : req.user.roomNumber) || 'Unassigned';
  const effectiveFloor = (studentUser ? studentUser.floor : req.user.floor) || 'Unassigned';
  const effectiveDept = department || (studentUser ? studentUser.department : req.user.department) || 'Unassigned';
  const effectiveYear = year || (studentUser ? studentUser.year : req.user.year) || 'Unassigned';
  const effectiveBranch = branch || (studentUser ? studentUser.branch : req.user.branch) || 'Unassigned';
  const effectiveSection = section || (studentUser ? studentUser.section : req.user.section) || 'A';

  const newOutpass = db.insert('outpasses', {
    outpassNumber: generateOutpassNumber(),
    studentId: req.user.id,
    studentName: effectiveName,
    registrationNumber: effectiveRegNo,
    purpose,
    outTime,
    inTime,
    guardianPhone,
    department: effectiveDept,
    year: effectiveYear,
    branch: effectiveBranch,
    section: effectiveSection,
    hostel: effectiveHostel,
    roomNumber: effectiveRoom,
    floor: effectiveFloor,
    assignedWardenId: selectedWardenId, // NEW: Lock to this specific warden
    
    // Workflow tracking: Step 1 submitted, now pending Floor Warden
    wardenStatus: 'PENDING',
    wardenId: null,
    wardenName: null,
    wardenRemarks: null,
    wardenActionDate: null,

    chiefWardenStatus: 'PENDING',
    chiefWardenId: null,
    chiefWardenName: null,
    chiefWardenRemarks: null,
    chiefWardenActionDate: null,

    finalStatus: 'PENDING_WARDEN_APPROVAL',
    rejectionReason: null
  });

  // Notify student
  db.insert('notifications', {
    userId: req.user.id,
    title: 'Outpass Submitted',
    message: `Your Outpass request (${newOutpass.outpassNumber}) has been submitted and sent to your selected Warden for review.`,
    type: 'OUTPASS_SUBMITTED',
    read: false
  });

  // Notify the explicitly selected Floor Warden
  const selectedWarden = db.findById('users', selectedWardenId);
  if (selectedWarden) {
    db.insert('notifications', {
      userId: selectedWarden.id,
      title: 'New Outpass Request',
      message: `New Outpass request (${newOutpass.outpassNumber}) from ${effectiveName} (${effectiveRegNo}) requires your review.`,
      type: 'OUTPASS_SUBMITTED',
      read: false
    });
  }

  res.status(201).json({
    success: true,
    message: 'Outpass request submitted successfully and forwarded to your Warden',
    outpass: newOutpass
  });
});

// 2. GET OUTPASSES (Role-based list)
router.get('/', authenticateToken, (req, res) => {
  const { role, id, department, assignedHostel, assignedFloor, assignedDepartment } = req.user;

  let outpasses = [];

  if (role === 'Student') {
    // Student sees only their own outpasses
    outpasses = db.find('outpasses', o => o.studentId === id || o.registrationNumber === req.user.registrationNumber);
  } else if (role === 'Floor Warden') {
    // Floor warden sees outpasses EXPLICITLY assigned to them, OR fallback matching
    outpasses = db.find('outpasses', o => {
      if (o.assignedWardenId === id) return true;
      // Fallback for old outpasses
      if (!assignedHostel) return true;
      const hostelMatch = o.hostel === assignedHostel;
      if (assignedFloor) {
        return hostelMatch && (String(o.floor) === String(assignedFloor) || !o.floor);
      }
      return hostelMatch;
    });
  } else if (role === 'Department Warden') {
    // Department warden sees outpasses for their department
    outpasses = db.find('outpasses', o => {
      if (!assignedDepartment) return true;
      return o.department && o.department.toLowerCase() === assignedDepartment.toLowerCase();
    });
  } else if (role === 'Chief Warden' || role === 'Deputy Chief Warden') {
    // Chief / Deputy Chief Warden sees all outpasses
    outpasses = db.find('outpasses');
  } else {
    outpasses = [];
  }

  // Sort by createdAt descending
  outpasses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ outpasses });
});

// 3. GET SINGLE OUTPASS DETAILS
router.get('/:id', authenticateToken, (req, res) => {
  const outpass = db.findById('outpasses', req.params.id);
  if (!outpass) {
    return res.status(404).json({ error: 'Outpass not found' });
  }

  // Security check: Student can only view their own pass
  if (req.user.role === 'Student' && outpass.studentId !== req.user.id && outpass.registrationNumber !== req.user.registrationNumber) {
    return res.status(403).json({ error: 'Forbidden: You cannot view other students outpass' });
  }

  res.json({ outpass });
});

// 4. STEP 2: FLOOR WARDEN REVIEW (Accept or Reject)
router.put('/:id/warden-review', authenticateToken, requireRole('Floor Warden', 'Chief Warden', 'Deputy Chief Warden'), (req, res) => {
  const { action, remarks, rejectionReason } = req.body; // action: 'ACCEPT' or 'REJECT'

  if (!action || !['ACCEPT', 'REJECT'].includes(action.toUpperCase())) {
    return res.status(400).json({ error: "Action must be 'ACCEPT' or 'REJECT'" });
  }

  const outpass = db.findById('outpasses', req.params.id);
  if (!outpass) {
    return res.status(404).json({ error: 'Outpass not found' });
  }

  if (outpass.finalStatus !== 'PENDING_WARDEN_APPROVAL') {
    return res.status(400).json({ error: `Cannot review outpass in current status '${outpass.finalStatus}'` });
  }

  const isAccept = action.toUpperCase() === 'ACCEPT';
  const wardenName = req.user.name || 'Floor Warden';

  const updates = {
    wardenStatus: isAccept ? 'ACCEPTED' : 'REJECTED',
    wardenId: req.user.id,
    wardenName: wardenName,
    wardenRemarks: remarks || (isAccept ? 'Verified and recommended for Chief Warden approval' : 'Rejected by warden'),
    wardenActionDate: new Date().toISOString()
  };

  if (isAccept) {
    // Forwarded to Step 3/4: Chief Warden Approval
    updates.finalStatus = 'PENDING_CHIEF_APPROVAL';

    // Notify Chief & Deputy Chief Wardens
    const seniorWardens = db.find('users', u => u.role === 'Chief Warden' || u.role === 'Deputy Chief Warden');
    seniorWardens.forEach(cw => {
      db.insert('notifications', {
        userId: cw.id,
        title: 'New Outpass Approval Required',
        message: `Warden ${wardenName} accepted Outpass (${outpass.outpassNumber}) for ${outpass.studentName}. Requires your final approval.`,
        type: 'OUTPASS_WARDEN_ACCEPTED',
        read: false
      });
    });

    // Notify Student
    db.insert('notifications', {
      userId: outpass.studentId,
      title: 'Outpass Accepted by Warden',
      message: `Your Outpass (${outpass.outpassNumber}) was accepted by Warden ${wardenName} and forwarded to Chief Warden for final approval.`,
      type: 'OUTPASS_WARDEN_ACCEPTED',
      read: false
    });
  } else {
    // Rejected at Step 2
    updates.finalStatus = 'REJECTED';
    updates.rejectionReason = rejectionReason || remarks || 'Rejected by Warden';

    // Notify Student
    db.insert('notifications', {
      userId: outpass.studentId,
      title: 'Outpass Rejected by Warden',
      message: `Your Outpass (${outpass.outpassNumber}) was rejected by Warden. Reason: ${updates.rejectionReason}`,
      type: 'OUTPASS_REJECTED',
      read: false
    });
  }

  const updatedOutpass = db.update('outpasses', req.params.id, updates);

  res.json({
    success: true,
    message: isAccept 
      ? 'Outpass accepted and forwarded to Chief Warden for final approval' 
      : 'Outpass rejected',
    outpass: updatedOutpass
  });
});

// 5. STEP 4: CHIEF WARDEN FINAL APPROVAL (Approve or Reject)
router.put('/:id/chief-review', authenticateToken, requireRole('Chief Warden', 'Deputy Chief Warden'), (req, res) => {
  const { action, remarks, rejectionReason } = req.body; // action: 'APPROVE' or 'REJECT'

  if (!action || !['APPROVE', 'REJECT'].includes(action.toUpperCase())) {
    return res.status(400).json({ error: "Action must be 'APPROVE' or 'REJECT'" });
  }

  const outpass = db.findById('outpasses', req.params.id);
  if (!outpass) {
    return res.status(404).json({ error: 'Outpass not found' });
  }

  if (outpass.finalStatus !== 'PENDING_CHIEF_APPROVAL') {
    return res.status(400).json({ error: `Cannot perform Chief Warden approval on outpass in status '${outpass.finalStatus}'` });
  }

  const isApprove = action.toUpperCase() === 'APPROVE';
  const chiefName = req.user.name || 'Chief Warden';

  const updates = {
    chiefWardenStatus: isApprove ? 'APPROVED' : 'REJECTED',
    chiefWardenId: req.user.id,
    chiefWardenName: chiefName,
    chiefWardenRemarks: remarks || (isApprove ? 'Final approval granted' : 'Denied by Chief Warden'),
    chiefWardenActionDate: new Date().toISOString()
  };

  if (isApprove) {
    // Step 5: Final Permission APPROVED & Digital Pass Generated
    updates.finalStatus = 'APPROVED';

    // Notify Student
    db.insert('notifications', {
      userId: outpass.studentId,
      title: 'Your Outpass has been approved!',
      message: `Congratulations! Your Outpass (${outpass.outpassNumber}) has been approved by Chief Warden ${chiefName}. Your digital pass is ready.`,
      type: 'OUTPASS_APPROVED',
      read: false
    });
  } else {
    // Rejected at Step 4
    updates.finalStatus = 'REJECTED';
    updates.rejectionReason = rejectionReason || remarks || 'Rejected by Chief Warden';

    // Notify Student
    db.insert('notifications', {
      userId: outpass.studentId,
      title: 'Outpass Rejected by Chief Warden',
      message: `Your Outpass (${outpass.outpassNumber}) was rejected by Chief Warden. Reason: ${updates.rejectionReason}`,
      type: 'OUTPASS_REJECTED',
      read: false
    });
  }

  const updatedOutpass = db.update('outpasses', req.params.id, updates);

  res.json({
    success: true,
    message: isApprove 
      ? 'Outpass successfully APPROVED. Digital Outpass has been issued.' 
      : 'Outpass REJECTED by Chief Warden.',
    outpass: updatedOutpass
  });
});

module.exports = router;
