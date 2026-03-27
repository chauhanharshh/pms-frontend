/**
 * Configuration for the Hotel PMS Frontend
 */

const runtimeProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;

// Priority:
// 1) Vite explicit API URL
// 2) Legacy Vite API base URL
// 3) CRA-style runtime env
// 4) Safe production placeholder
const apiBaseUrl = import.meta.env?.VITE_API_URL
    || import.meta.env?.VITE_API_BASE_URL
    || runtimeProcess?.env?.REACT_APP_API_URL
    || 'https://pms-backend-1j4y.onrender.com/api/v1'; // Fixed: hardcoded fallback for Electron production build

export const API_BASE_URL = apiBaseUrl;

const config = {
    API_BASE_URL
};

export default config;
