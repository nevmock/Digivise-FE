// import { useState, useEffect, useRef } from "react";
// import { Link } from "react-router-dom";
// import Select from "react-select";
// import Calendar from "react-calendar";
// import toast from "react-hot-toast";
// import * as echarts from "echarts";
// import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";

// import axiosRequest from "../../../utils/request";
// import useDebounce from "../../../hooks/useDebounce";
// import { updateCustomRoasProduct } from "../../../resolver/ads/index";
// import convertBudgetToIDR from "../../../utils/convertBudgetIDR";
// import converTypeAds from "../../../utils/convertTypeAds";
// import formatRupiahFilter from "../../../utils/convertFormatRupiahFilter";
// import convertFormatCTR from "../../../utils/convertFormatToCTR";
// import formatMetricValue from "../../../utils/convertValueMetricFilter";
// import formatValueRatio from "../../../utils/convertFormatRatioValue";
// import Loading from "../../atoms/Loading/Loading";


// const AdsTable = () => {
//     // Data
//     const [rawData, setRawData] = useState([]);
//     const [chartRawData, setChartRawData] = useState([]);
//     const [filteredData, setFilteredData] = useState([]);
//     const [chartData, setChartData] = useState([]);
//     const chartRef = useRef(null);
//     const userData = JSON.parse(localStorage.getItem("userDataApp"));
//     const shopId = userData?.merchants[0]?.merchantShopeeId || "252234165";
//     // Filter
//     const [comparatorDate, setComparatorDate] = useState(null);
//     const [comparedDate, setComparedDate] = useState(null);
//     const [date, setDate] = useState(getAllDaysInLast7Days());
//     const [flagCustomRoasDate, setFlagCustomRoasDate] = useState("minggu_ini");
//     const [showCalendar, setShowCalendar] = useState(false);
//     const [selectedProduct, setSelectedProduct] = useState(null);
//     const [selectedMetrics, setSelectedMetrics] = useState(["impression"]);
//     const [metricsTotals, setMetricsTotals] = useState({});
//     const [statusAdsFilter, setStatusAdsFilter] = useState("all");
//     const [showTableColumn, setShowTableColumn] = useState(false);
//     const [searchTerm, setSearchTerm] = useState("");
//     const debouncedSearchTerm = useDebounce(searchTerm, 300);
//     // const [currentPage, setCurrentPage] = useState(1);
//     // const [itemsPerPage, setItemsPerPage] = useState(20);
//     // const [paginatedData, setPaginatedData] = useState([]);
//     // const [totalPages, setTotalPages] = useState(1);
//     const [currentPage, setCurrentPage] = useState(1);
//     const [itemsPerPage, setItemsPerPage] = useState(50);
//     const [totalPages, setTotalPages] = useState(1);
//     const [totalElements, setTotalElements] = useState(0);
//     // Other
//     const [showAlert, setShowAlert] = useState(false);
//     const [animateCalendar, setAnimateCalendar] = useState(false);
//     const [isLoading, setIsLoading] = useState(false);
//     const [isContentLoading, setIsContentLoading] = useState(false);



//     const metrics = {
//         impression: {
//             label: "Iklan Dilihat",
//             color: "#D50000",
//             dataKey: "impression",
//             type: "currency"
//         },
//         click: {
//             label: "Jumlah Klik",
//             color: "#00B800",
//             dataKey: "click",
//             type: "currency"
//         },
//         ctr: {
//             label: "Persentase Klik",
//             color: "#DFC100",
//             dataKey: "ctr",
//             type: "percentage"
//         }
//         // dan metric lainya yang saya comment dibawah
//     };

//     // Function to calculate totals for each metric based on raw data
//     function calculateMetricTotals(products) {
//         const totals = {};
//         Object.keys(metrics).forEach(metricKey => {
//             totals[metricKey] = 0;
//             products.forEach(product => {
//                 const productData = product.data[0]; // Hanya mengambil data pertama/terbaru
//                 if (productData) {
//                     const dataKey = metrics[metricKey].dataKey;
//                     const value = productData[dataKey];
//                     if (value !== undefined && value !== null) {
//                         totals[metricKey] += Number(value);
//                     }
//                 }
//             });
//         });
//         return totals;
//     };

//     const fetchData = async (fromDate, toDate) => {
//         const isInitialLoad = !rawData.length;
//         if (isInitialLoad) {
//             setIsLoading(true);
//         } else {
//             setIsContentLoading(true);
//         }

//         const toLocalISOString = (date) => {
//             const year = date.getFullYear();
//             const month = String(date.getMonth() + 1).padStart(2, '0');
//             const day = String(date.getDate()).padStart(2, '0');
//             const hours = String(date.getHours()).padStart(2, '0');
//             const minutes = String(date.getMinutes()).padStart(2, '0');
//             const seconds = String(date.getSeconds()).padStart(2, '0');

//             return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
//         };

//         try {
//             const fromISO = fromDate instanceof Date
//                 ? toLocalISOString(fromDate)
//                 : toLocalISOString(new Date(fromDate));

//             const toISO = toDate instanceof Date
//                 ? toLocalISOString(toDate)
//                 : toLocalISOString(new Date(toDate));

