import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles.css';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Login';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import AuditLogs from './pages/admin/AuditLogs';
import RoleBuilder from './pages/admin/RoleBuilder';

// Staff pages
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Applications from './pages/Applications';
import Interview from './pages/Interview';
import Offer from './pages/Offer';
import Onboarding from './pages/Onboarding';
import Regrets from './pages/Regrets';
import JobDetails from './pages/JobDetails';
import JobRules from './pages/JobRules';
import PostJob from './pages/PostJob';
import LeaveApplication from './pages/LeaveApplication';
import LeaveHistory from './pages/LeaveHistory';
import ClaimSubmission from './pages/ClaimSubmission';
import ClaimsHistory from './pages/ClaimsHistory';
import LoanApplication from './pages/LoanApplication';
import LoansHistory from './pages/LoansHistory';
import DocumentUpload from './pages/DocumentUpload';
import Announcements from './pages/Announcements';
import Profile from './pages/Profile';

// Protected component
import Protected from './components/Protected';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        
        {/* Admin routes */}
        <Route path="/admin" element={<Protected><AdminDashboard /></Protected>} />
        <Route path="/admin/users" element={<Protected><Users /></Protected>} />
        <Route path="/admin/audit-logs" element={<Protected><AuditLogs /></Protected>} />
        <Route path="/admin/role-builder" element={<Protected><RoleBuilder /></Protected>} />
        
        {/* Staff routes */}
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
        
        {/* Jobs & Recruitment */}
        <Route path="/jobs" element={<Protected><Jobs /></Protected>} />
        <Route path="/jobs/:id" element={<Protected><JobDetails /></Protected>} />
        <Route path="/jobs/:id/rules" element={<Protected><JobRules /></Protected>} />
        <Route path="/post-job" element={<Protected><PostJob /></Protected>} />
        <Route path="/applications" element={<Protected><Applications /></Protected>} />
        <Route path="/interview" element={<Protected><Interview /></Protected>} />
        <Route path="/offer" element={<Protected><Offer /></Protected>} />
        <Route path="/onboarding" element={<Protected><Onboarding /></Protected>} />
        <Route path="/regrets" element={<Protected><Regrets /></Protected>} />
        
        {/* Leave, Claims, Loans */}
        <Route path="/leave" element={<Protected><LeaveHistory /></Protected>} />
        <Route path="/leave/apply" element={<Protected><LeaveApplication /></Protected>} />
        <Route path="/claims" element={<Protected><ClaimsHistory /></Protected>} />
        <Route path="/claims/submit" element={<Protected><ClaimSubmission /></Protected>} />
        <Route path="/loans" element={<Protected><LoansHistory /></Protected>} />
        <Route path="/loans/apply" element={<Protected><LoanApplication /></Protected>} />
        
        {/* Documents & Communication */}
        <Route path="/documents" element={<Protected><DocumentUpload /></Protected>} />
        <Route path="/announcements" element={<Protected><Announcements /></Protected>} />
        
        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
