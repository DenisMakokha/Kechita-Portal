import { Router } from 'express';
import { prisma } from '@kechita/db/src/index.js';
import { authenticate, requireRoles } from '../../middleware/auth.js';
import { sendMail } from '../../utils/email.js';

const router = Router();

// ============================================
// LOAN REQUESTS
// ============================================

// Submit loan request
router.post('/loans', authenticate, async (req, res) => {
  const { user } = req as any;
  const { type, amount, reason, requestDay, installments, interestRate } = req.body;

  if (!type || !amount || !reason || !requestDay) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate request day (14 or 15)
  if (![14, 15].includes(Number(requestDay))) {
    return res.status(400).json({ error: 'Request day must be 14 or 15' });
  }

  // Get current month for processing
  const now = new Date();
  const requestMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Calculate processing month (14th this month, 15th next month)
  let processingMonth = requestMonth;
  if (Number(requestDay) === 15) {
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    processingMonth = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
  }

  // Check for existing active loans
  const existingLoans = await prisma.staffLoan.findMany({
    where: {
      userId: user.id,
      status: { in: ['PENDING', 'APPROVED'] }
    }
  });

  if (existingLoans.length > 0) {
    return res.status(400).json({ 
      error: 'You have an existing active loan. Please clear it first.' 
    });
  }

  // Create loan request
  const loan = await prisma.staffLoan.create({
    data: {
      userId: user.id,
      type,
      amount: Number(amount),
      currency: 'KES',
      reason,
      requestMonth,
      requestDay: Number(requestDay),
      processingMonth,
      interestRate: interestRate ? Number(interestRate) : 0,
      installments: installments ? Number(installments) : 1,
      status: 'PENDING'
    }
  });

  // Notify HR/Finance
  const hrUsers = await prisma.user.findMany({
    where: { role: { in: ['hr', 'finance', 'superadmin'] } },
    select: { email: true, firstName: true }
  });

  const userDetails = await prisma.user.findUnique({
    where: { id: user.id },
    select: { firstName: true, lastName: true, position: true, branch: true }
  });

  for (const hrUser of hrUsers) {
    try {
      await sendMail({
        to: hrUser.email,
        subject: `Loan Request from ${userDetails?.firstName} ${userDetails?.lastName}`,
        html: `
          <p>Dear ${hrUser.firstName},</p>
          <p>${userDetails?.firstName} ${userDetails?.lastName} (${userDetails?.position}) has submitted a loan request:</p>
          <ul>
            <li><strong>Type:</strong> ${type}</li>
            <li><strong>Amount:</strong> KES ${amount}</li>
            <li><strong>Request Day:</strong> ${requestDay}th</li>
            <li><strong>Processing Month:</strong> ${processingMonth}</li>
            <li><strong>Installments:</strong> ${installments || 1}</li>
            <li><strong>Reason:</strong> ${reason}</li>
          </ul>
          <p>Please review in the staff portal.</p>
        `,
        text: `Loan request: ${type} - KES ${amount} for ${requestDay}th payment`
      });
    } catch (e) {
      console.error('Email notification failed:', e);
    }
  }

  res.status(201).json(loan);
});

// Get user's loans
router.get('/loans', authenticate, async (req, res) => {
  const { user } = req as any;
  const { status, year } = req.query;

  const where: any = {};

  // Non-admin users see only their loans
  if (!['hr', 'finance', 'superadmin'].includes(user.role)) {
    where.userId = user.id;
  }

  if (status) where.status = status;

  if (year) {
    const yearNum = Number(year);
    where.requestedDate = {
      gte: new Date(yearNum, 0, 1),
      lt: new Date(yearNum + 1, 0, 1)
    };
  }

  const loans = await prisma.staffLoan.findMany({
    where,
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, position: true, branch: true }
      },
      repayments: true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json(loans);
});

// Get pending loan approvals
router.get('/loans/pending-approvals', authenticate, requireRoles('hr', 'finance', 'superadmin'), async (_req, res) => {
  const loans = await prisma.staffLoan.findMany({
    where: { status: 'PENDING' },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, position: true, branch: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  res.json(loans);
});

// Get single loan
router.get('/loans/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { user } = req as any;

  const loan = await prisma.staffLoan.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, position: true, branch: true }
      },
      repayments: {
        orderBy: { installmentNumber: 'asc' }
      }
    }
  });

  if (!loan) {
    return res.status(404).json({ error: 'Loan not found' });
  }

  // Check permissions
  if (loan.userId !== user.id && !['hr', 'finance', 'superadmin'].includes(user.role)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  res.json(loan);
});

