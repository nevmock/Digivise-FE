// import React, { useState, useEffect, useRef } from "react";
// import { Link } from "react-router-dom";
// import Select from "react-select";
// import Calendar from "react-calendar";
// import * as echarts from "echarts";

// import useDebounce from "../../../hooks/useDebounce";


// const AdsTable = ({ data }) => {
//     const [searchTerm, setSearchTerm] = useState("");
//     const debouncedSearchTerm = useDebounce(searchTerm, 300);
//     const [filteredData, setFilteredData] = useState(data.data.entry_list);
//     const [selectedClassificationOption, setSelectedClassificationOption] = useState([]);
//     const [chartData, setChartData] = useState([]);
//     const [comparatorDate, setComparatorDate] = useState(null);
//     const [comaparedDate, setComaparedDate] = useState(null);
//     const [date, setDate] = useState(getAllDaysInLast7Days());
//     const [showCalendar, setShowCalendar] = useState(false);
//     const chartRef = useRef(null);
//     const [selectedProduct, setSelectedProduct] = useState(null);
//     const [selectedMetrics, setSelectedMetrics] = useState(["daily_budget"]);
//     const [currentPage, setCurrentPage] = useState(1);
//     const [itemsPerPage, setItemsPerPage] = useState(20);
//     const [paginatedData, setPaginatedData] = useState([]);
//     const [totalPages, setTotalPages] = useState(1);
//     const [metricsTotals, setMetricsTotals] = useState({});


//     // Define metrics with their display names and colors
//     const metrics = {
//         daily_budget: {
//             label: "Biaya",
//             color: "#00B69A",
//             dataKey: "daily_budget"
//         },
//         impression: {
//             label: "Iklan Dilihat",
//             color: "#D50000",
//             dataKey: "impression"
//         },
//         click: {
//             label: "Click",
//             color: "#00B800",
//             dataKey: "click"
//         },
//     };

//     // Handle product click by clicking the product in name column
//     const handleProductClick = (product) => {
//         if (selectedProduct?.campaign.campaign_id === product.campaign.campaign_id) {
//             setSelectedProduct(null);
//         } else {
//             setSelectedProduct(product);
//         }
//     };

//     // Get all days in last 7 days in a month
//     function getAllDaysInLast7Days() {
//         return Array.from({ length: 7 }, (_, i) => {
//             const d = new Date();
//             d.setDate(d.getDate() - i);
//             return d.toISOString().split("T")[0];
//         }).reverse();
//     };

//     // Get all days in a month
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

//     // Get all hours in a day
//     function getHourlyIntervals(selectedDate) {
//         const datePart = selectedDate.includes(" ")
//             ? selectedDate.split(" ")[0]
//             : selectedDate;

//         return Array.from({ length: 24 }, (_, i) => {
//             const hour = String(i).padStart(2, "0");
//             return `${datePart} ${hour}:00`;
//         });
//     };

//     // Get all days in a date range
//     function getDateRangeIntervals(startDate, endDate) {
//         const start = startDate instanceof Date ? new Date(startDate) : new Date(startDate);
//         const end = endDate instanceof Date ? new Date(endDate) : new Date(endDate);

//         start.setHours(0, 0, 0, 0);
//         end.setHours(23, 59, 59, 999);

//         const dateArray = [];

//         const diffTime = Math.abs(end - start);
//         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

//         if (diffDays <= 1) {
//             return getHourlyIntervals(start.toISOString().split('T')[0]);
//         }

//         let currentDate = new Date(start);
//         while (currentDate <= end) {
//             dateArray.push(currentDate.toISOString().split('T')[0]);
//             currentDate.setDate(currentDate.getDate() + 1);
//         }

//         return dateArray;
//     };

//     function filterDataByDate(dataList, selectedDate) {
//         let timeIntervals = [];
//         let isSingleDay = false;

//         if (comparatorDate && comaparedDate) {
//             const sameDay = comparatorDate.toDateString() === comaparedDate.toDateString();

