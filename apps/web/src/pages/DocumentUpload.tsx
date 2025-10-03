import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../stores/auth';
import axios from 'axios';

interface Document {
  id: string;
  type: string;
  name: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: string;
  expiryDate: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function DocumentUpload() {
  const { user } = useAuth();
  const isHR = user?.role === 'hr_manager';

  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expiryFilter, setExpiryFilter] = useState<string>('ALL');

  // Upload form
  const [uploadForm, setUploadForm] = useState({
    userId: user?.id || '',
    type: 'ID_DOCUMENT',
    name: '',
    file: null as File | null,
    expiryDate: ''
  });

  const documentTypes = [
    { value: 'ID_DOCUMENT', label: 'ID Document / Passport', hasExpiry: true },
    { value: 'CERTIFICATE', label: 'Educational Certificate', hasExpiry: false },
    { value: 'LICENSE', label: 'Professional License', hasExpiry: true },
    { value: 'CONTRACT', label: 'Employment Contract', hasExpiry: false },
    { value: 'MEDICAL', label: 'Medical Certificate', hasExpiry: true },
    { value: 'BANK_STATEMENT', label: 'Bank Statement', hasExpiry: false },
    { value: 'TAX_DOCUMENT', label: 'Tax Document', hasExpiry: false },
    { value: 'OTHER', label: 'Other Document', hasExpiry: false }
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [documents, searchTerm, typeFilter, statusFilter, expiryFilter]);

