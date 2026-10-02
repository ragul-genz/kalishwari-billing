import express from 'express';
import cors from 'cors';
import apiRouter from '../server/api.js';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Mount router on both /api and root so all paths match whether prefixed or stripped
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
