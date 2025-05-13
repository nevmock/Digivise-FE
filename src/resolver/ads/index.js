
import axiosRequest from "../../utils/request";

export async function getAllAdsData() {
    try {
        const response = await axiosRequest.get("/api/product-ads?shopId=252234165&from=2025-03-12T17:12:28.635&to=2025-03-22T10:20:27.255");
        return response.data;
    } catch (error) {
        console.error("Error saat mengambil data iklan:", error);
        throw error;
    }
};

export async function getAllProductAdsData() {
    try {
        const response = await axiosRequest.get("/api/product-ads/all");
        return response.data;
    } catch (error) {
        console.error("Error saat mengambil data iklan:", error);
        throw error;
    }
};