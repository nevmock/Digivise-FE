// import { useState, useEffect, useRef } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import Calendar from "react-calendar";
// import * as echarts from "echarts";
// import toast from "react-hot-toast";

// import axiosRequest from "../../utils/request";
// import Loading from "../../components/atoms/Loading/Loading";
// import BaseLayout from "../../components/organisms/BaseLayout";

// export default function DetailAds() {
//     const navigate = useNavigate();
//     const { campaignId } = useParams();
//     // Data
//     const userData = JSON.parse(localStorage.getItem("userDataApp"));
//     const shopId = userData?.merchants[0]?.merchantShopeeId || "252234165";
//     const [productData, setProductData] = useState(null);
//     const [keywordsData, setKeywordsData] = useState([]);
//     const [hasKeywords, setHasKeywords] = useState(false);
//     const [chartData, setChartData] = useState([]);
//     const chartRef = useRef(null);
//     // Filter
//     const [metricsTotals, setMetricsTotals] = useState({});
//     const [showTableColumn, setShowTableColumn] = useState(false);
//     const [comparatorDate, setComparatorDate] = useState(null);
//     const [comparedDate, setComparedDate] = useState(null);
//     const [date, setDate] = useState(getAllDaysInLast7Days());
//     const [showCalendar, setShowCalendar] = useState(false);
//     const [selectedMetrics, setSelectedMetrics] = useState(["impression"]);
//     // Other
//     const [showAlert, setShowAlert] = useState(false);
//     const [animateCalendar, setAnimateCalendar] = useState(false);
//     const [isLoading, setIsLoading] = useState(false);
//     const [isContentLoading, setIsContentLoading] = useState(false);

//     // CUSTOM CHART WITH FILTER DATE, CLICK PRODUCT FEATURE
//     // Define metrics with their display names and colors
//     const metrics = {
//         impression: {
//             label: "Iklan Dilihat",
//             color: "#A50000FF",
//             dataKey: "impression",
//         },
//         click: {
//             label: "Jumlah Klik",
//             color: "#37009EFF",
//             dataKey: "click",
//         },
//         cost: {
//             label: "Biaya Iklan",
//             color: "#009200FF",
//             dataKey: "cost",
//         },
//         acos: {
//             label: "ACOS",
//             color: "#D3B700FF",
//             dataKey: "acos",
//         },
//         ctr: {
//             label: "CTR",
//             color: "#990091FF",
//             dataKey: "ctr",
//         },
//         cpc: {
//             label: "CPC",
//             color: "#009999FF",
//             dataKey: "cpc",
//         },
//     };

//     const fetchData = async (fromDate, toDate) => {
//         const isInitialLoad = !keywordsData.length;
//         if (isInitialLoad) {
//             setIsLoading(true);
//         } else {
//             setIsContentLoading(true);
//         }

//         const toLocalISOString = (date) => {
//             const year = date.getFullYear();
//             const month = String(date.getMonth() + 1).padStart(2, "0");
//             const day = String(date.getDate()).padStart(2, "0");
//             const hours = String(date.getHours()).padStart(2, "0");
//             const minutes = String(date.getMinutes()).padStart(2, "0");
//             const seconds = String(date.getSeconds()).padStart(2, "0");

//             return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
//         };

//         try {
//             const fromISO =
//                 fromDate instanceof Date
//                     ? toLocalISOString(fromDate)
//                     : toLocalISOString(new Date(fromDate));

//             const toISO =
//                 toDate instanceof Date
//                     ? toLocalISOString(toDate)
//                     : toLocalISOString(new Date(toDate));

//             const apiUrl = `/api/product-ads/daily?shopId=${shopId}&from=${fromISO}&to=${toISO}&limit=100000`;
//             // const apiUrl = `/api/product-ads/daily?shopId=${shopId}&from=2025-06-04T00:00:00.869&to=2025-06-04T23:59:59.99900&limit=10&biddingStrategy=manual`;
//             const response = await axiosRequest.get(apiUrl);
//             const data = await response.data;
//             const content = data.content || [];
//             const filteredContent = content.filter(
//                 (item) => item.campaignId == campaignId
//             );