//             const apiUrl = `/api/product-ads/daily?shopId=${shopId}&from=${fromISO}&to=${toISO}&limit=100000`;
//             const response = await axiosRequest.get(apiUrl);
//             const data = await response.data;
//             const content = data.content || [];
//             setRawData(content);
//             setFilteredData(content);
//             setTotalPages(data.totalPages || 1);

//             const totals = calculateMetricTotals(content);
//             setMetricsTotals(totals);

//             return content;
//         } catch (error) {
//             toast.error("Gagal mengambil data iklan produk");
//             console.error('Gagal mengambil data iklan produk, kesalahan pada server:', error);
//             return [];
//         } finally {
//             setIsLoading(false);
//             setIsContentLoading(false);
//         }
//     };

//     // CUSTOM CHART WITH FILTER DATE & CLICK PRODUCT FEATURE
//     const handleAdsProductClick = (adsProduct) => {
//         if (selectedProduct?.campaignId === adsProduct.campaignId) {
//             setSelectedProduct(null);
//         } else {
//             setSelectedProduct(adsProduct);
//         }
//     };

//     function getAllDaysInLast7Days() {
//         return Array.from({ length: 7 }, (_, i) => {
//             const d = new Date();
//             d.setDate(d.getDate() - i);
//             return d.toISOString().split("T")[0];
//         }).reverse();
//     };

//     function getAllDaysInAMonth() {
//         const today = new Date();
//         const year = today.getFullYear();
//         const month = today.getMonth() + 1;
//         const days = new Date(year, month, 0).getDate();
//         return Array.from(
//             { length: days },
//             (_, i) => `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`
//         );
//     };

//     function getHourlyIntervals(selectedDate) {
//         return Array.from({ length: 24 }, (_, i) => {
//             const hour = String(i).padStart(2, "0");
//             return `${selectedDate} ${hour}:00`;
//         });
//     };

//     // Get all dates in a range of input manual dates
//     function getDateRangeIntervals(startDate, endDate) {
//         // Set start and end dates to the beginning and end of the day
//         const start = startDate instanceof Date ? new Date(startDate) : new Date(startDate);
//         const end = endDate instanceof Date ? new Date(endDate) : new Date(endDate);

//         // Set start to the beginning of the day and end to the end of the day
//         start.setHours(0, 0, 0, 0);
//         end.setHours(23, 59, 59, 999);

//         const dateArray = [];

//         // Helper function untuk get local date string
//         const getLocalDateString = (date) => {
//             const year = date.getFullYear();
//             const month = String(date.getMonth() + 1).padStart(2, '0');
//             const day = String(date.getDate()).padStart(2, '0');
//             return `${year}-${month}-${day}`;
//         };

//         // Calculate the difference in days between start and end dates
//         const diffTime = Math.abs(end - start);
//         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

//         // If same day (diffDays === 0), return hourly intervals
//         if (diffDays == 0) {
//             return getHourlyIntervals(getLocalDateString(start));
//         }

//         // Otherwise, return daily intervals
//         let currentDate = new Date(start);
//         // Loop through each day from start to end
//         while (currentDate <= end) {
//             dateArray.push(getLocalDateString(currentDate));
//             currentDate.setDate(currentDate.getDate() + 1);
//         }

//         return dateArray;
//     };

//     // Function to generate chart data for multiple metrics
//     function generateMultipleMetricsChartData(selectedDate = null, ads = null, selectedMetrics = ["impression"]) {
//         let timeIntervals = [];
//         let mode = "daily";
//         let result = {};
//         let isSingleDay = false;
//         let fromDate, toDate;

//         // Helper function untuk get date string tanpa timezone conversion
//         const getLocalDateString = (date) => {
//             const year = date.getFullYear();
//             const month = String(date.getMonth() + 1).padStart(2, '0');
//             const day = String(date.getDate()).padStart(2, '0');
//             return `${year}-${month}-${day}`;
//         };

//         if (comparatorDate && comparedDate) {
//             const sameDay = comparatorDate.toDateString() === comparedDate.toDateString();
//             if (sameDay) {
//                 const dateStr = getLocalDateString(comparatorDate);
//                 timeIntervals = getHourlyIntervals(dateStr);
//                 mode = "hourly";
//                 isSingleDay = true;
//                 fromDate = comparatorDate;
//                 toDate = new Date(comparatorDate);
//                 toDate.setHours(23, 59, 59, 999);
//             } else {
//                 timeIntervals = getDateRangeIntervals(comparatorDate, comparedDate);
//                 mode = "daily";
//                 isSingleDay = false;
//                 fromDate = comparatorDate;
//                 toDate = comparedDate;
//             }
//         } else if (selectedDate === null || Array.isArray(selectedDate)) {
//             timeIntervals = getAllDaysInLast7Days();
//             fromDate = new Date(timeIntervals[0]);
//             toDate = new Date();
//             toDate.setHours(23, 59, 59, 999);
//         } else if (selectedDate === "Bulan Ini") {
//             timeIntervals = getAllDaysInAMonth();
//             const today = new Date();
//             fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
//             toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
//             toDate.setHours(23, 59, 59, 999);
//         } else {
//             timeIntervals = getHourlyIntervals(selectedDate);
//             mode = "hourly";
//             isSingleDay = true;
//             fromDate = new Date(selectedDate);
//             toDate = new Date(selectedDate);
//             toDate.setHours(23, 59, 59, 999);
//         }

