import axiosRequest from "../../utils/request";
const API_URL = import.meta.env.BE_API_URL;

export default async function verifyOtp(otp) {
    try {
        const response = await axiosRequest.post(`${API_URL}/v1/verify-otp`, { otp });
        return response.data;
    } catch (error) {
        throw error;
    }
};