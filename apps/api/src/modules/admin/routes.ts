import { Router } from 'express';
import { prisma } from '@kechita/db/src/index.js';
import { authenticate, requireRoles } from '../../middleware/auth.js';
import * as bcrypt from 'bcryptjs';

const router = Router();

// Get all users (Admin only)
router.get('/users', authenticate, requireRoles('hr', 'superadmin'), async (_req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      position: true,
      branch: true,
      region: true,
      status: true,
      accountLocked: true,
      createdAt: true,
      lastLoginAt: true
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(users);
});

// Create user (Admin only)
router.post('/users', authenticate, requireRoles('hr', 'superadmin'), async (req, res) => {
  const { email, password, firstName, lastName, role, position, branch, region } = req.body;

  if (!email || !password || !firstName || !lastName || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(400).json({ error: 'Email already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      position,
      branch,
      region,
      status: 'ACTIVE'
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      position: true,
      branch: true,
      status: true,
      createdAt: true
    }
  });

  res.status(201).json(user);
});

// Update user (Admin only)
router.put('/users/:id', authenticate, requireRoles('hr', 'superadmin'), async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, role, position, branch, region, status } = req.body;

  const user = await prisma.user.update({
    where: { id },
    data: {
      firstName,
      lastName,
      role,
      position,
      branch,
      region,
      status
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      position: true,
      branch: true,
      status: true
    }
  });

  res.json(user);
});

// Lock user account
router.post('/users/:id/lock', authenticate, requireRoles('hr', 'superadmin'), async (req, res) => {
  const { id } = req.params;
  const { user } = req as any;
  const { reason } = req.body;

  const updated = await prisma.user.update({
    where: { id },
    data: {
      accountLocked: true,
      lockReason: reason || 'Locked by administrator',
      lockedAt: new Date(),
      lockedBy: user.id,
      status: 'LOCKED'
    }
  });

  res.json({ success: true, user: updated });
});

// Unlock user account
router.post('/users/:id/unlock', authenticate, requireRoles('hr', 'superadmin'), async (req, res) => {
  const { id } = req.params;

  const updated = await prisma.user.update({
    where: { id },
    data: {
      accountLocked: false,
      lockReason: null,
      lockedAt: null,
      lockedBy: null,
      status: 'ACTIVE',
      failedLoginAttempts: 0
    }
  });

  res.json({ success: true, user: updated });
});

// Reset user password
router.post('/users/:id/reset-password', authenticate, requireRoles('hr', 'superadmin'), async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ error: 'New password is required' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id },
    data: {
      password: hashedPassword,
      mustChangePassword: true,
      passwordChangedAt: new Date()
    }
  });

  res.json({ success: true });
});

// Get user audit log
router.get('/users/:id/audit', authenticate, requireRoles('hr', 'superadmin'), async (req, res) => {
  const { id } = req.params;

  const logs = await prisma.auditLog.findMany({
    where: { userId: id },
    orderBy: { timestamp: 'desc' },
    take: 100
  });

  res.json(logs);
});

// Delete user (soft delete)
router.delete('/users/:id', authenticate, requireRoles('superadmin'), async (req, res) => {
  const { id } = req.params;

  await prisma.user.update({
    where: { id },
    data: {
      status: 'DELETED',
      accountLocked: true
    }
  });

  res.json({ success: true });
});

export default router;
