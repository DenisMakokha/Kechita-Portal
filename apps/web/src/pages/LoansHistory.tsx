import { useState, useEffect } from 'react';

interface Loan {
  id: string;
  type: string;
  amount: number;
  interestRate: number;
  repaymentMonths: number;
  monthlyPayment: number;
  status: string;
  reason: string;
  appliedAt: string;
  approvedBy?: {
    firstName: string;
    lastName: string;
  };
  repayments: {
    month: number;
    amount: number;
    paidAt: string | null;
  }[];
}

export default function LoansHistory() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const response = await fetch('http://localhost:4000/loans/loans', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setLoans(data);
      }
    } catch (error) {
      console.error('Failed to fetch loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async (loanId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/loans/loans/${loanId}/schedule`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSchedule(data);
        setSelectedLoan(loanId);
      }
    } catch (error) {
      console.error('Failed to fetch loan schedule:', error);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PAID_OFF':
        return 'bg-blue-100 text-blue-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'DEFAULTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const activeLoans = loans.filter(l => l.status === 'ACTIVE');
  const totalBorrowed = activeLoans.reduce((sum, l) => sum + l.amount, 0);
  const totalRepayment = activeLoans.reduce((sum, l) => sum + (l.monthlyPayment * l.repaymentMonths), 0);

  if (loading) {
    return <div className="p-8">Loading loans history...</div>;
  }

  const selectedLoanData = loans.find(l => l.id === selectedLoan);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Loans History</h1>
          <p className="text-gray-600">View all your loan applications and repayment schedules</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Loans</div>
            <div className="text-2xl font-bold text-blue-600">{loans.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Active Loans</div>
            <div className="text-2xl font-bold text-orange-600">{activeLoans.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Amount Borrowed</div>
            <div className="text-2xl font-bold text-purple-600">
              ${totalBorrowed.toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Repayment</div>
            <div className="text-2xl font-bold text-red-600">
              ${totalRepayment.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Loans List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold">My Loans</h2>
            </div>
            
            {loans.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">🏦</div>
                <p>No loans found</p>
              </div>
            ) : (
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {loans.map(loan => {
                  const totalInterest = (loan.monthlyPayment * loan.repaymentMonths) - loan.amount;
                  const paidMonths = loan.repayments?.filter(r => r.paidAt).length || 0;
                  
                  return (
                    <div 
                      key={loan.id} 
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${
                        selectedLoan === loan.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => fetchSchedule(loan.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-lg">
                            {loan.type.replace('_', ' ')}
                          </h3>
                          <p className="text-sm text-gray-600">{loan.reason}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${getStatusStyle(loan.status)}`}>
                          {loan.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Principal:</span>
                          <span className="font-bold ml-1">${loan.amount.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Monthly:</span>
                          <span className="font-bold ml-1">${loan.monthlyPayment.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Interest:</span>
                          <span className="font-bold ml-1">${totalInterest.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Paid:</span>
                          <span className="font-bold ml-1">{paidMonths}/{loan.repaymentMonths}</span>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-500">
                        Applied: {new Date(loan.appliedAt).toLocaleDateString()}
                        {loan.approvedBy && (
                          <> • Approved by {loan.approvedBy.firstName} {loan.approvedBy.lastName}</>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Repayment Schedule */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold">Repayment Schedule</h2>
            </div>
            
            {!selectedLoan ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p>Select a loan to view repayment schedule</p>
              </div>
            ) : selectedLoanData ? (
              <div className="p-6">
                {/* Loan Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-gray-600">Loan Amount</div>
                      <div className="font-bold text-lg">${selectedLoanData.amount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Interest Rate</div>
                      <div className="font-bold text-lg">{(selectedLoanData.interestRate * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Monthly Payment</div>
                      <div className="font-bold text-lg">${selectedLoanData.monthlyPayment.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Term</div>
                      <div className="font-bold text-lg">{selectedLoanData.repaymentMonths} months</div>
                    </div>
                  </div>
                </div>

                {/* Schedule Table */}
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Month</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Payment</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Principal</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Interest</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Balance</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {schedule.map((payment, index) => {
                        const repayment = selectedLoanData.repayments?.find(r => r.month === payment.month);
                        const isPaid = repayment?.paidAt;
                        
                        return (
                          <tr key={index} className={isPaid ? 'bg-green-50' : ''}>
                            <td className="px-3 py-2">{payment.month}</td>
                            <td className="px-3 py-2 font-medium">
                              ${payment.payment.toFixed(2)}
                            </td>
                            <td className="px-3 py-2">${payment.principal.toFixed(2)}</td>
                            <td className="px-3 py-2">${payment.interest.toFixed(2)}</td>
                            <td className="px-3 py-2">${payment.balance.toFixed(2)}</td>
                            <td className="px-3 py-2">
                              {isPaid ? (
                                <span className="text-green-600 text-xs">✓ Paid</span>
                              ) : (
                                <span className="text-gray-400 text-xs">Pending</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
