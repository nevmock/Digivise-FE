import axios from "axios";
const API_URL = import.meta.env.BE_API_URL;

export default async function createMerchant(username, email, password, phone, sector_industry, office_address, factory_address) {
    try {
        const response = await axios.post(`${API_URL}/v1/createMerchant`, { username, email, password, phone, sector_industry, office_address, factory_address });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export async function getMerchantById(id) {
    try {
        const response = await axios.get(`${API_URL}/v1/merchant/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export async function refreshTokenMerchant(token) {
    try {
        const response = await axios.post(`${API_URL}/v1/refresh-token-merchant`, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export default async function getMerchantList()  {
    try {
        const response = await axios.get(`${API_URL}/v1/allMerchant`);
        return response.data;
    } catch (error) {
        throw error;
    }
};