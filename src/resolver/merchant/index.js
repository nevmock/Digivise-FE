import axiosRequest from "../../utils/request";


export async function getMerchantListById()  {
    try {
        const response = await axiosRequest.get("/api/merchants");
        return response.data;
    } catch (error) {
        throw error;
    }
};

export async function createMerchant(username, email, password, phone, sector_industry, office_address, factory_address) {
    try {
        const response = await axios.post(`/createMerchant`, { username, email, password, phone, sector_industry, office_address, factory_address });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export async function loginMerchant(username, password) {
    try {
        const response = await axios.post(`/login-merchant`, { username, password });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export async function requestOtpMerchant(email) {
    try {
        const response = await axios.post(`/request-otp-merchant`, { email });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export async function verifyOtpMerchant(email, otp) {
    try {
        const response = await axios.post(`/verify-otp-merchant`, { email, otp });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export async function refreshTokenMerchant(token) {
    try {
        const response = await axios.post(`/refresh-token-merchant`, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};