import axios from "axios";
const API_URL = import.meta.env.VITE_BE_API_URL;
const TOKEN_KEY = "userAppToken";

let unauthorizedHandler = null;
export const setUnauthorizedHandler = (fn) => {
    unauthorizedHandler = fn;
};

const apiAppSettingsInstance = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
    },
    timeout: 10000
});

apiAppSettingsInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiAppSettingsInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    if (unauthorizedHandler) {
                        unauthorizedHandler();
                    }
                    break;
                case 403:
                    console.error("Akses tidak dizinkan:", error.response.data?.message);
                    break;
                case 404:
                    console.error("Resource tidak ditemukan:", error.response.data?.message);
                    break;
                case 422:
                    console.error("Validasi gagal :", error.response.data?.errors || error.response.data);
                    break;
                case 500:
                case 502:
                case 503:
                    console.error("Terjadi kesalahan pada server");
                    break;
                default:
                    console.error(`Error ${error.response.status}:`, error.response.data?.message);
            }
        } else if (error.request) {
            console.error("Tidak dapat terhubung ke server. Periksa koneksi internet");
        } else {
            console.error("Terjadi kesalahan saat menyiapkan request:", error.message);
        }
        
        return Promise.reject(error);
    }
);

export default apiAppSettingsInstance; 