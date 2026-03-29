import { useMemo } from "react";
import { DEFAULT_LOGO_URL, resolveBrandName, resolveLogoUrl } from "../utils/branding";
import { printHtml } from "../utils/print";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import { calculateStayDays, isLateCheckout } from "../utils/stayCalculation";
import { Printer, X, Download } from "lucide-react";
import { numberToWords } from "../utils/numberToWords";

interface InvoiceModalProps {
  invoice: any;
  onClose: () => void;
}

export function InvoiceModal({ invoice, onClose }: InvoiceModalProps) {
  const { hotels, bookings, activeHotel } = usePMS() as any;
  const { user } = useAuth();

  const contextBooking = bookings.find(
    (b: any) =>
      b.id === invoice.bill?.bookingId ||
      b.id === invoice.bill?.booking?.id ||
      b.id === invoice.bookingId ||
      b.id === invoice.booking?.id
  );
  const bill = invoice?.bill || null;
  const booking = invoice?.booking || bill?.booking || contextBooking || null;
  const checkin = booking || invoice?.checkin || invoice?.checkIn || null;
  const bk = booking;

  const invoiceHotelId =
    invoice.hotelId ||
    invoice.bill?.hotelId ||
    invoice.bill?.booking?.hotelId ||
    (invoice as any)?.hotel?.id ||
    (invoice as any)?.hotel?._id ||
    null;

  const hotel: any =
    hotels.find((h: any) =>
      String(h.id) === String(invoiceHotelId) ||
      String(h._id) === String(invoiceHotelId)
    ) ||
    (invoice as any)?.hotel ||
    (invoice as any)?.bill?.hotel ||
    (invoice as any)?.bill?.booking?.hotel ||
    (user as any)?.hotel ||
    (user as any)?.hotelData ||
    (user as any)?.property ||
    null;

  console.log("hotel resolved:", hotel);
  console.log("activeHotel:", activeHotel);
  console.log("hotels in context:", hotels);
  console.log('=== INVOICE MODAL DATA ===');
  console.log('booking:', JSON.stringify(booking, null, 2));
  console.log('checkin:', JSON.stringify(checkin, null, 2));
  console.log('bill:', JSON.stringify(bill, null, 2));
  console.log('invoice:', JSON.stringify(invoice, null, 2));

  const hotelFields = useMemo(() => {
    const name =
      (hotel as any)?.brandName ||
      (hotel as any)?.name ||
      (hotel as any)?.hotelName ||
      (invoice as any)?.hotelName ||
      "NA";

    const phone =
      (hotel as any)?.phone ||
      (hotel as any)?.phoneNumber ||
      (hotel as any)?.contactNo ||
      (hotel as any)?.contact ||
      (hotel as any)?.contactNumber ||
      (hotel as any)?.mobile ||
      "NA";

    const gst =
      (hotel as any)?.gstNumber ||
      (hotel as any)?.gstin ||
      (hotel as any)?.gst_number ||
      (hotel as any)?.gstNo ||
      (hotel as any)?.gst ||
      "NA";

    const rawAddress =
      (hotel as any)?.address ||
      (hotel as any)?.addressLine ||
      (hotel as any)?.fullAddress ||
      (hotel as any)?.location ||
      (hotel as any)?.hotelAddress ||
      [(hotel as any)?.city, (hotel as any)?.state]
        .filter(Boolean).join(", ") ||
      "NA";

    const addressParts = rawAddress
      .split(",")
      .map((p: string) => p.trim())
      .filter(Boolean);

    return {
      name,
      phone,
      gst,
      addressLine1: addressParts[0] || "NA",
      addressLine2: addressParts.slice(1).join(", ") || "",
      isComposition:
        (hotel as any)?.isComposition === true ||
        (hotel as any)?.isCompositionScheme === true ||
        String((hotel as any)?.taxType || "").toLowerCase() === "composition",
      invoiceShowCustomLines: (hotel as any)?.invoiceShowCustomLines ?? false,
      invoiceLine1: (hotel as any)?.invoiceLine1 || "A UNIT OF",
      invoiceLine2: (hotel as any)?.invoiceLine2 || "UTTARAKHAND HOTELS4U",
      invoiceLine1Size: (hotel as any)?.invoiceLine1Size || 14,
      invoiceLine2Size: (hotel as any)?.invoiceLine2Size || 16,
      invoiceHotelNameColor: (hotel as any)?.invoiceHotelNameColor === "#000000" ? "#C6A75E" : ((hotel as any)?.invoiceHotelNameColor || "#C6A75E"),
      invoiceHeaderColor: (hotel as any)?.invoiceHeaderColor || "#000000",
      showInvoiceWatermark: (hotel as any)?.showInvoiceWatermark ?? true,
    };
  }, [hotel, invoice]);

  const totalGst = Number(invoice.cgst || 0) + Number(invoice.sgst || 0);
  const subtotal = Number(invoice.subtotal || 0) - Number(invoice.bill?.restaurantCharges || 0);
  const beforeRound = subtotal + totalGst;
  const roundOff = Math.round(beforeRound) - beforeRound;
  const totalAmountWithoutFood = Math.round(beforeRound);
  const advanceAmount = Number(bill?.booking?.advanceAmount || booking?.advanceAmount || bk?.advanceAmount || 0);

  // Date formatting functions
  const formatDateOnly = (d: Date | null) => {
    if (!d) return '-';
    const date = new Date(d);
    return `${date.getDate().toString().padStart(2, '0')} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
  };

  const formatDateForBill = (d: Date | null) => d ? `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}` : '-';
  const formatDateTime = (d: Date | null) => d ? `${d.getDate().toString().padStart(2, '0')} ${(d.getMonth() + 1).toString().padStart(2, '0')} ${d.getFullYear()}/${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}` : '-';
  const isTimeOnly = (value: string) => /^\d{1,2}:\d{2}(:\d{2})?$/.test(value.trim());
  const formatDateDirect = (dateValue: Date | null) => {
    if (!dateValue || Number.isNaN(dateValue.getTime())) return '-';
    const day = String(dateValue.getDate()).padStart(2, '0');
    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const year = dateValue.getFullYear();
    let hours = dateValue.getHours();
    const minutes = String(dateValue.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
  };

  const formatEnteredDateTime = (rawValue: any, fallbackDate?: string) => {
    if (rawValue === null || rawValue === undefined) return '-';
    const normalized = String(rawValue).trim();
    if (!normalized) return '-';

    let candidate: Date | null = null;

    if (isTimeOnly(normalized) && fallbackDate) {
      const maybe = new Date(`${fallbackDate}T${normalized}`);
      if (!Number.isNaN(maybe.getTime())) candidate = maybe;
    }

    if (!candidate) {
      const maybe = new Date(normalized);
      if (!Number.isNaN(maybe.getTime())) candidate = maybe;
    }

    if (!candidate && fallbackDate) {
      const maybe = new Date(fallbackDate);
      if (!Number.isNaN(maybe.getTime())) candidate = maybe;
    }

    return candidate ? formatDateDirect(candidate) : normalized;
  };

  const formatStoredDateOnly = (rawDateValue: any) => {
    if (rawDateValue === null || rawDateValue === undefined) return '-';
    const raw = String(rawDateValue).trim();
    if (!raw) return '-';

    const isoDateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoDateOnlyMatch) {
      return `${isoDateOnlyMatch[3]}/${isoDateOnlyMatch[2]}/${isoDateOnlyMatch[1]}`;
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return raw;

    const day = String(parsed.getUTCDate()).padStart(2, '0');
    const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
    const year = parsed.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  const getCurrentInvoiceDate = () =>
    new Date()
      .toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      })
      .replace(/\//g, '-');

  const billDateStr = invoice.createdAt ? formatDateForBill(new Date(invoice.createdAt)) : '-';
  const invoiceBooking = booking || bill?.booking || null;
  const guestData = booking?.guest || bk?.guest || invoiceBooking?.guest || booking || bk || null;
  const checkinData = checkin || booking || bk || invoiceBooking || null;
  const reservationData =
    invoice.bill?.booking?.reservation ||
    invoice.reservation ||
    null;

  const checkinOrRes = checkinData || reservationData || {};

  const firstNonEmpty = (...values: any[]) => {
    for (const value of values) {
      if (value === null || value === undefined) continue;
      const normalized = String(value).trim();
      if (normalized) return normalized;
    }
    return '';
  };

  const checkInDateValue = firstNonEmpty(
    invoice?.checkInDate,
    checkinData?.checkInDate,
    invoiceBooking?.checkInDate,
    bk?.checkInDate
  );

  const checkOutDateValue = firstNonEmpty(
    invoice?.checkOutDate,
    checkinData?.checkOutDate,
    invoiceBooking?.checkOutDate,
    bk?.checkOutDate
  );

  const checkInTimeValue = firstNonEmpty(
    invoice?.checkInTime,
    checkinData?.checkInTime,
    invoiceBooking?.checkInTime,
    bk?.checkInTime
  );

  const checkOutTimeValue = firstNonEmpty(
    invoice?.checkOutTime,
    checkinData?.checkOutTime,
    invoiceBooking?.checkOutTime,
    bk?.checkOutTime
  );

  const parseDateParts = (rawDateValue: any) => {
    if (rawDateValue === null || rawDateValue === undefined) return null;
    const raw = String(rawDateValue).trim();
    if (!raw) return null;

    const isoDateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoDateOnlyMatch) {
      return {
        year: isoDateOnlyMatch[1],
        month: isoDateOnlyMatch[2],
        day: isoDateOnlyMatch[3],
      };
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return null;

    return {
      year: String(parsed.getUTCFullYear()),
      month: String(parsed.getUTCMonth() + 1).padStart(2, '0'),
      day: String(parsed.getUTCDate()).padStart(2, '0'),
    };
  };

  const formatDateTimeFromBookingFields = (dateValue: any, timeValue: any) => {
    const dateParts = parseDateParts(dateValue);
    if (!dateParts) return '-';

    const formattedDate = `${dateParts.day}/${dateParts.month}/${dateParts.year}`;
    const rawTime = String(timeValue || '').trim();
    if (!rawTime) return formattedDate;

    const timeMatch = rawTime.match(/^(\d{1,2}):(\d{2})/);
    if (!timeMatch) return formattedDate;

    const rawHours = Number(timeMatch[1]);
    const minutes = timeMatch[2];
    if (Number.isNaN(rawHours) || rawHours < 0 || rawHours > 23) return formattedDate;

    const ampm = rawHours >= 12 ? 'PM' : 'AM';
    const hours12 = rawHours % 12 || 12;
    return `${formattedDate}, ${hours12}:${minutes} ${ampm}`;
  };

  const arrivalDateStr = formatDateTimeFromBookingFields(checkInDateValue, checkInTimeValue);
  const departureDateStr = formatDateTimeFromBookingFields(checkOutDateValue, checkOutTimeValue);
  const stayDays = calculateStayDays(
    checkInDateValue,
    checkInTimeValue,
    checkOutDateValue,
    checkOutTimeValue
  );
  const lateCheckoutApplied = isLateCheckout(checkOutTimeValue);

  console.log('Guest data:', guestData);
  console.log('Full checkin object:', checkinData);
  console.log('checkin full object:', JSON.stringify(checkinData, null, 2));
  console.log('checkin datetime candidates:', {
    checkInDate: checkinData?.checkInDate,
    checkInTime: checkinData?.checkInTime,
    checkInDateTime: checkinData?.checkInDateTime,
    actualCheckIn: checkinData?.actualCheckIn,
    arrivalDate: checkinData?.arrivalDate,
    checkOutDate: checkinData?.checkOutDate,
    checkOutTime: checkinData?.checkOutTime,
    checkOutDateTime: checkinData?.checkOutDateTime,
    actualCheckOut: checkinData?.actualCheckOut,
    departureDate: checkinData?.departureDate,
    checkInDateValue,
    checkInTimeValue,
    checkOutDateValue,
    checkOutTimeValue,
  });
  console.log('reservation datetime candidates:', {
    checkInDate: reservationData?.checkInDate,
    checkInTime: reservationData?.checkInTime,
    checkInDateTime: reservationData?.checkInDateTime,
    actualCheckIn: reservationData?.actualCheckIn,
    arrivalDate: reservationData?.arrivalDate,
    checkOutDate: reservationData?.checkOutDate,
    checkOutTime: reservationData?.checkOutTime,
    checkOutDateTime: reservationData?.checkOutDateTime,
    actualCheckOut: reservationData?.actualCheckOut,
    departureDate: reservationData?.departureDate,
  });
  console.log('Full reservation object:', reservationData);

  const guestName =
    invoice?.guestName ||
    booking?.guestName ||
    booking?.guest?.name ||
    [booking?.firstName, booking?.lastName].filter(Boolean).join(' ').trim() ||
    checkin?.guestName ||
    bill?.booking?.guestName ||
    '—';

  const contactNo =
    invoice?.phone ||
    booking?.phone ||
    booking?.contact ||
    booking?.phoneNumber ||
    booking?.mobile ||
    booking?.guestPhone ||
    booking?.guest?.phone ||
    checkin?.phone ||
    checkin?.guestPhone ||
    '—';

  const address =
    invoice?.address ||
    booking?.address ||
    booking?.homeAddress ||
    booking?.permanentAddress ||
    booking?.addressLine ||
    booking?.guest?.address ||
    checkin?.address ||
    '';

  const roomNumber =
    invoice?.roomNumber ||
    booking?.roomNumber ||
    booking?.room?.number ||
    booking?.room?.roomNumber ||
    booking?.roomNo ||
    checkin?.roomNumber ||
    bill?.booking?.roomNumber ||
    bill?.booking?.room?.number ||
    bill?.booking?.room?.roomNumber ||
    '—';

  const regNo =
    booking?.registrationNumber ||
    booking?.regNo ||
    booking?.bookingRef ||
    booking?.reservationNo ||
    booking?.id?.slice(-5) ||
    '—';

  const adults = invoice?.adults || booking?.adults || booking?.pax?.adults || 0;
  const children = invoice?.children || booking?.children || booking?.pax?.children || 0;

  const companyName =
    invoice?.company ||
    booking?.corporateClient?.name ||
    booking?.billingCompanyName ||
    checkin?.billingCompanyName ||
    booking?.companyName ||
    booking?.company?.name ||
    bill?.booking?.companyName ||
    bill?.booking?.company?.name ||
    "";
  const companyGst =
    booking?.corporateClient?.gstNumber ||
    booking?.companyGst ||
    checkin?.companyGst ||
    booking?.company?.gstNumber ||
    bill?.booking?.companyGst ||
    bill?.booking?.company?.gstNumber ||
    "";
  const plan =
    invoice?.plan ||
    booking?.plan ||
    checkinData?.plan ||
    bill?.booking?.plan ||
    "EP";
  const guestAddress =
    invoice.guestAddress ||
    invoice.bill?.guestAddress ||
    guestData?.address ||
    guestData?.addressLine ||
    guestData?.address_line ||
    guestData?.permanentAddress ||
    guestData?.homeAddress ||
    checkinData?.address ||
    checkinData?.addressLine ||
    checkinData?.address_line ||
    checkinData?.guestAddress ||
    reservationData?.address ||
    reservationData?.addressLine ||
    reservationData?.address_line ||
    bk?.address ||
    bk?.addressLine ||
    bk?.address_line ||
    bk?.guestAddress ||
    invoice.bill?.booking?.address ||
    invoice.bill?.booking?.addressLine ||
    invoice.bill?.booking?.address_line ||
    invoice.bill?.booking?.guestAddress ||
    "";
  const guestAddressText = String(address || guestAddress || "").trim();

  // Use the effective GST rate for description text (room invoice should show full GST rate, e.g. 5%).
  const firstPositiveNumber = (...values: any[]) => {
    for (const value of values) {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return 0;
  };

  const roomRate = firstPositiveNumber(
    booking?.roomPrice,
    booking?.roomRate,
    booking?.ratePerNight,
    booking?.customRate,
    booking?.pricePerNight,
    bill?.roomRate,
    invoice?.roomRate,
    booking?.room?.basePrice,
    booking?.room?.price,
    bill?.booking?.room?.basePrice,
    bill?.booking?.room?.price
  );

  // Slab-based GST calculation: 5% up to 7500, 18% above 7500
  const dailyRoomRate = Number(roomRate || 0);
  const slabRate = dailyRoomRate > 7500 ? 18 : 5;
  const gstPercentage = String(slabRate);

  const items: any[] = [];

  if (Number(invoice.roomRent || invoice.bill?.roomCharges) > 0) {
    const base = Number(invoice.roomRent || invoice.bill.roomCharges);
    const totalRoomNights = Math.max(stayDays, 1);
    const normalNights = lateCheckoutApplied ? Math.max(totalRoomNights - 1, 1) : totalRoomNights;
    
    // Priority: use invoice level override roomRent if available, otherwise calculate from daily roomRate
    const normalRoomCharge = invoice.roomRent ? Number(invoice.roomRent) : (roomRate > 0 ? roomRate * normalNights : (lateCheckoutApplied ? base / totalRoomNights * normalNights : base));
    const lateCheckoutCharge = !invoice.roomRent && lateCheckoutApplied
      ? (roomRate > 0 ? roomRate : Math.max(base - normalRoomCharge, 0))
      : 0;
    
    const normalRoomGst = (normalRoomCharge * slabRate) / 100;
    const lateCheckoutGst = (lateCheckoutCharge * slabRate) / 100;
    const normalChargeDate = formatStoredDateOnly(checkInDateValue) !== '-' ? formatStoredDateOnly(checkInDateValue) : billDateStr;
    const lateChargeDate = formatStoredDateOnly(checkOutDateValue) !== '-' ? formatStoredDateOnly(checkOutDateValue) : billDateStr;

    items.push({
      date: normalChargeDate,
      type: "Room\nCharges",
      desc: `Room Charges for ${normalNights} Night(s) for Room ${roomNumber}, GST (${gstPercentage}%)`,
      charges: normalRoomCharge,
      discount: 0,
      gst: normalRoomGst,
      total: normalRoomCharge + normalRoomGst
    });

    if (!invoice.roomRent && lateCheckoutApplied && lateCheckoutCharge > 0) {
      items.push({
        date: lateChargeDate,
        type: "Late\nCheck-Out",
        desc: `Late Check-Out Charge - checked out at ${checkOutTimeValue || '11:00'} (after 11:00 AM)`,
        charges: lateCheckoutCharge,
        discount: 0,
        gst: lateCheckoutGst,
        total: lateCheckoutCharge + lateCheckoutGst
      });
    }
  }

  const individualMiscCharges: any[] = invoice.bill?.booking?.miscCharges || [];

  if (individualMiscCharges.length > 0) {
    // Render one row per individual misc charge with actual category + description
    for (const charge of individualMiscCharges) {
      const chargeAmount = Number(charge.amount || 0) * Number(charge.quantity || 1);
      if (chargeAmount <= 0) continue;
      const categoryLabel = charge.category
        ? charge.category.charAt(0).toUpperCase() + charge.category.slice(1)
        : 'Misc';
      const descLabel = [categoryLabel, charge.description].filter(Boolean).join(' — ');
      items.push({
        date: billDateStr,
        type: "Misc\nCharges",
        desc: descLabel,
        charges: chargeAmount,
        discount: 0,
        gst: 0,  // No GST on misc charges
        total: chargeAmount
      });
    }
  } else if (Number(invoice.roomRent || invoice.bill?.miscCharges) > 0) {
    // Fallback: aggregated row when individual records aren't available
    const base = Number(invoice.miscCharges || invoice.bill.miscCharges);
    items.push({
      date: billDateStr,
      type: "Misc\nCharges",
      desc: `Miscellaneous Guest Services`,
      charges: base,
      discount: 0,
      gst: 0,
      total: base
    });
  }

  // If no items generated (unlikely), fallback
  if (items.length === 0) {
    items.push({
      date: billDateStr,
      type: "Charges",
      desc: `General Charges`,
      charges: subtotal,
      discount: 0,
      gst: totalGst,
      total: subtotal + totalGst
    });
  }

  // Override billing totals if invoice level data exists
  const itemsChargesTotal = invoice.isModified ? (Number(invoice.roomRent || 0) + Number(invoice.otherCharges || 0) + Number(invoice.miscCharges || 0)) : items.reduce((sum, item) => sum + Number(item.charges || 0), 0);
  const itemsDiscountTotal = items.reduce((sum, item) => sum + Number(item.discount || 0), 0);
  const itemsGstTotal = invoice.isModified ? (Number(invoice.cgst || 0) + Number(invoice.sgst || 0)) : items.reduce((sum, item) => sum + Number(item.gst || 0), 0);
  const itemsBeforeRound = invoice.isModified ? (Number(invoice.totalAmount || 0)) : items.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const itemsRoundOff = Math.round(itemsBeforeRound) - itemsBeforeRound;
  const itemsTotalAmount = Math.round(itemsBeforeRound);
  const invoiceDiscount = Number(invoice.discount || 0);
  const advanceAmountForInvoice = invoice.isModified ? Number(invoice.advancePaid || 0) : advanceAmount;
  const itemsNetPayable = invoice.isModified ? Number(invoice.netPayable || 0) : (itemsTotalAmount - advanceAmount - invoiceDiscount);
  const itemsCgst = itemsGstTotal / 2;
  const itemsSgst = itemsGstTotal / 2;

  const getInvoiceHtml = () => {
    const invoiceDateStr = getCurrentInvoiceDate();
    const rawLogoUrl =
      (activeHotel as any)?.logoUrl ||
      (hotel as any)?.logoUrl ||
      (hotel as any)?.branding?.logoUrl ||
      (hotel as any)?.logo ||
      "";
    const resolvedLogoUrl = resolveLogoUrl(rawLogoUrl ? String(rawLogoUrl) : DEFAULT_LOGO_URL);
    const safeLogoAttr = String(resolvedLogoUrl)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const hasLogo = safeLogoAttr.trim().length > 0;
    const showWatermark = hasLogo && hotelFields.showInvoiceWatermark;
    // Fixed: watermark base64 for Electron compatibility
    const WATERMARK_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgNDAwIDQwMCI+PGcIG9wYWNpdHk9IjAuMTIiPjxjaXJjbGUgY3g9IjIwMCIgY3k9IjIwMCIgcj0iMTkwIiBmaWxsPSJub25lIiBzdHJva2U9IiNDNkE3NUUiIHN0cm9rZS13aWR0aD0iMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iJ1RpbWVzIE5ldyBSb21hbicsIHNlcmlmIiBmb250LXNpemU9IjYwIiBmaWxsPSIjQzZBNzVFIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlVUV0FSQUtIQU5EPC90ZXh0Pjx0ZXh0IHg9IjUwJSIgeT0iNjUlIiBmb250LWZhbWlseT0iJ1RpbWVzIE5ldyBSb21hbicsIHNlcmlmIiBmb250LXNpemU9IjQwIiBmaWxsPSIjQzZBNzVFIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkhPVEVMUzRVPC90ZXh0PjwvZz48L3N2Zz4=';
    const watermarkHtml = showWatermark
      ? `<div class="invoice-watermark"><img class="invoice-watermark-image" src="${WATERMARK_BASE64}" alt="watermark" /></div>`
      : "";

    const lateCheckoutNoteHtml = lateCheckoutApplied
      ? `<div class="late-checkout-note">* Late Check-Out Charge Applied: Guest checked out at ${checkOutTimeValue} (after 11:00 AM). Extra day charge has been added as per hotel policy.</div>`
      : "";

    let itemsHtml = items.map(item => `
      <tr>
        <td class="border-b" style="padding: 6px 4px; border-right: 2px solid #000;">${item.date}</td>
        <td class="border-b" style="padding: 6px 4px; border-right: 2px solid #000; white-space: pre-line; vertical-align: middle;">${item.type}</td>
        <td class="border-b" style="padding: 6px 4px; border-right: 2px solid #000;">${item.desc}</td>
        <td class="border-b text-right" style="padding: 6px 4px; border-right: 2px solid #000;">${item.charges.toFixed(2)}</td>
        <td class="border-b text-right" style="padding: 6px 4px; border-right: 2px solid #000;">${item.discount.toFixed(2)}</td>
        <td class="border-b text-right" style="padding: 6px 4px; border-right: 2px solid #000;">${item.gst.toFixed(2)}</td>
        <td class="border-b text-right" style="padding: 6px 4px;">${item.total.toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <html><head><title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Courier New', Courier, monospace; font-size: 14px; color: #000; margin: 0; padding: 0; font-weight: bold; }
        .invoice-wrapper { max-width: 900px; margin: 0 auto; padding: 20px; background: #fff; position: relative; min-height: 100%; font-weight: bold; }
        .invoice-container { position: relative; }
        .invoice-watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 50%;
          max-width: 400px;
          opacity: 0.12; /* Increased slightly for better visibility as watermark */
          pointer-events: none;
          z-index: 0;
        }
        .invoice-watermark-image {
          width: 100%;
          height: auto;
          object-fit: contain;
        }
        .invoice-content { position: relative; z-index: 1; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        table { width: 100%; border-collapse: collapse; font-weight: bold; }
        .border-all { border: 3px solid #C6A75E; } /* Added: bold gold lines */
        .border-b { border-bottom: 3px solid #C6A75E; } /* Added: bold gold lines */
        .border-l { border-left: 3px solid #C6A75E; } /* Added: bold gold lines */
        .border-r { border-right: 3px solid #C6A75E; } /* Added: bold gold lines */
        
        .hotel-name { font-size: 26px; font-weight: bold; margin: 0; text-transform: uppercase; color: #C6A75E; font-family: 'Times New Roman', serif; }
        .hotel-info { font-size: 14px; margin: 2px 0; font-family: 'Courier New', Courier, monospace; }
        .proforma-title { font-size: 16px; font-weight: bold; margin: 20px 0; font-family: serif; letter-spacing: 1px; text-decoration: underline; }
        
        .info-box { border: 3px solid #C6A75E; display: flex; margin-bottom: 15px; font-weight: bold; } /* Added: bold gold lines and text */
        .info-col { width: 50%; padding: 8px 12px; }
        .info-row { display: flex; margin-bottom: 4px; line-height: 1.2; }
        .info-label { width: 140px; }
        .info-val { flex: 1; }
        
        .table-header th { padding: 8px 4px; text-align: left; font-size: 13px; border-bottom: 3px solid #C6A75E; border-right: 3px solid #C6A75E; font-weight: bold; }
        .table-header th:last-child { border-right: none; }
        
        .totals-section { border: 3px solid #C6A75E; display: flex; border-top: none; font-weight: bold; }
        .totals-col-left { width: 50%; border-right: 3px solid #C6A75E; padding: 8px 12px; }
        .totals-col-right { width: 50%; padding: 8px 12px; }
        .totals-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        
        .rupees-box { border: 3px solid #C6A75E; border-top: none; padding: 10px 12px; font-weight: bold; font-size: 13px; text-transform: uppercase; }
        
        .signature-section { margin-top: 80px; display: flex; justify-content: space-between; padding: 0 40px; }
        .sig-box { text-align: center; width: 250px; }
        .sig-line { border-top: 3px solid #C6A75E; margin-bottom: 8px; font-weight: bold; }
        .late-checkout-note { font-size: 11px; font-style: italic; color: #555; margin-top: 10px; margin-bottom: 10px; border-top: 1px solid #ccc; padding-top: 6px; }
        
        @media print { 
          body { padding: 0; }
          .invoice-wrapper { width: 100%; max-width: none; border: none; }
          .invoice-watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            opacity: 0.12; /* Fixed: consistent opacity for print */
          }
          * { font-weight: bold !important; } /* Added: bold all invoice text for print */
          @page { size: portrait; margin: 10mm; }
        }
      </style>
      <script>
        function handleLogoError(img) {
          if (!img) return;
          img.onerror = null;
          var stage = img.getAttribute('data-stage') || 'primary';
          var currentSrc = img.src;

          if (stage === 'primary') {
            // 1. Try local dev fallback
            if (window.location.hostname === 'localhost' && !currentSrc.includes('localhost:5000')) {
              img.setAttribute('data-stage', 'dev-local');
              try {
                var url = new URL(currentSrc);
                img.src = 'http://localhost:5000' + url.pathname + url.search;
                return;
              } catch (e) {
                console.error('Local fallback failed:', e);
              }
            }

            // 2. Try production fallback
            if (!currentSrc.includes('148.230.97.88')) {
              img.setAttribute('data-stage', 'prod-fallback');
              try {
                var url = new URL(currentSrc);
                img.src = 'http://148.230.97.88' + url.pathname + url.search;
                return;
              } catch (e) {
                console.error('Production fallback failed:', e);
              }
            }
          }

          if (stage === 'dev-local' && !currentSrc.includes('148.230.97.88')) {
            img.setAttribute('data-stage', 'prod-fallback');
            try {
              var url = new URL(currentSrc);
              img.src = 'http://148.230.97.88' + url.pathname + url.search;
              return;
            } catch (e) {}
          }

          img.style.display = 'none';
          var parent = img.parentElement;
          if (parent && parent.classList.contains('invoice-watermark')) {
            parent.style.display = 'none';
          }
        }
      </script>
      </head>
      <body>
        <div class="invoice-wrapper invoice-container" style="border: 3px solid #C6A75E; min-height: 100vh; font-weight: bold;">
          <!-- Added: bold fonts and borders throughout invoice -->
          ${watermarkHtml}
          <div class="invoice-content">
          <div class="text-center" style="margin-bottom: 20px;">
            ${/* Removed: logo from invoice header as requested */ ""}
            <div class="hotel-name" style="color: ${hotelFields.invoiceHotelNameColor};">${hotelFields.name}</div>
            ${hotelFields.invoiceShowCustomLines ? `
            <div class="hotel-info" style="font-weight: bold; margin-bottom: 2px; color: ${hotelFields.invoiceHeaderColor}; font-size: ${hotelFields.invoiceLine1Size || 14}px;">${hotelFields.invoiceLine1}</div>
            <div class="hotel-info" style="font-weight: bold; margin-bottom: 8px; color: ${hotelFields.invoiceHeaderColor}; font-size: ${hotelFields.invoiceLine2Size || 16}px;">${hotelFields.invoiceLine2}</div>
            ` : ""}
            <div class="hotel-info" style="color: #000000;">${hotelFields.addressLine1}</div>
            ${hotelFields.addressLine2 ? `<div class="hotel-info" style="color: #000000;">${hotelFields.addressLine2}</div>` : ""}
            <div class="hotel-info" style="color: #000000;">Contact No:- ${hotelFields.phone}</div>
            <div class="hotel-info" style="color: #000000;">GST Number: ${hotelFields.gst}</div>
            <div class="proforma-title" style="color: #000000;">TAX INVOICE</div>
          </div>

          <div class="info-box">
            <div class="info-col" style="border-right: 3px solid #C6A75E;">
              ${companyName ? `<div class="info-row"><div class="info-label">Company</div><div class="info-val">- ${companyName}</div></div>` : ""}
              ${companyGst ? `<div class="info-row"><div class="info-label">GST No.</div><div class="info-val">- ${companyGst}</div></div>` : ""}
              <div class="info-row"><div class="info-label">Guest Name</div><div class="info-val">- ${guestName || "-"}</div></div>
              <div class="info-row"><div class="info-label">Contact No</div><div class="info-val">- ${contactNo || "-"}</div></div>
              ${guestAddressText && guestAddressText !== '-' ? `<div class="info-row"><div class="info-label">Address</div><div class="info-val">- ${guestAddressText}</div></div>` : ''}
              <div class="info-row"><div class="info-label">Room Nos</div><div class="info-val">- ${roomNumber || "-"}</div></div>
            </div>
            <div class="info-col">
              <div class="info-row"><div class="info-label">Invoice Date</div><div class="info-val">- ${invoiceDateStr}</div></div>
              <div class="info-row"><div class="info-label">Bill No.</div><div class="info-val">- ${invoice.invoiceNumber || "-"}</div></div>
              <div class="info-row"><div class="info-label">Reg. No.</div><div class="info-val">- ${regNo || "-"}</div></div>
              <div class="info-row"><div class="info-label">Plan</div><div class="info-val">- ${plan}</div></div>
              <div class="info-row"><div class="info-label">PAX</div><div class="info-val">- Adults ${adults},Child ${children}</div></div>
              <div class="info-row"><div class="info-label">Arrival Date</div><div class="info-val">- ${arrivalDateStr}</div></div>
              <div class="info-row"><div class="info-label">Departure Date</div><div class="info-val">- ${departureDateStr}</div></div>
            </div>
          </div>

          <table class="border-all">
            <thead class="table-header">
              <tr>
                <th style="width: 15%;">Date</th>
                <th style="width: 12%;">Charges Type</th>
                <th style="width: 33%;">Description</th>
                <th style="text-align: right; width: 10%;">Charges</th>
                <th style="text-align: right; width: 10%;">Discount</th>
                <th style="text-align: right; width: 10%;">GST</th>
                <th style="text-align: right; width: 10%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr style="font-weight: bold; font-size: 16px;">
                <td colspan="3" style="padding: 8px 4px; border-right: 3px solid #C6A75E;">Total</td>
                <td style="padding: 8px 4px; text-align: right; border-right: 3px solid #C6A75E;">${itemsChargesTotal.toFixed(2)}</td>
                <td style="padding: 8px 4px; text-align: right; border-right: 3px solid #C6A75E;">${itemsDiscountTotal.toFixed(2)}</td>
                <td style="padding: 8px 4px; text-align: right; border-right: 3px solid #C6A75E;">${itemsGstTotal.toFixed(2)}</td>
                <td style="padding: 8px 4px; text-align: right;">${itemsBeforeRound.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals-section">
            <div class="totals-col-left" style="border-right: 3px solid #C6A75E;">
              <div class="totals-row"><div>Total GST</div><div>${itemsGstTotal.toFixed(2)}</div></div>
              <div class="totals-row"><div>CGST</div><div>${itemsCgst.toFixed(2)}</div></div>
              <div class="totals-row"><div>SGST</div><div>${itemsSgst.toFixed(2)}</div></div>
            </div>
              <div class="totals-col-right">
                <div class="totals-row"><div>Total Amount</div><div>${itemsBeforeRound.toFixed(2)}</div></div>
                <div class="totals-row"><div>(-) Advance</div><div>${advanceAmountForInvoice.toFixed(2)}</div></div>
                <div class="totals-row">
                  <div>
                    (-) Discount ${invoice.discountType === 'percent' ? `(${Number(invoice.discountValue)}%)` : ''}
                  </div>
                  <div>${invoiceDiscount.toFixed(2)}</div>
                </div>
                <div class="totals-row"><div>Round Off</div><div>${itemsRoundOff.toFixed(2)}</div></div>
                <div class="totals-row" style="font-weight: bold; margin-top: 4px;"><div>Net Payable</div><div>${itemsNetPayable.toFixed(2)}</div></div>
              </div>
          </div>

          <div class="rupees-box">
            ${numberToWords(Math.round(itemsNetPayable))}
          </div>

          ${lateCheckoutNoteHtml}

          <div class="signature-section">
            <div class="sig-box">
              <div class="sig-line"></div>
              <div>Guest Signature</div>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <div>Cash/Signature</div>
              <div>Cashier</div>
            </div>
          </div>
          </div>
        </div>
      </body></html>
    `;
  };


  const handlePrint = () => {
    printHtml(getInvoiceHtml());
  };

  const handleDownload = () => {
    const html = getInvoiceHtml();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice_${invoice.invoiceNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-4xl flex flex-wrap justify-end gap-2 mb-2 px-2">
        <button
          onClick={handlePrint}
          className="bg-white text-gray-800 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-gray-50 transition-colors"
        >
          <Printer className="w-4 h-4" /> Print
        </button>
        <button
          onClick={handleDownload}
          className="bg-white text-gray-800 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" /> HTML
        </button>
        <button
          onClick={onClose}
          className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div
        className="w-full max-w-4xl rounded-sm overflow-hidden bg-white shadow-2xl animate-in fade-in zoom-in duration-300"
        style={{ height: "calc(100vh - 120px)" }}
      >
        <iframe
          srcDoc={getInvoiceHtml()}
          className="w-full h-full border-0"
          title="Invoice Preview"
        />
      </div>
    </div>
  );
}
