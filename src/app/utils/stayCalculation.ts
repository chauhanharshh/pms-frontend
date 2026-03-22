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
  nights = Math.max(nights, 1);

  const checkOutTime24 = checkOutTime || "12:00";
  const [h, m] = String(checkOutTime24)
    .split(":")
    .map((value) => Number(value));
  const hours = Number.isFinite(h) ? h : 12;
  const minutes = Number.isFinite(m) ? m : 0;

  if (hours > 12 || (hours === 12 && minutes > 0)) {
    nights += 1;
  }

  return nights;
};

export const isLateCheckout = (checkOutTime: string): boolean => {
  if (!checkOutTime) return false;
  const [h, m] = String(checkOutTime)
    .split(":")
    .map((value) => Number(value));
  const hours = Number.isFinite(h) ? h : 0;
  const minutes = Number.isFinite(m) ? m : 0;
  return hours > 12 || (hours === 12 && minutes > 0);
};
