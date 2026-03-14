import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import type { ReactNode } from "react";
import api from "../services/api.js";
import { useAuth } from "./AuthContext.js";

// ── TYPE DEFINITIONS ─────────────────────────────────────────────
export interface Hotel {
  id: string;
  name: string;
  brandName?: string | null;
  logoUrl?: string | null;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  website?: string;
  gstNumber?: string;
  checkInTime: string;
  checkOutTime: string;
  taxRate: number | string;
  currency: string;
  isActive: boolean;
  createdAt: string;
  // Optional UI-only/legacy fields
  floors?: number;
  totalRooms?: number;
  rating?: number;
  posBossMode?: boolean;
  // Theme Settings
  sidebarColor?: string;
  headerColor?: string;
  accentColor?: string;
  isCustomTheme?: boolean;
  showAllRooms?: boolean;
}

export interface SystemSettings {
  id: string;
  globalSidebarColor: string;
  globalHeaderColor: string;
  globalAccentColor: string;
  enableRestaurantMultiHotel?: boolean;
}

export interface Company {
  id: string;
  hotelId: string;
  name: string;
  gstNumber?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number | string;
  paymentTerms?: string;
  isActive: boolean;
}

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: string;
  hotelId?: string;
  password?: string;
  isActive: boolean;
  createdAt: string;
  hotel?: { id: string; name: string };
}

export interface Room {
  id: string;
  hotelId: string;
  roomNumber: string;
  floor: number;
  typeId: string;
  roomType?: { id: string; name: string; basePrice: number; taxRate: number };
  status: "vacant" | "occupied" | "cleaning" | "maintenance";
  basePrice: number | string;
  taxRate: number | string;
  maxOccupancy: number;
  maintenanceNote?: string;
}

export interface DashboardStats {
  totalHotels: number;
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  occupancyRate: number;
}

export interface Booking {
  id: string;
  hotelId: string;
  roomId: string;
  roomNumber?: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  idProof?: string;
  addressLine?: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  adults: number;
  children: number;
  totalAmount: number | string;
  advanceAmount: number | string;
  status: "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled";
  source: string;
  specialRequests?: string;
  room?: Room;
  bill?: Bill;
  companyId?: string;
  company?: Company;
  companyName?: string;
  companyGst?: string;
  comingFrom?: string;
  goingTo?: string;
  purposeOfVisit?: string;
  marketSegment?: string;
  businessSource?: string;
  vehicleDetails?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Bill {
  id: string;
  hotelId: string;
  bookingId: string;
  roomCharges: number | string;
  restaurantCharges: number | string;
  miscCharges: number | string;
  subtotal: number | string;
  discount: number | string;
  taxAmount: number | string;
  totalAmount: number | string;
  paidAmount: number | string;
  balanceDue: number | string;
  status: string;
  createdAt: string;
  booking?: Partial<Booking>;
  invoice?: Partial<Invoice>;
}

export interface BillItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  type: string;
}

export interface Invoice {
  id: string;
  hotelId: string;
  billId: string;
  invoiceNumber: string;
  type: 'ROOM' | 'RESTAURANT';
  subtotal: number | string;
  cgst: number | string;
  sgst: number | string;
  totalAmount: number | string;
  status: string;
  invoiceDate: string;
  createdAt: string;
  bill?: Partial<Bill>;
}

export interface Vendor {
  id: string;
  hotelId: string;
  name: string;
  category: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  notes?: string;
  totalOrders: number;
  totalPaid: number;
}

export interface RoomBlock {
  id: string;
  hotelId: string;
  roomId: string;
  roomNumber: string;
  reason: string;
  fromDate: string;
  toDate: string;
  blockedBy: string;
  isActive: boolean;
}

export interface PettyCash {
  id: string;
  hotelId: string;
  date: string;
  description: string;
  type: "receipt" | "payment";
  amount: number;
  category: string;
  balance: number;
}

export interface Liability {
  id: string;
  hotelId: string;
  vendorName: string;
  vendorType: string;
  description: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: "pending" | "partial" | "paid";
  paymentHistory: Array<{ date: string; amount: number; mode: string }>;
}

export interface Expense {
  id: string;
  hotelId: string;
  category: string;
  description: string;
  amount: number | string;
  payee: string;
  paymentMethod: string;
  expenseDate: string;
  receiptNumber?: string;
}

export interface AdvancePayment {
  id: string;
  hotelId: string;
  bookingId?: string;
  guestName: string;
  amount: number | string;
  usedAmount: number | string;
  paymentMethod: string;
  status: string;
  remarks?: string;
  paymentDate: string;
  booking?: Partial<Booking>;
}

export interface MiscCharge {
  id: string;
  hotelId: string;
  bookingId?: string;
  category: string;
  description: string;
  amount: number | string;
  quantity: number;
  addedToFinalBill: boolean;
  chargeDate: string;
  booking?: Partial<Booking>;
}

export interface PaymentVoucher {
  id: string;
  hotelId: string;
  voucherNumber: string;
  payee: string;
  amount: number | string;
  paymentMethod: string;
  purpose: string;
  voucherDate: string;
}

