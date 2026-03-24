import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { toast } from "sonner";
import { Download, Lock, Printer, Search } from "lucide-react";
import { formatDateForCSV, exportToCSV } from "../utils/tableExport";

type RestaurantDayClosingSummary = {
  date: string;
  totalKotsToday: number;
  openKots: number;
  convertedKots: number;
  cancelledKots: number;
  totalOrdersAmount: number;
  serviceChargeAmount: number;
  totalRevenueToday: number;
  totalInvoicesToday: number;
  dayClosed: boolean;
  closedAt: string | null;
  closedBy: string | null;
};

type DayClosingResponse = RestaurantDayClosingSummary | RestaurantDayClosingSummary[];

const toDisplayDate = (date: Date) => {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const toInputDate = (date: Date) => {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
};

const parseDisplayDate = (value: string) => {
  const [dd, mm, yyyy] = value.split("-").map(Number);
  if (!dd || !mm || !yyyy) return null;
  return new Date(yyyy, mm - 1, dd);
};

const toCurrency = (amount: number) => `\u20b9${Number(amount || 0).toFixed(2)}`;
const toInt = (value: number) => String(Number(value || 0));

const normalizeSummary = (row: RestaurantDayClosingSummary): RestaurantDayClosingSummary => ({
  ...row,
  totalKotsToday: Number(row.totalKotsToday || 0),
  openKots: Number(row.openKots || 0),
  convertedKots: Number(row.convertedKots || 0),
  cancelledKots: Number(row.cancelledKots || 0),
  totalOrdersAmount: Number(row.totalOrdersAmount || 0),
  serviceChargeAmount: Number(row.serviceChargeAmount || 0),
  totalRevenueToday: Number(row.totalRevenueToday || 0),
  totalInvoicesToday: Number(row.totalInvoicesToday || 0),
  dayClosed: Boolean(row.dayClosed),
  closedAt: row.closedAt || null,
  closedBy: row.closedBy || null,
});

const sortByDateDesc = (rows: RestaurantDayClosingSummary[]) => {
  return [...rows].sort((a, b) => {
    const aDate = parseDisplayDate(a.date)?.getTime() || 0;
    const bDate = parseDisplayDate(b.date)?.getTime() || 0;
    return bDate - aDate;
  });
};

const toCsvCell = (val: any) => {
  if (val === null || val === undefined) return '""';
  
  if (val instanceof Date) {
    return `"${val.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')}"`;
  }

  if (typeof val === 'object') {
    try {
      const resolved = val.name || val.fullName || val.title || JSON.stringify(val);
      return `"${String(resolved).replace(/"/g, '""')}"`;
    } catch {
      return '"[Object]"';
    }
  }

  return `"${String(val).replace(/"/g, '""')}"`;
};

export function RestaurantDayClosingPage() {
  const { user, currentHotelId } = useAuth();
  const today = useMemo(() => new Date(), []);
  const todayDisplay = useMemo(() => toDisplayDate(today), [today]);

  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [records, setRecords] = useState<RestaurantDayClosingSummary[]>([]);
  const [todaySummary, setTodaySummary] = useState<RestaurantDayClosingSummary>({
    date: todayDisplay,
    totalKotsToday: 0,
    openKots: 0,
    convertedKots: 0,
    cancelledKots: 0,
    totalOrdersAmount: 0,
    serviceChargeAmount: 0,
    totalRevenueToday: 0,
    totalInvoicesToday: 0,
    dayClosed: false,
    closedAt: null,
    closedBy: null,
  });

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const fetchDayClosingRecords = async () => {
    try {
      setLoading(true);

      const [historyResponse, todayResponse] = await Promise.all([
        api.get("/restaurant/day-closing", {
          params: {
            ...(currentHotelId ? { hotelId: currentHotelId } : {}),
          },
        }),
        api.get("/restaurant/day-closing", {
          params: {
            date: todayDisplay,
            ...(currentHotelId ? { hotelId: currentHotelId } : {}),
          },
        }),
      ]);

      const historyData = historyResponse.data?.data as DayClosingResponse;
      const todayData = todayResponse.data?.data as RestaurantDayClosingSummary | undefined;

      const nextRecords = Array.isArray(historyData)
        ? sortByDateDesc(historyData.map(normalizeSummary))
        : historyData
          ? [normalizeSummary(historyData)]
          : [];

      setRecords(nextRecords);
      if (todayData) {
        setTodaySummary(normalizeSummary(todayData));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load restaurant day closing records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDayClosingRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayDisplay, currentHotelId]);

  const handleCloseDay = async () => {
    try {
      setClosing(true);
      const response = await api.post("/restaurant/day-closing", {
        date: todayDisplay,
        ...(currentHotelId ? { hotelId: currentHotelId } : {}),
      });

      const data = response.data?.data as RestaurantDayClosingSummary;
      if (data) {
        setTodaySummary(normalizeSummary(data));
      }

      toast.success(`Restaurant Day Closed Successfully for ${todayDisplay}`);
      setShowConfirm(false);
      await fetchDayClosingRecords();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to close restaurant day");
    } finally {
      setClosing(false);
    }
  };

  const allRows = useMemo(() => {
    const hasTodayInRecords = records.some((row) => row.date === todayDisplay);
    const baseRows = sortByDateDesc(records);

    if (!hasTodayInRecords && !todaySummary.dayClosed) {
      return [...baseRows, todaySummary];
    }

    if (hasTodayInRecords) {
      return baseRows.map((row) => (row.date === todayDisplay ? todaySummary : row));
    }

    return baseRows;
  }, [records, todaySummary, todayDisplay]);

  const filteredRows = useMemo(() => {
    if (!appliedFrom && !appliedTo) return allRows;

    const fromDate = appliedFrom ? new Date(appliedFrom) : null;
    const toDate = appliedTo ? new Date(appliedTo) : null;

    return allRows.filter((row) => {
      const rowDate = parseDisplayDate(row.date);
      if (!rowDate) return false;

      rowDate.setHours(0, 0, 0, 0);

      if (fromDate && toDate) {
        const from = new Date(fromDate);
        const to = new Date(toDate);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        return rowDate >= from && rowDate <= to;
      }

      if (fromDate) {
        const exact = new Date(fromDate);
        exact.setHours(0, 0, 0, 0);
        return rowDate.getTime() === exact.getTime();
      }

      if (toDate) {
        const exact = new Date(toDate);
        exact.setHours(0, 0, 0, 0);
        return rowDate.getTime() === exact.getTime();
      }

      return true;
    });
  }, [allRows, appliedFrom, appliedTo]);

  const todayClosed = todaySummary.dayClosed;

  const periodText = useMemo(() => {
    const visibleDates = filteredRows
      .map((row) => parseDisplayDate(row.date))
      .filter((d): d is Date => Boolean(d))
      .sort((a, b) => a.getTime() - b.getTime());

    if (appliedFrom && appliedTo) {
      return `${toDisplayDate(new Date(appliedFrom))} to ${toDisplayDate(new Date(appliedTo))}`;
    }

    if (appliedFrom) {
      const single = toDisplayDate(new Date(appliedFrom));
      return `${single} to ${single}`;
    }

    if (appliedTo) {
      const single = toDisplayDate(new Date(appliedTo));
      return `${single} to ${single}`;
    }

    if (!visibleDates.length) {
      const todayText = toDisplayDate(today);
      return `${todayText} to ${todayText}`;
    }

    return `${toDisplayDate(visibleDates[0])} to ${toDisplayDate(visibleDates[visibleDates.length - 1])}`;
  }, [filteredRows, appliedFrom, appliedTo, today]);

  const handleSearch = () => {
    if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
      toast.error("Date From cannot be after Date To");
      return;
    }

    setAppliedFrom(dateFrom);
    setAppliedTo(dateTo);
  };

  const handleReset = () => {
    setDateFrom("");
    setDateTo("");
    setAppliedFrom("");
    setAppliedTo("");
  };

  const handlePrintTable = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const dataToExport = filteredRows.map((row) => ({
      Date: formatDateForCSV(row.date),
      "Total KOTs": row.totalKotsToday,
      Open: row.openKots,
      Converted: row.convertedKots,
      Cancelled: row.cancelledKots,
      "Total Amount": row.totalOrdersAmount.toFixed(2),
      "Service Charge": row.serviceChargeAmount.toFixed(2),
      "Total Revenue": row.totalRevenueToday.toFixed(2),
      "Total Invoices": row.totalInvoicesToday,
      "Closed By": row.closedBy || "-",
      Actions: !row.dayClosed && row.date === todayDisplay ? "Close Day" : "Closed",
    }));

    exportToCSV(dataToExport, "restaurant-day-closing");
  };

  const generatedOn = toDisplayDate(new Date());

  return (
    <AppLayout title="Restaurant Day Closing">
      <style>{`
        #restaurant-day-closing-print {
          display: none;
        }

        @media print {
          body * {
            visibility: hidden;
          }

          #restaurant-day-closing-print,
          #restaurant-day-closing-print * {
            visibility: visible;
          }

          #restaurant-day-closing-print {
            display: block;
            position: absolute;
            inset: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: #fff;
            color: #000;
          }

          .no-print {
            display: none !important;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th,
          td {
            border: 1px solid #000;
            padding: 6px;
            font-size: 11px;
          }

          .print-divider {
            border-top: 1px solid #000;
            margin: 12px 0;
          }
        }
      `}</style>

      <div className="max-w-[1400px] mx-auto space-y-4 no-print">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-700 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-700 bg-white"
                />
              </div>
              <button
                onClick={handleSearch}
                className="h-10 px-4 rounded-lg bg-slate-800 text-white text-sm font-semibold inline-flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
              <button
                onClick={handleReset}
                className="h-10 px-4 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold"
              >
                Reset
              </button>
            </div>

            <div className="flex flex-wrap gap-3 justify-start xl:justify-end">
              <button
                onClick={handlePrintTable}
                disabled={loading}
                className="h-10 px-4 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold disabled:opacity-60 inline-flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={handleDownloadCsv}
                disabled={loading}
                className="h-10 px-4 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold disabled:opacity-60 inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                disabled={todayClosed || closing || loading}
                className="h-10 px-4 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {todayClosed ? "Day Already Closed" : "Close Day"}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Date</th>
                  <th className="text-right px-3 py-2 font-semibold">Total KOTs</th>
                  <th className="text-right px-3 py-2 font-semibold">Open</th>
                  <th className="text-right px-3 py-2 font-semibold">Converted</th>
                  <th className="text-right px-3 py-2 font-semibold">Cancelled</th>
                  <th className="text-right px-3 py-2 font-semibold">Total Amount</th>
                  <th className="text-right px-3 py-2 font-semibold">Service Charge</th>
                  <th className="text-right px-3 py-2 font-semibold">Total Revenue</th>
                  <th className="text-right px-3 py-2 font-semibold">Total Invoices</th>
                  <th className="text-left px-3 py-2 font-semibold">Closed By</th>
                  <th className="text-left px-3 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="px-3 py-6 text-center text-slate-500">Loading records...</td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-3 py-6 text-center text-slate-500">No records found for selected date filter.</td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const isTodayOpen = row.date === todayDisplay && !row.dayClosed;
                    return (
                      <tr key={`${row.date}-${row.closedAt || "open"}`} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-3 py-2 text-slate-800">{row.date}</td>
                        <td className="px-3 py-2 text-right text-slate-800">{toInt(row.totalKotsToday)}</td>
                        <td className="px-3 py-2 text-right text-slate-800">{toInt(row.openKots)}</td>
                        <td className="px-3 py-2 text-right text-slate-800">{toInt(row.convertedKots)}</td>
                        <td className="px-3 py-2 text-right text-slate-800">{toInt(row.cancelledKots)}</td>
                        <td className="px-3 py-2 text-right text-slate-800">{toCurrency(row.totalOrdersAmount)}</td>
                        <td className="px-3 py-2 text-right text-slate-800">{toCurrency(row.serviceChargeAmount)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-900">{toCurrency(row.totalRevenueToday)}</td>
                        <td className="px-3 py-2 text-right text-slate-800">{toInt(row.totalInvoicesToday)}</td>
                        <td className="px-3 py-2 text-slate-800">{row.closedBy || "-"}</td>
                        <td className="px-3 py-2">
                          {isTodayOpen ? (
                            <button
                              onClick={() => setShowConfirm(true)}
                              disabled={closing || loading}
                              className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-semibold disabled:opacity-60"
                            >
                              Close Day
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-700">Closed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div id="restaurant-day-closing-print">
        <h1 className="text-xl font-bold">Restaurant Day Closing Report</h1>
        <p className="mt-2">Hotel: Hotel Suvidha Deluxe</p>
        <p>Period: {periodText}</p>
        <div className="print-divider" />

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Total KOTs</th>
              <th>Open</th>
              <th>Converted</th>
              <th>Cancelled</th>
              <th>Total Amount</th>
              <th>Service Charge</th>
              <th>Total Revenue</th>
              <th>Total Invoices</th>
              <th>Closed By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              const isTodayOpen = row.date === todayDisplay && !row.dayClosed;
              return (
                <tr key={`print-${row.date}-${row.closedAt || "open"}`}>
                  <td>{row.date}</td>
                  <td>{toInt(row.totalKotsToday)}</td>
                  <td>{toInt(row.openKots)}</td>
                  <td>{toInt(row.convertedKots)}</td>
                  <td>{toInt(row.cancelledKots)}</td>
                  <td>{toCurrency(row.totalOrdersAmount)}</td>
                  <td>{toCurrency(row.serviceChargeAmount)}</td>
                  <td>{toCurrency(row.totalRevenueToday)}</td>
                  <td>{toInt(row.totalInvoicesToday)}</td>
                  <td>{row.closedBy || "-"}</td>
                  <td>{isTodayOpen ? "Close Day" : "Closed"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="print-divider" />
        <p>Generated on: {generatedOn}</p>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-5">
            <h3 className="text-lg font-bold text-slate-900">Confirm Day Closing</h3>
            <p className="text-sm text-slate-700 mt-3 whitespace-pre-line">
              {"Are you sure you want to close the restaurant for today?\n This will lock all today's orders and cannot be undone."}
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={handleCloseDay}
                disabled={closing}
                className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60"
              >
                Yes, Close Day
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={closing}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 bg-white text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
