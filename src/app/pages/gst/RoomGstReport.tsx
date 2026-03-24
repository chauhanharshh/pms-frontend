import { useState, useMemo } from "react";
import { AppLayout } from "../../layouts/AppLayout";
import { GstReportLayout } from "./components/GstReportLayout";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { usePMS } from "../../contexts/PMSContext";
import { exportToCSV, formatDateForCSV } from "../../utils/tableExport";

const formatCurrency = (val: any) => Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatRawCurrency = (val: any) => Number(val || 0).toFixed(2);

export function RoomGstReport() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [period, setPeriod] = useState({ start: "", end: "" });
    const { hotels } = usePMS();
    const { isAdmin, user } = useAuth();

    const fetchReport = async (filters: any) => {
        setPeriod({ start: filters.startDate, end: filters.endDate });
        try {
            setLoading(true);
            const res = await api.get("/gst-reports/room", { params: filters });
            setData(res.data.data);
        } catch (err) {
            console.error("Failed to fetch Room GST Data", err);
        } finally {
            setLoading(false);
        }
    };

    // Calculate Summary Totals
    const totals = useMemo(() => {
        return data.reduce((acc, row) => ({
            roomRentDisc: acc.roomRentDisc + Number(row.roomRentDisc || 0),
            roomRent: acc.roomRent + Number(row.roomRent || 0),
            cgst: acc.cgst + Number(row.cgst || 0),
            sgst: acc.sgst + Number(row.sgst || 0),
            igst: acc.igst + Number(row.igst || 0),
            otherCharges: acc.otherCharges + Number(row.otherCharges || 0),
            otherChargesGst: acc.otherChargesGst + Number(row.otherChargesGst || 0),
            invDiscount: acc.invDiscount + Number(row.invDiscount || 0),
            advance: acc.advance + Number(row.advance || 0),
            netPayable: acc.netPayable + Number(row.netPayable || 0),
            cash: acc.cash + Number(row.cash || 0),
            bank: acc.bank + Number(row.bank || 0),
            coCr: acc.coCr + Number(row.coCr || 0),
        }), {
            roomRentDisc: 0, roomRent: 0, cgst: 0, sgst: 0, igst: 0,
            otherCharges: 0, otherChargesGst: 0, invDiscount: 0, advance: 0,
            netPayable: 0, cash: 0, bank: 0, coCr: 0
        });
    }, [data]);

    const activeHotel = hotels.find(h => h.id === (isAdmin && hotels.length > 0 ? hotels[0]?.id : user?.hotelId));

    const exportToCsv = () => {
        if (data.length === 0) return;
        const exportData = data.map((r) => ({
            "Invoice Date": formatDateForCSV(r.date),
            "Bill No.": r.invoiceNo,
            "Guest Name": r.guestName,
            "Room No": r.roomNumber || "",
            "Room Rent Disc.": formatRawCurrency(r.roomRentDisc),
            "Room Rent": formatRawCurrency(r.roomRent),
            "CGST": formatRawCurrency(r.cgst),
            "SGST": formatRawCurrency(r.sgst),
            "IGST": formatRawCurrency(r.igst),
            "Other Char.": formatRawCurrency(r.otherCharges),
            "Other Charges GST": formatRawCurrency(r.otherChargesGst),
            "Inv. Discount": formatRawCurrency(r.invDiscount),
            "Advance": formatRawCurrency(r.advance),
            "Net Payable": formatRawCurrency(r.netPayable),
            "Cash": formatRawCurrency(r.cash),
            "Bank": formatRawCurrency(r.bank),
            "Co. Cr.": formatRawCurrency(r.coCr),
        }));
        exportToCSV(exportData, `invoice_revenue_report_${new Date().getTime()}`);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    };

    return (
        <AppLayout title="Invoice Revenue Report">
            <GstReportLayout
                title="Invoice Revenue Report"
                onFilterChange={fetchReport}
                onExport={exportToCsv}
                printId="invoice-revenue-report-print"
            >

                <div className="bg-white print:bg-white border border-gray-200 print:border-none rounded-xl overflow-hidden print:overflow-visible shadow-sm">
                    <div className="overflow-x-auto print:overflow-visible text-black" style={{ fontFamily: "Arial, sans-serif" }}>
                        <table className="w-full text-[10px] print:text-[10px] text-left text-black print:text-black min-w-[max-content] border-collapse">
                            <thead className="bg-gray-50 print:bg-gray-200 border-y border-gray-200 print:border-black">
                                <tr>
                                    <th className="px-2 py-2 font-bold whitespace-nowrap align-top">Invoice<br />Date</th>
                                    <th className="px-2 py-2 font-bold whitespace-nowrap align-top">Bill<br />No.</th>
                                    <th className="px-2 py-2 font-bold align-top">Details</th>
                                    <th className="px-2 py-2 font-bold text-right whitespace-nowrap align-top">Room<br />Rent<br />Disc.</th>
                                    <th className="px-2 py-2 font-bold text-right whitespace-nowrap align-top">Room Rent</th>
                                    <th className="px-2 py-2 font-bold text-right align-top">CGST</th>
                                    <th className="px-2 py-2 font-bold text-right align-top">SGST</th>
                                    <th className="px-2 py-2 font-bold text-right align-top">IGST</th>
                                    <th className="px-2 py-2 font-bold text-right whitespace-nowrap align-top">Other<br />Char.</th>
                                    <th className="px-2 py-2 font-bold text-right whitespace-nowrap align-top">Other<br />Charges<br />GST</th>
                                    <th className="px-2 py-2 font-bold text-right whitespace-nowrap align-top">Inv.<br />Discount</th>
                                    <th className="px-2 py-2 font-bold text-right align-top">Advance</th>
                                    <th className="px-2 py-2 font-bold text-right whitespace-nowrap align-top">Net<br />Payable</th>
                                    <th className="px-2 py-2 font-bold text-right align-top">Cash</th>
                                    <th className="px-2 py-2 font-bold text-right align-top">Bank</th>
                                    <th className="px-2 py-2 font-bold text-right whitespace-nowrap align-top">Co.<br />Cr.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={16} className="px-4 py-8 text-center bg-white print:bg-white text-black print:text-black">
                                            <div className="inline-block w-6 h-6 rounded-full border-2 border-[#C6A75E] border-t-transparent animate-spin" />
                                        </td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan={16} className="px-4 py-8 text-center text-gray-500 print:text-black">
                                            No records found
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {data.map((row, i) => (
                                            <tr key={i} className="border-b border-gray-100 print:border-gray-300 hover:bg-gray-50 print:hover:bg-transparent">
                                                <td className="px-2 py-2 align-top">{formatDate(row.date)}<br /><span className="text-[9px] print:text-[9px] opacity-70 mt-1 block">{new Date(row.date).getFullYear()}</span></td>
                                                <td className="px-2 py-2 align-top">{row.invoiceNo}</td>
                                                <td className="px-2 py-2 align-top">
                                                    <div className="uppercase">{row.guestName}</div>
                                                    <div className="uppercase opacity-80 mt-0.5">NA</div>
                                                    <div className="mt-0.5">{row.roomNumber || ""}</div>
                                                    <div className="mt-0.5">5%</div>
                                                </td>
                                                <td className="px-2 py-2 text-right align-top">{formatCurrency(row.roomRentDisc)}</td>
                                                <td className="px-2 py-2 text-right align-top">{formatCurrency(row.roomRent)}</td>
                                                <td className="px-2 py-2 text-right align-top">{formatCurrency(row.cgst)}</td>
                                                <td className="px-2 py-2 text-right align-top">{formatCurrency(row.sgst)}</td>
                                                <td className="px-2 py-2 text-right align-top">{formatCurrency(row.igst)}</td>
                                                <td className="px-2 py-2 text-right align-top">{formatCurrency(row.otherCharges)}</td>
                                                <td className="px-2 py-2 text-right align-top">{formatCurrency(row.otherChargesGst)}</td>
                                                <td className="px-2 py-2 text-right align-top">{formatCurrency(row.invDiscount)}</td>
                                                <td className="px-2 py-2 text-right align-top">{formatCurrency(row.advance)}</td>
                                                <td className="px-2 py-2 text-right align-top font-bold">{formatCurrency(row.netPayable)}</td>
                                                <td className="px-2 py-2 text-right align-top">{formatCurrency(row.cash)}</td>
                                                <td className="px-2 py-2 text-right align-top">{formatCurrency(row.bank)}</td>
                                                <td className="px-2 py-2 text-right align-top">{formatCurrency(row.coCr)}</td>
                                            </tr>
                                        ))}
                                        {/* Grand Total Row */}
                                        <tr className="bg-gray-50 print:bg-gray-200 font-bold border-y border-gray-200 print:border-black">
                                            <td className="px-2 py-2" colSpan={3}>TOTAL</td>
                                            <td className="px-2 py-2 text-right">{formatCurrency(totals.roomRentDisc)}</td>
                                            <td className="px-2 py-2 text-right">{formatCurrency(totals.roomRent)}</td>
                                            <td className="px-2 py-2 text-right">{formatCurrency(totals.cgst)}</td>
                                            <td className="px-2 py-2 text-right">{formatCurrency(totals.sgst)}</td>
                                            <td className="px-2 py-2 text-right">{formatCurrency(totals.igst)}</td>
                                            <td className="px-2 py-2 text-right">{formatCurrency(totals.otherCharges)}</td>
                                            <td className="px-2 py-2 text-right">{formatCurrency(totals.otherChargesGst)}</td>
                                            <td className="px-2 py-2 text-right">{formatCurrency(totals.invDiscount)}</td>
                                            <td className="px-2 py-2 text-right">{formatCurrency(totals.advance)}</td>
                                            <td className="px-2 py-2 text-right">{formatCurrency(totals.netPayable)}</td>
                                            <td className="px-2 py-2 text-right">{formatCurrency(totals.cash)}</td>
                                            <td className="px-2 py-2 text-right">{formatCurrency(totals.bank)}</td>
                                            <td className="px-2 py-2 text-right">{formatCurrency(totals.coCr)}</td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>

                        {/* Charges Summary Section */}
                        {!loading && data.length > 0 && (
                            <div className="mt-8 print:break-inside-avoid">
                                <table className="w-full text-[10px] print:text-[10px] text-left text-black print:text-black border-collapse">
                                    <thead className="bg-gray-100 print:bg-gray-300 font-bold border-y border-gray-200 print:border-black">
                                        <tr>
                                            <th className="px-2 py-2" colSpan={9} style={{ textAlign: "center", textTransform: "uppercase" }}>
                                                CHARGES SUMMARY
                                            </th>
                                        </tr>
                                        <tr className="bg-gray-50 print:bg-gray-200 border-b border-gray-200 print:border-black">
                                            <th className="px-2 py-2">Charges Type</th>
                                            <th className="px-2 py-2 text-right">Charges</th>
                                            <th className="px-2 py-2 text-right">Discount</th>
                                            <th className="px-2 py-2 text-center">GST %</th>
                                            <th className="px-2 py-2 text-right">CGST</th>
                                            <th className="px-2 py-2 text-right">SGST</th>
                                            <th className="px-2 py-2 text-right">IGST</th>
                                            <th className="px-2 py-2 text-right">GST</th>
                                            <th className="px-2 py-2 text-right">Net Amount</th>
                                        </tr>
                                        <tr className="bg-transparent border-b border-gray-200 print:border-transparent">
                                            <th className="px-2 py-2 text-center" colSpan={9}>Room Charges</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-gray-100 print:border-gray-300 hover:bg-gray-50 print:hover:bg-transparent">
                                            <td className="px-2 py-2">Room Charges</td>
                                            <td className="px-2 py-2 text-right">{formatCurrency(totals.roomRent)}</td>
                                            <td className="px-2 py-2 text-right">{formatCurrency(totals.roomRentDisc)}</td>
                                            <td className="px-2 py-2 text-center">5.00</td>
                                            <td className="px-2 py-2 text-right">{formatCurrency(totals.cgst)}</td>
                                            <td className="px-2 py-2 text-right">{formatCurrency(totals.sgst)}</td>
                                            <td className="px-2 py-2 text-right">{formatCurrency(totals.igst)}</td>
                                            <td className="px-2 py-2 text-right">{formatCurrency(totals.cgst + totals.sgst + totals.igst)}</td>
                                            <td className="px-2 py-2 text-right font-medium">{formatCurrency(totals.roomRent + totals.cgst + totals.sgst + totals.igst - totals.roomRentDisc)}</td>
                                        </tr>
                                        <tr className="bg-gray-100 print:bg-gray-200 font-bold border-y border-gray-200 print:border-black">
                                            <td className="px-2 py-2">GRAND TOTAL</td>
                                            <td className="px-2 py-2 text-right">{formatCurrency(totals.roomRent)}</td>
                                            <td className="px-2 py-2 text-right">{formatCurrency(totals.roomRentDisc)}</td>
                                            <td className="px-2 py-2 text-center"></td>
                                            <td className="px-2 py-2 text-right">{formatCurrency(totals.cgst)}</td>
                                            <td className="px-2 py-2 text-right">{formatCurrency(totals.sgst)}</td>
                                            <td className="px-2 py-2 text-right">{formatCurrency(totals.igst)}</td>
                                            <td className="px-2 py-2 text-right">{formatCurrency(totals.cgst + totals.sgst + totals.igst)}</td>
                                            <td className="px-2 py-2 text-right font-bold">{formatCurrency(totals.roomRent + totals.cgst + totals.sgst + totals.igst - totals.roomRentDisc)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </GstReportLayout>
        </AppLayout>
    );
}
