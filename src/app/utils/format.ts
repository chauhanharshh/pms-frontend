export function formatCurrency(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(num || 0);
}

export function formatDate(date: string | Date): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

type MaybeRecord = Record<string, any> | null | undefined;

const DAY_MS = 1000 * 60 * 60 * 24;

function firstNonEmpty(...values: any[]): string {
    for (const value of values) {
        if (value === null || value === undefined) continue;
        const str = String(value).trim();
        if (str) return str;
    }
    return '';
}

function parseCheckInDateTime(rawValue: string, fallbackDate?: string): Date | null {
    if (!rawValue) return null;

    const normalized = rawValue.trim();
    const timeOnlyPattern = /^\d{1,2}:\d{2}(:\d{2})?$/;
    const hasAmPm = /\b(am|pm)\b/i.test(normalized);

    if (timeOnlyPattern.test(normalized) && fallbackDate) {
        const isoCandidate = new Date(`${fallbackDate}T${normalized}`);
        return Number.isNaN(isoCandidate.getTime()) ? null : isoCandidate;
    }

    if (hasAmPm && fallbackDate) {
        const candidate = new Date(`${fallbackDate} ${normalized}`);
        return Number.isNaN(candidate.getTime()) ? null : candidate;
    }

    const direct = new Date(normalized);
    return Number.isNaN(direct.getTime()) ? null : direct;
}

export function getActualCheckInValue(checkin?: MaybeRecord, reservation?: MaybeRecord): string {
    return firstNonEmpty(
        checkin?.checkInTime,
        checkin?.actualCheckIn,
        checkin?.arrivalTime,
        reservation?.checkInTime,
        reservation?.arrivalTime,
    );
}

export function formatActualCheckInDateTime(
    checkin?: MaybeRecord,
    reservation?: MaybeRecord,
    fallbackDate?: string,
): string {
    const resolvedCheckIn = getActualCheckInValue(checkin, reservation);
    const referenceDate =
        fallbackDate ||
        firstNonEmpty(checkin?.checkInDate, reservation?.checkInDate);

    const parsed = parseCheckInDateTime(resolvedCheckIn, referenceDate || undefined);
    if (parsed) {
        return parsed.toLocaleString('en-IN');
    }

    if (referenceDate) {
        const date = new Date(referenceDate);
        if (!Number.isNaN(date.getTime())) {
            return date.toLocaleDateString('en-IN');
        }
    }

    return '-';
}

function toDateWithNoonDefault(input: string | Date): Date {
    if (input instanceof Date) return new Date(input);

    const raw = String(input || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return new Date(`${raw}T12:00:00`);
    }

    return new Date(raw);
}

function isAfterNoon(value: Date): boolean {
    const hours = value.getHours();
    const minutes = value.getMinutes();
    const seconds = value.getSeconds();
    const millis = value.getMilliseconds();
    return hours > 12 || (hours === 12 && (minutes > 0 || seconds > 0 || millis > 0));
}

export function calculateRoomDays(checkInTime: string | Date, checkOutTime: string | Date): number {
    const checkIn = toDateWithNoonDefault(checkInTime);
    const checkOut = toDateWithNoonDefault(checkOutTime);

    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
        return 1;
    }

    const checkInNoon = new Date(checkIn);
    if (checkIn.getHours() < 12) {
        checkInNoon.setDate(checkInNoon.getDate() - 1);
    }
    checkInNoon.setHours(12, 0, 0, 0);

    const checkOutNoon = new Date(checkOut);
    checkOutNoon.setHours(12, 0, 0, 0);

    let days = Math.ceil((checkOutNoon.getTime() - checkInNoon.getTime()) / DAY_MS);
    if (isAfterNoon(checkOut)) {
        days += 1;
    }

    return Math.max(days, 1);
}

export function daysBetween(a: string | Date, b: string | Date): number {
    return calculateRoomDays(a, b);
}

export function generateId(): string {
    return Math.random().toString(36).substr(2, 9);
}
