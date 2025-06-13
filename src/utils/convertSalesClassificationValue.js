const convertSalesClassificationValue = (value) => {
    switch (value) {
        case "UNKNOWN":
            return "-";
        default:
            return value;
    }
};