//             if (sameDay) {
//                 const dateStr = comparatorDate.toISOString().split('T')[0];
//                 timeIntervals = getHourlyIntervals(dateStr);
//                 isSingleDay = true;
//             } else {
//                 timeIntervals = getDateRangeIntervals(comparatorDate, comaparedDate);
//             }
//         } else if (selectedDate === null || Array.isArray(selectedDate)) {
//             timeIntervals = getAllDaysInLast7Days();
//         } else if (selectedDate === "Bulan Ini") {
//             timeIntervals = getAllDaysInAMonth();
//         } else {
//             timeIntervals = getHourlyIntervals(selectedDate);
//             isSingleDay = true;
//         }

//         if (!timeIntervals || timeIntervals.length === 0) {
//             timeIntervals = [new Date().toISOString().split('T')[0]];
//         }

//         return dataList.filter(product => {
//             const productDate = new Date(product.campaign.start_time * 1000);

//             if (isSingleDay) {
//                 const productYear = productDate.getFullYear();
//                 const productMonth = String(productDate.getMonth() + 1).padStart(2, "0");
//                 const productDay = String(productDate.getDate()).padStart(2, "0");
//                 const productHour = String(productDate.getHours()).padStart(2, "0");
//                 const dateHourKey = `${productYear}-${productMonth}-${productDay} ${productHour}:00`;

//                 return timeIntervals.includes(dateHourKey);
//             } else {
//                 const productYear = productDate.getFullYear();
//                 const productMonth = String(productDate.getMonth() + 1).padStart(2, "0");
//                 const productDay = String(productDate.getDate()).padStart(2, "0");
//                 const dateDayKey = `${productYear}-${productMonth}-${productDay}`;

//                 return timeIntervals.includes(dateDayKey);
//             }
//         });
//     };

//     // Generate chart data for multiple metrics
//     function generateMultipleMetricsChartData(selectedDate = null, product = null, selectedMetrics = ["visitor"]) {
//         let timeIntervals = [];
//         let mode = "daily";
//         let result = {};
//         let isSingleDay = false;

//         if (comparatorDate && comaparedDate) {
//             const sameDay = comparatorDate.toDateString() === comaparedDate.toDateString();

//             if (sameDay) {
//                 const dateStr = comparatorDate.toISOString().split('T')[0];
//                 timeIntervals = getHourlyIntervals(dateStr);
//                 mode = "hourly";
//                 isSingleDay = true;
//             } else {
//                 timeIntervals = getDateRangeIntervals(comparatorDate, comaparedDate);
//                 mode = timeIntervals.length <= 24 ? "hourly" : "daily";
//             }
//         } else if (selectedDate === null || Array.isArray(selectedDate)) {
//             timeIntervals = getAllDaysInLast7Days();
//         } else if (selectedDate === "Bulan Ini") {
//             timeIntervals = getAllDaysInAMonth();
//         } else {
//             timeIntervals = getHourlyIntervals(selectedDate);
//             mode = "hourly";
//             isSingleDay = true;
//         }

//         if (!timeIntervals || timeIntervals.length === 0) {
//             timeIntervals = [new Date().toISOString().split('T')[0]];
//         }

//         result.timeIntervals = timeIntervals;
//         result.isSingleDay = isSingleDay;
//         result.series = [];

//         // Filter data berdasarkan tanggal terlebih dahulu
//         let dateFilteredData = filterDataByDate(data.data.entry_list, selectedDate);

//         // Kemudian filter berdasarkan produk jika ada
//         let filteredProducts = dateFilteredData;
//         if (product) {
//             filteredProducts = dateFilteredData.filter((p) => p.campaign.campaign_id === product.campaign.campaign_id);
//         }
//         // let filteredProducts = data.data.entry_list;
//         // if (product) {
//         //   filteredProducts = data.data.entry_list.filter((p) => p.campaign.campaign_id === product.campaign.campaign_id);
//         // }

//         // Calculate totals for each metric
//         const totals = {};
//         Object.keys(metrics).forEach(metricKey => {
//             totals[metricKey] = 0;

//             filteredProducts.forEach(product => {
//                 const dataKey = metrics[metricKey].dataKey;
//                 if (dataKey === "daily_budget") {
//                     totals[metricKey] += product.campaign[dataKey] || 0;
//                 } else {
//                     totals[metricKey] += product.report[dataKey] || 0;
//                 }
//             });
//         });

//         // Set totals to state
//         setMetricsTotals(totals);

