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
    Search,
    Printer,
    Download,
} from "lucide-react";
import { toast } from "sonner";
import { useMemo } from "react";

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

const parseDisplayDate = (value: string) => {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d;
};

const toCsvCell = (value: string | number | null | undefined) => {
    const text = String(value ?? "");
    if (text.includes(",") || text.includes("\n") || text.includes('"')) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
};

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

    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [appliedFrom, setAppliedFrom] = useState("");
    const [appliedTo, setAppliedTo] = useState("");

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

    const filteredRows = useMemo(() => {
        if (!appliedFrom && !appliedTo) return records;

        const fromDate = appliedFrom ? new Date(appliedFrom) : null;
        const toDate = appliedTo ? new Date(appliedTo) : null;

        return records.filter((row) => {
            const rowDate = new Date(row.workingDate);
            rowDate.setHours(0, 0, 0, 0);

            if (fromDate && toDate) {
                const from = new Date(fromDate);
                const to = new Date(toDate);
                from.setHours(0, 0, 0, 0);
                to.setHours(23, 59, 59, 999);
                return rowDate >= from && rowDate <= to;
            }

            if (fromDate) {
                const exact = new Date(fromDate);
                exact.setHours(0, 0, 0, 0);
                return rowDate.getTime() >= exact.getTime();
            }

            if (toDate) {
                const exact = new Date(toDate);
                exact.setHours(23, 59, 59, 999);
                return rowDate.getTime() <= exact.getTime();
            }

            return true;
        });
    }, [records, appliedFrom, appliedTo]);

    const handleSearch = () => {
        if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
            toast.error("Date From cannot be after Date To");
            return;
        }
        setAppliedFrom(dateFrom);
        setAppliedTo(dateTo);
    };

    const handleReset = () => {
        setDateFrom("");
        setDateTo("");
        setAppliedFrom("");
        setAppliedTo("");
    };

    const handlePrintTable = () => {
        window.print();
    };

    const handleDownloadCsv = () => {
        const headers = [
            "Working Date",
            "Cash Received",
            "Bank Received",
            "Cash Paid",
            "Bank Paid",
            "Credit Sale",
            "Closed By",
            "Status"
        ];

        const csvContent = [
            headers.join(","),
            ...filteredRows.map((row) => [
                formatDate(row.workingDate),
                row.cashReceived,
                row.bankReceived,
                row.cashPaid,
                row.bankPaid,
                row.creditSale,
                row.user?.fullName || "-",
                row.status
            ].map(toCsvCell).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `hotel-day-closing-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const periodText = useMemo(() => {
        if (appliedFrom && appliedTo) return `${formatDate(appliedFrom)} to ${formatDate(appliedTo)}`;
        if (appliedFrom) return `From ${formatDate(appliedFrom)}`;
        if (appliedTo) return `Up to ${formatDate(appliedTo)}`;
        return "All Records";
    }, [appliedFrom, appliedTo]);

    return (
        <AppLayout title="Day Closing">
            <style>{`
                #hotel-day-closing-print {
                    display: none;
                }

                @media print {
                    body * {
                        visibility: hidden;
                    }

                    #hotel-day-closing-print,
                    #hotel-day-closing-print * {
                        visibility: visible;
                    }

                    #hotel-day-closing-print {
                        display: block;
                        position: absolute;
                        inset: 0;
                        width: 100%;
                        margin: 0;
                        padding: 20px;
                        background: #fff;
                        color: #000;
                    }

                    .no-print {
                        display: none !important;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }

                    th, td {
                        border: 1px solid #000;
                        padding: 8px;
                        text-align: left;
                        font-size: 11px;
                    }

                    .print-divider {
                        border-top: 1px solid #000;
                        margin: 15px 0;
                    }
                }
            `}</style>

            <div className="space-y-4 max-w-[1400px] mx-auto no-print">
                {/* Main Action/Filter Bar */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                        <div className="flex flex-wrap gap-3 items-end">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Date From</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-700 bg-white outline-none focus:border-slate-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Date To</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-700 bg-white outline-none focus:border-slate-400"
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                className="h-10 px-4 rounded-lg bg-slate-800 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors hover:bg-slate-700"
                            >
                                <Search className="w-4 h-4" />
                                Search
                            </button>
                            <button
                                onClick={handleReset}
                                className="h-10 px-4 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
                            >
                                Reset
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-3 justify-start xl:justify-end">
                            <button
                                onClick={handlePrintTable}
                                disabled={loading}
                                className="h-10 px-4 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold disabled:opacity-60 inline-flex items-center gap-2 hover:bg-slate-50 transition-colors"
                            >
                                <Printer className="w-4 h-4" />
                                Print
                            </button>
                            <button
                                onClick={handleDownloadCsv}
                                disabled={loading}
                                className="h-10 px-4 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold disabled:opacity-60 inline-flex items-center gap-2 hover:bg-slate-50 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Download CSV
                            </button>
                            <button
                                onClick={() => setShowCloseModal(true)}
                                className="h-10 px-4 rounded-lg bg-emerald-600 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors hover:bg-emerald-700 shadow-sm"
                            >
                                <Lock className="w-4 h-4" />
                                Close Day
                            </button>
                        </div>
                    </div>
                </div>

                {/* Secondary Action Bar */}
                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={() => { fetchPending(); setShowBulkModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5" /> Bulk Closing
                    </button>
                    <button
                        onClick={handleDeleteLast}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Last Closing
                    </button>
                    <button
                        onClick={() => { fetchPending(); setShowPendingModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors"
                    >
                        <Clock className="w-3.5 h-3.5" /> Pending Process
                    </button>
                    <div className="flex-1" />
                    <button
                        onClick={() => window.location.href = isAdmin ? "/admin" : "/hotel"}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        <LogOut className="w-3.5 h-3.5" /> Exit
                    </button>
                </div>

                {/* Closing Records Table Container */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <h2 className="font-bold text-slate-800 tracking-tight">Day Closing Records</h2>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle2 className="w-3 h-3" /> System Synchronized
                        </div>
                    </div>
                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] premium-scrollbar">
                        <table className="min-w-[1200px] w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 sticky top-0 z-10">
                                <tr>
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
                                            className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-slate-200 last:border-r-0"
                                        >
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                                            <div className="flex flex-col items-center gap-2">
                                                <RefreshCw className="w-6 h-6 animate-spin text-slate-300" />
                                                Loading records...
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                                            No closing records found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRows.map((rec) => (
                                        <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-900 border-r border-slate-100 last:border-r-0">
                                                {formatDate(rec.workingDate)}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-emerald-600 border-r border-slate-100 last:border-r-0">
                                                {formatCurrency(rec.cashReceived)}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-blue-600 border-r border-slate-100 last:border-r-0">
                                                {formatCurrency(rec.bankReceived)}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-red-500 border-r border-slate-100 last:border-r-0">
                                                {formatCurrency(rec.cashPaid)}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-purple-600 border-r border-slate-100 last:border-r-0">
                                                {formatCurrency(rec.bankPaid)}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-amber-600 border-r border-slate-100 last:border-r-0">
                                                {formatCurrency(rec.creditSale)}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 border-r border-slate-100 last:border-r-0">
                                                {rec.user?.fullName}
                                            </td>
                                            <td className="px-6 py-4 border-r border-slate-100 last:border-r-0">
                                                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 border border-emerald-200">
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
            </div>

            {/* Print Area */}
            <div id="hotel-day-closing-print">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Hotel Day Closing Report</h1>
                        <p className="text-sm mt-1">Period: {periodText}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold">Date: {formatDate(new Date().toISOString())}</p>
                    </div>
                </div>
                <div className="print-divider" />
                <table>
                    <thead>
                        <tr>
                            <th>Working Date</th>
                            <th>Cash Received</th>
                            <th>Bank Received</th>
                            <th>Cash Paid</th>
                            <th>Bank Paid</th>
                            <th>Credit Sale</th>
                            <th>Closed By</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRows.map((rec) => (
                            <tr key={rec.id}>
                                <td>{formatDate(rec.workingDate)}</td>
                                <td>{formatCurrency(rec.cashReceived)}</td>
                                <td>{formatCurrency(rec.bankReceived)}</td>
                                <td>{formatCurrency(rec.cashPaid)}</td>
                                <td>{formatCurrency(rec.bankPaid)}</td>
                                <td>{formatCurrency(rec.creditSale)}</td>
                                <td>{rec.user?.fullName}</td>
                                <td>{rec.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="print-divider" />
                <div className="mt-8 flex justify-between text-sm">
                    <p>Manager Signature</p>
                    <p>Accountant Signature</p>
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
        </AppLayout>
    );
}
