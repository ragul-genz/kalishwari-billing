import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import apiRouter from './server/api.js';
import { initDatabase } from './server/db.js';

// Force IPv4 and public DNS to avoid mobile network IPv6 NAT64 disconnects
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Prevent unexpected socket disconnects or network errors from crashing the server
process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled Rejection:', reason);
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Mount API
app.use('/api', apiRouter);

// Serve frontend dist if built
app.use(express.static(path.join(__dirname, 'dist')));
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
    if (err) next();
  });
});

function start() {
  app.listen(PORT, () => {
    console.log(`TiDB Billing Server running on http://localhost:${PORT}`);
  });

  const connectWithRetry = async (attempt = 1) => {
    try {
      console.log(`Connecting to TiDB Cloud (attempt ${attempt})...`);
      await initDatabase();
      console.log('✓ TiDB Cloud Database Connected & Schema Verified!');
    } catch (err) {
      console.warn(`[TiDB Startup] Connection attempt ${attempt} delayed: ${err.message}. Retrying in 4s...`);
      setTimeout(() => connectWithRetry(attempt + 1), 4000);
    }
  };

  connectWithRetry();
}

start();
