import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import axios from 'axios';

interface HRStats {
  // Recruitment
  totalCandidates: number;
  pendingInterviews: number;
  activeJobPostings: number;
  offersExtended: number;
  pendingOnboarding: number;
  
  // Staff Management
  totalStaff: number;
  activeStaff: number;
  onLeaveToday: number;
  exitInitiated: number;
  
  // Leave Management
  pendingLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
  
  // Claims & Loans
  pendingClaims: number;
  pendingLoans: number;
  totalClaimsAmount: number;
  totalLoansAmount: number;
  
  // Performance
  pendingReviews: number;
  completedReviews: number;
  
  // Documents
  pendingDocuments: number;
  uploadedDocuments: number;
  
  // Email & Communication
  unreadEmails: number;
  emailTemplates: number;
  announcements: number;
  
  // ATS Metrics
  conversionRate: number;
  averageTimeToHire: number;
}

interface ATSStats {
  totalCandidates: number;
  byStage: { [key: string]: number };
  averageTimeToHire: number;
  conversionRate: number;
  recentActivity: Array<{
    type: string;
    candidate: string;
    action: string;
    timestamp: string;
  }>;
}

interface PipelineStage {
  id: string;
  name: string;
  count: number;
  color: string;
  percentage: number;
}

export default function HRDashboard() {
  const [stats, setStats] = useState<HRStats>({
    totalCandidates: 0,
    pendingInterviews: 0,
    activeJobPostings: 0,
    offersExtended: 0,
    pendingOnboarding: 0,
    totalStaff: 0,
    activeStaff: 0,
    onLeaveToday: 0,
    exitInitiated: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0,
    pendingClaims: 0,
    pendingLoans: 0,
    totalClaimsAmount: 0,
    totalLoansAmount: 0,
    pendingReviews: 0,
    completedReviews: 0,
    pendingDocuments: 0,
    uploadedDocuments: 0,
    unreadEmails: 0,
    emailTemplates: 0,
    announcements: 0,
    conversionRate: 0,
    averageTimeToHire: 0
  });
  
  const [atsStats, setAtsStats] = useState<ATSStats>({
    totalCandidates: 0,
    byStage: {},
    averageTimeToHire: 0,
    conversionRate: 0,
    recentActivity: []
  });

  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch ALL HR stats
      const requests = [
        axios.get('http://localhost:4000/recruitment/applications'),
        axios.get('http://localhost:4000/recruitment/interviews?status=SCHEDULED'),
        axios.get('http://localhost:4000/recruitment/jobs?status=ACTIVE'),
        axios.get('http://localhost:4000/admin/users'),
        axios.get('http://localhost:4000/leave/applications?status=PENDING'),
        axios.get('http://localhost:4000/claims/submissions?status=PENDING'),
        axios.get('http://localhost:4000/loans/applications?status=PENDING'),
        axios.get('http://localhost:4000/performance/reviews?status=PENDING'),
        axios.get('http://localhost:4000/documents/uploads?status=PENDING'),
        axios.get('http://localhost:4000/communication/announcements'),
      ];

      const responses = await Promise.allSettled(requests);
      const data = responses.map(r => r.status === 'fulfilled' ? r.value.data : []);

      setStats({
        totalCandidates: Array.isArray(data[0]) ? data[0].length : 0,
        pendingInterviews: Array.isArray(data[1]) ? data[1].length : 0,
        activeJobPostings: Array.isArray(data[2]) ? data[2].length : 0,
        offersExtended: 0, // Calculate from offers
        pendingOnboarding: 0, // Calculate from accepted offers
        totalStaff: Array.isArray(data[3]) ? data[3].length : 0,
        activeStaff: Array.isArray(data[3]) ? data[3].filter((u: any) => u.status === 'ACTIVE').length : 0,
        onLeaveToday: 0,
        exitInitiated: 0,
        pendingLeaves: Array.isArray(data[4]) ? data[4].length : 0,
        approvedLeaves: 0,
        rejectedLeaves: 0,
        pendingClaims: Array.isArray(data[5]) ? data[5].length : 0,
        pendingLoans: Array.isArray(data[6]) ? data[6].length : 0,
        totalClaimsAmount: Array.isArray(data[5]) ? data[5].reduce((sum: number, c: any) => sum + (c.amount || 0), 0) : 0,
        totalLoansAmount: Array.isArray(data[6]) ? data[6].reduce((sum: number, l: any) => sum + (l.amount || 0), 0) : 0,
        pendingReviews: Array.isArray(data[7]) ? data[7].length : 0,
        completedReviews: 0,
        pendingDocuments: Array.isArray(data[8]) ? data[8].length : 0,
        uploadedDocuments: 0,
        unreadEmails: 0,
        emailTemplates: 0,
        announcements: Array.isArray(data[9]) ? data[9].length : 0,
        conversionRate: 0,
        averageTimeToHire: 0
      });

      // Fetch ATS stats
      try {
        const atsResponse = await axios.get('http://localhost:4000/ats/dashboard/stats');
        setAtsStats(atsResponse.data);
        
        // Update conversion and time to hire
        setStats(prev => ({
          ...prev,
          conversionRate: atsResponse.data.conversionRate || 0,
          averageTimeToHire: atsResponse.data.averageTimeToHire || 0
        }));
        
        // Transform stage data
        const stages = Object.entries(atsResponse.data.byStage || {}).map(([name, count], index) => ({
          id: `stage-${index}`,
          name,
          count: count as number,
          color: getStageColor(index),
          percentage: ((count as number) / atsResponse.data.totalCandidates) * 100 || 0
        }));
        setPipelineStages(stages);
      } catch (error) {
        console.error('Failed to fetch ATS stats:', error);
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (index: number): string => {
    const colors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899', '#6366F1'];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-600 font-medium">Loading HR Dashboard...</p>
            <p className="text-gray-400 text-sm mt-1">Gathering all data</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">🎯 HR Command Center</h1>
                <p className="text-blue-100">Complete HR management system - Recruitment • Staff • Operations</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-200">Today</p>
                <p className="text-2xl font-bold">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Top Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Link to="/ats-pipeline" className="bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl p-4 transition-all transform hover:scale-105">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">👥</span>
                  <p className="text-sm text-blue-100">Candidates</p>
                </div>
                <p className="text-3xl font-bold">{stats.totalCandidates}</p>
                <p className="text-xs text-blue-200 mt-1">In pipeline</p>
              </Link>

              <Link to="/staff-records" className="bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl p-4 transition-all transform hover:scale-105">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">👔</span>
                  <p className="text-sm text-blue-100">Staff</p>
                </div>
                <p className="text-3xl font-bold">{stats.activeStaff}</p>
                <p className="text-xs text-blue-200 mt-1">Active employees</p>
              </Link>

              <Link to="/leave" className="bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl p-4 transition-all transform hover:scale-105">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📅</span>
                  <p className="text-sm text-blue-100">Leave</p>
                </div>
                <p className="text-3xl font-bold">{stats.pendingLeaves}</p>
                <p className="text-xs text-blue-200 mt-1">Pending approval</p>
              </Link>

              <Link to="/claims" className="bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl p-4 transition-all transform hover:scale-105">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💰</span>
                  <p className="text-sm text-blue-100">Claims</p>
                </div>
                <p className="text-3xl font-bold">{stats.pendingClaims}</p>
                <p className="text-xs text-blue-200 mt-1">Pending review</p>
              </Link>

              <Link to="/performance" className="bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl p-4 transition-all transform hover:scale-105">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⭐</span>
                  <p className="text-sm text-blue-100">Reviews</p>
                </div>
                <p className="text-3xl font-bold">{stats.pendingReviews}</p>
                <p className="text-xs text-blue-200 mt-1">Pending</p>
              </Link>
            </div>
          </div>
        </div>

        {/* 🎯 RECRUITMENT SECTION */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Recruitment & ATS</h2>
                <p className="text-gray-500 text-sm">Applicant tracking and hiring pipeline</p>
              </div>
            </div>
            <Link 
              to="/ats-pipeline"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center gap-2"
            >
              Open Pipeline
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Pipeline Visual */}
          <div className="space-y-4 mb-6">
            {pipelineStages.map((stage) => (
              <div key={stage.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: stage.color }}></div>
                    <span className="font-semibold text-gray-900">{stage.name}</span>
                    <span className="text-sm text-gray-500">({stage.count})</span>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: stage.color }}>
                    {stage.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${stage.percentage}%`, backgroundColor: stage.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Recruitment Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Link to="/ats-pipeline" className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <span className="text-2xl">🎯</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Pipeline</p>
            </Link>

            <Link to="/post-job" className="p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <span className="text-2xl">➕</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Post Job</p>
            </Link>

            <Link to="/jobs" className="p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <span className="text-2xl">💼</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">All Jobs</p>
            </Link>

            <Link to="/interview" className="p-4 border-2 border-gray-200 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <span className="text-2xl">🎤</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Interview</p>
            </Link>

            <Link to="/offer" className="p-4 border-2 border-gray-200 rounded-xl hover:border-pink-500 hover:bg-pink-50 transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <span className="text-2xl">📝</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Offers</p>
            </Link>

            <Link to="/onboarding" className="p-4 border-2 border-gray-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <span className="text-2xl">👋</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Onboard</p>
            </Link>
          </div>
        </div>

        {/* 👥 STAFF MANAGEMENT SECTION */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Staff Management & Lifecycle</h2>
              <p className="text-gray-500 text-sm">Complete employee management system</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Link to="/staff-records" className="p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <span className="text-2xl">📋</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Staff Records</p>
              <p className="text-xs text-gray-500 mt-1">{stats.totalStaff} total</p>
            </Link>

            <Link to="/onboarding" className="p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <span className="text-2xl">👋</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Onboarding</p>
              <p className="text-xs text-gray-500 mt-1">{stats.pendingOnboarding} pending</p>
            </Link>

            <Link to="/staff-records" className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <span className="text-2xl">📊</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">View History</p>
              <p className="text-xs text-gray-500 mt-1">Promotions</p>
            </Link>

            <Link to="/staff-records" className="p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <span className="text-2xl">⬆️</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Promote Staff</p>
              <p className="text-xs text-gray-500 mt-1">New promotion</p>
            </Link>

            <Link to="/staff-records" className="p-4 border-2 border-gray-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <span className="text-2xl">🚪</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Exit Mgmt</p>
              <p className="text-xs text-gray-500 mt-1">{stats.exitInitiated} initiated</p>
            </Link>
          </div>
        </div>

        {/* 📧 EMAIL & COMMUNICATION SECTION */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-2xl">📧</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Email & Communication Hub</h2>
              <p className="text-gray-500 text-sm">Full email client and communication tools</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Link to="/email-inbox" className="p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <span className="text-2xl">📬</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Inbox</p>
              <p className="text-xs text-gray-500 mt-1">{stats.unreadEmails} unread</p>
            </Link>

            <Link to="/email-inbox?folder=sent" className="p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <span className="text-2xl">📤</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Sent</p>
              <p className="text-xs text-gray-500 mt-1">Sent items</p>
            </Link>

            <Link to="/email-inbox?folder=drafts" className="p-4 border-2 border-gray-200 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <span className="text-2xl">📝</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Drafts</p>
              <p className="text-xs text-gray-500 mt-1">Saved drafts</p>
            </Link>

            <Link to="/email-inbox?compose=true" className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <span className="text-2xl">✉️</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Compose</p>
              <p className="text-xs text-gray-500 mt-1">New email</p>
            </Link>

            <Link to="/email-templates" className="p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <span className="text-2xl">📄</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Templates</p>
              <p className="text-xs text-gray-500 mt-1">{stats.emailTemplates} saved</p>
            </Link>

            <Link to="/announcements" className="p-4 border-2 border-gray-200 rounded-xl hover:border-pink-500 hover:bg-pink-50 transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <span className="text-2xl">📢</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Announcements</p>
              <p className="text-xs text-gray-500 mt-1">{stats.announcements} active</p>
            </Link>
          </div>
        </div>

        {/* Grid: Leave, Claims, Performance, Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 📅 LEAVE MANAGEMENT */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-2xl">📅</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Leave Management</h2>
                <p className="text-gray-500 text-sm">Time-off requests</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-yellow-50 rounded-xl">
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingLeaves}</p>
                <p className="text-xs text-gray-600 mt-1">Pending</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-xl">
                <p className="text-2xl font-bold text-green-600">{stats.approvedLeaves}</p>
                <p className="text-xs text-gray-600 mt-1">Approved</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-gray-600">{stats.onLeaveToday}</p>
                <p className="text-xs text-gray-600 mt-1">On Leave</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link to="/leave" className="px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold text-center text-sm">
                View All
              </Link>
              <Link to="/leave-application" className="px-4 py-3 border-2 border-yellow-500 text-yellow-600 rounded-xl hover:bg-yellow-50 transition-all font-semibold text-center text-sm">
                Apply Leave
              </Link>
            </div>
          </div>

          {/* 💰 CLAIMS & LOANS */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Claims & Loans Management</h2>
                <p className="text-gray-500 text-sm">Financial requests & approvals</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-green-50 rounded-xl border-2 border-green-200">
                <p className="text-xs text-gray-600 mb-1">Pending Claims</p>
                <p className="text-2xl font-bold text-green-600">{stats.pendingClaims}</p>
                <p className="text-xs text-gray-500 mt-1">KES {stats.totalClaimsAmount.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border-2 border-blue-200">
                <p className="text-xs text-gray-600 mb-1">Pending Loans</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pendingLoans}</p>
                <p className="text-xs text-gray-500 mt-1">KES {stats.totalLoansAmount.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <Link to="/claims" className="px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold text-center text-sm flex items-center justify-center gap-2">
                <span>✅</span> Approve Claims
              </Link>
              <Link to="/loans" className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold text-center text-sm flex items-center justify-center gap-2">
                <span>✅</span> Approve Loans
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link to="/claims-history" className="px-4 py-3 border-2 border-green-500 text-green-600 rounded-xl hover:bg-green-50 transition-all font-semibold text-center text-sm">
                Claims History
              </Link>
              <Link to="/loans-history" className="px-4 py-3 border-2 border-blue-500 text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-semibold text-center text-sm">
                Loans History
              </Link>
            </div>
          </div>
        </div>

        {/* Grid: Performance & Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* ⭐ PERFORMANCE */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-2xl">⭐</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Performance Management</h2>
                <p className="text-gray-500 text-sm">Reviews and evaluations</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="text-center p-3 bg-amber-50 rounded-xl">
                <p className="text-2xl font-bold text-amber-600">{stats.pendingReviews}</p>
                <p className="text-xs text-gray-600 mt-1">Pending</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-xl">
                <p className="text-2xl font-bold text-green-600">{stats.completedReviews}</p>
                <p className="text-xs text-gray-600 mt-1">Completed</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link to="/performance" className="px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold text-center text-sm">
                View All
              </Link>
              <Link to="/performance" className="px-4 py-3 border-2 border-amber-500 text-amber-600 rounded-xl hover:bg-amber-50 transition-all font-semibold text-center text-sm">
                New Review
              </Link>
            </div>
          </div>

          {/* 📁 DOCUMENTS */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-2xl">📁</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Document Management</h2>
                <p className="text-gray-500 text-sm">Files and records</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="text-center p-3 bg-teal-50 rounded-xl">
                <p className="text-2xl font-bold text-teal-600">{stats.pendingDocuments}</p>
                <p className="text-xs text-gray-600 mt-1">Pending</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-gray-600">{stats.uploadedDocuments}</p>
                <p className="text-xs text-gray-600 mt-1">Uploaded</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link to="/documents" className="px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold text-center text-sm">
                View All
              </Link>
              <Link to="/document-upload" className="px-4 py-3 border-2 border-teal-500 text-teal-600 rounded-xl hover:bg-teal-50 transition-all font-semibold text-center text-sm">
                Upload
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">🚀 Everything You Need in One Place</h3>
          <p className="text-purple-100 mb-6">Complete HR management system with ATS, staff management, and operations</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link 
              to="/ats-pipeline"
              className="px-8 py-3 bg-white text-purple-600 rounded-xl hover:shadow-2xl transition-all font-bold"
            >
              Open ATS Pipeline
            </Link>
            <Link 
              to="/post-job"
              className="px-8 py-3 bg-purple-500 hover:bg-purple-400 rounded-xl transition-all font-bold"
            >
              Post New Job
            </Link>
            <Link 
              to="/admin/integrations"
              className="px-8 py-3 bg-purple-500 hover:bg-purple-400 rounded-xl transition-all font-bold"
            >
              System Settings
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
