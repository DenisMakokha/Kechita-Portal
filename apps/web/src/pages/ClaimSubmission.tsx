import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ClaimType {
  id: string;
  name: string;
  maxAmount: number;
  requiresReceipt: boolean;
  description: string;
}

export default function ClaimSubmission() {
  const navigate = useNavigate();
  const [claimTypes, setClaimTypes] = useState<ClaimType[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    claimTypeId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    receipt: null as File | null
  });

  useEffect(() => {
    fetchClaimTypes();
  }, []);

  const fetchClaimTypes = async () => {
    try {
      const response = await fetch('http://localhost:4000/claims/types', {
        credentials: 'include'
      });
      if (response.ok) {
        const types = await response.json();
        setClaimTypes(types);
      }
    } catch (error) {
      console.error('Failed to fetch claim types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedType = claimTypes.find(t => t.id === formData.claimTypeId);
    
    // Validate amount
    if (selectedType && Number(formData.amount) > selectedType.maxAmount) {
      alert(`Amount exceeds maximum of ${selectedType.maxAmount} for this claim type`);
      return;
    }

    // Validate receipt
    if (selectedType?.requiresReceipt && !formData.receipt) {
      alert('Receipt is required for this claim type');
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/claims/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          claimTypeId: formData.claimTypeId,
          amount: Number(formData.amount),
          description: formData.description,
          date: formData.date,
          receiptUrl: formData.receipt ? 'uploaded' : null // In real app, upload file first
        })
      });

      if (response.ok) {
        alert('Claim submitted successfully!');
        navigate('/claims');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Failed to submit claim'}`);
      }
    } catch (error) {
      console.error('Failed to submit claim:', error);
      alert('Failed to submit claim');
    }
  };

  const selectedType = claimTypes.find(t => t.id === formData.claimTypeId);
  const amount = Number(formData.amount);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Submit Claim</h1>
          <p className="text-gray-600">Submit an expense claim for reimbursement</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit}>
            {/* Claim Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Claim Type *</label>
              <select
                required
                value={formData.claimTypeId}
                onChange={(e) => setFormData({ ...formData, claimTypeId: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select claim type</option>
                {claimTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name} (Max: ${type.maxAmount.toLocaleString()})
                  </option>
                ))}
              </select>
              {selectedType && (
                <p className="text-sm text-gray-600 mt-1">{selectedType.description}</p>
              )}
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full border rounded px-3 py-2 pl-8"
                  placeholder="0.00"
                />
              </div>
              {selectedType && amount > selectedType.maxAmount && (
                <p className="text-sm text-red-600 mt-1">
                  Amount exceeds maximum of ${selectedType.maxAmount.toLocaleString()}
                </p>
              )}
            </div>

            {/* Date */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Expense Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full border rounded px-3 py-2"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Description *</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows={4}
                placeholder="Provide details about the expense..."
              />
            </div>

            {/* Receipt Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Receipt {selectedType?.requiresReceipt && '*'}
              </label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  type="file"
                  onChange={(e) => setFormData({ ...formData, receipt: e.target.files?.[0] || null })}
                  className="hidden"
                  id="receipt-upload"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <label htmlFor="receipt-upload" className="cursor-pointer">
                  <div className="text-4xl mb-2">📄</div>
                  <div className="text-sm text-gray-600">
                    {formData.receipt ? (
                      <span className="text-green-600 font-medium">{formData.receipt.name}</span>
                    ) : (
                      <>
                        <span className="text-blue-600 hover:text-blue-700">Click to upload</span>
                        {' '}or drag and drop
                      </>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    PDF, JPG, PNG up to 10MB
                  </div>
                </label>
              </div>
              {selectedType?.requiresReceipt && (
                <p className="text-sm text-gray-600 mt-2">
                  ⚠️ Receipt is required for {selectedType.name}
                </p>
              )}
            </div>

            {/* Summary */}
            {selectedType && amount > 0 && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
                <h3 className="font-semibold text-blue-900 mb-2">Claim Summary</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium">{selectedType.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium text-orange-600">Pending Approval</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => navigate('/claims')}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Submit Claim
              </button>
            </div>
          </form>
        </div>

        {/* Info Panel */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">📋 Important Notes</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Claims must be submitted within 30 days of expense</li>
            <li>• All receipts must be clear and legible</li>
            <li>• Claims require supervisor approval before payment</li>
            <li>• Processing typically takes 5-7 business days</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
