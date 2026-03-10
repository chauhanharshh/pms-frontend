import { useState, useMemo } from "react";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import {
  Lock,
  Plus,
  X,
  Save,
  Calendar,
  BedDouble,
  AlertCircle,
} from "lucide-react";

const GOLD = "#C6A75E";
const DARKGOLD = "#A8832D";
const BORDER = "#E5E1DA";
const CARD = "#FFFFFF";

export function RoomBlockingPage() {
  const { user } = useAuth();
  const { rooms, hotels, updateRoom, roomBlocks, addRoomBlock, updateRoomBlock } = usePMS();
  const isAdmin = user?.role === "admin";
  const [filterHotel, setFilterHotel] = useState(
    isAdmin ? hotels[0]?.id || "" : user?.hotelId || "",
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({
    hotelId: filterHotel,
    fromDate: "",
    toDate: "",
    reason: "",
    isActive: true,
  });
  const f = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const hotelRooms = useMemo(
    () =>
      rooms.filter(
        (r) => r.hotelId === form.hotelId && r.status !== "occupied",
      ),
    [rooms, form.hotelId],
  );

  const blocks = useMemo(() => {
    return roomBlocks.filter(b => b.hotelId === filterHotel);
  }, [roomBlocks, filterHotel]);

  const blockedNow = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return blocks.filter(
      (b) => b.isActive && b.fromDate <= today && b.toDate >= today,
    );
  }, [blocks]);

  const saveBlock = async () => {
    if (!form.roomId || !form.fromDate || !form.toDate || !form.reason) return;
    const room = rooms.find((r) => r.id === form.roomId);
    if (!room) return;

    try {
      await addRoomBlock({
        ...form,
        roomNumber: room.roomNumber,
        blockedBy: user?.username || "admin",
      });

      // Update room status to 'maintenance' for current blocks
      const today = new Date().toISOString().split("T")[0];
      if (form.fromDate <= today && form.toDate >= today) {
        await updateRoom(form.roomId!, {
          status: "maintenance",
          maintenanceNote: form.reason,
        });
      }

      setShowForm(false);
      setForm({
        hotelId: filterHotel,
        fromDate: "",
        toDate: "",
        reason: "",
        isActive: true,
      });
    } catch (e) {
      alert("Failed to block room");
    }
  };

  const unblockRoom = async (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;

    try {
      await updateRoomBlock(blockId, { isActive: false });
      // Restore room to vacant
      await updateRoom(block.roomId, { status: "vacant", maintenanceNote: undefined });
    } catch (e) {
      alert("Failed to unblock room");
    }
  };

  return (
    <AppLayout title="Room Blocking">
      <div className="space-y-5 max-w-5xl">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div
            className="rounded-xl p-4"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <p className="text-xs" style={{ color: "#6B7280" }}>
              Currently Blocked Rooms
            </p>
            <p
              className="text-3xl font-bold mt-1"
              style={{ fontFamily: "Times New Roman, serif", color: "#dc2626" }}
            >
              {blockedNow.length}
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <p className="text-xs" style={{ color: "#6B7280" }}>
              Total Block Records
            </p>
            <p
              className="text-3xl font-bold mt-1"
              style={{ fontFamily: "Times New Roman, serif", color: DARKGOLD }}
            >
              {blocks.length}
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <p className="text-xs" style={{ color: "#6B7280" }}>
              Rooms Available
            </p>
            <p
              className="text-3xl font-bold mt-1"
              style={{ fontFamily: "Times New Roman, serif", color: "#16a34a" }}
            >
              {
                rooms.filter(
                  (r) => r.hotelId === filterHotel && r.status === "vacant",
                ).length
              }
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <select
              className="px-3 py-2 rounded-xl text-sm outline-none appearance-none"
              style={{
                border: `1.5px solid ${BORDER}`,
                background: CARD,
                color: DARKGOLD,
              }}
              value={filterHotel}
              onChange={(e) => {
                setFilterHotel(e.target.value);
                f("hotelId", e.target.value);
              }}
            >
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          )}
          <div className="flex-1" />
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: `linear-gradient(135deg, #dc2626, #b91c1c)` }}
          >
            <Lock className="w-4 h-4" /> Block a Room
          </button>
        </div>

        {/* Add Form */}
        {showForm && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: CARD,
              border: `2px solid rgba(220,38,38,0.3)`,
            }}
          >
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{
                background: "#fef2f2",
                borderBottom: `2px solid ${BORDER}`,
              }}
            >
              <h2
                className="font-bold flex items-center gap-2"
                style={{
                  fontFamily: "Times New Roman, serif",
                  color: "#dc2626",
                }}
              >
                <Lock className="w-5 h-5" /> Block Room
              </h2>
              <button onClick={() => setShowForm(false)}>
                <X className="w-5 h-5" style={{ color: "#6B7280" }} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {isAdmin && (
                <div className="col-span-2">
                  <label
                    className="block text-xs font-bold mb-1 uppercase"
                    style={{ color: DARKGOLD }}
                  >
                    Hotel
                  </label>
                  <select
                    className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
                    style={{ border: `2px solid ${BORDER}` }}
                    value={form.hotelId}
                    onChange={(e) => f("hotelId", e.target.value)}
                  >
                    {hotels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="col-span-2">
                <label
                  className="block text-xs font-bold mb-1 uppercase"
                  style={{ color: DARKGOLD }}
                >
                  Select Room *
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                  {hotelRooms.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => f("roomId", r.id)}
                      className="p-2 rounded-lg text-xs text-left transition-all"
                      style={{
                        border: `2px solid ${form.roomId === r.id ? "#dc2626" : BORDER}`,
                        background: form.roomId === r.id ? "#fef2f2" : CARD,
                        color: form.roomId === r.id ? "#dc2626" : "#374151",
                      }}
                    >
                      <div className="font-bold">Room {r.roomNumber}</div>
                      <div className="text-xs opacity-70">
                        {(r as any).type || r.roomType?.name || ''} · F{r.floor}
                      </div>
                    </button>
                  ))}
                  {hotelRooms.length === 0 && (
                    <div
                      className="col-span-4 text-center py-4 text-sm"
                      style={{ color: "#9CA3AF" }}
                    >
                      No vacant rooms
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label
                  className="block text-xs font-bold mb-1 uppercase"
                  style={{ color: DARKGOLD }}
                >
                  From Date *
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
                  style={{ border: `2px solid ${BORDER}` }}
                  value={form.fromDate || ""}
                  onChange={(e) => f("fromDate", e.target.value)}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-bold mb-1 uppercase"
                  style={{ color: DARKGOLD }}
                >
                  To Date *
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
                  style={{ border: `2px solid ${BORDER}` }}
                  value={form.toDate || ""}
                  onChange={(e) => f("toDate", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label
                  className="block text-xs font-bold mb-1 uppercase"
                  style={{ color: DARKGOLD }}
                >
                  Reason *
                </label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
                  style={{ border: `2px solid ${BORDER}` }}
                  value={form.reason || ""}
                  onChange={(e) => f("reason", e.target.value)}
                  placeholder="e.g. Maintenance, Deep Cleaning, Renovation…"
                />
              </div>
              <div className="col-span-2 flex justify-end gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl text-sm"
                  style={{ border: `1px solid ${BORDER}`, color: DARKGOLD }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveBlock}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white"
                  style={{
                    background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                  }}
                >
                  <Lock className="w-4 h-4" /> Confirm Block
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Block list */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: CARD, border: `1px solid ${BORDER}` }}
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
              Room Blocking Records ({blocks.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#FFFFFF" }}>
                  {[
                    "Room",
                    "Reason",
                    "From",
                    "To",
                    "Blocked By",
                    "Status",
                    "Action",
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
                {blocks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-sm"
                      style={{ color: "#9CA3AF" }}
                    >
                      No room blocks recorded
                    </td>
                  </tr>
                ) : (
                  blocks.map((b) => {
                    const today = new Date().toISOString().split("T")[0];
                    const isCurrently =
                      b.isActive && b.fromDate <= today && b.toDate >= today;
                    return (
                      <tr
                        key={b.id}
                        style={{ borderBottom: `1px solid ${BORDER}` }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#FFFFFF")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = CARD)
                        }
                      >
                        <td
                          className="px-4 py-3 font-bold text-sm"
                          style={{ color: DARKGOLD }}
                        >
                          Room {b.roomNumber}
                        </td>
                        <td
                          className="px-4 py-3 text-sm"
                          style={{ color: "#374151" }}
                        >
                          {b.reason}
                        </td>
                        <td className="px-4 py-3 text-sm">{b.fromDate}</td>
                        <td className="px-4 py-3 text-sm">{b.toDate}</td>
                        <td
                          className="px-4 py-3 text-sm"
                          style={{ color: "#6B7280" }}
                        >
                          {b.blockedBy}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              background: !b.isActive
                                ? "#f3f4f6"
                                : isCurrently
                                  ? "#fee2e2"
                                  : "#dcfce7",
                              color: !b.isActive
                                ? "#6B7280"
                                : isCurrently
                                  ? "#dc2626"
                                  : "#166534",
                            }}
                          >
                            {!b.isActive
                              ? "Unblocked"
                              : isCurrently
                                ? "🔒 Active"
                                : "📅 Upcoming"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {b.isActive && (
                            <button
                              onClick={() => unblockRoom(b.id)}
                              className="px-3 py-1 rounded-lg text-xs font-medium text-green-700"
                              style={{
                                border: "1px solid #86efac",
                                background: "#dcfce7",
                              }}
                            >
                              Unblock
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
