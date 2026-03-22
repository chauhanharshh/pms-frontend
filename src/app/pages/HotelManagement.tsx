import { useState } from "react";
import { AppLayout } from "../layouts/AppLayout";
import { usePMS, CloneOptions, Hotel } from "../contexts/PMSContext";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import {
  Building2,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  Copy,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  ChevronRight,
  AlertCircle,
  CheckSquare,
  Square,
  Layers,
  Clock,
  Percent,
  BedDouble,
  Utensils,
  Settings2,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";

const GOLD = "#C6A75E";
const DARKGOLD = "#A8832D";
const SIDEBAR_BG = "#DDD7CC";

// ── helpers ───────────────────────────────────────────────────
const emptyHotel = (): Omit<Hotel, "id" | "createdAt"> => ({
  name: "",
  address: "",
  city: "",
  state: "",
  phone: "",
  email: "",
  website: "",
  gstNumber: "",
  totalRooms: 0,
  floors: 2,
  checkInTime: "14:00",
  checkOutTime: "12:00",
  taxRate: 12,
  currency: "INR",
  isActive: true,
  showAllRooms: false,
});

const emptyClone = (): CloneOptions => ({
  roomStructure: false,
  roomTypesPricing: false,
  restaurantMenu: false,
  restaurantCategories: false,
  taxSettings: false,
});

const STAR_COLORS = [
  "#9ca3af",
  "#f59e0b",
  "#f59e0b",
  "#f59e0b",
  "#f59e0b",
  "#f59e0b",
];

function RatingStars({ rating = 0 }: { rating?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className="w-3.5 h-3.5"
          fill={i <= rating ? "#C6A75E" : "none"}
          stroke={i <= rating ? "#C6A75E" : "#d1c9a8"}
        />
      ))}
    </div>
  );
}

