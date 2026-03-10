import { useState, useMemo } from "react";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import { formatCurrency } from "../utils/format";
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  X,
  Save,
} from "lucide-react";

const GOLD = "#C6A75E";
const DARKGOLD = "#A8832D";
const BORDER = "#E5E1DA";
const CARD = "#FFFFFF";

interface Guest {
  id: string;
  hotelId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  idProof: string;
  idNumber: string;
  totalVisits: number;
  totalSpend: number;
  lastVisit: string;
  notes: string;
}

export function GuestsPage() {
  const { user } = useAuth();
  const { bookings, hotels } = usePMS();
  const isAdmin = user?.role === "admin";
  const [search, setSearch] = useState("");
  const [filterHotel, setFilterHotel] = useState(
    isAdmin ? "all" : user?.hotelId || "",
  );
  const [showForm, setShowForm] = useState(false);
  const [editGuest, setEditGuest] = useState<Partial<Guest> | null>(null);

  // Build guest profiles from bookings
  const guestMap = useMemo(() => {
    const map: Record<string, Guest> = {};
    bookings
      .filter((b) => filterHotel === "all" || b.hotelId === filterHotel)
      .forEach((b) => {
        const key = b.guestPhone || b.guestName;
        if (!map[key]) {
          map[key] = {
            id: key,
            hotelId: b.hotelId,
            name: b.guestName,
            phone: b.guestPhone,
            email: b.guestEmail,
            address: b.addressLine || "",
            idProof: b.idProof || "",
            idNumber: "",
            totalVisits: 0,
            totalSpend: 0,
            lastVisit: b.checkInDate,
            notes: "",
          };
        }
        map[key].totalVisits++;
        map[key].totalSpend += Number(b.totalAmount || 0);
        if (b.checkInDate > map[key].lastVisit)
          map[key].lastVisit = b.checkInDate;
      });
    return Object.values(map);
  }, [bookings, filterHotel]);

  const filtered = useMemo(
    () =>
      guestMap.filter(
        (g) =>
          !search ||
          g.name.toLowerCase().includes(search.toLowerCase()) ||
          g.phone.includes(search) ||
          g.email.toLowerCase().includes(search.toLowerCase()),
      ),
    [guestMap, search],
  );

  return (
    <AppLayout title="Guests Directory">
      <div className="space-y-5 max-w-6xl">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div
            className="rounded-xl p-4"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <p className="text-xs" style={{ color: "#6B7280" }}>
              Total Unique Guests
            </p>
            <p
              className="text-3xl font-bold mt-1"
              style={{ fontFamily: "Times New Roman, serif", color: DARKGOLD }}
            >
              {guestMap.length}
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <p className="text-xs" style={{ color: "#6B7280" }}>
              Total Revenue from Guests
            </p>
            <p
              className="text-3xl font-bold mt-1"
              style={{ fontFamily: "Times New Roman, serif", color: GOLD }}
            >
              {formatCurrency(guestMap.reduce((s, g) => s + g.totalSpend, 0))}
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <p className="text-xs" style={{ color: "#6B7280" }}>
              Avg Spend per Guest
            </p>
            <p
              className="text-3xl font-bold mt-1"
              style={{ fontFamily: "Times New Roman, serif", color: "#3b82f6" }}
            >
              {formatCurrency(
                guestMap.length
                  ? guestMap.reduce((s, g) => s + g.totalSpend, 0) /
                  guestMap.length
                  : 0,
              )}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: GOLD }}
            />
            <input
              className="pl-9 pr-4 py-2 rounded-xl text-sm outline-none w-64"
              style={{ border: `1.5px solid ${BORDER}`, background: CARD }}
              placeholder="Search by name, phone, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {isAdmin && (
            <select
              className="px-3 py-2 rounded-xl text-sm outline-none appearance-none"
              style={{
                border: `1.5px solid ${BORDER}`,
                background: CARD,
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
          <div className="flex-1" />
          <button
            onClick={() => {
              setEditGuest({});
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{
              background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`,
            }}
          >
            <Plus className="w-4 h-4" /> Add Guest
          </button>
        </div>

        {/* Guest Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g) => (
            <div
              key={g.id}
              className="rounded-xl overflow-hidden cursor-pointer transition-all"
              style={{
                background: CARD,
                border: `1px solid ${BORDER}`,
                boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              }}
              onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow =
                "0 4px 16px #E5E1DA")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.04)")
              }
            >
              <div
                className="px-4 py-4 flex items-center gap-3"
                style={{ borderBottom: `1px solid ${BORDER}` }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`,
                  }}
                >
                  {g.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-bold"
                    style={{
                      fontFamily: "Times New Roman, serif",
                      color: "#1F2937",
                    }}
                  >
                    {g.name}
                  </div>
                  <div
                    className="flex items-center gap-1 text-xs mt-0.5"
                    style={{ color: "#6B7280" }}
                  >
                    <Phone className="w-3 h-3" /> {g.phone}
                  </div>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: "rgba(221, 215, 204,0.1)",
                    color: DARKGOLD,
                  }}
                >
                  {g.totalVisits} visit{g.totalVisits !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="px-4 py-3 space-y-1.5">
                {g.email && (
                  <div
                    className="flex items-center gap-2 text-xs"
                    style={{ color: "#6B7280" }}
                  >
                    <Mail
                      className="w-3 h-3 flex-shrink-0"
                      style={{ color: GOLD }}
                    />
                    <span className="truncate">{g.email}</span>
                  </div>
                )}
                {g.address && (
                  <div
                    className="flex items-center gap-2 text-xs"
                    style={{ color: "#6B7280" }}
                  >
                    <MapPin
                      className="w-3 h-3 flex-shrink-0"
                      style={{ color: GOLD }}
                    />
                    <span className="truncate">{g.address}</span>
                  </div>
                )}
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{ color: "#6B7280" }}
                >
                  <Calendar
                    className="w-3 h-3 flex-shrink-0"
                    style={{ color: GOLD }}
                  />
                  Last visit: {g.lastVisit}
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs" style={{ color: "#6B7280" }}>
                    Total Spend
                  </span>
                  <span className="font-bold text-sm" style={{ color: GOLD }}>
                    {formatCurrency(g.totalSpend)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div
              className="col-span-3 py-12 text-center"
              style={{ color: "#9CA3AF" }}
            >
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No guests found</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
