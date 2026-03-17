import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS, Hotel, RestaurantOrder, RestaurantOrderItem as OrderItem } from "../contexts/PMSContext";
import { formatCurrency, formatDate } from "../utils/format";
import { printHtml } from "../utils/print";
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
    rooms,
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
  const [addItemSearch, setAddItemSearch] = useState("");
  const [addItemQty, setAddItemQty] = useState(1);
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
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
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [showOpenOrders, setShowOpenOrders] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showKOTPreview, setShowKOTPreview] = useState(false);
  const [kotToPreview, setKotToPreview] = useState<any>(null);
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [billToPreview, setBillToPreview] = useState<any>(null);

  // Fetch active rooms on mount or hotel change
  useEffect(() => {
    getCheckedInRooms(selectedHotelId).then(setCheckedInRooms).catch(console.error);
    if (activeHotel?.showAllRooms) {
      setAllRooms(rooms.filter(r => r.hotelId === selectedHotelId));
    }

    // Fetch stewards
    if (selectedHotelId) {
      api.get(`/stewards?hotelId=${selectedHotelId}`)
        .then(res => setStewards(res.data.data || []))
        .catch(console.error);
    } else {
      setStewards([]);
    }
  }, [selectedHotelId, getCheckedInRooms, activeHotel?.showAllRooms, rooms]);

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
    const availableRooms = activeHotel?.showAllRooms ? allRooms : checkedInRooms;
    
    if (passedRoomId && availableRooms.length > 0) {
      const selectedRoom = availableRooms.find(r => r.id === passedRoomId);
      if (selectedRoom) {
        const currentBooking = selectedRoom.bookings?.find((b: any) => b.status === "checked_in");
        
        setRoomId(selectedRoom.id);
        setRoomNumber(selectedRoom.roomNumber);
        setTableNumber(""); // Clear table if room selected
        
        if (currentBooking) {
          setBookingId(currentBooking.id);
          setGuestName(currentBooking.guest?.name || "");
        } else {
          setBookingId("");
          setGuestName(""); // Will default to "Walk-in" when saving order
        }

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
  }, [searchParams, checkedInRooms, allRooms, activeHotel?.showAllRooms, setSearchParams]);

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

  const addItemOptions = useMemo(() => {
    // Category filter is respected; text search is handled by browser datalist matching.
    const sourceItems = (isBossAdmin && bossMenuLoaded)
      ? localItems
      : restaurantItems.filter(i => i.hotelId === selectedHotelId && i.isAvailable);

    if (!activeCat) return sourceItems;
    return sourceItems.filter(i => i.categoryId === activeCat);
  }, [isBossAdmin, bossMenuLoaded, localItems, restaurantItems, selectedHotelId, activeCat]);

  const toAddItemLabel = (item: any) => `${String(item.id).slice(-6).toUpperCase()} - ${item.itemName}`;
  const toAddItemName = (item: any) => item.itemName;

  const filteredAddItemOptions = useMemo(() => {
    const q = addItemSearch.trim().toLowerCase();
    if (!q) return addItemOptions.slice(0, 25);
    return addItemOptions
      .filter((item) => toAddItemLabel(item).toLowerCase().includes(q))
      .slice(0, 25);
  }, [addItemOptions, addItemSearch]);

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

  const handleAddFromSearch = () => {
    const q = addItemSearch.trim().toLowerCase();
    const selected = addItemOptions.find((i) => {
      const byName = toAddItemName(i).toLowerCase() === q;
      const byLegacyLabel = toAddItemLabel(i).toLowerCase() === q;
      return byName || byLegacyLabel;
    });
    if (!selected) {
      toast.error("Select a valid item from the dropdown");
      return;
    }

    const qty = Math.max(1, Number(addItemQty) || 1);
    for (let i = 0; i < qty; i++) {
      addToCart(selected);
    }

    setAddItemSearch("");
    setAddItemQty(1);
    setShowItemSuggestions(false);
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
  const serviceCharge = subtotal * 0.10; // 10% Service Charge
  const total = subtotal + serviceCharge;

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
    setAddItemSearch("");
    setAddItemQty(1);
    setShowItemSuggestions(false);
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

    if (!selectedHotelId) {
      toast.error("Please select a hotel before generating KOT");
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
        stewardName: stewardName || user?.fullName || "Staff",
        stewardId: stewardId || undefined,
        tableNumber: tableNumber || undefined,
        roomId: roomId || undefined,
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
      totalAmount: total,
      invoiceDate: new Date().toISOString(),
      status: "draft"
    };

    setBillToPreview(draftInvoice);
    setShowBillPreview(true);
  };

  const handleConfirmGenerateBill = async (action: 'generate' | 'print' | 'send' | 'invoice') => {
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
          stewardName: stewardName || user?.fullName || "Staff",
          stewardId: stewardId || undefined,
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
        printThermalBill(invoice);
        setShowBillPreview(false);
        resetPOS();
      } else if (action === 'invoice') {
        printA4Invoice(invoice);
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
    } finally {
      setIsProcessing(false);
    }
  };

  const printThermalBill = (invoice: any) => {
        const thermalSubtotal = Number(invoice?.subtotal ?? subtotal ?? 0);
        const thermalService = thermalSubtotal * 0.10;
        const thermalNet = thermalSubtotal + thermalService;
        const getThermalHtml = () => `
        <html><head><title>Print Receipt</title>
        <style>
          @page { margin: 0; }
          body { 
            font-family: Arial, sans-serif;
            font-size: 12px;
            width: 80mm; 
            padding: 5mm; 
            margin: 0;
            color: #111;
            background: #fff;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          hr { border: 0; border-top: 1px solid #999; margin: 6px 0; }
          @media print { body { width: 80mm; } }
        </style></head><body>
          <div class="center bold">${activeHotel?.name || "HOTEL RESTAURANT"}</div>
          <div class="center">${activeHotel?.address || ""}</div>
          <div class="center bold" style="margin: 5px 0">INVOICE</div>
          <hr />
          <div>DATE: ${new Date(invoice.invoiceDate).toLocaleDateString()}</div>
          <div>BILL NO: ${invoice.invoiceNumber}</div>
          <div>TABLE: ${tableNumber || "N/A"}</div>
          <div>ROOM: ${roomNumber || "N/A"}</div>
          <div>STEWARD: ${stewardName || user?.fullName || "Staff"}</div>
          <hr />
          ${cart.map(i => `
            <div style="font-weight:bold">${i.itemName.toUpperCase()}</div>
            <div style="display:flex; justify-content:space-between">
              <span>${i.quantity} x ${i.price}</span>
              <span>${i.itemTotal}</span>
            </div>
          `).join("")}
          <hr />
          <div style="display:flex; justify-content:space-between">
            <span>SUBTOTAL:</span>
            <span>${thermalSubtotal.toFixed(2)}</span>
          </div>
          <div style="display:flex; justify-content:space-between">
            <span>SERVICE CHARGE (10%):</span>
            <span>${thermalService.toFixed(2)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-weight:bold">
            <span>NET PAYABLE:</span>
            <span>${thermalNet.toFixed(2)}</span>
          </div>
          <hr />
          <div class="center" style="margin-top:20px">*** THANK YOU ***</div>
        </body></html>
      `;

        printHtml(getThermalHtml());
    };

  const printThermalKOT = async (kot: any) => {
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
          stewardName: stewardName || user?.fullName || "Staff",
          stewardId: stewardId || undefined,
          items: cart.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
            specialNote: "", // Add specialNote if applicable
          })),
          paymentMethod: "cash", // Default for KOT, can be updated later
          status: "pending",
        };

        let orderIdToUse = activeOrderId;
        if (orderIdToUse) {
          await updateOrder(orderIdToUse, orderData);
        } else {
          const order = await addOrder(orderData) as any;
          if (!order?.id) throw new Error("Failed to create order");
          orderIdToUse = order.id;
          setActiveOrderId(orderIdToUse);
        }

        const res = await generateKOTAndInvoice(orderIdToUse as string, selectedHotelId);
        const generatedKot = (res as any)?.kot || res;

        if (generatedKot?.id && Array.isArray(generatedKot?.items)) {
          finalKot = generatedKot;
          toast.success(`KOT ${finalKot.kotNumber} generated!`);
        } else {
          throw new Error("Failed to generate KOT after order save.");
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
            <div style="font-size: 14px;"><strong>Order ID:</strong> ${finalKot.id.slice(-6).toUpperCase()}</div>
            <div class="center" style="margin-top: 10px;">** END OF KOT **</div>
            <div class="page-break"></div>
          </body>
        </html>
      `;

      printHtml(html);

      setShowKOTPreview(false);
      resetPOS();
      await refreshAll(true); // Refresh orders after KOT generation
    } catch (err: any) {
      console.error("Failed to print KOT:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to print KOT");
    } finally {
      setIsProcessing(false);
    }
  };

  const printA4Invoice = (invoice: any) => {
    const a4Subtotal = Number(invoice?.subtotal ?? subtotal ?? 0);
    const a4Service = a4Subtotal * 0.10;
    const a4Net = a4Subtotal + a4Service;
    const printTableNumber = invoice?.restaurantOrder?.tableNumber || tableNumber || "N/A";
    const printRoomNumber = invoice?.restaurantOrder?.room?.roomNumber || roomNumber || "N/A";
    const printSteward = invoice?.restaurantOrder?.stewardName || stewardName || user?.fullName || "Staff";
    const html = `<html><head><title>Invoice ${invoice.invoiceNumber}</title>
    <style>
    body{font-family: Arial, sans-serif; padding:28px; line-height:1.45; color:#000; background:#fff;}
    h1,h2,h3,p{margin:0;}
    hr{border:0;border-top:1px solid #999;margin:10px 0;}
    .header{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;}
    .header-left{display:flex;gap:10px;align-items:center;}
    .logo{width:44px;height:44px;object-fit:contain;}
    .meta{display:grid;grid-template-columns:1fr 1fr;gap:4px 28px;font-size:13px;}
    table{width:100%;border-collapse:collapse;margin:10px 0 12px 0;}
    th{font-weight:600;text-align:left;padding:6px 4px;border-bottom:1px solid #777;font-size:13px;}
    td{padding:7px 4px;font-size:13px;}
    .num{text-align:right;}
    .totals{max-width:320px;margin-left:auto;font-size:13px;}
    .row{display:flex;justify-content:space-between;padding:4px 0;}
    .net{font-weight:700;border-top:1px solid #777;padding-top:8px;margin-top:4px;}
    .footer{text-align:center;margin-top:16px;font-size:12px;}
    </style></head><body>
    <div class="header">
      <div class="header-left">
        ${activeHotel?.logoUrl ? `<img src="${activeHotel.logoUrl}" alt="logo" class="logo"/>` : ""}
        <div>
          <h2>${activeHotel?.name || "Restaurant"}</h2>
          <p>${activeHotel?.address || ""}</p>
        </div>
      </div>
      <div><strong>Restaurant Bill</strong></div>
    </div>
    <hr />
    <div class="meta">
      <div><strong>Bill No.:</strong> ${invoice.invoiceNumber}</div>
      <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
      <div><strong>Table:</strong> ${printTableNumber}</div>
      <div><strong>Room:</strong> ${printRoomNumber}</div>
      <div><strong>Steward:</strong> ${printSteward}</div>
    </div>
    <hr />
    <table>
        <thead><tr><th>Item Name</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead>
        <tbody>
            ${cart.map(i => `<tr><td>${i.itemName}</td><td class="num">${i.quantity}</td><td class="num">${formatCurrency(i.price)}</td><td class="num">${formatCurrency(i.itemTotal)}</td></tr>`).join("")}
        </tbody>
    </table>
    <hr />
    <div class="totals">
        <div class="row"><span>Subtotal</span><span>${formatCurrency(a4Subtotal)}</span></div>
        <div class="row"><span>Service Charge (10%)</span><span>${formatCurrency(a4Service)}</span></div>
        <div class="row net"><span>Net Payable</span><span>${formatCurrency(a4Net)}</span></div>
    </div>
    <div class="footer">Thank you for dining with us.</div>
    </body></html>`;
    printHtml(html);
  };

  return (
    <div className="flex flex-col h-screen bg-[#f0ece0] overflow-hidden text-[#222]" style={{ fontFamily: "Segoe UI, Tahoma, Arial, sans-serif" }}>
      <div className="px-4 py-2 border-b border-[#a9a9a9] bg-[#ece7d9] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => window.history.back()} className="h-8 w-8 border border-[#8d8d8d] bg-[#f7f5ee] flex items-center justify-center">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <div className="text-[15px] font-semibold">Restaurant Billing</div>
        </div>
        <button
          onClick={() => setShowOpenOrders(true)}
          className="h-8 px-3 border border-[#8d8d8d] bg-[#f7f5ee] text-[12px] font-medium flex items-center gap-2"
        >
          <LucideHistory className="w-4 h-4" />
          Open Orders {openOrders.length > 0 ? `(${openOrders.length})` : ""}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="border border-[#9f9f9f] bg-[#f8f5eb] p-3 space-y-3 min-h-full">
          <div className="space-y-0">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
              {(isBossAdmin || systemSettings?.enableRestaurantMultiHotel) && hotels.length > 0 && (
                <div>
                  <label className="block text-[11px] mb-1">Hotel</label>
                  <select
                    value={selectedHotelId}
                    onChange={(e) => {
                      setSelectedHotelId(e.target.value);
                      if (user?.role === "admin") {
                        setCurrentHotelId(e.target.value === "all" ? null : e.target.value);
                      }
                      setRoomId(null);
                      setBookingId(null);
                      setRoomNumber("");
                      setGuestName("");
                      setCart([]);
                    }}
                    className="w-full h-8 px-2 border border-[#8f8f8f] bg-white text-[12px]"
                  >
                    {hotels.map((h) => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] mb-1">Category</label>
                <select
                  value={selectedCategory || ""}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="w-full h-8 px-2 border border-[#8f8f8f] bg-white text-[12px]"
                >
                  <option value="">All Items</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] mb-1">Table No.</label>
                <input
                  type="text"
                  placeholder="Table"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full h-8 px-2 border border-[#8f8f8f] bg-white text-[12px]"
                />
              </div>

              <div>
                <label className="block text-[11px] mb-1">Room</label>
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

                    const roomsToSearch = activeHotel?.showAllRooms ? allRooms : checkedInRooms;
                    const room = roomsToSearch.find(r => r.id === rid);
                    if (room) {
                      const currentBooking = room.bookings?.find((b: any) => b.status === "checked_in") || checkedInRooms.find(cr => cr.id === room.id)?.bookings?.find((b: any) => b.status === "checked_in");
                      setRoomId(room.id);
                      setBookingId(currentBooking?.id || "");
                      setRoomNumber(room.roomNumber || "");
                      setGuestName(currentBooking?.guest?.name || "");
                    }
                  }}
                  className="w-full h-8 px-2 border border-[#8f8f8f] bg-white text-[12px]"
                >
                  <option value="">Select Room</option>
                  {(() => {
                    const roomsToDisplay = activeHotel?.showAllRooms ? allRooms : checkedInRooms;
                    return roomsToDisplay.map((r) => {
                      const currentBooking = r.bookings?.find((b: any) => b.status === "checked_in") || checkedInRooms.find(cr => cr.id === r.id)?.bookings?.find((b: any) => b.status === "checked_in");
                      const guestDisplay = currentBooking?.guest?.name || "Vacant";
                      return (
                        <option key={r.id} value={r.id}>
                          Room {r.roomNumber} - {guestDisplay}
                        </option>
                      );
                    });
                  })()}
                </select>
              </div>

              <div>
                <label className="block text-[11px] mb-1">Steward</label>
                <select
                  value={stewardId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setStewardId(id);
                    const s = stewards.find(st => st.id === id);
                    setStewardName(s?.name || "");
                  }}
                  className="w-full h-8 px-2 border border-[#8f8f8f] bg-white text-[12px]"
                >
                  <option value="">Select Steward</option>
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

            <div className="grid grid-cols-[1fr_96px_80px] gap-2 pt-0">
              <div>
                <label className="block text-[11px] mb-1">Search Item</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Select item"
                    value={addItemSearch}
                    onFocus={() => setShowItemSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowItemSuggestions(false), 120)}
                    onChange={(e) => {
                      setAddItemSearch(e.target.value);
                      setSearchQuery(e.target.value);
                      setShowItemSuggestions(true);
                    }}
                    className="w-full h-8 px-2 border border-[#8f8f8f] bg-[#ffffff] text-[12px] text-[#1a1a1a]"
                  />
                  {showItemSuggestions && filteredAddItemOptions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-20 max-h-56 overflow-auto border border-[#ccc] bg-[#ffffff] text-[#333]">
                      {filteredAddItemOptions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onMouseDown={() => {
                            setAddItemSearch(toAddItemName(item));
                            setSearchQuery(item.itemName);
                            setShowItemSuggestions(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-[12px] hover:bg-[#e8e4d4]"
                        >
                          {toAddItemName(item)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={addItemQty}
                  onChange={(e) => setAddItemQty(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full h-8 px-2 border border-[#8f8f8f] bg-white text-[12px]"
                />
              </div>

              <div>
                <label className="block text-[11px] mb-1">&nbsp;</label>
                <button
                  onClick={handleAddFromSearch}
                  className="w-full h-8 px-3 border border-[#8d8d8d] bg-[#f5f5f5] text-[12px]"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="border border-[#9e9e9e] bg-white">
              <div className="px-2 py-1 border-b border-[#b0b0b0] text-[12px] font-semibold bg-[#efefef] flex items-center justify-between">
                <span>List of Items Added</span>
                <button onClick={resetPOS} className="h-6 px-2 border border-[#8d8d8d] bg-[#f5f5f5] text-[11px]">Clear</button>
              </div>
              <div className="max-h-[320px] overflow-auto">
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="bg-[#f6f6f6]">
                      <th className="border border-[#c3c3c3] px-2 py-1 text-left">Item Code</th>
                      <th className="border border-[#c3c3c3] px-2 py-1 text-left">Item Name</th>
                      <th className="border border-[#c3c3c3] px-2 py-1 text-center">Quantity</th>
                      <th className="border border-[#c3c3c3] px-2 py-1 text-left">Unit</th>
                      <th className="border border-[#c3c3c3] px-2 py-1 text-left">Remarks</th>
                      <th className="border border-[#c3c3c3] px-2 py-1 text-right">Amount</th>
                      <th className="border border-[#c3c3c3] px-2 py-1 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.menuItemId}>
                        <td className="border border-[#d0d0d0] px-2 py-1">{String(item.menuItemId).slice(-6).toUpperCase()}</td>
                        <td className="border border-[#d0d0d0] px-2 py-1">{item.itemName}</td>
                        <td className="border border-[#d0d0d0] px-2 py-1 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button onClick={() => updateQuantity(item.menuItemId, -1)} className="h-6 w-6 border border-[#8d8d8d] bg-[#f5f5f5]">-</button>
                            <span className="min-w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.menuItemId, 1)} className="h-6 w-6 border border-[#8d8d8d] bg-[#f5f5f5]">+</button>
                          </div>
                        </td>
                        <td className="border border-[#d0d0d0] px-2 py-1">Nos</td>
                        <td className="border border-[#d0d0d0] px-2 py-1">-</td>
                        <td className="border border-[#d0d0d0] px-2 py-1 text-right">₹{Number(item.itemTotal).toFixed(2)}</td>
                        <td className="border border-[#d0d0d0] px-2 py-1 text-center">
                          <button onClick={() => removeFromCart(item.menuItemId)} className="h-6 px-2 border border-[#8d8d8d] bg-[#f5f5f5]">X</button>
                        </td>
                      </tr>
                    ))}
                    {cart.length === 0 && (
                      <tr>
                        <td colSpan={7} className="border border-[#d0d0d0] px-2 py-6 text-center text-[#777]">No items added</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#9f9f9f] bg-[#ece7d9] px-4 py-3">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-[12px]">
            <div><span className="text-[#555]">Items:</span> <strong>{totalQty}</strong></div>
            <div><span className="text-[#555]">Subtotal:</span> <strong>₹{subtotal.toFixed(2)}</strong></div>
            <div><span className="text-[#555]">Service:</span> <strong>₹{serviceCharge.toFixed(2)}</strong></div>
            <div><span className="text-[#555]">Discount:</span> <strong>₹{discount.toFixed(2)}</strong></div>
            <div className="md:col-span-2"><span className="text-[#555]">Net Payable:</span> <strong className="text-[14px]">₹{total.toFixed(2)}</strong></div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              disabled={isProcessing || cart.length === 0}
              onClick={handleGenerateKOT}
              className="h-9 px-4 border border-[#8d8d8d] bg-[#f5f5f5] text-[12px] font-semibold disabled:opacity-50"
            >
              Generate KOT
            </button>
            <button
              disabled={isProcessing || cart.length === 0}
              onClick={handlePreviewBill}
              className="h-9 px-4 border border-[#8d8d8d] bg-[#f5f5f5] text-[12px] font-semibold disabled:opacity-50"
            >
              Generate Bill
            </button>
            <button
              disabled={isProcessing || cart.length === 0}
              onClick={() => {
                handlePreviewBill();
              }}
              className="h-9 px-4 border border-[#8d8d8d] bg-[#f5f5f5] text-[12px] font-semibold disabled:opacity-50"
            >
              Generate Invoice
            </button>
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
                  <span>Service Charge (10%)</span>
                  <span className="font-bold">₹{(Number(subtotal) * 0.10).toFixed(2)}</span>
                </div>
                <div className="w-full h-px bg-[#e2e8f0] my-2"></div>
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>Grand Total</span>
                  <span>₹{(Number(subtotal) + Number(subtotal) * 0.10).toFixed(2)}</span>
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
