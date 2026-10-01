// WhatsApp Utilities for Automatic Invoice Sharing
// Supports direct WhatsApp Web, WhatsApp Mobile app, and click-to-chat URL

export function cleanPhoneNumber(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length > 10 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;
}

export function buildWhatsAppBillMessage(invoice, company = {}) {
  const shopName = company?.name || 'Sri Kaliswari Crackers';
  const shopTagline = company?.tagline || 'Direct Sivakasi Fireworks • Retail & Wholesale';
  const shopAddress = company?.address || 'Maraneri, Sivakasi - 626123, Virudhunagar Dist, Tamil Nadu';
  const shopPhone = company?.mobile || '+91 9489280123';
  const billNo = invoice?.billNo || '1';
  const date = invoice?.date || new Date().toISOString().split('T')[0];
  const time = invoice?.time || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const custName = invoice?.customerName || 'Valued Customer';
  const custPhone = invoice?.customerMobile || '-';
  const custAddress = invoice?.customerAddress && invoice?.customerAddress !== '-' ? invoice.customerAddress : '';
  const items = invoice?.items || [];
  const totalQty = items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0);

  const itemsList = items.map((it, idx) => {
    const qty = Number(it.qty) || 1;
    const rate = Number(it.rate) || 0;
    const lineTotal = qty * rate;
    const pack = it.content ? ` (${it.content})` : '';
    return `${idx + 1}. *${it.name}*${pack}\n   👉 ${qty} × ₹${rate.toFixed(2)} = *₹${lineTotal.toFixed(2)}*`;
  }).join('\n');

  const grossTotal = Number(invoice?.grossTotal || 0).toFixed(2);
  const discountAmount = Number(invoice?.discountAmount || 0).toFixed(2);
  const discPercent = invoice?.discountPercent ? `${invoice.discountPercent}%` : 'Special Discount';
  const netAmount = Number(invoice?.netAmount || 0).toFixed(2);
  const payMode = invoice?.paymentMode || 'Cash';

  return `✨ *${shopName.toUpperCase()}* ✨
_${shopTagline}_
📍 ${shopAddress}
📞 Contact: ${shopPhone}
------------------------------------------
🧾 *INVOICE: #SKC ${billNo}*
📅 *Date:* ${date}   ⏰ *Time:* ${time}
👤 *Customer:* *${custName}*
📱 *Mobile:* ${custPhone}
${custAddress ? `📍 *Address:* ${custAddress}\n` : ''}------------------------------------------
📦 *PURCHASED CRACKERS (${items.length} Items / ${totalQty} Pkts):*
${itemsList}
------------------------------------------
📦 *Total Quantity:* ${totalQty} Boxes
💰 *Subtotal / MRP:* ₹${grossTotal}
🏷 *Discount (${discPercent}):* - ₹${discountAmount}
${Number(invoice?.additionalDiscountAmount) > 0 ? `🏷 *Extra Discount:* - ₹${Number(invoice.additionalDiscountAmount).toFixed(2)}\n` : ''}${Number(invoice?.packingCharge) > 0 ? `📦 *Packing Charges:* + ₹${Number(invoice.packingCharge).toFixed(2)}\n` : ''}${Number(invoice?.gstAmount) > 0 ? `🏛 *GST:* + ₹${Number(invoice.gstAmount).toFixed(2)}\n` : ''}------------------------------------------
💵 *NET AMOUNT PAID: ₹${netAmount}*
💳 *Payment Mode:* ${payMode} (PAID ✓)
------------------------------------------
🙏 *Thank you for shopping with ${shopName}!*
💥 Wishing you and your family a Happy, Prosperous & Safe Diwali! 🪔✨
🌐 www.srikaliswaricrackers.com`;
}

export function openWhatsAppChat(phone, message) {
  const clean = cleanPhoneNumber(phone);
  if (!clean || clean.length < 10) {
    return { ok: false, reason: 'Invalid or missing mobile number' };
  }
  const encoded = encodeURIComponent(message);
  const waUrl = `https://api.whatsapp.com/send?phone=${clean}&text=${encoded}`;
  
  // Try opening window
  try {
    const win = window.open(waUrl, '_blank');
    const blocked = !win || win.closed || typeof win.closed === 'undefined';
    return { ok: true, cleanPhone: clean, waUrl, popupBlocked: blocked };
  } catch (e) {
    return { ok: true, cleanPhone: clean, waUrl, popupBlocked: true };
  }
}
