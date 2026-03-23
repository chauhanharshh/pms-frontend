import React from "react";
import { X, User, Home, Calendar, ClipboardCheck, Loader2 } from "lucide-react";
import { Booking, usePMS } from "../contexts/PMSContext";
import { formatCurrency } from "../utils/format";

interface QRScanResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
}

export const QRScanResultModal: React.FC<QRScanResultModalProps> = ({
  isOpen,
  onClose,
  booking,
}) => {
  const { rooms, confirmQRCheckIn, isConfirmingQRCheckIn } = usePMS();

  if (!isOpen || !booking) return null;

  const room = rooms.find((r) => r.id === booking.roomId);

  const handleConfirm = async () => {
    try {
      await confirmQRCheckIn();
      onClose();
    } catch (error) {
      // Error is handled in context with toast
    }
  };

  const T = {
    gold: "#C6A75E",
    darkGold: "#A8832D",
    card: "#FFFFFF",
    border: "#E5E1DA",
    text: "#1F2937",
    sub: "#6B7280",
    bg: "rgba(0, 0, 0, 0.5)",
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300"
      style={{ backgroundColor: T.bg }}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200"
        style={{ backgroundColor: T.card }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: T.border }}
        >
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" style={{ color: T.gold }} />
            <h3
              className="text-lg font-bold"
              style={{ color: T.text, fontFamily: "Times New Roman, serif" }}
            >
              Verify Check-In Details
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 transition-colors hover:bg-black/5"
            style={{ color: T.sub }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-sm" style={{ color: T.sub }}>
            Please confirm the guest details below before completing the check-in process.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#FAF9F6] p-5 rounded-xl border border-[#E5E1DA]">
            <DetailItem
              icon={<User className="h-4 w-4" />}
              label="Guest Name"
              value={booking.guestName}
              T={T}
            />
            <DetailItem
              icon={<Home className="h-4 w-4" />}
              label="Room Number"
              value={room ? room.roomNumber : "N/A"}
              T={T}
            />
            <DetailItem
              icon={<Calendar className="h-4 w-4" />}
              label="Check-In"
              value={booking.checkInDate}
              T={T}
            />
            <DetailItem
              icon={<Calendar className="h-4 w-4" />}
              label="Check-Out"
              value={booking.checkOutDate}
              T={T}
            />
            <DetailItem
              icon={<ClipboardCheck className="h-4 w-4" />}
              label="Plan"
              value={booking.plan || "EP"}
              T={T}
            />
            <DetailItem
              icon={<ClipboardCheck className="h-4 w-4" />}
              label="Booking Ref"
              value={booking.id.slice(-8).toUpperCase()}
              T={T}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-3 border-t px-6 py-4 bg-[#F9FAFB]"
          style={{ borderColor: T.border }}
        >
          <button
            onClick={onClose}
            className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all border hover:bg-gray-50"
            style={{ color: T.text, borderColor: T.border }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirmingQRCheckIn}
            className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${T.gold}, ${T.darkGold})`,
            }}
          >
            {isConfirmingQRCheckIn ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm Check-In"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({
  icon,
  label,
  value,
  T,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  T: any;
}) => (
  <div className="space-y-1">
    <div className="flex items-center gap-2 text-xs font-medium" style={{ color: T.sub }}>
      {icon}
      {label}
    </div>
    <div className="text-sm font-bold pl-6" style={{ color: T.text }}>
      {value}
    </div>
  </div>
);
