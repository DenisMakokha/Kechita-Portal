import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  recentLogins: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    lockedUsers: 0,
    recentLogins: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:4000/admin/users', {
        credentials: 'include'
      });
      if (response.ok) {
        const users = await response.json();
        setStats({
          totalUsers: users.length,
          activeUsers: users.filter((u: any) => u.status === 'ACTIVE').length,
          lockedUsers: users.filter((u: any) => u.accountLocked).length,
          recentLogins: users.filter((u: any) => {
            if (!u.lastLoginAt) return false;
            const dayAgo = new Date();
            dayAgo.setDate(dayAgo.getDate() - 1);
            return new Date(u.lastLoginAt) > dayAgo;
          }).length
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 text-sm mb-2">Total Users</div>
          <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 text-sm mb-2">Active Users</div>
          <div className="text-3xl font-bold text-green-600">{stats.activeUsers}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 text-sm mb-2">Locked Accounts</div>
          <div className="text-3xl font-bold text-red-600">{stats.lockedUsers}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 text-sm mb-2">Recent Logins (24h)</div>
          <div className="text-3xl font-bold text-purple-600">{stats.recentLogins}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/users"
            className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 transition-colors"
          >
            <div className="text-lg font-semibold text-blue-600 mb-2">User Management</div>
            <div className="text-sm text-gray-600">Create, edit, lock/unlock user accounts</div>
          </Link>
          <Link
            to="/admin/roles"
            className="p-4 border-2 border-green-200 rounded-lg hover:border-green-400 transition-colors"
          >
            <div className="text-lg font-semibold text-green-600 mb-2">Role Management</div>
            <div className="text-sm text-gray-600">Configure roles and permissions</div>
          </Link>
          <Link
            to="/admin/audit"
            className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 transition-colors"
          >
            <div className="text-lg font-semibold text-purple-600 mb-2">Audit Logs</div>
            <div className="text-sm text-gray-600">View system activity and user actions</div>
          </Link>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">System Information</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">API Status:</span>
            <span className="text-green-600 font-semibold">Online</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Database:</span>
            <span className="text-green-600 font-semibold">Connected</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Version:</span>
            <span className="font-semibold">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Environment:</span>
            <span className="font-semibold">Development</span>
          </div>
        </div>
      </div>
    </div>
  );
}
