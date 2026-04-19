import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getDb } from './db/client';

import authRouter from './routes/auth';
import inquiryRouter from './routes/inquiry';
import historyRouter from './routes/history';
import notifyRouter from './routes/notify';
import settingsRouter from './routes/settings';

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173', credentials: true }));
app.use(express.json());

// DB 초기화
getDb();

app.use('/api/auth', authRouter);
app.use('/api/inquiry', inquiryRouter);
app.use('/api/history', historyRouter);
app.use('/api/notify', notifyRouter);
app.use('/api/settings', settingsRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`[AICS] 서버 실행 중: http://localhost:${PORT}`);
});
