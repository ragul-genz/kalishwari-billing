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
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
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

async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`TiDB Billing Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
