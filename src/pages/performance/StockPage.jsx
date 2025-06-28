import React, { useState, useEffect, useCallback, useRef } from "react";
import * as echarts from "echarts";
import Calendar from "react-calendar";
import Select from "react-select";
import toast from "react-hot-toast";
import { FaAngleLeft, FaAngleRight, FaAngleDown, FaAngleUp } from "react-icons/fa6";

import axiosRequest from "../../utils/request";
import useDebounce from "../../hooks/useDebounce";
import convertStatusToLabel from "../../utils/convertStatusToLabel";
import formatTableValue from "../../utils/formatTableValue";
import BaseLayout from "../../components/organisms/BaseLayout";
import iconArrowUp from "../../assets/icon/arrow-up.png";
import iconArrowDown from "../../assets/icon/arrow-down.png";
import Loading from "../../components/atoms/Loading/Loading";


export default function PerformanceStockPage() {
  // Data
  const [chartRawData, setChartRawData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const chartRef = useRef(null);
  const [variantsChartData, setVariantsChartData] = useState([]);
  // Filter
  const [date, setDate] = useState(getAllDaysInLast7Days());
  const [dateRange, setDateRange] = useState([null, null]);
  const [dateMode, setDateMode] = useState('preset'); 
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [statusProductStockFilter, setStatusProductStockFilter] =
    useState("all");
  const [showTableColumn, setShowTableColumn] = useState(false);
  const [selectedClassificationOption, setSelectedClassificationOption] =
    useState([]);
  const [expandedVariantProduct, setExpandedVariantProduct] = useState({});
  const [sortOrderData, setSortOrderData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [paginatedData, setPaginatedData] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  // Other
  const [showCalendar, setShowCalendar] = useState(false);
  const [animateCalendar, setAnimateCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [isTableFilterLoading, setIsTableFilterLoading] = useState(false);

  const getShopeeId = localStorage.getItem("shopeeId");
  if (getShopeeId == null || getShopeeId === null || getShopeeId === "null" || getShopeeId === "undefined") {
      return (
      <BaseLayout>
        <div className="alert alert-warning">
          Tidak ada merchant aktif. Silahkan buat merchant atau login ke merchant terlebih dahulu.
        </div>
      </BaseLayout>
    );
  };



  // CUSTOM CHART WITH FILTER DATE & CLICK PRODUCT FEATURE
  function getAllDaysInLast7Days() {
    const getLocalDateString = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      return getLocalDateString(d);
    }).reverse();
  };

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

  function getHourlyIntervals(selectedDate) {
    return Array.from({ length: 24 }, (_, i) => {
      const hour = String(i).padStart(2, "0");
      return `${selectedDate} ${hour}:00`;
    });
  };

  function getDateRangeIntervals(startDate, endDate) {
    const getLocalDateString = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const start = startDate instanceof Date ? new Date(startDate) : new Date(startDate);
    const end = endDate instanceof Date ? new Date(endDate) : new Date(endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const dateArray = [];

    // Calculate the difference in days between start and end dates
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays == 0) {
      return getHourlyIntervals(getLocalDateString(start));
    }

    // Otherwise, return daily intervals
    let currentDate = new Date(start);
    while (currentDate <= end) {
      dateArray.push(getLocalDateString(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dateArray;
  };

  const toLocalISOString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  const calculateComparisonDates = (fromDate, toDate) => {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    
    const durationMs = end.getTime() - start.getTime();
    
    const from1 = new Date(start);
    const to1 = new Date(end);

    const from2 = new Date(start.getTime() - durationMs);
    const to2 = new Date(start.getTime() - 1);
    
    from1.setHours(0, 0, 0, 0);
    to1.setHours(23, 59, 59, 999);
    from2.setHours(0, 0, 0, 0);
    to2.setHours(23, 59, 59, 999);
    
    return { from1, to1, from2, to2 };
  };

  const buildApiUrlWithComparison = (baseUrl, getShopeeId, fromDate, toDate, limit, page = null) => {
    const { from1, to1, from2, to2 } = calculateComparisonDates(fromDate, toDate);
    
    const from1ISO = toLocalISOString(from1);
    const to1ISO = toLocalISOString(to1);
    const from2ISO = toLocalISOString(from2);
    const to2ISO = toLocalISOString(to2);
    
    let apiUrl = `${baseUrl}?shopId=${getShopeeId}&from1=${from1ISO}&to1=${to1ISO}&from2=${from2ISO}&to2=${to2ISO}&limit=${limit}`;
    
    if (page !== null) {
      const backendPage = Math.max(0, page - 1);
      apiUrl += `&page=${backendPage}`;
    }
    
    return apiUrl;
  };

  const buildChartApiUrl = (baseUrl, getShopeeId, fromDate, toDate, limit) => {
    const { from1, to1 } = calculateComparisonDates(fromDate, toDate);
    
    const from1ISO = toLocalISOString(from1);
    const to1ISO = toLocalISOString(to1);
    
    const apiUrl = `${baseUrl}?shopId=${getShopeeId}&from=${from1ISO}&to=${to1ISO}&limit=${limit}`;
    
    return apiUrl;
  };

  const getCurrentDateRange = () => {
    let fromDate, toDate;
    
    switch (dateMode) {
      case 'range':
        if (dateRange[0] && dateRange[1]) {
          fromDate = new Date(dateRange[0]);
          toDate = new Date(dateRange[1]);
        }
        break;
      case 'single':
        if (date) {
          fromDate = new Date(date);
          toDate = new Date(date);
        }
        break;
      case 'preset':
      default:
        if (Array.isArray(date)) {
          fromDate = new Date(date[0]);
          toDate = new Date(date[date.length - 1]);
        } else if (date === "Bulan Ini") {
          const today = new Date();
          fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
          toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        } else if (date) {
          fromDate = new Date(date);
          toDate = new Date(date);
        } else {
          const today = new Date();
          fromDate = new Date();
          fromDate.setDate(today.getDate() - 7);
          toDate = today;
        }
        break;
    }

    if (fromDate && toDate) {
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 999);
    }

    return { fromDate, toDate };
  };

  const fetchChartData = async (fromDate, toDate) => {
    try {
      let currentFromDate, currentToDate;

      if (dateMode === 'range' && dateRange[0] && dateRange[1]) {
        currentFromDate = new Date(dateRange[0]);
        currentToDate = new Date(dateRange[1]);
      } else {
        currentFromDate = fromDate instanceof Date ? fromDate : new Date(fromDate);
        currentToDate = toDate instanceof Date ? toDate : new Date(toDate);
      }

      const apiUrl = buildChartApiUrl(
        '/api/product-stock/chart',
        // '/api/product-stock/by-shop',
        getShopeeId,
        currentFromDate,
        currentToDate,
        1000000000000
      );

      const response = await axiosRequest.get(apiUrl);
      const data = response.data;
      // const content = data.content || [];
      const content = Array.isArray(data) ? data : [];

      setChartRawData(content);
      
      return content;
    } catch (error) {
      toast.error("Gagal mengambil data chart stock produk");
      console.error('Gagal mengambil data chart stock produk, kesalahan pada server:', error);
      return [];
    }
  };

  const fetchTableData = async (fromDate, toDate, page = 1, filters = {}) => {
    setIsTableFilterLoading(true);

    try {
      let currentFromDate, currentToDate;

      if (dateMode === 'range' && dateRange[0] && dateRange[1]) {
        currentFromDate = new Date(dateRange[0]);
        currentToDate = new Date(dateRange[1]);
      } else {
        currentFromDate = fromDate instanceof Date ? fromDate : new Date(fromDate);
        currentToDate = toDate instanceof Date ? toDate : new Date(toDate);
      }

      let apiUrl = buildApiUrlWithComparison(
        '/api/product-stock/by-shop',
        getShopeeId,
        currentFromDate,
        currentToDate,
        itemsPerPage,
        page
      );

      if (filters.searchQuery && filters.searchQuery.trim() !== "") {
        apiUrl += `&name=${encodeURIComponent(filters.searchQuery.trim())}`;
      }
      
      if (filters.statusFilter && filters.statusFilter !== "all") {
        apiUrl += `&state=${filters.statusFilter}`;
      }

      if (filters.classification && filters.classification.length > 0) {
        const classificationValues = filters.classification.map(cls => cls.value);
        apiUrl += `&classification=${classificationValues.join(",")}`;
      }

      const response = await axiosRequest.get(apiUrl);
      const data = response.data;
      const content = data.content || [];

      setFilteredData(content);
      setTotalPages(data?.totalPages || 1);
      setTotalElements(data?.totalElements || 0);

      return content;
    } catch (error) {
      toast.error("Gagal mengambil data tabel stock produk");
      console.error('Gagal mengambil data tabel stock produk, kesalahan pada server:', error);
      return [];
    } finally {
      setIsTableFilterLoading(false);
    }
  };

  const fetchData = async (fromDate, toDate, page = 1) => {
    const isInitialLoad = !chartRawData.length;
    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsContentLoading(true);
    }
    
    try {
      const currentFilters = {
        searchQuery: debouncedSearchTerm,
        statusFilter: statusProductStockFilter,
        classification: selectedClassificationOption
      };

      await Promise.all([
        fetchChartData(fromDate, toDate),
        fetchTableData(fromDate, toDate, page, currentFilters)
      ]);
    } catch (error) {
      toast.error("Gagal mengambil data stock produk");
      console.error('Gagal mengambil data stock produk, kesalahan pada server:', error);
    } finally {
      setIsLoading(false);
      setIsContentLoading(false);
    }
  };

  const buildCurrentFilters = () => {
    return {
      searchQuery: debouncedSearchTerm,
      statusFilter: statusProductStockFilter,
      classification: selectedClassificationOption,
    };
  };

  const getLatestStockData = (product) => {
    if (!product.data || product.data.length === 0) return null;
    return product.data.reduce((latest, current) =>
      new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
    );
  };

  const handleProductClick = (product) => {
    // if (selectedProduct?.productId === product.productId) {
    //   setSelectedProduct(null);
    // } else {
    //   setSelectedProduct(product);
    // }
    setSelectedProduct((prev) => (prev?.productId === product.productId ? null : product));
  };
  
  function generateChartData(selectedDate = null, product = null) {
    let timeIntervals = [];
    let mode = "daily";
    let result = {};
    let fromDate, toDate;
    let isSingleDay = false;

    const getLocalDateString = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (dateMode === 'range' && dateRange[0] && dateRange[1]) {
      timeIntervals = getDateRangeIntervals(dateRange[0], dateRange[1]);
      fromDate = new Date(dateRange[0]);
      toDate = new Date(dateRange[1]);
      toDate.setHours(23, 59, 59, 999);
      mode = "daily";
    } else if (dateMode === 'single' && date) {
      timeIntervals = getHourlyIntervals(date);
      mode = "hourly";
      isSingleDay = true;
      fromDate = new Date(date);
      toDate = new Date(date);
      toDate.setHours(23, 59, 59, 999);
    } else if (dateMode === 'preset') {
      if (selectedDate === null || Array.isArray(selectedDate)) {
        timeIntervals = getAllDaysInLast7Days();
        fromDate = new Date(timeIntervals[0] + 'T00:00:00');
        toDate = new Date(timeIntervals[timeIntervals.length - 1] + 'T23:59:59');
      } else if (selectedDate === "Bulan Ini") {
        timeIntervals = getAllDaysInAMonth();
        const today = new Date();
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);
      } else {
        timeIntervals = getHourlyIntervals(selectedDate);
        mode = "hourly";
        isSingleDay = true;
        fromDate = new Date(selectedDate);
        toDate = new Date(selectedDate);
        toDate.setHours(23, 59, 59, 999);
      }
    }

    const convertShopeeTimestampToDate = (timestamp) => {
      return new Date(timestamp * 1000);
    };

    const getDataDate = (productData) => {
      if (productData.shopeeFrom) {
        return convertShopeeTimestampToDate(productData.shopeeFrom);
      } else if (productData.createdAt) {
        return new Date(productData.createdAt);
      }
      return null;
    };

    if (timeIntervals.length === 0 || !timeIntervals.length) {
      timeIntervals = [new Date().toISOString().split("T")[0]];
      fromDate = new Date();
      toDate = new Date();
      toDate.setHours(23, 59, 59, 999);
    }
    
    let chartDataProducts = chartRawData;
    if (product) {
      chartDataProducts = chartRawData.filter((p) => p.productId === product.productId);
    }

    let dataMap = {};

    timeIntervals.forEach((time) => {
      dataMap[time] = 0;
    });

    chartDataProducts?.forEach((productItem) => {
      if (productItem.data.length === 0 || !productItem.data) return;

      if (isSingleDay) {
        productItem.data.forEach((stockData) => {
          if (stockData.createdAt === null) return;

          const test = getDataDate(stockData);
          const createdAt = test;
          const productDateStr = getLocalDateString(createdAt);
          const filterDateStr = getLocalDateString(fromDate);

          if (productDateStr !== filterDateStr) return;

          const hourKey = String(createdAt.getHours()).padStart(2, "0");
          const productYear = createdAt.getFullYear();
          const productMonth = String(createdAt.getMonth() + 1).padStart(2, "0");
          const productDay = String(createdAt.getDate()).padStart(2, "0");

          const hourOnlyKey = `${productYear}-${productMonth}-${productDay} ${hourKey}:00`;

          if (timeIntervals.includes(hourOnlyKey)) {
            const stockValue = stockData.totalAvailableStock;
            if (stockValue !== null) {
              dataMap[hourOnlyKey] += Number(stockValue);
            }
          }
        });
      } else {
        const dataByDate = {};

        productItem.data.forEach((stockData) => {
          if (stockData.createdAt === null) return;

          const test = getDataDate(stockData);
          const createdAt = test;
          const productYear = createdAt.getFullYear();
          const productMonth = String(createdAt.getMonth() + 1).padStart(2, "0");
          const productDay = String(createdAt.getDate()).padStart(2, "0");
          const dateDayKey = `${productYear}-${productMonth}-${productDay}`;

          const productDateStr = getLocalDateString(createdAt);
          const filterStartStr = getLocalDateString(fromDate);
          const filterEndStr = getLocalDateString(toDate);

          if (productDateStr >= filterStartStr && productDateStr <= filterEndStr) {
            if (!dataByDate[dateDayKey] ||
              new Date(dataByDate[dateDayKey].createdAt) < createdAt) {
              dataByDate[dateDayKey] = stockData;
            }
          }
        });

        Object.keys(dataByDate).forEach((dateDayKey) => {
          const stockData = dataByDate[dateDayKey];

          if (timeIntervals.includes(dateDayKey)) {
            const stockValue = stockData.totalAvailableStock;
            if (stockValue !== undefined && stockValue !== null) {
              dataMap[dateDayKey] += Number(stockValue);
            }
          }
        });
      }
    });

    const chartDataArray = timeIntervals.map((time) => ({
      date: time,
      totalStock: dataMap[time] || 0
    }));

    return chartDataArray;
  };

  function generateVariantsChartData(selectedDate = null, product = null) {
    if (!product) return [];

    let timeIntervals = [];
    let mode = "daily";
    let variantsData = [];

    const getLocalDateString = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (dateMode === 'range' && dateRange[0] && dateRange[1]) {
      timeIntervals = getDateRangeIntervals(dateRange[0], dateRange[1]);
      mode = "daily";
    } else if (dateMode === 'single' && date) {
      timeIntervals = getHourlyIntervals(date);
      mode = "hourly";
    } else if (dateMode === 'preset') {
      if (selectedDate === null || Array.isArray(selectedDate)) {
        timeIntervals = getAllDaysInLast7Days();
      } else if (selectedDate === "Bulan Ini") {
        timeIntervals = getAllDaysInAMonth();
      } else {
        timeIntervals = getHourlyIntervals(selectedDate);
        mode = "hourly";
      }
    }

    const convertShopeeTimestampToDate = (timestamp) => {
      return new Date(timestamp * 1000);
    };

    const getDataDate = (productData) => {
      if (productData.shopeeFrom) {
        return convertShopeeTimestampToDate(productData.shopeeFrom);
      } else if (productData.createdAt) {
        return new Date(productData.createdAt);
      }
      return null;
    };

    const selectedProductData = chartRawData.find((p) => p.productId === product.productId);
    if (!selectedProductData || !selectedProductData.data) return [];

    // Check if product has variants in its data
    const allVariants = new Map();
    selectedProductData?.data.forEach((stockData) => {
      if (stockData?.modelStock) {
        stockData.modelStock.forEach((variant) => {
          if (!allVariants.has(variant.id)) {
            allVariants.set(variant.id, {
              id: variant.id,
              name: variant.name
            });
          }
        });
      }
    });

    if (allVariants.size === 0) return [];

    allVariants.forEach((variantInfo) => {
      let variantStockMap = {};

      timeIntervals.forEach((time) => {
        variantStockMap[time] = 0;
      });

      if (mode === "hourly") {
        selectedProductData.data.forEach((stockData) => {
          if (!stockData.modelStock || !stockData.createdAt) return;

          const test = getDataDate(stockData);
          const createdAt = test;
          const productDateStr = getLocalDateString(createdAt);

          const filterDate = dateMode === 'single' ? date : Array.isArray(selectedDate) ? selectedDate[0] : selectedDate;
          const filterDateStr = getLocalDateString(new Date(filterDate));

          if (productDateStr === filterDateStr) {
            const hourKey = String(createdAt.getHours()).padStart(2, "0");
            const timeKey = `${productDateStr} ${hourKey}:00`;
            const currentVariant = stockData.modelStock.find(v => v.id === variantInfo.id);

            if (currentVariant && timeIntervals.includes(timeKey)) {
              variantStockMap[timeKey] = currentVariant?.totalAvailableStock || 0;
            }
          }
        });
      } else {
        const dataByDate = {};

        selectedProductData.data.forEach((stockData) => {
          if (!stockData.modelStock || !stockData.createdAt) return;

          const test = getDataDate(stockData);
          const createdAt = test;
          const productYear = createdAt.getFullYear();
          const productMonth = String(createdAt.getMonth() + 1).padStart(2, "0");
          const productDay = String(createdAt.getDate()).padStart(2, "0");
          const dateDayKey = `${productYear}-${productMonth}-${productDay}`;

          const productDateStr = getLocalDateString(createdAt);
          const filterStartStr = Array.isArray(selectedDate) ? selectedDate[0] : timeIntervals[0];
          const filterEndStr = Array.isArray(selectedDate) ? selectedDate[selectedDate.length - 1] : timeIntervals[timeIntervals.length - 1];

          if (productDateStr >= filterStartStr && productDateStr <= filterEndStr) {
            if (!dataByDate[dateDayKey] ||
              new Date(dataByDate[dateDayKey].createdAt) < createdAt) {
              dataByDate[dateDayKey] = stockData;
            }
          }
        });

        Object.keys(dataByDate).forEach((dateDayKey) => {
          const stockData = dataByDate[dateDayKey];

          if (timeIntervals.includes(dateDayKey) && stockData.modelStock) {
            const currentVariant = stockData.modelStock.find(v => v.id === variantInfo.id);
            if (currentVariant) {
              variantStockMap[dateDayKey] = currentVariant.totalAvailableStock || 0;
            }
          }
        });
      };

      const variantData = {
        name: variantInfo.name,
        id: variantInfo.id,
        data: timeIntervals.map((time) => ({
          date: time,
          totalStock: variantStockMap[time] || 0,
        })),
      };

      variantsData.push(variantData);
    });

    return variantsData;
  };

  const formatDateDisplay = () => {
    if (dateMode === 'preset') {
      if (date === null) return "Pilih tanggal";
      if (Array.isArray(date)) return "1 Minggu terakhir";
      if (date === "Bulan Ini") return "Bulan ini";
      return new Date(date).toLocaleDateString('id-ID');
    } else if (dateMode === 'range' && dateRange[0] && dateRange[1]) {
      const startDate = new Date(dateRange[0]).toLocaleDateString('id-ID');
      const endDate = new Date(dateRange[1]).toLocaleDateString('id-ID');
      return `${startDate} - ${endDate}`;
    } else if (dateMode === 'single' && date) {
      return new Date(date).toLocaleDateString('id-ID');
    }
    return "Pilih tanggal";
  };

  const getLocalDateString = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateSelection = (selectedDate, mode = 'preset', close = true) => {
    if (mode === 'preset') {
      setDateMode('preset');
      setDate(selectedDate);
      setDateRange([null, null]);
    } else if (mode === 'range') {
      setDateMode('range');
      setDateRange(selectedDate);
      setDate(null);
    } else if (mode === 'single') {
      setDateMode('single');
      setDate(selectedDate);
      setDateRange([null, null]);
    }

    if (close) {
      setShowCalendar(false);
    }

    let fromDate, toDate;
    if (mode === 'preset') {
      if (Array.isArray(selectedDate)) {
        fromDate = new Date(selectedDate[0]);
        toDate = new Date(selectedDate[selectedDate.length - 1]);
        toDate.setHours(23, 59, 59, 999);
      } else if (selectedDate === "Bulan Ini") {
        const today = new Date();
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        toDate.setHours(23, 59, 59, 999);
      } else {
        fromDate = new Date(selectedDate);
        toDate = new Date(selectedDate);
        toDate.setHours(23, 59, 59, 999);
      }
    } else if (mode === 'range' && selectedDate[0] && selectedDate[1]) {
      fromDate = new Date(selectedDate[0]);
      toDate = new Date(selectedDate[1]);
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 999);
    } else if (mode === 'single') {
      fromDate = new Date(selectedDate);
      toDate = new Date(selectedDate);
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 999);
    } else {
      return;
    }

    fetchData(fromDate, toDate, 1);
  };



  // PAGINATION FEATURE
  const getVisiblePageNumbers = () => {
    const pages = [];
    if (totalPages <= 10) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
        return pages;
    }
    
    if (currentPage <= 3) {
      pages.push(1, 2, 3);
      if (totalPages > 4) {
        pages.push('...');
        pages.push(totalPages - 1, totalPages);
      }
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, 2);
      if (totalPages > 4) {
          pages.push('...');
      }
      pages.push(totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, 2);
      pages.push('...');
      pages.push(currentPage - 1, currentPage, currentPage + 1);
      pages.push('...');
      pages.push(totalPages - 1, totalPages);
    }

    return pages;
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
      setCurrentPage(pageNumber);

      const { fromDate, toDate } = getCurrentDateRange();
      if (fromDate && toDate) {
        const currentFilters = buildCurrentFilters();
        fetchTableData(fromDate, toDate, pageNumber, currentFilters);
      }
    }
  };

  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const renderPagination = () => {
    const visiblePages = getVisiblePageNumbers();
    const showFirstLastButtons = totalPages > 10;
    const getWidthWindow = window.innerWidth;

    return (
      <div className="custom-container-pagination mt-3">
        <div className="custom-pagination-select d-flex align-items-center gap-2">
          {/* <span
            style={{
              display: `${getWidthWindow < 768 ? 'none' : 'block'}`
            }}
          >Tampilan</span> */}
          <select
            className="form-select"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            style={{ width: "80px" }}
          >
            <option value="20">20</option>
            <option value="30">30</option>
            <option value="50">50</option>
          </select>
          <span>data per halaman</span>
        </div>

        <nav className="custom-pagination-list" aria-label="Page navigation">
          <ul className="pagination mb-0" style={{
            gap: `${totalPages < 10 ? '1rem' : ''}`,
          }}>
            {
              totalPages >= 10 && getWidthWindow >= 768 ? (
                <>
                  {/* First page button (hanya muncul jika > 10 halaman) */}
                  {showFirstLastButtons && (
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link sm-me-2"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        title="Ke halaman pertama"
                      >
                        Awal
                      </button>
                    </li>
                  )}
                  {/* Previous button */}
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      title="Halaman sebelumnya"
                    >
                      <FaAngleLeft />
                    </button>
                  </li>

                  {visiblePages.map((page, index) => {
                    if (page === '...') {
                      return (
                        <li key={`ellipsis-${index}`} className="page-item disabled">
                          <span className="page-link">...</span>
                        </li>
                      );
                    }

                    return (
                      <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                      </li>
                    );
                  })}

                  {/* Next button */}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      title="Halaman selanjutnya"
                    >
                      <FaAngleRight />
                    </button>
                  </li>
                  {showFirstLastButtons && (
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link sm-ms-2"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        title="Ke halaman terakhir"
                      >
                        Akhir
                      </button>
                    </li>
                  )}
                </>
              ) : (
                <>
                  <div className="d-flex">
                    {/* First page button (hanya muncul jika > 10 halaman) */}
                    {showFirstLastButtons && (
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                          className="d-none sm-d-block page-link"
                          onClick={() => handlePageChange(1)}
                          disabled={currentPage === 1}
                          title="Ke halaman pertama"
                        >
                          Awal
                        </button>
                      </li>
                    )}

                    {/* Previous button */}
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        title="Halaman sebelumnya"
                      >
                        <FaAngleLeft />
                      </button>
                    </li>
                  </div>

                  <div className="d-flex">
                    {visiblePages.map((page, index) => {
                      if (page === '...') {
                        return (
                          <li key={`ellipsis-${index}`} className="page-item disabled">
                            <span className="page-link">...</span>
                          </li>
                        );
                      }

                      return (
                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
                        </li>
                      );
                    })}
                  </div>

                  <div className="d-flex">
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        title="Halaman selanjutnya"
                      >
                        <FaAngleRight />
                      </button>
                    </li>

                    {showFirstLastButtons && (
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button
                          className="d-none sm-d-block page-link"
                          onClick={() => handlePageChange(totalPages)}
                          disabled={currentPage === totalPages}
                          title="Ke halaman terakhir"
                        >
                          Akhir
                        </button>
                      </li>
                    )}
                  </div>
                </>
              )
            }
          </ul>
        </nav>
      </div>
    );
  };



  // FILTER COLUMNS FEATURE
  const allColumns = [
    { key: "name", label: "Nama" },
    { key: "stock", label: "Stok" },
    { key: "code", label: "Kode" },
    { key: "salesAvailability", label: "Availability" },
    { key: "status", label: "Status" },
    { key: "classification", label: "Sales Clasification" },
  ];

  const [selectedColumns, setSelectedColumns] = useState(
    allColumns.map((col) => col.key)
  );

  const toggleRow = useCallback((productId) => {
    setExpandedVariantProduct((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  }, []);

  const handleColumnChange = (colKey) => {
    setSelectedColumns((prev) =>
      prev.includes(colKey)
        ? prev.filter((key) => key !== colKey)
        : [...prev, colKey]
    );
  };



  // SALES CLASSIFICATION ADS FEATURE
  const typeClasificationOptions = [
    { value: "best_seller", label: "Best Seller" },
    { value: "middle_moving", label: "Middle Moving" },
    { value: "slow_moving", label: "Slow Moving" },
  ];

  const handleClassificationChange = (selectedOptions) => {
    setSelectedClassificationOption(selectedOptions);
  };



  const handleSortStock = (order) => {
    if (sortOrderData === order) {
      setSortOrderData(null);
      setFilteredData([...chartRawData]);
    } else {
      setSortOrderData(order);
      const sortedData = [...filteredData].sort((a, b) => {
        const aLatestData = getLatestStockData(a);
        const bLatestData = getLatestStockData(b);
        const aStock = aLatestData?.totalAvailableStock || 0;
        const bStock = bLatestData?.totalAvailableStock || 0;

        return order === "asc" ? aStock - bStock : bStock - aStock;
      });

      setFilteredData(sortedData);
    }
  };

  const toggleOpenCalendar = () => {
    if (showCalendar) {
      setAnimateCalendar(false);
      setTimeout(() => setShowCalendar(false), 100);
    } else {
      setShowCalendar(true);
      setTimeout(() => setAnimateCalendar(true), 100);
    }
  };

  const memoizedChartData = React.useMemo(() => {
    if (!chartRawData.length) return [];

    const currentDate = dateMode === 'preset' ? date : 
      dateMode === 'range' ? dateRange : date;
    
    return generateChartData(currentDate, selectedProduct);
  }, [chartRawData, date, dateRange, dateMode, selectedProduct]);

  const memoizedVariantsChartData = React.useMemo(() => {
    if (!selectedProduct || !chartRawData.length) return [];

    const currentDate = dateMode === 'preset' ? date : 
      dateMode === 'range' ? dateRange : date;
    
    return generateVariantsChartData(currentDate, selectedProduct);
  }, [chartRawData, date, dateRange, dateMode, selectedProduct]);

  useEffect(() => {
    setChartData(memoizedChartData);
  }, [memoizedChartData]);

  useEffect(() => {
    setVariantsChartData(memoizedVariantsChartData);
  }, [memoizedVariantsChartData]);


  const chartInstanceRef = useRef(null);
  useEffect(() => {
    if (!chartRef.current || !chartData.length) return;

    const timeoutId = setTimeout(() => { 
      if (chartInstanceRef.current && !chartInstanceRef.current.isDisposed()) {
        chartInstanceRef.current.dispose();
      }

      chartInstanceRef.current = echarts.init(chartRef.current);

      let xAxisData = chartData.map((item) => item.date);
      const includesColon = xAxisData.some((item) => item.includes(":"));

      if (includesColon) {
        xAxisData = xAxisData.map((item) => item.split(" ")[1]);
      } else {
        xAxisData = xAxisData.map((item) => item.split("-").slice(1).join("/"));
      }

      const allValues = chartData.map(d => d.totalStock);
      variantsChartData.forEach(v => {
        v.data.forEach(d => allValues.push(d.totalStock));
      });

      const maxYValue = Math.max(...allValues);
      let dynamicLeft = 35;
      if (maxYValue >= 1000) dynamicLeft = 50;
      if (maxYValue >= 10_000) dynamicLeft = 60;
      if (maxYValue >= 100_000) dynamicLeft = 70;
      if (maxYValue >= 1_000_000) dynamicLeft = 80;
      if (maxYValue >= 10_000_000) dynamicLeft = 90;
      if (maxYValue >= 100_000_000) dynamicLeft = 100;
      if (maxYValue >= 1_000_000_000) dynamicLeft = 110;

      const series = [
        {
          name: selectedProduct ? selectedProduct.name : "Total Stock",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: chartData.map((item) => item.totalStock),
          lineStyle: { color: "#5470C6", width: 2},
          emphasis: { focus: 'series' }
        },
      ];

      if (selectedProduct && variantsChartData.length > 0) {
        const grayColors = [
          "#95A5A6", "#7F8C8D", "#BDC3C7", "#85929E", "#A6ACAF",
          "#909497", "#ABB2B9", "#CCD1D1", "#D5DBDB", "#EAEDED"
        ];

        variantsChartData.forEach((variant, index) => {
          series.push({
            name: `↳ ${variant.name}`,
            type: "line",
            smooth: true,
            showSymbol: false,
            data: variant.data.map((item) => item.totalStock),
            lineStyle: {
              color: grayColors[index % grayColors.length],
              width: 1.5,
              type: 'dashed'
            },
            emphasis: { focus: 'series' }
          });
        });
      }

      chartInstanceRef.current.setOption({
        toolbox: { feature: { saveAsImage: {} } },
        grid: { left: dynamicLeft, right: 50, bottom: 70, containLabel: false },
        tooltip: {
          trigger: "axis",
          extraCssText: 'box-shadow: none;',
          backgroundColor: "transparent",
          borderWidth: 0,
          formatter: function (params) {
            const date = params[0].axisValue;
            let tooltipHTML = `
              <div style="
                background: white;
                border-radius: 6px;
                box-shadow: 0 0 4px rgba(0,0,0,0.1);
                overflow: hidden;
                font-family: sans-serif;
              ">
                <div style="
                  background: #EDEDEDFF;
                  padding: 6px 12px;
                  font-weight: bold;
                  font-size: 13px;
                  border-bottom: 1px solid #dddddd;
                  color: #101010FF;
                ">${date}</div>
                <div style="padding: 6px 12px; font-size: 13px;">
            `;

            params.forEach((param) => {
              tooltipHTML += `
                <div style="display: flex; align-items: center; justify-content: space-between; margin: 4px 0; gap: 4px;">
                  <div style="display: flex; align-items: center;">
                    <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${param.color}; margin-right:6px;"></span>
                    ${param.seriesName}
                  </div>
                  <strong>${formatTableValue(param.value, "number")}</strong>
                </div>
              `;
            });

            tooltipHTML += `</div></div>`;
            return tooltipHTML;
          },
        },
        legend: {
          data: series.map(s => s.name),
          bottom: 0,
          type: 'scroll',
          icon: 'circle',
          itemWidth: 8,
        },
        xAxis: {
          type: "category",
          data: xAxisData,
          boundaryGap: false,
          axisLabel: {
            interval: 0,
            formatter: function (value, index) {
              const total = xAxisData.length;
              let modulus = 1;
              if (total > 56) modulus = 5;
              else if (total > 42) modulus = 4;
              else if (total > 28) modulus = 3;
              else if (total > 14) modulus = 2;

              return index % modulus === 0 ? value : '';
            },
            rotate: 0,
          },
        },
        yAxis: {
          type: "value",
          splitLine: { show: true },
          name: 'Stock',
          nameGap: 30
        },
        series: series,
      });

      const handleResize = () => {
        if (chartInstanceRef.current && !chartInstanceRef.current.isDisposed()) {
          chartInstanceRef.current.resize();
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartInstanceRef && !chartInstanceRef.isDisposed()) {
          chartInstanceRef.dispose();
        }
      };
    });

    return () => {
      clearTimeout(timeoutId);
      if (chartInstanceRef.current && !chartInstanceRef.current.isDisposed()) {
        chartInstanceRef.current.dispose();
      }
    };
  }, [chartData, variantsChartData, selectedProduct]);

  useEffect(() => {
    setCurrentPage(1);

    const { fromDate, toDate } = getCurrentDateRange();
    if (fromDate && toDate) {
      const currentFilters = buildCurrentFilters();
      fetchTableData(fromDate, toDate, 1, currentFilters);
    }
  }, [
    debouncedSearchTerm, 
    statusProductStockFilter, 
    selectedClassificationOption,
    dateMode, 
    date, 
    dateRange,
    itemsPerPage
  ]);

  useEffect(() => {
    const today = new Date();
    const fromDate = new Date();
    fromDate.setDate(today.getDate() - 7);
    const toDate = new Date();
    toDate.setHours(23, 59, 59, 999);

    fetchData(fromDate, toDate, 1);
  }, []);

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
                <h5>{totalElements} total produk</h5>
                <div style={{ position: "relative" }}>
                  <button
                    onClick={toggleOpenCalendar}
                    className="btn btn-primary"
                  >
                    {formatDateDisplay()}
                  </button>
                  {showCalendar && (
                    <div
                      className={`d-flex custom-calendar-behavior-v2 ${animateCalendar ? "show" : ""}`}
                      style={{
                        position: "absolute",
                        top: "50px",
                        right: "0",
                        zIndex: 1000,
                        background: "white",
                        boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
                        borderRadius: "8px",
                        padding: "10px 10px",
                      }}
                    >
                      <Calendar
                        selectRange={true}
                        onChange={(selectedDate) => {
                          if (Array.isArray(selectedDate)) {
                            if (selectedDate[0] && selectedDate[1]) {
                              const startDate = getLocalDateString(selectedDate[0]);
                              const endDate = getLocalDateString(selectedDate[1]);
                              
                              if (startDate === endDate) {
                                handleDateSelection(startDate, 'single');
                              } else {
                                handleDateSelection([startDate, endDate], 'range');
                              }
                            } else if (selectedDate[0]) {
                              const singleDate = getLocalDateString(selectedDate[0]);
                              handleDateSelection(singleDate, 'single');
                            }
                          } else if (selectedDate instanceof Date) {
                            handleDateSelection(getLocalDateString(selectedDate), 'single');
                          }
                        }}
                        value={(() => {
                          if (dateMode === 'range' && dateRange[0] && dateRange[1]) {
                            return [new Date(dateRange[0]), new Date(dateRange[1])];
                          } else if (dateMode === 'single' && date && date !== "Bulan Ini" && !Array.isArray(date)) {
                            return new Date(date);
                          } else if (dateMode === 'preset' && date && date !== "Bulan Ini" && !Array.isArray(date)) {
                            return new Date(date);
                          }
                          return null;
                        })()}
                        maxDate={new Date()}
                      />
                      <div
                        id="custom-calendar-behavior-barrier-v2"
                        style={{
                          width: "1px",
                          height: "auto",
                          backgroundColor: "#E3E3E3FF",
                          margin: "10px 14px 0",
                        }}
                      ></div>
                      <div
                        className="custom-content-calendar-v2 d-flex flex-column py-2 px-1"
                        style={{ width: "130px", listStyleType: "none" }}
                      >
                        <p
                          className="mb-2 cursor-pointer"
                          onClick={() => handleDateSelection(new Date().toISOString().split("T")[0], 'preset')}
                          style={{ cursor: 'pointer' }}
                        >
                          Hari ini
                        </p>
                        <p
                          className="mb-2 cursor-pointer"
                          onClick={() => {
                            const yesterday = new Date();
                            yesterday.setDate(yesterday.getDate() - 1);
                            handleDateSelection(yesterday.toISOString().split("T")[0], 'preset');
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          Kemarin
                        </p>
                        <p
                          className="mb-2 cursor-pointer"
                          onClick={() => handleDateSelection(getAllDaysInLast7Days(), 'preset')}
                          style={{ cursor: 'pointer' }}
                        >
                          1 Minggu terakhir
                        </p>
                        <p
                          className="mb-2 cursor-pointer"
                          onClick={() => handleDateSelection("Bulan Ini", 'preset')}
                          style={{ cursor: 'pointer' }}
                        >
                          Bulan ini
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {isLoading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
                  <Loading size={40} />
                </div>
              ) : (
                <>
                  <div
                    ref={chartRef}
                    style={{ width: "100%", height: "340px" }}
                    className="mb-2"
                  ></div>
                  {/* Filter & Table */}
                  <div className="d-flex flex-column gap-3 gap-md-2">
                    {/* Status filter */}
                    <div
                      className="d-flex align-items-center gap-1 gap-md-2 flex-wrap mt-2"
                      style={{ width: "fit-content", listStyleType: "none" }}
                    >
                      <span>Status Produk</span>
                      <div className="d-flex gap-1 md-gap-2 flex-wrap">
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
                        <div
                          className={`status-button-filter rounded-pill d-flex align-items-center ${statusProductStockFilter === "scheduled"
                              ? "custom-font-color custom-border-select fw-bold"
                              : "border border-secondary-subtle"
                            }`}
                          onClick={() => setStatusProductStockFilter("scheduled")}
                          style={{
                            cursor: "pointer",
                            fontSize: "12px",
                            padding: "6px 12px",
                          }}
                        >
                          Terjadwal
                        </div>
                        <div
                          className={`status-button-filter rounded-pill d-flex align-items-center  ${statusProductStockFilter === "ongoing"
                              ? "custom-font-color custom-border-select fw-bold"
                              : "border border-secondary-subtle"
                            }`}
                          onClick={() => setStatusProductStockFilter("ongoing")}
                          style={{
                            cursor: "pointer",
                            fontSize: "12px",
                            padding: "6px 12px",
                          }}
                        >
                          Berjalan
                        </div>
                        <div
                          className={`status-button-filter rounded-pill d-flex align-items-center  ${statusProductStockFilter === "closed"
                              ? "custom-font-color custom-border-select fw-bold"
                              : "border border-secondary-subtle"
                            }`}
                          onClick={() => setStatusProductStockFilter("closed")}
                          style={{
                            cursor: "pointer",
                            fontSize: "12px",
                            padding: "6px 12px",
                          }}
                        >
                          Nonaktif
                        </div>
                        <div
                          className={`status-button-filter rounded-pill d-flex align-items-center ${statusProductStockFilter === "ended"
                              ? "custom-font-color custom-border-select fw-bold"
                              : "border border-secondary-subtle"
                            }`}
                          onClick={() => setStatusProductStockFilter("ended")}
                          style={{
                            cursor: "pointer",
                            fontSize: "12px",
                            padding: "6px 12px",
                          }}
                        >
                          Berakhir
                        </div>
                        <div
                          className={`status-button-filter rounded-pill d-flex align-items-center ${statusProductStockFilter === "deleted"
                              ? "custom-font-color custom-border-select fw-bold"
                              : "border border-secondary-subtle"
                            }`}
                          onClick={() => setStatusProductStockFilter("deleted")}
                          style={{
                            cursor: "pointer",
                            fontSize: "12px",
                            padding: "6px 12px",
                          }}
                        >
                          Dihapus
                        </div>
                      </div>
                    </div>
                    {/* Other filter*/}
                    <div className="d-flex flex-column mb-1 sm-mb-3 gap-2">
                      <div
                        id="container-other-filters"
                        className="d-flex w-full justify-content-between align-items-center"
                      >
                        <div
                          id="container-other-filters-left"
                          className="d-flex gap-2 flex-wrap"
                        >
                          {/* Search bar */}
                          <div className="custom-filter-search">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Cari berdasarkan nama"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                          {/* Clasification filter */}
                          <div className="custom-filter-salesClassification">
                            <Select
                              isMulti
                              options={typeClasificationOptions}
                              value={selectedClassificationOption}
                              onChange={handleClassificationChange}
                              placeholder="Filter Klasifikasi"
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  backgroundColor: "#FFFFFF00 !important",
                                  border: "0.5px solid #d8dfe7 !important",
                                  borderColor: "#d8dfe7 !important",
                                  boxShadow: "none",
                                  "&:hover": {
                                    border: "0.5px solid #d8dfe7 !important",
                                    boxShadow: "none",
                                  },
                                  "&:focus": {
                                    border: "0.5px solid #d8dfe7 !important",
                                    boxShadow: "none",
                                  },
                                  "&:active": {
                                    border: "0.5px solid #d8dfe7 !important",
                                    boxShadow: "none",
                                  },
                                  padding: "0.6px 4px",
                                }),
                                multiValue: (base) => ({
                                  ...base,
                                  backgroundColor: "#F9DBBF",
                                }),
                              }}
                            />
                          </div>
                        </div>
                        {/* Column filter */}
                        <div id="container-other-filters-right">
                          <button
                            className="btn btn-primary dropdown-toggle w-100"
                            type="button"
                            onClick={() => setShowTableColumn(!showTableColumn)}
                          >
                            Pilih kriteria
                          </button>
                        </div>
                      </div>
                      {/* Option column filter */}
                      {showTableColumn && (
                        <div className="border px-2 py-2 rounded">
                          {allColumns.map((col) => (
                            <div
                              key={col.key}
                              className="form-check form-check-inline my-1"
                            >
                              <input
                                style={{
                                  border: "1px solid #8042D4",
                                  width: "18px",
                                  height: "18px",
                                  borderRadius: "10%",
                                }}
                                className="form-check-input"
                                type="checkbox"
                                checked={selectedColumns.includes(col.key)}
                                onChange={() => handleColumnChange(col.key)}
                              />
                              <label className="form-check-label fs-5 ms-1">
                                {col.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ position: 'relative' }}>
                      {isTableFilterLoading && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            paddingTop: filteredData.length > 0 ? '85px' : '0px',
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'start',
                            zIndex: 10,
                            minHeight: filteredData.length > 0 ? '200px' : '50px',
                          }}
                        >
                          <Loading size={40} />
                        </div>
                      )}
                      {/* {isTableFilterLoading ? (
                        <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
                          <Loading size={30} />
                        </div>
                      ) : (                       */}
                        <div className="table-responsive" style={{ borderRadius: "4px" }}>
                          <table
                            className="table table-centered"
                            style={{
                              width: "100%",
                              minWidth: "max-content",
                              maxWidth: "none",
                            }}
                          >
                            {/* Head table */}
                            <thead className="table-light">
                              <tr>
                                {filteredData.length > 0 && <th scope="col"></th>}
                                {allColumns
                                  .filter((col) => selectedColumns.includes(col.key))
                                  .map((col) => (
                                    <th key={col.key}>
                                      <div className="d-flex justify-content-start gap-1 align-items-center fw-bold">
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
                              {filteredData.length > 0 ? (
                                filteredData.map((entry) => {
                                  const latestStockData = getLatestStockData(entry);
                                  return (
                                    <React.Fragment key={entry.productId}>
                                      <tr>
                                        {filteredData.length > 0 && (
                                          <td
                                            onClick={() => toggleRow(latestStockData.productId)}
                                            style={{ cursor: "pointer", width: "20px" }}
                                          >
                                            {expandedVariantProduct[latestStockData.productId] ? <FaAngleUp /> : <FaAngleDown />}
                                          </td>
                                        )}

                                        {selectedColumns.includes("name") && (
                                          <td
                                            style={{
                                              width: "400px",
                                              cursor: "pointer",
                                              color: selectedProduct?.productId == latestStockData.productId ? "#F6881F" : "",
                                            }}
                                            onClick={() => handleProductClick(latestStockData)}
                                          >
                                            {latestStockData?.name || "-"}
                                          </td>
                                        )}

                                        {selectedColumns.includes("stock") && (
                                          <td style={{ width: "160px" }}>
                                            <div className="d-flex flex-column align-items-start">
                                              <span>{latestStockData?.totalAvailableStock === undefined || latestStockData?.totalAvailableStock === null ? "-" : latestStockData?.totalAvailableStock} Stok</span>
                                            </div>
                                          </td>
                                        )}

                                        {selectedColumns.includes("code") && (
                                          <td>{latestStockData?.productId === undefined || latestStockData?.productId === null ? "-" : latestStockData?.productId}</td>
                                          // <td>{latestStockData?.parentSku === undefined || latestStockData?.parentSku === null ? "-" : latestStockData?.parentSku}</td>
                                        )}

                                        {selectedColumns.includes("salesAvailability") && (
                                          <td style={{ width: "180px" }}>
                                            <span className={`badge text-${latestStockData?.isSalesAvailable === true ? "success" : "danger"}`}>
                                              {latestStockData?.salesAvailability === undefined || latestStockData?.salesAvailability === null ? "-" : latestStockData?.salesAvailability}
                                            </span>
                                          </td>
                                        )}

                                        {selectedColumns.includes("status") && (
                                          <td style={{ width: "160px" }}>
                                            {
                                              latestStockData.state === null || latestStockData.state === undefined ? "-" : convertStatusToLabel(latestStockData.state)
                                            }
                                          </td>
                                        )}

                                        {selectedColumns.includes("classification") && (
                                          <td>
                                            <span>{latestStockData?.classification === undefined || latestStockData?.classification === null ? "-" : latestStockData?.classification}</span>
                                          </td>
                                        )}
                                      </tr>
                                      {expandedVariantProduct[latestStockData.productId] && (
                                        latestStockData?.modelStocks && latestStockData.modelStocks.length > 0 ? (
                                          <tr className="bg-light">
                                            <td
                                              colSpan={selectedColumns.length + 1}
                                              style={{ padding: "4px 4px", border: "none" }}
                                            >
                                              <ul className="list-group">
                                                {latestStockData.modelStocks.map((variant) => (
                                                  <li
                                                    key={variant.id}
                                                    className="list-group-item d-flex justify-content-start gap-2"
                                                  >
                                                    <span style={{ width: "8px" }}></span>
                                                    <span style={{ width: "388px" }}>
                                                      {variant.name}
                                                    </span>
                                                    <span>{variant.totalAvailableStock || 0} Stok</span>
                                                  </li>
                                                ))}
                                              </ul>
                                            </td>
                                          </tr>
                                        ) : (
                                          <tr className="bg-light">
                                            <td
                                              colSpan={selectedColumns.length + 1}
                                              style={{ padding: "12px 4px", border: "none", borderRadius: "4px" }}
                                            >
                                              <span>Tidak ada varian untuk produk ini</span>
                                            </td>
                                          </tr>
                                        )
                                      )}
                                    </React.Fragment>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td colSpan={selectedColumns.length + 1} className="text-left">
                                    Data tidak tersedia
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      {/* )} */}
                    </div>
                    {/* Pagination */}
                    {filteredData.length > 0 &&
                      filteredData !== null &&
                      renderPagination()}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </BaseLayout>
    </>
  );
};