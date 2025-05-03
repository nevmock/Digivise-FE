import axios from "axios";
const API_URL = import.meta.env.BE_API_URL;

export default async function loginMerchant(username, password) {
    const payload = { username, password };
    try {
        const response = await axios.post(`${API_URL}/v1/login-merchant`, payload, {
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (response.status === 200) {
            const { token } = response.data.token;
            localStorage.setItem("userMerchantToken", token);
            return token;
        } else {
            throw new Error("Login failed");
        }
    } catch (error) {
        throw error;
    }
};