// src/app/utils/tableExport.ts

import * as XLSX from 'xlsx';

/**
 * Standardizes date strings to DD-MM-YYYY format for CSV/Excel export.
 */
export const formatDateForCSV = (dateStr: any): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return String(dateStr);
  }
};

/**
 * Exports data to an Excel file (.xlsx) using SheetJS.
 * Automatically fits column widths based on the data.
 */
export const exportToExcel = (data: any[], fileName: string) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Create worksheet from JSON data
  const ws = XLSX.utils.json_to_sheet(data);

  // Auto-calculate column widths
  const colWidths = Object.keys(data[0]).map(key => ({
    wch: Math.max(
      key.length,
      ...data.map(row => String(row[key] ?? '').length)
    ) + 2
  }));
  ws['!cols'] = colWidths;

  // Create workbook and append the worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');

  // Generate and download the .xlsx file
  const dateSuffix = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${fileName}-${dateSuffix}.xlsx`);
};

/**
 * Alias for exportToExcel to maintain backward compatibility with existing components.
 */
export const exportToCSV = exportToExcel;

// Print table:
export const printTable = (tableId: string, title: string) => {
  const tableEl = document.getElementById(tableId);
  if (!tableEl) return;

  const printWindow = window.open('', '_blank');
  printWindow?.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Calibri, sans-serif; padding: 20px; }
          h2 { color: #B8860B; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #B8860B; color: white; padding: 8px; text-align: left; }
          td { padding: 6px 8px; border-bottom: 1px solid #eee; }
          tr:nth-child(even) { background: #f9f9f9; }
          p.date { color: #888; font-size: 11px; margin-bottom: 12px; }
        </style>
      </head>
      <body>
        <h2>${title}</h2>
        <p class="date">Generated: ${new Date().toLocaleString('en-IN')}</p>
        ${tableEl.outerHTML}
      </body>
    </html>
  `);
  printWindow?.document.close();
  printWindow?.print();
};
