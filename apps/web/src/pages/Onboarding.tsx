import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface CandidateForOnboarding {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  offerId: string;
  offerAcceptedAt: string;
}

export default function Onboarding() {
  const [candidates, setCandidates] = useState<CandidateForOnboarding[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateForOnboarding | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [onboardingData, setOnboardingData] = useState({
    // Personal Details
    employeeId: '',
    dateOfBirth: '',
    nationalId: '',
    taxPin: '',
    nssfNumber: '',
    nhifNumber: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',

    // Employment Details
    startDate: '',
    probationEndDate: '',
    department: '',
    position: '',
    reportingTo: '',
    employmentType: 'FULL_TIME', // FULL_TIME, PART_TIME, CONTRACT, INTERN
    contractEndDate: '',
    
    // Compensation
    basicSalary: '',
    houseAllowance: '',
    transportAllowance: '',
    otherAllowances: '',
    currency: 'KES',
    paymentFrequency: 'MONTHLY',
    bankName: '',
    bankAccount: '',
    bankBranch: '',

    // System Access
    createEmailAccount: true,
    emailPassword: '',
    assignRole: 'EMPLOYEE',
    grantDashboardAccess: true,

    // Documents
    hasSignedContract: false,
    hasProvidedCertificates: false,
    hasProvidedNationalId: false,
    hasProvidedKraPin: false,
  });

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const response = await axios.get('http://localhost:4000/hr/onboarding/pending');
      setCandidates(response.data);
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    }
  };

  const handleSelectCandidate = (candidate: CandidateForOnboarding) => {
    setSelectedCandidate(candidate);
    setOnboardingData({
      ...onboardingData,
      employeeId: generateEmployeeId(),
      department: candidate.department,
      position: candidate.position,
      startDate: new Date().toISOString().split('T')[0],
      probationEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      emailPassword: generateRandomPassword()
    });
  };

  const generateEmployeeId = () => {
    const prefix = 'KC';
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${year}${random}`;
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSubmitOnboarding = async () => {
    if (!selectedCandidate) return;

    try {
      setLoading(true);
      
      const payload = {
        candidateId: selectedCandidate.id,
        offerId: selectedCandidate.offerId,
        ...onboardingData
      };

      const response = await axios.post('http://localhost:4000/hr/onboarding/complete', payload);
      
      setMessage({ 
        type: 'success', 
        text: `${selectedCandidate.firstName} ${selectedCandidate.lastName} successfully onboarded! Staff ID: ${response.data.staffId}`
      });
      
      // Reset form
      setSelectedCandidate(null);
      setOnboardingData({
        employeeId: '',
        dateOfBirth: '',
        nationalId: '',
        taxPin: '',
        nssfNumber: '',
        nhifNumber: '',
        address: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelation: '',
        startDate: '',
        probationEndDate: '',
        department: '',
        position: '',
        reportingTo: '',
        employmentType: 'FULL_TIME',
        contractEndDate: '',
        basicSalary: '',
        houseAllowance: '',
        transportAllowance: '',
        otherAllowances: '',
        currency: 'KES',
        paymentFrequency: 'MONTHLY',
        bankName: '',
        bankAccount: '',
        bankBranch: '',
        createEmailAccount: true,
        emailPassword: '',
        assignRole: 'EMPLOYEE',
        grantDashboardAccess: true,
        hasSignedContract: false,
        hasProvidedCertificates: false,
        hasProvidedNationalId: false,
        hasProvidedKraPin: false,
      });
      
      fetchCandidates();
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to complete onboarding'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">👥 Staff Onboarding</h1>
          <p className="text-gray-600 mt-2">Convert accepted candidates to staff members</p>
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

        <div className="grid grid-cols-3 gap-6">
          {/* Candidates List */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Pending Onboarding</h2>
              <div className="space-y-3">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    onClick={() => handleSelectCandidate(candidate)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedCandidate?.id === candidate.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">
                      {candidate.firstName} {candidate.lastName}
                    </div>
                    <div className="text-sm text-gray-600">{candidate.position}</div>
                    <div className="text-xs text-gray-500 mt-1">{candidate.department}</div>
                    <div className="text-xs text-green-600 mt-2">
                      Offer accepted: {new Date(candidate.offerAcceptedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                
                {candidates.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No candidates pending onboarding</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Onboarding Form */}
          <div className="col-span-2">
            {selectedCandidate ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-6">
                  Onboard {selectedCandidate.firstName} {selectedCandidate.lastName}
                </h2>

                <div className="space-y-6">
                  {/* Personal Details Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-blue-900 border-b pb-2">Personal Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID *</label>
                        <input
                          type="text"
                          value={onboardingData.employeeId}
                          onChange={(e) => setOnboardingData({ ...onboardingData, employeeId: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                        <input
                          type="date"
                          value={onboardingData.dateOfBirth}
                          onChange={(e) => setOnboardingData({ ...onboardingData, dateOfBirth: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">National ID *</label>
                        <input
                          type="text"
                          value={onboardingData.nationalId}
                          onChange={(e) => setOnboardingData({ ...onboardingData, nationalId: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">KRA PIN *</label>
                        <input
                          type="text"
                          value={onboardingData.taxPin}
                          onChange={(e) => setOnboardingData({ ...onboardingData, taxPin: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">NSSF Number</label>
                        <input
                          type="text"
                          value={onboardingData.nssfNumber}
                          onChange={(e) => setOnboardingData({ ...onboardingData, nssfNumber: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">NHIF Number</label>
                        <input
                          type="text"
                          value={onboardingData.nhifNumber}
                          onChange={(e) => setOnboardingData({ ...onboardingData, nhifNumber: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Physical Address</label>
                        <textarea
                          value={onboardingData.address}
                          onChange={(e) => setOnboardingData({ ...onboardingData, address: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          rows={2}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Name *</label>
                        <input
                          type="text"
                          value={onboardingData.emergencyContactName}
                          onChange={(e) => setOnboardingData({ ...onboardingData, emergencyContactName: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Phone *</label>
                        <input
                          type="tel"
                          value={onboardingData.emergencyContactPhone}
                          onChange={(e) => setOnboardingData({ ...onboardingData, emergencyContactPhone: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Relation</label>
                        <input
                          type="text"
                          value={onboardingData.emergencyContactRelation}
                          onChange={(e) => setOnboardingData({ ...onboardingData, emergencyContactRelation: e.target.value })}
                          placeholder="e.g., Spouse, Parent, Sibling"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Employment Details Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-blue-900 border-b pb-2">Employment Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                        <input
                          type="date"
                          value={onboardingData.startDate}
                          onChange={(e) => setOnboardingData({ ...onboardingData, startDate: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Probation End Date</label>
                        <input
                          type="date"
                          value={onboardingData.probationEndDate}
                          onChange={(e) => setOnboardingData({ ...onboardingData, probationEndDate: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                        <input
                          type="text"
                          value={onboardingData.department}
                          onChange={(e) => setOnboardingData({ ...onboardingData, department: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Position *</label>
                        <input
                          type="text"
                          value={onboardingData.position}
                          onChange={(e) => setOnboardingData({ ...onboardingData, position: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Reporting To</label>
                        <input
                          type="text"
                          value={onboardingData.reportingTo}
                          onChange={(e) => setOnboardingData({ ...onboardingData, reportingTo: e.target.value })}
                          placeholder="Manager/Supervisor ID"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type *</label>
                        <select
                          value={onboardingData.employmentType}
                          onChange={(e) => setOnboardingData({ ...onboardingData, employmentType: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="FULL_TIME">Full Time</option>
                          <option value="PART_TIME">Part Time</option>
                          <option value="CONTRACT">Contract</option>
                          <option value="INTERN">Intern</option>
                        </select>
                      </div>

                      {onboardingData.employmentType === 'CONTRACT' && (
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Contract End Date *</label>
                          <input
                            type="date"
                            value={onboardingData.contractEndDate}
                            onChange={(e) => setOnboardingData({ ...onboardingData, contractEndDate: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Compensation Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-blue-900 border-b pb-2">Compensation & Banking</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Basic Salary *</label>
                        <input
                          type="number"
                          value={onboardingData.basicSalary}
                          onChange={(e) => setOnboardingData({ ...onboardingData, basicSalary: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                        <select
                          value={onboardingData.currency}
                          onChange={(e) => setOnboardingData({ ...onboardingData, currency: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="KES">KES</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">House Allowance</label>
                        <input
                          type="number"
                          value={onboardingData.houseAllowance}
                          onChange={(e) => setOnboardingData({ ...onboardingData, houseAllowance: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Transport Allowance</label>
                        <input
                          type="number"
                          value={onboardingData.transportAllowance}
                          onChange={(e) => setOnboardingData({ ...onboardingData, transportAllowance: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Other Allowances</label>
                        <input
                          type="number"
                          value={onboardingData.otherAllowances}
                          onChange={(e) => setOnboardingData({ ...onboardingData, otherAllowances: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Frequency</label>
                        <select
                          value={onboardingData.paymentFrequency}
                          onChange={(e) => setOnboardingData({ ...onboardingData, paymentFrequency: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="MONTHLY">Monthly</option>
                          <option value="BIWEEKLY">Bi-weekly</option>
                          <option value="WEEKLY">Weekly</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name *</label>
                        <input
                          type="text"
                          value={onboardingData.bankName}
                          onChange={(e) => setOnboardingData({ ...onboardingData, bankName: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bank Account *</label>
                        <input
                          type="text"
                          value={onboardingData.bankAccount}
                          onChange={(e) => setOnboardingData({ ...onboardingData, bankAccount: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bank Branch</label>
                        <input
                          type="text"
                          value={onboardingData.bankBranch}
                          onChange={(e) => setOnboardingData({ ...onboardingData, bankBranch: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* System Access Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-blue-900 border-b pb-2">System Access</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-3">
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={onboardingData.createEmailAccount}
                            onChange={(e) => setOnboardingData({ ...onboardingData, createEmailAccount: e.target.checked })}
                            className="w-5 h-5"
                          />
                          <span className="text-sm font-medium text-gray-700">Create company email account</span>
                        </label>

                        {onboardingData.createEmailAccount && (
                          <div className="ml-8">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Password</label>
                            <input
                              type="text"
                              value={onboardingData.emailPassword}
                              onChange={(e) => setOnboardingData({ ...onboardingData, emailPassword: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            />
                            <p className="text-xs text-gray-500 mt-1">Auto-generated secure password. Staff will reset on first login.</p>
                          </div>
                        )}

                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={onboardingData.grantDashboardAccess}
                            onChange={(e) => setOnboardingData({ ...onboardingData, grantDashboardAccess: e.target.checked })}
                            className="w-5 h-5"
                          />
                          <span className="text-sm font-medium text-gray-700">Grant dashboard access</span>
                        </label>

                        {onboardingData.grantDashboardAccess && (
                          <div className="ml-8">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Assign Role</label>
                            <select
                              value={onboardingData.assignRole}
                              onChange={(e) => setOnboardingData({ ...onboardingData, assignRole: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            >
                              <option value="EMPLOYEE">Employee</option>
                              <option value="MANAGER">Manager</option>
                              <option value="HR">HR</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Document Checklist Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-blue-900 border-b pb-2">Document Checklist</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={onboardingData.hasSignedContract}
                          onChange={(e) => setOnboardingData({ ...onboardingData, hasSignedContract: e.target.checked })}
                          className="w-5 h-5"
                        />
                        <span className="text-sm font-medium text-gray-700">Employment contract signed</span>
                      </label>

                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={onboardingData.hasProvidedCertificates}
                          onChange={(e) => setOnboardingData({ ...onboardingData, hasProvidedCertificates: e.target.checked })}
                          className="w-5 h-5"
                        />
                        <span className="text-sm font-medium text-gray-700">Academic/Professional certificates provided</span>
                      </label>

                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={onboardingData.hasProvidedNationalId}
                          onChange={(e) => setOnboardingData({ ...onboardingData, hasProvidedNationalId: e.target.checked })}
                          className="w-5 h-5"
                        />
                        <span className="text-sm font-medium text-gray-700">National ID copy provided</span>
                      </label>

                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={onboardingData.hasProvidedKraPin}
                          onChange={(e) => setOnboardingData({ ...onboardingData, hasProvidedKraPin: e.target.checked })}
                          className="w-5 h-5"
                        />
                        <span className="text-sm font-medium text-gray-700">KRA PIN provided</span>
                      </label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <button
                      onClick={() => setSelectedCandidate(null)}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitOnboarding}
                      disabled={loading}
                      className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
                    >
                      {loading ? 'Processing...' : 'Complete Onboarding'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">👈</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Candidate</h3>
                <p className="text-gray-600">Choose a candidate from the list to begin the onboarding process</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
