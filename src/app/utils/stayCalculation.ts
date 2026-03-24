export const calculateStayDays = (
  checkInDate: string,
  checkInTime: string,
  checkOutDate: string,
  checkOutTime: string
): number => {
  if (!checkInDate || !checkOutDate) return 1;

  const checkInDateOnly = String(checkInDate).split("T")[0];
  const checkOutDateOnly = String(checkOutDate).split("T")[0];

  const start = new Date(`${checkInDateOnly}T00:00:00`);
  const end = new Date(`${checkOutDateOnly}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;

  const msPerDay = 1000 * 60 * 60 * 24;
  let nights = Math.round((end.getTime() - start.getTime()) / msPerDay);
  
  // Rule 1: Early Check-in (< 9:00 AM) => +1 day
  const ciTime = checkInTime || "14:00";
  const [ciH, ciM] = String(ciTime).split(":").map(Number);
  if (ciH < 9) {
    nights += 1;
  }

  // Rule 2: Late Check-out (> 11:00 AM) => +1 day
  const coTime = checkOutTime || "11:00";
  const [coH, coM] = String(coTime).split(":").map(Number);
  if (coH > 11 || (coH === 11 && coM > 0)) {
    nights += 1;
  }

  // Rule 3: Minimum 1 day stay
  return Math.max(nights, 1);
};

export const isLateCheckout = (checkOutTime: string): boolean => {
  if (!checkOutTime) return false;
  const [h, m] = String(checkOutTime)
    .split(":")
    .map((value) => Number(value));
  const hours = Number.isFinite(h) ? h : 0;
  const minutes = Number.isFinite(m) ? m : 0;
  // Rule: Late if after 11:00 AM
  return hours > 11 || (hours === 11 && minutes > 0);
};
