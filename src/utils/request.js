import axios from "axios";
const API_URL = import.meta.env.BE_API_URL;

const apiAppSettingsInstance = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    // if use cookie, set withCredentials: true
    // withCredentials: true,
    timeout: 3000,
});

apiAppSettingsInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("userAppToken");
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
        if (error.response.status === 401) {
            localStorage.removeItem("userAppToken");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default apiAppSettingsInstance; 