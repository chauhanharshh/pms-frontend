import { useState } from "react";
import { AppLayout } from "../../layouts/AppLayout";
import { GstReportLayout } from "./components/GstReportLayout";
import api from "../../services/api";
import { formatCurrency } from "../../data/mockData";
import { exportToCSV } from "../../utils/tableExport";

export function GstSummaryReport() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);

    const fetchReport = async (filters: any) => {
        try {
            setLoading(true);
            const res = await api.get("/gst-reports/summary", { params: filters });
            setData(res.data.data);
        } catch (err) {
            console.error("Failed to fetch GST Summary", err);
        } finally {
            setLoading(false);
        }
    };

    const exportToCsv = () => {
        if (!data?.summary) return;
        const { summary } = data;

        const exportData = [
            { Header: "GST Summary Report", Value: "" },
            { Header: "Total Room Taxable", Value: summary.totalRoomTaxable },
            { Header: "Total Restaurant Taxable", Value: summary.totalRestaurantTaxable },
            { Header: "Total Misc Taxable", Value: summary.totalMiscTaxable },
            { Header: "Total CGST", Value: summary.totalCgst },
            { Header: "Total SGST", Value: summary.totalSgst },
            { Header: "Total IGST", Value: summary.totalIgst },
            { Header: "Grand Total Tax", Value: summary.grandTotalTax },
            { Header: "Total Invoice Count", Value: summary.totalInvoiceCount },
        ];
        exportToCSV(exportData, 'gst-summary-report');
    };

    return (
        <AppLayout title="GST Summary Report">
            <GstReportLayout
                title="GST Summary Report"
                onFilterChange={fetchReport}
                onExport={exportToCsv}
                printId="gst-summary-print"
            >
                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="w-8 h-8 rounded-full border-4 border-[#C6A75E] border-t-transparent animate-spin" />
                    </div>
                ) : data ? (
                    <div className="space-y-6">
                        {/* Header Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Hotel</p>
                                <p className="font-medium text-gray-900">{data.hotelDetails?.name || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">GSTIN</p>
                                <p className="font-medium text-[#C6A75E]">{data.hotelDetails?.gstin || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Period</p>
                                <p className="font-medium text-gray-900">{data.hotelDetails?.period}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Generated</p>
                                <p className="font-medium text-gray-900">{new Date(data.hotelDetails?.generatedDate).toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Summary Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard title="Room Taxable" value={data?.summary?.totalRoomTaxable || 0} />
                            <StatCard title="Restaurant Taxable" value={data?.summary?.totalRestaurantTaxable || 0} />
                            <StatCard title="Misc Taxable" value={data?.summary?.totalMiscTaxable || 0} />

                            <div className="row-span-2 bg-[#C6A75E]/10 border border-[#C6A75E]/20 p-5 rounded-xl flex flex-col justify-center items-center text-center">
                                <p className="text-sm text-[#C6A75E] font-medium mb-2 uppercase tracking-widest">Total GST Liability</p>
                                <p className="text-3xl font-bold text-[#C6A75E]">{formatCurrency(data?.summary?.grandTotalTax || 0)}</p>
                                <p className="text-sm mt-3 text-gray-500">{data?.summary?.totalInvoiceCount || 0} Invoices</p>
                            </div>

                            <StatCard title="Total CGST" value={data?.summary?.totalCgst || 0} />
                            <StatCard title="Total SGST" value={data?.summary?.totalSgst || 0} />
                            <StatCard title="Total IGST" value={data?.summary?.totalIgst || 0} />
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500">No data available</div>
                )}
            </GstReportLayout>
        </AppLayout>
    );
}

function StatCard({ title, value }: { title: string; value: number | string }) {
    return (
        <div className="bg-white border border-gray-200 shadow-sm p-5 rounded-xl">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{title}</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(Number(value || 0))}</p>
        </div>
    );
}
