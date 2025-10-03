import { Router } from 'express';
import { prisma } from '@kechita/db/src/index.js';
import { sendMail } from '../../utils/email.js';
import { JobPostingSchema, ApplicationSchema } from '@kechita/common';
import { scoreApplication } from './scoring.js';
import { PDFDocument, StandardFonts } from 'pdf-lib';

const router = Router();
import { authenticate, requireRoles } from '../../middleware/auth.js';

router.get('/jobs', async (_req, res) => {
  const jobs = await prisma.jobPosting.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(jobs);
});

router.post('/jobs', authenticate, requireRoles('hr','manager','superadmin'), async (req, res) => {
  const parsed = JobPostingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const job = await prisma.jobPosting.create({ data: {
    title: parsed.data.title,
    description: parsed.data.description,
    branch: parsed.data.branch,
    region: parsed.data.region,
    employmentType: parsed.data.employmentType,
    deadline: new Date(parsed.data.deadline),
  }});
  res.status(201).json(job);
});

router.post('/applications', async (req, res) => {
  const parsed = ApplicationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const app = await prisma.application.create({ data: parsed.data as any });
  res.status(201).json(app);
});

router.get('/applications/:jobId', authenticate, requireRoles('hr','manager','superadmin'), async (req, res) => {
  const list = await prisma.application.findMany({ where: { jobId: req.params.jobId }, orderBy: { createdAt: 'desc' } });
  res.json(list);
});

export default router;


// ---- Interviews ----
router.post('/interviews', authenticate, requireRoles('hr','manager','superadmin'), async (req, res) => {
  const { applicationId, panel, mode, location, startsAt, endsAt, notes } = req.body;
  if(!applicationId || !startsAt || !endsAt) return res.status(400).json({error:'Missing fields'});
  const rec = await prisma.interview.create({ data: { applicationId, panel: panel || '', mode: mode || 'ONLINE', location, startsAt: new Date(startsAt), endsAt: new Date(endsAt), notes } });
  res.status(201).json(rec);
});

router.get('/interviews/:applicationId', authenticate, requireRoles('hr','manager','superadmin'), async (req, res) => {
  const list = await prisma.interview.findMany({ where: { applicationId: req.params.applicationId }, orderBy: { startsAt: 'asc' } });
  res.json(list);
});

// ---- Offers & e-Contracts ----
router.post('/offers', authenticate, requireRoles('hr','manager','superadmin'), async (req, res) => {
  const { applicationId, title, salary, currency } = req.body;
  if(!applicationId || !title || !salary) return res.status(400).json({error:'Missing fields'});
  const off = await prisma.offer.create({ data: { applicationId, title, salary: Number(salary), currency: currency || 'KES' } });
  res.status(201).json(off);
});

router.post('/offers/:id/send', authenticate, requireRoles('hr','manager','superadmin'), async (req, res) => {
  const id = req.params.id;
  const off = await prisma.offer.update({ where: { id }, data: { status:'SENT', issuedAt: new Date() } });
  res.json(off);
});

router.post('/offers/:id/accept', authenticate, requireRoles('hr','manager','superadmin'), async (req, res) => {
  const id = req.params.id;
  const off = await prisma.offer.update({ where: { id }, data: { status:'ACCEPTED', respondedAt: new Date() } });
  // TODO: trigger onboarding generation for this application
  res.json(off);
});

router.post('/offers/:id/decline', authenticate, requireRoles('hr','manager','superadmin'), async (req, res) => {
  const id = req.params.id;
  const off = await prisma.offer.update({ where: { id }, data: { status:'DECLINED', respondedAt: new Date() } });
  res.json(off);
});

// Simple contract generation from a stored template (string replacement)
router.post('/contracts/generate', authenticate, requireRoles('hr','manager','superadmin'), async (req, res) => {
  const { templateId, applicationId } = req.body;
  if(!templateId || !applicationId) return res.status(400).json({error:'Missing fields'});
  const tpl = await prisma.contractTemplate.findUnique({ where: { id: templateId } });
  const app = await prisma.application.findUnique({ where: { id: applicationId }, include: { job: true } });
  if(!tpl || !app) return res.status(404).json({error:'Not found'});
  let body = tpl.body;
  const replacements: Record<string,string> = {
    firstName: app.firstName,
    lastName: app.lastName,
    jobTitle: app.job.title,
    branch: app.job.branch,
    region: app.job.region,
    applicantEmail: app.email
  };
  body = body.replace(/\{\{(\w+)\}\}/g, (_, k) => replacements[k] || '');
  res.json({ contractText: body });
});

