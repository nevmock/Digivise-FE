import { useState, useEffect, useCallback, useRef } from "react";
import * as echarts from "echarts";
import Calendar from "react-calendar";
import Select from "react-select";

import stockJsonData from "../../api/stock.json";
import useDebounce from "../../hooks/useDebounce";
import BaseLayout from "../../components/organisms/BaseLayout";
import iconArrowUp from "../../assets/icon/arrow-up.png";
import iconArrowDown from "../../assets/icon/arrow-down.png";
import { data } from "react-router-dom";

export default function PerformanceStockPage() {
    // Data
    const [rawData, setRawData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [chartData, setChartData] = useState([]);
    const chartRef = useRef(null);
    const userData = JSON.parse(localStorage.getItem("userDataApp"));
    const shopId = userData?.merchants[0]?.merchantShopeeId || "252234165";
    const [variantsChartData, setVariantsChartData] = useState([]);
    // Filter
    const [date, setDate] = useState(getAllDaysInLast7Days());
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [statusProductStockFilter, setStatusProductStockFilter] =
        useState("all");
    const [classificationFilter, setClassificationFilter] = useState([]);
    const [selectedClassificationOption, setSelectedClassificationOption] =
        useState([]);
    const [expandedVariantProduct, setExpandedVariantProduct] = useState({});
    const [sortOrderData, setSortOrderData] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [paginatedData, setPaginatedData] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    // Other
    const [showCalender, setShowCalender] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isContentLoading, setIsContentLoading] = useState(false);

    const fetchData = async (fromDate, toDate) => {
        const isInitialLoad = !rawData.length;
        if (isInitialLoad) {
            setIsLoading(true);
        } else {
            setIsContentLoading(true);
        }

        const toLocalISOString = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            const hours = String(date.getHours()).padStart(2, "0");
            const minutes = String(date.getMinutes()).padStart(2, "0");
            const seconds = String(date.getSeconds()).padStart(2, "0");

            return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        };

        try {
            const fromISO =
                fromDate instanceof Date
                    ? toLocalISOString(fromDate)
                    : toLocalISOString(new Date(fromDate));

            const toISO =
                toDate instanceof Date
                    ? toLocalISOString(toDate)
                    : toLocalISOString(new Date(toDate));

            const apiUrl = `/api/product-ads/daily?shopId=${shopId}&from=${fromISO}&to=${toISO}&limit=10000`;
            // const apiUrl = `/api/product-ads/daily?shopId=${shopId}&from=2025-06-04T00:00:00.869&to=2025-06-04T23:59:59.99900&limit=10&biddingStrategy=manual`;
            const response = await axiosRequest.get(apiUrl);
            const data = await response.data;
            const content = data.content || [];
            setRawData(content);
            setFilteredData(content);
            setTotalPages(data.totalPages || 1);

            return content;
        } catch (error) {
            toast.error("Gagal mengambil data stock produk");
            console.error(
                "Gagal mengambil data stock produk, kesalahan pada server:",
                error
            );
            return [];
        } finally {
            setIsLoading(false);
            setIsContentLoading(false);
        }
    };

    // CUSTOM CHART & PRODUCT CLICK FEATURE
    // Handle product click by clicking the product in name column
    const handleProductClick = (product) => {
        setSelectedProduct((prev) => (prev?.id === product.id ? null : product));
    };

    // Convert start_time to date format with epoch method
    const convertEpochToDate = (epoch, mode = "daily") => {
        const date = new Date(epoch * 1000);
        date.setMinutes(0, 0, 0);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        return mode === "hourly"
            ? `${year}-${month}-${day} ${hours}:${minutes}`
            : `${year}-${month}-${day}`;
    };

    // Date utility for getting all days in the last 7 days
    function getAllDaysInLast7Days() {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split("T")[0];
        }).reverse();
    }

    // Date utility for getting all days in the current month
    function getAllDaysInAMonth() {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const days = new Date(year, month, 0).getDate();
        return Array.from(
            { length: days },
            (_, i) =>
                `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(
                    2,
                    "0"
                )}`
        );
    }

    // Date utility for getting all hourly intervals for a given date
    function getHourlyIntervals(selectedDate) {
        return Array.from({ length: 24 }, (_, i) => {
            const hour = String(i).padStart(2, "0");
            return `${selectedDate} ${hour}:00`;
        });
    }

    function generateChartData(selectedDate = null, product = null) {
        let timeIntervals = [];
        let mode = "daily";
        let fromDate, toDate;
        let isSingleDay = false;

        // Helper function untuk get date string tanpa timezone conversion
        const getLocalDateString = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        };

        if (selectedDate === null || Array.isArray(selectedDate)) {
            timeIntervals = getAllDaysInLast7Days();
            fromDate = new Date(timeIntervals[0]);
            toDate = new Date();
            toDate.setHours(23, 59, 59, 999);
        } else if (selectedDate === "Bulan Ini") {
            timeIntervals = getAllDaysInAMonth();
            const today = new Date();
            fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
            toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            toDate.setHours(23, 59, 59, 999);
        } else {
            timeIntervals = getHourlyIntervals(selectedDate);
            mode = "hourly";
            isSingleDay = true;
            fromDate = new Date(selectedDate);
            toDate = new Date(selectedDate);
            toDate.setHours(23, 59, 59, 999);
        }

        if (!timeIntervals || timeIntervals.length === 0) {
            timeIntervals = [new Date().toISOString().split("T")[0]];
            fromDate = new Date();
            toDate = new Date();
            toDate.setHours(23, 59, 59, 999);
        }

        result.timeIntervals = timeIntervals;
        result.isSingleDay = isSingleDay;
        result.series = [];

        let charDataProduct = rawData || [];
        if (product) {
            charDataProduct = rawData.filter((p) => p.id === product.id);
        }

        let dataMap = {};

        // Initialize dataMap with time intervals
        timeIntervals.forEach((time) => {
            dataMap[time] = 0;
        });

        const dataKey = "stock";

        charDataProduct?.forEach((product) => {
            if (!product.data || product.data.length === 0) return;

            if (isSingleDay) {
                product.data.forEach((productData) => {
                    if (!productData || !productData.createdAt) return;

                    const createdAt = new Date(productData.createdAt);
                    const productDateStr = getLocalDateString(createdAt);
                    const filterDateStr = getLocalDateString(fromDate);

                    if (productDateStr !== filterDateStr) return;

                    // Extract jam saja (tanpa menit & detik) untuk membandingkan dengan timeIntervals
                    const hourKey = String(createdAt.getHours()).padStart(2, "0");
                    const productYear = createdAt.getFullYear();
                    const productMonth = String(createdAt.getMonth() + 1).padStart(
                        2,
                        "0"
                    );
                    const productDay = String(createdAt.getDate()).padStart(2, "0");

                    // Buat key untuk pemetaan (hanya jam, tanpa menit & detik)
                    const hourOnlyKey = `${productYear}-${productMonth}-${productDay} ${hourKey}:00`;

                    if (timeIntervals.includes(hourOnlyKey)) {
                        const value = productData[dataKey];
                        if (value !== undefined && value !== null) {
                            dataMap[hourOnlyKey] += Number(value);
                        }
                    }
                });
            } else {
                const dataByDate = {};
                product.data.forEach((productData) => {
                    if (!productData || !productData.createdAt) return;

                    const createdAt = new Date(productData.createdAt);
                    const productYear = createdAt.getFullYear();
                    const productMonth = String(createdAt.getMonth() + 1).padStart(
                        2,
                        "0"
                    );
                    const productDay = String(createdAt.getDate()).padStart(2, "0");
                    const dateDayKey = `${productYear}-${productMonth}-${productDay}`;

                    const productDateStr = getLocalDateString(createdAt);
                    const filterStartStr = Array.isArray(selectedDate)
                        ? selectedDate[0]
                        : getLocalDateString(fromDate);
                    const filterEndStr = Array.isArray(selectedDate)
                        ? selectedDate[selectedDate.length - 1]
                        : getLocalDateString(toDate);

                    if (
                        productDateStr >= filterStartStr &&
                        productDateStr <= filterEndStr
                    ) {
                        if (
                            !dataByDate[dateDayKey] ||
                            new Date(dataByDate[dateDayKey].createdAt) < createdAt
                        ) {
                            dataByDate[dateDayKey] = productData;
                        }
                    }
                });

                Object.keys(dataByDate).forEach((dateDayKey) => {
                    const productData = dataByDate[dateDayKey];

                    if (timeIntervals.includes(dateDayKey)) {
                        const value = productData[dataKey];
                        if (value !== undefined && value !== null) {
                            dataMap[dateDayKey] += Number(value);
                        }
                    }
                });
            }
        });

        const seriesData = {
            name: "Stock",
            data: timeIntervals.map((time) => dataMap[time] || 0),
        };

        result.series.push(seriesData);

        return result;
    }

    // Generate chart data for variants
    function generateVariantsChartData(selectedDate = null, product = null) {
        if (!product) return [];

        setIsLoading(true);
        let timeIntervals = [];
        let mode = "daily";
        let variantsData = [];

        if (selectedDate === null || Array.isArray(selectedDate)) {
            timeIntervals = getAllDaysInLast7Days();
        } else if (selectedDate === "Bulan Ini") {
            timeIntervals = getAllDaysInAMonth();
        } else {
            timeIntervals = getHourlyIntervals(selectedDate);
            mode = "hourly";
        }

        // Find the selected product
        const selectedProductData = stockJsonData.data.products.find(
            (p) => p.id === product.id
        );

        if (selectedProductData && selectedProductData.model_list) {
            // Create chart data for each variant
            selectedProductData.model_list.forEach((variant) => {
                let variantStockMap = {};

                timeIntervals.forEach((time) => {
                    variantStockMap[time] = 0;
                });

                const productDateTime = convertEpochToDate(
                    selectedProductData.campaign.start_time,
                    mode
                );
                if (variantStockMap[productDateTime] !== undefined) {
                    variantStockMap[productDateTime] =
                        variant.stock_detail?.total_available_stock || 0;
                }

                const variantData = {
                    name: variant.name,
                    id: variant.id,
                    data: timeIntervals.map((time) => ({
                        date: time,
                        totalStock: variantStockMap[time],
                    })),
                };

                variantsData.push(variantData);
            });
        }

        setIsLoading(false);
        return variantsData;
    }

    useEffect(() => {
        setChartData(generateChartData(date, selectedProduct));
        if (selectedProduct) {
            setVariantsChartData(generateVariantsChartData(date, selectedProduct));
        } else {
            setVariantsChartData([]);
        }
    }, [date, selectedProduct]);

    useEffect(() => {
        let xAxisData = chartData?.map((item) => item.date);
        let rotateAaxisLabel = 0;
        const includesColon = xAxisData?.some((item) => item.includes(":"));
        if (includesColon) {
            xAxisData = xAxisData?.map((item) => item.split(" ")[1]);
        } else {
            xAxisData = xAxisData?.map((item) => item.split("-").slice(1).join("-"));
        }

        if (xAxisData?.length > 7 && !includesColon) {
            rotateAaxisLabel = 45;
        }

        const chartInstance = echarts.init(chartRef.current);

        const series = [
            {
                name: selectedProduct ? selectedProduct.name : "Total Stock",
                type: "line",
                smooth: true,
                showSymbol: false,
                data: chartData.map((item) => item.totalStock),
                lineStyle: {
                    color: "#5470C6",
                },
            },
        ];

        // Add variant series if we have a selected product
        if (selectedProduct && variantsChartData.length > 0) {
            variantsChartData.forEach((variant) => {
                series.push({
                    name: variant.name,
                    type: "line",
                    smooth: true,
                    showSymbol: false,
                    data: variant.data.map((item) => item.totalStock),
                    lineStyle: {
                        color: "#B2B6BE",
                    },
                });
            });
        }

        chartInstance.setOption({
            toolbox: { feature: { saveAsImage: {} } },
            grid: { left: 50, right: 50, bottom: 50, containLabel: false },
            tooltip: {
                trigger: "axis",
                formatter: function (params) {
                    let result = params[0].axisValue + "<br/>";

                    params.forEach((param) => {
                        result += param.seriesName + ": " + param.value + " Stok<br/>";
                    });

                    return result;
                },
            },
            xAxis: {
                type: "category",
                data: xAxisData,
                boundaryGap: false,
                axisLabel: {
                    interval: 0,
                    rotate: rotateAaxisLabel,
                },
            },
            yAxis: {
                type: "value",
                splitLine: { show: true },
            },
            series: series,
        });

        return () => chartInstance.dispose();
    }, [chartData, variantsChartData, selectedProduct]);

    // FILTER COLUMNS FEATURE
    // Define all columns
    const allColumns = [
        { key: "name", label: "Nama" },
        { key: "code", label: "Kode" },
        { key: "stock", label: "Stok" },
        { key: "availability", label: "Availability" },
        { key: "status", label: "Status" },
        { key: "classification", label: "Sales Clasification" },
    ];

    // Initialize selected columns state
    const [selectedColumns, setSelectedColumns] = useState(
        allColumns.map((col) => col.key)
    );

    // Toggle row to show variant
    const toggleRow = useCallback((productId) => {
        setExpandedVariantProduct((prev) => ({
            ...prev,
            [productId]: !prev[productId],
        }));
    }, []);

    useEffect(() => {
        let filtered = rawData;

        // Filter by search term
        if (debouncedSearchTerm !== "") {
            filtered = filtered.filter((entry) =>
                entry.data[0].title
                    .toLowerCase()
                    .includes(debouncedSearchTerm.toLowerCase())
            );
        }

        // Filter by status
        if (statusProductStockFilter !== "all") {
            filtered = filtered.filter(
                (entry) => entry.data[0].state === statusProductStockFilter
            );
        }

        // Filter by classification options
        if (selectedClassificationOption.length > 0) {
            const classificationValues = selectedClassificationOption.map(
                (option) => option.value
            );
            filtered = filtered.filter((entry) => {
                const entryClassification = entry.data[0].classification;
                return classificationValues.includes(entryClassification);
            });
        }

        setCurrentPage(1);
        setFilteredData(filtered);
    }, [
        debouncedSearchTerm,
        statusProductStockFilter,
        classificationFilter,
        rawData,
    ]);

    // SORTING STOCK FEATURE
    // Handle sort stock by asc or desc
    const handleSortStock = (order) => {
        if (sortOrderData === order) {
            setSortOrderData(null);
            setFilteredData(data.products);
        } else {
            setSortOrderData(order);
            const sortedData = [...filteredData].sort((a, b) => {
                return order === "asc"
                    ? a.stock_detail.total_available_stock -
                    b.stock_detail.total_available_stock
                    : b.stock_detail.total_available_stock -
                    a.stock_detail.total_available_stock;
            });
            setFilteredData(sortedData);
        }
    };

    // PAGINATION FEATURE
    const getVisiblePageNumbers = () => {
    };

    useEffect(() => {
        const calculateTotalPages = Math.ceil(filteredData.length / itemsPerPage);
        setTotalPages(calculateTotalPages || 1);

        if (currentPage > calculateTotalPages && calculateTotalPages > 0) {
        setCurrentPage(calculateTotalPages);
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setPaginatedData(filteredData.slice(startIndex, endIndex));
    }, [filteredData, currentPage, itemsPerPage]);

    // Handle items per page change
    const handleItemsPerPageChange = (e) => {
    };

    // Handle page change
    const handlePageChange = (pageNumber) => {
    };

    // Render pagination component to render by visible pages
    const renderPagination = () => {
    };

    return (
        <>
            <BaseLayout>
                <div className="d-flex flex-column gap-1">
                    <div className="d-flex align-items-center">
                        <h3>Peforma stock</h3>
                    </div>
                    <div className="card">
                        <div className="card-body">
                            {/* Header & Date Filter */}
                            <div className="d-flex justify-content-between align-items-start pb-1">
                                <h5>{stockJsonData.data.page_info.total} total produk</h5>
                                <div style={{ position: "relative" }}>
                                    <button
                                        onClick={() => setShowCalender(!showCalender)}
                                        className="btn btn-secondary"
                                        style={{ backgroundColor: "#8042D4", border: "none" }}
                                    >
                                        {date === null
                                            ? "Pilih tanggal"
                                            : Array.isArray(date)
                                                ? "1 Minggu terakhir"
                                                : date}
                                    </button>
                                    {showCalender && (
                                        <div className="d-flex">
                                            <div className="d-flex flex-column py-2 px-1">
                                                <p
                                                    onClick={() =>
                                                        setDate(new Date().toISOString().split("T")[0])
                                                    }
                                                >
                                                    Hari ini
                                                </p>
                                                <p
                                                    onClick={() => {
                                                        const yesterday = new Date();
                                                        yesterday.setDate(yesterday.getDate() - 1);
                                                        setDate(yesterday.toISOString().split("T")[0]);
                                                    }}
                                                >
                                                    Kemarin
                                                </p>
                                                <p
                                                    onClick={() => setDate(getAllDaysInLast7Days())}
                                                >
                                                    1 Minggu terakhir
                                                </p>
                                                <p
                                                    onClick={() => setDate("Bulan Ini")}
                                                >
                                                    Bulan ini
                                                </p>
                                            </div>
                                            <Calendar
                                                onChange={(selectedDate) => {
                                                    if (selectedDate instanceof Date) {
                                                        setDate(selectedDate.toISOString().split("T")[0]);
                                                    }
                                                    setShowCalender(false);
                                                }}
                                                value={date === "Bulan Ini" ? new Date() : date}
                                                maxDate={new Date()}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Chart */}
                            <div
                                ref={chartRef}
                                style={{ width: "100%", height: "300px" }}
                                className="mb-2"
                            ></div>
                            {/* Filter & Table */}
                            <div className="d-flex flex-column gap-3 gap-md-2">
                                {/* Status filter */}
                                <div
                                    className="d-flex align-items-center gap-1 gap-md-2 flex-wrap"
                                    style={{ width: "fit-content", listStyleType: "none" }}
                                >
                                    <span>Status Produk</span>
                                    <div className="d-flex gap-1 gap-md-2 flex-wrap">
                                        <div
                                            className={`status-button-filter rounded-pill d-flex align-items-center  ${statusProductStockFilter === "all"
                                                ? "custom-font-color custom-border-select fw-bold"
                                                : "border border-secondary-subtle"
                                                }`}
                                            onClick={() => setStatusProductStockFilter("all")}
                                            style={{
                                                cursor: "pointer",
                                                fontSize: "12px",
                                                padding: "6px 12px",
                                            }}
                                        >
                                            Semua
                                        </div>
                                        {/* dan filter lainnya saya hilangkan dulu dibawah */}
                                    </div>
                                </div>
                                {/* Other filter*/}
                                <div className="custom-filter-search">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Cari berdasarkan nama"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                {/* Container table */}
                                <table className="table table-centered">
                                    {/* Head table */}
                                    <thead className="table-light">
                                        <tr>
                                            {filteredData.length > 0 && <th scope="col"></th>}
                                            {allColumns
                                                .filter((col) => selectedColumns.includes(col.key))
                                                .map((col) => (
                                                    <th key={col.key}>
                                                        <div className="d-flex justify-content-start gap-1 align-items-center">
                                                            {col.label}
                                                            {col.key === "stock" && (
                                                                <div className="d-flex flex-column">
                                                                    <img
                                                                        src={iconArrowUp}
                                                                        alt="Sort Asc"
                                                                        style={{
                                                                            width: "10px",
                                                                            height: "10px",
                                                                            cursor: "pointer",
                                                                            opacity:
                                                                                sortOrderData === "asc" ? 1 : 0.5,
                                                                        }}
                                                                        onClick={() => handleSortStock("asc")}
                                                                    />
                                                                    <img
                                                                        src={iconArrowDown}
                                                                        alt="Sort Desc"
                                                                        style={{
                                                                            width: "10px",
                                                                            height: "10px",
                                                                            cursor: "pointer",
                                                                            opacity:
                                                                                sortOrderData === "desc" ? 1 : 0.5,
                                                                        }}
                                                                        onClick={() => handleSortStock("desc")}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </th>
                                                ))}
                                        </tr>
                                    </thead>
                                    {/* Body Table */}
                                    <tbody>
                                        {paginatedData.length !== 0 && paginatedData !== null ? (
                                            paginatedData?.map((entry, index) => (
                                                <>
                                                    <tr key={entry.id}>
                                                        {filteredData.length > 0 && (
                                                            <td
                                                                onClick={() => toggleRow(entry.id)}
                                                                style={{ cursor: "pointer" }}
                                                            >
                                                                {expandedVariantProduct[entry.id] ? (
                                                                    <img
                                                                        src={iconArrowUp}
                                                                        alt="icon arrow up"
                                                                        style={{ width: "8px", height: "8px" }}
                                                                    />
                                                                ) : (
                                                                    <img
                                                                        src={iconArrowDown}
                                                                        alt="icon arrow down"
                                                                        style={{ width: "8px", height: "8px" }}
                                                                    />
                                                                )}
                                                            </td>
                                                        )}
                                                        {selectedColumns.includes("name") && (
                                                            <td
                                                                style={{
                                                                    cursor: "pointer",
                                                                    color:
                                                                        selectedProduct?.id === entry.id
                                                                            ? "#F6881F"
                                                                            : "",
                                                                }}
                                                                onClick={() => handleProductClick(entry)}
                                                            >
                                                                {entry.name}
                                                            </td>
                                                        )}
                                                        {selectedColumns.includes("code") && (
                                                            <td>{entry.id || "-"}</td>
                                                        )}
                                                        {selectedColumns.includes("stock") && (
                                                            <td>
                                                                <div className="d-flex flex-column align-items-center">
                                                                    {entry.stock_detail}
                                                                </div>
                                                            </td>
                                                        )}
                                                        {selectedColumns.includes("availability") && (
                                                            <td>test</td>
                                                        )}
                                                        {selectedColumns.includes("classification") && (
                                                            <td>
                                                                <div className="d-flex gap-1 align-items-center">
                                                                    <span>test</span>
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                    {expandedVariantProduct[entry.id] && (
                                                        <tr className="bg-light">
                                                            <td
                                                                colSpan={selectedColumns.length + 1}
                                                                style={{
                                                                    padding: "2px 4px",
                                                                    border: "none",
                                                                }}
                                                            >
                                                                <ul className="list-group">
                                                                    {entry.model_list.map((variant, index) => (
                                                                        <li
                                                                            key={variant.id}
                                                                            className="list-group-item d-flex justify-content-start gap-2"
                                                                        >
                                                                            <span style={{ width: "4px" }}></span>
                                                                            <span style={{ width: "100px" }}>
                                                                                {variant.name}
                                                                            </span>
                                                                            <span>
                                                                                {" "}
                                                                                {
                                                                                    variant.stock_detail
                                                                                        .total_available_stock
                                                                                }{" "}
                                                                                Stok
                                                                            </span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            ))
                                        ) : (
                                            <div
                                                className="w-100 d-flex justify-content-center"
                                                style={{ width: "max-content" }}
                                            >
                                                <span>Data tidak tersedia</span>
                                            </div>
                                        )}
                                    </tbody>
                                </table>
                                {/* Pagination */}
                                {filteredData.length > 0 &&
                                    filteredData !== null &&
                                    renderPagination()}
                            </div>
                        </div>
                    </div>
                </div>
            </BaseLayout>
        </>
    );
}