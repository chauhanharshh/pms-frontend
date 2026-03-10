import { useState } from "react";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import { formatCurrency, formatDate } from "../utils/format";
import { MiscCharge } from "../contexts/PMSContext";
import { Tag, Plus, Edit3, Trash2, X, Save, AlertCircle } from "lucide-react";

const GOLD = "#C6A75E";
const DARKGOLD = "#A8832D";
const CATEGORIES: MiscCharge["category"][] = [
  "Laundry",
  "Spa",
  "Transport",
  "Minibar",
  "Other",
];

export function MiscCharges() {
  const { user, currentHotelId, setCurrentHotelId } = useAuth();
  const {
    miscCharges,
    addMiscCharge,
    updateMiscCharge,
    deleteMiscCharge,
    bookings,
    rooms,
    hotels,
  } = usePMS();
  const isAdmin = user?.role === "admin";

  const hotelFilter = isAdmin ? (currentHotelId || "all") : (user?.hotelId || "");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const empty = (): Omit<MiscCharge, "id"> & { guestName?: string; roomNumber?: string } => ({
    hotelId: isAdmin ? "" : user?.hotelId || "",
    guestName: "",
    description: "",
    amount: 0,
    chargeDate: new Date().toISOString().split("T")[0],
    category: "Laundry",
    quantity: 1,
    addedToFinalBill: false,
  });
  const [form, setForm] = useState(empty());

  const filtered = miscCharges.filter(
    (m) => hotelFilter === "all" || m.hotelId === hotelFilter,
  );
  const hotelBookings = bookings.filter(
    (b) => hotelFilter === "all" || b.hotelId === hotelFilter,
  );

  const openEdit = (mc: MiscCharge) => {
    setForm({ ...mc });
    setEditingId(mc.id);
    setShowForm(true);
  };
  const openAdd = () => {
    setForm(empty());
    setEditingId(null);
    setShowForm(true);
  };
  const handleSave = () => {
    if (!form.description || Number(form.amount) <= 0) return;
    const formData = form as any;
    if (editingId) {
      updateMiscCharge(editingId, formData);
    } else {
      addMiscCharge(formData);
    }
    setShowForm(false);
  };

  return (
    <AppLayout title="Miscellaneous Charges">
      <div className="space-y-5 max-w-5xl">
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
            <Plus className="w-4 h-4" /> Add Charge
          </button>
        </div>

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
            <Tag className="w-5 h-5" style={{ color: GOLD }} />
            <h2
              className="font-semibold"
              style={{ fontFamily: "Times New Roman, serif", color: DARKGOLD }}
            >
              Misc. Charges ({filtered.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#FFFFFF" }}>
                  {[
                    "Guest",
                    "Room",
                    "Category",
                    "Description",
                    "Amount",
                    "Date",
                    "Billed",
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
                {filtered.map((mc) => (
                  <tr
                    key={mc.id}
                    style={{ borderBottom: "1px solid rgba(184,134,11,0.07)" }}
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
                      {(mc as any).guestName || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {(mc as any).roomNumber || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                        {mc.category}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "#1F2937" }}
                    >
                      {mc.description}
                    </td>
                    <td
                      className="px-4 py-3 font-bold text-sm"
                      style={{ color: GOLD }}
                    >
                      {formatCurrency(mc.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm">{formatDate(mc.chargeDate)}</td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: mc.addedToFinalBill
                            ? "#dcfce7"
                            : "#fee2e2",
                          color: mc.addedToFinalBill ? "#166534" : "#dc2626",
                        }}
                      >
                        {mc.addedToFinalBill ? "Added" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <button
                            onClick={() => openEdit(mc)}
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
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteConfirm(mc.id)}
                            className="p-1.5 rounded-lg text-red-400"
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "#fee2e2")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-12 text-center text-sm"
                      style={{ color: "#9CA3AF" }}
                    >
                      No misc charges found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

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
                  {editingId ? "Edit Charge" : "Add Misc. Charge"}
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
                    Room Number
                  </label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={form.roomNumber || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, roomNumber: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Category
                  </label>
                  <select
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        category: e.target.value as MiscCharge["category"],
                      }))
                    }
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
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
                <div className="col-span-2">
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Description *
                  </label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="addedToBill"
                    checked={form.addedToFinalBill}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        addedToFinalBill: e.target.checked,
                      }))
                    }
                    className="w-4 h-4"
                  />
                  <label
                    htmlFor="addedToBill"
                    className="text-sm"
                    style={{ color: DARKGOLD }}
                  >
                    Added to final bill
                  </label>
                </div>
                <div className="col-span-2 flex justify-end gap-3">
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
                    <Save className="w-4 h-4" /> Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {deleteConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            <div
              className="w-80 rounded-2xl p-6 text-center"
              style={{ background: "white" }}
            >
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
              <p className="font-semibold mb-4">Delete this charge?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2 rounded-lg text-sm"
                  style={{
                    border: "1px solid #E5E1DA",
                    color: DARKGOLD,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteMiscCharge(deleteConfirm);
                    setDeleteConfirm(null);
                  }}
                  className="flex-1 py-2 rounded-lg text-sm font-medium text-white bg-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
