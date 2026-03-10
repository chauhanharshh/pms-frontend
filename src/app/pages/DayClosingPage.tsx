import { useState, useEffect } from "react";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import { formatCurrency, formatDate } from "../utils/format";
import api from "../services/api";
import {
    Calendar,
    Lock,
    Unlock,
    Trash2,
    ListRestart,
    LogOut,
    AlertCircle,
    Plus,
    RefreshCw,
    Clock,
    CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const GOLD = "#C6A75E";
const DARKGOLD = "#A8832D";

interface DayClosingRecord {
    id: string;
    workingDate: string;
    cashReceived: number;
    bankReceived: number;
    cashPaid: number;
    bankPaid: number;
    creditSale: number;
    status: string;
    closedBy: string;
    closedAt: string;
    user: { fullName: string };
}

export function DayClosingPage() {
    const { user } = useAuth();
    const { hotels } = usePMS();
    const [records, setRecords] = useState<DayClosingRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showPendingModal, setShowPendingModal] = useState(false);
    const [closeDate, setCloseDate] = useState(new Date().toISOString().split("T")[0]);
    const [pendingDates, setPendingDates] = useState<string[]>([]);
    const [pendingProcesses, setPendingProcesses] = useState<any>(null);
    const [previewData, setPreviewData] = useState<any>(null);

    const isAdmin = user?.role === "admin";

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const res = await api.get("/day-closing/records");
            setRecords(res.data.data);
        } catch (error) {
            toast.error("Failed to fetch records");
        } finally {
            setLoading(false);
        }
    };

    const fetchPending = async () => {
        try {
            const datesRes = await api.get("/day-closing/pending-dates");
            setPendingDates(datesRes.data.data);
            const procRes = await api.get("/day-closing/pending-processes");
            setPendingProcesses(procRes.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchRecords();
        fetchPending();
    }, []);

    const handlePreview = async (date: string) => {
        try {
            const res = await api.get(`/day-closing/preview?date=${date}`);
            setPreviewData(res.data.data);
        } catch (error) {
            toast.error("Failed to fetch preview");
        }
    };

    const handleCloseDay = async (date?: string) => {
        try {
            const workingDate = date || closeDate;
            await api.post("/day-closing/close", { workingDate });
            toast.success(`Day ${formatDate(workingDate)} closed successfully`);
            setShowCloseModal(false);
            fetchRecords();
            fetchPending();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to close day");
        }
    };

    const handleDeleteLast = async () => {
        if (!window.confirm("Are you sure you want to delete the last closing? This will unlock the data for that day.")) return;
        try {
            await api.delete("/day-closing/last");
            toast.success("Last closing deleted successfully");
            fetchRecords();
            fetchPending();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete closing");
        }
    };

    const handleBulkClose = async () => {
        if (pendingDates.length === 0) return;
        const count = pendingDates.length;
        if (!window.confirm(`Are you sure you want to close ${count} pending dates sequentially?`)) return;

        setLoading(true);
        for (const date of pendingDates) {
            try {
                await api.post("/day-closing/close", { workingDate: date });
            } catch (error) {
                toast.error(`Failed to close ${formatDate(date)}`);
                break;
            }
        }
        setLoading(false);
        setShowBulkModal(false);
        fetchRecords();
        fetchPending();
    };

    return (
        <AppLayout title="Day Closing">
            <div className="space-y-6 max-w-7xl">
                {/* Top Action Bar */}
                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={() => setShowCloseModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-transform active:scale-95"
                        style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 2px 8px rgba(16, 185, 129, 0.2)" }}
                    >
                        <Lock className="w-4 h-4" /> Close Day
                    </button>
                    <button
                        onClick={() => { fetchPending(); setShowBulkModal(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-transform active:scale-95"
                        style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", boxShadow: "0 2px 8px rgba(59, 130, 246, 0.2)" }}
                    >
                        <RefreshCw className="w-4 h-4" /> Bulk Closing
                    </button>
                    <button
                        onClick={handleDeleteLast}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-transform active:scale-95"
                        style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 2px 8px rgba(239, 68, 68, 0.2)" }}
                    >
                        <Trash2 className="w-4 h-4" /> Delete Last Closing
                    </button>
                    <button
                        onClick={() => { fetchPending(); setShowPendingModal(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-transform active:scale-95"
                        style={{ background: "linear-gradient(135deg, #64748b, #475569)", boxShadow: "0 2px 8px rgba(100, 116, 139, 0.2)" }}
                    >
                        <Clock className="w-4 h-4" /> Pending Process
                    </button>
                    <div className="flex-1" />
                    <button
                        onClick={() => window.location.href = isAdmin ? "/admin" : "/hotel"}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-transform active:scale-95"
                        style={{ border: "2px solid #E5E1DA", color: DARKGOLD }}
                    >
                        <LogOut className="w-4 h-4" /> Exit
                    </button>
                </div>

                {/* Closing Records Table */}
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                        background: "white",
                        border: "1px solid #E5E1DA",
                        boxShadow: "0 2px 12px rgba(184,134,11,0.06)",
                    }}
                >
                    <div
                        className="px-6 py-4 flex items-center justify-between"
                        style={{ borderBottom: "2px solid #E5E1DA", background: "linear-gradient(135deg, #FFFFFF, #FFFFFF)" }}
                    >
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" style={{ color: GOLD }} />
                            <h2 className="font-semibold text-lg" style={{ fontFamily: "Times New Roman, serif", color: DARKGOLD }}>
                                Day Closing Records
                            </h2>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full" style={{ background: "#dcfce7", color: "#166534" }}>
                            <CheckCircle2 className="w-3 h-3" /> System Synchronized
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ background: "rgba(229,225,218,0.1)" }}>
                                    {[
                                        "Working Date",
                                        "Cash Rcvd",
                                        "Bank Rcvd",
                                        "Cash Paid",
                                        "Bank Paid",
                                        "Credit Sale",
                                        "Closed By",
                                        "Status",
                                    ].map((col) => (
                                        <th
                                            key={col}
                                            className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider"
                                            style={{ color: DARKGOLD, borderBottom: "1px solid #E5E1DA" }}
                                        >
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-sm" style={{ color: "#9CA3AF" }}>
                                            Loading records...
                                        </td>
                                    </tr>
                                ) : records.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-sm" style={{ color: "#9CA3AF" }}>
                                            No closing records found
                                        </td>
                                    </tr>
                                ) : (
                                    records.map((rec) => (
                                        <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-bold" style={{ color: "#1F2937" }}>
                                                {formatDate(rec.workingDate)}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold" style={{ color: "#16a34a" }}>
                                                {formatCurrency(rec.cashReceived)}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold" style={{ color: "#2563eb" }}>
                                                {formatCurrency(rec.bankReceived)}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold" style={{ color: "#dc2626" }}>
                                                {formatCurrency(rec.cashPaid)}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold" style={{ color: "#9333ea" }}>
                                                {formatCurrency(rec.bankPaid)}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold" style={{ color: "#f59e0b" }}>
                                                {formatCurrency(rec.creditSale)}
                                            </td>
                                            <td className="px-6 py-4 text-sm" style={{ color: "#6B7280" }}>
                                                {rec.user?.fullName}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
                                                    {rec.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Close Day Modal */}
                {showCloseModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
                        <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ background: "white" }}>
                            <div className="px-6 py-5 flex items-center justify-between border-b" style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white" }}>
                                <div className="flex items-center gap-2">
                                    <Lock className="w-5 h-5" />
                                    <h3 className="font-bold text-lg" style={{ fontFamily: "Times New Roman, serif" }}>Close Day</h3>
                                </div>
                                <button onClick={() => setShowCloseModal(false)} className="hover:opacity-80 transition-opacity">
                                    <Plus className="w-6 h-6 rotate-45" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2" style={{ color: DARKGOLD }}>Select Working Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 rounded-xl outline-none"
                                        style={{ border: "2px solid #E5E1DA" }}
                                        value={closeDate}
                                        onChange={(e) => { setCloseDate(e.target.value); handlePreview(e.target.value); }}
                                    />
                                </div>

                                {previewData && (
                                    <div className="p-4 rounded-xl space-y-3" style={{ background: "rgba(221, 215, 204, 0.2)", border: "1px dashed #C6A75E" }}>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">Cash Receipts:</span>
                                            <span className="font-bold text-green-600">{formatCurrency(previewData.cashReceived)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">Bank Receipts:</span>
                                            <span className="font-bold text-blue-600">{formatCurrency(previewData.bankReceived)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">Expenses:</span>
                                            <span className="font-bold text-red-600">{formatCurrency(previewData.cashPaid + previewData.bankPaid)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm border-t pt-2 mt-2">
                                            <span className="font-bold" style={{ color: DARKGOLD }}>Net Cash in Hand:</span>
                                            <span className="font-bold" style={{ color: DARKGOLD }}>{formatCurrency(previewData.cashReceived - previewData.cashPaid)}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                                        Closing the day will lock all financial records for this date. No further modifications or additions will be allowed.
                                    </p>
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 flex gap-3">
                                <button onClick={() => setShowCloseModal(false)} className="flex-1 py-3 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button
                                    onClick={() => handleCloseDay()}
                                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-lg active:scale-95 transition-transform"
                                    style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                                >
                                    Confirm Closing
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bulk Closing Modal */}
                {showBulkModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
                        <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" style={{ background: "white" }}>
                            <div className="px-6 py-5 flex items-center justify-between border-b" style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white" }}>
                                <div className="flex items-center gap-2">
                                    <RefreshCw className="w-5 h-5" />
                                    <h3 className="font-bold text-lg" style={{ fontFamily: "Times New Roman, serif" }}>Bulk Day Closing</h3>
                                </div>
                                <button onClick={() => setShowBulkModal(false)} className="hover:opacity-80 transition-opacity">
                                    <Plus className="w-6 h-6 rotate-45" />
                                </button>
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-gray-600 mb-4">The following dates are pending closing. They will be closed sequentially.</p>
                                <div className="max-h-60 overflow-y-auto space-y-2 premium-scrollbar pr-2 mb-4">
                                    {pendingDates.length === 0 ? (
                                        <div className="py-8 text-center text-sm text-gray-400">All dates up to today are closed.</div>
                                    ) : (
                                        pendingDates.map((date) => (
                                            <div key={date} className="flex items-center justify-between p-3 rounded-xl border bg-gray-50">
                                                <span className="text-sm font-bold text-gray-700">{formatDate(date)}</span>
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 uppercase">
                                                    <Clock className="w-3 h-3" /> Pending
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                                    <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                                        This process will calculate and lock each date separately. This action is not reversible in bulk.
                                    </p>
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 flex gap-3">
                                <button onClick={() => setShowBulkModal(false)} className="flex-1 py-3 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-600">Cancel</button>
                                <button
                                    disabled={pendingDates.length === 0 || loading}
                                    onClick={handleBulkClose}
                                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-lg disabled:opacity-50"
                                    style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}
                                >
                                    {loading ? "Processing..." : `Close ${pendingDates.length} Dates`}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Pending Process Modal */}
                {showPendingModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
                        <div className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden" style={{ background: "white" }}>
                            <div className="px-6 py-5 flex items-center justify-between border-b" style={{ background: "linear-gradient(135deg, #64748b, #475569)", color: "white" }}>
                                <div className="flex items-center gap-2">
                                    <ListRestart className="w-5 h-5" />
                                    <h3 className="font-bold text-lg" style={{ fontFamily: "Times New Roman, serif" }}>Pending Financial Items</h3>
                                </div>
                                <button onClick={() => setShowPendingModal(false)} className="hover:opacity-80 transition-opacity">
                                    <Plus className="w-6 h-6 rotate-45" />
                                </button>
                            </div>
                            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] premium-scrollbar">
                                {/* Pending Invoices */}
                                <div>
                                    <h4 className="text-sm font-bold mb-3 flex items-center justify-between border-b pb-1" style={{ color: DARKGOLD }}>
                                        Open Invoices (Pending Settlement)
                                        <span className="text-[10px] bg-red-100 text-red-600 px-2 rounded-full">{pendingProcesses?.openInvoices?.length || 0}</span>
                                    </h4>
                                    <div className="space-y-2">
                                        {pendingProcesses?.openInvoices?.map((inv: any) => (
                                            <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border text-sm">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-800">{inv.invoiceNumber}</span>
                                                    <span className="text-[11px] text-gray-500">{formatDate(inv.invoiceDate)}</span>
                                                </div>
                                                <span className="font-bold text-red-600">{formatCurrency(inv.totalAmount)}</span>
                                            </div>
                                        ))}
                                        {!pendingProcesses?.openInvoices?.length && <p className="text-xs text-gray-400 italic">No open invoices</p>}
                                    </div>
                                </div>

                                {/* Pending Restaurant Orders */}
                                <div>
                                    <h4 className="text-sm font-bold mb-3 flex items-center justify-between border-b pb-1" style={{ color: "#16a34a" }}>
                                        Unsettled Restaurant Bills
                                        <span className="text-[10px] bg-green-100 text-green-600 px-2 rounded-full">{pendingProcesses?.pendingOrders?.length || 0}</span>
                                    </h4>
                                    <div className="space-y-2">
                                        {pendingProcesses?.pendingOrders?.map((order: any) => (
                                            <div key={order.id} className="flex items-center justify-between p-3 rounded-xl border text-sm">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-800">{order.orderNumber} - {order.tableNumber || "Direct"}</span>
                                                    <span className="text-[11px] text-gray-500">{order.guestName || "Walk-in"}</span>
                                                </div>
                                                <span className="font-bold text-green-600">{formatCurrency(order.totalAmount)}</span>
                                            </div>
                                        ))}
                                        {!pendingProcesses?.pendingOrders?.length && <p className="text-xs text-gray-400 italic">No unsettled restaurant bills</p>}
                                    </div>
                                </div>

                                {/* Open Bills */}
                                <div>
                                    <h4 className="text-sm font-bold mb-3 flex items-center justify-between border-b pb-1" style={{ color: "#2563eb" }}>
                                        Incomplete Room Payments
                                        <span className="text-[10px] bg-blue-100 text-blue-600 px-2 rounded-full">{pendingProcesses?.pendingBills?.length || 0}</span>
                                    </h4>
                                    <div className="space-y-2">
                                        {pendingProcesses?.pendingBills?.map((bill: any) => (
                                            <div key={bill.id} className="flex items-center justify-between p-3 rounded-xl border text-sm">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-800">Booking: {bill.booking?.guestName}</span>
                                                    <span className="text-[11px] text-gray-500">Balance Due: {formatCurrency(bill.balanceDue)}</span>
                                                </div>
                                                <span className="font-bold text-blue-600">{formatCurrency(bill.totalAmount)}</span>
                                            </div>
                                        ))}
                                        {!pendingProcesses?.pendingBills?.length && <p className="text-xs text-gray-400 italic">No pending room payments</p>}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50">
                                <button onClick={() => setShowPendingModal(false)} className="w-full py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-transform active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #64748b, #475569)" }}>Close Window</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
