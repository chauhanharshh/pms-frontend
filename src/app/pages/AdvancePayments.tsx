import { useState } from "react";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import { formatCurrency, formatDate } from "../utils/format";
import { AdvancePayment } from "../contexts/PMSContext";
import { CreditCard, Plus, Edit3, X, Save } from "lucide-react";

const GOLD = "#C6A75E";
const DARKGOLD = "#A8832D";

const statusMap: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#fef9c3", text: "#854d0e" },
  linked: { bg: "#dbeafe", text: "#1e40af" },
  adjusted: { bg: "#dcfce7", text: "#166534" },
  refunded: { bg: "#f3e8ff", text: "#6b21a8" },
};

export function AdvancePayments() {
  const { user, currentHotelId, setCurrentHotelId } = useAuth();
  const { advances, addAdvance, updateAdvance, bookings, hotels } = usePMS();
  const isAdmin = user?.role === "admin";

  const hotelFilter = isAdmin ? (currentHotelId || "all") : (user?.hotelId || "");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<AdvancePayment, "id">>({
    hotelId: isAdmin ? "" : user?.hotelId || "",
    guestName: "",
    amount: 0,
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "cash",
    usedAmount: 0,
    status: "pending",
  });

  const filtered = advances.filter(
    (a) => hotelFilter === "all" || a.hotelId === hotelFilter,
  );
  const totalAdvance = filtered.reduce((s, a) => s + Number(a.amount || 0), 0);
  const totalUsed = filtered.reduce((s, a) => s + Number(a.usedAmount || 0), 0);

  const hotelBookings = bookings.filter(
    (b) => hotelFilter === "all" || b.hotelId === hotelFilter,
  );

  const openAdd = () => {
    setForm({
      hotelId: isAdmin ? "" : user?.hotelId || "",
      guestName: "",
      amount: 0,
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "cash",
      usedAmount: 0,
      status: "pending",
    });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (adv: AdvancePayment) => {
    setForm({ ...adv });
    setEditingId(adv.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.guestName || Number(form.amount) <= 0) return;
    if (editingId) {
      updateAdvance(editingId, form);
    } else {
      addAdvance(form);
    }
    setShowForm(false);
  };

  return (
    <AppLayout title="Advance Payments">
      <div className="space-y-5 max-w-6xl">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Total Advances",
              value: formatCurrency(totalAdvance),
              sub: `${filtered.length} records`,
              color: GOLD,
            },
            {
              label: "Amount Used",
              value: formatCurrency(totalUsed),
              sub: "Adjusted against bills",
              color: "#16a34a",
            },
            {
              label: "Unused Balance",
              value: formatCurrency(totalAdvance - totalUsed),
              sub: "Available for adjustment",
              color: "#3b82f6",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-5"
              style={{
                background: "white",
                border: "1px solid #E5E1DA",
                boxShadow: "0 2px 8px rgba(221, 215, 204,0.05)",
              }}
            >
              <p className="text-sm" style={{ color: "#6B7280" }}>
                {s.label}
              </p>
              <p
                className="text-2xl font-bold mt-1"
                style={{ color: s.color, fontFamily: "Times New Roman, serif" }}
              >
                {s.value}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                {s.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <select
              className="px-3 py-2 rounded-xl text-sm outline-none appearance-none"
              style={{
                border: "2px solid #E5E1DA",
                background: "white",
                color: DARKGOLD,
              }}
              value={currentHotelId || "all"}
              onChange={(e) => {
                const val = e.target.value;
                setCurrentHotelId(val === "all" ? null : val);
              }}
            >
              <option value="all">All Hotels</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          )}
          <div className="flex-1" />
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{
              background: "linear-gradient(135deg, #C6A75E, #A8832D)",
              boxShadow: "0 2px 8px #E5E1DA",
            }}
          >
            <Plus className="w-4 h-4" /> Record Advance
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
            <CreditCard className="w-5 h-5" style={{ color: GOLD }} />
            <h2
              className="font-semibold"
              style={{ fontFamily: "Times New Roman, serif", color: DARKGOLD }}
            >
              Advance Payments
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#FFFFFF" }}>
                  {[
                    "Guest",
                    "Hotel",
                    "Date",
                    "Amount",
                    "Used",
                    "Balance",
                    "Payment",
                    "Status",
                    "Actions",
                  ].map((col) => (
                    <th
                      key={col}
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
                {filtered.map((adv) => {
                  const { bg, text } = statusMap[adv.status];
                  const balance = Number(adv.amount || 0) - Number(adv.usedAmount || 0);
                  return (
                    <tr
                      key={adv.id}
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
                      <td
                        className="px-4 py-3 font-medium text-sm"
                        style={{ color: "#1F2937" }}
                      >
                        {adv.guestName}
                      </td>
                      <td
                        className="px-4 py-3 text-xs"
                        style={{ color: "#6B7280" }}
                      >
                        {hotels.find((h) => h.id === adv.hotelId)?.name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(adv.paymentDate)}
                      </td>
                      <td
                        className="px-4 py-3 font-bold text-sm"
                        style={{ color: GOLD }}
                      >
                        {formatCurrency(adv.amount)}
                      </td>
                      <td
                        className="px-4 py-3 text-sm"
                        style={{ color: "#16a34a" }}
                      >
                        {formatCurrency(adv.usedAmount)}
                      </td>
                      <td
                        className="px-4 py-3 font-semibold text-sm"
                        style={{ color: balance > 0 ? "#3b82f6" : "#6b7280" }}
                      >
                        {formatCurrency(balance)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 uppercase">
                          {adv.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: bg, color: text }}
                        >
                          {adv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openEdit(adv)}
                          className="p-1.5 rounded-lg"
                          style={{ color: GOLD }}
                          onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(221, 215, 204,0.1)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-12 text-center text-sm"
                      style={{ color: "#9CA3AF" }}
                    >
                      No advance payments found
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
                  {editingId ? "Edit Advance" : "Record Advance"}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {isAdmin && (
                  <div>
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
                        setForm((f) => ({ ...f, hotelId: e.target.value }))
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
                    Link to Booking (optional)
                  </label>
                  <select
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={form.bookingId || ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        bookingId: e.target.value || undefined,
                      }))
                    }
                  >
                    <option value="">-- Walk-in / Unlinked --</option>
                    {hotelBookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.guestName} — Room {b.roomNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: DARKGOLD }}
                    >
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2.5 rounded-lg outline-none"
                      style={{ border: "2px solid #E5E1DA" }}
                      value={form.amount}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          amount: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: DARKGOLD }}
                    >
                      Used Amount (₹)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2.5 rounded-lg outline-none"
                      style={{ border: "2px solid #E5E1DA" }}
                      value={form.usedAmount}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          usedAmount: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: DARKGOLD }}
                    >
                      Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2.5 rounded-lg outline-none"
                      style={{ border: "2px solid #E5E1DA" }}
                      value={form.paymentDate}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, paymentDate: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: DARKGOLD }}
                    >
                      Status
                    </label>
                    <select
                      className="w-full px-3 py-2.5 rounded-lg outline-none"
                      style={{ border: "2px solid #E5E1DA" }}
                      value={form.status}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          status: e.target.value as AdvancePayment["status"],
                        }))
                      }
                    >
                      <option value="pending">Pending</option>
                      <option value="linked">Linked</option>
                      <option value="adjusted">Adjusted</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
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
                    <Save className="w-4 h-4" />{" "}
                    {editingId ? "Update" : "Record"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
