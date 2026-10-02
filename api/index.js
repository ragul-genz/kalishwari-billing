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

// Support both /api/* and root routes
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
