import { useState, useEffect } from 'react';

interface Document {
  id: string;
  type: string;
  name: string;
  fileUrl: string;
  uploadedAt: string;
  expiryDate: string | null;
}

export default function DocumentUpload() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'ID_DOCUMENT',
    name: '',
    file: null as File | null,
    expiryDate: ''
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('http://localhost:4000/documents/staff-documents', {
        credentials: 'include'
      });
      if (response.ok) {
        const docs = await response.json();
        setDocuments(docs);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file) {
      alert('Please select a file to upload');
      return;
    }

    setUploading(true);

    try {
      // In real app, upload file to storage first, then save metadata
      const response = await fetch('http://localhost:4000/documents/staff-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: formData.type,
          name: formData.name || formData.file.name,
          fileUrl: 'https://storage.example.com/' + formData.file.name,
          fileSize: formData.file.size,
          mimeType: formData.file.type,
          expiryDate: formData.expiryDate || null
        })
      });

      if (response.ok) {
        alert('Document uploaded successfully!');
        setFormData({
          type: 'ID_DOCUMENT',
          name: '',
          file: null,
          expiryDate: ''
        });
        fetchDocuments();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Failed to upload document'}`);
      }
    } catch (error) {
      console.error('Failed to upload document:', error);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const documentTypes = [
    { value: 'ID_DOCUMENT', label: 'ID Document / Passport', hasExpiry: true },
    { value: 'CERTIFICATE', label: 'Educational Certificate', hasExpiry: false },
    { value: 'LICENSE', label: 'Professional License', hasExpiry: true },
    { value: 'CONTRACT', label: 'Employment Contract', hasExpiry: false },
    { value: 'MEDICAL', label: 'Medical Certificate', hasExpiry: true },
    { value: 'OTHER', label: 'Other Document', hasExpiry: false }
  ];

  const selectedType = documentTypes.find(t => t.value === formData.type);

  if (loading) {
    return <div className="p-8">Loading documents...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">My Documents</h1>
          <p className="text-gray-600">Upload and manage your documents</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Upload Document</h2>
              
              <form onSubmit={handleUpload}>
                {/* Document Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Document Type *</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    {documentTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Document Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Document Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="Optional custom name"
                  />
                </div>

                {/* File Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">File *</label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <input
                      type="file"
                      onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="text-3xl mb-2">📎</div>
                      <div className="text-xs text-gray-600">
                        {formData.file ? (
                          <span className="text-green-600 font-medium">{formData.file.name}</span>
                        ) : (
                          <>
                            <span className="text-blue-600">Click to select</span> file
                          </>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        PDF, DOC, JPG, PNG (Max 10MB)
                      </div>
                    </label>
                  </div>
                </div>

                {/* Expiry Date */}
                {selectedType?.hasExpiry && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Expiry Date</label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      You'll be notified before expiry
                    </p>
                  </div>
                )}

                {/* Upload Button */}
                <button
                  type="submit"
                  disabled={uploading || !formData.file}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {uploading ? 'Uploading...' : '⬆️ Upload Document'}
                </button>
              </form>
            </div>

            {/* Info Box */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 text-sm mb-2">ℹ️ Guidelines</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Upload clear, legible copies</li>
                <li>• Max file size: 10MB</li>
                <li>• Supported: PDF, DOC, JPG, PNG</li>
                <li>• Update expired documents promptly</li>
              </ul>
            </div>
          </div>

          {/* Documents List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-bold">Uploaded Documents ({documents.length})</h2>
              </div>
              
              {documents.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">📄</div>
                  <p>No documents uploaded yet</p>
                  <p className="text-sm mt-1">Upload your first document using the form</p>
                </div>
              ) : (
                <div className="divide-y">
                  {documents.map(doc => {
                    const isExpiringSoon = doc.expiryDate && 
                      new Date(doc.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();

                    return (
                      <div key={doc.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{doc.name}</h3>
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                {doc.type.replace('_', ' ')}
                              </span>
                              {isExpired && (
                                <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                                  EXPIRED
                                </span>
                              )}
                              {!isExpired && isExpiringSoon && (
                                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                                  EXPIRING SOON
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                              {doc.expiryDate && (
                                <span className="ml-3">
                                  Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => window.open(doc.fileUrl, '_blank')}
                              className="text-blue-600 hover:text-blue-700 text-sm"
                            >
                              View
                            </button>
                            <button className="text-red-600 hover:text-red-700 text-sm">
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
