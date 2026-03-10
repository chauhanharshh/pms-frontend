import { useState } from "react";
import { AppLayout } from "../../layouts/AppLayout";
import { GstReportLayout } from "./components/GstReportLayout";
import api from "../../services/api";
import { formatCurrency } from "../../data/mockData";

export function MiscGstReport() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);

    const fetchReport = async (filters: any) => {
        try {
            setLoading(true);
            const res = await api.get("/gst-reports/misc", { params: filters });
            setData(res.data.data);
        } catch (err) {
            console.error("Failed to fetch Misc GST Data", err);
        } finally {
            setLoading(false);
        }
    };

    const exportToCsv = () => {
        if (data.length === 0) return;
        const headers = [
            "Invoice No",
            "Date",
            "Charge Description",
            "SAC Code",
            "Taxable Amount",
            "GST Rate",
            "CGST",
            "SGST",
            "IGST",
            "Total",
        ];

        const rows = data.map((r) => {
            const d = new Date(r.date);
            const formattedDate = `"${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}"`;
            return [
                `"${r.invoiceNo}"`,
                formattedDate,
                `"${r.chargeDescription || "Miscellaneous Charges"}"`,
                r.sacCode,
                r.taxableAmount,
                `${r.gstRate}%`,
                r.cgst,
                r.sgst,
                r.igst,
                r.total,
            ];
        });

        const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `misc_gst_${new Date().getTime()}.csv`;
        link.click();
    };

    return (
        <AppLayout title="Misc GST Report">
            <GstReportLayout
                title="Misc GST Report"
                onFilterChange={fetchReport}
                onExport={exportToCsv}
            >
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-700">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3">Invoice No</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Description</th>
                                    <th className="px-4 py-3">SAC Code</th>
                                    <th className="px-4 py-3 text-right">Taxable</th>
                                    <th className="px-4 py-3 text-right">Rate</th>
                                    <th className="px-4 py-3 text-right">CGST</th>
                                    <th className="px-4 py-3 text-right">SGST</th>
                                    <th className="px-4 py-3 text-right">IGST</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={10} className="px-4 py-8 text-center">
                                            <div className="inline-block w-6 h-6 rounded-full border-2 border-[#C6A75E] border-t-transparent animate-spin" />
                                        </td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                                            No records found
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((row, i) => (
                                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-900">{row.invoiceNo}</td>
                                            <td className="px-4 py-3">{new Date(row.date).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 max-w-[150px] truncate">{row.chargeDescription}</td>
                                            <td className="px-4 py-3">{row.sacCode}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(row.taxableAmount)}</td>
                                            <td className="px-4 py-3 text-right">{row.gstRate}%</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(row.cgst)}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(row.sgst)}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(row.igst)}</td>
                                            <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(row.total)}</td>
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
