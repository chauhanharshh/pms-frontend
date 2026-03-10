import { useState } from "react";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS, Invoice } from "../contexts/PMSContext";
import {
  formatCurrency,
  formatDate,
} from "../utils/format";
import { Receipt, Plus, Eye, Printer, X, Check, CreditCard, Download } from "lucide-react";
import { InvoiceModal } from "../components/InvoiceModal";

const GOLD = "var(--accent-color, #C6A75E)";
const DARKGOLD = "var(--primary, #A8832D)";

function PayInvoiceModal({
  invoice,
  onClose,
  onPay
}: {
  invoice: any;
  onClose: () => void;
  onPay: (invoiceId: string, paymentMode: string) => void;
}) {
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi">("cash");
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      await onPay(invoice.id, paymentMode);
    } finally {
      setIsProcessing(false);
    }
  };

  const outstanding = Number(invoice.bill?.balanceDue || 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: "white", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
      >
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{
            borderBottom: "2px solid #E5E1DA",
            background: "linear-gradient(135deg, #FFFFFF, #FFFFFF)",
          }}
        >
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            <h2
              className="font-semibold text-lg"
              style={{ fontFamily: "Times New Roman, serif", color: DARKGOLD }}
            >
              Settle Invoice
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-lg hover:bg-red-50 text-red-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: "#6B7280" }}>
              Outstanding Balance
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: GOLD }}>
              {formatCurrency(outstanding)}
            </p>
            <p className="text-sm mt-1" style={{ color: "#1F2937" }}>
              Invoice {invoice.invoiceNumber}
            </p>
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: DARKGOLD }}
            >
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["cash", "upi"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className="flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all"
                  style={{
                    borderColor: paymentMode === mode ? GOLD : "#E5E1DA",
                    background: paymentMode === mode ? "rgba(198, 167, 94, 0.05)" : "white",
                    color: paymentMode === mode ? DARKGOLD : "#6B7280",
                  }}
                >
                  <span className="font-semibold text-sm uppercase">
                    {mode}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handlePay}
            disabled={isProcessing || outstanding <= 0}
            className="w-full py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2 mt-2 transition-opacity"
            style={{
              background: "linear-gradient(135deg, #16a34a, #15803d)",
              opacity: isProcessing ? 0.7 : 1,
            }}
          >
            {isProcessing ? "Processing..." : `Mark as Paid (${formatCurrency(outstanding)})`}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Invoices() {
  const { user, currentHotelId } = useAuth();
  const { invoices, addInvoice, updateInvoice, payInvoice, bills, bookings, hotels } = usePMS();
  const isAdmin = user?.role === "admin";
  const hotelFilter = currentHotelId;
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [payTarget, setPayTarget] = useState<Invoice | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [genForm, setGenForm] = useState({ billId: "", guestAddress: "" });

  const filtered = invoices.filter(
    (inv) => (!hotelFilter || inv.hotelId === hotelFilter) && inv.type !== "RESTAURANT",
  );

  const availableBills = bills.filter((b) => {
    const alreadyHasInvoice = invoices.some((inv) => inv.billId === b.id);
    return !alreadyHasInvoice && (isAdmin || b.hotelId === user?.hotelId);
  });

  const handleGenerate = async () => {
    if (!genForm.billId) return;
    try {
      const newInvoice = await addInvoice({
        billId: genForm.billId,
        guestAddress: genForm.guestAddress
      });
      setShowGenerate(false);
      setGenForm({ billId: "", guestAddress: "" });

      // Instantly open the invoice preview
      if (newInvoice) {
        setViewInvoice(newInvoice);
      }
    } catch (err: any) {
      alert("Error generating invoice: " + (err.response?.data?.message || err.message));
    }
  };

  const handlePaySubmit = async (invoiceId: string, paymentMode: string) => {
    try {
      await payInvoice(invoiceId, paymentMode);
      setPayTarget(null);
    } catch (err: any) {
      alert("Error securely settling payment: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <AppLayout title="Invoices">
      <div className="space-y-5 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div />
          <button
            onClick={() => setShowGenerate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{
              background: "linear-gradient(135deg, #C6A75E, #A8832D)",
              boxShadow: "0 2px 8px #E5E1DA",
            }}
          >
            <Plus className="w-4 h-4" /> Generate Invoice
          </button>
        </div>

        {/* Table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "white",
            border: "1px solid #E5E1DA",
            boxShadow: "0 2px 12px rgba(184,134,11,0.06)",
          }}
        >
          <div
            className="px-6 py-4 flex items-center gap-2"
            style={{
              borderBottom: "2px solid #E5E1DA",
              background: "linear-gradient(135deg, #FFFFFF, #FFFFFF)",
            }}
          >
            <Receipt className="w-5 h-5" style={{ color: GOLD }} />
            <h2
              className="font-semibold"
              style={{ fontFamily: "Times New Roman, serif", color: DARKGOLD }}
            >
              Invoice History ({filtered.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#FFFFFF" }}>
                  {[
                    "Invoice No",
                    "Guest",
                    "Room",
                    "Hotel",
                    "Check-in",
                    "Check-out",
                    "Subtotal",
                    "Tax",
                    "Total",
                    "Status",
                    "Actions",
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{
                        color: DARKGOLD,
                        borderBottom: "2px solid #E5E1DA",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv: any) => {
                  const bk = bookings.find((b) => b.id === inv.bill?.bookingId);
                  return (
                    <tr
                      key={inv.id}
                      style={{ borderBottom: "1px solid rgba(184,134,11,0.07)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#FFFFFF")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "white")
                      }
                    >
                      <td
                        className="px-4 py-3 text-sm font-mono font-semibold"
                        style={{ color: GOLD }}
                      >
                        {inv.invoiceNumber}
                      </td>
                      <td
                        className="px-4 py-3 text-sm font-medium"
                        style={{ color: "#1F2937" }}
                      >
                        {bk?.guestName || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">{bk?.room?.roomNumber || "—"}</td>
                      <td
                        className="px-4 py-3 text-xs"
                        style={{ color: "#6B7280" }}
                      >
                        {hotels.find((h) => h.id === inv.hotelId)?.name}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {formatDate((bk?.checkInDate as string)?.split("T")[0])}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {formatDate((bk?.checkOutDate as string)?.split("T")[0])}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatCurrency(Number(inv.subtotal))}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatCurrency(Number(inv.cgst) + Number(inv.sgst) + Number(inv.igst))}
                      </td>
                      <td
                        className="px-4 py-3 text-sm font-bold"
                        style={{ color: GOLD }}
                      >
                        {formatCurrency(Number(inv.totalAmount))}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            background:
                              inv.status === "paid" ? "#dcfce7" : "#fef2f2",
                            color:
                              inv.status === "paid" ? "#166534" : "#991b1b",
                          }}
                        >
                          {inv.status === "paid" ? "PAID" : "UNPAID"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {inv.status !== "paid" && (
                            <button
                              onClick={() => setPayTarget(inv)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                              style={{ background: "#16a34a" }}
                            >
                              Pay
                            </button>
                          )}
                          <button
                            onClick={() => setViewInvoice(inv)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-blue-50"
                            style={{ color: "#3b82f6" }}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={11}
                      className="py-12 text-center text-sm"
                      style={{ color: "#9CA3AF" }}
                    >
                      No invoices found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Generate Modal */}
        {showGenerate && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            <div
              className="w-full max-w-md rounded-2xl"
              style={{ background: "white" }}
            >
              <div
                className="px-6 py-4 flex items-center justify-between"
                style={{
                  borderBottom: "2px solid #E5E1DA",
                  background: "#FFFFFF",
                }}
              >
                <h2
                  style={{
                    fontFamily: "Times New Roman, serif",
                    color: DARKGOLD,
                  }}
                >
                  Generate Invoice
                </h2>
                <button
                  onClick={() => setShowGenerate(false)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Select Bill
                  </label>
                  <select
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={genForm.billId}
                    onChange={(e) =>
                      setGenForm((f) => ({ ...f, billId: e.target.value }))
                    }
                  >
                    <option value="">-- Choose a bill --</option>
                    {availableBills.map((b: any) => {
                      const bk = bookings.find((bk) => bk.id === b.bookingId);
                      return (
                        <option key={b.id} value={b.id}>
                          {bk?.guestName || "Guest"} — Room {bk?.room?.roomNumber || "N/A"} (
                          {formatCurrency(Number(b.totalAmount))})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Guest Address
                  </label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    placeholder="Guest billing address"
                    value={genForm.guestAddress}
                    onChange={(e) =>
                      setGenForm((f) => ({
                        ...f,
                        guestAddress: e.target.value,
                      }))
                    }
                  />
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={!genForm.billId}
                  className="w-full py-2.5 rounded-lg font-medium text-white flex items-center justify-center gap-2"
                  style={{
                    background: genForm.billId
                      ? "linear-gradient(135deg, #C6A75E, #A8832D)"
                      : "#d1d5db",
                    cursor: genForm.billId ? "pointer" : "not-allowed",
                  }}
                >
                  <Check className="w-4 h-4" /> Generate Invoice
                </button>
              </div>
            </div>
          </div>
        )}

        {payTarget && (
          <PayInvoiceModal
            invoice={payTarget}
            onClose={() => setPayTarget(null)}
            onPay={handlePaySubmit}
          />
        )}

        {viewInvoice && (
          <InvoiceModal
            invoice={viewInvoice}
            onClose={() => setViewInvoice(null)}
          />
        )}
      </div>
    </AppLayout>
  );
}
