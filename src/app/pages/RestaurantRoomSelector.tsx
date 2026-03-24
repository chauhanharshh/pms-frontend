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
    const { getCheckedInRooms, getKOTs, hotels, systemSettings, rooms, clearRestaurantKOTsForRoom, restaurantTables } = usePMS();
    const navigate = useNavigate();
    const [checkedInRooms, setCheckedInRooms] = useState<any[]>([]);
    const [allHotelsRooms, setAllHotelsRooms] = useState<any[]>([]);
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

    const [activeSelectorHotelId, setActiveSelectorHotelId] = useState<string | undefined>(currentHotelId);

    // Auto-select first hotel if user has no assigned hotel and multi-hotel is on or boss mode is active
    useEffect(() => {
        if (!activeSelectorHotelId && visibleHotels.length > 0 && (systemSettings?.enableRestaurantMultiHotel || isBossAdmin)) {
            setActiveSelectorHotelId(visibleHotels[0].id);
        } else if (!activeSelectorHotelId) {
            setActiveSelectorHotelId(user?.hotelId);
        }
    }, [activeSelectorHotelId, visibleHotels, systemSettings, user?.hotelId, isBossAdmin]);

    // Derived active hotel details
    const activeHotel = visibleHotels.find((h) => h.id === activeSelectorHotelId) || { name: user?.role === "admin" ? "All Hotels (Consolidated)" : "Unknown Hotel", showAllRooms: false } as Hotel;
    const showAllRooms = activeHotel?.showAllRooms === true;
    const posBossMode = activeHotel?.posBossMode === true || (activeHotel?.id === currentHotelId && isPosBossMode);
    const isAllHotelsMode = showAllRooms && posBossMode;

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

    const allContextRooms = useMemo(() => {
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
        // CASE 1: Both enabled -> show ALL rooms of ALL hotels
        if (showAllRooms && posBossMode) {
            return allHotelsRooms.length > 0 ? allHotelsRooms : allContextRooms;
        }

        // CASE 2: Only POS Boss Mode ON -> checked-in/occupied rooms of current selected hotel
        if (posBossMode && !showAllRooms) {
            return currentHotelRooms.filter((r: any) => {
                const status = String(r?.status || "").toLowerCase();
                return status === "occupied" || status === "checked-in" || status === "checked_in";
            });
        }

        // CASE 3: Normal mode -> all rooms of current selected hotel
        return currentHotelRooms;
    }, [showAllRooms, posBossMode, allHotelsRooms, allContextRooms, currentHotelRooms]);

    const filteredRooms = useMemo(() => getRestaurantRooms(), [getRestaurantRooms]);

    const roomGroups = useMemo(() => {
        const hotelName = activeHotel?.name || "Rooms";
        const selectedHotelRooms = filteredRooms.filter(
            (room: any) => !activeSelectorHotelId || room.hotelId === activeSelectorHotelId
        );
        return [{ hotelId: activeSelectorHotelId || "", hotelName, rooms: selectedHotelRooms }];
    }, [activeHotel?.name, activeSelectorHotelId, filteredRooms]);

    const tableHotelGroups = useMemo(() => {
        const hotelsToProcess = activeSelectorHotelId 
            ? visibleHotels.filter(h => h.id === activeSelectorHotelId)
            : (isAllHotelsMode ? visibleHotels : []);
        
        return hotelsToProcess.map(h => ({
            hotelId: h.id,
            hotelName: h.name,
            tables: restaurantTables.filter(t => String(t.hotelId) === String(h.id) && t.isActive)
        })).filter(group => group.tables.length > 0);
    }, [activeSelectorHotelId, visibleHotels, restaurantTables, isAllHotelsMode]);

    useEffect(() => {
        let isMounted = true;

        const fetchRoomAndKotData = async () => {
            try {
                const [roomData, openKots] = await Promise.all([
                    getCheckedInRooms(activeSelectorHotelId),
                    getKOTs("OPEN"),
                ]);

                if (!isMounted) return;

                setCheckedInRooms(roomData);

                if (showAllRooms && posBossMode && activeSelectorHotelId) {
                    const response = await api.get("/rooms", { params: { hotelId: activeSelectorHotelId } });
                    if (!isMounted) return;
                    const selectedHotelRooms = (response?.data?.data || []).map((r: any) => ({
                        id: r.id,
                        roomNumber: r.roomNumber,
                        bookings: r.bookings || [],
                        status: r.status,
                        hotelId: r.hotelId || r.hotel?.id || activeSelectorHotelId,
                    }));
                    setAllHotelsRooms(selectedHotelRooms);
                } else {
                    setAllHotelsRooms([]);
                }

                const relevantKots = (openKots || []).filter((kot: any) => {
                    if (showAllRooms && posBossMode) {
                        return true;
                    }
                    return !activeSelectorHotelId || kot.hotelId === activeSelectorHotelId;
                });

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
                console.error(err);
            }
        };

        fetchRoomAndKotData();

        return () => {
            isMounted = false;
        };
    }, [activeSelectorHotelId, getCheckedInRooms, getKOTs, showAllRooms, posBossMode, refreshTick]);

    useEffect(() => {
        const syncKotRooms = async () => {
            try {
                const openKots = await getKOTs("OPEN");
                const relevantKots = (openKots || []).filter((kot: any) => {
                    if (showAllRooms && posBossMode) return true;
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
    }, [activeSelectorHotelId, getKOTs, showAllRooms, posBossMode]);

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

        navigate(`${getPosPath()}?${params.toString()}`);
    };

    const handleRefresh = () => {
        setRefreshTick((prev) => prev + 1);
        setKotRooms(readStoredList("kotRooms"));
        setBilledRooms(readStoredList("billedRooms"));
    };

    const isCardBilled = (item: any) => {
        const itemId = String(item?.id || "");
        const itemNumber = String(item?.tableId || item?.roomNumber || "").trim();
        const roomToken = `room:${itemNumber}`;
        const tableToken = `table:${itemNumber}`;

        return (
            billedRooms.includes(itemId) ||
            billedRooms.includes(roomToken) ||
            billedRooms.includes(tableToken) ||
            Boolean(billedItems[itemId]) ||
            Boolean(billedItems[itemNumber]) ||
            Boolean(billedItems[roomToken]) ||
            Boolean(billedItems[tableToken])
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
                            <button
                                onClick={handleRefresh}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm rounded-xl font-medium hover:border-[#C6A75E] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C6A75E]/20"
                                style={{ fontFamily: "'Inter', sans-serif" }}
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </button>

                            {(isBossAdmin || systemSettings?.enableRestaurantMultiHotel) && visibleHotels.length > 0 && (
                                <div className="relative group">
                                    <select
                                        value={activeSelectorHotelId || ""}
                                        onChange={(e) => setActiveSelectorHotelId(e.target.value)}
                                        className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm rounded-xl font-medium cursor-pointer hover:border-[#C6A75E] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C6A75E]/20"
                                        style={{ fontFamily: "'Inter', sans-serif" }}
                                    >
                                        <option value="" disabled>Select Hotel</option>
                                        {visibleHotels.map((hotel) => (
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
                                    <section>
                                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Tables</h2>
                                        <div className="space-y-5">
                                            {tableHotelGroups.map((hotelGroup) => (
                                                <div key={`tables-${hotelGroup.hotelId}`}>
                                                    {isAllHotelsMode && (
                                                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                                            {hotelGroup.hotelName}
                                                        </div>
                                                    )}
                                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                                        {hotelGroup.tables.map((t) => {
                                                            const tableId = t.name;
                                                            const table = {
                                                                id: `table:${hotelGroup.hotelId}:${tableId}`,
                                                                tableId,
                                                                roomNumber: tableId,
                                                                status: "vacant",
                                                                isTable: true,
                                                                hotelId: hotelGroup.hotelId,
                                                            };
                                                            const hasOpenKOT = isCardKotCut(table) || tablesWithOpenKOT.has(`${hotelGroup.hotelId}:${tableId}`);
                                                            const isBilled = isCardBilled(table);
                                                            const cardColor = isBilled ? "#FFD700" : hasOpenKOT ? "#FF4444" : "#22C55E";
                                                            const cardBg = isBilled ? "bg-yellow-200 border-yellow-400 hover:border-yellow-500" : hasOpenKOT ? "bg-red-50 border-red-200 hover:border-red-300" : "bg-white border-slate-200 hover:border-[#C6A75E]";

                                                            return (
                                                                <button
                                                                    key={table.id}
                                                                    onClick={() => handleRoomCardClick(table)}
                                                                    onDoubleClick={() => handleRoomCardDoubleClick(table)}
                                                                    onContextMenu={(e) => handleContextMenu(e, table)}
                                                                    className={`group rounded-xl p-5 border hover:shadow-md transition-all text-left flex flex-col gap-3 relative overflow-hidden ${cardBg}`}
                                                                >
                                                                    <div className="absolute top-0 left-0 w-full h-1 transition-colors" style={{ backgroundColor: cardColor }} />

                                                                    <div className="flex justify-between items-start mt-1">
                                                                        <div>
                                                                            <p className="text-2xl font-bold text-slate-800">Table {table.roomNumber}</p>
                                                                        </div>
                                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${isBilled ? "bg-yellow-100 border border-yellow-300" : hasOpenKOT ? "bg-red-100 border border-red-200" : "bg-green-50 border border-green-100"}`}>
                                                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cardColor }} />
                                                                        </div>
                                                                    </div>

                                                                    <div className="mt-2 pt-3 border-t border-slate-100">
                                                                        <p className="text-sm font-semibold text-slate-700 truncate">
                                                                            <span className="text-slate-500 font-medium">Guest:</span> Walk-in
                                                                        </p>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                            {tableHotelGroups.length === 0 && (
                                                <div className="py-12 bg-white rounded-xl border border-dashed border-slate-200 text-center">
                                                    <p className="text-slate-400 font-medium">No active restaurant tables found for this hotel.</p>
                                                    <p className="text-xs text-slate-400">Manage tables in Restaurant -&gt; Table Management</p>
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    <section>
                                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Rooms</h2>
                                        <div className="space-y-5">
                                            {roomGroups.map((group) => (
                                                <div key={`rooms-${group.hotelId}`}>
                                                    {isAllHotelsMode && (
                                                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                                            {group.hotelName}
                                                        </div>
                                                    )}
                                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                                        {group.rooms.map((room) => {
                                                            const hasOpenKOT = roomsWithOpenKOT.has(room.id);
                                                            const isBilled = isCardBilled(room);
                                                            const cardColor = isBilled ? "#FFD700" : hasOpenKOT ? "#FF4444" : "#22C55E";
                                                            const cardBg = isBilled ? "bg-yellow-200 border-yellow-400 hover:border-yellow-500" : hasOpenKOT ? "bg-red-50 border-red-200 hover:border-red-300" : "bg-white border-slate-200 hover:border-[#C6A75E]";

                                                            return (
                                                                <button
                                                                    key={room.id}
                                                                    onClick={() => handleRoomCardClick(room)}
                                                                    onDoubleClick={() => handleRoomCardDoubleClick(room)}
                                                                    onContextMenu={(e) => handleContextMenu(e, room)}
                                                                    className={`group rounded-xl p-5 border hover:shadow-md transition-all text-left flex flex-col gap-3 relative overflow-hidden ${cardBg}`}
                                                                >
                                                                    <div className="absolute top-0 left-0 w-full h-1 transition-colors" style={{ backgroundColor: cardColor }} />

                                                                    <div className="flex justify-between items-start mt-1">
                                                                        <div>
                                                                            <p className="text-2xl font-bold text-slate-800">Room {room.roomNumber}</p>
                                                                        </div>
                                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${isBilled ? "bg-yellow-100 border border-yellow-300" : hasOpenKOT ? "bg-red-100 border border-red-200" : "bg-green-50 border border-green-100"}`}>
                                                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cardColor }} />
                                                                        </div>
                                                                    </div>

                                                                    <div className="mt-2 pt-3 border-t border-slate-100">
                                                                        <p className="text-sm font-semibold text-slate-700 truncate">
                                                                            <span className="text-slate-500 font-medium">Guest:</span> {room.bookings?.[0]?.guest?.name || room.bookings?.[0]?.guestName || "No Guest"}
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
