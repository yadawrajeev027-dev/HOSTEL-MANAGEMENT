const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

function generateTicketNumber() {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `EMG-${year}-${randomNum}`;
}

// Intelligent Routing Map based on requirements
const ROUTING_MAP = {
  'Health Issue': {
    destination: 'Medical Room / Medical Staff',
    defaultAssignee: 'Dr. Alok Verma (Campus Medical Officer)',
    assignedRole: 'Medical Staff',
    priority: 'CRITICAL',
    hotline: '+91 98765 00001 (Medical Emergency Desk)'
  },
  'Hostel Issue': {
    destination: 'Floor Warden / Responsible Warden',
    defaultAssignee: 'Assigned Floor Warden',
    assignedRole: 'Floor Warden',
    priority: 'HIGH',
    hotline: '+91 98765 00002 (Hostel Control)'
  },
  'Room Issue': {
    destination: 'Floor Warden / Caretaker',
    defaultAssignee: 'Assigned Floor Warden',
    assignedRole: 'Floor Warden',
    priority: 'NORMAL',
    hotline: '+91 98765 00002 (Hostel Caretaker)'
  },
  'Electrical Issue': {
    destination: 'Maintenance / Electrical Staff',
    defaultAssignee: 'Rajesh Sharma (Senior Electrician)',
    assignedRole: 'Electrical Staff',
    priority: 'HIGH',
    hotline: '+91 98765 00003 (Electrical Maintenance)'
  },
  'Water Issue': {
    destination: 'Maintenance / Water Staff or responsible Warden',
    defaultAssignee: 'Sanjay Kumar (Plumbing Lead)',
    assignedRole: 'Water Staff',
    priority: 'HIGH',
    hotline: '+91 98765 00004 (Water Supply Desk)'
  },
  'Security Issue': {
    destination: 'Campus Security / Warden',
    defaultAssignee: 'Officer Virendra Rawat (Chief Security)',
    assignedRole: 'Security Staff',
    priority: 'CRITICAL',
    hotline: '+91 98765 00005 (Campus Main Gate Security)'
  },
  'Food/Mess Issue': {
    destination: 'Mess Manager / Responsible Warden',
    defaultAssignee: 'Mr. Pradeep Joshi (Mess Supervisor)',
    assignedRole: 'Mess Manager',
    priority: 'NORMAL',
    hotline: '+91 98765 00006 (Central Mess Desk)'
  },
  'Other Emergency': {
    destination: 'Emergency Response Team / Warden',
    defaultAssignee: 'Hostel Emergency Action Squad',
    assignedRole: 'Emergency Staff',
    priority: 'CRITICAL',
    hotline: '+91 98765 99999 (24x7 University Emergency)'
  }
};

// Smart keyword categorization for spoken voice / unclassified reports
function detectCategoryFromText(text) {
  if (!text) return 'Other Emergency';
  const lower = text.toLowerCase();

  if (/fever|pain|sick|vomit|blood|injury|headache|stomach|doctor|medicine|unconscious|faint|fracture|dizzy|ambulance|breath/i.test(lower)) {
    return 'Health Issue';
  }
  if (/spark|current|wire|light|fan|power|socket|switch|blackout|short circuit|shock|bulb|ac|cooler/i.test(lower)) {
    return 'Electrical Issue';
  }
  if (/water|leak|tap|flush|pipe|drain|shower|tank|drinking water|overflow|geyser|sink/i.test(lower)) {
    return 'Water Issue';
  }
  if (/theft|fight|intruder|thief|weapon|threat|harassment|security|lock|stranger|stolen|noise|gate/i.test(lower)) {
    return 'Security Issue';
  }
  if (/food|mess|meal|dinner|lunch|breakfast|roti|rice|taste|hygiene|caterer|spoiled|insects/i.test(lower)) {
    return 'Food/Mess Issue';
  }
  if (/door|window|bed|cupboard|almirah|key|lock|chair|table|room/i.test(lower)) {
    return 'Room Issue';
  }
  if (/hostel|corridor|balcony|noise|cleaning|garbage|washroom/i.test(lower)) {
    return 'Hostel Issue';
  }
  return 'Other Emergency';
}

