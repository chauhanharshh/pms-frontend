import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS, Room, Booking } from "../contexts/PMSContext";
import { calculateRoomDays, formatActualCheckInDateTime, formatCurrency, generateId } from "../utils/format";
import {
  UserPlus,
  Check,
  Search,
  BedDouble,
  Users,
  Calendar,
  Phone,
  Mail,
  IndianRupee,
  CreditCard,
  FileText,
  X,
  ChevronRight,
  AlertCircle,
  Star,
  Home,
  LogIn,
  BookOpen,
  Building2,
  ArrowRight,
  Eye,
} from "lucide-react";
import { BookingPreviewModal } from "../components/BookingPreviewModal";
import { calculateRoomTax } from "../utils/tax";

const GOLD = "var(--accent-color, #C6A75E)";
const DARKGOLD = "var(--primary, #A8832D)";
const BG = "var(--background, #FAF7F2)";
const BORDER = "#E5E1DA";

type WizardStep = "type" | "guest" | "room" | "payment" | "confirm";

const EMPTY_GUEST = {
  guestName: "",
  guestPhone: "",
  guestEmail: "",
  plan: "EP",
  addressLine: "",
  idProof: "",
  adults: 1,
  children: 0,
  checkInDate: "",
  checkOutDate: "",
  checkInTime: "12:00",
  checkOutTime: "11:00",
  specialRequests: "",
  advanceAmount: 0,
  paymentMode: "Cash",
  companyId: "",
  companyName: "",
  companyGst: "",
  comingFrom: "",
  goingTo: "",
  purposeOfVisit: "Tourism",
  marketSegment: "",
  businessSource: "",
  vehicleDetails: "",
  remarks: "",
};

function daysBetween(a: string, b: string) {
  return calculateRoomDays(a, b);
}

function today() {
  return new Date().toISOString().split("T")[0];
}
function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

