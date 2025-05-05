import axiosRequest from "../../utils/request";

export const login = async (username, password) => {
    const payload = { username, password };
    try {
        const response = await axiosRequest.post("auth/login", payload);
        if (response.status === 200 && response.data) {
            const { accessToken, userId, username, merchants = [] } = response.data;
            const userData = {
                userId,
                username,
                merchants,
            };
            localStorage.setItem("userDataApp", JSON.stringify(userData));
            localStorage.setItem("userAppToken", accessToken);
            
            return accessToken;
        } else {
            throw new Error("Login failed");
        }
    } catch (error) {    
        throw error;
    }
};

export const logout = async () => {
    const accessToken = localStorage.getItem("userAppToken");
    if (!accessToken) {
        return;
    }

    try {
        await axiosRequest.post("auth/logout", {}, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        localStorage.removeItem("userDataApp");
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