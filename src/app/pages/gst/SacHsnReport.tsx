import { useState } from "react";
import { AppLayout } from "../../layouts/AppLayout";
import { GstReportLayout } from "./components/GstReportLayout";
import api from "../../services/api";
import { formatCurrency } from "../../data/mockData";

export function SacHsnReport() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);

    const fetchReport = async (filters: any) => {
        try {
            setLoading(true);
            const res = await api.get("/gst-reports/sac-hsn", { params: filters });
            setData(res.data.data);
        } catch (err) {
            console.error("Failed to fetch SAC/HSN Summary Data", err);
        } finally {
            setLoading(false);
        }
    };

    const exportToCsv = () => {
        if (data.length === 0) return;
        const headers = [
            "SAC Code",
            "Description",
            "Total Taxable Value",
            "GST Rate",
            "Total CGST",
            "Total SGST",
            "Total IGST",
        ];

        const rows = data.map((r) => [
            r.sacCode,
            `"${r.description || ""}"`,
            r.totalTaxableValue,
            `${r.gstRate}%`,
            r.totalCgst,
            r.totalSgst,
            r.totalIgst,
        ]);

        const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `sac_hsn_summary_${new Date().getTime()}.csv`;
        link.click();
    };

    return (
        <AppLayout title="SAC/HSN Summary Report">
            <GstReportLayout
                title="SAC/HSN Summary Report"
                onFilterChange={fetchReport}
                onExport={exportToCsv}
            >
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-700">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3">SAC Code</th>
                                    <th className="px-4 py-3">Description</th>
                                    <th className="px-4 py-3 text-right">Taxable Value</th>
                                    <th className="px-4 py-3 text-right">GST Rate</th>
                                    <th className="px-4 py-3 text-right">Total CGST</th>
                                    <th className="px-4 py-3 text-right">Total SGST</th>
                                    <th className="px-4 py-3 text-right">Total IGST</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center">
                                            <div className="inline-block w-6 h-6 rounded-full border-2 border-[#C6A75E] border-t-transparent animate-spin" />
                                        </td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                            No records found
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((row, i) => (
                                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-900">{row.sacCode}</td>
                                            <td className="px-4 py-3 max-w-[200px] truncate">{row.description}</td>
                                            <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(row.totalTaxableValue)}</td>
                                            <td className="px-4 py-3 text-right">{row.gstRate}%</td>
                                            <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(row.totalCgst)}</td>
                                            <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(row.totalSgst)}</td>
                                            <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(row.totalIgst)}</td>
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
