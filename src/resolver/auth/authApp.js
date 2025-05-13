import axiosRequest from "../../utils/request";


const TOKEN_KEY = "userAppToken";
const USER_DATA_KEY = "userDataApp";

export const login = async (username, password) => {
    const payload = { username, password };
    try {
        const response = await axiosRequest.post("auth/login", payload);
        if (response.status === 200 && response.data) {
            const { accessToken, userId, username, merchants = [] } = response.data;
            const userData = {
                accessToken,
                userId,
                username,
                merchants
            };
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
            localStorage.setItem(TOKEN_KEY, accessToken);

            return userData;
        } else {
            throw new Error("Login Gagal, silakan coba lagi");
        }
    } catch (error) {    
        throw error;
    }
};

export const logout = async () => {
    const accessToken = localStorage.getItem(TOKEN_KEY);
    if (!accessToken) {
        return;
    }

    try {
        await axiosRequest.post("auth/logout", {}, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        localStorage.removeItem(USER_DATA_KEY);
        localStorage.removeItem(TOKEN_KEY);
    } catch (error) {
        throw error;
    }
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const isAuthenticated = () =>  !!getToken();