//         if (!timeIntervals || timeIntervals.length === 0) {
//             timeIntervals = [new Date().toISOString().split('T')[0]];
//             fromDate = new Date();
//             toDate = new Date();
//             toDate.setHours(23, 59, 59, 999);
//         }

//         result.timeIntervals = timeIntervals;
//         result.isSingleDay = isSingleDay;
//         result.series = [];

//         let chartDataProducts = rawData;
//         if (ads) {
//             chartDataProducts = rawData.filter((product) => product.campaignId == ads.campaignId);
//         }

//         // Generate data series berdasarkan metrik yang dipilih
//         selectedMetrics?.forEach(metricKey => {
//             const metric = metrics[metricKey];
//             // Jika metrik tidak ditemukan, lewati iterasi, return kosongan
//             if (!metric) return;

//             const dataKey = metric.dataKey;
//             let dataMap = {};

//             // Inisialisasi dataMap dengan nilai 0 untuk setiap interval waktu
//             timeIntervals.forEach((time) => {
//                 dataMap[time] = 0;
//             });

//             // Proses data untuk setiap ads produk
//             chartDataProducts?.forEach((adsProduct) => {
//                 if (!adsProduct.data || adsProduct.data.length === 0) return;

//                 if (isSingleDay) {
//                     adsProduct.data.forEach((productData) => {
//                         if (!productData || !productData.createdAt) return;
//                         const createdAt = new Date(productData.createdAt);
//                         const productDateStr = getLocalDateString(createdAt);
//                         const filterDateStr = getLocalDateString(fromDate);

//                         if (productDateStr !== filterDateStr) return;

//                         const hourKey = String(createdAt.getHours()).padStart(2, "0");
//                         const productYear = createdAt.getFullYear();
//                         const productMonth = String(createdAt.getMonth() + 1).padStart(2, "0");
//                         const productDay = String(createdAt.getDate()).padStart(2, "0");

//                         const hourOnlyKey = `${productYear}-${productMonth}-${productDay} ${hourKey}:00`;

//                         if (timeIntervals.includes(hourOnlyKey)) {
//                             const value = productData[dataKey];
//                             if (value !== undefined && value !== null) {
//                                 dataMap[hourOnlyKey] += Number(value);
//                             }
//                         }
//                     });
//                 } else {
//                     const dataByDate = {};

//                     adsProduct.data.forEach(productData => {
//                         if (!productData || !productData.createdAt) return;

//                         const createdAt = new Date(productData.createdAt);
//                         const productYear = createdAt.getFullYear();
//                         const productMonth = String(createdAt.getMonth() + 1).padStart(2, "0");
//                         const productDay = String(createdAt.getDate()).padStart(2, "0");
//                         const dateDayKey = `${productYear}-${productMonth}-${productDay}`;

//                         const productDateStr = getLocalDateString(createdAt);
//                         const filterStartStr = Array.isArray(selectedDate) ? selectedDate[0] : getLocalDateString(fromDate);
//                         const filterEndStr = Array.isArray(selectedDate) ? selectedDate[selectedDate.length - 1] : getLocalDateString(toDate);

//                         if (productDateStr >= filterStartStr && productDateStr <= filterEndStr) {
//                             if (!dataByDate[dateDayKey]) {
//                                 dataByDate[dateDayKey] = 0;
//                             }

//                             const value = productData[dataKey];
//                             if (value !== undefined && value !== null) {
//                                 dataByDate[dateDayKey] += Number(value);
//                             }
//                         }
//                     });

//                     Object.keys(dataByDate).forEach(dateDayKey => {
//                         // Cek apakah dateDayKey ada dalam timeIntervals
//                         if (timeIntervals.includes(dateDayKey)) {
//                             dataMap[dateDayKey] += dataByDate[dateDayKey];
//                         }
//                     });
//                 }
//             });

//             // Buat data series untuk chart
//             const seriesData = {
//                 name: metric.label,
//                 data: timeIntervals.map((time) => dataMap[time] || 0),
//                 color: metric.color
//             };

//             result.series.push(seriesData);
//         });

//         return result;
//     };

//     // Handle date selection options
//     function handleDateSelection(selectedDateOption, type = "minggu_ini") {
//         setComparatorDate(null);
//         setComparedDate(null);
//         setDate(selectedDateOption);

//         let fromDate, toDate;
//         if (type == "minggu_ini") {
//             fromDate = new Date(selectedDateOption[0] + 'T00:00:00');
//             toDate = new Date(selectedDateOption[selectedDateOption.length - 1] + 'T23:59:59.999');
//             setFlagCustomRoasDate(type);
//         } else if (type == "bulan_ini") {
//             const today = new Date();
//             fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
//             toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
//             toDate.setHours(23, 59, 59, 999);
//             setFlagCustomRoasDate(type);
//         } else {
//             fromDate = new Date(selectedDateOption + 'T00:00:00');
//             toDate = new Date(selectedDateOption + 'T23:59:59.999');
//             setFlagCustomRoasDate(type);
//         }

//         setShowCalendar(false);
//         fetchData(fromDate, toDate);
//     };

