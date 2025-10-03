import { Router } from 'express';
import { prisma } from '@kechita/db/src/index.js';
import { authenticate, requireRoles } from '../../middleware/auth.js';
import { sendMail } from '../../utils/email.js';

const router = Router();

// Get all leave types
router.get('/types', authenticate, async (_req, res) => {
  const types = await prisma.leaveType.findMany({
    where: { active: true },
    orderBy: { createdAt: 'asc' }
  });
  res.json(types);
});

// Create leave type (HR only)
router.post('/types', authenticate, requireRoles('hr', 'superadmin'), async (req, res) => {
  const { code, name, daysAllowed, carryForward, maxCarryForward, requiresDocument, isPaid, isEmergency } = req.body;
  
  if (!code || !name || daysAllowed === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const type = await prisma.leaveType.create({
    data: {
      code,
      name,
      daysAllowed: Number(daysAllowed),
      carryForward: Boolean(carryForward),
      maxCarryForward: maxCarryForward ? Number(maxCarryForward) : null,
      requiresDocument: Boolean(requiresDocument),
      isPaid: Boolean(isPaid),
      isEmergency: Boolean(isEmergency),
      active: true
    }
  });

  res.status(201).json(type);
});

// Get user's leave balances
router.get('/balance/:userId', authenticate, async (req, res) => {
  const { userId } = req.params;
  const { user } = req as any;

  if (user.id !== userId && !['hr', 'superadmin', 'manager', 'regional_manager', 'branch_manager'].includes(user.role)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const balances = await prisma.leaveBalance.findMany({
    where: { userId },
    include: { leaveType: true }
  });

  res.json(balances);
});

// Initialize balances for a user (HR only)
router.post('/balance/initialize', authenticate, requireRoles('hr', 'superadmin'), async (req, res) => {
  const { userId, year } = req.body;

  if (!userId || !year) {
    return res.status(400).json({ error: 'Missing userId or year' });
  }

  const types = await prisma.leaveType.findMany({ where: { active: true } });
  const balances = [];

  for (const type of types) {
    const existing = await prisma.leaveBalance.findFirst({
      where: { userId, leaveTypeId: type.id, year: Number(year) }
    });

    if (!existing) {
      const balance = await prisma.leaveBalance.create({
        data: {
          userId,
          leaveTypeId: type.id,
          year: Number(year),
          allocated: type.daysAllowed,
          used: 0,
          balance: type.daysAllowed
        }
      });
      balances.push(balance);
    }
  }

  res.json({ message: 'Balances initialized', count: balances.length });
});

// Create leave application
router.post('/applications', authenticate, async (req, res) => {
  const { user } = req as any;
  const { leaveTypeId, startDate, endDate, reason, documentUrl, isEmergency } = req.body;

  if (!leaveTypeId || !startDate || !endDate || !reason) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const leaveType = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
  if (!leaveType) {
    return res.status(404).json({ error: 'Leave type not found' });
  }

  if (leaveType.requiresDocument && !documentUrl) {
    return res.status(400).json({ error: 'Document is required for this leave type' });
  }

  const year = start.getFullYear();
  const balance = await prisma.leaveBalance.findFirst({
    where: { userId: user.id, leaveTypeId, year }
  });

  if (!balance || balance.balance < days) {
    return res.status(400).json({ error: 'Insufficient leave balance' });
  }

  const application = await prisma.leaveApplication.create({
    data: {
      userId: user.id,
      leaveTypeId,
      startDate: start,
      endDate: end,
      daysRequested: days,
      reason,
      documentUrl,
      isEmergency: Boolean(isEmergency) || leaveType.isEmergency,
      status: 'PENDING',
      approvalChain: [],
      approvalHistory: []
    }
  });

  await prisma.leaveBalance.update({
    where: { id: balance.id },
    data: { balance: { decrement: days } }
  });

  res.status(201).json(application);
});

// Get user's leave applications
router.get('/applications', authenticate, async (req, res) => {
  const { user } = req as any;
  const { status, year } = req.query;

  const where: any = {};

  if (!['hr', 'superadmin', 'manager', 'regional_manager', 'branch_manager'].includes(user.role)) {
    where.userId = user.id;
  }

  if (status) where.status = status;
  
  if (year) {
    const yearNum = Number(year);
    where.startDate = {
      gte: new Date(`${yearNum}-01-01`),
      lte: new Date(`${yearNum}-12-31`)
    };
  }

  const applications = await prisma.leaveApplication.findMany({
    where,
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, position: true, branch: true }
      },
      leaveType: true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json(applications);
});

// Approve leave application
router.post('/applications/:id/approve', authenticate, async (req, res) => {
  const { id } = req.params;
  const { user } = req as any;
  const { comments } = req.body;

  const application = await prisma.leaveApplication.findUnique({
    where: { id },
    include: { user: true, leaveType: true }
  });

  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  if (application.status !== 'PENDING') {
    return res.status(400).json({ error: 'Application is not pending' });
  }

  const canApprove = ['hr', 'superadmin'].includes(user.role) || (user.id === application.user.supervisorId);

  if (!canApprove) {
    return res.status(403).json({ error: 'You do not have permission to approve this application' });
  }

  const updated = await prisma.leaveApplication.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedById: user.id,
      approvedAt: new Date(),
      approvalNotes: comments || null
    }
  });

  const year = application.startDate.getFullYear();
  const userBalance = await prisma.leaveBalance.findFirst({
    where: { userId: application.userId, leaveTypeId: application.leaveTypeId, year }
  });
  
  if (userBalance) {
    await prisma.leaveBalance.update({
      where: { id: userBalance.id },
      data: { used: { increment: application.daysRequested } }
    });
  }

  res.json(updated);
});

// Reject leave application
router.post('/applications/:id/reject', authenticate, async (req, res) => {
  const { id } = req.params;
  const { user } = req as any;
  const { comments } = req.body;

  if (!comments) {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }

  const application = await prisma.leaveApplication.findUnique({
    where: { id },
    include: { user: true, leaveType: true }
  });

  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  if (application.status !== 'PENDING') {
    return res.status(400).json({ error: 'Application is not pending' });
  }

  const updated = await prisma.leaveApplication.update({
    where: { id },
    data: {
      status: 'REJECTED',
      approvedById: user.id,
      approvedAt: new Date(),
      rejectionReason: comments
    }
  });

  const year = application.startDate.getFullYear();
  const userBalance = await prisma.leaveBalance.findFirst({
    where: { userId: application.userId, leaveTypeId: application.leaveTypeId, year }
  });
  
  if (userBalance) {
    await prisma.leaveBalance.update({
      where: { id: userBalance.id },
      data: { balance: { increment: application.daysRequested } }
    });
  }

  res.json(updated);
});

export default router;
