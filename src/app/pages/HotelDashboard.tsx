import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS, Room, Booking } from "../contexts/PMSContext";
import { calculateRoomDays, formatActualCheckInDateTime, formatCurrency } from "../utils/format";
import { calculateRoomTax } from "../utils/tax";
import {
  DoorOpen,
  Users,
  IndianRupee,
  TrendingUp,
  CheckCircle,
  BedDouble,
  UtensilsCrossed,
  Calendar,
  ArrowRight,
  Search,
  RefreshCw,
  X,
  Plus,
  Wrench,
  Sparkles,
  User,
  Clock,
  CreditCard,
  Receipt,
  LogOut,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Home,
  Wallet,
  Star,
  AlertCircle,
  FileText,
  Building2,
  Briefcase,
} from "lucide-react";
import { InvoiceModal } from "../components/InvoiceModal";
import { BookingPreviewModal } from "../components/BookingPreviewModal";
import { Eye } from "lucide-react";
import { useRoomStatusColors } from "../utils/roomStatusColors";

// ── THEME TOKENS ───────────────────────────────────────────────
const T = {
  gold: "#C6A75E",
  darkGold: "#A8832D",
  sidebar: "#DDD7CC",
  bg: "#FAF7F2",
  card: "#FFFFFF",
  border: "#E5E1DA",
  text: "#1F2937",
  sub: "#6B7280",
};

// ── STATUS CONFIG ──────────────────────────────────────────────
const SC = {
  vacant: {
    label: "Vacant",
    bg: "#f0fdf4",
    border: "#86efac",
    text: "#15803d",
    dot: "#22c55e",
  },
  occupied: {
    label: "Occupied",
    bg: "#fef2f2",
    border: "#fca5a5",
    text: "#dc2626",
    dot: "#ef4444",
  },
  cleaning: {
    label: "Cleaning",
    bg: "#fffbeb",
    border: "#fcd34d",
    text: "#b45309",
    dot: "#f59e0b",
  },
  maintenance: {
    label: "Maintenance",
    bg: "#f5f3ff",
    border: "#c4b5fd",
    text: "#6d28d9",
    dot: "#8b5cf6",
  },
};

function daysBetween(a: string, b: string) {
  return calculateRoomDays(a, b);
}

function formatCheckOut(date?: string, time?: string) {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return time ? `${date}, ${time}` : date;
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return time ? `${day}/${month}/${year}, ${time}` : `${day}/${month}/${year}`;
}