// ---- Onboarding ----
// seed default tasks if empty
router.post('/onboarding/seed-tasks', authenticate, requireRoles('hr','manager','superadmin'), async (_req, res) => {
  const count = await prisma.onboardingTask.count();
  if(count === 0){
    await prisma.onboardingTask.createMany({ data: [
      { code:'acct_creation', label:'Create staff account' },
      { code:'role_assignment', label:'Assign role & branch' },
      { code:'docs_submission', label:'Submit required documents' },
      { code:'policy_ack', label:'Acknowledge company policies' },
      { code:'probation_setup', label:'Set probation objectives' }
    ]});
  }
  res.json({ ok: true });
});

// attach onboarding checklist to an accepted application
router.post('/onboarding/init', authenticate, requireRoles('hr','manager','superadmin'), async (req, res) => {
  const { applicationId } = req.body;
  if(!applicationId) return res.status(400).json({error:'applicationId required'});
  const tasks = await prisma.onboardingTask.findMany();
  const items = await Promise.all(tasks.map(t => prisma.onboardingItem.create({
    data: { applicationId, taskId: t.id }
  })));
  res.json(items);
});

router.get('/onboarding/:applicationId', authenticate, requireRoles('hr','manager','superadmin'), async (req, res) => {
  const list = await prisma.onboardingItem.findMany({ where: { applicationId: req.params.applicationId }, include: { task: true } });
  res.json(list);
});

router.post('/onboarding/:itemId/complete', authenticate, requireRoles('hr','manager','superadmin'), async (req, res) => {
  const { evidenceUrl } = req.body;
  const rec = await prisma.onboardingItem.update({ where: { id: req.params.itemId }, data: { completed: true, completedAt: new Date(), evidenceUrl } });
  res.json(rec);
});


