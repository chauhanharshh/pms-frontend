import React, { useEffect, useRef } from "react";
import { 
  LogIn, 
  BookOpen, 
  Wrench, 
  Droplets, 
  LogOut, 
  FileText, 
  Tag, 
  CreditCard,
  User
} from "lucide-react";

interface RoomContextMenuProps {
  x: number;
  y: number;
  status: string;
  roomNumber: string;
  guestName?: string;
  onClose: () => void;
  onAction: (action: string) => void;
}

const GOLD = "#C6A75E";
const DARKGOLD = "#A8832D";

export const RoomContextMenu: React.FC<RoomContextMenuProps> = ({
  x,
  y,
  status,
  roomNumber,
  guestName,
  onClose,
  onAction,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Adjust position to stay within viewport
  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - (status === "occupied" ? 220 : 200));

  const isVacant = status === "vacant";
  const isOccupied = status === "occupied";

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] w-52 bg-white rounded-xl shadow-2xl border border-[#E5E1DA] overflow-hidden animate-in fade-in zoom-in duration-100"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {/* Header */}
      <div className="px-4 py-2 bg-gray-50 border-b border-[#E5E1DA] flex flex-col">
        <span className="text-[10px] uppercase font-bold text-[#9CA3AF] tracking-widest">
          Room Actions
        </span>
        <div className="flex items-center justify-between mt-1">
          <span className="font-bold text-sm text-[#1F2937]" style={{ fontFamily: "Times New Roman, serif" }}>
            Room {roomNumber}
          </span>
          {guestName && isOccupied && (
            <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded-md">
                <User className="w-2.5 h-2.5" />
                <span className="truncate max-w-[80px]">{guestName}</span>
            </div>
          )}
        </div>
      </div>

      <div className="py-1">
        {isVacant && (
          <>
            <ContextMenuItem
              icon={<LogIn className="w-4 h-4" />}
              label="Check In"
              onClick={() => onAction("check-in")}
            />
            <ContextMenuItem
              icon={<BookOpen className="w-4 h-4" />}
              label="Reserve"
              onClick={() => onAction("reserve")}
            />
            <div className="my-1 border-t border-[#F3F1ED]" />
            <ContextMenuItem
              icon={<Wrench className="w-4 h-4" />}
              label="Mark as Maintenance"
              onClick={() => onAction("maintenance")}
            />
            <ContextMenuItem
              icon={<Droplets className="w-4 h-4" />}
              label="Mark as Dirty"
              onClick={() => onAction("dirty")}
            />
          </>
        )}

        {isOccupied && (
          <>
            <ContextMenuItem
              icon={<LogOut className="w-4 h-4" />}
              label="Check Out"
              onClick={() => onAction("checkout")}
              color="#dc2626"
            />
            <ContextMenuItem
              icon={<FileText className="w-4 h-4" />}
              label="Generate Invoice"
              onClick={() => onAction("invoice")}
            />
            <div className="my-1 border-t border-[#F3F1ED]" />
            <ContextMenuItem
              icon={<Tag className="w-4 h-4" />}
              label="Add Misc Charges"
              onClick={() => onAction("misc")}
            />
            <ContextMenuItem
              icon={<CreditCard className="w-4 h-4" />}
              label="Add Advance Payment"
              onClick={() => onAction("advance")}
            />
          </>
        )}
      </div>
    </div>
  );
};

interface ContextMenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

const ContextMenuItem: React.FC<ContextMenuItemProps> = ({ icon, label, onClick, color }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
    style={{ color: color || "#374151" }}
  >
    <div style={{ color: color || GOLD }}>{icon}</div>
    <span className="font-medium">{label}</span>
  </button>
);
