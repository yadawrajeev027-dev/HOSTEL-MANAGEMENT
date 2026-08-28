const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const { authenticateToken } = require('../middleware/auth');
const db = require('../db');

router.post('/call', authenticateToken, async (req, res) => {
  const { serviceId, text, serviceName } = req.body;
  const user = db.findById('users', req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Create an emergency request log (Requirement 11)
  const logEntry = {
    id: 'emg_' + Date.now(),
    studentId: user.id,
    studentName: user.name,
    registrationNumber: user.registrationNumber,
    hostel: user.hostel || 'N/A',
    roomNumber: user.roomNumber || 'N/A',
    recognizedSpeech: text,
    detectedService: serviceName,
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
    callStatus: 'Connecting...',
    callId: null,
    duration: null,
    createdAt: new Date().toISOString()
  };

  db.insert('callRequests', logEntry); // We use callRequests or a new array. The user said "backend record for each emergency request." Let's reuse callRequests or add to a new `emergencyLogs` array, but the db is fixed. Let's just push to callRequests. Wait, the schema in seed.js has callRequests, so let's use that.

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID ? process.env.TWILIO_ACCOUNT_SID.trim() : null;
    const authToken = process.env.TWILIO_AUTH_TOKEN ? process.env.TWILIO_AUTH_TOKEN.trim() : null;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER ? process.env.TWILIO_PHONE_NUMBER.trim() : null;
    
    // Map services to phone numbers.
    const servicePhones = {
      'HEALTH_CENTER': process.env.HEALTH_CENTER_PHONE || '+1234567890',
      'BUS_SERVICE': process.env.BUS_SERVICE_PHONE || '+1234567891',
      'FIRE_EMERGENCY': process.env.FIRE_EMERGENCY_PHONE || '+1234567892',
      'FIRE_SAFETY': process.env.FIRE_SAFETY_PHONE || '+1234567893'
    };

    const toPhone = servicePhones[serviceId] || process.env.EMERGENCY_PHONE || '+1000000000';

    // MOCK MODE: Simulate the ringing phase for presentations without making an actual Twilio call
    console.log(`[MOCK MODE] Simulating call to ${serviceName} at ${toPhone}...`);
    
    // Simulate a 2.5 second "ringing/connecting" delay for the UI
    await new Promise(resolve => setTimeout(resolve, 2500));

    logEntry.callId = 'mock_' + Date.now();
    logEntry.callStatus = 'Call Connected';
    db.update('callRequests', logEntry.id, { callId: logEntry.callId, callStatus: 'Call Connected' });
    
    return res.json({ success: true, message: 'Call Connected', callId: logEntry.callId, logId: logEntry.id, callRequest: logEntry, isMock: true });
    
  } catch (error) {
    console.error('Twilio Error:', error);
    logEntry.callStatus = 'Call Failed';
    db.update('callRequests', logEntry.id, { callStatus: 'Call Failed' });
    return res.status(500).json({ error: `Twilio Error: ${error.message}` });
  }
});

module.exports = router;
