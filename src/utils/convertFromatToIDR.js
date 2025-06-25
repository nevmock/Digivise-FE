const convertBudgetToIDR = (budget, param="default") => {
    const newBudget = Number(budget);
    if (isNaN(newBudget) || newBudget < 0) return "0";

    if (param === "default") {
        return new Intl.NumberFormat("id-ID", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(newBudget);
    } else {
        const trim = newBudget / 1000;
        return new Intl.NumberFormat("id-ID", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(trim);
    }
};

export default convertBudgetToIDR;