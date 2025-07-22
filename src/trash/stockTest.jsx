// import React, { useState, useEffect, useCallback, useRef } from "react";
// import { createPortal } from 'react-dom';
// import * as echarts from "echarts";
// import Calendar from "react-calendar";
// import Select from "react-select";
// import toast from "react-hot-toast";
// import { FaAngleLeft, FaAngleRight, FaAngleDown, FaAngleUp } from "react-icons/fa6";
// import { AiOutlineQuestionCircle } from "react-icons/ai";

// import axiosRequest from "../../utils/request";
// import useDebounce from "../../hooks/useDebounce";
// import formatStyleSalesClassification from "../../utils/convertFormatSalesClassification";
// import formatTableValue from "../../utils/formatTableValue";
// import BaseLayout from "../../components/organisms/BaseLayout";
// import Loading from "../../components/atoms/Loading/Loading";


// export default function PerformanceStockPage() {
//     // Data
//     const [chartRawData, setChartRawData] = useState([]);
//     const [filteredData, setFilteredData] = useState([]);
//     const [chartData, setChartData] = useState([]);
//     const chartRef = useRef(null);
//     const [variantsChartData, setVariantsChartData] = useState([]);
//     const chartInstanceRef = useRef(null);
//     const [allSortedData, setAllSortedData] = useState([]);
//     // Filter
//     const [date, setDate] = useState(getAllDaysInLast7Days());
//     const [dateRange, setDateRange] = useState([null, null]);
//     const [dateMode, setDateMode] = useState('preset');
//     const [selectedProduct, setSelectedProduct] = useState(null);
//     const [showTableColumn, setShowTableColumn] = useState(false);
//     const [selectedClassificationOption, setSelectedClassificationOption] =
//         useState([]);
//     const [expandedVariantProduct, setExpandedVariantProduct] = useState({});
//     const [sortOrderData, setSortOrderData] = useState(null);
//     const [searchTerm, setSearchTerm] = useState("");
//     const debouncedSearchTerm = useDebounce(searchTerm, 500);
//     const [currentPage, setCurrentPage] = useState(1);
//     const [itemsPerPage, setItemsPerPage] = useState(20);
//     const [totalPages, setTotalPages] = useState(1);
//     const [totalElements, setTotalElements] = useState(0);
//     // Other
//     const [showCalendar, setShowCalendar] = useState(false);
//     const [animateCalendar, setAnimateCalendar] = useState(false);
//     const [isLoading, setIsLoading] = useState(false);
//     const [isContentLoading, setIsContentLoading] = useState(false);
//     const [isTableFilterLoading, setIsTableFilterLoading] = useState(false);
//     const [isSortingMode, setIsSortingMode] = useState(false);

//     const getShopeeId = localStorage.getItem("shopeeId");
//     if (getShopeeId == null || getShopeeId === null || getShopeeId === "null" || getShopeeId === "undefined") {
//         return (
//             <BaseLayout>
//                 <div className="alert alert-warning">
//                     Tidak ada merchant aktif. Silahkan buat merchant atau login ke merchant terlebih dahulu.
//                 </div>
//             </BaseLayout>
//         );
//     };



//     // CUSTOM CHART WITH FILTER DATE & CLICK PRODUCT FEATURE
//     function getAllDaysInLast7Days() {
//         const getLocalDateString = (date) => {
//             const year = date.getFullYear();
//             const month = String(date.getMonth() + 1).padStart(2, '0');
//             const day = String(date.getDate()).padStart(2, '0');
//             return `${year}-${month}-${day}`;
//         };

//         const today = new Date();
//         return Array.from({ length: 7 }, (_, i) => {
//             const d = new Date(today);
//             d.setDate(today.getDate() - i);
//             return getLocalDateString(d);
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

//     function getDateRangeIntervals(startDate, endDate) {
//         const getLocalDateString = (date) => {
//             const year = date.getFullYear();
//             const month = String(date.getMonth() + 1).padStart(2, '0');
//             const day = String(date.getDate()).padStart(2, '0');
//             return `${year}-${month}-${day}`;
//         };

//         const start = startDate instanceof Date ? new Date(startDate) : new Date(startDate);
//         const end = endDate instanceof Date ? new Date(endDate) : new Date(endDate);

//         start.setHours(0, 0, 0, 0);
//         end.setHours(23, 59, 59, 999);

//         const dateArray = [];

//         // Calculate the difference in days between start and end dates
//         const diffTime = Math.abs(end - start);
//         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

//         if (diffDays == 0) {
//             return getHourlyIntervals(getLocalDateString(start));
//         }

//         // Otherwise, return daily intervals
//         let currentDate = new Date(start);
//         while (currentDate <= end) {
//             dateArray.push(getLocalDateString(currentDate));
//             currentDate.setDate(currentDate.getDate() + 1);
//         }

//         return dateArray;
//     };

//     const toLocalISOString = (date) => {
//         const year = date.getFullYear();
//         const month = String(date.getMonth() + 1).padStart(2, '0');
//         const day = String(date.getDate()).padStart(2, '0');
//         const hours = String(date.getHours()).padStart(2, '0');
//         const minutes = String(date.getMinutes()).padStart(2, '0');
//         const seconds = String(date.getSeconds()).padStart(2, '0');
//         return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
//     };

//     const calculateComparisonDates = (fromDate, toDate) => {
//         const start = new Date(fromDate);
//         const end = new Date(toDate);

//         const durationMs = end.getTime() - start.getTime();

//         const from1 = new Date(start);
//         const to1 = new Date(end);

//         const from2 = new Date(start.getTime() - durationMs);
//         const to2 = new Date(start.getTime() - 1);

//         from1.setHours(0, 0, 0, 0);
//         to1.setHours(23, 59, 59, 999);
//         from2.setHours(0, 0, 0, 0);
//         to2.setHours(23, 59, 59, 999);

//         return { from1, to1, from2, to2 };
//     };

//     // const buildApiUrlWithComparison = (baseUrl, getShopeeId, fromDate, toDate, limit, page = null) => {
//     const buildApiUrlWithComparison = (baseUrl, getShopeeId, limit, page = null) => {
//         // const { from1, to1, from2, to2 } = calculateComparisonDates(fromDate, toDate);

//         // const from1ISO = toLocalISOString(from1);
//         // const to1ISO = toLocalISOString(to1);
//         // const from2ISO = toLocalISOString(from2);
//         // const to2ISO = toLocalISOString(to2);

//         let apiUrl = `${baseUrl}?shopId=${getShopeeId}&limit=${limit}`;

//         if (page !== null) {
//             const backendPage = Math.max(0, page - 1);
//             apiUrl += `&page=${backendPage}`;
//         }

//         return apiUrl;
//     };

//     const buildChartApiUrl = (baseUrl, getShopeeId, fromDate, toDate, limit) => {
//         const { from1, to1 } = calculateComparisonDates(fromDate, toDate);

