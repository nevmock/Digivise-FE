const formatStyleSalesClassification = (classification) => {
    if (classification === "Best Seller") {
        return { backgroundColor: "#009127FF", color: "#FFFFFF", label: "Best Seller" };
    } else if (classification === "Middle Moving") {
        return { backgroundColor: "#AF8000FF", color: "#FFFFFF", label: "Middle Moving" };
    } else if (classification === "Slow Moving") {
        return { backgroundColor: "#960000FF", color: "#FFFFFF", label: "Slow Moving" };
    } else {
        return { backgroundColor: "#E3E3E3", color: "#000000", label: "Unknown" };
    }
};

export default formatStyleSalesClassification;