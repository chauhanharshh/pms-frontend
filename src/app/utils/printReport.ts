export interface PrintConfig {
  title: string;
  hotelName: string;
  dateFrom: string;
  dateTo: string;
  columns: string[];
  rows: (string | number)[][];
  totalsRow?: (string | number)[];
  summaryHtml?: string; // Optional: extra HTML for summaries like "Charges Summary"
}

export const printReport = (config: PrintConfig) => {
  const {
    title,
    hotelName,
    dateFrom,
    dateTo,
    columns,
    rows,
    totalsRow,
    summaryHtml
  } = config;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm 12mm;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          body {
            font-family: Arial, sans-serif;
            font-size: 8px;
            color: #000;
            margin: 0;
            padding: 0;
          }
          
          /* Report header — only on first page */
          .report-header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 2px solid #000;
            padding-bottom: 6px;
          }
          
          .hotel-name {
            font-size: 15px;
            font-weight: bold;
            color: #000;
            text-transform: uppercase;
          }
          
          .report-title {
            font-size: 12px;
            font-weight: bold;
            color: #000;
            margin-top: 3px;
          }
          
          .date-range {
            font-size: 9px;
            color: #000;
            margin-top: 2px;
          }
          
          /* Main table structure */
          table.main-table {
            width: 100%;
            border-collapse: collapse;
            page-break-inside: auto;
          }
          
          table.main-table thead {
            display: table-header-group; /* repeats on every page */
          }
          
          table.main-table tfoot {
            display: table-footer-group; /* appears at end of table */
          }
          
          table.main-table tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          table.main-table th {
            background: #e8e8e8 !important;
            color: #000 !important;
            padding: 4px 3px;
            text-align: center;
            font-size: 7px;
            border: 1px solid #000;
            white-space: nowrap;
          }
          
          table.main-table td {
            padding: 3px;
            border: 1px solid #000;
            font-size: 7px;
            text-align: right;
            white-space: nowrap;
          }
          
          /* Alignment overrides: first 3 or 4 columns left, rest right */
          table.main-table td:nth-child(1),
          table.main-table td:nth-child(2),
          table.main-table td:nth-child(3),
          table.main-table td:nth-child(4) {
            text-align: left;
          }
          
          tr.total-row td {
            font-weight: bold;
            border-top: 2px solid #000;
            background: #e8e8e8 !important;
            color: #000 !important;
          }
          
          tr:nth-child(even) td {
            background: #fff;
          }
          
          /* Extra Sections (e.g., Charges Summary) */
          .extra-section {
            margin-top: 16px;
            page-break-inside: avoid;
          }
          
          .extra-section table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .extra-section th {
            background: #e8e8e8 !important;
            color: #000 !important;
            padding: 4px 3px;
            text-align: center;
            font-size: 7px;
            border: 1px solid #000;
          }
          
          .extra-section td {
            padding: 3px;
            border: 1px solid #000;
            font-size: 7px;
            text-align: right;
          }
          
          .extra-section .section-header td {
            font-weight: bold;
            background: #e8e8e8 !important;
            color: #000 !important;
            text-align: left;
          }
          
          .extra-section .grand-total-row td {
            font-weight: bold;
            background: #e8e8e8 !important;
            color: #000 !important;
            border-top: 2px solid #000;
          }

          /* Fixed footer on every page */
          .print-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            font-size: 7px;
            color: #000;
            border-top: 1px solid #000;
            padding-top: 2px;
            display: flex;
            justify-content: space-between;
            background: white;
          }

          @media screen {
            body { padding: 40px; background: #f0f0f0; }
            .print-container { background: white; width: 277mm; margin: auto; padding: 10mm 12mm; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .print-footer { position: relative; margin-top: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <!-- Report Header -->
          <div class="report-header">
            <div class="hotel-name">${hotelName}</div>
            <div class="report-title">${title}</div>
            <div class="date-range">
              Period: ${dateFrom} to ${dateTo} | 
              Generated: ${new Date().toLocaleDateString('en-IN')}
            </div>
          </div>

          <!-- Main Table — paginates across pages -->
          <table class="main-table">
            <thead>
              <tr>
                ${columns.map(col => `<th>${col}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map(row => `
                <tr>
                  ${row.map(cell => `<td>${cell ?? ''}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
            ${totalsRow ? `
              <tfoot>
                <tr class="total-row">
                  ${totalsRow.map(cell => `<td>${cell ?? ''}</td>`).join('')}
                </tr>
              </tfoot>
            ` : ''}
          </table>

          <!-- Optional Summary Sections (e.g., Charges Summary) -->
          ${summaryHtml ? `
            <div class="extra-section">
              ${summaryHtml}
            </div>
          ` : ''}

          <!-- Fixed footer on every page -->
          <div class="print-footer">
            <span>${hotelName}</span>
            <span>Period: ${dateFrom} to ${dateTo}</span>
            <span>Computer generated report</span>
          </div>
        </div>

        <script>
          // Fixed: proper pagination with repeating headers + Charges Summary after all rows
          window.onload = () => {
            window.print();
            // window.close();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
