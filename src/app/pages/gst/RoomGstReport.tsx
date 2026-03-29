import { useState, useMemo } from "react";
import { AppLayout } from "../../layouts/AppLayout";
import { GstReportLayout } from "./components/GstReportLayout";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { usePMS } from "../../contexts/PMSContext";
import { exportToCSV, formatDateForCSV } from "../../utils/tableExport";
import { printReport, PrintConfig } from "../../utils/printReport";

const formatCurrency = (val: any) => Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatRawCurrency = (val: any) => Number(val || 0).toFixed(2);

// Fixed: map payment method to correct Cash/Bank/CoCr column
const getPaymentColumns = (invoice: any) => {
    const method = (
        invoice.paymentMethod ||
        invoice.modeOfPayment ||
        invoice.paymentMode ||
        invoice.bills?.[0]?.paymentMethod ||
        invoice.settlements?.[0]?.mode ||
        ""
    ).toLowerCase().trim();

    const amount = Number(
        invoice.netPayable ||
        invoice.totalAmount ||
        invoice.paidAmount ||
        0
    );

    if (
        method.includes("upi") ||
        method.includes("bank") ||
        method.includes("card") ||
        method.includes("online") ||
        method.includes("transfer") ||
        method.includes("cheque") ||
        method.includes("check") ||
        method.includes("neft") ||
        method.includes("rtgs")
    ) {
        return { cash: 0, bank: amount, coCr: 0 };
    }

    if (
        method.includes("credit") ||
        method.includes("company") ||
        method.includes("corporate") ||
        method.includes("co.cr")
    ) {
        return { cash: 0, bank: 0, coCr: amount };
    }

    // Fixed: everything else (cash, empty, null, unknown) → Cash
    return { cash: amount, bank: 0, coCr: 0 };
};

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
        return data.reduce((acc, row) => {
            const payments = getPaymentColumns(row);
            return {
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
                cash: acc.cash + payments.cash,
                bank: acc.bank + payments.bank,
                coCr: acc.coCr + payments.coCr,
            };
        }, {
            roomRentDisc: 0, roomRent: 0, cgst: 0, sgst: 0, igst: 0,
            otherCharges: 0, otherChargesGst: 0, invDiscount: 0, advance: 0,
            netPayable: 0, cash: 0, bank: 0, coCr: 0
        });
    }, [data]);

    const activeHotel = hotels.find(h => h.id === (isAdmin && hotels.length > 0 ? hotels[0]?.id : user?.hotelId));

    const exportToCsv = () => {
        if (data.length === 0) return;
        const exportData = data.map((r) => {
            const payments = getPaymentColumns(r);
            return {
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
                "Cash": formatRawCurrency(payments.cash),
                "Bank": formatRawCurrency(payments.bank),
                "Co. Cr.": formatRawCurrency(payments.coCr),
            };
        });
        exportToCSV(exportData, `invoice_revenue_report_${new Date().getTime()}`);
    };

    const handlePrint = () => {
        if (data.length === 0) return;

        const totalGST = totals.cgst + totals.sgst + totals.igst;
        const titleStyle = "background: #e8e8e8 !important; color: #000000 !important; padding: 6px; text-align: center; font-size: 10px; font-weight: bold; border: 1px solid #000; letter-spacing: 1px;";
        const thStyle = "background: #e8e8e8 !important; color: #000000 !important; padding: 4px 3px; text-align: center; font-size: 7px; font-weight: bold; border: 1px solid #000; white-space: nowrap;";
        const secHeaderStyle = "background: #e8e8e8 !important; color: #000000 !important; font-weight: bold; padding: 4px; border: 1px solid #000; text-align: left;";
        const dataStyleLeft = "background: #ffffff !important; color: #000000 !important; padding: 4px; border: 1px solid #000; text-align: left;";
        const dataStyleCenter = "background: #ffffff !important; color: #000000 !important; padding: 4px; border: 1px solid #000; text-align: center;";
        const dataStyleRight = "background: #ffffff !important; color: #000000 !important; padding: 4px; border: 1px solid #000; text-align: right;";
        const gtStyleLeft = "background: #e8e8e8 !important; color: #000000 !important; font-weight: bold; padding: 4px; border: 1px solid #000; text-align: left;";
        const gtStyleRight = "background: #e8e8e8 !important; color: #000000 !important; font-weight: bold; padding: 4px; border: 1px solid #000; text-align: right;";

        // Fixed: all grey replaced with black in print output
        const summaryHtml = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <thead>
                    <tr>
                        <th colspan="9" style="${titleStyle}">CHARGES SUMMARY</th>
                    </tr>
                    <tr>
                        <th style="${thStyle}">Charge Type</th>
                        <th style="${thStyle}">Charges</th>
                        <th style="${thStyle}">Discount</th>
                        <th style="${thStyle}">GST %</th>
                        <th style="${thStyle}">CGST</th>
                        <th style="${thStyle}">SGST</th>
                        <th style="${thStyle}">IGST</th>
                        <th style="${thStyle}">GST</th>
                        <th style="${thStyle}">Net Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="9" style="${secHeaderStyle}">Room Charges</td>
                    </tr>
                    <tr>
                        <td style="${dataStyleLeft}">Room Charges</td>
                        <td style="${dataStyleRight}">${formatRawCurrency(totals.roomRent)}</td>
                        <td style="${dataStyleRight}">${formatRawCurrency(totals.roomRentDisc)}</td>
                        <td style="${dataStyleCenter}">5.00%</td>
                        <td style="${dataStyleRight}">${formatRawCurrency(totals.cgst)}</td>
                        <td style="${dataStyleRight}">${formatRawCurrency(totals.sgst)}</td>
                        <td style="${dataStyleRight}">${formatRawCurrency(totals.igst)}</td>
                        <td style="${dataStyleRight}">${formatRawCurrency(totalGST)}</td>
                        <td style="${dataStyleRight}">${formatRawCurrency(totals.netPayable)}</td>
                    </tr>
                    <tr>
                        <td style="${gtStyleLeft}">GRAND TOTAL</td>
                        <td style="${gtStyleRight}">${formatRawCurrency(totals.roomRent)}</td>
                        <td style="${gtStyleRight}">${formatRawCurrency(totals.roomRentDisc)}</td>
                        <td style="${gtStyleRight}"></td>
                        <td style="${gtStyleRight}">${formatRawCurrency(totals.cgst)}</td>
                        <td style="${gtStyleRight}">${formatRawCurrency(totals.sgst)}</td>
                        <td style="${gtStyleRight}">${formatRawCurrency(totals.igst)}</td>
                        <td style="${gtStyleRight}">${formatRawCurrency(totalGST)}</td>
                        <td style="${gtStyleRight}">${formatRawCurrency(totals.netPayable)}</td>
                    </tr>
                </tbody>
            </table>
        `;

        const config: PrintConfig = {
            title: "Invoice Revenue Report",
            hotelName: activeHotel?.name || "Hotel Suvidha Deluxe",
            dateFrom: period.start || "N/A",
            dateTo: period.end || "N/A",
            columns: [
                'Date', 'Bill No', 'Guest', 'Room', 
                'Rm.Rent Disc', 'Room Rent', 'CGST', 'SGST', 'IGST', 
                'Other', 'Other GST', 'Inv.Disc', 'Advance', 'Net Payable', 
                'Cash', 'Bank', 'Co.Cr'
            ],
            rows: data.map(r => {
                const p = getPaymentColumns(r);
                return [
                    formatDate(r.date),
                    r.invoiceNo,
                    r.guestName,
                    r.roomNumber || "",
                    formatRawCurrency(r.roomRentDisc),
                    formatRawCurrency(r.roomRent),
                    formatRawCurrency(r.cgst),
                    formatRawCurrency(r.sgst),
                    formatRawCurrency(r.igst),
                    formatRawCurrency(r.otherCharges),
                    formatRawCurrency(r.otherChargesGst),
                    formatRawCurrency(r.invDiscount),
                    formatRawCurrency(r.advance),
                    formatRawCurrency(r.netPayable),
                    formatRawCurrency(p.cash),
                    formatRawCurrency(p.bank),
                    formatRawCurrency(p.coCr)
                ];
            }),
            totalsRow: [
                'TOTAL', '', '', '',
                formatRawCurrency(totals.roomRentDisc),
                formatRawCurrency(totals.roomRent),
                formatRawCurrency(totals.cgst),
                formatRawCurrency(totals.sgst),
                formatRawCurrency(totals.igst),
                formatRawCurrency(totals.otherCharges),
                formatRawCurrency(totals.otherChargesGst),
                formatRawCurrency(totals.invDiscount),
                formatRawCurrency(totals.advance),
                formatRawCurrency(totals.netPayable),
                formatRawCurrency(totals.cash),
                formatRawCurrency(totals.bank),
                formatRawCurrency(totals.coCr)
            ],
            summaryHtml
        };

        printReport(config);
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
                onPrint={handlePrint} // Updated: uses printReport utility for proper landscape print
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
                                        {data.map((row, i) => {
                                            const payments = getPaymentColumns(row);
                                            return (
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
                                                    <td className="px-2 py-2 text-right align-top">{formatCurrency(payments.cash)}</td>
                                                    <td className="px-2 py-2 text-right align-top">{formatCurrency(payments.bank)}</td>
                                                    <td className="px-2 py-2 text-right align-top">{formatCurrency(payments.coCr)}</td>
                                                </tr>
                                            );
                                        })}
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
