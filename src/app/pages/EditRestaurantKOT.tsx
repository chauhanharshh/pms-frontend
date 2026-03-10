import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import {
    ShoppingCart,
    Plus,
    Minus,
    Save,
    Trash2,
    ChevronLeft,
    AlertCircle,
    Search
} from "lucide-react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import api from "../services/api";

const GOLD = "#C6A75E";
const DARKGOLD = "#A8832D";

export default function EditRestaurantKOT() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { restaurantItems, updateKOT } = usePMS();

    const [kot, setKot] = useState<any>(null);
    const [cart, setCart] = useState<any[]>([]);
    const [discount, setDiscount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchKOT = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/restaurant/kots`);
                const k = res.data.data.find((item: any) => item.id === id);
                if (!k) {
                    toast.error("KOT not found");
                    navigate("/hotel/restaurant/kots");
                    return;
                }

                if (k.status !== 'OPEN') {
                    toast.error(`Cannot edit a ${k.status} KOT`);
                    navigate("/hotel/restaurant/kots");
                    return;
                }

                setKot(k);
                setDiscount(Number(k.order?.discount || 0));
                setCart(k.items.map((i: any) => ({
                    menuItemId: i.menuItemId,
                    itemName: i.itemName,
                    quantity: i.quantity,
                    price: Number(i.price),
                    itemTotal: i.quantity * Number(i.price),
                    specialNote: i.specialNote || ""
                })));
            } catch (err) {
                console.error("Failed to fetch KOT:", err);
                toast.error("Failed to load KOT details");
            } finally {
                setLoading(false);
            }
        };

        fetchKOT();
    }, [id, navigate]);

    const addToCart = (menuItem: any) => {
        setCart((prev) => {
            const mId = menuItem.id || menuItem.menuItemId;
            const existing = prev.find((i) => i.menuItemId === mId);
            if (existing) {
                return prev.map((i) =>
                    i.menuItemId === mId
                        ? {
                            ...i,
                            quantity: i.quantity + 1,
                            itemTotal: (i.quantity + 1) * Number(menuItem.price),
                        }
                        : i,
                );
            }
            return [
                ...prev,
                {
                    menuItemId: mId,
                    itemName: menuItem.itemName,
                    quantity: 1,
                    price: Number(menuItem.price),
                    itemTotal: Number(menuItem.price),
                },
            ];
        });
    };

    const removeFromCart = (menuItemId: string) => {
        setCart((prev) => {
            const ex = prev.find((i) => i.menuItemId === menuItemId);
            if (!ex) return prev;
            if (ex.quantity === 1) return prev.filter((i) => i.menuItemId !== menuItemId);
            return prev.map((i) =>
                i.menuItemId === menuItemId
                    ? {
                        ...i,
                        quantity: i.quantity - 1,
                        itemTotal: (i.quantity - 1) * i.price,
                    }
                    : i,
            );
        });
    };

    const subtotal = useMemo(() => cart.reduce((s, i) => s + i.itemTotal, 0), [cart]);
    const netSubtotal = Math.max(0, subtotal - discount);
    const gst = netSubtotal * 0.05;
    const serviceCharge = netSubtotal * 0.10;
    const total = netSubtotal + gst + serviceCharge;

    const handleSave = async () => {
        if (cart.length === 0) {
            toast.error("KOT must have at least one item");
            return;
        }

        setSaving(true);
        try {
            await updateKOT(id!, {
                items: cart,
                discount,
                subtotal,
                gst,
                serviceCharge,
                totalAmount: total
            });
            toast.success("KOT updated successfully");
            navigate("/hotel/restaurant/kots");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update KOT");
        } finally {
            setSaving(false);
        }
    };

    const filteredItems = useMemo(() => {
        if (!searchQuery) return restaurantItems;
        const q = searchQuery.toLowerCase();
        return restaurantItems.filter((item: any) =>
            item.itemName.toLowerCase().includes(q)
        );
    }, [restaurantItems, searchQuery]);

    if (loading) {
        return (
            <AppLayout title="Edit KOT">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title={`Edit KOT: ${kot?.kotNumber}`}>
            <div className="max-w-6xl mx-auto space-y-6 pb-20">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to KOTs
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-400">Status:</span>
                        <span
                            className="px-2 py-1 text-white text-[10px] font-black rounded uppercase tracking-widest shadow-sm"
                            style={{ background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})` }}
                        >
                            {kot?.status}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Item Selection */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-nowrap">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Plus className="w-5 h-5 text-[#C6A75E]" />
                                    Add More Items
                                </h3>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search menu..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#C6A75E] w-full sm:w-64"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {filteredItems.map((item: any) => (
                                    <button
                                        key={item.id}
                                        onClick={() => addToCart(item)}
                                        className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all group"
                                    >
                                        <div className="text-left">
                                            <p className="font-semibold text-gray-900 text-sm truncate max-w-[150px]">{item.itemName}</p>
                                            <p className="text-xs text-gray-500">₹{item.price}</p>
                                        </div>
                                        <Plus className="w-4 h-4 text-gray-400 group-hover:text-[#C6A75E] transition-colors" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-[#C6A75E]" />
                                KOT Items
                            </h3>
                            <div className="space-y-3">
                                {cart.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400 italic">No items in KOT</div>
                                ) : (
                                    cart.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm group">
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-900">{item.itemName}</p>
                                                <p className="text-xs text-gray-500">₹{item.price} each</p>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-3 bg-gray-50 p-1 rounded-lg border border-gray-100">
                                                    <button onClick={() => removeFromCart(item.menuItemId)} className="p-1 hover:bg-white hover:text-red-500 rounded transition-all">
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                                                    <button onClick={() => addToCart(item)} className="p-1 hover:bg-white hover:text-[#C6A75E] rounded transition-all">
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="text-right w-24">
                                                    <p className="font-bold text-gray-900">₹{item.itemTotal.toLocaleString()}</p>
                                                </div>
                                                <button
                                                    onClick={() => setCart(prev => prev.filter(i => i.menuItemId !== item.menuItemId))}
                                                    className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Totals and Save */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 pb-2 border-b border-gray-50">KOT Summary</h3>

                            <div className="space-y-4 mb-6 text-nowrap">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium tracking-tight">Order Subtotal</span>
                                    <span className="text-gray-900 font-bold">₹{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm gap-4">
                                    <span className="text-gray-500 font-medium">Discount</span>
                                    <div className="relative w-32">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                                        <input
                                            type="number"
                                            value={discount}
                                            onChange={(e) => setDiscount(Number(e.target.value))}
                                            className="w-full pl-6 pr-2 py-1 bg-gray-50 border border-gray-200 rounded text-right font-bold text-sm focus:outline-none focus:ring-1 focus:ring-[#C6A75E]"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">GST (5%)</span>
                                    <span className="text-gray-900 font-bold">₹{gst.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Service Charge (10%)</span>
                                    <span className="text-gray-900 font-bold">₹{serviceCharge.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="py-4 border-t border-gray-100 mb-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-base font-bold text-gray-900 uppercase tracking-wider">Estimated Total</span>
                                    <span className="text-2xl font-black text-[#C6A75E]">₹{total.toLocaleString()}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving || cart.length === 0}
                                className="w-full flex items-center justify-center gap-2 py-4 text-white rounded-xl font-bold shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                                style={{
                                    background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})`,
                                    boxShadow: `0 10px 15px -3px rgba(198, 167, 94, 0.2)`
                                }}
                            >
                                {saving ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Save KOT
                                    </>
                                )}
                            </button>

                            <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-lg flex gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                    Editing this KOT will update the associated restaurant order items and totals. Make sure to reprint the KOT after saving.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
