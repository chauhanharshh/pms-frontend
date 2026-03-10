import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import {
  ArrowLeft,
  Search,
  LogOut,
  CreditCard,
  AlertTriangle,
  FileText,
  IndianRupee,
  CheckCircle2,
  XCircle,
  Building,
  User,
  Calendar,
  Clock
} from "lucide-react";

export function CheckOut() {
  const { currentHotelId, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [checkoutPreview, setCheckoutPreview] = useState<any | null>(null);
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi" | "">("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveBookings();
  }, [currentHotelId]);

  const fetchActiveBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/bookings?status=checked_in`);
      setBookings(res.data.data || []);
    } catch (err: any) {
      console.error("Failed to fetch bookings:", err);
      setError("Failed to load active bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateCheckout = async (booking: any) => {
    try {
      setSelectedBooking(booking);
      setCheckoutPreview(null);
      setPaymentMode("");
      setError(null);
      setIsProcessing(true); // Treat as loading for preview

      const res = await api.get(`/bookings/${booking.id}/checkout-preview`);
      setCheckoutPreview(res.data.data);
    } catch (err: any) {
      console.error("Failed to load checkout preview:", err);
      setError("Unable to load live checkout amounts. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessCheckout = async () => {
    if (!selectedBooking || !checkoutPreview) return;

    // Balance check
    const balanceDue = checkoutPreview.balanceDue;
    if (balanceDue > 0 && !paymentMode) {
      setError("Please select a valid payment mode (Cash or UPI) to clear the outstanding balance.");
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      await api.put(`/bookings/${selectedBooking.id}/check-out`, {
        finalPayment: balanceDue > 0 ? balanceDue : 0,
        paymentMode: balanceDue > 0 ? paymentMode : undefined
      });

      alert(`Check-out successful for Room ${selectedBooking.room?.roomNumber}`);
      setSelectedBooking(null);
      setCheckoutPreview(null);
      // Refresh the list
      await fetchActiveBookings();

    } catch (err: any) {
      console.error("Checkout failed:", err);
      setError(err.response?.data?.message || "Checkout failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateDays = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return 1;
    const days = Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(1, days);
  };

  const getFilteredBookings = () => {
    if (!searchQuery) return bookings;
    const query = searchQuery.toLowerCase();
    return bookings.filter(b =>
      b.guestName?.toLowerCase().includes(query) ||
      b.room?.roomNumber?.toLowerCase().includes(query)
    );
  };

  const filteredBookings = getFilteredBookings();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(isAdmin ? "/admin" : "/hotel")}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Check Out Guests</h1>
              <p className="text-sm text-gray-500">Manage departures and generate final bills</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search guest or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none w-64"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : error && !selectedBooking ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 mb-6">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow border border-gray-200 flex-1 flex flex-col overflow-hidden">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Guest & Room</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stay Details</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Billing</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        <LogOut className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-lg font-medium text-gray-900">No Check-outs Pending</p>
                        <p className="text-sm">There are currently no active checked-in rooms.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((booking) => {
                      const balanceDue = Number(booking.bill?.balanceDue || 0);
                      const hasBalance = balanceDue > 0;
                      const totalAmount = Number(booking.bill?.totalAmount || booking.totalAmount || 0);

                      return (
                        <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-start gap-4">
                              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600 font-bold">
                                {booking.room?.roomNumber || "?"}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  {booking.guestName}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                  <Building className="w-3 h-3" />
                                  {booking.room?.roomType?.name || "Standard Room"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1 text-sm">
                              <div className="flex items-center gap-2 text-gray-700">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                Check In: <span className="font-medium text-gray-900">{new Date(booking.checkInDate).toLocaleDateString('en-IN')}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-700">
                                <LogOut className="w-4 h-4 text-gray-400" />
                                Expected: <span className="font-medium text-gray-900">{new Date(booking.checkOutDate).toLocaleDateString('en-IN')}</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Stay Duration: {calculateDays(booking.checkInDate, booking.checkOutDate)} Night(s)
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center justify-between text-sm w-32">
                                <span className="text-gray-500">Total:</span>
                                <span className="font-medium text-gray-900">₹{totalAmount.toLocaleString()}</span>
                              </div>
                              <div className={`flex items-center justify-between text-sm w-32 font-medium ${hasBalance ? 'text-red-600' : 'text-green-600'}`}>
                                <span>Action:</span>
                                {hasBalance ? (
                                  <span className="flex items-center gap-1">Bal ₹{balanceDue.toLocaleString()}</span>
                                ) : (
                                  <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Settled</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => navigate(isAdmin ? `/admin/invoices` : `/hotel/invoices`)}
                                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                title="View Invoice"
                              >
                                <FileText className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleInitiateCheckout(booking)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 shadow-sm transition"
                              >
                                <LogOut className="w-4 h-4" />
                                Checkout
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {selectedBooking && checkoutPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <LogOut className="w-5 h-5 text-red-600" />
                  Final Checkout
                </h2>
                <p className="text-sm text-gray-500">Room {checkoutPreview.roomNumber} • {checkoutPreview.guestName}</p>
              </div>
              <button
                onClick={() => { setSelectedBooking(null); setCheckoutPreview(null); setError(null); }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-gray-50/50 flex-1 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Summary Block */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Outstanding Summary</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Room Charges</span>
                    <span className="font-medium">₹{checkoutPreview.roomCharges.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Restaurant Charges</span>
                    <span className="font-medium">₹{checkoutPreview.restaurantCharges.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Misc Charges</span>
                    <span className="font-medium">₹{checkoutPreview.miscCharges.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm pb-3 border-b border-gray-100">
                    <span className="text-gray-600">Taxes</span>
                    <span className="font-medium">₹{checkoutPreview.taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1">
                    <span className="text-gray-900">Grand Total</span>
                    <span className="text-gray-900">₹{checkoutPreview.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Amount Paid</span>
                    <span>-₹{checkoutPreview.paidAmount.toLocaleString()}</span>
                  </div>

                  <div className={`mt-4 p-3 rounded-lg flex justify-between items-center ${checkoutPreview.balanceDue > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                    <span className={`font-bold ${checkoutPreview.balanceDue > 0 ? 'text-red-700' : 'text-green-700'}`}>Outstanding Amount</span>
                    <span className={`text-xl font-bold ${checkoutPreview.balanceDue > 0 ? 'text-red-700' : 'text-green-700'}`}>
                      ₹{checkoutPreview.balanceDue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Selection Block */}
              {checkoutPreview.balanceDue > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Payment Mode</h3>
                  </div>
                  <div className="p-4 flex gap-4">
                    <label className="flex-1 cursor-pointer group">
                      <input
                        type="radio"
                        name="paymentMode"
                        value="cash"
                        className="peer sr-only"
                        checked={paymentMode === "cash"}
                        onChange={() => setPaymentMode("cash")}
                      />
                      <div className="p-4 border border-gray-200 rounded-xl peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-700 hover:border-red-300 transition-all text-center">
                        <IndianRupee className="w-6 h-6 mx-auto mb-2 text-gray-400 peer-checked:text-red-600" />
                        <div className="font-medium">Cash</div>
                      </div>
                    </label>

                    <label className="flex-1 cursor-pointer group">
                      <input
                        type="radio"
                        name="paymentMode"
                        value="upi"
                        className="peer sr-only"
                        checked={paymentMode === "upi"}
                        onChange={() => setPaymentMode("upi")}
                      />
                      <div className="p-4 border border-gray-200 rounded-xl peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-700 hover:border-red-300 transition-all text-center">
                        <CreditCard className="w-6 h-6 mx-auto mb-2 text-gray-400 peer-checked:text-red-600" />
                        <div className="font-medium">UPI</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 opacity-95">
              <button
                onClick={() => { setSelectedBooking(null); setCheckoutPreview(null); setError(null); }}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleProcessCheckout}
                disabled={isProcessing || (checkoutPreview?.balanceDue > 0 && !paymentMode)}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : checkoutPreview?.balanceDue > 0 ? (
                  <>
                    Mark as Paid & Checkout
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-white/90" />
                    Complete Check-out
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
