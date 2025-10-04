import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import axios from 'axios';

interface HRStats {
  pendingLeaves: number;
  totalApplications: number;
  pendingInterviews: number;
  activeJobPostings: number;
  totalStaff: number;
}

interface ATSStats {
  totalCandidates: number;
  byStage: {
    [key: string]: number;
  };
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
    pendingLeaves: 0,
    totalApplications: 0,
    pendingInterviews: 0,
    activeJobPostings: 0,
    totalStaff: 0
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
      // Fetch HR stats
      const hrRequests = [
        axios.get('http://localhost:4000/leave/applications?status=PENDING'),
        axios.get('http://localhost:4000/recruitment/applications'),
        axios.get('http://localhost:4000/recruitment/interviews?status=SCHEDULED'),
        axios.get('http://localhost:4000/recruitment/jobs?status=ACTIVE'),
        axios.get('http://localhost:4000/admin/users')
      ];

      const hrResponses = await Promise.all(hrRequests);
      const hrData = hrResponses.map(r => r.data);

      setStats({
        pendingLeaves: Array.isArray(hrData[0]) ? hrData[0].length : 0,
        totalApplications: Array.isArray(hrData[1]) ? hrData[1].length : 0,
        pendingInterviews: Array.isArray(hrData[2]) ? hrData[2].length : 0,
        activeJobPostings: Array.isArray(hrData[3]) ? hrData[3].length : 0,
        totalStaff: Array.isArray(hrData[4]) ? hrData[4].length : 0,
      });