//         const from1ISO = toLocalISOString(from1);
//         const to1ISO = toLocalISOString(to1);

//         const apiUrl = `${baseUrl}?shopId=${getShopeeId}&from=${from1ISO}&to=${to1ISO}&limit=${limit}`;

//         return apiUrl;
//     };



//     // const getCurrentDateRange = () => {
//     //   let fromDate, toDate;

//     //   switch (dateMode) {
//     //     case 'range':
//     //       if (dateRange[0] && dateRange[1]) {
//     //         fromDate = new Date(dateRange[0]);
//     //         toDate = new Date(dateRange[1]);
//     //       }
//     //       break;
//     //     case 'single':
//     //       if (date) {
//     //         fromDate = new Date(date);
//     //         toDate = new Date(date);
//     //       }
//     //       break;
//     //     case 'preset':
//     //     default:
//     //       if (Array.isArray(date)) {
//     //         fromDate = new Date(date[0]);
//     //         toDate = new Date(date[date.length - 1]);
//     //       } else if (date === "Bulan Ini") {
//     //         const today = new Date();
//     //         fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
//     //         toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
//     //       } else if (date) {
//     //         fromDate = new Date(date);
//     //         toDate = new Date(date);
//     //       } else {
//     //         const today = new Date();
//     //         fromDate = new Date();
//     //         fromDate.setDate(today.getDate() - 7);
//     //         toDate = today;
//     //       }
//     //       break;
//     //   }

//     //   if (fromDate && toDate) {
//     //     fromDate.setHours(0, 0, 0, 0);
//     //     toDate.setHours(23, 59, 59, 999);
//     //   }

//     //   return { fromDate, toDate };
//     // };

//     const fetchChartData = async (fromDate, toDate) => {
//         setIsLoading(true);

//         try {
//             let currentFromDate, currentToDate;

//             if (dateMode === 'range' && dateRange[0] && dateRange[1]) {
//                 currentFromDate = new Date(dateRange[0]);
//                 currentToDate = new Date(dateRange[1]);
//             } else {
//                 currentFromDate = fromDate instanceof Date ? fromDate : new Date(fromDate);
//                 currentToDate = toDate instanceof Date ? toDate : new Date(toDate);
//             }

//             const apiUrl = buildChartApiUrl(
//                 '/api/product-stock/chart',
//                 // '/api/product-stock/by-shop',
//                 getShopeeId,
//                 currentFromDate,
//                 currentToDate,
//                 100000
//             );

//             const response = await axiosRequest.get(apiUrl);
//             const data = response.data;
//             // const content = data.content || [];
//             const content = Array.isArray(data) ? data : [];

//             setChartRawData(content);