export interface RestaurantCategory {
  id: string;
  hotelId: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  menuItems?: RestaurantItem[];
}

export interface RestaurantItem {
  id: string;
  hotelId: string;
  categoryId: string;
  itemName: string;
  description?: string;
  price: number | string;
  taxRate: number | string;
  isAvailable: boolean;
  isVeg: boolean;
  preparationTime?: number;
  category?: RestaurantCategory;
}

export interface RestaurantOrder {
  id: string;
  hotelId: string;
  orderNumber: string;
  bookingId?: string;
  tableNumber?: string;
  guestName?: string;
  discount?: number | string;
  subtotal: number | string;
  gst: number | string;
  totalAmount: number | string;
  status: string;
  paymentMethod?: string;
  invoicedAt?: string;
  createdAt: string;
  orderItems?: RestaurantOrderItem[];
  booking?: {
    id: string;
    guestName: string;
    room?: {
      roomNumber: string;
    }
  }
}

export interface RestaurantOrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  price: number | string;
  itemTotal: number | string;
  specialNote?: string;
  menuItem?: RestaurantItem;
}

// CloneOptions kept for future admin clone API calls
export interface CloneOptions {
  roomStructure: boolean;
  roomTypesPricing: boolean;
  restaurantMenu: boolean;
  restaurantCategories: boolean;
  taxSettings: boolean;
}

// ── CONTEXT TYPE ─────────────────────────────────────────────────
interface PMSContextType {
  // Loading/error
  isLoading: boolean;
  error: string | null;
  refreshAll: (silent?: boolean) => void;
  dashboardStats: DashboardStats | null;

  // System Settings
  systemSettings: SystemSettings | null;
  updateSystemSettings: (updates: Partial<SystemSettings>) => Promise<void>;

  // Hotels
  hotels: Hotel[];
  addHotel: (h: Omit<Hotel, "id" | "createdAt">) => Promise<string>;
  updateHotel: (id: string, updates: Partial<Hotel>) => Promise<void>;
  deleteHotel: (id: string) => Promise<void>;
  cloneHotelData: (sourceId: string, targetId: string, options: CloneOptions) => Promise<void>;

