import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';

interface EmailTemplate {
  id: string;
  name: string;
  code: string;
  category: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  variables: any;
  isDefault: boolean;
  active: boolean;
  usageCount: number;
  createdAt: string;
}

export default function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'interview_invite',
    subject: '',
    bodyHtml: '',
    bodyText: '',
    isDefault: false
  });

  const categories = [
    { value: 'interview_invite', label: 'Interview Invite' },
    { value: 'offer', label: 'Job Offer' },
    { value: 'rejection', label: 'Rejection' },
    { value: 'follow_up', label: 'Follow Up' },
    { value: 'reminder', label: 'Reminder' }
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (filterCategory === 'all') {
      setFilteredTemplates(templates);
    } else {
      setFilteredTemplates(templates.filter(t => t.category === filterCategory));
    }
  }, [filterCategory, templates]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:4000/ats-comm/email-templates', {
        withCredentials: true
      });
      setTemplates(response.data);
      setFilteredTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedTemplate(null);
    setFormData({
      name: '',
      code: '',
      category: 'interview_invite',
      subject: '',
      bodyHtml: '',
      bodyText: '',
      isDefault: false
    });
    setShowModal(true);
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      code: template.code,
      category: template.category,
      subject: template.subject,
      bodyHtml: template.bodyHtml,
      bodyText: template.bodyText,
      isDefault: template.isDefault
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedTemplate) {
        // Update
        await axios.patch(
          `http://localhost:4000/ats-comm/email-templates/${selectedTemplate.id}`,
          formData,
          { withCredentials: true }
        );
      } else {
        // Create
        await axios.post(
          'http://localhost:4000/ats-comm/email-templates',
          { ...formData, createdBy: 'current-user' },
          { withCredentials: true }
        );
      }
      
      setShowModal(false);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await axios.delete(`http://localhost:4000/ats-comm/email-templates/${id}`, {
        withCredentials: true
      });
      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template');
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('bodyText') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.bodyText;
      const newText = text.substring(0, start) + `{{${variable}}}` + text.substring(end);
      setFormData({ ...formData, bodyText: newText });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#018ede]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Templates</h1>
          <p className="text-gray-600">Manage branded email templates for candidate communication</p>
        </div>

        {/* Filters & Actions */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Category:</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={handleCreate}
            className="bg-[#018ede] text-white px-6 py-2 rounded-lg hover:bg-[#0171bd] transition-colors"
          >
            + New Template
          </button>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.name}</h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {categories.find(c => c.value === template.category)?.label}
                    </span>
                  </div>
                  {template.isDefault && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Default
                    </span>
                  )}
                </div>

                {/* Subject */}
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Subject:</p>
                  <p className="text-sm text-gray-900 font-medium">{template.subject}</p>
                </div>

                {/* Preview */}
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Preview:</p>
                  <p className="text-sm text-gray-700 line-clamp-3">{template.bodyText}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 pt-4 border-t">
                  <span>Used {template.usageCount} times</span>
                  <span className={template.active ? 'text-green-600' : 'text-red-600'}>
                    {template.active ? '● Active' : '● Inactive'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(template)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 text-lg">No templates found</p>
            <button
              onClick={handleCreate}
              className="mt-4 text-[#018ede] hover:underline"
            >
              Create your first template
            </button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {selectedTemplate ? 'Edit Template' : 'New Template'}
                </h2>

                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    {/* Name & Code */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Template Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Standard Interview Invite"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Template Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., interview_invite_standard"
                        />
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Subject *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Interview Invitation - {{jobTitle}} at {{companyName}}"
                      />
                    </div>

                    {/* Variables Helper */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">Available Variables:</p>
                      <div className="flex flex-wrap gap-2">
                        {['firstName', 'lastName', 'jobTitle', 'companyName', 'interviewDate', 'interviewTime', 'location'].map(v => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => insertVariable(v)}
                            className="text-xs bg-white hover:bg-gray-100 text-blue-700 px-3 py-1 rounded-full border border-blue-200"
                          >
                            {`{{${v}}}`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Body Text */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Body (Text) *
                      </label>
                      <textarea
                        id="bodyText"
                        required
                        value={formData.bodyText}
                        onChange={(e) => setFormData({ ...formData, bodyText: e.target.value, bodyHtml: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={10}
                        placeholder="Dear {{firstName}},&#10;&#10;We are pleased to invite you..."
                      />
                    </div>

                    {/* Is Default */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={formData.isDefault}
                        onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                        Set as default template for this category
                      </label>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-[#018ede] hover:bg-[#0171bd] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      {selectedTemplate ? 'Update Template' : 'Create Template'}
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
