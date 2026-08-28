const API_BASE = 'https://hostel-management-kdzc.onrender.com/api';

function getAuthHeader() {
  const token = localStorage.getItem('hostel_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = { message: `Server returned status ${res.status}` };
    }

    if (!res.ok) {
      throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to backend server. Please ensure the backend server is running.');
    }
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

// Authentication Endpoints
export const authApi = {
  adminLogin: (role, username, password) => 
    apiRequest('/auth/admin-login', { method: 'POST', body: JSON.stringify({ role, username, password }) }),
  studentLogin: (registrationNumber, password) => 
    apiRequest('/auth/student-login', { method: 'POST', body: JSON.stringify({ registrationNumber, password }) }),
  studentRegister: (formData) => 
    apiRequest('/auth/student-register', { method: 'POST', body: JSON.stringify(formData) }),
  getMe: () => apiRequest('/auth/me'),
  updateProfile: (data) => apiRequest('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (currentPassword, newPassword) => 
    apiRequest('/auth/change-password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) })
};

// Outpasses Endpoints
export const outpassApi = {
  getAll: () => apiRequest('/outpasses'),
  getById: (id) => apiRequest(`/outpasses/${id}`),
  create: (data) => apiRequest('/outpasses', { method: 'POST', body: JSON.stringify(data) }),
  wardenReview: (id, action, remarks, rejectionReason) => 
    apiRequest(`/outpasses/${id}/warden-review`, { 
      method: 'PUT', 
      body: JSON.stringify({ action, remarks, rejectionReason }) 
    }),
  chiefReview: (id, action, remarks, rejectionReason) => 
    apiRequest(`/outpasses/${id}/chief-review`, { 
      method: 'PUT', 
      body: JSON.stringify({ action, remarks, rejectionReason }) 
    })
};

// Complaints Endpoints
export const complaintApi = {
  getAll: () => apiRequest('/complaints'),
  getById: (id) => apiRequest(`/complaints/${id}`),
  create: (data) => apiRequest('/complaints', { method: 'POST', body: JSON.stringify(data) }),
  respond: (id, status, response) => 
    apiRequest(`/complaints/${id}/respond`, { method: 'PUT', body: JSON.stringify({ status, response }) })
};

// Call Booth Endpoints
export const callBoothApi = {
  getAll: () => apiRequest('/callbooth'),
  create: (data) => apiRequest('/callbooth', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id, status, resolution, assignedTo) => 
    apiRequest(`/callbooth/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, resolution, assignedTo }) })
};

// Notifications Endpoints
export const notificationApi = {
  getAll: () => apiRequest('/notifications'),
  markAsRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllAsRead: () => apiRequest('/notifications/read-all', { method: 'PUT' }),
  delete: (id) => apiRequest(`/notifications/${id}`, { method: 'DELETE' })
};

// Room Allotment
export const allotmentApi = {
  getHostels: () => apiRequest('/allotment/hostels'),
  getFloors: (id) => apiRequest(`/allotment/hostels/${id}/floors`),
  getRooms: (hostelId, floor) => apiRequest(`/allotment/rooms?hostelId=${hostelId}&floor=${floor}`),
  getBeds: (roomId) => apiRequest(`/allotment/beds?roomId=${roomId}`),
  getAllotted: () => apiRequest('/allotment/allotted'),
  getHistory: () => apiRequest('/allotment/history'),
  assign: (data) => apiRequest('/allotment/assign', { method: 'POST', body: JSON.stringify(data) }),
  remove: (data) => apiRequest('/allotment/remove', { method: 'POST', body: JSON.stringify(data) })
};

// Stats Endpoints
export const statsApi = {
  getOverview: () => apiRequest('/stats/overview')
};

export const twilioApi = {
  initiateEmergencyCall: (payload) => 
    apiRequest('/twilio/call', { method: 'POST', body: JSON.stringify(payload) })
};

// Students Directory
export const studentApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/students${query ? `?${query}` : ''}`);
  },
  getById: (id) => apiRequest(`/students/${id}`),
  delete: (id) => apiRequest(`/students/${id}`, { method: 'DELETE' }),
  register: (data) => apiRequest(`/auth/student-register`, { method: 'POST', body: JSON.stringify(data) })
};

// Wardens Directory
export const wardenApi = {
  getAll: () => apiRequest('/wardens'),
  create: (data) => apiRequest('/wardens', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/wardens/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/wardens/${id}`, { method: 'DELETE' })
};

// Hostels
export const hostelApi = {
  getAll: () => apiRequest('/hostels'),
  getById: (id) => apiRequest(`/hostels/${id}`),
  getStudents: (id) => apiRequest(`/hostels/${id}/students`),
  create: (data) => apiRequest('/hostels', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/hostels/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: (id, status) => apiRequest(`/hostels/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  delete: (id) => apiRequest(`/hostels/${id}`, { method: 'DELETE' }),
  updateRules: (rules) => apiRequest('/hostels/allocation-rules', { method: 'PUT', body: JSON.stringify({ rules }) }),
  getAllocationRules: () => apiRequest('/hostels/allocation-rules/all')
};
