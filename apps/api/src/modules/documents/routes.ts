import { Router } from 'express';
import { prisma } from '@kechita/db/src/index.js';
import { authenticate, requireRoles } from '../../middleware/auth.js';

const router = Router();

// Upload staff document
router.post('/staff-documents', authenticate, async (req, res) => {
  const { user } = req as any;
  const { userId, type, name, fileUrl, fileSize, mimeType, expiryDate } = req.body;

  // Users can only upload their own documents unless HR/Admin
  if (userId !== user.id && !['hr', 'superadmin'].includes(user.role)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const doc = await prisma.staffDocument.create({
    data: {
      userId: userId || user.id,
      type,
      name,
      fileUrl,
      fileSize: Number(fileSize),
      mimeType,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      uploadedById: user.id,
      version: 1
    }
  });

  res.status(201).json(doc);
});

// Get staff documents
router.get('/staff-documents', authenticate, async (req, res) => {
  const { user } = req as any;
  const { userId, type } = req.query;

  const where: any = {};
  if (userId) {
    // Check permissions
    if (userId !== user.id && !['hr', 'superadmin'].includes(user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    where.userId = userId;
  } else {
    where.userId = user.id;
  }

  if (type) where.type = type;

  const documents = await prisma.staffDocument.findMany({
    where,
    include: {
      user: { select: { firstName: true, lastName: true } }
    },
    orderBy: { uploadedAt: 'desc' }
  });

  res.json(documents);
});

// Create policy document
router.post('/policies', authenticate, requireRoles('hr', 'superadmin'), async (req, res) => {
  const { user } = req as any;
  const { category, title, description, version, fileUrl, fileSize, mandatory, expiresAt } = req.body;

  const policy = await prisma.policyDocument.create({
    data: {
      category,
      title,
      description,
      version,
      fileUrl,
      fileSize: Number(fileSize),
      mandatory: Boolean(mandatory),
      publishedBy: user.id,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      active: true
    }
  });

  res.status(201).json(policy);
});

// Get policies
router.get('/policies', authenticate, async (req, res) => {
  const { category, active } = req.query;

  const where: any = {};
  if (category) where.category = category;
  if (active !== undefined) where.active = active === 'true';

  const policies = await prisma.policyDocument.findMany({
    where,
    orderBy: { publishedAt: 'desc' }
  });

  res.json(policies);
});

// Acknowledge policy
router.post('/policies/:id/acknowledge', authenticate, async (req, res) => {
  const { user } = req as any;
  const { id } = req.params;

  const ack = await prisma.policyAcknowledgment.upsert({
    where: {
      policyId_userId: {
        policyId: id,
        userId: user.id
      }
    },
    create: {
      policyId: id,
      userId: user.id,
      acknowledgedAt: new Date()
    },
    update: {
      acknowledgedAt: new Date()
    }
  });

  res.json(ack);
});

// Get policy acknowledgments
router.get('/policies/:id/acknowledgments', authenticate, requireRoles('hr', 'superadmin'), async (req, res) => {
  const { id } = req.params;

  const acks = await prisma.policyAcknowledgment.findMany({
    where: { policyId: id },
    include: {
      user: { select: { firstName: true, lastName: true, position: true, branch: true } }
    },
    orderBy: { acknowledgedAt: 'desc' }
  });

  res.json(acks);
});

export default router;
