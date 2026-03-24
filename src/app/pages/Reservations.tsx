import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import { calculateRoomDays, formatActualCheckInDateTime, formatCurrency, formatDate } from "../utils/format";
import { Booking } from "../contexts/PMSContext";
import { BookOpen, Plus, X, Save, Search, Eye } from "lucide-react";
import { BookingPreviewModal } from "../components/BookingPreviewModal";

const GOLD = "#C6A75E";
const DARKGOLD = "#A8832D";

const emptyBooking = (hotelId: string): Omit<Booking, "id"> => ({
  hotelId,
  roomId: "",
  roomNumber: "",
  plan: "EP",
  guestName: "",
  guestPhone: "",
  guestEmail: "",
  checkInDate: new Date().toISOString().split("T")[0],
  checkOutDate: "",
  adults: 1,
  children: 0,
  totalAmount: 0,
  advanceAmount: 0,
  roomPrice: 0,
  status: "pending",
  source: "reservation",
  idProof: "",
  companyId: "",
  companyName: "",
  companyGst: "",
});

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#fef08a", text: "#a16207" },
  confirmed: { bg: "#fef08a", text: "#a16207" },
  "checked_in": { bg: "#dcfce7", text: "#166534" },
  "checked-in": { bg: "#dcfce7", text: "#166534" },
  "checked_out": { bg: "#f3e8ff", text: "#6b21a8" },
  "checked-out": { bg: "#f3e8ff", text: "#6b21a8" },
  cancelled: { bg: "#fee2e2", text: "#dc2626" },
};

