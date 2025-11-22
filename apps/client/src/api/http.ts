import axios from 'axios';

// Base URL for API requests
// In development, Vite proxy will forward /api to backend
// In production, set VITE_API_URL environment variable
const baseURL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const http = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - attach JWT token if available
http.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors globally
http.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle specific error cases
        if (error.response) {
            // Server responded with error status
            const { status, data } = error.response;

            if (status === 401) {
                // Unauthorized - clear token and redirect to login
                localStorage.removeItem('token');
                window.location.href = '/login';
            }

            // Return the error message from server if available
            return Promise.reject(data.message || 'An error occurred');
        } else if (error.request) {
            // Request made but no response
            return Promise.reject('No response from server');
        } else {
            // Something else happened
            return Promise.reject(error.message || 'Request failed');
        }
    }
);

export default http;
