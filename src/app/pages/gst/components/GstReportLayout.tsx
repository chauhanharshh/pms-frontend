import React, { useState, useEffect } from "react";
import { Printer, Download, Filter } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext.js";
import { usePMS } from "../../../contexts/PMSContext.js";

interface GstReportLayoutProps {
    title: string;
    onFilterChange: (filters: {
        startDate: string;
        endDate: string;
        status: string;
        hotelId?: string;
    }) => void;
    onExport: () => void;
    onPrint?: () => void;
    printId?: string;
    children: React.ReactNode;
}

export function GstReportLayout({
    title,
    onFilterChange,
    onExport,
    onPrint,
    printId = "gst-report-print",
    children,
}: GstReportLayoutProps) {
    const { user, isAdmin } = useAuth();
    const { hotels } = usePMS();

    // Default to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split("T")[0];
    const currentDay = today.toISOString().split("T")[0];

    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(currentDay);
    const [status, setStatus] = useState("All");
    const [filterHotel, setFilterHotel] = useState(isAdmin && hotels.length > 0 ? hotels[0]?.id : user?.hotelId || "");

    // Trigger initial fetch
    useEffect(() => {
        if (filterHotel) {
            onFilterChange({ startDate, endDate, status, hotelId: filterHotel });
        }
    }, [filterHotel]); // Trigger automatically when hotel changes (or initially if defined)

    const handleApply = () => {
        onFilterChange({ startDate, endDate, status, hotelId: filterHotel });
    };

    const handlePrint = () => {
        // Updated: uses printReport utility if provided
        if (onPrint) {
            onPrint();
        } else {
            window.print();
        }
    };

    return (
        <>
            <style>
                {`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #${printId}, #${printId} * {
              visibility: visible !important;
            }
            #${printId} {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              display: block !important;
            }
            .print-header {
              display: block !important;
              text-align: center;
              margin-bottom: 24px;
            }
            .sidebar, .top-navbar, .no-print, button {
              display: none !important;
            }
            @page {
              margin: 1.5cm;
              size: A4 portrait;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
            }
            th, td {
              border: 1px solid #ddd !important;
              padding: 8px !important;
              font-size: 10px !important;
            }
            th {
              background-color: #f9fafb !important;
            }
          }
          .print-header {
            display: none;
          }
        `}
            </style>
            <div className="p-6 space-y-6 print:m-0 print:p-0 print:bg-white print:text-black min-h-screen">
                {/* Header & Controls - Hidden on Print */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden pr-36">
                    <div>
                        <h1
                            className="text-2xl font-bold"
                            style={{ fontFamily: "Times New Roman, serif", color: "#C6A75E" }}
                        >
                            {title}
                        </h1>
                        <p className="text-sm text-gray-500">View and export GST reports</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {isAdmin && (
                            <select
                                className="bg-white border border-gray-200 text-gray-900 text-sm rounded-lg px-3 py-2 outline-none"
                                value={filterHotel}
                                onChange={(e) => setFilterHotel(e.target.value)}
                            >
                                {hotels.map((h: any) => (
                                    <option key={h.id} value={h.id}>
                                        {h.name}
                                    </option>
                                ))}
                            </select>
                        )}

                        <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-gray-200">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent border-none text-sm text-gray-900 focus:ring-0"
                            />
                            <span className="text-gray-500 text-sm">to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent border-none text-sm text-gray-900 focus:ring-0"
                            />
                        </div>

                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="bg-white border border-gray-200 text-gray-900 text-sm rounded-lg px-3 py-2 outline-none"
                        >
                            <option value="All">All Invoices</option>
                            <option value="Paid">Paid</option>
                            <option value="Unpaid">Unpaid</option>
                        </select>

                        <button
                            onClick={handleApply}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            style={{ backgroundColor: "#C6A75E", color: "#000" }}
                        >
                            <Filter className="w-4 h-4" />
                            Apply
                        </button>

                        <button
                            onClick={onExport}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-white border border-gray-200 hover:bg-gray-50 text-gray-700"
                        >
                            <Download className="w-4 h-4 text-[#C6A75E]" />
                            Export CSV
                        </button>

                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-white border border-gray-200 hover:bg-gray-50 text-gray-700"
                        >
                            <Printer className="w-4 h-4 text-[#C6A75E]" />
                            Print
                        </button>
                    </div>
                </div>

                {/* Report Content */}
                <div id={printId} className="print:m-0 print:p-0">
                    <div className="print-header">
                        <h2 className="text-xl font-bold uppercase">{hotels.find(h => h.id === filterHotel)?.name || "Hotel Suvidha Deluxe"}</h2>
                        <h3 className="text-lg font-semibold uppercase mt-1">{title}</h3>
                        <p className="text-sm mt-1">PERIOD: {startDate} TO {endDate}</p>
                    </div>
                    {filterHotel ? children : (
                        <div className="p-8 text-center text-gray-500 print:hidden">
                            Please select a hotel to view reports.
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
