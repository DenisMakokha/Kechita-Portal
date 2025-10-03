import { Router } from 'express';
import { prisma } from '@kechita/db/src/index.js';
import { authenticate, requireRoles } from '../../middleware/auth.js';
import { sendMail } from '../../utils/email.js';

const router = Router();

// Create announcement
router.post('/announcements', authenticate, requireRoles('hr', 'exec', 'superadmin'), async (req, res) => {
  const { user } = req as any;
  const { title, body, bodyHtml, attachments, target, targetType, priority, channels, publishAt, expiresAt } = req.body;

  const announcement = await prisma.announcement.create({
    data: {
      title,
      body,
      bodyHtml,
      attachments: attachments || [],
      target,
      targetType,
      priority: priority || 'NORMAL',
      channels: channels || ['email', 'portal'],
      publishAt: publishAt ? new Date(publishAt) : new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: user.id
    }
  });

  // Send emails if email channel is enabled
  if (channels?.includes('email')) {
    const users = await prisma.user.findMany({
      where: targetType === 'ALL' ? {} : { role: { in: target.split(',') } },
      select: { email: true, firstName: true }
    });

    for (const targetUser of users) {
      try {
        await sendMail({
          to: targetUser.email,
          subject: `[${priority}] ${title}`,
          html: bodyHtml || `<p>${body}</p>`,
          text: body
        });
      } catch (e) {
        console.error('Failed to send announcement email:', e);
      }
    }
  }

  res.status(201).json(announcement);
});

// Get announcements
router.get('/announcements', authenticate, async (req, res) => {
  const { user } = req as any;
  const { priority, active } = req.query;

  const now = new Date();
  const where: any = {
    publishAt: { lte: now }
  };

  if (priority) where.priority = priority;
  if (active === 'true') {
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gt: now } }
    ];
  }

  // Filter by target
  const announcements = await prisma.announcement.findMany({
    where,
    include: {
      creator: { select: { firstName: true, lastName: true } }
    },
    orderBy: { publishAt: 'desc' }
  });

  // Filter based on user role
  const filtered = announcements.filter(a => {
    if (a.targetType === 'ALL') return true;
    const targets = a.target.split(',');
    return targets.includes(user.role);
  });

  res.json(filtered);
});

// Mark announcement as read
router.post('/announcements/:id/read', authenticate, async (req, res) => {
  const { user } = req as any;
  const { id } = req.params;

  const read = await prisma.announcementRead.upsert({
    where: {
      announcementId_userId: {
        announcementId: id,
        userId: user.id
      }
    },
    create: {
      announcementId: id,
      userId: user.id,
      acknowledged: false
    },
    update: {
      readAt: new Date()
    }
  });

  res.json(read);
});

// Acknowledge announcement
router.post('/announcements/:id/acknowledge', authenticate, async (req, res) => {
  const { user } = req as any;
  const { id } = req.params;

  const read = await prisma.announcementRead.upsert({
    where: {
      announcementId_userId: {
        announcementId: id,
        userId: user.id
      }
    },
    create: {
      announcementId: id,
      userId: user.id,
      acknowledged: true,
      acknowledgedAt: new Date()
    },
    update: {
      acknowledged: true,
      acknowledgedAt: new Date()
    }
  });

  res.json(read);
});

// Send SMS
router.post('/sms/send', authenticate, requireRoles('hr', 'finance', 'superadmin'), async (req, res) => {
  const { to, message, contextType, contextId } = req.body;

  const sms = await prisma.smsMessage.create({
    data: {
      to,
      message,
      provider: 'africas-talking',
      status: 'PENDING',
      contextType,
      contextId
    }
  });

  // TODO: Integrate with actual SMS provider
  // For now, mark as sent
  await prisma.smsMessage.update({
    where: { id: sms.id },
    data: {
      status: 'SENT',
      sentAt: new Date()
    }
  });

  res.status(201).json(sms);
});

// Get SMS history
router.get('/sms/history', authenticate, requireRoles('hr', 'finance', 'superadmin'), async (req, res) => {
  const { status, contextType, startDate, endDate } = req.query;

  const where: any = {};
  if (status) where.status = status;
  if (contextType) where.contextType = contextType;
  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string)
    };
  }

  const messages = await prisma.smsMessage.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  res.json(messages);
});

export default router;
