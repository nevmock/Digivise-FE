import axiosRequest from "../../utils/request";

export async function getKpiData(id) {
    try {
        const response = await axiosRequest.get(`/api/kpis/merchant/${id}`);
        if (response.status === 200 && response.data) {
            const { kpiData } = response.data;
            localStorage.setItem("kpiData", JSON.stringify(kpiData));

            return response.data;
        } else {
            throw new Error("Failed to fetch KPI data");
        }
    } catch (error) {
        throw error;
    }
};

export async function updateKpiData(data){
    try {
        const response = await axiosRequest.put(`/api/kpis/`);
        if (response.status === 200) {
            return response.data;
        } else {
            throw new Error("Failed to update KPI data");
        }
    } catch (error) {
        throw error;
    }
}