// Approve loan
router.post('/loans/:id/approve', authenticate, requireRoles('hr', 'finance', 'superadmin'), async (req, res) => {
  const { id } = req.params;
  const { user } = req as any;
  const { approvedAmount, installments, interestRate, comments } = req.body;

  const loan = await prisma.staffLoan.findUnique({
    where: { id },
    include: { user: true }
  });

  if (!loan) {
    return res.status(404).json({ error: 'Loan not found' });
  }

  if (loan.status !== 'PENDING') {
    return res.status(400).json({ error: 'Loan is not pending' });
  }

  const finalAmount = approvedAmount ? Number(approvedAmount) : Number(loan.amount);
  const finalInstallments = installments ? Number(installments) : loan.installments;
  const finalInterestRate = interestRate !== undefined ? Number(interestRate) : Number(loan.interestRate);

  // Calculate installment amount with interest
  const totalWithInterest = finalAmount * (1 + finalInterestRate / 100);
  const installmentAmount = totalWithInterest / finalInstallments;

  // Calculate start and end dates
  const startDate = new Date(loan.processingMonth + '-01');
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + finalInstallments);

  const updated = await prisma.staffLoan.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedById: user.id,
      approvedAt: new Date(),
      approvedAmount: finalAmount,
      installments: finalInstallments,
      installmentAmount,
      interestRate: finalInterestRate,
      startDate,
      endDate,
      approvalNotes: comments || null
    }
  });

  // Create repayment schedule
  for (let i = 1; i <= finalInstallments; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i - 1);
    dueDate.setDate(loan.requestDay);

    await prisma.loanRepayment.create({
      data: {
        loanId: loan.id,
        installmentNumber: i,
        dueDate,
        amount: installmentAmount,
        status: 'PENDING',
        payrollMonth: `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`
      }
    });
  }

  // Send notification
  try {
    await sendMail({
      to: loan.user.email,
      subject: `Loan Approved - ${loan.type}`,
      html: `
        <p>Dear ${loan.user.firstName},</p>
        <p>Your loan request has been <strong>approved</strong>:</p>
        <ul>
          <li><strong>Type:</strong> ${loan.type}</li>
          <li><strong>Approved Amount:</strong> KES ${finalAmount}</li>
          <li><strong>Installments:</strong> ${finalInstallments} months</li>
          <li><strong>Monthly Deduction:</strong> KES ${installmentAmount.toFixed(2)}</li>
          <li><strong>Interest Rate:</strong> ${finalInterestRate}%</li>
          <li><strong>Total Repayment:</strong> KES ${totalWithInterest.toFixed(2)}</li>
          <li><strong>Start Date:</strong> ${startDate.toDateString()}</li>
        </ul>
        ${comments ? `<p><strong>Notes:</strong> ${comments}</p>` : ''}
        <p>Deductions will start from your salary on the ${loan.requestDay}th of each month.</p>
      `,
      text: `Your loan of KES ${finalAmount} has been approved with ${finalInstallments} monthly installments of KES ${installmentAmount.toFixed(2)}`
    });
  } catch (e) {
    console.error('Email notification failed:', e);
  }

  res.json(updated);
});

// Reject loan
router.post('/loans/:id/reject', authenticate, requireRoles('hr', 'finance', 'superadmin'), async (req, res) => {
  const { id } = req.params;
  const { user } = req as any;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }

  const loan = await prisma.staffLoan.findUnique({
    where: { id },
    include: { user: true }
  });

  if (!loan) {
    return res.status(404).json({ error: 'Loan not found' });
  }

  if (loan.status !== 'PENDING') {
    return res.status(400).json({ error: 'Loan is not pending' });
  }

  const updated = await prisma.staffLoan.update({
    where: { id },
    data: {
      status: 'REJECTED',
      approvedById: user.id,
      approvedAt: new Date(),
      rejectionReason: reason
    }
  });

  // Send notification
  try {
    await sendMail({
      to: loan.user.email,
      subject: `Loan Rejected - ${loan.type}`,
      html: `
        <p>Dear ${loan.user.firstName},</p>
        <p>Unfortunately, your loan request has been <strong>rejected</strong>:</p>
        <ul>
          <li><strong>Type:</strong> ${loan.type}</li>
          <li><strong>Amount:</strong> KES ${loan.amount}</li>
        </ul>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Please contact HR if you have any questions.</p>
      `,
      text: `Your loan request has been rejected. Reason: ${reason}`
    });
  } catch (e) {
    console.error('Email notification failed:', e);
  }

  res.json(updated);
});

// ============================================
// REPAYMENTS
// ============================================

