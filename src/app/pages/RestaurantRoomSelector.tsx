import { useNavigate } from "react-router";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS, Hotel } from "../contexts/PMSContext";
import api from "../services/api";
import { AlertCircle, Building2, ChevronDown, RefreshCw, ClipboardPlus, HandCoins, X } from "lucide-react";


const readStoredList = (key: string) => {
    try {
        const raw = localStorage.getItem(key) || "[]";
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
    } catch {
        return [];
    }
};

export function RestaurantRoomSelector() {
    const { user } = useAuth();
    const { getCheckedInRooms, getKOTs, hotels, updateHotel, systemSettings, rooms, clearRestaurantKOTsForRoom, restaurantTables } = usePMS();

    const navigate = useNavigate();
    const [checkedInRooms, setCheckedInRooms] = useState<any[]>([]);
    const [allHotelsRooms, setAllHotelsRooms] = useState<any[]>([]);
    const [allKOTs, setAllKOTs] = useState<any[]>([]);
    const [roomsWithOpenKOT, setRoomsWithOpenKOT] = useState<Set<string>>(new Set());
    const [tablesWithOpenKOT, setTablesWithOpenKOT] = useState<Set<string>>(new Set());
    const [kotRooms, setKotRooms] = useState<string[]>(() => readStoredList("kotRooms"));
    const [billedRooms, setBilledRooms] = useState<string[]>(() => readStoredList("billedRooms"));
    const [billedItems, setBilledItems] = useState<Record<string, boolean>>({});
    const [showCleanConfirm, setShowCleanConfirm] = useState(false);
    const [roomToClean, setRoomToClean] = useState<any | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: any } | null>(null);
    const [refreshTick, setRefreshTick] = useState(0);
    const clickTimersRef = useRef<Record<string, number>>({});
    // Fixed: ref guards to stop infinite polling loop on network failure
    const isFetchingRef = useRef(false);
    const hasFetchErrorRef = useRef(false);
    const currentHotelId = user?.hotelId || "";
    const visibleHotels = useMemo(() => {
        const role = String(user?.role || "");
        const currentUserId = String(user?.id || "");
        if (role !== "admin" || !currentUserId) {
            return hotels;
        }

        const owned = hotels.filter((hotel: any) => {
            const adminId = String(hotel?.adminId || "");
            const createdBy = String(hotel?.createdBy || "");
            if (adminId) return adminId === currentUserId;
            if (createdBy) return createdBy === currentUserId;
            return true;
        });

        return owned.length > 0 ? owned : hotels;
    }, [hotels, user?.id, user?.role]);

    const currentUserHotel = visibleHotels.find(h => h.id === currentHotelId);
    const isPosBossMode = currentUserHotel?.posBossMode === true;
    const isBossAdmin = user?.role === "admin" || isPosBossMode;

    // Fixed: Restaurant Staff now gets all admin hotels (same as Boss Mode)
    const availableHotels = visibleHotels;

    const [activeSelectorHotelId, setActiveSelectorHotelId] = useState<string | undefined>(currentHotelId);
    const [isUpdatingShowRooms, setIsUpdatingShowRooms] = useState(false);

    const handleToggleShowAllRooms = async (newValue: boolean) => {
        if (!activeSelectorHotelId || isUpdatingShowRooms) return;
        setIsUpdatingShowRooms(true);
        try {
            await updateHotel(activeSelectorHotelId, { showAllRooms: newValue });
            // Refresh parent state or just reload data
            handleRefresh();
        } catch (err) {
            console.error("Failed to update showAllRooms setting:", err);
            alert("Failed to update setting. Please try again.");
        } finally {
            setIsUpdatingShowRooms(false);
        }
    };

    // Auto-select first hotel if user has no assigned hotel and multi-hotel is on or boss mode is active
    // Fixed: only auto-select on initial mount (when undefined), NOT on explicit empty string (consolidated)
    useEffect(() => {
        if (activeSelectorHotelId === undefined) {
            if (availableHotels.length > 0 && (systemSettings?.enableRestaurantMultiHotel || isBossAdmin)) {
                setActiveSelectorHotelId(availableHotels[0].id);
            } else {
                setActiveSelectorHotelId(user?.hotelId || "");
            }
        }
    }, [availableHotels, systemSettings, user?.hotelId, isBossAdmin]);

    // Derived active hotel details
    const activeHotel = activeSelectorHotelId
        ? availableHotels.find((h) => String(h.id) === String(activeSelectorHotelId))
        : { name: isBossAdmin ? "All Hotels (Consolidated)" : "Unknown Hotel", showAllRooms: false } as Hotel;


    const currentHotelRooms = useMemo(() => {
        return rooms
            .filter((r: any) => !activeSelectorHotelId || r.hotelId === activeSelectorHotelId)
            .map((r: any) => ({
                id: r.id,
                roomNumber: r.roomNumber,
                bookings: r.bookings || [],
                status: r.status,
                hotelId: r.hotelId,
            }));
    }, [rooms, activeSelectorHotelId]);

    const getRestaurantRooms = useCallback(() => {
        // Use allHotelsRooms if it has data, otherwise fallback to context rooms
        const roomsToFilter = allHotelsRooms.length > 0 ? allHotelsRooms : currentHotelRooms;

        return roomsToFilter.filter((r: any) => {
            // BUG 2 FIX: Look up the showAllRooms setting for THIS room's hotel
            const hotelIdStr = String(r.hotelId || "");
            const roomHotel = availableHotels.find(h => String(h.id) === hotelIdStr);
            const hotelShowAll = roomHotel ? roomHotel.showAllRooms === true : false;

            // IF showAllRooms is enabled for this hotel -> show all rooms
            if (hotelShowAll) return true;



            // IF showAllRooms is disabled -> ONLY show checked-in/occupied rooms
            const roomStatus = String(r?.status || "").toLowerCase();
            const hasCheckedInBooking = r.bookings?.some((b: any) => {
                const bStatus = String(b.status || "").toLowerCase();
                return bStatus === "checked_in" || bStatus === "checked-in" || bStatus === "occupied";
            });

            // If it has a checked-in booking, it must be visible
            if (hasCheckedInBooking) return true;

            // Otherwise, only show if status itself is occupied/checked-in
            return roomStatus === "occupied" || roomStatus === "checked-in" || roomStatus === "checked_in";
        });

    }, [allHotelsRooms, currentHotelRooms, visibleHotels]);

    const showAllRooms = activeHotel?.showAllRooms === true;



    const filteredRooms = useMemo(() => getRestaurantRooms(), [getRestaurantRooms]);

    const roomGroups = useMemo(() => {
        if (activeSelectorHotelId) {
            const hotelName = activeHotel?.name || "Rooms";
            const selectedHotelRooms = filteredRooms.filter(
                (room: any) => String(room.hotelId) === String(activeSelectorHotelId)
            );
            return [{ hotelId: activeSelectorHotelId, hotelName, rooms: selectedHotelRooms }];
        }

        // Consolidated View - Group by Hotel
        const groups: any[] = [];
        availableHotels.forEach(hotel => {
            const hotelRooms = filteredRooms.filter(r => String(r.hotelId) === String(hotel.id));
            if (hotelRooms.length > 0) {
                groups.push({
                    hotelId: hotel.id,
                    hotelName: hotel.name,
                    rooms: hotelRooms
                });
            }
        });
        return groups;
    }, [activeHotel?.name, activeSelectorHotelId, filteredRooms, availableHotels]);

    const tableHotelGroups = useMemo(() => {
        const hotelsToProcess = activeSelectorHotelId
            ? availableHotels.filter(h => String(h.id) === String(activeSelectorHotelId))
            : availableHotels;

        return hotelsToProcess.map(h => ({
            hotelId: h.id,
            hotelName: h.name,
            tables: restaurantTables.filter(t => String(t.hotelId) === String(h.id) && t.isActive)
        })).filter(group => group.tables.length > 0);
    }, [activeSelectorHotelId, availableHotels, restaurantTables]);

    // Fixed: useCallback so fetchRoomAndKotData identity is stable across renders
    const fetchRoomAndKotData = useCallback(async () => {
        // Fixed: skip if a request is already in-flight
        if (isFetchingRef.current) return;
        // Fixed: halt loop on network failure; only manual Refresh resets this
        if (hasFetchErrorRef.current) return;

        // Fixed: added adminId support to prevent 500 on multi-hotel fetch
        const safeHotelId = activeSelectorHotelId && activeSelectorHotelId !== 'all' ? activeSelectorHotelId : null;
        const safeAdminId = user?.hotel?.adminId || (user as any)?.adminId;

        if (!safeHotelId && !safeAdminId) {
            return;
        }

        isFetchingRef.current = true;
        let isMounted = true;

        try {
            // Fixed: use 'all' sentinel for consolidated view
            const fetchHotelId = activeSelectorHotelId || 'all';
            const params = fetchHotelId === 'all'
                ? { hotelId: 'all', adminId: safeAdminId }
                : { hotelId: fetchHotelId };

            // Fixed: separated fetches — room display works even if KOT fetch fails
            try {
                const roomData = await getCheckedInRooms(fetchHotelId);
                if (isMounted) setCheckedInRooms(roomData);
            } catch (err) {
                console.error('Room fetch failed:', err);
                hasFetchErrorRef.current = true; // stop re-triggering on failure
            }

            try {
                // Fetch all rooms from all hotels if 'all' is selected
                const response = await api.get("/restaurant/rooms", { params });
                if (isMounted) {
                    const selectedHotelRooms = (response?.data?.data || []).map((r: any) => ({
                        id: r.id,
                        roomNumber: r.roomNumber,
                        bookings: r.bookings || [],
                        status: r.status,
                        hotelId: r.hotelId || r.hotel?.id || (activeSelectorHotelId || r.hotelId),
                    }));
                    setAllHotelsRooms(selectedHotelRooms);
                }
            } catch (err) {
                console.error('Hotel rooms fetch failed:', err);
            }

            try {
                // Fixed: use selectedHotelId for KOT matching, show red for OPEN KOTs
                const openKots = await getKOTs("OPEN", fetchHotelId);
                if (!isMounted) return;

                const relevantKots = (openKots || []).filter((kot: any) => {
                    return !activeSelectorHotelId || kot.hotelId === activeSelectorHotelId;
                });
                
                setAllKOTs(relevantKots);

                const roomIdsWithOpenKOT = new Set<string>(
                    relevantKots
                        .map((kot: any) => kot.order?.roomId)
                        .filter((roomId: unknown): roomId is string => typeof roomId === "string" && roomId.length > 0)
                );
                const tableNumbersWithOpenKOT = new Set<string>(
                    relevantKots
                        .map((kot: any) => {
                            const tableNo = String(kot.order?.tableNumber || "").trim();
                            const hotelId = String(kot.hotelId || "").trim();
                            return tableNo && hotelId ? `${hotelId}:${tableNo}` : "";
                        })
                        .filter((tableNo: string) => tableNo.length > 0)
                );

                setRoomsWithOpenKOT(roomIdsWithOpenKOT);
                setTablesWithOpenKOT(tableNumbersWithOpenKOT);

                const kotTokens = [
                    ...Array.from(roomIdsWithOpenKOT),
                    ...Array.from(tableNumbersWithOpenKOT).map((tableToken) => `table:${tableToken}`),
                ];
                localStorage.setItem("kotRooms", JSON.stringify(kotTokens));
                setKotRooms(kotTokens);
            } catch (err) {
                console.error('KOT fetch failed:', err);
                hasFetchErrorRef.current = true; // stop re-triggering on failure
            }
        } finally {
            isFetchingRef.current = false;
            isMounted = false;
        }
    }, [activeSelectorHotelId, getCheckedInRooms, getKOTs]);

    useEffect(() => {
        // Fixed: reset error guard when hotel changes or user manually refreshes (refreshTick)
        hasFetchErrorRef.current = false;
        fetchRoomAndKotData();
    }, [activeSelectorHotelId, refreshTick, fetchRoomAndKotData]);

    useEffect(() => {
        const syncKotRooms = async () => {
            try {
                const openKots = await getKOTs("OPEN");
                const relevantKots = (openKots || []).filter((kot: any) => {
                    return !activeSelectorHotelId || kot.hotelId === activeSelectorHotelId;
                });

                const roomTokens = relevantKots
                    .map((kot: any) => String(kot.order?.roomId || "").trim())
                    .filter((id: string) => id.length > 0);

                const tableTokens = relevantKots
                    .map((kot: any) => {
                        const tableNo = String(kot.order?.tableNumber || "").trim();
                        const hotelId = String(kot.hotelId || "").trim();
                        return tableNo && hotelId ? `table:${hotelId}:${tableNo}` : "";
                    })
                    .filter((id: string) => id.length > 0);

                const merged = Array.from(new Set([...roomTokens, ...tableTokens]));
                localStorage.setItem("kotRooms", JSON.stringify(merged));
                setKotRooms(merged);
            } catch {
                setKotRooms(readStoredList("kotRooms"));
            }
        };

        const handleKotsUpdated = () => {
            syncKotRooms();
        };

        syncKotRooms();
        window.addEventListener("restaurant:kots-updated", handleKotsUpdated as EventListener);
        return () => {
            window.removeEventListener("restaurant:kots-updated", handleKotsUpdated as EventListener);
        };
        // Fixed: removed showAllRooms — it doesn't affect which KOTs are fetched, only UI filtering
    }, [activeSelectorHotelId, getKOTs]);

    useEffect(() => {
        const loadBilledRooms = () => {
            const raw = localStorage.getItem("billedRooms") || "[]";
            const rawItems = localStorage.getItem("billedItems") || "{}";
            try {
                const parsed = JSON.parse(raw);
                const next = Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
                setBilledRooms([...next]);
            } catch {
                setBilledRooms([]);
            }

            try {
                const parsedItems = JSON.parse(rawItems);
                const nextItems = Object.entries(parsedItems || {}).reduce<Record<string, boolean>>((acc, [key, value]) => {
                    if (typeof key === "string" && Boolean(value)) {
                        acc[key] = true;
                    }
                    return acc;
                }, {});
                setBilledItems(nextItems);
            } catch {
                setBilledItems({});
            }
        };

        loadBilledRooms();
        window.addEventListener("restaurant:billed-rooms-updated", loadBilledRooms as EventListener);
        return () => {
            window.removeEventListener("restaurant:billed-rooms-updated", loadBilledRooms as EventListener);
        };
    }, []);

    useEffect(() => {
        if (import.meta.env?.DEV) {
            const tableCount = tableHotelGroups.reduce((acc, g) => acc + g.tables.length, 0);
            console.log("Hotel Rooms:", filteredRooms);
            console.log("Tables:", tableCount);
        }
    }, [filteredRooms, tableHotelGroups]);

    // Create a base path depending on the user role to redirect correctly
    const getPosPath = () => {
        return user?.role === "admin" ? "/admin/restaurant/pos" : "/hotel/restaurant/pos";
    };

    const handleRoomSelect = (item: any) => {
        const params = new URLSearchParams();
        const targetHotelId = String(item?.hotelId || activeSelectorHotelId || "");
        if (targetHotelId) params.set("hotelId", targetHotelId);

        if (item?.isTable) {
            params.set("tableId", String(item?.tableId || item?.roomNumber || "").trim());
        } else {
            params.set("roomId", String(item?.id || ""));
        }

        navigate(`${getPosPath()}?${params.toString()}`, {
            state: {
                hotelId: targetHotelId,
                roomId: item?.isTable ? undefined : String(item?.id || ""),
                roomNumber: String(item?.tableId || item?.roomNumber || "").trim(),
            }
        });
    };

    const handleRefresh = () => {
        // Fixed: reset error guard so the next fetch attempt is allowed
        hasFetchErrorRef.current = false;
        setRefreshTick((prev) => prev + 1);
        setKotRooms(readStoredList("kotRooms"));
        setBilledRooms(readStoredList("billedRooms"));
    };

    const isCardBilled = (item: any) => {
        const itemId = String(item?.id || "");
        const itemNumber = String(item?.tableId || item?.roomNumber || "").trim();
        const hotelId = String(item?.hotelId || activeSelectorHotelId || "").trim();
        const tableToken = `table:${itemNumber}`;
        const roomToken = `room:${itemNumber}`;

        // Fixed match by exact unique roomId instead of generic roomNumber '102' which bleeds to other hotels.
        if (item?.isTable) {
            return (
                billedRooms.includes(itemId) ||
                billedRooms.includes(tableToken) ||
                Boolean(billedItems[itemId]) ||
                Boolean(billedItems[tableToken]) ||
                Boolean(billedItems[itemNumber])
            );
        }

        return (
            billedRooms.includes(itemId) ||
            Boolean(billedItems[itemId])
        );
    };

    const isCardKotCut = (item: any) => {
        const itemId = String(item?.id || "");
        const itemNumber = String(item?.tableId || item?.roomNumber || "").trim();
        const tableToken = item?.isTable
            ? `table:${String(item?.hotelId || activeSelectorHotelId || "").trim()}:${itemNumber}`
            : "";

        return (
            kotRooms.includes(itemId) ||
            (tableToken.length > 0 && kotRooms.includes(tableToken))
        );
    };

    const getKOTWallPath = () => {
        return user?.role === "admin" ? "/admin/restaurant/kot-wall" : "/hotel/restaurant/kot-wall";
    };

    const handleRoomCardClick = (room: any) => {
        const roomId = room.id;
        if (isCardBilled(room)) {
            setRoomToClean(room);
            setShowCleanConfirm(true);
            return;
        }

        if (clickTimersRef.current[roomId]) {
            window.clearTimeout(clickTimersRef.current[roomId]);
        }

        clickTimersRef.current[roomId] = window.setTimeout(() => {
            handleRoomSelect(room);
            delete clickTimersRef.current[roomId];
        }, 220);
    };

    const handleContextMenu = (event: React.MouseEvent, item: any) => {
        event.preventDefault();
        setContextMenu({ x: event.clientX, y: event.clientY, item });
    };

    const handleConfirmCleaned = () => {
        const roomId = roomToClean?.id;
        if (!roomId) {
            setShowCleanConfirm(false);
            setRoomToClean(null);
            return;
        }

        const raw = localStorage.getItem("billedRooms") || "[]";
        let nextBilled: string[] = [];
        try {
            const parsed = JSON.parse(raw);
            nextBilled = Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
        } catch {
            nextBilled = [];
        }

        const itemNumber = String(roomToClean?.tableId || roomToClean?.roomNumber || "").trim();
        const roomToken = `room:${itemNumber}`;
        const tableToken = `table:${itemNumber}`;
        const updated = nextBilled.filter((id) => id !== roomId && id !== roomToken && id !== tableToken && id !== itemNumber);
        localStorage.setItem("billedRooms", JSON.stringify(updated));
        setBilledRooms([...updated]);

        const nextKotRooms = readStoredList("kotRooms").filter((id) => id !== roomId && id !== tableToken);
        localStorage.setItem("kotRooms", JSON.stringify(nextKotRooms));
        setKotRooms(nextKotRooms);

        const rawBilledItems = localStorage.getItem("billedItems") || "{}";
        let parsedBilledItems: Record<string, boolean> = {};
        try {
            parsedBilledItems = JSON.parse(rawBilledItems) || {};
        } catch {
            parsedBilledItems = {};
        }
        delete parsedBilledItems[roomId];
        delete parsedBilledItems[itemNumber];
        delete parsedBilledItems[roomToken];
        delete parsedBilledItems[tableToken];
        localStorage.setItem("billedItems", JSON.stringify(parsedBilledItems));
        setBilledItems({ ...parsedBilledItems });

        if (!roomToClean?.isTable) {
            clearRestaurantKOTsForRoom(roomId);
        }

        if (!roomToClean?.isTable) {
            const cleanedRaw = localStorage.getItem("restaurant_cleaned_rooms") || "[]";
            let cleanedRooms: string[] = [];
            try {
                const parsedCleaned = JSON.parse(cleanedRaw);
                cleanedRooms = Array.isArray(parsedCleaned) ? parsedCleaned.filter((id) => typeof id === "string") : [];
            } catch {
                cleanedRooms = [];
            }
            if (!cleanedRooms.includes(roomId)) {
                cleanedRooms.push(roomId);
                localStorage.setItem("restaurant_cleaned_rooms", JSON.stringify(cleanedRooms));
            }
        }

        window.dispatchEvent(new CustomEvent("restaurant:kots-updated", {
            detail: {
                roomId: roomToClean?.isTable ? undefined : roomId,
                roomNumber: roomToClean?.isTable ? "" : String(roomToClean?.roomNumber || ""),
                tableNumber: roomToClean?.isTable ? itemNumber : undefined,
            }
        }));
        window.dispatchEvent(new CustomEvent("restaurant:billed-rooms-updated"));
        setShowCleanConfirm(false);
        setRoomToClean(null);
    };

    const handleCancelCleaned = () => {
        setShowCleanConfirm(false);
        setRoomToClean(null);
    };

    const handleRoomCardDoubleClick = (room: any) => {
        if (isCardBilled(room)) {
            setRoomToClean(room);
            setShowCleanConfirm(true);
            return;
        }

        if (clickTimersRef.current[room.id]) {
            window.clearTimeout(clickTimersRef.current[room.id]);
            delete clickTimersRef.current[room.id];
        }

        const params = new URLSearchParams();
        const targetHotelId = String(room?.hotelId || activeSelectorHotelId || "");
        if (targetHotelId) params.set("hotelId", targetHotelId);
        if (room?.isTable) {
            params.set("sourceType", "table");
            params.set("tableNumber", String(room.tableId || room.roomNumber || ""));
        } else {
            params.set("roomNumber", String(room.roomNumber || ""));
            params.set("tableNumber", String(room.roomNumber || ""));
        }
        params.set("returnTo", user?.role === "admin" ? "/admin/restaurant/rooms" : "/hotel/restaurant/rooms");

        navigate(`${getKOTWallPath()}?${params.toString()}`);
    };

    const handleContextAction = (action: "add" | "bill" | "cancel") => {
        if (!contextMenu?.item) {
            setContextMenu(null);
            return;
        }

        const target = contextMenu.item;
        if (action === "add") {
            handleRoomCardClick(target);
        } else if (action === "bill") {
            handleRoomCardDoubleClick(target);
        }

        setContextMenu(null);
    };

    useEffect(() => {
        return () => {
            Object.values(clickTimersRef.current).forEach((timerId) => {
                window.clearTimeout(timerId);
            });
            clickTimersRef.current = {};
        };
    }, []);

    useEffect(() => {
        const closeContextMenu = () => {
            setContextMenu(null);
        };

        if (contextMenu) {
            window.addEventListener("click", closeContextMenu);
        }

        return () => {
            window.removeEventListener("click", closeContextMenu);
        };
    }, [contextMenu]);

    return (
        <AppLayout title="Room Selection">
            <div className="h-full flex flex-col bg-slate-50">

                {/* Header */}
                <div className="bg-white border-b border-slate-200 p-4 shrink-0 flex items-center justify-between">
                    <div className="flex z-[50] items-center justify-between w-full max-w-7xl mx-auto px-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#C6A75E]/10 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-[#C6A75E]" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                                    {activeHotel ? activeHotel.name : "Select Room for POS"}
                                </h1>
                                <p className="text-sm text-slate-500 font-medium">Choose a currently checked-in room to associate with the new order.</p>
                            </div>
                        </div>

                        {/* Multi-Hotel Selection Dropdown */}
                        <div className="flex items-center gap-2">
                            {user?.role !== "restaurant_staff" && activeSelectorHotelId && (

                                <div className="flex items-center gap-2 mr-4 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Show All Rooms</span>
                                    <button
                                        onClick={() => handleToggleShowAllRooms(!showAllRooms)}
                                        disabled={isUpdatingShowRooms}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${showAllRooms ? "bg-[#C6A75E]" : "bg-slate-300"} ${isUpdatingShowRooms ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showAllRooms ? "translate-x-6" : "translate-x-1"}`}
                                        />
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={handleRefresh}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm rounded-xl font-medium hover:border-[#C6A75E] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C6A75E]/20"
                                style={{ fontFamily: "'Inter', sans-serif" }}
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </button>

                            {(isBossAdmin || systemSettings?.enableRestaurantMultiHotel) && availableHotels.length > 0 && (
                                <div className="relative group">
                                    <select
                                        value={activeSelectorHotelId || ""}
                                        onChange={(e) => setActiveSelectorHotelId(e.target.value)}
                                        className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm rounded-xl font-medium cursor-pointer hover:border-[#C6A75E] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C6A75E]/20"
                                        style={{ fontFamily: "'Inter', sans-serif" }}
                                    >
                                        {/* BUG 1 FIX: Add All Hotels option for Boss Admins/Multi-Hotel staff */}
                                        {isBossAdmin && <option value="">All Hotels (Consolidated)</option>}
                                        {(!isBossAdmin && !systemSettings?.enableRestaurantMultiHotel) && <option value="" disabled>Select Hotel</option>}

                                        {availableHotels.map((hotel: Hotel) => (
                                            <option key={hotel.id} value={hotel.id}>
                                                {hotel.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-[#C6A75E] transition-colors" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Display Section */}
                        {(() => {
                            const roomsToDisplay = filteredRooms;

                            return (
                                <div className="space-y-6">
                                    {(() => {
                                        const totalTables = tableHotelGroups.reduce((acc, g) => acc + g.tables.length, 0);
                                        if (totalTables === 0) return null;

                                        return (
                                            <section>
                                                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Tables</h2>
                                                <div className="space-y-5">
                                                    {tableHotelGroups.map((hotelGroup) => (
                                                        hotelGroup.tables.length > 0 && (
                                                            <div key={`tables-${hotelGroup.hotelId}`} className="mb-6 last:mb-0">
                                                                {!activeSelectorHotelId && (
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <div className="h-4 w-1 bg-[#C6A75E] rounded-full" />
                                                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{hotelGroup.hotelName}</h3>
                                                                    </div>
                                                                )}
                                                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                                                    {hotelGroup.tables.map((t: any) => {
                                                                        const tableId = t.name;
                                                                        const table = {
                                                                            id: `table:${hotelGroup.hotelId}:${tableId}`,
                                                                            tableId,
                                                                            roomNumber: tableId,
                                                                            status: "vacant",
                                                                            isTable: true,
                                                                            hotelId: hotelGroup.hotelId,
                                                                        };
                                                                        
                                                                        // Fixed: match KOT by tableId+hotelId, not roomNumber alone
                                                                        const hasOpenKOT = allKOTs.some(
                                                                          kot => String(kot.order?.tableNumber || "").trim() === tableId &&
                                                                                 String(kot.hotelId) === String(table.hotelId) &&
                                                                                 String(kot.status).toUpperCase() === 'OPEN'
                                                                        );
                                                                        
                                                                        const isBilled = isCardBilled(table);

                                                                        // Custom Colors from Hotel
                                                                        const cardHotel = availableHotels.find(h => String(h.id) === String(hotelGroup.hotelId));
                                                                        const customBg = cardHotel?.restaurantRoomCardColor || "#1ABC9C";
                                                                        const customText = cardHotel?.restaurantRoomCardTextColor || "#ffffff";

                                                                        // Determine final colors based on priority: Open KOT (Red) > Billed (Yellow) > Default
                                                                        let finalBg = customBg;
                                                                        let finalText = customText;
                                                                        let statusIndicatorColor = "#22C55E";

                                                                        if (hasOpenKOT) {
                                                                            finalBg = "#ef4444"; // Red-500
                                                                            finalText = "#ffffff";
                                                                            statusIndicatorColor = "#ffffff";
                                                                        } else if (isBilled) {
                                                                            finalBg = "#facc15"; // Yellow-400
                                                                            finalText = "#000000";
                                                                            statusIndicatorColor = "#b45309"; // Amber-700
                                                                        }

                                                                        return (
                                                                            <button
                                                                                key={table.id}
                                                                                onClick={() => handleRoomCardClick(table)}
                                                                                onDoubleClick={() => handleRoomCardDoubleClick(table)}
                                                                                onContextMenu={(e) => handleContextMenu(e, table)}
                                                                                className={`group rounded-none p-5 border-none hover:shadow-lg transition-all text-left flex flex-col gap-3 relative overflow-hidden`}
                                                                                style={{
                                                                                    backgroundColor: finalBg,
                                                                                }}
                                                                            >
                                                                                <div className="flex justify-between items-start mt-1">
                                                                                    <div>
                                                                                        <p className="text-2xl font-bold" style={{ color: finalText }}>Table {table.roomNumber}</p>
                                                                                    </div>

                                                                                </div>

                                                                                <div className="mt-2 pt-3 border-t" style={{ borderColor: finalText + "22" }}>
                                                                                    <p className="text-sm font-semibold truncate" style={{ color: finalText }}>
                                                                                        <span className="opacity-60 font-medium">Guest:</span> Walk-in
                                                                                    </p>
                                                                                </div>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )
                                                    ))}
                                                </div>
                                            </section>
                                        );
                                    })()}
                                    <section>
                                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Rooms</h2>
                                        <div className="space-y-5">
                                            {roomGroups.map((group) => (
                                                <div key={`rooms-${group.hotelId}`} className="mb-6 last:mb-0">
                                                    {!activeSelectorHotelId && (
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="h-4 w-1 bg-[#C6A75E] rounded-full" />
                                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{group.hotelName}</h3>
                                                        </div>
                                                    )}
                                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                                        {group.rooms.map((room: any) => {
                                                            // Fixed: match KOT by roomId+hotelId, not roomNumber alone
                                                            const roomHotelId = String(room.hotelId);
                                                            const hasOpenKOT = allKOTs.some(kot => 
                                                              (String(kot.order?.roomId) === String(room.id) || String(kot.order?.roomNumber) === String(room.roomNumber)) &&
                                                              String(kot.hotelId) === roomHotelId &&
                                                              String(kot.status).toUpperCase() === 'OPEN'
                                                            );
                                                            
                                                            const isBilled = isCardBilled(room);

                                                            // Custom Colors from Hotel
                                                            const cardHotel = availableHotels.find(h => String(h.id) === String(room.hotelId));
                                                            const customBg = cardHotel?.restaurantRoomCardColor || "#1ABC9C";
                                                            const customText = cardHotel?.restaurantRoomCardTextColor || "#ffffff";

                                                            // Determine final colors based on priority: Open KOT (Red) > Billed (Yellow) > Default
                                                            let finalBg = customBg;
                                                            let finalText = customText;
                                                            let statusIndicatorColor = "#22C55E";

                                                            if (hasOpenKOT) {
                                                                finalBg = "#ef4444"; // Red-500
                                                                finalText = "#ffffff";
                                                                statusIndicatorColor = "#ffffff";
                                                            } else if (isBilled) {
                                                                finalBg = "#facc15"; // Yellow-400
                                                                finalText = "#000000";
                                                                statusIndicatorColor = "#b45309"; // Amber-700
                                                            }

                                                            return (
                                                                <button
                                                                    key={room.id}
                                                                    onClick={() => handleRoomCardClick(room)}
                                                                    onDoubleClick={() => handleRoomCardDoubleClick(room)}
                                                                    onContextMenu={(e) => handleContextMenu(e, room)}
                                                                    className={`group rounded-none p-5 border-none hover:shadow-lg transition-all text-left flex flex-col gap-3 relative overflow-hidden`}
                                                                    style={{
                                                                        backgroundColor: finalBg,
                                                                    }}
                                                                >
                                                                    <div className="flex justify-between items-start mt-1">
                                                                        <div>
                                                                            <p className="text-2xl font-bold" style={{ color: finalText }}>Room {room.roomNumber}</p>
                                                                        </div>

                                                                    </div>

                                                                    <div className="mt-2 pt-3 border-t" style={{ borderColor: finalText + "22" }}>
                                                                        <p className="text-sm font-semibold truncate" style={{ color: finalText }}>
                                                                            <span className="opacity-60 font-medium">Guest:</span> {room.bookings?.[0]?.guest?.name || room.bookings?.[0]?.guestName || "No Guest"}
                                                                        </p>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                            {roomGroups.every(g => g.rooms.length === 0) && (
                                                <div className="py-12 bg-white rounded-xl border border-dashed border-slate-200 text-center">
                                                    <p className="text-slate-400 font-medium">No checked-in rooms found for this hotel.</p>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            );
                        })()}

                    </div>
                </div>
            </div>

            {contextMenu && (
                <div
                    className="fixed z-[120] w-52 bg-white border border-slate-200 rounded-lg shadow-xl py-1"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        onClick={() => handleContextAction("add")}
                        className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                        <ClipboardPlus className="w-4 h-4" />
                        Add New KOT
                    </button>
                    <button
                        type="button"
                        onClick={() => handleContextAction("bill")}
                        className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                        <HandCoins className="w-4 h-4" />
                        Generate Bill
                    </button>
                    <button
                        type="button"
                        onClick={() => handleContextAction("cancel")}
                        className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                        <X className="w-4 h-4" />
                        Cancel
                    </button>
                </div>
            )}

            {showCleanConfirm && roomToClean && (
                <div className="fixed inset-0 z-[100] bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200">
                        <div className="p-5 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">Confirm Room Clearance</h3>
                        </div>
                        <div className="p-5">
                            <p className="text-sm text-slate-700 whitespace-pre-line">
                                {`Table/Room ${roomToClean.roomNumber || "-"} has been cleared.\n Mark as Clean?`}
                            </p>
                        </div>
                        <div className="p-5 pt-0 flex items-center justify-end gap-3">
                            <button
                                onClick={handleCancelCleaned}
                                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmCleaned}
                                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#C6A75E] hover:bg-[#A8832D]"
                            >
                                Yes, Cleaned
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