//     // Handle comparison date confirmation
//     function handleComparisonDatesConfirm() {
//         if (comparatorDate && comparedDate) {
//             // Ensure dates are properly set with time
//             const fromDate = new Date(comparatorDate);
//             const toDate = new Date(comparedDate);

//             // Set proper time ranges
//             fromDate.setHours(0, 0, 0, 0);
//             toDate.setHours(23, 59, 59, 999);


//             setDate(null);
//             setShowCalendar(false);

//             // Fetch data for the new date range
//             fetchData(fromDate, toDate);
//         }
//     }

//     // Function to format metric values for display
//     function handleMetricFilter(metricKey) {
//         setSelectedMetrics(prev => {
//             if (prev.includes(metricKey)) {
//                 return prev.filter(m => m !== metricKey);
//             }
//             else if (prev.length < 4) {
//                 return [...prev, metricKey];
//             }
//             else {
//                 setShowAlert(true);
//                 setTimeout(() => setShowAlert(false), 2000);
//                 return prev;
//             }
//         });
//     };

//     // Initial data loading
//     useEffect(() => {
//         // Determine date range based on current selection
//         let fromDate, toDate;

//         if (comparatorDate && comparedDate) {
//             fromDate = comparatorDate;
//             toDate = comparedDate;
//         } else if (Array.isArray(date)) {
//             // Last 7 days
//             fromDate = new Date(date[0]);
//             toDate = new Date(date[date.length - 1]);
//             toDate.setHours(23, 59, 59, 999);
//         } else if (date === "Bulan Ini") {
//             // Current month
//             const today = new Date();
//             fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
//             toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
//             toDate.setHours(23, 59, 59, 999);
//         } else if (date) {
//             // Single day
//             fromDate = new Date(date);
//             toDate = new Date(date);
//             toDate.setHours(23, 59, 59, 999);
//         } else {
//             // Default to last 7 days
//             const today = new Date();
//             fromDate = new Date();
//             fromDate.setDate(today.getDate() - 7);
//             toDate = today;
//         }

//         fetchData(fromDate, toDate);
//     }, []);

//     // Update totals when raw/main  data changes
//     useEffect(() => {
//         if (rawData.length > 0) {
//             const totals = calculateMetricTotals(rawData);
//             setMetricsTotals(totals);
//         }
//     }, [rawData]);

//     // Generate chart data when relevant state changes
//     useEffect(() => {
//         const chartData = generateMultipleMetricsChartData(date, selectedProduct, selectedMetrics);
//         setChartData(chartData);
//     }, [date, selectedProduct, selectedMetrics, rawData]);

//     useEffect(() => {
//         if (chartRef.current) {
//             const chartInstance = echarts.init(chartRef.current);

//             const series = chartData.series?.map(s => ({
//                 name: s.name,
//                 type: 'line',
//                 emphasis: { focus: 'series' },
//                 data: s.data,
//                 lineStyle: {
//                     color: s.color
//                 },
//                 itemStyle: {
//                     color: s.color
//                 }
//             })) || [];

//             const hasData = series.some(s => s.data && s.data.some(value => value > 0));
//             const xAxisData = chartData.timeIntervals || [];

//             const option = {
//                 toolbox: { feature: { saveAsImage: {} } },
//                 grid: {
//                     left: 10,
//                     containLabel: false
//                 },
//                 tooltip: {
//                     trigger: "axis",
//                     formatter: function (params) {
//                         let result = params[0].axisValue + '<br/>';
//                         params.forEach(param => {
//                             result += `<span style="background-color:${param.color};"></span> ${param.seriesName}: ${param.value}<br/>`;
//                         });
//                         return result;
//                     }
//                 },
//                 legend: {
//                     data: chartData.series?.map(s => s.name) || [],
//                 },
//                 xAxis: {
//                     name: isSingleDay ? "Time" : "Date",
//                     type: "category",
//                     data: xAxisData || [],
//                     boundaryGap: false,
//                     axisLabel: {
//                         rotate: rotateAxisLabel,
//                         interval: 0,
//                     },
//                 },
//                 yAxis: {
//                     name: selectedMetrics.length === 1 ? metrics[selectedMetrics[0]]?.label : "Total",
//                     type: "value",
//                     splitLine: { show: true },
//                 },
//                 series: series
//             };

//             if (!hasData && (comparatorDate && comparedDate)) {
//                 option.graphic = [
//                     {
//                         style: {
//                             text: 'Tidak ada data untuk rentang waktu yang dipilih',
//                         }
//                     }
//                 ];
//             }

//             chartInstance.setOption(option);
//             return () => chartInstance.dispose();
//         }
//     }, [chartData, selectedMetrics]);

//     // Handle style for matric filter ui
//     const handleStyleMatricButton = (metricKey) => {
//         const isActive = selectedMetrics.includes(metricKey);
//         const metric = metrics[metricKey];
//         return {
//             borderTop: `solid ${isActive ? `${metric.color} 3px` : "rgb(179.4, 184.2, 189) 1px"}`,
//         };
//     };