//         selectedMetrics?.forEach(metricKey => {
//             const metric = metrics[metricKey];
//             if (!metric) return;

//             const dataKey = metric.dataKey;
//             let dataMap = {};

//             timeIntervals.forEach((time) => {
//                 dataMap[time] = 0;
//             });

//             filteredProducts?.forEach((product) => {
//                 const productDate = new Date(product.campaign.start_time * 1000);

//                 if (isSingleDay) {
//                     const hourKey = String(productDate.getHours()).padStart(2, "0");

//                     const productYear = productDate.getFullYear();
//                     const productMonth = String(productDate.getMonth() + 1).padStart(2, "0");
//                     const productDay = String(productDate.getDate()).padStart(2, "0");
//                     const dateHourKey = `${productYear}-${productMonth}-${productDay} ${hourKey}:00`;

//                     if (timeIntervals.includes(dateHourKey)) {
//                         if (dataKey === "daily_budget") {
//                             dataMap[dateHourKey] += product.campaign[dataKey] || 0;
//                         } else {
//                             dataMap[dateHourKey] += product.report[dataKey] || 0;
//                         }
//                     }
//                 } else {
//                     const productYear = productDate.getFullYear();
//                     const productMonth = String(productDate.getMonth() + 1).padStart(2, "0");
//                     const productDay = String(productDate.getDate()).padStart(2, "0");
//                     const dateDayKey = `${productYear}-${productMonth}-${productDay}`;

//                     if (timeIntervals.includes(dateDayKey)) {
//                         if (dataKey === "daily_budget") {
//                             dataMap[dateDayKey] += product.campaign[dataKey] || 0;
//                         } else {
//                             dataMap[dateDayKey] += product.report[dataKey] || 0;
//                         }
//                     }
//                 }
//             });

//             const seriesData = {
//                 name: metric.label,
//                 data: timeIntervals.map((time) => dataMap[time] || 0),
//                 color: metric.color
//             };

//             result.series.push(seriesData);
//         });

//         return result;
//     };

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

//     function handleDateSelection(selectedDateOption) {
//         setComparatorDate(null);
//         setComaparedDate(null);
//         setDate(selectedDateOption);
//     };

//     function handleComparisonDatesConfirm() {
//         if (comparatorDate && comaparedDate) {
//             setDate(null);
//             setShowCalendar(false);
//         }
//     };

//     useEffect(() => {
//         const chartData = generateMultipleMetricsChartData(date, selectedProduct, selectedMetrics);
//         setChartData(chartData);
//     }, [date, selectedProduct, selectedMetrics, comparatorDate, comaparedDate, data.data.entry_list]);

//     useEffect(() => {
//         if (chartRef.current) {
//             const chartInstance = echarts.init(chartRef.current);

//             const series = chartData.series?.map(s => ({
//                 name: s.name,
//                 type: 'line',
//                 smooth: true,
//                 showSymbol: false,
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

//             let leftGrid;
//             if (selectedMetrics.length == 1 && (selectedMetrics.includes("daily_budget") || selectedMetrics.includes("impression"))) {
//                 leftGrid = 80;
//             } else if (selectedMetrics.length > 1 && selectedMetrics.includes("impression")) {
//                 leftGrid = 80;
//             } else {
//                 leftGrid = 50;
//             }

//             let xAxisData = chartData?.timeIntervals || [];
//             const isSingleDay = chartData?.isSingleDay || false;

//             if (isSingleDay) {
//                 // Extract only the time portion (HH:00) for hourly view
//                 xAxisData = xAxisData.map(interval => {
//                     if (!interval) return "";
//                     if (interval.includes(" ")) {
//                         return interval.split(" ")[1]; // Return only the time part
//                     }
//                     return interval;
//                 });
//             } else {
//                 // For multi-day view, normalize date formats first
//                 xAxisData = xAxisData.map(date => {
//                     if (!date) return "";
//                     // If it contains a space (has time component), take only the date part
//                     if (date.includes(" ")) {
//                         return date.split(" ")[0];
//                     }
//                     return date;
//                 });

//                 // Format multi-day dates to show just month-day
//                 xAxisData = xAxisData.map(data => {
//                     if (!data) return "";
//                     const parts = data.split("-");
//                     if (parts.length >= 3) {
//                         return `${parts[1]}-${parts[2]}`;  // month-day format
//                     }
//                     return data;
//                 });
//             };