function HotelCard({
  hotel,
  onEdit,
  onDelete,
  onClone,
  onManageRooms,
  roomCount,
  occupiedCount,
}: {
  hotel: Hotel;
  onEdit: () => void;
  onDelete: () => void;
  onClone: () => void;
  onManageRooms: () => void;
  roomCount: number;
  occupiedCount: number;
}) {
  const occupancy =
    roomCount > 0 ? Math.round((occupiedCount / roomCount) * 100) : 0;
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all group"
      style={{
        background: "white",
        border: "1px solid #E5E1DA",
        boxShadow: "0 4px 16px rgba(184,134,11,0.07)",
      }}
    >
      {/* Header banner */}
      <div
        className="px-5 pt-5 pb-4"
        style={{
          background: `linear-gradient(135deg, ${SIDEBAR_BG}, #CFC8BC)`,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "#E5E1DA",
                border: "1px solid #E5E1DA",
              }}
            >
              <Building2 className="w-5 h-5" style={{ color: GOLD }} />
            </div>
            <div className="min-w-0">
              <h3
                className="font-bold text-base leading-tight truncate"
                style={{
                  color: "#FFFFFF",
                  fontFamily: "Times New Roman, serif",
                }}
              >
                {hotel.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <RatingStars rating={hotel.rating} />
                <span
                  className="text-xs"
                  style={{ color: "#FFFFFF" }}
                >
                  {hotel.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "#FFFFFF" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#E5E1DA")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg transition-colors text-red-400"
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(239,68,68,0.2)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Occupancy bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span style={{ color: "#FFFFFF" }}>Occupancy</span>
            <span style={{ color: GOLD }} className="font-semibold">
              {occupancy}%
            </span>
          </div>
          <div
            className="h-1.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <div
              className="h-1.5 rounded-full transition-all"
              style={{
                width: `${occupancy}%`,
                background: `linear-gradient(90deg, ${GOLD}, ${DARKGOLD})`,
              }}
            />
          </div>
          <div
            className="flex justify-between text-xs mt-1"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            <span>{occupiedCount} occupied</span>
            <span>{roomCount - occupiedCount} vacant</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-2.5">
        <div className="flex items-start gap-2">
          <MapPin
            className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
            style={{ color: GOLD }}
          />
          <span
            className="text-xs leading-relaxed"
            style={{ color: "#6B7280" }}
          >
            {hotel.address}, {hotel.city}, {hotel.state}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Phone
            className="w-3.5 h-3.5 flex-shrink-0"
            style={{ color: GOLD }}
          />
          <span className="text-xs" style={{ color: "#6B7280" }}>
            {hotel.phone}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: GOLD }} />
          <span className="text-xs truncate" style={{ color: "#6B7280" }}>
            {hotel.email}
          </span>
        </div>

        <div
          className="grid grid-cols-3 gap-2 pt-2 border-t"
          style={{ borderColor: "rgba(184,134,11,0.12)" }}
        >
          {[
            {
              icon: <BedDouble className="w-3 h-3" />,
              val: `${roomCount} Rooms`,
            },
            {
              icon: <Layers className="w-3 h-3" />,
              val: `${hotel.floors} Floors`,
            },
            {
              icon: <Percent className="w-3 h-3" />,
              val: `${hotel.taxRate}% GST`,
            },
          ].map(({ icon, val }) => (
            <div
              key={val}
              className="text-center rounded-lg py-1.5"
              style={{
                background: "rgba(184,134,11,0.04)",
                border: "1px solid rgba(221, 215, 204,0.1)",
              }}
            >
              <div
                className="flex justify-center mb-0.5"
                style={{ color: GOLD }}
              >
                {icon}
              </div>
              <div className="text-xs font-medium" style={{ color: "#4a3d1f" }}>
                {val}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-1.5 pt-1">
          <div
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md"
            style={{ background: "rgba(184,134,11,0.06)", color: "#6B7280" }}
          >
            <Clock className="w-3 h-3" style={{ color: GOLD }} />
            CI: {hotel.checkInTime} / CO: {hotel.checkOutTime}
          </div>
          <div
            className="text-xs px-2 py-1 rounded-md"
            style={{ background: "rgba(184,134,11,0.06)", color: "#6B7280" }}
          >
            GST: {hotel.gstNumber}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-5 pb-5 grid grid-cols-2 gap-2">
        <button
          onClick={onManageRooms}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
          style={{
            background: "rgba(229,225,218,0.5)",
            border: "1px solid #E5E1DA",
            color: DARKGOLD,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "#E5E1DA")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(229,225,218,0.5)")
          }
        >
          <BedDouble className="w-3.5 h-3.5" /> Manage Rooms
        </button>
        <button
          onClick={onClone}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
          style={{
            background: "linear-gradient(135deg, #C6A75E, #A8832D)",
            color: "white",
            boxShadow: "0 2px 8px #E5E1DA",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <Copy className="w-3.5 h-3.5" /> Clone Data
        </button>
      </div>
    </div>
  );
}

// ── HOTEL FORM MODAL ──────────────────────────────────────────
function HotelFormModal({
  hotel,
  isNew,
  onSave,
  onClose,
}: {
  hotel: Omit<Hotel, "id" | "createdAt">;
  isNew?: boolean;
  onSave: (data: Omit<Hotel, "id" | "createdAt"> & { hotelUsername?: string; hotelPassword?: string }) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<any>(hotel);
  const [creds, setCreds] = useState({ username: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const f = (key: string, val: string | number | boolean) =>
    setForm((prev: any) => ({ ...prev, [key]: val }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{ background: "white" }}
      >
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{
            background: "#FFFFFF",
            borderBottom: "2px solid #E5E1DA",
          }}
        >
          <h2
            style={{
              fontFamily: "Times New Roman, serif",
              color: DARKGOLD,
              fontSize: "1.15rem",
            }}
          >
            {form.name ? `Edit: ${form.name}` : "Add New Hotel"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
          {/* Basic Info */}
          <div className="col-span-2">
            <label
              className="block text-xs font-semibold mb-1 uppercase tracking-wide"
              style={{ color: DARKGOLD }}
            >
              Hotel Name *
            </label>
            <input
              className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
              style={{ border: "2px solid #E5E1DA" }}
              value={form.name}
              onChange={(e) => f("name", e.target.value)}
              placeholder="e.g. Grand Royale Hotel"
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1 uppercase tracking-wide"
              style={{ color: DARKGOLD }}
            >
              Address
            </label>
            <input
              className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
              style={{ border: "2px solid #E5E1DA" }}
              value={form.address}
              onChange={(e) => f("address", e.target.value)}
              placeholder="Street address"
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1 uppercase tracking-wide"
              style={{ color: DARKGOLD }}
            >
              City *
            </label>
            <input
              className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
              style={{ border: "2px solid #E5E1DA" }}
              value={form.city}
              onChange={(e) => f("city", e.target.value)}
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1 uppercase tracking-wide"
              style={{ color: DARKGOLD }}
            >
              State
            </label>
            <input
              className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
              style={{ border: "2px solid #E5E1DA" }}
              value={form.state}
              onChange={(e) => f("state", e.target.value)}
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1 uppercase tracking-wide"
              style={{ color: DARKGOLD }}
            >
              Phone
            </label>
            <input
              className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
              style={{ border: "2px solid #E5E1DA" }}
              value={form.phone}
              onChange={(e) => f("phone", e.target.value)}
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1 uppercase tracking-wide"
              style={{ color: DARKGOLD }}
            >
              Email
            </label>
            <input
              type="email"
              className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
              style={{ border: "2px solid #E5E1DA" }}
              value={form.email}
              onChange={(e) => f("email", e.target.value)}
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1 uppercase tracking-wide"
              style={{ color: DARKGOLD }}
            >
              Website
            </label>
            <input
              className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
              style={{ border: "2px solid #E5E1DA" }}
              value={form.website || ""}
              onChange={(e) => f("website", e.target.value)}
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1 uppercase tracking-wide"
              style={{ color: DARKGOLD }}
            >
              GST Number
            </label>
            <input
              className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
              style={{ border: "2px solid #E5E1DA" }}
              value={form.gstNumber}
              onChange={(e) => f("gstNumber", e.target.value)}
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1 uppercase tracking-wide"
              style={{ color: DARKGOLD }}
            >
              Total Rooms
            </label>
            <input
              type="number"
              className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
              style={{ border: "2px solid #E5E1DA" }}
              value={form.totalRooms || ""}
              onChange={(e) => f("totalRooms", e.target.value ? +e.target.value : "")}
              placeholder="e.g. 50"
            />
          </div>
          {/* Operational */}
          <div>
            <label
              className="block text-xs font-semibold mb-1 uppercase tracking-wide"
              style={{ color: DARKGOLD }}
            >
              Floors
            </label>
            <input
              type="number"
              min={1}
              max={50}
              className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
              style={{ border: "2px solid #E5E1DA" }}
              value={form.floors}
              onChange={(e) => f("floors", +e.target.value)}
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1 uppercase tracking-wide"
              style={{ color: DARKGOLD }}
            >
              GST Rate (%)
            </label>
            <input
              type="number"
              min={0}
              max={28}
              className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
              style={{ border: "2px solid #E5E1DA" }}
              value={form.taxRate}
              onChange={(e) => f("taxRate", +e.target.value)}
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1 uppercase tracking-wide"
              style={{ color: DARKGOLD }}
            >
              Check-In Time
            </label>
            <input
              type="time"
              className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
              style={{ border: "2px solid #E5E1DA" }}
              value={form.checkInTime}
              onChange={(e) => f("checkInTime", e.target.value)}
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1 uppercase tracking-wide"
              style={{ color: DARKGOLD }}
            >
              Check-Out Time
            </label>
            <input
              type="time"
              className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
              style={{ border: "2px solid #E5E1DA" }}
              value={form.checkOutTime}
              onChange={(e) => f("checkOutTime", e.target.value)}
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1 uppercase tracking-wide"
              style={{ color: DARKGOLD }}
            >
              Star Rating
            </label>
            <div className="flex gap-2 items-center h-10">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => f("rating", s)} className="p-1">
                  <Star
                    className="w-5 h-5"
                    fill={(form.rating || 0) >= s ? GOLD : "none"}
                    stroke={(form.rating || 0) >= s ? GOLD : "#d1c9a8"}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 h-10 col-span-1 pt-4">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => f("isActive", e.target.checked)}
              className="w-4 h-4"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium"
              style={{ color: DARKGOLD }}
            >
              Active Hotel
            </label>
          </div>
          <div className="flex items-center gap-2 h-10 col-span-1 pt-4">
            <input
              type="checkbox"
              id="posBossMode"
              checked={form.posBossMode || false}
              onChange={(e) => f("posBossMode", e.target.checked)}
              className="w-4 h-4"
            />
            <label
              htmlFor="posBossMode"
              className="text-sm font-medium font-bold"
              style={{ color: DARKGOLD }}
            >
              POS Boss Mode
            </label>
          </div>
          <div className="flex items-center gap-2 h-10 col-span-1 pt-4">
            <input
              type="checkbox"
              id="showAllRooms"
              checked={form.showAllRooms || false}
              onChange={(e) => f("showAllRooms", e.target.checked)}
              className="w-4 h-4"
            />
            <label
              htmlFor="showAllRooms"
              className="text-sm font-medium font-bold"
              style={{ color: DARKGOLD }}
            >
              Show All Rooms
            </label>
          </div>
          {/* Hotel Login Credentials — only for new hotels */}
          {isNew && (
            <div
              className="col-span-2 rounded-xl p-4 space-y-3"
              style={{
                background: "rgba(198,167,94,0.05)",
                border: "1.5px solid rgba(198,167,94,0.25)",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4" style={{ color: GOLD }} />
                <span
                  className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: DARKGOLD }}
                >
                  Hotel Login Credentials (Optional)
                </span>
              </div>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>
                These credentials create a Hotel Manager account for this hotel.
                The manager can log in and access only this hotel&apos;s dashboard.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-xs font-semibold mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Hotel Username
                  </label>
                  <input
                    className="w-full px-3 py-2 rounded-lg outline-none text-sm"
                    style={{ border: "2px solid #E5E1DA" }}
                    value={creds.username}
                    onChange={(e) =>
                      setCreds((p) => ({ ...p, username: e.target.value }))
                    }
                    placeholder="e.g. grandhotel"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold mb-1"
                    style={{ color: DARKGOLD }}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      className="w-full px-3 py-2 rounded-lg outline-none text-sm pr-9"
                      style={{ border: "2px solid #E5E1DA" }}
                      value={creds.password}
                      onChange={(e) =>
                        setCreds((p) => ({ ...p, password: e.target.value }))
                      }
                      placeholder="Min 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((p) => !p)}
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      style={{ color: "#9CA3AF" }}
                    >
                      {showPw ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Buttons */}
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
              onClick={() =>
                onSave({
                  ...form,
                  ...(isNew && creds.username && creds.password
                    ? { hotelUsername: creds.username, hotelPassword: creds.password }
                    : {}),
                })
              }
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white"
              style={{
                background: "linear-gradient(135deg, #C6A75E, #A8832D)",
                boxShadow: "0 2px 8px #E5E1DA",
              }}
            >
              <Save className="w-4 h-4" /> Save Hotel
            </button>
          </div>
        </div>
      </div>
    </div >
  );
}

// ── CLONE WIZARD MODAL ────────────────────────────────────────
function CloneModal({
  sourceHotel,
  hotels,
  onClone,
  onClose,
}: {
  sourceHotel: Hotel;
  hotels: Hotel[];
  onClone: (targetId: string, opts: CloneOptions) => void;
  onClose: () => void;
}) {
  const [targetId, setTargetId] = useState("");
  const [opts, setOpts] = useState<CloneOptions>(emptyClone());
  const toggle = (key: keyof CloneOptions) =>
    setOpts((o) => ({ ...o, [key]: !o[key] }));
  const targetHotels = hotels.filter((h) => h.id !== sourceHotel.id);

  const optionsList: {
    key: keyof CloneOptions;
    label: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
      {
        key: "roomStructure",
        label: "Room Structure",
        desc: "Copy room numbers, floors, layouts",
        icon: <BedDouble className="w-4 h-4" />,
      },
      {
        key: "roomTypesPricing",
        label: "Room Types & Pricing",
        desc: "Copy type categories and base rates",
        icon: <Layers className="w-4 h-4" />,
      },
      {
        key: "restaurantCategories",
        label: "Restaurant Categories",
        desc: "Copy menu category structure",
        icon: <Utensils className="w-4 h-4" />,
      },
      {
        key: "restaurantMenu",
        label: "Full Restaurant Menu",
        desc: "Copy all dishes and items (requires categories)",
        icon: <Utensils className="w-4 h-4" />,
      },
      {
        key: "taxSettings",
        label: "Tax & Time Settings",
        desc: "Copy GST rate, check-in/out times",
        icon: <Settings2 className="w-4 h-4" />,
      },
    ];

  const anySelected = Object.values(opts).some(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: "white" }}
      >
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{
            background: `linear-gradient(135deg, ${SIDEBAR_BG}, #CFC8BC)`,
          }}
        >
          <div>
            <h2
              className="font-bold text-base"
              style={{ fontFamily: "Times New Roman, serif", color: "#FFFFFF" }}
            >
              Clone Hotel Data
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: "#FFFFFF" }}
            >
              From: {sourceHotel.name}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Target hotel */}
          <div>
            <label
              className="block text-xs font-semibold mb-2 uppercase tracking-wide"
              style={{ color: DARKGOLD }}
            >
              Target Hotel (Copy To)
            </label>
            <select
              className="w-full px-3 py-2.5 rounded-xl outline-none text-sm"
              style={{
                border: "2px solid #E5E1DA",
                background: "white",
              }}
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
            >
              <option value="">Select target hotel…</option>
              {targetHotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} — {h.city}
                </option>
              ))}
            </select>
          </div>

          {/* What to copy */}
          <div>
            <label
              className="block text-xs font-semibold mb-2 uppercase tracking-wide"
              style={{ color: DARKGOLD }}
            >
              What to Copy
            </label>
            <div className="space-y-2">
              {optionsList.map(({ key, label, desc, icon }) => (
                <button
                  key={key}
                  onClick={() => toggle(key)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                  style={{
                    background: opts[key] ? "rgba(229,225,218,0.5)" : "#fafaf8",
                    border: `1.5px solid ${opts[key] ? "rgba(255,255,255,0.5)" : "rgba(184,134,11,0.12)"}`,
                  }}
                >
                  <div
                    className="flex-shrink-0"
                    style={{ color: opts[key] ? GOLD : "#9CA3AF" }}
                  >
                    {opts[key] ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </div>
                  <div
                    className="flex-shrink-0"
                    style={{ color: opts[key] ? GOLD : "#9CA3AF" }}
                  >
                    {icon}
                  </div>
                  <div>
                    <div
                      className="text-sm font-semibold"
                      style={{ color: opts[key] ? DARKGOLD : "#4a3d1f" }}
                    >
                      {label}
                    </div>
                    <div
                      className="text-xs mt-0.5"
                      style={{ color: "#9CA3AF" }}
                    >
                      {desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div
            className="rounded-xl px-4 py-3 flex items-start gap-3"
            style={{ background: "#fef9c3", border: "1px solid #fde68a" }}
          >
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              This will <strong>replace</strong> existing structure in the
              target hotel. Historical bookings, bills, and financial data will
              NOT be copied.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
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
              disabled={!targetId || !anySelected}
              onClick={() => targetId && onClone(targetId, opts)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #C6A75E, #A8832D)",
                boxShadow: "0 2px 8px #E5E1DA",
              }}
            >
              <Copy className="w-4 h-4" /> Clone Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export function HotelManagement() {
  const { user } = useAuth();
  const { hotels, addHotel, updateHotel, deleteHotel, cloneHotelData, rooms } =
    usePMS();
  const [showForm, setShowForm] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [cloneSource, setCloneSource] = useState<Hotel | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 3500);
  };

  const handleSave = async (data: any) => {
    if (isSaving) return;

    const rawWebsite = data?.website == null ? "" : String(data.website).trim();
    const normalizedWebsite =
      rawWebsite && !/^https?:\/\//i.test(rawWebsite)
        ? `https://${rawWebsite}`
        : rawWebsite;

    const payload = {
      ...data,
      name: String(data?.name || "").trim(),
      city: data?.city == null ? "" : String(data.city).trim(),
      address: data?.address == null ? "" : String(data.address).trim(),
      state: data?.state == null ? "" : String(data.state).trim(),
      phone: data?.phone == null ? "" : String(data.phone).trim(),
      email: data?.email == null ? "" : String(data.email).trim().toLowerCase(),
      website: normalizedWebsite,
      gstNumber: data?.gstNumber == null ? "" : String(data.gstNumber).trim(),
      checkInTime: data?.checkInTime || "14:00",
      checkOutTime: data?.checkOutTime || "12:00",
      floors: data?.floors === "" || data?.floors == null ? null : Number(data.floors),
      totalRooms:
        data?.totalRooms === "" || data?.totalRooms == null
          ? null
          : Number(data.totalRooms),
      taxRate: data?.taxRate === "" || data?.taxRate == null ? 12 : Number(data.taxRate),
      rating: data?.rating === "" || data?.rating == null ? null : Number(data.rating),
      hotelUsername: data?.hotelUsername == null ? undefined : String(data.hotelUsername).trim(),
      hotelPassword: data?.hotelPassword == null ? undefined : String(data.hotelPassword),
    };

    if (!payload.name) {
      showError("Hotel name is required");
      return;
    }

    if (!editingHotel) {
      const hasUsername = !!payload.hotelUsername;
      const hasPassword = !!payload.hotelPassword;
      if (hasUsername !== hasPassword) {
        showError("Provide both hotel username and password, or leave both empty");
        return;
      }

      if (hasUsername && payload.hotelUsername!.length < 3) {
        showError("Hotel username must be at least 3 characters");
        return;
      }

      if (hasPassword && payload.hotelPassword!.length < 6) {
        showError("Hotel password must be at least 6 characters");
        return;
      }
    }

    if (payload.floors !== null && (!Number.isFinite(payload.floors) || payload.floors < 1)) {
      showError("Floors must be at least 1");
      return;
    }

    if (payload.totalRooms !== null && (!Number.isFinite(payload.totalRooms) || payload.totalRooms < 0)) {
      showError("Total rooms cannot be negative");
      return;
    }

    if (!Number.isFinite(payload.taxRate) || payload.taxRate < 0 || payload.taxRate > 100) {
      showError("GST rate must be between 0 and 100");
      return;
    }

    if (payload.rating !== null && (!Number.isFinite(payload.rating) || payload.rating < 0 || payload.rating > 5)) {
      showError("Rating must be between 0 and 5");
      return;
    }

    setIsSaving(true);
    try {
      if (editingHotel) {
        await updateHotel(editingHotel.id, payload);
        showSuccess(`"${payload.name}" updated successfully`);
      } else {
        await addHotel(payload);
        showSuccess(`"${payload.name}" hotel created successfully`);
      }
      setShowForm(false);
      setEditingHotel(null);
    } catch (err: any) {
      console.error("Save failed:", err);
      const message =
        err?.response?.data?.errors?.[0]?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Unable to save hotel. Please check the form and try again.";
      showError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClone = async (targetId: string, opts: CloneOptions) => {
    if (!cloneSource) return;
    try {
      await cloneHotelData(cloneSource.id, targetId, opts);
      const target = hotels.find((h) => h.id === targetId);
      showSuccess(`Data cloned from "${cloneSource.name}" to "${target?.name}"`);
      setCloneSource(null);
    } catch (err: any) {
      console.error("Clone failed:", err);
    }
  };

  const activeHotels = hotels.filter((h) => h.isActive);
  const totalRooms = rooms.length;
  const totalOccupied = rooms.filter((r) => r.status === "occupied").length;
  const maxHotels = Math.max(1, Number(user?.maxHotels || 1));
  const currentHotels = hotels.length;
  const isHotelLimitReached = currentHotels >= maxHotels;

  return (
    <AppLayout title="Hotel Management" requiredRole="admin">
      <div className="space-y-6 max-w-7xl">
        {/* Success toast */}
        {successMsg && (
          <div
            className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-xl"
            style={{ background: "linear-gradient(135deg, #15803d, #166534)" }}
          >
            ✓ {successMsg}
          </div>
        )}

        {errorMsg && (
          <div
            className="fixed top-20 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-xl max-w-md"
            style={{ background: "linear-gradient(135deg, #dc2626, #b91c1c)" }}
          >
            {errorMsg}
          </div>
        )}

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Hotels", value: hotels.length, color: GOLD },
            {
              label: "Active Hotels",
              value: activeHotels.length,
              color: "#16a34a",
            },
            { label: "Total Rooms", value: totalRooms, color: "#3b82f6" },
            { label: "Occupied Rooms", value: totalOccupied, color: "#dc2626" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-4"
              style={{
                background: "white",
                border: "1px solid #E5E1DA",
                boxShadow: "0 2px 8px rgba(221, 215, 204,0.05)",
              }}
            >
              <div
                className="text-2xl font-bold"
                style={{ color: s.color, fontFamily: "Times New Roman, serif" }}
              >
                {s.value}
              </div>
              <div className="text-xs mt-1" style={{ color: "#6B7280" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-base font-semibold"
              style={{ fontFamily: "Times New Roman, serif", color: DARKGOLD }}
            >
              {hotels.length} {hotels.length === 1 ? "Hotel" : "Hotels"} in System
            </h2>
            <p style={{ color: "#888", fontSize: "13px" }}>
              Hotels: {currentHotels} / {maxHotels} allowed
            </p>
          </div>
          <button
            disabled={isHotelLimitReached}
            title={isHotelLimitReached ? "Hotel limit reached. Contact support." : "Add new hotel"}
            onClick={() => {
              if (isHotelLimitReached) return;
              setEditingHotel(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #C6A75E, #A8832D)",
              boxShadow: "0 2px 8px #E5E1DA",
            }}
          >
            <Plus className="w-4 h-4" /> Add New Hotel
          </button>
        </div>

        {/* Hotel Cards Grid */}
        <div className="grid grid-cols-3 gap-5">
          {hotels.map((hotel) => {
            const hotelRooms = rooms.filter((r) => r.hotelId === hotel.id);
            const occupied = hotelRooms.filter(
              (r) => r.status === "occupied",
            ).length;
            return (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                roomCount={hotelRooms.length}
                occupiedCount={occupied}
                onEdit={() => {
                  setEditingHotel(hotel);
                  setShowForm(true);
                }}
                onDelete={() => setDeleteConfirm(hotel.id)}
                onClone={() => setCloneSource(hotel)}
                onManageRooms={() =>
                  (window.location.href = `/admin/rooms?hotel=${hotel.id}`)
                }
              />
            );
          })}
          {/* Add new hotel card */}
          <button
            disabled={isHotelLimitReached}
            title={isHotelLimitReached ? "Hotel limit reached. Contact support." : "Add new hotel"}
            onClick={() => {
              if (isHotelLimitReached) return;
              setEditingHotel(null);
              setShowForm(true);
            }}
            className="rounded-2xl flex flex-col items-center justify-center gap-3 p-8 min-h-64 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              border: "2px dashed #E5E1DA",
              background: "rgba(184,134,11,0.02)",
              color: "rgba(255,255,255,0.6)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = "2px dashed rgba(255,255,255,0.6)";
              e.currentTarget.style.background = "rgba(221, 215, 204,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = "2px dashed #E5E1DA";
              e.currentTarget.style.background = "rgba(184,134,11,0.02)";
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ border: "2px dashed #E5E1DA" }}
            >
              <Plus className="w-6 h-6" />
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold" style={{ color: GOLD }}>
                Add New Hotel
              </div>
              <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                Rooms & categories auto-created
              </div>
            </div>
          </button>
        </div>

        {/* Modals */}
        {showForm && (
          <HotelFormModal
            hotel={editingHotel ? { ...editingHotel } : emptyHotel()}
            isNew={!editingHotel}
            onSave={isSaving ? () => { } : handleSave}
            onClose={() => {
              setShowForm(false);
              setEditingHotel(null);
            }}
          />
        )}

        {cloneSource && (
          <CloneModal
            sourceHotel={cloneSource}
            hotels={hotels}
            onClone={handleClone}
            onClose={() => setCloneSource(null)}
          />
        )}

        {deleteConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)" }}
          >
            <div
              className="w-96 rounded-2xl p-6 text-center"
              style={{ background: "white" }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "#fee2e2" }}
              >
                <AlertCircle className="w-7 h-7 text-red-500" />
              </div>
              <h3
                className="font-bold text-lg mb-2"
                style={{ fontFamily: "Times New Roman, serif" }}
              >
                Delete Hotel?
              </h3>
              <p className="text-sm mb-1" style={{ color: "#6B7280" }}>
                <strong>
                  {hotels.find((h) => h.id === deleteConfirm)?.name}
                </strong>
              </p>
              <p className="text-xs mb-5" style={{ color: "#9CA3AF" }}>
                All rooms, bookings, bills, and restaurant data for this hotel
                will be permanently deleted. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm"
                  style={{
                    border: "1px solid #E5E1DA",
                    color: DARKGOLD,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteHotel(deleteConfirm);
                    setDeleteConfirm(null);
                    showSuccess("Hotel deleted");
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
