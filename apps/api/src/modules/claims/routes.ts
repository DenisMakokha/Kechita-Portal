import { Router } from 'express';
import { prisma } from '@kechita/db/src/index.js';
import { authenticate, requireRoles } from '../../middleware/auth.js';
import { sendMail } from '../../utils/email.js';

const router = Router();

// ============================================
// CLAIM TYPES MANAGEMENT
// ============================================

// Get all claim types
router.get('/types', authenticate, async (_req, res) => {
  const types = await prisma.claimType.findMany({
    where: { active: true },
    orderBy: { name: 'asc' }
  });
  res.json(types);
});

// Create claim type (HR/Finance only)
router.post('/types', authenticate, requireRoles('hr', 'finance', 'superadmin'), async (req, res) => {
  const { code, name, category, requiresReceipt, maxAmount, requiresPreApproval, approvalChain } = req.body;
  
  if (!code || !name || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const type = await prisma.claimType.create({
    data: {
      code,
      name,
      category,
      requiresReceipt: Boolean(requiresReceipt),
      maxAmount: maxAmount ? Number(maxAmount) : null,
      requiresPreApproval: Boolean(requiresPreApproval),
      approvalChain: approvalChain || ['supervisor', 'finance'],
      active: true
    }
  });

  res.status(201).json(type);
});

// ============================================
// CLAIMS MANAGEMENT
// ============================================

// Submit claim
router.post('/claims', authenticate, async (req, res) => {
  const { user } = req as any;
  const { claimTypeId, amount, description, claimDate, receipts } = req.body;

  if (!claimTypeId || !amount || !description || !claimDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const claimType = await prisma.claimType.findUnique({ where: { id: claimTypeId } });
  if (!claimType) {
    return res.status(404).json({ error: 'Claim type not found' });
  }

  // Check if receipts required
  if (claimType.requiresReceipt && (!receipts || receipts.length === 0)) {
    return res.status(400).json({ error: 'Receipts are required for this claim type' });
  }

  // Check max amount
  if (claimType.maxAmount && Number(amount) > Number(claimType.maxAmount)) {
    return res.status(400).json({ 
      error: `Amount exceeds maximum allowed (${claimType.maxAmount})` 
    });
  }

  const claim = await prisma.claim.create({
    data: {
      userId: user.id,
      claimTypeId,
      amount: Number(amount),
      currency: 'KES',
      description,
      claimDate: new Date(claimDate),
      receipts: receipts || [],
      status: 'PENDING',
      approvalChain: claimType.approvalChain,
      approvalHistory: []
    }
  });

  // Notify supervisor
  const userDetails = await prisma.user.findUnique({
    where: { id: user.id },
    select: { firstName: true, lastName: true, email: true, position: true, supervisorId: true }
  });

  if (userDetails?.supervisorId) {
    const supervisor = await prisma.user.findUnique({
      where: { id: userDetails.supervisorId },
      select: { email: true, firstName: true }
    });

    if (supervisor) {
      try {
        await sendMail({
          to: supervisor.email,
          subject: `Claim Request from ${userDetails.firstName} ${userDetails.lastName}`,
          html: `
            <p>Dear ${supervisor.firstName},</p>
            <p>${userDetails.firstName} ${userDetails.lastName} has submitted a claim:</p>
            <ul>
              <li><strong>Type:</strong> ${claimType.name}</li>
              <li><strong>Amount:</strong> KES ${amount}</li>
              <li><strong>Date:</strong> ${new Date(claimDate).toDateString()}</li>
              <li><strong>Description:</strong> ${description}</li>
            </ul>
            <p>Please review in the staff portal.</p>
          `,
          text: `Claim request: ${claimType.name} - KES ${amount}`
        });
      } catch (e) {
        console.error('Email notification failed:', e);
      }
    }
  }

  res.status(201).json(claim);
});

// Get user's claims
router.get('/claims', authenticate, async (req, res) => {
  const { user } = req as any;
  const { status, year, month } = req.query;

  const where: any = {};

  // Non-admin users see only their claims
  if (!['hr', 'finance', 'superadmin'].includes(user.role)) {
    where.userId = user.id;
  }

  if (status) where.status = status;

  if (year || month) {
    const yearNum = year ? Number(year) : new Date().getFullYear();
    const monthNum = month ? Number(month) : undefined;

    if (monthNum) {
      where.claimDate = {
        gte: new Date(yearNum, monthNum - 1, 1),
        lt: new Date(yearNum, monthNum, 1)
      };
    } else {
      where.claimDate = {
        gte: new Date(yearNum, 0, 1),
        lt: new Date(yearNum + 1, 0, 1)
      };
    }
  }

  const claims = await prisma.claim.findMany({
    where,
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, position: true, branch: true }
      },
      claimType: true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json(claims);
});

// Get pending approvals
router.get('/claims/pending-approvals', authenticate, async (req, res) => {
  const { user } = req as any;

  // Get subordinates' claims if supervisor
  const subordinates = await prisma.user.findMany({
    where: { supervisorId: user.id },
    select: { id: true }
  });

  const subordinateIds = subordinates.map(s => s.id);

  // For finance role, get all pending claims
  const where: any = { status: 'PENDING' };
  
  if (user.role === 'finance') {
    // Finance sees all pending claims
  } else if (subordinateIds.length > 0) {
    // Supervisors see their subordinates' claims
    where.userId = { in: subordinateIds };
  } else {
    // No pending approvals
    return res.json([]);
  }

  const claims = await prisma.claim.findMany({
    where,
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, position: true, branch: true }
      },
      claimType: true
    },
    orderBy: { createdAt: 'asc' }
  });

  res.json(claims);
});

