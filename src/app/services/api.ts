import axios from 'axios';

// ──────────────────────────────────────────────────────────
// Dynamic API Base URL — reads from Electron config injection
// Falls back to VITE_API_BASE_URL env var or localhost for dev
// ──────────────────────────────────────────────────────────
// Old Render URL: https://pms-backend-1j4y.onrender.com
// New VPS URL: http://148.230.97.88
// Updated: API URL changed from Render to VPS
const BASE_URL = import.meta.env.VITE_API_URL || 'http://148.230.97.88'; // VPS fallback

export const API_BASE_URL = BASE_URL;

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,  // 30 second timeout
    headers: {
        'Content-Type': 'application/json',
    },
});




// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('pms_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Attach hotel context header for admin switching
    const hotelId = localStorage.getItem('pms_hotel_ctx');
    if (hotelId && !config.headers['X-Hotel-ID']) {
        // Only set if not already present; allows explicit overrides for cross-hotel POS
        config.headers['X-Hotel-ID'] = hotelId;
    }
    return config;
});

// Handle 401 globally (token expired)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('pms_token');
            localStorage.removeItem('pms_user');
            localStorage.removeItem('pms_hotel_ctx');
            window.location.hash = '#/';
        }
        if (error.response?.status === 500) {
            console.error('[API 500]', error.config?.url, error.response?.data);
            // Don't crash the app — return empty data
            return Promise.resolve({ data: { status: 'success', data: [] } });
        }
        return Promise.reject(error);
    }
);

export default api;
