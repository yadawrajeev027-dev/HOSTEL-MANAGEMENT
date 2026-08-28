const http = require('http');
const db = require('./db');

// Run seed to ensure fresh clean state
require('./seed');

async function main() {
  console.log('🧪 Starting End-to-End Workflow Verification...\n');

  // 1. Start test server
  const express = require('express');
  const app = express();
  app.use(express.json());
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/outpasses', require('./routes/outpasses'));
  app.use('/api/complaints', require('./routes/complaints'));
  app.use('/api/callbooth', require('./routes/callbooth'));
  app.use('/api/notifications', require('./routes/notifications'));
  app.use('/api/stats', require('./routes/stats'));

  const server = app.listen(5001);
  const BASE = 'http://localhost:5001/api';

  async function post(endpoint, body, token) {
    const res = await fetch(`${BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    });
    return { status: res.status, data: await res.json() };
  }

  async function put(endpoint, body, token) {
    const res = await fetch(`${BASE}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    });
    return { status: res.status, data: await res.json() };
  }

  async function get(endpoint, token) {
    const res = await fetch(`${BASE}${endpoint}`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    return { status: res.status, data: await res.json() };
  }

  try {
    // TEST 1: Authentication for all roles
    console.log('👉 TEST 1: Role Authentication');
    
    // 1a. Student Login
    const stdLogin = await post('/auth/student-login', {
      registrationNumber: '21BCE1042',
      password: 'password123'
    });
    if (stdLogin.status !== 200 || !stdLogin.data.token) throw new Error('Student login failed');
    const studentToken = stdLogin.data.token;
    console.log('   ✅ Student Login successful (Rahul Sharma, 21BCE1042)');

    // 1b. Floor Warden Login
    const fwLogin = await post('/auth/admin-login', {
      role: 'Floor Warden',
      username: 'fw_b1',
      password: 'password123'
    });
    if (fwLogin.status !== 200 || !fwLogin.data.token) throw new Error('Floor Warden login failed');
    const floorWardenToken = fwLogin.data.token;
    console.log('   ✅ Floor Warden Login successful (Mr. Amit Kumar)');

    // 1c. Department Warden Login
    const deptLogin = await post('/auth/admin-login', {
      role: 'Department Warden',
      username: 'dept_cse',
      password: 'password123'
    });
    if (deptLogin.status !== 200) throw new Error('Department Warden login failed');
    const deptWardenToken = deptLogin.data.token;
    console.log('   ✅ Department Warden Login successful (Prof. Rajesh Gupta)');

    // 1d. Deputy Chief Warden Login
    const dcwLogin = await post('/auth/admin-login', {
      role: 'Deputy Chief Warden',
      username: 'dcw_admin',
      password: 'password123'
    });
    if (dcwLogin.status !== 200) throw new Error('Deputy Chief Warden login failed');
    const deputyChiefToken = dcwLogin.data.token;
    console.log('   ✅ Deputy Chief Warden Login successful (Dr. Sunita Verma)');

    // 1e. Chief Warden Login
    const cwLogin = await post('/auth/admin-login', {
      role: 'Chief Warden',
      username: 'cw_admin',
      password: 'password123'
    });
    if (cwLogin.status !== 200 || !cwLogin.data.token) throw new Error('Chief Warden login failed');
    const chiefWardenToken = cwLogin.data.token;
    console.log('   ✅ Chief Warden Login successful (Dr. K. Ramesh Sharma)');


    // TEST 2: Call Booth Automatic Routing Workflow
    console.log('\n👉 TEST 2: Call Booth Automatic Routing Workflow');
    
    // 2a. Health Issue -> Medical Room
    const healthCall = await post('/callbooth', {
      category: 'Health Issue',
      description: 'I am having a high fever (103 F) and severe headache in Room 204'
    }, studentToken);
    if (healthCall.status !== 201 || healthCall.data.callRequest.destination !== 'Medical Room / Medical Staff') {
      throw new Error(`Health Call routing failed: ${JSON.stringify(healthCall.data)}`);
    }
    console.log(`   ✅ Health Issue automatically routed to: "${healthCall.data.callRequest.destination}" [Assigned: ${healthCall.data.callRequest.assignedTo}]`);

    // 2b. Voice Issue (Auto-detected category: Electrical Issue)
    const voiceCall = await post('/callbooth', {
      description: 'The power socket in my room is sparking and light is flickering',
      isVoice: true
    }, studentToken);
    if (voiceCall.status !== 201 || voiceCall.data.callRequest.category !== 'Electrical Issue') {
      throw new Error(`Voice category detection failed: ${JSON.stringify(voiceCall.data)}`);
    }
    console.log(`   ✅ Voice report auto-detected as "${voiceCall.data.callRequest.category}" ➔ Routed to "${voiceCall.data.callRequest.destination}"`);


    // TEST 3: Outpass 5-Step Approval Lifecycle Workflow
    console.log('\n👉 TEST 3: Outpass 5-Step Approval Lifecycle Workflow');

    // Step 1: Student submits Outpass
    const outpassSubmit = await post('/outpasses', {
      purpose: 'Attending IEEE International Conference in Delhi',
      outTime: '2025-09-10T06:00',
      inTime: '2025-09-12T22:00',
      guardianPhone: '+91 98450 12345'
    }, studentToken);
    if (outpassSubmit.status !== 201) throw new Error(`Outpass submit failed: ${JSON.stringify(outpassSubmit.data)}`);
    const newOutpassId = outpassSubmit.data.outpass.id;
    console.log(`   ✅ Step 1: Student submitted Outpass (${outpassSubmit.data.outpass.outpassNumber}). Status: ${outpassSubmit.data.outpass.finalStatus}`);

    // Step 2: Floor Warden accepts
    const wardenReview = await put(`/outpasses/${newOutpassId}/warden-review`, {
      action: 'ACCEPT',
      remarks: 'Conference invitation verified with CSE department. Recommended.'
    }, floorWardenToken);
    if (wardenReview.status !== 200 || wardenReview.data.outpass.finalStatus !== 'PENDING_CHIEF_APPROVAL') {
      throw new Error(`Warden review failed: ${JSON.stringify(wardenReview.data)}`);
    }
    console.log(`   ✅ Step 2 & 3: Floor Warden ACCEPTED request ➔ Automatically forwarded to Chief Warden (Status: ${wardenReview.data.outpass.finalStatus})`);

    // Step 4: Chief Warden Approves
    const chiefReview = await put(`/outpasses/${newOutpassId}/chief-review`, {
      action: 'APPROVE',
      remarks: 'Approved for conference. Wish you success.'
    }, chiefWardenToken);
    if (chiefReview.status !== 200 || chiefReview.data.outpass.finalStatus !== 'APPROVED') {
      throw new Error(`Chief review failed: ${JSON.stringify(chiefReview.data)}`);
    }
    console.log(`   ✅ Step 4 & 5: Chief Warden APPROVED request ➔ Final Permission Granted! (Status: ${chiefReview.data.outpass.finalStatus})`);


    // TEST 4: Strict Complaint Routing & Role Isolation
    console.log('\n👉 TEST 4: Strict Complaint Routing & Access Isolation');

    // 4a. Student submits complaint specifically to Floor Warden
    const floorComplaint = await post('/complaints', {
      complaintTo: 'Floor Warden',
      description: 'Corridor emergency light on 2nd floor Ganga block is burnt out.'
    }, studentToken);
    const floorComplaintId = floorComplaint.data.complaint.id;
    console.log(`   ✅ Student submitted Complaint to Floor Warden (ID: ${floorComplaint.data.complaint.complaintNumber})`);

    // 4b. Floor Warden lists complaints -> SHOULD see it
    const fwComplaints = await get('/complaints', floorWardenToken);
    const hasInFW = fwComplaints.data.complaints.some(c => c.id === floorComplaintId);
    if (!hasInFW) throw new Error('Floor Warden could not see floor complaint');
    console.log('   ✅ Floor Warden CAN see the floor complaint in their inbox');

    // 4c. Chief Warden lists complaints -> SHOULD NOT see the floor complaint (strict rule #10)
    const cwComplaints = await get('/complaints', chiefWardenToken);
    const hasInCW = cwComplaints.data.complaints.some(c => c.id === floorComplaintId);
    if (hasInCW) throw new Error('Chief Warden illegally saw Floor Warden complaint! Strict isolation violated.');
    console.log('   ✅ Chief Warden CANNOT see Floor Warden complaint (Strict Isolation Verified)');

    // 4d. Floor Warden responds to complaint
    const fwResponse = await put(`/complaints/${floorComplaintId}/respond`, {
      status: 'In Progress',
      response: 'Electrician dispatched with replacement LED tube.'
    }, floorWardenToken);
    if (fwResponse.status !== 200 || fwResponse.data.complaint.status !== 'In Progress') {
      throw new Error('Floor Warden response failed');
    }
    console.log('   ✅ Floor Warden successfully responded and updated complaint status');

    console.log('\n🎉 ALL 4 CORE WORKFLOW TESTS PASSED SUCCESSFULLY! 🚀\n');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  } finally {
    server.close();
  }
}

main();
