const converTypeAds = (type) => {
    switch (type) {
        case "product_manual":
            return "Iklan Produk Manual";
        case "shop_auto":
            return "Iklan Toko Otomatis";
        case "shop_manual":
            return "Iklan Toko Manual";
        case "product_gmv_max_roas":
            return "Iklan Produk GMV Max ROAS";
        case "product_gmv_max_auto":
            return "Iklan Produk GMV Max Auto";
        case "product_auto":
            return "Iklan Produk Otomatis";
        default:
            return "No Detected";
    }
};

export default converTypeAds;