  const fetchDocuments = async () => {
    try {
      const endpoint = isHR 
        ? 'http://localhost:4000/documents/all-staff-documents'
        : 'http://localhost:4000/documents/staff-documents';
      
      const response = await axios.get(endpoint, { withCredentials: true });
      setDocuments(response.data || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...documents];

    // Search filter
    if (searchTerm && isHR) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.user.firstName.toLowerCase().includes(term) ||
        doc.user.lastName.toLowerCase().includes(term) ||
        doc.user.email.toLowerCase().includes(term) ||
        doc.name.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(doc => doc.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(doc => doc.status === statusFilter);
    }

    // Expiry filter
    if (expiryFilter !== 'ALL') {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(doc => {
        if (!doc.expiryDate) return expiryFilter === 'NO_EXPIRY';
        const expiryDate = new Date(doc.expiryDate);
        
        if (expiryFilter === 'EXPIRED') return expiryDate < now;
        if (expiryFilter === 'EXPIRING_SOON') return expiryDate > now && expiryDate < thirtyDaysFromNow;
        if (expiryFilter === 'VALID') return expiryDate > thirtyDaysFromNow;
        return true;
      });
    }

    setFilteredDocs(filtered);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadForm.file) {
      alert('Please select a file');
      return;
    }

    setUploading(true);

    try {
      // In production, upload to actual storage (S3, etc.)
      const response = await axios.post('http://localhost:4000/documents/staff-documents', {
        userId: uploadForm.userId,
        type: uploadForm.type,
        name: uploadForm.name || uploadForm.file.name,
        fileUrl: 'https://storage.example.com/' + uploadForm.file.name,
        fileSize: uploadForm.file.size,
        mimeType: uploadForm.file.type,
        expiryDate: uploadForm.expiryDate || null
      }, { withCredentials: true });

      alert('Document uploaded successfully');
      setShowUploadModal(false);
      setUploadForm({
        userId: user?.id || '',
        type: 'ID_DOCUMENT',
        name: '',
        file: null,
        expiryDate: ''
      });
      fetchDocuments();
    } catch (error) {
      console.error('Failed to upload document:', error);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async (docId: string) => {
    try {
      await axios.patch(`http://localhost:4000/documents/staff-documents/${docId}`, {
        status: 'APPROVED'
      }, { withCredentials: true });

      setDocuments(prev => prev.map(doc =>
        doc.id === docId ? { ...doc, status: 'APPROVED' as any } : doc
      ));

      alert('Document approved successfully');
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Failed to approve document:', error);
      alert('Failed to approve document');
    }
  };

  const handleReject = async (docId: string) => {
    try {
      await axios.patch(`http://localhost:4000/documents/staff-documents/${docId}`, {
        status: 'REJECTED'
      }, { withCredentials: true });

      setDocuments(prev => prev.map(doc =>
        doc.id === docId ? { ...doc, status: 'REJECTED' as any } : doc
      ));

      alert('Document rejected');
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Failed to reject document:', error);
      alert('Failed to reject document');
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await axios.delete(`http://localhost:4000/documents/staff-documents/${docId}`, {
        withCredentials: true
      });

      setDocuments(prev => prev.filter(doc => doc.id !== docId));
      alert('Document deleted successfully');
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (expiry < now) return { label: 'EXPIRED', color: 'bg-red-100 text-red-800' };
    if (expiry < thirtyDays) return { label: 'EXPIRING SOON', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'VALID', color: 'bg-green-100 text-green-800' };
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#018ede] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading documents...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">
              {isHR ? 'Documents Management' : 'My Documents'}
            </h1>
            <p className="text-gray-600">
              {isHR ? 'Manage all employee documents' : 'Upload and manage your documents'}
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Upload Document</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Documents</p>
            <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Pending Approval</p>
            <p className="text-2xl font-bold text-yellow-600">
              {documents.filter(d => d.status === 'PENDING').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-2xl font-bold text-green-600">
              {documents.filter(d => d.status === 'APPROVED').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Expired</p>
            <p className="text-2xl font-bold text-red-600">
              {documents.filter(d => d.expiryDate && new Date(d.expiryDate) < new Date()).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Expiring Soon</p>
            <p className="text-2xl font-bold text-orange-600">
              {documents.filter(d => {
                if (!d.expiryDate) return false;
                const exp = new Date(d.expiryDate);
                const now = new Date();
                const thirty = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                return exp > now && exp < thirty;
              }).length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            {isHR && (
              <div>
                <input
                  type="text"
                  placeholder="Search employee or document..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Type Filter */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Types</option>
                {documentTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Expiry Filter */}
            <div>
              <select
                value={expiryFilter}
                onChange={(e) => setExpiryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Expiry</option>
                <option value="EXPIRED">Expired</option>
                <option value="EXPIRING_SOON">Expiring Soon</option>
                <option value="VALID">Valid</option>
                <option value="NO_EXPIRY">No Expiry</option>
              </select>
            </div>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredDocs.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-lg">No documents found</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Upload First Document
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {isHR && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDocs.map((doc) => {
                    const expiryStatus = getExpiryStatus(doc.expiryDate);
                    return (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        {isHR && (
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{doc.user.firstName} {doc.user.lastName}</p>
                              <p className="text-sm text-gray-500">{doc.user.email}</p>
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{doc.name}</p>
                          {doc.fileSize && (
                            <p className="text-sm text-gray-500">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {doc.type.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {doc.expiryDate ? (
                            <div>
                              <p className="text-sm">{new Date(doc.expiryDate).toLocaleDateString()}</p>
                              {expiryStatus && (
                                <span className={`text-xs px-2 py-1 rounded-full ${expiryStatus.color}`}>
                                  {expiryStatus.label}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">No expiry</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(doc.status)}`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => window.open(doc.fileUrl, '_blank')}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View
                            </button>
                            {isHR && doc.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleApprove(doc.id)}
                                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(doc.id)}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Upload Document</h2>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleUpload} className="space-y-4">
                  {isHR && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                      <input
                        type="text"
                        required
                        value={uploadForm.userId}
                        onChange={(e) => setUploadForm({ ...uploadForm, userId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter employee ID"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Type *</label>
                    <select
                      required
                      value={uploadForm.type}
                      onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {documentTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Name</label>
                    <input
                      type="text"
                      value={uploadForm.name}
                      onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional custom name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">File * (Max 10MB)</label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <input
                        type="file"
                        onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                        className="hidden"
                        id="file-upload"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        {uploadForm.file ? (
                          <p className="text-green-600 font-medium">{uploadForm.file.name}</p>
                        ) : (
                          <p className="text-gray-600">Click to select file</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">PDF, DOC, JPG, PNG</p>
                      </label>
                    </div>
                  </div>

                  {documentTypes.find(t => t.value === uploadForm.type)?.hasExpiry && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={uploadForm.expiryDate}
                        onChange={(e) => setUploadForm({ ...uploadForm, expiryDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading || !uploadForm.file}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400"
                    >
                      {uploading ? 'Uploading...' : 'Upload Document'}
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
