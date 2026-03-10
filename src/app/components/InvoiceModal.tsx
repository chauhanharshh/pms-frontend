import { useState } from "react";
import { usePMS } from "../contexts/PMSContext";
import { formatCurrency, formatDate } from "../utils/format";
import { Eye, Printer, X, Download, Star, Building, User, Mail, Phone, MapPin, Calendar, CreditCard } from "lucide-react";

const GOLD = "#C6A75E";
const DARKGOLD = "#A8832D";

interface InvoiceModalProps {
  invoice: any;
  onClose: () => void;
}

export function InvoiceModal({ invoice, onClose }: InvoiceModalProps) {
  const { hotels, bookings, restaurantOrders, companies } = usePMS();
  const hotel = hotels.find((h) => h.id === invoice.hotelId);
  const bk = bookings.find((b) => b.id === invoice.bill?.bookingId);
  const company = bk?.companyId ? companies.find((c) => c.id === bk.companyId && c.isActive) : null;
  const orders = restaurantOrders.filter((o) => o.bookingId === bk?.id && o.status === "billed");
  const hasRestaurant = orders.length > 0;

  const getInvoiceHtml = () => {
    let restaurantItemsHtml = "";
    if (hasRestaurant) {
      const itemsList = orders.flatMap(o => o.orderItems || []).map(item => `
        <tr>
          <td>${item.menuItem?.itemName || "Item"} ${item.specialNote ? `<br><small>(${item.specialNote})</small>` : ""}</td>
          <td style="text-align:center">${item.quantity}</td>
          <td style="text-align:right">₹${Number(item.price).toFixed(2)}</td>
          <td style="text-align:right">₹${Number(item.itemTotal).toFixed(2)}</td>
        </tr>
      `).join("");

      const restTotal = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const restGst = orders.reduce((sum, o) => sum + Number(o.gst), 0);
      const restSubtotal = orders.reduce((sum, o) => sum + Number(o.subtotal), 0);

      restaurantItemsHtml = `
        <div style="page-break-before: always; margin-top: 40px;">
          <div class="header">
            <h2 style="color:#A8832D">RESTAURANT TAX INVOICE</h2>
            <div>Invoice No: <b>${invoice.invoiceNumber}-REST</b></div>
          </div>
          <table>
            <thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
            <tbody>
              ${itemsList}
              <tr class="total-row">
                <td colspan="3"><b>Subtotal</b></td><td style="text-align:right"><b>₹${restSubtotal.toFixed(2)}</b></td>
              </tr>
              <tr class="total-row">
                <td colspan="3"><b>Service Charge (10%)</b></td><td style="text-align:right"><b>₹${(restSubtotal * 0.1).toFixed(2)}</b></td>
              </tr>
              <tr class="total-row" style="font-size: 1.1rem; color: #A8832D;">
                <td colspan="3"><b>Food Charges Total</b></td><td style="text-align:right"><b>₹${restTotal.toFixed(2)}</b></td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    return `
      <html><head><title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        body { font-family: 'Times New Roman', serif; padding: 40px; color: #1F2937; }
        .header { text-align: center; border-bottom: 2px solid #C6A75E; padding-bottom: 20px; margin-bottom: 20px; }
        .title { font-size: 2.5rem; color: #C6A75E; font-weight: bold; margin-bottom: 5px; }
        .subtitle { font-size: 1.1rem; color: #4B5563; }
        table { width: 100%; border-collapse: collapse; margin-top: 30px; }
        th { background: #faf5e4; padding: 12px; text-align: left; border: 1px solid #e8d48a; color: #A8832D; font-weight: bold; text-transform: uppercase; font-size: 0.9rem; }
        td { padding: 12px; border: 1px solid #e8d48a; vertical-align: top; }
        .total-row { font-weight: bold; background: #faf5e4; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
        .info-box { background: #FFFFFF; padding: 0; border: none; }
        .info-header { font-weight: bold; color: #A8832D; margin-bottom: 8px; border-bottom: 1px solid #e8d48a; padding-bottom: 4px; text-transform: uppercase; font-size: 0.85rem; }
        .footer { margin-top: 60px; text-align: center; color: #A8832D; border-top: 2px solid #C6A75E; padding-top: 20px; font-style: italic; }
        @media print { 
          body { margin: 0; padding: 20px; } 
          @page { size: A4; margin: 10mm; }
          .no-print { display: none; }
        }
      </style></head>
      <body>
        <!-- Page 1: Main Invoice -->
        <div class="header">
          <div class="title">${hotel?.name || ""}</div>
          <div style="font-size: 0.9rem;">${hotel?.address || ""}</div>
          <div style="font-size: 0.9rem;">GST: ${hotel?.gstNumber || ""}</div>
          <h2 style="color:#A8832D; margin-top: 20px; text-transform: uppercase; letter-spacing: 2px;">
            ${company ? 'CORPORATE TAX INVOICE' : 'TAX INVOICE'}
          </h2>
          <div style="margin-top: 10px;">
            Invoice No: <b style="color: #C6A75E">${invoice.invoiceNumber}</b> | Date: ${formatDate((invoice.createdAt as string)?.split("T")[0])}
          </div>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <div class="info-header">${company ? 'Billed To (Corporate)' : 'Billed To'}</div>
            ${company ? `<b>${company.name}</b><br/>Attn: ${bk?.guestName || "Guest"}` : `<b>${bk?.guestName || "Guest"}</b>`}<br/>
            ${company?.gstNumber ? `GST: ${company.gstNumber}<br/>` : ""}
            ${company ? (company.address || "") : (bk?.addressLine || "N/A")}<br/>
            ${company ? (company.phone || "") : (bk?.guestPhone || "N/A")}
          </div>
          <div class="info-box">
            <div class="info-header">Stay Details</div>
            Room: <b>${bk?.room?.roomNumber || "N/A"}</b><br/>
            Check-in: ${formatDate((bk?.checkInDate as string)?.split("T")[0])}<br/>
            Check-out: ${formatDate((bk?.checkOutDate as string)?.split("T")[0])}<br/>
            Guest: ${bk?.guestName || "Guest"}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Room & Services</td>
              <td style="text-align:right">₹${Number(invoice.bill?.roomCharges || 0).toLocaleString()}</td>
            </tr>
            ${Number(invoice.bill?.restaurantCharges) > 0 ? `
            <tr>
              <td>Food Charges</td>
              <td style="text-align:right">₹${Number(invoice.bill?.restaurantCharges).toLocaleString()}</td>
            </tr>` : ""}
            ${Number(invoice.bill?.miscCharges) > 0 ? `
            <tr>
              <td>Miscellaneous Charges</td>
              <td style="text-align:right">₹${Number(invoice.bill?.miscCharges).toLocaleString()}</td>
            </tr>` : ""}
            <tr style="background: #faf5e4; font-weight: bold;">
              <td style="color: #A8832D">Subtotal</td>
              <td style="text-align:right">₹${Number(invoice.subtotal).toLocaleString()}</td>
            </tr>
            <tr>
              <td>CGST</td>
              <td style="text-align:right">₹${Number(invoice.cgst).toLocaleString()}</td>
            </tr>
            <tr>
              <td>SGST</td>
              <td style="text-align:right">₹${Number(invoice.sgst).toLocaleString()}</td>
            </tr>
            <tr class="total-row" style="font-size: 1.2rem;">
              <td style="color: #C6A75E">GRAND TOTAL</td>
              <td style="text-align:right; color: #A8832D"><b>₹${Number(invoice.totalAmount).toLocaleString()}</b></td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <p>Thank you for staying with us! We hope to see you again soon.</p>
          <div style="font-size: 0.8rem; margin-top: 10px; font-style: normal; color: #9CA3AF;">
            This is a computer generated invoice and doesn't require signature.
          </div>
        </div>
        
        <!-- Page 2: Restaurant Invoice if applicable -->
        ${restaurantItemsHtml}
      </body></html>
    `;
  };

  const handlePrint = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(getInvoiceHtml());
    w.document.close();
    w.focus();
    w.print();
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300"
        style={{ background: "white" }}
      >
        {/* Modern Header */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{
            borderBottom: "1px solid #E5E1DA",
            background: "linear-gradient(135deg, #FAF7F2, #FFFFFF)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#C6A75E] to-[#A8832D] text-white">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif" style={{ color: DARKGOLD }}>
                Invoice {invoice.invoiceNumber}
              </h2>
              <p className="text-xs text-gray-400">Preview and Manage Invoice</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all transform hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #C6A75E, #A8832D)",
                boxShadow: "0 4px 12px rgba(198, 167, 94, 0.3)",
              }}
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 active:scale-95"
              style={{
                border: `2px solid ${GOLD}`,
                color: DARKGOLD,
                background: "transparent",
              }}
            >
              <Download className="w-4 h-4" /> Download
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-8 max-h-[75vh] overflow-y-auto bg-[#FAFAF9]">
          {/* Inner "Paper" Sheet */}
          <div className="bg-white p-10 shadow-sm border border-[#E5E1DA] rounded-sm mx-auto max-w-[800px] font-aptos">
            {/* Header section */}
            <div className="text-center border-b-2 border-[#C6A75E] pb-6 mb-8">
              {/*<h1 className="text-4xl font-bold mb-2" style={{ color: GOLD }}>Hotels4U PMS</h1>*/}
              <h2 className="text-4xl font-bold mb-2" style={{ color: GOLD }}>{hotel?.name}</h2>

              <h1 className="text-2xl font-bold mb-2" style={{ color: GOLD }}>A <br /> Unit of Uttarakhand Hotels4U</h1>
              <div className="mt-2 text-sm text-gray-500 flex flex-col gap-0.5">
                <span className="flex font-semibold items-center justify-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {hotel?.address}</span>
                <span className="flex font-semibold items-center justify-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {hotel?.phone || "N/A"}</span>
                <span className="font-bold text-gray-700">GST: {hotel?.gstNumber}</span>
              </div>
              <h2 className="mt-6 text-xl font-bold tracking-[0.2em] text-gray-400 uppercase">
                {company ? "Corporate Tax Invoice" : "Tax Invoice"}
              </h2>
            </div>

            {/* Billing Info */}
            <div className="grid grid-cols-2 gap-12 mb-10">
              <div className="space-y-4">
                <div className="border-b border-[#e8d48a] pb-1">
                  <span className="text-[0.7rem] uppercase font-bold tracking-widest text-[#A8832D]">Billed To</span>
                </div>
                <div>
                  {company ? (
                    <div className="space-y-1">
                      <p className="font-bold text-lg">{company.name}</p>
                      <p className="text-sm text-gray-500">Attn: {bk?.guestName}</p>
                      {company.gstNumber && <p className="text-xs font-bold text-gray-700">GSTIN: {company.gstNumber}</p>}
                      <p className="text-sm text-gray-600 leading-relaxed">{company.address || "N/A"}</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-bold text-lg">{bk?.guestName || "Guest"}</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{bk?.addressLine || "N/A"}</p>
                      <p className="text-sm text-gray-600">{bk?.guestPhone}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-b border-[#e8d48a] pb-1">
                  <span className="text-[0.7rem] uppercase font-bold tracking-widest text-[#A8832D]">Invoice Details</span>
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-gray-400 italic">Invoice No:</span>
                  <span className="font-bold text-right">{invoice.invoiceNumber}</span>

                  <span className="text-gray-400 italic">Date:</span>
                  <span className="text-right">{formatDate((invoice.createdAt as string)?.split("T")[0])}</span>

                  <span className="text-gray-400 italic">Room Number:</span>
                  <span className="font-bold text-right">{bk?.room?.roomNumber || "N/A"}</span>

                  <span className="text-gray-400 italic">Period:</span>
                  <span className="text-right text-[0.75rem]">
                    {formatDate((bk?.checkInDate as string)?.split("T")[0])} - {formatDate((bk?.checkOutDate as string)?.split("T")[0])}
                  </span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="mb-10">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#FAF7F2]">
                    <th className="px-4 py-3 text-left border border-[#e8d48a]" style={{ color: DARKGOLD }}>Description</th>
                    <th className="px-4 py-3 text-right border border-[#e8d48a]" style={{ color: DARKGOLD }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="group">
                    <td className="px-4 py-4 border border-[#e8d48a] text-gray-700">Room & Primary Services</td>
                    <td className="px-4 py-4 border border-[#e8d48a] text-right text-gray-700">₹{Number(invoice.bill?.roomCharges || 0).toLocaleString()}</td>
                  </tr>
                  {Number(invoice.bill?.restaurantCharges) > 0 && (
                    <tr>
                      <td className="px-4 py-4 border border-[#e8d48a] text-gray-700">Restaurant / Food & Beverage</td>
                      <td className="px-4 py-4 border border-[#e8d48a] text-right text-gray-700">₹{Number(invoice.bill?.restaurantCharges).toLocaleString()}</td>
                    </tr>
                  )}
                  {Number(invoice.bill?.miscCharges) > 0 && (
                    <tr>
                      <td className="px-4 py-4 border border-[#e8d48a] text-gray-700">Miscellaneous Guest Services</td>
                      <td className="px-4 py-4 border border-[#e8d48a] text-right text-gray-700">₹{Number(invoice.bill?.miscCharges || 0).toLocaleString()}</td>
                    </tr>
                  )}
                  <tr className="bg-[#FAF7F2] font-bold">
                    <td className="px-4 py-3 border border-[#e8d48a]" style={{ color: DARKGOLD }}>SUBTOTAL</td>
                    <td className="px-4 py-3 border border-[#e8d48a] text-right">₹{Number(invoice.subtotal).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border border-[#e8d48a] text-sm text-gray-500 italic">Central Goods & Service Tax (CGST)</td>
                    <td className="px-4 py-2 border border-[#e8d48a] text-right text-gray-600">₹{Number(invoice.cgst).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border border-[#e8d48a] text-sm text-gray-500 italic">State Goods & Service Tax (SGST)</td>
                    <td className="px-4 py-2 border border-[#e8d48a] text-right text-gray-600">₹{Number(invoice.sgst).toLocaleString()}</td>
                  </tr>
                  <tr className="bg-[#FAF7F2]" style={{ fontSize: "1.25rem" }}>
                    <td className="px-4 py-4 border border-[#e8d48a] font-bold" style={{ color: GOLD }}>GRAND TOTAL</td>
                    <td className="px-4 py-4 border border-[#e8d48a] text-right font-bold" style={{ color: DARKGOLD }}>₹{Number(invoice.totalAmount).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="text-center pt-8 border-t-2 border-[#C6A75E]">
              <p className="text-lg italic mb-2" style={{ color: DARKGOLD }}>"Service with Excellence, Stay with Comfort"</p>
              <p className="text-sm text-gray-500">Thank you for choosing Hotels4U. We hope you have a pleasant journey ahead.</p>
              <div className="mt-8 pt-8 flex justify-between items-end opacity-40 grayscale">
                <div className="text-center">

                  <p className="text-sm text-gray-500"><center>This is a computer generated invoice and doesn't require signature.</center></p>
                </div>
              </div>
            </div>

            {/* Summary stats below paper */}
            <div className="mt-8 flex justify-center gap-6">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className={`w-3 h-3 rounded-full ${invoice.status === 'issued' ? 'bg-amber-400' : 'bg-green-500'}`}></span>
                Status: <span className="font-bold uppercase">{invoice.status}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CreditCard className="w-4 h-4" />
                Channel: <span className="font-bold uppercase">{bk?.source || "Direct"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
