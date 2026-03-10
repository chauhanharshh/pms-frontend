import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS, Room } from "../contexts/PMSContext";
import { formatCurrency } from "../utils/format";
import {
  BedDouble,
  Search,
  Filter,
  Plus,
  X,
  Save,
  User,
  Calendar,
  Clock,
  Wrench,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  DoorOpen,
  ChevronDown,
  Building2,
  Trash2,
} from "lucide-react";

const GOLD = "#C6A75E";
const DARKGOLD = "#A8832D";

// ── STATUS PALETTE ─────────────────────────────────────────────
const STATUS_CONFIG = {
  vacant: {
    label: "Vacant",
    bg: "#f0fdf4",
    border: "#86efac",
    text: "#15803d",
    dot: "#22c55e",
    icon: <DoorOpen className="w-3.5 h-3.5" />,
  },
  occupied: {
    label: "Occupied",
    bg: "#fef2f2",
    border: "#fca5a5",
    text: "#dc2626",
    dot: "#ef4444",
    icon: <User className="w-3.5 h-3.5" />,
  },
  cleaning: {
    label: "Cleaning",
    bg: "#fffbeb",
    border: "#fcd34d",
    text: "#b45309",
    dot: "#f59e0b",
    icon: <Sparkles className="w-3.5 h-3.5" />,
  },
  maintenance: {
    label: "Maintenance",
    bg: "#f5f3ff",
    border: "#c4b5fd",
    text: "#6d28d9",
    dot: "#8b5cf6",
    icon: <Wrench className="w-3.5 h-3.5" />,
  },
};

const TYPE_PRICE_MAP: Record<string, number> = {
  Single: 2500,
  Double: 4500,
  Suite: 8000,
  Deluxe: 6500,
  Premium: 10000,
};
const TYPE_OCC_MAP: Record<string, number> = {
  Single: 2,
  Double: 3,
  Suite: 4,
  Deluxe: 3,
  Premium: 4,
};

// Helper to get days stayed
function daysBetween(from: string, to: string) {
  const d1 = new Date(from);
  const d2 = new Date(to);
  return Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / 86400000));
}

