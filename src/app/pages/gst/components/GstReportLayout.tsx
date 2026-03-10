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
    children: React.ReactNode;
}

export function GstReportLayout({
    title,
    onFilterChange,
    onExport,
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
        window.print();
    };

    return (
        <>
            <style>
                {`
          @media print {
            @page {
              margin: 1cm;
              size: A4 portrait;
            }
            body {
              background: white !important;
              color: black !important;
            }
            .print\\:hidden, 
            nav, 
            aside, 
            header,
            [data-radix-scroll-area-viewport] > div > div:first-child {
               display: none !important;
            }
            .print\\:block {
              display: block !important;
            }
            .print\\:m-0 {
              margin: 0 !important;
            }
            .print\\:p-0 {
              padding: 0 !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-shadow: none !important;
              text-shadow: none !important;
            }
            table th {
              background: #f3f4f6 !important;
              color: #111827 !important;
              border-bottom: 2px solid #000 !important;
            }
            table td {
              border-bottom: 1px solid #e5e7eb !important;
              color: #000 !important;
            }
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
                <div className="print:m-0 print:p-0">
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