//     // FILTER COLUMNS FEATURE
//     const allColumns = [
//         { key: "info_iklan", label: "Info iklan" },
//         { key: "dailyBudget", label: "Modal" },
//         { key: "analyze", label: "Analisis" },
//         { key: "insight", label: "Insight" },
//         { key: "cost", label: "Biaya Iklan" },
//         { key: "broadGmv", label: "Penjualan dari iklan" },
//         { key: "roas", label: "ROAS" },
//         // dan field lainnya dibawah yang saya comment
//     ];
//     const [selectedColumns, setSelectedColumns] = useState(
//         allColumns.map((col) => col.key)
//     );
//     const handleColumnChange = (colKey) => {
//         setSelectedColumns((prev) =>
//             prev.includes(colKey)
//                 ? prev.filter((key) => key !== colKey)
//                 : [...prev, colKey]
//         );
//     };

//     // PAGINATION FEATURE
//     const getVisiblePageNumbers = () => {
//         const pages = [];
//         // Jika total halaman <= 10, tampilkan semua
//         if (totalPages <= 10) {
//             for (let i = 1; i <= totalPages; i++) {
//                 pages.push(i);
//             }
//             return pages;
//         }
//         // Jika halaman saat ini di awal (1-3)
//         if (currentPage <= 3) {
//             pages.push(1, 2, 3);
//             if (totalPages > 4) {
//                 pages.push('...');
//                 pages.push(totalPages - 1, totalPages);
//             }
//         }
//         // Jika halaman saat ini di akhir (3 halaman terakhir)
//         else if (currentPage >= totalPages - 2) {
//             pages.push(1, 2);
//             if (totalPages > 4) {
//                 pages.push('...');
//             }
//             pages.push(totalPages - 2, totalPages - 1, totalPages);
//         }
//         // Jika halaman saat ini di tengah
//         else {
//             pages.push(1, 2);
//             pages.push('...');
//             pages.push(currentPage - 1, currentPage, currentPage + 1);
//             pages.push('...');
//             pages.push(totalPages - 1, totalPages);
//         }

//         return pages;
//     };
//     useEffect(() => {
//         const calculateTotalPages = Math.ceil(filteredData.length / itemsPerPage);
//         setTotalPages(calculateTotalPages || 1);

//         if (currentPage > calculateTotalPages && calculateTotalPages > 0) {
//             setCurrentPage(calculateTotalPages);
//         }

//         const startIndex = (currentPage - 1) * itemsPerPage;
//         const endIndex = startIndex + itemsPerPage;
//         setPaginatedData(filteredData.slice(startIndex, endIndex));
//     }, [filteredData, currentPage, itemsPerPage]);
//     const handleItemsPerPageChange = (e) => {
//         const newItemsPerPage = parseInt(e.target.value, 10);
//         setItemsPerPage(newItemsPerPage);
//         setCurrentPage(1);
//     };
//     const handlePageChange = (pageNumber) => {
//         if (pageNumber >= 1 && pageNumber <= totalPages) {
//             setCurrentPage(pageNumber);
//         }
//     };
//     const renderPagination = () => {
//         const visiblePages = getVisiblePageNumbers();
//         const showFirstLastButtons = totalPages > 10;
//         const getWidthWindow = window.innerWidth;
//         return (
//             <div className="custom-container-pagination mt-3">
//                 <div className="custom-pagination-select d-flex align-items-center gap-2">
//                     <span
//                         style={{
//                             display: `${getWidthWindow < 768 ? 'none' : 'block'}`
//                         }}
//                     >Tampilan</span>
//                     <select
//                         className="form-select"
//                         value={itemsPerPage}
//                         onChange={handleItemsPerPageChange}
//                         style={{ width: "80px" }}
//                     >
//                         <option value="20">20</option>
//                         <option value="30">30</option>
//                         <option value="50">50</option>
//                     </select>
//                     <span>data per halaman</span>
//                 </div>
//                 <nav className="custom-pagination-list" aria-label="Page navigation">
//                     <ul className="pagination mb-0" style={{
//                         gap: `${totalPages < 10 ? '1rem' : ''}`,
//                     }}>
//                         {
//                             totalPages >= 10 && getWidthWindow >= 768 ? (
//                                 <>
//                                     {/* First page button (hanya muncul jika > 10 halaman) */}
//                                     {showFirstLastButtons && (
//                                         <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
//                                             <button
//                                                 className="page-link"
//                                                 onClick={() => handlePageChange(1)}
//                                                 disabled={currentPage === 1}
//                                                 title="Ke halaman pertama"
//                                             >
//                                                 Awal
//                                             </button>
//                                         </li>
//                                     )}
//                                     {/* Previous button */}
//                                     <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
//                                         <button
//                                             className="page-link"
//                                             onClick={() => handlePageChange(currentPage - 1)}
//                                             disabled={currentPage === 1}
//                                             title="Halaman sebelumnya"
//                                         >
//                                             <FaAngleLeft />
//                                         </button>
//                                     </li>

//                                     {visiblePages.map((page, index) => {
//                                         if (page === '...') {
//                                             return (
//                                                 <li key={`ellipsis-${index}`} className="page-item disabled">
//                                                     <span className="page-link">...</span>
//                                                 </li>
//                                             );
//                                         }

//                                         return (
//                                             <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
//                                                 <button
//                                                     className="page-link"
//                                                     onClick={() => handlePageChange(page)}
//                                                 >
//                                                     {page}
//                                                 </button>
//                                             </li>
//                                         );
//                                     })}

