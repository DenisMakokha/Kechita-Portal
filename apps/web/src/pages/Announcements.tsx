import { useState, useEffect } from 'react';

interface Announcement {
  id: string;
  title: string;
  body: string;
  bodyHtml: string;
  priority: 'NORMAL' | 'URGENT' | 'CRITICAL';
  publishAt: string;
  expiresAt: string | null;
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
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, [filter]);

  const fetchAnnouncements = async () => {
    try {
      let url = 'http://localhost:4000/communication/announcements';
      if (filter === 'unread') url += '?unread=true';
      if (filter === 'urgent') url += '?priority=URGENT,CRITICAL';

      const response = await fetch(url, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`http://localhost:4000/communication/announcements/${id}/read`, {
        method: 'POST',
        credentials: 'include'
      });
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await fetch(`http://localhost:4000/communication/announcements/${id}/acknowledge`, {
        method: 'POST',
        credentials: 'include'
      });
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to acknowledge:', error);
    }
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
    return <div className="p-8">Loading announcements...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Announcements</h1>
          <p className="text-gray-600">Company-wide announcements and updates</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              All ({announcements.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded ${
                filter === 'unread' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
            <button
              onClick={() => setFilter('urgent')}
              className={`px-4 py-2 rounded ${
                filter === 'urgent' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Urgent
            </button>
          </div>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-4xl mb-2">📢</div>
              <p className="text-gray-600">No announcements to display</p>
            </div>
          ) : (
            announcements.map(announcement => (
              <div
                key={announcement.id}
                className={`bg-white rounded-lg shadow overflow-hidden ${
                  !announcement.read?.readAt ? 'border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold">{announcement.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded border ${getPriorityStyle(announcement.priority)}`}>
                          {announcement.priority}
                        </span>
                        {!announcement.read?.readAt && (
                          <span className="text-xs px-2 py-1 bg-blue-600 text-white rounded">
                            NEW
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        By {announcement.creator.firstName} {announcement.creator.lastName}
                        {' • '}
                        {new Date(announcement.publishAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div 
                    className="prose prose-sm max-w-none mb-4"
                    dangerouslySetInnerHTML={{ __html: announcement.bodyHtml || announcement.body }}
                  />

                  {/* Expiry */}
                  {announcement.expiresAt && (
                    <div className="text-xs text-gray-500 mb-4">
                      Expires: {new Date(announcement.expiresAt).toLocaleDateString()}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    {!announcement.read?.readAt && (
                      <button
                        onClick={() => handleMarkAsRead(announcement.id)}
                        className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        ✓ Mark as Read
                      </button>
                    )}
                    {announcement.read?.readAt && !announcement.read?.acknowledged && (
                      <button
                        onClick={() => handleAcknowledge(announcement.id)}
                        className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        👍 Acknowledge
                      </button>
                    )}
                    {announcement.read?.acknowledged && (
                      <span className="px-3 py-1.5 text-sm text-green-600 flex items-center gap-1">
                        ✓ Acknowledged {announcement.read.acknowledgedAt && 
                          `on ${new Date(announcement.read.acknowledgedAt).toLocaleDateString()}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 text-sm mb-2">ℹ️ About Announcements</h4>
          <ul className="text-xs text-yellow-800 space-y-1">
            <li>• Read all announcements promptly</li>
            <li>• Critical announcements require acknowledgment</li>
            <li>• Expired announcements are automatically archived</li>
            <li>• Contact HR if you have questions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
