import { useState, useMemo } from "react";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import { formatCurrency, formatDate } from "../utils/format";
import { Receipt, Search, Edit2 } from "lucide-react";
import { EditInvoiceModal } from "../components/EditInvoiceModal";

const GOLD = "#475569";
const DARKGOLD = "#1e293b";

export function ModifyInvoices() {
  const { user, currentHotelId } = useAuth();
  const { invoices, hotels, bookings } = usePMS();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingInvoice, setEditingInvoice] = useState<any>(null);

  const isAdmin = user?.role === "admin";
  const hotelFilter = isAdmin ? null : (currentHotelId || user?.hotelId || null);

  const getInvoiceDisplayFields = (invoice: any) => {
    const bookingFromInvoice = invoice?.booking || invoice?.bill?.booking || null;
    const bookingId = invoice?.bill?.bookingId || invoice?.bookingId || bookingFromInvoice?.id;
    const booking = bookings.find((b: any) => String(b.id) === String(bookingId)) || bookingFromInvoice || null;

    return {
      guestName: invoice?.guestName || booking?.guestName || "—",
      roomNumber: invoice?.roomNumber || booking?.roomNumber || booking?.room?.roomNumber || "—",
      date: formatDate(invoice?.invoiceDate || invoice?.createdAt),
      amount: Number(invoice?.netPayable || invoice?.totalAmount || 0),
      status: invoice?.status || "issued",
      hotelName: hotels.find((h: any) => String(h.id) === String(invoice.hotelId))?.name || "—"
    };
  };

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => (!hotelFilter || inv.hotelId === hotelFilter) && inv.type !== "RESTAURANT")
      .filter((inv) => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;

        const display = getInvoiceDisplayFields(inv);
        return (
          inv.invoiceNumber.toLowerCase().includes(query) ||
          display.guestName.toLowerCase().includes(query) ||
          display.roomNumber.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [invoices, hotelFilter, searchQuery, hotels, bookings]);

  return (
    <AppLayout title="Modify Invoice">
      <div className="space-y-6 max-w-6xl" style={{ fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif" }}>
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice no, guest name, room..."
              className="w-full pl-10 pr-4 py-3 rounded-none border-2 border-[#E5E1DA] focus:border-slate-400 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="text-sm font-medium text-gray-500">
            Showing {filteredInvoices.length} invoices
          </div>
        </div>

        {/* List Table */}
        <div className="bg-white rounded-none border border-[#E5E1DA] overflow-hidden">
          <div className="px-6 py-4 border-b-2 border-[#E5E1DA] bg-gray-50/50 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-slate-600" />
            <h2 className="font-semibold text-gray-800" style={{ color: DARKGOLD }}>
              Select Invoice to Modify
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  {["Invoice No", "Guest Name", "Room", "Date", "Amount", "Status", "Actions"].map((head) => (
                    <th key={head} className="px-6 py-3 text-left text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                      No invoices found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const display = getInvoiceDisplayFields(inv);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-mono font-bold text-slate-700">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {display.guestName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {display.roomNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {display.date}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                          {formatCurrency(display.amount)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-none text-[10px] font-bold uppercase ${
                            display.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {display.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setEditingInvoice(inv)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-slate-700 hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> EDIT
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        {editingInvoice && (
          <EditInvoiceModal
            invoice={editingInvoice}
            onClose={() => setEditingInvoice(null)}
          />
        )}
      </div>
    </AppLayout>
  );
}
