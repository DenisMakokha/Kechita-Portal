import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import Imap from 'imap';
import axios from 'axios';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// ====================
// CPANEL INTEGRATION
// ====================

interface CpanelConfig {
  host: string;
  port: number;
  username: string;
  password: string; // API token
}

const CPANEL_CONFIG: CpanelConfig = {
  host: process.env.CPANEL_HOST || 'your-server.com',
  port: parseInt(process.env.CPANEL_PORT || '2083'),
  username: process.env.CPANEL_USERNAME || 'root',
  password: process.env.CPANEL_API_TOKEN || ''
};

// Create mailbox via cPanel API
router.post('/mailbox/create', async (req, res) => {
  try {
    const { userId, emailAddress, password, quota = 1024 } = req.body;

    // cPanel UAPI call to create email account
    const cpanelUrl = `https://${CPANEL_CONFIG.host}:${CPANEL_CONFIG.port}/execute/Email/add_pop`;
    
    const response = await axios.post(cpanelUrl, {
      email: emailAddress.split('@')[0], // local part
      password: password,
      quota: quota,
      domain: emailAddress.split('@')[1]
    }, {
      auth: {
        username: CPANEL_CONFIG.username,
        password: CPANEL_CONFIG.password
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // Log the creation
    await prisma.cpanelMailboxLog.create({
      data: {
        action: 'create',
        emailAddress,
        userId,
        cpanelResponse: response.data,
        status: response.data.status === 1 ? 'SUCCESS' : 'FAILED',
        errorMessage: response.data.errors ? JSON.stringify(response.data.errors) : null,
        performedBy: req.user?.id || 'system'
      }
    });

    if (response.data.status === 1) {
      // Create mailbox record in database
      const mailbox = await prisma.companyMailbox.create({
        data: {
          userId,
          emailAddress,
          password: encryptPassword(password),
          displayName: `${req.body.firstName} ${req.body.lastName}`,
          quota,
          cpanelAccount: CPANEL_CONFIG.username,
          createdVia: 'api'
        }
      });

      // Create default folders
      const folderTypes = ['inbox', 'sent', 'drafts', 'spam', 'trash'];
      for (const type of folderTypes) {
        await prisma.emailFolder.create({
          data: {
            mailboxId: mailbox.id,
            name: type.charAt(0).toUpperCase() + type.slice(1),
            type,
            isSystem: true
          }
        });
      }

      res.json({ success: true, mailbox, cpanelResponse: response.data });
    } else {
      res.status(400).json({ success: false, error: response.data.errors });
    }
  } catch (error: any) {
    console.error('Failed to create mailbox:', error);
    res.status(500).json({ error: error.message });
  }
});

// Suspend mailbox
router.post('/mailbox/:mailboxId/suspend', async (req, res) => {
  try {
    const { mailboxId } = req.params;
    const { reason } = req.body;

    const mailbox = await prisma.companyMailbox.findUnique({
      where: { id: mailboxId }
    });

    if (!mailbox) {
      return res.status(404).json({ error: 'Mailbox not found' });
    }

    // cPanel API call to suspend
    const cpanelUrl = `https://${CPANEL_CONFIG.host}:${CPANEL_CONFIG.port}/execute/Email/suspend_login`;
    
    const response = await axios.post(cpanelUrl, {
      email: mailbox.emailAddress
    }, {
      auth: {
        username: CPANEL_CONFIG.username,
        password: CPANEL_CONFIG.password
      }
    });

    await prisma.cpanelMailboxLog.create({
      data: {
        action: 'suspend',
        emailAddress: mailbox.emailAddress,
        userId: mailbox.userId,
        cpanelResponse: response.data,
        status: response.data.status === 1 ? 'SUCCESS' : 'FAILED',
        performedBy: req.user?.id || 'system'
      }
    });

    // Update mailbox status
    await prisma.companyMailbox.update({
      where: { id: mailboxId },
      data: {
        isActive: false,
        suspendedAt: new Date(),
        suspendedBy: req.user?.id,
        suspensionReason: reason
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ====================
// IMAP INTEGRATION
// ====================

interface ImapConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
}

function getImapConfig(email: string, password: string): ImapConfig {
  return {
    user: email,
    password: decryptPassword(password),
    host: process.env.IMAP_HOST || 'mail.kechita.co.ke',
    port: parseInt(process.env.IMAP_PORT || '993'),
    tls: true
  };
}

// Sync emails from IMAP server
router.post('/sync/:mailboxId', async (req, res) => {
  try {
    const { mailboxId } = req.params;
    const { folderName = 'INBOX' } = req.body;

    const mailbox = await prisma.companyMailbox.findUnique({
      where: { id: mailboxId }
    });

    if (!mailbox) {
      return res.status(404).json({ error: 'Mailbox not found' });
    }

    const syncLog = await prisma.emailSyncLog.create({
      data: {
        mailboxId,
        syncType: 'manual',
        status: 'SUCCESS'
      }
    });

    const imapConfig = getImapConfig(mailbox.emailAddress, mailbox.password);
    const imap = new Imap(imapConfig);

    imap.once('ready', () => {
      imap.openBox(folderName, false, async (err: any, box: any) => {
        if (err) throw err;

        const searchCriteria = ['UNSEEN']; // Get unread emails
        const fetchOptions = {
          bodies: ['HEADER', 'TEXT'],
          struct: true
        };

        imap.search(searchCriteria, (err: any, results: any) => {
          if (err) throw err;

          const fetch = imap.fetch(results, fetchOptions);
          let messagesRead = 0;
          let messagesSynced = 0;

          fetch.on('message', (msg: any, seqno: number) => {
            let emailData: any = {};

            msg.on('body', (stream: any, info: any) => {
              let buffer = '';
              stream.on('data', (chunk: any) => {
                buffer += chunk.toString('utf8');
              });
              stream.once('end', () => {
                if (info.which === 'HEADER') {
                  emailData.headers = Imap.parseHeader(buffer);
                } else {
                  emailData.body = buffer;
                }
              });
            });

            msg.once('end', async () => {
              messagesRead++;
              try {
                // Save email to database
                const folder = await prisma.emailFolder.findFirst({
                  where: { mailboxId, type: 'inbox' }
                });

                await prisma.emailMessage.create({
                  data: {
                    mailboxId,
                    messageId: emailData.headers['message-id']?.[0] || `${Date.now()}-${seqno}`,
                    folderId: folder?.id,
                    fromAddress: emailData.headers.from?.[0] || '',
                    fromName: extractName(emailData.headers.from?.[0] || ''),
                    toAddresses: emailData.headers.to || [],
                    ccAddresses: emailData.headers.cc || [],
                    bccAddresses: [],
                    subject: emailData.headers.subject?.[0] || '(No subject)',
                    bodyHtml: emailData.body,
                    bodyText: stripHtml(emailData.body),
                    receivedAt: new Date(emailData.headers.date?.[0] || Date.now()),
                    isRead: false
                  }
                });
                messagesSynced++;
              } catch (error) {
                console.error('Failed to save email:', error);
              }
            });
          });

          fetch.once('end', async () => {
            await prisma.emailSyncLog.update({
              where: { id: syncLog.id },
              data: {
                messagesRead,
                messagesSynced,
                completedAt: new Date()
              }
            });
            imap.end();
          });
        });
      });
    });

    imap.once('error', async (err: any) => {
      await prisma.emailSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          errorDetails: { error: err.message },
          completedAt: new Date()
        }
      });
      res.status(500).json({ error: err.message });
    });

    imap.connect();

    res.json({ success: true, syncLogId: syncLog.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ====================
// SMTP INTEGRATION
// ====================

function getSmtpConfig(): any {
  return {
    host: process.env.SMTP_HOST || 'mail.kechita.co.ke',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    }
  };
}

// Send email via SMTP
router.post('/send', async (req, res) => {
  try {
    const { to, cc, bcc, subject, body, mailboxId } = req.body;

    const mailbox = await prisma.companyMailbox.findUnique({
      where: { id: mailboxId || req.user?.mailboxId }
    });

    if (!mailbox) {
      return res.status(404).json({ error: 'Mailbox not found' });
    }

    const transporter = nodemailer.createTransport({
      ...getSmtpConfig(),
      auth: {
        user: mailbox.emailAddress,
        pass: decryptPassword(mailbox.password)
      }
    });

    const mailOptions = {
      from: `"${mailbox.displayName}" <${mailbox.emailAddress}>`,
      to,
      cc,
      bcc,
      subject,
      html: body
    };

    const info = await transporter.sendMail(mailOptions);

    // Save sent email to database
    const sentFolder = await prisma.emailFolder.findFirst({
      where: { mailboxId: mailbox.id, type: 'sent' }
    });

    await prisma.emailMessage.create({
      data: {
        mailboxId: mailbox.id,
        messageId: info.messageId,
        folderId: sentFolder?.id,
        fromAddress: mailbox.emailAddress,
        fromName: mailbox.displayName,
        toAddresses: Array.isArray(to) ? to : [to],
        ccAddresses: Array.isArray(cc) ? cc : cc ? [cc] : [],
        bccAddresses: Array.isArray(bcc) ? bcc : bcc ? [bcc] : [],
        subject,
        bodyHtml: body,
        bodyText: stripHtml(body),
        isSent: true,
        sentAt: new Date()
      }
    });

    res.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('Failed to send email:', error);
    res.status(500).json({ error: error.message });
  }
});

// ====================
// EMAIL CRUD OPERATIONS
// ====================

// Get folders
router.get('/folders', async (req, res) => {
  try {
    const mailboxId = req.query.mailboxId as string || req.user?.mailboxId;
    
    const folders = await prisma.emailFolder.findMany({
      where: { mailboxId },
      orderBy: [{ isSystem: 'desc' }, { order: 'asc' }]
    });

    res.json(folders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages
router.get('/messages', async (req, res) => {
  try {
    const { folder = 'inbox', mailboxId } = req.query;
    
    const folderRecord = await prisma.emailFolder.findFirst({
      where: {
        mailboxId: (mailboxId as string) || req.user?.mailboxId,
        type: folder as string
      }
    });

    if (!folderRecord) {
      return res.json([]);
    }

    const messages = await prisma.emailMessage.findMany({
      where: {
        folderId: folderRecord.id,
        isDeleted: false
      },
      orderBy: { receivedAt: 'desc' },
      take: 50
    });

    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single message
router.get('/messages/:messageId', async (req, res) => {
  try {
    const message = await prisma.emailMessage.findUnique({
      where: { id: req.params.messageId },
      include: {
        folder: true,
        tags: true
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Mark as read
    if (!message.isRead) {
      await prisma.emailMessage.update({
        where: { id: req.params.messageId },
        data: { isRead: true, readAt: new Date() }
      });
    }

    res.json(message);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update message (mark read/starred, move folder)
router.patch('/messages/:messageId', async (req, res) => {
  try {
    const { isRead, isStarred, folderId } = req.body;
    
    const updateData: any = {};
    if (typeof isRead !== 'undefined') {
      updateData.isRead = isRead;
      if (isRead) updateData.readAt = new Date();
    }
    if (typeof isStarred !== 'undefined') updateData.isStarred = isStarred;
    if (folderId) updateData.folderId = folderId;

    const message = await prisma.emailMessage.update({
      where: { id: req.params.messageId },
      data: updateData
    });

    res.json(message);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete message (move to trash)
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const message = await prisma.emailMessage.update({
      where: { id: req.params.messageId },
      data: { isDeleted: true }
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ====================
// UTILITY FUNCTIONS
// ====================

function encryptPassword(password: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptPassword(encryptedPassword: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
  const parts = encryptedPassword.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function extractName(emailString: string): string {
  const match = emailString.match(/^"?([^"<]+)"?\s*<?/);
  return match ? match[1].trim() : emailString.split('@')[0];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

export default router;