//             if (filteredContent[0]?.data.length > 0) {
//                 const product = filteredContent[0];
//                 setProductData(product);

//                 const hasKeywords = product.data.some(
//                     (item) => item.hasKeywords === true
//                 );
//                 setHasKeywords(hasKeywords);

//                 if (hasKeywords) {
//                     let allKeywords = [];
//                     product.data.forEach((dataItem) => {
//                         if (dataItem.keywords && dataItem.keywords.length > 0) {
//                             allKeywords = [...allKeywords, ...dataItem.keywords];
//                         }
//                     });

//                     const keywordsByKey = allKeywords.reduce((acc, keyword) => {
//                         if (!acc[keyword.key]) {
//                             acc[keyword.key] = {
//                                 ...keyword,
//                                 count: 1,
//                             };
//                         } else {
//                             const existing = acc[keyword.key];
//                             acc[keyword.key] = {
//                                 ...existing,
//                                 impression:
//                                     (existing.impression || 0) + (keyword.impression || 0),
//                                 click: (existing.click || 0) + (keyword.click || 0),
//                                 cost: (existing.cost || 0) + (keyword.cost || 0),
//                                 ctr: keyword.ctr || existing.ctr,
//                                 count: existing.count + 1,
//                                 insight: keyword.insight || existing.insight,
//                             };
//                         }
//                         return acc;
//                     }, {});

//                     const uniqueKeywords = Object.values(keywordsByKey).sort(
//                         (a, b) => (b.impression || 0) - (a.impression || 0)
//                     );
//                     setKeywordsData(uniqueKeywords);

//                     const totals = calculateMetricTotals(uniqueKeywords);
//                     setMetricsTotals(totals);
//                 }
//             }

//             return content;
//         } catch (error) {
//             console.error(
//                 "Gagal mengambil data keyword produk, kesalahan pada server:",
//                 error
//             );
//             toast.error("Gagal mengambil data keyword produk");
//             return [];
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     // Date utility for getting all days in the last 7 days
//     function getAllDaysInLast7Days() {
//         return Array.from({ length: 7 }, (_, i) => {
//             const d = new Date();
//             d.setDate(d.getDate() - i);
//             return d.toISOString().split("T")[0];
//         }).reverse();
//     }

//     // Date utility for getting all days in the current month
//     function getAllDaysInAMonth() {
//         const today = new Date();
//         const year = today.getFullYear();
//         const month = today.getMonth() + 1;
//         const days = new Date(year, month, 0).getDate();
//         return Array.from(
//             { length: days },
//             (_, i) =>
//                 `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(
//                     2,
//                     "0"
//                 )}`
//         );
//     }

//     // Date utility for getting all hourly intervals for a given date
//     function getHourlyIntervals(selectedDate) {
//         return Array.from({ length: 24 }, (_, i) => {
//             const hour = String(i).padStart(2, "0");
//             return `${selectedDate} ${hour}:00`;
//         });
//     }

//     // Get all dates in a range of input manual dates
//     function getDateRangeIntervals(startDate, endDate) {
//         const start = startDate instanceof Date ? new Date(startDate) : new Date(startDate);
//         const end = endDate instanceof Date ? new Date(endDate) : new Date(endDate);

//         start.setHours(0, 0, 0, 0);
//         end.setHours(23, 59, 59, 999);

//         const dateArray = [];

//         const diffTime = Math.abs(end - start);
//         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

//         // Helper function untuk get local date string
//         const getLocalDateString = (date) => {
//             const year = date.getFullYear();
//             const month = String(date.getMonth() + 1).padStart(2, '0');
//             const day = String(date.getDate()).padStart(2, '0');
//             return `${year}-${month}-${day}`;
//         };