// ---- Offer PDF generation ----
router.get('/offers/:id/pdf', authenticate, requireRoles('hr','manager','superadmin'), async (req, res) => {
  const id = req.params.id;
  const off = await prisma.offer.findUnique({ where: { id }, include: { application: { include: { job: true } } } });
  if(!off) return res.status(404).json({ error: 'Offer not found' });
  // If no contractText, create a minimal one
  const contractText = off.contractText || `Offer Letter\n\nDear ${off.application.firstName} ${off.application.lastName},\nWe are pleased to offer you the role of ${off.title} at branch ${off.application.job.branch}, region ${off.application.job.region}.\nGross Salary: ${off.salary} ${off.currency}.`;

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { width } = page.getSize();
  const margin = 50;
  let y = 800;

  const drawText = (text: string, bold=false, size=12) => {
    const f = bold ? fontBold : font;
    const lines = text.split('\n');
    for (const line of lines){
      const wrapped = wrap(line, 90);
      for (const ln of wrapped){
        page.drawText(ln, { x: margin, y, size, font: f });
        y -= size + 6;
      }
    }
  };

  function wrap(s: string, n: number){
    const words = s.split(' ');
    const lines: string[] = [];
    let cur = '';
    for(const w of words){
      if((cur + ' ' + w).trim().length > n){ lines.push(cur.trim()); cur = w; } else { cur += ' ' + w; }
    }
    if(cur.trim()) lines.push(cur.trim());
    return lines;
  }

  // Header with logo + company name
  try {
    const fs = await import('fs');
    let logo;
    try { logo = fs.readFileSync(new URL('../../assets/KechitaLogo.png', import.meta.url)); } catch {}
    if(!logo){ try { logo = fs.readFileSync(new URL('../../assets/logo.png', import.meta.url)); } catch {} }
    const pngLogo = await pdf.embedPng(logo);
    const scale = 0.3;
    const dims = pngLogo.scale(scale);
    page.drawImage(pngLogo, { x: margin, y: y - dims.height, width: dims.width, height: dims.height });
    page.drawText('KECHITA CAPITAL', { x: margin + dims.width + 12, y: y - 14, size: 18, font: fontBold });
    y -= dims.height + 10;
  } catch (e) {
    page.drawText('KECHITA CAPITAL', { x: margin, y: y - 14, size: 18, font: fontBold });
    y -= 30;
  }
  drawText(new Date().toDateString(), false, 10);
  y -= 10;
  drawText(contractText, false, 12);

  // Footer line
  page.drawLine({ start: { x: margin, y: 60 }, end: { x: width - margin, y: 60 }, thickness: 1, color: rgb(0.85,0.85,0.85) });
  page.drawText('Kechita Capital • Confidential Offer', { x: margin, y: 45, size: 10, font });

  if(off.signatureDataUrl){
    try {
      const b64 = off.signatureDataUrl.split(',')[1];
      const bytes = Buffer.from(b64, 'base64');
      const png = await pdf.embedPng(bytes);
      const dims = png.scale(0.5);
      page.drawText('\n\nSignature:', { x: margin, y: y - 40, size: 12, font });
      page.drawImage(png, { x: margin + 80, y: y - 80, width: dims.width, height: dims.height });
    } catch (e) {}
  }

  const bytes = await pdf.save();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=offer-${id}.pdf`);
  res.send(Buffer.from(bytes));
});

// Save or update contract text
router.post('/offers/:id/contract-text', authenticate, requireRoles('hr','manager','superadmin'), async (req, res) => {
  const { contractText } = req.body;
  const id = req.params.id;
  const off = await prisma.offer.update({ where: { id }, data: { contractText } });
  res.json(off);
});

// Simple e-signature upload (data URL)
router.post('/offers/:id/sign', async (req, res) => {
  const id = req.params.id;
  const { signatureDataUrl } = req.body;
  if(!signatureDataUrl) return res.status(400).json({ error: 'signatureDataUrl required' });
  const off = await prisma.offer.update({ where: { id }, data: { signatureDataUrl, status: 'ACCEPTED', respondedAt: new Date() } });
  res.json(off);
});

// ---- Interview ICS download ----
router.get('/interviews/:id/ics', authenticate, requireRoles('hr','manager','superadmin'), async (req, res) => {
  const it = await prisma.interview.findUnique({ where: { id: req.params.id }, include: { application: { include: { job: true } } } });
  if(!it) return res.status(404).json({ error: 'Interview not found' });
  const dt = (d: Date) => {
    const pad = (n:number)=> String(n).padStart(2,'0');
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  };
  const uid = `interview-${it.id}@kechita.local`;
  const title = `Interview: ${it.application.firstName} ${it.application.lastName} — ${it.application.job.title}`;
  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kechita//Recruitment//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dt(new Date())}`,
    `DTSTART:${dt(new Date(it.startsAt))}`,
    `DTEND:${dt(new Date(it.endsAt))}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:Panel: ${it.panel || ''}\nMode: ${it.mode}\nLocation: ${it.location || ''}`,
    `LOCATION:${it.location || ''}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=interview-${it.id}.ics`);
  res.send(body);
});


// ---- Email offer (PDF attached) ----
router.post('/offers/:id/email', authenticate, requireRoles('hr','manager','superadmin'), async (req, res) => {
  const id = req.params.id;
  const { to } = req.body; // candidate email
  const off = await prisma.offer.findUnique({ where: { id }, include: { application: { include: { job: true } } } });
  if(!off) return res.status(404).json({ error: 'Offer not found' });

  // Generate PDF bytes by calling our own logic (reuse endpoint is possible, here we inline logic quickly)
  const { PDFDocument, StandardFonts } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { width } = page.getSize();
  const margin = 50;
  let y = 800;
  const drawText = (text: string, bold=false, size=12) => {
    const f = bold ? fontBold : font;
    const lines = text.split('\n');
    for (const line of lines){
      const wrapped = wrap(line, 90);
      for (const ln of wrapped){
        page.drawText(ln, { x: margin, y, size, font: f });
        y -= size + 6;
      }
    }
  };
  function wrap(s: string, n: number){
    const words = s.split(' ');
    const lines: string[] = [];
    let cur = '';
    for(const w of words){
      if((cur + ' ' + w).trim().length > n){ lines.push(cur.trim()); cur = w; } else { cur += ' ' + w; }
    }
    if(cur.trim()) lines.push(cur.trim());
    return lines;
  }
  drawText('KECHITA CAPITAL', true, 16);
  y -= 10;
  const contractText = off.contractText || `Offer Letter\n\nDear ${off.application.firstName} ${off.application.lastName},\nWe are pleased to offer you the role of ${off.title}.\nGross Salary: ${off.salary} ${off.currency}.`;
  drawText(contractText, false, 12);
  const bytes = await pdf.save();

  const info = await sendMail({
    to,
    subject: `Offer Letter - ${off.title}`,
    text: 'Please find attached your offer letter.',
    html: `<p>Please find attached your offer letter for <b>${off.title}</b>.</p>`,
    attachments: [{ filename: `offer-${id}.pdf`, content: Buffer.from(bytes), contentType: 'application/pdf' }]
  });
  res.json({ ok: true, messageId: info.messageId });
});

