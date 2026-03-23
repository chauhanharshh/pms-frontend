// src/app/utils/tableExport.ts

// CSV Export:
export const exportToCSV = (data: any[], fileName: string) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.map(h => `"${h}"`).join(','),
    ...data.map(row =>
      headers.map(header => {
        const val = row[header] ?? '';
        // Always wrap in quotes, escape quotes inside values
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ];
  const csvContent = '\uFEFF' + csvRows.join('\n'); // BOM for Excel UTF-8
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

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
