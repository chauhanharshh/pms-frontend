import { useState } from "react";
import { Booking, Room, usePMS } from "../contexts/PMSContext";
import { calculateRoomDays, formatActualCheckInDateTime, formatCurrency } from "../utils/format";
import { calculateStayDays, isLateCheckout } from "../utils/stayCalculation";
import { Printer, X, User, Home, Calendar, Phone, Mail, MapPin, Briefcase, Car, Edit2, Save } from "lucide-react";
import { resolveBrandName } from "../utils/branding";
import { QRCodeSVG } from "qrcode.react";
import { calculateRoomTax } from "../utils/tax";

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
    return calculateRoomDays(a, b);
}

function formatDateWithTime(dateStr?: string, timeStr?: string) {
    if (!dateStr) return "-";

    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "-";

    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = d.getUTCFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    if (!timeStr) return formattedDate;

    const [rawHours, rawMinutes] = String(timeStr).split(":");
    const hours = Number(rawHours);
    const minutes = Number(rawMinutes);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return formattedDate;

    const ampm = hours >= 12 ? "PM" : "AM";
    const h = hours % 12 || 12;
    return `${formattedDate}, ${h}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

export function BookingPreviewModal({
    booking: initialBooking,
    room,
    onClose,
}: {
    booking: Booking;
    room?: Room | null;
    onClose: () => void;
}) {
    const { hotels, companies, updateBooking } = usePMS();
    const [booking, setBooking] = useState(initialBooking);
    const [isEditingTimes, setIsEditingTimes] = useState(false);
    const [editedCinTime, setEditedCinTime] = useState(booking.checkInTime || "12:00");
    const [editedCoutTime, setEditedCoutTime] = useState(booking.checkOutTime || "11:00");

    const nights = calculateStayDays(
        booking.checkInDate,
        booking.checkInTime || "12:00",
        booking.checkOutDate,
        booking.checkOutTime || "12:00",
    );
    const lateCheckout = isLateCheckout(booking.checkOutTime || "");
    const displayNights = lateCheckout ? Math.max(nights - 1, 1) : nights;
    const durationLabel = lateCheckout
        ? `${displayNights} Night(s) + Late Check-Out`
        : `${displayNights} Night(s)`;

    const handleSaveTimes = async () => {
        try {
            const newNights = calculateStayDays(
                booking.checkInDate,
                editedCinTime,
                booking.checkOutDate,
                editedCoutTime
            );
            const rRate = firstPositiveNumber(
                booking.roomPrice,
                (booking as any).roomRate,
                room?.basePrice,
            );
            const base = rRate * newNights;
            const taxInfo = calculateRoomTax(rRate, newNights);
            const total = base + Math.round((base * taxInfo.rate) / 100);

            await updateBooking(booking.id, {
                checkInTime: editedCinTime,
                checkOutTime: editedCoutTime,
                totalAmount: total
            } as any);
            
            setBooking(prev => ({
                ...prev,
                checkInTime: editedCinTime,
                checkOutTime: editedCoutTime,
                totalAmount: total
            }));
            setIsEditingTimes(false);
        } catch (err) {
            console.error("Failed to update times:", err);
            alert("Failed to update times");
        }
    };
    const firstPositiveNumber = (...values: any[]) => {
        for (const value of values) {
            const parsed = Number(value);
            if (Number.isFinite(parsed) && parsed > 0) return parsed;
        }
        return 0;
    };
    const roomRate = firstPositiveNumber(
        booking.roomPrice,
        (booking as any).roomRate,
        (booking as any).ratePerNight,
        (booking as any).customRate,
        (booking as any).pricePerNight,
        room?.basePrice,
        (room as any)?.price,
    );
    const baseAmount = roomRate * nights;
    const taxInfo = calculateRoomTax(roomRate, nights);
    const gstRate = taxInfo.rate;
    const gstAmount = Math.round((baseAmount * gstRate) / 100);
    const totalRoomRent = baseAmount + gstAmount;
    const advancePaid = firstPositiveNumber((booking as any)?.bill?.paidAmount, booking.advanceAmount);
    const currentBalance = totalRoomRent - advancePaid;
    const showFinancialSummary = (() => {
        try {
            return JSON.parse(localStorage.getItem("showFinancialSummary") ?? "true");
        } catch {
            return true;
        }
    })();
    const hotel = hotels.find((h) => h.id === booking.hotelId);
    const linkedCompany = booking.companyId
        ? companies.find((c) => c.id === booking.companyId)
        : undefined;
    const displayCompanyName = booking.companyName || booking.company?.name || linkedCompany?.name;
    const displayCompanyGst = booking.companyGst || booking.company?.gstNumber || linkedCompany?.gstNumber;
    const checkInDisplay = formatDateWithTime(booking.checkInDate, booking.checkInTime);
    const checkOutDisplay = formatDateWithTime(booking.checkOutDate, booking.checkOutTime);

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

    const qrData = JSON.stringify({
        bookingId: booking.id,
        bookingRef: booking.id.split("-").pop()?.toUpperCase(),
        guestName: booking.guestName,
        roomNumber: room?.roomNumber || booking.roomNumber || "Unassigned",
        checkIn: checkInDisplay,
        checkOut: checkOutDisplay,
        plan: booking?.plan || "EP",
    });

    const hotelName = hotel?.name || "UTTARAKHAND HOTELS4U";

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
                className="w-full max-w-2xl lg:max-w-[700px] max-h-[92vh] flex flex-col bg-white rounded-xl overflow-hidden shadow-2xl print:shadow-none print:max-w-none print:rounded-none print:max-h-none print:overflow-visible print:block"
                onClick={(e) => e.stopPropagation()}
                id="booking-preview-printable"
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
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                            Booking Ref: {booking.id.split("-").pop()?.toUpperCase()}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm"
                            style={{ color: T.darkGold }}
                        >
                            <Printer className="w-3.5 h-3.5" /> Print
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-black/5 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 print:p-0 print:overflow-visible">
                    
                    {/* Header with Hotel Name and QR */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-8 border-b print:pb-6 print:gap-4" style={{ borderColor: T.border }}>
                        <div className="text-center md:text-left space-y-2">
                            <h1 className="text-2xl md:text-3xl font-black tracking-widest" style={{ color: "#B8860B", fontFamily: "Georgia, serif" }}>
                                {hotelName.toUpperCase()}
                            </h1>
                            <p className="text-sm text-gray-600 max-w-md mx-auto md:mx-0 leading-relaxed font-medium">
                                {hotel?.address || "Hospitality Services & Management"}
                            </p>
                        </div>
                        {/* QR Code Overlay (Hidden on Mobile Search, Showing top-right in printable area) */}
                        <div className="flex flex-col items-center gap-1 scale-[0.8] md:scale-100 origin-top-right">
                            <div className="p-1.5 bg-white border rounded-lg shadow-sm" style={{ borderColor: T.border }}>
                                <QRCodeSVG value={qrData} size={isLateCheckout(booking.checkOutTime || "") ? 60 : 80} level="M" />
                            </div>
                            <span className="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-widest font-bold">Booking QR</span>
                        </div>
                    </div>



                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 print:grid-cols-2">

                        {/* Guest Info */}
                        <div className="space-y-4">
                            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider pb-2 border-b" style={{ color: T.darkGold, borderColor: T.border }}>
                                <User className="w-4 h-4" /> Guest Information
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-x-3">
                                    <span className="text-gray-500">Name:</span>
                                    <span className="font-semibold break-words">{booking.guestName}</span>
                                </div>
                                <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-x-3">
                                    <span className="text-gray-500">Phone:</span>
                                    <span className="font-semibold break-words">{booking.guestPhone}</span>
                                </div>
                                {booking.guestEmail && (
                                    <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-x-3">
                                        <span className="text-gray-500">Email:</span>
                                        <span className="font-semibold break-words">{booking.guestEmail}</span>
                                    </div>
                                )}
                                {booking.addressLine && (
                                    <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-x-3">
                                        <span className="text-gray-500">Address:</span>
                                        <span className="font-semibold break-words">{booking.addressLine}</span>
                                    </div>
                                )}
                                {booking.idProof && (
                                    <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-x-3">
                                        <span className="text-gray-500">ID Proof:</span>
                                        <span className="font-semibold break-words">{booking.idProof}</span>
                                    </div>
                                )}
                                {displayCompanyName && (
                                    <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-x-3">
                                        <span className="text-gray-500">Company:</span>
                                        <span className="font-semibold break-words">{displayCompanyName}</span>
                                    </div>
                                )}
                                {displayCompanyGst && (
                                    <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-x-3">
                                        <span className="text-gray-500">GST:</span>
                                        <span className="font-semibold break-words">{displayCompanyGst}</span>
                                    </div>
                                )}
                                <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-x-3">
                                    <span className="text-gray-500">Occupants:</span>
                                    <span className="font-semibold break-words">{booking.adults} Adults, {booking.children} Children</span>
                                </div>
                            </div>
                        </div>

                        {/* Stay Info */}
                        <div className="space-y-4">
                            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider pb-2 border-b" style={{ color: T.darkGold, borderColor: T.border }}>
                                <Home className="w-4 h-4" /> Stay Information
                                {!isEditingTimes && booking.status !== 'checked_out' && booking.status !== 'cancelled' && (
                                    <button 
                                        onClick={() => setIsEditingTimes(true)}
                                        className="ml-auto p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600"
                                        title="Edit Times"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-x-3">
                                    <span className="text-gray-500">Room:</span>
                                    <span className="font-bold text-lg break-words" style={{ color: T.darkGold }}>
                                        {room?.roomNumber || booking.roomNumber || "Unassigned"}
                                    </span>
                                </div>
                                <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-x-3">
                                    <span className="text-gray-500">Check-In:</span>
                                    {isEditingTimes ? (
                                        <input 
                                            type="time" 
                                            className="px-2 py-0.5 border rounded text-xs outline-none focus:border-gold-500"
                                            value={editedCinTime}
                                            onChange={(e) => setEditedCinTime(e.target.value)}
                                        />
                                    ) : (
                                        <span className="font-semibold break-words">
                                            {checkInDisplay}
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-x-3">
                                    <span className="text-gray-500">Check-Out:</span>
                                    {isEditingTimes ? (
                                        <input 
                                            type="time" 
                                            className="px-2 py-0.5 border rounded text-xs outline-none focus:border-gold-500"
                                            value={editedCoutTime}
                                            onChange={(e) => setEditedCoutTime(e.target.value)}
                                        />
                                    ) : (
                                        <span className="font-semibold break-words">
                                            {checkOutDisplay}
                                        </span>
                                    )}
                                </div>
                                {isEditingTimes && (
                                    <div className="flex gap-2 mt-2">
                                        <button 
                                            onClick={handleSaveTimes}
                                            className="flex items-center gap-1.5 px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors"
                                        >
                                            <Save className="w-3 h-3" /> Save
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setIsEditingTimes(false);
                                                setEditedCinTime(booking.checkInTime || "12:00");
                                                setEditedCoutTime(booking.checkOutTime || "11:00");
                                            }}
                                            className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                                <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-x-3">
                                    <span className="text-gray-500">Duration:</span>
                                    <span className="font-semibold break-words">{durationLabel}</span>
                                </div>
                                <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-x-3">
                                    <span className="text-gray-500">Source:</span>
                                    <span className="font-semibold break-words capitalize">{booking.source || "Direct Walk-in"}</span>
                                </div>
                                <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-x-3">
                                    <span className="text-gray-500">Plan:</span>
                                    <span className="font-semibold break-words">{booking?.plan || "EP"}</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 print:grid-cols-2">

                        {/* Travel & Other Details */}
                        <div className="space-y-4">
                            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider pb-2 border-b" style={{ color: T.darkGold, borderColor: T.border }}>
                                <Briefcase className="w-4 h-4" /> Travel Details
                            </h3>
                            <div className="space-y-3 text-sm">
                                {booking.comingFrom && (
                                    <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-x-3">
                                        <span className="text-gray-500">Coming From:</span>
                                        <span className="font-semibold break-words">{booking.comingFrom}</span>
                                    </div>
                                )}
                                {booking.goingTo && (
                                    <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-x-3">
                                        <span className="text-gray-500">Going To:</span>
                                        <span className="font-semibold break-words">{booking.goingTo}</span>
                                    </div>
                                )}
                                <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-x-3">
                                    <span className="text-gray-500">Purpose:</span>
                                    <span className="font-semibold break-words">{booking.purposeOfVisit || "Not specified"}</span>
                                </div>
                                {booking.vehicleDetails && (
                                    <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-x-3">
                                        <span className="text-gray-500">Vehicle:</span>
                                        <span className="font-semibold break-words">{booking.vehicleDetails}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {showFinancialSummary && (
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider pb-2 border-b" style={{ color: T.darkGold, borderColor: T.border }}>
                                    <Calendar className="w-4 h-4" /> Financial Summary
                                </h3>
                                <div className="bg-gray-50 rounded-xl border border-[#E8DCC8] p-3 md:p-4 print:bg-transparent print:border-none print:p-0">
                                    <div className="flex justify-between text-sm text-gray-600 pb-2">
                                        <span>Room Rate</span>
                                        <span>{formatCurrency(roomRate)}/night</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600 pb-3 border-b border-gray-200">
                                        <span>Number of Nights</span>
                                        <span>{nights} Night(s)</span>
                                    </div>

                                    <div className="flex justify-between text-sm text-gray-700 pt-3 pb-1">
                                        <span>Base Amount</span>
                                        <span>{formatCurrency(baseAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-700 pb-3 border-b border-gray-200">
                                        <span>GST ({gstRate}%)</span>
                                        <span>{formatCurrency(gstAmount)}</span>
                                    </div>

                                    <div className="flex justify-between text-sm font-semibold text-gray-800 pt-3 pb-1">
                                        <span>Total Room Rent</span>
                                        <span>{formatCurrency(totalRoomRent)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-green-600 pb-3 border-b border-gray-200">
                                        <span>(-) Advance Paid</span>
                                        <span>{formatCurrency(advancePaid)}</span>
                                    </div>

                                    <div className="flex justify-between font-bold text-base pt-3">
                                        <span className="uppercase" style={{ color: "#B8860B" }}>Current Balance</span>
                                        <span className="text-red-600">{formatCurrency(currentBalance)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

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

                    {/* Footer Note */}
                    <div className="mt-8 pt-6 text-center text-sm border-t print:mt-12 print:pt-8" style={{ borderColor: T.border }}>
                        <span className="text-gray-500 font-medium">
                            This is a computer generated invoice and does not require signature.
                        </span>
                    </div>

                </div>
            </div>
        </div>
    );
}
