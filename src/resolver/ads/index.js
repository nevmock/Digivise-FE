
import axiosRequest from "../../utils/request";

export async function getAdsData() {
    try {
        const response = await axiosRequest.get("/api/product-ads/all");
        return response.data;
    } catch (error) {
        console.error("Error saat mengambil data iklan:", error);
        throw error;
    }
};