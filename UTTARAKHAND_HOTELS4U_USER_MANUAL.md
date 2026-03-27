# UTTARAKHAND HOTELS4U - User Manual & Documentation

Welcome to the **UTTARAKHAND HOTELS4U**. This comprehensive guide covers everything from system overview to operational workflows for Hotel and Restaurant management.

---

## 1. System Overview

### What is UTTARAKHAND HOTELS4U?
UTTARAKHAND HOTELS4U is a multi-hotel management software designed to centralize operations for owners with multiple properties. It allows for seamless tracking of bookings, check-ins, billing, and restaurant sales across all connected hotels from a single interface.

### Key Features
*   **Multi-Hotel Management:** Manage multiple properties from one admin account.
*   **Room Operations:** Handle Reservations, Check-ins, and Checkouts with ease.
*   **Restaurant POS:** Integrated Point of Sale for restaurant orders, KOT (Kitchen Order Tickets), and billing.
*   **Billing & Invoicing:** Automated GST-compliant invoice generation for rooms and restaurant services.
*   **Role-Based Access:** Different access levels for Super Admin, Admin, and Restricted Restaurant Staff.
*   **Expenses & Petty Cash:** Track daily hotel and restaurant expenses.
*   **Comprehensive Reports:** Sales, Occupancy, GST (SAC/HSN), and financial summaries.

### Technology Stack
*   **Frontend:** React with TypeScript and Vite.
*   **Styling:** TailwindCSS with premium aesthetics.
*   **Desktop App:** Electron (packaged as .exe).
*   **Backend:** Node.js with Express.
*   **Database:** PostgreSQL with Prisma ORM.

### System Requirements
*   **Operating System:** Windows 10 or later.
*   **Memory (RAM):** 4GB minimum (8GB recommended).
*   **Internet:** Required for cloud-backend connectivity.
*   **Screen Resolution:** 1280x800 minimum for optimal UI layout.

---

## 2. User Roles & Access

| Role | Access Level | Key Capabilities |
| :--- | :--- | :--- |
| **Super Admin** | System Owner | Create Admins, Manage Licenses, Set Hotel Limits. |
| **Admin** | Hotel Owner/Manager | Full access to Hotel & Restaurant modules for assigned hotels. |
| **Hotel Staff** | Operational | Reservations, Check-in/out, Billing, Expenses. |
| **Restaurant Staff** | Restricted | Restaurant POS, KOTs, Menu Management, Restaurant GST Reports. |

---

## 3. Getting Started

### Installation
1.  Locate the `UTTARAKHAND_HOTELS4U_Setup.exe` file.
2.  Double-click to run the installer.
3.  Once installed, the application will launch automatically.
4.  (Optional) Pin the application icon to your Taskbar for quick access.

### First-Time Setup & Activation
1.  **Login:** Enter your credentials on the login screen.
2.  **Activation Gate:** If your license is not active, you will see the **Activate Your License** screen.
3.  **Enter Key:** Enter your 16-character license key (Format: `HTLS-XXXX-XXXX-XXXX-XXXX`).
4.  **Activate:** Click "Activate Software". Once validated, you will be redirected to your dashboard.

---

## 4. Super Admin Guide

Accessible via the **Super Admin Panel** (restricted to Super Admin role).

*   **Admin Management:** Add new Admin users, edit existing ones, or disable accounts.
*   **License Management:** View active devices, extend license validity, and monitor system usage.
*   **Limits:** Assign the maximum number of hotels an Admin can manage (Max Hotels limit).

---

## 5. Admin Guide (Hotel & System Configuration)

### Hotel Setup
1.  Go to **Hotel Management** → **Settings**.
2.  **Basic Info:** Enter Hotel Name, Address, Phone, Email, and GST Number.
3.  **Stay Policy:** Set standard Check-in and Check-out times.
4.  **Module Preferences:** Enable/Disable the Restaurant module or Financial Summary views.

### Room Management
*   Navigate to **Other Actions** → **Rooms**.
*   Add Room Numbers, Floors, and Room Types (AC, Non-AC, Deluxe).
*   Set Base Prices for each room type.

### Branding & Appearance
*   Go to **System** → **Branding** or **Appearance Settings**.
*   Upload Hotel Logos.
*   Customize Invoice Header lines (e.g., "A UNIT OF...") and colors to match your brand.

---

## 6. Hotel Operations Guide

### New Reservation
1.  Go to **Hotel Management** → **New Reservation**.
2.  Select dates and room type.
3.  Enter guest details and estimated amount.
4.  Save to view on the **Reservation Chart**.

### New Check-In (5-Step Wizard)
1.  **Type:** Choose "Walk-in" or "From Reservation".
2.  **Guest:** Enter Name, Phone, ID Proof, and select a Plan (EP/CP/AP/MAP).
3.  **Room:** Select an available (Vacant) room from the list.
4.  **Payment:** Review rates, nights, and enter an Advance Payment (if any).
5.  **Confirm:** Review all details and click "Confirm Check-In".

### Checkout Process
1.  Go to **Hotel Management** → **Checkout**.
2.  Select the Guest/Room from the list of checked-in rooms.
3.  Review the **Checkout Preview** (Total Room charges + Restaurant + Misc).
4.  Settle balance via Cash or UPI.
5.  Confirm to mark the room as "Cleaning" or "Vacant".

### Room Status Colors
*   🟢 **Green:** Vacant (Ready for Check-in).
*   🔴 **Red:** Occupied (Guest currently staying).
*   🟠 **Amber:** Cleaning (Being prepared for the next guest).
*   🟣 **Purple:** Maintenance (Under repair/Blocked).

---

## 7. Restaurant Operations Guide

### Restaurant POS (Point of Sale)
*   **Select Table/Room:** Select a physical table or a checked-in room for internal orders.
*   **Order Taking:** Click menu items to add to the cart. Search by Item Name or Code.
*   **KOT (Kitchen Order Ticket):** Generate and print KOTs for the kitchen staff.
*   **Billing:** Preview the bill and finalize it. Support for thermal (80mm) or A4 printouts.

### Menu Management
*   Add Categories (Starters, Main Course, Drinks).
*   Add Menu Items with pricing and GST rates.
*   Toggle item availability if a dish is out of stock.

---

## 8. Billing, Reports & Finance

### GST Reports (Admin)
*   **SAC/HSN Summary:** View service-wise GST breakdown (CGST/SGST/IGST). Includes a "Total GST" column.
*   **Room/Restaurant GST:** Specific reports for hotel and dining tax collections.
*   **Export:** All reports can be exported to CSV/Excel for accounting.

### Expense Management
*   Record daily cash outflows for Hotel or Restaurant supplies.
*   View the **Petty Cash Book** for an audit trail of miscellaneous spending.

---

## 9. Troubleshooting & FAQ

**Q: Tables or Rooms are not visible in Restaurant POS?**
**A:** Ensure you have selected the correct **Active Hotel** from the top-left dropdown. If "Show All Rooms" is disabled in settings, only occupied rooms will appear.

**Q: Total is showing 0.00 in GST report?**
**A:** This is usually due to a lack ofbilled data for the selected date range. Ensure invoices are finalized before checking reports.

**Q: How to reset a room from "Cleaning" to "Vacant"?**
**A:** Click the room card on the Dashboard and click the "MARK ROOM READY ✓" button.

---
**UTTARAKHAND HOTELS4U © 2026**
*Efficiency in Every Stay.*
