const formatRupiahFilter = (value) => {
    // const newValue = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const newValue = Number(value);

    if (newValue >= 1_000_000_000) {
        return (newValue / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'b';
    } else if (newValue >= 1_000_000) {
        return (newValue / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'm';
    } else if (newValue >= 1_000) {
        return (newValue / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
    } else {
        return newValue.toString();
    }
}

export default formatRupiahFilter;