      // Fetch ATS stats
      try {
        const atsResponse = await axios.get('http://localhost:4000/ats/dashboard/stats');
        setAtsStats(atsResponse.data);
        
        // Transform stage data for visualization
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
      console.error('Failed to fetch HR dashboard data:', error);
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
            <p className="text-gray-400 text-sm mt-1">Gathering insights</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Enhanced Header with ATS Integration */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">HR Command Center</h1>
                <p className="text-blue-100">Complete recruitment & staff management powered by ATS</p>
              </div>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <span className="text-4xl">🎯</span>
              </div>
            </div>

            {/* Key Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Link to="/ats-pipeline" className="bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl p-4 transition-all transform hover:scale-105">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">👥</span>
                  <p className="text-sm text-blue-100">Active Candidates</p>
                </div>
                <p className="text-3xl font-bold">{atsStats.totalCandidates}</p>
                <p className="text-xs text-blue-200 mt-1">In pipeline</p>
              </Link>

              <Link to="/ats-pipeline" className="bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl p-4 transition-all transform hover:scale-105">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⚡</span>
                  <p className="text-sm text-blue-100">Conversion Rate</p>
                </div>
                <p className="text-3xl font-bold">{atsStats.conversionRate}%</p>
                <p className="text-xs text-blue-200 mt-1">Application to hire</p>
              </Link>

              <Link to="/interview" className="bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl p-4 transition-all transform hover:scale-105">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📅</span>
                  <p className="text-sm text-blue-100">Interviews</p>
                </div>
                <p className="text-3xl font-bold">{stats.pendingInterviews}</p>
                <p className="text-xs text-blue-200 mt-1">Scheduled</p>
              </Link>

              <Link to="/post-job" className="bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl p-4 transition-all transform hover:scale-105">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💼</span>
                  <p className="text-sm text-blue-100">Open Positions</p>
                </div>
                <p className="text-3xl font-bold">{stats.activeJobPostings}</p>
                <p className="text-xs text-blue-200 mt-1">Active jobs</p>
              </Link>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⏱️</span>
                  <p className="text-sm text-blue-100">Avg Time to Hire</p>
                </div>
                <p className="text-3xl font-bold">{atsStats.averageTimeToHire}</p>
                <p className="text-xs text-blue-200 mt-1">Days</p>
              </div>
            </div>
          </div>
        </div>

        {/* ATS Pipeline Visualization */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Recruitment Pipeline</h2>
              <p className="text-gray-500 text-sm mt-1">Visual breakdown of candidates by stage</p>
            </div>
            <Link 
              to="/ats-pipeline"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center gap-2"
            >
              Open Full Pipeline
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Stage Progress Bars */}
          <div className="space-y-4">
            {pipelineStages.map((stage) => (
              <div key={stage.id} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: stage.color }}
                    ></div>
                    <span className="font-semibold text-gray-900">{stage.name}</span>
                    <span className="text-sm text-gray-500">({stage.count} candidates)</span>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: stage.color }}>
                    {stage.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 shadow-sm"
                    style={{ 
                      width: `${stage.percentage}%`,
                      backgroundColor: stage.color
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{atsStats.totalCandidates}</p>
              <p className="text-sm text-gray-600 mt-1">Total in Pipeline</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{atsStats.conversionRate}%</p>
              <p className="text-sm text-gray-600 mt-1">Conversion Rate</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{atsStats.averageTimeToHire}d</p>
              <p className="text-sm text-gray-600 mt-1">Avg Time to Hire</p>
            </div>
          </div>
        </div>

        {/* ATS Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">ATS Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <Link to="/ats-pipeline" className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 hover:shadow-md transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <span className="text-2xl">🎯</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Pipeline</p>
              <p className="text-xs text-gray-500 mt-1">Kanban view</p>
            </Link>

            <Link to="/post-job" className="p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 hover:shadow-md transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <span className="text-2xl">➕</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Post Job</p>
              <p className="text-xs text-gray-500 mt-1">New position</p>
            </Link>

            <Link to="/screening-questions" className="p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 hover:shadow-md transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <span className="text-2xl">❓</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Screening</p>
              <p className="text-xs text-gray-500 mt-1">Questions</p>
            </Link>

            <Link to="/email-templates" className="p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-md transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <span className="text-2xl">📧</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Email</p>
              <p className="text-xs text-gray-500 mt-1">Templates</p>
            </Link>

            <Link to="/interview" className="p-4 border-2 border-gray-200 rounded-xl hover:border-amber-500 hover:bg-amber-50 hover:shadow-md transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <span className="text-2xl">🎤</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Interview</p>
              <p className="text-xs text-gray-500 mt-1">Schedule</p>
            </Link>

            <Link to="/offer" className="p-4 border-2 border-gray-200 rounded-xl hover:border-pink-500 hover:bg-pink-50 hover:shadow-md transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <span className="text-2xl">📝</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Offers</p>
              <p className="text-xs text-gray-500 mt-1">Send letters</p>
            </Link>

            <Link to="/onboarding" className="p-4 border-2 border-gray-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 hover:shadow-md transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <span className="text-2xl">👋</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Onboard</p>
              <p className="text-xs text-gray-500 mt-1">New hires</p>
            </Link>

            <Link to="/staff-records" className="p-4 border-2 border-gray-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 hover:shadow-md transition-all text-center group">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <span className="text-2xl">👥</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Staff</p>
              <p className="text-xs text-gray-500 mt-1">Records</p>
            </Link>
          </div>
        </div>

        {/* Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent ATS Activity */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Recruitment Activity</h2>
              <Link to="/ats-pipeline" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {atsStats.recentActivity.length > 0 ? (
                atsStats.recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gradient-to-r from-blue-50 to-transparent rounded-xl border border-blue-100">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-lg">
                        {activity.type === 'move' && '🔄'}
                        {activity.type === 'interview' && '🎤'}
                        {activity.type === 'offer' && '📝'}
                        {activity.type === 'hired' && '✅'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{activity.candidate}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{activity.action}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(activity.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* Staff Management */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Staff Management</h2>
              <Link to="/staff-records" className="text-green-600 hover:text-green-700 text-sm font-semibold">
                Manage →
              </Link>
            </div>
            <div className="space-y-3">
              <Link to="/leave" className="flex items-start space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-transparent rounded-xl border border-yellow-100 hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-lg">📅</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{stats.pendingLeaves} leave requests pending</p>
                  <p className="text-xs text-gray-600 mt-0.5">Awaiting your approval</p>
                </div>
              </Link>

              <Link to="/staff-records" className="flex items-start space-x-3 p-3 bg-gradient-to-r from-purple-50 to-transparent rounded-xl border border-purple-100 hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-lg">👥</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{stats.totalStaff} total employees</p>
                  <p className="text-xs text-gray-600 mt-0.5">Active staff members</p>
                </div>
              </Link>

              <Link to="/onboarding" className="flex items-start space-x-3 p-3 bg-gradient-to-r from-green-50 to-transparent rounded-xl border border-green-100 hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-lg">👋</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Onboarding pipeline</p>
                  <p className="text-xs text-gray-600 mt-0.5">Convert candidates to staff</p>
                </div>
              </Link>

              <Link to="/admin/integrations" className="flex items-start space-x-3 p-3 bg-gradient-to-r from-indigo-50 to-transparent rounded-xl border border-indigo-100 hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-lg">⚙️</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">System integrations</p>
                  <p className="text-xs text-gray-600 mt-0.5">cPanel, IMAP, SMTP config</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">🚀 Supercharge Your Recruitment</h3>
          <p className="text-purple-100 mb-6">Use our world-class ATS to manage your entire hiring pipeline efficiently</p>
          <div className="flex items-center justify-center gap-4">
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
          </div>
        </div>
      </div>
    </Layout>
  );
}
