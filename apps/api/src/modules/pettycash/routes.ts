import { Router } from 'express';
import { prisma } from '@kechita/db/src/index.js';
import { authenticate, requireRoles } from '../../middleware/auth.js';

const router = Router();

// Get all categories
router.get('/categories', authenticate, async (_req, res) => {
  const categories = await prisma.pettyCashCategory.findMany({
    where: { active: true },
    orderBy: { order: 'asc' }
  });
  res.json(categories);
});

// Create category
router.post('/categories', authenticate, requireRoles('finance', 'superadmin'), async (req, res) => {
  const { code, name, description, maxPerTransaction, requiresApproval, order } = req.body;
  const category = await prisma.pettyCashCategory.create({
    data: { code, name, description, maxPerTransaction, requiresApproval, order, active: true }
  });
  res.status(201).json(category);
});

// Submit transaction
router.post('/transactions', authenticate, async (req, res) => {
  const { user } = req as any;
  const { categoryId, amount, description, receiptUrl, transactionDate, branch } = req.body;
  
  // Get branch float
  const branchFloat = await prisma.branchFloatConfig.findUnique({ where: { branchId: branch } });
  if (!branchFloat) return res.status(404).json({ error: 'Branch float not configured' });

  // Check if float is sufficient
  const ledger = await prisma.pettyCashLedger.findFirst({
    where: { branchId: branchFloat.id },
    orderBy: { entryDate: 'desc' }
  });

  if (ledger && Number(ledger.runningBalance) < Number(amount)) {
    return res.status(400).json({ error: 'Insufficient float balance' });
  }

  // Create ledger entry
  const newBalance = ledger ? Number(ledger.runningBalance) - Number(amount) : Number(branchFloat.baseAmount) - Number(amount);
  const ledgerEntry = await prisma.pettyCashLedger.create({
    data: {
      branchId: branchFloat.id,
      entryType: 'DEBIT',
      amount: Number(amount),
      runningBalance: newBalance,
      referenceType: 'TRANSACTION',
      description,
      createdBy: user.id
    }
  });

  const voucherNumber = `PC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const transaction = await prisma.pettyCashTransaction.create({
    data: {
      ledgerId: ledgerEntry.id,
      categoryId,
      amount: Number(amount),
      description,
      receiptUrl,
      transactionDate: new Date(transactionDate),
      voucherNumber,
      requestedById: user.id,
      branch,
      status: 'PENDING',
      approvalChain: ['supervisor', 'finance'],
      approvalHistory: []
    }
  });

  res.status(201).json(transaction);
});

// Get transactions
router.get('/transactions', authenticate, async (req, res) => {
  const { user } = req as any;
  const { status, branch, startDate, endDate } = req.query;

  const where: any = {};
  if (status) where.status = status;
  if (branch) where.branch = branch;
  if (startDate && endDate) {
    where.transactionDate = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string)
    };
  }

  if (!['finance', 'superadmin'].includes(user.role)) {
    where.requestedById = user.id;
  }

  const transactions = await prisma.pettyCashTransaction.findMany({
    where,
    include: {
      category: true,
      requestedBy: { select: { firstName: true, lastName: true, position: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json(transactions);
});

// Approve transaction
router.post('/transactions/:id/approve', authenticate, requireRoles('finance', 'superadmin'), async (req, res) => {
  const { id } = req.params;
  const { user } = req as any;

  const transaction = await prisma.pettyCashTransaction.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedById: user.id,
      approvedAt: new Date(),
      paidAt: new Date(),
      paidBy: user.id
    }
  });

  res.json(transaction);
});

// Branch float configuration
router.post('/float-config', authenticate, requireRoles('finance', 'superadmin'), async (req, res) => {
  const { branchId, tier, baseAmount, minTriggerPct, hardCap } = req.body;
  
  const config = await prisma.branchFloatConfig.upsert({
    where: { branchId },
    create: {
      branchId,
      tier,
      baseAmount: Number(baseAmount),
      minTriggerPct: Number(minTriggerPct),
      hardCap: Number(hardCap),
      reviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    },
    update: {
      tier,
      baseAmount: Number(baseAmount),
      minTriggerPct: Number(minTriggerPct),
      hardCap: Number(hardCap)
    }
  });

  res.json(config);
});

// Request replenishment
router.post('/replenishment', authenticate, requireRoles('branch_manager', 'finance', 'superadmin'), async (req, res) => {
  const { branchId, requestedAmount, justification } = req.body;

  const branchFloat = await prisma.branchFloatConfig.findUnique({ where: { branchId } });
  if (!branchFloat) return res.status(404).json({ error: 'Branch float not configured' });

  const ledger = await prisma.pettyCashLedger.findFirst({
    where: { branchId: branchFloat.id },
    orderBy: { entryDate: 'desc' }
  });

  const replenishment = await prisma.replenishmentRequest.create({
    data: {
      branchId: branchFloat.id,
      requestedAmount: Number(requestedAmount),
      currentBalance: ledger?.runningBalance || 0,
      targetBalance: branchFloat.baseAmount,
      justification,
      status: 'PENDING',
      approvalChain: ['finance'],
      approvalHistory: []
    }
  });

  res.status(201).json(replenishment);
});

// Cash count
router.post('/cash-count', authenticate, requireRoles('branch_manager', 'finance', 'superadmin'), async (req, res) => {
  const { user } = req as any;
  const { branchId, countedAmount, witnessId, photoUrl, notes, countType } = req.body;

  const branchFloat = await prisma.branchFloatConfig.findUnique({ where: { branchId } });
  if (!branchFloat) return res.status(404).json({ error: 'Branch float not configured' });

  const ledger = await prisma.pettyCashLedger.findFirst({
    where: { branchId: branchFloat.id },
    orderBy: { entryDate: 'desc' }
  });

  const systemBalance = ledger?.runningBalance || branchFloat.baseAmount;
  const variance = Number(countedAmount) - Number(systemBalance);
  const variancePct = (variance / Number(systemBalance)) * 100;

  const count = await prisma.cashCount.create({
    data: {
      branchId: branchFloat.id,
      countedAmount: Number(countedAmount),
      systemBalance: Number(systemBalance),
      variance,
      variancePct,
      counterId: user.id,
      witnessId,
      photoUrl,
      notes,
      countType,
      resolved: Math.abs(variance) < 100
    }
  });

  res.status(201).json(count);
});

export default router;
