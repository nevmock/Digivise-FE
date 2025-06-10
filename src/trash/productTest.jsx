import { useState, useEffect, useRef } from "react";
import Select from "react-select";
import Calendar from "react-calendar";
import * as echarts from "echarts";
import toast from "react-hot-toast";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";

import { useAuth } from "../../context/Auth";
import axiosRequest from "../../utils/request";
import useDebounce from "../../hooks/useDebounce";
import productJsonData from "../../api/products.json";
import BaseLayout from "../../components/organisms/BaseLayout";
import convertBudgetToIDR from "../../utils/convertBudgetIDR";
import converTypeAds from "../../utils/convertTypeAds";
import formatRupiahFilter from "../../utils/convertFormatRupiahFilter";
import convertFormatCTR from "../../utils/convertFormatToCTR";
import formatMetricValue from "../../utils/convertValueMetricFilter";
import formatValueRatio from "../../utils/convertFormatRatioValue";
import Loading from "../../components/atoms/Loading/Loading";


export default function PerformanceProductPage() {
    // Data
    const [rawData, setRawData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [chartData, setChartData] = useState([]);
    const chartRef = useRef(null);
    const userData = JSON.parse(localStorage.getItem("userDataApp"));
    const shopId = userData?.merchants[0]?.merchantShopeeId || "252234165";
    // Filter
    const [comparatorDate, setComparatorDate] = useState(null);
    const [comparedDate, setComparedDate] = useState(null);
    const [date, setDate] = useState(getAllDaysInLast7Days());
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedMetrics, setSelectedMetrics] = useState(["pv"]);
    const [metricsTotals, setMetricsTotals] = useState({});
    const [statusProductFilter, setStatusProductFilter] = useState("all");
    const [selectedClassificationOption, setSelectedClassificationOption] = useState([]);
    const [showTableColumn, setShowTableColumn] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [paginatedData, setPaginatedData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    // Other
    const [showAlert, setShowAlert] = useState(false);
    const [animateCalendar, setAnimateCalendar] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isContentLoading, setIsContentLoading] = useState(false);


    // Define metrics with their display names and colors
    const metrics = {
        pv: {
            label: "Pengunjung",
            color: "#0050C8",
            dataKey: "pv"
        },
        addToCartUnits: {
            label: "Add To Cart",
            color: "#D50000",
            dataKey: "addToCartUnits"
        },
        uv_to_add_to_cart_rate: {
            label: "Add To Cart (Percentage)",
            color: "#00B800",
            dataKey: "uv_to_add_to_cart_rate"
        },
        confirmedUnits: {
            label: "Siap Dikirim",
            color: "#DFC100",
            dataKey: "confirmedUnits"
        }
    };

    // Function to calculate totals for each metric based on raw data
    function calculateMetricTotals(products) {
        const totals = {};
        Object.keys(metrics).forEach(metricKey => {
            totals[metricKey] = 0;
            products.forEach(product => {
                const productData = product.data[0]; // Hanya mengambil data pertama/terbaru
                if (productData) {
                    const dataKey = metrics[metricKey].dataKey;
                    const value = productData[dataKey];
                    if (value !== undefined && value !== null) {
                        totals[metricKey] += Number(value);
                    }
                }
            });
        });
        return totals;
    };

    // Fetch data from API
    const fetchData = async (fromDate, toDate) => {
        const isInitialLoad = !rawData.length;
        if (isInitialLoad) {
            setIsLoading(true);
        } else {
            setIsContentLoading(true);
        }

        const toLocalISOString = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');

            return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        };

        try {
            const fromISO = fromDate instanceof Date
                ? toLocalISOString(fromDate)
                : toLocalISOString(new Date(fromDate));

            const toISO = toDate instanceof Date
                ? toLocalISOString(toDate)
                : toLocalISOString(new Date(toDate));

            const apiUrl = `/api/product-performance?shopId=${shopId}&from=${fromISO}&to=${toISO}&limit=100000`;
            // const apiUrl = `/api/product-ads/daily?shopId=${shopId}&from=2025-06-04T00:00:00.869&to=2025-06-04T23:59:59.99900&limit=10&biddingStrategy=manual`;
            const response = await axiosRequest.get(apiUrl);
            const data = await response.data;
            const content = data.content || [];
            setRawData(content);
            setFilteredData(content);
            setTotalPages(data.totalPages || 1);

            const totals = calculateMetricTotals(content);
            setMetricsTotals(totals);

            return content;
        } catch (error) {
            toast.error("Gagal mengambil data iklan produk");
            console.error('Gagal mengambil data iklan produk, kesalahan pada server:', error);
            return [];
        } finally {
            setIsLoading(false);
            setIsContentLoading(false);
        }
    };



    // CUSTOM CHART WITH FILTER DATE & CLICK PRODUCT FEATURE
    // Handle product click
    const handleProductClick = (product) => {
        if (selectedProduct?.productId === product.productId) {
            setSelectedProduct(null);
        } else {
            setSelectedProduct(product);
        }
    };

    // Date utility for getting all days in the last 7 days
    function getAllDaysInLast7Days() {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split("T")[0];
        }).reverse();
    };

    // Date utility for getting all days in the current month
    function getAllDaysInAMonth() {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const days = new Date(year, month, 0).getDate();
        return Array.from(
            { length: days },
            (_, i) => `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`
        );
    };

    // Date utility for getting all hourly intervals for a given date
    function getHourlyIntervals(selectedDate) {
        return Array.from({ length: 24 }, (_, i) => {
            const hour = String(i).padStart(2, "0");
            return `${selectedDate} ${hour}:00`;
        });
    };

    // Get all dates in a range of input manual dates
    function getDateRangeIntervals(startDate, endDate) {
        // Set start and end dates to the beginning and end of the day
        const start = startDate instanceof Date ? new Date(startDate) : new Date(startDate);
        const end = endDate instanceof Date ? new Date(endDate) : new Date(endDate);

        // Set start to the beginning of the day and end to the end of the day
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const dateArray = [];

        // Calculate the difference in days between start and end dates
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Helper function untuk get local date string
        const getLocalDateString = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // If the difference is less than or equal to 1 day, return hourly intervals
        if (diffDays <= 1) {
            return getHourlyIntervals(getLocalDateString(start));
        }

        // Otherwise, return daily intervals
        let currentDate = new Date(start);
        // Loop through each day from start to end
        while (currentDate <= end) {
            dateArray.push(getLocalDateString(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dateArray;
    };

    // Function to generate chart data for multiple metrics
    function generateMultipleMetricsChartData(selectedDate = null, product = null, selectedMetrics = ["pv"]) {
        let timeIntervals = [];
        let mode = "daily";
        let result = {};
        let isSingleDay = false;
        let fromDate, toDate;

        // Helper function untuk get date string tanpa timezone conversion
        const getLocalDateString = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // Determine time intervals berdasarkan filter tanggal yang dipilih
        if (comparatorDate && comparedDate) {
            const sameDay = comparatorDate.toDateString() === comparedDate.toDateString();
            if (sameDay) {
                const dateStr = getLocalDateString(comparatorDate);
                timeIntervals = getHourlyIntervals(dateStr);
                mode = "hourly";
                isSingleDay = true;
                fromDate = comparatorDate;
                toDate = new Date(comparatorDate);
                toDate.setHours(23, 59, 59, 999);
            } else {
                timeIntervals = getDateRangeIntervals(comparatorDate, comparedDate);
                mode = timeIntervals.length <= 24 ? "hourly" : "daily";
                fromDate = comparatorDate;
                toDate = comparedDate;
            }
        } else if (selectedDate === null || Array.isArray(selectedDate)) {
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
            timeIntervals = [new Date().toISOString().split('T')[0]];
            fromDate = new Date();
            toDate = new Date();
            toDate.setHours(23, 59, 59, 999);
        }

        // Add fields to result object
        result.timeIntervals = timeIntervals;
        result.isSingleDay = isSingleDay;
        result.series = [];

        // Filter data berdasarkan jika ada produk yang dipilih
        let chartDataProducts = rawData;
        if (product) {
            chartDataProducts = rawData.filter((p) => p.productId == product.productId);
        }

        // Generate data series berdasarkan metrik yang dipilih
        selectedMetrics?.forEach(metricKey => {
            const metric = metrics[metricKey];
            // Jika metrik tidak ditemukan, lewati iterasi, return kosongan
            if (!metric) return;

            const dataKey = metric.dataKey;
            let dataMap = {};

            // Inisialisasi dataMap dengan nilai 0 untuk setiap interval waktu
            timeIntervals.forEach((time) => {
                dataMap[time] = 0;
            });

            // Proses data untuk setiap produk
            chartDataProducts?.forEach((product) => {
                if (!product.data || product.data.length === 0) return;

                // Jika filter adalah satu hari (mode hourly)
                if (isSingleDay) {
                    product.data.forEach(productData => {
                        if (!productData || !productData.createdAt) return;
                        const createdAt = new Date(productData.createdAt);
                        const productDateStr = getLocalDateString(createdAt);
                        const filterDateStr = getLocalDateString(fromDate);

                        // Hanya proses data yang sesuai dengan tanggal filter
                        if (productDateStr !== filterDateStr) return;

                        // Extract jam saja (tanpa menit & detik) untuk membandingkan dengan timeIntervals
                        const hourKey = String(createdAt.getHours()).padStart(2, "0");
                        const productYear = createdAt.getFullYear();
                        const productMonth = String(createdAt.getMonth() + 1).padStart(2, "0");
                        const productDay = String(createdAt.getDate()).padStart(2, "0");

                        // Buat key untuk pemetaan (hanya jam, tanpa menit & detik)
                        const hourOnlyKey = `${productYear}-${productMonth}-${productDay} ${hourKey}:00`;

                        // Cek apakah jam tersebut ada dalam timeIntervals
                        if (timeIntervals.includes(hourOnlyKey)) {
                            const value = productData[dataKey];
                            if (value !== undefined && value !== null) {
                                // Simpan nilai di dataMap dengan key sesuai format timeIntervals
                                dataMap[hourOnlyKey] += Number(value);
                            }
                        }
                    });
                } else {
                    const dataByDate = {};

                    product.data.forEach(productData => {
                        if (!productData || !productData.createdAt) return;

                        const createdAt = new Date(productData.createdAt);
                        const productYear = createdAt.getFullYear();
                        const productMonth = String(createdAt.getMonth() + 1).padStart(2, "0");
                        const productDay = String(createdAt.getDate()).padStart(2, "0");
                        const dateDayKey = `${productYear}-${productMonth}-${productDay}`;

                        const productDateStr = getLocalDateString(createdAt);
                        const filterStartStr = Array.isArray(selectedDate) ? selectedDate[0] : getLocalDateString(fromDate);
                        const filterEndStr = Array.isArray(selectedDate) ? selectedDate[selectedDate.length - 1] : getLocalDateString(toDate);

                        if (productDateStr >= filterStartStr && productDateStr <= filterEndStr) {
                            if (!dataByDate[dateDayKey] || new Date(dataByDate[dateDayKey].createdAt) < createdAt) {
                                dataByDate[dateDayKey] = productData;
                            }
                        }
                    });

                    // Proses data terbaru untuk setiap tanggal
                    Object.keys(dataByDate).forEach(dateDayKey => {
                        const productData = dataByDate[dateDayKey];

                        // Cek apakah dateDayKey ada dalam timeIntervals
                        if (timeIntervals.includes(dateDayKey)) {
                            const value = productData[dataKey];
                            if (value !== undefined && value !== null) {
                                // Akumulasi nilai untuk tanggal yang sama dari semua produk
                                dataMap[dateDayKey] += Number(value);
                            }
                        }
                    });
                }
            });

            // Buat data series untuk chart
            const seriesData = {
                name: metric.label,
                data: timeIntervals.map((time) => dataMap[time] || 0),
                color: metric.color
            };

            result.series.push(seriesData);
        });

        return result;
    };

    // Handle date selection options
    function handleDateSelection(selectedDateOption, type = "minggu_ini") {
        setComparatorDate(null);
        setComparedDate(null);
        setDate(selectedDateOption);

        let fromDate, toDate;
        if (type == "minggu_ini") {
            fromDate = new Date(selectedDateOption[0] + 'T00:00:00');
            toDate = new Date(selectedDateOption[selectedDateOption.length - 1] + 'T23:59:59.999');
        } else if (type == "bulan_ini") {
            const today = new Date();
            fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
            toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            toDate.setHours(23, 59, 59, 999);
        } else {
            fromDate = new Date(selectedDateOption + 'T00:00:00');
            toDate = new Date(selectedDateOption + 'T23:59:59.999');
        }

        setShowCalendar(false);
        fetchData(fromDate, toDate);
    };

    // Handle comparison date confirmation
    function handleComparisonDatesConfirm() {
        if (comparatorDate && comparedDate) {
            setDate(null);
            setShowCalendar(false);

            // Fetch data for the new date range
            fetchData(comparatorDate, comparedDate);
        }
    };

    // Update totals when raw/main data changes
    useEffect(() => {
        if (rawData.length > 0) {
            const totals = calculateMetricTotals(rawData);
            setMetricsTotals(totals);
        }
    }, [rawData]);

    // Generate chart data when relevant state changes
    useEffect(() => {
        const chartData = generateMultipleMetricsChartData(date, selectedProduct, selectedMetrics);
        setChartData(chartData);
    }, [date, selectedProduct, selectedMetrics, rawData]);

    useEffect(() => {
        if (chartRef.current) {
            const chartInstance = echarts.init(chartRef.current);

            const series = chartData.series?.map(s => ({
                name: s.name,
                type: 'line',
                smooth: true,
                showSymbol: false,
                emphasis: { focus: 'series' },
                data: s.data,
                lineStyle: {
                    color: s.color
                },
                itemStyle: {
                    color: s.color
                }
            })) || [];

            const option = {
                toolbox: { feature: { saveAsImage: {} } },
                grid: {
                    left: leftGrid,
                    right: 50,
                    bottom: 50,
                    containLabel: false
                },
                tooltip: {
                    trigger: "axis",
                    formatter: function (params) {
                        let result = params[0].axisValue + '<br/>';
                        params.forEach(param => {
                            result += `<span style="background-color:${param.color};"></span> ${param.seriesName}: ${param.value}<br/>`;
                        });
                        return result;
                    }
                },
                legend: {
                    data: chartData.series?.map(s => s.name) || [],
                    bottom: 0
                },
                xAxis: {
                    name: isSingleDay ? "Time" : "Date",
                    type: "category",
                    data: xAxisData || [],
                    boundaryGap: false,
                    axisLabel: {
                        rotate: rotateAxisLabel,
                        interval: 0,
                    },
                },
                yAxis: {
                    name: selectedMetrics.length === 1 ? metrics[selectedMetrics[0]]?.label : "Total",
                    type: "value",
                    splitLine: { show: true },
                },
                series: series
            };

            if (!hasData && (comparatorDate && comparedDate)) {
                option.graphic = [
                    {
                        style: {
                            text: 'Tidak ada data untuk rentang waktu yang dipilih'
                        }
                    }
                ];
            }

            chartInstance.setOption(option);
            return () => chartInstance.dispose();
        }
    }, [chartData, selectedMetrics]);

    // Handle style for matric filter button
    const handleStyleMatricButton = (metricKey) => {
        const isActive = selectedMetrics.includes(metricKey);
        const metric = metrics[metricKey];

        return {
            backgroundColor: "#ffffff00",
            borderTop: `solid ${isActive ? `${metric.color} 3px` : "rgb(179.4, 184.2, 189) 1px"}`
        };
    };



    // Function to show alert filter metric
    function handleMetricFilter(metricKey) {
        setSelectedMetrics(prev => {
            if (prev.includes(metricKey)) {
                return prev.filter(m => m !== metricKey);
            }
            else if (prev.length < 4) {
                return [...prev, metricKey];
            }
            else {
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 2000);
                return prev;
            }
        });
    };


    // PAGINATION FEATURE
    const getVisiblePageNumbers = () => {
        // logicnya saya hide dulu
    };
    useEffect(() => {
        // logicnya saya hide dulu
    }, [filteredData, currentPage, itemsPerPage]);
    // Handle items per page change
    const handleItemsPerPageChange = (e) => {
        // logicnya saya hide dulu
    };
    // Handle page change
    const handlePageChange = (pageNumber) => {
        // logicnya saya hide dulu
    };
    // Render pagination component to render by visible pages
    const renderPagination = () => {
        // logicnya saya hide dulu
    };



    // FILTER DATA FOR TABLE FEATURE
    useEffect(() => {
        let filtered = rawData;
        // Filter by search term
        if (debouncedSearchTerm !== "") {
            filtered = filtered.filter((entry) =>
                entry.data[0].name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
            );
        }
        setCurrentPage(1);
        setFilteredData(filtered);
    }, [
        debouncedSearchTerm,
        rawData
    ]);



    // Handle toggle calendar visibility
    const toggleOpenCalendar = () => {
        if (showCalendar) {
            setAnimateCalendar(false);
            setTimeout(() => setShowCalendar(false), 100);
        } else {
            setShowCalendar(true);
            setTimeout(() => setAnimateCalendar(true), 100);
        }
    };


    // Initial data loading
    useEffect(() => {
        // Determine date range based on current selection
        let fromDate, toDate;

        if (comparatorDate && comparedDate) {
            fromDate = comparatorDate;
            toDate = comparedDate;
        } else if (Array.isArray(date)) {
            // Last 7 days
            fromDate = new Date(date[0]);
            toDate = new Date(date[date.length - 1]);
            toDate.setHours(23, 59, 59, 999);
        } else if (date === "Bulan Ini") {
            // Current month
            const today = new Date();
            fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
            toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            toDate.setHours(23, 59, 59, 999);
        } else if (date) {
            // Single day
            fromDate = new Date(date);
            toDate = new Date(date);
            toDate.setHours(23, 59, 59, 999);
        } else {
            // Default to last 7 days
            const today = new Date();
            fromDate = new Date();
            fromDate.setDate(today.getDate() - 7);
            toDate = today;
        }

        fetchData(fromDate, toDate);
    }, []);

    return (
        <>
            <BaseLayout>
                <div className="d-flex flex-column gap-1">
                    <div className="d-flex align-items-center">
                        <h3>Performa produk</h3>
                    </div>
                    {isLoading ? (
                        <div className="d-flex justify-content-center align-items-start vh-100">
                            <Loading size={40} />
                        </div>
                    ) : (
                        <div className="card">
                            <div className="card-body">
                                {/* Header & Date Filter */}
                                <div className="d-flex justify-content-between align-items-start pb-1">
                                    <h5>{rawData.length} total produk</h5>
                                    <div style={{ position: "relative" }}>
                                        <button
                                            onClick={toggleOpenCalendar}
                                            className="btn btn-primary"

                                        >
                                            {comparatorDate && comparedDate
                                                ? `${comparatorDate.toLocaleDateString("id-ID")} - ${comparedDate.toLocaleDateString("id-ID")}`
                                                : (typeof date === 'string' ? date : (Array.isArray(date) ? "1 Minggu terakhir" : "Pilih Tanggal"))}
                                        </button>
                                        {showCalendar && (
                                            <div
                                                className={`card custom-calendar-behavior ${animateCalendar ? "show" : ""}`}>
                                                <div
                                                    className="custom-content-calendar d-flex flex-column py-2 px-1"
                                                    style={{ width: "130px", listStyleType: "none" }}
                                                >
                                                    <p onClick={() => handleDateSelection(new Date().toISOString().split("T")[0], "hari_ini")}>Hari ini</p>
                                                    <p
                                                        onClick={() => {
                                                            const yesterday = new Date();
                                                            yesterday.setDate(yesterday.getDate() - 1);
                                                            handleDateSelection(yesterday.toISOString().split("T")[0], "kemarin");
                                                        }}
                                                    >
                                                        Kemarin
                                                    </p>
                                                    <p onClick={() => handleDateSelection(getAllDaysInLast7Days(), "minggu_ini")}>1 Minggu terakhir</p>
                                                    <p onClick={() => handleDateSelection("Bulan Ini", "bulan_ini")}>Bulan ini</p>
                                                </div>
                                                <div id="custom-calendar-behavior-barrier" style={{ width: "1px", height: "auto", backgroundColor: "#E3E3E3FF", margin: "10px 4px" }}></div>
                                                {/* Kalender pembanding */}
                                                <div>
                                                    <p className="pt-2" style={{ textAlign: "center" }}>Tanggal Pembanding</p>
                                                    <Calendar onChange={(date) => setComparatorDate(date)} value={comparatorDate} maxDate={comparedDate || new Date(2100, 0, 1)} />
                                                </div>
                                                {/* Kalender dibanding */}
                                                <div>
                                                    <p className="pt-2" style={{ textAlign: "center" }}>Tanggal Dibanding</p>
                                                    <Calendar onChange={(date) => setComparedDate(date)} value={comparedDate} minDate={comparatorDate || new Date()} />
                                                </div>
                                                {/* Confirm button for date range */}
                                                <div id="custom-calendar-behavior-button" className="d-flex align-items-end mb-1">
                                                    <button
                                                        className="btn btn-primary"
                                                        onClick={handleComparisonDatesConfirm}
                                                        disabled={!comparatorDate || !comparedDate}
                                                    >
                                                        Terapkan
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {isContentLoading ? (
                                    <div className="d-flex justify-content-center align-items-start vh-100">
                                        <Loading size={40} />
                                    </div>
                                ) : (
                                    <div className="d-flex flex-column gap-3">
                                        {/* Matric filter */}
                                        <div className="row g-3">
                                            {Object.keys(metrics).map((metricKey) => (
                                                <div
                                                    className="col-12 col-sm-6 col-lg-3"
                                                    key={metricKey}
                                                >
                                                    <div
                                                        className="card shadow-md px-2 py-1 h-100"
                                                        style={handleStyleMatricButton(metricKey)}
                                                        onClick={() => handleMetricFilter(metricKey)}
                                                    >
                                                        <strong style={{ color: "#5d7186" }}>
                                                            {metrics[metricKey].label}
                                                        </strong>
                                                        <span className="card-text fs-4 fw-bold">
                                                            {
                                                                metrics[metricKey].type === "currency"
                                                                    ? <span>{formatRupiahFilter(metricsTotals[metricKey])}</span>
                                                                    : metrics[metricKey].type === "percentage"
                                                                        ? <span>{Number(metricsTotals[metricKey]).toFixed(2)}%</span>
                                                                        : <span>{Number(metricsTotals[metricKey]).toFixed(2)}</span>
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Chart */}
                                        <div ref={chartRef} style={{ width: "100%", height: "300px" }}></div>
                                        {/* Filters & Table */}
                                        <div className="d-flex flex-column gap-2">
                                            {/* Other filter */}
                                            <div className="d-flex flex-column mb-3 gap-2">
                                                {/* search bar */}
                                                <div className="custom-filter-search">
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Cari berdasarkan nama"
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            {/* Table container */}
                                            <table className="table table-centered">
                                                <thead className="table-dark">
                                                    <tr>
                                                        {filteredData.length > 0 && filteredData !== null && <th scope="col">No</th>}
                                                        {allColumns
                                                            .filter((col) => selectedColumns.includes(col.key))
                                                            .map((col) => (
                                                                <th key={col.key}>
                                                                    <div className="d-flex justify-content-start gap-1 align-items-center">
                                                                        {col.label}
                                                                    </div>
                                                                </th>
                                                            ))
                                                        }
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {paginatedData.length > 0 && paginatedData !== null ? (
                                                        paginatedData?.map((entry, index) => (
                                                            <>
                                                                <tr key={entry.productId}>
                                                                    {filteredData.length > 0 && filteredData !== null && (
                                                                        <td>{index + 1}</td>
                                                                    )}
                                                                    {selectedColumns.includes("name") && (
                                                                        <td style={{
                                                                            maxWidth: "400px",
                                                                            cursor: "pointer",
                                                                            color: selectedProduct?.productId === entry.productId
                                                                                ? "#F6881F"
                                                                                : "",
                                                                        }} onClick={() => handleProductClick(entry)}>
                                                                            <div className="d-flex flex-column">
                                                                                <span>{entry.data[0].name}</span>
                                                                            </div>
                                                                        </td>
                                                                    )}
                                                                    {selectedColumns.includes("pv") && (
                                                                        <td>
                                                                            <div className="d-flex flex-column">
                                                                                <span>{entry.data[0].pv}</span>
                                                                            </div>
                                                                        </td>
                                                                    )}
                                                                    {selectedColumns.includes("addToCartUnits") && (
                                                                        <td>
                                                                            <div className="d-flex flex-column">
                                                                                <span>{entry.data[0].addToCartUnits}</span>
                                                                            </div>
                                                                        </td>
                                                                    )}
                                                                </tr>
                                                            </>
                                                        ))
                                                    ) : (
                                                        <div className="w-100 d-flex justify-content-center">
                                                            <span>Data tidak tersedia</span>
                                                        </div>
                                                    )}
                                                </tbody>
                                            </table>
                                            {/* Pagination */}
                                            {filteredData.length > 0 && filteredData !== null && renderPagination()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                    }
                </div>
            </BaseLayout>
        </>
    );
};