//         if (diffDays <= 1) {
//             return getHourlyIntervals(getLocalDateString(start));
//         }

//         let currentDate = new Date(start);
//         while (currentDate <= end) {
//             dateArray.push(getLocalDateString(currentDate));
//             currentDate.setDate(currentDate.getDate() + 1);
//         }

//         return dateArray;
//     }

//     function generateMultipleKeywordChartData(
//         selectedDate = null,
//         selectedMetrics = ["impression"]
//     ) {
//         let timeIntervals = [];
//         let mode = "daily";
//         let result = {};
//         let isSingleDay = false;
//         let fromDate, toDate;

//         // Helper function untuk get date string tanpa timezone conversion
//         const getLocalDateString = (date) => {
//         const year = date.getFullYear();
//         const month = String(date.getMonth() + 1).padStart(2, '0');
//         const day = String(date.getDate()).padStart(2, '0');
//         return `${year}-${month}-${day}`;
//         };

//         // Determine time intervals based on selected date filter
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
//                 mode = timeIntervals.length <= 24 ? "hourly" : "daily";
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
//             timeIntervals = [new Date().toISOString().split("T")[0]];
//             fromDate = new Date();
//             toDate = new Date();
//             toDate.setHours(23, 59, 59, 999);
//         }

//         result.timeIntervals = timeIntervals;
//         result.isSingleDay = isSingleDay;
//         result.series = [];

//         // We're working with keyword data, so we need a different approach than the product data
//         if (!keywordsData || keywordsData.length === 0) {
//             return result;
//         }

//         // Filter keywords based on selected keyword
//         let chartDataKeywords = keywordsData;

//         // Generate time-based data series for each selected metric
//         selectedMetrics?.forEach((metricKey) => {
//             const metric = metrics[metricKey];
//             if (!metric) return;

//             const dataKey = metric.dataKey;
//             let dataMap = {};

//             // Inisialisasi dataMap dengan nilai 0 untuk setiap interval waktu
//             timeIntervals.forEach((time) => {
//                 dataMap[time] = 0;
//             });

//             // Proses data untuk setiap keyword
//             chartDataKeywords?.forEach((keyword) => {
//                 if (!keyword) return;

//                 // Kita perlu menangani kasus single day vs range day
//                 if (isSingleDay) {
//                     // Untuk mode hourly (single day), kita perlu membagi data keyword berdasarkan jam
//                     // Karena keyword tidak memiliki timestamp per jam, kita buat distribusi berdasarkan createdAt

//                     if (keyword.createdAt) {
//                         const createdAt = new Date(keyword.createdAt);

//                         // Extract jam saja (tanpa menit & detik)
//                         const hourKey = String(createdAt.getHours()).padStart(2, "0");
//                         const keywordYear = createdAt.getFullYear();
//                         const keywordMonth = String(createdAt.getMonth() + 1).padStart(
//                             2,
//                             "0"
//                         );
//                         const keywordDay = String(createdAt.getDate()).padStart(2, "0");

//                         // Buat key untuk pemetaan (hanya jam, tanpa menit & detik)
//                         const hourOnlyKey = `${keywordYear}-${keywordMonth}-${keywordDay} ${hourKey}:00`;

