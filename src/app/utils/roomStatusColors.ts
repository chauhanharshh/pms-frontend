import { useEffect, useState } from "react";

export interface RoomStatusColors {
  checkInColor: string;
  checkOutColor: string;
  maintenanceColor: string;
}

export const ROOM_STATUS_COLORS_STORAGE_KEY = "pms_room_status_colors";
export const ROOM_STATUS_COLORS_EVENT = "pms-room-status-colors-changed";

export const DEFAULT_ROOM_STATUS_COLORS: RoomStatusColors = {
  checkInColor: "#b91c1c",
  checkOutColor: "#07b44c",
  maintenanceColor: "#07b44c",
};

const isValidHex = (color: string) => /^#([0-9A-F]{3}){1,2}$/i.test(color);

function withDefaults(defaults?: Partial<RoomStatusColors>): RoomStatusColors {
  return {
    ...DEFAULT_ROOM_STATUS_COLORS,
    ...(defaults || {}),
  };
}

export function getRoomStatusColors(defaults?: Partial<RoomStatusColors>): RoomStatusColors {
  const mergedDefaults = withDefaults(defaults);

  if (typeof window === "undefined") {
    return mergedDefaults;
  }

  try {
    const raw = localStorage.getItem(ROOM_STATUS_COLORS_STORAGE_KEY);
    if (!raw) return mergedDefaults;

    const parsed = JSON.parse(raw) as Partial<RoomStatusColors>;

    return {
      checkInColor: isValidHex(parsed.checkInColor || "")
        ? (parsed.checkInColor as string)
        : mergedDefaults.checkInColor,
      checkOutColor: isValidHex(parsed.checkOutColor || "")
        ? (parsed.checkOutColor as string)
        : mergedDefaults.checkOutColor,
      maintenanceColor: isValidHex(parsed.maintenanceColor || "")
        ? (parsed.maintenanceColor as string)
        : mergedDefaults.maintenanceColor,
    };
  } catch {
    return mergedDefaults;
  }
}

export function saveRoomStatusColors(colors: RoomStatusColors): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(ROOM_STATUS_COLORS_STORAGE_KEY, JSON.stringify(colors));
  window.dispatchEvent(new Event(ROOM_STATUS_COLORS_EVENT));
}

export function useRoomStatusColors(defaults?: Partial<RoomStatusColors>): RoomStatusColors {
  const [colors, setColors] = useState<RoomStatusColors>(() => getRoomStatusColors(defaults));

  useEffect(() => {
    setColors(getRoomStatusColors(defaults));

    const sync = () => setColors(getRoomStatusColors(defaults));

    window.addEventListener(ROOM_STATUS_COLORS_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(ROOM_STATUS_COLORS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [defaults?.checkInColor, defaults?.checkOutColor, defaults?.maintenanceColor]);

  return colors;
}
