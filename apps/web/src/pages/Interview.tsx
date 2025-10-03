import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';

interface Interview {
  id: string;
  application: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    job: {
      title: string;
    };
  };
  panel: string;
  mode: 'ONLINE' | 'PHYSICAL';
  location?: string;
  startsAt: string;
  endsAt: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  feedback?: string;
  createdAt: string;
}

export default function Interview() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [filteredInterviews, setFilteredInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [form, setForm] = useState({
    applicationId: '',
    panel: '',
    mode: 'ONLINE' as 'ONLINE' | 'PHYSICAL',
    location: '',
    startsAt: '',
    endsAt: '',
    notes: ''
  });

  useEffect(() => {
    fetchInterviews();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [interviews, statusFilter, searchTerm]);

  const fetchInterviews = async () => {
    try {
      const response = await axios.get('http://localhost:4000/recruitment/interviews', {
        withCredentials: true
      });
      setInterviews(response.data || []);
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...interviews];

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(interview => interview.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(interview =>
        interview.application.firstName.toLowerCase().includes(term) ||
        interview.application.lastName.toLowerCase().includes(term) ||
        interview.application.email.toLowerCase().includes(term) ||
        interview.application.job.title.toLowerCase().includes(term)
      );
    }

    // Sort by date (upcoming first)
    filtered.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

    setFilteredInterviews(filtered);
  };

  const handleCreateInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:4000/recruitment/interviews', form, {
        withCredentials: true
      });
      alert('Interview scheduled successfully');
      setShowCreateModal(false);
      setForm({
        applicationId: '',
        panel: '',
        mode: 'ONLINE',
        location: '',
        startsAt: '',
        endsAt: '',
        notes: ''
      });
      fetchInterviews();
    } catch (error) {
      console.error('Failed to schedule interview:', error);
      alert('Failed to schedule interview');
    }
  };

  const handleUpdateInterview = async () => {
    if (!selectedInterview) return;
    
    try {
      await axios.patch(`http://localhost:4000/recruitment/interviews/${selectedInterview.id}`, {
        panel: form.panel,
        mode: form.mode,
        location: form.location,
        startsAt: form.startsAt,
        endsAt: form.endsAt,
        notes: form.notes
      }, { withCredentials: true });

      alert('Interview updated successfully');
      setShowDetailsModal(false);
      setIsEditing(false);
      fetchInterviews();
    } catch (error) {
      console.error('Failed to update interview:', error);
      alert('Failed to update interview');
    }
  };

  const handleStatusUpdate = async (interviewId: string, newStatus: string) => {
    try {
      await axios.patch(`http://localhost:4000/recruitment/interviews/${interviewId}`, {
        status: newStatus
      }, { withCredentials: true });

      setInterviews(prev => prev.map(interview =>
        interview.id === interviewId ? { ...interview, status: newStatus as any } : interview
      ));

      alert(`Interview marked as ${newStatus}`);
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    }
  };

  const handleAddFeedback = async (interviewId: string, feedback: string) => {
    try {
      await axios.patch(`http://localhost:4000/recruitment/interviews/${interviewId}`, {
        feedback,
        status: 'COMPLETED'
      }, { withCredentials: true });

      setInterviews(prev => prev.map(interview =>
        interview.id === interviewId ? { ...interview, feedback, status: 'COMPLETED' } : interview
      ));

      alert('Feedback saved successfully');
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Failed to save feedback:', error);
      alert('Failed to save feedback');
    }
  };

  const downloadICS = async (interviewId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/recruitment/interviews/${interviewId}/ics`, {
        credentials: 'include'
      });
      const text = await response.text();
      const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interview-${interviewId}.ics`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download ICS:', error);
      alert('Failed to download calendar file');
    }
  };

  const sendReminder = async (interviewId: string, emails: string[]) => {
    try {
      await fetch(`http://localhost:4000/recruitment/interviews/${interviewId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ to: emails })
      });
      alert('Reminder sent successfully');
    } catch (error) {
      console.error('Failed to send reminder:', error);
      alert('Failed to send reminder');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      NO_SHOW: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const isUpcoming = (date: string) => {
    return new Date(date) > new Date();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#018ede] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading interviews...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Interview Management</h1>
            <p className="text-gray-600">Schedule and manage candidate interviews</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Schedule Interview</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Interviews</p>
            <p className="text-2xl font-bold text-gray-900">{interviews.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Scheduled</p>
            <p className="text-2xl font-bold text-blue-600">
              {interviews.filter(i => i.status === 'SCHEDULED').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {interviews.filter(i => i.status === 'COMPLETED').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Upcoming</p>
            <p className="text-2xl font-bold text-purple-600">
              {interviews.filter(i => i.status === 'SCHEDULED' && isUpcoming(i.startsAt)).length}
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <input
                type="text"
                placeholder="Search by candidate name, email, or job title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    statusFilter === 'ALL' 
                      ? 'bg-blue-600 text-white shadow' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('SCHEDULED')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    statusFilter === 'SCHEDULED' 
                      ? 'bg-blue-600 text-white shadow' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Scheduled
                </button>
                <button
                  onClick={() => setStatusFilter('COMPLETED')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    statusFilter === 'COMPLETED' 
                      ? 'bg-green-600 text-white shadow' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Interviews List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredInterviews.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 text-lg">No interviews scheduled</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Schedule Your First Interview
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInterviews.map((interview) => (
                    <tr key={interview.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {interview.application.firstName} {interview.application.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{interview.application.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{interview.application.job.title}</p>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-medium">{new Date(interview.startsAt).toLocaleDateString()}</p>
                          <p className="text-gray-500">
                            {new Date(interview.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(interview.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">
                          {interview.mode}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(interview.status)}`}>
                          {interview.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedInterview(interview);
                              setShowDetailsModal(true);
                              setIsEditing(false);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Details
                          </button>
                          {interview.status === 'SCHEDULED' && (
                            <>
                              <button
                                onClick={() => downloadICS(interview.id)}
                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                              >
                                Download
                              </button>
                              <button
                                onClick={() => sendReminder(interview.id, [interview.application.email, ...interview.panel.split(',')])}
                                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                              >
                                Remind
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Interview Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Schedule New Interview</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleCreateInterview} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Application ID *</label>
                    <input
                      type="text"
                      name="applicationId"
                      required
                      value={form.applicationId}
                      onChange={(e) => setForm({ ...form, applicationId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter application ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Interview Panel * (comma-separated emails)</label>
                    <input
                      type="text"
                      name="panel"
                      required
                      value={form.panel}
                      onChange={(e) => setForm({ ...form, panel: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="email1@example.com, email2@example.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mode *</label>
                      <select
                        name="mode"
                        value={form.mode}
                        onChange={(e) => setForm({ ...form, mode: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ONLINE">Online</option>
                        <option value="PHYSICAL">Physical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        name="location"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder={form.mode === 'PHYSICAL' ? 'Office location' : 'Meeting link'}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                      <input
                        type="datetime-local"
                        name="startsAt"
                        required
                        value={form.startsAt}
                        onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                      <input
                        type="datetime-local"
                        name="endsAt"
                        required
                        value={form.endsAt}
                        onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Any additional notes for the interview..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Schedule Interview
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal - will be implemented in next section due to length */}
      </div>
    </Layout>
  );
}