// 1. SUBMIT CALL BOOTH REQUEST (Student only)
router.post('/', authenticateToken, (req, res) => {
  if (req.user.role !== 'Student') {
    return res.status(403).json({ error: 'Only students can initiate Call Booth requests' });
  }

  let { category, description, isVoice, hostelName, roomNumber } = req.body;

  if (!description || description.trim().length < 3) {
    return res.status(400).json({ error: 'Please describe the problem or speak your issue' });
  }

  // Automatic categorization if missing or inferred from voice
  if (!category || !ROUTING_MAP[category]) {
    category = detectCategoryFromText(description);
  }

  const routingInfo = ROUTING_MAP[category] || ROUTING_MAP['Other Emergency'];

  const studentUser = db.findById('users', req.user.id);
  const effectiveName = studentUser ? studentUser.name : req.user.name;
  const effectiveRegNo = studentUser ? studentUser.registrationNumber : req.user.registrationNumber;
  const effectiveHostel = hostelName || (studentUser ? studentUser.hostel : req.user.hostel) || 'Block A (Ganga Hostel)';
  const effectiveRoom = roomNumber || (studentUser ? studentUser.roomNumber : req.user.roomNumber) || '204';
  const effectiveFloor = (studentUser ? studentUser.floor : req.user.floor) || '2nd Floor';

  // For hostel/room issue, assign to floor warden of this block/floor if available
  let assignedPerson = routingInfo.defaultAssignee;
  if (category === 'Hostel Issue' || category === 'Room Issue') {
    const fw = db.findOne('users', u => 
      u.role === 'Floor Warden' && 
      u.assignedHostel && u.assignedHostel.toLowerCase().includes(effectiveHostel.toLowerCase().split(' ')[0])
    );
    if (fw) {
      assignedPerson = `${fw.name} (Floor Warden)`;
    }
  }

  const newCall = db.insert('callRequests', {
    ticketNumber: generateTicketNumber(),
    studentId: req.user.id,
    studentName: effectiveName,
    registrationNumber: effectiveRegNo,
    category,
    destination: routingInfo.destination,
    assignedTo: assignedPerson,
    assignedRole: routingInfo.assignedRole,
    priority: routingInfo.priority,
    hotline: routingInfo.hotline,
    hostel: effectiveHostel,
    roomNumber: effectiveRoom,
    floor: effectiveFloor,
    description: description.trim(),
    isVoice: !!isVoice,
    status: 'Open',
    resolution: null,
    resolvedAt: null
  });

  // Notify student
  db.insert('notifications', {
    userId: req.user.id,
    title: `Call Booth: ${category} Logged`,
    message: `Your emergency request (${newCall.ticketNumber}) has been automatically routed to ${routingInfo.destination}. Hotline: ${routingInfo.hotline}`,
    type: 'CALL_LOGGED',
    read: false
  });

  // Notify Wardens & Staff
  const wardens = db.find('users', u => ['Chief Warden', 'Deputy Chief Warden', 'Floor Warden'].includes(u.role));
  wardens.forEach(w => {
    db.insert('notifications', {
      userId: w.id,
      title: `Emergency Alert: ${category}`,
      message: `Call Booth alert from ${effectiveName} (${effectiveHostel}, Room ${effectiveRoom}): "${description.slice(0, 60)}..."`,
      type: 'CALL_ALERT',
      read: false
    });
  });

  res.status(201).json({
    success: true,
    message: `Call Booth request routed immediately to ${routingInfo.destination}`,
    callRequest: newCall,
    routingDetails: routingInfo
  });
});

// 2. GET CALL BOOTH REQUESTS (Filtered by role)
router.get('/', authenticateToken, (req, res) => {
  const { role, id, assignedHostel, assignedFloor } = req.user;

  let requests = [];

  if (role === 'Student') {
    requests = db.find('callRequests', c => c.studentId === id || c.registrationNumber === req.user.registrationNumber);
  } else if (role === 'Floor Warden') {
    // Floor warden sees hostel/room calls for their hostel + any high priority emergency
    requests = db.find('callRequests', c => {
      if (c.priority === 'CRITICAL') return true;
      if (!assignedHostel) return true;
      return c.hostel && c.hostel.toLowerCase().includes(assignedHostel.toLowerCase().split(' ')[0]);
    });
  } else if (role === 'Chief Warden' || role === 'Deputy Chief Warden' || role === 'Department Warden') {
    // Chief / Deputy / Dept see all emergency call booth requests
    requests = db.find('callRequests');
  } else {
    requests = [];
  }

  requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ requests, routingCategories: Object.keys(ROUTING_MAP) });
});

// 3. UPDATE CALL BOOTH STATUS / RESOLUTION
router.put('/:id/status', authenticateToken, (req, res) => {
  if (req.user.role === 'Student') {
    return res.status(403).json({ error: 'Students cannot update Call Booth resolution status' });
  }

  const { status, resolution, assignedTo } = req.body;
  const call = db.findById('callRequests', req.params.id);

  if (!call) {
    return res.status(404).json({ error: 'Call Booth ticket not found' });
  }

  const validStatuses = ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
  const newStatus = status && validStatuses.includes(status) ? status : call.status;

  const updates = {
    status: newStatus,
    resolution: resolution || call.resolution,
    assignedTo: assignedTo || call.assignedTo
  };

  if (newStatus === 'Resolved' || newStatus === 'Closed') {
    updates.resolvedAt = new Date().toISOString();
  }

  const updatedCall = db.update('callRequests', req.params.id, updates);

  // Notify student
  db.insert('notifications', {
    userId: call.studentId,
    title: `Call Booth Ticket ${newStatus}`,
    message: `Your Call Booth ticket (${call.ticketNumber} - ${call.category}) is now '${newStatus}'. ${resolution ? 'Resolution: ' + resolution : ''}`,
    type: 'CALL_RESOLVED',
    read: false
  });

  res.json({
    success: true,
    message: `Call ticket status updated to ${newStatus}`,
    callRequest: updatedCall
  });
});

module.exports = router;
