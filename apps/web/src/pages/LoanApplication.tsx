import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoanApplication() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: '14TH_PAYMENT',
    amount: '',
    reason: '',
    repaymentMonths: '12'
  });
  const [calculating, setCalculating] = useState(false);
  const [amortization, setAmortization] = useState<any>(null);

  const interestRate = 0.12; // 12% annual interest

  // Check if today is before or on the 14th
  const isBeforeDeadline = () => {
    const today = new Date();
    const dayOfMonth = today.getDate();
    return dayOfMonth <= 14;
  };

  const calculateLoan = () => {
    const principal = Number(formData.amount);
    const months = Number(formData.repaymentMonths);
    
    if (principal <= 0 || months <= 0) return;

    setCalculating(true);

    // Calculate monthly payment
    const monthlyRate = interestRate / 12;
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    const totalInterest = (monthlyPayment * months) - principal;
    const totalAmount = principal + totalInterest;

    // Generate amortization schedule
    const schedule = [];
    let remainingBalance = principal;

    for (let month = 1; month <= months; month++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance -= principalPayment;

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, remainingBalance)
      });
    }

    setAmortization({
      monthlyPayment,
      totalInterest,
      totalAmount,
      schedule
    });

    setCalculating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check deadline
    if (!isBeforeDeadline()) {
      alert('Salary advance applications must be submitted by the 14th of each month. Applications are processed on the 15th. Please submit next month.');
      return;
    }
    
    if (!amortization) {
      alert('Please calculate the advance first');
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/loans/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: formData.type,
          amount: Number(formData.amount),
          interestRate: interestRate,
          repaymentMonths: Number(formData.repaymentMonths),
          reason: formData.reason,
          monthlyPayment: amortization.monthlyPayment
        })
      });

      if (response.ok) {
        alert('Salary advance application submitted successfully! Your application will be processed on the 15th of this month.');
        navigate('/loans');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Failed to submit application'}`);
      }
    } catch (error) {
      console.error('Failed to submit salary advance application:', error);
      alert('Failed to submit salary advance application');
    }
  };

  const principal = Number(formData.amount);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Apply for Salary Advance</h1>
          <p className="text-gray-600">Submit by the 14th of each month • Processed on the 15th</p>
          
          {!isBeforeDeadline() && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <span className="text-red-600 text-xl mr-3">⚠️</span>
                <div>
                  <p className="text-red-800 font-semibold">Application Deadline Passed</p>
                  <p className="text-red-700 text-sm mt-1">
                    Salary advance applications must be submitted by the 14th of each month.
                    Applications are processed on the 15th. Please submit your application next month.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <form onSubmit={handleSubmit}>
                {/* Advance Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Advance Type *</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    disabled={!isBeforeDeadline()}
                  >
                    <option value="14TH_PAYMENT">14th Payment Advance</option>
                    <option value="15TH_PAYMENT">15th Payment Advance</option>
                  </select>
                  <p className="text-sm text-gray-600 mt-1">
                    {formData.type === '14TH_PAYMENT' ? 
                      'Extra month salary paid in December' : 
                      'Extra month salary paid in June'}
                  </p>
                </div>

                {/* Amount */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Advance Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      required
                      min="100"
                      step="100"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full border rounded px-3 py-2 pl-8"
                      placeholder="0.00"
                      disabled={!isBeforeDeadline()}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Minimum: $100</p>
                </div>

                {/* Repayment Period */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Repayment Period *</label>
                  <select
                    required
                    value={formData.repaymentMonths}
                    onChange={(e) => setFormData({ ...formData, repaymentMonths: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    disabled={!isBeforeDeadline()}
                  >
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                    <option value="18">18 months</option>
                    <option value="24">24 months</option>
                  </select>
                </div>

                {/* Calculate Button */}
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={calculateLoan}
                    disabled={calculating || !formData.amount || !isBeforeDeadline()}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {calculating ? 'Calculating...' : '🧮 Calculate Advance'}
                  </button>
                </div>

                {/* Reason */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Reason *</label>
                  <textarea
                    required
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    rows={4}
                    placeholder="Explain the reason for the salary advance request..."
                    disabled={!isBeforeDeadline()}
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => navigate('/loans')}
                    className="px-4 py-2 border rounded hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!amortization || !isBeforeDeadline()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Summary Column */}
          <div className="lg:col-span-1">
            {/* Advance Summary */}
            {amortization ? (
              <div className="bg-white rounded-lg shadow p-6 sticky top-4">
                <h3 className="font-bold text-lg mb-4">Advance Summary</h3>
                
                <div className="space-y-3 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Principal:</span>
                    <span className="font-bold">${principal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Interest Rate:</span>
                    <span className="font-bold">{(interestRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Period:</span>
                    <span className="font-bold">{formData.repaymentMonths} months</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="text-gray-600">Monthly Payment:</span>
                    <span className="font-bold text-lg text-blue-600">
                      ${amortization.monthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Interest:</span>
                    <span className="font-bold text-red-600">
                      ${amortization.totalInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-gray-600">Total Repayment:</span>
                    <span className="font-bold text-lg">
                      ${amortization.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Quick Schedule Preview */}
                <div className="mt-4 pt-4 border-t">
                  <div className="text-xs font-semibold text-gray-600 mb-2">First 3 Payments:</div>
                  {amortization.schedule.slice(0, 3).map((payment: any) => (
                    <div key={payment.month} className="text-xs mb-1 flex justify-between">
                      <span>Month {payment.month}:</span>
                      <span className="font-medium">${payment.payment.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-sm text-gray-600">
                  Enter advance amount and click "Calculate Advance" to see summary
                </p>
              </div>
            )}

            {/* Info Box */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 text-sm mb-2">📅 Application Schedule</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• <strong>Deadline:</strong> Submit by 14th of month</li>
                <li>• <strong>Processing:</strong> Applications processed on 15th</li>
                <li>• <strong>Interest:</strong> {(interestRate * 100)}% per annum</li>
                <li>• <strong>Deduction:</strong> From monthly salary</li>
                <li>• Requires manager approval</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
