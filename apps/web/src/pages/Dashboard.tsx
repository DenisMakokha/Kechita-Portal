import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/auth';

interface DashboardStats {
  pendingLeaves: number;
  pendingClaims: number;
  activeLoans: number;
  unreadAnnouncements: number;
  // HR Manager specific
  totalApplications?: number;
  pendingInterviews?: number;
  activeJobPostings?: number;
  totalStaff?: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    pendingLeaves: 0,
    pendingClaims: 0,
    activeLoans: 0,
    unreadAnnouncements: 0
  });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
      if (!target.closest('.notifications-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  // Load dark mode preference on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      setDarkMode(true);
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      const isHRManager = user?.role === 'hr_manager';
      
      // Base stats for all users
      const baseRequests = [
        fetch('http://localhost:4000/leave/applications?status=PENDING', { credentials: 'include' }),
        fetch('http://localhost:4000/claims/claims?status=PENDING', { credentials: 'include' }),
        fetch('http://localhost:4000/loans/loans?status=ACTIVE', { credentials: 'include' }),
        fetch('http://localhost:4000/communication/announcements?unread=true', { credentials: 'include' })
      ];

      // Additional requests for HR Manager
      if (isHRManager) {
        baseRequests.push(
          fetch('http://localhost:4000/recruitment/applications', { credentials: 'include' }),
          fetch('http://localhost:4000/recruitment/interviews?status=SCHEDULED', { credentials: 'include' }),
          fetch('http://localhost:4000/recruitment/jobs?status=ACTIVE', { credentials: 'include' }),
          fetch('http://localhost:4000/admin/users', { credentials: 'include' })
        );
      }

      const responses = await Promise.all(baseRequests);
      const data = await Promise.all(responses.map(r => r.ok ? r.json() : []));

      const newStats: DashboardStats = {
        pendingLeaves: Array.isArray(data[0]) ? data[0].length : 0,
        pendingClaims: Array.isArray(data[1]) ? data[1].length : 0,
        activeLoans: Array.isArray(data[2]) ? data[2].length : 0,
        unreadAnnouncements: Array.isArray(data[3]) ? data[3].length : 0,
      };

      if (isHRManager && data.length > 4) {
        newStats.totalApplications = Array.isArray(data[4]) ? data[4].length : 0;
        newStats.pendingInterviews = Array.isArray(data[5]) ? data[5].length : 0;
        newStats.activeJobPostings = Array.isArray(data[6]) ? data[6].length : 0;
        newStats.totalStaff = Array.isArray(data[7]) ? data[7].length : 0;
      }

      setStats(newStats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // In a real app, save to localStorage and apply to document
  };

  const menuItems = [
    { 
      label: 'Dashboard', 
      path: '/dashboard', 
      active: true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      label: 'Jobs', 
      path: '/jobs',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      label: 'Leave', 
      path: '/leave',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      label: 'Claims', 
      path: '/claims',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      label: 'Loans', 
      path: '/loans',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      label: 'Performance', 
      path: '/performance',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      label: 'Documents', 
      path: '/documents',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      label: 'Announcements', 
      path: '/announcements',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      )
    },
    { 
      label: 'Profile', 
      path: '/profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#018ede] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'} flex`}>
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg transition-all duration-300 flex flex-col fixed h-full z-30`}>
        {/* Logo Section */}
        <div className={`h-16 flex items-center justify-between px-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          {sidebarOpen ? (
            <div className="flex items-center space-x-2">
              <img src="/src/assets/LogoHeader.svg" alt="Kechita" className="h-8 w-8" />
              <div>
                <h1 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Kechita Capital</h1>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Staff Portal</p>
              </div>
            </div>
          ) : (
            <img src="/src/assets/LogoHeader.svg" alt="Kechita" className="h-8 w-8 mx-auto" />
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 mx-2 rounded-lg transition-all ${
                item.active
                  ? 'bg-gradient-to-r from-[#018ede] to-[#1674f9] text-white shadow-lg'
                  : darkMode 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className={sidebarOpen ? '' : 'mx-auto'}>{item.icon}</div>
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`h-12 border-t ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} flex items-center justify-center transition-colors`}
        >
          <svg
            className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'} transition-transform ${sidebarOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        {/* Top Header */}
        <header className={`h-16 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm sticky top-0 z-20`}>
          <div className="h-full px-6 flex items-center justify-between">
            {/* Page Title */}
            <div>
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Welcome back, {user?.firstName}!</p>
            </div>

            {/* Right Section: Notifications, Dark Mode, User Menu */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative notifications-container">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative p-2 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {stats.unreadAnnouncements > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-[#018ede] to-[#1674f9]">
                      <h3 className="font-semibold text-white">Notifications</h3>
                      <p className="text-xs text-white/80">{stats.unreadAnnouncements} unread</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {stats.unreadAnnouncements > 0 ? (
                        <div className="p-4 hover:bg-gray-50 cursor-pointer border-b">
                          <p className="text-sm font-medium text-gray-900">New Announcements</p>
                          <p className="text-xs text-gray-500 mt-1">You have {stats.unreadAnnouncements} unread announcements</p>
                        </div>
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p className="text-sm">No new notifications</p>
                        </div>
                      )}
                    </div>
                    <div className="p-3 border-t bg-gray-50">
                      <Link to="/announcements" className="text-sm text-[#018ede] hover:text-[#1674f9] font-medium">
                        View all →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors`}
                title="Toggle Dark Mode"
              >
                {darkMode ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* User Menu */}
              <div className="relative user-menu-container">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center space-x-3 p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#018ede] to-[#99cc33] flex items-center justify-center text-white font-bold">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user?.firstName} {user?.lastName}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user?.role}</p>
                  </div>
                  <svg className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* User Menu Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b bg-gradient-to-r from-[#018ede] to-[#1674f9]">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                          {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{user?.firstName} {user?.lastName}</p>
                          <p className="text-xs text-white/80">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <Link
                        to="/profile"
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">My Profile</span>
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Settings</span>
                      </Link>
                    </div>
                    <div className="p-2 border-t">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors text-red-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="text-sm font-medium">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="p-6">
          {/* HR Manager Stats (if HR Manager role) */}
          {user?.role === 'hr_manager' && (
            <div className="bg-gradient-to-r from-[#018ede] to-[#1674f9] rounded-xl shadow-lg p-6 mb-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">HR Manager Dashboard</h2>
                <span className="text-2xl">👥</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to="/applications" className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-all">
                  <p className="text-sm text-white/80">Applications</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalApplications || 0}</p>
                </Link>
                <Link to="/interview" className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-all">
                  <p className="text-sm text-white/80">Interviews</p>
                  <p className="text-2xl font-bold mt-1">{stats.pendingInterviews || 0}</p>
                </Link>
                <Link to="/post-job" className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-all">
                  <p className="text-sm text-white/80">Active Jobs</p>
                  <p className="text-2xl font-bold mt-1">{stats.activeJobPostings || 0}</p>
                </Link>
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-sm text-white/80">Total Staff</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalStaff || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link to="/leave" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:-translate-y-1 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Pending Leaves</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{stats.pendingLeaves}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📅</span>
                </div>
              </div>
            </Link>

            <Link to="/claims" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:-translate-y-1 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Pending Claims</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.pendingClaims}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
            </Link>

            <Link to="/loans" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:-translate-y-1 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Active Loans</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">{stats.activeLoans}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🏦</span>
                </div>
              </div>
            </Link>

            <Link to="/announcements" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:-translate-y-1 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Announcements</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{stats.unreadAnnouncements}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📢</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {user?.role === 'hr_manager' ? 'HR Quick Actions' : 'Quick Actions'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* HR Manager Specific Actions */}
              {user?.role === 'hr_manager' && (
                <>
                  <Link to="/post-job" className="p-4 border-2 border-gray-200 rounded-xl hover:border-[#018ede] hover:bg-blue-50 transition-all text-center group">
                    <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-2xl">➕</span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">Post Job</p>
                  </Link>

                  <Link to="/applications" className="p-4 border-2 border-gray-200 rounded-xl hover:border-[#99cc33] hover:bg-green-50 transition-all text-center group">
                    <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-2xl">📋</span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">Applications</p>
                  </Link>

                  <Link to="/interview" className="p-4 border-2 border-gray-200 rounded-xl hover:border-[#018ede] hover:bg-blue-50 transition-all text-center group">
                    <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-2xl">🎤</span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">Interviews</p>
                  </Link>

                  <Link to="/leave" className="p-4 border-2 border-gray-200 rounded-xl hover:border-[#99cc33] hover:bg-green-50 transition-all text-center group">
                    <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-2xl">✅</span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">Approve Leave</p>
                  </Link>

                  <Link to="/announcements" className="p-4 border-2 border-gray-200 rounded-xl hover:border-[#018ede] hover:bg-blue-50 transition-all text-center group">
                    <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-2xl">📢</span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">Announcements</p>
                  </Link>
                </>
              )}

              {/* Standard User Actions */}
              {user?.role !== 'hr_manager' && (
                <>
              <Link to="/jobs" className="p-4 border-2 border-gray-200 rounded-xl hover:border-[#018ede] hover:bg-blue-50 transition-all text-center group">
                <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-2xl">💼</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm">Browse Jobs</p>
              </Link>

              <Link to="/leave/apply" className="p-4 border-2 border-gray-200 rounded-xl hover:border-[#99cc33] hover:bg-green-50 transition-all text-center group">
                <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-2xl">📅</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm">Request Leave</p>
              </Link>

              <Link to="/claims/submit" className="p-4 border-2 border-gray-200 rounded-xl hover:border-[#99cc33] hover:bg-green-50 transition-all text-center group">
                <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-2xl">💰</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm">Submit Claim</p>
              </Link>

              <Link to="/loans/apply" className="p-4 border-2 border-gray-200 rounded-xl hover:border-[#018ede] hover:bg-blue-50 transition-all text-center group">
                <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🏦</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm">Apply Loan</p>
              </Link>

                  <Link to="/documents" className="p-4 border-2 border-gray-200 rounded-xl hover:border-[#018ede] hover:bg-blue-50 transition-all text-center group">
                    <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-2xl">📄</span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">Documents</p>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Recent Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">📄</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">No recent applications</p>
                    <p className="text-xs text-gray-500 mt-1">You haven't submitted any applications recently</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Latest Announcements</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">📢</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">No new announcements</p>
                    <p className="text-xs text-gray-500 mt-1">Check back later for updates</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
