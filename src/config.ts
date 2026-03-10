/**
 * Configuration for the Hotel PMS Frontend
 */

const apiBaseUrl = import.meta.env?.VITE_API_BASE_URL || 'https://hotel-pms-backend-jfqh.onrender.com/api/v1';

export const API_BASE_URL = apiBaseUrl;

const config = {
    API_BASE_URL
};

export default config;
