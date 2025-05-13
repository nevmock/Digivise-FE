const convertBudgetToIDR = (budget) => {
    if (budget <= 0) return 0;

    // Return the converted budget with IDR format
    return new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(budget);
};

export default convertBudgetToIDR;