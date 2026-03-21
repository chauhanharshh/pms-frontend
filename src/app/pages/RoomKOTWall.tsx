import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { AppLayout } from "../layouts/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import { formatCurrency } from "../utils/format";
import { toast } from "sonner";
import { Printer, X } from "lucide-react";
import { getKotWallColors } from "../utils/kotWallColors";

type SearchMode = "serial" | "table-room";
const KOT_DASH = "- - - - - - - - - - - - - - - -";
const RECEIPT_DASH = "- ".repeat(21).trim();

function formatDateTime(value: string | undefined) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yy = String(dt.getFullYear()).slice(-2);
  const hh = String(dt.getHours()).padStart(2, "0");
  const min = String(dt.getMinutes()).padStart(2, "0");
  const ss = String(dt.getSeconds()).padStart(2, "0");
  return `${dd}-${mm}-${yy} ${hh}:${min}:${ss}`;
}

function formatKotDateTime(value: string | undefined) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yy = String(dt.getFullYear()).slice(-2);
  const hh = String(dt.getHours()).padStart(2, "0");
  const min = String(dt.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${yy} ${hh}:${min}`;
}

export function RoomKOTWall() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { refreshRestaurantKOTs, deleteKOT, generateOrderInvoice, hotels } = usePMS();

  const queryRoomNumber = (searchParams.get("roomNumber") || "").trim();
  const querySourceType = (searchParams.get("sourceType") || "").trim().toLowerCase();
  const isTableSource = querySourceType === "table";
  const queryTableNumber = (searchParams.get("tableNumber") || queryRoomNumber).trim();
  const queryHotelId = (searchParams.get("hotelId") || user?.hotelId || "").trim();
  const queryReturnTo = searchParams.get("returnTo") || "";

  const defaultExitPath = user?.role === "admin" ? "/admin/restaurant/rooms" : "/hotel/restaurant/rooms";
  const exitPath = queryReturnTo || defaultExitPath;

  const [loading, setLoading] = useState(false);
  const [kots, setKots] = useState<any[]>([]);
  const [tableNumberFilter, setTableNumberFilter] = useState(queryTableNumber || queryRoomNumber);
  const [roomNumberFilter, setRoomNumberFilter] = useState(queryRoomNumber);
  const [searchMode, setSearchMode] = useState<SearchMode>("table-room");
  const [selectedKotIds, setSelectedKotIds] = useState<Set<string>>(new Set());
  const [activeKotId, setActiveKotId] = useState<string | null>(null);
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [invoiceToPreview, setInvoiceToPreview] = useState<any>(null);
  const [isGeneratingBill, setIsGeneratingBill] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printMode, setPrintMode] = useState<"kot" | null>(null);
  const [printingKotId, setPrintingKotId] = useState<string | null>(null);

  const roleBase = user?.role === "admin" ? "/admin" : "/hotel";
  const isKotOpen = (kot: any) => String(kot?.status || "").toUpperCase() === "OPEN";
  const [kotWallColors, setKotWallColors] = useState(() => getKotWallColors());

  const markRoomAsBilled = (roomId?: string, roomNumber?: string, tableNumber?: string) => {
    if (!roomId && !roomNumber && !tableNumber) return;
    const raw = localStorage.getItem("billedRooms") || "[]";
    const rawItems = localStorage.getItem("billedItems") || "{}";
    let billedRooms: string[] = [];
    let billedItems: Record<string, boolean> = {};
    try {
      const parsed = JSON.parse(raw);
      billedRooms = Array.isArray(parsed) ? parsed : [];
    } catch {
      billedRooms = [];
    }
    try {
      billedItems = JSON.parse(rawItems) || {};
    } catch {
      billedItems = {};
    }

    const roomToken = roomNumber ? `room:${String(roomNumber).trim()}` : "";
    const tableKey = tableNumber ? String(tableNumber).trim() : "";
    const tableToken = tableKey ? `table:${tableKey}` : "";
    let changed = false;
    let itemsChanged = false;

    if (roomId && !billedRooms.includes(roomId)) {
      billedRooms.push(roomId);
      changed = true;
    }
    if (roomToken && !billedRooms.includes(roomToken)) {
      billedRooms.push(roomToken);
      changed = true;
    }
    if (tableToken && !billedRooms.includes(tableToken)) {
      billedRooms.push(tableToken);
      changed = true;
    }

    if (roomId && !billedItems[roomId]) {
      billedItems[roomId] = true;
      itemsChanged = true;
    }
    if (roomToken && !billedItems[roomToken]) {
      billedItems[roomToken] = true;
      itemsChanged = true;
    }
    if (tableKey && !billedItems[tableKey]) {
      billedItems[tableKey] = true;
      itemsChanged = true;
    }
    if (tableToken && !billedItems[tableToken]) {
      billedItems[tableToken] = true;
      itemsChanged = true;
    }

    if (changed) {
      localStorage.setItem("billedRooms", JSON.stringify(billedRooms));
    }
    if (itemsChanged) {
      localStorage.setItem("billedItems", JSON.stringify(billedItems));
    }
    if (changed || itemsChanged) {
      window.dispatchEvent(new CustomEvent("restaurant:billed-rooms-updated", {
        detail: {
          roomId,
          roomNumber: roomNumber ? String(roomNumber).trim() : "",
          tableNumber: tableKey,
        }
      }));
    }
  };

  const loadKOTs = async () => {
    try {
      setLoading(true);
      const all = await refreshRestaurantKOTs("OPEN");
      const normalizedSerialOrTable = tableNumberFilter.trim().toLowerCase();
      const normalizedRoom = roomNumberFilter.trim().toLowerCase();

      const filtered = (all || []).filter((kot: any) => {
        if (String(kot?.status || "").toUpperCase() !== "OPEN") return false;
        if (queryHotelId && kot.hotelId && kot.hotelId !== queryHotelId) return false;

        const kotNo = String(kot.kotNumber || "").toLowerCase();
        const tableNo = String(kot.order?.tableNumber || "").toLowerCase();
        const roomNo = String(kot.order?.room?.roomNumber || "").toLowerCase();

        if (searchMode === "serial") {
          return normalizedSerialOrTable ? kotNo.includes(normalizedSerialOrTable) : true;
        }

        const tableOrRoomMatch = normalizedSerialOrTable
          ? isTableSource
            ? tableNo.includes(normalizedSerialOrTable)
            : tableNo.includes(normalizedSerialOrTable) || roomNo.includes(normalizedSerialOrTable)
          : false;
        const roomFieldMatch = normalizedRoom ? roomNo.includes(normalizedRoom) : false;

        if (!normalizedSerialOrTable && !normalizedRoom) return true;
        return tableOrRoomMatch || roomFieldMatch;
      });

      setKots(filtered);

      setSelectedKotIds((prev) => {
        const valid = new Set(filtered.map((kot: any) => kot.id));
        return new Set(Array.from(prev).filter((id) => valid.has(id)));
      });

      setActiveKotId((prev) => {
        if (filtered.length === 0) return null;
        if (prev && filtered.some((kot: any) => kot.id === prev)) return prev;
        return filtered[0].id;
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load KOTs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKOTs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintMode(null);
      setPrintingKotId(null);
      setIsPrinting(false);
    };

    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  useEffect(() => {
    setKotWallColors(getKotWallColors());
  }, []);

  useEffect(() => {
    const handleKotsUpdated = (event: Event) => {
      const custom = event as CustomEvent;
      if (custom?.detail?.source === "kot-wall-bill-generated") {
        return;
      }
      const roomId = custom?.detail?.roomId;
      const roomNumber = String(custom?.detail?.roomNumber || "").trim();
      const tableNumber = String(custom?.detail?.tableNumber || "").trim();
      const targetRoom = String(queryRoomNumber || "").trim();
      const targetTable = String(queryTableNumber || "").trim();

      if ((roomId || roomNumber) && targetRoom && (String(roomId) === targetRoom || roomNumber === targetRoom)) {
        setKots([]);
        setSelectedKotIds(new Set());
        setActiveKotId(null);
        return;
      }

      if (isTableSource && tableNumber && targetTable && tableNumber === targetTable) {
        setKots([]);
        setSelectedKotIds(new Set());
        setActiveKotId(null);
        return;
      }

      loadKOTs();
    };
    window.addEventListener("restaurant:kots-updated", handleKotsUpdated as EventListener);
    return () => {
      window.removeEventListener("restaurant:kots-updated", handleKotsUpdated as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleKotSelection = (kotId: string, force?: boolean) => {
    const kot = kots.find((item) => item.id === kotId);
    if (!kot || !isKotOpen(kot)) {
      toast.error("Only OPEN KOTs can be selected for billing");
      return;
    }

    setSelectedKotIds((prev) => {
      const next = new Set(prev);
      const shouldSelect = typeof force === "boolean" ? force : !next.has(kotId);
      if (shouldSelect) next.add(kotId);
      else next.delete(kotId);
      return next;
    });
  };

  const handleSelectAllOpen = () => {
    if (kots.length === 0) {
      toast.error("No KOTs available to select");
      return;
    }
    setSelectedKotIds(new Set(kots.map((kot) => kot.id)));
  };

  const triggerPrintWhenReady = () => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.print();
      });
    });
  };

  const handleClearSelection = () => {
    setSelectedKotIds(new Set());
  };

  const handleGenerateBill = async () => {
    const selectedKots = kots.filter((kot) => selectedKotIds.has(kot.id) && isKotOpen(kot));
    const baseKot = selectedKots[0];
    const hotelIdForInvoice = baseKot?.hotelId || queryHotelId || user?.hotelId;

    if (selectedKots.length === 0) {
      toast.error("Please select at least one OPEN KOT to generate bill");
      return;
    }

    const normalize = (value: any) => String(value || "").trim().toLowerCase();
    const baseTable = normalize(baseKot?.order?.tableNumber);
    const baseRoom = normalize(baseKot?.order?.room?.roomNumber);
    const sameContext = selectedKots.every((kot) => {
      const tableNo = normalize(kot?.order?.tableNumber);
      const roomNo = normalize(kot?.order?.room?.roomNumber);
      if (baseTable) return tableNo === baseTable;
      if (baseRoom) return roomNo === baseRoom;
      return tableNo === baseTable && roomNo === baseRoom;
    });
    if (!sameContext) {
      toast.error("Please select KOTs from the same room/table to generate a single bill");
      return;
    }

    const allItems = selectedKots.flatMap((kot) => (Array.isArray(kot.items) ? kot.items : []));
    const mergedItems = allItems.reduce((acc: any[], item: any) => {
      const itemId = item?.menuItemId || item?.itemId || item?.id || item?.itemName;
      const price = Number(item?.price || 0);
      const existing = acc.find((i) => {
        const existingId = i?.menuItemId || i?.itemId || i?.id || i?.itemName;
        return String(existingId) === String(itemId) && Number(i?.price || 0) === price;
      });

      const quantity = Number(item?.quantity || 0);
      const amount = Number(item?.itemTotal || item?.amount || quantity * price);

      if (existing) {
        existing.quantity += quantity;
        existing.itemTotal += amount;
      } else {
        acc.push({
          menuItemId: item?.menuItemId || item?.itemId || null,
          itemName: item?.itemName || item?.name || "Item",
          quantity,
          price,
          itemTotal: amount,
        });
      }

      return acc;
    }, []);

    const subtotal = mergedItems.reduce((sum, item) => sum + Number(item.itemTotal || 0), 0);
    const serviceCharge = subtotal * 0.10;
    const netPayable = subtotal + serviceCharge;

    try {
      setIsGeneratingBill(true);
      const roomIdForBilledState = baseKot?.order?.roomId || baseKot?.order?.room?.id;
      const roomNumberForBilledState = baseKot?.order?.room?.roomNumber || queryRoomNumber;
      const tableNumberForBilledState = baseKot?.order?.tableNumber || queryTableNumber || tableNumberFilter;
      const generatedInvoice = await generateOrderInvoice({
        hotelId: hotelIdForInvoice,
        roomId: baseKot?.order?.roomId || baseKot?.order?.room?.id || undefined,
        tableNumber: baseKot?.order?.tableNumber || "",
        roomNumber: baseKot?.order?.room?.roomNumber || "",
        steward: baseKot?.order?.stewardName || "Staff",
        items: mergedItems,
        subtotal,
        serviceCharge,
        netPayable,
        kotIds: selectedKots.map((kot) => kot.id),
      }, hotelIdForInvoice);

      const previewInvoice = {
        ...generatedInvoice,
        hotelId: generatedInvoice?.hotelId || hotelIdForInvoice,
        subtotal,
        totalAmount: netPayable,
        serviceCharge,
        restaurantOrder: {
          ...(generatedInvoice as any)?.restaurantOrder,
          tableNumber: (generatedInvoice as any)?.restaurantOrder?.tableNumber || baseKot?.order?.tableNumber || "-",
          stewardName: (generatedInvoice as any)?.restaurantOrder?.stewardName || baseKot?.order?.stewardName || "Staff",
          room: (generatedInvoice as any)?.restaurantOrder?.room || baseKot?.order?.room,
          orderItems: mergedItems.map((item: any) => ({
            quantity: Number(item.quantity || 0),
            price: Number(item.price || 0),
            itemTotal: Number(item.itemTotal || 0),
            menuItem: {
              itemName: item.itemName || "Item",
            },
          })),
        },
      };

      setInvoiceToPreview(previewInvoice);
      setShowBillPreview(true);
      setKots([]);
      setSelectedKotIds(new Set());
      setActiveKotId(null);
      window.dispatchEvent(new CustomEvent("restaurant:kots-updated", { detail: { source: "kot-wall-bill-generated" } }));
      window.dispatchEvent(new CustomEvent("restaurant:invoice-generated"));
      markRoomAsBilled(roomIdForBilledState, roomNumberForBilledState, tableNumberForBilledState);
      toast.success("Bill generated successfully");
    } catch (error: any) {
      const status = error?.response?.status;
      const apiMessage = error?.response?.data?.message;
      console.error("Generate bill failed", {
        status,
        data: error?.response?.data,
        selectedKotIds: selectedKots.map((kot) => kot.id),
        hotelIdForInvoice,
      });

      if (status === 400) {
        toast.error(apiMessage || "Invalid bill request. Please verify selected KOTs are OPEN and from one table/room.");
      } else {
        toast.error(apiMessage || error?.message || "Failed to generate bill");
      }
    } finally {
      setIsGeneratingBill(false);
    }
  };

  const handleCancelKot = async (kotId: string) => {
    const kot = kots.find((item) => item.id === kotId);
    if (!kot || !isKotOpen(kot)) {
      toast.error("Only OPEN KOTs can be cancelled");
      return;
    }

    const ok = window.confirm("Are you sure you want to cancel this KOT?");
    if (!ok) return;

    try {
      setLoading(true);
      await deleteKOT(kotId);
      toast.success("KOT cancelled");
      await loadKOTs();
    } catch (error) {
      console.error(error);
      toast.error("Failed to cancel KOT");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintKot = (kot: any) => {
    setPrintingKotId(kot.id);
    setPrintMode("kot");
    triggerPrintWhenReady();
  };

  const handlePreviewPrint = () => {
    setIsPrinting(true);
    triggerPrintWhenReady();
  };

  const handleModifyKot = (kotId: string) => {
    const kot = kots.find((item) => item.id === kotId);
    if (!kot || !isKotOpen(kot)) {
      toast.error("Only OPEN KOTs can be modified");
      return;
    }

    const returnTo = `${location.pathname}${location.search}`;
    navigate(`${roleBase}/restaurant/kots/${kotId}/edit?returnTo=${encodeURIComponent(returnTo)}`);
  };

  const selectedKots = useMemo(
    () => kots.filter((kot) => selectedKotIds.has(kot.id)),
    [kots, selectedKotIds],
  );

  const selectedOpenKotCount = useMemo(
    () => selectedKots.filter((kot) => isKotOpen(kot)).length,
    [selectedKots],
  );

  const combinedBill = useMemo(() => {
    const itemMap = new Map<string, any>();

    for (const kot of selectedKots) {
      const items = Array.isArray(kot.items) ? kot.items : [];
      for (const item of items) {
        const qty = Number(item.quantity || 0);
        const rate = Number(item.price || 0);
        const key = `${item.menuItemId || item.itemName}-${rate}`;
        const existing = itemMap.get(key);

        if (existing) {
          existing.quantity += qty;
          existing.itemTotal = existing.quantity * existing.price;
        } else {
          itemMap.set(key, {
            menuItemId: item.menuItemId,
            itemName: item.itemName || "-",
            unit: item.unit || "Nos",
            price: rate,
            quantity: qty,
            itemTotal: Number(item.itemTotal || qty * rate),
          });
        }
      }
    }

    const items = Array.from(itemMap.values());
    const subtotal = items.reduce((sum, item) => sum + Number(item.itemTotal || 0), 0);
    const serviceCharge = subtotal * 0.1;
    const netPayable = subtotal + serviceCharge;

    return {
      items,
      subtotal,
      serviceCharge,
      netPayable,
      kotNumbers: selectedKots.map((kot) => kot.kotNumber || "-").join(", "),
    };
  }, [selectedKots]);

  const printingKot = useMemo(
    () => kots.find((kot) => kot.id === printingKotId) || null,
    [kots, printingKotId],
  );

  const printingKotHotelName = useMemo(() => {
    const hotelId = printingKot?.hotelId || queryHotelId || user?.hotelId || "";
    return hotels.find((hotel) => hotel.id === hotelId)?.name || "HOTEL RESTAURANT";
  }, [hotels, printingKot, queryHotelId, user?.hotelId]);

  const getNonEmptyValue = (...values: any[]) => {
    for (const value of values) {
      if (value === 0) return "0";
      const text = String(value ?? "").trim();
      if (text) return text;
    }
    return "";
  };

  const getShortBillNumber = (invoiceNumber?: string) => {
    const full = String(invoiceNumber || "").trim();
    if (!full) return "-";
    const parts = full.split("-").filter(Boolean);
    if (parts.length === 0) return full;
    const last = parts[parts.length - 1];
    if (/^\d+$/.test(last)) return last;
    if (parts.length >= 2) {
      return `${parts[parts.length - 2]}-${parts[parts.length - 1]}`;
    }
    return full;
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
    const name = String(itemName || "").slice(0, 16).padEnd(16, " ");
    const qtyText = String(qty).padStart(4, " ");
    const priceText = Number(price || 0).toFixed(2).padStart(6, " ");
    const amountText = Number(amount || 0).toFixed(2).padStart(6, " ");
    return `${name} ${qtyText} ${priceText} ${amountText}`;
  };

  const formatReceiptMetaLine = (label: string, value: string) => {
    return `${label.padEnd(9, " ")} : ${value}`;
  };

  const formatReceiptTotalLine = (label: string, amount: number) => {
    const amountColEnd = 35;
    const valuePart = Number(amount || 0).toFixed(2).padStart(8, " ");
    const combined = `${label} : ${valuePart}`;
    return combined.padStart(amountColEnd, " ");
  };

  const renderThermalReceipt = (inv: any) => {
    const selectedHotel = hotels.find((h) => h.id === inv.hotelId);
    const subtotal = Number(inv.subtotal || 0);
    const serviceCharge = subtotal * 0.10;
    const netPayable = subtotal + serviceCharge;
    const tableNo = getNonEmptyValue(
      inv.restaurantOrder?.tableNumber,
      inv.tableNumber,
      inv.order?.tableNumber,
      inv.restaurantOrder?.order?.tableNumber,
    ) || "-";
    const roomNo = inv.restaurantOrder?.room?.roomNumber || "";
    const steward = inv.restaurantOrder?.stewardName || "Staff";
    const lines = splitAddressLines(selectedHotel?.address);
    const contactNo = (selectedHotel as any)?.phone || (selectedHotel as any)?.mobile || (selectedHotel as any)?.contactNumber || "-";
    const items = (inv.restaurantOrder?.orderItems || []).map((item: any) => {
      const qty = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      const amount = Number(item.itemTotal || qty * price);
      return {
        itemName: item.menuItem?.itemName || item.itemName || "Item",
        qty,
        price,
        amount,
      };
    });

    return (
      <div
        className="mx-auto bg-white text-black"
        style={{ width: "76mm", fontFamily: "'Courier New', monospace", fontSize: "11px", lineHeight: 1.35 }}
      >
        <div className="text-center font-bold text-[14px] leading-tight">{selectedHotel?.name || "HOTEL RESTAURANT"}</div>
        {lines.line1 && <div className="text-center leading-tight">{lines.line1}</div>}
        {lines.line2 && <div className="text-center leading-tight">{lines.line2}</div>}
        {lines.cityState && <div className="text-center leading-tight">{lines.cityState}</div>}
        <div className="text-center leading-tight">Contact No: {contactNo}</div>
        <div className="text-center leading-tight">{RECEIPT_DASH}</div>
        <div className="text-center font-bold leading-tight">TAX INVOICE</div>
        <div className="text-center leading-tight">{RECEIPT_DASH}</div>
        <pre className="m-0 whitespace-pre leading-tight">
{formatReceiptMetaLine("Bill Date", formatDateTime(inv.invoiceDate || inv.createdAt))}
{"\n"}{formatReceiptMetaLine("Bill No.", getShortBillNumber(inv.invoiceNumber))}
{"\n"}{formatReceiptMetaLine("Table No.", tableNo || "-")}
{"\n"}{formatReceiptMetaLine("Room No.", roomNo || "-")}
{"\n"}{formatReceiptMetaLine("Steward", steward)}
        </pre>
        <div className="text-center leading-tight">{RECEIPT_DASH}</div>
        <pre className="m-0 whitespace-pre leading-tight">Item             Qty  Price Amount</pre>
        <div className="text-center leading-tight">{RECEIPT_DASH}</div>
        <pre className="m-0 whitespace-pre leading-tight">{items.map((item: any) => formatReceiptItemLine(item.itemName, item.qty, item.price, item.amount)).join("\n")}</pre>
        <div className="text-center leading-tight">{RECEIPT_DASH}</div>
        <pre className="m-0 whitespace-pre leading-tight">
{formatReceiptTotalLine("Total Amount", subtotal)}
{"\n"}{formatReceiptTotalLine("Gross Amount", subtotal)}
{serviceCharge > 0 ? `\n${formatReceiptTotalLine("S.C.(10%)", serviceCharge)}` : ""}
        </pre>
        <div className="text-center leading-tight">{RECEIPT_DASH}</div>
        <div className="text-center font-bold text-[14px] leading-tight">NET AMOUNT : {netPayable.toFixed(2)}</div>
        <div className="text-center leading-tight">{RECEIPT_DASH}</div>
        <div className="leading-tight">Cashier : {steward}</div>
        <div className="text-center leading-tight">{RECEIPT_DASH}</div>
        <div className="text-center leading-tight">Thank you for your visit</div>
        <div className="text-center leading-tight">{RECEIPT_DASH}</div>
        <div className="text-center leading-tight">HSN/SAC Code: 996332</div>
      </div>
    );
  };

  const handleExit = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(exitPath);
  };

  return (
    <AppLayout title="KOT Wall">
      <style>{`
        .kot-print-only { display: none; }
        .thermal-print-area { display: none; }
        .kot-print-receipt {
          font-family: 'Calibri', sans-serif;
          width: 76mm;
          margin: 0 auto;
          padding: 0;
          font-size: 12px;
          line-height: 1.25;
          color: #000;
          background: #fff;
        }
        .kot-section-line {
          white-space: nowrap;
          margin: 2px 0;
        }
        .kot-title {
          text-align: center;
          font-weight: 700;
          font-size: 16px;
          margin: 2px 0;
        }
        .kot-table-room {
          text-align: center;
          font-weight: 700;
          font-size: 22px;
          line-height: 1.1;
          margin: 2px 0;
        }
        .kot-meta-row {
          display: flex;
          align-items: baseline;
          margin: 1px 0;
        }
        .kot-meta-label { width: 58px; }
        .kot-meta-colon { width: 10px; }
        .kot-meta-value {
          flex: 1;
          min-width: 0;
          word-break: break-word;
        }
        .kot-item-row {
          padding-left: 4px;
          margin: 1px 0;
          word-break: break-word;
        }
        .kot-item-prefix { font-weight: 400; }
        .kot-item-name { font-weight: 700; }
        @media print {
          @page { size: 80mm auto; margin: 2mm; }
          body * { visibility: hidden !important; }
          #kot-print-area, #kot-print-area * { visibility: visible !important; }
          #invoice-print-area, #invoice-print-area * { visibility: visible !important; }
          #kot-print-area {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
            background: #fff !important;
            z-index: 9999 !important;
          }
          #invoice-print-area {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
            background: #fff !important;
            z-index: 9999 !important;
          }
        }
      `}</style>

      <div id="kot-print-area" className={`kot-print-only ${printMode === "kot" && printingKot ? "kot-print-active" : ""}`}>
        {printingKot && (
          <div className="kot-print-receipt">
            <hr style={{ border: "none", borderTop: "1px dashed #000", width: "100%", margin: "3px 0" }} />
            <div className="kot-title">{printingKotHotelName}</div>
            <hr style={{ border: "none", borderTop: "1px dashed #000", width: "100%", margin: "3px 0" }} />
            <div className="kot-title">New GUEST KOT</div>
            <hr style={{ border: "none", borderTop: "1px dashed #000", width: "100%", margin: "3px 0" }} />
            <div className="kot-table-room">{printingKot.order?.room?.roomNumber || printingKot.order?.tableNumber || "-"}</div>
            <hr style={{ border: "none", borderTop: "1px dashed #000", width: "100%", margin: "3px 0" }} />
            <div className="kot-meta-row"><span className="kot-meta-label">KOT Date</span><span className="kot-meta-colon">:</span><span className="kot-meta-value">{formatKotDateTime(printingKot.printedAt || printingKot.createdAt)}</span></div>
            <div className="kot-meta-row"><span className="kot-meta-label">Steward</span><span className="kot-meta-colon">:</span><span className="kot-meta-value">{printingKot.order?.stewardName || "-"}</span></div>
            <hr style={{ border: "none", borderTop: "1px dashed #000", width: "100%", margin: "3px 0" }} />
            {(Array.isArray(printingKot.items) ? printingKot.items : []).map((item: any, index: number) => (
              <div key={`print-kot-${index}`} className="kot-item-row">
                <span className="kot-item-prefix">{`${Number(item.quantity || 0)}  -`}</span>
                <span className="kot-item-name">{item.itemName || "-"}</span>
              </div>
            ))}
            <hr style={{ border: "none", borderTop: "1px dashed #000", width: "100%", margin: "3px 0" }} />
          </div>
        )}
      </div>

      <div
        className="kot-wall-screen h-full flex flex-col text-white rounded-xl overflow-hidden"
        style={{ backgroundColor: kotWallColors.wallBackgroundColor }}
      >
        <div
          className="px-4 py-3 border-b border-[#d6cfbd] text-black"
          style={{ backgroundColor: kotWallColors.headerBackgroundColor }}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h1 className="text-xl font-bold tracking-wide">KOT Wall</h1>
              <button
                onClick={loadKOTs}
                disabled={loading}
                className="h-9 px-4 border border-[#8f846d] bg-[#f5efe2] hover:bg-[#efe6d6] text-[13px] font-semibold disabled:opacity-60"
              >
                Load KOTs
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wide text-[#5b513f]">
                  Table Number
                </label>
                <input
                  value={tableNumberFilter}
                  onChange={(e) => setTableNumberFilter(e.target.value)}
                  placeholder={searchMode === "serial" ? "KOT Serial Number" : "Table Number"}
                  className="w-full h-9 px-3 border border-[#b4aa96] bg-white text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wide text-[#5b513f]">
                  Room Number
                </label>
                <input
                  value={roomNumberFilter}
                  onChange={(e) => setRoomNumberFilter(e.target.value)}
                  placeholder="Room Number"
                  className="w-full h-9 px-3 border border-[#b4aa96] bg-white text-[13px]"
                />
              </div>
              <div className="md:col-span-2 flex flex-wrap gap-4 h-9 items-center px-1">
                <label className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#4f4637]">
                  <input
                    type="radio"
                    name="kot-search-mode"
                    checked={searchMode === "serial"}
                    onChange={() => setSearchMode("serial")}
                  />
                  KOT Serial Number
                </label>
                <label className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#4f4637]">
                  <input
                    type="radio"
                    name="kot-search-mode"
                    checked={searchMode === "table-room"}
                    onChange={() => setSearchMode("table-room")}
                  />
                  Table/Room Number
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-300 text-sm">Loading KOTs...</div>
          ) : kots.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-300 text-sm">No KOTs found for the selected filters.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {kots.map((kot) => {
                const items = Array.isArray(kot.items) ? kot.items : [];
                const totalItems = items.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0);
                const totalAmount = items.reduce((sum: number, item: any) => {
                  const qty = Number(item.quantity || 0);
                  const rate = Number(item.price || 0);
                  const lineTotal = Number(item.itemTotal || qty * rate);
                  return sum + lineTotal;
                }, 0);
                const isSelected = selectedKotIds.has(kot.id);
                const isActive = activeKotId === kot.id;
                const isOpen = isKotOpen(kot);

                return (
                  <div
                    key={kot.id}
                    onClick={() => {
                      setActiveKotId(kot.id);
                      if (isOpen) {
                        toggleKotSelection(kot.id);
                      }
                    }}
                    className={`rounded-md border-2 cursor-pointer transition-all ${isSelected || isActive ? "shadow-[0_0_0_2px_rgba(244,63,94,0.25)]" : "border-slate-300"}`}
                    style={{
                      backgroundColor: kotWallColors.cardBackgroundColor,
                      color: kotWallColors.cardTextColor,
                      borderColor: kotWallColors.cardBorderColor,
                    }}
                  >
                    <div className="p-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2 justify-end">
                      {!isOpen && (
                        <span className="h-7 px-2 inline-flex items-center border border-emerald-300 bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                          CONVERTED
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleKotSelection(kot.id);
                        }}
                        disabled={!isOpen}
                        className="h-7 px-2 border border-slate-300 text-[11px] font-semibold hover:bg-slate-100"
                      >
                        {isSelected ? "De-Select" : "Select"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleModifyKot(kot.id);
                        }}
                        disabled={!isOpen}
                        className="h-7 px-2 border border-slate-300 text-[11px] font-semibold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Modify
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrintKot(kot);
                        }}
                        className="h-7 px-2 border border-slate-300 text-[11px] font-semibold hover:bg-slate-100"
                      >
                        Print
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelKot(kot.id);
                        }}
                        disabled={!isOpen}
                        className="h-7 px-2 border border-rose-300 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="p-3 space-y-2">
                      <div
                        className="font-mono text-[12px] border border-slate-300 p-2"
                        style={{
                          backgroundColor: kotWallColors.cardBackgroundColor,
                          color: kotWallColors.cardTextColor,
                        }}
                      >
                        <div className="text-center">{KOT_DASH}</div>
                        <h3 className="text-center text-[15px] font-bold">GUEST KOT</h3>
                        <div className="text-center">{KOT_DASH}</div>
                        <div>KOT No : {kot.kotNumber || "-"}</div>
                        <div>Status : {String(kot.status || "-").toUpperCase()}</div>
                        <div>Date   : {formatDateTime(kot.printedAt || kot.createdAt)}</div>
                        <div>Table  : {kot.order?.tableNumber || "-"}</div>
                        <div>Steward: {kot.order?.stewardName || "-"}</div>
                        <div className="text-center">{KOT_DASH}</div>
                        <div className="max-h-40 overflow-auto space-y-1">
                          {items.map((item: any, index: number) => (
                            <div key={`${kot.id}-item-${index}`} className="leading-tight break-words">
                              {`${Number(item.quantity || 0)} - ${item.itemName || "-"}`}
                            </div>
                          ))}
                        </div>
                        <div className="text-center">{KOT_DASH}</div>
                        <div>Total Items : {items.length}</div>
                        <div className="text-center">{KOT_DASH}</div>
                        <div className="text-center">Thank You</div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        <div><span className="font-bold">Steward:</span> {kot.order?.stewardName || "-"}</div>
                        <div><span className="font-bold">Remarks:</span> {kot.order?.remarks || "-"}</div>
                        <div><span className="font-bold">Guest:</span> {kot.order?.guestName || "-"}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-700 bg-[#050505] flex items-center justify-end gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAllOpen}
              disabled={loading || kots.length === 0}
              className="h-9 px-4 border border-slate-500 bg-slate-700 hover:bg-slate-600 text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select All
            </button>
            <button
              onClick={handleClearSelection}
              disabled={selectedKotIds.size === 0}
              className="h-9 px-4 border border-slate-500 bg-slate-800 hover:bg-slate-700 text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
            <button
              onClick={handleGenerateBill}
              disabled={isGeneratingBill || selectedOpenKotCount === 0}
              className="h-9 px-4 bg-[#d9c58f] hover:bg-[#ceb97f] text-black text-[13px] font-bold"
            >
              {isGeneratingBill ? "Generating..." : "Generate Bill"}
            </button>
            <button
              onClick={handleExit}
              className="h-9 px-4 border border-slate-500 bg-slate-800 hover:bg-slate-700 text-[13px] font-semibold"
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      {showBillPreview && invoiceToPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in thermal-print-modal">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col thermal-print-shell">
            <div className="bg-[#C6A75E] px-6 py-4 flex items-center justify-between text-white no-thermal-print">
              <h2 className="text-xl font-bold">Invoice Preview</h2>
              <button
                onClick={() => setShowBillPreview(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white max-h-[70vh] no-thermal-print">
              {renderThermalReceipt(invoiceToPreview)}
            </div>

            <div id="invoice-print-area" className="thermal-print-area" aria-hidden>
              {renderThermalReceipt(invoiceToPreview)}
            </div>

            <div className="p-6 bg-white border-t border-[#e2e8f0] flex gap-4 no-thermal-print">
              <button
                onClick={() => setShowBillPreview(false)}
                className="flex-1 py-3 border border-gray-200 rounded-lg font-bold text-base hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handlePreviewPrint}
                className="flex-1 py-3 bg-[#C6A75E] hover:bg-[#A8832D] text-white rounded-lg font-bold text-base transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                {isPrinting ? "Printing..." : "Print"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default RoomKOTWall;
