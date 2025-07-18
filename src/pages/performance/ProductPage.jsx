import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from 'react-dom';
import Select from "react-select";
import Calendar from "react-calendar";
import * as echarts from "echarts";
import toast from "react-hot-toast";
import { FaAngleLeft, FaAngleRight, FaAngleUp, FaAngleDown } from "react-icons/fa6";
import { AiOutlineQuestionCircle } from "react-icons/ai";

import axiosRequest from "../../utils/request";
import useDebounce from "../../hooks/useDebounce";
import BaseLayout from "../../components/organisms/BaseLayout";
import formatValueRatio from "../../utils/convertFormatRatioValue";
import formatTableValue from "../../utils/formatTableValue";
import formatStyleSalesClassification from "../../utils/convertFormatSalesClassification";
import Loading from "../../components/atoms/Loading/Loading";


export default function PerformanceProductPage() {
  // Data
  const [chartRawData, setChartRawData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const chartRef = useRef(null);
  // Filter
  const [comparatorDateRange, setComparatorDateRange] = useState(null);
  const [comparedDateRange, setComparedDateRange] = useState(null);
  const [rangeParameters, setRangeParameters] = useState(null);
  const [date, setDate] = useState(getAllDaysInLast7Days());
  const [showCalendar, setShowCalendar] = useState(false);
  const [flagCustomRoasDate, setFlagCustomRoasDate] = useState("minggu_ini");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedMetrics, setSelectedMetrics] = useState(["pv"]);
  const [metricsTotals, setMetricsTotals] = useState({});
  // const [statusProductFilter, setStatusProductFilter] = useState("all");
  const [selectedClassificationOption, setSelectedClassificationOption] = useState([]);
  const [showTableColumn, setShowTableColumn] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [paginatedData, setPaginatedData] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  // Other
  const [showAlert, setShowAlert] = useState(false);
  const [animateCalendar, setAnimateCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // const [isContentLoading, setIsContentLoading] = useState(false);
  const [isTableFilterLoading, setIsTableFilterLoading] = useState(false);
  const [hoveredColumnKey, setHoveredColumnKey] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [arrowPosition, setArrowPosition] = useState({ left: '10px' });
  const iconRefs = useRef({});
  const [allTableData, setAllTableData] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    column: null,
    direction: null
  });
  const [isLoadingAllData, setIsLoadingAllData] = useState(false);

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

  // Define metrics with their display names and colors
  const metrics = {
    pv: { 
      label: "Pengunjung", 
      color: "#0050C8",
      dataKey: "pv",
      type: "simple_currency"
    },
    addToCartUnits: { 
      label: "Add To Cart", 
      color: "#D50000", 
      dataKey: "addToCartUnits",
      type: "simple_currency"
    },
    uvToAddToCartRate: { 
      label: "Add To Cart (Percentage)", 
      color: "#00B800",
      dataKey: "uvToAddToCartRate",
      type: "percentage"
    },
    placedUnits: { 
      label: "Produk Siap Dikirim", 
      color: "#DFC100",
      dataKey: "placedUnits",
      type: "simple_currency"
    },
    placedBuyersToConfirmedBuyersRate: { 
      label: "Convertion Rate (Pesanan Siap Dikirim Dibagi Pesanan Dibuat)", 
      color: "#E200D6FF",
      dataKey: "placedBuyersToConfirmedBuyersRate",
      type: "percentage"
    },
    uvToConfirmedBuyersRate: { 
      label: "Convertion Rate (Pesanan Siap Dikirim)", 
      color: "#A5009DFF",
      dataKey: "uvToConfirmedBuyersRate",
      type: "percentage"
    },
    uvToPlacedBuyersRate: { 
      label: "Convertion Rate (Pesanan yang Dibuat)", 
      color: "#5F005AFF",
      dataKey: "uvToPlacedBuyersRate",
      type: "percentage"
    },
    confirmedSales: { 
      label: "Penjualan (Pesanan Siap Dikirim)", 
      color: "#FB8A00FF",
      dataKey: "confirmedSales",
      type: "simple_currency"
    },
    placedSales: { 
      label: "Penjualan (Total Penjualan dari Pesanan Dibuat)", 
      color: "#A15800FF",
      dataKey: "placedSales",
      type: "simple_currency"
    }
  };

  const toLocalISOString = (date) => {
    const year = date?.getFullYear();
    const month = String(date?.getMonth() + 1).padStart(2, '0');
    const day = String(date?.getDate()).padStart(2, '0');
    const hours = String(date?.getHours()).padStart(2, '0');
    const minutes = String(date?.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  const generateComparisonDateRanges = (currentSelection, selectionType) => {
    let currentFrom, currentTo, previousFrom, previousTo;

    switch (selectionType) {
      case "hari_ini":
        currentFrom = new Date();
        currentFrom.setHours(0, 0, 0, 0);
        currentTo = new Date();
        currentTo.setHours(23, 59, 59, 999);
        
        previousFrom = new Date();
        previousFrom.setDate(previousFrom.getDate() - 1);
        previousFrom.setHours(0, 0, 0, 0);
        previousTo = new Date();
        previousTo.setDate(previousTo.getDate() - 1);
        previousTo.setHours(23, 59, 59, 999);
        break;

      case "kemarin":
        currentFrom = new Date();
        currentFrom.setDate(currentFrom.getDate() - 1);
        currentFrom.setHours(0, 0, 0, 0);
        currentTo = new Date();
        currentTo.setDate(currentTo.getDate() - 1);
        currentTo.setHours(23, 59, 59, 999);
        
        previousFrom = new Date();
        previousFrom.setDate(previousFrom.getDate() - 2);
        previousFrom.setHours(0, 0, 0, 0);
        previousTo = new Date();
        previousTo.setDate(previousTo.getDate() - 2);
        previousTo.setHours(23, 59, 59, 999);
        break;

      case "minggu_ini":
        currentTo = new Date();
        currentTo.setHours(23, 59, 59, 999);
        currentFrom = new Date();
        currentFrom.setDate(currentFrom.getDate() - 6);
        currentFrom.setHours(0, 0, 0, 0);
        
        previousTo = new Date();
        previousTo.setDate(previousTo.getDate() - 7);
        previousTo.setHours(23, 59, 59, 999);
        previousFrom = new Date();
        previousFrom.setDate(previousFrom.getDate() - 13);
        previousFrom.setHours(0, 0, 0, 0);
        break;

      case "bulan_ini":
        const today = new Date();
        currentFrom = new Date(today.getFullYear(), today.getMonth(), 1);
        currentFrom.setHours(0, 0, 0, 0);
        currentTo = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        currentTo.setHours(23, 59, 59, 999);
        
        previousFrom = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        previousFrom.setHours(0, 0, 0, 0);
        previousTo = new Date(today.getFullYear(), today.getMonth(), 0);
        previousTo.setHours(23, 59, 59, 999);
        break;

      case "custom_range":
        if (Array.isArray(currentSelection)) {
          currentFrom = new Date(currentSelection[0]);
          currentFrom.setHours(0, 0, 0, 0);
          currentTo = new Date(currentSelection[currentSelection.length - 1]);
          currentTo.setHours(23, 59, 59, 999);
        } else {
          currentFrom = new Date(currentSelection);
          currentFrom.setHours(0, 0, 0, 0);
          currentTo = new Date(currentSelection);
          currentTo.setHours(23, 59, 59, 999);
        }
        
        const duration = currentTo.getTime() - currentFrom.getTime();
        previousTo = new Date(currentFrom.getTime() - 24 * 60 * 60 * 1000);
        previousTo.setHours(23, 59, 59, 999);
        previousFrom = new Date(previousTo.getTime() - duration);
        previousFrom.setHours(0, 0, 0, 0);
        break;

      default:
        currentTo = new Date();
        currentTo.setHours(23, 59, 59, 999);
        currentFrom = new Date();
        currentFrom.setDate(currentFrom.getDate() - 6);
        currentFrom.setHours(0, 0, 0, 0);
        
        previousTo = new Date();
        previousTo.setDate(previousTo.getDate() - 7);
        previousTo.setHours(23, 59, 59, 999);
        previousFrom = new Date();
        previousFrom.setDate(previousFrom.getDate() - 13);
        previousFrom.setHours(0, 0, 0, 0);
    }

    return {
      current: { from: currentFrom, to: currentTo },
      previous: { from: previousFrom, to: previousTo }
    };
  };

  function calculateMetricTotalsValue(products) {
    // Make an object to store totals for each metric
    const totals = {};
    // Forech metric on all metrics
    Object.keys(metrics).forEach(metricKey => {
      totals[metricKey] = 0;
      products.forEach(product => {
        if (product.data.length === 0) return;
        product.data.forEach(productData => {
          const dataKey = metrics[metricKey].dataKey;
          const value = productData[dataKey];
          if (value !== undefined && value !== null) {
            totals[metricKey] += Number(value);
          }
        });
      });
    });
    return totals;
  };

  const handleSort = (a, b, config) => {
    const { column, direction } = config;
    let aValue = a.data[0][column];
    let bValue = b.data[0][column];

    if (aValue === null || aValue === undefined) aValue = 0;
    if (bValue === null || bValue === undefined) bValue = 0;

    const numericColumns = [
      'pv', 'addToCartUnits', 'uvToAddToCartRate', 'placedUnits', 'placedBuyersToConfirmedBuyersRate',
      'uvToConfirmedBuyersRate', 'uvToPlacedBuyersRate', 'confirmedSales', 'placedSales', 'confirmedSellRatio'
    ];

    if (numericColumns.includes(column)) {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    }

    let comparison = 0;
    if (aValue > bValue) {
      comparison = 1;
    } else if (aValue < bValue) {
      comparison = -1;
    }

    return direction === 'desc' ? comparison * -1 : comparison;
  };

  const handleSortToggle = (columnKey, direction) => {
    setSortConfig(prevConfig => {
      if (prevConfig.column === columnKey && prevConfig.direction === direction) {
        fetchOriginalData();
        return { column: null, direction: null };
      }

      return { column: columnKey, direction: direction };
    });
  };

  const processTableData = () => {
    if (allTableData.length === 0) return filteredData;

    let processedData = [...allTableData];

    if (sortConfig.column && sortConfig.direction) {
      processedData.sort((a, b) => handleSort(a, b, sortConfig));
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return processedData.slice(startIndex, endIndex);
  };

  const fetchChartData = async (dateRanges) => {
    setIsLoading(true);
    
    try {
      const from1ISO = toLocalISOString(dateRanges.current.from);
      const to1ISO = toLocalISOString(dateRanges.current.to);

      const apiUrl = `/api/product-performance/chart?shopId=${getShopeeId}&from=${from1ISO}&to=${to1ISO}&limit=100000`;
      const response = await axiosRequest.get(apiUrl);
      const data = await response.data;
      const content = data?.content || [];
      
      setChartRawData(content);
      const totals = calculateMetricTotalsValue(content);
      setMetricsTotals(totals);

      return content;
    } catch (error) {
      toast.error("Gagal mengambil data chart iklan produk");
      console.error('Gagal mengambil data chart iklan produk, kesalahan pada server:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllTableData = async (dateRanges, filters = {}) => {
    setIsLoadingAllData(true);

    try {
      const from1ISO = toLocalISOString(dateRanges?.current?.from);
      const to1ISO = toLocalISOString(dateRanges?.current?.to);
      const from2ISO = toLocalISOString(dateRanges?.previous?.from);
      const to2ISO = toLocalISOString(dateRanges?.previous?.to);

      let apiUrl = `/api/product-performance?shopId=${getShopeeId}&from1=${from1ISO}&to1=${to1ISO}&from2=${from2ISO}&to2=${to2ISO}&limit=100000&page=0`;

      if (filters.searchQuery && filters.searchQuery.trim() !== "") {
        apiUrl += `&name=${encodeURIComponent(filters.searchQuery.trim())}`;
      }

      if (filters.classification && filters.classification.length > 0) {
        const classificationValues = filters.classification.map(cls => cls.label);
        apiUrl += `&salesClassification=${classificationValues.join(",")}`;
      }

      const response = await axiosRequest.get(apiUrl);
      const data = await response.data;
      const content = data.content || [];

      setAllTableData(content);
      setTotalElements(content.length);

      return content;
    } catch (error) {
      toast.error("Gagal mengambil semua data tabel produk");
      console.error('Gagal mengambil semua data tabel produk, kesalahan pada server:', error);
      return [];
    } finally {
      setIsLoadingAllData(false);
    }
  };

  const fetchTableData = async (dateRanges, page = 1, filters = {}) => {
    setIsTableFilterLoading(true);

    try {
      const from1ISO = toLocalISOString(dateRanges?.current?.from);
      const to1ISO = toLocalISOString(dateRanges?.current?.to);
      const from2ISO = toLocalISOString(dateRanges?.previous?.from);
      const to2ISO = toLocalISOString(dateRanges?.previous?.to);

      const backendPage = Math.max(0, page - 1);
      let apiUrl = `/api/product-performance?shopId=${getShopeeId}&from1=${from1ISO}&to1=${to1ISO}&from2=${from2ISO}&to2=${to2ISO}&limit=50&page=${backendPage}`;

      if (filters.searchQuery && filters.searchQuery.trim() !== "") {
        apiUrl += `&name=${encodeURIComponent(filters.searchQuery.trim())}`;
      }
      
      // if (filters.statusFilter && filters.statusFilter !== "all") {
      //   apiUrl += `&state=${filters.statusFilter}`;
      // }

      if (filters.classification && filters.classification.length > 0) {
        const classificationValues = filters.classification.map(cls => cls.label);
        apiUrl += `&salesClassification=${classificationValues.join(",")}`;
      }
      const response = await axiosRequest.get(apiUrl);
      const data = await response.data;
      const content = data.content || [];
      setFilteredData(content);
      setTotalPages(data?.totalPages || 1);
      setTotalElements(data?.totalElements || 0);

      return content;
    } catch (error) {
      toast.error("Gagal mengambil data tabel iklan produk");
      console.error('Gagal mengambil data tabel iklan produk, kesalahan pada server:', error);
      return [];
    } finally {
      setIsTableFilterLoading(false);
    }
  };

  const fetchOriginalData = () => {
    setCurrentPage(1);

    if (rangeParameters && rangeParameters.isComparison) {
      const currentFilters = buildCurrentFilters();
      const dateRanges = {
        current: rangeParameters.current,
        previous: rangeParameters.previous
      };
      fetchTableData(dateRanges, 1, currentFilters);
    } else {
      const dateRanges = generateComparisonDateRanges(date, flagCustomRoasDate);
      const currentFilters = buildCurrentFilters();
      fetchTableData(dateRanges, 1, currentFilters);
    }

    setAllTableData([]);
    setSortConfig({ column: null, direction: null });
  };

  const fetchData = async (currentSelection, selectionType, page = 1) => {
    setIsLoading(true);
    
    try {
      const dateRanges = generateComparisonDateRanges(currentSelection, selectionType);

      const currentFilters = {
        searchQuery: debouncedSearchTerm,
        // statusFilter: statusProductFilter,
        classification: selectedClassificationOption,
      };

      setRangeParameters({
        isComparison: true,
        current: dateRanges.current,
        previous: dateRanges.previous,
        selectionType: selectionType
      });

      if (sortConfig.column && sortConfig.direction) {
        await Promise.all([
          fetchChartData(dateRanges),
          fetchAllTableData(dateRanges, currentFilters)
        ]);
      } else {
        await Promise.all([
          fetchChartData(dateRanges),
          fetchTableData(dateRanges, page, currentFilters)
        ]);
      }

      // await Promise.all([
      //   fetchChartData(dateRanges),
      //   fetchTableData(dateRanges, page, currentFilters)
      // ]);

    } catch (error) {
      toast.error("Gagal mengambil data iklan produk");
      console.error('Gagal mengambil data iklan produk, kesalahan pada server:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buildCurrentFilters = () => {
    return {
      searchQuery: debouncedSearchTerm,
      // statusFilter: statusProductFilter,
      classification: selectedClassificationOption,
    };
  };

  const handleProductClick = (product) => {
    if (selectedProduct?.productId === product.productId) {
      setSelectedProduct(null);
    } else {
      setSelectedProduct(product);
    }
  };

  function getAllDaysInLast7Days() {
    const getLocalDateString = (date) => {
      const localDate = date instanceof Date ? date : new Date(date);
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, '0');
      const day = String(localDate.getDate()).padStart(2, '0');
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
    // Set start and end dates to the beginning and end of the day
    const start = startDate instanceof Date ? new Date(startDate) : new Date(startDate);
    const end = endDate instanceof Date ? new Date(endDate) : new Date(endDate);
    // Set start to the beginning of the day and end to the end of the day
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const dateArray = [];
    const getLocalDateString = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

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

  function generateMultipleMetricsChartData(selectedDate = null, product = null, selectedMetrics = ["pv"]) {
    let timeIntervals = [];
    let mode = "daily";
    let result = {};
    let isSingleDay = false;
    let fromDate, toDate;

    const getLocalDateString = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

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

    if (rangeParameters && rangeParameters.isComparison) {
      fromDate = rangeParameters.current.from;
      toDate = rangeParameters.current.to;
      
      const sameDay = fromDate.toDateString() === toDate.toDateString();
      if (sameDay) {
        const dateStr = getLocalDateString(fromDate);
        timeIntervals = getHourlyIntervals(dateStr);
        mode = "hourly";
        isSingleDay = true;
      } else {
        timeIntervals = getDateRangeIntervals(fromDate, toDate);
        mode = "daily";
        isSingleDay = false;
      }
    } else {
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
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);
      }
    }

    if (!timeIntervals || timeIntervals.length === 0) {
      timeIntervals = [getLocalDateString(new Date())];
      fromDate = new Date();
      toDate = new Date();
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 999);
    }

    result.timeIntervals = timeIntervals;
    result.isSingleDay = isSingleDay;
    result.series = [];

    let chartDataProducts = chartRawData;
    // if ads product is selected, filter the chart data by product productId
    if (product) {
      chartDataProducts = chartRawData.filter((p) => p.productId == product.productId);
    }

    selectedMetrics?.forEach(metricKey => {
      const metric = metrics[metricKey];
      if (!metric) return;

      const dataKey = metric.dataKey;
      let dataMap = {};

      timeIntervals.forEach((time) => {
        dataMap[time] = 0;
      });

      chartDataProducts?.forEach((product) => {
        if (product.data.length === 0 || !product.data) return;
        
        if (isSingleDay) {
          product?.data.forEach(productData => {
            if (!productData.shopeeFrom || productData.shopeeFrom === null) return;

            const test = getDataDate(productData);
            const createdAt = test;
            // const createdAt = new Date(productData.createdAt);
            const productDateStr = getLocalDateString(createdAt);
            const filterDateStr = getLocalDateString(fromDate);

            if (productDateStr !== filterDateStr) return;

            const hourKey = String(createdAt.getHours()).padStart(2, "0");
            const productYear = createdAt.getFullYear();
            const productMonth = String(createdAt.getMonth() + 1).padStart(2, "0");
            const productDay = String(createdAt.getDate()).padStart(2, "0");
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
          
          product?.data.forEach((productData) => {
            if (!productData.data && !productData.shopeeFrom) return;

            const test = getDataDate(productData);
            const createdAt = test;
            // const createdAt = new Date(productData.createdAt);
            const productDateStr = getLocalDateString(createdAt);
            const filterStartStr = getLocalDateString(fromDate);
            const filterEndStr = getLocalDateString(toDate);

            if (productDateStr >= filterStartStr && productDateStr <= filterEndStr) {
              if (!dataByDate[productDateStr]) {
                dataByDate[productDateStr] = 0;
              }

              const value = productData[dataKey];
              if (value !== undefined && value !== null) {
                dataByDate[productDateStr] += Number(value);
              }
            }
          });

          Object.keys(dataByDate).forEach(dateKey => {
            if (timeIntervals.includes(dateKey)) {
              dataMap[dateKey] += dataByDate[dateKey];
            }
          });
        }
      });

      const seriesData = {
        name: metric.label,
        data: timeIntervals.map((time) => dataMap[time] || 0),
        color: metric.color
      };

      result.series.push(seriesData);
    });

    return result;
  };

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

  const handleComparatorDateChange = (date) => {
    if (Array.isArray(date) && date.length === 2) {
      setComparatorDateRange(date);
    }
  };

  const handleComparedDateChange = (date) => {
    if (Array.isArray(date) && date.length === 2) {
      setComparedDateRange(date);
    }
  };

  const resetComparisonDates = () => {
    setComparatorDateRange(null);
    setComparedDateRange(null);
    setRangeParameters(null);
  };

  const getDateButtonText = () => {
    if (comparatorDateRange || comparedDateRange) {
      let startText = "";
      let endText = "";
      
      // Get start date text
      if (comparatorDateRange) {
        startText = `${comparatorDateRange[0].toLocaleDateString("id-ID")} - ${comparatorDateRange[1].toLocaleDateString("id-ID")}`;
      }
      
      // Get end date text
      if (comparedDateRange) {
        endText = `${comparedDateRange[0].toLocaleDateString("id-ID")} - ${comparedDateRange[1].toLocaleDateString("id-ID")}`;
      }
      
      // Combine texts
      if (startText && endText) {
        return `${startText} vs ${endText}`;
      }
    }
    
    // Default text
    return typeof date === 'string' ? date : (Array.isArray(date) ? "1 Minggu terakhir" : "Pilih Tanggal");
  };

  const isConfirmButtonDisabled = () => {
    const hasComparatorSelection = !!(comparatorDateRange);
    const hasComparedSelection = !!(comparedDateRange);
    
    return !(hasComparatorSelection && hasComparedSelection);
  };

  const validateDateRanges = () => {
    let hasValidSelection = false;
    let errorMessage = "";

    const hasComparatorRange = !!comparatorDateRange;
    const hasComparedRange = !!comparedDateRange;

    if ((hasComparatorRange) && !(hasComparedRange)) {
      errorMessage = "Untuk mode perbandingan, kedua kalender harus diisi. Silakan pilih tanggal atau range di kalender kedua (Tanggal Dibanding).";
      return { isValid: false, message: errorMessage };
    }

    if ((hasComparedRange) && !(hasComparatorRange)) {
      errorMessage = "Untuk mode perbandingan, kedua kalender harus diisi. Silakan pilih tanggal atau range di kalender pertama (Tanggal Pembanding).";
      return { isValid: false, message: errorMessage };
    }

    if (comparatorDateRange) {
      if (comparatorDateRange[0] > comparatorDateRange[1]) {
        errorMessage = "Tanggal mulai tidak boleh lebih besar dari tanggal akhir pada kalender pertama";
        return { isValid: false, message: errorMessage };
      }
      hasValidSelection = true;
    }

    if (comparedDateRange) {
      if (comparedDateRange[0] > comparedDateRange[1]) {
        errorMessage = "Tanggal mulai tidak boleh lebih besar dari tanggal akhir pada kalender kedua";
        return { isValid: false, message: errorMessage };
      }
      hasValidSelection = true;
    }

    if (!hasValidSelection) {
      errorMessage = "Pilih setidaknya satu range pada salah satu kalender";
      return { isValid: false, message: errorMessage };
    }

    return { isValid: true, message: "" };
  };

  function handleComparisonDatesConfirm() {
    const validation = validateDateRanges();
    
    if (!validation.isValid) {
      toast.error("Filter tanggal tidak valid, silakan periksa kembali tanggal yang dipilih.");
      console.error('Validation error:', validation.message);
      return;
    }

    if (comparatorDateRange && comparedDateRange) {
      const manualDateRanges = {
        current: {
          from: new Date(comparatorDateRange[0]),
          to: new Date(comparatorDateRange[1])
        },
        previous: {
          from: new Date(comparedDateRange[0]),
          to: new Date(comparedDateRange[1])
        }
      };

      manualDateRanges.current.from.setHours(0, 0, 0, 0);
      manualDateRanges.current.to.setHours(23, 59, 59, 999);
      manualDateRanges.previous.from.setHours(0, 0, 0, 0);
      manualDateRanges.previous.to.setHours(23, 59, 59, 999);

      setDate(null);
      setShowCalendar(false);
      setCurrentPage(1);

      setRangeParameters({
        isComparison: true,
        isManual: true,
        current: manualDateRanges.current,
        previous: manualDateRanges.previous,
        selectionType: "manual_comparison"
      });

      const currentFilters = {
        searchQuery: debouncedSearchTerm,
        // statusFilter: statusProductFilter,
        classification: selectedClassificationOption,
      };

      Promise.all([
        fetchChartData(manualDateRanges),
        fetchTableData(manualDateRanges, 1, currentFilters)
      ]).catch(error => {
        toast.error("Gagal mengambil data iklan produk");
        console.error('Error in manual comparison:', error);
      });
    }
  };

  function handleDateSelectionPreset(selectedDateOption, type = "minggu_ini") {
    // Reset manual comparison dates
    setComparatorDateRange(null);
    setComparedDateRange(null);
    setDate(selectedDateOption);
    setFlagCustomRoasDate(type);
    setShowCalendar(false);
    setCurrentPage(1);
    
    // Use new automatic comparison logic
    fetchData(selectedDateOption, type, 1);
  };



  // FILTER COLUMNS TABLE FEATURE
  const allColumns = [
    { key: "name", label: "Nama" },
    // { key: "insight", label: "Insight" },
    { key: "salesClassification", label: "Sales Classification" },
    { key: "pv", label: "Pengunjung", tooltip: "Total pengunjung unik yang melihat produk (mengunjungi >1 kali dihitung sebagai 1 Pengunjung). Catatan: Total ini termasuk produk Dihapus/Diarsipkan/ Diblokir/Sedang Diperiksa." },
    { key: "addToCartUnits", label: "Add To Cart", tooltip: "Jumlah produk yang ditambahkan ke keranjang, dalam jangka waktu tertentu." },
    { key: "uvToAddToCartRate", label: "Add To Cart (Percentage)", tooltip: " Jumlah pengunjung yang telah menambahkan produk ke keranjang, dibagi jumlah pengunjung yang telah melihat halaman rincian produk dalam jangka waktu yang dipilih." },
    { key: "placedUnits", label: "Produk Siap Dikirim", tooltip: "Jumlah SKU induk yang siap dikirim dalam jangka waktu tertentu." },
    { key: "placedBuyersToConfirmedBuyersRate", label: "Convertion Rate (Pesanan Siap Dikirim Dibagi Pesanan Dibuat)", tooltip: "Jumlah Pembeli dengan pesanan siap dikirim dibagi jumlah Pembeli yang membuat pesanan dalam jangka waktu yang dipilih." },
    { key: "uvToConfirmedBuyersRate", label: "Convertion Rate (Pesanan Siap Dikirim)", tooltip: "Jumlah Pembeli dengan pesanan siap dikirim dibagi dengan jumlah pengunjung yang telah melihat halaman rincian produk dalam jangka waktu yang dipilih." },
    { key: "uvToPlacedBuyersRate", label: "Convertion Rate (Pesanan yang Dibuat)", tooltip: "Jumlah Pembeli yang membuat pesanan dibagi dengan jumlah pengunjung yang telah melihat halaman halaman rincian produk dalam jangka waktu yang dipilih." },
    { key: "confirmedSales", label: "Penjualan (Pesanan Siap Dikirim)", tooltip: "Total nilai dari pesanan yang telah siap dikirim dalam jangka waktu tertentu. Nilai pesanan yang sudah siap dikirim sama dengan nilai saat checkout." },
    { key: "placedSales", label: "Penjualan (Total Penjualan dari Pesanan Dibuat)", tooltip: "Nilai pesanan yang dibuat Pembeli dalam jangka waktu yang dipilih. Pesanan dibuat termasuk penjualan yang dibatalkan dan dikembalikan." },
    { key: "confirmedSellRatio", label: "Ratio Penjualan", tooltip: "Jumlah Pembeli dengan pesanan siap dikirim dibagi dengan jumlah pengunjung yang telah melihat halaman rincian produk dalam jangka waktu yang dipilih." },
  ];

  const [selectedColumns, setSelectedColumns] = useState(
    allColumns.map((col) => col.key)
  );

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




  useEffect(() => {
    fetchData(getAllDaysInLast7Days(), "minggu_ini", 1);
  }, []);

  useEffect(() => {
    if (chartRawData.length > 0) {
      const totals = calculateMetricTotalsValue(chartRawData);
      setMetricsTotals(totals);
    }
  }, [chartRawData]);

  useEffect(() => {
    const chartData = generateMultipleMetricsChartData(date, selectedProduct, selectedMetrics);
    setChartData(chartData);
  }, [date, selectedProduct, selectedMetrics, chartRawData, comparatorDateRange, comparedDateRange, rangeParameters]);

  const [isChartContainerReady, setIsChartContainerReady] = useState(false);
  const chartInstance = useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  
  const chartRefCallback = useCallback((node) => {
    if (node) {
      chartRef.current = node;
      setIsChartContainerReady(true);
    } else {
      setIsChartContainerReady(false);
    }
  }, []);
  
  const initializeChart = useCallback(() => {
    if (!isMounted || !chartRef.current || !isChartContainerReady) {
      return;
    }

    try {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }

      chartInstance.current = echarts.init(chartRef.current);

      const activeSeries = chartData.series?.filter(series => 
        selectedMetrics.some(metric => 
          metrics[metric]?.label === series.name
        )
      ) || [];

      if (activeSeries.length === 0) {
        return;
      }

      const seriesConfig = activeSeries.map((s, index) => ({
        name: s.name,
        type: 'line',
        smooth: true,
        showSymbol: false,
        emphasis: { focus: 'series' },
        data: s.data,
        yAxisIndex: index, // Assign different Y-axis for each series
        lineStyle: {
          color: s.color,
          width: 2
        },
        itemStyle: {
          color: s.color
        }
      }));

      // const seriesConfig = activeSeries.map(s => ({
      //   name: s.name,
      //   type: 'line',
      //   smooth: true,
      //   showSymbol: false,
      //   emphasis: { focus: 'series' },
      //   data: s.data,
      //   lineStyle: {
      //     color: s.color,
      //     width: 2
      //   },
      //   itemStyle: {
      //     color: s.color
      //   }
      // }));

      const yAxisConfig = activeSeries.map((series, index) => ({
        type: 'value',
        position: index % 2 === 0 ? 'left' : 'right',
        offset: Math.floor(index / 2) * 80,
        axisLine: {
          show: false,
        },
        axisLabel: {
          show: false,
          color: series.color
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: index === 0
        }
      }));

      const hasData = seriesConfig.some(s => 
        s.data?.some(value => value !== null && value !== undefined)
      );

      let xAxisData = chartData.timeIntervals || [];
      const isSingleDay = chartData.isSingleDay || false;
      
      if (xAxisData.some(item => item.includes(":"))) {
        xAxisData = xAxisData.map(item => item.split(" ")[1]);
      } else {
        xAxisData = xAxisData.map(item => item.split("-").slice(1).join("/"));
      }

      const option = {
        toolbox: { feature: { saveAsImage: {} } },
        grid: {
          // left: calculateLeftMargin(seriesConfig),
          left: 20,
          right: 50,
          bottom: 50,
          containLabel: false
        },
        tooltip: {
          trigger: "axis",
          extraCssText: 'box-shadow: none;',
          backgroundColor: "transparent",
          borderWidth: 0,
          formatter: generateTooltipContent
        },
        legend: {
          data: activeSeries.map(s => s.name),
          bottom: 0,
          icon: 'circle',
          itemWidth: 8,
        },
        xAxis: {
          name: isSingleDay ? "Time" : "Date",
          type: "category",
          data: xAxisData,
          boundaryGap: false,
          axisLabel: {
            rotate: 0,
            interval: 0,
            formatter: getAxisLabelFormatter(xAxisData.length)
          },
        },
        yAxis: yAxisConfig,
        // yAxis: {
        //   // name: selectedMetrics.length === 1 ? metrics[selectedMetrics[0]]?.label : "Total",
        //   type: "value",
        //   splitLine: { show: true },
        // },
        series: seriesConfig
      };

      if (!hasData) {
        option.graphic = [{
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: 'Tidak ada data untuk rentang waktu yang dipilih',
            fontSize: 16,
            fill: '#999',
            fontWeight: 'bold'
          }
        }];
      }

      chartInstance.current.setOption(option);

    } catch (err) {
      console.error("Chart tidak bisa di initialize :", err);
      toast.error("Gagal memuat chart iklan produk");
    }
  }, [chartData, selectedMetrics, isMounted, isChartContainerReady]);
  
  useEffect(() => {
    setIsMounted(true);

    return () => {
      setIsMounted(false);
      setIsChartContainerReady(false);
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isChartContainerReady && chartData.series?.length > 0) {
      // Small delay to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        initializeChart();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [initializeChart, isChartContainerReady]);

  // Update resize observer
  useEffect(() => {
    if (!isMounted || !chartRef.current || !isChartContainerReady) return;

    const resizeObserver = new ResizeObserver(() => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    });

    resizeObserver.observe(chartRef.current);
    return () => resizeObserver.disconnect();
  }, [isMounted, isChartContainerReady]);

  const calculateLeftMargin = (series) => {
    const maxY = Math.max(...series.flatMap(s => s.data || []));
    if (maxY >= 1_000_000_000) return 110;
    if (maxY >= 100_000_000) return 100;
    if (maxY >= 10_000_000) return 90;
    if (maxY >= 1_000_000) return 80;
    if (maxY >= 100_000) return 70;
    if (maxY >= 10_000) return 60;
    if (maxY >= 1_000) return 50;
    return 35;
  };

  const getAxisLabelFormatter = (length) => {
    let modulus = 1;
    if (length > 56) modulus = 5;
    else if (length > 42) modulus = 4;
    else if (length > 28) modulus = 3;
    else if (length > 14) modulus = 2;
    return (value, index) => (index % modulus === 0 ? value : '');
  };

  const generateTooltipContent = (params) => {
    const date = params[0].axisValue;
    let html = `
      <div style="
        background: white;
        border-radius: 6px;
        box-shadow: 0 0 4px rgba(0,0,0,0.1);
        overflow: hidden;
        font-family: sans-serif;
      ">
        <div style="
          background: #EDEDED;
          padding: 6px 12px;
          font-weight: bold;
          font-size: 13px;
          border-bottom: 1px solid #ddd;
          color: #101010;
        ">${date}</div>
        <div style="padding: 6px 12px; font-size: 13px;">
    `;

    params.forEach(param => {
      html += `
        <div style="display: flex; align-items: center; justify-content: space-between; margin: 4px 0; gap: 4px;">
          <div style="display: flex; align-items: center;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${param.color}; margin-right:6px;"></span>
            ${param.seriesName}
          </div>
          <strong>${formatTableValue(param.value, "number")}</strong>
        </div>
      `;
    });

    html += `</div></div>`;
    return html;
  };

  const SortIcon = ({ columnKey, currentSort }) => {
    const isActive = currentSort.column === columnKey;

    return (
      <div className="d-flex flex-column ms-1" style={{ fontSize: '10px' }}>
        <span
          style={{
            color: isActive && currentSort.direction === 'asc' ? '#007bff' : '#ccc',
            lineHeight: '1',
            cursor: 'pointer',
            userSelect: 'none'
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleSortToggle(columnKey, 'asc');
          }}
          title="Sort Ascending"
        ><FaAngleUp /></span>

        <span
          style={{
            color: isActive && currentSort.direction === 'desc' ? '#007bff' : '#ccc',
            lineHeight: '1',
            cursor: 'pointer',
            userSelect: 'none'
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleSortToggle(columnKey, 'desc');
          }}
          title="Sort Descending"
        ><FaAngleDown /></span>
      </div>
    );
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

      if (allTableData.length > 0 && (sortConfig.column && sortConfig.direction)) {
        return; // Let useEffect handle the pagination with sorted data
      }

      // If no sorting, fetch data for the current page (normal pagination)
      if (rangeParameters && rangeParameters.isComparison) {
        const currentFilters = buildCurrentFilters();
        const dateRanges = {
          current: rangeParameters.current,
          previous: rangeParameters.previous
        };

        fetchTableData(dateRanges, pageNumber, currentFilters);
      } else {
        const dateRanges = generateComparisonDateRanges(date, flagCustomRoasDate);
        const currentFilters = buildCurrentFilters();
        fetchTableData(dateRanges, pageNumber, currentFilters);
      }
    }
  };

  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (allTableData.length > 0) {
      // Use processed data (sorted + paginated)
      const processed = processTableData();
      setPaginatedData(processed);

      const calculatedTotalPages = Math.ceil(allTableData.length / itemsPerPage);
      setTotalPages(calculatedTotalPages || 1);
    } else {
      // Use original pagination system
      const startIndex = 0;
      const endIndex = Math.min(itemsPerPage, filteredData.length);
      setPaginatedData(filteredData.slice(startIndex, endIndex));

      const calculatedTotalPages = Math.ceil(totalElements / itemsPerPage);
      setTotalPages(calculatedTotalPages || 1);
    }
  }, [allTableData, sortConfig, currentPage, itemsPerPage, filteredData, totalElements]);

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

  useEffect(() => {
    if (sortConfig.column && sortConfig.direction) {
      // Fetch all data for sorting
      let dateRanges;
      if (rangeParameters && rangeParameters.isComparison) {
        dateRanges = {
          current: rangeParameters.current,
          previous: rangeParameters.previous
        };
      } else {
        dateRanges = generateComparisonDateRanges(date, flagCustomRoasDate);
      }

      const currentFilters = buildCurrentFilters();
      fetchAllTableData(dateRanges, currentFilters);
      setCurrentPage(1); // Reset to first page when sorting
    }
  }, [sortConfig]);

  useEffect(() => {
    setCurrentPage(1);

    // Reset sorting when filters change
    setSortConfig({ column: null, direction: null });
    setAllTableData([]);

    let dateRanges;
    if (rangeParameters && rangeParameters.isComparison) {
      dateRanges = {
        current: rangeParameters.current,
        previous: rangeParameters.previous
      };
    } else {
      dateRanges = generateComparisonDateRanges(date, flagCustomRoasDate);
    }

    const currentFilters = buildCurrentFilters();
    fetchTableData(dateRanges, 1, currentFilters);
  }, [debouncedSearchTerm, selectedClassificationOption]);



  const handleStyleMatricButton = (metricKey) => {
    const isActive = selectedMetrics.includes(metricKey);
    const metric = metrics[metricKey];

    return {
      backgroundColor: "#ffffff00",
      borderTop: `solid ${isActive ? `${metric.color} 3px` : "rgb(179.4, 184.2, 189) 1px"}`,
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: isActive ? "medium" : "normal",
      transition: "all 0.3s ease",
      flex: "1 1 200px",
      height: "auto",
      justifyContent: "center"
    };
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

  const updateTooltipPosition = (key) => {
    if (iconRefs.current[key]) {
      const rect = iconRefs.current[key].getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      const tooltipWidth = 200;
      const viewportWidth = window.innerWidth;
      const padding = 20;
      
      let left = rect.left + scrollLeft;
      
      // Hitung posisi center icon untuk arrow
      const iconCenterX = rect.left + scrollLeft + (rect.width / 2);
      
      // Cek apakah tooltip akan keluar dari viewport di sebelah kanan
      if (rect.left + tooltipWidth + padding > viewportWidth) {
        left = rect.right + scrollLeft - tooltipWidth;
      }
      
      // Cek apakah tooltip akan keluar dari viewport di sebelah kiri
      if (left < padding) {
        left = padding + scrollLeft;
      }
      
      // Hitung posisi arrow berdasarkan selisih posisi icon dengan tooltip
      const arrowLeft = iconCenterX - left;
      
      // Pastikan arrow tidak keluar dari batas tooltip (6px dari tepi)
      const finalArrowLeft = Math.max(6, Math.min(tooltipWidth - 12, arrowLeft));
      
      setTooltipPosition({
        top: rect.top + scrollTop - 10,
        left: left
      });
      
      setArrowPosition({ left: `${finalArrowLeft - 5}px` });
    }
  };

  const handleMouseEnter = (key) => {
    setHoveredColumnKey(key);
    updateTooltipPosition(key);
  };

  const handleMouseLeave = () => {
    setHoveredColumnKey(null);
  };

  return (
    <>
      <BaseLayout>
        <div className="d-flex flex-column gap-1">
          <div className="d-flex align-items-center">
            <h3>Performa produk</h3>
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
                      {getDateButtonText()}
                    </button>
                    {showCalendar && (
                      <div
                        className={`card custom-calendar-behavior ${animateCalendar ? "show" : ""}`}
                        style={{
                          flexDirection: "row",
                          position: "absolute",
                          top: "44px",
                          right: "0",
                          zIndex: 1000,
                          boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
                          borderRadius: "8px",
                          padding: "5px 10px",
                        }}
                      >
                        <div>
                            <p className="pt-2" style={{ textAlign: "center" }}>
                                Tanggal Pembanding
                            </p>
                            <Calendar 
                                selectRange={true}
                                onChange={handleComparatorDateChange} 
                                value={comparatorDateRange} 
                                maxDate={
                                    comparedDateRange ? comparedDateRange[1] : 
                                    new Date(2100, 0, 1)
                                } 
                                minDate={new Date(2000, 0, 1)} 
                            />
                            {(comparatorDateRange) && (
                                <div className="text-center mt-1">
                                    <small className="text-success">
                                        {comparatorDateRange[0].toLocaleDateString("id-ID")} - {comparatorDateRange[1].toLocaleDateString("id-ID")}
                                    </small>
                                </div>
                            )}
                        </div>
                        
                        <div>
                            <p className="pt-2" style={{ textAlign: "center" }}>
                                Tanggal Dibanding
                            </p>
                            <Calendar 
                                selectRange={true}
                                onChange={handleComparedDateChange} 
                                value={comparedDateRange} 
                                minDate={
                                  comparatorDateRange ? comparatorDateRange[0] : 
                                  new Date()
                                } 
                            />
                            {(comparedDateRange) && (
                              <div className="text-center mt-1">
                                  <small className="text-success">
                                      {comparedDateRange[0].toLocaleDateString("id-ID")} - {comparedDateRange[1].toLocaleDateString("id-ID")}
                                  </small>
                              </div>
                            )}
                        </div>

                        <div id="custom-calendar-behavior-barrier" style={{ width: "1px", height: "auto", backgroundColor: "#D2D2D2FF", margin: "10px 12px" }}></div>
                        
                        <div id="custom-calendar-behavior-button" className="d-flex justify-content-between mb-1">
                          <div
                            className="custom-content-calendar d-flex flex-column py-2 px-1"
                            style={{ width: "130px", listStyleType: "none" }}
                          >
                            <p style={{ cursor: "pointer" }} onClick={() => handleDateSelectionPreset(new Date().toISOString().split("T")[0], "hari_ini")}>Hari ini</p>
                            <p style={{ cursor: "pointer" }}
                              onClick={() => {
                                const yesterday = new Date();
                                yesterday.setDate(yesterday.getDate() - 1);
                                handleDateSelectionPreset(yesterday.toISOString().split("T")[0], "kemarin");
                              }}
                            >
                              Kemarin
                            </p>
                            <p style={{ cursor: "pointer" }} onClick={() => handleDateSelectionPreset(getAllDaysInLast7Days(), "minggu_ini")}>1 Minggu terakhir</p>
                            <p style={{ cursor: "pointer" }} onClick={() => handleDateSelectionPreset("Bulan Ini", "bulan_ini")}>Bulan ini</p>
                          </div>
                          <div className="d-flex gap-1 flex-column">
                            <button
                              className="btn btn-secondary w-100"
                              onClick={resetComparisonDates}
                              disabled={!comparatorDateRange && !comparedDateRange}
                            >
                              Reset
                            </button>
                            <button
                                className="btn btn-primary w-100"
                                onClick={handleComparisonDatesConfirm}
                                disabled={isConfirmButtonDisabled()}
                                style={
                                  isConfirmButtonDisabled() ? { cursor: "not-allowed" } : { cursor: "pointer" }
                                }
                            >
                                Terapkan
                                {rangeParameters && rangeParameters.isRange && (
                                  <small className="d-block" style={{ fontSize: "10px" }}>
                                    Mode Perbandingan Range
                                  </small>
                                )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {isLoading ? (
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
                              <strong style={{ color: "#5d7186"}}>
                                {metrics[metricKey].label}
                              </strong>
                              <span className="card-text fs-4 fw-bold">
                                {
                                  metrics[metricKey].type === "simple_currency"
                                  ? <span>{formatTableValue(metricsTotals[metricKey], "simple_currency")}</span>
                                  : metrics[metricKey].type === "percentage"
                                  ? <span>{formatTableValue(metricsTotals[metricKey], "percentage")}</span>
                                  : metrics[metricKey].type === "currency"
                                  ? <span>Rp. {formatTableValue(metricsTotals[metricKey], "simple_currency")}</span>
                                  : <span>{formatTableValue(metricsTotals[metricKey], "coma")}</span>
                                }
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Alert validation */}
                      {showAlert && (
                        <div className="alert alert-warning alert-dismissible fade show" role="alert">
                          Maksimal metrik yang dapat dipilih adalah 4 metrik
                          <button type="button" className="btn-close" onClick={() => setShowAlert(false)}></button>
                        </div>
                      )}
                      {selectedMetrics.length === 0 && (
                        <div className="alert alert-warning alert-dismissible fade show">
                          <span >Pilih minimal 1 metrik untuk menampilkan data secara akurat</span>
                        </div>
                      )}
                      {/* Chart */}
                      <div ref={chartRefCallback} style={{ width: "100%", height: "320px" }}></div>
                      {/* Filters & Table */}
                      <div className="d-flex flex-column gap-2">
                        {/* Status filter */}
                        {/* <div
                          className="d-flex align-items-center gap-1 gap-md-2 flex-wrap"
                          style={{ width: "fit-content", listStyleType: "none" }}
                        >
                          <span>Status Produk</span>
                          <div className="d-flex gap-1 gap-md-2 flex-wrap">
                            <div
                              className={`status-button-filter rounded-pill d-flex align-items-center  ${statusProductFilter === "all"
                                  ? "custom-font-color custom-border-select fw-bold"
                                  : "border border-secondary-subtle"
                                }`}
                              onClick={() => setStatusProductFilter("all")}
                              style={{ cursor: "pointer", fontSize: "12px", padding: "6px 12px", }}
                            >
                              Semua
                            </div>
                            <div
                              className={`status-button-filter rounded-pill d-flex align-items-center ${statusProductFilter === "scheduled"
                                  ? "custom-font-color custom-border-select fw-bold"
                                  : "border border-secondary-subtle"
                                }`}
                              onClick={() => setStatusProductFilter("scheduled")}
                              style={{ cursor: "pointer", fontSize: "12px", padding: "6px 12px", }}
                            >
                              Terjadwal
                            </div>
                            <div
                              className={`status-button-filter rounded-pill d-flex align-items-center  ${statusProductFilter === "ongoing"
                                  ? "custom-font-color custom-border-select fw-bold"
                                  : "border border-secondary-subtle"
                                }`}
                              onClick={() => setStatusProductFilter("ongoing")}
                              style={{ cursor: "pointer", fontSize: "12px", padding: "6px 12px", }}
                            >
                              Berjalan
                            </div>
                            <div
                              className={`status-button-filter rounded-pill d-flex align-items-center  ${statusProductFilter === "closed"
                                  ? "custom-font-color custom-border-select fw-bold"
                                  : "border border-secondary-subtle"
                                }`}
                              onClick={() => setStatusProductFilter("closed")}
                              style={{ cursor: "pointer", fontSize: "12px", padding: "6px 12px", }}
                            >
                              Nonaktif
                            </div>
                            <div
                              className={`status-button-filter rounded-pill d-flex align-items-center ${statusProductFilter === "ended"
                                  ? "custom-font-color custom-border-select fw-bold"
                                  : "border border-secondary-subtle"
                                }`}
                              onClick={() => setStatusProductFilter("ended")}
                              style={{ cursor: "pointer", fontSize: "12px", padding: "1px 12px", }}
                            >
                              Berakhir
                            </div>
                            <div
                              className={`status-button-filter rounded-pill d-flex align-items-center ${statusProductFilter === "deleted"
                                  ? "custom-font-color custom-border-select fw-bold"
                                  : "border border-secondary-subtle"
                                }`}
                              onClick={() => setStatusProductFilter("deleted")}
                              style={{ cursor: "pointer", fontSize: "12px", padding: "1px 12px", }}
                            >
                              Dihapus
                            </div>
                          </div>
                        </div> */}
                        {/* Other filter */}
                        <div className="d-flex flex-column gap-2">
                          <div id="container-other-filters" className="d-flex w-full justify-content-between align-items-center">
                            <div id="container-other-filters-left" className="d-flex gap-2 flex-wrap">
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
                              {/* clasification filter */}
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
                                      padding: "0.6px 4px",
                                    }),
                                    multiValue: (base) => ({
                                      ...base,
                                      backgroundColor: "#F9DBBF",
                                      "&:hover": {
                                        backgroundColor: "#F9DBBF !important",
                                      }
                                    }),
                                    option: (base) => ({
                                      ...base,
                                      "&:hover": {
                                        backgroundColor: "#F9DBBF !important",
                                      },
                                      "&:active": {
                                        backgroundColor: "#F9DBBF !important",
                                      },
                                      "&:focus": {
                                        backgroundColor: "#F9DBBF !important",
                                      },
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
                          {showTableColumn && (
                            <div className="border px-2 rounded">
                              {allColumns.map((col) => (
                                <div
                                  key={col.key}
                                  className="form-check form-check-inline py-1"
                                >
                                  <input
                                    style={{
                                      border: "1px solid #8042D4",
                                      width: "18px",
                                      height: "18px",
                                      borderRadius: "10%",
                                    }}
                                    className="form-check-input "
                                    type="checkbox"
                                    checked={selectedColumns.includes(col.key)}
                                    onChange={() => handleColumnChange(col.key)}
                                  />
                                  <label className="text-secondary">
                                    {col.label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ position: 'relative', overflow: "visible" }}>
                          {isTableFilterLoading && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                paddingTop: filteredData.length > 0 ? '85px' : '50px',
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'start',
                                zIndex: 10,
                                minHeight: filteredData.length > 0 ? '600px' : '100px',
                              }}
                            >
                              <Loading size={40} />
                            </div>
                          )}
                          {isLoadingAllData && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                paddingTop: filteredData.length > 0 ? '85px' : '50px',
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'start',
                                zIndex: 10,
                                minHeight: filteredData.length > 0 ? '600px' : '100px',
                              }}
                            >
                              <Loading size={40} />
                            </div>
                          )}
                        </div>
                        {/* Table container */}
                        <div className="table-responsive" style={{ borderRadius: "4px" }}>
                          <table className="table table-centered" 
                            style={{
                              width: "100%",
                              minWidth: "max-content",
                              maxWidth: "none",
                              borderRadius: "8px",
                              overflow: "visible"
                            }}
                          >
                            <thead className="table-dark">
                              <tr>
                                {paginatedData.length > 0 && paginatedData !== null && <th scope="col">No</th>}
                                  {allColumns
                                    .filter((col) => selectedColumns.includes(col.key))
                                    .map((col, index, filteredCols) => {
                                      const isLastPosition = index === filteredCols.length - 1;
                                      const isSortable = !['name', 'salesClassification'].includes(col.key);

                                      return (
                                        <th key={col.key}>
                                          <div className={`d-flex align-items-center gap-1 position-relative ${isLastPosition ? "justify-content-center" : "justify-content-start"
                                          }`}>
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
                                            {isSortable && (
                                              <SortIcon columnKey={col.key} currentSort={sortConfig} />
                                            )}
                                          </div>
                                        </th>
                                      )
                                    })
                                  }
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
                                    left: arrowPosition.left,
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
                            <tbody>
                              {paginatedData.length > 0 && paginatedData !== null ? (
                                paginatedData?.map((entry, index) => (
                                  <React.Fragment>
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
                                      {/* {selectedColumns.includes("insight") && (
                                        <td style={{ width: "260px" }}>
                                          <span>
                                            {entry.data[0].insight === undefined || entry.data[0].insight === null ? "-" : entry.data[0].insight}
                                          </span>
                                        </td>
                                      )} */}
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
                                      {selectedColumns.includes("pv") && (
                                        <td style={{ width: "160px" }}>
                                          <div className="d-flex flex-column">
                                            <span>{entry.data[0].pv === undefined || entry.data[0].pv === null ? "-" : formatTableValue(entry.data[0].pv, "simple_currency")}</span>
                                            <span className={`${formatValueRatio(entry.data[0].pvComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                              {entry.data[0].pvComparison === undefined || entry.data[0].pvComparison === null ? "-" : formatTableValue(entry.data[0].pvComparison, "ratio")}
                                            </span>
                                          </div>
                                        </td>
                                      )}
                                      {selectedColumns.includes("addToCartUnits") && (
                                        <td style={{ width: "160px" }}>
                                          <div className="d-flex flex-column">
                                            <span>{entry.data[0].addToCartUnits === undefined || entry.data[0].addToCartUnits === null ? "-" : formatTableValue(entry.data[0].addToCartUnits, "simple_currency")}</span>
                                            <span className={`${formatValueRatio(entry.data[0].addToCartUnitsComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                              {entry.data[0].addToCartUnitsComparison === undefined || entry.data[0].addToCartUnitsComparison === null ? "-" : formatTableValue(entry.data[0].addToCartUnitsComparison, "ratio")}
                                            </span>
                                          </div>
                                        </td>
                                      )}
                                      {selectedColumns.includes("uvToAddToCartRate") && (
                                        <td style={{ width: "220px" }}>
                                          <div className="d-flex flex-column">
                                            <span>{entry.data[0].uvToAddToCartRate === undefined || entry.data[0].uvToAddToCartRate === null ? "-" : formatTableValue(entry.data[0].uvToAddToCartRate, "percentage")}</span>
                                            <span className={`${formatValueRatio(entry.data[0].uvToAddToCartRate).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                              {entry.data[0].uvToAddToCartRateComparison === undefined || entry.data[0].uvToAddToCartRateComparison === null ? "-" : formatTableValue(entry.data[0].uvToAddToCartRateComparison, "ratio")}
                                            </span>
                                          </div>
                                        </td>
                                      )}
                                      {selectedColumns.includes("placedUnits") && (
                                        <td style={{ width: "220px" }}>
                                          <div className="d-flex flex-column">
                                            <span>{entry.data[0].placedUnits === undefined || entry.data[0].placedUnits === null ? "-" : formatTableValue(entry.data[0].placedUnits, "simple_currency")}</span>
                                            <span className={`${formatValueRatio(entry.data[0].placedUnitsComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                              {entry.data[0].placedUnitsComparison === undefined || entry.data[0].placedUnitsComparison === null ? "-" : formatTableValue(entry.data[0].placedUnitsComparison, "ratio")}
                                            </span>
                                          </div>
                                        </td>
                                      )}
                                      {selectedColumns.includes("placedBuyersToConfirmedBuyersRate") && (
                                        <td style={{ width: "300px" }}>
                                          <div className="d-flex flex-column">
                                            <span>{entry.data[0].placedBuyersToConfirmedBuyersRate === undefined || entry.data[0].placedBuyersToConfirmedBuyersRate === null ? "-" : formatTableValue(entry.data[0].placedBuyersToConfirmedBuyersRate, "percentage")}</span>
                                            <span className={`${formatValueRatio(entry.data[0].placedBuyersToConfirmedBuyersRate).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                              {entry.data[0].placedBuyersToConfirmedBuyersRateComparison === undefined || entry.data[0].placedBuyersToConfirmedBuyersRateComparison === null ? "-" : formatTableValue(entry.data[0].placedBuyersToConfirmedBuyersRateComparison, "ratio")}
                                            </span>
                                          </div>
                                        </td>
                                      )}
                                      {selectedColumns.includes("uvToConfirmedBuyersRate") && (
                                        <td style={{ width: "260px" }}>
                                          <div className="d-flex flex-column">
                                            <span>{entry.data[0].uvToConfirmedBuyersRate === undefined || entry.data[0].uvToConfirmedBuyersRate === null ? "-" : formatTableValue(entry.data[0].uvToConfirmedBuyersRate, "percentage")}</span>
                                            <span className={`${formatValueRatio(entry.data[0].uvToConfirmedBuyersRate).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                              {entry.data[0].uvToConfirmedBuyersRateComparison === undefined || entry.data[0].uvToConfirmedBuyersRateComparison === null ? "-" : formatTableValue(entry.data[0].uvToConfirmedBuyersRateComparison, "ratio")}
                                            </span>
                                          </div>
                                        </td>
                                      )}
                                      {selectedColumns.includes("uvToPlacedBuyersRate") && (
                                        <td style={{ width: "260px" }}>
                                          <div className="d-flex flex-column">
                                            <span>{entry.data[0].uvToPlacedBuyersRate === undefined || entry.data[0].uvToPlacedBuyersRate === null ? "-" : formatTableValue(entry.data[0].uvToPlacedBuyersRate, "percentage")}</span>
                                            <span className={`${formatValueRatio(entry.data[0].uvToPlacedBuyersRate).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                              {entry.data[0].uvToPlacedBuyersRateComparison === undefined || entry.data[0].uvToPlacedBuyersRateComparison === null ? "-" : formatTableValue(entry.data[0].uvToPlacedBuyersRateComparison, "ratio")}
                                            </span>
                                          </div>
                                        </td>
                                      )}
                                      {selectedColumns.includes("confirmedSales") && (
                                        <td style={{ width: "240px" }}>
                                          <div className="d-flex flex-column">
                                            <span>{entry.data[0].confirmedSales === undefined || entry.data[0].confirmedSales === null ? "-" : formatTableValue(entry.data[0].confirmedSales, "simple_currency")}</span>
                                            <span className={`${formatValueRatio(entry.data[0].confirmedSales).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                              {entry.data[0].confirmedSalesComparison === undefined || entry.data[0].confirmedSalesComparison === null ? "-" : formatTableValue(entry.data[0].confirmedSalesComparison, "ratio")}
                                            </span>
                                          </div>
                                        </td>
                                      )}
                                      {selectedColumns.includes("placedSales") && (
                                        <td style={{ width: "260px" }}>
                                          <div className="d-flex flex-column">
                                            <span>{entry.data[0].placedSales === undefined || entry.data[0].placedSales === null ? "-" : formatTableValue(entry.data[0].placedSales, "simple_currency")}</span>
                                            <span className={`${formatValueRatio(entry.data[0].placedSalesComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                              {entry.data[0].placedSalesComparison === undefined || entry.data[0].placedSalesComparison === null ? "-" : formatTableValue(entry.data[0].placedSalesComparison, "ratio")}
                                            </span>
                                          </div>
                                        </td>
                                      )}
                                      {selectedColumns.includes("confirmedSellRatio") && (
                                        <td style={{ width: "180px" }}>
                                          <div className="d-flex flex-column">
                                            <span>{entry.data[0].confirmedSellRatio === undefined || entry.data[0].confirmedSellRatio === null ? "-" : formatTableValue(entry.data[0].confirmedSellRatio, "percentage") }</span>
                                            <span className={`${formatValueRatio(entry.data[0].confirmedSellRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                              {entry.data[0].confirmedSellRatioComparison === undefined || entry.data[0].confirmedSellRatioComparison === null ? "-" : formatTableValue(entry.data[0].confirmedSellRatioComparison, "ratio")}
                                            </span>
                                          </div>
                                        </td>
                                      )}
                                    </tr>
                                  </React.Fragment>
                                ))
                              ) : (
                                <div className="w-100 d-flex justify-content-center">
                                  <span>Data tidak tersedia</span>
                                </div>
                              )}
                            </tbody>
                          </table>
                        </div>
                        {/* Pagination */}
                        {paginatedData.length > 0 && paginatedData !== null && renderPagination()}
                      </div>
                    </div>
                  )
                }
              </div>
            </div>
        </div>
      </BaseLayout>
    </>
  );
};