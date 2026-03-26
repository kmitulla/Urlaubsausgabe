import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

export async function exportAsImage(elementId, filename = 'export.png') {
  const element = document.getElementById(elementId);
  if (!element) return;
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff'
  });
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export async function exportAsPDF(elementId, filename = 'export.pdf') {
  const element = document.getElementById(elementId);
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff'
  });

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const pdf = new jsPDF('p', 'mm', 'a4');
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}

export function exportAsExcel(data, filename = 'export.xlsx', sheetName = 'Daten') {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

export function exportSharedVacationExcel(expenses, settlements, participants, filename) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: All expenses
  const expData = expenses.map(e => ({
    'Datum': e.date || '',
    'Ausgabe': e.name || '',
    'Betrag': e.amount || 0,
    'Währung': e.currency || 'EUR',
    'Kategorie': e.category || '',
    'Bezahlt von': e.paidBy || '',
    'Bezahlt für': (e.paidFor || []).join(', ')
  }));
  const ws1 = XLSX.utils.json_to_sheet(expData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Ausgaben');

  // Sheet 2: Settlements
  const settData = settlements.map(s => ({
    'Von': s.from,
    'An': s.to,
    'Betrag': s.amount
  }));
  const ws2 = XLSX.utils.json_to_sheet(settData);
  XLSX.utils.book_append_sheet(wb, ws2, 'Ausgleichszahlungen');

  XLSX.writeFile(wb, filename);
}

export async function exportSharedVacationPDF(elementId, filename) {
  await exportAsPDF(elementId, filename);
}
