import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { prisma } from '@kechita/db/src/index.js';
import authRouter from './modules/auth/routes.js';
import recruitmentRouter from './modules/recruitment/routes.js';
import leaveRouter from './modules/leave/routes.js';
import claimsRouter from './modules/claims/routes.js';
import loansRouter from './modules/loans/routes.js';
import pettycashRouter from './modules/pettycash/routes.js';
import performanceRouter from './modules/performance/routes.js';
import documentsRouter from './modules/documents/routes.js';
import communicationRouter from './modules/communication/routes.js';
import adminRouter from './modules/admin/routes.js';

const app = express();
app.use(helmet());
app.use(express.json({limit: '1mb'}));
app.use(cookieParser());
const origins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
app.use(cors({ origin: origins.length? origins : true, credentials: true }));

app.get('/health', (_req, res) => res.json({ok:true}));
app.use('/auth', authRouter);
app.use('/recruitment', recruitmentRouter);
app.use('/leave', leaveRouter);
app.use('/claims', claimsRouter);
app.use('/loans', loansRouter);
app.use('/pettycash', pettycashRouter);
app.use('/performance', performanceRouter);
app.use('/documents', documentsRouter);
app.use('/communication', communicationRouter);
app.use('/admin', adminRouter);

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: origins.length? origins : '*' } });

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
});

const port = process.env.PORT || 4000;
httpServer.listen(port, () => console.log(`API on http://localhost:${port}`));
