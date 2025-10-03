import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@kechita/db/src/index.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { email, password, firstName, lastName, role = 'staff' } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: hash, firstName, lastName, role } });
  res.json({ id: user.id, email: user.email });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET || 'dev', { expiresIn: '8h' });
  res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax' });
  res.json({ ok: true, role: user.role });
});

export default router;


import { authenticate } from '../../middleware/auth.js';

router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.sub }, select: { id:true, email:true, firstName:true, lastName:true, role:true } });
  res.json(user);
});

// DEV ONLY: seed quick users (superadmin/hr/manager/staff)
// Remove or guard in production.
router.post('/seed-dev', async (_req, res) => {
  const users = [
    { email:'superadmin@kechita.local', firstName:'Super', lastName:'Admin', role:'superadmin' },
    { email:'hr@kechita.local', firstName:'H', lastName:'R', role:'hr' },
    { email:'manager@kechita.local', firstName:'Branch', lastName:'Manager', role:'manager' },
    { email:'staff@kechita.local', firstName:'Test', lastName:'Staff', role:'staff' },
  ];
  const created:any[] = [];
  for (const u of users){
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if(!existing){
      const bcrypt = await import('bcryptjs');
      const hash = await bcrypt.default.hash('password', 10);
      created.push(await prisma.user.create({ data: { ...u, password: hash } }));
    }
  }
  res.json({ ok:true, created });
});
