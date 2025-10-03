import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

interface LeaveType {
  id: string;
  name: string;
  maxDays: number;
  requiresDocument: boolean;
}

export default function LeaveApplication() {
  const navigate = useNavigate();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
    document: null as File | null
  });

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const fetchLeaveData = async () => {
    try {
      const [typesRes, balanceRes] = await Promise.all([
        fetch('http://localhost:4000/leave/types', { credentials: 'include' }),
        fetch('http://localhost:4000/leave/balance/me', { credentials: 'include' })
      ]);

      if (typesRes.ok) {
        const types = await typesRes.json();
        setLeaveTypes(types);
      }

      if (balanceRes.ok) {
        const bal = await balanceRes.json();
        setBalance(bal);
      }
    } catch (error) {
      console.error('Failed to fetch leave data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:4000/leave/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          leaveTypeId: formData.leaveTypeId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason
        })
      });

      if (response.ok) {
        alert('Leave application submitted successfully!');
        navigate('/leave');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Failed to submit application'}`);
      }
    } catch (error) {
      console.error('Failed to submit leave application:', error);
      alert('Failed to submit leave application');
    }
  };

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return days > 0 ? days : 0;
    }
    return 0;
  };

  const selectedType = leaveTypes.find(t => t.id === formData.leaveTypeId);
  const requestedDays = calculateDays();

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Apply for Leave</h1>
          <p className="text-gray-600">Submit a leave application request</p>
        </div>

        {/* Balance Card */}
        {balance && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Your Leave Balance</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-blue-600">Total</div>
                <div className="font-bold">{balance.total} days</div>
              </div>
              <div>
                <div className="text-blue-600">Used</div>
                <div className="font-bold">{balance.used} days</div>
              </div>
              <div>
                <div className="text-blue-600">Remaining</div>
                <div className="font-bold text-green-600">{balance.remaining} days</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit}>
            {/* Leave Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Leave Type *</label>
              <select
                required
                value={formData.leaveTypeId}
                onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select leave type</option>
                {leaveTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name} (Max: {type.maxDays} days)
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Start Date *</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full border rounded px-3 py-2"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* End Date */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">End Date *</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full border rounded px-3 py-2"
                min={formData.startDate || new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Days Info */}
            {requestedDays > 0 && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <div className="text-sm text-gray-600">
                  Requesting: <span className="font-bold text-gray-900">{requestedDays} days</span>
                  {selectedType && requestedDays > selectedType.maxDays && (
                    <span className="text-red-600 ml-2">
                      (Exceeds maximum of {selectedType.maxDays} days)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Reason */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Reason *</label>
              <textarea
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows={4}
                placeholder="Explain the reason for your leave request..."
              />
            </div>

            {/* Supporting Document */}
            {selectedType?.requiresDocument && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Supporting Document {selectedType.requiresDocument && '*'}
                </label>
                <input
                  type="file"
                  onChange={(e) => setFormData({ ...formData, document: e.target.files?.[0] || null })}
                  className="w-full border rounded px-3 py-2"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Upload supporting document (PDF, JPG, PNG)
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => navigate('/leave')}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Submit Application
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