//             let rotateAxisLabel = 0;
//             if (!isSingleDay) {
//                 if (xAxisData?.length > 7 && xAxisData?.length <= 20) {
//                     rotateAxisLabel = 30;
//                 } else if (xAxisData?.length > 20) {
//                     rotateAxisLabel = 40;
//                 }
//             };

//             for (let i = 0; i < series.length; i++) {
//                 if (series[i].name == "Biaya") {
//                     series[i].data = series[i].data.map((value) => {
//                         if (value > 0) {
//                             return value / 100000;
//                         }
//                         return 0;
//                     });
//                 }
//             };

//             const option = {
//                 toolbox: { feature: { saveAsImage: {} } },
//                 grid: {
//                     left: leftGrid,
//                     right: 50,
//                     bottom: 50,
//                     containLabel: false
//                 },
//                 tooltip: {
//                     trigger: "axis",
//                     formatter: function (params) {
//                         let result = params[0].axisValue + '<br/>';
//                         params.forEach(param => {
//                             result += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${param.color};"></span> ${param.seriesName}: ${param.value}<br/>`;
//                         });
//                         return result;
//                     }
//                 },
//                 legend: {
//                     data: chartData.series?.map(s => s.name) || [],
//                     bottom: 0
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

//             if (!hasData && (comparatorDate && comaparedDate)) {
//                 option.graphic = [
//                     {
//                         type: 'text',
//                         left: 'center',
//                         top: 'middle',
//                         style: {
//                             text: 'Tidak ada data untuk rentang waktu yang dipilih',
//                             fontSize: 16,
//                             fill: '#999',
//                             fontWeight: 'bold'
//                         }
//                     }
//                 ];
//             }

//             chartInstance.setOption(option);
//             return () => chartInstance.dispose();
//         }
//     }, [chartData, selectedMetrics]);



//     // FILTER COLUMNS FEATURE
//     // Define all columns
//     const allColumns = [
//         { key: "info_iklan", label: "Info iklan" },
//         { key: "biaya", label: " Biaya" },
//         { key: "iklan_dilihat", label: "Iklan Dilihat" },
//         { key: "click", label: "Click" },
//         { key: "ctr", label: "CTR" },
//     ];

//     // Initialize selected columns state
//     const [selectedColumns, setSelectedColumns] = useState(
//         allColumns.map((col) => col.key)
//     );

//     useEffect(() => {
//         let filtered = data.data.entry_list;
//         // Filter by search term
//         if (debouncedSearchTerm !== "") {
//             filtered = data.data.entry_list.filter((entry) =>
//                 entry.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
//             );
//         };

//         setCurrentPage(1);
//         setFilteredData(filtered);
//     }, [
//         debouncedSearchTerm,
//         data.data.entry_list,
//     ]);

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

//     const getPageNumbers = () => {
//         const pageNumbers = [];
//         for (let i = 1; i <= totalPages; i++) {
//             pageNumbers.push(i);
//         }
//         return pageNumbers;
//     };

//     const renderPagination = () => {
//         const pageNumbers = getPageNumbers();
//         return (
//             <div className="d-flex justify-content-between align-items-center mt-3">
//                 {/* Items per page dropdown */}
//                 <nav aria-label="Page navigation">
//                     <ul className="pagination mb-0">
//                         {/* Previous button */}
//                         {/* Page numbers */}
//                         {/* Next button */}
//                     </ul>
//                 </nav>
//             </div>
//         );
//     };


//     // SALES CLASSIFICATION FEATURE
//     // Define sales classification options
//     const typeClasificationOptions = [
//         { value: "best_seller", label: "Best Seller" },
//         { value: "middle_moving", label: "Middle Moving" },
//         { value: "slow_moving", label: "Slow Moving" },
//     ];

//     const handleClassificationChange = (selectedOptions) => {
//         setSelectedClassificationOption(selectedOptions);
//     };

//     // Handle style for matric filter button
//     const handleStyleMatricButton = (metricKey) => {
//         const isActive = selectedMetrics.includes(metricKey);
//         const metric = metrics[metricKey];

