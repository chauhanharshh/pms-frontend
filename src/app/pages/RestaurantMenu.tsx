import { useState } from "react";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { RestaurantCategory, RestaurantItem, usePMS } from "../contexts/PMSContext";
import { formatCurrency } from "../utils/format";
import {
  ChefHat,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  AlertCircle
} from "lucide-react";

const GOLD = "#C6A75E";
const DARKGOLD = "#A8832D";

export function RestaurantMenu() {
  const { user } = useAuth();
  const {
    restaurantCategories,
    restaurantItems,
    addCategory,
    updateCategory,
    deleteCategory,
    addItem,
    updateItem,
    deleteItem,
    hotels,
  } = usePMS();
  const isAdmin = user?.role === "admin";
  const [selectedAdminHotelId, setSelectedAdminHotelId] = useState<string>(hotels[0]?.id || "");
  const hotelId = isAdmin ? (selectedAdminHotelId || null) : user?.hotelId;

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "cat" | "item";
    id: string;
  } | null>(null);

  const emptyItemForm = (
    hId: string,
    catId: string,
  ): Omit<RestaurantItem, "id" | "category"> => ({
    hotelId: hId,
    categoryId: catId,
    itemName: "",
    description: "",
    price: 0,
    isAvailable: true,
    isVeg: true,
    taxRate: 0,
  });
  const emptyCatForm = (hId: string): Omit<RestaurantCategory, "id" | "menuItems"> => ({
    hotelId: hId,
    name: "",
    description: "",
    isActive: true,
    sortOrder: 0,
  });

  const activeHotelId = hotelId || hotels[0]?.id || "default";

  const [catForm, setCatForm] = useState(emptyCatForm(activeHotelId));
  const [itemForm, setItemForm] = useState(emptyItemForm(activeHotelId, ""));

  const categories = restaurantCategories.filter(
    (c) => !hotelId || c.hotelId === hotelId,
  );
  const selectedCat = activeCategory || categories[0]?.id || null;
  const items = restaurantItems.filter(
    (i) => i.categoryId === selectedCat && (!hotelId || i.hotelId === hotelId),
  );

  const openAddCat = () => {
    setCatForm(emptyCatForm(activeHotelId));
    setEditingCatId(null);
    setShowCatForm(true);
  };
  const openEditCat = (cat: RestaurantCategory) => {
    setCatForm({ ...cat });
    setEditingCatId(cat.id);
    setShowCatForm(true);
  };
  const handleSaveCat = () => {
    if (!catForm.name) return;
    if (editingCatId) {
      updateCategory(editingCatId, catForm);
    } else {
      addCategory(catForm);
    }
    setShowCatForm(false);
  };

  const openAddItem = () => {
    setItemForm(
      emptyItemForm(
        activeHotelId,
        selectedCat || "",
      ),
    );
    setEditingItemId(null);
    setShowItemForm(true);
  };
  const openEditItem = (item: RestaurantItem) => {
    setItemForm({ ...item });
    setEditingItemId(item.id);
    setShowItemForm(true);
  };
  const handleSaveItem = () => {
    if (!itemForm.itemName || Number(itemForm.price) <= 0) return;
    if (editingItemId) {
      updateItem(editingItemId, itemForm);
    } else {
      addItem(itemForm);
    }
    setShowItemForm(false);
  };

  return (
    <AppLayout title="Restaurant Menu">
      <div className="flex gap-5 h-full max-w-6xl">
        {/* Category Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div
            className="rounded-2xl overflow-hidden h-full"
            style={{
              background: "white",
              border: "1px solid #E5E1DA",
              boxShadow: "0 2px 12px rgba(184,134,11,0.06)",
            }}
          >
            <div
              className="px-4 py-4 flex items-center justify-between"
              style={{
                borderBottom: "2px solid #E5E1DA",
                background: "linear-gradient(135deg, #FFFFFF, #FFFFFF)",
              }}
            >
              <h3
                className="font-semibold text-sm"
                style={{
                  fontFamily: "Times New Roman, serif",
                  color: DARKGOLD,
                }}
              >
                Categories
              </h3>
              <div className="flex items-center gap-2">
                {isAdmin && hotels.length > 0 && (
                  <select
                    value={selectedAdminHotelId}
                    onChange={(e) => {
                      setSelectedAdminHotelId(e.target.value);
                      setActiveCategory(null);
                    }}
                    className="text-xs px-2 py-1 bg-white border border-slate-200 rounded outline-none focus:ring-1 focus:ring-[#C6A75E]"
                  >
                    {hotels.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                )}
                <button
                  onClick={openAddCat}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                  style={{
                    background: "linear-gradient(135deg, #C6A75E, #A8832D)",
                  }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-3 space-y-1">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all"
                  style={{
                    background:
                      selectedCat === cat.id
                        ? "linear-gradient(135deg, #E5E1DA, rgba(153,101,21,0.1))"
                        : "transparent",
                    borderLeft:
                      selectedCat === cat.id
                        ? "3px solid #C6A75E"
                        : "3px solid transparent",
                  }}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <div className="min-w-0">
                    <div
                      className="text-sm font-medium truncate"
                      style={{
                        color: selectedCat === cat.id ? GOLD : "#1F2937",
                      }}
                    >
                      {cat.name}
                    </div>
                    <div className="text-xs" style={{ color: "#9CA3AF" }}>
                      {
                        restaurantItems.filter((i) => i.categoryId === cat.id)
                          .length
                      }{" "}
                      items
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditCat(cat);
                      }}
                      className="p-1 rounded hover:bg-amber-50"
                      style={{ color: GOLD }}
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({ type: "cat", id: cat.id });
                      }}
                      className="p-1 rounded hover:bg-red-50 text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <div
                  className="py-8 text-center text-sm"
                  style={{ color: "#9CA3AF" }}
                >
                  No categories yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items Area */}
        <div className="flex-1 min-w-0">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "white",
              border: "1px solid #E5E1DA",
              boxShadow: "0 2px 12px rgba(184,134,11,0.06)",
            }}
          >
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{
                borderBottom: "2px solid #E5E1DA",
                background: "linear-gradient(135deg, #FFFFFF, #FFFFFF)",
              }}
            >
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5" style={{ color: GOLD }} />
                <h2
                  className="font-semibold"
                  style={{
                    fontFamily: "Times New Roman, serif",
                    color: DARKGOLD,
                  }}
                >
                  {categories.find((c) => c.id === selectedCat)?.name ||
                    "Menu Items"}
                </h2>
                <span
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{
                    background: "rgba(221, 215, 204,0.1)",
                    color: DARKGOLD,
                  }}
                >
                  {items.length} items
                </span>
              </div>
              {selectedCat && (
                <button
                  onClick={openAddItem}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium text-white"
                  style={{
                    background: "linear-gradient(135deg, #C6A75E, #A8832D)",
                  }}
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              )}
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl p-4 flex items-start justify-between"
                  style={{
                    border: "1px solid rgba(184,134,11,0.12)",
                    background: item.isAvailable ? "#FFFFFF" : "#f9f9f9",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{
                          background: item.isVeg ? "#16a34a" : "#dc2626",
                          border: "2px solid currentColor",
                        }}
                      />
                      <span
                        className="font-semibold text-sm truncate"
                        style={{ color: "#1F2937" }}
                      >
                        {item.itemName}
                      </span>
                    </div>
                    <p
                      className="text-xs truncate mb-1"
                      style={{ color: "#9CA3AF" }}
                    >
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-base font-bold"
                        style={{ color: GOLD }}
                      >
                        {formatCurrency(item.price)}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: item.isAvailable ? "#dcfce7" : "#fee2e2",
                          color: item.isAvailable ? "#166534" : "#dc2626",
                        }}
                      >
                        {item.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 ml-2 flex-shrink-0">
                    <button
                      onClick={() => openEditItem(item)}
                      className="p-1.5 rounded-lg"
                      style={{ color: GOLD }}
                      onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(221, 215, 204,0.1)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        updateItem(item.id, { isAvailable: !item.isAvailable })
                      }
                      className="p-1.5 rounded-lg text-blue-500"
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#eff6ff")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                      title="Toggle availability"
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full border-2"
                        style={{ borderColor: "#3b82f6" }}
                      />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteConfirm({ type: "item", id: item.id })
                      }
                      className="p-1.5 rounded-lg text-red-400"
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#fee2e2")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {items.length === 0 && selectedCat && (
                <div
                  className="col-span-2 py-12 text-center text-sm"
                  style={{ color: "#9CA3AF" }}
                >
                  No items in this category. Click "Add Item" to start.
                </div>
              )}
              {!selectedCat && (
                <div
                  className="col-span-2 py-12 text-center text-sm"
                  style={{ color: "#9CA3AF" }}
                >
                  Select a category to manage items
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Form Modal */}
      {showCatForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="w-96 rounded-2xl" style={{ background: "white" }}>
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{
                borderBottom: "2px solid #E5E1DA",
                background: "#FFFFFF",
              }}
            >
              <h2
                style={{
                  fontFamily: "Times New Roman, serif",
                  color: DARKGOLD,
                }}
              >
                {editingCatId ? "Edit Category" : "Add Category"}
              </h2>
              <button
                onClick={() => setShowCatForm(false)}
                className="text-gray-500 hover:text-red-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: DARKGOLD }}
                >
                  Category Name *
                </label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg outline-none"
                  style={{ border: "2px solid #E5E1DA" }}
                  value={catForm.name}
                  onChange={(e) =>
                    setCatForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: DARKGOLD }}
                >
                  Description
                </label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg outline-none"
                  style={{ border: "2px solid #E5E1DA" }}
                  value={catForm.description}
                  onChange={(e) =>
                    setCatForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="catActive"
                  checked={catForm.isActive}
                  onChange={(e) =>
                    setCatForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                />
                <label
                  htmlFor="catActive"
                  className="text-sm"
                  style={{ color: DARKGOLD }}
                >
                  Active
                </label>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCatForm(false)}
                  className="px-4 py-2 rounded-lg text-sm"
                  style={{
                    border: "1px solid #E5E1DA",
                    color: DARKGOLD,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCat}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white"
                  style={{
                    background: "linear-gradient(135deg, #C6A75E, #A8832D)",
                  }}
                >
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item Form Modal */}
      {showItemForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="w-full max-w-md rounded-2xl"
            style={{ background: "white" }}
          >
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{
                borderBottom: "2px solid #E5E1DA",
                background: "#FFFFFF",
              }}
            >
              <h2
                style={{
                  fontFamily: "Times New Roman, serif",
                  color: DARKGOLD,
                }}
              >
                {editingItemId ? "Edit Item" : "Add Item"}
              </h2>
              <button
                onClick={() => setShowItemForm(false)}
                className="text-gray-500 hover:text-red-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: DARKGOLD }}
                >
                  Item Name *
                </label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg outline-none"
                  style={{ border: "2px solid #E5E1DA" }}
                  value={itemForm.itemName}
                  onChange={(e) =>
                    setItemForm((f) => ({ ...f, itemName: e.target.value }))
                  }
                />
              </div>
              <div className="col-span-2">
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: DARKGOLD }}
                >
                  Description
                </label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg outline-none"
                  style={{ border: "2px solid #E5E1DA" }}
                  value={itemForm.description}
                  onChange={(e) =>
                    setItemForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: DARKGOLD }}
                >
                  Price (₹) *
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2.5 rounded-lg outline-none"
                  style={{ border: "2px solid #E5E1DA" }}
                  value={itemForm.price}
                  onChange={(e) =>
                    setItemForm((f) => ({
                      ...f,
                      price: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: DARKGOLD }}
                >
                  Category
                </label>
                <select
                  className="w-full px-3 py-2.5 rounded-lg outline-none"
                  style={{ border: "2px solid #E5E1DA" }}
                  value={itemForm.categoryId}
                  onChange={(e) =>
                    setItemForm((f) => ({ ...f, categoryId: e.target.value }))
                  }
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isVeg"
                  checked={itemForm.isVeg}
                  onChange={(e) =>
                    setItemForm((f) => ({ ...f, isVeg: e.target.checked }))
                  }
                />
                <label
                  htmlFor="isVeg"
                  className="text-sm flex items-center gap-1"
                  style={{ color: DARKGOLD }}
                >
                  <div className="w-3 h-3 rounded-full bg-green-600" />{" "}
                  Vegetarian
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isAvail"
                  checked={itemForm.isAvailable}
                  onChange={(e) =>
                    setItemForm((f) => ({
                      ...f,
                      isAvailable: e.target.checked,
                    }))
                  }
                />
                <label
                  htmlFor="isAvail"
                  className="text-sm"
                  style={{ color: DARKGOLD }}
                >
                  Available
                </label>
              </div>
              <div className="col-span-2 flex justify-end gap-3">
                <button
                  onClick={() => setShowItemForm(false)}
                  className="px-4 py-2 rounded-lg text-sm"
                  style={{
                    border: "1px solid #E5E1DA",
                    color: DARKGOLD,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveItem}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white"
                  style={{
                    background: "linear-gradient(135deg, #C6A75E, #A8832D)",
                  }}
                >
                  <Save className="w-4 h-4" /> Save Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="w-80 rounded-2xl p-6 text-center"
            style={{ background: "white" }}
          >
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
            <p className="font-semibold mb-4">
              Delete this {deleteConfirm.type === "cat" ? "category" : "item"}?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 rounded-lg text-sm"
                style={{
                  border: "1px solid #E5E1DA",
                  color: DARKGOLD,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === "cat") {
                    deleteCategory(deleteConfirm.id);
                  } else {
                    deleteItem(deleteConfirm.id);
                  }
                  setDeleteConfirm(null);
                }}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
