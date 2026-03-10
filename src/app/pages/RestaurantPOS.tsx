import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS, Hotel, RestaurantOrder, RestaurantOrderItem as OrderItem } from "../contexts/PMSContext";
import { formatCurrency } from "../utils/format";
import { toast } from "sonner";
import api from "../services/api";
import {
  ShoppingCart,
  Plus,
  Minus,
  Printer,
  Check,
  IndianRupee,
  X,
  Search,
  Users,
  UtensilsCrossed,
  History as LucideHistory,
  FileText,
  ChevronRight,
  Trash2,
  Tag,
  CreditCard,
  Banknote,
  Smartphone,
  Bed,
  RefreshCw,
  Send,
} from "lucide-react";

const GOLD = "var(--accent-color, #C6A75E)";
const DARKGOLD = "var(--primary, #A8832D)";

export function RestaurantPOS() {
  const { user, setCurrentHotelId } = useAuth();
  const {
    restaurantCategories,
    restaurantItems,
    restaurantOrders,
    addOrder,
    updateOrder,
    generateOrderInvoice,
    generateKOTAndInvoice,
    getCheckedInRooms,
    hotels,
    systemSettings,
    refreshAll,
  } = usePMS();
  const currentHotelId = user?.hotelId || "";
  const currentUserHotel = hotels.find(h => h.id === currentHotelId);
  const isPosBossMode = currentUserHotel?.posBossMode === true;
  const isBossAdmin = user?.role === "admin" || isPosBossMode;

  // Hotel context logic
  const [searchParams, setSearchParams] = useSearchParams();
  const HOTEL_STORAGE_KEY = `pos_selected_hotel_${user?.hotelId || user?.role || 'default'}`;

  // FIXED: Ensure non-admins always default to their assigned hotelId, 
  // and only use localStorage/searchParams if they are valid for the user.
  const getInitialHotelId = () => {
    const paramId = searchParams.get('hotelId');
    const storedId = localStorage.getItem(HOTEL_STORAGE_KEY);

    // If admin, we can use params or storage or first hotel
    if (user?.role === 'admin') {
      return paramId || storedId || (hotels[0]?.id || "");
    }

    // If not admin, we MUST stay within our authorized hotel unless Boss Mode is on
    // But even then, initial load should probably be the user's primary hotel
    return user?.hotelId || "";
  };

  const [selectedHotelId, setSelectedHotelId] = useState<string>(getInitialHotelId());

  // Safety check: ensure selectedHotelId is actually in the hotels list
  useEffect(() => {
    if (!hotels.length) return;

    const isAuthorized = hotels.some(h => h.id === selectedHotelId);
    if (!isAuthorized && !isBossAdmin) {
      // If not authorized and not boss admin, force to user's hotel
      setSelectedHotelId(user?.hotelId || "");
    } else if (!isAuthorized && isBossAdmin) {
      // If admin but hotel is missing (e.g. deleted), pick first available
      setSelectedHotelId(hotels[0]?.id || "");
    }
  }, [hotels, selectedHotelId, user?.hotelId, isBossAdmin]);

  // Auto-select first hotel for admin if none selected
  useEffect(() => {
    if (isBossAdmin && !selectedHotelId && hotels.length > 0) {
      setSelectedHotelId(hotels[0].id);
    }
  }, [hotels, isBossAdmin, selectedHotelId]);

  const activeHotel = hotels.find(h => h.id === selectedHotelId) as Hotel | undefined
    || { id: "", name: isBossAdmin ? "All Hotels (Consolidated)" : "Unknown Hotel" } as Hotel;


  // Persist selected hotel to localStorage on every change
  useEffect(() => {
    if (selectedHotelId) {
      localStorage.setItem(HOTEL_STORAGE_KEY, selectedHotelId);
    }
  }, [selectedHotelId, HOTEL_STORAGE_KEY]);

  // UI State
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [discount, setDiscount] = useState(0);
  const [kotNote, setKotNote] = useState("");

  // Customer/Order Details
  const [tableNumber, setTableNumber] = useState("");
  const [roomId, setRoomId] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [stewardName, setStewardName] = useState("");
  const [stewardId, setStewardId] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [stewards, setStewards] = useState<any[]>([]);

  // Data State
  const [checkedInRooms, setCheckedInRooms] = useState<any[]>([]);
  const [showOpenOrders, setShowOpenOrders] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showKOTPreview, setShowKOTPreview] = useState(false);
  const [kotToPreview, setKotToPreview] = useState<any>(null);
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [billToPreview, setBillToPreview] = useState<any>(null);

  // Fetch active rooms on mount or hotel change
  useEffect(() => {
    getCheckedInRooms(selectedHotelId).then(setCheckedInRooms).catch(console.error);

    // Fetch stewards
    if (selectedHotelId) {
      api.get(`/stewards?hotelId=${selectedHotelId}`)
        .then(res => setStewards(res.data.data || []))
        .catch(console.error);
    } else {
      setStewards([]);
    }
  }, [selectedHotelId, getCheckedInRooms]);

  // Boss Mode: fetch categories and menu items directly when hotel is switched
  const [localCategories, setLocalCategories] = useState<any[]>([]);
  const [localItems, setLocalItems] = useState<any[]>([]);
  const [bossMenuLoaded, setBossMenuLoaded] = useState(false);

  useEffect(() => {
    if (!isBossAdmin || !selectedHotelId) return;
    setBossMenuLoaded(false);
    Promise.all([
      api.get(`/restaurant/categories?hotelId=${selectedHotelId}`),
      api.get(`/restaurant/menu?hotelId=${selectedHotelId}`),
    ]).then(([catsRes, menuRes]) => {
      setLocalCategories((catsRes.data.data || []).filter((c: any) => c.isActive));
      setLocalItems((menuRes.data.data || []).filter((i: any) => i.isAvailable));
      setBossMenuLoaded(true);
    }).catch(console.error);
  }, [selectedHotelId, isBossAdmin]);

  // Use direct API data for Boss Mode, context data for normal mode
  // FIXED: Using a more robust filter and fallback
  const categories = useMemo(() => {
    if (isBossAdmin && bossMenuLoaded) return localCategories;

    // Normal mode or Boss Mode fallback
    return restaurantCategories.filter(c =>
      c.hotelId === selectedHotelId && c.isActive
    );
  }, [isBossAdmin, bossMenuLoaded, localCategories, restaurantCategories, selectedHotelId]);

  const activeCat = selectedCategory || null;

  // Room detection via search query parameters (redirected from RoomSelector page)
  useEffect(() => {
    const passedRoomId = searchParams.get('roomId');
    if (passedRoomId && checkedInRooms.length > 0) {
      const selectedRoom = checkedInRooms.find(r => r.id === passedRoomId);
      if (selectedRoom) {
        const currentBooking = selectedRoom.bookings?.find((b: any) => b.status === "checked_in");
        if (currentBooking) {
          setRoomId(selectedRoom.id);
          setBookingId(currentBooking.id);
          setRoomNumber(selectedRoom.roomNumber);
          setGuestName(currentBooking.guest?.name || "");
          setTableNumber(""); // Clear table if room selected

          // Remove roomId but keep hotelId so hotel remains selected
          setSearchParams(
            (prev) => {
              const newParams = new URLSearchParams(prev);
              newParams.delete('roomId');
              return newParams;
            },
            { replace: true }
          );
        }
      }
    }
  }, [searchParams, checkedInRooms, setSearchParams]);

  const filteredItems = useMemo(() => {
    // In Boss Mode, use directly-fetched items for the selected hotel
    // FIXED: Ensure we check against selectedHotelId even in normal mode
    const sourceItems = (isBossAdmin && bossMenuLoaded)
      ? localItems
      : restaurantItems.filter(i => i.hotelId === selectedHotelId && i.isAvailable);

    let items = sourceItems;
    if (activeCat && !searchQuery) {
      items = items.filter(i => i.categoryId === activeCat);
    }
    if (searchQuery) {
      items = items.filter(i => i.itemName.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return items;
  }, [restaurantItems, localItems, isBossAdmin, selectedHotelId, activeCat, searchQuery]);

  const openOrders = restaurantOrders.filter(
    (o) => o.hotelId === selectedHotelId && o.status !== "cancelled" && o.status !== "billed" && !o.invoicedAt
  );

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id
            ? {
              ...i,
              quantity: i.quantity + 1,
              itemTotal: (i.quantity + 1) * Number(item.price),
            }
            : i,
        );
      }
      return [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          orderId: "temp",
          menuItemId: item.id,
          itemName: item.itemName,
          quantity: 1,
          price: Number(item.price),
          itemTotal: Number(item.price),
        },
      ];
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.menuItemId === menuItemId) {
            const newQty = i.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...i,
              quantity: newQty,
              itemTotal: newQty * Number(i.price),
            };
          }
          return i;
        })
        .filter((i): i is any => i !== null)
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + Number(item.itemTotal), 0);
  const totalQty = cart.reduce((sum, item) => sum + Number(item.quantity), 0);
  const netSubtotal = Math.max(0, subtotal - discount);
  const gst = 0; // Removed GST from restaurant
  const serviceCharge = netSubtotal * 0.10; // 10% Service Charge
  const total = netSubtotal + gst + serviceCharge;

  const resetPOS = () => {
    setCart([]);
    setTableNumber("");
    setGuestName("");
    setRoomId(null); // Changed to null
    setRoomNumber("");
    setBookingId(null); // Changed to null
    setKotNote("");
    setDiscount(0);
    setSearchQuery("");
    setSelectedCategory(null);
    setActiveOrderId(null);
    setPaymentMethod("cash");
    setShowKOTPreview(false);
    setKotToPreview(null);
    setShowBillPreview(false);
    setBillToPreview(null);
  };

  const loadOrder = (order: any) => {
    setActiveOrderId(order.id);
    setCart(order.orderItems.map((oi: any) => ({
      menuItemId: oi.menuItemId,
      itemName: oi.menuItem.itemName,
      quantity: oi.quantity,
      price: Number(oi.price),
      itemTotal: Number(oi.itemTotal)
    })));
    setDiscount(Number(order.discount || 0));
    setTableNumber(order.tableNumber || "");
    setBookingId(order.bookingId || null);
    setGuestName(order.guestName || "");
    setStewardName(order.stewardName || "");
    if (order.booking?.room?.roomNumber) {
      setRoomNumber(order.booking.room.roomNumber);
    }
    setShowOpenOrders(false);
    toast.info(`Loaded order ${order.orderNumber}`);
  };

  const handleGenerateKOT = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    // Instead of saving to DB first, we show a preview of the DRAFT KOT
    const selectedRoom = checkedInRooms.find(r => r.id === roomId);

    const draftKOT = {
      id: "draft",
      kotNumber: "DRAFT",
      items: cart.map((item) => ({
        menuItemId: item.menuItemId, // Use menuItemId from cart
        itemName: item.itemName,
        quantity: item.quantity,
        price: item.price,
        specialNote: "", // Add specialNote if applicable
      })),
      order: {
        tableNumber,
        guestName,
        stewardName,
        room: selectedRoom ? { roomNumber: selectedRoom.roomNumber } : null,
      },
      printedAt: new Date().toISOString(),
    };

    setKotToPreview(draftKOT);
    setShowKOTPreview(true);
  };

  const handleSaveOrder = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      const orderData = {
        hotelId: selectedHotelId,
        items: cart,
        discount,
        guestName: guestName || "Walk-in",
        stewardName: stewardName || undefined,
        stewardId: stewardId || undefined,
        tableNumber: tableNumber || undefined,
        bookingId: bookingId || undefined,
        paymentMethod,
        status: "pending"
      };

      if (activeOrderId) {
        await updateOrder(activeOrderId, orderData);
        toast.success("Order updated successfully");
      } else {
        await addOrder(orderData);
        toast.success("Order created successfully");
      }
      resetPOS();
    } catch (e: any) {
      toast.error(e.message || "Failed to save order");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePreviewBill = () => {
    if (cart.length === 0) {
      toast.error("Add items to generate a bill");
      return;
    }

    // Create a draft preview
    const draftInvoice = {
      id: "draft",
      invoiceNumber: "DRAFT",
      subtotal,
      cgst: gst / 2,
      sgst: gst / 2,
      totalAmount: total,
      invoiceDate: new Date().toISOString(),
      status: "draft"
    };

    setBillToPreview(draftInvoice);
    setShowBillPreview(true);
  };

  const handleConfirmGenerateBill = async (action: 'generate' | 'print' | 'send' | 'invoice') => {
    // 1. Open window immediately to prevent popup blocker
    let printWindow: Window | null = null;
    if (action === 'print' || action === 'invoice') {
      printWindow = window.open("", "_blank", "width=800,height=600");
      if (!printWindow) {
        toast.error("Popup blocked! Please check your browser settings.");
        return;
      }
      printWindow.document.write("<html><body style='font-family:monospace;padding:20px;'>Generating Document...</body></html>");
    }

    try {
      setIsProcessing(true);
      let invoice = billToPreview;

      // If it's a draft, we need to finalize it first
      if (invoice?.id === "draft") {
        const orderData = {
          hotelId: selectedHotelId,
          items: cart,
          discount,
          guestName: guestName || "Walk-in",
          tableNumber: tableNumber || undefined,
          roomId: roomId || undefined,
          bookingId: bookingId || undefined,
          paymentMethod,
          status: "billed"
        };

        let currentId = activeOrderId;
        if (!currentId) {
          // Save as open order first if it doesn't exist
          const newlyCreatedOrder = await addOrder({ ...orderData, status: "pending" }) as any;
          if (!newlyCreatedOrder || !newlyCreatedOrder.id) throw new Error("Failed to create order");
          currentId = newlyCreatedOrder.id;
          setActiveOrderId(currentId);
        } else {
          await updateOrder(currentId, orderData);
        }

        invoice = await generateOrderInvoice(currentId!, selectedHotelId);
        setBillToPreview(invoice);
        toast.success(`Bill ${invoice.invoiceNumber} generated!`);
        await refreshAll(true);
      }

      if (action === 'print') {
        printThermalBill(invoice, printWindow);
        setShowBillPreview(false);
        resetPOS();
      } else if (action === 'invoice') {
        printA4Invoice(invoice, printWindow);
        setShowBillPreview(false);
        resetPOS();
      } else if (action === 'send') {
        toast.success("Bill sent successfully!");
        setShowBillPreview(false);
        resetPOS();
      } else {
        setShowBillPreview(false);
        resetPOS();
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.message || e.message || "Failed to generate bill");
      if (printWindow) printWindow.close();
    } finally {
      setIsProcessing(false);
    }
  };

  const printThermalBill = (invoice: any, existingWindow?: Window | null) => {
    const w = existingWindow || window.open("", "_blank", "width=400,height=600");
    if (!w) return;

    if (existingWindow) {
      w.document.open();
    }

    const receiptData = {
      hotelName: activeHotel?.name || "HOTEL RESTAURANT",
      address: activeHotel?.address || "Hotel Address Line 1",
      gstin: "27AAACH0000A1Z5", // Mock GSTIN
      items: cart.map(i => ({
        name: i.itemName,
        qty: i.quantity,
        rate: i.price,
        amt: i.itemTotal
      })),
      subtotal,
      gst,
      serviceCharge,
      total,
      billNo: invoice?.invoiceNumber || "NEW-BILL",
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      table: tableNumber || roomNumber || "POS-1",
      cashier: user?.fullName || "Admin"
    };

    const html = `<html><head><title>Print Receipt</title>
    <style>
      @page { margin: 0; }
      body { 
        font-family: monospace; 
        font-size: 11px; 
        width: 80mm; 
        padding: 5mm; 
        margin: 0;
        background: white;
        color: black;
      }
      .center { text-align: center; }
      .bold { font-weight: bold; }
      .divider { border-bottom: 1px dashed black; margin: 5px 0; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
      th, td { text-align: left; padding: 2px 0; vertical-align: top; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      .totals { font-size: 13px; margin-top: 5px; }
      .grand-total { font-size: 15px; font-weight: bold; margin-top: 5px; }
      .flex-between { display: flex; justify-content: space-between; margin-bottom: 2px; }
      @media print {
        body { width: 80mm; margin: 0; padding: 0; }
        .page-break { page-break-after: always; }
      }
    </style></head><body>
      <div class="center bold" style="font-size: 13px;">${receiptData.hotelName}</div>
      <div class="center">${receiptData.address}</div>
      <div class="center">GSTIN: ${receiptData.gstin}</div>
      <div class="center bold" style="margin: 5px 0; font-size: 13px;">TAX INVOICE</div>
      <div class="divider"></div>
      <div class="flex-between"><span>Date:</span> <span>${receiptData.date} ${receiptData.time}</span></div>
      <div class="flex-between"><span>Bill No:</span> <span>${receiptData.billNo}</span></div>
      <div class="flex-between"><span>Table/Room:</span> <span>${receiptData.table}</span></div>
      <div class="flex-between"><span>Steward:</span> <span>${stewardName || "N/A"}</span></div>
      <div class="divider"></div>
      <table>
        <thead>
          <tr>
            <th style="width: 45%">Item</th>
            <th class="text-center" style="width: 10%">Qty</th>
            <th class="text-right" style="width: 20%">Rate</th>
            <th class="text-right" style="width: 25%">Amt</th>
          </tr>
        </thead>
        <tbody>
          ${receiptData.items.map(i => `
            <tr>
              <td>${i.name}</td>
              <td class="text-center">${i.qty}</td>
              <td class="text-right">${Number(i.rate).toFixed(2)}</td>
              <td class="text-right">${Number(i.amt).toFixed(2)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <div class="divider"></div>
      <div class="totals flex-between"><span>Subtotal:</span> <span>${receiptData.subtotal.toFixed(2)}</span></div>
      ${discount > 0 ? `<div class="totals flex-between"><span>Discount:</span> <span>${discount.toFixed(2)}</span></div>` : ''}
      <div class="totals flex-between"><span>GST (5%):</span> <span>${receiptData.gst.toFixed(2)}</span></div>
      <div class="totals flex-between"><span>Service Charge (10%):</span> <span>${receiptData.serviceCharge.toFixed(2)}</span></div>
      <div class="divider"></div>
      <div class="grand-total flex-between"><span>GRAND TOTAL:</span> <span>${receiptData.total.toFixed(2)}</span></div>
      <div class="divider"></div>
      <div class="center" style="margin-top:10px">Thank you, visit again!</div>
      <div class="page-break"></div>
      <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
    </body></html>`;
    w.document.write(html);
    w.document.close();
    w.focus();
  };

  const printThermalKOT = async (kot: any) => {
    // 1. Open window immediately to prevent popup blocker
    const printWindow = window.open("", "_blank", "width=600,height=600");
    if (!printWindow) {
      toast.error("Popup blocked! Please check your browser settings.");
      return;
    }

    // Show a loading state in the print window
    printWindow.document.write("<html><body style='font-family:monospace;padding:20px;'>Generating KOT Slip...</body></html>");

    try {
      setIsProcessing(true); // Use isProcessing for saving/printing

      let finalKot = kot;
      const selectedRoom = checkedInRooms.find(r => r.id === roomId);

      // If it's a draft, we need to save the order and generate the real KOT first
      if (kot.id === "draft") {
        const orderData = {
          hotelId: selectedHotelId,
          bookingId: bookingId || null,
          roomId: roomId || null,
          tableNumber,
          guestName: guestName || "Walk-in",
          stewardName: stewardName || undefined,
          items: cart.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
            specialNote: "", // Add specialNote if applicable
          })),
          paymentMethod: "cash", // Default for KOT, can be updated later
          status: "pending",
        };

        const order = await addOrder(orderData) as any;
        if (!order?.id) throw new Error("Failed to create order");

        setActiveOrderId(order.id);
        const res = await generateKOTAndInvoice(order.id, selectedHotelId);
        if (res && res.kot) {
          finalKot = res.kot;
          toast.success(`KOT ${finalKot.kotNumber} generated!`);
        } else {
          throw new Error("Failed to generate KOT after order creation.");
        }
      } else {
        toast.success(`KOT ${finalKot.kotNumber} printed!`);
      }

      const html = `
        <html>
          <head>
            <title>KOT - ${finalKot.kotNumber}</title>
            <style>
              @page { margin: 0; }
              body { 
                font-family: monospace; 
                width: 80mm; 
                margin: 0;
                padding: 10px;
                font-size: 11px;
                color: black;
                background: white;
              }
              .center { text-align: center; }
              .bold { font-weight: bold; }
              .divider { border-bottom: 1px dashed black; margin: 5px 0; }
              table { width: 100%; border-collapse: collapse; }
              th, td { text-align: left; padding: 2px 0; vertical-align: top; }
              .text-right { text-align: right; }
              @media print {
                body { width: 80mm; margin: 0; padding: 0; }
                .page-break { page-break-after: always; }
              }
            </style>
          </head>
          <body>
            <div class="center bold" style="font-size: 13px;">${activeHotel?.name || "HOTEL RESTAURANT"}</div>
            <div class="center bold" style="font-size: 13px; margin: 5px 0;">KITCHEN ORDER TICKET</div>
            <div class="divider"></div>
            <div><strong>KOT No:</strong> ${finalKot.kotNumber}</div>
            <div><strong>Date:</strong> ${new Date(finalKot.printedAt).toLocaleString()}</div>
            <div><strong>Table:</strong> ${finalKot.order?.tableNumber || tableNumber || "N/A"}</div>
            ${finalKot.order?.room ? `<div><strong>Room:</strong> ${finalKot.order.room.roomNumber}</div>` : (roomNumber ? `<div><strong>Room:</strong> ${roomNumber}</div>` : "")}
            <div><strong>Steward:</strong> ${stewardName || user?.fullName || "Staff"}</div>
            <div class="divider"></div>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                ${finalKot.items.map((item: any) => `
                  <tr>
                    <td>${item.itemName}${item.specialNote ? `<br><i>* ${item.specialNote}</i>` : ''}</td>
                    <td class="text-right bold" style="font-size: 13px;">${item.quantity}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
            <div class="divider"></div>
            <div class="center" style="margin-top: 10px;">** END OF KOT **</div>
            <div class="page-break"></div>
            <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
          </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();

      setShowKOTPreview(false);
      resetPOS();
      await refreshAll(true); // Refresh orders after KOT generation
    } catch (err: any) {
      console.error("Failed to print KOT:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to print KOT");
      if (printWindow) printWindow.close();
    } finally {
      setIsProcessing(false);
    }
  };

  const printA4Invoice = (invoice: any, existingWindow?: Window | null) => {
    const w = existingWindow || window.open("", "_blank");
    if (!w) return;

    if (existingWindow) {
      w.document.open();
    }

    w.document.write(`<html><head><title>Invoice ${invoice.invoiceNumber}</title>
    <style>body{font-family: 'Inter', sans-serif; padding:40px; line-height:1.6; color: #1e293b;}
    .header{display:flex; justify-content:space-between; border-bottom:2px solid #C6A75E; padding-bottom:20px}
    table{width:100%; border-collapse:collapse; margin:20px 0}
    th,td{border:1px solid #e2e8f0; padding:12px; text-align:left}
    th{background:#f8fafc; font-weight: 600; font-size: 13px; text-transform: uppercase;}
    .totals{margin-left:auto; width:300px; padding-top: 20px;}
    .total-row{display:flex; justify-content:space-between; padding:5px 0; font-size: 14px;}
    .total-final{border-top: 2px solid #C6A75E; margin-top: 10px; padding-top: 10px; font-weight: bold; font-size: 18px; color: #C6A75E;}
    </style></head><body>
    <div class="header">
        <div><h1 style="color:#C6A75E; margin:0">TAX INVOICE</h1><p style="margin:5px 0">${invoice.invoiceNumber}</p></div>
        <div style="text-align:right"><h3 style="margin:0">${activeHotel?.name}</h3><p style="margin:5px 0; font-size:12px; color: #64748b;">${activeHotel?.address || ""}</p></div>
    </div>
    <div style="margin:40px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
        <div>
            <p style="text-transform:uppercase; font-size:10px; font-weight:bold; color:#64748b; margin-bottom:5px">Bill To</p>
            <p style="margin:0; font-weight:bold;">${guestName || "Walk-in Customer"}</p>
            ${roomNumber ? `<p style="margin:5px 0; color:#64748b;">Room No: ${roomNumber}</p>` : ""}
        </div>
        <div style="text-align:right">
            <p style="text-transform:uppercase; font-size:10px; font-weight:bold; color:#64748b; margin-bottom:5px">Details</p>
            <p style="margin:0;"><b>Date:</b> ${new Date().toLocaleDateString()}</p>
            ${tableNumber ? `<p style="margin:5px 0;"><b>Table:</b> ${tableNumber}</p>` : ""}
        </div>
    </div>
    <table>
        <thead><tr><th>Description</th><th>Rate</th><th>Qty</th><th>Amount</th></tr></thead>
        <tbody>
            ${cart.map(i => `<tr><td>${i.itemName}</td><td>${formatCurrency(i.price)}</td><td>${i.quantity}</td><td>${formatCurrency(i.itemTotal)}</td></tr>`).join("")}
        </tbody>
    </table>
    <div class="totals">
        <div className="total-row"><span>Subtotal</span><span>${formatCurrency(invoice.subtotal)}</span></div>
        <div className="total-row"><span>GST (${(Number(invoice.cgst) + Number(invoice.sgst)) > 0 ? '5%' : '0%'})</span><span>${formatCurrency(Number(invoice.cgst) + Number(invoice.sgst))}</span></div>
        <div className="total-row"><span>Service Charge (10%)</span><span>${formatCurrency(Number(invoice.totalAmount) - Number(invoice.subtotal) - (Number(invoice.cgst) + Number(invoice.sgst)))}</span></div>
        <div class="total-row total-final"><span>Total</span><span>${formatCurrency(invoice.totalAmount)}</span></div>
    </div>
    <div style="margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #64748b; text-align: center;">
        This is a computer generated document.
    </div>
    </body></html>`);
    w.document.close();
    w.setTimeout(() => { w.print(); }, 500);
  };

  return (
    <div className="flex flex-col h-screen bg-[#F3F4F6] overflow-hidden text-[#1F2937] font-inter">
      {/* PROFESSIONAL TOP NAV / HEADER */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between shadow-sm pr-36">
        <div className="flex items-center gap-4">
          <button onClick={() => window.history.back()} className="p-2 hover:bg-slate-50 rounded text-slate-400 transition-colors">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-[#C6A75E]" />
            <h1 className="text-xl font-semibold tracking-tight text-slate-800">Restaurant Billing</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 max-w-2xl flex-1 justify-end">
          <button onClick={() => setShowOpenOrders(true)} className="p-2 bg-slate-100 text-slate-500 rounded hover:bg-slate-200 transition-colors relative">
            <LucideHistory className="w-5 h-5" />
            {openOrders.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C6A75E] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {openOrders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden p-6 gap-6">
        {/* CENTER: Main POS Terminal */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          {/* Search Table & Category Tabs */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-4">
            {/* Search and POS Header Info */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search items by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#C6A75E] focus:border-[#C6A75E] transition-all"
                />
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Table No."
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#C6A75E] focus:border-[#C6A75E]"
                />

                <div className="relative w-48">
                  <select
                    value={roomId || ""}
                    onChange={(e) => {
                      const rid = e.target.value;
                      if (!rid) {
                        setRoomId(null);
                        setBookingId(null);
                        setRoomNumber("");
                        setGuestName("");
                        return;
                      }
                      const room = checkedInRooms.find(r => r.id === rid);
                      if (room) {
                        const currentBooking = room.bookings?.find((b: any) => b.status === "checked_in");
                        setRoomId(room.id);
                        setBookingId(currentBooking?.id || "");
                        setRoomNumber(room.roomNumber || "");
                        setGuestName(currentBooking?.guest?.name || "");
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#C6A75E] appearance-none"
                  >
                    <option value="">Select Room No</option>
                    {checkedInRooms.map((r) => {
                      const currentBooking = r.bookings?.find((b: any) => b.status === "checked_in");
                      return (
                        <option key={r.id} value={r.id}>
                          Room {r.roomNumber} - {currentBooking?.guest?.name || "Unknown Guest"}
                        </option>
                      );
                    })}
                  </select>
                  <Bed className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>

                {(isBossAdmin || systemSettings?.enableRestaurantMultiHotel) && hotels.length > 0 && (
                  <div className="relative w-40">
                    <select
                      value={selectedHotelId}
                      onChange={(e) => {
                        setSelectedHotelId(e.target.value);
                        if (user?.role === "admin") {
                          setCurrentHotelId(e.target.value === "all" ? null : e.target.value);
                        }
                        // Reset room selection when hotel changes
                        setRoomId(null);
                        setBookingId(null);
                        setRoomNumber("");
                        setGuestName("");
                        setCart([]);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#C6A75E] appearance-none pr-8 truncate"
                    >
                      {hotels.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                    <Tag className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                )}

                <div className="relative w-40">
                  <select
                    onChange={(e) => {
                      const id = e.target.value;
                      setStewardId(id);
                      const s = stewards.find(st => st.id === id);
                      setStewardName(s?.name || "");
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#C6A75E] appearance-none"
                  >
                    <option value="">Steward Name</option>
                    {stewards.length === 0 ? (
                      <option value="" disabled>No steward configured</option>
                    ) : (
                      stewards.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Category Navigation Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm border ${!selectedCategory ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
              >
                All Items
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm border ${activeCat === cat.id && selectedCategory !== null ? 'bg-[#C6A75E] border-[#C6A75E] text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

          </div>

          {/* Menu Items Grid */}
          <div className="flex-1 overflow-y-auto pr-2 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map(item => {
                const inCartQty = cart.find(i => i.menuItemId === item.id)?.quantity || 0;
                return (
                  <div
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className={`group relative bg-white p-4 rounded-lg border transition-all cursor-pointer flex flex-col gap-3 ${inCartQty > 0 ? 'border-[#C6A75E] ring-1 ring-[#C6A75E]/10' : 'border-slate-200 hover:border-slate-300 shadow-sm'}`}
                  >
                    <div className="absolute top-3 right-3 text-[#C6A75E] opacity-0 group-hover:opacity-100 transition-all">
                      <Plus className="w-5 h-5" />
                    </div>

                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-1 ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                      <h4 className="font-semibold text-slate-800 text-sm tracking-tight leading-tight">{item.itemName}</h4>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                      {item.description || "Delightful restaurant special preparation."}
                    </p>

                    <div className="flex justify-between items-center mt-auto pt-2">
                      <span className="text-base font-bold text-slate-900 font-tabular">₹{item.price}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.category?.name}</span>
                    </div>

                    {inCartQty > 0 && (
                      <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-[#C6A75E] text-white text-[10px] font-bold rounded shadow-sm">
                        {inCartQty}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {filteredItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 text-slate-300 border border-dashed border-slate-200 rounded-lg">
                <UtensilsCrossed className="w-12 h-12 mb-4 opacity-10" />
                <p className="text-sm font-medium">No items found in this category</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: PROFESSIONAL BILLING TERMINAL */}
        <div className="w-[400px] bg-white rounded-lg border border-slate-200 flex flex-col overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold text-sm text-slate-700">Current Order</h3>
            </div>
            <button onClick={resetPOS} className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-wider">
              Clear All
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.map(item => (
              <div key={item.menuItemId} className="flex flex-col gap-2 p-3 bg-white border border-slate-100 rounded">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-semibold text-slate-800 line-clamp-1">{item.itemName}</h4>
                  <span className="text-xs font-bold text-slate-900 shrink-0">₹{item.itemTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-slate-400 font-medium">₹{item.price} per unit</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateQuantity(item.menuItemId, -1)} className="w-6 h-6 flex items-center justify-center border border-slate-200 rounded text-slate-400 hover:text-red-500 hover:border-red-100 transition-all">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-slate-700 w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.menuItemId, 1)} className="w-6 h-6 flex items-center justify-center border border-slate-200 rounded text-slate-400 hover:text-[#C6A75E] hover:border-[#C6A75E] transition-all">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20 space-y-3">
                <ShoppingCart className="w-8 h-8 opacity-20" />
                <p className="text-xs font-medium uppercase tracking-widest opacity-60">Cart is empty</p>
              </div>
            )}
          </div>

          {/* Structured Totals Breakdown */}
          <div className="p-5 bg-slate-50 border-t border-slate-200">
            <div className="space-y-2 border-b border-slate-200 pb-4">
              <div className="flex justify-between items-center text-xs font-medium text-slate-500">
                <span>Subtotal</span>
                <span className="text-slate-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-medium text-slate-500">
                <span>GST (5%)</span>
                <span className="text-slate-900">₹{gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-medium text-slate-500">
                <span>Service Charge (10%)</span>
                <span className="text-slate-900">₹{serviceCharge.toFixed(2)}</span>
              </div>
            </div>

            <div className="py-4 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">Net Payable</span>
              <span className="text-xl font-bold text-[#C6A75E]">₹{total.toFixed(2)}</span>
            </div>

            <div className="space-y-2 pt-2">
              <button
                disabled={isProcessing || cart.length === 0}
                onClick={handlePreviewBill}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#C6A75E] text-white rounded text-sm font-bold transition-all disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                Generate Bill
              </button>
              <button
                disabled={isProcessing || cart.length === 0}
                onClick={() => {
                  handlePreviewBill();
                  // We'll use the same preview modal but the action will be different
                }}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-[#C6A75E] text-[#C6A75E] hover:bg-[#C6A75E]/5 rounded text-sm font-bold transition-all disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                Generate Invoice (A4)
              </button>
              <button
                disabled={isProcessing || cart.length === 0}
                onClick={handleGenerateKOT}
                className="w-full flex items-center justify-center gap-2 py-3 rounded text-sm font-bold transition-all disabled:opacity-50 text-white"
                style={{
                  background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`,
                  boxShadow: "0 2px 4px rgba(198, 167, 94, 0.2)"
                }}
              >
                <Plus className="w-4 h-4" />
                Generate KOT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Open Orders Terminal View */}
      {showOpenOrders && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in transition-all">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Active Sessions</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Manage pending settlements and active tables</p>
              </div>
              <button onClick={() => setShowOpenOrders(false)} className="p-2 hover:bg-slate-100 rounded transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              {openOrders.length === 0 && (
                <div className="py-20 text-center text-slate-300">
                  <p className="text-sm font-medium">No active sessions at the moment</p>
                </div>
              )}
              {openOrders.map(order => (
                <div key={order.id} className="flex items-center gap-4 p-4 rounded-lg border border-slate-100 hover:border-[#C6A75E] hover:bg-slate-50 transition-all group">
                  <div className="w-12 h-12 bg-slate-900 rounded flex flex-col items-center justify-center text-white">
                    <span className="text-[10px] font-bold opacity-50 uppercase">Tbl</span>
                    <span className="text-lg font-bold">#{order.tableNumber || "POS"}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 text-sm">{order.orderNumber}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Guest: {order.guestName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">₹{order.totalAmount}</p>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-bold uppercase tracking-wider">{order.status}</span>
                  </div>
                  <button
                    onClick={() => loadOrder(order)}
                    className="p-3 bg-slate-50 text-slate-400 rounded hover:bg-[#C6A75E] hover:text-white transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
              <button onClick={() => setShowOpenOrders(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">Close Panel</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KOT Professional Preview */}
      {showKOTPreview && kotToPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in transition-all">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 border border-slate-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">KOT Preview</h2>
                <p className="text-[10px] text-[#C6A75E] font-bold uppercase tracking-widest mt-1">Ready for Kitchen Production</p>
              </div>
              <button
                onClick={() => { setShowKOTPreview(false); }} // Only close, don't reset POS yet
                className="p-2 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* KOT Content area (Visual representation of the slip) */}
            <div className="p-8 bg-slate-50">
              <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-6 font-mono text-sm text-slate-700 space-y-4 max-h-[50vh] overflow-y-auto">
                <div className="text-center border-b border-dashed border-slate-200 pb-4">
                  <h3 className="font-bold text-lg text-slate-900">{activeHotel?.name || "HOTEL RESTAURANT"}</h3>
                  <div className="text-[11px] text-slate-400 mt-1 uppercase tracking-tighter">Kitchen Order Token</div>
                </div>

                <div className="grid grid-cols-2 gap-y-2 text-[12px]">
                  <div className="text-slate-400 uppercase font-bold tracking-tighter text-[10px]">KOT No</div>
                  <div className="text-right font-bold text-slate-900">{kotToPreview.kotNumber}</div>

                  <div className="text-slate-400 uppercase font-bold tracking-tighter text-[10px]">Date & Time</div>
                  <div className="text-right font-medium">{new Date(kotToPreview.printedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</div>

                  <div className="text-slate-400 uppercase font-bold tracking-tighter text-[10px]">Table No</div>
                  <div className="text-right font-bold text-slate-900">{kotToPreview.order?.tableNumber || tableNumber || "N/A"}</div>

                  {kotToPreview.order?.room?.roomNumber && (
                    <>
                      <div className="text-slate-400 uppercase font-bold tracking-tighter text-[10px]">Room No</div>
                      <div className="text-right font-bold text-slate-900">{kotToPreview.order.room.roomNumber}</div>
                    </>
                  )}

                  <div className="text-slate-400 uppercase font-bold tracking-tighter text-[10px]">Steward</div>
                  <div className="text-right font-medium">{stewardName || user?.fullName || "Staff"}</div>

                  <div className="text-slate-400 uppercase font-bold tracking-tighter text-[10px]">Order Type</div>
                  <div className="text-right font-bold text-[#C6A75E]">{kotToPreview.order?.room ? 'ROOM SERVICE' : 'DINE-IN'}</div>
                </div>

                <table className="w-full border-t border-b border-dashed border-slate-200 py-4 my-4">
                  <thead>
                    <tr className="text-[10px] text-slate-400 uppercase font-bold text-left">
                      <th className="py-2">Item Name</th>
                      <th className="py-2 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {kotToPreview.items.map((item: any, idx: number) => (
                      <tr key={idx} className="text-[13px]">
                        <td className="py-3 font-bold text-slate-800">
                          {item.itemName.toUpperCase()}
                          {item.specialNote && <div className="text-[10px] font-medium text-[#C6A75E] italic mt-0.5">* {item.specialNote}</div>}
                        </td>
                        <td className="py-3 text-right font-black text-lg">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="text-center text-[10px] text-slate-400 italic">
                  --- End of Order ---
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 bg-white border-t border-slate-100 flex gap-4">
              <button
                onClick={() => setShowKOTPreview(false)}
                className="flex-1 py-3 rounded-xl text-sm font-medium border transition-all"
                style={{
                  borderColor: "#e2e8f0", // Replaced T.border
                  color: DARKGOLD, // Replaced T.darkGold
                }}
              >
                Close
              </button>
              <button
                onClick={() => printThermalKOT(kotToPreview)}
                disabled={isProcessing}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-all flex items-center justify-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`, // Replaced T.gold, T.darkGold
                  opacity: isProcessing ? 0.7 : 1,
                }}
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                Print & Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Bill Preview */}
      {showBillPreview && billToPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#C6A75E] px-6 py-4 flex items-center justify-between text-white">
              <h2 className="text-xl font-bold">Generate Bill</h2>
              <button
                onClick={() => setShowBillPreview(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Bill Content Area */}
            <div className="flex-1 overflow-y-auto p-8 bg-white max-h-[70vh]">
              <div className="text-center mb-6">
                <h3 className="text-3xl font-bold text-[#1e293b] mb-2">{activeHotel?.name || "Grand Hotel Restaurant"}</h3>
                <p className="text-[#64748b] text-sm">{activeHotel?.address || "123 Main Street, Mumbai - 400001"}</p>
                <p className="text-[#64748b] text-sm">Phone: {activeHotel?.phone || "+91 22 1234 5678"} | GST: {activeHotel?.gstNumber || "27XXXXX1234X1ZX"}</p>
              </div>

              <div className="w-full h-px bg-[#C6A75E] mb-6"></div>

              <div className="grid grid-cols-2 gap-y-2 mb-8 text-[#1e293b]">
                <div className="flex"><span className="font-bold w-24">Bill No:</span> <span>{billToPreview.invoiceNumber}</span></div>
                <div className="flex"><span className="font-bold w-24">Room No:</span> <span>{roomNumber || "N/A"}</span></div>
                <div className="flex"><span className="font-bold w-24">Date & Time:</span> <span>{new Date().toLocaleString()}</span></div>
                <div className="flex"><span className="font-bold w-24">Table No:</span> <span>{tableNumber || "N/A"}</span></div>
                <div className="flex"><span className="font-bold w-24">Steward:</span> <span>{stewardName || "N/A"}</span></div>
                <div className="flex"><span className="font-bold w-24">Order Type:</span> <span>{roomId ? "Room Service" : "Dine-in"}</span></div>
              </div>

              <div className="border border-[#e2e8f0] rounded-xl overflow-hidden mb-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f8fafc] text-[#1e293b]">
                      <th className="py-3 px-4 font-bold border-b border-[#e2e8f0]">Item</th>
                      <th className="py-3 px-4 font-bold border-b border-[#e2e8f0]">Qty</th>
                      <th className="py-3 px-4 font-bold border-b border-[#e2e8f0]">Price</th>
                      <th className="py-3 px-4 font-bold border-b border-[#e2e8f0] text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item: any, idx: number) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"}>
                        <td className="py-3 px-4 text-[#1e293b]">{item.itemName}</td>
                        <td className="py-3 px-4 text-[#1e293b]">{item.quantity}</td>
                        <td className="py-3 px-4 text-[#1e293b]">₹{item.price}</td>
                        <td className="py-3 px-4 font-bold text-[#1e293b] text-right">₹{item.itemTotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 ms-auto w-1/2 min-w-[300px] text-[#1e293b]">
                <div className="flex justify-between items-center text-[15px]">
                  <span>Subtotal</span>
                  <span className="font-bold">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-[15px]">
                  <span>GST (0%)</span>
                  <span className="font-bold">₹0.00</span>
                </div>
                {serviceCharge > 0 && (
                  <div className="flex justify-between items-center text-[15px]">
                    <span>Service Charge (10%)</span>
                    <span className="font-bold">₹{serviceCharge.toFixed(2)}</span>
                  </div>
                )}
                <div className="w-full h-px bg-[#e2e8f0] my-2"></div>
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>Grand Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 bg-white border-t border-[#e2e8f0] flex flex-wrap gap-4">
              <button
                disabled={isProcessing}
                onClick={() => handleConfirmGenerateBill('generate')}
                className="flex-1 min-w-[120px] py-3 bg-[#C6A75E] hover:bg-[#A8832D] text-white rounded-lg font-bold text-base transition-colors disabled:opacity-70 flex justify-center items-center"
              >
                {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Confirm Order"}
              </button>
              <button
                disabled={isProcessing}
                onClick={() => handleConfirmGenerateBill('print')}
                className="flex-1 min-w-[120px] py-3 border-2 border-[#C6A75E] text-[#C6A75E] hover:bg-[#C6A75E]/5 rounded-lg font-bold text-base transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
                Thermal Bill
              </button>
              <button
                disabled={isProcessing}
                onClick={() => handleConfirmGenerateBill('invoice')}
                className="flex-1 min-w-[120px] py-3 border-2 border-slate-800 text-slate-800 hover:bg-slate-50 rounded-lg font-bold text-base transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
                A4 Invoice
              </button>
              <button
                disabled={isProcessing}
                onClick={() => handleConfirmGenerateBill('send')}
                className="flex-1 min-w-[120px] py-3 bg-[#C6A75E] hover:bg-[#A8832D] text-white rounded-lg font-bold text-base transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isProcessing ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
