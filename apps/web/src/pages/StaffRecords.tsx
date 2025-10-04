import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface StaffMember {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  startDate: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'EXIT_INITIATED' | 'EXITED';
  currentSalary: number;
  profilePhoto?: string;
}

interface PromotionHistory {
  id: string;
  fromPosition: string;
  toPosition: string;
  fromSalary: number;
  toSalary: number;
  promotionDate: string;
  effectiveDate: string;
  reason: string;
  approvedBy: string;
}

interface ExitRecord {
  id: string;
  exitType: 'RESIGNATION' | 'TERMINATION' | 'RETIREMENT' | 'CONTRACT_END';
  exitDate: string;
  reason: string;
  noticePeriod: number;
  clearedDues: boolean;
  returnedAssets: boolean;
  dataArchived: boolean;
  emailDeactivated: boolean;
  dashboardDeactivated: boolean;
}

export default function StaffRecords() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'promotions' | 'exit'>('overview');
  const [promotions, setPromotions] = useState<PromotionHistory[]>([]);
  const [exitRecord, setExitRecord] = useState<ExitRecord | null>(null);
  
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  
  const [promotionData, setPromotionData] = useState({
    newPosition: '',
    newSalary: '',
    effectiveDate: '',
    reason: ''
  });

  const [exitData, setExitData] = useState({
    exitType: 'RESIGNATION' as 'RESIGNATION' | 'TERMINATION' | 'RETIREMENT' | 'CONTRACT_END',
    exitDate: '',
    lastWorkingDay: '',
    reason: '',
    noticePeriod: 30,
    returnedAssets: false,
    clearedDues: false,
    archiveData: true,
    deactivateEmail: true,
    deactivateDashboard: true,
    transferDataTo: ''
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (selectedStaff) {
      fetchPromotionHistory(selectedStaff.id);
      fetchExitRecord(selectedStaff.id);
    }
  }, [selectedStaff]);

  const fetchStaff = async () => {
    try {
      const response = await axios.get('http://localhost:4000/hr/staff');
      setStaff(response.data);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    }
  };

  const fetchPromotionHistory = async (staffId: string) => {
    try {
      const response = await axios.get(`http://localhost:4000/hr/staff/${staffId}/promotions`);
      setPromotions(response.data);
    } catch (error) {
      console.error('Failed to fetch promotions:', error);
      setPromotions([]);
    }
  };

  const fetchExitRecord = async (staffId: string) => {
    try {
      const response = await axios.get(`http://localhost:4000/hr/staff/${staffId}/exit`);
      setExitRecord(response.data);
    } catch (error) {
      setExitRecord(null);
    }
  };

  const handlePromote = async () => {
    if (!selectedStaff) return;

    try {
      await axios.post(`http://localhost:4000/hr/staff/${selectedStaff.id}/promote`, promotionData);
      alert('Staff member promoted successfully!');
      setShowPromoteModal(false);
      fetchPromotionHistory(selectedStaff.id);
      fetchStaff();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to promote staff');
    }
  };

  const handleInitiateExit = async () => {
    if (!selectedStaff) return;

    if (!confirm(`Are you sure you want to initiate exit for ${selectedStaff.firstName} ${selectedStaff.lastName}?`)) {
      return;
    }

    try {
      await axios.post(`http://localhost:4000/hr/staff/${selectedStaff.id}/exit`, exitData);
      alert('Exit initiated successfully!');
      setShowExitModal(false);
      fetchExitRecord(selectedStaff.id);
      fetchStaff();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to initiate exit');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800',
      ON_LEAVE: 'bg-yellow-100 text-yellow-800',
      SUSPENDED: 'bg-red-100 text-red-800',
      EXIT_INITIATED: 'bg-orange-100 text-orange-800',
      EXITED: 'bg-gray-100 text-gray-800'
    };
    return styles[status as keyof typeof styles] || styles.ACTIVE;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">👥 Staff Records & Lifecycle</h1>
          <p className="text-gray-600 mt-2">Manage staff records, promotions, and exit processes</p>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {/* Staff List */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Staff ({staff.length})</h2>
              <div className="space-y-2">
                {staff.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => setSelectedStaff(member)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedStaff?.id === member.id
                        ? 'bg-blue-50 border-2 border-blue-600'
                        : 'border-2 border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-semibold text-sm">{member.firstName} {member.lastName}</div>
                    <div className="text-xs text-gray-600">{member.position}</div>
                    <div className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${getStatusBadge(member.status)}`}>
                      {member.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Staff Details */}
          <div className="col-span-3">
            {selectedStaff ? (
              <div className="bg-white rounded-lg shadow-sm">
                {/* Header */}
                <div className="p-6 border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {selectedStaff.firstName[0]}{selectedStaff.lastName[0]}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{selectedStaff.firstName} {selectedStaff.lastName}</h2>
                        <p className="text-gray-600">{selectedStaff.position} • {selectedStaff.department}</p>
                        <p className="text-sm text-gray-500">ID: {selectedStaff.employeeId}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {selectedStaff.status === 'ACTIVE' && (
                        <>
                          <button
                            onClick={() => setShowPromoteModal(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                          >
                            Promote
                          </button>
                          <button
                            onClick={() => setShowExitModal(true)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                          >
                            Initiate Exit
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b">
                  <nav className="flex -mb-px">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`px-6 py-4 text-sm font-medium border-b-2 ${
                        activeTab === 'overview'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('promotions')}
                      className={`px-6 py-4 text-sm font-medium border-b-2 ${
                        activeTab === 'promotions'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Promotion History ({promotions.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('exit')}
                      className={`px-6 py-4 text-sm font-medium border-b-2 ${
                        activeTab === 'exit'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Exit Management
                    </button>
                  </nav>
                </div>

                {/* Content */}
                <div className="p-6">
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-semibold mb-3">Contact Information</h3>
                          <div className="space-y-2 text-sm">
                            <div><span className="text-gray-600">Email:</span> {selectedStaff.email}</div>
                            <div><span className="text-gray-600">Phone:</span> {selectedStaff.phone}</div>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-3">Employment Details</h3>
                          <div className="space-y-2 text-sm">
                            <div><span className="text-gray-600">Start Date:</span> {new Date(selectedStaff.startDate).toLocaleDateString()}</div>
                            <div><span className="text-gray-600">Current Salary:</span> KES {selectedStaff.currentSalary.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'promotions' && (
                    <div>
                      <h3 className="font-semibold mb-4">Promotion History</h3>
                      {promotions.length > 0 ? (
                        <div className="space-y-4">
                          {promotions.map((promo) => (
                            <div key={promo.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-semibold text-lg mb-2">
                                    {promo.fromPosition} → {promo.toPosition}
                                  </div>
                                  <div className="text-sm text-gray-600 space-y-1">
                                    <div>Salary: KES {promo.fromSalary.toLocaleString()} → KES {promo.toSalary.toLocaleString()}</div>
                                    <div>Effective: {new Date(promo.effectiveDate).toLocaleDateString()}</div>
                                    <div>Reason: {promo.reason}</div>
                                    <div>Approved By: {promo.approvedBy}</div>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                  {new Date(promo.promotionDate).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <p>No promotion history yet</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'exit' && (
                    <div>
                      <h3 className="font-semibold mb-4">Exit Management</h3>
                      {exitRecord ? (
                        <div className="border border-gray-200 rounded-lg p-6">
                          <div className="space-y-4">
                            <div>
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                exitRecord.exitType === 'RESIGNATION' ? 'bg-yellow-100 text-yellow-800' :
                                exitRecord.exitType === 'TERMINATION' ? 'bg-red-100 text-red-800' :
                                exitRecord.exitType === 'RETIREMENT' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {exitRecord.exitType}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-sm text-gray-600">Exit Date</div>
                                <div className="font-semibold">{new Date(exitRecord.exitDate).toLocaleDateString()}</div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-600">Notice Period</div>
                                <div className="font-semibold">{exitRecord.noticePeriod} days</div>
                              </div>
                            </div>

                            <div>
                              <div className="text-sm text-gray-600 mb-2">Reason</div>
                              <div className="bg-gray-50 p-3 rounded-lg">{exitRecord.reason}</div>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-3">Clearance Checklist</h4>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className={`w-5 h-5 rounded ${exitRecord.returnedAssets ? 'bg-green-500 text-white' : 'bg-gray-300'} flex items-center justify-center text-xs`}>
                                    {exitRecord.returnedAssets && '✓'}
                                  </span>
                                  <span>Company assets returned</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`w-5 h-5 rounded ${exitRecord.clearedDues ? 'bg-green-500 text-white' : 'bg-gray-300'} flex items-center justify-center text-xs`}>
                                    {exitRecord.clearedDues && '✓'}
                                  </span>
                                  <span>Financial dues cleared</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`w-5 h-5 rounded ${exitRecord.dataArchived ? 'bg-green-500 text-white' : 'bg-gray-300'} flex items-center justify-center text-xs`}>
                                    {exitRecord.dataArchived && '✓'}
                                  </span>
                                  <span>Data archived</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`w-5 h-5 rounded ${exitRecord.emailDeactivated ? 'bg-green-500 text-white' : 'bg-gray-300'} flex items-center justify-center text-xs`}>
                                    {exitRecord.emailDeactivated && '✓'}
                                  </span>
                                  <span>Email account deactivated</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`w-5 h-5 rounded ${exitRecord.dashboardDeactivated ? 'bg-green-500 text-white' : 'bg-gray-300'} flex items-center justify-center text-xs`}>
                                    {exitRecord.dashboardDeactivated && '✓'}
                                  </span>
                                  <span>Dashboard access revoked</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <p>No exit process initiated</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">👈</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Staff Member</h3>
                <p className="text-gray-600">Choose a staff member to view their records and history</p>
              </div>
            )}
          </div>
        </div>

        {/* Promote Modal */}
        {showPromoteModal && selectedStaff && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl p-6">
              <h3 className="text-xl font-bold mb-4">Promote {selectedStaff.firstName} {selectedStaff.lastName}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Position</label>
                  <input
                    type="text"
                    value={selectedStaff.position}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Position *</label>
                  <input
                    type="text"
                    value={promotionData.newPosition}
                    onChange={(e) => setPromotionData({ ...promotionData, newPosition: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Salary</label>
                    <input
                      type="text"
                      value={`KES ${selectedStaff.currentSalary.toLocaleString()}`}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Salary *</label>
                    <input
                      type="number"
                      value={promotionData.newSalary}
                      onChange={(e) => setPromotionData({ ...promotionData, newSalary: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Effective Date *</label>
                  <input
                    type="date"
                    value={promotionData.effectiveDate}
                    onChange={(e) => setPromotionData({ ...promotionData, effectiveDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
                  <textarea
                    value={promotionData.reason}
                    onChange={(e) => setPromotionData({ ...promotionData, reason: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowPromoteModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePromote}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Confirm Promotion
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Exit Modal */}
        {showExitModal && selectedStaff && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4 text-red-900">Initiate Exit for {selectedStaff.firstName} {selectedStaff.lastName}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exit Type *</label>
                  <select
                    value={exitData.exitType}
                    onChange={(e) => setExitData({ ...exitData, exitType: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="RESIGNATION">Resignation</option>
                    <option value="TERMINATION">Termination</option>
                    <option value="RETIREMENT">Retirement</option>
                    <option value="CONTRACT_END">Contract End</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Exit Date *</label>
                    <input
                      type="date"
                      value={exitData.exitDate}
                      onChange={(e) => setExitData({ ...exitData, exitDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Working Day *</label>
                    <input
                      type="date"
                      value={exitData.lastWorkingDay}
                      onChange={(e) => setExitData({ ...exitData, lastWorkingDay: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notice Period (days) *</label>
                  <input
                    type="number"
                    value={exitData.noticePeriod}
                    onChange={(e) => setExitData({ ...exitData, noticePeriod: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
                  <textarea
                    value={exitData.reason}
                    onChange={(e) => setExitData({ ...exitData, reason: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <h4 className="font-semibold mb-3">System Actions</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={exitData.archiveData}
                        onChange={(e) => setExitData({ ...exitData, archiveData: e.target.checked })}
                        className="w-5 h-5"
                      />
                      <span className="text-sm">Archive all staff data</span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={exitData.deactivateEmail}
                        onChange={(e) => setExitData({ ...exitData, deactivateEmail: e.target.checked })}
                        className="w-5 h-5"
                      />
                      <span className="text-sm">Deactivate email account</span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={exitData.deactivateDashboard}
                        onChange={(e) => setExitData({ ...exitData, deactivateDashboard: e.target.checked })}
                        className="w-5 h-5"
                      />
                      <span className="text-sm">Revoke dashboard access</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Data To (Staff ID)</label>
                  <input
                    type="text"
                    value={exitData.transferDataTo}
                    onChange={(e) => setExitData({ ...exitData, transferDataTo: e.target.value })}
                    placeholder="e.g., KC250001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Transfer responsibilities and active tasks to another staff member</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Clearance Checklist</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={exitData.returnedAssets}
                        onChange={(e) => setExitData({ ...exitData, returnedAssets: e.target.checked })}
                        className="w-5 h-5"
                      />
                      <span className="text-sm">Company assets returned (laptop, ID card, keys, etc.)</span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={exitData.clearedDues}
                        onChange={(e) => setExitData({ ...exitData, clearedDues: e.target.checked })}
                        className="w-5 h-5"
                      />
                      <span className="text-sm">Financial dues cleared (loans, advances, etc.)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowExitModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInitiateExit}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Initiate Exit Process
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
