import { API_BASE_URL } from '../../config';

export const DEFAULT_BRAND_NAME = 'UTTARAKHAND HOTELS4U';
const ASSET_BASE = import.meta.env.BASE_URL || './';
const normalizedAssetBase = ASSET_BASE.endsWith('/') ? ASSET_BASE : `${ASSET_BASE}/`;
export const DEFAULT_LOGO_URL = `${normalizedAssetBase}images/logo_h4u.webp`;
const INLINE_LOGO_FALLBACK =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><rect width="240" height="240" rx="28" fill="%23f3efe6"/><path d="M60 170V95l30-24 30 24v75h-18v-28H78v28H60zm92 0v-55h28v55h-28zm42 0V85h18v85h-18z" fill="%23b38728"/></svg>';

export function resolveBrandName(hotel?: { brandName?: string | null } | null): string {
  return hotel?.brandName?.trim() || DEFAULT_BRAND_NAME;
}

export function resolveLogoUrl(logoUrl?: string | null): string {
  const logo = logoUrl?.trim();
  
  // Base origin of the current frontend
  const frontendOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  if (!logo) {
    // Ensure default logo is absolute
    if (DEFAULT_LOGO_URL.startsWith('http')) return DEFAULT_LOGO_URL;
    if (DEFAULT_LOGO_URL.startsWith('./')) return `${frontendOrigin}/${DEFAULT_LOGO_URL.slice(2)}`;
    if (DEFAULT_LOGO_URL.startsWith('/')) return `${frontendOrigin}${DEFAULT_LOGO_URL}`;
    return `${frontendOrigin}/${DEFAULT_LOGO_URL}`;
  }

  if (logo.startsWith('http://') || logo.startsWith('https://')) {
    return logo;
  }

  if (logo.startsWith('data:')) {
    return logo;
  }

  if (logo.startsWith('/uploads') || logo.includes('uploads/')) {
    // Clean the logo path to start with /uploads
    const cleanPath = logo.startsWith('/') ? logo : `/${logo}`;
    
    // Try to get origin from API_BASE_URL
    let base = "";
    try {
      if (API_BASE_URL.startsWith('http')) {
        const url = new URL(API_BASE_URL);
        base = url.origin;
      } else {
        // If API_BASE_URL is relative (e.g. /api/v1), use the current window origin
        base = frontendOrigin;
      }
    } catch (e) {
      base = frontendOrigin;
    }

    // Ensure we don't have /api/v1 in the base for static files
    // and that it's absolute
    const finalBase = base.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
    const absoluteBase = finalBase.startsWith('http') ? finalBase : frontendOrigin;
    
    return `${absoluteBase}${cleanPath}`;
  }

  if (logo.startsWith('/')) {
    return `${frontendOrigin}${logo}`;
  }

  if (logo.startsWith('./')) {
    return `${frontendOrigin}/${logo.slice(2)}`;
  }

  return `${frontendOrigin}/${logo}`;
}

export function handleLogoImageError(event: { currentTarget: HTMLImageElement }): void {
  const img = event.currentTarget;
  const stage = img.dataset.logoFallbackStage || 'primary';
  const currentSrc = img.src;

  console.warn(`Logo failed to load: ${currentSrc} (Stage: ${stage})`);

  if (stage === 'primary') {
    // 1. Try local dev fallback IF we are on localhost
    if (typeof window !== 'undefined' && 
        window.location.hostname === 'localhost' && 
        !currentSrc.includes('localhost:5000') &&
        (currentSrc.includes('/uploads/') || currentSrc.includes('uploads/'))) {
      
      try {
        const url = new URL(currentSrc);
        const localSrc = `http://localhost:5000${url.pathname}${url.search}`;
        img.dataset.logoFallbackStage = 'dev-local';
        img.src = localSrc;
        return;
      } catch (e) {}
    }

    // 2. If not on localhost or local fallback failed, try production fallback
    if (!currentSrc.includes('148.230.97.88')) {
      try {
        const url = new URL(currentSrc);
        const prodSrc = `http://148.230.97.88${url.pathname}${url.search}`;
        img.dataset.logoFallbackStage = 'prod-fallback';
        img.src = prodSrc;
        return;
      } catch (e) {}
    }
    
    // 3. Fallback to default asset
    img.dataset.logoFallbackStage = 'secondary';
    img.src = DEFAULT_LOGO_URL;
    return;
  }

  if (stage === 'dev-local' || stage === 'prod-fallback') {
    // If local/prod fallback failed, try production if not tried, else default
    if (stage === 'dev-local' && !currentSrc.includes('148.230.97.88')) {
      try {
        const url = new URL(currentSrc);
        const prodSrc = `http://148.230.97.88${url.pathname}${url.search}`;
        img.dataset.logoFallbackStage = 'prod-fallback';
        img.src = prodSrc;
        return;
      } catch (e) {}
    }
    
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
