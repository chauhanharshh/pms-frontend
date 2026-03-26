import axios from 'axios';

// ──────────────────────────────────────────────────────────
// Dynamic API Base URL — reads from Electron config injection
// Falls back to VITE_API_BASE_URL env var or localhost for dev
// ──────────────────────────────────────────────────────────
import { API_BASE_URL as CONFIG_API_BASE_URL } from '../../config';

export const API_BASE_URL = CONFIG_API_BASE_URL;

const api = axios.create({
    baseURL: API_BASE_URL,
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
        return Promise.reject(error);
    }
);

export default api;
