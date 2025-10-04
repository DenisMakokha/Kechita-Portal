import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Integration {
  id: string;
  type: string;
  provider: string;
  name: string;
  isActive: boolean;
  lastSyncAt?: string;
  syncStatus?: string;
  config: any;
}

interface CpanelConfig {
  host: string;
  port: number;
  username: string;
  apiToken: string;
}

interface EmailMailbox {
  id: string;
  emailAddress: string;
  displayName: string;
  quota: number;
  isActive: boolean;
  createdAt: string;
  suspendedAt?: string;
}

export default function Integrations() {
  const [activeTab, setActiveTab] = useState<'cpanel' | 'imap' | 'smtp' | 'mailboxes' | 'integrations'>('cpanel');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // cPanel State
  const [cpanelConfig, setCpanelConfig] = useState<CpanelConfig>({
    host: '',
    port: 2083,
    username: '',
    apiToken: ''
  });
  const [cpanelStatus, setCpanelStatus] = useState<'connected' | 'disconnected' | 'testing'>('disconnected');

  // IMAP/SMTP State
  const [imapConfig, setImapConfig] = useState({
    host: 'mail.kechita.co.ke',
    port: 993,
    encryption: 'ssl'
  });
  const [smtpConfig, setSmtpConfig] = useState({
    host: 'mail.kechita.co.ke',
    port: 587,
    encryption: 'tls'
  });

  // Mailboxes State
  const [mailboxes, setMailboxes] = useState<EmailMailbox[]>([]);
  const [showCreateMailbox, setShowCreateMailbox] = useState(false);
  const [newMailbox, setNewMailbox] = useState({
    userId: '',
    emailAddress: '',
    password: '',
    firstName: '',
    lastName: '',
    quota: 1024
  });

  // Integrations State
  const [integrations, setIntegrations] = useState<Integration[]>([]);

  useEffect(() => {
    loadConfigurations();
    if (activeTab === 'mailboxes') {
      loadMailboxes();
    }
    if (activeTab === 'integrations') {
      loadIntegrations();
    }
  }, [activeTab]);

  const loadConfigurations = async () => {
    try {
      // Load saved configurations from backend
      const response = await axios.get('http://localhost:4000/admin/integrations/config');
      if (response.data.cpanel) setCpanelConfig(response.data.cpanel);
      if (response.data.imap) setImapConfig(response.data.imap);
      if (response.data.smtp) setSmtpConfig(response.data.smtp);
    } catch (error) {
      console.error('Failed to load configurations:', error);
    }
  };

  const loadMailboxes = async () => {
    try {
      const response = await axios.get('http://localhost:4000/admin/mailboxes');
      setMailboxes(response.data);
    } catch (error) {
      console.error('Failed to load mailboxes:', error);
    }
  };

  const loadIntegrations = async () => {
    try {
      const response = await axios.get('http://localhost:4000/admin/integrations');
      setIntegrations(response.data);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    }
  };

  const testCpanelConnection = async () => {
    try {
      setCpanelStatus('testing');
      setLoading(true);
      const response = await axios.post('http://localhost:4000/admin/integrations/cpanel/test', cpanelConfig);
      
      if (response.data.success) {
        setCpanelStatus('connected');
        setMessage({ type: 'success', text: 'cPanel connection successful!' });
      } else {
        setCpanelStatus('disconnected');
        setMessage({ type: 'error', text: response.data.error || 'Connection failed' });
      }
    } catch (error: any) {
      setCpanelStatus('disconnected');
      setMessage({ type: 'error', text: error.response?.data?.error || 'Connection failed' });
    } finally {
      setLoading(false);
    }
  };

  const saveCpanelConfig = async () => {
    try {
      setLoading(true);
      await axios.post('http://localhost:4000/admin/integrations/cpanel/save', cpanelConfig);
      setMessage({ type: 'success', text: 'cPanel configuration saved successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save configuration' });
    } finally {
      setLoading(false);
    }
  };

  const testImapConnection = async () => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:4000/admin/integrations/imap/test', imapConfig);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'IMAP connection successful!' });
      } else {
        setMessage({ type: 'error', text: response.data.error || 'Connection failed' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Connection failed' });
    } finally {
      setLoading(false);
    }
  };

  const testSmtpConnection = async () => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:4000/admin/integrations/smtp/test', smtpConfig);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'SMTP connection successful!' });
      } else {
        setMessage({ type: 'error', text: response.data.error || 'Connection failed' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Connection failed' });
    } finally {
      setLoading(false);
    }
  };

  const createMailbox = async () => {
    try {
      setLoading(true);
      await axios.post('http://localhost:4000/email/mailbox/create', newMailbox);
      setMessage({ type: 'success', text: 'Mailbox created successfully!' });
      setShowCreateMailbox(false);
      setNewMailbox({
        userId: '',
        emailAddress: '',
        password: '',
        firstName: '',
        lastName: '',
        quota: 1024
      });
      loadMailboxes();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to create mailbox' });
    } finally {
      setLoading(false);
    }
  };

  const suspendMailbox = async (mailboxId: string) => {
    if (!confirm('Are you sure you want to suspend this mailbox?')) return;
    
    try {
      setLoading(true);
      const reason = prompt('Suspension reason:');
      await axios.post(`http://localhost:4000/email/mailbox/${mailboxId}/suspend`, { reason });
      setMessage({ type: 'success', text: 'Mailbox suspended successfully!' });
      loadMailboxes();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to suspend mailbox' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">⚙️ Integrations & Configuration</h1>
          <p className="text-gray-600 mt-2">Manage cPanel, email servers, and external integrations</p>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            <div className="flex items-center justify-between">
              <span>{message.text}</span>
              <button onClick={() => setMessage(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('cpanel')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'cpanel'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔧 cPanel Configuration
              </button>
              <button
                onClick={() => setActiveTab('imap')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'imap'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📥 IMAP Settings
              </button>
              <button
                onClick={() => setActiveTab('smtp')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'smtp'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📤 SMTP Settings
              </button>
              <button
                onClick={() => setActiveTab('mailboxes')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'mailboxes'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📧 Mailboxes
              </button>
              <button
                onClick={() => setActiveTab('integrations')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'integrations'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔌 External Integrations
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* cPanel Tab */}
            {activeTab === 'cpanel' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">cPanel API Configuration</h2>
                    <p className="text-sm text-gray-600 mt-1">Configure cPanel to auto-create staff email accounts</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      cpanelStatus === 'connected' ? 'bg-green-100 text-green-800' :
                      cpanelStatus === 'testing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {cpanelStatus === 'connected' ? '✓ Connected' :
                       cpanelStatus === 'testing' ? '⏳ Testing...' :
                       '○ Not Connected'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      cPanel Host
                    </label>
                    <input
                      type="text"
                      value={cpanelConfig.host}
                      onChange={(e) => setCpanelConfig({ ...cpanelConfig, host: e.target.value })}
                      placeholder="your-server.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Port
                    </label>
                    <input
                      type="number"
                      value={cpanelConfig.port}
                      onChange={(e) => setCpanelConfig({ ...cpanelConfig, port: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={cpanelConfig.username}
                      onChange={(e) => setCpanelConfig({ ...cpanelConfig, username: e.target.value })}
                      placeholder="root or account username"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Token
                    </label>
                    <input
                      type="password"
                      value={cpanelConfig.apiToken}
                      onChange={(e) => setCpanelConfig({ ...cpanelConfig, apiToken: e.target.value })}
                      placeholder="Your cPanel API token"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={testCpanelConnection}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
                  >
                    {loading ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button
                    onClick={saveCpanelConfig}
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
                  >
                    Save Configuration
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <h3 className="font-semibold text-blue-900 mb-2">How to get cPanel API Token:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                    <li>Log into your cPanel account</li>
                    <li>Go to Security → Manage API Tokens</li>
                    <li>Create a new token with "Email" permissions</li>
                    <li>Copy the token and paste it above</li>
                  </ol>
                </div>
              </div>
            )}

            {/* IMAP Tab */}
            {activeTab === 'imap' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">IMAP Server Configuration</h2>
                  <p className="text-sm text-gray-600">Configure IMAP to receive and sync emails</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IMAP Host
                    </label>
                    <input
                      type="text"
                      value={imapConfig.host}
                      onChange={(e) => setImapConfig({ ...imapConfig, host: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Port
                    </label>
                    <input
                      type="number"
                      value={imapConfig.port}
                      onChange={(e) => setImapConfig({ ...imapConfig, port: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Encryption
                    </label>
                    <select
                      value={imapConfig.encryption}
                      onChange={(e) => setImapConfig({ ...imapConfig, encryption: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ssl">SSL/TLS (Port 993)</option>
                      <option value="tls">STARTTLS (Port 143)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={testImapConnection}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
                >
                  Test IMAP Connection
                </button>
              </div>
            )}

            {/* SMTP Tab */}
            {activeTab === 'smtp' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">SMTP Server Configuration</h2>
                  <p className="text-sm text-gray-600">Configure SMTP to send emails</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      value={smtpConfig.host}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Port
                    </label>
                    <input
                      type="number"
                      value={smtpConfig.port}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, port: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Encryption
                    </label>
                    <select
                      value={smtpConfig.encryption}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, encryption: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="tls">STARTTLS (Port 587)</option>
                      <option value="ssl">SSL/TLS (Port 465)</option>
                      <option value="none">None (Port 25)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={testSmtpConnection}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
                >
                  Test SMTP Connection
                </button>
              </div>
            )}

            {/* Mailboxes Tab */}
            {activeTab === 'mailboxes' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Mailboxes</h2>
                    <p className="text-sm text-gray-600">Manage staff email accounts</p>
                  </div>
                  <button
                    onClick={() => setShowCreateMailbox(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    + Create Mailbox
                  </button>
                </div>

                {/* Mailboxes List */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email Address</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Display Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quota</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mailboxes.map((mailbox) => (
                        <tr key={mailbox.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{mailbox.emailAddress}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{mailbox.displayName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{mailbox.quota} MB</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              mailbox.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {mailbox.isActive ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {mailbox.isActive && (
                              <button
                                onClick={() => suspendMailbox(mailbox.id)}
                                className="text-red-600 hover:text-red-800 font-medium"
                              >
                                Suspend
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Create Mailbox Modal */}
                {showCreateMailbox && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-2xl p-6">
                      <h3 className="text-xl font-bold mb-4">Create New Mailbox</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                          <input
                            type="text"
                            value={newMailbox.firstName}
                            onChange={(e) => setNewMailbox({ ...newMailbox, firstName: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                          <input
                            type="text"
                            value={newMailbox.lastName}
                            onChange={(e) => setNewMailbox({ ...newMailbox, lastName: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                          <input
                            type="email"
                            value={newMailbox.emailAddress}
                            onChange={(e) => setNewMailbox({ ...newMailbox, emailAddress: e.target.value })}
                            placeholder="john.doe@kechita.co.ke"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                          <input
                            type="password"
                            value={newMailbox.password}
                            onChange={(e) => setNewMailbox({ ...newMailbox, password: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Quota (MB)</label>
                          <input
                            type="number"
                            value={newMailbox.quota}
                            onChange={(e) => setNewMailbox({ ...newMailbox, quota: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 mt-6">
                        <button
                          onClick={() => setShowCreateMailbox(false)}
                          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={createMailbox}
                          disabled={loading}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          Create Mailbox
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* External Integrations Tab */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">External Integrations</h2>
                  <p className="text-sm text-gray-600">Manage connections to external services</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {integrations.map((integration) => (
                    <div key={integration.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-4xl">
                            {integration.type === 'job_board' && '💼'}
                            {integration.type === 'calendar' && '📅'}
                            {integration.type === 'hris' && '👥'}
                            {integration.type === 'background_check' && '🔍'}
                            {integration.type === 'video_interview' && '📹'}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{integration.name}</h3>
                            <p className="text-sm text-gray-600">{integration.provider}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            integration.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {integration.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <button className="text-blue-600 hover:text-blue-800 font-medium">
                            Configure
                          </button>
                        </div>
                      </div>
                      {integration.lastSyncAt && (
                        <p className="text-sm text-gray-500 mt-2">
                          Last synced: {new Date(integration.lastSyncAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                  
                  {integrations.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <p>No integrations configured yet.</p>
                      <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Add Integration
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
