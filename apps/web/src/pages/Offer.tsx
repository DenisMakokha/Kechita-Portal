import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';

interface Offer {
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
  title: string;
  salary: number;
  currency: string;
  startDate?: string;
  expiresAt?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  benefits?: string;
  terms?: string;
  contractText?: string;
  signedAt?: string;
  createdAt: string;
}

export default function Offer() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [form, setForm] = useState({
    applicationId: '',
    title: '',
    salary: '',
    currency: 'KES',
    startDate: '',
    expiresAt: '',
    benefits: '',
    terms: ''
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [offers, statusFilter, searchTerm]);

  const fetchOffers = async () => {
    try {
      const response = await axios.get('http://localhost:4000/recruitment/offers', {
        withCredentials: true
      });
      setOffers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...offers];

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(offer => offer.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(offer =>
        offer.application.firstName.toLowerCase().includes(term) ||
        offer.application.lastName.toLowerCase().includes(term) ||
        offer.application.email.toLowerCase().includes(term) ||
        offer.title.toLowerCase().includes(term)
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredOffers(filtered);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:4000/recruitment/offers', {
        ...form,
        salary: parseInt(form.salary)
      }, { withCredentials: true });

      alert('Offer created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchOffers();
    } catch (error) {
      console.error('Failed to create offer:', error);
      alert('Failed to create offer');
    }
  };

  const handleStatusUpdate = async (offerId: string, newStatus: string) => {
    try {
      await axios.patch(`http://localhost:4000/recruitment/offers/${offerId}`, {
        status: newStatus
      }, { withCredentials: true });

      setOffers(prev => prev.map(offer =>
        offer.id === offerId ? { ...offer, status: newStatus as any } : offer
      ));

      alert(`Offer ${newStatus.toLowerCase()}`);
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update offer status');
    }
  };

  const handleDownloadPDF = async (offerId: string) => {
    try {
      const response = await axios.get(`http://localhost:4000/recruitment/offers/${offerId}/pdf`, {
        responseType: 'blob',
        withCredentials: true
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `offer-${offerId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download offer PDF');
    }
  };

  const handleSendEmail = async (offerId: string, email: string) => {
    try {
      await axios.post(`http://localhost:4000/recruitment/offers/${offerId}/email`, {
        to: email
      }, { withCredentials: true });

      alert('Offer email sent successfully');
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send offer email');
    }
  };

  const handleDelete = async (offerId: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;

    try {
      await axios.delete(`http://localhost:4000/recruitment/offers/${offerId}`, {
        withCredentials: true
      });

      alert('Offer deleted successfully');
      fetchOffers();
    } catch (error) {
      console.error('Failed to delete offer:', error);
      alert('Failed to delete offer');
    }
  };

  const resetForm = () => {
    setForm({
      applicationId: '',
      title: '',
      salary: '',
      currency: 'KES',
      startDate: '',
      expiresAt: '',
      benefits: '',
      terms: ''
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const isExpired = (expiresAt: string | undefined) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#018ede] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading offers...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Offer Management</h1>
            <p className="text-gray-600">Create and manage job offers</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Offer</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Offers</p>
            <p className="text-2xl font-bold text-gray-900">{offers.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {offers.filter(o => o.status === 'PENDING').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Accepted</p>
            <p className="text-2xl font-bold text-green-600">
              {offers.filter(o => o.status === 'ACCEPTED').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Rejected</p>
            <p className="text-2xl font-bold text-red-600">
              {offers.filter(o => o.status === 'REJECTED').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Expiring Soon</p>
            <p className="text-2xl font-bold text-orange-600">
              {offers.filter(o => {
                if (!o.expiresAt || o.status !== 'PENDING') return false;
                const exp = new Date(o.expiresAt);
                const now = new Date();
                const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                return days > 0 && days <= 7;
              }).length}
            </p>
          </div>
        </div>

        {/* Filters */}
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
                  All ({offers.length})
                </button>
                <button
                  onClick={() => setStatusFilter('PENDING')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    statusFilter === 'PENDING' 
                      ? 'bg-yellow-600 text-white shadow' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter('ACCEPTED')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    statusFilter === 'ACCEPTED' 
                      ? 'bg-green-600 text-white shadow' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Accepted
                </button>
                <button
                  onClick={() => setStatusFilter('REJECTED')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    statusFilter === 'REJECTED' 
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

        {/* Offers List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredOffers.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-lg">No offers found</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create First Offer
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOffers.map((offer) => (
                    <tr key={offer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {offer.application.firstName} {offer.application.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{offer.application.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{offer.title}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {offer.currency} {offer.salary.toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(offer.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {offer.expiresAt ? (
                          <div>
                            <p className={isExpired(offer.expiresAt) ? 'text-red-600 font-medium' : ''}>
                              {new Date(offer.expiresAt).toLocaleDateString()}
                            </p>
                            {isExpired(offer.expiresAt) && (
                              <span className="text-xs text-red-600">Expired</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No expiry</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(offer.status)}`}>
                          {offer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedOffer(offer);
                              setShowDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(offer.id)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            PDF
                          </button>
                          <button
                            onClick={() => handleSendEmail(offer.id, offer.application.email)}
                            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                          >
                            Send
                          </button>
                          {offer.status === 'PENDING' && (
                            <button
                              onClick={() => handleDelete(offer.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Delete
                            </button>
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

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Create Job Offer</h2>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Application ID *</label>
                    <input
                      type="text"
                      required
                      value={form.applicationId}
                      onChange={(e) => setForm({ ...form, applicationId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter application ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Senior Software Engineer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Salary *</label>
                      <input
                        type="number"
                        required
                        value={form.salary}
                        onChange={(e) => setForm({ ...form, salary: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="50000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
                      <select
                        value={form.currency}
                        onChange={(e) => setForm({ ...form, currency: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="KES">KES</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Offer Expires</label>
                      <input
                        type="date"
                        value={form.expiresAt}
                        onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Benefits Package</label>
                    <textarea
                      value={form.benefits}
                      onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Health insurance, pension, etc..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
                    <textarea
                      value={form.terms}
                      onChange={(e) => setForm({ ...form, terms: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Employment terms..."
                    />
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
                      Create Offer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedOffer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Offer Details</h2>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedOffer(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Candidate</p>
                    <p className="text-lg font-medium">
                      {selectedOffer.application.firstName} {selectedOffer.application.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{selectedOffer.application.email}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Position</p>
                    <p className="text-lg font-medium">{selectedOffer.title}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Compensation</p>
                    <p className="text-lg font-medium">
                      {selectedOffer.currency} {selectedOffer.salary.toLocaleString()}
                    </p>
                  </div>

                  {selectedOffer.benefits && (
                    <div>
                      <p className="text-sm text-gray-600">Benefits</p>
                      <p className="text-gray-900">{selectedOffer.benefits}</p>
                    </div>
                  )}

                  {selectedOffer.terms && (
                    <div>
                      <p className="text-sm text-gray-600">Terms & Conditions</p>
                      <p className="text-gray-900">{selectedOffer.terms}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedOffer.status)}`}>
                      {selectedOffer.status}
                    </span>
                  </div>

                  {selectedOffer.signedAt && (
                    <div>
                      <p className="text-sm text-gray-600">Accepted On</p>
                      <p className="text-lg font-medium">{new Date(selectedOffer.signedAt).toLocaleDateString()}</p>
                    </div>
                  )}

                  {/* Status Actions */}
                  {selectedOffer.status === 'PENDING' && (
                    <div className="flex gap-2 pt-4 border-t">
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedOffer.id, 'ACCEPTED');
                          setShowDetailsModal(false);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Mark as Accepted
                      </button>
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedOffer.id, 'REJECTED');
                          setShowDetailsModal(false);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Mark as Rejected
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
