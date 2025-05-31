const convertBudgetToIDR = (budget) => {
    const newBudget = Number(budget);
    if (isNaN(newBudget) || newBudget <= 0) return "0";

    return new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(newBudget);
};

export default convertBudgetToIDR;