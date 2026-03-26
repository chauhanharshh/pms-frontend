import { useState, useEffect } from "react";
import { AppLayout } from "../layouts/AppLayout";
import { usePMS } from "../contexts/PMSContext";
import { exportToCSV, formatDateForCSV } from "../utils/tableExport";
import {
    Search,
    Filter,
    Calendar,
    ClipboardList,
    Printer,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
    Receipt,
    X,
    RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { printHtml } from "../utils/print";
import { resolveBrandName } from "../utils/branding";

export default function RestaurantKOTs() {
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");
    const [selectedHotelFilter, setSelectedHotelFilter] = useState(""); // Added: Hotel column and hotel filter for KOTs page

    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [kotToPreview, setKotToPreview] = useState<any>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();
    const roleBase = user?.role === "admin" ? "/admin" : "/hotel";
    const { restaurantKOTs, refreshRestaurantKOTs, deleteKOT, convertKOTToInvoice, hotels } = usePMS();
    const kots = restaurantKOTs;
    const GOLD = "#C6A75E";
    const DARKGOLD = "#A8832D";

    const fetchKOTs = async () => {
        try {
            setLoading(true);
            // If user has multi-hotel access, use 'all' for x-hotel-id to see everything
            const isBossMode = user?.role === 'admin' || user?.role === 'super_admin' || hotels.some(h => h.posBossMode);
            const hotelId = selectedHotelFilter || (isBossMode ? 'all' : user?.hotelId);
            await refreshRestaurantKOTs(undefined, hotelId);
        } catch (err) {
            console.error("Failed to fetch KOTs:", err);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchKOTs();
    }, [statusFilter, selectedHotelFilter]);

    useEffect(() => {
        const handleKotsUpdated = () => {
            fetchKOTs();
        };

        window.addEventListener("restaurant:kots-updated", handleKotsUpdated as EventListener);
        return () => {
            window.removeEventListener("restaurant:kots-updated", handleKotsUpdated as EventListener);
        };
    }, []);

    const filteredKOTs = kots.filter((kot) => {
        const matchesSearch =
            kot.kotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (kot.order?.stewardName || kot.order?.guestName || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || String(kot.status || "").toUpperCase() === statusFilter.toUpperCase();
        const matchesDate = !dateFilter || format(new Date(kot.printedAt), 'yyyy-MM-dd') === dateFilter;
        // Added: Hotel column and hotel filter for KOTs page
        const matchesHotel = !selectedHotelFilter || kot.hotelId === selectedHotelFilter || kot.order?.hotelId === selectedHotelFilter;
        return matchesSearch && matchesStatus && matchesDate && matchesHotel;
    });

    const getStatusStyle = (status: string) => {
        switch (status.toUpperCase()) {
            case "CONVERTED":
                return { bg: "#ECFDF5", text: "#059669", icon: <CheckCircle className="w-3 h-3" /> };
            case "CANCELLED":
                return { bg: "#FEF2F2", text: "#DC2626", icon: <XCircle className="w-3 h-3" /> };
            case "OPEN":
                return { bg: "#FFF7ED", text: "#C6A75E", icon: <Clock className="w-3 h-3" /> };
            default:
                return { bg: "#F3F4F6", text: "#6B7280", icon: <Clock className="w-3 h-3" /> };
        }
    };

    const handleConvert = async (kotId: string, hotelId: string) => {
        if (!confirm("Are you sure you want to convert this KOT to a Bill?")) return;
        
        try {
            await convertKOTToInvoice(kotId, hotelId);
            // await refreshRestaurantKOTs(); // Redundant refresh
            window.dispatchEvent(new CustomEvent("restaurant:kots-updated"));
        } catch (error: any) {
            if (error.response?.status === 409) {
                alert('This KOT has already been converted to a bill.');
            } else {
                alert('Failed to convert KOT: ' + error.message);
            }
        }
    };

    const handleDelete = async (kot: any) => {
        if (!confirm("Are you sure you want to delete/cancel this KOT?")) return;
        try {
            await deleteKOT(kot.id, kot.hotelId);
            await refreshRestaurantKOTs();
            window.dispatchEvent(new CustomEvent("restaurant:kots-updated"));
        } catch (err) {
            console.error(err);
            alert("Failed to delete KOT");
        }
    };

    const handlePrintClick = (kot: any) => {
        setKotToPreview(kot);
        setShowPreviewModal(true);
    };

    const printThermalKOT = (kot: any) => {
        const tableNumber = kot.order?.tableNumber || "N/A";
        const roomNumber = kot.order?.room?.roomNumber || "-";
        const orderType = kot.order?.room?.roomNumber ? "Room Service" : "Dine-in";
        const printedAt = kot.printedAt || kot.createdAt;

        const getKotHtml = () => `
        <html>
          <head>
            <title>KOT - ${kot.kotNumber}</title>
            <style>
                            @page { size: auto; margin: 6mm; }
              body { 
                font-family: 'Courier New', Courier, monospace; 
                                width: 100%;
                                max-width: 80mm;
                                padding: 0;
                                margin: 0 auto;
                                font-size: 13px;
                                line-height: 1.35;
                                color: #111;
              }
                            .kot-wrap {
                                border: 1px dashed #444;
                                border-radius: 6px;
                                padding: 8px;
                                box-sizing: border-box;
                            }
                            .center { text-align: center; }
                            .title { font-size: 18px; font-weight: 800; letter-spacing: 0.04em; margin-bottom: 6px; }
                            .hr { border-bottom: 1px dashed #000; margin: 6px 0; }
                            .meta-row { display: flex; justify-content: space-between; gap: 8px; margin: 3px 0; }
                            .meta-row strong { font-size: 14px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 6px; }
                            th { text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.03em; }
                            th, td { padding: 7px 2px; border-bottom: 1px dashed #ddd; }
                            td.item { font-size: 14px; font-weight: 700; }
                            td.qty { text-align: right; font-size: 20px; font-weight: 900; }
                            @media print {
                                .kot-wrap { border: none; border-radius: 0; }
                            }
            </style>
          </head>
          <body>
                        <div class="kot-wrap">
                            <div class="center title">KITCHEN ORDER TICKET</div>
                            <div class="hr"></div>
                            <div class="meta-row"><span>KOT Number</span><strong>${kot.kotNumber}</strong></div>
                            <div class="meta-row"><span>Date & Time</span><strong>${new Date(printedAt).toLocaleString()}</strong></div>
                            <div class="meta-row"><span>Table Number</span><strong>${tableNumber}</strong></div>
                            <div class="meta-row"><span>Room Number</span><strong>${roomNumber}</strong></div>
                            <div class="meta-row"><span>Order Type</span><strong>${orderType}</strong></div>
                            <div class="hr"></div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Item Name</th>
                                        <th style="text-align: right;">Quantity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${kot.items.map((item: any) => `
                                        <tr>
                                            <td class="item">${item.itemName}</td>
                                            <td class="qty">${item.quantity}</td>
                                        </tr>
                                    `).join("")}
                                </tbody>
                            </table>
                        </div>
          </body>
        </html>
      `;

        printHtml(getKotHtml());
    };

    const isMobile = window.innerWidth < 768;

    return (
        <AppLayout title="Restaurant KOTs">
            <div className="space-y-6">
                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-sm">Total KOTs</p>
                        <h3 className="text-2xl font-bold text-gray-900">{kots.length}</h3>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-sm">Open KOTs</p>
                        <h3 className="text-2xl font-bold text-[#C6A75E]">
                            {kots.filter(k => k.status === 'OPEN').length}
                        </h3>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-sm">Converted</p>
                        <h3 className="text-2xl font-bold text-emerald-600">
                            {kots.filter(k => k.status === 'CONVERTED').length}
                        </h3>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-sm">Cancelled</p>
                        <h3 className="text-2xl font-bold text-red-600">
                            {kots.filter(k => k.status === 'CANCELLED').length}
                        </h3>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by KOT No, Steward or Guest Name..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        {/* Added: Hotel column and hotel filter for KOTs page */}
                        <div className="relative flex-1 md:flex-initial">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <select
                                className="w-full pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm appearance-none cursor-pointer"
                                value={selectedHotelFilter}
                                onChange={(e) => setSelectedHotelFilter(e.target.value)}
                            >
                                <option value="">All Hotels</option>
                                {hotels.map(hotel => (
                                    <option key={hotel.id} value={hotel.id}>
                                        {hotel.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="relative flex-1 md:flex-initial">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <select
                                className="w-full pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm appearance-none cursor-pointer"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="OPEN">Open</option>
                                <option value="CONVERTED">Converted</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>
                        <div className="relative flex-1 md:flex-initial">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="date"
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm cursor-pointer"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={fetchKOTs}
                            disabled={loading}
                            className="p-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50"
                            title="Refresh KOTs"
                        >
                            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* KOTs Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginBottom: '12px', marginTop: '8px', paddingRight: '16px' }}>
                        <button
                            onClick={() => {
                                const csvData = filteredKOTs.map(kot => ({
                                    'KOT No': kot.kotNumber,
                                    'Date': formatDateForCSV(kot.printedAt || kot.createdAt),
                                    'Table': kot.order?.tableNumber || 'N/A',
                                    'Room': kot.order?.room?.roomNumber || '-',
                                    'Steward': kot.order?.stewardName || 'Walk-in',
                                    'Guest': kot.order?.guestName || '-',
                                    'Items Count': kot.items?.length || 0,
                                    'Status': kot.status
                                }));
                                exportToCSV(csvData, 'restaurant-kots');
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                background: '#ffffff',
                                border: '1px solid #B8860B',
                                borderRadius: '8px',
                                color: '#B8860B',
                                fontSize: '13px',
                                fontWeight: '500',
                                cursor: 'pointer',
                            }}
                        >
                            📥 Export Excel
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">KOT No</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                    {/* Added: Hotel column and hotel filter for KOTs page */}
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hotel</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Table / Room</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Steward</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created By</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading && filteredKOTs.length === 0 ? (
                                    <tr>
                                        {/* Added: Hotel column and hotel filter for KOTs page (colSpan 7->8) */}
                                        <td colSpan={8} className="px-6 py-12 text-center">
                                            {/* Removed loading message */}
                                        </td>
                                    </tr>
                                ) : filteredKOTs.length === 0 ? (
                                    <tr>
                                        {/* Added: Hotel column and hotel filter for KOTs page (colSpan 7->8) */}
                                        <td colSpan={8} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="bg-gray-100 p-4 rounded-full">
                                                    <ClipboardList className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <p className="text-gray-500">No KOTs found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredKOTs.map((kot) => {
                                        const status = getStatusStyle(kot.status);
                                        const isLinked = !!kot.order?.bookingId;

                                        return (
                                            <tr key={kot.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-4 font-semibold text-gray-900">{kot.kotNumber}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col text-sm">
                                                        <span>{format(new Date(kot.printedAt), 'dd MMM yyyy')}</span>
                                                        <span className="text-gray-400 text-xs italic">{format(new Date(kot.printedAt), 'hh:mm a')}</span>
                                                    </div>
                                                </td>
                                                {/* Added: Hotel column and hotel filter for KOTs page */}
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {kot.hotel?.name || kot.hotelName || kot.order?.hotel?.name || hotels.find(h => h.id === (kot.hotelId || kot.order?.hotelId))?.name || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col text-sm">
                                                        <span className="font-medium">Table: {kot.order?.tableNumber || "N/A"}</span>
                                                        {kot.order?.room?.roomNumber && (
                                                            <span className="text-gray-500 text-xs text-nowrap">Room: {kot.order.room.roomNumber}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-gray-900">{kot.order?.stewardName || kot.order?.guestName || "Walk-in"}</span>
                                                        {isLinked && (
                                                            <span className="bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">Stay</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-[120px]" title={kot.printedBy}>{kot.printedBy || "System"}</td>
                                                <td className="px-6 py-4">
                                                    <div
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                                                        style={{ backgroundColor: status.bg, color: status.text }}
                                                    >
                                                        {status.icon}
                                                        {kot.status}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <button
                                                            onClick={() => handlePrintClick(kot)}
                                                            className="p-2 text-gray-400 hover:text-primary transition-colors hover:bg-white rounded-lg border border-transparent hover:border-gray-100"
                                                            title="Re-print KOT"
                                                        >
                                                            <Printer className="w-4 h-4" />
                                                        </button>

                                                        {kot.status === 'OPEN' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleConvert(kot.id, kot.hotelId)}
                                                                    className="px-3 py-1.5 text-white rounded text-xs font-bold transition-all shadow-sm flex items-center gap-1 hover:brightness-110" // Removed: active scale animation for instant click response
                                                                    style={{ background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})` }}
                                                                >
                                                                    <Receipt className="w-3 h-3" />
                                                                    BILL
                                                                </button>
                                                                <button
                                                                    onClick={() => navigate(`${roleBase}/restaurant/pos`, {
                                                                        state: {
                                                                            mode: 'modify',
                                                                            kotId: kot.id,
                                                                            hotelId: kot.hotelId,
                                                                            tableNumber: kot.order?.tableNumber,
                                                                            roomId: kot.order?.roomId,
                                                                            stewardId: kot.order?.stewardId,
                                                                            bookingId: kot.order?.bookingId,
                                                                            guestName: kot.order?.guestName,
                                                                            stewardName: kot.order?.stewardName,
                                                                            items: kot.items.map((i: any) => ({
                                                                                menuItemId: i.menuItemId,
                                                                                itemName: i.itemName,
                                                                                quantity: i.quantity,
                                                                                price: i.price,
                                                                                itemTotal: i.quantity * i.price
                                                                            }))
                                                                        }
                                                                    })}
                                                                    className="p-2 text-gray-400 hover:text-amber-600 transition-colors hover:bg-white rounded-lg border border-transparent hover:border-gray-100"
                                                                    title="Edit KOT"
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(kot)}
                                                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors hover:bg-white rounded-lg border border-transparent hover:border-gray-100"
                                                                    title="Cancel KOT"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                        {kot.status === 'CONVERTED' && (
                                                            <button
                                                                disabled={kot.status === 'CONVERTED'}
                                                                onClick={() => handleConvert(kot.id, kot.hotelId)}
                                                                className="px-3 py-1.5 text-gray-500 bg-gray-100 border border-gray-200 rounded text-xs font-bold cursor-not-allowed"
                                                                title="This KOT is already converted"
                                                            >
                                                                BILL
                                                            </button>
                                                        )}
                                                    </div>
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

            {/* KOT Preview Modal */}
            {showPreviewModal && kotToPreview && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in transition-all">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 border border-slate-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">KOT Preview</h2>
                                <p className="text-[10px] text-[#C6A75E] font-bold uppercase tracking-widest mt-1">Kitchen Order Token</p>
                            </div>
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className="p-2 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* KOT Content area */}
                        <div className="p-8 bg-slate-50">
                            <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-6 font-mono text-sm text-slate-700 space-y-4 max-h-[50vh] overflow-y-auto">
                                <div className="text-center border-b border-dashed border-slate-200 pb-4">
                                    <h3 className="font-bold text-lg text-slate-900">{hotels.find(h => h.id === kotToPreview.order?.hotelId)?.name || "HOTEL RESTAURANT"}</h3>
                                    <div className="text-[11px] text-slate-400 mt-1 uppercase tracking-tighter">Kitchen Order Token</div>
                                </div>

                                <div className="grid grid-cols-2 gap-y-2 text-[13px]">
                                    <div className="text-slate-400 uppercase font-bold tracking-tighter text-[10px]">KOT No</div>
                                    <div className="text-right font-bold text-slate-900">{kotToPreview.kotNumber}</div>

                                    <div className="text-slate-400 uppercase font-bold tracking-tighter text-[10px]">Date & Time</div>
                                    <div className="text-right font-medium">{new Date(kotToPreview.printedAt || kotToPreview.createdAt).toLocaleString()}</div>

                                    <div className="text-slate-400 uppercase font-bold tracking-tighter text-[10px]">Table Number</div>
                                    <div className="text-right font-bold text-slate-900">{kotToPreview.order?.tableNumber || "N/A"}</div>

                                    <div className="text-slate-400 uppercase font-bold tracking-tighter text-[10px]">Room Number</div>
                                    <div className="text-right font-bold text-slate-900">{kotToPreview.order?.room?.roomNumber || "-"}</div>

                                    <div className="text-slate-400 uppercase font-bold tracking-tighter text-[10px]">Order Type</div>
                                    <div className="text-right font-bold text-slate-900">{kotToPreview.order?.room?.roomNumber ? "Room Service" : "Dine-in"}</div>
                                </div>

                                <table className="w-full border-t border-b border-dashed border-slate-200 py-4 my-4">
                                    <thead>
                                        <tr className="text-[10px] text-slate-400 uppercase font-bold text-left">
                                            <th className="py-2">Item Name</th>
                                            <th className="py-2 text-right">Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {kotToPreview.items.map((item: any, idx: number) => (
                                            <tr key={idx} className="text-[13px]">
                                                <td className="py-3 font-bold text-slate-800 text-[15px] leading-tight">{item.itemName.toUpperCase()}</td>
                                                <td className="py-3 text-right font-black text-lg">{item.quantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-6 bg-white border-t border-slate-100 flex gap-4">
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className="flex-1 py-3 rounded-xl text-sm font-medium border border-slate-200 hover:bg-slate-50 transition-all text-slate-600"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => printThermalKOT(kotToPreview)}
                                className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-all flex items-center justify-center gap-2"
                                style={{ background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})` }}
                            >
                                <Printer className="w-4 h-4" />
                                Print KOT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