// ---- Email interview ICS to panel ----
router.post('/interviews/:id/email', authenticate, requireRoles('hr','manager','superadmin'), async (req, res) => {
  const id = req.params.id;
  const { to } = req.body; // string or list of emails
  const it = await prisma.interview.findUnique({ where: { id }, include: { application: { include: { job: true } } } });
  if(!it) return res.status(404).json({ error: 'Interview not found' });

  const dt = (d: Date) => {
    const pad = (n:number)=> String(n).padStart(2,'0');
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  };
  const uid = `interview-${it.id}@kechita.local`;
  const title = `Interview: ${it.application.firstName} ${it.application.lastName} — ${it.application.job.title}`;
  const ics = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Kechita//Recruitment//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dt(new Date())}`,
    `DTSTART:${dt(new Date(it.startsAt))}`,
    `DTEND:${dt(new Date(it.endsAt))}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:Panel: ${it.panel || ''}\nMode: ${it.mode}\nLocation: ${it.location || ''}`,
    `LOCATION:${it.location || ''}`,
    'END:VEVENT','END:VCALENDAR'
  ].join('\r\n');

  const info = await sendMail({
    to,
    subject: title,
    text: 'Please find attached the calendar invite.',
    html: `<p>Calendar invite attached for <b>${title}</b>.</p>`,
    attachments: [{ filename: `interview-${id}.ics`, content: ics, contentType: 'text/calendar' }]
  });
  res.json({ ok: true, messageId: info.messageId });
});


router.get('/jobs/:id', async (req, res) => {
  const job = await prisma.jobPosting.findUnique({ where: { id: req.params.id } });
  if(!job) return res.status(404).json({ error: 'Not found' });
  res.json(job);
});


// Public apply endpoint: creates application, auto-scores, sets initial status, and optionally sends regret.
router.post('/applications/apply', async (req, res) => {
  const parsed = ApplicationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const job = await prisma.jobPosting.findUnique({ where: { id: parsed.data.jobId } });
  if(!job) return res.status(404).json({ error: 'Job not found' });

  // Basic scoring
  const { score, decision, reasons } = scoreApplication({
    applicantType: parsed.data.applicantType,
    jobTitle: job.title,
    jobDescription: job.description,
    branch: job.branch,
    region: job.region,
    resumeText: '' // TODO: parse resume file
  });

  // Map decision to initial status
  let status: string = 'RECEIVED';
  if (decision === 'SHORTLIST') status = 'SHORTLISTED';
  else if (decision === 'AUTO-REJECT') status = 'REJECTED';

  const app = await prisma.application.create({ data: { ...parsed.data, status } });

  // Optional: auto-regret for AUTO-REJECT (use env flag for demo)
  const autoRegret = (process.env.AUTO_REGRET || 'false').toLowerCase() === 'true';
  if (decision === 'AUTO-REJECT' && autoRegret) {
    try {
      await sendMail({
        to: parsed.data.email,
        subject: `Application Update — ${job.title}`,
        text: `Dear ${parsed.data.firstName},\nThank you for your interest in ${job.title} at Kechita. After review, we won't proceed at this time.`,
        html: `<p>Dear ${parsed.data.firstName},</p><p>Thank you for your interest in <b>${job.title}</b> at Kechita. After review, we won’t proceed at this time.</p><p>Kind regards,<br/>Kechita HR</p>`
      });
    } catch (e) { /* swallow email errors for now */ }
  }

  res.status(201).json({ application: app, score, decision, reasons });
});

