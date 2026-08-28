# Complete Hostel Management System (Full-Stack Portal)

A modern, professional, full-stack **Hostel Management System** built with **React, Tailwind CSS, Node.js, Express, and role-based authentication**, featuring automated 5-step Outpass approvals, strict role-isolated Complaints, and an intelligent emergency **Call Booth** with speech recognition.

---

## 🌟 Key Features

### 1. Dedicated Dashboards for 5 Roles
- **Student Dashboard**: Live profile, room details, prominent 24x7 **CALL BOOTH** trigger, Outpass status timeline, Complaints tracker, Hostel services.
- **Floor Warden Dashboard**: Floor student directory, **Step 2 Outpass Review Queue** (Accept with remarks or Reject with reason), floor complaints, Call Booth alerts.
- **Department Warden Dashboard**: Department students directory, department-targeted academic complaints.
- **Deputy Chief Warden Dashboard**: Cross-hostel monitoring, escalations, deputy complaints, emergency oversight.
- **Chief Warden Dashboard**: **Step 4 Final Outpass Approval Queue**, system-wide statistics & occupancy rates, warden management, emergency hub.

### 2. 🚨 Fast Emergency "CALL BOOTH" with Auto-Routing
- High-visibility Call Booth modal accessible from anywhere.
- **Speech Recognition Voice Input** (Web Speech API) + Keyword analysis.
- **Intelligent Automatic Routing Engine**:
  - `Health Issue` ➔ Medical Room / Medical Staff (+91 98765 00001)
  - `Hostel Issue` / `Room Issue` ➔ Assigned Floor Warden
  - `Electrical Issue` ➔ Maintenance / Electrical Staff (+91 98765 00003)
  - `Water Issue` ➔ Maintenance / Water Staff (+91 98765 00004)
  - `Security Issue` ➔ Campus Security (+91 98765 00005)
  - `Food/Mess Issue` ➔ Mess Supervisor
  - `Other Emergency` ➔ Emergency Response Action Squad (+91 98765 99999)

### 3. 🎫 Outpass 5-Step Approval Lifecycle & Digital Pass Generator
1. **Student submits Outpass form** (Name, RegNo, Purpose, Timings, Guardian Phone, Room, Hostel).
2. **Floor Warden Review**: Accepts (forwards) or Rejects (with reason).
3. **Automatic Forwarding**: Sent to Chief Warden with notification.
4. **Chief Warden Review**: Final Approve or Reject.
5. **Digital Gate Pass**: Generates verified printable pass with QR code, approval stamps, and security hash.

### 4. 📝 Strict Role-Isolated Complaint System
- Students select **"Complaint To"**: Floor Warden | Department Warden | Deputy Chief Warden | Chief Warden.
- **Strict Isolation**: Complaints submitted to Floor Warden are **never** visible to Chief Warden or others unless escalated.

### 5. ⚡ 1-Click Quick Demo User Switcher
- Switch between Chief Warden, Deputy Chief, Dept Warden, Floor Warden, and Student in 1-click from the top navigation bar.

---

## 🔑 Pre-Seeded Demo Accounts

| Role | Name | Username / Reg No | Password |
| :--- | :--- | :--- | :--- |
| **Chief Warden** | Dr. K. Ramesh Sharma | `cw_admin` | `password123` |
| **Deputy Chief Warden** | Dr. Sunita Verma | `dcw_admin` | `password123` |
| **Department Warden (CSE)** | Prof. Rajesh Gupta | `dept_cse` | `password123` |
| **Floor Warden (Block A)** | Mr. Amit Kumar | `fw_b1` | `password123` |
| **Student (CSE 3rd Year)** | Rahul Sharma | Reg: `21BCE1042` / `student1` | `password123` |
| **Student (ECE 2nd Year)** | Ananya Roy | Reg: `22BEC1088` / `student2` | `password123` |

---

## 🚀 Running the Project

### Start Backend API Server (Port 5000)
```bash
cd server
npm start
```

### Start Frontend Dev Server (Port 3000)
```bash
cd client
npm run dev
```

### Run End-to-End Automated Workflow Tests
```bash
cd server
npm test
```
