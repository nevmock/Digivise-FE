import convertValueToIDR from "./convertFromatToIDR";
import convertValueToENG from "./convertFormatToENG";

const formatTableValue = (value, type) => {
    if (value === undefined || value === null) return "-";

    switch (type) {
        case "currency":
            return "Rp " + convertValueToIDR(value);
        case "simple_currency":
            return convertValueToENG(value);
        case "percentage":
            return `${parseFloat(value?.toFixed(2))}%`;
        case "coma":
            return `${parseFloat(value?.toFixed(2))}`;
        case "ratio":
            if (value < 0) {
                return `${parseFloat(value?.toFixed(2))}%`;
            } else {
                return `+${parseFloat(value?.toFixed(2))}%`;
            }
        case "number":
            return new Intl.NumberFormat("id-ID", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(value);
        default:
            return value.toString();
    }
};

export default formatTableValue;