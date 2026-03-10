// ============================================================
// COMPATIBILITY SHIM — mockData.ts
// All types are now sourced from PMSContext.tsx.
// This file re-exports them for backward compatibility.
// Do NOT add new mock arrays here — use the real backend API.
// ============================================================

export type {
  Hotel,
  Room,
  Booking,
  Bill,
  Invoice,
  Expense,
  AdvancePayment,
  MiscCharge,
  PaymentVoucher,
  RestaurantCategory,
  RestaurantItem,
  RestaurantOrder,
} from "../contexts/PMSContext";

// ── LOCAL-ONLY TYPES (not in DB schema but used by frontend pages) ──

export interface BillItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  type: "room" | "restaurant" | "misc" | "advance";
}

export interface OrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface RestaurantExpense {
  id: string;
  hotelId: string;
  description: string;
  category: "Ingredients" | "Vendor" | "Equipment" | "Staff" | "Other";
  amount: number;
  date: string;
  vendorName: string;
}

/** AppUser — defined locally to include password field used in user creation forms */
export interface AppUser {
  id: string;
  username: string;
  password?: string;          // optional — not returned by backend GET
  fullName?: string;
  email?: string;
  phone?: string;
  role: "admin" | "hotel_manager" | "hotel_user" | "hotel";
  hotelId?: string;
  hotelName?: string;
  isActive: boolean;
  createdAt?: string;
}

// ── EMPTY ARRAYS (pages may rely on these being exported) ──
export const MOCK_HOTELS: any[] = [];
export const MOCK_ROOMS: any[] = [];
export const MOCK_BOOKINGS: any[] = [];
export const MOCK_BILLS: any[] = [];
export const MOCK_INVOICES: any[] = [];
export const MOCK_EXPENSES: any[] = [];
export const MOCK_ADVANCES: any[] = [];
export const MOCK_MISC_CHARGES: any[] = [];
export const MOCK_VOUCHERS: any[] = [];
export const MOCK_RESTAURANT_CATEGORIES: any[] = [];
export const MOCK_RESTAURANT_ITEMS: any[] = [];
export const MOCK_RESTAURANT_ORDERS: any[] = [];
export const MOCK_RESTAURANT_EXPENSES: any[] = [];
export const MOCK_APP_USERS: any[] = [];

// ── HELPER FUNCTIONS ──────────────────────────────────────────

/** Generate a pseudo-random ID string with optional prefix */
export function generateId(prefix = "id"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Format a number as Indian Rupee currency */
export function formatCurrency(amount: number | string | undefined | null): string {
  const val = Number(amount ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

/** Format a date string into a readable short date */
export function formatDate(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateStr);
  }
}

/** Stub: rooms for a hotel — use PMSContext rooms state instead */
export function getHotelRooms(rooms: any[], hotelId: string) {
  return rooms.filter((r) => r.hotelId === hotelId);
}

/** Stub: hotel-level aggregate stats for dashboard */
export function getHotelStats(rooms: any[], bookings: any[], hotelId: string) {
  const hotelRooms = rooms.filter((r) => r.hotelId === hotelId);
  const hotelBookings = bookings.filter((b) => b.hotelId === hotelId);
  const occupied = hotelRooms.filter((r) => r.status === "occupied").length;
  const vacant = hotelRooms.filter((r) => r.status === "vacant").length;
  const checkedIn = hotelBookings.filter((b) => b.status === "checked_in").length;
  return { totalRooms: hotelRooms.length, occupied, vacant, checkedIn };
}

/** Stub: system-wide admin stats */
export function getAdminStats(rooms: any[], bookings: any[], hotels: any[]) {
  const totalRooms = rooms.length;
  const occupied = rooms.filter((r) => r.status === "occupied").length;
  const checkedIn = bookings.filter((b) => b.status === "checked_in").length;
  return {
    totalHotels: hotels.length,
    totalRooms,
    occupied,
    checkedIn,
    occupancyRate: totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0,
  };
}