// ── ROOM PICKER ────────────────────────────────────────────────
function RoomPicker({
  rooms,
  selected,
  onSelect,
}: {
  rooms: Room[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [filter, setFilter] = useState<"all" | string>("all");
  const types = [
    ...new Set(rooms.filter((r) => r.status === "vacant").map((r) => r.roomType?.name || "Standard")),
  ];
  const available = rooms.filter(
    (r) => r.status === "vacant" && (filter === "all" || (r.roomType?.name || "Standard") === filter),
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
          style={{
            background: filter === "all" ? GOLD : "#FFFFFF",
            color: filter === "all" ? "white" : DARKGOLD,
            border: `1px solid ${filter === "all" ? GOLD : BORDER}`,
          }}
        >
          All Types
        </button>
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t as any)}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
            style={{
              background: filter === t ? GOLD : "#FFFFFF",
              color: filter === t ? "white" : DARKGOLD,
              border: `1px solid ${filter === t ? GOLD : BORDER}`,
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
        {available.map((r) => (
          <button
            key={r.id}
            onClick={() => onSelect(r.id)}
            className="p-3 rounded-xl text-left transition-all"
            style={{
              background: selected === r.id ? "rgba(221, 215, 204,0.1)" : "white",
              border: `2px solid ${selected === r.id ? GOLD : BORDER}`,
            }}
          >
            <div
              className="font-bold text-sm"
              style={{
                fontFamily: "Times New Roman, serif",
                color: selected === r.id ? DARKGOLD : "#1F2937",
              }}
            >
              Room {r.roomNumber}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
              Floor {r.floor} · {r.roomType?.name || "Standard"}
            </div>
            <div className="text-xs" style={{ color: "#9CA3AF" }}>
              Max {r.maxOccupancy} guests
            </div>
          </button>
        ))}
        {available.length === 0 && (
          <div
            className="col-span-3 text-center py-8 text-sm"
            style={{ color: "#9CA3AF" }}
          >
            No vacant rooms of this type
          </div>
        )}
      </div>
    </div>
  );
}

export function CheckIn() {
  const { user, currentHotelId } = useAuth();
  const { bookings, rooms, updateBooking, walkInCheckIn, hotels, companies } = usePMS();
  const isAdmin = user?.role === "admin";
  const hotelId = isAdmin
    ? (currentHotelId || hotels[0]?.id || "")
    : (user?.hotelId || "");

  const [mode, setMode] = useState<"list" | "walkin">("list");
  const [step, setStep] = useState<WizardStep>("type");
  const [checkInType, setCheckInType] = useState<"walkin" | "reservation">("walkin");
  const [form, setForm] = useState({
    ...EMPTY_GUEST,
    checkInDate: today(),
    checkOutDate: tomorrow(),
  });
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [customRoomRate, setCustomRoomRate] = useState<number>(0);
  const [roomRateInput, setRoomRateInput] = useState("");
  const [search, setSearch] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [previewBooking, setPreviewBooking] = useState<Booking | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [reservationId, setReservationId] = useState("");
  // Tracks the source reservation booking ID when doing room-assign flow
  const [sourceReservationId, setSourceReservationId] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();
  const paramRoomId = searchParams.get("roomId");
  const paramBookingId = searchParams.get("bookingId");

  useEffect(() => {
    if (paramRoomId) {
      setMode("walkin");
      setStep("guest"); // Skip type selection and go to guest details if room is pre-selected
      setSelectedRoomId(paramRoomId);
      const room = rooms.find((r) => r.id === paramRoomId);
      if (room) {
        const baseRate = Number(room.basePrice);
        setCustomRoomRate(baseRate);
        setRoomRateInput(String(baseRate));
      }
      // Clear the param after use to avoid re-triggering on re-render
      // setSearchParams({}, { replace: true });
    }
  }, [paramRoomId, rooms]);

  useEffect(() => {
    if (paramBookingId && bookings.length > 0) {
      const booking = bookings.find((b) => b.id === paramBookingId);
      if (booking) {
        // Clear param to avoid infinite loops or re-triggering logic
        setSearchParams((prev) => {
          prev.delete("bookingId");
          return prev;
        }, { replace: true });

        // Trigger the check-in logic (handles both direct check-in and wizard redirect)
        handleCheckInReservation(booking.id);
      }
    }
  }, [paramBookingId, bookings, setSearchParams]);

  const hotelRooms = rooms.filter((r) => r.hotelId === hotelId);
  const confirmedBookings = bookings.filter((b) => {
    const matchHotel = b.hotelId === hotelId;
    const roomNum = b.room?.roomNumber || "";
    const matchSearch =
      b.guestName.toLowerCase().includes(search.toLowerCase()) ||
      roomNum.includes(search);
    return matchHotel && (b.status === "pending" || b.status === "confirmed") && matchSearch;
  });
  const checkedInBookings = bookings.filter(
    (b) => b.hotelId === hotelId && b.status === "checked_in",
  );

  const hotel = hotels.find((h) => h.id === hotelId);
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  // Seed customRoomRate when a room is selected; user can override in payment step
  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    // Do not auto-populate customRoomRate from room.basePrice
  };

  const nights =
    form.checkInDate && form.checkOutDate
      ? calculateRoomDays(
        `${form.checkInDate}T${form.checkInTime || "12:00"}`,
        `${form.checkOutDate}T${form.checkOutTime || "12:00"}`,
      )
      : 1;
  const roomRate = customRoomRate > 0 
    ? customRoomRate 
    : (checkInType === "reservation" 
        ? Number(bookings.find(b => b.id === reservationId)?.roomPrice || 0) 
        : Number(selectedRoom?.basePrice || 0));
  const roomCharge = roomRate * nights;
  const taxInfo = calculateRoomTax(roomRate, nights);
  const gst = taxInfo.amount;
  const grandTotal = roomCharge + gst;
  const balance = grandTotal - form.advanceAmount;

  const f = (key: keyof typeof form, val: any) =>
    setForm((p) => ({ ...p, [key]: val }));

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 5000);
  };

  // Check-in from reservation — calls real backend endpoint
  // If the booking has NO roomId (manual string or no room assigned), redirect to
  // the walk-in wizard at the "room" step with all details pre-filled.
  const handleCheckInReservation = async (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    // ── Case: no room assigned — redirect to room-picker wizard ─────────────
    if (!booking.roomId) {
      // Pre-fill form from reservation data
      setForm({
        guestName: booking.guestName || "",
        guestPhone: booking.guestPhone || "",
        guestEmail: booking.guestEmail || "",
        plan: (booking as any).plan || "EP",
        addressLine: (booking as any).addressLine || "",
        idProof: (booking as any).idProof || "",
        adults: booking.adults ?? 1,
        children: booking.children ?? 0,
        checkInDate: booking.checkInDate
          ? new Date(booking.checkInDate).toISOString().split("T")[0]
          : today(),
        checkOutDate: booking.checkOutDate
          ? new Date(booking.checkOutDate).toISOString().split("T")[0]
          : tomorrow(),
        checkInTime: (booking as any).checkInTime || "12:00",
        checkOutTime: (booking as any).checkOutTime || hotel?.checkOutTime || "11:00",
        specialRequests: (booking as any).specialRequests || "",
        advanceAmount: Number(booking.advanceAmount) || 0,
        paymentMode: (booking as any).paymentMode || "Cash",
        companyId: (booking as any).companyId || "",
        companyName: (booking as any).companyName || "",
        companyGst: (booking as any).companyGst || "",
        comingFrom: (booking as any).comingFrom || "",
        goingTo: (booking as any).goingTo || "",
        purposeOfVisit: (booking as any).purposeOfVisit || "Tourism",
        marketSegment: (booking as any).marketSegment || "",
        businessSource: (booking as any).businessSource || "",
        vehicleDetails: (booking as any).vehicleDetails || "",
        remarks: (booking as any).remarks || "",
      });
      // Pre-fill room rate from the reservation's roomPrice
      const reservedRate = Number((booking as any).roomPrice || 0);
      if (reservedRate > 0) {
        setCustomRoomRate(reservedRate);
        setRoomRateInput(String(reservedRate));
      }
      // Remember the source reservation so we can cancel it after check-in
      setSourceReservationId(bookingId);
      setSelectedRoomId("");
      setCheckInType("walkin");
      setMode("walkin");
      setStep("room"); // jump straight to room selection
      return;
    }

    // ── Case: room is assigned — standard direct check-in ───────────────────
    const now = new Date();
    const actualCheckInTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    try {
      await updateBooking(bookingId, {
        status: "checked_in",
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        checkInTime: actualCheckInTime,
        checkOutTime: booking.checkOutTime || hotel?.checkOutTime || "11:00",
        roomPrice: Number(booking.roomPrice || 0),
      } as any);
      showSuccess(
        `✓ ${booking.guestName} checked in to Room ${booking.room?.roomNumber || ""}`,
      );
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.message || "Check-in failed");
      setTimeout(() => setErrorMsg(""), 4000);
    }
  };

  // Walk-in check-in — calls real backend walk-in endpoint
  const handleWalkIn = async () => {
    if (!selectedRoom) return;
    if (form.advanceAmount > grandTotal) {
      setErrorMsg("Advance cannot exceed Grand Total");
      return;
    }
    setErrorMsg("");
    try {
      const result = await walkInCheckIn({
        roomId: selectedRoomId,
        plan: form.plan || "EP",
        guestName: form.guestName,
        guestPhone: form.guestPhone,
        guestEmail: form.guestEmail || undefined,
        addressLine: form.addressLine || undefined,
        idProof: form.idProof || undefined,
        adults: form.adults,
        children: form.children,
        checkInDate: form.checkInDate,
        checkOutDate: form.checkOutDate,
        checkInTime: form.checkInTime || undefined,
        checkOutTime: form.checkOutTime || undefined,
        advanceAmount: form.advanceAmount,
        paymentMode: form.paymentMode,
        specialRequests: form.specialRequests || undefined,
        companyId: form.companyId || undefined,
        companyName: form.companyName || undefined,
        companyGst: form.companyGst || undefined,
        roomRate,
        taxAmount: gst,
        comingFrom: form.comingFrom || undefined,
        goingTo: form.goingTo || undefined,
        purposeOfVisit: form.purposeOfVisit || undefined,
        marketSegment: form.marketSegment || undefined,
        businessSource: form.businessSource || undefined,
        vehicleDetails: form.vehicleDetails || undefined,
        remarks: form.remarks || undefined,
      });

      // If this walk-in was triggered from a reservation-without-room, cancel that reservation
      if (sourceReservationId) {
        try {
          await updateBooking(sourceReservationId, { status: "cancelled" } as any);
        } catch (_) {
          // Non-critical: walk-in succeeded, reservation cancel failure is a warning only
        }
        setSourceReservationId("");
      }

      showSuccess(
        `✓ ${form.guestName} checked in to Room ${selectedRoom.roomNumber} — Booking #${result.booking.id.slice(-6).toUpperCase()}`,
      );
      setMode("list");
      setStep("type");
      setForm({ ...EMPTY_GUEST, checkInDate: today(), checkOutDate: tomorrow() });
      setSelectedRoomId("");
      setCustomRoomRate(0);
      setRoomRateInput("");
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.message || "Walk-in check-in failed. Please try again.");
    }
  };

  const stepTitles: Record<WizardStep, string> = {
    type: "Choose Check-In Type",
    guest: "Guest Details",
    room: "Select Room",
    payment: "Payment & Advance",
    confirm: "Confirm Check-In",
  };

  const steps: WizardStep[] = ["type", "guest", "room", "payment", "confirm"];
  const currentIdx = steps.indexOf(step);

  const canNext = () => {
    if (step === "type") return true;
    if (step === "guest")
      return (
        !!form.guestName &&
        !!form.guestPhone &&
        !!form.checkInDate &&
        !!form.checkOutDate
      );
    if (step === "room") return !!selectedRoomId;
    if (step === "payment") return true;
    return true;
  };

  const goNext = () => {
    if (step === "type" && checkInType === "reservation") return; // handled by confirm
    const next = steps[currentIdx + 1];
    if (next) setStep(next);
  };
  const goPrev = () => {
    const prev = steps[currentIdx - 1];
    if (prev) setStep(prev);
  };

  // Guard for admin without selected hotel
  if (isAdmin && !currentHotelId) {
    return (
      <AppLayout title="Check-In">
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 bg-white rounded-2xl border border-[#E5E1DA] shadow-sm">
          <div className="w-16 h-16 bg-[#F3F4F6] rounded-full flex items-center justify-center mb-4 text-[#9CA3AF]">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#1F2937] mb-2" style={{ fontFamily: "Times New Roman, serif" }}>
            No Hotel Selected
          </h2>
          <p className="text-[#6B7280] max-w-sm text-sm">
            Please select a specific hotel from the top-left dropdown to perform a New Check-In.
          </p>
        </div>
      </AppLayout>
    );
  }

  if (mode === "walkin") {
    return (
      <AppLayout title="Check-In" requiredRole="hotel">
        <div className="max-w-2xl space-y-5">
          {/* Back + progress */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setMode("list");
                setStep("type");
              }}
              className="flex items-center gap-1.5 text-sm"
              style={{ color: DARKGOLD }}
            >
              <X className="w-4 h-4" /> Cancel
            </button>
            <div className="flex-1 flex gap-2">
              {steps.slice(1).map((s, i) => (
                <div
                  key={s}
                  className="flex-1 h-1.5 rounded-full transition-all"
                  style={{
                    background: steps.indexOf(step) > i ? GOLD : "#E5E1DA",
                  }}
                />
              ))}
            </div>
          </div>

          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "white", border: `1px solid ${BORDER}` }}
          >
            <div
              className="px-6 py-4"
              style={{
                background: "#FFFFFF",
                borderBottom: `2px solid ${BORDER}`,
              }}
            >
              <h2
                style={{
                  fontFamily: "Times New Roman, serif",
                  color: DARKGOLD,
                  fontSize: "1.1rem",
                }}
              >
                {stepTitles[step]}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                Step {currentIdx + 1} of {steps.length}
              </p>
            </div>

            <div className="p-6">
              {/* Step 1: Type */}
              {step === "type" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {
                        type: "walkin",
                        icon: <LogIn className="w-6 h-6" />,
                        label: "Walk-in Guest",
                        desc: "New guest arriving directly",
                      },
                      {
                        type: "reservation",
                        icon: <BookOpen className="w-6 h-6" />,
                        label: "From Reservation",
                        desc: "Guest with prior booking",
                      },
                    ].map((opt) => (
                      <button
                        key={opt.type}
                        onClick={() => setCheckInType(opt.type as any)}
                        className="p-5 rounded-xl text-left transition-all"
                        style={{
                          border: `2px solid ${checkInType === opt.type ? GOLD : BORDER}`,
                          background:
                            checkInType === opt.type
                              ? "rgba(184,134,11,0.06)"
                              : "white",
                        }}
                      >
                        <div
                          className="mb-2"
                          style={{
                            color: checkInType === opt.type ? GOLD : "#9CA3AF",
                          }}
                        >
                          {opt.icon}
                        </div>
                        <div
                          className="font-bold text-sm"
                          style={{
                            fontFamily: "Times New Roman, serif",
                            color:
                              checkInType === opt.type ? DARKGOLD : "#1F2937",
                          }}
                        >
                          {opt.label}
                        </div>
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: "#9CA3AF" }}
                        >
                          {opt.desc}
                        </div>
                      </button>
                    ))}
                  </div>

                  {checkInType === "reservation" && (
                    <div className="space-y-2 mt-4">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: DARKGOLD }}
                      >
                        Pending Reservations
                      </p>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {confirmedBookings.map((b) => (
                          <div
                            key={b.id}
                            className="flex items-center gap-3 p-3 rounded-xl"
                            style={{
                              border: `1px solid ${BORDER}`,
                              background: "#FFFFFF",
                            }}
                          >
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                              style={{
                                background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`,
                              }}
                            >
                              {b.guestName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div
                                className="font-semibold text-sm"
                                style={{ color: "#1F2937" }}
                              >
                                {b.guestName}
                              </div>
                              <div
                                className="text-xs"
                                style={{ color: "#6B7280" }}
                              >
                                Room {b.room?.roomNumber || b.roomId?.slice(-4)} · {formatActualCheckInDateTime(b as any, (b as any)?.reservation, b.checkInDate)} →{" "}
                                {b.checkOutDate}
                              </div>
                            </div>
                            <div className="text-right mr-2">
                              <div
                                className="text-sm font-bold"
                                style={{ color: GOLD }}
                              >
                                {formatCurrency(b.totalAmount)}
                              </div>
                              <div
                                className="text-xs"
                                style={{ color: "#16a34a" }}
                              >
                                Adv: {formatCurrency(b.advanceAmount)}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 flex-shrink-0">
                              <button
                                onClick={() => {
                                  handleCheckInReservation(b.id);
                                  setMode("list");
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-sm flex items-center justify-center"
                                style={{ background: "#16a34a" }}
                              >
                                Check In
                              </button>
                              <button
                                onClick={() => setPreviewBooking(b)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 border text-gray-700 flex flex-center shadow-sm flex items-center justify-center gap-1"
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </button>
                            </div>
                          </div>
                        ))}
                        {confirmedBookings.length === 0 && (
                          <div
                            className="text-center py-6 text-sm"
                            style={{ color: "#9CA3AF" }}
                          >
                            No pending reservations
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Guest details */}
              {step === "guest" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label
                      className="block text-xs font-bold mb-1 uppercase tracking-wide"
                      style={{ color: DARKGOLD }}
                    >
                      Guest Full Name *
                    </label>
                    <input
                      className="w-full px-3 py-3 rounded-lg outline-none text-sm"
                      style={{ border: `2px solid ${BORDER}` }}
                      value={form.guestName}
                      onChange={(e) => f("guestName", e.target.value)}
                      placeholder="e.g. Rajesh Kumar"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-bold mb-1 uppercase tracking-wide"
                      style={{ color: DARKGOLD }}
                    >
                      Phone *
                    </label>
                    <input
                      className="w-full px-3 py-3 rounded-lg outline-none text-sm"
                      style={{ border: `2px solid ${BORDER}` }}
                      value={form.guestPhone}
                      onChange={(e) => f("guestPhone", e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-bold mb-1 uppercase tracking-wide"
                      style={{ color: DARKGOLD }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-3 rounded-lg outline-none text-sm"
                      style={{ border: `2px solid ${BORDER}` }}
                      value={form.guestEmail}
                      onChange={(e) => f("guestEmail", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <label
                      className="block text-xs font-bold mb-1 uppercase tracking-wide"
                      style={{ color: DARKGOLD }}
                    >
                      Address
                    </label>
                    <input
                      className="w-full px-3 py-3 rounded-lg outline-none text-sm"
                      style={{ border: `2px solid ${BORDER}` }}
                      value={form.addressLine}
                      onChange={(e) => f("addressLine", e.target.value)}
                      placeholder="Home address"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-bold mb-1 uppercase tracking-wide"
                      style={{ color: DARKGOLD }}
                    >
                      ID Proof
                    </label>
                    <input
                      className="w-full px-3 py-3 rounded-lg outline-none text-sm"
                      style={{ border: `2px solid ${BORDER}` }}
                      value={form.idProof}
                      onChange={(e) => f("idProof", e.target.value)}
                      placeholder="Aadhar / Passport No."
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-bold mb-1 uppercase tracking-wide"
                      style={{ color: DARKGOLD }}
                    >
                      Guests
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div
                          className="text-xs mb-1"
                          style={{ color: "#9CA3AF" }}
                        >
                          Adults
                        </div>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          className="w-full px-3 py-3 rounded-lg outline-none text-sm"
                          style={{ border: `2px solid ${BORDER}` }}
                          value={form.adults}
                          onChange={(e) => f("adults", +e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <div
                          className="text-xs mb-1"
                          style={{ color: "#9CA3AF" }}
                        >
                          Children
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          className="w-full px-3 py-3 rounded-lg outline-none text-sm"
                          style={{ border: `2px solid ${BORDER}` }}
                          value={form.children}
                          onChange={(e) => f("children", +e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-xs font-bold mb-1 uppercase tracking-wide"
                      style={{ color: DARKGOLD }}
                    >
                      Check-In Date *
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-3 rounded-lg outline-none text-sm"
                      style={{ border: `2px solid ${BORDER}` }}
                      value={form.checkInDate}
                      onChange={(e) => f("checkInDate", e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-bold mb-1 uppercase tracking-wide"
                      style={{ color: DARKGOLD }}
                    >
                      Check-In Time
                    </label>
                    <input
                      type="time"
                      className="w-full px-3 py-3 rounded-lg outline-none text-sm"
                      style={{ border: `2px solid ${BORDER}` }}
                      value={form.checkInTime}
                      onChange={(e) => f("checkInTime", e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-bold mb-1 uppercase tracking-wide"
                      style={{ color: DARKGOLD }}
                    >
                      Plan
                    </label>
                    <select
                      className="w-full px-3 py-3 rounded-lg outline-none text-sm"
                      style={{ border: `2px solid ${BORDER}` }}
                      value={form.plan || "EP"}
                      onChange={(e) => f("plan", e.target.value)}
                    >
                      <option value="EP">EP - European Plan (Room Only)</option>
                      <option value="CP">CP - Continental Plan (Room + Breakfast)</option>
                      <option value="AP">AP - American Plan (All Meals)</option>
                      <option value="MAP">MAP - Modified American Plan (Breakfast + Dinner)</option>
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-xs font-bold mb-1 uppercase tracking-wide"
                      style={{ color: DARKGOLD }}
                    >
                      Check-Out Date *
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-3 rounded-lg outline-none text-sm"
                      style={{ border: `2px solid ${BORDER}` }}
                      value={form.checkOutDate}
                      onChange={(e) => f("checkOutDate", e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-bold mb-1 uppercase tracking-wide"
                      style={{ color: DARKGOLD }}
                    >
                      Check-Out Time
                    </label>
                    <input
                      type="time"
                      className="w-full px-3 py-3 rounded-lg outline-none text-sm"
                      style={{ border: `2px solid ${BORDER}` }}
                      value={form.checkOutTime}
                      onChange={(e) => f("checkOutTime", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <label
                      className="block text-xs font-bold mb-1 uppercase tracking-wide"
                      style={{ color: DARKGOLD }}
                    >
                      Corporate Client / Company
                    </label>
                    <select
                      className="w-full px-3 py-2.5 rounded-lg text-sm bg-white outline-none cursor-pointer transition-shadow focus:shadow-md"
                      style={{ border: `2px solid ${BORDER}` }}
                      value={form.companyId || ""}
                      onChange={(e) => f("companyId", e.target.value)}
                    >
                      <option value="">-- Optional: Select Company --</option>
                      {companies.filter(c => c.isActive).map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.gstNumber ? `(GST: ${c.gstNumber})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label
                      className="block text-xs font-bold mb-1 uppercase tracking-wide"
                      style={{ color: DARKGOLD }}
                    >
                      Special Requests
                    </label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-lg outline-none text-sm resize-none"
                      style={{ border: `2px solid ${BORDER}` }}
                      value={form.specialRequests}
                      onChange={(e) => f("specialRequests", e.target.value)}
                      placeholder="Any special requests or notes…"
                    />
                  </div>

                  {/* Other Details Section */}
                  <div className="col-span-2 mt-4">
                    <div
                      className="p-4 rounded-xl space-y-4"
                      style={{ background: "#FBFAF8", border: `1px solid ${BORDER}` }}
                    >
                      <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: DARKGOLD, fontFamily: "Times New Roman, serif" }}>
                        <FileText className="w-4 h-4" /> Other Details
                      </h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold mb-1 uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
                            Billing Company Name (Optional)
                          </label>
                          <input
                            className="w-full px-3 py-2 rounded-lg outline-none text-sm bg-white"
                            style={{ border: `1px solid ${BORDER}` }}
                            value={form.companyName || ""}
                            onChange={(e) => f("companyName", e.target.value)}
                            placeholder="If billing to a company"
                            disabled={!!form.companyId}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold mb-1 uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
                            Company GST (Optional)
                          </label>
                          <input
                            className="w-full px-3 py-2 rounded-lg outline-none text-sm bg-white"
                            style={{ border: `1px solid ${BORDER}` }}
                            value={form.companyGst || ""}
                            onChange={(e) => f("companyGst", e.target.value)}
                            placeholder="GSTIN"
                            disabled={!!form.companyId}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold mb-1 uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
                            Coming From
                          </label>
                          <input
                            className="w-full px-3 py-2 rounded-lg outline-none text-sm bg-white"
                            style={{ border: `1px solid ${BORDER}` }}
                            value={form.comingFrom}
                            onChange={(e) => f("comingFrom", e.target.value)}
                            placeholder="Previous location"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold mb-1 uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
                            Going To
                          </label>
                          <input
                            className="w-full px-3 py-2 rounded-lg outline-none text-sm bg-white"
                            style={{ border: `1px solid ${BORDER}` }}
                            value={form.goingTo}
                            onChange={(e) => f("goingTo", e.target.value)}
                            placeholder="Next destination"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold mb-1 uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
                            Purpose of Visit *
                          </label>
                          <select
                            className="w-full px-3 py-2 rounded-lg outline-none text-sm bg-white cursor-pointer"
                            style={{ border: `1px solid ${BORDER}` }}
                            value={form.purposeOfVisit}
                            onChange={(e) => f("purposeOfVisit", e.target.value)}
                            required
                          >
                            <option value="Business">Business</option>
                            <option value="Tourism">Tourism</option>
                            <option value="Religious Visit">Religious Visit</option>
                            <option value="Family Visit">Family Visit</option>
                            <option value="Official Work">Official Work</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold mb-1 uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
                            Market Segment
                          </label>
                          <select
                            className="w-full px-3 py-2 rounded-lg outline-none text-sm bg-white cursor-pointer"
                            style={{ border: `1px solid ${BORDER}` }}
                            value={form.marketSegment}
                            onChange={(e) => f("marketSegment", e.target.value)}
                          >
                            <option value="">-- Select Segment --</option>
                            <option value="Direct Walk-in">Direct Walk-in</option>
                            <option value="Corporate">Corporate</option>
                            <option value="Online Booking">Online Booking</option>
                            <option value="Travel Agent">Travel Agent</option>
                            <option value="Government">Government</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold mb-1 uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
                            Business Source
                          </label>
                          <select
                            className="w-full px-3 py-2 rounded-lg outline-none text-sm bg-white cursor-pointer"
                            style={{ border: `1px solid ${BORDER}` }}
                            value={form.businessSource}
                            onChange={(e) => f("businessSource", e.target.value)}
                          >
                            <option value="">-- Select Source --</option>
                            <option value="Walk-in">Walk-in</option>
                            <option value="Booking.com">Booking.com</option>
                            <option value="MakeMyTrip">MakeMyTrip</option>
                            <option value="Goibibo">Goibibo</option>
                            <option value="Travel Agent">Travel Agent</option>
                            <option value="Corporate">Corporate</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold mb-1 uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
                            Vehicle Details
                          </label>
                          <input
                            className="w-full px-3 py-2 rounded-lg outline-none text-sm bg-white"
                            style={{ border: `1px solid ${BORDER}` }}
                            value={form.vehicleDetails}
                            onChange={(e) => f("vehicleDetails", e.target.value)}
                            placeholder="UP07 AB 1234"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold mb-1 uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
                            Remarks
                          </label>
                          <textarea
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg outline-none text-sm resize-none bg-white"
                            style={{ border: `1px solid ${BORDER}` }}
                            value={form.remarks}
                            onChange={(e) => f("remarks", e.target.value)}
                            placeholder="Extra guest notes or special instructions."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Room selection */}
              {step === "room" && (
                <div className="space-y-3">
                  {/* Info banner when arriving from a reservation-without-room */}
                  {sourceReservationId && (
                    <div
                      className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
                      style={{
                        background: "linear-gradient(135deg, #FFF8E7, #FFF3D0)",
                        border: `1.5px solid ${GOLD}`,
                        color: DARKGOLD,
                      }}
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: GOLD }} />
                      <div>
                        <div className="font-semibold">Assign a Room for {form.guestName}</div>
                        <div className="text-xs mt-0.5" style={{ color: "#92763A" }}>
                          This reservation had no room assigned. Select a vacant room below to complete check-in.
                          Rate ₹{customRoomRate > 0 ? customRoomRate : "—"}/night from reservation.
                        </div>
                      </div>
                    </div>
                  )}
                  <div
                    className="px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: "#FFFFFF",
                      border: `1px solid #E5E1DA`,
                      color: DARKGOLD,
                    }}
                  >
                    {form.guestName} · {form.adults + form.children} guests ·{" "}
                    {nights} nights ({form.checkInDate} → {form.checkOutDate})
                  </div>
                  <RoomPicker
                    rooms={hotelRooms}
                    selected={selectedRoomId}
                    onSelect={handleRoomSelect}
                  />
                </div>
              )}

              {/* Step 4: Payment */}
              {step === "payment" && selectedRoom && (
                <div className="space-y-4">
                  {/* Editable Room Rate input */}
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: "rgba(198,167,94,0.05)",
                      border: `1.5px solid ${GOLD}`,
                    }}
                  >
                    <label
                      className="block text-xs font-bold mb-2 uppercase tracking-wide"
                      style={{ color: DARKGOLD }}
                    >
                      Room Rate (₹ / night)
                    </label>
                    <div className="relative">
                      <span
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold"
                        style={{ color: GOLD }}
                      >
                        ₹
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="w-full pl-8 pr-4 py-3 rounded-xl outline-none text-lg font-bold"
                        style={{
                          border: `2px solid ${GOLD}`,
                          color: DARKGOLD,
                          background: "white",
                        }}
                        value={roomRateInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          setRoomRateInput(val);
                          setCustomRoomRate(val === "" ? 0 : Number(val));
                        }}
                        onKeyDown={(e) => {
                          if (
                            e.key !== "Backspace" &&
                            e.key !== "Delete" &&
                            e.key !== "ArrowLeft" &&
                            e.key !== "ArrowRight" &&
                            e.key !== "Tab" &&
                            !/^\d$/.test(e.key)
                          ) {
                            e.preventDefault();
                          }
                        }}
                      />
                    </div>
                    <p className="text-xs mt-1.5" style={{ color: "#9CA3AF" }}>
                      Base rate: {formatCurrency(Number(selectedRoom.basePrice))}/night — you can override for this booking
                    </p>
                  </div>

                  {/* Pricing breakdown */}
                  <div
                    className="rounded-xl p-4 space-y-2"
                    style={{
                      background: "#FFFFFF",
                      border: `1px solid #E5E1DA`,
                    }}
                  >
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "#6B7280" }}>
                        Room {selectedRoom.roomNumber} ({selectedRoom.roomType?.name || "Standard"})
                      </span>
                      <span style={{ color: DARKGOLD }}>
                        {nights} nights × {formatCurrency(roomRate)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "#6B7280" }}>
                        GST ({taxInfo.rate}%)
                      </span>
                      <span>{formatCurrency(gst)}</span>
                    </div>
                    <div
                      className="flex justify-between font-bold border-t pt-2"
                      style={{ borderColor: "#E5E1DA" }}
                    >
                      <span style={{ color: DARKGOLD }}>Grand Total</span>
                      <span style={{ color: GOLD, fontSize: "1.1rem" }}>
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-xs font-bold mb-2 uppercase tracking-wide"
                      style={{ color: DARKGOLD }}
                    >
                      Advance Payment (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={grandTotal}
                      className="w-full px-4 py-3 rounded-xl outline-none text-lg font-medium"
                      style={{ border: `2px solid ${BORDER}` }}
                      value={form.advanceAmount}
                      onChange={(e) => f("advanceAmount", +e.target.value)}
                    />
                    {form.advanceAmount > 0 && (
                      <p className="text-xs mt-1" style={{ color: "#16a34a" }}>
                        Balance on checkout:{" "}
                        {formatCurrency(Math.max(0, balance))}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      className="block text-xs font-bold mb-2 uppercase tracking-wide"
                      style={{ color: DARKGOLD }}
                    >
                      Payment Mode
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        "Cash",
                        "Card",
                        "UPI",
                        "Bank Transfer",
                        "Cheque",
                        "Credit",
                      ].map((mode) => (
                        <button
                          key={mode}
                          onClick={() => f("paymentMode", mode)}
                          className="py-2 rounded-xl text-xs font-medium transition-all"
                          style={{
                            background:
                              form.paymentMode === mode
                                ? `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`
                                : "#FFFFFF",
                            color:
                              form.paymentMode === mode ? "white" : DARKGOLD,
                            border: `1.5px solid ${form.paymentMode === mode ? GOLD : BORDER}`,
                          }}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Confirmation */}
              {step === "confirm" && selectedRoom && (
                <div className="space-y-4">
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ border: `1px solid ${BORDER}` }}
                  >
                    <div
                      className="px-4 py-3"
                      style={{
                        background: "#FFFFFF",
                        borderBottom: `1px solid ${BORDER}`,
                      }}
                    >
                      <h4
                        className="font-bold text-sm"
                        style={{
                          fontFamily: "Times New Roman, serif",
                          color: DARKGOLD,
                        }}
                      >
                        Booking Summary
                      </h4>
                    </div>
                    <div className="p-4 space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-y-2">
                        <span style={{ color: "#6B7280" }}>Guest</span>
                        <span
                          className="font-semibold"
                          style={{ color: "#1F2937" }}
                        >
                          {form.guestName}
                        </span>
                        <span style={{ color: "#6B7280" }}>Phone</span>
                        <span>{form.guestPhone}</span>
                        <span style={{ color: "#6B7280" }}>ID Proof</span>
                        <span>{form.idProof || "–"}</span>
                        <span style={{ color: "#6B7280" }}>Room</span>
                        <span
                          className="font-semibold"
                          style={{ color: DARKGOLD }}
                        >
                          {selectedRoom.roomNumber} ({selectedRoom.roomType?.name || "Standard"}, Floor{" "}
                          {selectedRoom.floor})
                        </span>
                        <span style={{ color: "#6B7280" }}>Stay</span>
                        <span>
                          {form.checkInDate} → {form.checkOutDate} ({nights}{" "}
                          nights)
                        </span>
                        <span style={{ color: "#6B7280" }}>Guests</span>
                        <span>
                          {form.adults} adults, {form.children} children
                        </span>
                        <span style={{ color: "#6B7280" }}>Total Amount</span>
                        <span className="font-bold" style={{ color: GOLD }}>
                          {formatCurrency(grandTotal)}
                        </span>
                        <span style={{ color: "#6B7280" }}>Advance Paid</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(form.advanceAmount)}
                        </span>
                        <span style={{ color: "#6B7280" }}>Balance Due</span>
                        <span
                          className="font-semibold"
                          style={{ color: balance > 0 ? "#dc2626" : "#16a34a" }}
                        >
                          {formatCurrency(Math.max(0, balance))} at checkout
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleWalkIn}
                    className="w-full py-4 rounded-xl font-bold text-white text-base flex items-center justify-center gap-2 cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, #16a34a, #15803d)`,
                      boxShadow: "0 4px 12px rgba(22,163,74,0.3)",
                    }}
                  >
                    <Check className="w-5 h-5" /> Confirm Check-In for{" "}
                    {form.guestName}
                  </button>
                </div>
              )}
            </div>

            {/* Step nav */}
            {(step !== "type" || checkInType === "walkin") &&
              step !== "confirm" && (
                <div
                  className="px-6 py-4 flex justify-between gap-3"
                  style={{ borderTop: `1px solid ${BORDER}` }}
                >
                  <button
                    onClick={step === "guest" ? () => setStep("type") : goPrev}
                    className="px-4 py-2 rounded-xl text-sm"
                    style={{ border: `1px solid ${BORDER}`, color: DARKGOLD }}
                  >
                    Back
                  </button>
                  {checkInType === "walkin" && (
                    <button
                      onClick={goNext}
                      disabled={!canNext()}
                      className="px-6 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-40"
                      style={{
                        background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`,
                      }}
                    >
                      {step === "payment" ? "Review & Confirm" : "Continue"} →
                    </button>
                  )}
                </div>
              )}
          </div>
        </div>
      </AppLayout>
    );
  }

  // LIST MODE
  return (
    <AppLayout title="Check-In">
      <div className="space-y-5 max-w-5xl">
        {successMsg && (
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-3 fixed top-5 right-5 z-50"
            style={{
              background: "#dcfce7",
              border: "1px solid #86efac",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              {successMsg}
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div
            className="rounded-xl p-4"
            style={{
              background: `linear-gradient(135deg, #DDD7CC, #CFC8BC)`,
              border: "1px solid #E5E1DA",
            }}
          >
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
              Pending Check-ins
            </p>
            <p
              className="text-3xl font-bold mt-1"
              style={{ color: GOLD, fontFamily: "Times New Roman, serif" }}
            >
              {confirmedBookings.length}
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: "white", border: `1px solid ${BORDER}` }}
          >
            <p className="text-xs" style={{ color: "#6B7280" }}>
              Currently In-House
            </p>
            <p
              className="text-3xl font-bold mt-1 text-green-600"
              style={{ fontFamily: "Times New Roman, serif" }}
            >
              {checkedInBookings.length}
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: "white", border: `1px solid ${BORDER}` }}
          >
            <p className="text-xs" style={{ color: "#6B7280" }}>
              Vacant Rooms
            </p>
            <p
              className="text-3xl font-bold mt-1 text-blue-600"
              style={{ fontFamily: "Times New Roman, serif" }}
            >
              {hotelRooms.filter((r) => r.status === "vacant").length}
            </p>
          </div>
        </div>

        {/* Action + search */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setMode("walkin");
              setStep("type");
              setCheckInType("walkin");
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white text-sm"
            style={{
              background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`,
              boxShadow: "0 2px 8px #E5E1DA",
            }}
          >
            <UserPlus className="w-4 h-4" /> Walk-in Check-in
          </button>
          <div className="relative flex-1 max-w-xs">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: GOLD }}
            />
            <input
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: `1.5px solid ${BORDER}`, background: "white" }}
              placeholder="Search guest or room…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Pending reservations */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "white",
            border: `1px solid ${BORDER}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            className="px-6 py-4 flex items-center gap-2"
            style={{
              background: "#FFFFFF",
              borderBottom: `2px solid ${BORDER}`,
            }}
          >
            <UserPlus className="w-5 h-5" style={{ color: GOLD }} />
            <h2
              className="font-bold"
              style={{ fontFamily: "Times New Roman, serif", color: DARKGOLD }}
            >
              Pending Reservations ({confirmedBookings.length})
            </h2>
          </div>
          {confirmedBookings.length === 0 ? (
            <div
              className="py-12 text-center text-sm"
              style={{ color: "#9CA3AF" }}
            >
              No pending check-ins — walk-ins can use the button above
            </div>
          ) : (
            <div
              className="divide-y"
              style={{ borderColor: "rgba(229,225,218,0.5)" }}
            >
              {confirmedBookings.map((b) => {
                const nights = calculateRoomDays(
                  `${b.checkInDate}T${(b as any)?.checkInTime || "12:00"}`,
                  `${b.checkOutDate}T${(b as any)?.checkOutTime || "12:00"}`,
                );
                return (
                  <div
                    key={b.id}
                    className="px-6 py-4 flex items-center gap-4"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#FFFFFF")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "white")
                    }
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`,
                      }}
                    >
                      {b.guestName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-semibold"
                        style={{ color: "#1F2937" }}
                      >
                        {b.guestName}
                      </div>
                      <div
                        className="text-sm flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5"
                        style={{ color: "#6B7280" }}
                      >
                        <span>📞 {b.guestPhone}</span>
                        <span>🏨 Room {b.room?.roomNumber || (b.roomId ? b.roomId.slice(-4) : '–')}</span>
                        <span>
                          📅 {formatActualCheckInDateTime(b as any, (b as any)?.reservation, b.checkInDate)} → {b.checkOutDate} ({nights}N)
                        </span>
                        <span>
                          👥 {b.adults}A/{b.children}C
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 mr-4">
                      <div className="font-bold" style={{ color: GOLD }}>
                        {formatCurrency(b.totalAmount)}
                      </div>
                      <div className="text-xs text-green-600">
                        Adv: {formatCurrency(b.advanceAmount)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewBooking(b)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 hover:bg-gray-200 border text-gray-700 transition"
                      >
                        <Eye className="w-4 h-4" /> View
                      </button>
                      <button
                        onClick={() => handleCheckInReservation(b.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
                        style={{
                          background: "linear-gradient(135deg, #16a34a, #15803d)",
                          boxShadow: "0 2px 6px rgba(22,163,74,0.3)",
                        }}
                      >
                        <Check className="w-4 h-4" /> Check In
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Currently in-house */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "white",
            border: `1px solid ${BORDER}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            className="px-6 py-4"
            style={{
              background: "#FFFFFF",
              borderBottom: `2px solid ${BORDER}`,
            }}
          >
            <h2
              className="font-bold"
              style={{ fontFamily: "Times New Roman, serif", color: DARKGOLD }}
            >
              Currently In-House ({checkedInBookings.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#FFFFFF" }}>
                  {[
                    "Guest",
                    "Room",
                    "Check-In",
                    "Check-out",
                    "Advance",
                    "Balance",
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-bold uppercase"
                      style={{
                        color: DARKGOLD,
                        borderBottom: `2px solid ${BORDER}`,
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {checkedInBookings.map((b) => (
                  <tr
                    key={b.id}
                    style={{ borderBottom: `1px solid rgba(184,134,11,0.07)` }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#FFFFFF")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "white")
                    }
                  >
                    <td
                      className="px-4 py-3 font-medium text-sm"
                      style={{ color: "#1F2937" }}
                    >
                      {b.guestName}
                    </td>
                    <td
                      className="px-4 py-3 font-bold text-sm"
                      style={{ color: DARKGOLD }}
                    >
                      Room {b.room?.roomNumber || (b.roomId ? b.roomId.slice(-4) : '–')}
                    </td>
                    <td className="px-4 py-3 text-sm">{formatActualCheckInDateTime(b as any, (b as any)?.reservation, b.checkInDate)}</td>
                    <td className="px-4 py-3 text-sm">{b.checkOutDate}</td>
                    <td className="px-4 py-3 text-sm text-green-600">
                      {formatCurrency(b.advanceAmount)}
                    </td>
                    <td
                      className="px-4 py-3 font-bold text-sm"
                      style={{ color: GOLD }}
                    >
                      {formatCurrency(Number(b.totalAmount) - Number(b.advanceAmount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {checkedInBookings.length === 0 && (
              <div
                className="text-center py-8 text-sm"
                style={{ color: "#9CA3AF" }}
              >
                No guests currently in-house
              </div>
            )}
          </div>
        </div>
      </div>
      {previewBooking && (
        <BookingPreviewModal
          booking={previewBooking}
          room={rooms.find(r => r.id === previewBooking.roomId)}
          onClose={() => setPreviewBooking(null)}
        />
      )}
    </AppLayout>
  );
}
