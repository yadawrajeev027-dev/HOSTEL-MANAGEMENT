const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { generateToken, authenticateToken } = require('../middleware/auth');

// 1. ADMIN LOGIN (Strict: Chief Warden, Deputy Chief Warden, Department Warden, Floor Warden)
router.post('/admin-login', (req, res) => {
  const { role, username, password } = req.body;

  if (!role || !username || !password) {
    return res.status(400).json({ error: 'Role, username, and password are required' });
  }

  const validRoles = ['Chief Warden', 'Deputy Chief Warden', 'Department Warden', 'Floor Warden'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: `Invalid role selected.` });
  }

  const cleanUsername = username.trim().toLowerCase();
  
  // HARDCODED BYPASS FOR SYSTEM ADMIN
  if (role === 'Chief Warden' && cleanUsername === 'admin' && password === 'admin123') {
    const adminUser = {
      id: "usr_cw_admin",
      name: "System Administrator",
      username: "admin",
      role: "Chief Warden",
      designation: "Chief Warden (System Admin)",
      department: "Administration",
      phone: "+91 00000 00000",
      email: "admin@college.edu",
      avatar: ""
    };
    const token = generateToken(adminUser);
    return res.json({
      success: true,
      message: `Logged in successfully via Admin Override`,
      token,
      user: adminUser
    });
  }

  // Find user by role and username strictly
  const user = db.findOne('users', u => {
    const isMatch = u.role === role && u.username.toLowerCase() === cleanUsername;
    return isMatch;
  });

  if (!user) {
    return res.status(401).json({ error: `Invalid username or account does not exist for role: ${role}` });
  }

  const isValidPassword = bcrypt.compareSync(password, user.passwordHash);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  const token = generateToken(user);
  const { passwordHash, ...userSafe } = user;
  
  res.json({
    success: true,
    message: `Logged in successfully as ${role}`,
    token,
    user: userSafe
  });
});

