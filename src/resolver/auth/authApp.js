import axiosRequest from "../../utils/request";


const TOKEN_KEY = "userAppToken";
const USER_DATA_KEY = "userDataApp";
const ACTIVE_MERCHANT_KEY = "activeUserMerchant";

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
        const response = await axiosRequest.post("auth/logout", {}, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        if ((response.status !== 200 || response.code !== 200) || !response.data) {
            throw new Error("Logout Gagal, silakan coba lagi");
        }

        localStorage.removeItem(USER_DATA_KEY);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ACTIVE_MERCHANT_KEY);
    } catch (error) {
        throw error;
    }
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const isAuthenticated = () =>  !!getToken();