// ── ROOM CARD ─────────────────────────────────────────────────
function RoomCard({
  room,
  onStatusChange,
  onDelete,
  bills,
}: {
  room: Room;
  bills: any[];
  onStatusChange: (
    id: string,
    status: Room["status"],
    extra?: Partial<Room>,
  ) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = STATUS_CONFIG[room.status];
  const roomBill = bills.find((b) => b.roomNumber === room.roomNumber);
  const runningBill = roomBill ? roomBill.totalAmount - roomBill.paidAmount : 0;
  const nights =
    (room as any).checkInDate && (room as any).checkOutDate
      ? daysBetween((room as any).checkInDate, (room as any).checkOutDate)
      : 0;

  return (
    <div
      className="relative rounded-2xl overflow-hidden transition-all group"
      style={{
        background: cfg.bg,
        border: `1.5px solid ${cfg.border}`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        minHeight: "185px",
      }}
    >
      {/* Status dot + Room number header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ background: cfg.dot }}
          />
          <div>
            <div
              className="text-base font-bold"
              style={{ fontFamily: "Times New Roman, serif", color: "#1F2937" }}
            >
              {room.roomNumber}
            </div>
            <div className="text-xs" style={{ color: "#6B7280" }}>
              Floor {room.floor} • {(room as any).type || room.roomType?.name || ''}
            </div>
          </div>
        </div>
        <span
          className="px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1"
          style={{
            background: "white",
            color: cfg.text,
            border: `1px solid ${cfg.border}`,
          }}
        >
          {cfg.icon} {cfg.label}
        </span>
      </div>

      {/* Context body */}
      <div className="px-4 pb-3 space-y-1.5">
        {room.status === "vacant" && (
          <>
            <div
              className="text-xl font-bold"
              style={{ color: GOLD, fontFamily: "Times New Roman, serif" }}
            >
              {formatCurrency(Number((room as any).price || room.basePrice || 0))}
              <span className="text-xs font-normal text-gray-500">/night</span>
            </div>
            <div className="text-xs" style={{ color: "#6B7280" }}>
              Max {room.maxOccupancy} guests
            </div>
          </>
        )}
        {room.status === "occupied" && (
          <>
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" style={{ color: "#dc2626" }} />
              <span
                className="text-sm font-semibold"
                style={{ color: "#1F2937" }}
              >
                {(room as any).guestName}
              </span>
            </div>
            <div
              className="flex items-center gap-1.5 text-xs"
              style={{ color: "#6B7280" }}
            >
              <Calendar className="w-3 h-3" />
              {(room as any).checkInDate} → {(room as any).checkOutDate}
              <span className="font-medium">({nights}N)</span>
            </div>
            {runningBill > 0 && (
              <div
                className="text-xs px-2 py-1 rounded-lg inline-flex items-center gap-1"
                style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626" }}
              >
                Running Bill: {formatCurrency(runningBill)}
              </div>
            )}
          </>
        )}
        {room.status === "cleaning" && (
          <div
            className="flex items-center gap-1.5 text-xs"
            style={{ color: "#b45309" }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Room being serviced
          </div>
        )}
        {room.status === "maintenance" && (
          <div
            className="flex items-start gap-1.5 text-xs"
            style={{ color: "#6d28d9" }}
          >
            <Wrench className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{room.maintenanceNote || "Under maintenance"}</span>
          </div>
        )}
      </div>

      {/* Quick action buttons */}
      <div className="px-4 pb-4 flex gap-2">
        {room.status === "vacant" && (
          <button
            onClick={() => onStatusChange(room.id, "cleaning")}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium text-center transition-all"
            style={{
              background: "#fef9c3",
              color: "#b45309",
              border: "1px solid #fde68a",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#fef08a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fef9c3")}
          >
            Mark Cleaning
          </button>
        )}
        {room.status === "occupied" && (
          <button
            onClick={() =>
              onStatusChange(room.id, "cleaning", {
                guestName: undefined,
                checkInDate: undefined,
                checkOutDate: undefined,
              } as any)
            }
            className="flex-1 py-1.5 rounded-lg text-xs font-medium text-center transition-all"
            style={{
              background: "rgba(239,68,68,0.1)",
              color: "#dc2626",
              border: "1px solid #fca5a5",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(239,68,68,0.18)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(239,68,68,0.1)")
            }
          >
            Check Out
          </button>
        )}
        {room.status === "cleaning" && (
          <button
            onClick={() => onStatusChange(room.id, "vacant")}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium text-center transition-all"
            style={{
              background: "#f0fdf4",
              color: "#15803d",
              border: "1px solid #86efac",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#dcfce7")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f0fdf4")}
          >
            Mark Ready ✓
          </button>
        )}
        {room.status === "maintenance" && (
          <button
            onClick={() =>
              onStatusChange(room.id, "vacant", { maintenanceNote: undefined })
            }
            className="flex-1 py-1.5 rounded-lg text-xs font-medium text-center transition-all"
            style={{
              background: "#f5f3ff",
              color: "#6d28d9",
              border: "1px solid #c4b5fd",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#ede9fe")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f5f3ff")}
          >
            Mark Fixed ✓
          </button>
        )}
        {room.status === "vacant" && (
          <>
            <button
              onClick={() => onStatusChange(room.id, "maintenance")}
              className="py-1.5 px-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: "#f5f3ff",
                color: "#6d28d9",
                border: "1px solid #c4b5fd",
              }}
              title="Mark Maintenance"
            >
              <Wrench className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this room?")) {
                  onDelete(room.id);
                }
              }}
              className="py-1.5 px-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: "#fef2f2",
                color: "#dc2626",
                border: "1px solid #fca5a5",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.18)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fef2f2")}
              title="Delete Room"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── ADD ROOM MODAL ─────────────────────────────────────────────
function AddRoomModal({
  hotelId,
  existingRoomNumbers,
  onSave,
  onClose,
}: {
  hotelId: string;
  existingRoomNumbers: string[];
  onSave: (r: Omit<Room, "id">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<any>({
    hotelId,
    roomNumber: "",
    floor: 1,
    type: "Double",
    typeId: "dummy",
    status: "vacant",
    maxOccupancy: 3,
    basePrice: TYPE_PRICE_MAP["Double"],
    taxRate: 12,
  });
  const f = (key: keyof typeof form, val: any) =>
    setForm((p: any) => ({ ...p, [key]: val }));

  const duplicate = existingRoomNumbers.includes(form.roomNumber);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "white" }}
      >
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{
            background: "#FFFFFF",
            borderBottom: "2px solid #E5E1DA",
          }}
        >
          <h2 style={{ fontFamily: "Times New Roman, serif", color: DARKGOLD }}>
            Add New Room
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div>
            <label
              className="block text-xs font-semibold mb-1 uppercase tracking-wide"
              style={{ color: DARKGOLD }}
            >
              Room Number *
            </label>
            <input
              className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
              style={{
                border: `2px solid ${duplicate ? "#ef4444" : "#E5E1DA"}`,
              }}
              value={form.roomNumber}
              onChange={(e) => f("roomNumber", e.target.value)}
              placeholder="e.g. 101"
            />
            {duplicate && (
              <p className="text-xs text-red-500 mt-0.5">
                Room number already exists
              </p>
            )}
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1 uppercase tracking-wide"
              style={{ color: DARKGOLD }}
            >
              Floor
            </label>
            <input
              type="number"
              min={1}
              max={50}
              className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
              style={{ border: "2px solid #E5E1DA" }}
              value={form.floor}
              onChange={(e) => f("floor", +e.target.value)}
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1 uppercase tracking-wide"
              style={{ color: DARKGOLD }}
            >
              Room Type
            </label>
            <select
              className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
              style={{
                border: "2px solid #E5E1DA",
                background: "white",
              }}
              value={form.type}
              onChange={(e) => {
                const t = e.target.value as string;
                f("type", t);
                f("maxOccupancy", TYPE_OCC_MAP[t]);
                f("basePrice", TYPE_PRICE_MAP[t]);
              }}
            >
              <option value="Single">Single</option>
              <option value="Double">Double</option>
              <option value="Deluxe">Deluxe</option>
              <option value="Suite">Suite</option>
              <option value="Premium">Premium</option>
            </select>
          </div>

          <div>
            <label
              className="block text-xs font-semibold mb-1 uppercase tracking-wide"
              style={{ color: DARKGOLD }}
            >
              Max Occupancy
            </label>
            <input
              type="number"
              min={1}
              max={10}
              className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
              style={{ border: "2px solid #E5E1DA" }}
              value={form.maxOccupancy}
              onChange={(e) => f("maxOccupancy", +e.target.value)}
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1 uppercase tracking-wide"
              style={{ color: DARKGOLD }}
            >
              Initial Status
            </label>
            <select
              className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
              style={{
                border: "2px solid #E5E1DA",
                background: "white",
              }}
              value={form.status}
              onChange={(e) => f("status", e.target.value as Room["status"])}
            >
              <option value="vacant">Vacant</option>
              <option value="cleaning">Cleaning</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <input
            type="number"
            className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
            style={{ border: "2px solid #E5E1DA" }}
            value={form.basePrice || ""}
            onChange={(e) => f("basePrice", +e.target.value)}
            placeholder="e.g. 2500"
          />
        </div>
        <div className="col-span-2">
          <label
            className="block text-xs font-semibold mb-1 uppercase tracking-wide"
            style={{ color: DARKGOLD }}
          >
            GST Slab (%)
          </label>
          <input
            type="number"
            className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
            style={{ border: "2px solid #E5E1DA" }}
            value={form.taxRate || ""}
            onChange={(e) => f("taxRate", +e.target.value)}
            placeholder="e.g. 12"
          />
        </div>
        <div
          className="col-span-2 flex justify-end gap-3 pt-2 border-t"
          style={{ borderColor: "#E5E1DA" }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm"
            style={{
              border: "1px solid #E5E1DA",
              color: DARKGOLD,
            }}
          >
            Cancel
          </button>
          <button
            disabled={!form.roomNumber || duplicate}
            onClick={() => !duplicate && form.roomNumber && onSave(form)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #C6A75E, #A8832D)",
              boxShadow: "0 2px 8px #E5E1DA",
            }}
          >
            <Save className="w-4 h-4" /> Add Room
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export function RoomManagement() {
  const { user, currentHotelId, setCurrentHotelId } = useAuth();
  const { rooms, updateRoom, addRoom, deleteRoom, hotels, bills } = usePMS();
  const location = useLocation();

  // Find the currently assigned hotel for the logged-in user
  const currentUserHotel = hotels.find(h => h.id === currentHotelId);
  const isPosBossMode = currentUserHotel?.posBossMode === true;
  const isBossAdmin = user?.role === "admin" || isPosBossMode;

  // Boss Mode override via query param
  const queryHotel = new URLSearchParams(location.search).get("hotel");
  const activeHotelId =
    isBossAdmin && queryHotel ? queryHotel : currentHotelId;

  const [filterStatus, setFilterStatus] = useState<"all" | Room["status"]>(
    "all",
  );
  const [filterFloor, setFilterFloor] = useState<"all" | number>("all");
  const [filterType, setFilterType] = useState<"all" | string>("all");
  const [search, setSearch] = useState("");
  const [showAddRoom, setShowAddRoom] = useState(false);

  const selectedHotelId = activeHotelId || "";
  const currentHotel = hotels.find((h) => h.id === selectedHotelId);
  const hotelRooms = rooms.filter((r) => r.hotelId === selectedHotelId);

  const floors = useMemo(
    () => [...new Set(hotelRooms.map((r) => r.floor))].sort(),
    [hotelRooms],
  );
  const types = useMemo(
    () => [...new Set(hotelRooms.map((r) => (r as any).type || r.roomType?.name || "Unknown"))],
    [hotelRooms],
  );

  const filtered = useMemo(
    () =>
      hotelRooms.filter((r) => {
        if (filterStatus !== "all" && r.status !== filterStatus) return false;
        if (filterFloor !== "all" && r.floor !== filterFloor) return false;
        if (filterType !== "all" && ((r as any).type || r.roomType?.name || "Unknown") !== filterType) return false;
        if (
          search &&
          !r.roomNumber.toLowerCase().includes(search.toLowerCase()) &&
          !(r as any).guestName?.toLowerCase().includes(search.toLowerCase())
        )
          return false;
        return true;
      }),
    [hotelRooms, filterStatus, filterFloor, filterType, search],
  );

  // Stats
  const stats = {
    vacant: hotelRooms.filter((r) => r.status === "vacant").length,
    occupied: hotelRooms.filter((r) => r.status === "occupied").length,
    cleaning: hotelRooms.filter((r) => r.status === "cleaning").length,
    maintenance: hotelRooms.filter((r) => r.status === "maintenance").length,
  };

  return (
    <AppLayout
      title={`Room Panel${currentHotel ? ` — ${currentHotel.name}` : ""}`}
    >
      <div className="space-y-5">
        {/* Admin/Boss hotel picker */}
        {isBossAdmin && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{
              background: "linear-gradient(135deg, #DDD7CC, #CFC8BC)",
              border: "1px solid #E5E1DA",
            }}
          >
            <Building2 className="w-4 h-4" style={{ color: GOLD }} />
            <span className="text-sm" style={{ color: "rgba(184,134,11,0.8)" }}>
              Viewing Hotel:
            </span>
            <select
              value={selectedHotelId}
              onChange={(e) => setCurrentHotelId(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm outline-none"
              style={{
                background: "rgba(184,134,11,0.12)",
                border: "1px solid #E5E1DA",
                color: "#C6A75E",
              }}
            >
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status summary bar */}
        <div className="grid grid-cols-4 gap-3">
          {(Object.entries(stats) as [Room["status"], number][]).map(
            ([status, count]) => {
              const cfg = STATUS_CONFIG[status];
              return (
                <button
                  key={status}
                  onClick={() =>
                    setFilterStatus(filterStatus === status ? "all" : status)
                  }
                  className="rounded-xl p-3 text-left transition-all"
                  style={{
                    background: filterStatus === status ? cfg.bg : "white",
                    border: `1.5px solid ${filterStatus === status ? cfg.border : "rgba(184,134,11,0.12)"}`,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: cfg.dot }}
                    />
                    <span
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: cfg.text }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div
                    className="text-2xl font-bold"
                    style={{
                      color: cfg.text,
                      fontFamily: "Times New Roman, serif",
                    }}
                  >
                    {count}
                  </div>
                  <div className="text-xs" style={{ color: "#9CA3AF" }}>
                    {Math.round((count / Math.max(hotelRooms.length, 1)) * 100)}
                    % of rooms
                  </div>
                </button>
              );
            },
          )}
        </div>

        {/* Filters row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: GOLD }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search room or guest…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                border: "1.5px solid #E5E1DA",
                background: "white",
              }}
            />
          </div>
          <select
            value={filterFloor}
            onChange={(e) =>
              setFilterFloor(e.target.value === "all" ? "all" : +e.target.value)
            }
            className="px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{
              border: "1.5px solid #E5E1DA",
              background: "white",
              color: "#4a3d1f",
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
            className="px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{
              border: "1.5px solid #E5E1DA",
              background: "white",
              color: "#4a3d1f",
            }}
          >
            <option value="all">All Types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {(filterStatus !== "all" ||
            filterFloor !== "all" ||
            filterType !== "all" ||
            search) && (
              <button
                onClick={() => {
                  setFilterStatus("all");
                  setFilterFloor("all");
                  setFilterType("all");
                  setSearch("");
                }}
                className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs"
                style={{
                  border: "1px solid #fca5a5",
                  color: "#dc2626",
                  background: "#fef2f2",
                }}
              >
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          <div className="ml-auto">
            <button
              onClick={() => setShowAddRoom(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
              style={{
                background: "linear-gradient(135deg, #C6A75E, #A8832D)",
                boxShadow: "0 2px 8px #E5E1DA",
              }}
            >
              <Plus className="w-4 h-4" /> Add Room
            </button>
          </div>
        </div>

        {/* Results info */}
        <div className="text-sm" style={{ color: "#9CA3AF" }}>
          Showing <strong style={{ color: DARKGOLD }}>{filtered.length}</strong>{" "}
          of {hotelRooms.length} rooms
        </div>

        {/* Room Grid — grouped by floor */}
        {hotelRooms.length === 0 ? (
          <div
            className="text-center py-16 rounded-2xl"
            style={{
              background: "white",
              border: "1.5px dashed #E5E1DA",
            }}
          >
            <BedDouble
              className="w-12 h-12 mx-auto mb-3"
              style={{ color: "#E5E1DA" }}
            />
            <p className="font-semibold" style={{ color: "#4a3d1f" }}>
              No rooms yet
            </p>
            <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>
              Click "Add Room" to add the first room
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="text-center py-12 rounded-2xl"
            style={{
              background: "white",
              border: "1.5px dashed #E5E1DA",
            }}
          >
            <Search
              className="w-10 h-10 mx-auto mb-3"
              style={{ color: "#E5E1DA" }}
            />
            <p className="font-semibold" style={{ color: "#4a3d1f" }}>
              No rooms match your filters
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {floors
              .filter((floor) => filterFloor === "all" || filterFloor === floor)
              .map((floor) => {
                const floorRooms = filtered.filter((r) => r.floor === floor);
                if (floorRooms.length === 0) return null;
                return (
                  <div key={floor}>
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider"
                        style={{
                          background: "rgba(221, 215, 204,0.1)",
                          color: DARKGOLD,
                          border: "1px solid #E5E1DA",
                        }}
                      >
                        Floor {floor}
                      </div>
                      <div
                        className="h-px flex-1"
                        style={{ background: "rgba(221, 215, 204,0.1)" }}
                      />
                      <span className="text-xs" style={{ color: "#9CA3AF" }}>
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
                            bills={bills}
                            onStatusChange={(id, status, extra) =>
                              updateRoom(id, { status, ...extra })
                            }
                            onDelete={deleteRoom}
                          />
                        ))}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Add Room Modal */}
        {showAddRoom && (
          <AddRoomModal
            hotelId={selectedHotelId}
            existingRoomNumbers={hotelRooms.map((r) => r.roomNumber)}
            onSave={(r) => {
              addRoom(r);
              setShowAddRoom(false);
            }}
            onClose={() => setShowAddRoom(false)}
          />
        )}
      </div>
    </AppLayout>
  );
}
