import axios from "axios";

export const API_BASE =
    import.meta.env.VITE_API_URL ||
    "https://printer-backend-34ih.onrender.com";

const api = axios.create({
    baseURL: `${API_BASE}/api`
});

export const RAZORPAY_KEY =
    import.meta.env.VITE_RAZORPAY_KEY ||
    "rzp_test_T4Y22L3msbuqYr";

export const getPdfDownloadUrl = (id) =>
    `${API_BASE}/api/pdf/download/${id}`;

export default api;
