import { useState, useEffect } from "react";
import { AppLayout } from "../layouts/AppLayout";
import { usePMS } from "../contexts/PMSContext";
import {
    Search,
    Filter,
    Calendar,
    FileText,
    Printer,
    Edit,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    MoreVertical,
    ChevronRight,
    CreditCard,
    DollarSign,
    Smartphone,
    X,
    Star,
    RefreshCw,
    Send
} from "lucide-react";
import { format } from "date-fns";
import api from "../services/api";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";

export default function RestaurantInvoices() {
    const { isLoading: pmsLoading } = usePMS();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");
    const [showPayModal, setShowPayModal] = useState<any>(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [invoiceToPreview, setInvoiceToPreview] = useState<any>(null);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [isPaying, setIsPaying] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();
    const { payRestaurantInvoice, hotels } = usePMS();
    const GOLD = "var(--accent-color, #C6A75E)";
    const DARKGOLD = "var(--primary, #A8832D)";

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const res = await api.get("/restaurant/invoices");
            setInvoices(res.data.data);
        } catch (err) {
            console.error("Failed to fetch restaurant invoices:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const filteredInvoices = invoices.filter((inv) => {
        const matchesSearch =
            inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (inv.restaurantOrder?.stewardName || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
        const matchesDate = !dateFilter || inv.invoiceDate.startsWith(dateFilter);
        return matchesSearch && matchesStatus && matchesDate;
    });

    const getStatusStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case "paid":
                return { bg: "#ECFDF5", text: "#059669", icon: <CheckCircle className="w-3 h-3" /> };
            case "cancelled":
                return { bg: "#FEF2F2", text: "#DC2626", icon: <XCircle className="w-3 h-3" /> };
            case "issued":
            case "kot_printed":
                return { bg: "#FFF7ED", text: "#C6A75E", icon: <FileText className="w-3 h-3" /> };
            default:
                return { bg: "#F3F4F6", text: "#6B7280", icon: <Clock className="w-3 h-3" /> };
        }
    };

    const handlePay = async () => {
        if (!showPayModal) return;
        setIsPaying(true);
        try {
            await payRestaurantInvoice(showPayModal.id, paymentMethod);
            setShowPayModal(null);
            fetchInvoices();
        } catch (err) {
            console.error("Payment failed:", err);
        } finally {
            setIsPaying(false);
        }
    };

    const handlePrintClick = (invoice: any) => {
        setInvoiceToPreview(invoice);
        setShowPreviewModal(true);
    };

    const printThermalBill = (invoice: any) => {
        const activeHotel = hotels.find(h => h.id === invoice.hotelId);
        const w = window.open("", "_blank", "width=400,height=600");
        if (!w) return;

        const subtotal = Number(invoice.subtotal);
        const serviceCharge = Number(invoice.totalAmount) - subtotal;

        const receiptData = {
            hotelName: activeHotel?.name || "HOTEL RESTAURANT",
            address: activeHotel?.address || "Hotel Address Line 1",
            gstin: activeHotel?.gstNumber || "N/A",
            items: invoice.restaurantOrder?.orderItems?.map((i: any) => ({
                name: i.menuItem?.itemName || "Item",
                qty: i.quantity,
                rate: Number(i.price),
                amt: Number(i.itemTotal)
            })) || [],
            subtotal,
            serviceCharge,
            total: Number(invoice.totalAmount),
            billNo: invoice.invoiceNumber,
            date: format(new Date(invoice.invoiceDate), 'dd/MM/yyyy'),
            time: format(new Date(invoice.createdAt), 'hh:mm a'),
            table: invoice.restaurantOrder?.tableNumber || "POS-1",
            cashier: user?.fullName || "Admin"
        };

        const line = (left: string, right: string = "") => {
            const space = 32 - left.length - right.length;
            return `<div>${left}${"&nbsp;".repeat(Math.max(0, space))}${right}</div>`;
        };

        const separator = "<div>" + "-".repeat(32) + "</div>";

        w.document.write(`<html><head><title>Print Receipt</title>
        <style>
          @page { margin: 0; }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            font-size: 12px; 
            width: 80mm; 
            padding: 5mm; 
            margin: 0;
            background: white;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .items-row { display: flex; justify-content: space-between; }
          @media print { body { width: 80mm; } }
        </style></head><body>
          <div class="center bold">${receiptData.hotelName}</div>
          <div class="center">${receiptData.address}</div>
          <div class="center bold" style="margin: 5px 0">INVOICE</div>
          ${separator}
          ${line("DATE: " + receiptData.date, receiptData.time)}
          ${line("BILL NO: " + receiptData.billNo)}
          ${line("TABLE/ROOM: " + receiptData.table)}
          ${separator}
          ${line("ITEM", "QTY  RATE  AMT")}
          ${separator}
          ${receiptData.items.map((i: any) => `
            <div style="font-weight:bold">${i.name.toUpperCase()}</div>
            ${line("", `${i.qty.toString().padEnd(3)} ${i.rate.toString().padStart(5)} ${i.amt.toString().padStart(5)}`)}
          `).join("")}
          ${separator}
          ${line("SUBTOTAL:", receiptData.subtotal.toFixed(2))}
          ${line("SERVICE:", receiptData.serviceCharge.toFixed(2))}
          ${separator}
          <div class="bold" style="font-size:14px">${line("NET AMOUNT:", receiptData.total.toFixed(2))}</div>
          ${separator}
          <div style="margin-top:10px">CASHIER: ${receiptData.cashier}</div>
          <div class="center" style="margin-top:20px">*** THANK YOU ***</div>
          <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
        </body></html>`);
        w.document.close();
        w.focus();
    };

    return (
        <AppLayout title="Restaurant Invoices">
            <div className="space-y-6">
                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-sm">Total Invoices</p>
                        <h3 className="text-2xl font-bold text-gray-900">{invoices.length}</h3>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-sm">Amount Collected</p>
                        <h3 className="text-2xl font-bold text-emerald-600">
                            ₹{invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.totalAmount), 0).toLocaleString()}
                        </h3>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-sm">Pending Amount</p>
                        <h3 className="text-2xl font-bold text-amber-600">
                            ₹{invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((sum, i) => sum + Number(i.totalAmount), 0).toLocaleString()}
                        </h3>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-sm">Cancelled</p>
                        <h3 className="text-2xl font-bold text-red-600">{invoices.filter(i => i.status === 'cancelled').length}</h3>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by Invoice No, Steward or Guest Name..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <select
                                className="pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm appearance-none cursor-pointer"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="paid">Paid</option>
                                <option value="issued">Issued</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="date"
                                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm cursor-pointer"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={fetchInvoices}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-all font-medium text-sm"
                            title="Refresh Invoices"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Invoices Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice No</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">KOT No</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Steward</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                <p className="text-gray-500 text-sm">Loading invoices...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="bg-gray-100 p-4 rounded-full">
                                                    <FileText className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <p className="text-gray-500">No invoices found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInvoices.map((inv) => {
                                        const status = getStatusStyle(inv.status);
                                        const isLinked = !!inv.restaurantOrder?.bookingId;

                                        return (
                                            <tr
                                                key={inv.id}
                                                className="hover:bg-gray-50/50 transition-colors group"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-gray-900">{inv.invoiceNumber}</span>
                                                        <span className="text-[10px] text-gray-400 uppercase tracking-tighter">Source: {inv.source || 'POS'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-medium text-gray-600">
                                                        {inv.restaurantOrder?.kotHistory?.[0]?.kotNumber || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-gray-900">{format(new Date(inv.invoiceDate), 'dd MMM yyyy')}</span>
                                                        <span className="text-xs text-gray-400 italic">Created: {format(new Date(inv.createdAt), 'hh:mm a')}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-gray-900">{inv.restaurantOrder?.stewardName || inv.restaurantOrder?.guestName || "N/A"}</span>
                                                            {isLinked && (
                                                                <span className="bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">Linked</span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-gray-500">
                                                            Table: {inv.restaurantOrder?.tableNumber || "N/A"}
                                                            {inv.restaurantOrder?.room?.roomNumber && ` • Room: ${inv.restaurantOrder.room.roomNumber}`}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-gray-900">₹{Number(inv.totalAmount).toLocaleString()}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                                                        style={{ backgroundColor: status.bg, color: status.text }}
                                                    >
                                                        {status.icon}
                                                        {inv.status.toUpperCase()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <button
                                                            onClick={() => handlePrintClick(inv)}
                                                            className="p-2 text-gray-400 hover:text-primary transition-colors hover:bg-white rounded-lg border border-transparent hover:border-gray-100"
                                                            title="Print Invoice"
                                                        >
                                                            <Printer className="w-4 h-4" />
                                                        </button>
                                                        {inv.status === 'issued' && (
                                                            <button
                                                                onClick={() => setShowPayModal(inv)}
                                                                className="px-3 py-1.5 text-white rounded text-xs font-bold transition-all shadow-sm"
                                                                style={{ background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})` }}
                                                            >
                                                                PAY
                                                            </button>
                                                        )}
                                                        {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                                                            <button
                                                                onClick={() => navigate(`/hotel/restaurant/invoices/${inv.id}/edit`)}
                                                                className="p-2 text-gray-400 hover:text-amber-600 transition-colors hover:bg-white rounded-lg border border-transparent hover:border-gray-100"
                                                                title="Edit Invoice"
                                                            >
                                                                <Edit className="w-4 h-4" />
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

            {/* Payment Modal */}
            {showPayModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in transition-all">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 border border-gray-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Settle Invoice</h2>
                                <p className="text-xs text-gray-400 font-medium mt-0.5">{showPayModal.invoiceNumber}</p>
                            </div>
                            <button onClick={() => setShowPayModal(null)} className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm border border-transparent hover:border-gray-100">
                                <XCircle className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="flex flex-col items-center justify-center py-4 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Amount</span>
                                <span className="text-4xl font-black text-gray-900">₹{Number(showPayModal.totalAmount).toLocaleString()}</span>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Payment Method</p>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'cash', label: 'Cash', icon: <DollarSign className="w-4 h-4" /> },
                                        { id: 'upi', label: 'UPI', icon: <Smartphone className="w-4 h-4" /> },
                                        { id: 'card', label: 'Card', icon: <CreditCard className="w-4 h-4" /> }
                                    ].map(method => (
                                        <button
                                            key={method.id}
                                            onClick={() => setPaymentMethod(method.id)}
                                            className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2 ${paymentMethod === method.id ? 'border-[#C6A75E] bg-[#C6A75E]/5 text-[#C6A75E] ring-1 ring-[#C6A75E]' : 'border-gray-200 hover:border-gray-300 text-gray-500'}`}
                                        >
                                            {method.icon}
                                            <span className="text-[10px] font-bold uppercase">{method.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                disabled={isPaying}
                                onClick={handlePay}
                                className="w-full py-4 rounded-xl text-white font-black text-sm uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                                style={{ background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})` }}
                            >
                                {isPaying ? 'Processing...' : 'Complete Settlement'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {showPreviewModal && invoiceToPreview && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-[#C6A75E] px-6 py-4 flex items-center justify-between text-white">
                            <h2 className="text-xl font-bold">Invoice Preview</h2>
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Bill Content Area */}
                        <div className="flex-1 overflow-y-auto p-8 bg-white max-h-[70vh]">
                            <div className="text-center mb-6">
                                <h3 className="text-3xl font-bold text-[#1e293b] mb-2">{hotels.find(h => h.id === invoiceToPreview.hotelId)?.name || "Restaurant"}</h3>
                                <p className="text-[#64748b] text-sm">{hotels.find(h => h.id === invoiceToPreview.hotelId)?.address || ""}</p>
                            </div>

                            <div className="w-full h-px bg-[#C6A75E] mb-6"></div>

                            <div className="grid grid-cols-2 gap-y-2 mb-8 text-[#1e293b]">
                                <div className="flex"><span className="font-bold w-24">Bill No:</span> <span>{invoiceToPreview.invoiceNumber}</span></div>
                                <div className="flex"><span className="font-bold w-24">Table No:</span> <span>{invoiceToPreview.restaurantOrder?.tableNumber || "N/A"}</span></div>
                                <div className="flex"><span className="font-bold w-24">Date & Time:</span> <span>{format(new Date(invoiceToPreview.invoiceDate), 'PPpp')}</span></div>
                                <div className="flex"><span className="font-bold w-32">Steward:</span> <span>{invoiceToPreview.restaurantOrder?.stewardName || invoiceToPreview.restaurantOrder?.guestName || "Walk-in"}</span></div>
                            </div>

                            <div className="border border-[#e2e8f0] rounded-xl overflow-hidden mb-6">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#f8fafc] text-[#1e293b]">
                                            <th className="py-3 px-4 font-bold border-b border-[#e2e8f0]">Item</th>
                                            <th className="py-3 px-4 font-bold border-b border-[#e2e8f0]">Qty</th>
                                            <th className="py-3 px-4 font-bold border-b border-[#e2e8f0]">Price</th>
                                            <th className="py-3 px-4 font-bold border-b border-[#e2e8f0] text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoiceToPreview.restaurantOrder?.orderItems?.map((item: any, idx: number) => (
                                            <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"}>
                                                <td className="py-3 px-4 text-[#1e293b]">{item.menuItem?.itemName || "Item"}</td>
                                                <td className="py-3 px-4 text-[#1e293b]">{item.quantity}</td>
                                                <td className="py-3 px-4 text-[#1e293b]">₹{item.price}</td>
                                                <td className="py-3 px-4 font-bold text-[#1e293b] text-right">₹{item.itemTotal}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="space-y-3 ms-auto w-1/2 min-w-[300px] text-[#1e293b]">
                                <div className="flex justify-between items-center text-[15px]">
                                    <span>Subtotal</span>
                                    <span className="font-bold">₹{Number(invoiceToPreview.subtotal).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[15px]">
                                    <span>Service Charge (10%)</span>
                                    <span className="font-bold">₹{(Number(invoiceToPreview.subtotal) * 0.1).toFixed(2)}</span>
                                </div>
                                <div className="w-full h-px bg-[#e2e8f0] my-2"></div>
                                <div className="flex justify-between items-center text-xl font-bold text-[#C6A75E]">
                                    <span>Grand Total</span>
                                    <span>₹{Number(invoiceToPreview.totalAmount).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-6 bg-white border-t border-[#e2e8f0] flex gap-4">
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className="flex-1 py-3 border border-gray-200 rounded-lg font-bold text-base hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => printThermalBill(invoiceToPreview)}
                                className="flex-1 py-3 bg-[#C6A75E] hover:bg-[#A8832D] text-white rounded-lg font-bold text-base transition-colors flex items-center justify-center gap-2"
                            >
                                <Printer className="w-5 h-5" />
                                Print
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
