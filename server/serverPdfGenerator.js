import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function formatNumber(num) {
  return Number(num || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  });
}

function hline(doc, x1, y, x2, color = [220, 220, 230], lw = 0.3) {
  doc.setDrawColor(...color);
  doc.setLineWidth(lw);
  doc.line(x1, y, x2, y);
}

export function generateServerInvoicePdf(billData, company = {}) {
  const comp = {
    name: company.name || 'SRI KALISWARI CRACKERS',
    tagline: company.tagline || 'Direct Sivakasi Fireworks Wholesale & Retail',
    address: company.address || '5/182-A, Main Road, Sivakasi - 626123, Tamil Nadu',
    mobile: company.mobile || '7871803642',
    email: company.email || 'sales@srikaliswaricrackers.com',
    gstin: company.gstin || ''
  };

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const lm = 12, rm = 12;
  const iw = pw - lm - rm;

  // 1. TOP ACCENT BAR
  doc.setFillColor(180, 30, 30);
  doc.rect(0, 0, pw, 2.5, 'F');

  // Header background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 2.5, pw, 38, 'F');

  // Logo circle
  doc.setFillColor(245, 240, 255);
  doc.setDrawColor(180, 30, 30);
  doc.setLineWidth(0.8);
  doc.circle(lm + 13, 21.5, 12, 'FD');
  doc.setTextColor(180, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('SK', lm + 13, 24.5, { align: 'center' });

  // Company Name
  doc.setTextColor(20, 20, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(comp.name, lm + 29, 13);

  // Tagline
  doc.setTextColor(180, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('DIRECT SIVAKASI FIREWORKS  ·  RETAIL & WHOLESALE', lm + 29, 18);

  // Address
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Address: ${comp.address.substring(0, 100)}`, lm + 29, 23);

  // Phone / Email
  doc.text(`Ph: ${comp.mobile}   |   Email: ${comp.email}`, lm + 29, 28);
  if (comp.gstin) {
    doc.text(`GSTIN: ${comp.gstin}`, lm + 29, 33);
  }

  // Quality badge
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
  ['✔ Safe & Reliable', '✔ 100% Genuine', '✔ Best Prices'].forEach((f, i) => {
    doc.text(f, badgeX + 4, 20 + i * 5);
  });

  hline(doc, 0, 40.5, pw, [200, 200, 210], 0.5);

  // 2. INVOICE TITLE STRIP
  let y = 42;
  doc.setFillColor(248, 248, 252);
  doc.rect(0, y, pw, 14, 'F');

  const docTypeLabel = billData.type === 'tax' ? 'TAX INVOICE' : (billData.type === 'quotation' ? 'QUOTATION' : 'OFFICIAL INVOICE');
  doc.setTextColor(20, 20, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(docTypeLabel, lm, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 130);
  doc.text('Thank you for choosing Sri Kaliswari Crackers!', lm, y + 13);

  const metaX = pw - rm - 62;
  const metas = [
    ['Invoice No', `SKC ${billData.billNo || 1}`],
    ['Date', billData.date || new Date().toISOString().split('T')[0]],
    ['Payment Mode', billData.paymentMode || 'Cash']
  ];
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

  // 3. CUSTOMER DETAILS
  doc.setFillColor(250, 250, 255);
  doc.setDrawColor(200, 200, 230);
  doc.setLineWidth(0.3);
  doc.roundedRect(lm, y, iw, 20, 2, 2, 'FD');

  doc.setFillColor(20, 20, 60);
  doc.roundedRect(lm, y, iw, 5.5, 2, 2, 'F');
  doc.rect(lm, y + 3, iw, 2.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Customer Details', lm + 4, y + 4);

  doc.setTextColor(20, 20, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Name', lm + 4, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${billData.customerName || 'Direct Counter Sale'}`, lm + 18, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.text('Phone', pw / 2 + 5, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${billData.customerMobile || '-'}`, pw / 2 + 20, y + 10);

  const addrTxt = `Address : ${billData.customerAddress || '-'}`;
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 80);
  doc.text(addrTxt.substring(0, 90), lm + 4, y + 16);

  y += 23;

  // 4. ITEMS TABLE
  const items = Array.isArray(billData.items) ? billData.items : [];
  const tableRows = items.map((item, idx) => [
    idx + 1,
    `${item.name || 'Cracker Item'}${item.content ? '\n(' + item.content + ')' : ''}`,
    item.qty || 1,
    formatNumber(item.rate || item.mrp || 0),
    `${billData.discountPercent || 0}%`,
    formatNumber((item.qty || 1) * (item.rate || item.mrp || 0))
  ]);

  const tableOptions = {
    startY: y,
    head: [['S.N', 'Cracker Name', 'Qty', 'MRP (₹)', 'Disc.%', 'Amount (₹)']],
    body: tableRows.length > 0 ? tableRows : [[1, 'Crackers Purchased', 1, formatNumber(billData.netAmount || 0), '0%', formatNumber(billData.netAmount || 0)]],
    theme: 'grid',
    headStyles: {
      fillColor: [20, 20, 60],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      cellPadding: 3
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left' },
      2: { halign: 'center', cellWidth: 14 },
      3: { halign: 'right', cellWidth: 24 },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'right', cellWidth: 30 }
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: [210, 210, 230],
      lineWidth: 0.2,
      textColor: [30, 30, 60]
    },
    alternateRowStyles: { fillColor: [249, 249, 255] },
    margin: { left: lm, right: rm }
  };

  autoTable(doc, tableOptions);

  y = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY : (y + 35);

  // Total Summary Row
  const totalQty = items.reduce((s, it) => s + Number(it.qty || 0), 0);
  doc.setFillColor(235, 235, 250);
  doc.rect(lm, y, iw, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(20, 20, 60);
  doc.text('TOTAL QUANTITY:', lm + 4, y + 4.2);
  doc.text(`${totalQty} Boxes`, lm + 38, y + 4.2);
  doc.text(`Gross Total: ₹ ${formatNumber(billData.grossTotal || billData.netAmount || 0)}`, pw - rm - 4, y + 4.2, { align: 'right' });
  hline(doc, lm, y + 6, pw - rm, [180, 180, 210], 0.3);
  y += 9;

  // 5. TOTALS BOX
  const rightW = 85;
  const rightX = pw - rm - rightW;
  doc.setFillColor(250, 250, 255);
  doc.setDrawColor(200, 200, 230);
  doc.setLineWidth(0.3);
  doc.roundedRect(rightX, y, rightW, 36, 2, 2, 'FD');

  const rows = [
    ['Gross Amount', `₹ ${formatNumber(billData.grossTotal || billData.netAmount || 0)}`],
    [`Discount (${billData.discountPercent || 0}%)`, `- ₹ ${formatNumber(billData.discountAmount || 0)}`],
    ['Net Amount', `₹ ${formatNumber(billData.netAmount || 0)}`]
  ];

  rows.forEach(([label, val], i) => {
    const isNet = i === rows.length - 1;
    const rY = y + 7 + i * 8;
    doc.setFont('helvetica', isNet ? 'bold' : 'normal');
    doc.setFontSize(isNet ? 9 : 8);
    doc.setTextColor(isNet ? 180 : 60, isNet ? 30 : 60, isNet ? 30 : 80);
    doc.text(label, rightX + 6, rY);
    doc.text(val, rightX + rightW - 6, rY, { align: 'right' });
  });

  // Footer
  const footerY = ph - 12;
  doc.setFillColor(20, 20, 60);
  doc.rect(0, footerY, pw, 12, 'F');
  doc.setTextColor(255, 215, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`  ${comp.name}  |  ${comp.address.substring(0, 40)}`, lm, footerY + 5);

  doc.setTextColor(200, 200, 230);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(
    `Ph: ${comp.mobile}   |   Email: ${comp.email}   |   Official Invoice`,
    pw / 2, footerY + 9.5, { align: 'center' }
  );

  return Buffer.from(doc.output('arraybuffer'));
}
