import { usePMS } from "../contexts/PMSContext";
import { Printer, X, Download } from "lucide-react";
import { numberToWords } from "../utils/numberToWords";

interface InvoiceModalProps {
  invoice: any;
  onClose: () => void;
}

export function InvoiceModal({ invoice, onClose }: InvoiceModalProps) {
  const { hotels, bookings } = usePMS();
  const hotelFromContext = hotels.find((h) => h.id === invoice.hotelId);
  const hotelFromInvoice = (invoice as any)?.hotel || (invoice as any)?.bill?.hotel || null;
  const hotel = hotelFromContext || hotelFromInvoice;
  const bk = bookings.find((b) => b.id === invoice.bill?.bookingId);

  const totalGst = Number(invoice.cgst || 0) + Number(invoice.sgst || 0);
  const subtotal = Number(invoice.subtotal || 0) - Number(invoice.bill?.restaurantCharges || 0);
  const beforeRound = subtotal + totalGst;
  const roundOff = Math.round(beforeRound) - beforeRound;
  const totalAmountWithoutFood = Math.round(beforeRound);
  const advanceAmount = Number(invoice.bill?.booking?.advanceAmount || bk?.advanceAmount || 0);

  // Date formatting functions
  const formatDateOnly = (d: Date | null) => {
    if (!d) return '-';
    const date = new Date(d);
    return `${date.getDate().toString().padStart(2, '0')} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
  };

  const formatDateForBill = (d: Date | null) => d ? `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}` : '-';
  const formatDateTime = (d: Date | null) => d ? `${d.getDate().toString().padStart(2, '0')} ${(d.getMonth() + 1).toString().padStart(2, '0')} ${d.getFullYear()}/${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}` : '-';

  const billDateStr = invoice.createdAt ? formatDateForBill(new Date(invoice.createdAt)) : '-';
  const arrivalDateStr = bk?.checkInDate ? formatDateTime(new Date(bk.checkInDate)) : '-';
  const departureDateStr = bk?.checkOutDate ? formatDateTime(new Date(bk.checkOutDate)) : '-';

  const rawAddress =
    hotel?.address ||
    [hotel?.city, hotel?.state].filter(Boolean).join(", ") ||
    "";

  const addressParts = rawAddress
    .split(",")
    .map((part: string) => part.trim())
    .filter(Boolean);
  const hotelAddressLine1 = addressParts[0] || [hotel?.city, hotel?.state].filter(Boolean).join(", ") || "";
  const hotelAddressLine2 = addressParts.length > 1 ? addressParts.slice(1).join(", ") : "";
  const hotelAddressLine3 = !addressParts.length && hotel?.state ? hotel.state : "";

  // Calculate GST percentage
  const taxRate = Number(hotel?.taxRate || 12);
  const gstPercentage = (taxRate / 2).toFixed(2); // CGST + SGST each half of total rate

  const items: any[] = [];

  if (Number(invoice.bill?.roomCharges) > 0) {
    const base = Number(invoice.bill.roomCharges);
    const gstPart = subtotal > 0 ? (base / subtotal) * totalGst : 0;
    const chargeDate = invoice.createdAt ? formatDateOnly(new Date(invoice.createdAt)) : 'the Day';
    items.push({
      date: billDateStr,
      type: "Room\nCharges",
      desc: `Room Charges for the Day ${chargeDate} for Room Number ${bk?.room?.roomNumber || 'NA'}, GST (${gstPercentage}%)`,
      charges: base,
      discount: 0,
      gst: gstPart,
      total: base + gstPart
    });
  }

  if (Number(invoice.bill?.miscCharges) > 0) {
    const base = Number(invoice.bill.miscCharges);
    const gstPart = subtotal > 0 ? (base / subtotal) * totalGst : 0;
    items.push({
      date: billDateStr,
      type: "Misc\nCharges",
      desc: `Miscellaneous Guest Services, GST (${gstPercentage}%)`,
      charges: base,
      discount: 0,
      gst: gstPart,
      total: base + gstPart
    });
  }

  // If no items generated (unlikely), fallback
  if (items.length === 0) {
    items.push({
      date: billDateStr,
      type: "Charges",
      desc: `General Charges`,
      charges: subtotal,
      discount: 0,
      gst: totalGst,
      total: subtotal + totalGst
    });
  }

  const getInvoiceHtml = () => {
    let itemsHtml = items.map(item => `
      <tr>
        <td class="border-b" style="padding: 4px; white-space: nowrap;">${item.date}</td>
        <td class="border-b border-l" style="padding: 4px; white-space: pre-line; vertical-align: middle;">${item.type}</td>
        <td class="border-b border-l text-left" style="padding: 4px;">${item.desc}</td>
        <td class="border-b border-l text-right" style="padding: 4px;">${item.charges.toFixed(2)}</td>
        <td class="border-b border-l text-right" style="padding: 4px;">${item.discount.toFixed(2)}</td>
        <td class="border-b border-l text-right" style="padding: 4px;">${item.gst.toFixed(2)}</td>
        <td class="border-b border-l text-right" style="padding: 4px;">${item.total.toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <html><head><title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Courier New', Courier, monospace; font-size: 13px; color: #000; margin: 0; padding: 0; }
        .invoice-wrapper { max-width: 800px; margin: 0 auto; padding: 10px; background: #fff; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        table { width: 100%; border-collapse: collapse; }
        .border-all { border: 1px solid #C6A75E; }
        .border-t { border-top: 1px solid #C6A75E; }
        .border-b { border-bottom: 1px solid #C6A75E; }
        .border-l { border-left: 1px solid #C6A75E; }
        .border-r { border-right: 1px solid #C6A75E; }
        td, th { vertical-align: top; }
        .header-title { font-size: 16px; margin: 0; color: #C6A75E; font-weight: bold; }
        .header-text { margin: 2px 0; color: #000; font-size: 12px; }
        .proforma { font-size: 18px; font-weight: bold; margin: 15px 0; font-family: sans-serif; color: #000; }
        .info-row { display: flex; margin-bottom: 3px; }
        .info-col-label { width: 130px; color: #000; font-size: 12px; }
        .info-col-sep { width: 10px; color: #000; }
        .info-col-val { flex: 1; color: #000; font-size: 12px; }
        .flex { display: flex; }
        .w-50 { width: 50%; }
        @media print { 
          body { margin: 0; padding: 10px; } 
          @page { size: auto; margin: 5mm; }
        }
      </style></head>
      <body>
        <div class="invoice-wrapper border-all" style="padding: 20px;">
          <div class="text-center">
            <h2 class="header-title">${hotel?.name || "HOTEL"}</h2>
            <div class="header-text">${hotelAddressLine1}</div>
            <div class="header-text">${hotelAddressLine2}</div>
            ${hotelAddressLine3 ? `<div class="header-text">${hotelAddressLine3}</div>` : ""}
            <div class="header-text" style="margin-top: 8px;">"Composition - Taxable Person Not Eligible to Collect Tax on Supplies / Services"</div>
            <div class="header-text">Contact No:- ${hotel?.phone || ""}</div>
            <div class="header-text">GST Number: ${hotel?.gstNumber || ""}</div>
            <div class="proforma">TAX INVOICE</div>
          </div>

          <div class="border-all flex" style="margin-bottom: 10px;">
            <div class="w-50" style="padding: 10px;">
              ${(bk?.companyName || bk?.company?.name) && (bk?.companyGst || bk?.company?.gstNumber) ? `
              <div class="info-row"><div class="info-col-label" style="font-weight: bold;">Billed To</div><div class="info-col-sep">-</div><div class="info-col-val" style="font-weight: bold; text-transform: uppercase;">${bk.companyName || bk.company?.name}</div></div>
              <div class="info-row" style="margin-bottom: 8px;"><div class="info-col-label">GST No.</div><div class="info-col-sep">-</div><div class="info-col-val">${bk.companyGst || bk.company?.gstNumber || "-"}</div></div>
              <div class="info-row"><div class="info-col-label">Guest Name</div><div class="info-col-sep">-</div><div class="info-col-val" style="text-transform: uppercase; font-weight: bold;">${bk?.guestName || bk?.company?.name}</div></div>
              ` : `
              <div class="info-row"><div class="info-col-label">Guest Name</div><div class="info-col-sep">-</div><div class="info-col-val" style="text-transform: lowercase;">${bk?.guestName || "guest"}</div></div>
              `}
              <div class="info-row"><div class="info-col-label">Address</div><div class="info-col-sep">-</div><div class="info-col-val">${bk?.addressLine || "-"}</div></div>
              <div class="info-row"><div class="info-col-label">Contact No</div><div class="info-col-sep">-</div><div class="info-col-val">${bk?.guestPhone || "-"}</div></div>
              <div class="info-row"><div class="info-col-label">Room Nos</div><div class="info-col-sep">-</div><div class="info-col-val">${bk?.room?.roomNumber || "-"}</div></div>
              <div class="info-row"><div class="info-col-label">State</div><div class="info-col-sep">-</div><div class="info-col-val">NA</div></div>
            </div>
            <div class="w-50 border-l" style="padding: 10px;">
              <div class="info-row"><div class="info-col-label">Bill Date</div><div class="info-col-sep">-</div><div class="info-col-val">${billDateStr}</div></div>
              <div class="info-row"><div class="info-col-label">Bill No.</div><div class="info-col-sep">-</div><div class="info-col-val">${invoice.invoiceNumber || "-"}</div></div>
              <div class="info-row"><div class="info-col-label">Reg. No.</div><div class="info-col-sep">-</div><div class="info-col-val">${bk?.id?.slice(-4) || "-"}</div></div>
              <div class="info-row"><div class="info-col-label">Plan</div><div class="info-col-sep">-</div><div class="info-col-val">NA</div></div>
              <div class="info-row"><div class="info-col-label">PAX</div><div class="info-col-sep">-</div><div class="info-col-val">Adults ${bk?.adults || 2},Child ${bk?.children || 0}</div></div>
              <div class="info-row"><div class="info-col-label">Arrival Date</div><div class="info-col-sep">-</div><div class="info-col-val">${arrivalDateStr}</div></div>
              <div class="info-row"><div class="info-col-label">Departure Date</div><div class="info-col-sep">-</div><div class="info-col-val">${departureDateStr}</div></div>
            </div>
          </div>

          <table class="border-all" style="margin-bottom: 0;">
            <thead>
              <tr>
                <th class="border-b text-left" style="padding: 6px 4px; font-size: 11px;">Date</th>
                <th class="border-b border-l text-left" style="padding: 6px 4px; font-size: 11px;">Charges<br>Type</th>
                <th class="border-b border-l text-left" style="padding: 6px 4px; width: 40%; font-size: 11px;">Description</th>
                <th class="border-b border-l text-right" style="padding: 6px 4px; font-size: 11px;">Charges</th>
                <th class="border-b border-l text-right" style="padding: 6px 4px; font-size: 11px;">Discount</th>
                <th class="border-b border-l text-right" style="padding: 6px 4px; font-size: 11px;">GST</th>
                <th class="border-b border-l text-right" style="padding: 6px 4px; font-size: 11px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr>
                <td colspan="3" class="text-left" style="padding: 6px 4px; font-weight: bold;">Total</td>
                <td class="border-l text-right" style="padding: 6px 4px; font-weight: bold;">${subtotal.toFixed(2)}</td>
                <td class="border-l text-right" style="padding: 6px 4px; font-weight: bold;">0.00</td>
                <td class="border-l text-right" style="padding: 6px 4px; font-weight: bold;">${totalGst.toFixed(2)}</td>
                <td class="border-l text-right" style="padding: 6px 4px; font-weight: bold;">${beforeRound.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="border-all border-t-0 flex">
            <div class="w-50 border-r" style="padding: 8px;">
              <div class="info-row"><div class="info-col-label">Total GST</div><div class="info-col-sep">-</div><div class="info-col-val text-right" style="padding-right: 50px;">${totalGst.toFixed(2)}</div></div>
              <div class="info-row"><div class="info-col-label">CGST</div><div class="info-col-sep">-</div><div class="info-col-val text-right" style="padding-right: 50px;">${Number(invoice.cgst || 0).toFixed(2)}</div></div>
              <div class="info-row"><div class="info-col-label">SGST</div><div class="info-col-sep">-</div><div class="info-col-val text-right" style="padding-right: 50px;">${Number(invoice.sgst || 0).toFixed(2)}</div></div>
            </div>
            <div class="w-50" style="padding: 8px;">
              <div class="info-row"><div class="info-col-label">Total Amount</div><div class="info-col-val text-right">${beforeRound.toFixed(2)}</div></div>
              <div class="info-row"><div class="info-col-label">(-)Advance</div><div class="info-col-val text-right">${advanceAmount.toFixed(2)}</div></div>
              <div class="info-row"><div class="info-col-label">(-)Discount</div><div class="info-col-val text-right">0.00</div></div>
              <div class="info-row"><div class="info-col-label">Round Off</div><div class="info-col-val text-right">${roundOff.toFixed(2)}</div></div>
              <div class="info-row" style="font-weight: bold; font-size: 14px;"><div class="info-col-label">Net Payable</div><div class="info-col-val text-right">${(totalAmountWithoutFood - advanceAmount).toFixed(2)}</div></div>
            </div>
          </div>

          <div class="border-all border-t-0" style="padding: 8px; font-weight: bold; color: #000; text-transform: uppercase; font-size: 11px;">
            RUPEES ${numberToWords(totalAmountWithoutFood - advanceAmount)} ONLY
          </div>

          <div style="margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 20px;">
            <div style="text-align: center;">
              <div style="border-bottom: 1px solid #000; width: 180px; margin-bottom: 5px;"></div>
              <div style="font-size: 11px; color: #000;">Guest Signature</div>
            </div>
            <div style="text-align: center;">
              <div style="border-bottom: 1px solid #000; width: 180px; margin-bottom: 5px;"></div>
              <div style="font-size: 11px; color: #000;">Cash/Signature<br>Cashier</div>
            </div>
          </div>

        </div>
      </body></html>
    `;
  };

  const handlePrint = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(getInvoiceHtml());
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
    }, 250);
  };

  const handleDownload = () => {
    const html = getInvoiceHtml();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice_${invoice.invoiceNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-4xl flex justify-end gap-3 mb-2">
        <button
          onClick={handlePrint}
          className="bg-white text-gray-800 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-gray-50 transition-colors"
        >
          <Printer className="w-4 h-4" /> Print
        </button>
        <button
          onClick={handleDownload}
          className="bg-white text-gray-800 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" /> HTML
        </button>
        <button
          onClick={onClose}
          className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div
        className="w-full max-w-4xl rounded-sm overflow-hidden bg-white shadow-2xl animate-in fade-in zoom-in duration-300"
        style={{ height: "85vh" }}
      >
        <iframe
          srcDoc={getInvoiceHtml()}
          className="w-full h-full border-0"
          title="Invoice Preview"
        />
      </div>
    </div>
  );
}