//             return content;
//         } catch (error) {
//             toast.error("Gagal mengambil data chart stock produk");
//             console.error('Gagal mengambil data chart stock produk, kesalahan pada server:', error);
//             return [];
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const fetchAllTableData = async (filters = {}) => {
//         setIsTableFilterLoading(true);

//         try {
//             let apiUrl = buildApiUrlWithComparison(
//                 '/api/product-stock/newest',
//                 getShopeeId,
//                 100000,
//                 0
//             );

//             if (filters.searchQuery && filters.searchQuery.trim() !== "") {
//                 apiUrl += `&name=${encodeURIComponent(filters.searchQuery.trim())}`;
//             }

//             if (filters.classification && filters.classification.length > 0) {
//                 const classificationValues = filters.classification.map(cls => cls.value);
//                 apiUrl += `&salesClassification=${classificationValues.join(",")}`;
//             }

//             const response = await axiosRequest.get(apiUrl);
//             const data = response.data;
//             const content = data.content || [];

//             setAllSortedData(content);
//             setTotalElements(data?.totalElements || 0);

//             return content;
//         } catch (error) {
//             toast.error("Gagal mengambil data tabel stock produk");
//             console.error('Gagal mengambil data tabel stock produk, kesalahan pada server:', error);
//             return [];
//         } finally {
//             setIsTableFilterLoading(false);
//         }
//     }

//     // const fetchTableData = async (fromDate, toDate, page = 1, filters = {}) => {
//     const fetchTableData = async (page = 1, filters = {}, customItemsPerPage = null) => {
//         setIsTableFilterLoading(true);

//         try {
//             // let currentFromDate, currentToDate;

//             // if (dateMode === 'range' && dateRange[0] && dateRange[1]) {
//             //   currentFromDate = new Date(dateRange[0]);
//             //   currentToDate = new Date(dateRange[1]);
//             // } else {
//             //   currentFromDate = fromDate instanceof Date ? fromDate : new Date(fromDate);
//             //   currentToDate = toDate instanceof Date ? toDate : new Date(toDate);
//             // }

//             const effectiveItemsPerPage = customItemsPerPage || itemsPerPage;

//             let apiUrl = buildApiUrlWithComparison(
//                 // '/api/product-stock/by-shop',
//                 '/api/product-stock/newest',
//                 getShopeeId,
//                 // currentFromDate,
//                 // currentToDate,
//                 effectiveItemsPerPage,
//                 page
//             );

//             if (filters.searchQuery && filters.searchQuery.trim() !== "") {
//                 apiUrl += `&name=${encodeURIComponent(filters.searchQuery.trim())}`;
//             }

//             // if (filters.statusFilter && filters.statusFilter !== "all") {
//             //   apiUrl += `&state=${filters.statusFilter}`;
//             // }

//             if (filters.classification && filters.classification.length > 0) {
//                 const classificationValues = filters.classification.map(cls => cls.value);
//                 apiUrl += `&salesClassification=${classificationValues.join(",")}`;
//             }


//             const response = await axiosRequest.get(apiUrl);
//             const data = response.data;
//             const content = data.content || [];

//             // setOriginalFilteredData(content);
//             setFilteredData(content);
//             setTotalPages(data?.totalPages || 1);
//             setTotalElements(data?.totalElements || 0);

//             return content;
//         } catch (error) {
//             toast.error("Gagal mengambil data tabel stock produk");
//             console.error('Gagal mengambil data tabel stock produk, kesalahan pada server:', error);
//             return [];
//         } finally {
//             setIsTableFilterLoading(false);
//         }
//     };

//     const applyFrontendPagination = (data, page, itemsPerPage) => {
//         const startIndex = (page - 1) * itemsPerPage;
//         const endIndex = startIndex + itemsPerPage;
//         const paginatedData = data.slice(startIndex, endIndex);
//         const totalPages = Math.ceil(data.length / itemsPerPage);

//         setFilteredData(paginatedData);
//         setTotalPages(totalPages);

//         return paginatedData;
//     };

//     const fetchData = async (fromDate, toDate, page = 1) => {
//         const isInitialLoad = !chartRawData.length;
//         if (isInitialLoad) {
//             setIsLoading(true);
//         } else {
//             setIsContentLoading(true);
//         }

//         try {
//             const currentFilters = {
//                 searchQuery: debouncedSearchTerm,
//                 // statusFilter: statusProductStockFilter,
//                 classification: selectedClassificationOption
//             };

//             await Promise.all([
//                 fetchChartData(fromDate, toDate),
//                 // fetchTableData(fromDate, toDate, page, currentFilters)
//                 // fetchTableData(page, currentFilters)
//                 isSortingMode ?
//                     fetchAllTableData(currentFilters) :
//                     fetchTableData(page, currentFilters)
//             ]);

//             if (isSortingMode && allSortedData.length > 0) {
//                 applyFrontendPagination(allSortedData, page, itemsPerPage);
//             }
//         } catch (error) {
//             toast.error("Gagal mengambil data stock produk");
//             console.error('Gagal mengambil data stock produk, kesalahan pada server:', error);
//         } finally {
//             setIsLoading(false);
//             setIsContentLoading(false);
//         }
//     };

//     const buildCurrentFilters = () => {
//         return {
//             searchQuery: debouncedSearchTerm,
//             // statusFilter: statusProductStockFilter,
//             classification: selectedClassificationOption,
//         };
//     };

//     const handleProductClick = (product) => {
//         // if (selectedProduct?.productId === product.productId) {
//         //   setSelectedProduct(null);
//         // } else {
//         //   setSelectedProduct(product);
//         // }
//         const productData = product.data && product.data[0] ? product.data[0] : product;
//         setSelectedProduct((prev) => (prev?.productId === productData.productId ? null : productData));
//         // setSelectedProduct((prev) => (prev?.productId === product.productId ? null : product));
//     };

//     function generateChartData(selectedDate = null, product = null) {
//         let timeIntervals = [];
//         let mode = "daily";
//         let result = {};
//         let fromDate, toDate;
//         let isSingleDay = false;

//         const getLocalDateString = (date) => {
//             const year = date.getFullYear();
//             const month = String(date.getMonth() + 1).padStart(2, "0");
//             const day = String(date.getDate()).padStart(2, "0");
//             return `${year}-${month}-${day}`;
//         };

//         if (dateMode === 'range' && dateRange[0] && dateRange[1]) {
//             timeIntervals = getDateRangeIntervals(dateRange[0], dateRange[1]);
//             fromDate = new Date(dateRange[0]);
//             toDate = new Date(dateRange[1]);
//             toDate.setHours(23, 59, 59, 999);
//             mode = "daily";
//         } else if (dateMode === 'single' && date) {
//             timeIntervals = getHourlyIntervals(date);
//             mode = "hourly";
//             isSingleDay = true;
//             fromDate = new Date(date);
//             toDate = new Date(date);
//             toDate.setHours(23, 59, 59, 999);
//         } else if (dateMode === 'preset') {
//             if (selectedDate === null || Array.isArray(selectedDate)) {
//                 timeIntervals = getAllDaysInLast7Days();
//                 fromDate = new Date(timeIntervals[0] + 'T00:00:00');
//                 toDate = new Date(timeIntervals[timeIntervals.length - 1] + 'T23:59:59');
//             } else if (selectedDate === "Bulan Ini") {
//                 timeIntervals = getAllDaysInAMonth();
//                 const today = new Date();
//                 fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
//                 toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
//                 fromDate.setHours(0, 0, 0, 0);
//                 toDate.setHours(23, 59, 59, 999);
//             } else {
//                 timeIntervals = getHourlyIntervals(selectedDate);
//                 mode = "hourly";
//                 isSingleDay = true;
//                 fromDate = new Date(selectedDate);
//                 toDate = new Date(selectedDate);
//                 toDate.setHours(23, 59, 59, 999);
//             }
//         }

//         const convertShopeeTimestampToDate = (timestamp) => {
//             return new Date(timestamp * 1000);
//         };

//         const getDataDate = (productData) => {
//             if (productData.shopeeFrom) {
//                 return convertShopeeTimestampToDate(productData.shopeeFrom);
//             } else if (productData.createdAt) {
//                 return new Date(productData.createdAt);
//             }
//             return null;
//         };

//         if (timeIntervals.length === 0 || !timeIntervals.length) {
//             timeIntervals = [new Date().toISOString().split("T")[0]];
//             fromDate = new Date();
//             toDate = new Date();
//             toDate.setHours(23, 59, 59, 999);
//         }

//         let chartDataProducts = chartRawData;
//         if (product) {
//             chartDataProducts = chartRawData.filter((p) => p.productId === product.productId);
//         }

//         let dataMap = {};

//         timeIntervals.forEach((time) => {
//             dataMap[time] = 0;
//         });

//         chartDataProducts?.forEach((productItem) => {
//             if (productItem.data.length === 0 || !productItem.data) return;

//             if (isSingleDay) {
//                 productItem.data.forEach((stockData) => {
//                     if (stockData.createdAt === null) return;

//                     const test = getDataDate(stockData);
//                     const createdAt = test;
//                     const productDateStr = getLocalDateString(createdAt);
//                     const filterDateStr = getLocalDateString(fromDate);

//                     if (productDateStr !== filterDateStr) return;

//                     const hourKey = String(createdAt.getHours()).padStart(2, "0");
//                     const productYear = createdAt.getFullYear();
//                     const productMonth = String(createdAt.getMonth() + 1).padStart(2, "0");
//                     const productDay = String(createdAt.getDate()).padStart(2, "0");

//                     const hourOnlyKey = `${productYear}-${productMonth}-${productDay} ${hourKey}:00`;

//                     if (timeIntervals.includes(hourOnlyKey)) {
//                         const stockValue = stockData.totalAvailableStock;
//                         if (stockValue !== null) {
//                             dataMap[hourOnlyKey] += Number(stockValue);
//                         }
//                     }
//                 });
//             } else {
//                 const dataByDate = {};

//                 productItem.data.forEach((stockData) => {
//                     if (stockData.createdAt === null) return;

//                     const test = getDataDate(stockData);
//                     const createdAt = test;
//                     const productYear = createdAt.getFullYear();
//                     const productMonth = String(createdAt.getMonth() + 1).padStart(2, "0");
//                     const productDay = String(createdAt.getDate()).padStart(2, "0");
//                     const dateDayKey = `${productYear}-${productMonth}-${productDay}`;

//                     const productDateStr = getLocalDateString(createdAt);
//                     const filterStartStr = getLocalDateString(fromDate);
//                     const filterEndStr = getLocalDateString(toDate);

//                     if (productDateStr >= filterStartStr && productDateStr <= filterEndStr) {
//                         if (!dataByDate[dateDayKey] ||
//                             new Date(dataByDate[dateDayKey].createdAt) < createdAt) {
//                             dataByDate[dateDayKey] = stockData;
//                         }
//                     }
//                 });

//                 Object.keys(dataByDate).forEach((dateDayKey) => {
//                     const stockData = dataByDate[dateDayKey];

//                     if (timeIntervals.includes(dateDayKey)) {
//                         const stockValue = stockData.totalAvailableStock;
//                         if (stockValue !== undefined && stockValue !== null) {
//                             dataMap[dateDayKey] += Number(stockValue);
//                         }
//                     }
//                 });
//             }
//         });

//         const chartDataArray = timeIntervals.map((time) => ({
//             date: time,
//             totalStock: dataMap[time] || 0
//         }));

//         return chartDataArray;
//     };

//     function generateVariantsChartData(selectedDate = null, product = null) {
//         if (!product) return [];

//         let timeIntervals = [];
//         let mode = "daily";
//         let variantsData = [];

//         const getLocalDateString = (date) => {
//             const year = date.getFullYear();
//             const month = String(date.getMonth() + 1).padStart(2, "0");
//             const day = String(date.getDate()).padStart(2, "0");
//             return `${year}-${month}-${day}`;
//         };

//         if (dateMode === 'range' && dateRange[0] && dateRange[1]) {
//             timeIntervals = getDateRangeIntervals(dateRange[0], dateRange[1]);
//             mode = "daily";
//         } else if (dateMode === 'single' && date) {
//             timeIntervals = getHourlyIntervals(date);
//             mode = "hourly";
//         } else if (dateMode === 'preset') {
//             if (selectedDate === null || Array.isArray(selectedDate)) {
//                 timeIntervals = getAllDaysInLast7Days();
//             } else if (selectedDate === "Bulan Ini") {
//                 timeIntervals = getAllDaysInAMonth();
//             } else {
//                 timeIntervals = getHourlyIntervals(selectedDate);
//                 mode = "hourly";
//             }
//         }

//         const convertShopeeTimestampToDate = (timestamp) => {
//             return new Date(timestamp * 1000);
//         };

//         const getDataDate = (productData) => {
//             if (productData.shopeeFrom) {
//                 return convertShopeeTimestampToDate(productData.shopeeFrom);
//             } else if (productData.createdAt) {
//                 return new Date(productData.createdAt);
//             }
//             return null;
//         };

//         const selectedProductData = chartRawData.find((p) => p.productId === product.productId);
//         if (!selectedProductData || !selectedProductData.data) return [];

//         // Check if product has variants in its data
//         const allVariants = new Map();
//         selectedProductData?.data.forEach((stockData) => {
//             if (stockData?.modelStock) {
//                 stockData.modelStock.forEach((variant) => {
//                     if (!allVariants.has(variant.id)) {
//                         allVariants.set(variant.id, {
//                             id: variant.id,
//                             name: variant.name
//                         });
//                     }
//                 });
//             }
//         });

//         if (allVariants.size === 0) return [];

//         allVariants.forEach((variantInfo) => {
//             let variantStockMap = {};

//             timeIntervals.forEach((time) => {
//                 variantStockMap[time] = 0;
//             });

//             if (mode === "hourly") {
//                 selectedProductData.data.forEach((stockData) => {
//                     if (!stockData.modelStock || !stockData.createdAt) return;

//                     const test = getDataDate(stockData);
//                     const createdAt = test;
//                     const productDateStr = getLocalDateString(createdAt);

//                     const filterDate = dateMode === 'single' ? date : Array.isArray(selectedDate) ? selectedDate[0] : selectedDate;
//                     const filterDateStr = getLocalDateString(new Date(filterDate));

//                     if (productDateStr === filterDateStr) {
//                         const hourKey = String(createdAt.getHours()).padStart(2, "0");
//                         const timeKey = `${productDateStr} ${hourKey}:00`;
//                         const currentVariant = stockData.modelStock.find(v => v.id === variantInfo.id);

//                         if (currentVariant && timeIntervals.includes(timeKey)) {
//                             variantStockMap[timeKey] = currentVariant?.totalAvailableStock || 0;
//                         }
//                     }
//                 });
//             } else {
//                 const dataByDate = {};

//                 selectedProductData.data.forEach((stockData) => {
//                     if (!stockData.modelStock || !stockData.createdAt) return;

//                     const test = getDataDate(stockData);
//                     const createdAt = test;
//                     const productYear = createdAt.getFullYear();
//                     const productMonth = String(createdAt.getMonth() + 1).padStart(2, "0");
//                     const productDay = String(createdAt.getDate()).padStart(2, "0");
//                     const dateDayKey = `${productYear}-${productMonth}-${productDay}`;

//                     const productDateStr = getLocalDateString(createdAt);
//                     const filterStartStr = Array.isArray(selectedDate) ? selectedDate[0] : timeIntervals[0];
//                     const filterEndStr = Array.isArray(selectedDate) ? selectedDate[selectedDate.length - 1] : timeIntervals[timeIntervals.length - 1];

//                     if (productDateStr >= filterStartStr && productDateStr <= filterEndStr) {
//                         if (!dataByDate[dateDayKey] ||
//                             new Date(dataByDate[dateDayKey].createdAt) < createdAt) {
//                             dataByDate[dateDayKey] = stockData;
//                         }
//                     }
//                 });

//                 Object.keys(dataByDate).forEach((dateDayKey) => {
//                     const stockData = dataByDate[dateDayKey];

//                     if (timeIntervals.includes(dateDayKey) && stockData.modelStock) {
//                         const currentVariant = stockData.modelStock.find(v => v.id === variantInfo.id);
//                         if (currentVariant) {
//                             variantStockMap[dateDayKey] = currentVariant.totalAvailableStock || 0;
//                         }
//                     }
//                 });
//             };

//             const variantData = {
//                 name: variantInfo.name,
//                 id: variantInfo.id,
//                 data: timeIntervals.map((time) => ({
//                     date: time,
//                     totalStock: variantStockMap[time] || 0,
//                 })),
//             };

//             variantsData.push(variantData);
//         });

//         return variantsData;
//     };

//     const formatDateDisplay = () => {
//         if (dateMode === 'preset') {
//             if (date === null) return "Pilih tanggal";
//             if (Array.isArray(date)) return "1 Minggu terakhir";
//             if (date === "Bulan Ini") return "Bulan ini";
//             return new Date(date).toLocaleDateString('id-ID');
//         } else if (dateMode === 'range' && dateRange[0] && dateRange[1]) {
//             const startDate = new Date(dateRange[0]).toLocaleDateString('id-ID');
//             const endDate = new Date(dateRange[1]).toLocaleDateString('id-ID');
//             return `${startDate} - ${endDate}`;
//         } else if (dateMode === 'single' && date) {
//             return new Date(date).toLocaleDateString('id-ID');
//         }
//         return "Pilih tanggal";
//     };

//     const getLocalDateString = (date) => {
//         if (!date) return null;
//         const d = new Date(date);
//         const year = d.getFullYear();
//         const month = String(d.getMonth() + 1).padStart(2, '0');
//         const day = String(d.getDate()).padStart(2, '0');
//         return `${year}-${month}-${day}`;
//     };

//     const handleDateSelection = (selectedDate, mode = 'preset', close = true) => {
//         if (mode === 'preset') {
//             setDateMode('preset');
//             setDate(selectedDate);
//             setDateRange([null, null]);
//         } else if (mode === 'range') {
//             setDateMode('range');
//             setDateRange(selectedDate);
//             setDate(null);
//         } else if (mode === 'single') {
//             setDateMode('single');
//             setDate(selectedDate);
//             setDateRange([null, null]);
//         }

//         if (close) {
//             setShowCalendar(false);
//         }

//         let fromDate, toDate;
//         if (mode === 'preset') {
//             if (Array.isArray(selectedDate)) {
//                 fromDate = new Date(selectedDate[0]);
//                 toDate = new Date(selectedDate[selectedDate.length - 1]);
//                 toDate.setHours(23, 59, 59, 999);
//             } else if (selectedDate === "Bulan Ini") {
//                 const today = new Date();
//                 fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
//                 toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
//                 toDate.setHours(23, 59, 59, 999);
//             } else {
//                 fromDate = new Date(selectedDate);
//                 toDate = new Date(selectedDate);
//                 toDate.setHours(23, 59, 59, 999);
//             }
//         } else if (mode === 'range' && selectedDate[0] && selectedDate[1]) {
//             fromDate = new Date(selectedDate[0]);
//             toDate = new Date(selectedDate[1]);
//             fromDate.setHours(0, 0, 0, 0);
//             toDate.setHours(23, 59, 59, 999);
//         } else if (mode === 'single') {
//             fromDate = new Date(selectedDate);
//             toDate = new Date(selectedDate);
//             fromDate.setHours(0, 0, 0, 0);
//             toDate.setHours(23, 59, 59, 999);
//         } else {
//             return;
//         }

//         fetchData(fromDate, toDate, 1);
//     };



//     // PAGINATION FEATURE
//     const getVisiblePageNumbers = () => {
//         const pages = [];
//         if (totalPages <= 10) {
//             for (let i = 1; i <= totalPages; i++) {
//                 pages.push(i);
//             }
//             return pages;
//         }

//         if (currentPage <= 3) {
//             pages.push(1, 2, 3);
//             if (totalPages > 4) {
//                 pages.push('...');
//                 pages.push(totalPages - 1, totalPages);
//             }
//         } else if (currentPage >= totalPages - 2) {
//             pages.push(1, 2);
//             if (totalPages > 4) {
//                 pages.push('...');
//             }
//             pages.push(totalPages - 2, totalPages - 1, totalPages);
//         } else {
//             pages.push(1, 2);
//             pages.push('...');
//             pages.push(currentPage - 1, currentPage, currentPage + 1);
//             pages.push('...');
//             pages.push(totalPages - 1, totalPages);
//         }

//         return pages;
//     };

//     const handlePageChange = (pageNumber) => {
//         if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
//             setCurrentPage(pageNumber);

//             if (isSortingMode) {
//                 // Frontend pagination for sorted data
//                 applyFrontendPagination(allSortedData, pageNumber, itemsPerPage);
//             } else {
//                 // Backend pagination for normal data
//                 const currentFilters = buildCurrentFilters();
//                 fetchTableData(pageNumber, currentFilters);
//             }

//             // const currentFilters = buildCurrentFilters();
//             // fetchTableData(pageNumber, currentFilters);

//             // const { fromDate, toDate } = getCurrentDateRange();
//             // if (fromDate && toDate) {
//             //   const currentFilters = buildCurrentFilters();
//             //   fetchTableData(fromDate, toDate, pageNumber, currentFilters);
//             // }
//         }
//     };

//     const handleItemsPerPageChange = (e) => {
//         const newItemsPerPage = parseInt(e.target.value, 10);
//         setItemsPerPage(newItemsPerPage);
//         setCurrentPage(1);

//         if (isSortingMode) {
//             // Recalculate frontend pagination
//             applyFrontendPagination(allSortedData, 1, newItemsPerPage);
//         } else {
//             // Fetch new data with new items per page
//             const currentFilters = buildCurrentFilters();
//             fetchTableData(1, currentFilters, newItemsPerPage);
//         }

//         // const currentFilters = buildCurrentFilters();
//         // fetchTableData(1, currentFilters);
//     };

//     const renderPagination = () => {
//         const visiblePages = getVisiblePageNumbers();
//         const showFirstLastButtons = totalPages > 10;
//         const getWidthWindow = window.innerWidth;

//         return (
//             <div className="custom-container-pagination mt-2">
//                 <div className="custom-pagination-select d-flex align-items-center gap-2">
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
//                                                 className="page-link sm-me-2"
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
//                                                 className="page-link sm-ms-2"
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
//                                                     className="d-none sm-d-block page-link"
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
//                                                     className="d-none sm-d-block page-link"
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



//     // FILTER COLUMNS FEATURE
//     const allColumns = [
//         { key: "name", label: "Nama" },
//         { key: "stock", label: "Stok", tooltip: "Stok merupakan total keseluruhan stok yang dimiliki Penjual, termasuk stok yang dikunci untuk promosi. Jika suatu produk memiliki stok yang dikunci untuk promosi, maka jumlah stok yang akan ditampilkan sudah termasuk stok yang tersedia untuk dijual." },
//         { key: "code", label: "Kode" },
//         { key: "salesAvailability", label: "Availability" },
//         // { key: "status", label: "Status" },
//         { key: "salesClassification", label: "Sales Clasification" },
//     ];

//     const [selectedColumns, setSelectedColumns] = useState(
//         allColumns.map((col) => col.key)
//     );

//     const toggleRow = useCallback((productId) => {
//         setExpandedVariantProduct((prev) => ({
//             ...prev,
//             [productId]: !prev[productId],
//         }));
//     }, []);

//     const handleColumnChange = (colKey) => {
//         setSelectedColumns((prev) =>
//             prev.includes(colKey)
//                 ? prev.filter((key) => key !== colKey)
//                 : [...prev, colKey]
//         );
//     };



//     // SALES CLASSIFICATION ADS FEATURE
//     const typeClasificationOptions = [
//         { value: "Best Seller", label: "Best Seller" },
//         { value: "Middle Moving", label: "Middle Moving" },
//         { value: "Slow Moving", label: "Slow Moving" },
//     ];

//     const handleClassificationChange = (selectedOptions) => {
//         setSelectedClassificationOption(selectedOptions);
//     };


//     // UPDATED: handleSortStock with filter preservation
//     const handleSortStock = async (order) => {
//         setIsTableFilterLoading(true);

//         try {
//             if (sortOrderData === order) {
//                 // RESET SORT - Back to normal pagination mode
//                 setSortOrderData(null);
//                 setIsSortingMode(false);
//                 setCurrentPage(1);

//                 // Fetch normal paginated data
//                 const currentFilters = buildCurrentFilters();
//                 await fetchTableData(1, currentFilters);

//             } else {
//                 // APPLY SORT - Switch to sorting mode
//                 setSortOrderData(order);
//                 setIsSortingMode(true);
//                 setCurrentPage(1);

//                 // Fetch ALL data with current filters
//                 const currentFilters = buildCurrentFilters();
//                 const allData = await fetchAllTableData(currentFilters);

//                 // Sort ALL data
//                 const sortedData = [...allData].sort((a, b) => {
//                     const aStock = (a.data && a.data[0] && a.data[0].totalAvailableStock) || 0;
//                     const bStock = (b.data && b.data[0] && b.data[0].totalAvailableStock) || 0;
//                     return order === "asc" ? aStock - bStock : bStock - aStock;
//                 });

//                 setAllSortedData(sortedData);

//                 // Apply frontend pagination to sorted data
//                 applyFrontendPagination(sortedData, 1, itemsPerPage);
//             }
//         } catch (error) {
//             console.error('Error in sorting:', error);
//             toast.error("Gagal mengurutkan data");
//         } finally {
//             setIsTableFilterLoading(false);
//         }
//     };

//     const toggleOpenCalendar = () => {
//         if (showCalendar) {
//             setAnimateCalendar(false);
//             setTimeout(() => setShowCalendar(false), 100);
//         } else {
//             setShowCalendar(true);
//             setTimeout(() => setAnimateCalendar(true), 100);
//         }
//     };

//     const memoizedChartData = React.useMemo(() => {
//         if (!chartRawData.length) return [];

//         const currentDate = dateMode === 'preset' ? date :
//             dateMode === 'range' ? dateRange : date;

//         return generateChartData(currentDate, selectedProduct);
//     }, [chartRawData, date, dateRange, dateMode, selectedProduct]);

//     const memoizedVariantsChartData = React.useMemo(() => {
//         if (!selectedProduct || !chartRawData.length) return [];

//         const currentDate = dateMode === 'preset' ? date :
//             dateMode === 'range' ? dateRange : date;

//         return generateVariantsChartData(currentDate, selectedProduct);
//     }, [chartRawData, date, dateRange, dateMode, selectedProduct]);

//     useEffect(() => {
//         setChartData(memoizedChartData);
//     }, [memoizedChartData]);

//     useEffect(() => {
//         setVariantsChartData(memoizedVariantsChartData);
//     }, [memoizedVariantsChartData]);

//     useEffect(() => {
//         if (!chartRef.current || !chartData.length) return;

//         const timeoutId = setTimeout(() => {
//             if (chartInstanceRef.current && !chartInstanceRef.current.isDisposed()) {
//                 chartInstanceRef.current.dispose();
//             }

//             chartInstanceRef.current = echarts.init(chartRef.current);

//             let xAxisData = chartData.map((item) => item.date);
//             const includesColon = xAxisData.some((item) => item.includes(":"));

//             if (includesColon) {
//                 xAxisData = xAxisData.map((item) => item.split(" ")[1]);
//             } else {
//                 xAxisData = xAxisData.map((item) => item.split("-").slice(1).join("/"));
//             }

//             const allValues = chartData.map(d => d.totalStock);
//             variantsChartData.forEach(v => {
//                 v.data.forEach(d => allValues.push(d.totalStock));
//             });

//             const maxYValue = Math.max(...allValues);
//             let dynamicLeft = 35;
//             if (maxYValue >= 1_000_000_000) dynamicLeft = 110;

//             const series = [
//                 {
//                     name: selectedProduct ? selectedProduct.name : "Total Stock",
//                     type: "line",
//                     smooth: true,
//                     showSymbol: false,
//                     data: chartData.map((item) => item.totalStock),
//                     lineStyle: { color: "#5470C6", width: 2 },
//                     emphasis: { focus: 'series' }
//                 },
//             ];

//             if (selectedProduct && variantsChartData.length > 0) {
//                 const grayColors = [
//                     "#95A5A6", "#7F8C8D", "#BDC3C7", "#85929E", "#A6ACAF",
//                     "#909497", "#ABB2B9", "#CCD1D1", "#D5DBDB", "#EAEDED"
//                 ];

//                 variantsChartData.forEach((variant, index) => {
//                     series.push({
//                         name: `↳ ${variant.name}`,
//                         type: "line",
//                         smooth: true,
//                         showSymbol: false,
//                         data: variant.data.map((item) => item.totalStock),
//                         lineStyle: {
//                             color: grayColors[index % grayColors.length],
//                             width: 1.5,
//                             type: 'dashed'
//                         },
//                         emphasis: { focus: 'series' }
//                     });
//                 });
//             }

//             chartInstanceRef.current.setOption({
//                 toolbox: { feature: { saveAsImage: {} } },
//                 grid: { left: dynamicLeft, right: 50, bottom: 70, containLabel: false },
//                 tooltip: {
//                     trigger: "axis",
//                 },
//                 legend: {
//                     data: series.map(s => s.name),
//                 },
//                 xAxis: {
//                     name: includesColon ? 'Time' : 'Date',
//                 },
//                 yAxis: {
//                     type: "value",
//                 },
//                 series: series,
//             });

//             const handleResize = () => {
//                 if (chartInstanceRef.current && !chartInstanceRef.current.isDisposed()) {
//                     chartInstanceRef.current.resize();
//                 }
//             };
//             window.addEventListener('resize', handleResize);

//             return () => {
//                 window.removeEventListener('resize', handleResize);
//                 if (chartInstanceRef && !chartInstanceRef.isDisposed()) {
//                     chartInstanceRef.dispose();
//                 }
//             };
//         });

//         return () => {
//             clearTimeout(timeoutId);
//             if (chartInstanceRef.current && !chartInstanceRef.current.isDisposed()) {
//                 chartInstanceRef.current.dispose();
//             }
//         };
//     }, [chartData, variantsChartData, selectedProduct]);

//     useEffect(() => {
//         setCurrentPage(1);
//         // FIXED: Don't reset sorting mode when filters change
//         // Instead, re-apply filters with current sorting state

//         if (isSortingMode) {
//             // If sorting is active, refetch all data and re-apply sort
//             const refetchAndSort = async () => {
//                 const currentFilters = buildCurrentFilters();
//                 const allData = await fetchAllTableData(currentFilters);

//                 // Re-apply current sort order
//                 const sortedData = [...allData].sort((a, b) => {
//                     const aStock = (a.data && a.data[0] && a.data[0].totalAvailableStock) || 0;
//                     const bStock = (b.data && b.data[0] && b.data[0].totalAvailableStock) || 0;
//                     return sortOrderData === "asc" ? aStock - bStock : bStock - aStock;
//                 });

//                 setAllSortedData(sortedData);
//                 applyFrontendPagination(sortedData, 1, itemsPerPage);
//             };

//             refetchAndSort();
//         } else {
//             // Normal mode: fetch paginated data
//             const currentFilters = buildCurrentFilters();
//             fetchTableData(1, currentFilters);
//         }
//     }, [
//         debouncedSearchTerm,
//         selectedClassificationOption,
//     ]);

//     // useEffect(() => {
//     //   setCurrentPage(1);
//     //   const currentFilters = buildCurrentFilters();
//     //   fetchTableData(1, currentFilters);

//     //   // const { fromDate, toDate } = getCurrentDateRange();
//     //   // if (fromDate && toDate) {
//     //   //   const currentFilters = buildCurrentFilters();
//     //   //   fetchTableData(fromDate, toDate, 1, currentFilters);
//     //   // }
//     // }, [
//     //   debouncedSearchTerm, 
//     //   // statusProductStockFilter, 
//     //   selectedClassificationOption,
//     //   // dateMode, 
//     //   // date, 
//     //   // dateRange,
//     //   itemsPerPage
//     // ]);

//     useEffect(() => {
//         const today = new Date();
//         const fromDate = new Date();
//         fromDate.setDate(today.getDate() - 7);
//         const toDate = new Date();
//         toDate.setHours(23, 59, 59, 999);

//         fetchData(fromDate, toDate, 1);
//     }, []);

//     const [hoveredColumnKey, setHoveredColumnKey] = useState(null);
//     const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
//     const iconRefs = useRef({});

//     const updateTooltipPosition = (key) => {
//         if (iconRefs.current[key]) {
//             const rect = iconRefs.current[key].getBoundingClientRect();
//             const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
//             const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

//             setTooltipPosition({
//                 top: rect.top + scrollTop - 5,
//                 left: rect.left + scrollLeft - 10
//             });
//         }
//     };

//     const handleMouseEnter = (key) => {
//         setHoveredColumnKey(key);
//         updateTooltipPosition(key);
//     };

//     const handleMouseLeave = () => {
//         setHoveredColumnKey(null);
//     };

//     return (
//         <>
//             <BaseLayout>
//                 <div className="d-flex flex-column gap-1">
//                     <h3>Performa stock</h3>
//                     <div className="card-body">
//                         {/* Header & Date Filter */}
//                         <div className="d-flex">
//                             <h5>{totalElements} total produk</h5>
//                             <div style={{ position: "relative" }}>
//                                 <button
//                                     onClick={toggleOpenCalendar}
//                                     className="btn btn-primary"
//                                 >
//                                     {formatDateDisplay()}
//                                 </button>
//                                 {showCalendar && (
//                                     <div className={`d-flex custom-calendar-behavior-v2 ${animateCalendar ? "show" : ""}`}>
//                                         <Calendar
//                                             selectRange={true}
//                                             onChange={(selectedDate) => {
//                                                 if (Array.isArray(selectedDate)) {
//                                                     if (selectedDate[0] && selectedDate[1]) {
//                                                         const startDate = getLocalDateString(selectedDate[0]);
//                                                         const endDate = getLocalDateString(selectedDate[1]);

//                                                         if (startDate === endDate) {
//                                                             handleDateSelection(startDate, 'single');
//                                                         } else {
//                                                             handleDateSelection([startDate, endDate], 'range');
//                                                         }
//                                                     } else if (selectedDate[0]) {
//                                                         const singleDate = getLocalDateString(selectedDate[0]);
//                                                         handleDateSelection(singleDate, 'single');
//                                                     }
//                                                 } else if (selectedDate instanceof Date) {
//                                                     handleDateSelection(getLocalDateString(selectedDate), 'single');
//                                                 }
//                                             }}
//                                             value={(() => {
//                                                 if (dateMode === 'range' && dateRange[0] && dateRange[1]) {
//                                                     return [new Date(dateRange[0]), new Date(dateRange[1])];
//                                                 } else if (dateMode === 'single' && date && date !== "Bulan Ini" && !Array.isArray(date)) {
//                                                     return new Date(date);
//                                                 } else if (dateMode === 'preset' && date && date !== "Bulan Ini" && !Array.isArray(date)) {
//                                                     return new Date(date);
//                                                 }
//                                                 return null;
//                                             })()}
//                                             maxDate={new Date()}
//                                         />
//                                         <div className="custom-content-calendar-v2 d-flex flex-column py-2 px-1">
//                                             <p
//                                                 onClick={() => handleDateSelection(new Date().toISOString().split("T")[0], 'preset')}
//                                             >
//                                                 Hari ini
//                                             </p>
//                                             <p
//                                                 onClick={() => {
//                                                     const yesterday = new Date();
//                                                     yesterday.setDate(yesterday.getDate() - 1);
//                                                     handleDateSelection(yesterday.toISOString().split("T")[0], 'preset');
//                                                 }}
//                                             >
//                                                 Kemarin
//                                             </p>
//                                             <p
//                                                 onClick={() => handleDateSelection(getAllDaysInLast7Days(), 'preset')}
//                                             >
//                                                 1 Minggu terakhir
//                                             </p>
//                                             <p
//                                                 onClick={() => handleDateSelection("Bulan Ini", 'preset')}
//                                             >
//                                                 Bulan ini
//                                             </p>
//                                         </div>
//                                     </div>
//                                 )}
//                             </div>
//                         </div>
//                         {isLoading ? (
//                             <div>
//                                 <Loading size={40} />
//                             </div>
//                         ) : (
//                             <>
//                                 <div
//                                     ref={chartRef}
//                                 ></div>
//                                 {/* Filter & Table */}
//                                 <div className="d-flex flex-column gap-3 gap-md-2">
//                                     {/* Other filter*/}
//                                     <div>
//                                         <input
//                                             type="text"
//                                             className="form-control"
//                                             placeholder="Cari berdasarkan nama"
//                                             value={searchTerm}
//                                             onChange={(e) => setSearchTerm(e.target.value)}
//                                         />
//                                         <Select
//                                             isMulti
//                                             options={typeClasificationOptions}
//                                             value={selectedClassificationOption}
//                                             onChange={handleClassificationChange}
//                                             placeholder="Filter Klasifikasi"
//                                         />
//                                         <button
//                                             type="button"
//                                             onClick={() => setShowTableColumn(!showTableColumn)}
//                                         >
//                                             Pilih kriteria
//                                         </button>
//                                         {/* Option column filter */}
//                                         {showTableColumn && (
//                                             <>
//                                                 {allColumns.map((col) => (
//                                                     <div key={col.key}>
//                                                         <input
//                                                             type="checkbox"
//                                                             checked={selectedColumns.includes(col.key)}
//                                                             onChange={() => handleColumnChange(col.key)}
//                                                         />
//                                                         <label className="form-check-label fs-5 ms-1">
//                                                             {col.label}
//                                                         </label>
//                                                     </div>
//                                                 ))}
//                                             </>
//                                         )}
//                                     </div>
//                                     <div style={{ position: 'relative' }}>
//                                         {isTableFilterLoading && (
//                                             <div>
//                                                 <Loading size={40} />
//                                             </div>
//                                         )}
//                                             <table>
//                                                 <thead className="table-light">
//                                                     <tr>
//                                                         {filteredData.length > 0 && <th scope="col"></th>}
//                                                         {allColumns
//                                                             .filter((col) => selectedColumns.includes(col.key))
//                                                             .map((col) => (
//                                                                 <th key={col.key}>
//                                                                     <div className="d-flex justify-content-start gap-1 align-items-center fw-bold">
//                                                                         {col.label}
//                                                                         {col.tooltip && (
//                                                                             <div
//                                                                                 ref={(el) => iconRefs.current[col.key] = el}
//                                                                                 onMouseEnter={() => handleMouseEnter(col.key)}
//                                                                                 onMouseLeave={handleMouseLeave}
//                                                                             >
//                                                                                 <AiOutlineQuestionCircle />
//                                                                             </div>
//                                                                         )}
//                                                                         {col.key === "stock" && (
//                                                                             <div className="d-flex flex-column">
//                                                                                 <span
//                                                                                     title="Sort Ascending"
//                                                                                     style={{
//                                                                                         color: sortOrderData === "asc" ? "#007bff" : "#969696FF",
//                                                                                     }}
//                                                                                     onClick={() => handleSortStock("asc")}
//                                                                                 >
//                                                                                     <FaAngleUp />
//                                                                                 </span>
//                                                                                 <span
//                                                                                     title="Sort Descending"
//                                                                                     style={{
//                                                                                         color: sortOrderData === "desc" ? "#007bff" : "#969696FF",
//                                                                                     }}
//                                                                                     onClick={() => handleSortStock("desc")}
//                                                                                 >
//                                                                                     <FaAngleDown />
//                                                                                 </span>
//                                                                             </div>
//                                                                         )}
//                                                                     </div>
//                                                                 </th>
//                                                             ))}
//                                                     </tr>
//                                                 </thead>
//                                                 {hoveredColumnKey && createPortal(
//                                                     <div
//                                                         style={{
//                                                             top: tooltipPosition.top,
//                                                             left: tooltipPosition.left,
//                                                         }}
//                                                     >
//                                                         {allColumns.find(col => col.key === hoveredColumnKey)?.tooltip}
//                                                     </div>,
//                                                     document.body
//                                                 )}
//                                                 <tbody>
//                                                     {filteredData.length > 0 ? (
//                                                         filteredData.map((entry) => {
//                                                             const productData = entry.data && entry.data[0] ? entry.data[0] : {};
//                                                             return (
//                                                                 <React.Fragment key={entry.productId || productData.productId}>
//                                                                     <tr>
//                                                                         {filteredData.length > 0 && (
//                                                                             <td
//                                                                                 onClick={() => toggleRow(productData.productId)}
//                                                                                 style={{ cursor: "pointer", width: "20px" }}
//                                                                             >
//                                                                                 {expandedVariantProduct[productData.productId] ? <FaAngleUp /> : <FaAngleDown />}
//                                                                             </td>
//                                                                         )}

//                                                                         {selectedColumns.includes("name") && (
//                                                                             <td
//                                                                                 style={{
//                                                                                     color: selectedProduct?.productId == productData.productId ? "#F6881F" : "",
//                                                                                 }}
//                                                                                 onClick={() => handleProductClick(entry)}
//                                                                             >
//                                                                                 {productData?.name || "-"}
//                                                                             </td>
//                                                                         )}

//                                                                         {selectedColumns.includes("stock") && (
//                                                                             <td style={{ width: "160px" }}>
//                                                                                 <div className="d-flex flex-column align-items-start">
//                                                                                     <span>{productData?.totalAvailableStock === undefined || productData?.totalAvailableStock === null ? "-" : productData?.totalAvailableStock} Stok</span>
//                                                                                 </div>
//                                                                             </td>
//                                                                         )}

//                                                                         {selectedColumns.includes("salesClassification") && (
//                                                                             <td style={{ width: "200px" }}>
//                                                                                     <div
//                                                                                         style={{
//                                                                                             backgroundColor: formatStyleSalesClassification(entry.data[0].salesClassification).backgroundColor,
//                                                                                         }}
//                                                                                     ></div>
//                                                                                     <span>
//                                                                                         {
//                                                                                             entry.data[0].salesClassification === undefined || entry.data[0].salesClassification === null ? "-" : formatStyleSalesClassification(entry.data[0].salesClassification).label
//                                                                                         }
//                                                                                     </span>
//                                                                             </td>
//                                                                         )}

//                                                                     </tr>
//                                                                     {expandedVariantProduct[productData.productId] && (
//                                                                         productData?.modelStocks && productData.modelStocks.length > 0 ? (
//                                                                             <tr className="bg-light">
//                                                                                 <td
//                                                                                     colSpan={selectedColumns.length + 1}
//                                                                                 >
//                                                                                     <ul className="list-group">
//                                                                                         {productData.modelStocks.map((variant) => (
//                                                                                             <li
//                                                                                                 key={variant.id}
//                                                                                             >
//                                                                                                 <span>
//                                                                                                     {variant.name}
//                                                                                                 </span>
//                                                                                                 <span>{variant.totalAvailableStock || 0} Stok</span>
//                                                                                             </li>
//                                                                                         ))}
//                                                                                     </ul>
//                                                                                 </td>
//                                                                             </tr>
//                                                                         ) : (
//                                                                             <tr>
//                                                                                 <td
//                                                                                     colSpan={selectedColumns.length + 1}
//                                                                                 >
//                                                                                     <span>Tidak ada varian untuk produk ini</span>
//                                                                                 </td>
//                                                                             </tr>
//                                                                         )
//                                                                     )}
//                                                                 </React.Fragment>
//                                                             );
//                                                         })
//                                                     ) : (
//                                                         <tr>
//                                                             <td colSpan={selectedColumns.length + 1} className="text-left">
//                                                                 Data tidak tersedia
//                                                             </td>
//                                                         </tr>
//                                                     )}
//                                                 </tbody>
//                                             </table>
//                                     </div>
//                                     {/* Pagination */}
//                                     {filteredData.length > 0 &&
//                                         filteredData !== null &&
//                                         renderPagination()}
//                                 </div>
//                             </>
//                         )}
//                     </div>
//                 </div>
//             </BaseLayout>
//         </>
//     );
// };