import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface DashboardStats {
  pendingLeaves: number;
  pendingClaims: number;
  activeLoans: number;
  unreadAnnouncements: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    pendingLeaves: 0,
    pendingClaims: 0,
    activeLoans: 0,
    unreadAnnouncements: 0
  });
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Get current user
      const userResponse = await fetch('http://localhost:4000/auth/me', {
        credentials: 'include'
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);
      }

      // Fetch pending items
      const [leaves, claims, loans, announcements] = await Promise.all([
        fetch('http://localhost:4000/leave/applications?status=PENDING', { credentials: 'include' }),
        fetch('http://localhost:4000/claims/claims?status=PENDING', { credentials: 'include' }),
        fetch('http://localhost:4000/loans/loans?status=ACTIVE', { credentials: 'include' }),
        fetch('http://localhost:4000/communication/announcements?unread=true', { credentials: 'include' })
      ]);

      const [leavesData, claimsData, loansData, announcementsData] = await Promise.all([
        leaves.ok ? leaves.json() : [],
        claims.ok ? claims.json() : [],
        loans.ok ? loans.json() : [],
        announcements.ok ? announcements.json() : []
      ]);

      setStats({
        pendingLeaves: Array.isArray(leavesData) ? leavesData.length : 0,
        pendingClaims: Array.isArray(claimsData) ? claimsData.length : 0,
        activeLoans: Array.isArray(loansData) ? loansData.length : 0,
        unreadAnnouncements: Array.isArray(announcementsData) ? announcementsData.length : 0
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.firstName}!</h1>
              <p className="text-sm text-gray-600">{user?.position} • {user?.branch}</p>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Profile
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link to="/leave" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="text-gray-500 text-sm mb-2">Pending Leaves</div>
            <div className="text-3xl font-bold text-blue-600">{stats.pendingLeaves}</div>
          </Link>
          <Link to="/claims" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="text-gray-500 text-sm mb-2">Pending Claims</div>
            <div className="text-3xl font-bold text-green-600">{stats.pendingClaims}</div>
          </Link>
          <Link to="/loans" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="text-gray-500 text-sm mb-2">Active Loans</div>
            <div className="text-3xl font-bold text-purple-600">{stats.activeLoans}</div>
          </Link>
          <Link to="/announcements" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="text-gray-500 text-sm mb-2">New Announcements</div>
            <div className="text-3xl font-bold text-orange-600">{stats.unreadAnnouncements}</div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Link to="/jobs" className="p-4 border rounded-lg hover:border-blue-500 transition-colors text-center">
              <div className="text-3xl mb-2">💼</div>
              <div className="font-semibold">Browse Jobs</div>
            </Link>
            <Link to="/leave/apply" className="p-4 border rounded-lg hover:border-blue-500 transition-colors text-center">
              <div className="text-3xl mb-2">📅</div>
              <div className="font-semibold">Request Leave</div>
            </Link>
            <Link to="/claims/submit" className="p-4 border rounded-lg hover:border-blue-500 transition-colors text-center">
              <div className="text-3xl mb-2">💰</div>
              <div className="font-semibold">Submit Claim</div>
            </Link>
            <Link to="/loans/apply" className="p-4 border rounded-lg hover:border-blue-500 transition-colors text-center">
              <div className="text-3xl mb-2">🏦</div>
              <div className="font-semibold">Apply Loan</div>
            </Link>
            <Link to="/documents" className="p-4 border rounded-lg hover:border-blue-500 transition-colors text-center">
              <div className="text-3xl mb-2">📄</div>
              <div className="font-semibold">Documents</div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Recent Applications</h2>
            <div className="space-y-3">
              <div className="text-gray-500 text-sm">No recent applications</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Announcements</h2>
            <div className="space-y-3">
              <div className="text-gray-500 text-sm">No new announcements</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