// ── ROOM DETAIL PANEL ─────────────────────────────────────────
function RoomDetailPanel({
  room,
  booking,
  onClose,
  onStatusChange,
  onCheckOut,
  navigate,
  hotelId,
}: {
  room: Room;
  booking?: Booking;
  onClose: () => void;
  onStatusChange: (
    id: string,
    status: Room["status"],
    extra?: Partial<Room>,
  ) => void;
  onCheckOut: (booking: Booking) => void;
  navigate: (path: string) => void;
  hotelId: string;
}) {
  const { bills, miscCharges, restaurantOrders } = usePMS();
  const cfg = SC[room.status];

  const roomBills = bills.filter(
    (b) => b.hotelId === hotelId && (b.booking?.id === booking?.id || b.bookingId === booking?.id),
  );
  const roomMisc = miscCharges.filter(
    (m) =>
      m.hotelId === hotelId &&
      m.bookingId === booking?.id &&
      !m.addedToFinalBill,
  );
  const roomRestaurant = restaurantOrders.filter(
    (o) =>
      o.hotelId === hotelId &&
      o.bookingId === booking?.id &&
      o.paymentMethod === "room" &&
      o.status === "billed",
  );

  const totalBilled = roomBills.reduce((s, b) => s + Number(b.totalAmount || 0), 0);
  const totalMisc = roomMisc.reduce((s, m) => s + Number(m.amount || 0), 0);
  const totalRestaurant = roomRestaurant.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const grandTotal = totalBilled + totalMisc + totalRestaurant;
  const advance = Number(booking?.advanceAmount || 0);
  const balance = grandTotal - advance;

  const nights = booking
    ? calculateRoomDays(
      `${booking.checkInDate}T${booking.checkInTime || "12:00"}`,
      `${booking.checkOutDate}T${booking.checkOutTime || "12:00"}`,
    )
    : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: T.card, borderLeft: `1px solid ${T.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 px-5 py-4 flex items-center justify-between"
          style={{
            background: T.sidebar,
            borderBottom: `1px solid #E5E1DA`,
          }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: cfg.dot }}
              />
              <h3
                style={{
                  fontFamily: "Times New Roman, serif",
                  color: T.gold,
                  fontSize: "1.1rem",
                }}
              >
                Room {room.roomNumber}
              </h3>
            </div>
            <p
              className="text-xs mt-0.5"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Floor {room.floor} • {room.roomType?.name || "Standard"} • Max {room.maxOccupancy} guests
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Status badge */}
          <span
            className="inline-flex px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: cfg.bg,
              color: cfg.text,
              border: `1px solid ${cfg.border}`,
            }}
          >
            {cfg.label}
          </span>

          {/* Guest info for occupied */}
          {room.status === "occupied" && booking && (
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: "#FFFFFF", border: `1px solid ${T.border}` }}
            >
              <h4
                className="text-sm font-bold"
                style={{
                  fontFamily: "Times New Roman, serif",
                  color: T.darkGold,
                }}
              >
                Guest Information
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5" style={{ color: T.gold }} />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: T.text }}
                  >
                    {booking.guestName}
                  </span>
                </div>
                {(booking.companyName || (booking as any).company?.name) && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5" style={{ color: T.gold }} />
                    <span className="text-sm font-semibold" style={{ color: T.darkGold }}>
                      {booking.companyName || (booking as any).company?.name}
                      {booking.companyGst && ` (GST: ${booking.companyGst})`}
                      {!booking.companyGst && (booking as any).company?.gstNumber && ` (GST: ${(booking as any).company?.gstNumber})`}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" style={{ color: T.gold }} />
                  <span className="text-sm" style={{ color: T.sub }}>
                    {booking.guestPhone}
                  </span>
                </div>
                {booking.guestEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" style={{ color: T.gold }} />
                    <span className="text-sm" style={{ color: T.sub }}>
                      {booking.guestEmail}
                    </span>
                  </div>
                )}
                {(booking as any).addressLine && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" style={{ color: T.gold }} />
                    <span className="text-sm" style={{ color: T.sub }}>
                      {(booking as any).addressLine}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" style={{ color: T.gold }} />
                  <span className="text-sm" style={{ color: T.sub }}>
                    {formatActualCheckInDateTime(booking as any, (booking as any)?.reservation, booking.checkInDate)} → {formatCheckOut(booking.checkOutDate, booking.checkOutTime)}
                    <br />
                    <span className="text-[10px] italic">({nights} nights)</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" style={{ color: T.gold }} />
                  <span className="text-sm" style={{ color: T.sub }}>
                    {booking.adults} adults, {booking.children} children
                  </span>
                </div>
                {booking.idProof && (
                  <div className="flex items-center gap-2">
                    <Home className="w-3.5 h-3.5" style={{ color: T.gold }} />
                    <span className="text-sm" style={{ color: T.sub }}>
                      ID: {booking.idProof}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Billing summary for occupied rooms */}
          {room.status === "occupied" && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: `1px solid ${T.border}` }}
            >
              <div
                className="px-4 py-3"
                style={{
                  background: "#FFFFFF",
                  borderBottom: `1px solid ${T.border}`,
                }}
              >
                <h4
                  className="text-sm font-bold"
                  style={{
                    fontFamily: "Times New Roman, serif",
                    color: T.darkGold,
                  }}
                >
                  Billing Summary
                </h4>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: T.sub }}>Room Charges</span>
                  <span className="font-medium">
                    {formatCurrency(totalBilled)}
                  </span>
                </div>
                {totalRestaurant > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: T.sub }}>Restaurant</span>
                    <span className="font-medium">
                      {formatCurrency(totalRestaurant)}
                    </span>
                  </div>
                )}
                {totalMisc > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: T.sub }}>Misc. Charges</span>
                    <span className="font-medium">
                      {formatCurrency(totalMisc)}
                    </span>
                  </div>
                )}
                <div
                  className="pt-2 border-t"
                  style={{ borderColor: T.border }}
                >
                  <div className="flex justify-between text-sm">
                    <span style={{ color: T.sub }}>Advance Paid</span>
                    <span className="font-medium text-green-600">
                      – {formatCurrency(advance)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold mt-1">
                    <span style={{ color: T.darkGold }}>Balance Due</span>
                    <span
                      style={{
                        color: balance > 0 ? "#dc2626" : "#16a34a",
                        fontSize: "1.1rem",
                      }}
                    >
                      {formatCurrency(Math.abs(balance))}
                      {balance <= 0 && " ✓"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vacant room info */}
          {room.status === "vacant" && (
            <div
              className="rounded-xl p-4"
              style={{ background: "#F5F4F0", border: "1px solid #DDD7CC" }}
            >
              <div
                className="text-2xl font-bold"
                style={{ color: T.gold, fontFamily: "Times New Roman, serif" }}
              >
                {formatCurrency(Number(room.basePrice || 0))}
                <span className="text-sm font-normal text-gray-500">
                  /night
                </span>
              </div>
              <p className="text-sm mt-1" style={{ color: "#CFC8BC" }}>
                Room is available for booking
              </p>
            </div>
          )}

          {/* Maintenance note */}
          {room.status === "maintenance" && room.maintenanceNote && (
            <div
              className="rounded-xl p-4"
              style={{ background: "#f5f3ff", border: "1px solid #c4b5fd" }}
            >
              <div className="flex items-start gap-2">
                <Wrench
                  className="w-4 h-4 mt-0.5"
                  style={{ color: "#6d28d9" }}
                />
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "#6d28d9" }}
                  >
                    Issue Note
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: "#6d28d9" }}>
                    {room.maintenanceNote}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            {room.status === "vacant" && (
              <button
                onClick={() => navigate("/hotel/check-in")}
                className="w-full py-3 rounded-xl font-medium text-white text-sm"
                style={{
                  background: `linear-gradient(135deg, ${T.gold}, ${T.darkGold})`,
                  boxShadow: "0 2px 8px #E5E1DA",
                }}
              >
                Process Check-In
              </button>
            )}
            {room.status === "occupied" && booking && (
              <>
                <button
                  onClick={() => {
                    onCheckOut(booking);
                    onClose();
                  }}
                  className="w-full py-3 rounded-xl font-medium text-white text-sm"
                  style={{
                    background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                    boxShadow: "0 2px 8px rgba(220,38,38,0.3)",
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <LogOut className="w-4 h-4" /> Process Check-Out
                  </div>
                </button>
                <button
                  onClick={() => navigate("/hotel/restaurant/pos")}
                  className="w-full py-2.5 rounded-xl font-medium text-sm"
                  style={{
                    border: `1px solid ${T.border}`,
                    color: T.darkGold,
                    background: "#FFFFFF",
                  }}
                >
                  Add Restaurant Charges
                </button>
                <button
                  onClick={() => navigate("/hotel/misc-charges")}
                  className="w-full py-2.5 rounded-xl font-medium text-sm"
                  style={{ border: `1px solid ${T.border}`, color: T.darkGold }}
                >
                  Add Misc. Charges
                </button>
              </>
            )}
            {room.status === "cleaning" && (
              <button
                onClick={() => {
                  onStatusChange(room.id, "vacant");
                  onClose();
                }}
                className="w-full py-3 rounded-xl font-medium text-sm transition-colors duration-200 bg-[#B8860B] hover:bg-[#9A7209]"
                style={{
                  color: "#ffffff",
                  border: "none",
                }}
              >
                Mark Room Ready ✓
              </button>
            )}
            {room.status === "maintenance" && (
              <button
                onClick={() => {
                  onStatusChange(room.id, "vacant", {
                    maintenanceNote: undefined,
                  });
                  onClose();
                }}
                className="w-full py-3 rounded-xl font-medium text-sm"
                style={{
                  background: "#fef2f2",
                  color: "#dc2626",
                  border: "1px solid #fca5a5",
                }}
              >
                Mark Issue Fixed ✓
              </button>
            )}
            {room.status === "vacant" && (
              <button
                onClick={() => {
                  onStatusChange(room.id, "maintenance");
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl font-medium text-sm"
                style={{ border: `1px solid ${T.border}`, color: "#6d28d9" }}
              >
                Report Maintenance Issue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CHECK-OUT MODAL ────────────────────────────────────────────
function CheckOutModal({
  booking,
  room,
  hotelId,
  onConfirm,
  onClose,
}: {
  booking: Booking;
  room?: Room;
  hotelId: string;
  onConfirm: (bookingId: string, roomId: string, paymentMode: string) => void;
  onClose: () => void;
}) {
  const { bills, miscCharges, restaurantOrders } = usePMS();
  const [paymentMode, setPaymentMode] = useState("Cash");

  const roomBills = bills.filter(
    (b) => b.hotelId === hotelId && (b.booking?.id === booking.id || b.bookingId === booking.id),
  );
  const miscList = miscCharges.filter(
    (m) => m.hotelId === hotelId && m.bookingId === booking.id,
  );
  const restaurantList = restaurantOrders.filter(
    (o) =>
      o.hotelId === hotelId &&
      o.bookingId === booking.id &&
      o.paymentMethod === "room" &&
      o.status === "billed",
  );

  const nights = calculateRoomDays(
    `${booking.checkInDate}T${booking.checkInTime || "12:00"}`,
    `${booking.checkOutDate}T${booking.checkOutTime || "12:00"}`,
  );
  // Use the stored bill total if a bill exists, otherwise fall back to booking.totalAmount
  const existingBill = roomBills[0];
  const roomCharge = existingBill
    ? Number(existingBill.roomCharges || 0)
    : Number(booking.totalAmount || 0);
  const miscTotal = miscList.reduce((s, m) => s + Number(m.amount), 0);
  const restaurantTotal = restaurantList.reduce((s, o) => s + Number(o.totalAmount), 0);
  const subTotal = roomCharge + miscTotal + restaurantTotal;
  const effectiveDailyRent = Math.max(0, roomCharge) / Math.max(nights, 1);
  const fallbackTaxRate = calculateRoomTax(effectiveDailyRent, 1).rate;
  const tax = existingBill
    ? Number(existingBill.taxAmount || 0)
    : Math.round((subTotal * fallbackTaxRate) / 100);
  const displayTaxRate =
    subTotal > 0
      ? Number(((tax / subTotal) * 100).toFixed(2))
      : fallbackTaxRate;
  const grandTotal = existingBill
    ? Number(existingBill.totalAmount || 0)
    : subTotal + tax;
  const advance = Number(booking.advanceAmount || 0);
  const balance = grandTotal - advance;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: T.card }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{
            background: T.sidebar,
            borderBottom: `1px solid #E5E1DA`,
          }}
        >
          <div>
            <h2 style={{ fontFamily: "Times New Roman, serif", color: T.gold }}>
              Check-Out — Room {booking.room?.roomNumber || room?.roomNumber || booking.roomId?.slice(-4)}
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              {booking.guestName}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Bill breakdown */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: `1px solid ${T.border}` }}
          >
            <div
              className="px-4 py-3"
              style={{
                background: "#FFFFFF",
                borderBottom: `1px solid ${T.border}`,
              }}
            >
              <h3
                className="font-bold text-sm"
                style={{
                  fontFamily: "Times New Roman, serif",
                  color: T.darkGold,
                }}
              >
                Final Bill Summary
              </h3>
            </div>
            <div className="p-4 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span style={{ color: T.sub }}>
                  Room Charge ({nights} nights ×{" "}
                  {formatCurrency(
                    existingBill
                      ? Number(existingBill.roomCharges || 0) / Math.max(nights, 1)
                      : Number(room?.basePrice || 0)
                  )})
                </span>
                <span className="font-medium">
                  {formatCurrency(roomCharge)}
                </span>
              </div>
              {restaurantTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: T.sub }}>Restaurant Charges</span>
                  <span className="font-medium">
                    {formatCurrency(restaurantTotal)}
                  </span>
                </div>
              )}
              {miscTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: T.sub }}>
                    Misc. Charges ({miscList.length} items)
                  </span>
                  <span className="font-medium">
                    {formatCurrency(miscTotal)}
                  </span>
                </div>
              )}
              <div
                className="flex justify-between text-sm border-t pt-2"
                style={{ borderColor: T.border }}
              >
                <span style={{ color: T.sub }}>Sub Total</span>
                <span className="font-medium">{formatCurrency(subTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: T.sub }}>GST ({displayTaxRate}%)</span>
                <span className="font-medium">{formatCurrency(tax)}</span>
              </div>
              <div
                className="flex justify-between font-bold text-base border-t pt-2"
                style={{ borderColor: T.border }}
              >
                <span style={{ color: T.darkGold }}>Grand Total</span>
                <span style={{ color: T.gold }}>
                  {formatCurrency(grandTotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Advance Paid</span>
                <span className="font-medium text-green-700">
                  – {formatCurrency(advance)}
                </span>
              </div>
              <div
                className="flex justify-between font-bold text-lg"
                style={{ color: balance > 0 ? "#dc2626" : "#16a34a" }}
              >
                <span>Balance {balance > 0 ? "Due" : "Refund"}</span>
                <span>{formatCurrency(Math.abs(balance))}</span>
              </div>
            </div>
          </div>

          {/* Payment mode */}
          <div>
            <label
              className="block text-xs font-semibold mb-2 uppercase tracking-wide"
              style={{ color: T.darkGold }}
            >
              Payment Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["Cash", "Card", "UPI", "Bank Transfer", "Cheque", "Credit"].map(
                (mode) => (
                  <button
                    key={mode}
                    onClick={() => setPaymentMode(mode)}
                    className="py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background:
                        paymentMode === mode
                          ? `linear-gradient(135deg, ${T.gold}, ${T.darkGold})`
                          : "#FFFFFF",
                      color: paymentMode === mode ? "white" : T.darkGold,
                      border: `1.5px solid ${paymentMode === mode ? T.gold : T.border}`,
                    }}
                  >
                    {mode}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm"
              style={{ border: `1px solid ${T.border}`, color: T.darkGold }}
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(booking.id, booking.roomId, paymentMode)}
              className="flex-1 py-3 rounded-xl font-medium text-white text-sm"
              style={{
                background: "linear-gradient(135deg, #16a34a, #15803d)",
                boxShadow: "0 2px 8px rgba(22,163,74,0.3)",
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <Receipt className="w-4 h-4" /> Confirm Check-Out
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MINI STAT CARD ─────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${color}18`, color }}
        >
          {icon}
        </div>
        <TrendingUp className="w-4 h-4 text-green-500" />
      </div>
      <div
        className="text-2xl font-bold"
        style={{ color: T.text, fontFamily: "Times New Roman, serif" }}
      >
        {value}
      </div>
      <div
        className="text-sm"
        style={{ color: T.sub, fontFamily: "Georgia, serif" }}
      >
        {label}
      </div>
      {sub && (
        <div className="text-xs" style={{ color: "#9CA3AF" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ── ROOM CARD ──────────────────────────────────────────────────
function RoomCard({
  room,
  booking,
  onClick,
}: {
  room: Room;
  booking?: Booking;
  onClick: () => void;
}) {
  const cfg = SC[room.status];
  const roomStatusColors = useRoomStatusColors({
    checkInColor: "#b91c1c",
    checkOutColor: "#07b44c",
    maintenanceColor: "#07b44c",
  });
  const cardBg =
    room.status === "occupied"
      ? roomStatusColors.checkInColor
      : room.status === "vacant"
        ? roomStatusColors.checkOutColor
      : room.status === "maintenance"
        ? roomStatusColors.maintenanceColor
        : cfg.bg;
  const cardBorder = cardBg;
  const nights = booking
    ? calculateRoomDays(
      `${booking.checkInDate}T${booking.checkInTime || "12:00"}`,
      `${booking.checkOutDate}T${booking.checkOutTime || "12:00"}`,
    )
    : 0;

  return (
    <button
      onClick={onClick}
      className="rounded-lg text-left transition-all w-full"
      style={{
        background: cardBg,
        border: `1.5px solid ${cardBorder}`,
        padding: "9px",
        fontFamily: "Calibri, 'Calibri Regular', sans-serif",
        color: "#ffffff",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div
            className="text-sm font-bold"
            style={{ fontFamily: "Calibri, 'Calibri Regular', sans-serif", color: "#ffffff" }}
          >
            {room.roomNumber}
          </div>
          <div className="text-xs" style={{ color: "#ffffff", fontFamily: "Calibri, 'Calibri Regular', sans-serif" }}>
            {room.roomType?.name || "Standard"} · F{room.floor}
          </div>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{
            background: "white",
            color: cfg.text,
            border: `1px solid ${cfg.border}`,
          }}
        >
          {cfg.label}
        </span>
      </div>
      <div className="space-y-1">
        {room.status === "vacant" && (
          <>
            <div className="text-sm font-bold" style={{ color: "#ffffff", fontFamily: "Calibri, 'Calibri Regular', sans-serif" }}>
              {formatCurrency(Number(room.basePrice || 0))}
              <span className="text-xs font-normal" style={{ color: "#ffffff", fontFamily: "Calibri, 'Calibri Regular', sans-serif" }}>/night</span>
            </div>
            <div className="text-xs" style={{ color: "#ffffff", fontFamily: "Calibri, 'Calibri Regular', sans-serif" }}>
              Max {room.maxOccupancy} guests
            </div>
          </>
        )}
        {room.status === "occupied" && booking && (
          <>
            <div className="text-xs font-semibold" style={{ color: "#ffffff", fontFamily: "Calibri, 'Calibri Regular', sans-serif" }}>
              {booking.guestName}
              {(booking.companyName || (booking as any).company?.name) && ` • ${booking.companyName || (booking as any).company?.name}`}
            </div>
            <div className="text-xs" style={{ color: "#ffffff", fontFamily: "Calibri, 'Calibri Regular', sans-serif" }}>
              {formatActualCheckInDateTime(booking as any, (booking as any)?.reservation, booking.checkInDate)} → {formatCheckOut(booking.checkOutDate, booking.checkOutTime)}
            </div>
            <div className="text-xs font-medium" style={{ color: "#ffffff", fontFamily: "Calibri, 'Calibri Regular', sans-serif" }}>
              ({nights}N) · Bal:{" "}
              {formatCurrency(Number(booking.totalAmount) - Number(booking.advanceAmount))}
            </div>
          </>
        )}
        {room.status === "cleaning" && (
          <div className="text-xs" style={{ color: "#ffffff", fontFamily: "Calibri, 'Calibri Regular', sans-serif" }}>
            Being serviced · Tap to mark ready
          </div>
        )}
        {room.status === "maintenance" && (
          <div className="text-xs" style={{ color: "#ffffff", fontFamily: "Calibri, 'Calibri Regular', sans-serif" }}>
            {room.maintenanceNote || "Under maintenance"}
          </div>
        )}
      </div>
    </button>
  );
}

// ── MAIN DASHBOARD ─────────────────────────────────────────────
export function HotelDashboard() {
  const { user, currentHotelId } = useAuth();
  const navigate = useNavigate();
  const {
    rooms,
    bookings,
    restaurantOrders,
    expenses,
    updateRoom,
    updateBooking,
    hotels,
  } = usePMS();

  const hotelId = currentHotelId || user?.hotelId || user?.hotel?.id || "";
  const hotel = hotels.find((h) => String(h.id) === String(hotelId));
  const hotelFromUser: any =
    (user as any)?.hotel ||
    (user as any)?.hotelData ||
    (user as any)?.property ||
    null;
  const resolvedHotel = hotel || hotelFromUser || null;
  const hotelForInvoice: any =
    hotel ||
    (user as any)?.hotel ||
    (user as any)?.hotelData ||
    (user as any)?.property ||
    null;

  useEffect(() => {
    console.log("user object:", JSON.stringify(user, null, 2));
  }, [user]);

  useEffect(() => {
    console.log("Hotel ID being used:", hotelId);
  }, [hotelId]);

  // Banner display mapping: read available values from common key variants.
  const hotelData = (hotel || {}) as any;
  const hotelName = hotelData.name || hotelData.hotelName || hotelData.hotel_name || user?.hotel?.name || "";
  const hotelAddress = hotelData.address || hotelData.addressLine || "";
  const hotelCity = hotelData.city || hotelData.town || "";
  const hotelGst =
    hotelData.gstNumber ||
    hotelData.gst_number ||
    hotelData.gst ||
    hotelData.gstNo ||
    hotelData.gstin ||
    (user as any)?.hotel?.gstNumber ||
    (user as any)?.hotel?.gst_number ||
    (user as any)?.hotel?.gst ||
    "";
  const hotelRating = Math.max(
    0,
    Math.min(
      5,
      Math.round(Number(hotelData.rating ?? hotelData.stars ?? hotelData.starRating ?? 0) || 0),
    ),
  );
  const hotelCheckIn = hotelData.checkInTime || hotelData.check_in_time || hotelData.checkinTime || "";
  const hotelCheckOut = hotelData.checkOutTime || hotelData.check_out_time || hotelData.checkoutTime || "";
  const locationText = [hotelAddress, hotelCity].filter(Boolean).join(", ");

  // Hotel-filtered data
  const hotelRooms = useMemo(
    () => rooms.filter((r) => r.hotelId === hotelId),
    [rooms, hotelId],
  );
  const hotelBookings = useMemo(
    () => bookings.filter((b) => b.hotelId === hotelId),
    [bookings, hotelId],
  );
  const todayOrders = useMemo(
    () =>
      restaurantOrders.filter(
        (o) => o.hotelId === hotelId && o.status === "billed",
      ),
    [restaurantOrders, hotelId],
  );
  const todayExpenses = useMemo(
    () => expenses.filter((e) => e.hotelId === hotelId),
    [expenses, hotelId],
  );

  // Room panel state
  const [filterStatus, setFilterStatus] = useState<"all" | Room["status"]>(
    "all",
  );
  const [filterFloor, setFilterFloor] = useState<"all" | number>("all");
  const [filterType, setFilterType] = useState<"all" | string>("all");
  const [roomSearch, setRoomSearch] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [checkoutBooking, setCheckoutBooking] = useState<Booking | null>(null);
  const [previewBooking, setPreviewBooking] = useState<Booking | null>(null);
  const [viewInvoice, setViewInvoice] = useState<any>(null);
  const [lastRefresh] = useState(new Date());
  const roomCardClickTimersRef = useRef<Record<string, number>>({});

  // Stats
  const occupied = hotelRooms.filter((r) => r.status === "occupied").length;
  const vacant = hotelRooms.filter((r) => r.status === "vacant").length;
  const cleaning = hotelRooms.filter((r) => r.status === "cleaning").length;
  const maintenance = hotelRooms.filter(
    (r) => r.status === "maintenance",
  ).length;
  const expectedCheckouts = hotelBookings.filter(
    (b) => b.status === "checked_in",
  ).length;
  const pendingCheckIns = hotelBookings.filter(
    (b) => b.status === "pending" || b.status === "confirmed",
  ).length;

  const todayRevenue = hotelBookings
    .filter((b) => b.status === "checked_in" || b.status === "checked_out")
    .reduce((s, b) => s + Number(b.totalAmount || 0), 0);
  const restaurantRevenue = todayOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const expenseTotal = todayExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  // Unique floors + types for filters
  const floors = useMemo(
    () => [...new Set(hotelRooms.map((r) => r.floor))].sort(),
    [hotelRooms],
  );
  const types = useMemo(
    () => [...new Set(hotelRooms.map((r) => r.roomType?.name || "Standard"))],
    [hotelRooms],
  );

  // Filtered rooms
  const filteredRooms = useMemo(
    () =>
      hotelRooms.filter((r) => {
        if (filterStatus !== "all" && r.status !== filterStatus) return false;
        if (filterFloor !== "all" && r.floor !== filterFloor) return false;
        if (filterType !== "all" && (r.roomType?.name || "Standard") !== filterType) return false;
        if (
          roomSearch &&
          !r.roomNumber.toLowerCase().includes(roomSearch.toLowerCase())
        )
          return false;
        return true;
      }),
    [hotelRooms, filterStatus, filterFloor, filterType, roomSearch],
  );

  // Get booking for a room
  const getBooking = useCallback(
    (room: Room) =>
      hotelBookings.find(
        (b) =>
          b.roomId === room.id &&
          (b.status === "checked_in" || b.status === "pending" || b.status === "confirmed"),
      ),
    [hotelBookings],
  );

  const handleCheckOut = useCallback(
    (booking: Booking, paymentMode: string) => {
      updateBooking(booking.id, { status: "checked_out", finalPayment: paymentMode } as any);
      updateRoom(booking.roomId, { status: "cleaning" });
      setCheckoutBooking(null);
    },
    [updateBooking, updateRoom],
  );

  const occupancyPct = hotelRooms.length
    ? Math.round((occupied / hotelRooms.length) * 100)
    : 0;

  const handleRoomCardClick = useCallback((room: Room) => {
    const existingTimer = roomCardClickTimersRef.current[room.id];
    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }

    roomCardClickTimersRef.current[room.id] = window.setTimeout(() => {
      setSelectedRoom(room);
      delete roomCardClickTimersRef.current[room.id];
    }, 220);
  }, []);

  useEffect(() => {
    return () => {
      Object.values(roomCardClickTimersRef.current).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      roomCardClickTimersRef.current = {};
    };
  }, []);

  return (
    <AppLayout title="Hotel Dashboard" requiredRole="hotel">
      <div
        className="space-y-5"
        style={{ fontFamily: "Georgia, Inter, sans-serif" }}
      >
        {/* Hotel banner */}
        <div
          className="rounded-sm px-6 py-4 flex items-center justify-between"
          style={{
            background: "#1F2937",
            border: `1px solid #E5E1DA`,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "Times New Roman, serif",
                color: "#F9FAFB",
                fontSize: "1.4rem",
                marginBottom: "2px",
              }}
            >
              {hotelName || "Hotel"}
            </h2>
            {(locationText || hotelGst) && (
              <p className="text-sm" style={{ color: "#D1D5DB" }}>
                {[locationText, hotelGst ? `GST: ${hotelGst}` : ""].filter(Boolean).join(" · ")}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="w-3.5 h-3.5"
                    fill={i <= hotelRating ? T.gold : "none"}
                    stroke={
                      i <= hotelRating
                        ? T.gold
                        : "#E5E1DA"
                    }
                  />
                ))}
              </div>
              <span
                className="text-xs"
                style={{ color: "#D1D5DB" }}
              >
                CI: {hotelCheckIn || "N/A"} · CO: {hotelCheckOut || "N/A"}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div
              className="text-xs mb-1"
              style={{ color: "#D1D5DB" }}
            >
              Occupancy
            </div>
            <div
              className="text-3xl font-bold"
              style={{ color: T.gold, fontFamily: "Times New Roman, serif" }}
            >
              {occupancyPct}%
            </div>
            <div
              className="text-xs mt-1"
              style={{ color: "#D1D5DB" }}
            >
              {occupied}/{hotelRooms.length} rooms
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Occupied Rooms"
            value={occupied}
            sub={`${vacant} vacant`}
            icon={<BedDouble className="w-5 h-5" />}
            color="#850505"
          />
          <StatCard
            label="Today's Check-outs"
            value={expectedCheckouts}
            sub={`${pendingCheckIns} pending check-ins`}
            icon={<Users className="w-5 h-5" />}
            color="#3b82f6"
          />
          <StatCard
            label="Room Revenue"
            value={formatCurrency(todayRevenue)}
            sub={formatCurrency(restaurantRevenue) + " restaurant"}
            icon={<IndianRupee className="w-5 h-5" />}
            color={T.gold}
          />
          <StatCard
            label="Today's Expenses"
            value={formatCurrency(expenseTotal)}
            sub={`${todayExpenses.length} entries`}
            icon={<Wallet className="w-5 h-5" />}
            color="#8b5cf6"
          />
        </div>

        {/* Status filter buttons */}
        <div className="grid grid-cols-4 gap-3">
          {(
            [
              {
                status: "all",
                label: "All Rooms",
                count: hotelRooms.length,
                color: T.gold,
              },
              {
                status: "vacant",
                label: "Vacant",
                count: vacant,
                color: "#22c55e",
              },
              {
                status: "occupied",
                label: "Occupied",
                count: occupied,
                color: "#9c0000",
              },
              {
                status: "cleaning",
                label: "Cleaning",
                count: cleaning,
                color: "#f59e0b",
              },
            ] as { status: any; label: string; count: number; color: string }[]
          ).map((f) => (
            <button
              key={f.status}
              onClick={() =>
                setFilterStatus(f.status === filterStatus ? "all" : f.status)
              }
              className="rounded-xl py-3 px-4 text-left transition-all"
              style={{
                background: filterStatus === f.status ? f.color + "15" : T.card,
                border: `1.5px solid ${filterStatus === f.status ? f.color : T.border}`,
              }}
            >
              <div
                className="text-xl font-bold"
                style={{ color: f.color, fontFamily: "Times New Roman, serif" }}
              >
                {f.count}
              </div>
              <div className="text-xs mt-0.5" style={{ color: T.sub }}>
                {f.label}
              </div>
            </button>
          ))}
        </div>

        {/* Room Panel Header + Filters */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            className="px-5 py-4 flex items-center justify-between"
            style={{
              background: "#FFFFFF",
              borderBottom: `2px solid ${T.border}`,
            }}
          >
            <div className="flex items-center gap-2">
              <BedDouble className="w-5 h-5" style={{ color: T.gold }} />
              <h3
                style={{
                  fontFamily: "Times New Roman, serif",
                  color: T.darkGold,
                  fontSize: "1rem",
                  fontWeight: 700,
                }}
              >
                Live Room Panel — {filteredRooms.length} rooms
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                  style={{ color: T.gold }}
                />
                <input
                  value={roomSearch}
                  onChange={(e) => setRoomSearch(e.target.value)}
                  placeholder="Search room / guest…"
                  className="pl-9 pr-3 py-2 rounded-lg text-xs outline-none w-48"
                  style={{
                    border: `1.5px solid ${T.border}`,
                    background: "white",
                  }}
                />
              </div>
              <select
                value={filterFloor}
                onChange={(e) =>
                  setFilterFloor(
                    e.target.value === "all" ? "all" : +e.target.value,
                  )
                }
                className="px-3 py-2 rounded-lg text-xs outline-none"
                style={{
                  border: `1.5px solid ${T.border}`,
                  background: "white",
                  color: T.text,
                }}
              >
                <option value="all">All Floors</option>
                {floors.map((f) => (
                  <option key={f} value={f}>
                    Floor {f}
                  </option>
                ))}
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 rounded-lg text-xs outline-none"
                style={{
                  border: `1.5px solid ${T.border}`,
                  background: "white",
                  color: T.text,
                }}
              >
                <option value="all">All Types</option>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <button
                className="p-2 rounded-lg"
                title="Refresh"
                style={{
                  border: `1.5px solid ${T.border}`,
                  background: "white",
                }}
              >
                <RefreshCw className="w-3.5 h-3.5" style={{ color: T.gold }} />
              </button>
            </div>
          </div>

          {/* Room Grid — grouped by floor */}
          <div className="p-5 space-y-5">
            {floors
              .filter((f) => filterFloor === "all" || filterFloor === f)
              .map((floor) => {
                const floorRooms = filteredRooms.filter(
                  (r) => r.floor === floor,
                );
                if (floorRooms.length === 0) return null;
                return (
                  <div key={floor}>
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider"
                        style={{
                          background: "#EDE6D9",
                          color: T.darkGold,
                          border: `1px solid #E5E1DA`,
                        }}
                      >
                        Floor {floor}
                      </div>
                      <div
                        className="h-px flex-1"
                        style={{ background: T.border }}
                      />
                      <span className="text-xs" style={{ color: T.sub }}>
                        {floorRooms.length} rooms
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                      {floorRooms
                        .sort((a, b) =>
                          a.roomNumber.localeCompare(b.roomNumber),
                        )
                        .map((room) => (
                          <RoomCard
                            key={room.id}
                            room={room}
                            booking={getBooking(room)}
                            onClick={() => handleRoomCardClick(room)}
                          />
                        ))}
                    </div>
                  </div>
                );
              })}
            {filteredRooms.length === 0 && (
              <div className="text-center py-12">
                <BedDouble
                  className="w-10 h-10 mx-auto mb-3"
                  style={{ color: "#E5E1DA" }}
                />
                <p style={{ color: T.sub }}>No rooms match your filters</p>
              </div>
            )}
          </div>

          {/* Legend */}
          <div
            className="px-5 py-3 flex items-center gap-6 flex-wrap"
            style={{
              borderTop: `1px solid ${T.border}`,
              background: "#FFFFFF",
            }}
          >
            {Object.entries(SC).map(([status, cfg]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-none"
                  style={{ background: cfg.dot }}
                />
                <span className="text-xs" style={{ color: T.sub }}>
                  {cfg.label}
                </span>
              </div>
            ))}
            <span className="text-xs ml-auto" style={{ color: "#9CA3AF" }}>
              Tap any room card for details & actions
            </span>
          </div>
        </div>

        {/* Quick Actions + Active Bookings */}
        <div className="grid grid-cols-3 gap-5">
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: T.card, border: `1px solid ${T.border}` }}
          >
            <div
              className="px-5 py-4"
              style={{
                background: "#FFFFFF",
                borderBottom: `2px solid ${T.border}`,
              }}
            >
              <h3
                style={{
                  fontFamily: "Times New Roman, serif",
                  color: T.darkGold,
                  fontWeight: 700,
                }}
              >
                Quick Actions
              </h3>
            </div>
            <div className="p-4 space-y-2">
              {[
                {
                  label: "Walk-in Check-in",
                  icon: <Users className="w-4 h-4" />,
                  path: "/hotel/check-in",
                  color: "#149500",
                },
                {
                  label: "New Reservation",
                  icon: <Calendar className="w-4 h-4" />,
                  path: "/hotel/reservations",
                  color: "#3b82f6",
                },
                {
                  label: "Restaurant POS",
                  icon: <UtensilsCrossed className="w-4 h-4" />,
                  path: "/hotel/restaurant/pos",
                  color: "#f59e0b",
                },
                {
                  label: "View Bills",
                  icon: <Receipt className="w-4 h-4" />,
                  path: "/hotel/bills",
                  color: T.gold,
                },
                {
                  label: "Invoices",
                  icon: <FileText className="w-4 h-4" />,
                  path: "/hotel/invoices",
                  color: "#d97706",
                },
                {
                  label: "Expenses",
                  icon: <Wallet className="w-4 h-4" />,
                  path: "/hotel/expenses",
                  color: "#8b5cf6",
                },
              ].map((a) => (
                <button
                  key={a.path}
                  onClick={() => navigate(a.path)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
                  style={{ border: `1px solid ${T.border}` }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#FFFFFF";
                    e.currentTarget.style.borderColor = T.gold;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = T.border;
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: a.color + "15", color: a.color }}
                    >
                      {a.icon}
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: T.text }}
                    >
                      {a.label}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: T.sub }} />
                </button>
              ))}
            </div>
          </div>

          {/* Active bookings table */}
          <div
            className="col-span-2 rounded-2xl overflow-hidden"
            style={{ background: T.card, border: `1px solid ${T.border}` }}
          >
            <div
              className="px-5 py-4"
              style={{
                background: "#FFFFFF",
                borderBottom: `2px solid ${T.border}`,
              }}
            >
              <h3
                style={{
                  fontFamily: "Times New Roman, serif",
                  color: T.darkGold,
                  fontWeight: 700,
                }}
              >
                Active Bookings (
                {
                  hotelBookings.filter(
                    (b) =>
                      b.status === "pending" || b.status === "confirmed" || b.status === "checked_in",
                  ).length
                }
                )
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "#FFFFFF" }}>
                    {[
                      "Guest",
                      "Room",
                      "Check-in",
                      "Check-out",
                      "Amount",
                      "Status",
                      "Action",
                    ].map((col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left text-xs font-bold uppercase"
                        style={{
                          color: T.darkGold,
                          borderBottom: `2px solid ${T.border}`,
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hotelBookings
                    .filter(
                      (b) =>
                        b.status === "pending" || b.status === "confirmed" || b.status === "checked_in",
                    )
                    .slice(0, 8)
                    .map((b) => (
                      <tr
                        key={b.id}
                        style={{ borderBottom: `1px solid ${T.border}` }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#FFFFFF")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "white")
                        }
                      >
                        <td
                          className="px-4 py-3 text-sm font-medium"
                          style={{ color: T.text }}
                        >
                          {b.guestName}
                        </td>
                        <td
                          className="px-4 py-3 text-sm font-bold"
                          style={{ color: T.darkGold }}
                        >
                          Room {b.room?.roomNumber || b.roomId.slice(-4)}
                        </td>
                        <td
                          className="px-4 py-3 text-xs"
                          style={{ color: T.sub }}
                        >
                          {formatActualCheckInDateTime(b as any, (b as any)?.reservation, b.checkInDate)}
                        </td>
                        <td
                          className="px-4 py-3 text-xs"
                          style={{ color: T.sub }}
                        >
                          {formatCheckOut(b.checkOutDate, b.checkOutTime)}
                        </td>
                        <td
                          className="px-4 py-3 text-sm font-bold"
                          style={{ color: T.gold }}
                        >
                          {formatCurrency(b.totalAmount)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                            style={{
                              background:
                                b.status === "checked_in"
                                  ? "#dcfce7"
                                  : "#fef08a",
                              color:
                                b.status === "checked_in"
                                  ? "#166534"
                                  : "#a16207",
                            }}
                          >
                            {(b.status === "pending" || b.status === "confirmed") ? "pending" : b.status.replace("_", "-")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setPreviewBooking(b)}
                              className="px-2 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {(b.status === "pending" || b.status === "confirmed") ? (
                              <button
                                onClick={() => {
                                  updateBooking(b.id, { status: "checked_in" });
                                  const rm = rooms.find((r) => r.id === b.roomId);
                                  if (rm)
                                    updateRoom(rm.id, {
                                      status: "occupied",
                                    });
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                                style={{ background: "#16a34a" }}
                              >
                                Check In
                              </button>
                            ) : (
                              <button
                                onClick={() => setCheckoutBooking(b)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                                style={{ background: "#dc2626" }}
                              >
                                Check Out
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {hotelBookings.filter(
                (b) => b.status === "pending" || b.status === "confirmed" || b.status === "checked_in",
              ).length === 0 && (
                  <div className="text-center py-8" style={{ color: T.sub }}>
                    No active bookings
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Room Detail Panel */}
      {selectedRoom && (
        <RoomDetailPanel
          room={selectedRoom}
          booking={getBooking(selectedRoom)}
          hotelId={hotelId}
          onClose={() => setSelectedRoom(null)}
          onStatusChange={(id, status, extra) => {
            updateRoom(id, { status, ...extra });
            setSelectedRoom(null);
          }}
          onCheckOut={(booking) => {
            setCheckoutBooking(booking);
            setSelectedRoom(null);
          }}
          navigate={navigate}
        />
      )}

      {/* Check-Out Modal */}
      {checkoutBooking && (
        <CheckOutModal
          booking={checkoutBooking}
          room={rooms.find((r) => r.id === checkoutBooking.roomId)}
          hotelId={hotelId}
          onConfirm={(bookingId, roomId, paymentMode) =>
            handleCheckOut(checkoutBooking, paymentMode)
          }
          onClose={() => setCheckoutBooking(null)}
        />
      )}

      {viewInvoice && (
        <InvoiceModal
          invoice={{
            ...viewInvoice,
            hotel: (viewInvoice as any).hotel || hotelForInvoice || resolvedHotel
          }}
          onClose={() => setViewInvoice(null)}
        />
      )}
      {previewBooking && (
        <BookingPreviewModal
          booking={previewBooking}
          room={rooms.find((r) => r.id === previewBooking.roomId)}
          onClose={() => setPreviewBooking(null)}
        />
      )}
    </AppLayout>
  );
}
