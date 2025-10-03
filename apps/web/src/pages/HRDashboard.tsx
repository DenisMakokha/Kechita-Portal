import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

interface HRStats {
  pendingLeaves: number;
  totalApplications: number;
  pendingInterviews: number;
  activeJobPostings: number;
  totalStaff: number;
}

export default function HRDashboard() {
  const [stats, setStats] = useState<HRStats>({
    pendingLeaves: 0,
    totalApplications: 0,
    pendingInterviews: 0,
    activeJobPostings: 0,
    totalStaff: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHRData();
  }, []);

  const fetchHRData = async () => {
    try {
      const requests = [
        fetch('http://localhost:4000/leave/applications?status=PENDING', { credentials: 'include' }),
        fetch('http://localhost:4000/recruitment/applications', { credentials: 'include' }),
        fetch('http://localhost:4000/recruitment/interviews?status=SCHEDULED', { credentials: 'include' }),
        fetch('http://localhost:4000/recruitment/jobs?status=ACTIVE', { credentials: 'include' }),
        fetch('http://localhost:4000/admin/users', { credentials: 'include' })
      ];

      const responses = await Promise.all(requests);
      const data = await Promise.all(responses.map(r => r.ok ? r.json() : []));

      setStats({
        pendingLeaves: Array.isArray(data[0]) ? data[0].length : 0,
        totalApplications: Array.isArray(data[1]) ? data[1].length : 0,
        pendingInterviews: Array.isArray(data[2]) ? data[2].length : 0,
        activeJobPostings: Array.isArray(data[3]) ? data[3].length : 0,
        totalStaff: Array.isArray(data[4]) ? data[4].length : 0,
      });
    } catch (error) {
      console.error('Failed to fetch HR dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#018ede] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading HR dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* HR Manager Header Banner */}
        <div className="bg-gradient-to-r from-[#018ede] to-[#1674f9] rounded-xl shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">HR Manager Dashboard</h2>
              <p className="text-white/80 mt-1">Manage recruitment, staff, and organizational operations</p>
            </div>
            <span className="text-4xl">👥</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Link to="/applications" className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-all">
              <p className="text-sm text-white/80">Applications</p>
              <p className="text-3xl font-bold mt-1">{stats.totalApplications}</p>
              <p className="text-xs text-white/60 mt-1">Total received</p>
            </Link>
            <Link to="/interview" className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-all">
              <p className="text-sm text-white/80">Interviews</p>
              <p className="text-3xl font-bold mt-1">{stats.pendingInterviews}</p>
              <p className="text-xs text-white/60 mt-1">Scheduled</p>
            </Link>
            <Link to="/post-job" className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-all">
              <p className="text-sm text-white/80">Active Jobs</p>
              <p className="text-3xl font-bold mt-1">{stats.activeJobPostings}</p>
              <p className="text-xs text-white/60 mt-1">Open positions</p>
            </Link>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm text-white/80">Total Staff</p>
              <p className="text-3xl font-bold mt-1">{stats.totalStaff}</p>
              <p className="text-xs text-white/60 mt-1">Employees</p>
            </div>
          </div>
        </div>

        {/* HR Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">HR Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Link to="/post-job" className="p-4 border-2 border-gray-200 rounded-xl hover:border-[#018ede] hover:bg-blue-50 transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-2xl">➕</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Post Job</p>
              <p className="text-xs text-gray-500 mt-1">Create posting</p>
            </Link>

            <Link to="/applications" className="p-4 border-2 border-gray-200 rounded-xl hover:border-[#99cc33] hover:bg-green-50 transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-2xl">📋</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Applications</p>
              <p className="text-xs text-gray-500 mt-1">Review candidates</p>
            </Link>

            <Link to="/interview" className="p-4 border-2 border-gray-200 rounded-xl hover:border-[#018ede] hover:bg-blue-50 transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-2xl">🎤</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Interviews</p>
              <p className="text-xs text-gray-500 mt-1">Schedule meetings</p>
            </Link>

            <Link to="/offer" className="p-4 border-2 border-gray-200 rounded-xl hover:border-[#99cc33] hover:bg-green-50 transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-2xl">📝</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Offers</p>
              <p className="text-xs text-gray-500 mt-1">Send letters</p>
            </Link>

            <Link to="/leave" className="p-4 border-2 border-gray-200 rounded-xl hover:border-[#018ede] hover:bg-blue-50 transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-2xl">✅</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Leave Approvals</p>
              <p className="text-xs text-gray-500 mt-1">Review requests</p>
            </Link>

            <Link to="/documents" className="p-4 border-2 border-gray-200 rounded-xl hover:border-[#99cc33] hover:bg-green-50 transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-2xl">📄</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Documents</p>
              <p className="text-xs text-gray-500 mt-1">Manage files</p>
            </Link>
          </div>
        </div>

        {/* HR Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Link to="/leave" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:-translate-y-1 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending Leave Approvals</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingLeaves}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">Review and approve employee leave applications</p>
          </Link>

          <Link to="/applications" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:-translate-y-1 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 font-medium">Recruitment Pipeline</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalApplications}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">{stats.pendingInterviews} interviews scheduled</p>
          </Link>

          <Link to="/post-job" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:-translate-y-1 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Positions</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.activeJobPostings}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💼</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">Open job postings accepting applications</p>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Recruitment Activity</h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">📋</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{stats.totalApplications} applications received</p>
                  <p className="text-xs text-gray-500 mt-1">Review candidates for open positions</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🎤</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{stats.pendingInterviews} interviews scheduled</p>
                  <p className="text-xs text-gray-500 mt-1">Upcoming candidate interviews</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Staff Management</h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">📅</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{stats.pendingLeaves} leave requests pending</p>
                  <p className="text-xs text-gray-500 mt-1">Awaiting your approval decision</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">👥</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{stats.totalStaff} total employees</p>
                  <p className="text-xs text-gray-500 mt-1">Active staff members in the organization</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
