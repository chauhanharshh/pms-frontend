import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS, RestaurantTable } from "../contexts/PMSContext";
import {
  Search,
  Plus,
  X,
  Save,
  Building2,
  Trash2,
  Users,
  LayoutGrid,
  Edit2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const GOLD = "#C6A75E";
const DARKGOLD = "#A8832D";

// ── TABLE CARD ─────────────────────────────────────────────────
function TableCard({
  table,
  onEdit,
  onDelete,
}: {
  table: RestaurantTable;
  onEdit: (table: RestaurantTable) => void;
  onDelete: (id: string) => void;
}) {
  const activeColor = table.isActive ? "#22c55e" : "#94a3b8";

  return (
    <div
      className="relative rounded-xl overflow-hidden transition-all group bg-white border-2"
      style={{
        borderColor: table.isActive ? "rgba(34, 197, 94, 0.2)" : "rgba(148, 163, 184, 0.2)",
        minHeight: "140px",
      }}
    >
      <div className="p-4 flex flex-col h-full justify-between">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: activeColor }}
            />
            <div>
              <div
                className="text-lg font-bold"
                style={{ fontFamily: "Times New Roman, serif", color: "#1e293b" }}
              >
                {table.name}
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Capacity: {table.capacity} Seater
              </div>
            </div>
          </div>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
            style={{
              background: table.isActive ? "#f0fdf4" : "#f1f5f9",
              color: table.isActive ? "#15803d" : "#475569",
              border: `1px solid ${table.isActive ? "#86efac" : "#cbd5e1"}`,
            }}
          >
            {table.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={() => onEdit(table)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: "rgba(198, 167, 94, 0.1)",
              color: DARKGOLD,
              border: "1px solid rgba(198, 167, 94, 0.2)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(198, 167, 94, 0.18)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(198, 167, 94, 0.1)")}
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete table "${table.name}"?`)) {
                onDelete(table.id);
              }
            }}
            className="p-1.5 rounded-lg transition-all"
            style={{
              background: "#fef2f2",
              color: "#dc2626",
              border: "1px solid #fca5a5",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fef2f2")}
            title="Delete Table"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── TABLE MODAL ─────────────────────────────────────────────
function TableModal({
  hotelId,
  table,
  onSave,
  onClose,
}: {
  hotelId: string;
  table?: RestaurantTable;
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<any>({
    hotelId,
    name: table?.name || "",
    capacity: table?.capacity || 2,
    isActive: table ? table.isActive : true,
  });

  const f = (key: string, val: any) => setForm((p: any) => ({ ...p, [key]: val }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-xl font-bold" style={{ fontFamily: "Times New Roman, serif", color: DARKGOLD }}>
            {table ? "Edit Restaurant Table" : "Add New Restaurant Table"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-gray-500">
              Table Name / Number *
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-gold outline-none text-sm transition-all"
              value={form.name}
              onChange={(e) => f("name", e.target.value)}
              placeholder="e.g. T6, Table 1, Walk-in"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-gray-500">
              Capacity (Seater)
            </label>
            <div className="flex items-center gap-3">
              {[2, 4, 6, 8, 10, 12].map(num => (
                <button
                  key={num}
                  onClick={() => f("capacity", num)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    form.capacity === num 
                      ? "bg-gold text-white shadow-md shadow-gold/20" 
                      : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
                  }`}
                  style={{ backgroundColor: form.capacity === num ? GOLD : undefined }}
                >
                  {num}
                </button>
              ))}
              <input
                type="number"
                className="w-16 px-2 py-2 rounded-lg border border-gray-200 outline-none text-center text-sm ml-auto"
                value={form.capacity}
                onChange={(e) => f("capacity", Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                className="hidden"
                checked={form.isActive}
                onChange={(e) => f("isActive", e.target.checked)}
              />
              <div className={`w-10 h-6 rounded-full relative transition-all ${form.isActive ? "bg-green-500" : "bg-gray-300"}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.isActive ? "left-5" : "left-1"}`} />
              </div>
              <span className="text-sm font-medium text-gray-700">Active for Dining</span>
            </label>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-200 transition-all border border-transparent"
          >
            Cancel
          </button>
          <button
            disabled={!form.name}
            onClick={() => form.name && onSave(form)}
            className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold text-white shadow-lg disabled:opacity-40 transition-all hover:scale-[1.02]" // Removed: active scale animation for instant click response
            style={{
              background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`,
              boxShadow: `0 4px 12px rgba(198, 167, 94, 0.3)`,
            }}
          >
            <Save className="w-4 h-4" /> {table ? "Save Changes" : "Create Table"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function RestaurantTableManagement() {
  const { user, currentHotelId, setCurrentHotelId } = useAuth();
  const { restaurantTables, addTable, updateTable, deleteTable, hotels } = usePMS();
  const location = useLocation();

  const currentUserHotel = hotels.find(h => h.id === currentHotelId);
  const isPosBossMode = currentUserHotel?.posBossMode === true;
  const isBossAdmin = user?.role === "admin" || isPosBossMode;

  const queryHotel = new URLSearchParams(location.search).get("hotel");
  const activeHotelId = isBossAdmin && queryHotel ? queryHotel : currentHotelId;

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | undefined>();

  const selectedHotelId = activeHotelId || "";
  const currentHotel = hotels.find((h) => h.id === selectedHotelId);
  
  const filteredTables = useMemo(() => {
    return restaurantTables.filter(t => {
      const matchHotel = t.hotelId === selectedHotelId;
      const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
      return matchHotel && matchSearch;
    });
  }, [restaurantTables, selectedHotelId, search]);

  const handleSave = async (data: any) => {
    // Client-side duplicate check
    const isDuplicate = restaurantTables.some(t => 
      t.hotelId === selectedHotelId && 
      t.name.trim().toLowerCase() === data.name.trim().toLowerCase() &&
      (!editingTable || t.id !== editingTable.id)
    );

    if (isDuplicate) {
      alert(`A table named "${data.name}" already exists.`);
      return;
    }

    try {
      if (editingTable) {
        await updateTable(editingTable.id, data);
      } else {
        await addTable({ ...data, hotelId: selectedHotelId });
      }
      setShowModal(false);
      setEditingTable(undefined);
    } catch (err: any) {
      alert(err.message || "Failed to save table");
    }
  };

  return (
    <AppLayout title={`Restaurant Table Management ${currentHotel ? ` — ${currentHotel.name}` : ""}`}>
      <div className="space-y-6">
        {/* Admin Header / Hotel Picker */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gold/10 rounded-2xl border border-gold/20 shadow-inner">
              <LayoutGrid className="w-6 h-6" style={{ color: GOLD }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "Times New Roman, serif" }}>
                Table Management
              </h1>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">
                Define dynamic dining areas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             {isBossAdmin && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-xl border border-gray-200">
                <Building2 className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedHotelId}
                  onChange={(e) => setCurrentHotelId(e.target.value)}
                  className="bg-transparent text-sm font-semibold outline-none text-gray-700"
                >
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              onClick={() => {
                setEditingTable(undefined);
                setShowModal(true);
              }}
              className="px-5 py-2.5 rounded-2xl flex items-center gap-2 text-sm font-bold text-white shadow-xl hover:scale-[1.02] transition-all" // Removed: active scale animation for instant click response
              style={{
                background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`,
                boxShadow: `0 6px 20px rgba(198, 167, 94, 0.4)`,
              }}
            >
              <Plus className="w-4 h-4" /> Add New Table
            </button>
          </div>
        </div>

        {/* Filters and Stats */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by table name..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-gold transition-all"
            />
          </div>
          <div className="flex items-center gap-6 px-4 py-2 border-l border-gray-100">
             <div className="text-center">
                <div className="text-xl font-bold" style={{ color: DARKGOLD }}>{filteredTables.length}</div>
                <div className="text-[10px] uppercase tracking-tighter text-gray-400 font-bold">Total Tables</div>
             </div>
             <div className="text-center">
                <div className="text-xl font-bold text-green-500">{filteredTables.filter(t => t.isActive).length}</div>
                <div className="text-[10px] uppercase tracking-tighter text-gray-400 font-bold">Active</div>
             </div>
          </div>
        </div>

        {/* Tables Grid */}
        {filteredTables.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onEdit={(t) => {
                  setEditingTable(t);
                  setShowModal(true);
                }}
                onDelete={deleteTable}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <LayoutGrid className="w-8 h-8 opacity-20" />
            </div>
            <p className="font-semibold">No restaurant tables found</p>
            <p className="text-xs">Add your first table to get started</p>
          </div>
        )}
      </div>

      {showModal && (
        <TableModal
          hotelId={selectedHotelId}
          table={editingTable}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingTable(undefined);
          }}
        />
      )}
    </AppLayout>
  );
}
