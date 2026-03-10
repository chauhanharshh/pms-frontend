import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import { ArrowLeft, Users, Plus, Edit2, Trash2 } from "lucide-react";
import api from "../services/api";

export function StewardManagement() {
    const { currentHotelId, user } = useAuth();
    const { hotels } = usePMS();
    const navigate = useNavigate();
    const currentHotel = hotels.find((h) => h.id === currentHotelId);

    const [stewards, setStewards] = useState<any[]>([]);
    const [newStewardName, setNewStewardName] = useState("");
    const [editingSteward, setEditingSteward] = useState<any>(null);
    const [selectedHotelId, setSelectedHotelId] = useState<string>(currentHotelId || "");

    useEffect(() => {
        if (!selectedHotelId && hotels.length > 0) {
            setSelectedHotelId(hotels[0].id);
        }
    }, [hotels, selectedHotelId]);

    useEffect(() => {
        if (selectedHotelId) fetchStewards();
    }, [selectedHotelId]);

    const fetchStewards = async () => {
        if (!selectedHotelId) return;
        try {
            const res = await api.get(`/stewards?hotelId=${selectedHotelId}`);
            if (res.data.status === 'success') {
                setStewards(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch stewards", error);
        }
    };

    const handleAddSteward = async () => {
        if (!newStewardName.trim() || !selectedHotelId) return;
        try {
            await api.post('/stewards', { name: newStewardName, hotelId: selectedHotelId });
            setNewStewardName("");
            fetchStewards();
        } catch (error) {
            console.error("Failed to add steward", error);
            alert("Failed to add steward");
        }
    };

    const handleUpdateSteward = async (id: string, newName: string) => {
        if (!newName.trim() || !selectedHotelId) return;
        try {
            await api.put(`/stewards/${id}`, { name: newName, hotelId: selectedHotelId });
            setEditingSteward(null);
            fetchStewards();
        } catch (error) {
            console.error("Failed to update steward", error);
            alert("Failed to update steward");
        }
    };

    const handleDeleteSteward = async (id: string) => {
        if (!confirm("Are you sure you want to delete this steward?")) return;
        try {
            await api.delete(`/stewards/${id}?hotelId=${selectedHotelId}`);
            fetchStewards();
        } catch (error) {
            console.error("Failed to delete steward", error);
            alert("Failed to delete steward");
        }
    };

    const handleBack = () => {
        if (user?.role === "admin") {
            navigate("/admin");
        } else {
            navigate("/hotel");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Stewards Management</h1>
                        <p className="text-sm text-gray-500">{hotels.find(h => h.id === selectedHotelId)?.name || "Select Hotel"}</p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-xl shadow-md p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Users className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Stewards Management
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        Manage stewards for POS Billing
                                    </p>
                                </div>
                            </div>

                            {user?.role === "admin" && (
                                <div className="min-w-[200px]">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                        Select Hotel
                                    </label>
                                    <select
                                        value={selectedHotelId}
                                        onChange={(e) => setSelectedHotelId(e.target.value)}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none text-sm transition-all cursor-pointer font-medium"
                                    >
                                        {hotels.map(hotel => (
                                            <option key={hotel.id} value={hotel.id}>
                                                {hotel.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Add Steward Form */}
                        <div className="flex gap-4 mb-8">
                            <input
                                type="text"
                                placeholder="New Steward Name"
                                value={newStewardName}
                                onChange={(e) => setNewStewardName(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                onKeyDown={(e) => e.key === "Enter" && handleAddSteward()}
                            />
                            <button
                                onClick={handleAddSteward}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Add Steward
                            </button>
                        </div>

                        {/* Stewards List */}
                        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-100 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-sm font-semibold text-gray-700">Steward Name</th>
                                        <th className="px-6 py-3 text-sm font-semibold text-gray-700 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {stewards.length === 0 ? (
                                        <tr>
                                            <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                                                No stewards configured for this hotel
                                            </td>
                                        </tr>
                                    ) : (
                                        stewards.map(steward => (
                                            <tr key={steward.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    {editingSteward?.id === steward.id ? (
                                                        <input
                                                            type="text"
                                                            autoFocus
                                                            value={editingSteward.name}
                                                            onChange={(e) => setEditingSteward({ ...editingSteward, name: e.target.value })}
                                                            className="w-full px-3 py-1.5 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") handleUpdateSteward(steward.id, editingSteward.name);
                                                                if (e.key === "Escape") setEditingSteward(null);
                                                            }}
                                                            onBlur={() => handleUpdateSteward(steward.id, editingSteward.name)}
                                                        />
                                                    ) : (
                                                        steward.name
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {editingSteward?.id === steward.id ? (
                                                            <button
                                                                onClick={() => handleUpdateSteward(steward.id, editingSteward.name)}
                                                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                                                            >
                                                                Save
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => setEditingSteward(steward)}
                                                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                                                                title="Edit Steward"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteSteward(steward.id)}
                                                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                                                            title="Delete Steward"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
