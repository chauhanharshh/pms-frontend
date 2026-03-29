import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import api from "../services/api";
import { formatCurrency, formatDate } from "../utils/format";
import { Calendar, Search, Users, FileText, RefreshCw, Printer } from "lucide-react";
import { printReport, PrintConfig } from "../utils/printReport";

type ServiceChargeDetailedRow = {
  stewardId?: string | null;
  stewardName: string;
  orderId: string;
  orderNumber: string;
  date: string;
  tableOrRoom: string;
  serviceChargeAmount: number;
};

type ServiceChargeSummaryRow = {
  stewardId?: string | null;
  stewardName: string;
  totalServiceCharge: number;
  orderCount: number;
};

type ServiceChargeReportResponse = {
  detailed: ServiceChargeDetailedRow[];
  summary: ServiceChargeSummaryRow[];
  totals: {
    grandTotal: number;
    totalOrders: number;
    totalStewards: number;
  };
};

export function ServiceChargeReport() {
  const { user } = useAuth();
  const { hotels } = usePMS();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ServiceChargeReportResponse | null>(null);
  const [viewMode, setViewMode] = useState<"detailed" | "summary">("detailed");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [stewardName, setStewardName] = useState("");
  const [orderId, setOrderId] = useState("");

  const activeHotelName = useMemo(() => {
    if (user?.role === "admin") return "Selected Hotel Context";
    return hotels.find((h) => h.id === user?.hotelId)?.name || "Current Hotel";
  }, [hotels, user?.hotelId, user?.role]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get("/restaurant/service-charge-report", {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          stewardName: stewardName || undefined,
          orderId: orderId || undefined,
        },
      });
      setReport(res.data.data);
    } catch (error) {
      console.error("Failed to fetch service charge report", error);
      setReport({
        detailed: [],
        summary: [],
        totals: { grandTotal: 0, totalOrders: 0, totalStewards: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const detailedRows = report?.detailed || [];
  const summaryRows = report?.summary || [];

  const handlePrint = () => {
    if (!report) return;

    const activeHotel = hotels.find(h => h.id === user?.hotelId) || hotels[0];
    
    const config: PrintConfig = {
      title: `Service Charge Report (${viewMode === 'detailed' ? 'Detailed' : 'Summary'})`,
      hotelName: activeHotel?.name || "Hotel Suvidha Deluxe",
      dateFrom: startDate || "N/A",
      dateTo: endDate || "N/A",
      columns: viewMode === "detailed" 
        ? ["Steward Name", "Order ID", "Date", "Table / Room", "Service Charge"]
        : ["Steward Name", "Orders", "Total Service Charge"],
      rows: viewMode === "detailed"
        ? detailedRows.map(r => [
            r.stewardName,
            r.orderNumber,
            formatDate(r.date),
            r.tableOrRoom,
            formatCurrency(r.serviceChargeAmount)
          ])
        : summaryRows.map(r => [
            r.stewardName,
            r.orderCount.toString(),
            formatCurrency(r.totalServiceCharge)
          ]),
      totalsRow: viewMode === "detailed"
        ? ["TOTAL", "", "", "", formatCurrency(report.totals.grandTotal)]
        : ["TOTAL", report.totals.totalOrders.toString(), formatCurrency(report.totals.grandTotal)]
    };

    printReport(config);
  };

  return (
    <AppLayout title="Service Charge Report">
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Restaurant Service Charge Report</h2>
              <p className="text-sm text-gray-500">Track steward-wise service charge earnings for {activeHotelName}</p>
            </div>
            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setViewMode("detailed")}
                className={`px-4 py-2 text-sm font-semibold ${viewMode === "detailed" ? "bg-[#C6A75E] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                Detailed View
              </button>
              <button
                onClick={() => setViewMode("summary")}
                className={`px-4 py-2 text-sm font-semibold ${viewMode === "summary" ? "bg-[#C6A75E] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                Summary View
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 text-sm font-semibold bg-white text-gray-600 hover:bg-gray-50 border-l border-gray-200 flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-[#C6A75E]" />
                Print {/* Updated: uses printReport utility for proper landscape print */}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-5">
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="relative">
              <Users className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Steward name"
                value={stewardName}
                onChange={(e) => setStewardName(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Order ID / Number"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <button
              onClick={fetchReport}
              className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-white font-semibold text-sm"
              style={{ background: "linear-gradient(135deg, var(--accent-color, #C6A75E), var(--primary, #A8832D))" }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Apply Filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Grand Total</p>
            <p className="text-2xl font-bold text-[#A8832D]">{formatCurrency(report?.totals.grandTotal || 0)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{report?.totals.totalOrders || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Stewards Covered</p>
            <p className="text-2xl font-bold text-gray-900">{report?.totals.totalStewards || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {viewMode === "detailed" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Steward Name</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Order ID</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Table / Room</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Service Charge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td className="px-6 py-10 text-center text-gray-500" colSpan={5}>Loading report...</td>
                    </tr>
                  ) : detailedRows.length === 0 ? (
                    <tr>
                      <td className="px-6 py-10 text-center text-gray-500" colSpan={5}>No service charge records found</td>
                    </tr>
                  ) : (
                    detailedRows.map((row) => (
                      <tr key={`${row.orderId}-${row.date}`} className="hover:bg-gray-50/60">
                        <td className="px-6 py-3 font-medium text-gray-900">{row.stewardName}</td>
                        <td className="px-6 py-3 text-gray-700">
                          <div className="flex flex-col">
                            <span className="font-semibold">{row.orderNumber}</span>
                            <span className="text-xs text-gray-400">{row.orderId.slice(0, 8)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-gray-700">{formatDate(row.date)}</td>
                        <td className="px-6 py-3 text-gray-700">{row.tableOrRoom}</td>
                        <td className="px-6 py-3 text-right font-semibold text-[#A8832D]">{formatCurrency(row.serviceChargeAmount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Steward Name</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">Orders</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Total Service Charge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td className="px-6 py-10 text-center text-gray-500" colSpan={3}>Loading report...</td>
                    </tr>
                  ) : summaryRows.length === 0 ? (
                    <tr>
                      <td className="px-6 py-10 text-center text-gray-500" colSpan={3}>No summary records found</td>
                    </tr>
                  ) : (
                    summaryRows.map((row) => (
                      <tr key={row.stewardId || row.stewardName} className="hover:bg-gray-50/60">
                        <td className="px-6 py-3 font-medium text-gray-900">{row.stewardName}</td>
                        <td className="px-6 py-3 text-center text-gray-700">{row.orderCount}</td>
                        <td className="px-6 py-3 text-right font-semibold text-[#A8832D]">{formatCurrency(row.totalServiceCharge)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <FileText className="w-4 h-4" />
          Service charge values are tracked per restaurant order and grouped by steward for payout visibility.
        </div>
      </div>
    </AppLayout>
  );
}
