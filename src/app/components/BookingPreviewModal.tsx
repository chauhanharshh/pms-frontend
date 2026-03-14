import { Booking, Room, usePMS } from "../contexts/PMSContext";
import { formatCurrency } from "../utils/format";
import { Printer, X, User, Home, Calendar, Phone, Mail, MapPin, Briefcase, Car } from "lucide-react";

const T = {
    gold: "#C6A75E",
    darkGold: "#A8832D",
    sidebar: "#DDD7CC",
    bg: "#FAF7F2",
    card: "#FFFFFF",
    border: "#E5E1DA",
    text: "#1F2937",
    sub: "#6B7280",
};

function daysBetween(a: string, b: string) {
    return Math.max(
        1,
        Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000),
    );
}

export function BookingPreviewModal({
    booking,
    room,
    onClose,
}: {
    booking: Booking;
    room?: Room | null;
    onClose: () => void;
}) {
    const nights = daysBetween(booking.checkInDate, booking.checkOutDate);
    const { hotels, companies } = usePMS();
    const hotel = hotels.find((h) => h.id === booking.hotelId);
    const linkedCompany = booking.companyId
        ? companies.find((c) => c.id === booking.companyId)
        : undefined;
    const displayCompanyName = booking.companyName || booking.company?.name || linkedCompany?.name;
    const displayCompanyGst = booking.companyGst || booking.company?.gstNumber || linkedCompany?.gstNumber;

    const handlePrint = () => {
        // Basic print setup for this modal content
        const printContent = document.getElementById("booking-preview-printable");
        if (printContent) {
            const originalContents = document.body.innerHTML;
            document.body.innerHTML = printContent.innerHTML;
            window.print();
            document.body.innerHTML = originalContents;
            window.location.reload(); // Reload to restore React state cleanly
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 print:bg-white print:static print:p-0"
            onClick={onClose}
        >
            <style>
                {`
                    @media print {
                        @page {
                            size: A4 portrait;
                            margin: 15mm;
                        }
                        body {
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                    }
                `}
            </style>
            <div
                className="w-full max-w-2xl lg:max-w-[700px] max-h-[90vh] flex flex-col bg-white rounded-xl overflow-hidden shadow-2xl print:shadow-none print:max-w-none print:rounded-none print:max-h-none print:overflow-visible print:block"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header - Hidden on Print */}
                <div
                    className="shrink-0 px-5 py-3 flex items-center justify-between border-b print:hidden"
                    style={{ background: T.sidebar, borderColor: T.border }}
                >
                    <div>
                        <h2 style={{ fontFamily: "Times New Roman, serif", color: T.gold, fontSize: "1.25rem", fontWeight: "bold" }}>
                            Check-In Details
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Booking Ref: {booking.id.split("-").pop()?.toUpperCase()}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-sm font-medium transition-colors hover:bg-gray-50"
                            style={{ color: T.darkGold, border: `1px solid ${T.border}` }}
                        >
                            <Printer className="w-4 h-4" /> Print
                        </button>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Printable Area */}
                <div id="booking-preview-printable" className="p-5 md:p-6 space-y-5 bg-white text-gray-800 overflow-y-auto print:overflow-visible">

                    {/* Print Header */}
                    <div className="text-center border-b pb-4" style={{ borderColor: T.border }}>
                        <h1 className="text-2xl font-bold mb-1 uppercase tracking-wide" style={{ fontFamily: "Times New Roman, serif", color: T.darkGold }}>
                            {hotel?.name || "Hotels4U PMS"}
                        </h1>
                        <p className="text-sm text-gray-500">
                            {hotel?.address}, {hotel?.city}
                        </p>
                        <h2 className="mt-4 text-xl font-bold border rounded-md inline-block px-4 py-1" style={{ borderColor: T.border, color: T.text }}>
                            GUEST REGISTRATION / CHECK-IN DETAILS
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">

                        {/* Guest Info */}
                        <div className="space-y-4">
                            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider pb-2 border-b" style={{ color: T.darkGold, borderColor: T.border }}>
                                <User className="w-4 h-4" /> Guest Information
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex">
                                    <span className="w-1/3 text-gray-500">Name:</span>
                                    <span className="w-2/3 font-semibold">{booking.guestName}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-1/3 text-gray-500">Phone:</span>
                                    <span className="w-2/3 font-semibold">{booking.guestPhone}</span>
                                </div>
                                {booking.guestEmail && (
                                    <div className="flex">
                                        <span className="w-1/3 text-gray-500">Email:</span>
                                        <span className="w-2/3 font-semibold">{booking.guestEmail}</span>
                                    </div>
                                )}
                                {booking.addressLine && (
                                    <div className="flex">
                                        <span className="w-1/3 text-gray-500">Address:</span>
                                        <span className="w-2/3 font-semibold">{booking.addressLine}</span>
                                    </div>
                                )}
                                {booking.idProof && (
                                    <div className="flex">
                                        <span className="w-1/3 text-gray-500">ID Proof:</span>
                                        <span className="w-2/3 font-semibold">{booking.idProof}</span>
                                    </div>
                                )}
                                {displayCompanyName && (
                                    <div className="flex">
                                        <span className="w-1/3 text-gray-500">Company:</span>
                                        <span className="w-2/3 font-semibold">{displayCompanyName}</span>
                                    </div>
                                )}
                                {displayCompanyGst && (
                                    <div className="flex">
                                        <span className="w-1/3 text-gray-500">GST:</span>
                                        <span className="w-2/3 font-semibold">{displayCompanyGst}</span>
                                    </div>
                                )}
                                <div className="flex">
                                    <span className="w-1/3 text-gray-500">Occupants:</span>
                                    <span className="w-2/3 font-semibold">{booking.adults} Adults, {booking.children} Children</span>
                                </div>
                            </div>
                        </div>

                        {/* Stay Info */}
                        <div className="space-y-4">
                            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider pb-2 border-b" style={{ color: T.darkGold, borderColor: T.border }}>
                                <Home className="w-4 h-4" /> Stay Information
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex">
                                    <span className="w-1/3 text-gray-500">Room:</span>
                                    <span className="w-2/3 font-bold text-lg" style={{ color: T.darkGold }}>
                                        {room?.roomNumber || booking.roomNumber || "Unassigned"}
                                    </span>
                                </div>
                                <div className="flex">
                                    <span className="w-1/3 text-gray-500">Check-In:</span>
                                    <span className="w-2/3 font-semibold">
                                        {booking.checkInDate} {booking.checkInTime ? `at ${booking.checkInTime}` : ""}
                                    </span>
                                </div>
                                <div className="flex">
                                    <span className="w-1/3 text-gray-500">Check-Out:</span>
                                    <span className="w-2/3 font-semibold">
                                        {booking.checkOutDate} {booking.checkOutTime ? `at ${booking.checkOutTime}` : ""}
                                    </span>
                                </div>
                                <div className="flex">
                                    <span className="w-1/3 text-gray-500">Duration:</span>
                                    <span className="w-2/3 font-semibold">{nights} Night(s)</span>
                                </div>
                                <div className="flex">
                                    <span className="w-1/3 text-gray-500">Source:</span>
                                    <span className="w-2/3 font-semibold capitalize">{booking.source || "Direct Walk-in"}</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">

                        {/* Travel & Other Details */}
                        <div className="space-y-4">
                            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider pb-2 border-b" style={{ color: T.darkGold, borderColor: T.border }}>
                                <Briefcase className="w-4 h-4" /> Travel Details
                            </h3>
                            <div className="space-y-3 text-sm">
                                {booking.comingFrom && (
                                    <div className="flex">
                                        <span className="w-1/3 text-gray-500">Coming From:</span>
                                        <span className="w-2/3 font-semibold">{booking.comingFrom}</span>
                                    </div>
                                )}
                                {booking.goingTo && (
                                    <div className="flex">
                                        <span className="w-1/3 text-gray-500">Going To:</span>
                                        <span className="w-2/3 font-semibold">{booking.goingTo}</span>
                                    </div>
                                )}
                                <div className="flex">
                                    <span className="w-1/3 text-gray-500">Purpose:</span>
                                    <span className="w-2/3 font-semibold">{booking.purposeOfVisit || "Not specified"}</span>
                                </div>
                                {booking.vehicleDetails && (
                                    <div className="flex">
                                        <span className="w-1/3 text-gray-500">Vehicle:</span>
                                        <span className="w-2/3 font-semibold">{booking.vehicleDetails}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Financials Summary */}
                        <div className="space-y-4">
                            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider pb-2 border-b" style={{ color: T.darkGold, borderColor: T.border }}>
                                <Calendar className="w-4 h-4" /> Financial Summary
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-xl border print:bg-transparent print:border-none print:p-0" style={{ borderColor: T.border }}>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Total Room Rent:</span>
                                        <span className="font-bold text-lg">{formatCurrency(booking.totalAmount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Advance Paid:</span>
                                        <span className="font-bold text-green-600">{formatCurrency(booking.advanceAmount)}</span>
                                    </div>
                                    <div className="pt-2 mt-2 border-t flex justify-between items-center" style={{ borderColor: T.border }}>
                                        <span className="font-bold uppercase" style={{ color: T.darkGold }}>Current Balance:</span>
                                        <span className="font-bold text-xl" style={{ color: Number(booking.totalAmount) - Number(booking.advanceAmount) > 0 ? "#dc2626" : "#16a34a" }}>
                                            {formatCurrency(Number(booking.totalAmount) - Number(booking.advanceAmount))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Terms and Conditions */}
                    <div className="mt-2">
                        <h3
                            className="text-sm font-bold uppercase tracking-wider pb-2 border-b"
                            style={{ color: T.darkGold, borderColor: T.border }}
                        >
                            Hotel Booking Terms & Conditions
                        </h3>
                        <div className="mt-3 text-xs leading-relaxed text-gray-700 space-y-2">
                            <p>
                                <span className="font-semibold">1. Booking Confirmation:</span> All room bookings are subject to availability. A booking is considered confirmed only after receiving a confirmation from the hotel and/or after advance payment (if applicable).
                            </p>
                            <p>
                                <span className="font-semibold">2. Check-In and Check-Out Policy:</span> Standard Check-In Time: 12:00 PM. Standard Check-Out Time: 11:00 AM. Early check-in and late check-out are subject to availability and may incur additional charges.
                            </p>
                            <p>
                                <span className="font-semibold">3. Valid ID Requirement:</span> All guests must present a valid government-issued photo ID at the time of check-in. Accepted IDs include Aadhaar Card, Passport, Driving License, and Voter ID. The hotel reserves the right to refuse check-in if valid identification is not provided.
                            </p>
                            <p>
                                <span className="font-semibold">4. Guest Responsibility:</span> Guests are responsible for maintaining decorum and respecting hotel property. Any damage caused to hotel property may be charged to the guest.
                            </p>
                            <p>
                                <span className="font-semibold">5. Advance Payment Policy:</span> The hotel may require partial or full advance payment to confirm a booking. Advance payment policies may vary depending on the booking type, season, or promotional offer.
                            </p>
                            <p>
                                <span className="font-semibold">6. Cancellation Policy:</span><br />
                                A) If a booking is cancelled more than 48 hours before the scheduled check-in time, the guest is eligible for a full refund (100%).<br />
                                B) If cancellation occurs between 24 and 48 hours before check-in, 50% of the booking amount may be deducted as cancellation charges.<br />
                                C) If cancellation occurs within 24 hours of the scheduled check-in time, the hotel may charge up to one full night as cancellation charges.
                            </p>
                            <p>
                                <span className="font-semibold">7. No Show Policy:</span> If the guest fails to arrive at the hotel on the scheduled check-in date without prior cancellation, the booking will be marked as a No Show. In such cases, the hotel reserves the right to charge one night's stay or the entire advance amount.
                            </p>
                            <p>
                                <span className="font-semibold">8. Early Check-Out Policy:</span> If a guest checks out earlier than the booked stay period, at least one night charge may apply. Refund for remaining nights will depend on the hotel's discretion.
                            </p>
                            <p>
                                <span className="font-semibold">9. Refund Policy:</span> Refunds will be processed according to the cancellation policy mentioned above. Refunds will be issued using the same payment method used during booking (UPI, Card, Cash, or Bank Transfer). Refund processing time may take 3 to 7 working days.
                            </p>
                            <p>
                                <span className="font-semibold">10. Hotel Rights:</span> The hotel reserves the right to cancel or modify bookings in case of unforeseen circumstances such as technical issues, natural calamities, or operational constraints.
                            </p>
                            <p>
                                <span className="font-semibold">11. Force Majeure:</span> The hotel shall not be held responsible for cancellations or service interruptions caused by events beyond reasonable control including natural disasters, government regulations, or emergencies.
                            </p>
                            <p>
                                <span className="font-semibold">12. Acceptance of Terms:</span> By confirming a booking or checking into the hotel, the guest agrees to abide by the above terms and conditions.
                            </p>
                        </div>
                    </div>

                    {/* Signatures */}
                    <div className="mt-8 pt-6 flex justify-between text-sm border-t print:flex print:mt-12 print:pt-8" style={{ borderColor: T.border }}>
                        <div className="text-center">
                            <div className="w-48 border-b border-gray-400 mb-2"></div>
                            <span className="text-gray-500 font-medium">Guest Signature</span>
                        </div>
                        <div className="text-center">
                            <div className="w-48 border-b border-gray-400 mb-2"></div>
                            <span className="text-gray-500 font-medium">Authorized Signatory</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
