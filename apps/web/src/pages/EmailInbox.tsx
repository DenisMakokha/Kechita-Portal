import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { generateEmailSignature } from '../utils/emailSignature';

interface Email {
  id: string;
  from: string;
  fromName: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  receivedAt: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  attachments?: any[];
  toAddresses: string[];
  ccAddresses: string[];
}

interface Folder {
  id: string;
  name: string;
  type: string;
  unreadCount: number;
  icon: string;
  color: string;
}

export default function EmailInbox() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Compose form
  const [composeData, setComposeData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: ''
  });

  // Mock user data - in real app, get from auth context
  const currentUser = {
    firstName: 'John',
    lastName: 'Doe',
    position: 'Financial Advisor',
    email: 'john.doe@kechita.co.ke',
    phone: '+254 712 345 678',
    branch: 'Nairobi Office'
  };

  useEffect(() => {
    fetchFolders();
    fetchEmails();
  }, [selectedFolder]);

  const fetchFolders = async () => {
    try {
      const response = await axios.get('http://localhost:4000/email/folders');
      setFolders(response.data);
    } catch (error) {
      console.error('Failed to fetch folders:', error);
      // Mock data
      setFolders([
        { id: '1', name: 'Inbox', type: 'inbox', unreadCount: 12, icon: '📥', color: '#3B82F6' },
        { id: '2', name: 'Sent', type: 'sent', unreadCount: 0, icon: '📤', color: '#10B981' },
        { id: '3', name: 'Drafts', type: 'drafts', unreadCount: 3, icon: '📝', color: '#F59E0B' },
        { id: '4', name: 'Starred', type: 'starred', unreadCount: 5, icon: '⭐', color: '#EAB308' },
        { id: '5', name: 'Spam', type: 'spam', unreadCount: 2, icon: '🚫', color: '#EF4444' },
        { id: '6', name: 'Trash', type: 'trash', unreadCount: 0, icon: '🗑️', color: '#6B7280' }
      ]);
    }
  };

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:4000/email/messages?folder=${selectedFolder}`);
      setEmails(response.data);
    } catch (error) {
      console.error('Failed to fetch emails:', error);
      // Mock data
      setEmails([
        {
          id: '1',
          from: 'client@example.com',
          fromName: 'Jane Smith',
          subject: 'Loan Application Inquiry',
          bodyText: 'Hello, I would like to inquire about business loan options...',
          bodyHtml: '<p>Hello, I would like to inquire about business loan options...</p>',
          receivedAt: new Date(Date.now() - 3600000).toISOString(),
          isRead: false,
          isStarred: true,
          hasAttachments: true,
          toAddresses: ['john.doe@kechita.co.ke'],
          ccAddresses: []
        },
        {
          id: '2',
          from: 'partner@business.com',
          fromName: 'Mike Johnson',
          subject: 'Partnership Opportunity',
          bodyText: 'We are interested in discussing potential partnership...',
          bodyHtml: '<p>We are interested in discussing potential partnership...</p>',
          receivedAt: new Date(Date.now() - 7200000).toISOString(),
          isRead: false,
          isStarred: false,
          hasAttachments: false,
          toAddresses: ['john.doe@kechita.co.ke'],
          ccAddresses: []
        },
        {
          id: '3',
          from: 'hr@kechita.co.ke',
          fromName: 'HR Department',
          subject: 'Monthly Team Meeting',
          bodyText: 'Reminder: Team meeting scheduled for Friday...',
          bodyHtml: '<p>Reminder: Team meeting scheduled for Friday...</p>',
          receivedAt: new Date(Date.now() - 10800000).toISOString(),
          isRead: true,
          isStarred: false,
          hasAttachments: false,
          toAddresses: ['john.doe@kechita.co.ke'],
          ccAddresses: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCompose = () => {
    setIsComposing(true);
    setComposeData({
      to: '',
      cc: '',
      bcc: '',
      subject: '',
      body: ''
    });
  };

  const handleSendEmail = async () => {
    try {
      const signature = generateEmailSignature(currentUser);
      const emailBody = `${composeData.body}\n\n${signature}`;
      
      await axios.post('http://localhost:4000/email/send', {
        ...composeData,
        body: emailBody
      });
      
      alert('Email sent successfully!');
      setIsComposing(false);
      fetchEmails();
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email');
    }
  };

  const handleReply = (email: Email) => {
    setIsComposing(true);
    setComposeData({
      to: email.from,
      cc: '',
      bcc: '',
      subject: `Re: ${email.subject}`,
      body: `\n\n\nOn ${new Date(email.receivedAt).toLocaleString()}, ${email.fromName} wrote:\n${email.bodyText}`
    });
  };

  const handleMarkAsRead = async (emailId: string, isRead: boolean) => {
    try {
      await axios.patch(`http://localhost:4000/email/messages/${emailId}`, { isRead });
      fetchEmails();
    } catch (error) {
      console.error('Failed to mark email:', error);
    }
  };

  const handleToggleStar = async (emailId: string, isStarred: boolean) => {
    try {
      await axios.patch(`http://localhost:4000/email/messages/${emailId}`, { isStarred: !isStarred });
      fetchEmails();
    } catch (error) {
      console.error('Failed to star email:', error);
    }
  };

  const handleDelete = async (emailId: string) => {
    if (confirm('Move this email to trash?')) {
      try {
        await axios.delete(`http://localhost:4000/email/messages/${emailId}`);
        fetchEmails();
        setSelectedEmail(null);
      } catch (error) {
        console.error('Failed to delete email:', error);
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredEmails = emails.filter(email =>
    email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.fromName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.bodyText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">📧 Email</h1>
          <button
            onClick={handleCompose}
            className="bg-[#018ede] hover:bg-[#0171bd] text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <span>✏️</span> Compose
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-80 focus:ring-2 focus:ring-blue-500"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <button
            onClick={fetchEmails}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Folders */}
        <div className="w-64 bg-white border-r flex flex-col">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">FOLDERS</h2>
            <div className="space-y-1">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.type)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                    selectedFolder === folder.type
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{folder.icon}</span>
                    <span className="text-sm">{folder.name}</span>
                  </div>
                  {folder.unreadCount > 0 && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                      {folder.unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto p-4 border-t">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
              <h3 className="font-semibold text-sm text-gray-900 mb-2">Storage</h3>
              <div className="space-y-1 text-xs text-gray-600">
                <div>3.2 GB of 15 GB used</div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '21%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Email List */}
        <div className="w-96 bg-white border-r flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">
                {folders.find(f => f.type === selectedFolder)?.name || 'Inbox'}
              </h2>
              <span className="text-sm text-gray-600">{filteredEmails.length} emails</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p>No emails found</p>
              </div>
            ) : (
              filteredEmails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => {
                    setSelectedEmail(email);
                    if (!email.isRead) handleMarkAsRead(email.id, true);
                  }}
                  className={`p-4 border-b cursor-pointer transition-colors ${
                    selectedEmail?.id === email.id
                      ? 'bg-blue-50 border-l-4 border-l-blue-600'
                      : email.isRead
                      ? 'hover:bg-gray-50'
                      : 'bg-blue-50/30 hover:bg-blue-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStar(email.id, email.isStarred);
                        }}
                        className="flex-shrink-0"
                      >
                        {email.isStarred ? (
                          <span className="text-yellow-400">⭐</span>
                        ) : (
                          <span className="text-gray-300 hover:text-gray-400">☆</span>
                        )}
                      </button>
                      <span className={`font-semibold text-sm truncate ${!email.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                        {email.fromName}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{formatDate(email.receivedAt)}</span>
                  </div>
                  
                  <div className="ml-6">
                    <div className={`text-sm mb-1 truncate ${!email.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {email.subject || '(No subject)'}
                    </div>
                    <div className="text-sm text-gray-600 line-clamp-2">
                      {email.bodyText}
                    </div>
                    
                    {email.hasAttachments && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span>Attachment</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Email Content */}
        <div className="flex-1 bg-white flex flex-col">
          {selectedEmail ? (
            <>
              {/* Email Header */}
              <div className="p-6 border-b">
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-2xl font-bold text-gray-900 flex-1">
                    {selectedEmail.subject || '(No subject)'}
                  </h1>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReply(selectedEmail)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Reply"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleToggleStar(selectedEmail.id, selectedEmail.isStarred)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Star"
                    >
                      {selectedEmail.isStarred ? (
                        <span className="text-xl">⭐</span>
                      ) : (
                        <span className="text-xl text-gray-400">☆</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(selectedEmail.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {selectedEmail.fromName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{selectedEmail.fromName}</div>
                    <div className="text-sm text-gray-600">&lt;{selectedEmail.from}&gt;</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(selectedEmail.receivedAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Email Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-lg">Select an email to read</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {isComposing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">New Message</h2>
              <button
                onClick={() => setIsComposing(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="To"
                  value={composeData.to}
                  onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Cc"
                  value={composeData.cc}
                  onChange={(e) => setComposeData({ ...composeData, cc: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Bcc"
                  value={composeData.bcc}
                  onChange={(e) => setComposeData({ ...composeData, bcc: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Subject"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <textarea
                  placeholder="Write your message..."
                  value={composeData.body}
                  onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={12}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-gray-600">
                <strong className="text-blue-700">Note:</strong> Your professional signature will be automatically added to this email.
              </div>
            </div>

            <div className="p-4 border-t flex justify-between">
              <button
                onClick={() => setIsComposing(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                className="bg-[#018ede] hover:bg-[#0171bd] text-white px-8 py-2 rounded-lg font-semibold transition-colors"
              >
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
