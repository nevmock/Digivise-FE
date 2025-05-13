import convertBudgetToIDR from "./convertBudgetIDR";

const formatMetricValue = (metricKey, value) => {
    if (metricKey === "daily_budget") {
        if (value.length > 9) {
            return `Rp ${convertBudgetToIDR(value)}M`;
        } else if (value.length > 3) {
            return `Rp ${convertBudgetToIDR(value)}B`;
        }
    }
};

export default formatMetricValue;