// Send a regret for a single application
router.post('/applications/:id/regret', authenticate, requireRoles('hr','manager','superadmin'), async (req, res) => {
  const app = await prisma.application.findUnique({ where: { id: req.params.id }, include: { job: true } as any });
  if(!app) return res.status(404).json({ error: 'Application not found' });
  await sendMail({
    to: app.email,
    subject: `Application Update — ${app.job.title}`,
    text: `Dear ${app.firstName},\nThank you for your interest in ${app.job.title} at Kechita. After review, we won't proceed at this time.`,
    html: `<p>Dear ${app.firstName},</p><p>Thank you for your interest in <b>${app.job.title}</b> at Kechita. After review, we won’t proceed at this time.</p><p>Kind regards,<br/>Kechita HR</p>`
  });
  // Optionally mark status if not already rejected
  if(app.status !== 'REJECTED'){
    await prisma.application.update({ where: { id: app.id }, data: { status: 'REJECTED' } });
  }
  res.json({ ok: true });
});


// ---- Recruitment Rule-Set (per job) ----
router.get('/jobs/:id/rules', authenticate, requireRoles('hr','manager','superadmin'), async (req, res) => {
  const rules = await prisma.recruitmentRuleSet.findUnique({ where: { jobId: req.params.id } });
  res.json(rules);
});

router.put('/jobs/:id/rules', authenticate, requireRoles('hr','manager','superadmin'), async (req, res) => {
  const data = {
    mustHave: req.body.mustHave ?? [],
    preferred: req.body.preferred ?? [],
    shortlistThreshold: Number(req.body.shortlistThreshold ?? 35),
    rejectThreshold: Number(req.body.rejectThreshold ?? 15),
    autoRegret: Boolean(req.body.autoRegret ?? false),
  };
  const existing = await prisma.recruitmentRuleSet.findUnique({ where: { jobId: req.params.id } });
  const rules = existing
    ? await prisma.recruitmentRuleSet.update({ where: { jobId: req.params.id }, data })
    : await prisma.recruitmentRuleSet.create({ data: { ...data, jobId: req.params.id } });
  res.json(rules);
});

// ---- Regret Templates ----
router.get('/regret-templates', authenticate, requireRoles('hr','manager','superadmin'), async (_req, res) => {
  const list = await prisma.regretTemplate.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(list);
});

router.post('/regret-templates', authenticate, requireRoles('hr','manager','superadmin'), async (req, res) => {
  const { name, subject, bodyHtml, bodyText, locale = 'en', jobId } = req.body;
  const tpl = await prisma.regretTemplate.create({ data: { name, subject, bodyHtml, bodyText, locale, jobId } });
  res.status(201).json(tpl);
});

// ---- Batch regrets for a job ----
router.post('/regrets/batch', authenticate, requireRoles('hr','manager','superadmin'), async (req, res) => {
  const { jobId, templateId, statusFilter = ['REJECTED'] } = req.body;
  const tpl = await prisma.regretTemplate.findUnique({ where: { id: templateId } });
  if(!tpl) return res.status(404).json({ error: 'Template not found' });
  const apps = await prisma.application.findMany({ where: { jobId, status: { in: statusFilter } }, include: { job: true } as any });
  let sent = 0;
  for (const app of apps){
    const html = tpl.bodyHtml
      .replace(/{{firstName}}/g, app.firstName)
      .replace(/{{jobTitle}}/g, app.job.title)
      .replace(/{{branch}}/g, app.job.branch)
      .replace(/{{region}}/g, app.job.region)
      .replace(/{{company}}/g, 'Kechita Capital');
    const text = tpl.bodyText
      .replace(/{{firstName}}/g, app.firstName)
      .replace(/{{jobTitle}}/g, app.job.title)
      .replace(/{{branch}}/g, app.job.branch)
      .replace(/{{region}}/g, app.job.region)
      .replace(/{{company}}/g, 'Kechita Capital');
    try {
      await sendMail({ to: app.email, subject: tpl.subject, html, text });
      sent++;
    } catch (e) {}
  }
  res.json({ ok: true, count: sent });
});
