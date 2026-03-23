import { createBrowserRouter, createHashRouter, useRouteError, isRouteErrorResponse, Navigate } from "react-router";
import { lazy, Suspense } from "react";
import { useAuth } from "./contexts/AuthContext";

// ── ERROR BOUNDARY ─────────────────────────────────────────────────────────
function ErrorBoundary() {
  const error = useRouteError();
  console.error("Router Error:", error);

  let errorMessage = "An unexpected error occurred.";
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorStatus = error.status;
    if (error.status === 404) {
      errorMessage = "The page you are looking for does not exist.";
    } else {
      errorMessage = error.statusText || error.data;
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900 p-4 font-inter">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-black">{errorStatus}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Oops! Something went wrong.</h1>
        <p className="text-slate-500 text-sm leading-relaxed">{errorMessage}</p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-2.5 bg-[#C6A75E] hover:bg-[#b09350] text-white rounded-lg font-semibold transition-colors shadow-sm w-full"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
import { LoginPage } from "./pages/LoginPage";
// HIDDEN - Next patch update
// import { RegisterPage } from "./pages/RegisterPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { HotelDashboard } from "./pages/HotelDashboard";
import { CheckIn } from "./pages/CheckIn";
import { CheckOut } from "./pages/CheckOut";
import { Reservations } from "./pages/Reservations";
import { RestaurantPOS } from "./pages/RestaurantPOS";
import { Reports } from "./pages/Reports";
import { UserManagement } from "./pages/UserManagement";
import { SuperAdminPanel } from "./pages/SuperAdminPanel";
import { Bills } from "./pages/Bills";
import { Invoices } from "./pages/Invoices";
import { Expenses } from "./pages/Expenses";
import { AdvancePayments } from "./pages/AdvancePayments";
import { MiscCharges } from "./pages/MiscCharges";
import { PaymentVouchers } from "./pages/PaymentVouchers";
import { HotelManagement } from "./pages/HotelManagement";
import { Settings } from "./pages/Settings";
import { DayClosingPage } from "./pages/DayClosingPage";
import { StewardManagement } from "./pages/StewardManagement";
import { ServiceChargeReport } from "./pages/ServiceChargeReport";
import { RestaurantDayClosingPage } from "./pages/RestaurantDayClosingPage";

// ── GST REPORT PAGES ───────────────────────────────────────────────────────
import { GstSummaryReport } from "./pages/gst/GstSummaryReport";
import { RoomGstReport } from "./pages/gst/RoomGstReport";
import { RestaurantGstReport } from "./pages/gst/RestaurantGstReport";
import { MiscGstReport } from "./pages/gst/MiscGstReport";
import { InvoiceWiseGstReport } from "./pages/gst/InvoiceWiseGstReport";
import { SacHsnReport } from "./pages/gst/SacHsnReport";

// ── NEW ADMIN MODULE PAGES ─────────────────────────────────────────────────
import { TodaysView } from "./pages/TodaysView";
import { CheckInRecordsPage } from "./pages/CheckInRecordsPage";
import { BookingsPage } from "./pages/BookingsPage";
import { GuestsPage } from "./pages/GuestsPage";
import { CompaniesPage } from "./pages/CompaniesPage";
import { VendorsPage } from "./pages/VendorsPage";
import { LiabilitiesPage } from "./pages/LiabilitiesPage";
import { RoomBlockingPage } from "./pages/RoomBlockingPage";
import { PettyCashPage } from "./pages/PettyCashPage";
import { SystemPage } from "./pages/SystemPage";
import { AppearanceSettings } from "./pages/AppearanceSettings";
import { BrandingSettingsPage } from "./pages/BrandingSettingsPage";
import { LicenseManagement } from "./pages/LicenseManagement";
import { LicenseActivation } from "./pages/LicenseActivation";

const RestaurantMenu = lazy(() => import("./pages/RestaurantMenu").then(m => ({ default: m.RestaurantMenu })));
const RestaurantInvoices = lazy(() => import("./pages/RestaurantInvoices"));
const EditRestaurantInvoice = lazy(() => import("./pages/EditRestaurantInvoice"));
const RestaurantKOTs = lazy(() => import("./pages/RestaurantKOTs"));
const EditRestaurantKOT = lazy(() => import("./pages/EditRestaurantKOT"));
const RoomKOTWall = lazy(() => import("./pages/RoomKOTWall"));
const RoomManagement = lazy(() => import("./pages/RoomManagement").then(m => ({ default: m.RoomManagement })));
const RestaurantRoomSelector = lazy(() => import("./pages/RestaurantRoomSelector").then(m => ({ default: m.RestaurantRoomSelector })));

const withSuspense = (Component: any) => (props: any) => (
  <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
    <Component {...props} />
  </Suspense>
);

const SuspendedRestaurantMenu = withSuspense(RestaurantMenu);
const SuspendedRestaurantInvoices = withSuspense(RestaurantInvoices);
const SuspendedEditRestaurantInvoice = withSuspense(EditRestaurantInvoice);
const SuspendedRestaurantKOTs = withSuspense(RestaurantKOTs);
const SuspendedEditRestaurantKOT = withSuspense(EditRestaurantKOT);
const SuspendedRoomKOTWall = withSuspense(RoomKOTWall);
const SuspendedRoomManagement = withSuspense(RoomManagement);

const LICENSE_GATE_FLAG = "pms_license_gate_ready";

function getDefaultRouteForRole(role: string) {
  if (role === "super_admin" || role === "superadmin") return "/superadmin";
  if (role === "admin") return "/admin/dashboard";
  if (role === "hotel_manager") return "/hotel/dashboard";
  if (role === "hotel_staff") return "/hotel/dashboard";
  if (role === "restaurant_staff") return "/hotel/restaurant/rooms";
  return "/hotel/dashboard";
}

// Only admin/hotel_manager can access this page:
function ProtectedLicenseRoute({ children }: { children: JSX.Element }) {
  const { user, token, loading } = useAuth();
  const navigate = typeof window !== 'undefined' ? window.navigate || ((url: string) => { window.location.href = url; }) : () => {};

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#C6A75E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  // Only admin can access this page:
  if (user?.role !== 'admin') {
    return <Navigate to="/hotel/dashboard" />;
  }

  return children;
}

const routes = [
  {
    path: "/",
    Component: LoginPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/login",
    element: <Navigate to="/" replace />,
  },
  {
    path: "/register",
    element: <Navigate to="/" replace />,
    errorElement: <ErrorBoundary />,
  },
  // HIDDEN - Next patch update
  // {
  //   path: "/register",
  //   Component: RegisterPage,
  //   errorElement: <ErrorBoundary />,
  // },
  {
    path: "/superadmin",
    Component: SuperAdminPanel,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/licenses",
    Component: LicenseManagement,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/activate-license",
    element: (
      <ProtectedLicenseRoute>
        <LicenseActivation />
      </ProtectedLicenseRoute>
    ),
    errorElement: <ErrorBoundary />,
  },

  // ── ADMIN ROUTES ──────────────────────────────────────────────────────────

  // Core
  {
    path: "/admin",
    element: <Navigate to="/admin/dashboard" replace />,
  },
  {
    path: "/admin/dashboard",
    Component: AdminDashboard,
    errorElement: <ErrorBoundary />,
  },
  { path: "/admin/hotels", Component: HotelManagement },
  { path: "/admin/users", Component: UserManagement },
  { path: "/admin/reports", Component: Reports },
  { path: "/admin/settings", Component: Settings },
  { path: "/admin/day-closing", Component: DayClosingPage },

  // Hotel Management (existing)
  { path: "/admin/bills", Component: Bills },
  { path: "/admin/invoices", Component: Invoices },
  { path: "/admin/invoices/pending", Component: Invoices },
  { path: "/admin/expenses", Component: Expenses },
  { path: "/admin/advances", Component: AdvancePayments },
  { path: "/admin/misc-charges", Component: MiscCharges },
  { path: "/admin/misc/booking/new", Component: MiscCharges },
  { path: "/admin/misc/booking/records", Component: MiscCharges },
  { path: "/admin/misc/billing/new", Component: MiscCharges },
  { path: "/admin/vouchers", Component: PaymentVouchers },
  { path: "/admin/reservations", Component: Reservations },
  { path: "/admin/check-in", Component: CheckIn },
  { path: "/admin/checkout", Component: CheckOut },
  { path: "/admin/rooms", Component: SuspendedRoomManagement },

  // Restaurant
  { path: "/admin/restaurant/rooms", Component: withSuspense(RestaurantRoomSelector), errorElement: <ErrorBoundary /> },
  { path: "/admin/restaurant/pos", Component: RestaurantPOS, errorElement: <ErrorBoundary /> },
  { path: "/admin/restaurant/invoices", Component: SuspendedRestaurantInvoices, errorElement: <ErrorBoundary /> },
  { path: "/admin/restaurant/invoices/:id/edit", Component: SuspendedEditRestaurantInvoice, errorElement: <ErrorBoundary /> },
  { path: "/admin/restaurant/kots", Component: SuspendedRestaurantKOTs, errorElement: <ErrorBoundary /> },
  { path: "/admin/restaurant/kots/:id/edit", Component: SuspendedEditRestaurantKOT, errorElement: <ErrorBoundary /> },
  { path: "/admin/restaurant/kot-wall", Component: SuspendedRoomKOTWall, errorElement: <ErrorBoundary /> },
  { path: "/admin/restaurant/menu", Component: SuspendedRestaurantMenu, errorElement: <ErrorBoundary /> },
  { path: "/admin/restaurant/stewards", Component: StewardManagement, errorElement: <ErrorBoundary /> },
  { path: "/admin/restaurant/service-charge-report", Component: ServiceChargeReport, errorElement: <ErrorBoundary /> },
  { path: "/admin/restaurant/reports", Component: Reports, errorElement: <ErrorBoundary /> },
  { path: "/admin/restaurant/expenses", Component: Expenses, errorElement: <ErrorBoundary /> },
  { path: "/admin/restaurant/day-closing", Component: RestaurantDayClosingPage, errorElement: <ErrorBoundary /> },

  // GST Reports (Admin)
  { path: "/admin/gst/summary", Component: GstSummaryReport },
  { path: "/admin/gst/room", Component: RoomGstReport },
  { path: "/admin/gst/restaurant", Component: RestaurantGstReport },
  { path: "/admin/gst/misc", Component: MiscGstReport },
  { path: "/admin/gst/invoice-wise", Component: InvoiceWiseGstReport },
  { path: "/admin/gst/sac-hsn", Component: SacHsnReport },

  // TODAY'S (7 views via shared component)
  { path: "/admin/today/check-ins", Component: TodaysView },
  { path: "/admin/today/check-outs", Component: TodaysView },
  { path: "/admin/today/bookings", Component: TodaysView },
  { path: "/admin/today/invoices", Component: TodaysView },
  { path: "/admin/today/advances", Component: TodaysView },
  { path: "/admin/today/settlements", Component: TodaysView },
  { path: "/admin/today/payments", Component: TodaysView },

  // CHECK-IN RECORDS (3 views via shared component)
  { path: "/admin/checkins/all", Component: CheckInRecordsPage },
  { path: "/admin/checkins/no-invoice", Component: CheckInRecordsPage },
  { path: "/admin/checkins/cancelled", Component: CheckInRecordsPage },

  // OTHERS
  { path: "/admin/bookings/new", Component: BookingsPage },
  { path: "/admin/bookings/list", Component: BookingsPage },
  { path: "/admin/bookings/grid", Component: BookingsPage },
  { path: "/admin/bookings/chart", Component: BookingsPage },
  { path: "/admin/bookings/rates", Component: BookingsPage },

  { path: "/admin/guests", Component: GuestsPage },
  { path: "/admin/companies", Component: CompaniesPage },
  { path: "/admin/vendors", Component: VendorsPage },
  { path: "/admin/liabilities", Component: LiabilitiesPage },
  { path: "/admin/liabilities/new", Component: LiabilitiesPage },
  { path: "/admin/liabilities/pending", Component: LiabilitiesPage },
  { path: "/admin/liabilities/paid", Component: LiabilitiesPage },
  { path: "/admin/room-blocking", Component: RoomBlockingPage },
  { path: "/admin/petty-cash", Component: PettyCashPage },
  { path: "/admin/system/password", Component: SystemPage },
  { path: "/admin/system/features", Component: SystemPage },
  { path: "/admin/system/appearance", Component: AppearanceSettings },
  { path: "/admin/settings/branding", Component: BrandingSettingsPage },
  { path: "/admin/system/backup", Component: SystemPage },
  { path: "/admin/system/about", Component: SystemPage },

  // ── HOTEL ROUTES ──────────────────────────────────────────────────────────

  {
    path: "/hotel",
    element: <Navigate to="/hotel/dashboard" replace />,
  },
  { path: "/hotel/dashboard", Component: HotelDashboard },
  { path: "/hotel/check-in", Component: CheckIn },
  { path: "/hotel/checkout", Component: CheckOut },
  { path: "/hotel/reservations", Component: Reservations },
  { path: "/hotel/bills", Component: Bills },
  { path: "/hotel/invoices", Component: Invoices },
  { path: "/hotel/expenses", Component: Expenses },
  { path: "/hotel/advances", Component: AdvancePayments },
  { path: "/hotel/misc-charges", Component: MiscCharges },
  { path: "/hotel/vouchers", Component: PaymentVouchers },
  // Restaurant
  { path: "/hotel/restaurant/rooms", Component: withSuspense(RestaurantRoomSelector), errorElement: <ErrorBoundary /> },
  { path: "/hotel/restaurant/pos", Component: RestaurantPOS, errorElement: <ErrorBoundary /> },
  { path: "/hotel/restaurant/menu", Component: SuspendedRestaurantMenu, errorElement: <ErrorBoundary /> },
  { path: "/hotel/restaurant/invoices", Component: SuspendedRestaurantInvoices, errorElement: <ErrorBoundary /> },
  { path: "/hotel/restaurant/invoices/:id/edit", Component: SuspendedEditRestaurantInvoice, errorElement: <ErrorBoundary /> },
  { path: "/hotel/restaurant/kots", Component: SuspendedRestaurantKOTs, errorElement: <ErrorBoundary /> },
  { path: "/hotel/restaurant/kots/:id/edit", Component: SuspendedEditRestaurantKOT, errorElement: <ErrorBoundary /> },
  { path: "/hotel/restaurant/kot-wall", Component: SuspendedRoomKOTWall, errorElement: <ErrorBoundary /> },
  { path: "/hotel/restaurant/stewards", Component: StewardManagement, errorElement: <ErrorBoundary /> },
  { path: "/hotel/restaurant/service-charge-report", Component: ServiceChargeReport, errorElement: <ErrorBoundary /> },
  { path: "/hotel/restaurant/reports", Component: Reports, errorElement: <ErrorBoundary /> },
  { path: "/hotel/restaurant/expenses", Component: Expenses, errorElement: <ErrorBoundary /> },
  { path: "/hotel/restaurant/day-closing", Component: RestaurantDayClosingPage, errorElement: <ErrorBoundary /> },
  { path: "/hotel/rooms", Component: SuspendedRoomManagement },
  { path: "/hotel/bookings", Component: BookingsPage },
  { path: "/hotel/reports", Component: Reports },
  { path: "/hotel/settings", Component: Settings },
  { path: "/hotel/day-closing", Component: DayClosingPage },

  // GST Reports (Hotel)
  { path: "/hotel/gst/summary", Component: GstSummaryReport },
  { path: "/hotel/gst/room", Component: RoomGstReport },
  { path: "/hotel/gst/restaurant", Component: RestaurantGstReport },
  { path: "/hotel/gst/misc", Component: MiscGstReport },
  { path: "/hotel/gst/invoice-wise", Component: InvoiceWiseGstReport },
  { path: "/hotel/gst/sac-hsn", Component: SacHsnReport },
];

const isElectronRuntime = typeof window !== "undefined" && typeof window.electronAPI !== "undefined";

export const router = isElectronRuntime ? createHashRouter(routes) : createBrowserRouter(routes);