// Get single claim
router.get('/claims/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { user } = req as any;

  const claim = await prisma.claim.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, position: true, branch: true }
      },
      claimType: true
    }
  });

  if (!claim) {
    return res.status(404).json({ error: 'Claim not found' });
  }

  // Check permissions
  const canView = claim.userId === user.id || 
                  ['hr', 'finance', 'superadmin'].includes(user.role);

  if (!canView) {
    // Check if supervisor
    const claimUser = await prisma.user.findUnique({
      where: { id: claim.userId },
      select: { supervisorId: true }
    });

    if (claimUser?.supervisorId !== user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
  }

  res.json(claim);
});

// Approve claim
router.post('/claims/:id/approve', authenticate, async (req, res) => {
  const { id } = req.params;
  const { user } = req as any;
  const { comments, paidAmount } = req.body;

  const claim = await prisma.claim.findUnique({
    where: { id },
    include: { user: true, claimType: true }
  });

  if (!claim) {
    return res.status(404).json({ error: 'Claim not found' });
  }

  if (claim.status !== 'PENDING') {
    return res.status(400).json({ error: 'Claim is not pending' });
  }

  // Check approval permission
  const canApprove = ['hr', 'finance', 'superadmin'].includes(user.role) ||
                     (user.id === claim.user.supervisorId);

  if (!canApprove) {
    return res.status(403).json({ error: 'No permission to approve' });
  }

  const updated = await prisma.claim.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedById: user.id,
      approvedAt: new Date(),
      approvalNotes: comments || null,
      paidAmount: paidAmount ? Number(paidAmount) : Number(claim.amount)
    }
  });

  // Send notification
  try {
    await sendMail({
      to: claim.user.email,
      subject: `Claim Approved - ${claim.claimType.name}`,
      html: `
        <p>Dear ${claim.user.firstName},</p>
        <p>Your claim has been <strong>approved</strong>:</p>
        <ul>
          <li><strong>Type:</strong> ${claim.claimType.name}</li>
          <li><strong>Amount:</strong> KES ${claim.amount}</li>
          <li><strong>Paid Amount:</strong> KES ${paidAmount || claim.amount}</li>
        </ul>
        ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
      `,
      text: `Your claim for KES ${claim.amount} has been approved`
    });
  } catch (e) {
    console.error('Email notification failed:', e);
  }

  res.json(updated);
});

