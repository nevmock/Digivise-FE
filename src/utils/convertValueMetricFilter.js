import convertBudgetToIDR from "./convertFromatToIDR";

const formatMetricValue = (metricKey, value) => {
    if (value === undefined || value === null) return "0";

    switch (metricKey) {
    case "dailyBudget":
        return `Rp ${convertBudgetToIDR(value)}`;
    case "impression":
    case "click":
        return value.toLocaleString('id-ID');
    default:
        return value.toString();
    }
};

export default formatMetricValue;