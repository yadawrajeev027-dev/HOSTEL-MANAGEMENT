const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'hostel_data.json');

const hashPassword = (password) => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
};

const initialData = {
  users: [
    {
      id: "usr_cw_admin",
      name: "System Administrator",
      username: "admin",
      passwordHash: hashPassword("admin123"),
      role: "Chief Warden",
      designation: "Chief Warden (System Admin)",
      department: "Administration",
      phone: "+91 00000 00000",
      email: "admin@college.edu",
      avatar: ""
    },
    {
      id: "usr_dcw_admin",
      name: "Deputy Chief Warden",
      username: "deputywarden",
      passwordHash: hashPassword("ChangeMe@123"),
      role: "Deputy Chief Warden",
      designation: "Deputy Chief Warden",
      department: "Administration",
      phone: "+91 00000 00000",
      email: "deputy@college.edu",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      mustChangePassword: true
    }
  ],
  outpasses: [],
  complaints: [],
  callRequests: [],
  notifications: [],
  hostels: [],
  wardens: [],
  rooms: [],
  beds: [],
  allotmentHistory: []
};

console.log('Writing clean database seed...');
fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2), 'utf8');
console.log('Database successfully reset to clean state with admin and deputywarden accounts!');
