import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS, Hotel, RestaurantOrder, RestaurantOrderItem as OrderItem } from "../contexts/PMSContext";
import { formatCurrency, formatDate } from "../utils/format";
import { printHtml } from "../utils/print";
import { resolveLogoUrl, handleLogoImageError } from "../utils/branding";
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
const RECEIPT_DASH = "- - - - - - - - - - - - - -";

export function RestaurantPOS() {
  const navigate = useNavigate();
  const location = useLocation();
  const incomingRoomId = location.state?.roomId;
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
    restaurantTables,
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

    // Fixed: if a hotelId was explicitly passed via URL (e.g. from Room Selector clicking
    // a room on a different hotel), honour it. Otherwise fall back to user's own hotel.
    return paramId || user?.hotelId || "";
  };

  const [selectedHotelId, setSelectedHotelId] = useState<string>(getInitialHotelId());

  // Fixed: Restaurant Staff now gets all admin hotels (same as Boss Mode)
  const availableHotels = hotels;

  // Safety check: ensure selectedHotelId is actually in the hotels list
  useEffect(() => {
    if (!availableHotels.length) return;

    const isAuthorized = availableHotels.some(h => h.id === selectedHotelId);
    if (!isAuthorized && !isBossAdmin) {
      // If not authorized and not boss admin, force to user's hotel
      setSelectedHotelId(user?.hotelId || "");
    } else if (!isAuthorized && isBossAdmin) {
      // If admin but hotel is missing (e.g. deleted), pick first available
      setSelectedHotelId(availableHotels[0]?.id || "");
    }
  }, [availableHotels, selectedHotelId, user?.hotelId, isBossAdmin]);

  // Auto-select first hotel for admin if none selected
  useEffect(() => {
    if (isBossAdmin && !selectedHotelId && availableHotels.length > 0) {
      setSelectedHotelId(availableHotels[0].id);
    }
  }, [availableHotels, isBossAdmin, selectedHotelId]);

  const activeHotel = availableHotels.find(h => h.id === selectedHotelId) as Hotel | undefined
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
  const quantityInputRef = useRef<HTMLInputElement | null>(null);
  // Added: keyboard navigation for search dropdown
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [discount, setDiscount] = useState(0);
  const [kotNote, setKotNote] = useState("");
  const [mode, setMode] = useState<'create' | 'modify'>(location.state?.mode || 'create'); // Added: Modify KOT mode
  const [modifyingKotId, setModifyingKotId] = useState<string | null>(location.state?.kotId || null); // Added: Modify KOT mode

  // Customer/Order Details
  const [tableNumber, setTableNumber] = useState(location.state?.tableNumber || "");
  const [roomId, setRoomId] = useState(location.state?.roomId || "");
  const [bookingId, setBookingId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [stewardName, setStewardName] = useState("");
  const [stewardId, setStewardId] = useState("");
  const [roomNumber, setRoomNumber] = useState(location.state?.roomNumber || "");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [stewards, setStewards] = useState<any[]>([]);

  // Data State
  const [checkedInRooms, setCheckedInRooms] = useState<any[]>([]);
  const [allHotelsRooms, setAllHotelsRooms] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  // Fixed: derive allRooms from context (stable memo) instead of state set inside useEffect
  //        so that `rooms` reference churn doesn't trigger a re-fetch loop
  const allRooms = useMemo(
    () => rooms.filter((r: any) => r.hotelId === selectedHotelId),
    [rooms, selectedHotelId]
  );
  
  // Fixed: use selectedHotelId instead of loggedIn hotelId for stewards
  const stewardsToDisplay = useMemo(() => {
    return stewards.filter((s: any) => s.hotelId === selectedHotelId);
  }, [stewards, selectedHotelId]);

  const [showKOTPreview, setShowKOTPreview] = useState(false);
  const [kotToPreview, setKotToPreview] = useState<any>(null);
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [billToPreview, setBillToPreview] = useState<any>(null);

  const clearDraftForCleanedRoom = () => {
    setCart([]);
    setActiveOrderId(null);
    setKotNote("");
    setDiscount(0);
    setShowKOTPreview(false);
    setKotToPreview(null);
    setShowBillPreview(false);
    setBillToPreview(null);
  };

  // Used only to debounce duplicate calls within the same render cycle
  const isFetchingRoomsRef = useRef(false);

  // Fixed: re-fetch rooms when selectedHotel changes
  // Fixed: reset ref at effect entry so hotel switches always trigger a fresh fetch.
  //        Previously the ref could be true from a prior hotel's in-flight request,
  //        causing the new hotel's rooms to be silently skipped.
  useEffect(() => {
    // Reset so hotel changes are never blocked by a previous in-flight call
    isFetchingRoomsRef.current = false;

    if (isFetchingRoomsRef.current) {
      console.log('[DEBUG] Skipping duplicate room/steward fetch for hotel:', selectedHotelId);
      return; // guard: prevent duplicate calls in same tick
    }
    isFetchingRoomsRef.current = true;

    // Clear stale rooms immediately so dropdown shows "Select Room" for new hotel
    setCheckedInRooms([]);
    setAllHotelsRooms([]);
    
    // Only clear selection if we ARE NOT arriving from an explicit room navigation
    if (!location.state?.roomId && !location.state?.tableNumber) {
        setRoomId("");
        setRoomNumber("");
        setTableNumber("");
    }

    console.log('[DEBUG] Fetching checked-in rooms for hotel:', selectedHotelId);
    getCheckedInRooms(selectedHotelId)
      .then(data => {
        console.log('[DEBUG] Rooms fetch result for hotel', selectedHotelId, ':', data);
        setCheckedInRooms(data);
      })
      .catch(err => {
        console.error('[DEBUG] Error fetching rooms for hotel', selectedHotelId, err);
      })
      .finally(() => { isFetchingRoomsRef.current = false; });

    if (selectedHotelId) {
      api.get("/restaurant/rooms", { params: { hotelId: selectedHotelId } })
        .then(res => setAllHotelsRooms(res.data?.data || []))
        .catch(console.error);
    }

    // Fixed: use selectedHotelId instead of loggedIn hotelId — send X-Hotel-ID header
    // so the backend returns rooms for the selected hotel, not the logged-in user's hotel
    if (selectedHotelId) {
      console.log('[DEBUG] Fetching stewards for hotel:', selectedHotelId);
      api.get(`/stewards?hotelId=${selectedHotelId}`, {
        headers: { 'X-Hotel-ID': selectedHotelId }
      })
        .then(res => {
          console.log('[DEBUG] Stewards fetch result for hotel', selectedHotelId, ':', res.data.data);
          setStewards(res.data.data || []);
        })
        .catch(err => {
          console.error('[DEBUG] Error fetching stewards for hotel', selectedHotelId, err);
        });
    } else {
      console.log('[DEBUG] No hotel selected, clearing stewards');
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

  // Added: Modify KOT mode — pre-fill state when mode is 'modify'
  useEffect(() => {
    if (location.state?.mode === 'modify' && location.state.items) {
      setMode('modify');
      setModifyingKotId(location.state.kotId);
      setSelectedHotelId(location.state.hotelId);
      setTableNumber(location.state.tableNumber || "");
      setRoomId(location.state.roomId || null);
      setStewardId(location.state.stewardId || "");
      setStewardName(location.state.stewardName || "");
      setBookingId(location.state.bookingId || null);
      setGuestName(location.state.guestName || "");
      setCart(location.state.items);
    }
  }, [location.state]);

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
    const passedTableId = String(searchParams.get('tableId') || '').trim();
    const availableRooms = activeHotel?.showAllRooms ? allRooms : checkedInRooms;

    if (passedTableId) {
      setTableNumber(passedTableId);
      setRoomId(null as any);
      setRoomNumber('');
      setBookingId(null as any);
      setGuestName('');

      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.delete('tableId');
          return newParams;
        },
        { replace: true }
      );
      return;
    }

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

        const cleanedRaw = localStorage.getItem("restaurant_cleaned_rooms") || "[]";
        let cleanedRooms: string[] = [];
        try {
          const parsed = JSON.parse(cleanedRaw);
          cleanedRooms = Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
        } catch {
          cleanedRooms = [];
        }
        if (cleanedRooms.includes(selectedRoom.id)) {
          clearDraftForCleanedRoom();
          const updatedCleanedRooms = cleanedRooms.filter((id) => id !== selectedRoom.id);
          localStorage.setItem("restaurant_cleaned_rooms", JSON.stringify(updatedCleanedRooms));
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

  useEffect(() => {
    // Fixed: auto-select room passed from room card click
    const baseRooms = activeHotel?.showAllRooms ? (allHotelsRooms.length > 0 ? allHotelsRooms : allRooms) : checkedInRooms;
    const normalize = (id: any) => (id ? String(id).replace(/-/g, '').toLowerCase() : '');
    const normSelectedHotelId = normalize(selectedHotelId);
    const roomsToDisplay = baseRooms.filter(room => normalize(room.hotelId || selectedHotelId) === normSelectedHotelId);

    if (incomingRoomId && roomsToDisplay.length > 0 && !isFetchingRoomsRef.current) {
      const match = roomsToDisplay.find(r => r.id === incomingRoomId);
      if (match) {
        setRoomId(match.id);
        setRoomNumber(match.roomNumber || "");
        setTableNumber(""); // Clear table if room selected
        
        const currentBooking = match.bookings?.find((b: any) => b.status === "checked_in") || checkedInRooms.find(cr => cr.id === match.id)?.bookings?.find((b: any) => b.status === "checked_in");
        setBookingId(currentBooking?.id || "");
        setGuestName(currentBooking?.guest?.name || "");
        
        // Clear from location state to prevent forcing selection on subsequent renders
        navigate(location.pathname + location.search, { 
          replace: true, 
          state: { ...location.state, roomId: undefined } 
        });
      }
    }
  }, [incomingRoomId, checkedInRooms, allHotelsRooms, allRooms, activeHotel?.showAllRooms, selectedHotelId, location.pathname, location.search, location.state, navigate]);

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

  const addItemOptions = useMemo(() => {
    // Category filter is respected; text search is handled by browser datalist matching.
    const sourceItems = (isBossAdmin && bossMenuLoaded)
      ? localItems
      : restaurantItems.filter(i => i.hotelId === selectedHotelId && i.isAvailable);

    if (!activeCat) return sourceItems;
    return sourceItems.filter(i => i.categoryId === activeCat);
  }, [isBossAdmin, bossMenuLoaded, localItems, restaurantItems, selectedHotelId, activeCat]);

  const itemCodeMap = useMemo(() => {
    const sourceItems = (isBossAdmin && bossMenuLoaded)
      ? localItems
      : restaurantItems.filter(i => i.hotelId === selectedHotelId && i.isAvailable);

    const map: Record<string, number> = {};
    sourceItems.forEach((item, index) => {
      map[item.id] = 101 + index;
    });
    return map;
  }, [isBossAdmin, bossMenuLoaded, localItems, restaurantItems, selectedHotelId]);

  const getItemCode = (itemId: string) => itemCodeMap[itemId] ?? null;
  const toAddItemLabel = (item: any) => `${getItemCode(item.id) ?? ""} - ${item.itemName}`;
  const toAddItemName = (item: any) => item.itemName;

  const filteredAddItemOptions = useMemo(() => {
    const q = addItemSearch.trim().toLowerCase();
    if (!q) return addItemOptions.slice(0, 25);
    return addItemOptions
      .filter((item) => {
        const code = String(getItemCode(item.id) ?? "");
        const name = toAddItemName(item).toLowerCase();
        const label = toAddItemLabel(item).toLowerCase();
        return code.includes(q) || name.includes(q) || label.includes(q);
      })
      .slice(0, 25);
  }, [addItemOptions, addItemSearch, itemCodeMap]);

  // Added: keyboard navigation for search dropdown — reset highlight on query change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [addItemSearch]);

  // Added: keyboard navigation for search dropdown — auto-scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0) {
      const highlighted = document.querySelector(
        `[data-item-index="${highlightedIndex}"]`
      );
      highlighted?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const resolveAddItemFromQuery = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    return addItemOptions.find((i) => {
      const code = String(getItemCode(i.id) ?? "").toLowerCase();
      const name = toAddItemName(i).toLowerCase();
      const label = toAddItemLabel(i).toLowerCase();
      return code === q || name === q || label === q;
    }) || addItemOptions.find((i) => {
      const code = String(getItemCode(i.id) ?? "").toLowerCase();
      const name = toAddItemName(i).toLowerCase();
      const label = toAddItemLabel(i).toLowerCase();
      return code.includes(q) || name.includes(q) || label.includes(q);
    }) || null;
  };

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
    const selected = resolveAddItemFromQuery(addItemSearch);
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

  const formatReceiptDateTime = (value?: string) => {
    const dt = value ? new Date(value) : new Date();
    if (Number.isNaN(dt.getTime())) return "-";
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yy = String(dt.getFullYear()).slice(-2);
    const hh = String(dt.getHours()).padStart(2, "0");
    const min = String(dt.getMinutes()).padStart(2, "0");
    const ss = String(dt.getSeconds()).padStart(2, "0");
    return `${dd}-${mm}-${yy} ${hh}:${min}:${ss}`;
  };

  const formatKotDateTime = (value?: string) => {
    const dt = value ? new Date(value) : new Date();
    if (Number.isNaN(dt.getTime())) return "-";
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yy = String(dt.getFullYear()).slice(-2);
    const hh = String(dt.getHours()).padStart(2, "0");
    const min = String(dt.getMinutes()).padStart(2, "0");
    return `${dd}-${mm}-${yy} ${hh}:${min}`;
  };

  const splitAddressLines = (address?: string) => {
    const chunks = String(address || "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    return {
      line1: chunks[0] || "",
      line2: chunks[1] || "",
      cityState: chunks.slice(2).join(", ") || "",
    };
  };

  const formatReceiptItemLine = (itemName: string, qty: number, price: number, amount: number) => {
    const name = String(itemName || "").slice(0, 12).padEnd(12, " ");
    const qtyText = String(qty).padStart(3, " ");
    const priceText = price.toFixed(2).padStart(7, " ");
    const amountText = amount.toFixed(2).padStart(8, " ");
    return `${name}${qtyText}${priceText}${amountText}`;
  };

  const getReceiptItems = (invoice?: any) => {
    const orderItems = invoice?.restaurantOrder?.orderItems;
    if (Array.isArray(orderItems) && orderItems.length > 0) {
      return orderItems.map((item: any) => {
        const qty = Number(item.quantity || 0);
        const price = Number(item.price || 0);
        const amount = Number(item.itemTotal || qty * price);
        return {
          itemName: item.menuItem?.itemName || item.itemName || "Item",
          quantity: qty,
          price,
          amount,
        };
      });
    }

    return cart.map((item: any) => ({
      itemName: item.itemName || "Item",
      quantity: Number(item.quantity || 0),
      price: Number(item.price || 0),
      amount: Number(item.itemTotal || 0),
    }));
  };

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

  // Added: Modify KOT mode — handle existing KOT update
  const handleUpdateKOT = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (!modifyingKotId) {
      toast.error("KOT ID is missing. Cannot update.");
      return;
    }
    if (!selectedHotelId) {
      toast.error("Hotel context is missing");
      return;
    }
    setIsProcessing(true);
    try {
      // Changed: api.put instead of api.patch as PUT is already standard in the routes
      const response = await api.put(`/restaurant/kots/${modifyingKotId}`, {
        hotelId: selectedHotelId,
        tableNumber: tableNumber || undefined,
        roomId: roomId || undefined,
        stewardId: stewardId || undefined,
        stewardName: stewardName || undefined,
        bookingId: bookingId || undefined,
        guestName: guestName || undefined,
        items: cart.map(item => ({
          menuItemId: item.menuItemId,
          itemName: item.itemName,
          quantity: item.quantity,
          price: item.price,
          specialNote: item.specialNote || ""
        }))
      });

      const updatedKOT = response.data.data;
      toast.success("KOT updated successfully!");
      
      // Added: Modify KOT flow — show preview of the updated KOT with print option
      const selectedRoom = checkedInRooms.find(r => r.id === roomId);
      const previewData = {
        ...updatedKOT,
        items: updatedKOT.orderItems || updatedKOT.items,
        order: {
          tableNumber: updatedKOT.tableNumber || tableNumber,
          guestName: updatedKOT.guestName || guestName,
          stewardName: updatedKOT.stewardName || stewardName,
          room: selectedRoom ? { roomNumber: selectedRoom.roomNumber } : updatedKOT.order?.room,
        },
        printedAt: new Date().toISOString()
      };

      setKotToPreview(previewData);
      setShowKOTPreview(true);
      
      // Note: We don't navigate away yet so the user can see/print the preview.
      // They can navigate away manually after printing.
    } catch (e: any) {
      console.error("Failed to update KOT:", e);
      toast.error(e.response?.data?.message || e.message || "Failed to update KOT");
    } finally {
      setIsProcessing(false);
    }
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
        hotelId: selectedHotelId || currentHotelId, // Fixed: KOT now created under selectedHotelId not loggedIn hotelId
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
          hotelId: selectedHotelId || currentHotelId, // Fixed: KOT now created under selectedHotelId not loggedIn hotelId
          items: cart,
          discount,
          guestName: guestName || "Walk-in",
          stewardName: stewardName || user?.fullName || "Staff",
          stewardId: stewardId || undefined,
          tableNumber: tableNumber || undefined,
          roomId: roomId || undefined,
          bookingId: bookingId || undefined,
          paymentMethod,
        };

        let currentId = activeOrderId;
        if (!currentId) {
          // Save as open order first if it doesn't exist
          const newlyCreatedOrder = await addOrder({ ...orderData, status: "pending" }) as any;
          if (!newlyCreatedOrder || !newlyCreatedOrder.id) throw new Error("Failed to create order");
          currentId = newlyCreatedOrder.id;
          setActiveOrderId(currentId);
        } else {
          // Keep order editable/open; backend will mark it billed after invoice generation.
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
    const printTableNumber = invoice?.restaurantOrder?.tableNumber || tableNumber || "-";
    const printRoomNumber = invoice?.restaurantOrder?.room?.roomNumber || roomNumber || "";
    const printSteward = invoice?.restaurantOrder?.stewardName || stewardName || user?.fullName || "Staff";
    const addressLines = splitAddressLines(activeHotel?.address);
    const items = getReceiptItems(invoice);
    const contactNo = activeHotel?.phone || (activeHotel as any)?.mobile || (activeHotel as any)?.contactNumber || "-";

    const getThermalHtml = () => `
        <html><head><title>Print Receipt</title>
        <style>
          @page { size: 80mm auto; margin: 2mm; }
          body {
            width: 76mm;
            margin: 0;
            color: #000;
            background: #fff;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.35;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .big { font-size: 14px; }
          pre { margin: 0; white-space: pre; font-family: inherit; }
          .row { display: flex; justify-content: space-between; }
          @media print {
            html, body { width: 80mm; }
          }
        </style></head><body>
          <div class="center bold big" style="color: ${(activeHotel as any)?.invoiceHotelNameColor || "#000000"};">${activeHotel?.name || "HOTEL RESTAURANT"}</div>
          ${(activeHotel as any)?.invoiceShowCustomLines ? `
          <div class="center bold" style="color: ${(activeHotel as any).invoiceHeaderColor}; font-size: ${(activeHotel as any).invoiceLine1Size || 13}px;">${(activeHotel as any).invoiceLine1 || ""}</div>
          <div class="center bold" style="color: ${(activeHotel as any).invoiceHeaderColor}; font-size: ${(activeHotel as any).invoiceLine2Size || 15}px;">${(activeHotel as any).invoiceLine2 || ""}</div>
          ` : ""}
          ${addressLines.line1 ? `<div class="center" style="color: ${(activeHotel as any)?.invoiceHeaderColor || "#000000"};">${addressLines.line1}</div>` : ""}
          ${addressLines.line2 ? `<div class="center" style="color: ${(activeHotel as any)?.invoiceHeaderColor || "#000000"};">${addressLines.line2}</div>` : ""}
          ${addressLines.cityState ? `<div class="center" style="color: ${(activeHotel as any)?.invoiceHeaderColor || "#000000"};">${addressLines.cityState}</div>` : ""}
          <div class="center" style="color: ${(activeHotel as any)?.invoiceHeaderColor || "#000000"};">Contact No: ${contactNo}</div>
          <div class="center">${RECEIPT_DASH}</div>
          <div class="center bold" style="color: ${(activeHotel as any)?.invoiceHeaderColor || "#000000"};">TAX INVOICE</div>
          <div class="center">${RECEIPT_DASH}</div>
          <div>Bill Date : ${formatReceiptDateTime(invoice?.invoiceDate || invoice?.createdAt)}</div>
          <div>Bill No.  : ${invoice?.invoiceNumber || "-"}</div>
          <div>Table No. : ${printTableNumber}</div>
          ${printRoomNumber ? `<div>Room No.  : ${printRoomNumber}</div>` : ""}
          <div>Steward   : ${printSteward}</div>
          <div class="center">${RECEIPT_DASH}</div>
          <pre>Item          Qty  Price  Amount</pre>
          <div class="center">${RECEIPT_DASH}</div>
          <pre>${items.map((item: any) => formatReceiptItemLine(item.itemName, item.quantity, item.price, item.amount)).join("\n")}</pre>
          <div class="center">${RECEIPT_DASH}</div>
          <div class="row"><span></span><span>Total Amount : ${thermalSubtotal.toFixed(2)}</span></div>
          <div class="row"><span></span><span>Gross Amount : ${thermalSubtotal.toFixed(2)}</span></div>
          ${thermalService > 0 ? `<div class="row"><span></span><span>S.C(10%) : ${thermalService.toFixed(2)}</span></div>` : ""}
          <div class="center">${RECEIPT_DASH}</div>
          <div class="row bold big"><span></span><span>NET AMOUNT : ${thermalNet.toFixed(2)}</span></div>
          <div class="center">${RECEIPT_DASH}</div>
          <div>Cashier : ${printSteward}</div>
          <div class="center">${RECEIPT_DASH}</div>
          <div class="center">Thank you for your visit</div>
          <div class="center">${RECEIPT_DASH}</div>
          <div class="center">HSN/SAC Code: 996332</div>
        </body></html>
      `;

    printHtml(getThermalHtml());
  };

  const printThermalKOT = async (kot: any) => {
    try {
      setIsProcessing(true); // Use isProcessing for saving/printing
      const isElectronPrint = Boolean((window as any).electronAPI?.printHtml);
      const reservedPrintWindow = !isElectronPrint ? window.open("about:blank", "_blank") : null;
      if (!isElectronPrint && !reservedPrintWindow) {
        toast.error("Popup blocked. Please allow popups to print KOT.");
        return;
      }

      let finalKot = kot;
      const selectedRoom = checkedInRooms.find(r => r.id === roomId);

      // If it's a draft, we need to save the order and generate the real KOT first
      if (kot.id === "draft") {
        const orderData = {
          hotelId: selectedHotelId || currentHotelId, // Fixed: KOT now created under selectedHotelId not loggedIn hotelId
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

        if (generatedKot?.id) {
          finalKot = generatedKot;
          toast.success(`KOT ${finalKot.kotNumber} generated!`);
        } else {
          throw new Error("Failed to generate KOT after order save.");
        }
      } else {
        toast.success(`KOT ${finalKot.kotNumber} printed!`);
      }

      const normalizedItems = (() => {
        if (Array.isArray(finalKot?.items)) {
          return finalKot.items.map((item: any) => ({
            itemName: item?.itemName || item?.menuItem?.itemName || item?.name || "-",
            quantity: Number(item?.quantity || 0),
            specialNote: item?.specialNote || "",
          }));
        }

        if (Array.isArray(finalKot?.order?.orderItems)) {
          return finalKot.order.orderItems.map((item: any) => ({
            itemName: item?.itemName || item?.menuItem?.itemName || item?.name || "-",
            quantity: Number(item?.quantity || 0),
            specialNote: item?.specialNote || "",
          }));
        }

        return cart.map((item: any) => ({
          itemName: item?.itemName || "-",
          quantity: Number(item?.quantity || 0),
          specialNote: "",
        }));
      })();

      if (normalizedItems.length === 0) {
        throw new Error("No KOT items found to print.");
      }

      const kotDate = formatKotDateTime(finalKot.printedAt || finalKot.createdAt);
      const kotTable = finalKot.order?.tableNumber || tableNumber || "-";
      const kotRoom = finalKot.order?.room?.roomNumber || roomNumber || "";
      const kotTableOrRoom = String(kotRoom || kotTable || "-");
      const kotSteward = finalKot.order?.stewardName || stewardName || user?.fullName || "Staff";
      const kotHotelName = activeHotel?.name || "HOTEL RESTAURANT";
      const html = `
        <html>
          <head>
            <title>KOT Slip</title>
            <style>
              @page { size: 80mm auto; margin: 2mm; }
              html, body {
                margin: 0;
                padding: 0;
                background: white;
              }
              body {
                font-family: 'Calibri', sans-serif;
                width: 76mm;
                margin: 0 auto;
                padding: 0;
                font-size: 12px;
                line-height: 1.25;
                color: black;
              }
              * {
                font-family: 'Calibri', sans-serif;
              }
              .kot-slip { width: 76mm; margin: 0 auto; }
              .kot-title {
                text-align: center;
                font-weight: 700;
                font-size: 16px;
                margin: 2px 0;
              }
              .table-room {
                text-align: center;
                font-weight: 700;
                font-size: 22px;
                line-height: 1.1;
                margin: 2px 0;
              }
              .meta-row {
                display: flex;
                align-items: baseline;
                gap: 0;
                margin: 1px 0;
              }
              .meta-label { width: 58px; }
              .meta-colon { width: 10px; }
              .meta-value {
                flex: 1;
                min-width: 0;
                word-break: break-word;
              }
              .dash {
                border: none;
                border-top: 1px dashed #000;
                width: 100%;
                margin: 3px 0;
              }
              .item-row {
                padding-left: 4px;
                margin: 1px 0;
                word-break: break-word;
              }
              .item-prefix { font-weight: 400; }
              .item-name { font-weight: 700; }
              @media print {
                body * { visibility: hidden; }
                .kot-slip, .kot-slip * { visibility: visible; }
                .kot-slip { position: absolute; left: 0; top: 0; width: 76mm; }
              }
            </style>
          </head>
          <body>
            <div class="kot-slip">
              <hr class="dash" />
              <div class="kot-title">${kotHotelName}</div>
              <hr class="dash" />
              <div class="kot-title">New GUEST KOT</div>
              <hr class="dash" />
              <div class="table-room">${kotTableOrRoom}</div>
              <hr class="dash" />
              <div class="meta-row"><span class="meta-label">KOT Date</span><span class="meta-colon">:</span><span class="meta-value">${kotDate}</span></div>
              <div class="meta-row"><span class="meta-label">Steward</span><span class="meta-colon">:</span><span class="meta-value">${kotSteward}</span></div>
              <hr class="dash" />
              ${normalizedItems.map((item: any) => `
                <div class="item-row"><span class="item-prefix">${Number(item.quantity || 0)}  -</span><span class="item-name">${item.itemName || "-"}</span></div>
              `).join("")}
              <hr class="dash" />
            </div>
          </body>
        </html>
      `;

      if (reservedPrintWindow) {
        reservedPrintWindow.document.write(html);
        reservedPrintWindow.document.close();
        const triggerPrint = () => {
          try {
            reservedPrintWindow.focus();
            reservedPrintWindow.print();
          } catch {
            // Best-effort print trigger for browser popup fallback.
          }
        };

        reservedPrintWindow.onload = () => {
          triggerPrint();
        };

        reservedPrintWindow.onafterprint = () => {
          try {
            reservedPrintWindow.close();
          } catch {
            // Ignore close errors for stricter popup policies.
          }
        };

        // Fallback for browsers where onload/onafterprint may not fire reliably.
        setTimeout(() => {
          triggerPrint();
        }, 400);
        setTimeout(() => {
          try {
            if (!reservedPrintWindow.closed) {
              reservedPrintWindow.close();
            }
          } catch {
            // Ignore close errors for stricter popup policies.
          }
        }, 3000);
      } else {
        printHtml(html);
      }

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
        ${activeHotel?.logoUrl ? `<img src="${resolveLogoUrl(activeHotel.logoUrl)}" alt="logo" class="logo" onerror="handleLogoError(this)"/>` : ""}
        <div>
          <h2 style="color: ${(activeHotel as any)?.invoiceHotelNameColor || "#000000"};">${activeHotel?.name || "Restaurant"}</h2>
          ${(activeHotel as any)?.invoiceShowCustomLines ? `
          <div style="font-weight: bold; color: ${(activeHotel as any).invoiceHeaderColor}; margin-bottom: 2px; font-size: ${(activeHotel as any).invoiceLine1Size || 13}px;">${(activeHotel as any).invoiceLine1 || ""}</div>
          <div style="font-weight: bold; color: ${(activeHotel as any).invoiceHeaderColor}; margin-bottom: 6px; font-size: ${(activeHotel as any).invoiceLine2Size || 15}px;">${(activeHotel as any).invoiceLine2 || ""}</div>
          ` : ""}
          <p style="color: ${(activeHotel as any)?.invoiceHeaderColor || "#000000"};">${activeHotel?.address || ""}</p>
        </div>
      </div>
      <div style="color: ${(activeHotel as any)?.invoiceHeaderColor || "#000000"};"><strong>Restaurant Bill</strong></div>
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
        <div class="row"><span>S.C(10%)</span><span>${formatCurrency(a4Service)}</span></div>
        <div class="row net"><span>Net Payable</span><span>${formatCurrency(a4Net)}</span></div>
    </div>
    <div class="footer">Thank you for dining with us.</div>
    </body></html>`;
    printHtml(html);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(user?.role === "admin" ? "/admin/restaurant/rooms" : "/hotel/restaurant/rooms", { replace: true });
  };

  return (
    <div className="flex flex-col h-screen bg-[#f0ece0] overflow-hidden text-[#222]" style={{ fontFamily: "Segoe UI, Tahoma, Arial, sans-serif" }}>
      <div className="px-4 py-2 border-b border-[#a9a9a9] bg-[#ece7d9] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            className="h-8 w-8 border border-[#8d8d8d] bg-[#f7f5ee] flex items-center justify-center transition-shadow hover:shadow-md"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <div className="text-[15px] font-semibold">{mode === 'modify' ? 'Modify KOT' : 'Restaurant Billing'}</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="border border-[#9f9f9f] bg-[#f8f5eb] p-3 space-y-3 min-h-full">
          <div className="space-y-0">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
              {(isBossAdmin || systemSettings?.enableRestaurantMultiHotel) && availableHotels.length > 0 && (
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
                    {availableHotels.map((h) => (
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
                <select
                  value={tableNumber}
                  onChange={(e) => {
                    setTableNumber(e.target.value);
                    if (e.target.value) {
                      setRoomId(null as any);
                      setRoomNumber("");
                      setBookingId(null as any);
                      setGuestName("");
                    }
                  }}
                  className="w-full h-8 px-2 border border-[#8f8f8f] bg-white text-[12px]"
                >
                  <option value="">Select Table</option>
                  {restaurantTables
                    .filter(t => t.hotelId === selectedHotelId && t.isActive)
                    .map(t => (
                      <option key={t.id} value={t.name}>{t.name} (Cap: {t.capacity})</option>
                    ))
                  }
                </select>
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

                    const roomsToSearch = activeHotel?.showAllRooms ? (allHotelsRooms.length > 0 ? allHotelsRooms : allRooms) : checkedInRooms;
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
                    // Fixed: filter by selectedHotelId not loggedIn hotelId, normalize for dashes/type
                    const normalize = (id: any) => (id ? String(id).replace(/-/g, '').toLowerCase() : '');
                    const normSelectedHotelId = normalize(selectedHotelId);
                    const baseRoomsForDropdown = activeHotel?.showAllRooms ? (allHotelsRooms.length > 0 ? allHotelsRooms : allRooms) : checkedInRooms;
                    const roomsToDisplay = baseRoomsForDropdown.filter(
                      room => {
                        const roomHId = room.hotelId || selectedHotelId;
                        const normRoomHotelId = normalize(roomHId);
                        // Debug log for normalization
                        console.log('[DEBUG] Comparing normalized hotelIds:', {
                          roomId: room.id,
                          roomHotelId: room.hotelId,
                          selectedHotelId,
                          normRoomHotelId,
                          normSelectedHotelId
                        });
                        return normRoomHotelId === normSelectedHotelId;
                      }
                    );
                    console.log('[DEBUG] Room dropdown roomsToDisplay:', roomsToDisplay);
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
                  {stewardsToDisplay.length === 0 ? (
                    <option value="" disabled>No steward configured</option>
                  ) : (
                    stewardsToDisplay.map((s: any) => (
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
                    ref={searchInputRef}
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
                    onKeyDown={(e) => {
                      // Added: keyboard navigation for search dropdown
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setHighlightedIndex(prev =>
                          prev < filteredAddItemOptions.length - 1 ? prev + 1 : prev
                        );
                        return;
                      }
                      if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
                        return;
                      }
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (highlightedIndex >= 0 && filteredAddItemOptions[highlightedIndex]) {
                          const item = filteredAddItemOptions[highlightedIndex];
                          setAddItemSearch(toAddItemLabel(item));
                          setSearchQuery(item.itemName);
                          setShowItemSuggestions(false);
                          setHighlightedIndex(-1);
                          setTimeout(() => quantityInputRef.current?.focus(), 50);
                        } else if (resolveAddItemFromQuery(addItemSearch)) {
                          handleAddFromSearch();
                        }
                        return;
                      }
                      if (e.key === 'Escape') {
                        setHighlightedIndex(-1);
                        setAddItemSearch('');
                        setSearchQuery('');
                        return;
                      }
                    }}
                    className="w-full h-8 px-2 border border-[#8f8f8f] bg-[#ffffff] text-[12px] text-[#1a1a1a]"
                  />
                  {showItemSuggestions && filteredAddItemOptions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-20 max-h-56 overflow-auto border border-[#ccc] bg-[#ffffff] text-[#333]">
                      {filteredAddItemOptions.map((item, index) => (
                        <button
                          key={item.id}
                          type="button"
                          data-item-index={index}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          onMouseDown={() => {
                            setAddItemSearch(toAddItemLabel(item));
                            setSearchQuery(item.itemName);
                            setShowItemSuggestions(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-[12px] hover:bg-[#e8e4d4]"
                          style={{
                            backgroundColor: index === highlightedIndex
                              ? 'var(--highlight-color, #e8f4e8)'
                              : 'transparent',
                          }}
                        >
                          {toAddItemLabel(item)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] mb-1">Quantity</label>
                <input
                  ref={quantityInputRef}
                  type="number"
                  min={1}
                  value={addItemQty}
                  onFocus={() => quantityInputRef.current?.select()}
                  onChange={(e) => setAddItemQty(Math.max(1, Number(e.target.value) || 1))}
                  onKeyDown={(e) => {
                    // Added: keyboard navigation for search dropdown
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addButtonRef.current?.click();
                      setTimeout(() => {
                        searchInputRef.current?.focus();
                        setAddItemSearch('');
                        setSearchQuery('');
                      }, 50);
                    }
                  }}
                  className="w-full h-8 px-2 border border-[#8f8f8f] bg-white text-[12px]"
                />
              </div>

              <div>
                <label className="block text-[11px] mb-1">&nbsp;</label>
                <button
                  ref={addButtonRef}
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
                        <td className="border border-[#d0d0d0] px-2 py-1">{getItemCode(item.menuItemId) ?? String(item.menuItemId).slice(-6).toUpperCase()}</td>
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
              onClick={mode === 'modify' ? handleUpdateKOT : handleGenerateKOT}
              className="h-9 px-4 border border-[#8d8d8d] bg-[#f5f5f5] text-[12px] font-semibold disabled:opacity-50"
            >
              {mode === 'modify' ? 'Update KOT' : 'Generate KOT'}
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

                <div className="border-t border-b border-dashed border-slate-200 py-4 my-4 space-y-2">
                  {kotToPreview.items.map((item: any, idx: number) => (
                    <div key={idx} className="text-[13px] font-bold text-slate-800 leading-tight break-words">
                      {`${Number(item.quantity || 0)} - ${item.itemName || "-"}`}
                      {item.specialNote && <div className="text-[10px] font-medium text-[#C6A75E] italic mt-0.5">* {item.specialNote}</div>}
                    </div>
                  ))}
                </div>

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
                className="flex-1 py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`, // Replaced T.gold, T.darkGold
                }}
              >
                <Printer className="w-4 h-4" />
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
              {(() => {
                const receiptItems = getReceiptItems(billToPreview);
                const billSubtotal = Number(billToPreview?.subtotal ?? subtotal ?? 0);
                const billService = billSubtotal * 0.10;
                const billNet = billSubtotal + billService;
                const tableNo = billToPreview?.restaurantOrder?.tableNumber || tableNumber || "-";
                const roomNo = billToPreview?.restaurantOrder?.room?.roomNumber || roomNumber || "";
                const steward = billToPreview?.restaurantOrder?.stewardName || stewardName || user?.fullName || "Staff";
                const lines = splitAddressLines(activeHotel?.address);
                const contactNo = activeHotel?.phone || (activeHotel as any)?.mobile || (activeHotel as any)?.contactNumber || "-";

                return (
                  <div
                    className="mx-auto bg-white text-black"
                    style={{ width: "76mm", fontFamily: "'Courier New', monospace", fontSize: "11px", lineHeight: 1.35 }}
                  >
                    {activeHotel?.logoUrl && (
                      <div className="flex justify-center mb-2">
                        <img
                          src={resolveLogoUrl(activeHotel.logoUrl)}
                          alt="Logo"
                          style={{ maxHeight: "50px", width: "auto", objectFit: "contain" }}
                          className="logo-preview-img"
                          onError={handleLogoImageError}
                        />
                      </div>
                    )}
                    <div className="text-center font-bold text-[14px]" style={{ color: (activeHotel as any)?.invoiceHotelNameColor || "#000000" }}>{activeHotel?.name || "HOTEL RESTAURANT"}</div>
                    {(activeHotel as any)?.invoiceShowCustomLines && (
                      <>
                        <div className="text-center font-bold" style={{ color: (activeHotel as any).invoiceHeaderColor, fontSize: `${(activeHotel as any).invoiceLine1Size || 11}px` }}>{(activeHotel as any).invoiceLine1 || ""}</div>
                        <div className="text-center font-bold" style={{ color: (activeHotel as any).invoiceHeaderColor, fontSize: `${(activeHotel as any).invoiceLine2Size || 13}px` }}>{(activeHotel as any).invoiceLine2 || ""}</div>
                      </>
                    )}
                    {lines.line1 && <div className="text-center" style={{ color: (activeHotel as any)?.invoiceHeaderColor || "#000000" }}>{lines.line1}</div>}
                    {lines.line2 && <div className="text-center" style={{ color: (activeHotel as any)?.invoiceHeaderColor || "#000000" }}>{lines.line2}</div>}
                    {lines.cityState && <div className="text-center" style={{ color: (activeHotel as any)?.invoiceHeaderColor || "#000000" }}>{lines.cityState}</div>}
                    <div className="text-center" style={{ color: (activeHotel as any)?.invoiceHeaderColor || "#000000" }}>Contact No: {contactNo}</div>
                    <div className="text-center">{RECEIPT_DASH}</div>
                    <div className="text-center font-bold" style={{ color: (activeHotel as any)?.invoiceHeaderColor || "#000000" }}>TAX INVOICE</div>
                    <div className="text-center">{RECEIPT_DASH}</div>
                    <div>Bill Date : {formatReceiptDateTime(billToPreview?.invoiceDate || billToPreview?.createdAt)}</div>
                    <div>Bill No.  : {billToPreview?.invoiceNumber || "-"}</div>
                    <div>Table No. : {tableNo}</div>
                    {roomNo && <div>Room No.  : {roomNo}</div>}
                    <div>Steward   : {steward}</div>
                    <div className="text-center">{RECEIPT_DASH}</div>
                    <pre className="m-0">Item          Qty  Price  Amount</pre>
                    <div className="text-center">{RECEIPT_DASH}</div>
                    <pre className="m-0 whitespace-pre-wrap">{receiptItems.map((item: any) => formatReceiptItemLine(item.itemName, item.quantity, item.price, item.amount)).join("\n")}</pre>
                    <div className="text-center">{RECEIPT_DASH}</div>
                    <div className="flex justify-between"><span></span><span>Total Amount : {billSubtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span></span><span>Gross Amount : {billSubtotal.toFixed(2)}</span></div>
                    {billService > 0 && <div className="flex justify-between"><span></span><span>S.C.(10%) : {billService.toFixed(2)}</span></div>}
                    <div className="text-center">{RECEIPT_DASH}</div>
                    <div className="flex justify-between font-bold text-[14px]"><span></span><span>NET AMOUNT : {billNet.toFixed(2)}</span></div>
                    <div className="text-center">{RECEIPT_DASH}</div>
                    <div>Cashier : {steward}</div>
                    <div className="text-center">{RECEIPT_DASH}</div>
                    <div className="text-center">Thank you for your visit</div>
                    <div className="text-center">{RECEIPT_DASH}</div>
                    <div className="text-center">HSN/SAC Code: 996332</div>
                  </div>
                );
              })()}
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