//                         // Cek apakah jam tersebut ada dalam timeIntervals
//                         if (timeIntervals.includes(hourOnlyKey)) {
//                             const value = keyword[dataKey];
//                             if (value !== undefined && value !== null) {
//                                 // Simpan nilai di dataMap
//                                 dataMap[hourOnlyKey] += Number(value);
//                             }
//                         }
//                     } else {
//                         // Jika keyword tidak memiliki createdAt, distribusikan nilai secara merata
//                         // Ini hanya fallback jika data tidak lengkap
//                         const value = keyword[dataKey];
//                         if (value !== undefined && value !== null) {
//                             // Ambil jam tertentu (misalnya jam 12 siang) untuk menampilkan data
//                             const midDayHour = `${fromDate.toISOString().split("T")[0]
//                                 } 12:00`;
//                             if (timeIntervals.includes(midDayHour)) {
//                                 dataMap[midDayHour] += Number(value);
//                             }
//                         }
//                     }
//                 } else {
//                     // Untuk mode daily (range day), kita perlu mengelompokkan berdasarkan tanggal
//                     if (keyword.createdAt) {
//                         const createdAt = new Date(keyword.createdAt);
//                         const keywordYear = createdAt.getFullYear();
//                         const keywordMonth = String(createdAt.getMonth() + 1).padStart(
//                             2,
//                             "0"
//                         );
//                         const keywordDay = String(createdAt.getDate()).padStart(2, "0");
//                         const dateDayKey = `${keywordYear}-${keywordMonth}-${keywordDay}`;

//                         if (timeIntervals.includes(dateDayKey)) {
//                             const value = keyword[dataKey];
//                             if (value !== undefined && value !== null) {
//                                 dataMap[dateDayKey] += Number(value);
//                             }
//                         }
//                     } else {
//                         // Distribusikan nilai secara proporsional di seluruh interval waktu
//                         // Ini fallback jika tidak ada createdAt
//                         const value = keyword[dataKey];
//                         if (value !== undefined && value !== null) {
//                             // Distribusikan nilai total secara merata di semua interval waktu
//                             const valuePerInterval = Number(value) / timeIntervals.length;
//                             timeIntervals.forEach((interval) => {
//                                 dataMap[interval] += valuePerInterval;
//                             });
//                         }
//                     }
//                 }
//             });

//             const seriesData = {
//                 name: metric.label,
//                 data: timeIntervals.map((time) => dataMap[time] || 0),
//                 color: metric.color,
//             };

//             result.series.push(seriesData);
//         });

//         return result;
//     }

//     // Handle date selection options
//     function handleDateSelection(selectedDateOption, type = "minggu_ini") {
//         setComparatorDate(null);
//         setComparedDate(null);
//         setDate(selectedDateOption);

//         let fromDate, toDate;
//         if (type == "minggu_ini") {
//             fromDate = new Date(selectedDateOption[0]);
//             toDate = new Date(selectedDateOption[selectedDateOption.length - 1]);
//             toDate.setHours(23, 59, 59, 999);
//         } else if (type == "bulan_ini") {
//             const today = new Date();
//             fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
//             toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
//             toDate.setHours(23, 59, 59, 999);
//         } else {
//             fromDate = new Date(selectedDateOption);
//             toDate = new Date(selectedDateOption);
//             toDate.setHours(23, 59, 59, 999);
//         }

//         setShowCalendar(false);
//         fetchData(fromDate, toDate);
//     }

//     // Handle comparison dates confirmation
//     function handleComparisonDatesConfirm() {
//         if (comparatorDate && comparedDate) {
//             setDate(null);
//             setShowCalendar(false);

//             // Fetch data for the new date range
//             fetchData(comparatorDate, comparedDate);
//         }
//     }

//     // Handle metric toggle
//     function handleMetricFilter(metricKey) {
//         setSelectedMetrics((prev) => {
//             if (prev.includes(metricKey)) {
//                 return prev.filter((m) => m !== metricKey);
//             } else if (prev.length < 4) {
//                 return [...prev, metricKey];
//             } else {
//                 setShowAlert(true);
//                 setTimeout(() => setShowAlert(false), 2000);
//                 return prev;
//             }
//         });
//     }

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

//     useEffect(() => {
//         if (keywordsData.length > 0) {
//             const totals = calculateMetricTotals(keywordsData);
//             setMetricsTotals(totals);
//         }
//     }, [keywordsData]);