//         return {
//             backgroundColor: "#ffffff00",
//             border: `1px solid ${isActive ? metric.color : "rgb(179.4, 184.2, 189)"}`,
//             color: isActive ? metric.color : "#666666",
//             padding: "6px 12px",
//             borderRadius: "8px",
//             cursor: "pointer",
//             fontSize: "12px",
//             fontWeight: isActive ? "medium" : "normal",
//             transition: "all 0.3s ease"
//         };
//     };

//     function calculateMetricTotals(filteredProducts) {
//         const totals = {};

//         // Inisialisasi totals untuk setiap metrik yang ada
//         Object.keys(metrics).forEach(metricKey => {
//             totals[metricKey] = 0;
//         });

//         // Hitung total untuk setiap metrik berdasarkan data yang sudah difilter
//         filteredProducts.forEach(product => {
//             // Untuk metrik daily_budget
//             if (product.campaign.daily_budget) {
//                 totals.daily_budget += product.campaign.daily_budget;
//             }

//             // Untuk metrik impression dan metrik lainnya yang ada di report
//             Object.keys(metrics).forEach(metricKey => {
//                 const dataKey = metrics[metricKey].dataKey;
//                 if (dataKey !== 'daily_budget' && product.report[dataKey]) {
//                     totals[metricKey] += product.report[dataKey];
//                 }
//             });
//         });

//         return totals;
//     }

//     useEffect(() => {
//         // Hitung total metrik dari data yang sudah difilter
//         const totals = calculateMetricTotals(filteredData);
//         setMetricsTotals(totals);
//     }, [filteredData]);

//     const formatMetricValue = (metricKey, value) => {
//         if (metricKey === "daily_budget") {
//             return `Rp ${convertBudgetToIDR(value)}`;
//         }
//         return value?.toLocaleString() || "0";
//     };

