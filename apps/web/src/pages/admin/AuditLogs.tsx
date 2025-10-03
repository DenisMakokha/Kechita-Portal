import { useState, useEffect } from 'react';

interface AuditLog {
  id: string;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  action: string;
  entity: string;
  entityId: string;
  changes: any;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filter, setFilter] = useState({
    action: '',
    entity: '',
    userId: '',
    dateFrom: '',
    dateTo: ''
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [page, filter]);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.action) params.append('action', filter.action);
      if (filter.entity) params.append('entity', filter.entity);
      if (filter.userId) params.append('userId', filter.userId);
      if (filter.dateFrom) params.append('from', filter.dateFrom);
      if (filter.dateTo) params.append('to', filter.dateTo);
      params.append('page', page.toString());

      const response = await fetch(`http://localhost:4000/admin/users/${filter.userId || 'all'}/audit?${params}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'LOGIN':
        return 'bg-purple-100 text-purple-800';
      case 'LOGOUT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-8">Loading audit logs...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Audit Logs</h1>
          <p className="text-gray-600">System activity and user actions</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h3 className="font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Action</label>
              <select
                value={filter.action}
                onChange={(e) => setFilter({ ...filter, action: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Entity</label>
              <select
                value={filter.entity}
                onChange={(e) => setFilter({ ...filter, entity: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">All Entities</option>
                <option value="USER">User</option>
                <option value="JOB">Job</option>
                <option value="LEAVE">Leave</option>
                <option value="CLAIM">Claim</option>
                <option value="LOAN">Loan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">From Date</label>
              <input
                type="date"
                value={filter.dateFrom}
                onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">To Date</label>
              <input
                type="date"
                value={filter.dateTo}
                onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilter({ action: '', entity: '', userId: '', dateFrom: '', dateTo: '' });
                  setPage(1);
                }}
                className="w-full px-4 py-2 border rounded hover:bg-gray-100 text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Logs List */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold">Activity Log ({logs.length})</h2>
            </div>
            
            {logs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <p>No audit logs found</p>
              </div>
            ) : (
              <div className="divide-y max-h-[700px] overflow-y-auto">
                {logs.map(log => (
                  <div
                    key={log.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      selectedLog?.id === log.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 text-xs rounded ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                          <span className="text-sm font-medium">{log.entity}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          By {log.user.firstName} {log.user.lastName}
                          <span className="text-xs text-gray-400 ml-2">{log.user.email}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      IP: {log.ipAddress}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            <div className="px-6 py-4 border-t flex justify-between items-center">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 text-sm"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">Page {page}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={logs.length < 50}
                className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 text-sm"
              >
                Next
              </button>
            </div>
          </div>

          {/* Log Details */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold">Details</h2>
            </div>
            
            {!selectedLog ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">👆</div>
                <p>Select a log entry to view details</p>
              </div>
            ) : (
              <div className="p-6 space-y-4 max-h-[700px] overflow-y-auto">
                <div>
                  <div className="text-sm font-semibold text-gray-600 mb-1">Action</div>
                  <span className={`px-2 py-1 text-xs rounded ${getActionColor(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                </div>

                <div>
                  <div className="text-sm font-semibold text-gray-600 mb-1">Entity</div>
                  <div className="text-sm">{selectedLog.entity}</div>
                  <div className="text-xs text-gray-500">ID: {selectedLog.entityId}</div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-gray-600 mb-1">User</div>
                  <div className="text-sm">
                    {selectedLog.user.firstName} {selectedLog.user.lastName}
                  </div>
                  <div className="text-xs text-gray-500">{selectedLog.user.email}</div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-gray-600 mb-1">Timestamp</div>
                  <div className="text-sm">{new Date(selectedLog.timestamp).toLocaleString()}</div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-gray-600 mb-1">IP Address</div>
                  <div className="text-sm">{selectedLog.ipAddress}</div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-gray-600 mb-1">User Agent</div>
                  <div className="text-xs text-gray-600 break-all">{selectedLog.userAgent}</div>
                </div>

                {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-gray-600 mb-2">Changes</div>
                    <div className="bg-gray-50 rounded p-3 text-xs font-mono overflow-x-auto">
                      <pre>{JSON.stringify(selectedLog.changes, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