//     // Generate chart data when relevant state changes
//     useEffect(() => {
//         const chartData = generateMultipleKeywordChartData(date, selectedMetrics);
//         setChartData(chartData);
//     }, [date, selectedMetrics, keywordsData, productData]);

//     useEffect(() => {
//         if (chartRef.current) {
//             const chartInstance = echarts.init(chartRef.current);

//             const series =
//                 chartData.series?.map((s) => ({
//                     name: s.name,
//                     type: "line",
//                     smooth: true,
//                     showSymbol: true,
//                     symbolSize: false,
//                     emphasis: { focus: "series" },
//                     data: s.data,
//                     lineStyle: {
//                         color: s.color,
//                     },
//                     itemStyle: {
//                         color: s.color,
//                     },
//                 })) || [];

//             const hasData = series.some(
//                 (s) => s.data && s.data.some((value) => value > 0)
//             );
//             const isSingleDay = chartData?.isSingleDay || false;
//             const timeIntervals = chartData.timeIntervals || [];
//             const xAxisData = timeIntervals.map((interval) => {
//                 if (interval.includes(" ")) {
//                     return interval.split(" ")[1];
//                 }
//                 const dateParts = interval.split("-");
//                 if (dateParts.length === 3) {
//                     return `${dateParts[2]}/${dateParts[1]}`;
//                 }
//                 return interval;
//             });
//             const leftGrid = 60;
//             const rotateAxisLabel = timeIntervals.length > 10 ? 45 : 0;

//             const option = {
//                 toolbox: { feature: { saveAsImage: {} } },
//                 grid: {
//                     left: leftGrid,
//                     right: 50,
//                     bottom: 50,
//                     containLabel: false,
//                 },
//                 tooltip: {
//                     trigger: "axis",
//                     formatter: function (params) {
//                         let result = "";

//                         // Add the original time interval for context
//                         if (params[0] && params[0].axisIndex === 0) {
//                             const index = params[0].dataIndex;
//                             if (index >= 0 && index < timeIntervals.length) {
//                                 result = timeIntervals[index] + "<br/>";
//                             } else {
//                                 result = params[0].axisValue + "<br/>";
//                             }
//                         }

//                         // Add each series value
//                         params.forEach((param) => {
//                             const metricKey = Object.keys(metrics).find(
//                                 (key) => metrics[key].label === param.seriesName
//                             );

//                             const formattedValue = metricKey
//                                 ? formatMetricValue(metricKey, param.value)
//                                 : param.value;

//                             result += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${param.color};"></span> ${param.seriesName}: ${formattedValue}<br/>`;
//                         });
//                         return result;
//                     },
//                 },
//                 legend: {
//                     data: chartData.series?.map((s) => s.name) || [],
//                     bottom: 0,
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
//                     name:
//                         selectedMetrics.length === 1
//                             ? metrics[selectedMetrics[0]]?.label
//                             : "Total",
//                     type: "value",
//                     splitLine: { show: true },
//                 },
//                 series: series,
//             };

//             if (!hasData && comparatorDate && comparedDate) {
//                 option.graphic = [
//                     {
//                         type: "text",
//                         left: "center",
//                         top: "middle",
//                         style: {
//                             text: "Tidak ada data untuk rentang waktu yang dipilih",
//                             fontSize: 16,
//                             fill: "#999",
//                             fontWeight: "bold",
//                         },
//                     },
//                 ];
//             }

//             chartInstance.setOption(option);
//             return () => chartInstance.dispose();
//         }
//     }, [chartData, selectedMetrics]);

    

//     /// CALCULATE FILTER METRIC TOTALS FEATURE
//     // Function to calculate totals for each metric based on raw data
//     function calculateMetricTotals(keywords) {
//         const totals = {};
//         Object.keys(metrics).forEach((metricKey) => {
//             totals[metricKey] = 0;
//             keywords?.forEach((keyword) => {
//                 const dataKey = metrics[metricKey].dataKey;
//                 const value = keyword[dataKey];
//                 if (value !== undefined && value !== null && !isNaN(value)) {
//                     totals[metricKey] += Number(value);
//                 }
//             });
//         });

