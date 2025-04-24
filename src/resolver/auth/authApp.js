import axios from "axios";
const API_URL = import.meta.env.BE_API_URL;

export const login = async (username, password) => {
    const response = await axios.post(`${API_URL}/login`, { username, password });
    const { token } = response.data;
    localStorage.setItem("userToken", token);
    return token;
};

export const logout = async () => {
    try {
        const token = localStorage.getItem("userToken");

        if (token) {
            await axios.post(`${API_URL}/logout`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        }
    } catch (err) {
        alert("Terjadi masalah di server");
        console.error("Error saat logout dari server:", err);
    } finally {
        localStorage.removeItem("userToken");
    }
};

export const getToken = () => {
    return localStorage.getItem("userToken");
};

export const isAuthenticated = () => {
    return !!getToken();
};