  // Companies
  companies: Company[];
  addCompany: (c: Omit<Company, "id">) => Promise<void>;
  updateCompany: (id: string, updates: Partial<Company>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  toggleCompanyStatus: (id: string) => Promise<void>;

  // Users
  appUsers: AppUser[];
  addUser: (u: any) => Promise<any>;
  updateUser: (id: string, updates: any) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // Rooms
  rooms: Room[];
  addRoom: (r: any) => Promise<void>;
  updateRoom: (id: string, updates: Partial<Room>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;

  // Bookings
  bookings: Booking[];
  addBooking: (b: any) => Promise<any>;
  walkInCheckIn: (data: any) => Promise<{ booking: Booking; bill: Bill }>;
  updateBooking: (id: string, updates: Partial<Booking>) => Promise<void>;

  // Bills
  bills: Bill[];
  addBill: (bill: any) => Promise<any>;
  updateBill: (id: string, updates: Partial<Bill>) => Promise<void>;

  // Invoices
  invoices: Invoice[];
  addInvoice: (inv: any) => Promise<Invoice>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  payInvoice: (id: string, paymentMode: string) => Promise<Invoice>;

  // Expenses
  expenses: Expense[];
  addExpense: (exp: any) => Promise<any>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Advances
  advances: AdvancePayment[];
  addAdvance: (adv: any) => Promise<any>;
  updateAdvance: (id: string, updates: Partial<AdvancePayment>) => Promise<void>;

  // Misc Charges
  miscCharges: MiscCharge[];
  addMiscCharge: (mc: any) => Promise<any>;
  updateMiscCharge: (id: string, updates: Partial<MiscCharge>) => Promise<void>;
  deleteMiscCharge: (id: string) => Promise<void>;

  // Vouchers
  vouchers: PaymentVoucher[];
  addVoucher: (v: any) => Promise<any>;
  updateVoucher: (id: string, updates: Partial<PaymentVoucher>) => Promise<void>;
  deleteVoucher: (id: string) => Promise<void>;

  // Restaurant
  restaurantCategories: RestaurantCategory[];
  addCategory: (cat: any) => Promise<any>;
  updateCategory: (id: string, updates: Partial<RestaurantCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  restaurantItems: RestaurantItem[];
  addItem: (item: any) => Promise<any>;
  updateItem: (id: string, updates: Partial<RestaurantItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;

  restaurantOrders: RestaurantOrder[];
  addOrder: (order: any) => Promise<any>;
  updateOrder: (id: string, updates: any) => Promise<void>;
  generateOrderInvoice: (id: string, hotelId?: string) => Promise<Invoice>;
  generateKOTAndInvoice: (id: string, hotelId?: string) => Promise<{ kot: any; invoice: Invoice }>;
  payRestaurantInvoice: (id: string, paymentMethod: string) => Promise<Invoice>;
  getCheckedInRooms: (hotelId?: string) => Promise<Array<{ id: string; guestName: string; room: { roomNumber: string } }>>;

  // KOT Management
  getKOTs: (status?: string) => Promise<any[]>;
  updateKOT: (id: string, updates: any) => Promise<void>;
  deleteKOT: (id: string) => Promise<void>;
  convertKOTToInvoice: (kotId: string, hotelId?: string) => Promise<Invoice>;

  // Legacy compat (not used but some pages might rely on these)
  restaurantExpenses: Expense[];
  addRestaurantExpense: (exp: any) => Promise<void>;
  updateRestaurantExpense: (id: string, updates: any) => Promise<void>;
  deleteRestaurantExpense: (id: string) => Promise<void>;

  // Vendors
  vendors: Vendor[];
  addVendor: (v: any) => Promise<any>;
  updateVendor: (id: string, updates: Partial<Vendor>) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;

  // Room Blocks
  roomBlocks: RoomBlock[];
  addRoomBlock: (b: any) => Promise<any>;
  updateRoomBlock: (id: string, updates: Partial<RoomBlock>) => Promise<void>;
  deleteRoomBlock: (id: string) => Promise<void>;

  // Petty Cash
  pettyCash: PettyCash[];
  addPettyCash: (txn: any) => Promise<any>;
  deletePettyCash: (id: string) => Promise<void>;

  // Liabilities
  liabilities: Liability[];
  addLiability: (l: any) => Promise<any>;
  updateLiability: (id: string, updates: Partial<Liability>) => Promise<void>;
  addLiabilityPayment: (id: string, payment: any) => Promise<void>;
  deleteLiability: (id: string) => Promise<void>;
}

const PMSContext = createContext<PMSContextType | undefined>(undefined);

// ── HELPER: pull hotelId for API calls ───────────────────────────
function getHotelParam(hotelId?: string | null) {
  return hotelId ? { params: { hotelId } } : {};
}

export function PMSProvider({ children }: { children: ReactNode }) {
  const { user, currentHotelId, token, setCurrentHotelId } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [advances, setAdvances] = useState<AdvancePayment[]>([]);
  const [miscCharges, setMiscCharges] = useState<MiscCharge[]>([]);
  const [vouchers, setVouchers] = useState<PaymentVoucher[]>([]);
  const [restaurantCategories, setRestaurantCategories] = useState<RestaurantCategory[]>([]);
  const [restaurantItems, setRestaurantItems] = useState<RestaurantItem[]>([]);
  const [restaurantOrders, setRestaurantOrders] = useState<RestaurantOrder[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [roomBlocks, setRoomBlocks] = useState<RoomBlock[]>([]);
  const [pettyCash, setPettyCash] = useState<PettyCash[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  // Fetch system settings (theme) once on mount
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const res = await api.get('/system-settings/theme');
        if (res.data?.data) {
          setSystemSettings(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch system theme:", err);
      }
    };
    fetchTheme();
  }, []);

  const fetchAll = useCallback(async (silent = false) => {
    if (!user) return;
    if (user.role === "super_admin") {
      if (!silent) {
        setIsLoading(false);
        setError(null);
      }
      return;
    }
    if (!silent) setIsLoading(true);
    if (!silent) setError(null);
    try {
      const hotelsRes = await api.get(`/hotels`);
      const fetchedHotels = hotelsRes.data?.data || [];
      setHotels(fetchedHotels);

      const effectiveHotelId = currentHotelId || (user.role === "admin" ? null : user.hotelId);
      const consolidatedQp = effectiveHotelId ? `?hotelId=${effectiveHotelId}` : "";
      const isAdminConsolidated = user.role === "admin" && !currentHotelId;

      const uniqueById = <T extends { id: string }>(items: T[]) =>
        Array.from(new Map(items.map((item) => [item.id, item])).values());

      const aggregateByHotel = async (endpoint: string) => {
        const hotelIds = fetchedHotels.map((h: Hotel) => h.id);
        if (hotelIds.length === 0) return [];

        const settled = await Promise.allSettled(
          hotelIds.map((id) => api.get(`${endpoint}?hotelId=${id}`))
        );

        const merged = settled
          .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
          .flatMap((result) => result.value.data?.data || []);

        return uniqueById(merged);
      };

      if (isAdminConsolidated) {
        const [
          users,
          roomsData,
          bookingsData,
          billsData,
          invoicesData,
          expensesData,
          advancesData,
          miscData,
          vouchersData,
          categoriesData,
          menuData,
          ordersData,
          companiesData,
          vendorsData,
          roomBlocksData,
          pettyCashData,
          liabilitiesData,
          statsSettled,
        ] = await Promise.all([
          aggregateByHotel(`/users`),
          aggregateByHotel(`/rooms`),
          aggregateByHotel(`/bookings`),
          aggregateByHotel(`/bills`),
          aggregateByHotel(`/invoices`),
          aggregateByHotel(`/expenses`),
          aggregateByHotel(`/advances`),
          aggregateByHotel(`/misc-charges`),
          aggregateByHotel(`/vouchers`),
          aggregateByHotel(`/restaurant/categories`),
          aggregateByHotel(`/restaurant/menu`),
          aggregateByHotel(`/restaurant/orders`),
          aggregateByHotel(`/companies`),
          aggregateByHotel(`/vendors`),
          aggregateByHotel(`/room-blocks`),
          aggregateByHotel(`/petty-cash`),
          aggregateByHotel(`/liabilities`),
          Promise.allSettled(fetchedHotels.map((h: Hotel) => api.get(`/hotels/${h.id}/stats`))),
        ]);

        setAppUsers(users || []);
        setRooms(roomsData || []);
        setBookings(bookingsData || []);
        setBills(billsData || []);
        setInvoices(invoicesData || []);
        setExpenses(expensesData || []);
        setAdvances(advancesData || []);
        setMiscCharges(miscData || []);
        setVouchers(vouchersData || []);
        setRestaurantCategories(categoriesData || []);
        setRestaurantItems(menuData || []);
        setRestaurantOrders(ordersData || []);
        setCompanies(companiesData || []);
        setVendors(vendorsData || []);
        setRoomBlocks(roomBlocksData || []);
        setPettyCash(pettyCashData || []);
        setLiabilities(liabilitiesData || []);

        const statsList = statsSettled
          .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
          .map((result) => result.value.data?.data)
          .filter(Boolean);

        const totalRooms = statsList.reduce((sum: number, item: any) => sum + Number(item.totalRooms || 0), 0);
        const occupiedRooms = statsList.reduce((sum: number, item: any) => sum + Number(item.occupiedRooms || 0), 0);
        const vacantRooms = statsList.reduce((sum: number, item: any) => sum + Number(item.vacantRooms || 0), 0);
        const occupancyRate = totalRooms > 0 ? Number(((occupiedRooms / totalRooms) * 100).toFixed(2)) : 0;

        setDashboardStats({
          totalHotels: fetchedHotels.length,
          totalRooms,
          occupiedRooms,
          vacantRooms,
          occupancyRate,
        });
      } else {
        const [
          usersRes,
          roomsRes,
          bookingsRes,
          billsRes,
          invoicesRes,
          expensesRes,
          advancesRes,
          miscRes,
          vouchersRes,
          catsRes,
          menuRes,
          ordersRes,
          companiesRes,
          vendorsRes,
          roomBlocksRes,
          pettyCashRes,
          liabilitiesRes,
          statsRes,
        ] = await Promise.allSettled([
          api.get(`/users${consolidatedQp}`),
          api.get(`/rooms${consolidatedQp}`),
          api.get(`/bookings${consolidatedQp}`),
          api.get(`/bills${consolidatedQp}`),
          api.get(`/invoices${consolidatedQp}`),
          api.get(`/expenses${consolidatedQp}`),
          api.get(`/advances${consolidatedQp}`),
          api.get(`/misc-charges${consolidatedQp}`),
          api.get(`/vouchers${consolidatedQp}`),
          api.get(`/restaurant/categories${consolidatedQp}`),
          api.get(`/restaurant/menu${consolidatedQp}`),
          api.get(`/restaurant/orders${consolidatedQp}`),
          api.get(`/companies${consolidatedQp}`),
          api.get(`/vendors${consolidatedQp}`),
          api.get(`/room-blocks${consolidatedQp}`),
          api.get(`/petty-cash${consolidatedQp}`),
          api.get(`/liabilities${consolidatedQp}`),
          api.get(`/hotels${currentHotelId ? `/${currentHotelId}` : ""}/stats`),
        ]);

        if (usersRes.status === "fulfilled") setAppUsers(usersRes.value.data.data || []);
        if (roomsRes.status === "fulfilled") setRooms(roomsRes.value.data.data || []);
        if (bookingsRes.status === "fulfilled") setBookings(bookingsRes.value.data.data || []);
        if (billsRes.status === "fulfilled") setBills(billsRes.value.data.data || []);
        if (invoicesRes.status === "fulfilled") setInvoices(invoicesRes.value.data.data || []);
        if (expensesRes.status === "fulfilled") setExpenses(expensesRes.value.data.data || []);
        if (advancesRes.status === "fulfilled") setAdvances(advancesRes.value.data.data || []);
        if (miscRes.status === "fulfilled") setMiscCharges(miscRes.value.data.data || []);
        if (vouchersRes.status === "fulfilled") setVouchers(vouchersRes.value.data.data || []);
        if (catsRes.status === "fulfilled") setRestaurantCategories(catsRes.value.data.data || []);
        if (menuRes.status === "fulfilled") setRestaurantItems(menuRes.value.data.data || []);
        if (ordersRes.status === "fulfilled") setRestaurantOrders(ordersRes.value.data.data || []);
        if (companiesRes.status === "fulfilled") setCompanies(companiesRes.value.data.data || []);
        if (vendorsRes.status === "fulfilled") setVendors(vendorsRes.value.data.data || []);
        if (roomBlocksRes.status === "fulfilled") setRoomBlocks(roomBlocksRes.value.data.data || []);
        if (pettyCashRes.status === "fulfilled") setPettyCash(pettyCashRes.value.data.data || []);
        if (liabilitiesRes.status === "fulfilled") setLiabilities(liabilitiesRes.value.data.data || []);
        if (statsRes && (statsRes as any).status === "fulfilled") setDashboardStats((statsRes as any).value.data.data);
      }
    } catch (err: any) {
      if (!silent) setError(err.message || "Failed to load data");
      else console.error("Silent fetch error:", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [user, currentHotelId, hotels]);

  useEffect(() => {
    fetchAll();

    // Poll silently every 5 seconds to keep all clients perfectly synced
    const interval = setInterval(() => {
      fetchAll(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchAll]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    if (!currentHotelId) return;
    const exists = hotels.some((h) => h.id === currentHotelId);
    if (!exists) {
      setCurrentHotelId(null);
    }
  }, [user, currentHotelId, hotels, setCurrentHotelId]);

  // Boss Mode fix: On initial page load, `hotels` is empty when fetchAll first runs,
  // so isBossAdmin is incorrectly computed as false, and categories/menu are fetched
  // only for the user's own hotel. Once hotels are loaded and Boss Mode is detected,
  // trigger a silent re-fetch so all hotels' data is loaded for the dropdown.
  const bossModeFetchedRef = useRef(false);
  useEffect(() => {
    if (!user || hotels.length === 0) return;
    const currentUserHotel = hotels.find(h => h.id === currentHotelId);
    const isBossAdmin = user.role === "admin" || (currentUserHotel as any)?.posBossMode === true;
    if (isBossAdmin && !bossModeFetchedRef.current) {
      bossModeFetchedRef.current = true;
      fetchAll(true); // silent re-fetch with correct consolidated query
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotels]);

  // Apply Theme CSS Variables
  useEffect(() => {
    const root = document.documentElement;
    let sidebarBg = "#1F2937";
    let headerBg = "#ffffff";
    let accentColor = "#C6A75E";

    if (systemSettings) {
      sidebarBg = systemSettings.globalSidebarColor || sidebarBg;
      headerBg = systemSettings.globalHeaderColor || headerBg;
      accentColor = systemSettings.globalAccentColor || accentColor;
    }

    if (currentHotelId) {
      const activeHotel = hotels.find(h => h.id === currentHotelId);
      if (activeHotel && activeHotel.isCustomTheme) {
        sidebarBg = activeHotel.sidebarColor || sidebarBg;
        headerBg = activeHotel.headerColor || headerBg;
        accentColor = activeHotel.accentColor || accentColor;
      }
    }

    root.style.setProperty("--sidebar-bg", sidebarBg || "#1F2937");
    root.style.setProperty("--header-bg", headerBg || "#ffffff");
    root.style.setProperty("--accent-color", accentColor || "#C6A75E");
  }, [currentHotelId, hotels, systemSettings]);

  // ── SYSTEM SETTINGS ──────────────────────────────────────────────
  const updateSystemSettings = async (updates: Partial<SystemSettings>) => {
    const res = await api.put("/system-settings/theme", updates);
    setSystemSettings(res.data.data);
  };

  // ── COMPANIES ──────────────────────────────────────────────────
  const addCompany = async (company: Omit<Company, "id" | "hotelId" | "isActive" | "createdAt" | "updatedAt"> & { hotelId: string }) => {
    const res = await api.post("/companies", company);
    if (!res.data?.data) throw new Error("Invalid response");
    setCompanies((prev) => [...prev, res.data.data]);
    return res.data;
  };

  const updateCompany = async (id: string, updates: Partial<Company>) => {
    const res = await api.put(`/companies/${id}`, updates);
    if (!res.data?.data) throw new Error("Invalid response");
    setCompanies((prev) => prev.map((c) => (c.id === id ? res.data.data : c)));
  };

  const deleteCompany = async (id: string) => {
    await api.delete(`/companies/${id}`);
    setCompanies((prev) => prev.filter((c) => c.id !== id));
  };

  const toggleCompanyStatus = async (id: string) => {
    const res = await api.patch(`/companies/${id}/status`);
    if (!res.data?.data) throw new Error("Invalid response");
    setCompanies((prev) => prev.map((c) => (c.id === id ? res.data.data : c)));
  };

  // ── HOTELS ──────────────────────────────────────────────────────
  const addHotel = async (h: Omit<Hotel, "id" | "createdAt">): Promise<string> => {
    const res = await api.post("/hotels", h);
    const newHotel = res.data.data;
    setHotels((prev) => [...prev, newHotel]);
    await fetchAll(true); // Ensure dashboard stats update instantly
    return newHotel.id;
  };

  const updateHotel = async (id: string, updates: Partial<Hotel>) => {
    const res = await api.put(`/hotels/${id}`, updates);
    setHotels((prev) => prev.map((h) => (h.id === id ? res.data.data : h)));
    await fetchAll(true); // refresh stats and other data
  };

  const deleteHotel = async (id: string) => {
    await api.delete(`/hotels/${id}`);
    setHotels((prev) => prev.filter((h) => h.id !== id));
    await fetchAll(true); // silent refresh to update dashboard stats
  };

  const cloneHotelData = async (sourceId: string, targetId: string, options: CloneOptions) => {
    await api.post(`/hotels/${sourceId}/clone`, { targetHotelId: targetId, options });
    await fetchAll();
  };

  // ── USERS ────────────────────────────────────────────────────────
  const addUser = async (u: any) => {
    const res = await api.post("/users", u);
    setAppUsers((prev) => [...prev, res.data.data]);
    return res.data.data;
  };

  const updateUser = async (id: string, updates: any) => {
    const res = await api.put(`/users/${id}`, updates);
    setAppUsers((prev) => prev.map((u) => (u.id === id ? res.data.data : u)));
  };

  const deleteUser = async (id: string) => {
    await api.delete(`/users/${id}`);
    setAppUsers((prev) => prev.filter((u) => u.id !== id));
  };

  // ── ROOMS ────────────────────────────────────────────────────────
  const addRoom = async (r: any) => {
    const res = await api.post("/rooms", r);
    const newRoom = res.data.data;
    setRooms((prev) => [...prev, newRoom]);
    return newRoom;
  };

  const updateRoom = async (id: string, updates: Partial<Room>) => {
    if (updates.status) {
      const res = await api.patch(`/rooms/${id}/status`, { status: updates.status, ...updates });
      setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, ...res.data.data } : r)));
    } else {
      // Persist non-status field changes (basePrice, maxOccupancy, etc)
      try {
        const res = await api.put(`/rooms/${id}`, updates);
        setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, ...res.data.data } : r)));
      } catch {
        // Fallback: optimistic update if endpoint not available
        setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
      }
    }
  };

  const deleteRoom = async (id: string) => {
    await api.delete(`/rooms/${id}`);
    setRooms((prev) => prev.filter((r) => r.id !== id));
  };

  // ── BOOKINGS ─────────────────────────────────────────────────────
  const addBooking = async (b: any) => {
    const res = await api.post("/bookings/reservation", b);
    const newBooking = res.data.data;
    setBookings((prev) => [...prev, newBooking]);
    return newBooking;
  };

  const walkInCheckIn = async (data: any): Promise<{ booking: Booking; bill: Bill }> => {
    const res = await api.post("/bookings/walk-in", data);
    const { booking, bill } = res.data.data;
    await fetchAll();
    return { booking, bill };
  };

  const updateBooking = async (id: string, updates: Partial<Booking>) => {
    if (updates.status === "checked_in") {
      const res = await api.put(`/bookings/${id}/check-in`);
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...res.data.data } : b)));
      await fetchAll(); // refresh rooms and bills
    } else if (updates.status === "checked_out") {
      const res = await api.put(`/bookings/${id}/check-out`, { finalPayment: (updates as any).finalPayment });
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...res.data.booking } : b)));
      await fetchAll();
    } else {
      const res = await api.put(`/bookings/${id}`, updates);
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...res.data.data } : b)));
    }
  };

  // ── BILLS ────────────────────────────────────────────────────────
  const addBill = async (bill: any) => {
    const res = await api.post("/bills", bill);
    const newBill = res.data.data;
    setBills((prev) => [...prev, newBill]);
    return newBill;
  };

  const updateBill = async (id: string, updates: Partial<Bill>) => {
    const res = await api.put(`/bills/${id}`, updates);
    setBills((prev) => prev.map((b) => (b.id === id ? res.data.data : b)));
  };

  // ── INVOICES ─────────────────────────────────────────────────────
  const addInvoice = async (inv: any) => {
    const res = await api.post("/invoices", inv);
    const newInvoice = res.data.data;
    setInvoices((prev) => {
      const existing = prev.find((invoice) => invoice.id === newInvoice.id);
      if (existing) {
        return prev.map((invoice) => (invoice.id === newInvoice.id ? newInvoice : invoice));
      }
      return [newInvoice, ...prev];
    });

    try {
      await fetchAll(true);
    } catch (error) {
      console.error("Invoice generated but refresh failed:", error);
    }

    return newInvoice;
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    if (updates.status) {
      const res = await api.patch(`/invoices/${id}/status`, { status: updates.status });
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? res.data.data : inv)));
    }
  };

  const payInvoice = async (id: string, paymentMode: string) => {
    const res = await api.post(`/invoices/${id}/pay`, { paymentMode });
    await fetchAll(); // Sync bills, invoices and advances
    return res.data.data;
  };

  // ── EXPENSES ─────────────────────────────────────────────────────
  const addExpense = async (exp: any) => {
    const res = await api.post("/expenses", exp);
    const newExpense = res.data.data;
    setExpenses((prev) => [...prev, newExpense]);
    return newExpense;
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    const res = await api.put(`/expenses/${id}`, updates);
    setExpenses((prev) => prev.map((e) => (e.id === id ? res.data.data : e)));
  };

  const deleteExpense = async (id: string) => {
    await api.delete(`/expenses/${id}`);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // ── ADVANCES ─────────────────────────────────────────────────────
  const addAdvance = async (adv: any) => {
    const res = await api.post("/advances", adv);
    const newAdvance = res.data.data;
    setAdvances((prev) => [...prev, newAdvance]);
    return newAdvance;
  };

  const updateAdvance = async (id: string, updates: Partial<AdvancePayment>) => {
    const res = await api.put(`/advances/${id}`, updates);
    setAdvances((prev) => prev.map((a) => (a.id === id ? res.data.data : a)));
  };

  // ── MISC CHARGES ─────────────────────────────────────────────────
  const addMiscCharge = async (mc: any) => {
    const res = await api.post("/misc-charges", mc);
    const newMiscCharge = res.data.data;
    setMiscCharges((prev) => [...prev, newMiscCharge]);
    return newMiscCharge;
  };

  const updateMiscCharge = async (id: string, updates: Partial<MiscCharge>) => {
    const res = await api.put(`/misc-charges/${id}`, updates);
    setMiscCharges((prev) => prev.map((m) => (m.id === id ? res.data.data : m)));
  };

  const deleteMiscCharge = async (id: string) => {
    await api.delete(`/misc-charges/${id}`);
    setMiscCharges((prev) => prev.filter((m) => m.id !== id));
  };

  // ── VOUCHERS ─────────────────────────────────────────────────────
  const addVoucher = async (v: any) => {
    const res = await api.post("/vouchers", v);
    const newVoucher = res.data.data;
    setVouchers((prev) => [...prev, newVoucher]);
    return newVoucher;
  };

  const updateVoucher = async (id: string, updates: Partial<PaymentVoucher>) => {
    const res = await api.put(`/vouchers/${id}`, updates);
    setVouchers((prev) => prev.map((v) => (v.id === id ? res.data.data : v)));
  };

  const deleteVoucher = async (id: string) => {
    await api.delete(`/vouchers/${id}`);
    setVouchers((prev) => prev.filter((v) => v.id !== id));
  };

  // ── RESTAURANT CATEGORIES ────────────────────────────────────────
  const addCategory = async (cat: any) => {
    const res = await api.post("/restaurant/categories", cat);
    setRestaurantCategories((prev) => [...prev, res.data.data]);
    return res.data.data;
  };

  const updateCategory = async (id: string, updates: Partial<RestaurantCategory>) => {
    const res = await api.put(`/restaurant/categories/${id}`, updates);
    setRestaurantCategories((prev) => prev.map((c) => (c.id === id ? res.data.data : c)));
  };

  const deleteCategory = async (id: string) => {
    await api.delete(`/restaurant/categories/${id}`);
    setRestaurantCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // ── RESTAURANT ITEMS ─────────────────────────────────────────────
  const addItem = async (item: any) => {
    const res = await api.post("/restaurant/menu", item);
    setRestaurantItems((prev) => [...prev, res.data.data]);
    return res.data.data;
  };

  const updateItem = async (id: string, updates: Partial<RestaurantItem>) => {
    const res = await api.put(`/restaurant/menu/${id}`, updates);
    setRestaurantItems((prev) => prev.map((i) => (i.id === id ? res.data.data : i)));
  };

  const deleteItem = async (id: string) => {
    await api.delete(`/restaurant/menu/${id}`);
    setRestaurantItems((prev) => prev.filter((i) => i.id !== id));
  };

  // ── RESTAURANT ORDERS ─────────────────────────────────────────────
  const addOrder = async (order: any) => {
    const res = await api.post("/restaurant/orders", order);
    setRestaurantOrders((prev) => [...prev, res.data.data]);
    return res.data.data;
  };

  const updateOrder = async (id: string, updates: any) => {
    const res = await api.put(`/restaurant/orders/${id}`, updates);
    setRestaurantOrders((prev) => prev.map((o) => (o.id === id ? res.data.data : o)));
  };

  const generateOrderInvoice = async (id: string, hotelId?: string) => {
    const config = hotelId ? { headers: { 'X-Hotel-ID': hotelId } } : {};
    const res = await api.post(`/restaurant/orders/${id}/invoice`, {}, config);
    await fetchAll(true);
    return res.data.data;
  };

  const generateKOTAndInvoice = async (id: string, hotelId?: string) => {
    const config = hotelId ? { headers: { 'X-Hotel-ID': hotelId } } : {};
    const res = await api.post(`/restaurant/orders/${id}/kot`, {}, config);
    await fetchAll(true);
    return res.data.data;
  };

  const payRestaurantInvoice = async (id: string, paymentMethod: string) => {
    const res = await api.post(`/restaurant/invoices/${id}/pay`, { paymentMethod });
    await fetchAll(true);
    return res.data.data;
  };

  const getCheckedInRooms = async (hotelId?: string) => {
    const response = await api.get(`/restaurant/checked-in-rooms`, {
      params: { hotelId },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  };

  const getKOTs = async (status?: string) => {
    const qp = status ? `?status=${status}` : "";
    const res = await api.get(`/restaurant/kots${qp}`);
    return res.data.data;
  };

  const updateKOT = async (id: string, updates: any) => {
    await api.put(`/restaurant/kots/${id}`, updates);
    await fetchAll(true);
  };

  const deleteKOT = async (id: string) => {
    await api.delete(`/restaurant/kots/${id}`);
    await fetchAll(true);
  };

  const convertKOTToInvoice = async (kotId: string, hotelId?: string) => {
    try {
      setIsLoading(true);
      const headers: any = {};
      if (hotelId) headers["X-Hotel-ID"] = hotelId;

      const res = await api.post(`/restaurant/kots/${kotId}/convert`, {}, { headers });
      await fetchAll(true);
      return res.data.data;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ── RESTAURANT EXPENSES (stub — mapped to hotel expenses) ─────────
  const addRestaurantExpense = async (exp: any) => {
    await addExpense({ ...exp, category: "Restaurant" });
  };

  const updateRestaurantExpense = async (id: string, updates: any) => {
    await updateExpense(id, updates);
  };

  const deleteRestaurantExpense = async (id: string) => {
    await deleteExpense(id);
  };

  // ── VENDORS ──────────────────────────────────────────────────────
  const addVendor = async (v: any) => {
    const res = await api.post("/vendors", v);
    setVendors((prev) => [...prev, res.data.data]);
    return res.data.data;
  };

  const updateVendor = async (id: string, updates: Partial<Vendor>) => {
    const res = await api.patch(`/vendors/${id}`, updates);
    setVendors((prev) => prev.map((v) => (v.id === id ? res.data.data : v)));
  };

  const deleteVendor = async (id: string) => {
    await api.delete(`/vendors/${id}`);
    setVendors((prev) => prev.filter((v) => v.id !== id));
  };

  // ── ROOM BLOCKS ──────────────────────────────────────────────────
  const addRoomBlock = async (b: any) => {
    const res = await api.post("/room-blocks", b);
    setRoomBlocks((prev) => [...prev, res.data.data]);
    return res.data.data;
  };

  const updateRoomBlock = async (id: string, updates: Partial<RoomBlock>) => {
    const res = await api.patch(`/room-blocks/${id}`, updates);
    setRoomBlocks((prev) => prev.map((b) => (b.id === id ? res.data.data : b)));
  };

  const deleteRoomBlock = async (id: string) => {
    await api.delete(`/room-blocks/${id}`);
    setRoomBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  // ── PETTY CASH ───────────────────────────────────────────────────
  const addPettyCash = async (txn: any) => {
    const res = await api.post("/petty-cash", txn);
    setPettyCash((prev) => [...prev, res.data.data]);
    return res.data.data;
  };

  const deletePettyCash = async (id: string) => {
    await api.delete(`/petty-cash/${id}`);
    setPettyCash((prev) => prev.filter((t) => t.id !== id));
  };

  // ── LIABILITIES ─────────────────────────────────────────────────
  const addLiability = async (l: any) => {
    const res = await api.post("/liabilities", l);
    setLiabilities((prev) => [...prev, res.data.data]);
    return res.data.data;
  };

  const updateLiability = async (id: string, updates: Partial<Liability>) => {
    const res = await api.patch(`/liabilities/${id}`, updates);
    setLiabilities((prev) => prev.map((l) => (l.id === id ? res.data.data : l)));
  };

  const addLiabilityPayment = async (id: string, payment: any) => {
    const res = await api.post(`/liabilities/${id}/payments`, payment);
    setLiabilities((prev) => prev.map((l) => (l.id === id ? res.data.data : l)));
  };

  const deleteLiability = async (id: string) => {
    await api.delete(`/liabilities/${id}`);
    setLiabilities((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <PMSContext.Provider
      value={{
        isLoading,
        error,
        refreshAll: fetchAll,
        dashboardStats,
        systemSettings,
        updateSystemSettings,
        hotels,
        addHotel,
        updateHotel,
        deleteHotel,
        cloneHotelData,
        appUsers,
        addUser,
        updateUser,
        deleteUser,
        companies,
        addCompany,
        updateCompany,
        deleteCompany,
        toggleCompanyStatus,
        rooms,
        addRoom,
        updateRoom,
        deleteRoom,
        bookings,
        addBooking,
        walkInCheckIn,
        updateBooking,
        bills,
        addBill,
        updateBill,
        invoices,
        addInvoice,
        updateInvoice,
        payInvoice,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        advances,
        addAdvance,
        updateAdvance,
        miscCharges,
        addMiscCharge,
        updateMiscCharge,
        deleteMiscCharge,
        vouchers,
        addVoucher,
        updateVoucher,
        deleteVoucher,
        restaurantCategories,
        addCategory,
        updateCategory,
        deleteCategory,
        restaurantItems,
        addItem,
        updateItem,
        deleteItem,
        restaurantOrders,
        addOrder,
        updateOrder,
        generateOrderInvoice,
        generateKOTAndInvoice,
        payRestaurantInvoice,
        getCheckedInRooms,
        getKOTs,
        updateKOT,
        deleteKOT,
        convertKOTToInvoice,
        restaurantExpenses: expenses.filter((e) => e.category === "Restaurant"),
        addRestaurantExpense,
        updateRestaurantExpense,
        deleteRestaurantExpense,
        vendors,
        addVendor,
        updateVendor,
        deleteVendor,
        roomBlocks,
        addRoomBlock,
        updateRoomBlock,
        deleteRoomBlock,
        pettyCash,
        addPettyCash,
        deletePettyCash,
        liabilities,
        addLiability,
        updateLiability,
        addLiabilityPayment,
        deleteLiability,
      }}
    >
      {children}
    </PMSContext.Provider>
  );
}

export function usePMS() {
  const context = useContext(PMSContext);
  if (!context) throw new Error("usePMS must be used within PMSProvider");
  return context;
}
