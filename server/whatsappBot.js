import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SESSION_DIR = path.join(__dirname, '../whatsapp_session');

let sock = null;
let botStatus = 'disconnected'; // 'disconnected' | 'connecting' | 'qrcode' | 'connected'
let latestQrDataUrl = null;
let connectedPhone = null;
let lastError = null;

export function getWhatsAppStatus() {
  return {
    status: botStatus,
    connected: botStatus === 'connected',
    qrCode: latestQrDataUrl,
    phone: connectedPhone,
    error: lastError
  };
}

export async function initWhatsAppBot() {
  if (botStatus === 'connected' && sock) {
    return getWhatsAppStatus();
  }

  botStatus = 'connecting';
  lastError = null;

  try {
    if (!fs.existsSync(SESSION_DIR)) {
      fs.mkdirSync(SESSION_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['Sri Kaliswari Billing', 'Chrome', '1.0.0'],
      syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        botStatus = 'qrcode';
        try {
          latestQrDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 6 });
        } catch (e) {
          console.error('Failed to generate QR data URL:', e);
        }
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`WhatsApp connection closed: ${statusCode}. Reconnecting: ${shouldReconnect}`);

        if (statusCode === DisconnectReason.loggedOut) {
          botStatus = 'disconnected';
          latestQrDataUrl = null;
          connectedPhone = null;
          try {
            fs.rmSync(SESSION_DIR, { recursive: true, force: true });
          } catch (e) {}
        } else {
          botStatus = 'connecting';
          setTimeout(() => {
            initWhatsAppBot();
          }, 4000);
        }
      } else if (connection === 'open') {
        botStatus = 'connected';
        latestQrDataUrl = null;
        lastError = null;
        try {
          const userJid = sock.user?.id || '';
          connectedPhone = userJid.split(':')[0] || userJid.split('@')[0];
          console.log(`✓ WhatsApp Bot Connected Successfully! Phone: +${connectedPhone}`);
        } catch (e) {
          connectedPhone = 'Connected';
        }
      }
    });

    return getWhatsAppStatus();
  } catch (err) {
    botStatus = 'disconnected';
    lastError = err.message;
    console.error('Failed to initialize WhatsApp bot:', err);
    return getWhatsAppStatus();
  }
}

export async function logoutWhatsAppBot() {
  try {
    if (sock) {
      await sock.logout();
    }
  } catch (e) {}

  botStatus = 'disconnected';
  latestQrDataUrl = null;
  connectedPhone = null;
  sock = null;

  try {
    fs.rmSync(SESSION_DIR, { recursive: true, force: true });
  } catch (e) {}

  return getWhatsAppStatus();
}

export async function sendInvoiceDocument(targetPhone, billNo, customerName, netAmount, pdfBuffer, customFilename) {
  if (botStatus !== 'connected' || !sock) {
    throw new Error('WhatsApp Bot is not connected. Please scan QR code in Settings.');
  }

  let clean = String(targetPhone).replace(/\D/g, '');
  if (clean.length === 10) clean = `91${clean}`;
  if (clean.length > 10 && clean.startsWith('0')) clean = `91${clean.slice(1)}`;

  if (!clean || clean.length < 10) {
    throw new Error('Invalid customer mobile number');
  }

  const jid = `${clean}@s.whatsapp.net`;
  const fileName = customFilename || `Sri_Kaliswari_Bill_SKC_${billNo || 1}.pdf`;

  const caption = `✨ *SRI KALIESWARI CRACKERS, SIVAKASI* ✨
🧾 *Official Invoice: #SKC ${billNo || 1}*
👤 *Customer:* ${customerName || 'Valued Customer'}
💵 *Total Amount:* ₹${Number(netAmount || 0).toFixed(2)} (PAID ✓)

📄 _Your official PDF Invoice is attached above._
🙏 *Thank you for your purchase!* Wishing you a safe & joyful Diwali! 🪔✨`;

  const res = await sock.sendMessage(jid, {
    document: pdfBuffer,
    mimetype: 'application/pdf',
    fileName: fileName,
    caption: caption
  });

  return { ok: true, messageId: res?.key?.id, to: clean };
}
