import { useState } from "react";
import { AppLayout } from "../../layouts/AppLayout";
import { GstReportLayout } from "./components/GstReportLayout";
import api from "../../services/api";
import { formatCurrency } from "../../data/mockData";
import { exportToCSV, formatDateForCSV } from "../../utils/tableExport";
import { printReport, PrintConfig } from "../../utils/printReport";
import { usePMS } from "../../contexts/PMSContext";
import { useAuth } from "../../contexts/AuthContext";
import { useMemo } from "react";

export function InvoiceWiseGstReport() {
    const { hotels } = usePMS();
    const { user, isAdmin } = useAuth();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [period, setPeriod] = useState({ start: "", end: "" });

    const fetchReport = async (filters: any) => {
        setPeriod({ start: filters.startDate, end: filters.endDate });
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

    const totals = useMemo(() => {
        return data.reduce((acc, row) => ({
            taxable: acc.taxable + Number(row.taxableValue || 0),
            cgst: acc.cgst + Number(row.cgst || 0),
            sgst: acc.sgst + Number(row.sgst || 0),
            igst: acc.igst + Number(row.igst || 0),
            total: acc.total + Number(row.totalAmount || 0),
        }), { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 });
    }, [data]);

    const handlePrint = () => {
        if (data.length === 0) return;

        const activeHotelId = isAdmin && hotels.length > 0 ? hotels[0]?.id : user?.hotelId;
        const activeHotel = hotels.find(h => h.id === activeHotelId);

        const config: PrintConfig = {
            title: "Invoice-wise GST Report",
            hotelName: activeHotel?.name || "Hotel Suvidha Deluxe",
            dateFrom: period.start || "N/A",
            dateTo: period.end || "N/A",
            columns: ['Inv No', 'Date', 'Guest', 'Company', 'GSTIN', 'PoS', 'Taxable', 'Rate', 'CGST', 'SGST', 'IGST', 'Total'],
            rows: data.map(r => [
                r.invoiceNumber,
                new Date(r.invoiceDate).toLocaleDateString(),
                r.guestName || '',
                r.companyName || '',
                r.gstin || '',
                r.placeOfSupply || '',
                formatCurrency(r.taxableValue),
                `${r.gstRate}%`,
                formatCurrency(r.cgst),
                formatCurrency(r.sgst),
                formatCurrency(r.igst),
                formatCurrency(r.totalAmount)
            ]),
            totalsRow: [
                'TOTAL', '', '', '', '', '',
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

        const mappedData = data.map((r) => ({
            "Invoice Number": r.invoiceNumber,
            "Invoice Date": formatDateForCSV(r.invoiceDate),
            "Guest Name": r.guestName || "",
            "Company": r.companyName || "",
            "GSTIN": r.gstin || "",
            "Place of Supply": r.placeOfSupply || "",
            "Taxable Value": r.taxableValue,
            "GST Rate": `${r.gstRate}%`,
            "CGST": r.cgst,
            "SGST": r.sgst,
            "IGST": r.igst,
            "Total Invoice Amount": r.totalAmount,
            "Invoice Status": r.invoiceStatus,
        }));

        exportToCSV(mappedData, 'invoice-wise-gst-report');
    };

    return (
        <AppLayout title="Invoice-wise GST Report">
            <GstReportLayout
                title="Invoice-wise GST Report"
                onFilterChange={fetchReport}
                onExport={exportToCsv}
                onPrint={handlePrint} // Updated: uses printReport utility for proper landscape print
                printId="room-gst-report-print"
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
