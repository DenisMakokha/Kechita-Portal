import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../stores/auth';
import axios from 'axios';

interface LeaveApplication {
  id: string;
  leaveType: {
    name: string;
  };
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedBy?: {
    firstName: string;
    lastName: string;
  };
  rejectionReason?: string;
}

export default function LeaveHistory() {
  const { user } = useAuth();
  const isHR = user?.role === 'hr_manager';
  
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [filteredApps, setFilteredApps] = useState<LeaveApplication[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<LeaveApplication | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applications, filter, searchTerm]);

  const fetchApplications = async () => {
    try {
      let url = 'http://localhost:4000/leave/applications';
      if (filter !== 'all') {
        url += `?status=${filter.toUpperCase()}`;
      }

      const response = await axios.get(url, { withCredentials: true });
      setApplications(response.data || []);
    } catch (error) {
      console.error('Failed to fetch leave applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...applications];

    // Status filter
    if (filter !== 'all') {
      filtered = filtered.filter(app => app.status.toUpperCase() === filter.toUpperCase());
    }

    // Search filter (only for HR)
    if (isHR && searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app =>
        app.user.firstName.toLowerCase().includes(term) ||
        app.user.lastName.toLowerCase().includes(term) ||
        app.user.email.toLowerCase().includes(term) ||
        app.leaveType.name.toLowerCase().includes(term)
      );
    }

    setFilteredApps(filtered);
  };

  const handleApprove = async (appId: string) => {
    try {
      await axios.patch(`http://localhost:4000/leave/applications/${appId}`, {
        status: 'APPROVED'
      }, { withCredentials: true });

      setApplications(prev => prev.map(app =>
        app.id === appId ? { ...app, status: 'APPROVED', approvedBy: { firstName: user?.firstName || '', lastName: user?.lastName || '' } } : app
      ));

      alert('Leave application approved successfully');
      setShowModal(false);
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('Failed to approve application');
    }
  };

  const handleReject = async (appId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      await axios.patch(`http://localhost:4000/leave/applications/${appId}`, {
        status: 'REJECTED',
        rejectionReason
      }, { withCredentials: true });

      setApplications(prev => prev.map(app =>
        app.id === appId ? { ...app, status: 'REJECTED', rejectionReason } : app
      ));

      alert('Leave application rejected');
      setShowModal(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('Failed to reject application');
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#018ede] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading leave applications...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isHR ? 'Leave Management' : 'My Leave History'}
          </h1>
          <p className="text-gray-600">
            {isHR ? 'Review and approve employee leave applications' : 'View all your leave applications'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Applications</p>
            <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {applications.filter(a => a.status === 'PENDING').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-2xl font-bold text-green-600">
              {applications.filter(a => a.status === 'APPROVED').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Rejected</p>
            <p className="text-2xl font-bold text-red-600">
              {applications.filter(a => a.status === 'REJECTED').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Days (Approved)</p>
            <p className="text-2xl font-bold text-purple-600">
              {applications
                .filter(a => a.status === 'APPROVED')
                .reduce((sum, a) => sum + calculateDays(a.startDate, a.endDate), 0)}
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search (HR only) */}
            {isHR && (
              <div>
                <input
                  type="text"
                  placeholder="Search by employee name, email, or leave type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Status Filter */}
            <div className={isHR ? '' : 'md:col-span-2'}>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'all' 
                      ? 'bg-blue-600 text-white shadow' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  All ({applications.length})
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'pending' 
                      ? 'bg-yellow-600 text-white shadow' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Pending ({applications.filter(a => a.status === 'PENDING').length})
                </button>
                <button
                  onClick={() => setFilter('approved')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'approved' 
                      ? 'bg-green-600 text-white shadow' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Approved
                </button>
                <button
                  onClick={() => setFilter('rejected')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'rejected' 
                      ? 'bg-red-600 text-white shadow' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Rejected
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredApps.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 text-lg">No leave applications found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {isHR && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied</th>
                    {isHR && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredApps.map(app => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      {isHR && (
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{app.user.firstName} {app.user.lastName}</p>
                            <p className="text-sm text-gray-500">{app.user.email}</p>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{app.leaveType.name}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">{app.reason}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>{new Date(app.startDate).toLocaleDateString()}</div>
                        <div className="text-gray-500">to</div>
                        <div>{new Date(app.endDate).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-lg">{calculateDays(app.startDate, app.endDate)}</span>
                        <span className="text-sm text-gray-500"> days</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusStyle(app.status)}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      {isHR && (
                        <td className="px-6 py-4">
                          {app.status === 'PENDING' ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedApp(app);
                                  setActionType('approve');
                                  setShowModal(true);
                                }}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedApp(app);
                                  setActionType('reject');
                                  setShowModal(true);
                                }}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedApp(app);
                                setActionType(null);
                                setShowModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View Details
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Details/Action Modal */}
        {showModal && selectedApp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Leave Application Details</h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setRejectionReason('');
                      setActionType(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    {isHR && (
                      <>
                        <p><span className="font-medium">Employee:</span> {selectedApp.user.firstName} {selectedApp.user.lastName}</p>
                        <p><span className="font-medium">Email:</span> {selectedApp.user.email}</p>
                      </>
                    )}
                    <p><span className="font-medium">Leave Type:</span> {selectedApp.leaveType.name}</p>
                    <p><span className="font-medium">Start Date:</span> {new Date(selectedApp.startDate).toLocaleDateString()}</p>
                    <p><span className="font-medium">End Date:</span> {new Date(selectedApp.endDate).toLocaleDateString()}</p>
                    <p><span className="font-medium">Total Days:</span> {calculateDays(selectedApp.startDate, selectedApp.endDate)} days</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(selectedApp.status)}`}>
                        {selectedApp.status}
                      </span>
                    </p>
                    <p><span className="font-medium">Applied on:</span> {new Date(selectedApp.createdAt).toLocaleString()}</p>
                    {selectedApp.approvedBy && (
                      <p><span className="font-medium">Approved by:</span> {selectedApp.approvedBy.firstName} {selectedApp.approvedBy.lastName}</p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Reason for Leave</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700">{selectedApp.reason}</p>
                    </div>
                  </div>

                  {selectedApp.rejectionReason && (
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Rejection Reason</h3>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-red-700">{selectedApp.rejectionReason}</p>
                      </div>
                    </div>
                  )}

                  {isHR && actionType === 'reject' && (
                    <div>
                      <label className="block font-semibold text-gray-700 mb-2">Reason for Rejection *</label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Please provide a reason for rejecting this leave application..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 h-32"
                        required
                      />
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setRejectionReason('');
                        setActionType(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Close
                    </button>
                    {isHR && selectedApp.status === 'PENDING' && actionType === 'approve' && (
                      <button
                        onClick={() => handleApprove(selectedApp.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                      >
                        Confirm Approval
                      </button>
                    )}
                    {isHR && selectedApp.status === 'PENDING' && actionType === 'reject' && (
                      <button
                        onClick={() => handleReject(selectedApp.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                      >
                        Confirm Rejection
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
