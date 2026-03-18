import { useState, useEffect } from "react";
import { AppLayout } from "../layouts/AppLayout";
import { usePMS } from "../contexts/PMSContext";
import { handleLogoImageError, resolveBrandName, resolveLogoUrl } from "../utils/branding";
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
import { printHtml } from "../utils/print";

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
    const invoicesPath = user?.role === "admin" ? "/admin/restaurant/invoices" : "/hotel/restaurant/invoices";
    const GOLD = "var(--accent-color, #C6A75E)";
    const DARKGOLD = "var(--primary, #A8832D)";
    const RECEIPT_DASH = "- ".repeat(21).trim();

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

    useEffect(() => {
        const handleAfterPrint = () => setIsPrinting(false);
        window.addEventListener("afterprint", handleAfterPrint);
        return () => window.removeEventListener("afterprint", handleAfterPrint);
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

    const handlePreviewPrint = () => {
        setIsPrinting(true);
        if (typeof window !== "undefined" && (window as any).electronAPI?.printHtml && invoiceToPreview) {
            printHtml(buildThermalReceiptHtml(invoiceToPreview));
            setTimeout(() => setIsPrinting(false), 250);
            return;
        }
        window.print();
    };

    const getNonEmptyValue = (...values: any[]) => {
        for (const value of values) {
            if (value === 0) return "0";
            const text = String(value ?? "").trim();
            if (text) return text;
        }
        return "";
    };

    const getShortBillNumber = (invoiceNumber?: string) => {
        const full = String(invoiceNumber || "").trim();
        if (!full) return "-";
        const parts = full.split("-").filter(Boolean);
        if (parts.length === 0) return full;
        const last = parts[parts.length - 1];
        if (/^\d+$/.test(last)) return last;
        if (parts.length >= 2) {
            return `${parts[parts.length - 2]}-${parts[parts.length - 1]}`;
        }
        return full;
    };

    const formatReceiptDateTime = (value?: string) => {
        const dt = value ? new Date(value) : new Date();
        if (Number.isNaN(dt.getTime())) return "-";
        const dd = String(dt.getDate()).padStart(2, "0");
        const mm = String(dt.getMonth() + 1).padStart(2, "0");
        const yy = String(dt.getFullYear()).slice(-2);
        const hh = String(dt.getHours()).padStart(2, "0");
        const min = String(dt.getMinutes()).padStart(2, "0");
        const ss = String(dt.getSeconds()).padStart(2, "0");
        return `${dd}-${mm}-${yy} ${hh}:${min}:${ss}`;
    };

    const splitAddressLines = (address?: string) => {
        const chunks = String(address || "")
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean);

        return {
            line1: chunks[0] || "",
            line2: chunks[1] || "",
            cityState: chunks.slice(2).join(", ") || "",
        };
    };

    const formatReceiptItemLine = (itemName: string, qty: number, price: number, amount: number) => {
        const name = String(itemName || "").slice(0, 16).padEnd(16, " ");
        const qtyText = String(qty).padStart(4, " ");
        const priceText = price.toFixed(2).padStart(6, " ");
        const amountText = amount.toFixed(2).padStart(6, " ");
        return `${name} ${qtyText} ${priceText} ${amountText}`;
    };

    const formatReceiptMetaLine = (label: string, value: string) => {
        return `${label.padEnd(9, " ")} : ${value}`;
    };

    const formatReceiptTotalLine = (label: string, amount: number) => {
        const amountColEnd = 35;
        const valuePart = amount.toFixed(2).padStart(8, " ");
        const combined = `${label} : ${valuePart}`;
        return combined.padStart(amountColEnd, " ");
    };

    const renderThermalReceipt = (inv: any) => {
        const selectedHotel = hotels.find(h => h.id === inv.hotelId);
        const subtotal = Number(inv.subtotal || 0);
        const serviceCharge = subtotal * 0.10;
        const netPayable = subtotal + serviceCharge;
        const tableNo = getNonEmptyValue(
            inv.restaurantOrder?.tableNumber,
            inv.tableNumber,
            inv.order?.tableNumber,
            inv.restaurantOrder?.order?.tableNumber,
        ) || "-";
        const roomNo = inv.restaurantOrder?.room?.roomNumber || "";
        const steward = inv.restaurantOrder?.stewardName || "Staff";
        const lines = splitAddressLines(selectedHotel?.address);
        const contactNo = (selectedHotel as any)?.phone || (selectedHotel as any)?.mobile || (selectedHotel as any)?.contactNumber || "-";
        const gstNo = (selectedHotel as any)?.gstNumber || (selectedHotel as any)?.gstNo || "-";
        const items = (inv.restaurantOrder?.orderItems || []).map((item: any) => {
            const qty = Number(item.quantity || 0);
            const price = Number(item.price || 0);
            const amount = Number(item.itemTotal || qty * price);
            return {
                itemName: item.menuItem?.itemName || "Item",
                qty,
                price,
                amount,
            };
        });

        return (
            <div
                className="mx-auto bg-white text-black"
                style={{ width: "76mm", fontFamily: "'Courier New', monospace", fontSize: "11px", lineHeight: 1.35 }}
            >
                <div className="text-center font-bold text-[14px] leading-tight">{selectedHotel?.name || "HOTEL RESTAURANT"}</div>
                {lines.line1 && <div className="text-center leading-tight">{lines.line1}</div>}
                {lines.line2 && <div className="text-center leading-tight">{lines.line2}</div>}
                {lines.cityState && <div className="text-center leading-tight">{lines.cityState}</div>}
                <div className="text-center leading-tight">Contact No: {contactNo}</div>
                <div className="text-center leading-tight">GST No: {gstNo}</div>
                <div className="text-center leading-tight">{RECEIPT_DASH}</div>
                <div className="text-center font-bold leading-tight">TAX INVOICE</div>
                <div className="text-center leading-tight">{RECEIPT_DASH}</div>
                <pre className="m-0 whitespace-pre leading-tight">
{formatReceiptMetaLine("Bill Date", formatReceiptDateTime(inv.invoiceDate || inv.createdAt))}
{"\n"}{formatReceiptMetaLine("Bill No.", getShortBillNumber(inv.invoiceNumber))}
{"\n"}{formatReceiptMetaLine("Table No.", tableNo || "-")}
{"\n"}{formatReceiptMetaLine("Room No.", roomNo || "-")}
{"\n"}{formatReceiptMetaLine("Steward", steward)}
                </pre>
                <div className="text-center leading-tight">{RECEIPT_DASH}</div>
                <pre className="m-0 whitespace-pre leading-tight">Item             Qty  Price Amount</pre>
                <div className="text-center leading-tight">{RECEIPT_DASH}</div>
                <pre className="m-0 whitespace-pre leading-tight">{items.map((item: any) => formatReceiptItemLine(item.itemName, item.qty, item.price, item.amount)).join("\n")}</pre>
                <div className="text-center leading-tight">{RECEIPT_DASH}</div>
                <pre className="m-0 whitespace-pre leading-tight">
{formatReceiptTotalLine("Total Amount", subtotal)}
{"\n"}{formatReceiptTotalLine("Gross Amount", subtotal)}
{serviceCharge > 0 ? `\n${formatReceiptTotalLine("Service(10%)", serviceCharge)}` : ""}
                </pre>
                <div className="text-center leading-tight">{RECEIPT_DASH}</div>
                <div className="text-center font-bold text-[14px] leading-tight">NET AMOUNT : {netPayable.toFixed(2)}</div>
                <div className="text-center leading-tight">{RECEIPT_DASH}</div>
                <div className="leading-tight">Cashier : {steward}</div>
                <div className="text-center leading-tight">{RECEIPT_DASH}</div>
                <div className="text-center leading-tight">Thank you for your visit</div>
                <div className="text-center leading-tight">{RECEIPT_DASH}</div>
                <div className="text-center leading-tight">HSN/SAC Code: 996332</div>
            </div>
        );
    };

        const buildThermalReceiptHtml = (inv: any) => {
                const selectedHotel = hotels.find(h => h.id === inv.hotelId);
                const subtotal = Number(inv.subtotal || 0);
                const serviceCharge = subtotal * 0.10;
                const netPayable = subtotal + serviceCharge;
                const tableNo = getNonEmptyValue(
                        inv.restaurantOrder?.tableNumber,
                        inv.tableNumber,
                        inv.order?.tableNumber,
                        inv.restaurantOrder?.order?.tableNumber,
                ) || "-";
                const roomNo = inv.restaurantOrder?.room?.roomNumber || "";
                const steward = inv.restaurantOrder?.stewardName || "Staff";
                const lines = splitAddressLines(selectedHotel?.address);
                const contactNo = (selectedHotel as any)?.phone || (selectedHotel as any)?.mobile || (selectedHotel as any)?.contactNumber || "-";
                const gstNo = (selectedHotel as any)?.gstNumber || (selectedHotel as any)?.gstNo || "-";
                const items = (inv.restaurantOrder?.orderItems || []).map((item: any) => {
                        const qty = Number(item.quantity || 0);
                        const price = Number(item.price || 0);
                        const amount = Number(item.itemTotal || qty * price);
                        return formatReceiptItemLine(item.menuItem?.itemName || "Item", qty, price, amount);
                }).join("\n");

                return `
                <html>
                    <head>
                        <title>Invoice ${getShortBillNumber(inv.invoiceNumber)}</title>
                        <style>
                            @page { size: 80mm auto; margin: 2mm; }
                            body {
                                width: 76mm;
                                margin: 0;
                                color: #000;
                                background: #fff;
                                font-family: 'Courier New', monospace;
                                font-size: 11px;
                                line-height: 1.35;
                            }
                            .center { text-align: center; }
                            .bold { font-weight: bold; }
                            .big { font-size: 14px; }
                            pre { margin: 0; white-space: pre; font-family: inherit; }
                        </style>
                    </head>
                    <body>
                        <div class="center bold big" style="line-height:1.2;">${selectedHotel?.name || "HOTEL RESTAURANT"}</div>
                        ${lines.line1 ? `<div class="center" style="line-height:1.2;">${lines.line1}</div>` : ""}
                        ${lines.line2 ? `<div class="center" style="line-height:1.2;">${lines.line2}</div>` : ""}
                        ${lines.cityState ? `<div class="center" style="line-height:1.2;">${lines.cityState}</div>` : ""}
                        <div class="center" style="line-height:1.2;">Contact No: ${contactNo}</div>
                        <div class="center" style="line-height:1.2;">GST No: ${gstNo}</div>
                        <div class="center" style="line-height:1.2;">${RECEIPT_DASH}</div>
                        <div class="center bold" style="line-height:1.2;">TAX INVOICE</div>
                        <div class="center" style="line-height:1.2;">${RECEIPT_DASH}</div>
                        <pre style="line-height:1.2;">${formatReceiptMetaLine("Bill Date", formatReceiptDateTime(inv.invoiceDate || inv.createdAt))}
${formatReceiptMetaLine("Bill No.", getShortBillNumber(inv.invoiceNumber))}
${formatReceiptMetaLine("Table No.", tableNo || "-")}
${formatReceiptMetaLine("Room No.", roomNo || "-")}
${formatReceiptMetaLine("Steward", steward)}</pre>
                        <div class="center" style="line-height:1.2;">${RECEIPT_DASH}</div>
                        <pre style="line-height:1.2;">Item             Qty  Price Amount</pre>
                        <div class="center" style="line-height:1.2;">${RECEIPT_DASH}</div>
                        <pre>${items}</pre>
                        <div class="center" style="line-height:1.2;">${RECEIPT_DASH}</div>
                        <pre style="line-height:1.2;">${formatReceiptTotalLine("Total Amount", subtotal)}
${formatReceiptTotalLine("Gross Amount", subtotal)}
${serviceCharge > 0 ? formatReceiptTotalLine("Service(10%)", serviceCharge) : ""}</pre>
                        <div class="center" style="line-height:1.2;">${RECEIPT_DASH}</div>
                        <div class="center bold big" style="line-height:1.2;">NET AMOUNT : ${netPayable.toFixed(2)}</div>
                        <div class="center" style="line-height:1.2;">${RECEIPT_DASH}</div>
                        <div style="line-height:1.2;">Cashier : ${steward}</div>
                        <div class="center" style="line-height:1.2;">${RECEIPT_DASH}</div>
                        <div class="center" style="line-height:1.2;">Thank you for your visit</div>
                        <div class="center" style="line-height:1.2;">${RECEIPT_DASH}</div>
                        <div class="center" style="line-height:1.2;">HSN/SAC Code: 996332</div>
                    </body>
                </html>
                `;
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
                                                                onClick={() => navigate(`${invoicesPath}/${inv.id}/edit`)}
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in thermal-print-modal">
                    <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col thermal-print-shell">
                        {/* Modal Header */}
                        <div className="bg-[#C6A75E] px-6 py-4 flex items-center justify-between text-white no-thermal-print">
                            <h2 className="text-xl font-bold">Invoice Preview</h2>
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Bill Content Area */}
                        <div className="flex-1 overflow-y-auto p-6 bg-white max-h-[70vh] no-thermal-print">
                            {renderThermalReceipt(invoiceToPreview)}
                        </div>

                        <div id="invoice-print-area" className="thermal-print-area" aria-hidden>
                            {renderThermalReceipt(invoiceToPreview)}
                        </div>

                        {/* Action Buttons */}
                        <div className="p-6 bg-white border-t border-[#e2e8f0] flex gap-4 no-thermal-print">
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className="flex-1 py-3 border border-gray-200 rounded-lg font-bold text-base hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={handlePreviewPrint}
                                className="flex-1 py-3 bg-[#C6A75E] hover:bg-[#A8832D] text-white rounded-lg font-bold text-base transition-colors flex items-center justify-center gap-2"
                            >
                                <Printer className="w-5 h-5" />
                                {isPrinting ? "Printing..." : "Print"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                .thermal-print-area {
                    display: none;
                }
                @media print {
                    @page { size: 80mm auto; margin: 2mm; }
                    body * { visibility: hidden !important; }
                    #invoice-print-area, #invoice-print-area * { visibility: visible !important; }
                    #invoice-print-area {
                        position: fixed !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 80mm !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        display: block !important;
                        background: #fff !important;
                        z-index: 9999 !important;
                    }
                }
            `}</style>
        </AppLayout>
    );
}
