import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";
import Calendar from "react-calendar";
import * as echarts from "echarts";
import toast from "react-hot-toast";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";

import { useAuth } from "../../context/Auth";
import axiosRequest from "../../utils/request";
import useDebounce from "../../hooks/useDebounce";
import BaseLayout from "../../components/organisms/BaseLayout";
import convertBudgetToIDR from "../../utils/convertBudgetIDR";
import converTypeAds from "../../utils/convertTypeAds";
import formatRupiahFilter from "../../utils/convertFormatRupiahFilter";
import convertFormatCTR from "../../utils/convertFormatToCTR";
import formatMetricValue from "../../utils/convertValueMetricFilter";
import formatValueRatio from "../../utils/convertFormatRatioValue";
import Loading from "../../components/atoms/Loading/Loading";


export default function PerformanceProductPage() {
  const { userData } = useAuth();
  const [userNow, setUserNow] = useState(null);
  const [shopDataId, setShopDataId] = useState(null);
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
  const [statusProductFilter, setStatusProductFilter] = useState("all");
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
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [isTableFilterLoading, setIsTableFilterLoading] = useState(false);

  // const getShopeeId = localStorage.getItem("shopeeId");
  const getShopeeId = "252234165";
  if (getShopeeId == null || getShopeeId === null || getShopeeId === "null" || getShopeeId === "undefined") {
      return (
      <BaseLayout>
        <div className="alert alert-warning">
          Tidak ada merchant aktif. Silahkan buat merchant atau login ke merchant terlebih dahulu.
        </div>
      </BaseLayout>
    );
  };


  // const fetchGetCurrentUser = async () => {
  //   setIsLoading(true);
  //   try {
  //     const response = await axiosRequest.get(`/api/users/${userData.userId}`);
  //     if (response.status === 200 || response.status === 201 || response.code === 200) {
  //       const currentUser = response.data;
  //       setUserNow(currentUser);
  //     } else {
  //       console.error("Failed to fetch current user, status:", response.status);
  //     }

  //   } catch (error) {
  //     console.error("Error fetching current user:", error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   fetchGetCurrentUser();
  // }, [userData.userId]);

  // const merchantData = userNow && userNow?.merchants && userNow?.activeMerchant !== null;
  // if (!merchantData) {
  //   return (
  //     <BaseLayout>
  //       <div className="alert alert-warning">
  //         Tidak ada merchant aktif. Silahkan buat merchant atau login ke merchant terlebih dahulu.
  //       </div>
  //     </BaseLayout>
  //   );
  // };

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
    uvToAddToCartRate: { 
      label: "Add To Cart (Percentage)", 
      color: "#00B800",
      dataKey: "uvToAddToCartRate" 
    },
    placedUnits: { 
      label: "Produk Siap Dikirim", 
      color: "#DFC100",
      dataKey: "placedUnits" 
    },
    placedBuyersToConfirmedBuyersRate: { 
      label: "Convertion Rate (Pesanan Siap Dikirim Dibagi Pesanan Dibuat)", 
      color: "#E200D6FF",
      dataKey: "placedBuyersToConfirmedBuyersRate" 
    },
    uvToConfirmedBuyersRate: { 
      label: "Convertion Rate (Pesanan Siap Dikirim)", 
      color: "#A5009DFF",
      dataKey: "uvToConfirmedBuyersRate" 
    },
    uvToPlacedBuyersRate: { 
      label: "Convertion Rate (Pesanan yang Dibuat)", 
      color: "#5F005AFF",
      dataKey: "uvToPlacedBuyersRate" 
    },
    confirmedSales: { 
      label: "Penjualan (Pesanan Siap Dikirim)", 
      color: "#FB8A00FF",
      dataKey: "confirmedSales" 
    },
    placedSales: { 
      label: "Penjualan (Total Penjualan dari Pesanan Dibuat)", 
      color: "#A15800FF",
      dataKey: "placedSales" 
    }
  };

  const toLocalISOString = (date) => {
    // console.log('Converting date to ISO string:', date);
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

  const fetchChartData = async (dateRanges) => {
    try {
      const from1ISO = toLocalISOString(dateRanges.current.from);
      const to1ISO = toLocalISOString(dateRanges.current.to);

      const apiUrl = `/api/product-performance/chart?shopId=${getShopeeId}&from=${from1ISO}&to=${to1ISO}&limit=100000000000000000`;

      const response = await axiosRequest.get(apiUrl);
      const data = await response.data;
      const content = data.content || [];

      setChartRawData(content);
      const totals = calculateMetricTotalsValue(content);
      setMetricsTotals(totals);

      return content;
    } catch (error) {
      toast.error("Gagal mengambil data chart iklan produk");
      console.error('Gagal mengambil data chart iklan produk, kesalahan pada server:', error);
      return [];
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
      let apiUrl = `/api/product-performance?shopId=${getShopeeId}&from1=${from1ISO}&to1=${to1ISO}&from2=${from2ISO}&to2=${to2ISO}&limit=1000000&page=${backendPage}`;

      if (filters.searchQuery && filters.searchQuery.trim() !== "") {
        apiUrl += `&search=${encodeURIComponent(filters.searchQuery.trim())}`;
      }
      
      if (filters.statusFilter && filters.statusFilter !== "all") {
        apiUrl += `&state=${filters.statusFilter}`;
      }

      if (filters.typeAds && filters.typeAds.length > 0) {
        const typeValues = filters.typeAds.map(type => type.value);
        if (!typeValues.includes("all")) {
          apiUrl += `&biddingStrategy=${typeValues.join(",")}`;
        }
      }

      if (filters.classification && filters.classification.length > 0) {
        const classificationValues = filters.classification.map(cls => cls.label);
        apiUrl += `&salesClassification=${classificationValues.join(",")}`;
      }

      if (filters.placement && filters.placement.value !== "all") {
        apiUrl += `&productPlacement=${filters.placement.value}`;
      }

      // console.log('API URL Table Data:', apiUrl);
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

  const fetchData = async (currentSelection, selectionType, page = 1) => {
    setIsLoading(true);
    
    try {
      const dateRanges = generateComparisonDateRanges(currentSelection, selectionType);
      // console.log('Generated Date Ranges:', {
      //   previous: `${dateRanges.previous.from.toISOString()} - ${dateRanges.previous.to.toISOString()}`,
      //   current: `${dateRanges.current.from.toISOString()} - ${dateRanges.current.to.toISOString()}`
      // });

      const currentFilters = {
        searchQuery: debouncedSearchTerm,
        statusFilter: statusProductFilter,
        classification: selectedClassificationOption,
      };

      setRangeParameters({
        isComparison: true,
        current: dateRanges.current,
        previous: dateRanges.previous,
        selectionType: selectionType
      });

      await Promise.all([
        fetchChartData(dateRanges),
        fetchTableData(dateRanges, page, currentFilters)
      ]);
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
      statusFilter: statusProductFilter,
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
        if (!product.data || product.data.length === 0) return;
        
        if (isSingleDay) {
          product?.data.forEach(productData => {
            // should be and operator
            if ((!productData && !productData.shopeeFrom) || !productData.createdAt) return;

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
            if ((!productData && !productData.shopeeFrom) || !productData.createdAt) return;

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
        statusFilter: statusProductFilter,
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

  useEffect(() => {
    // Initial load with default "minggu_ini" preset
    fetchData(getAllDaysInLast7Days(), "minggu_ini", 1);
  }, []);

  // Update totals when raw/main data changes
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

  useEffect(() => {
    if (chartRef?.current && chartData?.series && chartData?.series.length > 0) {
      const initChart = () => {
        try {
          const existingInstance = echarts.getInstanceByDom(chartRef.current);
          if (existingInstance) {
            existingInstance.dispose();
          }

          const chartInstance = echarts.init(chartRef.current);

          const series = chartData?.series?.map(s => ({
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
          if (selectedMetrics.length > 1 || selectedMetrics.includes("pv")) {
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
              rotateAxisLabel = 20;
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
              nameGap: 30
            },
            series: series
          };

          if (!hasData && (comparatorDateRange && comparedDateRange)) {
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

          return () => {
            if (chartInstance && !chartInstance.isDisposed()) {
              chartInstance.dispose();
            }
          };
        } catch (err) {
          toast.error("Gagal memuat chart produk");
          console.error("Gagal menampilkan chart, kesalahan pada server :", err);
        }
      }

      const timer = setTimeout(() => initChart(), 100);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [chartData, selectedMetrics]);

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



  // SALES CLASSIFICATION ADS FEATURE
  const typeClasificationOptions = [
    { value: "best_seller", label: "Best Seller" },
    { value: "middle_moving", label: "Middle Moving" },
    { value: "slow_moving", label: "Slow Moving" },
  ];

  const handleClassificationChange = (selectedOptions) => {
    setSelectedClassificationOption(selectedOptions);
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
    if (filteredData.length > 0) {
      const startIndex = 0;
      const endIndex = Math.min(itemsPerPage, filteredData.length);
      setPaginatedData(filteredData.slice(startIndex, endIndex));

      const calculatedTotalPages = Math.ceil(totalElements / itemsPerPage);
      setTotalPages(calculatedTotalPages || 1);
    } else {
      setPaginatedData([]);
      setTotalPages(1);
    }
  }, [filteredData, itemsPerPage, totalElements]);

  const renderPagination = () => {
    const visiblePages = getVisiblePageNumbers();
    const showFirstLastButtons = totalPages > 10;
    const getWidthWindow = window.innerWidth;

    return (
      <div className="custom-container-pagination mt-3">
        <div className="custom-pagination-select d-flex align-items-center gap-2">
          <span
            style={{
              display: `${getWidthWindow < 768 ? 'none' : 'block'}`
            }}
          >Tampilan</span>
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
                        className="page-link"
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
                        className="page-link"
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
                          className="page-link"
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
                          className="page-link"
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
    setCurrentPage(1);

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
  }, [debouncedSearchTerm, statusProductFilter, selectedClassificationOption]);



  // FILTER COLUMNS TABLE FEATURE
  const allColumns = [
    { key: "name", label: "Nama" },
    { key: "insight", label: "Insight" },
    { key: "salesClassification", label: "Sales Classification" },
    { key: "pv", label: "Pengunjung" },
    { key: "addToCartUnits", label: "Add To Cart" },
    { key: "uvToAddToCartRate", label: "Add To Cart (Percentage)" },
    { key: "placedUnits", label: "Produk Siap Dikirim" },
    { key: "placedBuyersToConfirmedBuyersRate", label: "Convertion Rate (Pesanan Siap Dikirim Dibagi Pesanan Dibuat)" },
    { key: "uvToConfirmedBuyersRate", label: "Convertion Rate (Pesanan Siap Dikirim)" },
    { key: "uvToPlacedBuyersRate", label: "Convertion Rate (Pesanan yang Dibuat)" },
    { key: "confirmedSales", label: "Penjualan (Pesanan Siap Dikirim)" },
    { key: "placedSales", label: "Penjualan (Total Penjualan dari Pesanan Dibuat)" },
    { key: "confirmedSellRatio", label: "Ratio Penjualan" },
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

  const toggleOpenCalendar = () => {
    if (showCalendar) {
      setAnimateCalendar(false);
      setTimeout(() => setShowCalendar(false), 100);
    } else {
      setShowCalendar(true);
      setTimeout(() => setAnimateCalendar(true), 100);
    }
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
                <div className="d-flex justify-content-between align-items-start pb-1">
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
                                        {comparatorDateRange[0].toLocaleDateString("id-ID")} - ${comparatorDateRange[1].toLocaleDateString("id-ID")}
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
                                      {comparedDateRange[0].toLocaleDateString("id-ID")} - ${comparedDateRange[1].toLocaleDateString("id-ID")}
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
                      {/* Alert validation */}
                      {showAlert && (
                        <div className="alert alert-warning alert-dismissible fade show" role="alert">
                          Maksimal metrik yang dapat dipilih adalah 4 metrik
                          <button type="button" className="btn-close" onClick={() => setShowAlert(false)}></button>
                        </div>
                      )}
                      {selectedMetrics.length === 0 && (
                        <div className="alert alert-warning alert-dismissible fade show">
                          <span >Pilih minimal 1 metrik untuk menampilkan data</span>
                        </div>
                      )}
                      {/* Chart */}
                      <div ref={chartRef} style={{ width: "100%", height: "320px" }}></div>
                      {/* Filters & Table */}
                      <div className="d-flex flex-column gap-2">
                        {/* Status filter */}
                        <div
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
                        </div>
                        {/* Other filter */}
                        <div className="d-flex flex-column mb-3 gap-2">
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
                        <div style={{ position: 'relative' }}>
                          {isTableFilterLoading && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'start',
                                zIndex: 10,
                                minHeight: '100vh'
                              }}
                            >
                              <Loading size={40} />
                            </div>
                          )}
                        </div>
                        {/* Table container */}
                        <div className="table-responsive">
                          <table className="table table-centered" 
                            style={{
                              width: "100%",
                              minWidth: "max-content",
                              maxWidth: "none",
                            }}
                          >
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
                                      {selectedColumns.includes("insight") && (
                                        <td style={{ width: "260px" }}>
                                          <span>
                                            {entry.data[0].insight === undefined || entry.data[0].insight === null ? "-" : entry.data[0].insight}
                                          </span>
                                        </td>
                                      )}
                                      {selectedColumns.includes("salesClassification") && (
                                        <td style={{ width: "260px" }}>
                                          <span>
                                            {entry.data[0].salesClassification === undefined || entry.data[0].salesClassification === null ? "-" : entry.data[0].salesClassification}
                                          </span>
                                        </td>
                                      )}
                                      {selectedColumns.includes("pv") && (
                                        <td>
                                          <div className="d-flex flex-column">
                                            <span>{entry.data[0].pv === undefined || entry.data[0].pv === null ? "-" : entry.data[0].pv}</span>
                                            <span className={`${formatValueRatio(entry.data[0].pvComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                              {entry.data[0].pvComparison === undefined ? "-" : entry.data[0].pvComparison === null ? "0" : `${formatValueRatio(entry.data[0].pvComparison).rounded}%`}
                                            </span>
                                          </div>
                                        </td>
                                      )}
                                      {selectedColumns.includes("addToCartUnits") && (
                                        <td>
                                          <div className="d-flex flex-column">
                                            <span>{entry.data[0].addToCartUnits === undefined || entry.data[0].addToCartUnits === null ? "-" : entry.data[0].addToCartUnits}</span>
                                            <span className={`${formatValueRatio(entry.data[0].addToCartUnitsComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                              {entry.data[0].addToCartUnitsComparison === undefined ? "-" : entry.data[0].addToCartUnitsComparison === null ? "0" : `${formatValueRatio(entry.data[0].addToCartUnitsComparison).rounded}%`}
                                            </span>
                                          </div>
                                        </td>
                                      )}
                                      {selectedColumns.includes("uvToAddToCartRate") && (
                                        <td>
                                          <div className="d-flex flex-column">
                                            <span>{entry.data[0].uvToAddToCartRate}</span>
                                            <span className={`${formatValueRatio(entry.data[0].uvToAddToCartRate).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                              {entry.data[0].uvToAddToCartRate === undefined ? "-" : entry.data[0].uvToAddToCartRate === null ? "0" : `${formatValueRatio(entry.data[0].uvToAddToCartRate).rounded}%`}
                                            </span>
                                          </div>
                                        </td>
                                      )}
                                      {selectedColumns.includes("placedUnits") && (
                                        <td>
                                          <div className="d-flex flex-column">
                                            <span>{entry.data[0].placedUnits === undefined || entry.data[0].placedUnits === null ? "-" : entry.data[0].placedUnits}</span>
                                            <span className={`${formatValueRatio(entry.data[0].placedUnitsComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                              {entry.data[0].placedUnitsComparison === undefined ? "-" : entry.data[0].placedUnitsComparison === null ? "0" : `${formatValueRatio(entry.data[0].placedUnitsComparison).rounded}%`}
                                            </span>
                                          </div>
                                        </td>
                                      )}
                                      {selectedColumns.includes("placedBuyersToConfirmedBuyersRate") && (
                                        <td>
                                          <div className="d-flex flex-column">
                                            <span>{entry.data[0].placedBuyersToConfirmedBuyersRate === undefined || entry.data[0].placedBuyersToConfirmedBuyersRate === null ? "-" : entry.data[0].placedBuyersToConfirmedBuyersRate}</span>
                                            <span className={`${formatValueRatio(entry.data[0].placedBuyersToConfirmedBuyersRate).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                              {entry.data[0].placedBuyersToConfirmedBuyersRate === undefined ? "-" : entry.data[0].placedBuyersToConfirmedBuyersRate === null ? "0" : `${formatValueRatio(entry.data[0].placedBuyersToConfirmedBuyersRate).rounded}%`}
                                            </span>
                                          </div>
                                        </td>
                                      )}
                                      {selectedColumns.includes("uvToConfirmedBuyersRate") && (
                                        <td>
                                          <div className="d-flex flex-column">
                                            <span>{entry.data[0].uvToConfirmedBuyersRate === undefined || entry.data[0].uvToConfirmedBuyersRate === null ? "-" : entry.data[0].uvToConfirmedBuyersRate}</span>
                                            <span className={`${formatValueRatio(entry.data[0].uvToConfirmedBuyersRate).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                              {entry.data[0].uvToConfirmedBuyersRate === undefined ? "-" : entry.data[0].uvToConfirmedBuyersRate === null ? "0" : `${formatValueRatio(entry.data[0].uvToConfirmedBuyersRate).rounded}%`}
                                            </span>
                                          </div>
                                        </td>
                                      )}
                                      {selectedColumns.includes("uvToPlacedBuyersRate") && (
                                        <td>
                                          <div className="d-flex flex-column">
                                            <span>{entry.data[0].uvToPlacedBuyersRate === undefined || entry.data[0].uvToPlacedBuyersRate === null ? "-" : entry.data[0].uvToPlacedBuyersRate}</span>
                                            <span className={`${formatValueRatio(entry.data[0].uvToPlacedBuyersRate).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                              {entry.data[0].uvToPlacedBuyersRate === undefined ? "-" : entry.data[0].uvToPlacedBuyersRate === null ? "0" : `${formatValueRatio(entry.data[0].uvToPlacedBuyersRate).rounded}%`}
                                            </span>
                                          </div>
                                        </td>
                                      )}
                                      {selectedColumns.includes("confirmedSales") && (
                                        <td>
                                          <div className="d-flex flex-column">
                                            <span>{entry.data[0].confirmedSales === undefined || entry.data[0].confirmedSales === null ? "-" : entry.data[0].confirmedSales}</span>
                                            <span className={`${formatValueRatio(entry.data[0].confirmedSales).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                              {entry.data[0].confirmedSalesComparison === undefined ? "-" : entry.data[0].confirmedSalesComparison === null ? "0" : `${formatValueRatio(entry.data[0].confirmedSalesComparison).rounded}%`}
                                            </span>
                                          </div>
                                        </td>
                                      )}
                                      {selectedColumns.includes("placedSales") && (
                                        <td>
                                          <div className="d-flex flex-column">
                                            <span>{entry.data[0].placedSales === undefined || entry.data[0].placedSales === null ? "-" : entry.data[0].placedSales}</span>
                                            <span className={`${formatValueRatio(entry.data[0].placedSalesComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                              {entry.data[0].placedSalesComparison === undefined ? "-" : entry.data[0].placedSalesComparison === null ? "0" : `${formatValueRatio(entry.data[0].placedSalesComparison).rounded}%`}
                                            </span>
                                          </div>
                                        </td>
                                      )}
                                      {selectedColumns.includes("confirmedSellRatio") && (
                                        <td>
                                          <div className="d-flex flex-column">
                                            <span>{entry.data[0].confirmedSellRatio === undefined || entry.data[0].confirmedSellRatio === null ? "-" : entry.data[0].confirmedSellRatio}</span>
                                            <span className={`${formatValueRatio(entry.data[0].confirmedSellRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                              {entry.data[0].confirmedSellRatio === undefined ? "-" : entry.data[0].confirmedSellRatio === null ? "0" : `${formatValueRatio(entry.data[0].confirmedSellRatio).rounded}%`}
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
                        {filteredData.length > 0 && filteredData !== null && renderPagination()}
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