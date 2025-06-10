function convertRatioValue(value) {
    const numericValue = Number(value);
    if (isNaN(numericValue)) return "0";

    return `${numericValue.toFixed(2)}%`;
};