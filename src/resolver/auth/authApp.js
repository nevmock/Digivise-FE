import axiosRequest from "../../utils/request";
const API_URL = import.meta.env.BE_API_URL;

export const login = async (username, password) => {
    const payload = { username, password };
    try {
        const response = await axiosRequest.post(`${API_URL}/v1/login`, payload);
        if (response.status === 200) {
            const { token } = response.data.token;
            localStorage.setItem("userAppToken", token);
            return token;
        } else {
            throw new Error("Login failed");
        }
    } catch (error) {    
        throw error;
    }
};

export const logout = async () => {
    const token = localStorage.getItem("userAppToken");
    if (!token) {
        return;
    }

    try {
        await axiosRequest.post(`${API_URL}/v1/logout`, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        localStorage.removeItem("userAppToken");
    } catch (error) {
        throw error;
    }
};

export const getToken = () => {
    return localStorage.getItem("userAppToken");
};

export const isAuthenticated = () => {
    return !!getToken();
};