const convertFormatEnglish = (value) => {
    const newValue = Number(value);

    if (newValue >= 1_000_000_000_000) {
        return (newValue / 1_000_000_000_000).toFixed(2).replace(/\.0$/, '') + 't';
    }else if (newValue >= 1_000_000_000) {
        return (newValue / 1_000_000_000).toFixed(2).replace(/\.0$/, '') + 'b';
    } else if (newValue >= 1_000_000) {
        return (newValue / 1_000_000).toFixed(2).replace(/\.0$/, '') + 'm';
    } else if (newValue >= 1_000) {
        return (newValue / 1_000).toFixed(2).replace(/\.0$/, '') + 'k';
    } else {
        return newValue.toString();
    }
}

export default convertFormatEnglish;