// Reject claim
router.post('/claims/:id/reject', authenticate, async (req, res) => {
  const { id } = req.params;
  const { user } = req as any;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }

  const claim = await prisma.claim.findUnique({
    where: { id },
    include: { user: true, claimType: true }
  });

  if (!claim) {
    return res.status(404).json({ error: 'Claim not found' });
  }

  if (claim.status !== 'PENDING') {
    return res.status(400).json({ error: 'Claim is not pending' });
  }

  const canReject = ['hr', 'finance', 'superadmin'].includes(user.role) ||
                    (user.id === claim.user.supervisorId);

  if (!canReject) {
    return res.status(403).json({ error: 'No permission to reject' });
  }

  const updated = await prisma.claim.update({
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
      to: claim.user.email,
      subject: `Claim Rejected - ${claim.claimType.name}`,
      html: `
        <p>Dear ${claim.user.firstName},</p>
        <p>Unfortunately, your claim has been <strong>rejected</strong>:</p>
        <ul>
          <li><strong>Type:</strong> ${claim.claimType.name}</li>
          <li><strong>Amount:</strong> KES ${claim.amount}</li>
        </ul>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Contact your supervisor for more details.</p>
      `,
      text: `Your claim has been rejected. Reason: ${reason}`
    });
  } catch (e) {
    console.error('Email notification failed:', e);
  }

  res.json(updated);
});

// Mark claim as paid (Finance only)
router.post('/claims/:id/mark-paid', authenticate, requireRoles('finance', 'superadmin'), async (req, res) => {
  const { id } = req.params;
  const { user } = req as any;
  const { paidAmount, paymentRef, paymentMethod } = req.body;

  const claim = await prisma.claim.findUnique({ where: { id } });

  if (!claim) {
    return res.status(404).json({ error: 'Claim not found' });
  }

  if (claim.status !== 'APPROVED') {
    return res.status(400).json({ error: 'Can only mark approved claims as paid' });
  }

  const updated = await prisma.claim.update({
    where: { id },
    data: {
      paidAt: new Date(),
      paidAmount: paidAmount ? Number(paidAmount) : claim.paidAmount || claim.amount,
      paidBy: user.id,
      paymentRef: paymentRef || null
    }
  });

  res.json(updated);
});

// Get claims summary (Finance/HR)
router.get('/claims/summary/:year/:month', authenticate, requireRoles('hr', 'finance', 'superadmin'), async (req, res) => {
  const { year, month } = req.params;
  
  const startDate = new Date(Number(year), Number(month) - 1, 1);
  const endDate = new Date(Number(year), Number(month), 1);

  const claims = await prisma.claim.findMany({
    where: {
      claimDate: {
        gte: startDate,
        lt: endDate
      }
    },
    include: {
      claimType: true,
      user: {
        select: { branch: true, region: true }
      }
    }
  });

  const summary = {
    totalClaims: claims.length,
    pending: claims.filter(c => c.status === 'PENDING').length,
    approved: claims.filter(c => c.status === 'APPROVED').length,
    rejected: claims.filter(c => c.status === 'REJECTED').length,
    paid: claims.filter(c => c.paidAt !== null).length,
    totalAmount: claims.reduce((sum, c) => sum + Number(c.amount), 0),
    approvedAmount: claims.filter(c => c.status === 'APPROVED').reduce((sum, c) => sum + Number(c.amount), 0),
    paidAmount: claims.filter(c => c.paidAt).reduce((sum, c) => sum + Number(c.paidAmount || c.amount), 0),
    byType: {} as any,
    byBranch: {} as any
  };

  // Group by type
  claims.forEach(claim => {
    const typeName = claim.claimType.name;
    if (!summary.byType[typeName]) {
      summary.byType[typeName] = { count: 0, amount: 0 };
    }
    summary.byType[typeName].count++;
    summary.byType[typeName].amount += Number(claim.amount);
  });

  // Group by branch
  claims.forEach(claim => {
    const branch = claim.user.branch || 'Unknown';
    if (!summary.byBranch[branch]) {
      summary.byBranch[branch] = { count: 0, amount: 0 };
    }
    summary.byBranch[branch].count++;
    summary.byBranch[branch].amount += Number(claim.amount);
  });

  res.json(summary);
});

export default router;
