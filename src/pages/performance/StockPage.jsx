import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from 'react-dom';
import * as echarts from "echarts";
import Calendar from "react-calendar";
import Select from "react-select";
import toast from "react-hot-toast";
import { FaAngleLeft, FaAngleRight, FaAngleDown, FaAngleUp } from "react-icons/fa6";
import { AiOutlineQuestionCircle } from "react-icons/ai";

import axiosRequest from "../../utils/request";
import useDebounce from "../../hooks/useDebounce";
import formatStyleSalesClassification from "../../utils/convertFormatSalesClassification";
import formatTableValue from "../../utils/formatTableValue";
import BaseLayout from "../../components/organisms/BaseLayout";
import Loading from "../../components/atoms/Loading/Loading";


export default function PerformanceStockPage() {
  // Data
  const [chartRawData, setChartRawData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [rawTableData, setRawTableData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const chartRef = useRef(null);
  const [variantsChartData, setVariantsChartData] = useState([]);
  const chartInstanceRef = useRef(null);
  const [allSortedData, setAllSortedData] = useState([]);
  // Filter
  const [date, setDate] = useState(getAllDaysInLast7Days());
  const [dateRange, setDateRange] = useState([null, null]);
  const [dateMode, setDateMode] = useState('preset');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showTableColumn, setShowTableColumn] = useState(false);
  const [selectedClassificationOption, setSelectedClassificationOption] =
    useState([]);
  const [expandedVariantProduct, setExpandedVariantProduct] = useState({});
  const [sortOrderData, setSortOrderData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  // Other
  const [showCalendar, setShowCalendar] = useState(false);
  const [animateCalendar, setAnimateCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [isTableFilterLoading, setIsTableFilterLoading] = useState(false);
  const [isSortingMode, setIsSortingMode] = useState(false);
  const [isRefreshLoading, setIsRefreshLoading] = useState(false);
  const [tanggal, setTanggal] = useState(null);
  const [hoveredColumnKey, setHoveredColumnKey] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const iconRefs = useRef({});

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

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays == 0) {
      return getHourlyIntervals(getLocalDateString(start));
    }

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
    const { from1, to1 } = calculateComparisonDates(fromDate, toDate);

    const from1ISO = toLocalISOString(from1);
    const to1ISO = toLocalISOString(to1);

    let apiUrl = `${baseUrl}?shopId=${getShopeeId}&from1=${from1ISO}&to1=${to1ISO}&limit=${limit}`;

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

  const [isChartLoading, setIsChartLoading] = useState(false);
  const fetchChartData = async (fromDate, toDate) => {
    setIsChartLoading(true);

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
        100000
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
    } finally {
      setIsChartLoading(false);
    }
  };

  const fetchAllTableData = async (fromDate, toDate, filters = {}) => {
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
        100000,
        0
      );

      if (filters.searchQuery && filters.searchQuery.trim() !== "") {
        apiUrl += `&name=${encodeURIComponent(filters.searchQuery.trim())}`;
      }

      if (filters.classification && filters.classification.length > 0) {
        const classificationValues = filters.classification.map(cls => cls.value);
        apiUrl += `&salesClassification=${classificationValues.join(",")}`;
      }

      const response = await axiosRequest.get(apiUrl);
      const data = response.data;
      const content = data.content || [];

      setRawTableData(content);
      setAllSortedData(content);
      setTotalElements(data?.totalElements || 0);

      return content;
    } catch (error) {
      toast.error("Gagal mengambil data tabel stock produk");
      console.error('Gagal mengambil data tabel stock produk, kesalahan pada server:', error);
      return [];
    } finally {
      setIsTableFilterLoading(false);
    }
  }

  const fetchTableData = async (fromDate, toDate, page = 1, filters = {}, customItemsPerPage = null) => {
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

      const effectiveItemsPerPage = customItemsPerPage || itemsPerPage;

      let apiUrl = buildApiUrlWithComparison(
        '/api/product-stock/by-shop',
        getShopeeId,
        currentFromDate,
        currentToDate,
        effectiveItemsPerPage,
        page
      );

      if (filters.searchQuery && filters.searchQuery.trim() !== "") {
        apiUrl += `&name=${encodeURIComponent(filters.searchQuery.trim())}`;
      }

      if (filters.classification && filters.classification.length > 0) {
        const classificationValues = filters.classification.map(cls => cls.value);
        apiUrl += `&salesClassification=${classificationValues.join(",")}`;
      }

      const response = await axiosRequest.get(apiUrl);
      const data = response.data;
      const content = data.content || [];

      setFilteredData(content);
      setTanggal(content.timeGetted || "-");
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

  const applyFrontendPagination = (data, page, itemsPerPage) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);
    const totalPages = Math.ceil(data.length / itemsPerPage);

    setFilteredData(paginatedData);
    setTotalPages(totalPages);

    return paginatedData;
  };

  const fetchData = async (fromDate, toDate, page = 1) => {
    const isInitialLoad = !rawTableData.length;
    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsContentLoading(true);
    }

    try {
      const currentFilters = {
        searchQuery: debouncedSearchTerm,
        classification: selectedClassificationOption
      };

      // Lalu fetch data tabel (sesuai sorting mode)
      if (isSortingMode) {
        await fetchAllTableData(fromDate, toDate, currentFilters);
        setIsLoading(false);
      } else {
        await fetchTableData(fromDate, toDate, page, currentFilters);
        setIsLoading(false);
      }

      // Fetch chart data dulu
      await fetchChartData(fromDate, toDate);


      // Apply pagination kalau sorting mode aktif dan data tersedia
      if (isSortingMode && allSortedData.length > 0) {
        applyFrontendPagination(allSortedData, page, itemsPerPage);
      }
    } catch (error) {
      toast.error("Gagal mengambil data stock produk");
      console.error('Gagal mengambil data stock produk, kesalahan pada server:', error);
    } finally {
      setIsLoading(false);
      setIsContentLoading(false);
    }
  };


  // const fetchData = async (fromDate, toDate, page = 1) => {
  //   const isInitialLoad = !rawTableData.length;
  //   if (isInitialLoad) {
  //     setIsLoading(true);
  //   } else {
  //     setIsContentLoading(true);
  //   }

  //   try {
  //     const currentFilters = {
  //       searchQuery: debouncedSearchTerm,
  //       classification: selectedClassificationOption
  //     };

  //     await Promise.all([
  //       fetchChartData(fromDate, toDate),
  //       isSortingMode ?
  //         fetchAllTableData(fromDate, toDate, currentFilters) :
  //         fetchTableData(fromDate, toDate, page, currentFilters)
  //     ]);

  //     if (isSortingMode && allSortedData.length > 0) {
  //       applyFrontendPagination(allSortedData, page, itemsPerPage);
  //     }
  //   } catch (error) {
  //     toast.error("Gagal mengambil data stock produk");
  //     console.error('Gagal mengambil data stock produk, kesalahan pada server:', error);
  //   } finally {
  //     setIsLoading(false);
  //     setIsContentLoading(false);
  //   }
  // };

  const buildCurrentFilters = () => {
    return {
      searchQuery: debouncedSearchTerm,
      classification: selectedClassificationOption,
    };
  };

  const handleProductClick = (product) => {
    const productData = product.data && product.data[0] ? product.data[0] : product;
    setSelectedProduct((prev) => (prev?.productId === productData.productId ? null : productData));
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

      if (isSortingMode) {
        applyFrontendPagination(allSortedData, pageNumber, itemsPerPage);
      } else {
        const { fromDate, toDate } = getCurrentDateRange();
        if (fromDate && toDate) {
          const currentFilters = buildCurrentFilters();
          fetchTableData(fromDate, toDate, pageNumber, currentFilters);
        }
      }
    }
  };

  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);

    if (isSortingMode) {
      applyFrontendPagination(allSortedData, 1, newItemsPerPage);
    } else {
      const { fromDate, toDate } = getCurrentDateRange();
      if (fromDate && toDate) {
        const currentFilters = buildCurrentFilters();
        fetchTableData(fromDate, toDate, 1, currentFilters, newItemsPerPage);
      }
    }
  };

  const renderPagination = () => {
    const visiblePages = getVisiblePageNumbers();
    const showFirstLastButtons = totalPages > 10;
    const getWidthWindow = window.innerWidth;

    return (
      <div className="custom-container-pagination mt-2">
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
    { key: "stock", label: "Stok", tooltip: "Stok merupakan total keseluruhan stok yang dimiliki Penjual, termasuk stok yang dikunci untuk promosi. Jika suatu produk memiliki stok yang dikunci untuk promosi, maka jumlah stok yang akan ditampilkan sudah termasuk stok yang tersedia untuk dijual." },
    { key: "code", label: "Kode" },
    { key: "salesAvailability", label: "Availability" },
    { key: "salesClassification", label: "Sales Clasification" },
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
    { value: "Best Seller", label: "Best Seller" },
    { value: "Middle Moving", label: "Middle Moving" },
    { value: "Slow Moving", label: "Slow Moving" },
  ];

  const handleClassificationChange = (selectedOptions) => {
    setSelectedClassificationOption(selectedOptions);
  };


  const handleSortStock = async (order) => {
    setIsTableFilterLoading(true);

    try {
      const { fromDate, toDate } = getCurrentDateRange();

      if (!fromDate || !toDate) {
        toast.error("Tanggal tidak valid");
        return;
      }

      if (sortOrderData === order) {
        setSortOrderData(null);
        setIsSortingMode(false);
        setCurrentPage(1);

        const currentFilters = buildCurrentFilters();
        await fetchTableData(fromDate, toDate, 1, currentFilters);

      } else {
        setSortOrderData(order);
        setIsSortingMode(true);
        setCurrentPage(1);

        const currentFilters = buildCurrentFilters();
        const allData = await fetchAllTableData(fromDate, toDate, currentFilters);

        const sortedData = [...allData].sort((a, b) => {
          const aStock = (a.data && a.data[0] && a.data[0].totalAvailableStock) || 0;
          const bStock = (b.data && b.data[0] && b.data[0].totalAvailableStock) || 0;
          return order === "asc" ? aStock - bStock : bStock - aStock;
        });

        setAllSortedData(sortedData);

        applyFrontendPagination(sortedData, 1, itemsPerPage);
      }
    } catch (error) {
      console.error('Error in sorting:', error);
      toast.error("Gagal mengurutkan data");
    } finally {
      setIsTableFilterLoading(false);
    }
  };

  const handleRefreshData = async () => {
    setIsRefreshLoading(true);
    setTanggal("Loading mengambil data");

    try {
      const refreshResponse = await axiosRequest.get(
        `/api/product-stock/refresh?shopId=${getShopeeId}`
      );

      if (refreshResponse.data === true) {
        const { fromDate, toDate } = getCurrentDateRange();
        if (fromDate && toDate) {
          const currentFilters = buildCurrentFilters();

          if (isSortingMode) {
            const allData = await fetchAllTableData(fromDate, toDate, currentFilters);

            const sortedData = [...allData].sort((a, b) => {
              const aStock = (a.data && a.data[0] && a.data[0].totalAvailableStock) || 0;
              const bStock = (b.data && b.data[0] && b.data[0].totalAvailableStock) || 0;
              return sortOrderData === "asc" ? aStock - bStock : bStock - aStock;
            });

            setAllSortedData(sortedData);
            applyFrontendPagination(sortedData, currentPage, itemsPerPage);
          } else {
            await fetchTableData(fromDate, toDate, currentPage, currentFilters);
          }
        }
      } else {
        toast.error("Gagal refresh data");
        setTanggal("-");
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error("Gagal refresh data");
      setTanggal("-");
    } finally {
      setIsRefreshLoading(false);
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
          lineStyle: { color: "#5470C6", width: 2 },
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
          name: includesColon ? 'Time' : 'Date',
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
    if (!fromDate || !toDate) return;

    if (isSortingMode) {
      const refetchAndSort = async () => {
        const currentFilters = buildCurrentFilters();
        const allData = await fetchAllTableData(fromDate, toDate, currentFilters);

        const sortedData = [...allData].sort((a, b) => {
          const aStock = (a.data && a.data[0] && a.data[0].totalAvailableStock) || 0;
          const bStock = (b.data && b.data[0] && b.data[0].totalAvailableStock) || 0;
          return sortOrderData === "asc" ? aStock - bStock : bStock - aStock;
        });

        setAllSortedData(sortedData);
        applyFrontendPagination(sortedData, 1, itemsPerPage);
      };

      refetchAndSort();
    } else {
      const currentFilters = buildCurrentFilters();
      fetchTableData(fromDate, toDate, 1, currentFilters);
    }
  }, [
    debouncedSearchTerm,
    selectedClassificationOption,
  ]);

  useEffect(() => {
    const today = new Date();
    const fromDate = new Date();
    fromDate.setDate(today.getDate() - 7);
    const toDate = new Date();
    toDate.setHours(23, 59, 59, 999);

    fetchData(fromDate, toDate, 1);
  }, []);

  const updateTooltipPosition = (key) => {
    if (iconRefs.current[key]) {
      const rect = iconRefs.current[key].getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      setTooltipPosition({
        top: rect.top + scrollTop - 5,
        left: rect.left + scrollLeft - 10
      });
    }
  };

  const handleMouseEnter = (key) => {
    setHoveredColumnKey(key);
    updateTooltipPosition(key);
  };

  const handleMouseLeave = () => {
    setHoveredColumnKey(null);
  };

  console.log("test", isLoading)
  return (
    <>
      <BaseLayout>
        <div className="d-flex flex-column gap-1">
          <div className="d-flex align-items-center">
            <h3>Performa stock</h3>
          </div>
          <div className="card">
            <div className="card-body">
              {/* Header & Date Filter */}
              <div className="d-flex justify-content-between align-items-start pb-2">
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
                <div className="d-flex justify-content-center align-items-start" style={{ height: "100vh" }}>
                  <Loading size={40} />
                </div>
              ) : (
                <>
                {
                  isChartLoading ? (
                    <div className="d-flex justify-content-center align-items-start" style={{ height: "340px" }}>
                      <Loading size={40} />
                    </div>
                  ) : (
                    <div
                      ref={chartRef}
                      style={{ width: "100%", height: "340px" }}
                      className="mb-2"
                    ></div>
                  )
                }
                  {/* Filter & Table */}
                  <div className="d-flex flex-column gap-3 gap-md-2">
                    {/* Other filter*/}
                    <div className="d-flex flex-column mb-1 sm-mb-3 gap-2 mt-2">
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
                          <p>{isRefreshLoading ? "Loading mengambil data" : tanggal}</p>
                          <button
                            className="btn btn-primary w-100"
                            type="button"
                            disabled={isRefreshLoading}
                            onClick={handleRefreshData}
                          >
                            {isRefreshLoading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Refresh...
                              </>
                            ) : (
                              "Refresh data Terbaru"
                            )}
                          </button>

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
                      <div className="table-responsive" style={{ borderRadius: "4px" }}>
                        <table
                          className="table table-centered"
                          style={{
                            width: "100%",
                            minWidth: "max-content",
                            maxWidth: "none",
                            overflowX: "visible",
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
                                      {col.tooltip && (
                                        <div
                                          ref={(el) => iconRefs.current[col.key] = el}
                                          style={{ cursor: "pointer", position: "relative" }}
                                          onMouseEnter={() => handleMouseEnter(col.key)}
                                          onMouseLeave={handleMouseLeave}
                                        >
                                          <AiOutlineQuestionCircle />
                                        </div>
                                      )}
                                      {col.key === "stock" && (
                                        <div className="d-flex flex-column">
                                          <span
                                            title="Sort Ascending"
                                            style={{
                                              color: sortOrderData === "asc" ? "#007bff" : "#969696FF",
                                              lineHeight: '1',
                                              cursor: 'pointer',
                                              userSelect: 'none',
                                              fontSize: '10px'
                                            }}
                                            onClick={() => handleSortStock("asc")}
                                          >
                                            <FaAngleUp />
                                          </span>
                                          <span
                                            title="Sort Descending"
                                            style={{
                                              color: sortOrderData === "desc" ? "#007bff" : "#969696FF",
                                              lineHeight: '1',
                                              cursor: 'pointer',
                                              userSelect: 'none',
                                              fontSize: '10px'
                                            }}
                                            onClick={() => handleSortStock("desc")}
                                          >
                                            <FaAngleDown />
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </th>
                                ))}
                            </tr>
                          </thead>
                          {hoveredColumnKey && createPortal(
                            <div
                              style={{
                                position: 'absolute',
                                top: tooltipPosition.top,
                                left: tooltipPosition.left,
                                backgroundColor: '#fff',
                                color: '#000',
                                padding: '8px 10px',
                                borderRadius: '4px',
                                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                                zIndex: 10000,
                                width: '200px',
                                maxWidth: '200px',
                                whiteSpace: 'normal',
                                fontSize: '12px',
                                border: '1px solid #ddd',
                                transform: 'translateY(-100%)'
                              }}
                            >
                              {allColumns.find(col => col.key === hoveredColumnKey)?.tooltip}
                              <div
                                style={{
                                  position: 'absolute',
                                  bottom: '-6px',
                                  left: '10px',
                                  width: '0',
                                  height: '0',
                                  borderLeft: '6px solid transparent',
                                  borderRight: '6px solid transparent',
                                  borderTop: '6px solid #fff'
                                }}
                              />
                            </div>,
                            document.body
                          )}
                          {/* Body Table */}
                          <tbody>
                            {filteredData.length > 0 ? (
                              filteredData.map((entry) => {
                                const productData = entry.data && entry.data[0] ? entry.data[0] : {};
                                return (
                                  <React.Fragment key={entry.productId || productData.productId}>
                                    <tr>
                                      {filteredData.length > 0 && (
                                        <td
                                          onClick={() => toggleRow(productData.productId)}
                                          style={{ cursor: "pointer", width: "20px" }}
                                        >
                                          {expandedVariantProduct[productData.productId] ? <FaAngleUp /> : <FaAngleDown />}
                                        </td>
                                      )}

                                      {selectedColumns.includes("name") && (
                                        <td
                                          style={{
                                            width: "500px",
                                            cursor: "pointer",
                                            color: selectedProduct?.productId == productData.productId ? "#F6881F" : "",
                                          }}
                                          onClick={() => handleProductClick(entry)}
                                        >
                                          {productData?.name || "-"}
                                        </td>
                                      )}

                                      {selectedColumns.includes("stock") && (
                                        <td style={{ width: "160px" }}>
                                          <div className="d-flex flex-column align-items-start">
                                            <span>{productData?.totalAvailableStock === undefined || productData?.totalAvailableStock === null ? "-" : productData?.totalAvailableStock} Stok</span>
                                          </div>
                                        </td>
                                      )}

                                      {selectedColumns.includes("code") && (
                                        <td style={{ width: "160px" }}>{productData?.productId === undefined || productData?.productId === null ? "-" : productData?.productId}</td>
                                      )}

                                      {selectedColumns.includes("salesAvailability") && (
                                        <td style={{ width: "200px" }}>
                                          <span className={`badge text-${productData?.isSalesAvailable === true ? "success" : "danger"}`}>
                                            {productData?.salesAvailability === undefined || productData?.salesAvailability === null ? "-" : productData?.salesAvailability}
                                          </span>
                                        </td>
                                      )}

                                      {selectedColumns.includes("salesClassification") && (
                                        <td style={{ width: "200px" }}>
                                          <div className="d-flex gap-1 align-items-center">
                                            <div
                                              className="marker"
                                              style={{
                                                backgroundColor: formatStyleSalesClassification(entry.data[0].salesClassification).backgroundColor,
                                              }}
                                            ></div>
                                            <span
                                              style={{
                                                fontSize: "14px",
                                              }}
                                            >
                                              {
                                                entry.data[0].salesClassification === undefined || entry.data[0].salesClassification === null ? "-" : formatStyleSalesClassification(entry.data[0].salesClassification).label
                                              }
                                            </span>
                                          </div>
                                        </td>
                                      )}

                                    </tr>
                                    {expandedVariantProduct[productData.productId] && (
                                      productData?.modelStocks && productData.modelStocks.length > 0 ? (
                                        <tr className="bg-light">
                                          <td
                                            colSpan={selectedColumns.length + 1}
                                            style={{ padding: "4px 4px", border: "none" }}
                                          >
                                            <ul className="list-group">
                                              {productData.modelStocks.map((variant) => (
                                                <li
                                                  key={variant.id}
                                                  className="list-group-item d-flex justify-content-start gap-2"
                                                >
                                                  <span style={{ width: "8px" }}></span>
                                                  <span style={{ width: "615px" }}>
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