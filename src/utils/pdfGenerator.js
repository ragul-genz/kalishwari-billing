import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(num);
};

export const formatNumber = (num) => {
  return Number(num || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  });
};

// helper: draw horizontal line
function hline(doc, x1, y, x2, color = [220, 220, 230], lw = 0.3) {
  doc.setDrawColor(...color);
  doc.setLineWidth(lw);
  doc.line(x1, y, x2, y);
}

export const generatePdfDocument = (billData, company) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const lm = 12, rm = 12;
  const iw = pw - lm - rm;

  // ══════════════════════════════════════════════════════════════
  // 1. TOP ACCENT BAR
  // ══════════════════════════════════════════════════════════════
  doc.setFillColor(180, 30, 30);
  doc.rect(0, 0, pw, 2.5, 'F');

  // Header background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 2.5, pw, 38, 'F');

  // ── Logo circle ──
  doc.setFillColor(245, 240, 255);
  doc.setDrawColor(180, 30, 30);
  doc.setLineWidth(0.8);
  doc.circle(lm + 13, 21.5, 12, 'FD');
  doc.setTextColor(180, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('SK', lm + 13, 24.5, { align: 'center' });

  // ── Company Name ──
  doc.setTextColor(20, 20, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(company.name, lm + 29, 13);

  // Tagline
  doc.setTextColor(180, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('DIRECT SIVAKASI FIREWORKS  ·  RETAIL & WHOLESALE', lm + 29, 18);

  // Address line
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const fullAddr = `Address: ${company.address}`;
  doc.text(fullAddr.substring(0, 100), lm + 29, 23);

  // Phone / Email
  doc.text(
    `Ph: ${company.mobile}   |   Email: ${company.email || 'sales@srikaliswaricrackers.com'}`,
    lm + 29, 28
  );

  // GSTIN
  if (company.gstin) {
    doc.text(`GSTIN: ${company.gstin}`, lm + 29, 33);
  }

  // ── Premium Quality badge (top-right) ──
  const badgeX = pw - rm - 36;
  doc.setFillColor(250, 248, 255);
  doc.setDrawColor(180, 30, 30);
  doc.setLineWidth(0.4);
  doc.roundedRect(badgeX, 5, 36, 33, 2, 2, 'FD');

  doc.setTextColor(180, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Premium Quality', badgeX + 18, 11, { align: 'center' });
  doc.setFontSize(6.5);
  doc.text('Crackers', badgeX + 18, 15, { align: 'center' });
  doc.setTextColor(80, 120, 80);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  ['✔ Safe & Reliable', '✔ Wide Range', '✔ Best Prices'].forEach((f, i) => {
    doc.text(f, badgeX + 4, 20 + i * 5);
  });

  hline(doc, 0, 40.5, pw, [200, 200, 210], 0.5);

  // ══════════════════════════════════════════════════════════════
  // 2. INVOICE TITLE STRIP
  // ══════════════════════════════════════════════════════════════
  let y = 42;

  doc.setFillColor(248, 248, 252);
  doc.rect(0, y, pw, 14, 'F');

  const docTypeLabel =
    billData.type === 'tax' ? 'TAX INVOICE' :
    billData.type === 'quotation' ? 'QUOTATION' : 'INVOICE';

  doc.setTextColor(20, 20, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(docTypeLabel, lm, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 130);
  doc.text('Thank you for your purchase!', lm, y + 13);

  // Meta: Invoice No / Date / Time
  const metaX = pw - rm - 62;
  const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const metas = [['Invoice No', `SKC ${billData.billNo}`], ['Date', billData.date], ['Time', nowTime]];
  metas.forEach(([label, val], i) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 130);
    doc.text(label, metaX, y + 4 + i * 4);
    doc.text(':', metaX + 22, y + 4 + i * 4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 60);
    doc.text(String(val), metaX + 25, y + 4 + i * 4);
  });

  hline(doc, 0, y + 14, pw, [200, 200, 210], 0.4);
  y += 16;

  // ══════════════════════════════════════════════════════════════
  // 3. CUSTOMER DETAILS BOX
  // ══════════════════════════════════════════════════════════════
  doc.setFillColor(250, 250, 255);
  doc.setDrawColor(200, 200, 230);
  doc.setLineWidth(0.3);
  doc.roundedRect(lm, y, iw, 20, 2, 2, 'FD');

  // Header bar inside box
  doc.setFillColor(20, 20, 60);
  doc.roundedRect(lm, y, iw, 5.5, 2, 2, 'F');
  doc.rect(lm, y + 3, iw, 2.5, 'F'); // flush bottom corners

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Customer Details', lm + 4, y + 4);

  // Customer fields
  doc.setTextColor(20, 20, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Name', lm + 4, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${billData.customerName || 'Cash Customer'}`, lm + 18, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.text('Phone', pw / 2 + 5, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${billData.customerMobile || '-'}`, pw / 2 + 20, y + 10);

  const addrTxt = `Address : ${billData.customerAddress || '-'}`;
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 80);
  doc.text(addrTxt.substring(0, 90), lm + 4, y + 16);

  y += 23;

  // ══════════════════════════════════════════════════════════════
  // 4. ITEMS TABLE
  // ══════════════════════════════════════════════════════════════
  const totalQty = billData.items.reduce((s, item) => s + item.qty, 0);
  const tableRows = billData.items.map((item, idx) => [
    idx + 1,
    `${item.name}${item.content ? '\n(' + item.content + ')' : ''}`,
    item.qty,
    formatNumber(item.rate),
    `${billData.discountPercent || 0}%`,
    formatNumber(item.qty * item.rate),
  ]);

  doc.autoTable({
    startY: y,
    head: [['S.N', 'Cracker Name', 'Qty', 'MRP (₹)', 'Disc.%', 'Amount (₹)']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [20, 20, 60],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      cellPadding: 3,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left' },
      2: { halign: 'center', cellWidth: 14 },
      3: { halign: 'right', cellWidth: 24 },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'right', cellWidth: 30 },
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: [210, 210, 230],
      lineWidth: 0.2,
      textColor: [30, 30, 60],
    },
    alternateRowStyles: { fillColor: [249, 249, 255] },
    margin: { left: lm, right: rm },
  });

  y = doc.lastAutoTable.finalY + 0;

  // Total Qty summary row
  doc.setFillColor(235, 235, 250);
  doc.rect(lm, y, iw, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(20, 20, 60);
  doc.text('Total Qty', lm + 4, y + 4.2);
  doc.text(String(totalQty), pw - rm - 4, y + 4.2, { align: 'right' });
  y += 8;

  // ══════════════════════════════════════════════════════════════
  // 5. TERMS (left) + AMOUNT SUMMARY (right)
  // ══════════════════════════════════════════════════════════════
  const sectionH = 55;
  const leftW = iw * 0.52;
  const rightW = iw * 0.46;
  const rightX = lm + leftW + iw * 0.02;
  const sY = y;

  // Left: Terms box
  doc.setFillColor(255, 252, 235);
  doc.setDrawColor(220, 180, 60);
  doc.setLineWidth(0.3);
  doc.roundedRect(lm, sY, leftW, sectionH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 80, 0);
  doc.text('ℹ  Terms & Conditions', lm + 3, sY + 6);
  hline(doc, lm + 2, sY + 8, lm + leftW - 2, [220, 180, 60], 0.3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(70, 55, 10);
  const terms = company.terms && company.terms.length > 0 ? company.terms : [
    '1. Goods once sold will not be taken back or refunded.',
    '2. Store crackers in a cool dry place.',
    '3. Allow light crackers under adult supervision.',
    '4. Subject to Sivakasi Jurisdiction.',
  ];
  terms.slice(0, 5).forEach((term, i) => {
    const lines = doc.splitTextToSize(`• ${term}`, leftW - 8);
    doc.text(lines, lm + 4, sY + 13 + i * 7.5);
  });

  // Right: Amount calculation box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(200, 200, 230);
  doc.setLineWidth(0.3);
  doc.roundedRect(rightX, sY, rightW, sectionH, 2, 2, 'FD');

  let ry = sY + 7;
  const lx = rightX + 4;
  const vx = rightX + rightW - 4;

  const drawRow = (label, val, textColor = [40, 40, 80], bold = false, prefix = '₹ ') => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...textColor);
    doc.text(label, lx, ry);
    doc.text(`${prefix}${formatNumber(val)}`, vx, ry, { align: 'right' });
    ry += 5.5;
    hline(doc, rightX + 2, ry - 1.5, rightX + rightW - 2, [220, 220, 240], 0.2);
  };

  drawRow('Subtotal', billData.grossTotal);

  if ((billData.discountPercent || 0) > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 30, 30);
    doc.text(`Discount (${billData.discountPercent}%)`, lx, ry);
    doc.text(`- ₹ ${formatNumber(billData.discountAmount)}`, vx, ry, { align: 'right' });
    ry += 5.5;
    hline(doc, rightX + 2, ry - 1.5, rightX + rightW - 2, [220, 220, 240], 0.2);
  }

  if ((billData.additionalDiscountPercent || 0) > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 30, 30);
    doc.text(`Extra Disc (${billData.additionalDiscountPercent}%)`, lx, ry);
    doc.text(`- ₹ ${formatNumber(billData.additionalDiscountAmount)}`, vx, ry, { align: 'right' });
    ry += 5.5;
    hline(doc, rightX + 2, ry - 1.5, rightX + rightW - 2, [220, 220, 240], 0.2);
  }

  if ((billData.packingCharge || 0) > 0) {
    drawRow(`Packing (${billData.packingPercent || 0}%)`, billData.packingCharge);
  }

  if (billData.type === 'tax' && (billData.gstAmount || 0) > 0) {
    drawRow(`GST (${billData.gstPercent || 18}%)`, billData.gstAmount, [40, 80, 180]);
  }

  // Grand Total box
  const gtBoxY = sY + sectionH - 20;
  doc.setFillColor(20, 20, 60);
  doc.roundedRect(rightX + 2, gtBoxY, rightW - 4, 10, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Grand Total', rightX + 5, gtBoxY + 6.5);
  doc.setFontSize(10);
  doc.text(`₹ ${formatNumber(billData.netAmount)}`, rightX + rightW - 5, gtBoxY + 6.5, { align: 'right' });

  // Payment Status
  const psY = gtBoxY + 13;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(40, 40, 80);
  doc.text('Payment Status', rightX + 4, psY);
  doc.setTextColor(20, 150, 80);
  doc.text(`✔ CASH ₹${formatNumber(billData.netAmount)} (PAID)`, rightX + rightW - 4, psY, { align: 'right' });

  y = sY + sectionH + 5;

  // ══════════════════════════════════════════════════════════════
  // 6. THANK YOU + SIGNATURES
  // ══════════════════════════════════════════════════════════════
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(16);
  doc.setTextColor(60, 60, 140);
  doc.text('Thank You!', pw / 2, y + 7, { align: 'center' });
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 160);
  doc.text('Visit Again', pw / 2, y + 13, { align: 'center' });
  y += 20;

  // Signature lines
  hline(doc, lm, y, lm + 50, [160, 160, 200], 0.4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 130);
  doc.text('Customer Signature', lm, y + 4);

  hline(doc, pw - rm - 55, y, pw - rm, [160, 160, 200], 0.4);
  doc.text(`For ${company.name}`, pw - rm, y + 4, { align: 'right' });
  doc.setFontSize(6.5);
  doc.setTextColor(140, 140, 160);
  doc.text('Authorised Signatory', pw - rm, y + 8, { align: 'right' });

  // ══════════════════════════════════════════════════════════════
  // 7. FOOTER BANNER
  // ══════════════════════════════════════════════════════════════
  const footerY = ph - 12;
  doc.setFillColor(20, 20, 60);
  doc.rect(0, footerY, pw, 12, 'F');

  doc.setTextColor(255, 215, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`  ${company.name}  |  ${company.address.substring(0, 40)}`, lm, footerY + 5);

  doc.setTextColor(200, 200, 230);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(
    `Ph: ${company.mobile}   |   Email: ${company.email || 'sales@srikaliswaricrackers.com'}   |   Developed by Genz Neural-x`,
    pw / 2, footerY + 9.5, { align: 'center' }
  );

  return doc;
};
