import { Router } from 'express';
import { prisma } from '@kechita/db/src/index.js';
import { authenticate, requireRoles } from '../../middleware/auth.js';

const router = Router();

// Submit daily KPI
router.post('/kpis', authenticate, requireRoles('branch_manager', 'superadmin'), async (req, res) => {
  const { user } = req as any;
  const {
    branch, region, reportDate, newLoansCount, disbursedAmount, recoveriesAmount,
    prepaymentsAmount, outstandingPrincipal, arrearsPrincipal, par1_30, par31_60,
    par61_90, par90Plus, comments
  } = req.body;

  // Calculate totals
  const parTotal = Number(par1_30 || 0) + Number(par31_60 || 0) + Number(par61_90 || 0) + Number(par90Plus || 0);
  const parPercentage = Number(outstandingPrincipal) > 0 ? (parTotal / Number(outstandingPrincipal)) * 100 : 0;

  const kpi = await prisma.branchDailyKPI.create({
    data: {
      branch, region,
      reportDate: new Date(reportDate),
      reportedById: user.id,
      newLoansCount: Number(newLoansCount),
      disbursedAmount: Number(disbursedAmount),
      recoveriesAmount: Number(recoveriesAmount),
      prepaymentsAmount: Number(prepaymentsAmount),
      outstandingPrincipal: Number(outstandingPrincipal),
      arrearsPrincipal: Number(arrearsPrincipal),
      par1_30: Number(par1_30 || 0),
      par31_60: Number(par31_60 || 0),
      par61_90: Number(par61_90 || 0),
      par90Plus: Number(par90Plus || 0),
      parTotal,
      parPercentage,
      comments,
      status: 'DRAFT'
    }
  });

  res.status(201).json(kpi);
});

// Get KPIs
router.get('/kpis', authenticate, async (req, res) => {
  const { branch, region, startDate, endDate, status } = req.query;

  const where: any = {};
  if (branch) where.branch = branch;
  if (region) where.region = region;
  if (status) where.status = status;
  if (startDate && endDate) {
    where.reportDate = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string)
    };
  }

  const kpis = await prisma.branchDailyKPI.findMany({
    where,
    include: {
      reportedBy: { select: { firstName: true, lastName: true } }
    },
    orderBy: { reportDate: 'desc' }
  });

  res.json(kpis);
});

// Submit KPI (change status to submitted)
router.post('/kpis/:id/submit', authenticate, async (req, res) => {
  const kpi = await prisma.branchDailyKPI.update({
    where: { id: req.params.id },
    data: { status: 'SUBMITTED' }
  });
  res.json(kpi);
});

// Approve KPI
router.post('/kpis/:id/approve', authenticate, requireRoles('regional_manager', 'superadmin'), async (req, res) => {
  const { user } = req as any;
  const kpi = await prisma.branchDailyKPI.update({
    where: { id: req.params.id },
    data: {
      status: 'APPROVED',
      approvedById: user.id,
      approvedAt: new Date()
    }
  });
  res.json(kpi);
});

// Reject KPI
router.post('/kpis/:id/reject', authenticate, requireRoles('regional_manager', 'superadmin'), async (req, res) => {
  const { reason } = req.body;
  const kpi = await prisma.branchDailyKPI.update({
    where: { id: req.params.id },
    data: {
      status: 'DRAFT',
      rejectionReason: reason
    }
  });
  res.json(kpi);
});

// Regional summary
router.get('/summary/regional', authenticate, requireRoles('regional_manager', 'exec', 'superadmin'), async (req, res) => {
  const { region, startDate, endDate } = req.query;

  const where: any = { status: 'APPROVED' };
  if (region) where.region = region;
  if (startDate && endDate) {
    where.reportDate = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string)
    };
  }

  const kpis = await prisma.branchDailyKPI.findMany({ where });

  const summary = {
    totalBranches: new Set(kpis.map(k => k.branch)).size,
    totalLoans: kpis.reduce((sum, k) => sum + k.newLoansCount, 0),
    totalDisbursed: kpis.reduce((sum, k) => sum + Number(k.disbursedAmount), 0),
    totalRecoveries: kpis.reduce((sum, k) => sum + Number(k.recoveriesAmount), 0),
    totalOutstanding: kpis.reduce((sum, k) => sum + Number(k.outstandingPrincipal), 0),
    totalArrears: kpis.reduce((sum, k) => sum + Number(k.arrearsPrincipal), 0),
    avgPAR: kpis.length > 0 ? kpis.reduce((sum, k) => sum + Number(k.parPercentage), 0) / kpis.length : 0
  };

  res.json(summary);
});

// CSV Import
router.post('/import', authenticate, requireRoles('finance', 'superadmin'), async (req, res) => {
  const { user } = req as any;
  const { filename, fileUrl, data } = req.body;

  const job = await prisma.kPIImportJob.create({
    data: {
      filename,
      fileUrl,
      uploadedBy: user.id,
      totalRows: data.length,
      status: 'PROCESSING'
    }
  });

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < data.length; i++) {
    try {
      const row = data[i];
      const parTotal = Number(row.par1_30 || 0) + Number(row.par31_60 || 0) + Number(row.par61_90 || 0) + Number(row.par90Plus || 0);
      const parPercentage = Number(row.outstandingPrincipal) > 0 ? (parTotal / Number(row.outstandingPrincipal)) * 100 : 0;

      await prisma.branchDailyKPI.create({
        data: {
          branch: row.branch,
          region: row.region,
          reportDate: new Date(row.reportDate),
          reportedById: user.id,
          newLoansCount: Number(row.newLoansCount),
          disbursedAmount: Number(row.disbursedAmount),
          recoveriesAmount: Number(row.recoveriesAmount),
          prepaymentsAmount: Number(row.prepaymentsAmount || 0),
          outstandingPrincipal: Number(row.outstandingPrincipal),
          arrearsPrincipal: Number(row.arrearsPrincipal),
          par1_30: Number(row.par1_30 || 0),
          par31_60: Number(row.par31_60 || 0),
          par61_90: Number(row.par61_90 || 0),
          par90Plus: Number(row.par90Plus || 0),
          parTotal,
          parPercentage,
          status: 'APPROVED'
        }
      });
      successCount++;
    } catch (error: any) {
      await prisma.kPIImportError.create({
        data: {
          jobId: job.id,
          rowNumber: i + 1,
          errorType: 'VALIDATION_ERROR',
          field: 'unknown',
          message: error.message,
          data: data[i]
        }
      });
      errorCount++;
    }
  }

  await prisma.kPIImportJob.update({
    where: { id: job.id },
    data: {
      status: errorCount > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED',
      successRows: successCount,
      errorRows: errorCount,
      completedAt: new Date()
    }
  });

  res.json({ job, successCount, errorCount });
});

export default router;
