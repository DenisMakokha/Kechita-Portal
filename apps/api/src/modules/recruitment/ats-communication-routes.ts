import { Router } from 'express';
import { PrismaClient } from '@kechita/db';

const router = Router();
const prisma = new PrismaClient();

// ==================== EMAIL TEMPLATES ====================

// Get all email templates
router.get('/email-templates', async (req, res) => {
  try {
    const { category, jobId, active } = req.query;
    
    const where: any = {};
    if (category) where.category = category;
    if (jobId) where.jobId = jobId;
    if (active !== undefined) where.active = active === 'true';
    
    const templates = await prisma.emailTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(templates);
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get single template
router.get('/email-templates/:id', async (req, res) => {
  try {
    const template = await prisma.emailTemplate.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { emails: true } }
      }
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Failed to fetch template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Create email template
router.post('/email-templates', async (req, res) => {
  try {
    const {
      name, code, category, subject, bodyHtml, bodyText,
      variables, isDefault, jobId, createdBy
    } = req.body;
    
    // If setting as default, unset other defaults in category
    if (isDefault) {
      await prisma.emailTemplate.updateMany({
        where: { category, isDefault: true },
        data: { isDefault: false }
      });
    }
    
    const template = await prisma.emailTemplate.create({
      data: {
        name,
        code,
        category,
        subject,
        bodyHtml,
        bodyText,
        variables: variables || {},
        isDefault: isDefault || false,
        jobId,
        createdBy,
        active: true
      }
    });
    
    res.status(201).json(template);
  } catch (error) {
    console.error('Failed to create template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update template
router.patch('/email-templates/:id', async (req, res) => {
  try {
    const {
      name, subject, bodyHtml, bodyText, variables, isDefault, active
    } = req.body;
    
    const existing = await prisma.emailTemplate.findUnique({
      where: { id: req.params.id }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    if (isDefault) {
      await prisma.emailTemplate.updateMany({
        where: { 
          category: existing.category, 
          isDefault: true,
          NOT: { id: req.params.id }
        },
        data: { isDefault: false }
      });
    }
    
    const template = await prisma.emailTemplate.update({
      where: { id: req.params.id },
      data: { name, subject, bodyHtml, bodyText, variables, isDefault, active }
    });
    
    res.json(template);
  } catch (error) {
    console.error('Failed to update template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete template
router.delete('/email-templates/:id', async (req, res) => {
  try {
    const template = await prisma.emailTemplate.findUnique({
      where: { id: req.params.id }
    });
    
    if (template?.isSystem) {
      return res.status(400).json({ error: 'Cannot delete system template' });
    }
    
    await prisma.emailTemplate.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Failed to delete template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// ==================== SEND EMAILS ====================

// Send email to candidate
router.post('/send-email', async (req, res) => {
  try {
    const {
      applicationId, templateId, to, cc, bcc, subject,
      bodyHtml, bodyText, attachments, sentBy
    } = req.body;
    
    // Create email record
    const email = await prisma.candidateEmail.create({
      data: {
        applicationId,
        templateId,
        to,
        cc: cc || [],
        bcc: bcc || [],
        subject,
        bodyHtml,
        bodyText,
        attachments,
        status: 'PENDING',
        sentBy
      }
    });
    
    // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
    // For now, mark as sent
    await prisma.candidateEmail.update({
      where: { id: email.id },
      data: {
        status: 'SENT',
        sentAt: new Date()
      }
    });
    
    // Update template usage count
    if (templateId) {
      await prisma.emailTemplate.update({
        where: { id: templateId },
        data: { usageCount: { increment: 1 } }
      });
    }
    
    // Log activity
    await prisma.candidateActivity.create({
      data: {
        applicationId,
        activityType: 'email_sent',
        userId: sentBy,
        title: 'Email sent',
        description: `Email sent: ${subject}`,
        metadata: { emailId: email.id, to, subject }
      }
    });
    
    // Update last activity
    await prisma.application.update({
      where: { id: applicationId },
      data: { lastActivityAt: new Date() }
    });
    
    res.status(201).json(email);
  } catch (error) {
    console.error('Failed to send email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Get candidate emails
router.get('/applications/:id/emails', async (req, res) => {
  try {
    const emails = await prisma.candidateEmail.findMany({
      where: { applicationId: req.params.id },
      include: { template: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(emails);
  } catch (error) {
    console.error('Failed to fetch emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

// ==================== INTERVIEW SCORECARDS ====================

// Get scorecard templates
router.get('/scorecard-templates', async (req, res) => {
  try {
    const { jobId, position } = req.query;
    
    const where: any = { active: true };
    if (jobId) where.jobId = jobId;
    if (position) where.position = position;
    
    const templates = await prisma.scorecardTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(templates);
  } catch (error) {
    console.error('Failed to fetch scorecard templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Create scorecard template
router.post('/scorecard-templates', async (req, res) => {
  try {
    const {
      name, description, criteria, isDefault, jobId, position, createdBy
    } = req.body;
    
    if (isDefault && jobId) {
      await prisma.scorecardTemplate.updateMany({
        where: { jobId, isDefault: true },
        data: { isDefault: false }
      });
    }
    
    const template = await prisma.scorecardTemplate.create({
      data: {
        name,
        description,
        criteria,
        isDefault: isDefault || false,
        jobId,
        position,
        createdBy,
        active: true
      }
    });
    
    res.status(201).json(template);
  } catch (error) {
    console.error('Failed to create template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Submit interview scorecard
router.post('/scorecards', async (req, res) => {
  try {
    const {
      templateId, applicationId, interviewId, evaluatorId,
      evaluatorName, evaluatorRole, overallRating, recommendHire,
      strengths, weaknesses, comments, scores
    } = req.body;
    
    const scorecard = await prisma.interviewScorecard.create({
      data: {
        templateId,
        applicationId,
        interviewId,
        evaluatorId,
        evaluatorName,
        evaluatorRole,
        overallRating,
        recommendHire,
        strengths,
        weaknesses,
        comments,
        scores
      }
    });
    
    // Log activity
    await prisma.candidateActivity.create({
      data: {
        applicationId,
        activityType: 'scorecard_submitted',
        userId: evaluatorId,
        title: 'Interview scorecard submitted',
        description: `${evaluatorName} submitted scorecard with rating ${overallRating}/5`,
        metadata: { scorecardId: scorecard.id, rating: overallRating }
      }
    });
    
    // Update last activity
    await prisma.application.update({
      where: { id: applicationId },
      data: { lastActivityAt: new Date() }
    });
    
    res.status(201).json(scorecard);
  } catch (error) {
    console.error('Failed to submit scorecard:', error);
    res.status(500).json({ error: 'Failed to submit scorecard' });
  }
});

// Get scorecards for application
router.get('/applications/:id/scorecards', async (req, res) => {
  try {
    const scorecards = await prisma.interviewScorecard.findMany({
      where: { applicationId: req.params.id },
      include: { template: true },
      orderBy: { submittedAt: 'desc' }
    });
    res.json(scorecards);
  } catch (error) {
    console.error('Failed to fetch scorecards:', error);
    res.status(500).json({ error: 'Failed to fetch scorecards' });
  }
});

// Get scorecard analytics
router.get('/applications/:id/scorecard-summary', async (req, res) => {
  try {
    const scorecards = await prisma.interviewScorecard.findMany({
      where: { applicationId: req.params.id }
    });
    
    if (scorecards.length === 0) {
      return res.json({
        count: 0,
        averageRating: null,
        recommendHireCount: 0,
        recommendHirePercentage: 0
      });
    }
    
    const averageRating = scorecards.reduce((sum, s) => sum + s.overallRating, 0) / scorecards.length;
    const recommendHireCount = scorecards.filter(s => s.recommendHire).length;
    
    res.json({
      count: scorecards.length,
      averageRating: Math.round(averageRating * 10) / 10,
      recommendHireCount,
      recommendHirePercentage: Math.round((recommendHireCount / scorecards.length) * 100)
    });
  } catch (error) {
    console.error('Failed to fetch scorecard summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// ==================== COMMUNICATION LOG ====================

// Log communication
router.post('/communication-log', async (req, res) => {
  try {
    const {
      applicationId, type, direction, subject, body, attachments,
      participants, duration, outcome, followUpDate, contactedBy
    } = req.body;
    
    const log = await prisma.communicationLog.create({
      data: {
        applicationId,
        type,
        direction,
        subject,
        body,
        attachments,
        participants: participants || [],
        duration,
        outcome,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        contactedBy
      }
    });
    
    // Log activity
    await prisma.candidateActivity.create({
      data: {
        applicationId,
        activityType: `${type}_${direction}`,
        userId: contactedBy,
        title: `${type.toUpperCase()} ${direction}`,
        description: subject || body?.substring(0, 100),
        metadata: { logId: log.id, type, direction }
      }
    });
    
    // Update last activity
    await prisma.application.update({
      where: { id: applicationId },
      data: { lastActivityAt: new Date() }
    });
    
    res.status(201).json(log);
  } catch (error) {
    console.error('Failed to log communication:', error);
    res.status(500).json({ error: 'Failed to log communication' });
  }
});

// Get communication history
router.get('/applications/:id/communications', async (req, res) => {
  try {
    const { type } = req.query;
    
    const where: any = { applicationId: req.params.id };
    if (type) where.type = type;
    
    const logs = await prisma.communicationLog.findMany({
      where,
      orderBy: { contactedAt: 'desc' }
    });
    
    res.json(logs);
  } catch (error) {
    console.error('Failed to fetch communications:', error);
    res.status(500).json({ error: 'Failed to fetch communications' });
  }
});

// ==================== BULK EMAIL CAMPAIGNS ====================

// Create bulk email campaign
router.post('/bulk-campaigns', async (req, res) => {
  try {
    const {
      name, templateId, jobId, filters, scheduledAt, createdBy
    } = req.body;
    
    // Calculate recipient count based on filters
    const recipients = await prisma.application.count({
      where: filters
    });
    
    const campaign = await prisma.bulkEmailCampaign.create({
      data: {
        name,
        templateId,
        jobId,
        filters,
        recipients,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        createdBy
      }
    });
    
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Failed to create campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Get campaigns
router.get('/bulk-campaigns', async (req, res) => {
  try {
    const { status, jobId } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    if (jobId) where.jobId = jobId;
    
    const campaigns = await prisma.bulkEmailCampaign.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(campaigns);
  } catch (error) {
    console.error('Failed to fetch campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Start bulk campaign
router.post('/bulk-campaigns/:id/start', async (req, res) => {
  try {
    const campaign = await prisma.bulkEmailCampaign.findUnique({
      where: { id: req.params.id }
    });
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
      return res.status(400).json({ error: 'Campaign already started' });
    }
    
    // Update status to sending
    await prisma.bulkEmailCampaign.update({
      where: { id: req.params.id },
      data: {
        status: 'SENDING',
        startedAt: new Date()
      }
    });
    
    // TODO: Implement actual bulk email sending logic
    // For now, just mark as completed
    await prisma.bulkEmailCampaign.update({
      where: { id: req.params.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        sent: campaign.recipients
      }
    });
    
    res.json({ message: 'Campaign started successfully' });
  } catch (error) {
    console.error('Failed to start campaign:', error);
    res.status(500).json({ error: 'Failed to start campaign' });
  }
});

export default router;