// 2. STUDENT REGISTRATION (Sign Up)
router.post('/student-register', (req, res) => {
  const { name, registrationNumber, department, year, branch, password, hostel, roomNumber } = req.body;

  if (!name || !registrationNumber || !password || !department || !year || !branch) {
    return res.status(400).json({ error: 'All fields (Name, Registration Number, Department, Year, Branch, Password) are required' });
  }

  const cleanRegNo = registrationNumber.trim().toUpperCase();

  // Check if student already exists
  const existingUser = db.findOne('users', u => 
    u.role === 'Student' && (
      (u.registrationNumber && u.registrationNumber.toUpperCase() === cleanRegNo) ||
      (u.username && u.username.toLowerCase() === cleanRegNo.toLowerCase())
    )
  );

  if (existingUser) {
    return res.status(409).json({ error: `A student with Registration Number ${cleanRegNo} already exists. Please log in.` });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  
  // Apply Deputy Chief Warden's Allocation Rules
  let assignedHostel = hostel || 'Unassigned';
  const settings = db.findOne('settings', s => s.id === 'allocationRules');
  if (settings && settings.rules && settings.rules[year]) {
    assignedHostel = settings.rules[year];
  }

  const newUser = db.insert('users', {
    name: name.trim(),
    username: cleanRegNo.toLowerCase(),
    registrationNumber: cleanRegNo,
    passwordHash: passwordHash,
    role: 'Student',
    department: department,
    year: year,
    branch: branch,
    section: 'A',
    hostel: assignedHostel,
    roomNumber: roomNumber || 'Unassigned',
    email: `${cleanRegNo.toLowerCase()}@college.edu`
  });

  // Automatically Notify Chief Warden and Deputy Chief Warden
  const admins = db.find('users', u => u.role === 'Chief Warden' || u.role === 'Deputy Chief Warden');
  admins.forEach(admin => {
    db.insert('notifications', {
      userId: admin.id,
      title: 'New Student Registration',
      message: `${newUser.name} (${newUser.registrationNumber}) has just signed up and registered to ${assignedHostel}.`,
      type: 'info',
      read: false,
      createdAt: new Date().toISOString()
    });
  });

  const token = generateToken(newUser);
  const { passwordHash: ph, ...userSafe } = newUser;

  res.status(201).json({
    success: true,
    message: 'Student account created successfully!',
    token,
    user: userSafe
  });
});

// 3. STUDENT LOGIN (Strict)
router.post('/student-login', (req, res) => {
  const { registrationNumber, password } = req.body;

  if (!registrationNumber || !password) {
    return res.status(400).json({ error: 'Registration Number and Password are required' });
  }

  const cleanRegNo = registrationNumber.trim().toUpperCase();

  // Find existing student
  const user = db.findOne('users', u => 
    u.role === 'Student' && (
      (u.registrationNumber && u.registrationNumber.toUpperCase() === cleanRegNo) ||
      (u.username && u.username.toUpperCase() === cleanRegNo)
    )
  );

  if (!user) {
    return res.status(404).json({ error: `Student with Registration Number '${registrationNumber}' not found. Please sign up.` });
  }

  const isValidPassword = bcrypt.compareSync(password, user.passwordHash);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  const token = generateToken(user);
  const { passwordHash, ...userSafe } = user;

  res.json({
    success: true,
    message: 'Logged in successfully as Student',
    token,
    user: userSafe
  });
});

// 4. GET CURRENT USER PROFILE
router.get('/me', authenticateToken, (req, res) => {
  const user = db.findById('users', req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { passwordHash, ...userSafe } = user;
  res.json({ user: userSafe });
});

// 5. UPDATE USER PROFILE (Allowed fields only)
router.put('/profile', authenticateToken, (req, res) => {
  const user = db.findById('users', req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // List of fields the user is explicitly allowed to update
  const {
    avatar,
    email,
    phone,
    joiningDate,
    gender,
    fatherName,
    motherName,
    parentPhone,
    altPhone,
    parentEmail,
    permanentAddress,
    currentAddress,
    city,
    state,
    district,
    pinCode,
    section,
    year,
    semester
  } = req.body;

  const updates = {};
  if (avatar !== undefined) updates.avatar = avatar;
  if (email !== undefined) updates.email = email;
  if (phone !== undefined) updates.phone = phone;
  if (joiningDate !== undefined) updates.joiningDate = joiningDate;
  if (gender !== undefined) updates.gender = gender;
  
  if (fatherName !== undefined) updates.fatherName = fatherName;
  if (motherName !== undefined) updates.motherName = motherName;
  if (parentPhone !== undefined) updates.parentPhone = parentPhone;
  if (altPhone !== undefined) updates.altPhone = altPhone;
  if (parentEmail !== undefined) updates.parentEmail = parentEmail;

  if (permanentAddress !== undefined) updates.permanentAddress = permanentAddress;
  if (currentAddress !== undefined) updates.currentAddress = currentAddress;
  if (city !== undefined) updates.city = city;
  if (state !== undefined) updates.state = state;
  if (district !== undefined) updates.district = district;
  if (pinCode !== undefined) updates.pinCode = pinCode;
  if (emergencyContact !== undefined) updates.emergencyContact = emergencyContact;
  
  if (section !== undefined) updates.section = section;
  if (year !== undefined) updates.year = year;
  if (semester !== undefined) updates.semester = semester;

  const updatedUser = db.update('users', req.user.id, updates);
  const { passwordHash, ...userSafe } = updatedUser;

  res.json({ success: true, message: 'Profile updated successfully', user: userSafe });
});

// 6. CHANGE PASSWORD
router.put('/change-password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  const user = db.findById('users', req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const isValid = bcrypt.compareSync(currentPassword, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Incorrect current password' });
  }

  const salt = bcrypt.genSaltSync(10);
  const newPasswordHash = bcrypt.hashSync(newPassword, salt);

  db.update('users', req.user.id, { passwordHash: newPasswordHash });

  res.json({ success: true, message: 'Password changed successfully' });
});

module.exports = router;