export function Reservations() {
  const { user } = useAuth();
  const { bookings, addBooking, updateBooking, rooms, hotels, companies } = usePMS();
  const isAdmin = user?.role === "admin";
  const [filterHotel, setFilterHotel] = useState(
    isAdmin ? "all" : user?.hotelId || "",
  );
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [previewBooking, setPreviewBooking] = useState<Booking | null>(null);

  const defaultHotel = isAdmin
    ? filterHotel === "all"
      ? hotels[0]?.id
      : filterHotel
    : user?.hotelId || "";
  const [form, setForm] = useState(emptyBooking(defaultHotel));

  const [searchParams] = useSearchParams();
  const paramRoomId = searchParams.get("roomId");

  useEffect(() => {
    if (paramRoomId && rooms.length > 0) {
      const room = rooms.find((r) => r.id === paramRoomId);
      if (room && room.status === "vacant") {
        setShowForm(true);
        handleRoomSelect(paramRoomId);
      }
    }
  }, [paramRoomId, rooms]);

  const filtered = bookings.filter((b) => {
    const matchHotel = filterHotel === "all" || b.hotelId === filterHotel;
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    const matchSearch =
      b.guestName.toLowerCase().includes(search.toLowerCase()) ||
      (b.roomNumber || "").includes(search);
    return matchHotel && matchStatus && matchSearch;
  });

  const availableRooms = rooms.filter(
    (r) => r.hotelId === form.hotelId && r.status === "vacant",
  );

  const handleRoomSelect = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    setForm((f) => ({
      ...f,
      roomId,
      roomNumber: room.roomNumber,
      // Manual entry required - do not auto-fill roomPrice or totalAmount
    }));
  };

  const recalcTotal = (checkIn: string, checkOut: string, price?: number) => {
    const room = rooms.find((r) => r.id === form.roomId);
    if (!room || !checkIn || !checkOut) return;
    const nights = calculateRoomDays(checkIn, checkOut);
    const p = price !== undefined ? price : ((form as any).roomPrice || 0);
    setForm((f) => ({ ...f, totalAmount: p * nights }));
  };

  const handleSave = async () => {
    if (!form.guestName || !form.roomId || !form.checkOutDate || !form.roomPrice) {
      alert("Please fill in all required fields (Guest Name, Room, Room Price, and Check-out Date)");
      return;
    }

    try {
      await addBooking(form);
      setShowForm(false);
      setForm(emptyBooking(defaultHotel));
    } catch (err: any) {
      console.error("Failed to save reservation:", err);
      alert(err.response?.data?.message || "Failed to save reservation. Please try again.");
    }
  };

  return (
    <AppLayout title="Reservations">
      <div className="space-y-5 max-w-7xl">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: GOLD }}
            />
            <input
              className="pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
              style={{
                border: "2px solid #E5E1DA",
                background: "white",
              }}
              placeholder="Search guest / room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {isAdmin && (
            <select
              className="px-3 py-2 rounded-xl text-sm outline-none appearance-none"
              style={{
                border: "2px solid #E5E1DA",
                background: "white",
                color: DARKGOLD,
              }}
              value={filterHotel}
              onChange={(e) => setFilterHotel(e.target.value)}
            >
              <option value="all">All Hotels</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          )}
          <select
            className="px-3 py-2 rounded-xl text-sm outline-none appearance-none"
            style={{
              border: "2px solid #E5E1DA",
              background: "white",
              color: DARKGOLD,
            }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="checked_in">Checked-in</option>
            <option value="checked_out">Checked-out</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="flex-1" />
          <button
            onClick={() => {
              setForm(emptyBooking(defaultHotel));
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{
              background: "linear-gradient(135deg, #C6A75E, #A8832D)",
              boxShadow: "0 2px 8px #E5E1DA",
            }}
          >
            <Plus className="w-4 h-4" /> New Reservation
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
            <BookOpen className="w-5 h-5" style={{ color: GOLD }} />
            <h2
              className="font-semibold"
              style={{ fontFamily: "Times New Roman, serif", color: DARKGOLD }}
            >
              Reservations ({filtered.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#FFFFFF" }}>
                  {[
                    "Guest",
                    "Phone",
                    "Room",
                    isAdmin ? "Hotel" : null,
                    "Check-in",
                    "Check-out",
                    "Adults",
                    "Total",
                    "Advance",
                    "Status",
                    "Actions",
                  ]
                    .filter(Boolean)
                    .map((col) => (
                      <th
                        key={col!}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase"
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
                {filtered.map((b) => {
                  const { bg, text } = statusColors[b.status] || { bg: "#e5e7eb", text: "#374151" };
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
                          {b.guestName}
                        </div>
                        <div className="text-xs" style={{ color: "#9CA3AF" }}>
                          {b.guestEmail}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{b.guestPhone}</td>
                      <td
                        className="px-4 py-3 text-sm font-semibold"
                        style={{ color: DARKGOLD }}
                      >
                        Room {b.roomNumber}
                      </td>
                      {isAdmin && (
                        <td
                          className="px-4 py-3 text-xs"
                          style={{ color: "#6B7280" }}
                        >
                          {hotels.find((h) => h.id === b.hotelId)?.name}
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm">
                        {formatActualCheckInDateTime(b as any, (b as any)?.reservation, b.checkInDate)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(b.checkOutDate)}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {b.adults}+{b.children}
                      </td>
                      <td
                        className="px-4 py-3 font-bold text-sm"
                        style={{ color: GOLD }}
                      >
                        {formatCurrency(b.totalAmount)}
                      </td>
                      <td
                        className="px-4 py-3 text-sm"
                        style={{ color: "#16a34a" }}
                      >
                        {formatCurrency(b.advanceAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                          style={{ background: bg, color: text }}
                        >
                          {(b.status === "pending" || b.status === "confirmed") ? "pending" : b.status.replace("_", "-")}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex items-center gap-2">
                        <button
                          onClick={() => setPreviewBooking(b)}
                          className="text-xs px-2 py-1 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 border flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        {(b.status === "pending" || b.status === "confirmed") && (
                          <button
                            onClick={() =>
                              updateBooking(b.id, { status: "cancelled" })
                            }
                            className="text-xs px-2 py-1 rounded-lg text-red-600"
                            style={{ border: "1px solid #fca5a5" }}
                          >
                            Cancel
                          </button>
                        )}
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
                      No reservations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            <div
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
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
                  New Reservation
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                {isAdmin && (
                  <div className="col-span-2">
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: DARKGOLD }}
                    >
                      Hotel *
                    </label>
                    <select
                      className="w-full px-3 py-2.5 rounded-lg outline-none"
                      style={{ border: "2px solid #E5E1DA" }}
                      value={form.hotelId}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          hotelId: e.target.value,
                          roomId: "",
                          roomNumber: "",
                        }))
                      }
                    >
                      <option value="">Select hotel</option>
                      {hotels.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Guest Name *
                  </label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={form.guestName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, guestName: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Phone *
                  </label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={form.guestPhone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, guestPhone: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={form.guestEmail}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, guestEmail: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    ID Proof
                  </label>
                  <select
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={form.idProof || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, idProof: e.target.value }))
                    }
                  >
                    <option value="">Select</option>
                    <option value="Aadhar">Aadhar</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                  </select>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    PLAN
                  </label>
                  <select
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={form.plan || "EP"}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, plan: e.target.value }))
                    }
                  >
                    <option value="EP">EP - European Plan (Room Only)</option>
                    <option value="CP">CP - Continental Plan (Room + Breakfast)</option>
                    <option value="AP">AP - American Plan (All Meals)</option>
                    <option value="MAP">MAP - Modified American Plan (Breakfast + Dinner)</option>
                  </select>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Select Room *
                  </label>
                  <select
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={form.roomId}
                    onChange={(e) => handleRoomSelect(e.target.value)}
                  >
                    <option value="">-- Choose room --</option>
                    {availableRooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.roomNumber} — {r.roomType?.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Room Price (Manual Entry)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={(form as any).roomPrice || ""}
                    onChange={(e) => {
                      const newPrice = parseFloat(e.target.value) || 0;
                      setForm(f => ({ ...f, roomPrice: newPrice } as any));
                      recalcTotal(form.checkInDate, form.checkOutDate, newPrice);
                    }}
                    placeholder="Enter manual price..."
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Check-in Date *
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={form.checkInDate}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, checkInDate: e.target.value }));
                      recalcTotal(e.target.value, form.checkOutDate);
                    }}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Check-out Date *
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={form.checkOutDate}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, checkOutDate: e.target.value }));
                      recalcTotal(form.checkInDate, e.target.value);
                    }}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Adults
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={form.adults}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        adults: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Children
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={form.children}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        children: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Advance Amount (₹)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={form.advanceAmount}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        advanceAmount: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Address
                  </label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={(form as any).addressLine || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, addressLine: e.target.value }))
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Corporate Client / Company
                  </label>
                  <select
                    className="w-full px-3 py-2.5 rounded-lg bg-white outline-none cursor-pointer"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={(form as any).companyId || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, companyId: e.target.value }))
                    }
                  >
                    <option value="">-- Optional: Select Company --</option>
                    {companies.filter(c => c.isActive).map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.gstNumber ? `(GST: ${c.gstNumber})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1">
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Billing Company Name (Optional)
                  </label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg bg-white outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={(form as any).companyName || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, companyName: e.target.value }))
                    }
                    placeholder="If billing to a company"
                    disabled={!!(form as any).companyId}
                  />
                </div>
                <div className="col-span-1">
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Company GST (Optional)
                  </label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg bg-white outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={(form as any).companyGst || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, companyGst: e.target.value }))
                    }
                    placeholder="GSTIN"
                    disabled={!!(form as any).companyId}
                  />
                </div>
              </div>
              {form.roomId && (
                <div
                  className="col-span-2 rounded-xl p-4 flex items-center justify-between"
                  style={{
                    background: "#FFFFFF",
                    border: "2px solid #E5E1DA",
                  }}
                >
                  <span className="font-medium" style={{ color: DARKGOLD }}>
                    Estimated Total:
                  </span>
                  <span
                    className="text-2xl font-bold"
                    style={{
                      color: GOLD,
                      fontFamily: "Times New Roman, serif",
                    }}
                  >
                    {formatCurrency(form.totalAmount)}
                  </span>
                </div>
              )}
              <div className="col-span-2 flex justify-end gap-3 px-6 pb-6 mt-4">
                <button
                  onClick={() => setShowForm(false)}
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
                  <Save className="w-4 h-4" /> Confirm Reservation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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
