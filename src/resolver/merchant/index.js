import axiosRequest from "../../utils/request";


export async function getAllMerchants() {
    try {
        const response = await axiosRequest.get("/api/merchant");
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function getMerchantListById(user_id) {
    if (!user_id) {
        throw new Error("User ID is required");
    }

    try {
        const response = await axiosRequest.get(`/api/merchants/user/${user_id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export async function createMerchant(merchantName, sectorIndustry, officeAddress, factoryAddress) {
    try {
        const response = await axiosRequest.post(`/api/merchants`, { merchantName, sectorIndustry, officeAddress, factoryAddress });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export async function loginMerchant(username, password) {
    try {
        const response = await axiosRequest.post(`/api/merchants/login`, { username, password });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export async function verifyMerchantOtp(username, merchantId, otp) {
    try {
        const response = await axiosRequest.post(`/api/merchants/otp-login`, { username, merchantId, otp });
        return response.data;
    } catch (error) {
        throw error;
    }
}