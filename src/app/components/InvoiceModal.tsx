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
    checkinData?.checkInDate,
    invoiceBooking?.checkInDate,
    bk?.checkInDate
  );

  const checkOutDateValue = firstNonEmpty(
    checkinData?.checkOutDate,
    invoiceBooking?.checkOutDate,
    bk?.checkOutDate
  );

  const checkInTimeValue = firstNonEmpty(
    checkinData?.checkInTime,
    invoiceBooking?.checkInTime,
    bk?.checkInTime
  );

  const checkOutTimeValue = firstNonEmpty(
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
    booking?.guestName ||
    booking?.guest?.name ||
    [booking?.firstName, booking?.lastName].filter(Boolean).join(' ').trim() ||
    checkin?.guestName ||
    invoice?.guestName ||
    bill?.booking?.guestName ||
    '—';

  const contactNo =
    booking?.phone ||
    booking?.contact ||
    booking?.phoneNumber ||
    booking?.mobile ||
    booking?.guestPhone ||
    booking?.guest?.phone ||
    checkin?.phone ||
    checkin?.guestPhone ||
    invoice?.phone ||
    '—';

  const address =
    booking?.address ||
    booking?.homeAddress ||
    booking?.permanentAddress ||
    booking?.addressLine ||
    booking?.guest?.address ||
    checkin?.address ||
    '';

  const roomNumber =
    booking?.roomNumber ||
    booking?.room?.number ||
    booking?.room?.roomNumber ||
    booking?.roomNo ||
    checkin?.roomNumber ||
    invoice?.roomNumber ||
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

  const adults = booking?.adults || booking?.pax?.adults || 0;
  const children = booking?.children || booking?.pax?.children || 0;

  const companyName =
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

  if (Number(invoice.bill?.roomCharges) > 0) {
    const base = Number(invoice.bill.roomCharges);
    const totalRoomNights = Math.max(stayDays, 1);
    const normalNights = lateCheckoutApplied ? Math.max(totalRoomNights - 1, 1) : totalRoomNights;
    const normalRoomCharge = roomRate > 0 ? roomRate * normalNights : (lateCheckoutApplied ? base / totalRoomNights * normalNights : base);
    const lateCheckoutCharge = lateCheckoutApplied
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

    if (lateCheckoutApplied && lateCheckoutCharge > 0) {
      items.push({
        date: lateChargeDate,
        type: "Late\nCheck-Out",
        desc: `Late Check-Out Charge - checked out at ${checkOutTimeValue || '12:00'} (after 12:00 PM)`,
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
  } else if (Number(invoice.bill?.miscCharges) > 0) {
    // Fallback: aggregated row when individual records aren't available
    const base = Number(invoice.bill.miscCharges);
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

  const itemsChargesTotal = items.reduce((sum, item) => sum + Number(item.charges || 0), 0);
  const itemsDiscountTotal = items.reduce((sum, item) => sum + Number(item.discount || 0), 0);
  const itemsGstTotal = items.reduce((sum, item) => sum + Number(item.gst || 0), 0);
  const itemsBeforeRound = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const itemsRoundOff = Math.round(itemsBeforeRound) - itemsBeforeRound;
  const itemsTotalAmount = Math.round(itemsBeforeRound);
  const itemsNetPayable = itemsTotalAmount - advanceAmount;
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
    const hasLogoWatermark = safeLogoAttr.trim().length > 0;

    const watermarkHtml = hasLogoWatermark
      ? `<div class="invoice-watermark"><img class="invoice-watermark-image" src="${safeLogoAttr}" alt="watermark" /></div>`
      : "";

    const lateCheckoutNoteHtml = lateCheckoutApplied
      ? `<div class="late-checkout-note">* Late Check-Out Charge Applied: Guest checked out at ${checkOutTimeValue} (after 12:00 PM noon). Extra day charge has been added as per hotel policy.</div>`
      : "";

    let itemsHtml = items.map(item => `
      <tr>
        <td class="border-b" style="padding: 6px 4px; border-right: 1px solid #C6A75E;">${item.date}</td>
        <td class="border-b" style="padding: 6px 4px; border-right: 1px solid #C6A75E; white-space: pre-line; vertical-align: middle;">${item.type}</td>
        <td class="border-b" style="padding: 6px 4px; border-right: 1px solid #C6A75E;">${item.desc}</td>
        <td class="border-b text-right" style="padding: 6px 4px; border-right: 1px solid #C6A75E;">${item.charges.toFixed(2)}</td>
        <td class="border-b text-right" style="padding: 6px 4px; border-right: 1px solid #C6A75E;">${item.discount.toFixed(2)}</td>
        <td class="border-b text-right" style="padding: 6px 4px; border-right: 1px solid #C6A75E;">${item.gst.toFixed(2)}</td>
        <td class="border-b text-right" style="padding: 6px 4px;">${item.total.toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <html><head><title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Courier New', Courier, monospace; font-size: 14px; color: #000; margin: 0; padding: 0; }
        .invoice-wrapper { max-width: 900px; margin: 0 auto; padding: 20px; background: #fff; position: relative; min-height: 100%; }
        .invoice-container { position: relative; }
        .invoice-watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 50%;
          max-width: 400px;
          opacity: 0.70;
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
        table { width: 100%; border-collapse: collapse; }
        .border-all { border: 1.5px solid #C6A75E; }
        .border-b { border-bottom: 1px solid #C6A75E; }
        .border-l { border-left: 1px solid #C6A75E; }
        .border-r { border-right: 1px solid #C6A75E; }
        
        .hotel-name { font-size: 22px; font-weight: bold; margin: 0; text-transform: uppercase; color: #c30909; font-family: 'Courier New', Courier, monospace; }
        .hotel-subline-top { font-size: 16px; font-weight: bold; margin: 2px 0 0; text-transform: uppercase; color:#c30909; font-family: 'Courier New', Courier, monospace; }
        .hotel-subline-brand { font-size: 22px; font-weight: bold; margin: 0 0 2px;color:#c30909; font-family: 'Courier New', Courier, monospace; text-transform: uppercase; line-height: 1.1; }
        .hotel-info { font-size: 14px; margin: 2px 0; font-family: 'Courier New', Courier, monospace; }
        .proforma-title { font-size: 16px; font-weight: bold; margin: 20px 0; font-family: serif; letter-spacing: 1px; }
        
        .info-box { border: 1.5px solid #C6A75E; display: flex; margin-bottom: 15px; }
        .info-col { width: 50%; padding: 8px 12px; }
        .info-row { display: flex; margin-bottom: 4px; line-height: 1.2; }
        .info-label { width: 140px; }
        .info-val { flex: 1; }
        
        .table-header th { padding: 8px 4px; text-align: left; font-size: 13px; border-bottom: 1.5px solid #C6A75E; border-right: 1px solid #C6A75E; }
        .table-header th:last-child { border-right: none; }
        
        .totals-section { border: 1.5px solid #C6A75E; display: flex; border-top: none; }
        .totals-col-left { width: 50%; border-right: 1.5px solid #C6A75E; padding: 8px 12px; }
        .totals-col-right { width: 50%; padding: 8px 12px; }
        .totals-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        
        .rupees-box { border: 1.5px solid #C6A75E; border-top: none; padding: 10px 12px; font-weight: bold; font-size: 13px; text-transform: uppercase; }
        
        .signature-section { margin-top: 80px; display: flex; justify-content: space-between; padding: 0 40px; }
        .sig-box { text-align: center; width: 250px; }
        .sig-line { border-top: 1.5px solid #000; margin-bottom: 8px; }
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
            opacity: 0.07;
          }
          @page { size: portrait; margin: 10mm; }
        }
      </style></head>
      <body>
        <div class="invoice-wrapper invoice-container" style="border: 1px solid #C6A75E; min-height: 100vh;">
          ${watermarkHtml}
          <div class="invoice-content">
          <div class="text-center" style="margin-bottom: 10px;">
            <div class="hotel-name">${hotelFields.name}</div>
            <div class="hotel-subline-top">A UNIT OF</div>
            <div class="hotel-subline-brand">UTTARAKHAND HOTELS4U</div>
            <div class="hotel-info">${hotelFields.addressLine1}</div>
            ${hotelFields.addressLine2 ? `<div class="hotel-info">${hotelFields.addressLine2}</div>` : ""}
            <div class="hotel-info">Contact No:- ${hotelFields.phone}</div>
            <div class="hotel-info">GST Number: ${hotelFields.gst}</div>
            <div class="proforma-title">TAX INVOICE</div>
          </div>

          <div class="info-box">
            <div class="info-col" style="border-right: 1.5px solid #C6A75E;">
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
                <td colspan="3" style="padding: 8px 4px; border-right: 1.5px solid #C6A75E;">Total</td>
                <td style="padding: 8px 4px; text-align: right; border-right: 1.5px solid #C6A75E;">${itemsChargesTotal.toFixed(2)}</td>
                <td style="padding: 8px 4px; text-align: right; border-right: 1.5px solid #C6A75E;">${itemsDiscountTotal.toFixed(2)}</td>
                <td style="padding: 8px 4px; text-align: right; border-right: 1.5px solid #C6A75E;">${itemsGstTotal.toFixed(2)}</td>
                <td style="padding: 8px 4px; text-align: right;">${itemsBeforeRound.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals-section">
            <div class="totals-col-left">
              <div class="totals-row"><div>Total GST</div><div>${itemsGstTotal.toFixed(2)}</div></div>
              <div class="totals-row"><div>CGST</div><div>${itemsCgst.toFixed(2)}</div></div>
              <div class="totals-row"><div>SGST</div><div>${itemsSgst.toFixed(2)}</div></div>
            </div>
            <div class="totals-col-right">
              <div class="totals-row"><div>Total Amount</div><div>${itemsBeforeRound.toFixed(2)}</div></div>
              <div class="totals-row"><div>(-) Advance</div><div>${advanceAmount.toFixed(2)}</div></div>
              <div class="totals-row"><div>(-) Discount</div><div>0.00</div></div>
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
      <div className="w-full max-w-4xl flex justify-end gap-3 mb-2">
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
        style={{ height: "85vh" }}
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