//         return totals;
//     }

//     // FILTER COLUMNS FEATURE
//     // Define all columns
//     const allColumns = [
//         { key: "keywords", label: "Kata Pencarian" },
//         { key: "cpc", label: "CPC" },
//         { key: "impression", label: "Iklan Dilihat" },
//         { key: "click", label: "Jumlah Klik" },
//         { key: "acos", label: "Biaya per Klik" },
//     ];

//     // Handle style for matric filter button
//     const handleStyleMatricButton = (metricKey) => {
//         const isActive = selectedMetrics.includes(metricKey);
//         const metric = metrics[metricKey];
//         return {
//             backgroundColor: "#ffffff00",
//             borderTop: `solid ${isActive ? `${metric.color} 3px` : "rgb(179.4, 184.2, 189) 1px"}`,
//         }
//     };

//     // Format metric value based on its type
//     const formatMetricValue = (metricKey, value) => {
//     };

//     // SHOW CALENDER FEATURE
//     const toggleOpenCalendar = () => {
//     };

//     return (
//         <>
//             <BaseLayout>
//                 <button
//                     className="btn btn-secondary mb-3"
//                     onClick={() => navigate(-1)}
//                     style={{ backgroundColor: "#8042D4", border: "none" }}
//                 >
//                     Kembali
//                 </button>
//                 <div className="gap-3 d-flex flex-column">
//                     {isLoading ? (
//                         <div
//                             className="d-flex justify-content-center"
//                             style={{ height: "100vh" }}
//                         >
//                             <Loading />
//                         </div>
//                     ) : (
//                         <>
//                             {/* Detail iklan */}
//                             <div className="d-flex flex-column gap-1">
//                                 <h4 className="fw-bold">Detail Iklan</h4>
//                                 <h5>{productData?.data[0].title}</h5>
//                             </div>

