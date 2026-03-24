import { useEffect, useState } from "react";
import { exportToCSV, printTable } from '../utils/tableExport';
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import { Bill, BillItem } from "../contexts/PMSContext";
import { formatCurrency as utilFormatCurrency, formatDate as utilFormatDate } from "../utils/format";
import { calculateRoomTax } from "../utils/tax";
import { calculateStayDays, isLateCheckout as isLateCheckoutByTime } from "../utils/stayCalculation";
import {
  FileText,
  Search,
  Filter,
  Edit3,
  X,
  Plus,
  Trash2,
  Save,
  Eye,
  Download,
  Printer,
} from "lucide-react";
import { BookingPreviewModal } from "../components/BookingPreviewModal";
import { Room, Booking } from "../contexts/PMSContext";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { BedDouble, Clock, Phone } from "lucide-react";

const GOLD = "var(--accent-color, #C6A75E)";
const DARKGOLD = "var(--primary, #A8832D)";

function EditBillModal({
  bill,
  onClose,
  onSave,
}: {
  bill: Bill;
  onClose: () => void;
  onSave: (updates: Partial<Bill>) => void;
}) {
  const b = bill as any;
  const [items, setItems] = useState<BillItem[]>(b.items || []);
  const [discount, setDiscount] = useState(b.discount || 0);

  const roomSubtotal = items.filter(i => i.type === "room").reduce((s, i) => s + i.amount, 0);
  const otherSubtotal = items.filter(i => i.type !== "room").reduce((s, i) => s + i.amount, 0);

  const nights = b?.booking?.checkInDate && b?.booking?.checkOutDate
    ? calculateStayDays(
      b.booking.checkInDate,
      b.booking?.checkInTime,
      b.booking.checkOutDate,
      b.booking?.checkOutTime,
    )
    : 1;
  const isLateCheckout = () => {
    return isLateCheckoutByTime(String(b?.booking?.checkOutTime || ""));
  };
  const effectiveDailyRent = Math.max(0, roomSubtotal) / Math.max(1, nights);
  const taxRatePercent = calculateRoomTax(effectiveDailyRent, 1).rate;
  const taxAmount = Math.max(0, roomSubtotal) * (taxRatePercent / 100);
  const total = Math.max(0, roomSubtotal + otherSubtotal - discount) + taxAmount;

  const updateItem = (
    idx: number,
    field: keyof BillItem,
    value: string | number,
  ) => {
    const updated = [...items];
    (updated[idx] as any)[field] = value;
    if (field === "quantity" || field === "unitPrice") {
      updated[idx].amount = updated[idx].quantity * updated[idx].unitPrice;
    }
    setItems(updated);
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `new_${Date.now()}`,
        description: "",
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        type: "misc",
      },
    ]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    onSave({
      items,
      discount,
      taxAmount,
      totalAmount: total,
      updatedAt: new Date().toISOString().split("T")[0],
    } as any);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{
          background: "white",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{
            borderBottom: "2px solid #E5E1DA",
            background: "linear-gradient(135deg, #FFFFFF, #FFFFFF)",
          }}
        >
          <h2
            style={{
              fontFamily: "Times New Roman, serif",
              color: DARKGOLD,
              fontSize: "1.25rem",
            }}
          >
            Edit Bill — {(bill as any).guestName || "Guest"} (Room {(bill as any).roomNumber || "N/A"})
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Items Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm" style={{ color: DARKGOLD }}>
                Bill Items
              </h3>
              <button
                onClick={addItem}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                style={{
                  background: "linear-gradient(135deg, #C6A75E, #A8832D)",
                }}
              >
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>
            <div
              className="border rounded-xl overflow-hidden"
              style={{ borderColor: "#E5E1DA" }}
            >
              <table className="w-full">
                <thead style={{ background: "#FFFFFF" }}>
                  <tr>
                    {[
                      "Description",
                      "Type",
                      "Qty",
                      "Unit Price",
                      "Amount",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-xs font-semibold text-left"
                        style={{ color: DARKGOLD }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr
                      key={item.id}
                      style={{ borderTop: "1px solid rgba(229,225,218,0.5)" }}
                    >
                      <td className="px-3 py-2">
                        <input
                          className="w-full text-sm px-2 py-1 rounded outline-none"
                          style={{
                            border: "1px solid #E5E1DA",
                            background: item.amount < 0 ? "#fff5f5" : "white",
                          }}
                          value={item.description}
                          onChange={(e) =>
                            updateItem(idx, "description", e.target.value)
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          className="text-xs px-2 py-1 rounded outline-none"
                          style={{
                            border: "1px solid #E5E1DA",
                            color: DARKGOLD,
                          }}
                          value={item.type}
                          onChange={(e) =>
                            updateItem(idx, "type", e.target.value)
                          }
                        >
                          <option value="room">Room</option>
                          <option value="restaurant">Restaurant</option>
                          <option value="misc">Misc</option>
                          <option value="advance">Advance</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          className="w-16 text-sm px-2 py-1 rounded outline-none text-center"
                          style={{ border: "1px solid #E5E1DA" }}
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              idx,
                              "quantity",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          className="w-24 text-sm px-2 py-1 rounded outline-none"
                          style={{ border: "1px solid #E5E1DA" }}
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(
                              idx,
                              "unitPrice",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </td>
                      <td
                        className="px-3 py-2 text-sm font-medium"
                        style={{
                          color: item.amount < 0 ? "#dc2626" : DARKGOLD,
                        }}
                      >
                        {utilFormatCurrency(item.amount)}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => removeItem(idx)}
                          className="p-1 rounded hover:bg-red-50 text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Discount & Totals */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: DARKGOLD }}
              >
                Discount (₹)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 rounded-lg outline-none"
                style={{
                  border: `2px solid #E5E1DA`,
                  background: "#FFFFFF",
                }}
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                onFocus={(e) => (e.target.style.borderColor = GOLD)}
                onBlur={(e) =>
                  (e.target.style.borderColor = "#E5E1DA")
                }
              />
            </div>
            <div
              className="rounded-xl p-4 space-y-1"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E5E1DA",
              }}
            >
              <div className="flex justify-between text-sm">
                <span style={{ color: "#6B7280" }}>Subtotal</span>
                <span>{utilFormatCurrency(roomSubtotal + otherSubtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "#6B7280" }}>Discount</span>
                <span style={{ color: "#dc2626" }}>
                  -{utilFormatCurrency(discount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "#6B7280" }}>CGST ({(taxRatePercent / 2).toFixed(2)}%)</span>
                <span>{utilFormatCurrency(taxAmount / 2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "#6B7280" }}>SGST ({(taxRatePercent / 2).toFixed(2)}%)</span>
                <span>{utilFormatCurrency(taxAmount / 2)}</span>
              </div>
              <div
                className="flex justify-between font-bold pt-1 border-t"
                style={{
                  borderColor: "#E5E1DA",
                  color: DARKGOLD,
                  fontSize: "1rem",
                }}
              >
                <span>Total</span>
                <span>{utilFormatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {isLateCheckout() && (
            <p
              className="text-xs italic"
              style={{ color: "#555", borderTop: "1px solid #ccc", paddingTop: "6px" }}
            >
              * Late Check-Out Charge Applied: Guest checked out at {b.booking.checkOutTime} (after 12:00 PM noon). Extra day charge has been added as per hotel policy.
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm"
              style={{
                border: "1px solid #E5E1DA",
                color: DARKGOLD,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white"
              style={{
                background: "linear-gradient(135deg, #C6A75E, #A8832D)",
              }}
            >
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Bills() {
  const { user, currentHotelId, setCurrentHotelId } = useAuth();
  const { bills, updateBill, hotels, bookings } = usePMS();
  const isAdmin = user?.role === "admin";
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [adminHotelFilter, setAdminHotelFilter] = useState("all");
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [previewBooking, setPreviewBooking] = useState<Booking | null>(null);
  const isMobile = useMediaQuery("(max-width: 1024px)");

  useEffect(() => {
    console.log("Bill statuses:", bills.map((b: any) => b?.status));
  }, [bills]);

  const hotelFilter = isAdmin ? adminHotelFilter : (currentHotelId || user?.hotelId || "");

  const filtered = bills.filter((bill) => {
    const b = bill as any;
    const booking = bookings.find(bk => bk.id === b.bookingId);
    const guestName = booking?.guestName || b.guestName || "Unknown Guest";
    const roomNumber = booking?.room?.roomNumber || booking?.roomId?.slice(-4) || b.roomNumber || "N/A";
    const statusValues = [b.status, b.paymentStatus, b.billStatus]
      .map((value) => String(value || "").trim().toLowerCase())
      .filter(Boolean);

    const matchHotel = hotelFilter === "all" || b.hotelId === hotelFilter;
    const selectedStatus = String(filterStatus || "").trim().toLowerCase();
    const unpaidStatuses = ["pending", "unpaid", "due", "outstanding", "partial"];
    const paidStatuses = ["paid", "completed", "settled", "cleared"];

    const matchStatus =
      selectedStatus === "all" ||
      (selectedStatus === "unpaid" &&
        statusValues.some((value) => unpaidStatuses.includes(value))) ||
      (selectedStatus === "paid" &&
        statusValues.some((value) => paidStatuses.includes(value)));
    const matchSearch =
      guestName.toLowerCase().includes(search.toLowerCase()) ||
      String(roomNumber).includes(search);
    return matchHotel && matchStatus && matchSearch;
  });

  const statusBadge = (status: Bill["status"]) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: "#fef9c3", text: "#854d0e", label: "Pending" },
      partial: { bg: "#dbeafe", text: "#1e40af", label: "Partial" },
      paid: { bg: "#dcfce7", text: "#166534", label: "Paid" },
      finalized: { bg: "#f3e8ff", text: "#6b21a8", label: "Finalized" },
    };
    const s = map[status];
    return (
      <span
        className="px-2 py-0.5 rounded-full text-xs font-medium"
        style={{ background: s.bg, color: s.text }}
      >
        {s.label}
      </span>
    );
  };

  return (
    <AppLayout title="Bills Management">
      <div className="space-y-5 max-w-7xl">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              style={{ color: GOLD }}
            />
            <input
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                border: `2px solid #E5E1DA`,
                background: "white",
              }}
              placeholder="Search guest / room…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              className="px-3 py-2.5 rounded-xl text-sm outline-none appearance-none flex-1 sm:flex-none"
              style={{
                border: "2px solid #E5E1DA",
                background: "white",
                color: DARKGOLD,
              }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Status (All)</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
            {isAdmin && (
              <select
                className="px-3 py-2.5 rounded-xl text-sm outline-none appearance-none flex-1 sm:flex-none"
                style={{
                  border: "2px solid #E5E1DA",
                  background: "white",
                  color: DARKGOLD,
                }}
                value={adminHotelFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setAdminHotelFilter(val);
                }}
              >
                <option value="all">Hotels (All)</option>
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Bills Table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "white",
            border: "1px solid #E5E1DA",
            boxShadow: "0 2px 12px rgba(184,134,11,0.06)",
          }}
        >
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{
              borderBottom: "2px solid #E5E1DA",
              background: "linear-gradient(135deg, #FFFFFF, #FFFFFF)",
            }}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" style={{ color: GOLD }} />
              <h2
                className="font-semibold"
                style={{
                  fontFamily: "Times New Roman, serif",
                  color: DARKGOLD,
                }}
              >
                Bills ({filtered.length})
              </h2>
            </div>
            {!isAdmin && (
              <p
                className="text-xs px-3 py-1 rounded-full"
                style={{ background: "#fef3c7", color: "#92400e" }}
              >
                View only — Contact admin to edit finalized bills
              </p>
            )}
          </div>
          {!isMobile && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginBottom: '12px', marginTop: '8px', paddingRight: '24px' }}>
              <button
                onClick={() => {
                  const dataToExport = filtered.map((b: any) => {
                    const hotelName = hotels.find((h: any) => h.id === b.hotelId)?.name || "—";
                    return {
                      "Guest Name": b.guestName || b.booking?.guestName || "—",
                      "Room": b.roomNumber || b.booking?.roomNumber || "—",
                      ...(isAdmin ? { "Hotel": hotelName } : {}),
                      "Booking Ref": (b.booking?.id || b.bookingId || "").split("-").pop()?.toUpperCase() || "—",
                      "Invoice No": b.invoice?.invoiceNumber || "—",
                      "Room Charges": b.roomCharges,
                      "Restaurant": b.restaurantCharges,
                      "Misc": b.miscCharges,
                      "Tax": b.taxAmount,
                      "Total": b.totalAmount,
                      "Paid": b.paidAmount,
                      "Balance": b.balanceDue,
                      "Status": b.status,
                      "Date": b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN') : "—"
                    };
                  });
                  exportToCSV(dataToExport, 'bills');
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors"
                style={{
                  background: '#ffffff',
                  border: `1.5px solid ${GOLD}`,
                  color: DARKGOLD,
                }}
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
              <button
                onClick={() => printTable('bills-table', 'Bills Report')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors text-white"
                style={{
                  background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`,
                }}
              >
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            {isMobile ? (
              <div className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-400">
                    No bills found
                  </div>
                ) : (
                  filtered.map((bill) => {
                    const b = bill as any;
                    const booking = bookings.find(bk => bk.id === b.bookingId);
                    const guestName = booking?.guestName || b.guestName || "Unknown Guest";
                    const roomNumber = booking?.room?.roomNumber || booking?.roomId?.slice(-4) || b.roomNumber || "N/A";
                    
                    const totalAmount = Number(b.totalAmount || 0);
                    const paidAmount = Number(b.paidAmount || 0);
                    const balance = Math.max(0, totalAmount - paidAmount);

                    let displayStatus = "pending";
                    if (balance <= 0 && paidAmount > 0) displayStatus = "paid";
                    else if (paidAmount > 0) displayStatus = "partial";

                    return (
                      <div key={b.id} className="p-4 active:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-bold text-gray-900">{guestName}</div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              {utilFormatDate(b.createdAt)} · Room {roomNumber}
                            </div>
                          </div>
                          {statusBadge(displayStatus as any)}
                        </div>
                        
                        <div className="flex items-center justify-between text-[11px] mb-4">
                          <div className="bg-gray-50 px-2 py-1 rounded">
                            <span className="text-gray-400 font-medium">TOTAL: </span>
                            <span className="text-gray-900 font-bold">{utilFormatCurrency(totalAmount)}</span>
                          </div>
                          <div className="bg-green-50 px-2 py-1 rounded">
                            <span className="text-green-600/70 font-medium">PAID: </span>
                            <span className="text-green-700 font-bold">{utilFormatCurrency(paidAmount)}</span>
                          </div>
                          <div className={`${balance > 0 ? "bg-red-50" : "bg-green-50"} px-2 py-1 rounded`}>
                            <span className={`${balance > 0 ? "text-red-500" : "text-green-600"} font-medium uppercase text-[9px] tracking-wider`}>Balance: </span>
                            <span className={`${balance > 0 ? "text-red-700" : "text-green-700"} font-bold`}>{utilFormatCurrency(balance)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-50">
                          <button
                            onClick={() => {
                              const booking = bookings.find(bk => bk.id === b.bookingId);
                              if (booking) setPreviewBooking(booking);
                            }}
                            className="bg-white px-5 py-3 rounded-xl text-sm font-bold text-blue-600 border border-blue-100 shadow-md flex items-center gap-2 active:scale-95 transition-all"
                          >
                            <Eye className="w-4 h-4" /> VIEW
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => setEditingBill(bill)}
                              className="bg-white px-5 py-3 rounded-xl text-sm font-bold text-amber-600 border border-amber-100 shadow-md flex items-center gap-2 active:scale-95 transition-all"
                            >
                              <Edit3 className="w-4 h-4" /> EDIT
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <table className="w-full" id="bills-table">
                <thead>
                  <tr style={{ background: "#FFFFFF" }}>
                    {[
                      "Guest",
                      "Room",
                      isAdmin ? "Hotel" : null,
                      "Room Charges",
                      "Restaurant",
                      "Misc",
                      "Tax",
                      "Total",
                      "Paid",
                      "Balance",
                      "Status",
                      "Actions",
                    ]
                      .filter(Boolean)
                      .map((col) => (
                        <th
                          key={col!}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                          style={{
                            color: "#A8832D",
                            borderBottom: "2px solid #E5E1DA",
                          }}
                        >
                          {col}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((bill) => {
                    const b = bill as any;
                    const booking = bookings.find(bk => bk.id === b.bookingId);
                    const guestName = booking?.guestName || b.guestName || "Unknown Guest";
                    const roomNumber = booking?.room?.roomNumber || booking?.roomId?.slice(-4) || b.roomNumber || "N/A";
                    const plan = booking?.plan || b.booking?.plan || "EP";

                    const hotelName = hotels.find(
                      (h) => h.id === b.hotelId,
                    )?.name;

                    const totalAmount = Number(b.totalAmount || 0);
                    const paidAmount = Number(b.paidAmount || 0);
                    const balance = Math.max(0, totalAmount - paidAmount);

                    let balanceLabel = "";
                    if (balance > 0) {
                      const hasRoom = Number(b.roomCharges) > 0;
                      const hasFood = Number(b.restaurantCharges) > 0;
                      if (hasRoom && hasFood) balanceLabel = " (R&F)";
                      else if (hasRoom) balanceLabel = " (Room)";
                      else if (hasFood) balanceLabel = " (Food)";
                    }

                    let displayStatus = "pending";
                    if (balance <= 0 && paidAmount > 0) {
                      displayStatus = "paid";
                    } else if (paidAmount > 0) {
                      displayStatus = "partial";
                    }

                    return (
                      <tr
                        key={b.id}
                        style={{
                          borderBottom: "1px solid rgba(184,134,11,0.07)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#FFFFFF")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "white")
                        }
                      >
                        <td className="px-4 py-3">
                          <div
                            className="font-medium text-sm"
                            style={{ color: "#1F2937" }}
                          >
                            {guestName}
                          </div>
                          <div className="text-xs" style={{ color: "#9CA3AF" }}>
                            {utilFormatDate(b.createdAt)}
                          </div>
                          <div className="text-xs" style={{ color: "#9CA3AF" }}>
                            Plan: {plan}
                          </div>
                        </td>
                        <td
                          className="px-4 py-3 text-sm font-semibold"
                          style={{ color: DARKGOLD }}
                        >
                          Room {String(roomNumber)}
                        </td>
                        {isAdmin && (
                          <td
                            className="px-4 py-3 text-xs"
                            style={{ color: "#6B7280" }}
                          >
                            {hotelName}
                          </td>
                        )}
                        <td className="px-4 py-3 text-sm">
                          {utilFormatCurrency(bill.roomCharges)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {utilFormatCurrency(bill.restaurantCharges)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {utilFormatCurrency(bill.miscCharges)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {utilFormatCurrency(bill.taxAmount)}
                        </td>
                        <td
                          className="px-4 py-3 text-sm font-bold"
                          style={{ color: GOLD }}
                        >
                          {utilFormatCurrency(totalAmount)}
                        </td>
                        <td
                          className="px-4 py-3 text-sm"
                          style={{ color: "#16a34a" }}
                        >
                          {utilFormatCurrency(paidAmount)}
                        </td>
                        <td
                          className="px-4 py-3 text-sm font-bold"
                          style={{ color: balance > 0 ? "#dc2626" : "#16a34a" }}
                        >
                          {utilFormatCurrency(balance)}
                          {balanceLabel && (
                            <span className="text-[10px] ml-1 opacity-80">{balanceLabel}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">{statusBadge(displayStatus as any)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const booking = bookings.find(bk => bk.id === b.bookingId);
                                if (booking) {
                                  setPreviewBooking(booking);
                                } else {
                                  alert("Original booking details not found for this bill.");
                                }
                              }}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ color: "#3b82f6" }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#eff6ff")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "transparent")
                              }
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => setEditingBill(bill)}
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ color: GOLD }}
                                onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  "rgba(221, 215, 204,0.1)")
                                }
                                onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  "transparent")
                                }
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={11}
                        className="px-4 py-12 text-center text-sm"
                        style={{ color: "#9CA3AF" }}
                      >
                        No bills found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {previewBooking && (
          <BookingPreviewModal
            booking={previewBooking}
            room={bookings.find(bk => bk.id === previewBooking.id)?.room as Room || null}
            onClose={() => setPreviewBooking(null)}
          />
        )}

        {editingBill && (
          <EditBillModal
            bill={editingBill}
            onClose={() => setEditingBill(null)}
            onSave={(updates) => {
              updateBill(editingBill.id, updates);
              setEditingBill(null);
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}
