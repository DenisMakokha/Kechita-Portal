import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../stores/auth';
import axios from 'axios';

interface Announcement {
  id: string;
  title: string;
  body: string;
  bodyHtml: string;
  priority: 'NORMAL' | 'URGENT' | 'CRITICAL';
  publishAt: string;
  expiresAt: string | null;
  targetAudience: 'ALL' | 'DEPARTMENT' | 'ROLE';
  targetValue?: string;
  createdBy: string;
  creator: {
    firstName: string;
    lastName: string;
  };
  read?: {
    readAt: string | null;
    acknowledged: boolean;
    acknowledgedAt?: string | null;
  };
  _count?: {
    readBy: number;
  };
}

export default function Announcements() {
  const { user } = useAuth();
  const isHR = user?.role === 'hr_manager';

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: '',
    body: '',
    priority: 'NORMAL' as 'NORMAL' | 'URGENT' | 'CRITICAL',
    publishAt: '',
    expiresAt: '',
    targetAudience: 'ALL' as 'ALL' | 'DEPARTMENT' | 'ROLE',
    targetValue: ''
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [announcements, filter]);

  const fetchAnnouncements = async () => {
    try {
      const url = 'http://localhost:4000/communication/announcements';
      const response = await axios.get(url, { withCredentials: true });
      setAnnouncements(response.data || []);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...announcements];

    if (filter === 'unread') {
      filtered = filtered.filter(a => !a.read?.readAt);
    } else if (filter === 'urgent') {
      filtered = filtered.filter(a => a.priority === 'URGENT' || a.priority === 'CRITICAL');
    }

    setFilteredAnnouncements(filtered);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:4000/communication/announcements', {
        ...form,
        bodyHtml: form.body // In production, use rich text editor
      }, { withCredentials: true });

      alert('Announcement created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to create announcement:', error);
      alert('Failed to create announcement');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnnouncement) return;

    try {
      await axios.patch(`http://localhost:4000/communication/announcements/${selectedAnnouncement.id}`, {
        ...form,
        bodyHtml: form.body
      }, { withCredentials: true });

      alert('Announcement updated successfully');
      setShowEditModal(false);
      setSelectedAnnouncement(null);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to update announcement:', error);
      alert('Failed to update announcement');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await axios.delete(`http://localhost:4000/communication/announcements/${id}`, {
        withCredentials: true
      });

      alert('Announcement deleted successfully');
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      alert('Failed to delete announcement');
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await axios.post(`http://localhost:4000/communication/announcements/${id}/read`, {}, {
        withCredentials: true
      });
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await axios.post(`http://localhost:4000/communication/announcements/${id}/acknowledge`, {}, {
        withCredentials: true
      });
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to acknowledge:', error);
    }
  };

  const openEditModal = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setForm({
      title: announcement.title,
      body: announcement.body,
      priority: announcement.priority,
      publishAt: announcement.publishAt.split('T')[0] + 'T' + announcement.publishAt.split('T')[1].substring(0, 5),
      expiresAt: announcement.expiresAt ? announcement.expiresAt.split('T')[0] : '',
      targetAudience: announcement.targetAudience,
      targetValue: announcement.targetValue || ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setForm({
      title: '',
      body: '',
      priority: 'NORMAL',
      publishAt: '',
      expiresAt: '',
      targetAudience: 'ALL',
      targetValue: ''
    });
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'URGENT':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const unreadCount = announcements.filter(a => !a.read?.readAt).length;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#018ede] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading announcements...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isHR ? 'Announcements Management' : 'Announcements'}
            </h1>
            <p className="text-gray-600">
              {isHR ? 'Create and manage company announcements' : 'Company-wide announcements and updates'}
            </p>
          </div>
          {isHR && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Announcement</span>
            </button>
          )}
        </div>

        {/* Stats Cards (HR Only) */}
        {isHR && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Announcements</p>
              <p className="text-2xl font-bold text-gray-900">{announcements.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-red-600">
                {announcements.filter(a => a.priority === 'CRITICAL').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Urgent</p>
              <p className="text-2xl font-bold text-orange-600">
                {announcements.filter(a => a.priority === 'URGENT').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {announcements.filter(a => !a.expiresAt || new Date(a.expiresAt) > new Date()).length}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              All ({announcements.length})
            </button>
            {!isHR && (
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'unread' 
                    ? 'bg-blue-600 text-white shadow' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </button>
            )}
            <button
              onClick={() => setFilter('urgent')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'urgent' 
                  ? 'bg-orange-600 text-white shadow' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              Urgent
            </button>
          </div>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {filteredAnnouncements.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              <p className="text-gray-500 text-lg">No announcements to display</p>
              {isHR && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create First Announcement
                </button>
              )}
            </div>
          ) : (
            filteredAnnouncements.map(announcement => (
              <div
                key={announcement.id}
                className={`bg-white rounded-lg shadow overflow-hidden ${
                  !isHR && !announcement.read?.readAt ? 'border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-xl font-bold">{announcement.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded border ${getPriorityStyle(announcement.priority)}`}>
                          {announcement.priority}
                        </span>
                        {!isHR && !announcement.read?.readAt && (
                          <span className="text-xs px-2 py-1 bg-blue-600 text-white rounded">
                            NEW
                          </span>
                        )}
                        {isHR && announcement._count && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                            📖 {announcement._count.readBy} reads
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        By {announcement.creator.firstName} {announcement.creator.lastName}
                        {' • '}
                        {new Date(announcement.publishAt).toLocaleString()}
                        {announcement.targetAudience !== 'ALL' && (
                          <span className="ml-2 text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                            Target: {announcement.targetAudience}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="prose prose-sm max-w-none mb-4 text-gray-700 whitespace-pre-wrap">
                    {announcement.body}
                  </div>

                  {/* Expiry */}
                  {announcement.expiresAt && (
                    <div className="text-xs text-gray-500 mb-4">
                      Expires: {new Date(announcement.expiresAt).toLocaleDateString()}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t flex-wrap">
                    {!isHR && !announcement.read?.readAt && (
                      <button
                        onClick={() => handleMarkAsRead(announcement.id)}
                        className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium"
                      >
                        ✓ Mark as Read
                      </button>
                    )}
                    {!isHR && announcement.read?.readAt && !announcement.read?.acknowledged && (
                      <button
                        onClick={() => handleAcknowledge(announcement.id)}
                        className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 font-medium"
                      >
                        👍 Acknowledge
                      </button>
                    )}
                    {!isHR && announcement.read?.acknowledged && (
                      <span className="px-3 py-1.5 text-sm text-green-600 flex items-center gap-1">
                        ✓ Acknowledged
                      </span>
                    )}
                    {isHR && (
                      <>
                        <button
                          onClick={() => openEditModal(announcement)}
                          className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(announcement.id)}
                          className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Create Announcement</h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter announcement title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                    <textarea
                      required
                      value={form.body}
                      onChange={(e) => setForm({ ...form, body: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter announcement message..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                      <select
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="NORMAL">Normal</option>
                        <option value="URGENT">Urgent</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience *</label>
                      <select
                        value={form.targetAudience}
                        onChange={(e) => setForm({ ...form, targetAudience: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ALL">All Staff</option>
                        <option value="DEPARTMENT">Specific Department</option>
                        <option value="ROLE">Specific Role</option>
                      </select>
                    </div>
                  </div>

                  {form.targetAudience !== 'ALL' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Target Value *</label>
                      <input
                        type="text"
                        required
                        value={form.targetValue}
                        onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder={form.targetAudience === 'DEPARTMENT' ? 'e.g., IT, HR, Finance' : 'e.g., manager, staff'}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date *</label>
                      <input
                        type="datetime-local"
                        required
                        value={form.publishAt}
                        onChange={(e) => setForm({ ...form, publishAt: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (Optional)</label>
                      <input
                        type="date"
                        value={form.expiresAt}
                        onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        resetForm();
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Create Announcement
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal - Same structure as Create */}
        {showEditModal && selectedAnnouncement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Edit Announcement</h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedAnnouncement(null);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                    <textarea
                      required
                      value={form.body}
                      onChange={(e) => setForm({ ...form, body: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                      <select
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="NORMAL">Normal</option>
                        <option value="URGENT">Urgent</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={form.expiresAt}
                        onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedAnnouncement(null);
                        resetForm();
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Update Announcement
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