//                                     {/* Next button */}
//                                     <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
//                                         <button
//                                             className="page-link"
//                                             onClick={() => handlePageChange(currentPage + 1)}
//                                             disabled={currentPage === totalPages}
//                                             title="Halaman selanjutnya"
//                                         >
//                                             <FaAngleRight />
//                                         </button>
//                                     </li>
//                                     {showFirstLastButtons && (
//                                         <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
//                                             <button
//                                                 className="page-link"
//                                                 onClick={() => handlePageChange(totalPages)}
//                                                 disabled={currentPage === totalPages}
//                                                 title="Ke halaman terakhir"
//                                             >
//                                                 Akhir
//                                             </button>
//                                         </li>
//                                     )}
//                                 </>
//                             ) : (
//                                 <>
//                                     <div className="d-flex">
//                                         {/* First page button (hanya muncul jika > 10 halaman) */}
//                                         {showFirstLastButtons && (
//                                             <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
//                                                 <button
//                                                     className="page-link"
//                                                     onClick={() => handlePageChange(1)}
//                                                     disabled={currentPage === 1}
//                                                     title="Ke halaman pertama"
//                                                 >
//                                                     Awal
//                                                 </button>
//                                             </li>
//                                         )}

//                                         {/* Previous button */}
//                                         <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
//                                             <button
//                                                 className="page-link"
//                                                 onClick={() => handlePageChange(currentPage - 1)}
//                                                 disabled={currentPage === 1}
//                                                 title="Halaman sebelumnya"
//                                             >
//                                                 <FaAngleLeft />
//                                             </button>
//                                         </li>
//                                     </div>

//                                     <div className="d-flex">
//                                         {visiblePages.map((page, index) => {
//                                             if (page === '...') {
//                                                 return (
//                                                     <li key={`ellipsis-${index}`} className="page-item disabled">
//                                                         <span className="page-link">...</span>
//                                                     </li>
//                                                 );
//                                             }

//                                             return (
//                                                 <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
//                                                     <button
//                                                         className="page-link"
//                                                         onClick={() => handlePageChange(page)}
//                                                     >
//                                                         {page}
//                                                     </button>
//                                                 </li>
//                                             );
//                                         })}
//                                     </div>

//                                     <div className="d-flex">
//                                         <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
//                                             <button
//                                                 className="page-link"
//                                                 onClick={() => handlePageChange(currentPage + 1)}
//                                                 disabled={currentPage === totalPages}
//                                                 title="Halaman selanjutnya"
//                                             >
//                                                 <FaAngleRight />
//                                             </button>
//                                         </li>

//                                         {showFirstLastButtons && (
//                                             <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
//                                                 <button
//                                                     className="page-link"
//                                                     onClick={() => handlePageChange(totalPages)}
//                                                     disabled={currentPage === totalPages}
//                                                     title="Ke halaman terakhir"
//                                                 >
//                                                     Akhir
//                                                 </button>
//                                             </li>
//                                         )}
//                                     </div>
//                                 </>
//                             )
//                         }
//                     </ul>
//                 </nav>
//             </div>
//         );
//     };

//     // FILTER DATA FOR TABLE FEATURE
//     useEffect(() => {
//         let filtered = rawData;
//         // Filter by search term
//         if (debouncedSearchTerm !== "") {
//             filtered = filtered.filter((entry) =>
//                 entry.data[0].title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
//             );
//         }
//         // Filter by status
//         if (statusAdsFilter !== "all") {
//             filtered = filtered.filter((entry) => entry.data[0].state === statusAdsFilter);
//         }

//         setCurrentPage(1);
//         setFilteredData(filtered);
//     }, [debouncedSearchTerm, rawData, statusAdsFilter]);

//     const toggleOpenCalendar = () => {
//         if (showCalendar) {
//             setAnimateCalendar(false);
//             setTimeout(() => setShowCalendar(false), 100);
//         } else {
//             setShowCalendar(true);
//             setTimeout(() => setAnimateCalendar(true), 100);
//         }
//     };

