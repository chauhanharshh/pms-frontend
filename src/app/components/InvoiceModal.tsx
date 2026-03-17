import { useMemo } from "react";
import { resolveBrandName } from "../utils/branding";
import { printHtml } from "../utils/print";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import { Printer, X, Download } from "lucide-react";
import { numberToWords } from "../utils/numberToWords";

interface InvoiceModalProps {
  invoice: any;
  onClose: () => void;
}

export function InvoiceModal({ invoice, onClose }: InvoiceModalProps) {
  const { hotels, bookings, activeHotel } = usePMS() as any;
  const { user } = useAuth();

  const bk = bookings.find(
    (b: any) =>
      b.id === invoice.bill?.bookingId ||
      b.id === invoice.bill?.booking?.id
  );

  const invoiceHotelId =
    invoice.hotelId ||
    invoice.bill?.hotelId ||
    invoice.bill?.booking?.hotelId ||
    (invoice as any)?.hotel?.id ||
    (invoice as any)?.hotel?._id ||
    null;

  const hotel: any =
    hotels.find((h: any) =>
      String(h.id) === String(invoiceHotelId) ||
      String(h._id) === String(invoiceHotelId)
    ) ||
    (invoice as any)?.hotel ||
    (invoice as any)?.bill?.hotel ||
    (invoice as any)?.bill?.booking?.hotel ||
    (user as any)?.hotel ||
    (user as any)?.hotelData ||
    (user as any)?.property ||
    null;

  console.log("hotel resolved:", hotel);
  console.log("activeHotel:", activeHotel);
  console.log("hotels in context:", hotels);

  const hotelFields = useMemo(() => {
    const name =
      (hotel as any)?.brandName ||
      (hotel as any)?.name ||
      (hotel as any)?.hotelName ||
      (invoice as any)?.hotelName ||
      "NA";

    const phone =
      (hotel as any)?.phone ||
      (hotel as any)?.phoneNumber ||
      (hotel as any)?.contactNo ||
      (hotel as any)?.contact ||
      (hotel as any)?.contactNumber ||
      (hotel as any)?.mobile ||
      "NA";

    const gst =
      (hotel as any)?.gstNumber ||
      (hotel as any)?.gstin ||
      (hotel as any)?.gst_number ||
      (hotel as any)?.gstNo ||
      (hotel as any)?.gst ||
      "NA";

    const rawAddress =
      (hotel as any)?.address ||
      (hotel as any)?.addressLine ||
      (hotel as any)?.fullAddress ||
      (hotel as any)?.location ||
      (hotel as any)?.hotelAddress ||
      [(hotel as any)?.city, (hotel as any)?.state]
        .filter(Boolean).join(", ") ||
      "NA";

    const addressParts = rawAddress
      .split(",")
      .map((p: string) => p.trim())
      .filter(Boolean);

    return {
      name,
      phone,
      gst,
      addressLine1: addressParts[0] || "NA",
      addressLine2: addressParts.slice(1).join(", ") || "",
      isComposition:
        (hotel as any)?.isComposition === true ||
        (hotel as any)?.isCompositionScheme === true ||
        String((hotel as any)?.taxType || "").toLowerCase() === "composition",
    };
  }, [hotel, invoice]);

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

  // Calculate GST percentage from actual invoice tax amounts.
  const taxRate = subtotal > 0 ? (totalGst / subtotal) * 100 : 0;
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
        <td class="border-b" style="padding: 6px 4px; border-right: 1px solid #C6A75E;">${item.date}</td>
        <td class="border-b" style="padding: 6px 4px; border-right: 1px solid #C6A75E; white-space: pre-line; vertical-align: middle;">${item.type}</td>
        <td class="border-b" style="padding: 6px 4px; border-right: 1px solid #C6A75E;">${item.desc}</td>
        <td class="border-b text-right" style="padding: 6px 4px; border-right: 1px solid #C6A75E;">${item.charges.toFixed(2)}</td>
        <td class="border-b text-right" style="padding: 6px 4px; border-right: 1px solid #C6A75E;">${item.discount.toFixed(2)}</td>
        <td class="border-b text-right" style="padding: 6px 4px; border-right: 1px solid #C6A75E;">${item.gst.toFixed(2)}</td>
        <td class="border-b text-right" style="padding: 6px 4px;">${item.total.toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <html><head><title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Courier New', Courier, monospace; font-size: 14px; color: #000; margin: 0; padding: 0; }
        .invoice-wrapper { max-width: 900px; margin: 0 auto; padding: 20px; background: #fff; position: relative; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        table { width: 100%; border-collapse: collapse; }
        .border-all { border: 1.5px solid #C6A75E; }
        .border-b { border-bottom: 1px solid #C6A75E; }
        .border-l { border-left: 1px solid #C6A75E; }
        .border-r { border-right: 1px solid #C6A75E; }
        
        .hotel-name { font-size: 22px; font-weight: bold; margin: 0; text-transform: lowercase; color: #555; }
        .hotel-info { font-size: 14px; margin: 2px 0; font-family: 'Courier New', Courier, monospace; }
        .proforma-title { font-size: 48px; font-weight: bold; margin: 20px 0; font-family: serif; letter-spacing: 1px; }
        
        .info-box { border: 1.5px solid #C6A75E; display: flex; margin-bottom: 15px; }
        .info-col { width: 50%; padding: 8px 12px; }
        .info-row { display: flex; margin-bottom: 4px; line-height: 1.2; }
        .info-label { width: 140px; }
        .info-val { flex: 1; }
        
        .table-header th { padding: 8px 4px; text-align: left; font-size: 13px; border-bottom: 1.5px solid #C6A75E; border-right: 1px solid #C6A75E; }
        .table-header th:last-child { border-right: none; }
        
        .totals-section { border: 1.5px solid #C6A75E; display: flex; border-top: none; }
        .totals-col-left { width: 50%; border-right: 1.5px solid #C6A75E; padding: 8px 12px; }
        .totals-col-right { width: 50%; padding: 8px 12px; }
        .totals-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        
        .rupees-box { border: 1.5px solid #C6A75E; border-top: none; padding: 10px 12px; font-weight: bold; font-size: 13px; text-transform: uppercase; }
        
        .signature-section { margin-top: 80px; display: flex; justify-content: space-between; padding: 0 40px; }
        .sig-box { text-align: center; width: 250px; }
        .sig-line { border-top: 1.5px solid #000; margin-bottom: 8px; }
        
        @media print { 
          body { padding: 0; }
          .invoice-wrapper { width: 100%; max-width: none; border: none; }
          @page { size: portrait; margin: 10mm; }
        }
      </style></head>
      <body>
        <div class="invoice-wrapper" style="border: 1px solid #C6A75E; min-height: 100vh;">
          <div class="text-center" style="margin-bottom: 10px;">
            <div class="hotel-name">${hotelFields.name}</div>
            <div class="hotel-info">${hotelFields.addressLine1}</div>
            ${hotelFields.addressLine2 ? `<div class="hotel-info">${hotelFields.addressLine2}</div>` : ""}
            <div class="hotel-info">Contact No:- ${hotelFields.phone}</div>
            <div class="hotel-info">GST Number: ${hotelFields.gst}</div>
            <div class="proforma-title">PROFORMA TAX INVOICE</div>
          </div>

          <div class="info-box">
            <div class="info-col" style="border-right: 1.5px solid #C6A75E;">
              <div class="info-row"><div class="info-label">Guest Name</div><div class="info-val">- ${bk?.guestName || "-"}</div></div>
              <div class="info-row"><div class="info-label">Address</div><div class="info-val">- ${bk?.addressLine || "-"}</div></div>
              <div class="info-row"><div class="info-label">Contact No</div><div class="info-val">- ${bk?.guestPhone || "-"}</div></div>
              <div class="info-row"><div class="info-label">Room Nos</div><div class="info-val">- ${bk?.room?.roomNumber || "-"}</div></div>
              <div class="info-row"><div class="info-label">State</div><div class="info-val">- ${hotel?.state || "NA"}</div></div>
            </div>
            <div class="info-col">
              <div class="info-row"><div class="info-label">Bill Date</div><div class="info-val">- ${billDateStr}</div></div>
              <div class="info-row"><div class="info-label">Bill No.</div><div class="info-val">- ${invoice.invoiceNumber || "-"}</div></div>
              <div class="info-row"><div class="info-label">Reg. No.</div><div class="info-val">- ${bk?.id?.slice(-5) || "-"}</div></div>
              <div class="info-row"><div class="info-label">Plan</div><div class="info-val">- NA</div></div>
              <div class="info-row"><div class="info-label">PAX</div><div class="info-val">- Adults ${bk?.adults || 0},Child ${bk?.children || 0}</div></div>
              <div class="info-row"><div class="info-label">Arrival Date</div><div class="info-val">- ${arrivalDateStr}</div></div>
              <div class="info-row"><div class="info-label">Departure Date</div><div class="info-val">- ${departureDateStr}</div></div>
            </div>
          </div>

          <table class="border-all">
            <thead class="table-header">
              <tr>
                <th style="width: 15%;">Date</th>
                <th style="width: 12%;">Charges Type</th>
                <th style="width: 33%;">Description</th>
                <th style="text-align: right; width: 10%;">Charges</th>
                <th style="text-align: right; width: 10%;">Discount</th>
                <th style="text-align: right; width: 10%;">GST</th>
                <th style="text-align: right; width: 10%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr style="font-weight: bold; font-size: 16px;">
                <td colspan="3" style="padding: 8px 4px; border-right: 1.5px solid #C6A75E;">Total</td>
                <td style="padding: 8px 4px; text-align: right; border-right: 1.5px solid #C6A75E;">${subtotal.toFixed(2)}</td>
                <td style="padding: 8px 4px; text-align: right; border-right: 1.5px solid #C6A75E;">0.00</td>
                <td style="padding: 8px 4px; text-align: right; border-right: 1.5px solid #C6A75E;">${totalGst.toFixed(2)}</td>
                <td style="padding: 8px 4px; text-align: right;">${beforeRound.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals-section">
            <div class="totals-col-left">
              <div class="totals-row"><div>Total GST</div><div>${totalGst.toFixed(2)}</div></div>
              <div class="totals-row"><div>CGST</div><div>${Number(invoice.cgst || 0).toFixed(2)}</div></div>
              <div class="totals-row"><div>SGST</div><div>${Number(invoice.sgst || 0).toFixed(2)}</div></div>
            </div>
            <div class="totals-col-right">
              <div class="totals-row"><div>Total Amount</div><div>${beforeRound.toFixed(2)}</div></div>
              <div class="totals-row"><div>(-) Advance</div><div>${advanceAmount.toFixed(2)}</div></div>
              <div class="totals-row"><div>(-) Discount</div><div>0.00</div></div>
              <div class="totals-row"><div>Round Off</div><div>${roundOff.toFixed(2)}</div></div>
              <div class="totals-row" style="font-weight: bold; margin-top: 4px;"><div>Net Payable</div><div>${totalAmountWithoutFood - advanceAmount}.00</div></div>
            </div>
          </div>

          <div class="rupees-box">
            RUPEES ${numberToWords(totalAmountWithoutFood - advanceAmount)} ONLY
          </div>

          <div class="signature-section">
            <div class="sig-box">
              <div class="sig-line"></div>
              <div>Guest Signature</div>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <div>Cash/Signature</div>
              <div>Cashier</div>
            </div>
          </div>
        </div>
      </body></html>
    `;
  };


  const handlePrint = () => {
    printHtml(getInvoiceHtml());
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
