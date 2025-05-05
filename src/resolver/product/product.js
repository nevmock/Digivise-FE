import axiosRequest from "../../utils/request";

export default getProductsAll = async () => {
    try {
        const response = await axiosRequest.get("/api/product-ads/all");
        return response.data;
    } catch (error) {
        throw error;
    }
}