//     return (
//         <>
//             {
//                 isLoading ? (
//                     <div className="d-flex justify-content-center align-items-start vh-100">
//                         <Loading size={40} />
//                     </div>
//                 ) : (
//                     <div className="card">
//                         <div className="card-body">
//                             {/* Header & Date Filter */}
//                             <strong>{rawData.length} total produk</strong>
//                             <div style={{ position: "relative" }}>
//                                 <button
//                                     onClick={toggleOpenCalendar}
//                                 >
//                                     {comparatorDate && comparedDate
//                                         ? `${comparatorDate.toLocaleDateString("id-ID")} - ${comparedDate.toLocaleDateString("id-ID")}`
//                                         : (typeof date === 'string' ? date : (Array.isArray(date) ? "1 Minggu terakhir" : "Pilih Tanggal"))}
//                                 </button>
//                                 {showCalendar && (
//                                     <div
//                                         className={`card custom-calendar-behavior ${animateCalendar ? "show" : ""}`}
//                                     >
//                                         <div>
//                                             <p onClick={() => handleDateSelection(new Date().toISOString().split("T")[0], "hari_ini")}>Hari ini</p>
//                                             <p
//                                                 onClick={() => {
//                                                     const yesterday = new Date();
//                                                     yesterday.setDate(yesterday.getDate() - 1);
//                                                     handleDateSelection(yesterday.toISOString().split("T")[0], "kemarin");
//                                                 }}
//                                             >
//                                                 Kemarin
//                                             </p>
//                                             <p onClick={() => handleDateSelection(getAllDaysInLast7Days(), "minggu_ini")}>1 Minggu terakhir</p>
//                                             <p onClick={() => handleDateSelection("Bulan Ini", "bulan_ini")}>Bulan ini</p>
//                                         </div>
//                                         {/* Kalender pembanding */}
//                                         <div>
//                                             <p style={{ textAlign: "center" }}>Tanggal Pembanding</p>
//                                             <Calendar onChange={(date) => setComparatorDate(date)} value={comparatorDate} maxDate={comparedDate || new Date(2100, 0, 1)} />
//                                         </div>
//                                         {/* Kalender dibanding */}
//                                         <div>
//                                             <p style={{ textAlign: "center" }}>Tanggal Dibanding</p>
//                                             <Calendar onChange={(date) => setComparedDate(date)} value={comparedDate} minDate={comparatorDate || new Date()} />
//                                         </div>
//                                         {/* Confirm button for date range */}
//                                         <button
//                                             className="btn btn-primary"
//                                             onClick={handleComparisonDatesConfirm}
//                                             disabled={!comparatorDate || !comparedDate}
//                                         >
//                                             Terapkan
//                                         </button>
//                                     </div>
//                                 )}
//                             </div>
//                             {
//                                 isContentLoading ? (
//                                     <div className="d-flex justify-content-center align-items-start vh-100">
//                                         <Loading size={40} />
//                                     </div>
//                                 ) : (
//                                     <>
//                                         {/* Matric filter */}
//                                         <div className="row g-3">
//                                             {Object.keys(metrics).map((metricKey) => (
//                                                 <div
//                                                     className="col-12 col-sm-6 col-lg-3"
//                                                     key={metricKey}
//                                                 >
//                                                     <div
//                                                         style={handleStyleMatricButton(metricKey)}
//                                                         onClick={() => handleMetricFilter(metricKey)}
//                                                     >
//                                                         <strong style={{ color: "#5d7186" }}>
//                                                             {metrics[metricKey].label}
//                                                         </strong>
//                                                         <span className="card-text fs-4 fw-bold">
//                                                             {
//                                                                 metrics[metricKey].type === "currency"
//                                                                     ? <span>{formatRupiahFilter(metricsTotals[metricKey])}</span>
//                                                                     : metrics[metricKey].type === "percentage"
//                                                                         ? <span>{Number(metricsTotals[metricKey]).toFixed(2)}%</span>
//                                                                         : <span>{Number(metricsTotals[metricKey]).toFixed(2)}</span>
//                                                             }
//                                                         </span>
//                                                     </div>
//                                                 </div>
//                                             ))}
//                                         </div>
//                                         {/* Chart */}
//                                         <div ref={chartRef} style={{ width: "100%", height: "300px" }}></div>
//                                         {/* Status filter */}
//                                         <span>Status Produk</span>
//                                         <div className="d-flex gap-1 gap-md-2 flex-wrap">
//                                             <div
//                                                 className={`status-button-filter rounded-pill d-flex align-items-center  ${statusAdsFilter === "all"
//                                                     ? "custom-font-color custom-border-select fw-bold"
//                                                     : "border border-secondary-subtle"
//                                                     }`}
//                                                 onClick={() => setStatusAdsFilter("all")}
//                                                 style={{ cursor: "pointer", fontSize: "12px", padding: "6px 12px", }}
//                                             >
//                                                 Semua
//                                             </div>
//                                             <div
//                                                 className={`status-button-filter rounded-pill d-flex align-items-center ${statusAdsFilter === "scheduled"
//                                                     ? "custom-font-color custom-border-select fw-bold"
//                                                     : "border border-secondary-subtle"
//                                                     }`}
//                                                 onClick={() => setStatusAdsFilter("scheduled")}
//                                             >
//                                                 Terjadwal
//                                             </div>
//                                             <div
//                                                 className={`status-button-filter rounded-pill d-flex align-items-center  ${statusAdsFilter === "ongoing"
//                                                     ? "custom-font-color custom-border-select fw-bold"
//                                                     : "border border-secondary-subtle"
//                                                     }`}
//                                                 onClick={() => setStatusAdsFilter("ongoing")}
//                                             >
//                                                 Berjalan
//                                             </div>
//                                         </div>
//                                         {/* search bar */}
//                                         <input
//                                             type="text"
//                                             className="form-control"
//                                             placeholder="Cari berdasarkan nama"
//                                             value={searchTerm}
//                                             onChange={(e) => setSearchTerm(e.target.value)}
//                                         />

//                                         {/* Column filter */}
//                                         <button
//                                             onClick={() => setShowTableColumn(!showTableColumn)}
//                                         >
//                                             Pilih kriteria
//                                         </button>

