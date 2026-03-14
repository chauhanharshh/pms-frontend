/**
 * Configuration for the Hotel PMS Frontend
 */

const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

// Priority:
// 1) explicit env var
// 2) localhost backend during local dev
// 3) relative path in production (works with Vercel rewrite proxy)
const apiBaseUrl = import.meta.env?.VITE_API_BASE_URL
    || (isLocalhost ? 'http://localhost:5000/api/v1' : '/api/v1');

export const API_BASE_URL = apiBaseUrl;

const config = {
    API_BASE_URL
};

export default config;
