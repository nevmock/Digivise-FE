import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Select from "react-select";
import Calendar from "react-calendar";
import toast from "react-hot-toast";
import * as echarts from "echarts";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";

import axiosRequest from "../../../utils/request";
import useDebounce from "../../../hooks/useDebounce";
import { updateCustomRoasProduct } from "../../../resolver/ads/index";
import convertBudgetToIDR from "../../../utils/convertBudgetIDR";
import converTypeAds from "../../../utils/convertTypeAds";
import formatRupiahFilter from "../../../utils/convertFormatRupiahFilter";
import convertFormatCTR from "../../../utils/convertFormatToCTR";
import formatMetricValue from "../../../utils/convertValueMetricFilter";
import Loading from "../../atoms/Loading/Loading";


const AdsTable = () => {
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
    const [flagCustomRoasDate, setFlagCustomRoasDate] = useState("minggu_ini");
    const [showCalendar, setShowCalendar] = useState(false);
    const [statusAdsFilter, setStatusAdsFilter] = useState("all");
    const [selectedClassificationOption, setSelectedClassificationOption] = useState([]);
    const [selectedOptionPlacement, setSelectedOptionPlacement] = useState(null);
    const [selectedTypeAds, setSelectedTypeAds] = useState([{ value: "all", label: "Semua Tipe" }]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedMetrics, setSelectedMetrics] = useState(["impression"]);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [paginatedData, setPaginatedData] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [metricsTotals, setMetricsTotals] = useState({});
    // Other
    const [showAlert, setShowAlert] = useState(false);
    const [animateCalendar, setAnimateCalendar] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isContentLoading, setIsContentLoading] = useState(false);



    // CUSTOM CHART WITH FILTER DATE, CLICK PRODUCT FEATURE
    // Define metrics with their display names and colors
    const metrics = {
        impression: {
            label: "Iklan Dilihat",
            color: "#D50000",
            dataKey: "impression",
            type: "currency"
        },
        click: {
            label: "Jumlah Klik",
            color: "#00B800",
            dataKey: "click",
            type: "currency"
        },
        ctr: {
            label: "Persentase Klik",
            color: "#DFC100",
            dataKey: "ctr",
            type: "percentage"
        }
    };

    const fetchData = async (fromDate, toDate) => {
        const isInitialLoad = !rawData.length;
        if (isInitialLoad) {
            setIsLoading(true);
        } else {
            setIsContentLoading(true);
        }

        const toLocalISOString = (date) => {
            return date.toISOString().split('.')[0];
        };

        try {
            const fromISO = fromDate instanceof Date
                ? toLocalISOString(fromDate)
                : toLocalISOString(new Date(fromDate));

            const toISO = toDate instanceof Date
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
        const start = startDate instanceof Date ? new Date(startDate) : new Date(startDate);
        const end = endDate instanceof Date ? new Date(endDate) : new Date(endDate);

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const dateArray = [];

        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) {
            return getHourlyIntervals(start.toISOString().split('T')[0]);
        }

        let currentDate = new Date(start);
        while (currentDate <= end) {
            dateArray.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dateArray;
    };



    // CALCULATE FILTER METRIC TOTALS FEATURE
    // Function to calculate totals for each metric based on raw data
    function calculateMetricTotals(products) {
        const totals = {};
        Object.keys(metrics).forEach(metricKey => {
            totals[metricKey] = 0;
            products.forEach(product => {
                const productData = product.data[0]; // Hanya mengambil data pertama
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

    // Function to generate chart data for multiple metrics
    function generateMultipleMetricsChartData(selectedDate = null, ads = null, selectedMetrics = ["impression"]) {
        let timeIntervals = [];
        let mode = "daily";
        let result = {};
        let isSingleDay = false;
        let fromDate, toDate;

        // Determine time intervals berdasarkan filter tanggal yang dipilih
        if (comparatorDate && comparedDate) {
            const sameDay = comparatorDate.toDateString() === comparedDate.toDateString();
            if (sameDay) {
                const dateStr = comparatorDate.toISOString().split('T')[0];
                timeIntervals = getHourlyIntervals(dateStr);
                mode = "hourly";
                isSingleDay = true;
                fromDate = comparatorDate;
                toDate = new Date(comparatorDate.getTime() + 24 * 60 * 60 * 1000);
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

        result.timeIntervals = timeIntervals;
        result.isSingleDay = isSingleDay;
        result.series = [];

        // Filter data berdasarkan produk yang dipilih
        let chartDataProducts = rawData;
        if (ads) {
            chartDataProducts = rawData.filter((product) => product.campaignId == ads.campaignId);
        }

        // Generate data series berdasarkan metrik yang dipilih
        selectedMetrics?.forEach(metricKey => {
            const metric = metrics[metricKey];
            if (!metric) return;

            const dataKey = metric.dataKey;
            let dataMap = {};

            // Inisialisasi dataMap dengan nilai 0 untuk setiap interval waktu
            timeIntervals.forEach((time) => {
                dataMap[time] = 0;
            });

            // Proses data untuk setiap ads produk
            chartDataProducts?.forEach((adsProduct) => {
                if (!adsProduct.data || adsProduct.data.length === 0) return;

                // Proses semua data tanpa membedakan single day atau range day
                if (isSingleDay) {
                    // Mode hourly - proses semua data untuk jam yang berbeda
                    adsProduct.data.forEach(productData => {
                        if (!productData || !productData.createdAt) return;

                        const createdAt = new Date(productData.createdAt);

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
                    // Mode daily - group data berdasarkan tanggal dan ambil data terbaru
                    const dataByDate = {};

                    adsProduct.data.forEach(productData => {
                        if (!productData || !productData.createdAt) return;

                        const createdAt = new Date(productData.createdAt);
                        const productYear = createdAt.getFullYear();
                        const productMonth = String(createdAt.getMonth() + 1).padStart(2, "0");
                        const productDay = String(createdAt.getDate()).padStart(2, "0");
                        const dateDayKey = `${productYear}-${productMonth}-${productDay}`;

                        // Ambil data terbaru untuk setiap tanggal
                        if (!dataByDate[dateDayKey] || new Date(dataByDate[dateDayKey].createdAt) < createdAt) {
                            dataByDate[dateDayKey] = productData;
                        }
                    });

                    // Proses data terbaru untuk setiap tanggal
                    Object.keys(dataByDate).forEach(dateDayKey => {
                        const productData = dataByDate[dateDayKey];

                        // Tambahkan nilai ke dataMap jika interval waktu sesuai
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
    }

    // Handle date selection options
    function handleDateSelection(selectedDateOption, type = "minggu_ini") {
        setComparatorDate(null);
        setComparedDate(null);
        setDate(selectedDateOption);

        let fromDate, toDate;
        if (type == "minggu_ini") {
            fromDate = new Date(selectedDateOption[0]);
            toDate = new Date(selectedDateOption[selectedDateOption.length - 1]);
            toDate.setHours(23, 59, 59, 999);
            setFlagCustomRoasDate(type);
        } else if (type == "bulan_ini") {
            const today = new Date();
            fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
            toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            toDate.setHours(23, 59, 59, 999);
            setFlagCustomRoasDate(type);
        } else {
            fromDate = new Date(selectedDateOption);
            toDate = new Date(selectedDateOption);
            toDate.setHours(23, 59, 59, 999);
            setFlagCustomRoasDate(type);
        }

        setShowCalendar(false);
        fetchData(fromDate, toDate);
    };

    // Handle comparison date confirmation
    function handleComparisonDatesConfirm() {
        if (comparatorDate && comparedDate) {
            setDate(null);
            setShowCalendar(false);
            setFlagCustomRoasDate("range");

            // Fetch data for the new date range
            fetchData(comparatorDate, comparedDate);
        }
    };

    // Handle adsProduct click
    const handleAdsProductClick = (adsProduct) => {
        if (selectedProduct?.campaignId === adsProduct.campaignId) {
            setSelectedProduct(null);
        } else {
            setSelectedProduct(adsProduct);
        }
    };

    // Function to format metric values for display
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

    // Update totals when raw data changes
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

            const hasData = series.some(s => s.data && s.data.some(value => value > 0));

            let leftGrid = 50;
            if (selectedMetrics.length > 1 || selectedMetrics.includes("cpc")) {
                leftGrid = 80;
            }

            let xAxisData = chartData?.timeIntervals || [];
            const isSingleDay = chartData?.isSingleDay || false;

            if (isSingleDay) {
                // Extract only the time portion (HH:00) for hourly view
                xAxisData = xAxisData.map(interval => {
                    if (!interval) return "";
                    if (interval.includes(" ")) {
                        return interval.split(" ")[1]; // Return only the time part
                    }
                    return interval;
                });
            } else {
                // For multi-day view, normalize date formats first
                xAxisData = xAxisData.map(date => {
                    if (!date) return "";
                    // If it contains a space (has time component), take only the date part
                    if (date.includes(" ")) {
                        return date.split(" ")[0];
                    }
                    return date;
                });

                // Format multi-day dates to show just month-day
                xAxisData = xAxisData.map(data => {
                    if (!data) return "";
                    const parts = data.split("-");
                    if (parts.length >= 3) {
                        return `${parts[1]}-${parts[2]}`;  // month-day format
                    }
                    return data;
                });
            }

            let rotateAxisLabel = 0;
            if (!isSingleDay) {
                if (xAxisData?.length > 7 && xAxisData?.length <= 20) {
                    rotateAxisLabel = 30;
                } else if (xAxisData?.length > 20) {
                    rotateAxisLabel = 40;
                } else if (xAxisData?.length > 30) {
                    rotateAxisLabel = 50;
                }
            }

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
                            result += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${param.color};"></span> ${param.seriesName}: ${param.value}<br/>`;
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
                        type: 'text',
                        left: 'center',
                        top: 'middle',
                        style: {
                            text: 'Tidak ada data untuk rentang waktu yang dipilih',
                            fontSize: 16,
                            fill: '#999',
                            fontWeight: 'bold'
                        }
                    }
                ];
            }

            chartInstance.setOption(option);
            return () => chartInstance.dispose();
        }
    }, [chartData, selectedMetrics]);


    // FILTER COLUMNS FEATURE
    // Define all columns
    const allColumns = [
        { key: "info_iklan", label: "Info iklan" },
        { key: "dailyBudget", label: "Modal" },
        { key: "analyze", label: "Analisis" },
        { key: "insight", label: "Insight" },
        { key: "detail", label: "Detail Iklan" }
    ];

    useEffect(() => {
        let filtered = rawData;
        // Filter by search term
        // Filter by status
        // Filter by classification options
        // Filter by placement (if a placement is selected and not "all")
        setCurrentPage(1);
        setFilteredData(filtered);
    }, [debouncedSearchTerm, rawData, statusAdsFilter, selectedTypeAds, selectedClassificationOption, selectedOptionPlacement]);

    // PAGINATION FEATURE
    const getVisiblePageNumbers = () => {
        const pages = [];
        // logic saya hide
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
        const visiblePages = getVisiblePageNumbers();
        const showFirstLastButtons = totalPages > 10;
        const getWidthWindow = window.innerWidth;

        return (
            <div className="custom-container-pagination mt-3">
                {/* logic saya hide */}
            </div>
        );
    };

    return (
        <>
            {
                isLoading ? (
                    <div className="d-flex justify-content-center align-items-start vh-100">
                        <Loading size={40} />
                    </div>
                ) : (
                    <div className="card">
                        <div className="card-body">
                            {/* Header & Date Filter */}
                            <div className="d-flex justify-content-between align-items-start pb-3">
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
                                        <div className={`card custom-calendar-behavior ${animateCalendar ? "show" : ""}`}>
                                            <div>
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
                                            <div style={{ width: "1px", height: "auto", backgroundColor: "#E3E3E3FF", margin: "10px 4px" }}></div>
                                            {/* Kalender pembanding */}
                                            <div>
                                                <p>Tanggal Pembanding</p>
                                                <Calendar onChange={(date) => setComparatorDate(date)} value={comparatorDate} maxDate={comparedDate || new Date(2100, 0, 1)} />
                                            </div>
                                            {/* Kalender dibanding */}
                                            <div>
                                                <p>Tanggal Dibanding</p>
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
                            {
                                isContentLoading ? (
                                    <div className="d-flex justify-content-center align-items-start vh-100">
                                        <Loading size={40} />
                                    </div>
                                ) : (
                                    <div className="d-flex flex-column gap-3">
                                        {/* Matric filter */}
                                        <div className="row g-3">
                                            {Object.keys(metrics).map((metricKey) => (
                                                <div
                                                    key={metricKey}
                                                >
                                                    <div
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
                                        {/* Filter & Table */}
                                        <div className="d-flex flex-column gap-2">
                                            {/* Status filter */}
                                            <span>Status Produk</span>
                                            <div className="d-flex gap-1 gap-md-2 flex-wrap">
                                            </div>
                                            {/* Other filter*/}
                                            <div className="d-flex flex-column mb-3 gap-2">
                                                {/* search bar */}
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Cari berdasarkan nama"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                            <table className="table table-centered">
                                                <thead className="table-dark">
                                                    <tr>
                                                        {filteredData.length !== 0 && filteredData !== null && <th scope="col">No</th>}
                                                        {allColumns
                                                            .filter((col) =>
                                                                selectedColumns.includes(col.key) &&
                                                                (col.key !== "custom_roas" ||
                                                                    (flagCustomRoasDate !== "minggu_ini" && flagCustomRoasDate !== "bulan_ini"))
                                                            )
                                                            .map((col) => (
                                                                <th key={col.key}>
                                                                    <div className="d-flex justify-content-start align-items-center">
                                                                        {col.label}
                                                                    </div>
                                                                </th>
                                                            ))
                                                        }
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {paginatedData.length !== 0 && paginatedData !== null ? (
                                                        paginatedData?.map((entry, index) => (
                                                            <>
                                                                <tr key={entry.campaignId}>
                                                                    {filteredData.length > 0 && filteredData !== null && (
                                                                        <td>{index + 1}</td>
                                                                    )}
                                                                    {selectedColumns.includes("info_iklan") && (
                                                                        <td
                                                                            className="d-flex gap-2"
                                                                            onClick={() => handleAdsProductClick(entry)}
                                                                        >
                                                                            <span className="custom-table-title-paragraph">{entry.data[0].title}</span>
                                                                        </td>
                                                                    )}
                                                                    {selectedColumns.includes("dailyBudget") && (
                                                                        <td style={{ width: "180px" }}>
                                                                            <div className="d-flex flex-column">
                                                                                <span>
                                                                                    {
                                                                                        entry.data[0].dailyBudget === undefined ? "-" : entry.data[0].dailyBudget === null ? "0" : `Rp ${convertBudgetToIDR(entry.data[0].dailyBudget, "default")}`
                                                                                    }
                                                                                </span>
                                                                                <span className="text-success" style={{ fontSize: "10px" }}>
                                                                                    +12.7%
                                                                                </span>
                                                                            </div>
                                                                        </td>
                                                                    )}
                                                                    {selectedColumns.includes("analyze") && (
                                                                        <td style={{ width: "260px" }}>
                                                                            <div className="d-flex flex-column">
                                                                                <span>
                                                                                    {entry.data[0].analyze === undefined ? "-" : entry.data[0].analyze === null ? "Tidak ada keterangan" : entry.data[0].analyze}
                                                                                </span>
                                                                                <span className="text-success" style={{ fontSize: "10px" }}>
                                                                                    +12.7%
                                                                                </span>
                                                                            </div>
                                                                        </td>
                                                                    )}
                                                                    {selectedColumns.includes("detail") && (
                                                                        <td style={{ width: "100px" }}>
                                                                            {
                                                                                <Link to={`/dashboard/performance/ads/detail/${entry.campaignId}`}>
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24"><path fill="currentColor" d="m16 8.4l-8.9 8.9q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7L14.6 7H7q-.425 0-.712-.288T6 6t.288-.712T7 5h10q.425 0 .713.288T18 6v10q0 .425-.288.713T17 17t-.712-.288T16 16z"></path></svg>
                                                                                </Link>
                                                                            }
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
                                )
                            }
                        </div>
                    </div>
                )
            }
        </>
    );
};

export default AdsTable;