//                                         {showTableColumn && (
//                                             <div className="border px-2 rounded">
//                                                 {allColumns.map((col) => (
//                                                     <div key={col.key}>
//                                                         <input
//                                                             type="checkbox"
//                                                             checked={selectedColumns.includes(col.key)}
//                                                             onChange={() => handleColumnChange(col.key)}
//                                                         />
//                                                         {
//                                                             <span className="text-secondary" style={{ fontSize: "12px" }}>
//                                                                 {col.label}
//                                                             </span>
//                                                         }
//                                                     </div>
//                                                 ))}
//                                             </div>
//                                         )}
//                                         <table className="table table-centered">
//                                             <thead className="table-dark">
//                                                 <tr>
//                                                     {filteredData.length !== 0 && filteredData !== null && <th scope="col">No</th>}
//                                                     {allColumns
//                                                         .filter((col) =>
//                                                             selectedColumns.includes(col.key) &&
//                                                             (col.key !== "custom_roas" ||
//                                                                 (flagCustomRoasDate !== "minggu_ini" && flagCustomRoasDate !== "bulan_ini"))
//                                                         )
//                                                         .map((col) => (
//                                                             <th key={col.key}>
//                                                                 <div className="d-flex justify-content-start align-items-center">
//                                                                     {col.label}
//                                                                 </div>
//                                                             </th>
//                                                         ))
//                                                     }
//                                                 </tr>
//                                             </thead>
//                                             <tbody>
//                                                 {paginatedData.length !== 0 && paginatedData !== null ? (
//                                                     paginatedData?.map((entry, index) => (
//                                                         <>
//                                                             <tr key={entry.campaignId}>
//                                                                 {filteredData.length > 0 && filteredData !== null && (
//                                                                     <td>{index + 1}</td>
//                                                                 )}
//                                                                 {selectedColumns.includes("info_iklan") && (
//                                                                     <td
//                                                                         className="d-flex gap-2"
//                                                                         style={{
//                                                                             color:
//                                                                                 selectedProduct?.campaignId === entry.campaignId
//                                                                                     ? "#F6881F"
//                                                                                     : "",
//                                                                         }}
//                                                                         onClick={() => handleAdsProductClick(entry)}
//                                                                     >
//                                                                         <span className="custom-table-title-paragraph">{entry.data[0].title}</span>
//                                                                     </td>
//                                                                 )}
//                                                                 {selectedColumns.includes("dailyBudget") && (
//                                                                     <td style={{ width: "180px" }}>
//                                                                         <div className="d-flex flex-column">
//                                                                             <span>
//                                                                                 {
//                                                                                     entry.data[0].dailyBudget === undefined ? "-" : entry.data[0].dailyBudget === null ? "0" : `Rp ${convertBudgetToIDR(entry.data[0].dailyBudget, "default")}`
//                                                                                 }
//                                                                             </span>
//                                                                             <span className="text-success" style={{ fontSize: "10px" }}>
//                                                                                 +12.7%
//                                                                             </span>
//                                                                         </div>
//                                                                     </td>
//                                                                 )}
//                                                                 {selectedColumns.includes("analyze") && (
//                                                                     <td style={{ width: "260px" }}>
//                                                                         <div className="d-flex flex-column">
//                                                                             <span>
//                                                                                 {entry.data[0].analyze === undefined ? "-" : entry.data[0].analyze === null ? "Tidak ada keterangan" : entry.data[0].analyze}
//                                                                             </span>
//                                                                             <span className="text-success" style={{ fontSize: "10px" }}>
//                                                                                 +12.7%
//                                                                             </span>
//                                                                         </div>
//                                                                     </td>
//                                                                 )}
//                                                                 {selectedColumns.includes("insight") && (
//                                                                     <td style={{ width: "260px" }}>
//                                                                         <span>
//                                                                             {entry.data[0].insight === undefined ? "-" : entry.data[0].insight === null ? "Tidak ada keterangan" : entry.data[0].insight}
//                                                                         </span>
//                                                                     </td>
//                                                                 )}
//                                                                 {selectedColumns.includes("broadGmv") && (
//                                                                     <td style={{ width: "180px" }}>
//                                                                         <div className="d-flex flex-column">
//                                                                             <span>
//                                                                                 {entry.data[0].broadGmv === undefined ? "-" : entry.data[0].broadGmv === null ? "0" : `Rp ${convertBudgetToIDR(entry.data[0].broadGmv, "cost")}`}</span>
//                                                                             <span className={`${formatValueRatio(entry.data[0].broadGmvRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
//                                                                                 {entry.data[0].broadGmvRatio === undefined ? "-" : entry.data[0].broadGmvRatio === null ? "0" : `${formatValueRatio(entry.data[0].broadGmvRatio).rounded}%`}
//                                                                             </span>
//                                                                         </div>
//                                                                     </td>
//                                                                 )}
//                                                             </tr>
//                                                         </>
//                                                     ))
//                                                 ) : (
//                                                     <div className="w-100 d-flex justify-content-center">
//                                                         <span>Data tidak tersedia</span>
//                                                     </div>
//                                                 )}
//                                             </tbody>
//                                         </table>
//                                         {filteredData.length > 0 && filteredData !== null && renderPagination()}
//                                     </>
//                                 )
//                             }
//                         </div>
//                     </div >
//                 )
//             }
//         </>
//     );
// };

// export default AdsTable;