//                             {/* Peforma */}
//                             <div className="d-flex gap-1 flex-column">
//                                 <h4 className="fw-bold">Peforma</h4>
//                                 <div className="card d-flex flex-column p-2 gap-2">
//                                     {/* Ads Performance */}
//                                     <div className="d-flex flex-column gap-1">
//                                         <div className="d-flex gap-3 flex-column rounded p-2">
//                                             {/* Header & Date filter */}
//                                             <div className="d-flex justify-content-between">
//                                                 <h5 className="fw-bold">Keyword</h5>
//                                                 <div style={{ position: "relative" }}>
//                                                     <button
//                                                         onClick={toggleOpenCalendar}
//                                                         className="btn btn-primary"
//                                                     >
//                                                         {comparatorDate && comparedDate
//                                                         ? `${comparatorDate.toLocaleDateString("id-ID")} - ${comparedDate.toLocaleDateString("id-ID")}`
//                                                         : (typeof date === 'string' ? date : (Array.isArray(date) ? "1 Minggu terakhir" : "Pilih Tanggal"))}
//                                                     </button>
//                                                     {showCalendar && (
//                                                         <div
//                                                         className={`card custom-calendar-behavior ${animateCalendar ? "show" : ""}`}>
//                                                         <div className="custom-content-calendar d-flex flex-column py-2 px-1">
//                                                             <p onClick={() => handleDateSelection(new Date().toISOString().split("T")[0], "hari_ini")}>Hari ini</p>
//                                                             <p
//                                                             onClick={() => {
//                                                                 const yesterday = new Date();
//                                                                 yesterday.setDate(yesterday.getDate() - 1);
//                                                                 handleDateSelection(yesterday.toISOString().split("T")[0], "kemarin");
//                                                             }}
//                                                             >
//                                                             Kemarin
//                                                             </p>
//                                                             <p onClick={() => handleDateSelection(getAllDaysInLast7Days(), "minggu_ini")}>1 Minggu terakhir</p>
//                                                             <p onClick={() => handleDateSelection("Bulan Ini", "bulan_ini")}>Bulan ini</p>
//                                                         </div>
//                                                         {/* Kalender pembanding */}
//                                                         <div>
//                                                             <p>Tanggal Pembanding</p>
//                                                             <Calendar onChange={(date) => setComparatorDate(date)} value={comparatorDate} maxDate={comparedDate || new Date(2100, 0, 1)} />
//                                                         </div>
//                                                         {/* Kalender dibanding */}
//                                                         <div>
//                                                             <p>Tanggal Dibanding</p>
//                                                             <Calendar onChange={(date) => setComparedDate(date)} value={comparedDate} minDate={comparatorDate || new Date()} />
//                                                         </div>
//                                                         {/* Confirm button for date range */}
//                                                         <div id="custom-calendar-behavior-button" className="d-flex align-items-end mb-1">
//                                                             <button
//                                                             className="btn btn-primary"
//                                                             onClick={handleComparisonDatesConfirm}
//                                                             disabled={!comparatorDate || !comparedDate}
//                                                             >
//                                                             Terapkan
//                                                             </button>
//                                                         </div>
//                                                         </div>
//                                                     )}
//                                                 </div>
//                                             </div>
//                                             {/* Matric filter */}
//                                             <div className="d-flex flex-column gap-3">
//                                                 <div className="row g-3">
//                                                     {Object.keys(metrics).map((metricKey) => (
//                                                         <div
//                                                             className="col-12 col-sm-6 col-lg-3"
//                                                             key={metricKey}
//                                                         >
//                                                             <div
//                                                                 className="card shadow-md px-2 py-1 h-100"
//                                                                 style={handleStyleMatricButton(metricKey)}
//                                                                 onClick={() => handleMetricFilter(metricKey)}
//                                                             >
//                                                                 <strong style={{ color: "#5d7186" }}>
//                                                                     {metrics[metricKey].label}
//                                                                 </strong>
//                                                                 <span className="card-text fs-4 fw-bold">
//                                                                 {
//                                                                     metrics[metricKey].type === "currency"
//                                                                     ? <span>{formatMetricValue(metricsTotals[metricKey])}</span>
//                                                                     : metrics[metricKey].type === "percentage"
//                                                                         ? <span>{Number(metricsTotals[metricKey]).toFixed(2)}%</span>
//                                                                         : <span>{Number(metricsTotals[metricKey]).toFixed(2)}</span>
//                                                                 }
//                                                                 </span>
//                                                             </div>
//                                                         </div>
//                                                     ))}
//                                                 </div>
//                                             </div>
//                                             {/* Chart */}
//                                             <div
//                                                 ref={chartRef}
//                                                 style={{ width: "100%", height: "300px" }}
//                                             ></div>
//                                         </div>
//                                     </div>

