import { API_BASE_URL } from '../../config';

export const DEFAULT_BRAND_NAME = 'Hotels4U PMS';
export const DEFAULT_LOGO_URL = '/images/logo_h4u.webp';

function getApiOrigin() {
  try {
    return new URL(API_BASE_URL, typeof window !== 'undefined' ? window.location.origin : 'http://localhost').origin;
  } catch {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
}

export function resolveBrandName(hotel?: { brandName?: string | null } | null): string {
  return hotel?.brandName?.trim() || DEFAULT_BRAND_NAME;
}

export function resolveLogoUrl(logoUrl?: string | null): string {
  if (!logoUrl) return DEFAULT_LOGO_URL;
  if (/^https?:\/\//i.test(logoUrl)) return logoUrl;

  const origin = getApiOrigin();
  if (!origin) return logoUrl;

  if (logoUrl.startsWith('/')) return `${origin}${logoUrl}`;
  return `${origin}/${logoUrl}`;
}
