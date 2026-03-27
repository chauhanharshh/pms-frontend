import { useState } from "react";
import { AppLayout } from "../../layouts/AppLayout";
import { GstReportLayout } from "./components/GstReportLayout";
import api from "../../services/api";
import { formatCurrency as mockFormatCurrency } from "../../data/mockData";
import { exportToCSV } from "../../utils/tableExport";
import { useMemo } from "react";

const formatCurrency = (val: any) => Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function SacHsnReport() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);

    const fetchReport = async (filters: any) => {
        try {
            setLoading(true);
            const restaurantEnabled = localStorage.getItem("restaurantEnabled") === "true";
            const res = await api.get("/gst-reports/sac-hsn", { 
                params: { ...filters, restaurantEnabled } 
            });
            setData(res.data.data);
        } catch (err) {
            console.error("Failed to fetch SAC/HSN Summary Data", err);
        } finally {
            setLoading(false);
        }
    };
    
    const totals = useMemo(() => {
        return data.reduce((acc, row) => ({
            taxable: acc.taxable + Number(row.totalTaxableValue || 0),
            cgst: acc.cgst + Number(row.totalCgst || 0),
            sgst: acc.sgst + Number(row.totalSgst || 0),
            igst: acc.igst + Number(row.totalIgst || 0),
            gst: acc.gst + (Number(row.totalCgst || 0) + Number(row.totalSgst || 0) + Number(row.totalIgst || 0)),
        }), { taxable: 0, cgst: 0, sgst: 0, igst: 0, gst: 0 });
    }, [data]);

    const exportToCsv = () => {
        if (data.length === 0) return;
        const dataToExport = data.map((r) => ({
            "SAC Code": r.sacCode,
            "Description": r.description || "",
            "Total Taxable Value": r.totalTaxableValue,
            "GST Rate": `${r.gstRate}%`,
            "Total CGST": r.totalCgst,
            "Total SGST": r.totalSgst,
            "Total IGST": r.totalIgst,
            "Total GST": Number(r.totalCgst || 0) + Number(r.totalSgst || 0) + Number(r.totalIgst || 0),
        }));
        
        // Add Total Row to Export
        dataToExport.push({
            "SAC Code": "TOTAL",
            "Description": "",
            "Total Taxable Value": totals.taxable as any,
            "GST Rate": "" as any,
            "Total CGST": totals.cgst as any,
            "Total SGST": totals.sgst as any,
            "Total IGST": totals.igst as any,
            "Total GST": totals.gst as any,
        });

        exportToCSV(dataToExport, "sac_hsn_summary");
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
                                    <th className="px-4 py-3 text-right">Total GST</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center">
                                            <div className="inline-block w-6 h-6 rounded-full border-2 border-[#C6A75E] border-t-transparent animate-spin" />
                                        </td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
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
                                            <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(Number(row.totalCgst || 0) + Number(row.totalSgst || 0) + Number(row.totalIgst || 0))}</td>
                                        </tr>
                                    ))
                                )}
                                {data.length > 0 && !loading && (
                                    <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                                        <td className="px-4 py-3" colSpan={2}>TOTAL</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(totals.taxable)}</td>
                                        <td className="px-4 py-3 text-right">-</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(totals.cgst)}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(totals.sgst)}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(totals.igst)}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(totals.gst)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </GstReportLayout>
        </AppLayout>
    );
}
