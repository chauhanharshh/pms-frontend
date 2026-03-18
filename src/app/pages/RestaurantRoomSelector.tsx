import { useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS, Hotel } from "../contexts/PMSContext";
import { BedDouble, AlertCircle, Building2, ChevronDown } from "lucide-react";

export function RestaurantRoomSelector() {
    const { user } = useAuth();
    const { getCheckedInRooms, getKOTs, hotels, systemSettings, rooms } = usePMS();
    const navigate = useNavigate();
    const [checkedInRooms, setCheckedInRooms] = useState<any[]>([]);
    const [allRooms, setAllRooms] = useState<any[]>([]);
    const [roomsWithOpenKOT, setRoomsWithOpenKOT] = useState<Set<string>>(new Set());
    const clickTimersRef = useRef<Record<string, number>>({});
    const currentHotelId = user?.hotelId || "";
    const currentUserHotel = hotels.find(h => h.id === currentHotelId);
    const isPosBossMode = currentUserHotel?.posBossMode === true;
    const isBossAdmin = user?.role === "admin" || isPosBossMode;

    const [activeSelectorHotelId, setActiveSelectorHotelId] = useState<string | undefined>(currentHotelId);

    // Auto-select first hotel if user has no assigned hotel and multi-hotel is on or boss mode is active
    useEffect(() => {
        if (!activeSelectorHotelId && hotels.length > 0 && (systemSettings?.enableRestaurantMultiHotel || isBossAdmin)) {
            setActiveSelectorHotelId(hotels[0].id);
        } else if (!activeSelectorHotelId) {
            setActiveSelectorHotelId(user?.hotelId);
        }
    }, [activeSelectorHotelId, hotels, systemSettings, user?.hotelId]);

    // Derived active hotel details
    const activeHotel = hotels.find((h) => h.id === activeSelectorHotelId) || { name: user?.role === "admin" ? "All Hotels (Consolidated)" : "Unknown Hotel", showAllRooms: false } as Hotel;

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

                const relevantKots = (openKots || []).filter((kot: any) => {
                    return !activeSelectorHotelId || kot.hotelId === activeSelectorHotelId;
                });

                const roomIdsWithOpenKOT = new Set<string>(
                    relevantKots
                        .map((kot: any) => kot.order?.roomId)
                        .filter((roomId: unknown): roomId is string => typeof roomId === "string" && roomId.length > 0)
                );

                setRoomsWithOpenKOT(roomIdsWithOpenKOT);
            } catch (err) {
                console.error(err);
            }
        };

        fetchRoomAndKotData();

        if (activeHotel?.showAllRooms) {
            setAllRooms(rooms.filter(r => r.hotelId === activeSelectorHotelId));
        }

        return () => {
            isMounted = false;
        };
    }, [activeSelectorHotelId, getCheckedInRooms, getKOTs, activeHotel?.showAllRooms, rooms]);

    // Create a base path depending on the user role to redirect correctly
    const getPosPath = () => {
        return user?.role === "admin" ? "/admin/restaurant/pos" : "/hotel/restaurant/pos";
    };

    const handleRoomSelect = (roomId: string) => {
        const queryParams = activeSelectorHotelId ? `?hotelId=${activeSelectorHotelId}&roomId=${roomId}` : `?roomId=${roomId}`;
        navigate(`${getPosPath()}${queryParams}`);
    };

    const getKOTWallPath = () => {
        return user?.role === "admin" ? "/admin/restaurant/kot-wall" : "/hotel/restaurant/kot-wall";
    };

    const handleRoomCardClick = (roomId: string) => {
        if (clickTimersRef.current[roomId]) {
            window.clearTimeout(clickTimersRef.current[roomId]);
        }

        clickTimersRef.current[roomId] = window.setTimeout(() => {
            handleRoomSelect(roomId);
            delete clickTimersRef.current[roomId];
        }, 220);
    };

    const handleRoomCardDoubleClick = (room: any) => {
        if (clickTimersRef.current[room.id]) {
            window.clearTimeout(clickTimersRef.current[room.id]);
            delete clickTimersRef.current[room.id];
        }

        const params = new URLSearchParams();
        if (activeSelectorHotelId) params.set("hotelId", activeSelectorHotelId);
        params.set("roomNumber", String(room.roomNumber || ""));
        params.set("tableNumber", String(room.roomNumber || ""));
        params.set("returnTo", user?.role === "admin" ? "/admin/restaurant/rooms" : "/hotel/restaurant/rooms");

        navigate(`${getKOTWallPath()}?${params.toString()}`);
    };

    useEffect(() => {
        return () => {
            Object.values(clickTimersRef.current).forEach((timerId) => {
                window.clearTimeout(timerId);
            });
            clickTimersRef.current = {};
        };
    }, []);

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
                        {(isBossAdmin || systemSettings?.enableRestaurantMultiHotel) && hotels.length > 0 && (
                            <div className="relative group">
                                <select
                                    value={activeSelectorHotelId || ""}
                                    onChange={(e) => setActiveSelectorHotelId(e.target.value)}
                                    className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm rounded-xl font-medium cursor-pointer hover:border-[#C6A75E] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C6A75E]/20"
                                    style={{ fontFamily: "'Inter', sans-serif" }}
                                >
                                    <option value="" disabled>Select Hotel</option>
                                    {hotels.map((hotel) => (
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

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Display Section */}
                        {(() => {
                            const roomsToDisplay = activeHotel?.showAllRooms 
                                ? allRooms.map(r => ({
                                    id: r.id,
                                    roomNumber: r.roomNumber,
                                    bookings: r.bookings || [],
                                    status: r.status
                                  })) 
                                : checkedInRooms;
                            
                            if (roomsToDisplay.length === 0) {
                                return (
                                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
                                        <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
                                        <h3 className="text-lg font-semibold text-slate-700">
                                            {activeHotel?.showAllRooms ? "No Rooms Found" : "No Checked-in Rooms"}
                                        </h3>
                                        <p className="text-slate-500 text-sm mt-1">
                                            {activeHotel?.showAllRooms 
                                                ? "There are currently no rooms available for this hotel." 
                                                : "There are currently no guests checked in to associate with a POS order."}
                                        </p>
                                    </div>
                                );
                            }

                            return (
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {roomsToDisplay.map((room: any) => {
                                        const currentBooking = room.bookings?.find((b: any) => b.status === 'checked_in') || checkedInRooms.find(r => r.id === room.id)?.bookings?.find((b: any) => b.status === 'checked_in');
                                        const guestName = currentBooking?.guest?.name || checkedInRooms.find(r => r.id === room.id)?.guestName || "Vacant";
                                        const hasOpenKOT = roomsWithOpenKOT.has(room.id);

                                    return (
                                        <button
                                            key={room.id}
                                            onClick={() => handleRoomCardClick(room.id)}
                                            onDoubleClick={() => handleRoomCardDoubleClick(room)}
                                            className={`group rounded-xl p-5 border hover:shadow-md transition-all text-left flex flex-col gap-3 relative overflow-hidden ${hasOpenKOT ? "bg-red-50 border-red-200 hover:border-red-300" : "bg-white border-slate-200 hover:border-[#C6A75E]"}`}
                                        >
                                            {/* Accent strip */}
                                            <div className={`absolute top-0 left-0 w-full h-1 transition-colors ${hasOpenKOT ? "bg-red-400 group-hover:bg-red-500" : "bg-slate-100 group-hover:bg-[#C6A75E]"}`} />

                                            <div className="flex justify-between items-start mt-1">
                                                <div>
                                                    <p className="text-2xl font-bold text-slate-800">Room {room.roomNumber}</p>
                                                </div>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${hasOpenKOT ? "bg-red-100 border border-red-200" : "bg-green-50 border border-green-100"}`}>
                                                    <div className={`w-2.5 h-2.5 rounded-full ${hasOpenKOT ? "bg-red-500" : "bg-green-500"}`} />
                                                </div>
                                            </div>

                                            <div className="mt-2 pt-3 border-t border-slate-100">
                                                <p className="text-sm font-semibold text-slate-700 truncate">
                                                    <span className="text-slate-500 font-medium">Guest:</span> {guestName}
                                                </p>
                                            </div>
                                </button>
                                        );
                                    })}
                                </div>
                            );
                        })()}

                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
