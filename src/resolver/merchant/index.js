import axiosRequest from "../../utils/request";
import axios from "axios";


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
        throw new Error("User ID dibutuhkan");
    }

    try {
        const response = await axiosRequest.get(`/api/merchants/user/${user_id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// export async function createMerchant(username, password, sectorIndustry, officeAddress, factoryAddress) {
export async function createMerchant(name, sectorIndustry, officeAddress, factoryAddress) {
    try {
        // const response = await axiosRequest.post(`/api/merchants`, { username, password, sectorIndustry, officeAddress, factoryAddress });
        const response = await axiosRequest.post(`/api/merchants`, { name, sectorIndustry, officeAddress, factoryAddress });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export async function loginMerchant(username, password, merchantId) {
    try {
        const response = await axiosRequest.post(`/api/merchants/login`, { username, password, merchantId });
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
};

export async function switchMerchant(merchantId) {
    if (!merchantId) {
        throw new Error("Merchant ID dibutuhkan");
    }

    try {
        const response = await axiosRequest.get("/api/merchants/switch", {
            params: {
                merchantId: merchantId
            }
        });
        
        if (response.status === 200 || response.status === 201 || response.status === "OK") {
            return {
                success: true,
                data: response.data,
                message: "Merchant switched successfully"
            };
        }
        
        return {
            success: true,
            data: response.data,
            message: response.data?.message || "Merchant switched successfully"
        };
        
    } catch (error) {
        if (error.response?.status === 404) {
            return {
                success: false,
                requiresLogin: true,
                message: "No active session found for this merchant"
            };
        }
        
        if (error.response?.status === 401) {
            return {
                success: false,
                requiresLogin: true,
                message: "Session expired for this merchant"
            };
        }

        if (error.response?.status === 400) {
            return {
                success: false,
                requiresLogin: true,
                message: error.response?.data?.message || "Bad request"
            };
        }

        if (error.response?.status === 403) {
            return {
                success: false,
                requiresLogin: true,
                message: "Access denied for this merchant"
            };
        }
        
        throw error;
    }
}