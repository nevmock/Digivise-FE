import axios from "axios";
const API_URL = import.meta.env.VITE_BE_API_URL;

export async function loginMerchant(email, password) {
    const payload = { email, password };
    try {
        const response = await axios.post(`${API_URL}/api/login-merchant`, payload, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.status === 200 || response.data || response) {
            const merchant = response.data;

            localStorage.setItem("userMerchantToken", token);

            return { merchant };
        } else {
            throw new Error("Data login merchant tidak valid");
        }
    } catch (error) {
        throw error;
    }
};