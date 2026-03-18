export interface KotWallColors {
  wallBackgroundColor: string;
  cardBackgroundColor: string;
  cardBorderColor: string;
  cardTextColor: string;
  headerBackgroundColor: string;
}

export const KOT_WALL_COLORS_STORAGE_KEY = "kotWallColors";

export const DEFAULT_KOT_WALL_COLORS: KotWallColors = {
  wallBackgroundColor: "#000000",
  cardBackgroundColor: "#ffffff",
  cardBorderColor: "#ff0000",
  cardTextColor: "#000000",
  headerBackgroundColor: "#e8dfcf",
};

const isValidHex = (color: string) => /^#([0-9A-F]{3}){1,2}$/i.test(color);

export function getKotWallColors(defaults?: Partial<KotWallColors>): KotWallColors {
  const mergedDefaults: KotWallColors = {
    ...DEFAULT_KOT_WALL_COLORS,
    ...(defaults || {}),
  };

  if (typeof window === "undefined") return mergedDefaults;

  try {
    const raw = localStorage.getItem(KOT_WALL_COLORS_STORAGE_KEY);
    if (!raw) return mergedDefaults;

    const parsed = JSON.parse(raw) as Partial<KotWallColors>;

    return {
      wallBackgroundColor: isValidHex(parsed.wallBackgroundColor || "")
        ? (parsed.wallBackgroundColor as string)
        : mergedDefaults.wallBackgroundColor,
      cardBackgroundColor: isValidHex(parsed.cardBackgroundColor || "")
        ? (parsed.cardBackgroundColor as string)
        : mergedDefaults.cardBackgroundColor,
      cardBorderColor: isValidHex(parsed.cardBorderColor || "")
        ? (parsed.cardBorderColor as string)
        : mergedDefaults.cardBorderColor,
      cardTextColor: isValidHex(parsed.cardTextColor || "")
        ? (parsed.cardTextColor as string)
        : mergedDefaults.cardTextColor,
      headerBackgroundColor: isValidHex(parsed.headerBackgroundColor || "")
        ? (parsed.headerBackgroundColor as string)
        : mergedDefaults.headerBackgroundColor,
    };
  } catch {
    return mergedDefaults;
  }
}

export function saveKotWallColors(colors: KotWallColors): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KOT_WALL_COLORS_STORAGE_KEY, JSON.stringify(colors));
}