//                                     <table className="table table-centered">
//                                         <thead className="table-light">
//                                             <tr>
//                                                 {keywordsData.length !== 0 &&
//                                                     keywordsData !== null && <th scope="col">No</th>}
//                                                 {allColumns
//                                                     .filter((col) =>
//                                                         selectedColumns.includes(col.key)
//                                                     )
//                                                     .map((col) => (
//                                                         <th key={col.key}>
//                                                             <div className="d-flex justify-content-start align-items-center">
//                                                                 {col.label}
//                                                             </div>
//                                                         </th>
//                                                     ))}
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {hasKeywords || keywordsData.length !== 0 ? (
//                                                 keywordsData?.map((entry, index) => (
//                                                     <>
//                                                         <tr key={index}>
//                                                             {keywordsData.length > 0 &&
//                                                                 keywordsData !== null && (
//                                                                     <td>{index + 1}</td>
//                                                                 )}
//                                                             {selectedColumns.includes("keywords") && (
//                                                                 <td style={{ width: "200px" }}>
//                                                                     <span>{entry.key}</span>
//                                                                 </td>
//                                                             )}
//                                                             {selectedColumns.includes("cpc") && (
//                                                                 <td style={{ width: "200px" }}>
//                                                                     <span>{entry.cpc}</span>
//                                                                 </td>
//                                                             )}
//                                                             {selectedColumns.includes("impression") && (
//                                                                 <td style={{ width: "200px" }}>
//                                                                     <span>{entry.impression}</span>
//                                                                 </td>
//                                                             )}
//                                                             {selectedColumns.includes("click") && (
//                                                                 <td style={{ width: "200px" }}>
//                                                                     <span>{entry.click}</span>
//                                                                 </td>
//                                                             )}
//                                                             {selectedColumns.includes("acos") && (
//                                                                 <td style={{ width: "200px" }}>
//                                                                     <span>{entry.acos}</span>
//                                                                 </td>
//                                                             )}
//                                                         </tr>
//                                                     </>
//                                                 ))
//                                             ) : (
//                                                 <div className="w-100 d-flex justify-content-center">
//                                                     <span>Produk tidak mempunyai keyword</span>
//                                                 </div>
//                                             )}
//                                         </tbody>
//                                     </table>
//                                 </div>
//                             </div>
//                         </>
//                     )}
//                 </div>
//             </BaseLayout>
//         </>
//     );
// };


// {/* Other filter*/}
// <div className="d-flex flex-column mb-3 gap-2">
//     <div id="container-other-filters" className="d-flex w-full justify-content-between align-items-start">
//         <div id="container-other-filters-left" className="d-flex gap-2 flex-wrap">
//         {/* search bar */}
//         <div className="custom-filter-search">
//             <input
//             type="text"
//             className="form-control"
//             placeholder="Cari berdasarkan nama"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             />
//         </div>
//         {/* type placement filter */}
//         {isTypeManualProductSelected && (
//             <div className="custom-filter-typePlacement">
//             <Select
//                 options={placementOptions}
//                 value={selectedOptionPlacement}
//                 onChange={handlePlacementChange}
//                 placeholder="Pilih Penempatan"
//             />
//             </div>
//         )}
//         {/* ads filter */}
//         <div className="custom-filter-typeAds">
//             <Select
//             isMulti
//             options={typeAdsOptions}
//             value={selectedTypeAds}
//             onChange={handleAdsChange}
//             placeholder="Pilih Tipe Iklan"
//             isClearable={false}
//             />
//         </div>
//         {/* clasification filter */}
//         <div className="custom-filter-salesClassification">
//             <Select
//             isMulti
//             options={typeClasificationOptions}
//             value={selectedClassificationOption}
//             onChange={handleClassificationChange}
//             placeholder="Filter Klasifikasi"
//             />
//         </div>
//         </div>
//         {/* Column filter */}
//         <div id="container-other-filters-right">
//         <button
//             className="btn btn-primary dropdown-toggle w-100"
//             type="button"
//             onClick={() => setShowTableColumn(!showTableColumn)}
//         >
//             Pilih kriteria
//         </button>
//         </div>
//     </div>
//     {showTableColumn && (
//         <div className="border px-2 rounded">
//         {allColumns.map((col) => (
//             <div key={col.key} className="form-check form-check-inline py-1">
//             <input
//                 style={{
//                 border: "1px solid #8042D4",
//                 width: "18px",
//                 height: "18px",
//                 borderRadius: "10%",
//                 }}
//                 className="form-check-input "
//                 type="checkbox"
//                 checked={selectedColumns.includes(col.key)}
//                 onChange={() => handleColumnChange(col.key)}
//             />
//             {
//                 <span className="text-secondary" style={{ fontSize: "12px" }}>
//                 {col.label}
//                 </span>
//             }
//             </div>
//         ))}
//         </div>
//     )}
// </div>