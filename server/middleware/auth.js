const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'hostel_mgmt_super_secret_jwt_key_2025';

// Generate token with rich payload
function generateToken(user) {
  const payload = {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    registrationNumber: user.registrationNumber || null,
    department: user.department || null,
    year: user.year || null,
    branch: user.branch || null,
    section: user.section || null,
    hostel: user.hostel || null,
    roomNumber: user.roomNumber || null,
    floor: user.floor || null,
    assignedFloor: user.assignedFloor || null,
    assignedHostel: user.assignedHostel || null,
    assignedDepartment: user.assignedDepartment || null
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please log in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired session. Please log in again.' });
    }
    req.user = user;
    next();
  });
}

// Role Authorization Middleware
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Forbidden: Role '${req.user.role}' is not authorized to access this resource. Allowed roles: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
}

module.exports = {
  JWT_SECRET,
  generateToken,
  authenticateToken,
  requireRole
};