// Record repayment (Finance/Payroll only)
router.post('/repayments/:id/record', authenticate, requireRoles('finance', 'superadmin'), async (req, res) => {
  const { id } = req.params;
  const { paidAmount, notes } = req.body;

  const repayment = await prisma.loanRepayment.findUnique({
    where: { id },
    include: { loan: true }
  });

  if (!repayment) {
    return res.status(404).json({ error: 'Repayment not found' });
  }

  const paid = paidAmount ? Number(paidAmount) : Number(repayment.amount);
  const arrears = Number(repayment.amount) - paid;

  const updated = await prisma.loanRepayment.update({
    where: { id },
    data: {
      paidAmount: paid,
      paidDate: new Date(),
      status: paid >= Number(repayment.amount) ? 'PAID' : 'PARTIAL',
      arrears: arrears > 0 ? arrears : 0,
      notes
    }
  });

  // Check if all repayments are complete
  const allRepayments = await prisma.loanRepayment.findMany({
    where: { loanId: repayment.loanId }
  });

  const allPaid = allRepayments.every(r => r.status === 'PAID' || r.id === id);

  if (allPaid) {
    await prisma.staffLoan.update({
      where: { id: repayment.loanId },
      data: { status: 'COMPLETED' }
    });
  }

  res.json(updated);
});

// Get repayment schedule for a loan
router.get('/loans/:id/repayments', authenticate, async (req, res) => {
  const { id } = req.params;
  const { user } = req as any;

  const loan = await prisma.staffLoan.findUnique({
    where: { id },
    select: { userId: true }
  });

  if (!loan) {
    return res.status(404).json({ error: 'Loan not found' });
  }

  // Check permissions
  if (loan.userId !== user.id && !['hr', 'finance', 'superadmin'].includes(user.role)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const repayments = await prisma.loanRepayment.findMany({
    where: { loanId: id },
    orderBy: { installmentNumber: 'asc' }
  });

  res.json(repayments);
});

// Get upcoming deductions (for payroll)
router.get('/repayments/upcoming/:month', authenticate, requireRoles('finance', 'superadmin'), async (req, res) => {
  const { month } = req.params; // Format: YYYY-MM

  const repayments = await prisma.loanRepayment.findMany({
    where: {
      payrollMonth: month,
      status: 'PENDING'
    },
    include: {
      loan: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, employeeId: true, branch: true }
          }
        }
      }
    },
    orderBy: { dueDate: 'asc' }
  });

  res.json(repayments);
});

// Get arrears report
router.get('/repayments/arrears', authenticate, requireRoles('finance', 'hr', 'superadmin'), async (_req, res) => {
  const repayments = await prisma.loanRepayment.findMany({
    where: {
      OR: [
        { status: 'OVERDUE' },
        { arrears: { gt: 0 } }
      ]
    },
    include: {
      loan: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, employeeId: true, branch: true, position: true }
          }
        }
      }
    },
    orderBy: { dueDate: 'asc' }
  });

  const summary = {
    totalArrears: repayments.reduce((sum, r) => sum + Number(r.arrears), 0),
    affectedStaff: new Set(repayments.map(r => r.loan.userId)).size,
    byBranch: {} as any
  };

  repayments.forEach(repayment => {
    const branch = repayment.loan.user.branch || 'Unknown';
    if (!summary.byBranch[branch]) {
      summary.byBranch[branch] = { count: 0, amount: 0 };
    }
    summary.byBranch[branch].count++;
    summary.byBranch[branch].amount += Number(repayment.arrears);
  });

  res.json({ repayments, summary });
});

// Get loans summary
router.get('/loans/summary/:year', authenticate, requireRoles('hr', 'finance', 'superadmin'), async (req, res) => {
  const { year } = req.params;
  
  const startDate = new Date(Number(year), 0, 1);
  const endDate = new Date(Number(year) + 1, 0, 1);

  const loans = await prisma.staffLoan.findMany({
    where: {
      requestedDate: {
        gte: startDate,
        lt: endDate
      }
    },
    include: {
      repayments: true,
      user: {
        select: { branch: true }
      }
    }
  });

  const summary = {
    totalLoans: loans.length,
    pending: loans.filter(l => l.status === 'PENDING').length,
    approved: loans.filter(l => l.status === 'APPROVED').length,
    rejected: loans.filter(l => l.status === 'REJECTED').length,
    completed: loans.filter(l => l.status === 'COMPLETED').length,
    totalRequested: loans.reduce((sum, l) => sum + Number(l.amount), 0),
    totalApproved: loans.filter(l => l.approvedAmount).reduce((sum, l) => sum + Number(l.approvedAmount), 0),
    totalDisbursed: loans.filter(l => l.disbursedAt).reduce((sum, l) => sum + Number(l.approvedAmount || l.amount), 0),
    byType: {} as any,
    byBranch: {} as any
  };

  // Group by type
  loans.forEach(loan => {
    const type = loan.type;
    if (!summary.byType[type]) {
      summary.byType[type] = { count: 0, amount: 0 };
    }
    summary.byType[type].count++;
    summary.byType[type].amount += Number(loan.amount);
  });

  // Group by branch
  loans.forEach(loan => {
    const branch = loan.user.branch || 'Unknown';
    if (!summary.byBranch[branch]) {
      summary.byBranch[branch] = { count: 0, amount: 0 };
    }
    summary.byBranch[branch].count++;
    summary.byBranch[branch].amount += Number(loan.amount);
  });

  res.json(summary);
});

export default router;