//     return (
//         <div className="card-body">
//             {/* Date Filter */}
//             <div style={{ position: "relative" }}>
//                 <button
//                     onClick={() => setShowCalendar(!showCalendar)}
//                     className="btn btn-secondary"
//                     style={{ backgroundColor: "#8042D4", border: "none" }}
//                 >
//                     {comparatorDate && comaparedDate
//                         ? `${comparatorDate.toLocaleDateString("id-ID")} - ${comaparedDate.toLocaleDateString("id-ID")}`
//                         : (typeof date === 'string' ? date : (Array.isArray(date) ? "1 Minggu terakhir" : "Pilih Tanggal"))}
//                 </button>
//                 {showCalendar && (
//                     <div
//                         className="d-flex"
//                     >
//                         <div>
//                             <p onClick={() => handleDateSelection(new Date().toISOString().split("T")[0])}>Hari ini</p>
//                             <p
//                                 onClick={() => {
//                                     const yesterday = new Date();
//                                     yesterday.setDate(yesterday.getDate() - 1);
//                                     handleDateSelection(yesterday.toISOString().split("T")[0]);
//                                 }}
//                             >
//                                 Kemarin
//                             </p>
//                             <p onClick={() => handleDateSelection(getAllDaysInLast7Days())}>1 Minggu terakhir</p>
//                             <p onClick={() => handleDateSelection("Bulan Ini")}>Bulan ini</p>
//                         </div>
//                         <div style={{ width: "1px", height: "auto", backgroundColor: "#E3E3E3FF", margin: "10px 0" }}></div>
//                         {/* Kalender pembanding */}
//                         <div>
//                             <p>Tanggal Pembanding</p>
//                             <Calendar onChange={(date) => setComparatorDate(date)} value={comparatorDate} maxDate={comaparedDate || new Date(2100, 0, 1)} />
//                         </div>
//                         {/* Kalender dibanding */}
//                         <div>
//                             <p>Tanggal Dibanding</p>
//                             <Calendar onChange={(date) => setComaparedDate(date)} value={comaparedDate} minDate={comparatorDate || new Date()} />
//                         </div>
//                         {/* Confirm button for date range */}
//                         <div className="d-flex align-items-end mb-1">
//                             <button
//                                 className="btn btn-primary"
//                                 onClick={handleComparisonDatesConfirm}
//                                 disabled={!comparatorDate || !comaparedDate}
//                             >
//                                 Terapkan
//                             </button>
//                         </div>
//                     </div>
//                 )}
//             </div>
//             <div className="d-flex flex-column gap-3">
//                 {/* Matric filter */}
//                 <div className="row g-3 justify-content-center">
//                     {Object.keys(metrics).map((metricKey) => (
//                         <div className="col-12 col-md-6 col-lg-2">
//                             <div
//                                 className="card border-light shadow-sm h-100 p-2"
//                                 style={handleStyleMatricButton(metricKey)}
//                                 onClick={() => handleMetricFilter(metricKey)}
//                                 key={metricKey}
//                             >
//                                 <h6 className="card-title">
//                                     {metrics[metricKey].label}
//                                 </h6>
//                                 <span className="card-text fs-4 fw-bold">
//                                     {formatMetricValue(metricKey, metricsTotals[metricKey])}
//                                 </span>
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//                 <div ref={chartRef} style={{ width: "100%", height: "300px" }}></div>
//                 {/* Other filter*/}
//                 <div className="d-flex flex-column mb-3 gap-2">
//                     {/* search bar */}
//                     <div className="custom-filter-search">
//                         <input
//                             type="text"
//                             className="form-control"
//                             placeholder="Cari berdasarkan nama"
//                             onChange={(e) => setSearchTerm(e.target.value)}
//                         />
//                     </div>
//                     {/* clasification filter */}
//                     <div className="custom-filter-salesClassification">
//                         <Select
//                             isMulti
//                             options={typeClasificationOptions}
//                             value={selectedClassificationOption}
//                             onChange={handleClassificationChange}
//                         />
//                     </div>
//                 </div>
//                 <table className="table table-centered">
//                     <thead className="table-light">
//                         <tr>
//                             {filteredData.length !== 0 && filteredData !== null && <th scope="col">No</th>}
//                             {allColumns
//                                 .filter((col) => selectedColumns.includes(col.key))
//                                 .map((col) => (
//                                     <th key={col.key}>
//                                         <div className="d-flex justify-content-start align-items-center">
//                                             {col.label}
//                                         </div>
//                                     </th>
//                                 ))}
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {paginatedData.length !== 0 && paginatedData !== null ? (
//                             paginatedData?.map((entry, index) => (
//                                 <>
//                                     <tr key={entry.campaign.campaign_id}>
//                                         {filteredData.length > 0 && filteredData !== null && (
//                                             <td>{index + 1}</td>
//                                         )}
//                                         {selectedColumns.includes("info_iklan") && (
//                                             <td
//                                                 className="d-flex gap-2"
//                                                 style={{
//                                                     color:
//                                                         selectedProduct?.campaign.campaign_id === entry.campaign.campaign_id
//                                                             ? "#F6881F"
//                                                             : "",
//                                                 }}
//                                                 onClick={() => handleProductClick(entry)}
//                                             >
//                                                 <div className="d-flex flex-column">
//                                                     <span>{entry.title}</span>
//                                                 </div>
//                                             </td>
//                                         )}
//                                         {selectedColumns.includes("biaya") && (
//                                             <td style={{ width: "200px" }}>
//                                                 <div className="d-flex flex-column">
//                                                     <span>
//                                                         Rp {convertBudgetToIDR(entry.campaign.daily_budget)}
//                                                     </span>
//                                                     <span className="text-success" style={{ fontSize: "10px" }}>
//                                                         +12.7%
//                                                     </span>
//                                                 </div>
//                                             </td>
//                                         )}
//                                         {selectedColumns.includes("iklan_dilihat") && (
//                                             <td style={{ width: "200px" }}>
//                                                 <div className="d-flex flex-column">
//                                                     <span>{entry.report.impression}</span>
//                                                     <span className="text-danger" style={{ fontSize: "10px" }}>
//                                                         -102.7%
//                                                     </span>
//                                                 </div>
//                                             </td>
//                                         )},
//                                         DAN DATA LAINNYA DIBAWAH
//                                     </tr>
//                                 </>
//                             ))
//                         ) : (
//                             <div className="w-100 d-flex justify-content-center">
//                                 <span>Data tidak tersedia</span>
//                             </div>
//                         )}
//                     </tbody>
//                 </table>
//                 {filteredData.length > 0 && filteredData !== null && renderPagination()}
//             </div>
//         </div>
//     );
// };

// export default AdsTable;