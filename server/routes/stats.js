const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/overview', authenticateToken, (req, res) => {
  try {
    const { role, id, department, assignedHostel, assignedFloor, assignedDepartment } = req.user;

    const allUsers = db.find('users');
    const allOutpasses = db.find('outpasses');
    const allComplaints = db.find('complaints');
    const allCalls = db.find('callRequests');
    const allHostels = db.find('hostels');

    if (role === 'Student') {
      const myOutpasses = allOutpasses.filter(o => 
        (o.studentId && o.studentId === id) || 
        (o.registrationNumber && req.user.registrationNumber && o.registrationNumber.toUpperCase() === req.user.registrationNumber.toUpperCase())
      );
      const myComplaints = allComplaints.filter(c => 
        (c.studentId && c.studentId === id) || 
        (c.registrationNumber && req.user.registrationNumber && c.registrationNumber.toUpperCase() === req.user.registrationNumber.toUpperCase())
      );
      const myCalls = allCalls.filter(c => 
        (c.studentId && c.studentId === id) || 
        (c.registrationNumber && req.user.registrationNumber && c.registrationNumber.toUpperCase() === req.user.registrationNumber.toUpperCase())
      );

      return res.json({
        role: 'Student',
        stats: {
          totalOutpasses: myOutpasses.length,
          pendingOutpasses: myOutpasses.filter(o => o.finalStatus && o.finalStatus.includes('PENDING')).length,
          approvedOutpasses: myOutpasses.filter(o => o.finalStatus === 'APPROVED').length,
          rejectedOutpasses: myOutpasses.filter(o => o.finalStatus === 'REJECTED').length,
          activeComplaints: myComplaints.filter(c => c.status && c.status !== 'Resolved' && c.status !== 'Closed').length,
          resolvedComplaints: myComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length,
          activeCalls: myCalls.filter(c => c.status && c.status !== 'Resolved' && c.status !== 'Closed').length
        },
        recentOutpasses: myOutpasses.slice(0, 3),
        recentComplaints: myComplaints.slice(0, 3),
        recentCalls: myCalls.slice(0, 3)
      });
    }

    if (role === 'Floor Warden') {
      const floorStudents = allUsers.filter(u => {
        if (u.role !== 'Student') return false;
        if (!assignedHostel) return true;
        const hostelMatch = u.hostel && u.hostel.toLowerCase().includes(assignedHostel.toLowerCase().split(' ')[0]);
        if (assignedFloor) return hostelMatch && u.floor === assignedFloor;
        return hostelMatch;
      });

      const pendingFloorOutpasses = allOutpasses.filter(o => {
        if (o.finalStatus !== 'PENDING_WARDEN_APPROVAL') return false;
        if (!assignedHostel) return true;
        return o.hostel && o.hostel.toLowerCase().includes(assignedHostel.toLowerCase().split(' ')[0]);
      });

      const floorComplaints = allComplaints.filter(c => {
        if (c.assignedRole !== 'Floor Warden') return false;
        if (!assignedHostel) return true;
        return c.hostel && c.hostel.toLowerCase().includes(assignedHostel.toLowerCase().split(' ')[0]);
      });

      const floorCalls = allCalls.filter(c => {
        if (!assignedHostel) return true;
        return c.hostel && c.hostel.toLowerCase().includes(assignedHostel.toLowerCase().split(' ')[0]);
      });

      return res.json({
        role: 'Floor Warden',
        stats: {
          totalStudents: floorStudents.length,
          pendingWardenApprovals: pendingFloorOutpasses.length,
          activeComplaints: floorComplaints.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length,
          activeCallRequests: floorCalls.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length
        },
        pendingOutpasses: pendingFloorOutpasses.slice(0, 5),
        recentComplaints: floorComplaints.slice(0, 5),
        recentCalls: floorCalls.slice(0, 5)
      });
    }

    if (role === 'Department Warden') {
      const deptStudents = allUsers.filter(u => {
        if (u.role !== 'Student') return false;
        if (!assignedDepartment) return true;
        return u.department && u.department.toLowerCase() === assignedDepartment.toLowerCase();
      });

      const deptComplaints = allComplaints.filter(c => {
        if (c.assignedRole !== 'Department Warden') return false;
        if (!assignedDepartment) return true;
        return c.department && c.department.toLowerCase() === assignedDepartment.toLowerCase();
      });

      return res.json({
        role: 'Department Warden',
        stats: {
          totalStudents: deptStudents.length,
          activeComplaints: deptComplaints.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length,
          totalComplaints: deptComplaints.length,
          resolvedComplaints: deptComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length
        },
        recentComplaints: deptComplaints.slice(0, 5)
      });
    }

    if (role === 'Deputy Chief Warden') {
      const totalStudents = allUsers.filter(u => u.role === 'Student').length;
      const deputyComplaints = allComplaints.filter(c => c.assignedRole === 'Deputy Chief Warden');
      const emergencyCalls = allCalls.filter(c => c.priority === 'CRITICAL' || c.status === 'Open');

      return res.json({
        role: 'Deputy Chief Warden',
        stats: {
          totalStudents,
          totalHostels: allHostels.length,
          activeComplaints: deputyComplaints.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length,
          activeEmergencyCalls: emergencyCalls.length,
          pendingOutpassesAll: allOutpasses.filter(o => o.finalStatus && o.finalStatus.includes('PENDING')).length
        },
        recentComplaints: deputyComplaints.slice(0, 5),
        recentEmergencies: emergencyCalls.slice(0, 5)
      });
    }

    if (role === 'Chief Warden') {
      const totalStudents = allUsers.filter(u => u.role === 'Student').length;
      const pendingChiefApprovals = allOutpasses.filter(o => o.finalStatus === 'PENDING_CHIEF_APPROVAL');
      const approvedOutpasses = allOutpasses.filter(o => o.finalStatus === 'APPROVED');
      const rejectedOutpasses = allOutpasses.filter(o => o.finalStatus === 'REJECTED');
      const chiefComplaints = allComplaints.filter(c => c.assignedRole === 'Chief Warden');
      const activeEmergencies = allCalls.filter(c => c.status !== 'Resolved' && c.status !== 'Closed');

      let totalCapacity = 0;
      let totalBeds = 0;
      let totalOccupancy = 0;

      allHostels.forEach(h => {
        totalCapacity += (h.capacity || 0);
        totalBeds += (h.totalBeds || h.capacity || 0);
        totalOccupancy += (h.occupiedBeds || 0);
      });

      const categoryBreakdown = {};
      allCalls.forEach(c => {
        categoryBreakdown[c.category] = (categoryBreakdown[c.category] || 0) + 1;
      });

      return res.json({
        role: 'Chief Warden',
        stats: {
          pendingChiefApprovals: pendingChiefApprovals.length,
          totalStudents,
          totalHostels: allHostels.length,
          totalCapacity,
          totalBeds,
          totalOccupancy,
          availableBeds: totalBeds - totalOccupancy,
          occupancyRate: totalBeds ? Math.round((totalOccupancy / totalBeds) * 100) : 0,
          activeComplaints: chiefComplaints.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length,
          activeEmergencyRequests: activeEmergencies.length,
          approvedOutpasses: approvedOutpasses.length,
          rejectedOutpasses: rejectedOutpasses.length
        },
        pendingOutpassApprovals: pendingChiefApprovals.slice(0, 6),
        recentComplaints: chiefComplaints.slice(0, 5),
        activeEmergencies: activeEmergencies.slice(0, 5),
        hostels: allHostels,
        categoryBreakdown
      });
    }

  } catch (err) {
    console.error('Error calculating overview stats:', err);
    res.status(500).json({ error: 'Failed to calculate stats', message: err.message });
  }
});

module.exports = router;
