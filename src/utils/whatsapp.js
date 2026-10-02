import { generatePdfDocument } from './pdfGenerator';
import html2canvas from 'html2canvas';

// WhatsApp Utilities for Invoice Sharing as Document / Image
export function cleanPhoneNumber(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length > 10 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;
}

// Generate formatted official WhatsApp message text with clean PDF link
export function createInvoiceWhatsAppMessage(invoice, company, customPdfUrl = '') {
  const storeName = company?.name || 'SRI KALISWARI CRACKERS, SIVAKASI';
  const billNo = invoice.billNo || 1;
  const host = typeof window !== 'undefined' ? (window.location.hostname || 'localhost') : 'localhost';
  const pdfUrl = customPdfUrl || `http://${host}:5000/api/invoices/${billNo}/pdf`;

  let msg = `✨ *${storeName}* ✨\n`;
  msg += `🧾 *OFFICIAL INVOICE: #SKC ${billNo}*\n`;
  msg += `📅 Date: ${invoice.billDate || invoice.date || new Date().toLocaleDateString('en-GB')}\n`;
  msg += `👤 Customer: *${invoice.customerName || 'Valued Customer'}*\n`;
  msg += `💵 *NET TOTAL: ₹${Number(invoice.netAmount || 0).toFixed(2)} (PAID ✓)*\n`;
  msg += `----------------------------------------\n`;
  msg += `📄 *VIEW / DOWNLOAD OFFICIAL PDF BILL:*\n`;
  msg += `👉 ${pdfUrl}\n`;
  msg += `----------------------------------------\n`;
  if (company?.mobile) msg += `📞 Helpline: ${company.mobile}\n`;
  msg += `🙏 *Thank you for your purchase!* Wishing you a joyous & safe Diwali! 🪔✨`;
  return msg;
}

export function openWhatsAppChat(phone, message = '', autoOpen = false) {
  const clean = cleanPhoneNumber(phone);
  if (!clean || clean.length < 10) {
    return { ok: false, reason: 'Invalid or missing mobile number' };
  }
  // Format WhatsApp Web / API URL
  const waUrl = message
    ? `https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(message)}`
    : `https://api.whatsapp.com/send?phone=${clean}`;

  if (!autoOpen) {
    return { ok: true, cleanPhone: clean, waUrl, popupBlocked: false };
  }

  try {
    const win = window.open(waUrl, '_blank');
    const blocked = !win || win.closed || typeof win.closed === 'undefined';
    return { ok: true, cleanPhone: clean, waUrl, popupBlocked: blocked };
  } catch (e) {
    return { ok: true, cleanPhone: clean, waUrl, popupBlocked: true };
  }
}

// Share PDF File directly using native Web Share API
export async function shareInvoicePdf(invoice, company) {
  try {
    const doc = generatePdfDocument(invoice, company);
    const pdfBlob = doc.output('blob');
    const safeCustomer = (invoice.customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Sri_Kaliswari_Bill_SKC_${invoice.billNo || 1}_${safeCustomer}.pdf`;
    const file = new File([pdfBlob], filename, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `Sri Kaliswari Crackers - Invoice #${invoice.billNo}`,
        text: `Official PDF Invoice for ${invoice.customerName || 'Customer'} - Net Amount: Rs.${invoice.netAmount}`
      });
      return { success: true };
    }
    return { success: false, notSupported: true };
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('Share error:', err);
    }
    return { success: false, error: err.message };
  }
}

// Copy Visual Invoice as high-res PNG image to clipboard for Ctrl+V paste into WhatsApp Web
export async function copyInvoiceImageToClipboard(elementId = 'printable-invoice-container') {
  const elem = document.getElementById(elementId) || document.querySelector('.print-invoice-sheet');
  if (!elem) {
    throw new Error('Invoice element not found');
  }

  const canvas = await html2canvas(elem, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Failed to create image blob'));
        return;
      }
      try {
        if (navigator.clipboard && navigator.clipboard.write) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          resolve(true);
        } else {
          reject(new Error('Clipboard API not supported in this browser'));
        }
      } catch (err) {
        reject(err);
      }
    }, 'image/png');
  });
}
