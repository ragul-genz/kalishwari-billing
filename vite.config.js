import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import express from 'express';
import cors from 'cors';
import dns from 'dns';
import apiRouter from './server/api.js';
import { initDatabase } from './server/db.js';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

function tidbApiPlugin() {
  return {
    name: 'tidb-api-plugin',
    async configureServer(server) {
      try {
        await initDatabase();
        console.log('TiDB Cloud database connection ready in Vite dev server.');
      } catch (err) {
        console.error('TiDB init error in Vite:', err.message);
      }

      const app = express();
      app.use(cors());
      app.use(express.json({ limit: '10mb' }));
      app.use('/api', apiRouter);

      server.middlewares.use(app);
    }
  };
}

export default defineConfig({
  plugins: [react(), tidbApiPlugin()],
  server: {
    port: 3000,
    host: true,
    open: false,
    cors: true
  }
});
