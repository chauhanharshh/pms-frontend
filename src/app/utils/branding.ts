export const DEFAULT_BRAND_NAME = 'Hotels4U PMS';
export const DEFAULT_LOGO_URL = '/images/logo_h4u.webp';
const INLINE_LOGO_FALLBACK =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><rect width="240" height="240" rx="28" fill="%23f3efe6"/><path d="M60 170V95l30-24 30 24v75h-18v-28H78v28H60zm92 0v-55h28v55h-28zm42 0V85h18v85h-18z" fill="%23b38728"/></svg>';

export function resolveBrandName(hotel?: { brandName?: string | null } | null): string {
  return hotel?.brandName?.trim() || DEFAULT_BRAND_NAME;
}

export function resolveLogoUrl(logoUrl?: string | null): string {
  void logoUrl;
  return DEFAULT_LOGO_URL;
}

export function handleLogoImageError(event: { currentTarget: HTMLImageElement }): void {
  const img = event.currentTarget;
  const stage = img.dataset.logoFallbackStage || 'primary';

  if (stage === 'primary') {
    img.dataset.logoFallbackStage = 'secondary';
    img.src = DEFAULT_LOGO_URL;
    return;
  }

  if (stage === 'secondary') {
    img.dataset.logoFallbackStage = 'final';
    img.src = INLINE_LOGO_FALLBACK;
    return;
  }

  img.onerror = null;
}
