const convertFormatRatio = (value) => { 
    const isNegative = value < 0;
    const rounded = parseFloat(value?.toFixed(2));
    return { isNegative, rounded };
};

export default convertFormatRatio;