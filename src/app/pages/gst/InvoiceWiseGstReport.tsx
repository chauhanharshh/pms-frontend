import { useState } from "react";
import { AppLayout } from "../../layouts/AppLayout";
import { GstReportLayout } from "./components/GstReportLayout";
import api from "../../services/api";
import { formatCurrency } from "../../data/mockData";

export function InvoiceWiseGstReport() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);

    const fetchReport = async (filters: any) => {
        try {
            setLoading(true);
            const res = await api.get("/gst-reports/invoice-wise", { params: filters });
            setData(res.data.data);
        } catch (err) {
            console.error("Failed to fetch Invoice-wise GST Data", err);
        } finally {
            setLoading(false);
        }
    };

    const exportToCsv = () => {
        if (data.length === 0) return;
        const headers = [
            "Invoice Number",
            "Invoice Date",
            "Guest Name",
            "Company",
            "GSTIN",
            "Place of Supply",
            "Taxable Value",
            "GST Rate",
            "CGST",
            "SGST",
            "IGST",
            "Total Invoice Amount",
            "Invoice Status",
        ];

        const rows = data.map((r) => {
            const d = new Date(r.invoiceDate);
            const formattedDate = `"${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}"`;
            return [
                `"${r.invoiceNumber}"`,
                formattedDate,
                `"${r.guestName || ""}"`,
                `"${r.companyName || ""}"`,
                `"${r.gstin || ""}"`,
                `"${r.placeOfSupply || ""}"`,
                r.taxableValue,
                `${r.gstRate}%`,
                r.cgst,
                r.sgst,
                r.igst,
                r.totalAmount,
                `"${r.invoiceStatus}"`,
            ];
        });

        const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `invoice_wise_gst_${new Date().getTime()}.csv`;
        link.click();
    };

    return (
        <AppLayout title="Invoice-wise GST Report">
            <GstReportLayout
                title="Invoice-wise GST Report"
                onFilterChange={fetchReport}
                onExport={exportToCsv}
            >
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-700">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3">Inv Number</th>
                                    <th className="px-4 py-3">Inv Date</th>
                                    <th className="px-4 py-3">Guest</th>
                                    <th className="px-4 py-3">Company</th>
                                    <th className="px-4 py-3">GSTIN</th>
                                    <th className="px-4 py-3">PoS</th>
                                    <th className="px-4 py-3 text-right">Taxable</th>
                                    <th className="px-4 py-3 text-right">Rate</th>
                                    <th className="px-4 py-3 text-right">CGST</th>
                                    <th className="px-4 py-3 text-right">SGST</th>
                                    <th className="px-4 py-3 text-right">IGST</th>
                                    <th className="px-4 py-3 text-right">Total Amnt</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={13} className="px-4 py-8 text-center">
                                            <div className="inline-block w-6 h-6 rounded-full border-2 border-[#C6A75E] border-t-transparent animate-spin" />
                                        </td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan={13} className="px-4 py-8 text-center text-gray-500">
                                            No records found
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((row, i) => (
                                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-900">{row.invoiceNumber}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{new Date(row.invoiceDate).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 max-w-[120px] truncate">{row.guestName}</td>
                                            <td className="px-4 py-3 max-w-[120px] truncate">{row.companyName || "-"}</td>
                                            <td className="px-4 py-3">{row.gstin || "-"}</td>
                                            <td className="px-4 py-3">{row.placeOfSupply || "-"}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(row.taxableValue)}</td>
                                            <td className="px-4 py-3 text-right">{row.gstRate}%</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(row.cgst)}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(row.sgst)}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(row.igst)}</td>
                                            <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(row.totalAmount)}</td>
                                            <td className="px-4 py-3 text-center capitalize">{row.invoiceStatus}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </GstReportLayout>
        </AppLayout>
    );
}
