import { useState } from "react";
import { AppLayout } from "../../layouts/AppLayout";
import { GstReportLayout } from "./components/GstReportLayout";
import api from "../../services/api";
import { formatCurrency } from "../../utils/format";
import { exportToCSV, formatDateForCSV } from "../../utils/tableExport";
import { printReport, PrintConfig } from "../../utils/printReport";
import { usePMS } from "../../contexts/PMSContext";
import { useAuth } from "../../contexts/AuthContext";
import { useMemo } from "react";

export function RestaurantGstReport() {
    const { hotels } = usePMS();
    const { user, isAdmin } = useAuth();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [period, setPeriod] = useState({ start: "", end: "" });

    const fetchReport = async (filters: any) => {
        setPeriod({ start: filters.startDate, end: filters.endDate });
        try {
            setLoading(true);
            const res = await api.get("/gst-reports/restaurant", { params: filters });
            setData(res.data.data);
        } catch (err) {
            console.error("Failed to fetch Restaurant GST Data", err);
        } finally {
            setLoading(false);
        }
    };

    const totals = useMemo(() => {
        return data.reduce((acc, row) => ({
            taxable: acc.taxable + Number(row.taxableAmount || 0),
            cgst: acc.cgst + Number(row.cgst || 0),
            sgst: acc.sgst + Number(row.sgst || 0),
            igst: acc.igst + Number(row.igst || 0),
            total: acc.total + Number(row.total || 0),
        }), { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 });
    }, [data]);

    const handlePrint = () => {
        if (data.length === 0) return;

        const activeHotelId = isAdmin && hotels.length > 0 ? hotels[0]?.id : user?.hotelId;
        const activeHotel = hotels.find(h => h.id === activeHotelId);

        const config: PrintConfig = {
            title: "Restaurant GST Report",
            hotelName: activeHotel?.name || "Hotel Suvidha Deluxe",
            dateFrom: period.start || "N/A",
            dateTo: period.end || "N/A",
            columns: ['Inv No', 'Date', 'Room', 'Guest', 'SAC', 'Taxable', 'Rate', 'CGST', 'SGST', 'IGST', 'Total'],
            rows: data.map(r => [
                r.invoiceNo,
                new Date(r.date).toLocaleDateString(),
                r.roomNo || '-',
                r.guestName,
                r.sacCode,
                formatCurrency(r.taxableAmount),
                `${r.gstRate}%`,
                formatCurrency(r.cgst),
                formatCurrency(r.sgst),
                formatCurrency(r.igst),
                formatCurrency(r.total)
            ]),
            totalsRow: [
                'TOTAL', '', '', '', '',
                formatCurrency(totals.taxable),
                '',
                formatCurrency(totals.cgst),
                formatCurrency(totals.sgst),
                formatCurrency(totals.igst),
                formatCurrency(totals.total)
            ]
        };

        printReport(config);
    };

    const exportToCsv = () => {
        if (data.length === 0) return;

        const csvData = data.map(row => ({
            'Invoice No': row.invoiceNo,
            'Date': formatDateForCSV(row.date),
            'Room No': row.roomNo || '-',
            'Guest Name': row.guestName || '',
            'SAC Code': row.sacCode,
            'Taxable Amount': row.taxableAmount,
            'GST Rate': `${row.gstRate}%`,
            'CGST': row.cgst,
            'SGST': row.sgst,
            'IGST': row.igst,
            'Total': row.total,
        }));
        exportToCSV(csvData, 'restaurant-gst-report');
    };

    return (
        <AppLayout title="Restaurant GST Report">
            <GstReportLayout
                title="Restaurant GST Report"
                onFilterChange={fetchReport}
                onExport={exportToCsv}
                onPrint={handlePrint} // Updated: uses printReport utility for proper landscape print
                printId="restaurant-gst-report-print"
            >
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-700">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3">Invoice No</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Room No</th>
                                    <th className="px-4 py-3">Guest Name</th>
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
                                        <td colSpan={11} className="px-4 py-8 text-center">
                                            <div className="inline-block w-6 h-6 rounded-full border-2 border-[#C6A75E] border-t-transparent animate-spin" />
                                        </td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                                            No records found
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((row, i) => (
                                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-900">{row.invoiceNo}</td>
                                            <td className="px-4 py-3">{new Date(row.date).toLocaleDateString()}</td>
                                            <td className="px-4 py-3">{row.roomNo || "-"}</td>
                                            <td className="px-4 py-3 max-w-[150px] truncate">{row.guestName}</td>
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
