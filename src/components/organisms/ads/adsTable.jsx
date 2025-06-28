import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import Select from "react-select";
import Calendar from "react-calendar";
import toast from "react-hot-toast";
import * as echarts from "echarts";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";

import axiosRequest from "../../../utils/request";
import useDebounce from "../../../hooks/useDebounce";
import formatValueRatio from "../../../utils/convertFormatRatioValue";
import formatStyleSalesClassification from "../../../utils/convertFormatSalesClassification";
import formatTableValue from "../../../utils/formatTableValue";
import Loading from "../../atoms/Loading/Loading";


const AdsTable = ({ shoppeeId }) => {
  // Data
  const [chartRawData, setChartRawData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const chartRef = useRef(null);
  // const shopId = "252234165";
  const shopId = shoppeeId;
  const [tempCustomRoas, setTempCustomRoas] = useState({});
  // Filter
  const [comparatorDateRange, setComparatorDateRange] = useState(null);
  const [comparedDateRange, setComparedDateRange] = useState(null);
  const [rangeParameters, setRangeParameters] = useState(null);
  const [date, setDate] = useState(getAllDaysInLast7Days());
  const [flagCustomRoasDate, setFlagCustomRoasDate] = useState("minggu_ini");
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedMetrics, setSelectedMetrics] = useState(["impression"]);
  const [metricsTotals, setMetricsTotals] = useState({});
  const [statusAdsFilter, setStatusAdsFilter] = useState("all");
  const [selectedClassificationOption, setSelectedClassificationOption] = useState([]);
  const [selectedOptionPlacement, setSelectedOptionPlacement] = useState({ value: "all", label: "Semua" });
  const [selectedTypeAds, setSelectedTypeAds] = useState([{ value: "all", label: "Semua Tipe" }]);
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


  
  // Define metric key with their display names and colors
  const metrics = {
    impression: {
      label: "Iklan Dilihat",
      color: "#D50000",
      dataKey: "impression",
      type: "simple_currency"
    },
    click: {
      label: "Jumlah Klik",
      color: "#00B800",
      dataKey: "click",
      type: "simple_currency"
    },
    ctr: {
      label: "Persentase Klik",
      color: "#DFC100",
      dataKey: "ctr",
      type: "percentage"
    },
    checkout: {
      label: "Pesanan",
      color: "#C400BA",
      dataKey: "checkout",
      type: "simple_currency"
    },
    broadOrderAmount: {
      label: "Produk Terjual",
      color: "#35007FFF",
      dataKey: "broadOrderAmount",
      type: "simple_currency"
    },
    broadGmv: {
      label: "Penjualan dari Iklan",
      color: "#AD5F00",
      dataKey: "broadGmv",
      type: "currency"
    },
    dailyBudget: {
      label: "Biaya Iklan",
      color: "#00B69A",
      dataKey: "dailyBudget",
      type: "currency"
    },
    roas: {
      label: "ROAS",
      color: "#743A00FF",
      dataKey: "roas",
      type: "coma"
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

  // Function to calculate totals for each metric based on raw data affected by time filter
  function calculateMetricTotalsValue (products) {
    // Make an object to store totals for each available metric
    const totals = {};
    // Foreach metric on all available metrics
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

      const apiUrl = `/api/product-ads/chart?shopId=${shopId}&from=${from1ISO}&to=${to1ISO}&limit=1000000000`;
      
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
      setIsLoading(false);
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
      let apiUrl = `/api/product-ads?shopId=${shopId}&from1=${from1ISO}&to1=${to1ISO}&from2=${from2ISO}&to2=${to2ISO}&limit=50&page=${backendPage}`;

      if (filters.searchQuery && filters.searchQuery.trim() !== "") {
        apiUrl += `&title=${encodeURIComponent(filters.searchQuery.trim())}`;
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
      
      const currentFilters = {
        searchQuery: debouncedSearchTerm,
        statusFilter: statusAdsFilter,
        typeAds: selectedTypeAds,
        classification: selectedClassificationOption,
        placement: selectedOptionPlacement
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
      statusFilter: statusAdsFilter,
      typeAds: selectedTypeAds,
      classification: selectedClassificationOption,
      placement: selectedOptionPlacement
    };
  };

  const handleAdsProductClick = (adsProduct) => {
    if (selectedProduct?.campaignId === adsProduct.campaignId) {
      setSelectedProduct(null);
    } else {
      setSelectedProduct(adsProduct);
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

  function generateMultipleMetricsChartData(selectedDate = null, ads = null, selectedMetrics = ["impression"]) {
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
    if (ads) {
      chartDataProducts = chartRawData.filter((product) => product.campaignId == ads.campaignId);
    }

    selectedMetrics?.forEach(metricKey => {
      const metric = metrics[metricKey];
      if (!metric) return;

      const dataKey = metric.dataKey;
      let dataMap = {};

      timeIntervals.forEach((time) => {
        dataMap[time] = 0;
      });

      chartDataProducts?.forEach((adsProduct) => {
        if (!adsProduct.data || adsProduct.data.length === 0) return;

        if (isSingleDay) {
          adsProduct.data.forEach((productData) => {
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
          
          adsProduct.data.forEach((productData) => {
            if (!productData.shopeeFrom || productData.shopeeFrom === null) return;

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
        statusFilter: statusAdsFilter,
        typeAds: selectedTypeAds,
        classification: selectedClassificationOption,
        placement: selectedOptionPlacement
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



  // SALES CLASSIFICATION ADS FEATURE
  const typeClasificationOptions = [
    { value: "best_seller", label: "Best Seller" },
    { value: "middle_moving", label: "Middle Moving" },
    { value: "slow_moving", label: "Slow Moving" },
  ];

  const handleClassificationChange = (selectedOptions) => {
    setSelectedClassificationOption(selectedOptions || []);
  };



  // FILTER COLUMNS FEATURE
  const allColumns = [
    { key: "info_iklan", label: "Info iklan" },
    { key: "dailyBudget", label: "Modal" },
    { key: "insight", label: "Insight" },
    { key: "salesClassification", label: "Sales Classification" },
    { key: "cost", label: "Biaya Iklan" },
    { key: "broadGmv", label: "Penjualan dari iklan" },
    { key: "roas", label: "ROAS" },
    { key: "customRoas", label: "Custom ROAS" },
    { key: "impression", label: "Iklan dilihat" },
    { key: "click", label: "Jumlah Klik" },
    { key: "ctr", label: "Presentase Klik" }, 
    { key: "broadOrder", label: "Konversi" },
    { key: "cr", label: "Tingkat Konversi" },
    { key: "broadOrderAmount", label: "Produk Terjual" },
    { key: "cpc", label: "Biaya per Konversi" },
    { key: "acos", label: "Presentase Biaya Iklan (ACOS)" },
    { key: "directOrder", label: "Konversi Langung" },
    { key: "directOrderAmount", label: "Produk Terjual Langsung" },
    { key: "directGmv", label: "Penjualan dari Iklan Langsung" },
    { key: "directRoi", label: "ROAS (Efektifitas Iklan) Langsung" },
    { key: "directCir", label: "ACOS Langsung" },
    { key: "directCr", label: "Tingkat Konversi Langsung" },
    { key: "cpdc", label: "Biaya per Konversi Langsung" },
    { key: "detail", label: "Detail Iklan" }
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



  // TYPE ADS FILTER FEATURE
  const typeAdsOptions = [
    { value: "all", label: "Semue Tipe" },
    { value: "product_gmv_max_roas", label: "Iklan Produk GMV Max ROAS" },
    { value: "product_gmv_max_auto", label: "Iklan Produk GMV Max Auto" },
    { value: "auto", label: "Iklan Produk Auto" },
    { value: "manual", label: "Iklan Produk Manual" },
    { value: "shop_auto", label: "Iklan Toko Auto" },
    { value: "shop_manual", label: "Iklan Toko Manual" },
  ];

  const handleAdsChange = (selectedOptions) => {
    // Check if "all" is selected
    const hasAll = selectedOptions.some(option => option.value === "all");
    const hadAll = selectedTypeAds.some(option => option.value === "all");

    let newSelectedOptions;
    // If "all" is newly selected, remove all other options
    if (hasAll && !hadAll) {
      newSelectedOptions = [{ value: "all", label: "Semua Tipe" }];
    }
    // If any other options are selected and "all" is already there, remove "all"
    else if (selectedOptions.length > 1 && hasAll) {
      newSelectedOptions = selectedOptions.filter(option => option.value !== "all");
    }
    // If no options are selected, set back to "all"
    else if (selectedOptions.length === 0) {
      newSelectedOptions = [{ value: "all", label: "Semua Tipe" }];
    }
    // Normal case, set selected options
    else {
      newSelectedOptions = selectedOptions;
    }

    setSelectedTypeAds(newSelectedOptions);
  };



  // PLACEMENT ADS FILTER FEATURE
  const placementOptions = [
    { value: "all", label: "Semua" },
    { value: "targeting", label: "Halaman Rekomendasi" },
    { value: "search_product", label: "Halaman Pencarian" },
  ];

  const handlePlacementChange = (selectedOption) => {
    setSelectedOptionPlacement(selectedOption);
  };

  // Check if "manual" is selected in the type ads filter
  const isTypeManualProductSelected = selectedTypeAds.some(
    (option) => option.value === "manual"
  );



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
  }, [date, selectedProduct, selectedMetrics, chartRawData, rangeParameters, comparatorDateRange, comparedDateRange]);

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

      const seriesConfig = activeSeries.map(s => ({
        name: s.name,
        type: 'line',
        smooth: true,
        showSymbol: false,
        emphasis: { focus: 'series' },
        data: s.data,
        lineStyle: {
          color: s.color,
          width: 2
        },
        itemStyle: {
          color: s.color
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
          left: calculateLeftMargin(seriesConfig),
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
        yAxis: {
          // name: selectedMetrics.length === 1 ? metrics[selectedMetrics[0]]?.label : "Total",
          type: "value",
          splitLine: { show: true },
        },
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
      console.error("Chart initialization error:", err);
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

  // Simplified chart initialization trigger
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

  const handleStyleMatricFilterButton = (metricKey) => {
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
  }, [debouncedSearchTerm, statusAdsFilter, selectedTypeAds, selectedOptionPlacement, selectedClassificationOption]);



  const handleUpdateCustomRoas = async (shopId, campaignId, customRoas) => {
    if (!customRoas || customRoas === "" || isNaN(customRoas)) {
      toast.error("Custom ROAS harus berisi angka yang valid");
      return;
    }

    if (!rangeParameters || !rangeParameters.current) {
      toast.error("Tidak ada data periode aktif untuk update");
      return;
    }

    const from1ISO = toLocalISOString(rangeParameters.current.from);
    const to1ISO = toLocalISOString(rangeParameters.current.to);

    try {
      const apiUrl = `/api/product-ads/custom-roas`;
      
      const params = {
        shopId: shopId,
        campaignId: campaignId,
        customRoas: parseFloat(customRoas),
        from: from1ISO,
        to: to1ISO
      };

      const response = await axiosRequest.post(apiUrl, null, { params });
      
      if (response.status === 200) {
        toast.success("Custom ROAS berhasil diupdate");
        
        setFilteredData(prevData => 
          prevData.map(product => 
            product.campaignId === campaignId 
              ? {
                  ...product,
                  data: product.data.map(item => ({
                    ...item,
                    customRoas: parseFloat(customRoas)
                  }))
                }
              : product
          )
        );

        setTempCustomRoas(prev => {
          const updated = { ...prev };
          delete updated[campaignId];
          return updated;
        });

        const currentFilters = buildCurrentFilters();
        await fetchTableData(rangeParameters, currentPage, currentFilters);
      }
      
    } catch (error) {
      console.error('Gagal update custom ROAS, kesalahan pada server:', error);
      if (error.response) {
        const errorMessage = "Gagal update custom ROAS";
        toast.error(errorMessage);
      } else if (error.request) {
        toast.error("Gagal terhubung ke server, periksa koneksi internet");
      } else {
        toast.error("Terjadi kesalahan saat update custom ROAS");
      }
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

  const getStateStyle = (state) => {
    const stateMap = {
    ongoing: {
      backgroundColor: "#00EB3FFF",
      textColor: "#00D138FF",
      label: "Berjalan",
      isAnimated: true,
    },
    closed: {
      backgroundColor: "#000000FF",
      textColor: "#000000FF",
      label: "Nonaktif",
      isAnimated: false,
    },
    ended: {
      backgroundColor: "#000000",
      textColor: "#000000",
      label: "Berakhir",
      isAnimated: false,
    },
    all: {
      backgroundColor: "#00EB3FFF",
      textColor: "#00EB3FFF",
      label: "Semua",
      isAnimated: true,
    },
    scheduled: {
      backgroundColor: "#00EB3FFF",
      textColor: "#00EB3FFF",
      label: "Terjadwal",
      isAnimated: true, 
    },
    deleted: {
      backgroundColor: "#FF0000FF",
      textColor: "#FF0000FF",
      label: "Dihapus",
      isAnimated: false,
    },
  };

    return stateMap[state] || {
      backgroundColor: "#000000FF",
      textColor: "#000000FF",
      label: "Tidak Diketahui",
      isAnimated: false,
    };
  };

  const renderAlerts = () => {
    return (
      <>
        {showAlert && (
          <div className="alert alert-warning alert-dismissible fade show" role="alert">
            Maksimal metrik yang dapat dipilih adalah 4 metrik
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setShowAlert(false)}
            ></button>
          </div>
        )}
        
        {selectedMetrics.length === 0 && !isLoading && (
          <div className="alert alert-info alert-dismissible fade show" role="alert">
            <div className="d-flex align-items-center">
              <span>Pilih minimal 1 metrik untuk menampilkan data pada chart</span>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <div className="card">
        <div className="card-body">
          {/* Header & Date Filter */}
          <div className="d-flex justify-content-between align-items-start pb-3">
            <strong>{totalElements} total produk</strong>
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
          {
            isLoading ? (
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
                        style={handleStyleMatricFilterButton(metricKey)}
                        onClick={() => handleMetricFilter(metricKey)}
                      >
                        <strong style={{ color: "#5d7186" }}>
                          {metrics[metricKey].label}
                        </strong>
                        <span className="card-text fs-4 fw-bold">
                          {
                              metrics[metricKey].type === "currency"
                                ? <span>Rp. {formatTableValue(metricsTotals[metricKey], "simple_currency")}</span>
                                : metrics[metricKey].type === "simple_currency"
                                ? <span>{formatTableValue(metricsTotals[metricKey], "simple_currency")}</span>
                                : metrics[metricKey].type === "percentage"
                                  ? <span>{formatTableValue(metricsTotals[metricKey], "percentage")}</span>
                                  : <span>{formatTableValue(metricsTotals[metricKey], "coma")}</span>
                              }
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Alert */}
                {showAlert && (
                  <div className="alert alert-warning alert-dismissible fade show" role="alert">
                    Maksimal metrik yang dapat dipilih adalah 4 metrik
                    <button type="button" className="btn-close" onClick={() => setShowAlert(false)}></button>
                  </div>
                )}
                {selectedMetrics.length === 0 && (
                  <div className="alert alert-warning alert-dismissible fade show">
                    <span>Pilih minimal 1 metrik untuk menampilkan data secara akurat</span>
                  </div>
                )}
                {/* Chart */}
                <div ref={chartRefCallback} style={{ width: "100%", height: "340px" }}>
                </div>
                {/* Filter & Table */}
                <div className="d-flex flex-column gap-2">
                  {/* Status filter */}
                  <div
                    className="d-flex align-items-center gap-1 gap-md-2 flex-wrap"
                    style={{ width: "fit-content", listStyleType: "none" }}
                  >
                    <span>Status Produk</span>
                    <div className="d-flex gap-1 gap-md-2 flex-wrap">
                      <div
                        className={`status-button-filter rounded-pill d-flex align-items-center  ${statusAdsFilter === "all"
                          ? "custom-font-color custom-border-select fw-bold"
                          : "border border-secondary-subtle"
                          }`}
                        onClick={() => setStatusAdsFilter("all")}
                        style={{ cursor: "pointer", fontSize: "12px", padding: "6px 12px", }}
                      >
                        Semua
                      </div>
                      <div
                        className={`status-button-filter rounded-pill d-flex align-items-center ${statusAdsFilter === "scheduled"
                          ? "custom-font-color custom-border-select fw-bold"
                          : "border border-secondary-subtle"
                          }`}
                        onClick={() => setStatusAdsFilter("scheduled")}
                        style={{ cursor: "pointer", fontSize: "12px", padding: "6px 12px", }}
                      >
                        Terjadwal
                      </div>
                      <div
                        className={`status-button-filter rounded-pill d-flex align-items-center  ${statusAdsFilter === "ongoing"
                          ? "custom-font-color custom-border-select fw-bold"
                          : "border border-secondary-subtle"
                          }`}
                        onClick={() => setStatusAdsFilter("ongoing")}
                        style={{ cursor: "pointer", fontSize: "12px", padding: "6px 12px", }}
                      >
                        Berjalan
                      </div>
                      <div
                        className={`status-button-filter rounded-pill d-flex align-items-center  ${statusAdsFilter === "closed"
                          ? "custom-font-color custom-border-select fw-bold"
                          : "border border-secondary-subtle"
                          }`}
                        onClick={() => setStatusAdsFilter("closed")}
                        style={{ cursor: "pointer", fontSize: "12px", padding: "6px 12px", }}
                      >
                        Nonaktif
                      </div>
                      <div
                        className={`status-button-filter rounded-pill d-flex align-items-center ${statusAdsFilter === "ended"
                          ? "custom-font-color custom-border-select fw-bold"
                          : "border border-secondary-subtle"
                          }`}
                        onClick={() => setStatusAdsFilter("ended")}
                        style={{ cursor: "pointer", fontSize: "12px", padding: "6px 12px", }}
                      >
                        Berakhir
                      </div>
                      <div
                        className={`status-button-filter rounded-pill d-flex align-items-center ${statusAdsFilter === "deleted"
                          ? "custom-font-color custom-border-select fw-bold"
                          : "border border-secondary-subtle"
                          }`}
                        onClick={() => setStatusAdsFilter("deleted")}
                        style={{ cursor: "pointer", fontSize: "12px", padding: "6px 12px", }}
                      >
                        Dihapus
                      </div>
                    </div>
                  </div>
                  {/* Other filter*/}
                  <div className="d-flex flex-column mb-3 gap-2">
                    <div id="container-other-filters" className="d-flex w-full justify-content-between align-items-start">
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
                        {/* type placement filter */}
                        {isTypeManualProductSelected && (
                          <div className="custom-filter-typePlacement">
                            <Select
                              options={placementOptions}
                              value={selectedOptionPlacement}
                              onChange={handlePlacementChange}
                              placeholder="Pilih Penempatan"
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
                                singleValue: (base) => ({
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
                        )}
                        {/* ads filter */}
                        <div className="custom-filter-typeAds">
                          <Select
                            isMulti
                            options={typeAdsOptions}
                            value={selectedTypeAds}
                            onChange={handleAdsChange}
                            placeholder="Pilih Tipe Iklan"
                            isClearable={false}
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
                          <div key={col.key} className="form-check form-check-inline py-1">
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
                            {
                              <span className="text-secondary" style={{ fontSize: "12px" }}>
                                {col.label}
                              </span>
                            }
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
                    {/* Table container */}
                    <div className="table-responsive" style={{ borderRadius: "4px" }}>
                      <table className="table table-centered"
                        style={{
                          width: "100%",
                          minWidth: "max-content",
                          maxWidth: "none",
                          borderRadius: "8px",
                        }}
                      >
                        <thead className="table-dark">
                          <tr>
                            {paginatedData.length !== 0 && paginatedData !== null && <th scope="col">No</th>}
                            {allColumns
                              .filter((col) =>
                                selectedColumns.includes(col.key) &&
                                (col.key !== "customRoas" ||
                                  (flagCustomRoasDate == "hari_ini" && col.key === "customRoas"))
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
                                  {paginatedData.length > 0 && paginatedData !== null && (
                                    <td>{index + 1}</td>
                                  )}
                                  {selectedColumns.includes("info_iklan") && (
                                    <td
                                      className="d-flex gap-2"
                                      style={{
                                        width: "400px",
                                        maxWidth: "400px",
                                        cursor: "pointer",
                                        color:
                                          selectedProduct?.campaignId === entry.campaignId
                                            ? "#F6881F"
                                            : "",
                                      }}
                                      onClick={() => handleAdsProductClick(entry)}
                                    >
                                      <img
                                        src={
                                          "https://down-id.img.susercontent.com/file/" +
                                          entry.data[0].image
                                        }
                                        alt={entry.data[0].title}
                                        className="rounded"
                                        style={{ width: "60px", height: "60px" }}
                                      />
                                      <div className="d-flex flex-column">
                                        <span className="custom-table-title-paragraph">{entry.data[0].title}</span>
                                        <span style={{ fontSize: "11px" }}>
                                          Tidak terbatas
                                        </span>
                                        {(() => {
                                          const stateStyle = getStateStyle(entry.data[0].state);
                                          return (
                                            <div className="d-flex gap-1 align-items-center">
                                              <div
                                                className={`marker ${stateStyle.isAnimated ? "animated-circle" : ""}`}
                                                style={{ backgroundColor: stateStyle.backgroundColor }}
                                              ></div>
                                              <span
                                                style={{
                                                  fontSize: "14px",
                                                  color: stateStyle.textColor,
                                                }}
                                              >
                                                {stateStyle.label}
                                              </span>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("dailyBudget") && (
                                    <td style={{ width: "180px" }}>
                                        <span>
                                          {
                                            entry.data[0].dailyBudget === undefined || entry.data[0].dailyBudget === null ? "-" : formatTableValue(entry.data[0].dailyBudget, "currency")
                                          }
                                        </span>
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
                                  {selectedColumns.includes("cost") && (
                                    <td style={{ width: "180px" }}>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {
                                            entry.data[0].cost === undefined || entry.data[0].cost === null ? "-" : formatTableValue(entry.data[0].cost, "currency")
                                          }
                                        </span>
                                        <span className={`${formatValueRatio(entry.data[0].costComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {
                                            entry.data[0].costComparison === undefined || entry.data[0].costComparison === null ? "-" : formatTableValue(entry.data[0].costComparison, "ratio")
                                          }
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("broadGmv") && (
                                    <td style={{ width: "180px" }}>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {entry.data[0].broadGmv === undefined || entry.data[0].broadGmv === null ? "-" : formatTableValue(entry.data[0].broadGmv, "currency")}</span>
                                        <span className={`${formatValueRatio(entry.data[0].broadGmvComparisson).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].broadGmvComparison === undefined || entry.data[0].broadGmvComparison === null ? "-" : formatTableValue(entry.data[0].broadGmvComparison, "ratio")}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("roas") && (
                                    <td style={{ width: "120px" }}>
                                      <div className="d-flex flex-column">
                                        <span>{
                                          entry.data[0].roas === undefined || entry.data[0].roas === null ? "-" : formatTableValue(entry.data[0].roas, "coma")
                                        }</span>
                                        <span className={`${formatValueRatio(entry.data[0].roasComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].roasComparison === undefined || entry.data[0].roasComparison === null ? "-" : formatTableValue(entry.data[0].roasComparison, "ratio")}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("customRoas") && flagCustomRoasDate === "hari_ini" && (
                                    <td style={{ width: "200px" }}>
                                      <span>{entry.data[0].customRoas}</span>
                                      <input
                                        onChange={(e) => {
                                          const newValue = e.target.value;
                                          setTempCustomRoas(prev => ({
                                            ...prev,
                                            [entry.campaignId]: newValue
                                          }));
                                        }}
                                        value={
                                          tempCustomRoas[entry.campaignId] !== undefined
                                            ? tempCustomRoas[entry.campaignId]
                                            : (entry.data[0].customRoas === undefined ? "" :
                                              entry.data[0].customRoas === null ? "" :
                                                entry.data[0].customRoas)
                                        }
                                        type="number"
                                        className="form-control mb-1"
                                        placeholder="0"
                                        style={{ width: "100px", height: "30px" }}
                                      />
                                      <button
                                        className="btn btn-success"
                                        style={{
                                          width: "100px",
                                          padding: "5px 0px",
                                          fontSize: "12px",
                                        }}
                                        onClick={() => {
                                          const currentValue = tempCustomRoas[entry.campaignId] !== undefined
                                            ? tempCustomRoas[entry.campaignId]
                                            : entry.data[0].customRoas;
                                          handleUpdateCustomRoas(shopId, entry.campaignId, currentValue);
                                        }}
                                      >
                                        Simpan
                                      </button>
                                    </td>
                                  )}
                                  {selectedColumns.includes("impression") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>{
                                          entry.data[0].impression === undefined || entry.data[0].impression === null ? "-" : formatTableValue(entry.data[0].impression, "simple_currency")
                                        }</span>
                                        <span className={`${formatValueRatio(entry.data[0].impressionComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].impressionComparison === undefined || entry.data[0].impressionComparison === null ? "-" : formatTableValue(entry.data[0].impressionComparison, "ratio")}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("click") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>{
                                          entry.data[0].click === undefined || entry.data[0].click === null ? "-" : formatTableValue(entry.data[0].click, "simple_currency")
                                        }</span>
                                        <span className={`${formatValueRatio(entry.data[0].clickComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].clickComparison === undefined || entry.data[0].clickComparison === null ? "-" : formatTableValue(entry.data[0].clickComparison, "ratio")}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("ctr") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>{
                                          entry.data[0].ctr === undefined || entry.data[0].ctr === null ? "-" : formatTableValue(entry.data[0].ctr, "percentage")
                                        }</span>
                                        <span className={`${formatValueRatio(entry.data[0].ctrComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].ctrComparison === undefined || entry.data[0].ctrComparison === null ? "-" : formatTableValue(entry.data[0].ctrComparison, "ratio")}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {/* blm ada */}
                                  {selectedColumns.includes("broadOrder") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {
                                            entry.data[0].broadOrder === undefined || entry.data[0].broadOrder === null ? "-" : formatTableValue(entry.data[0].broadOrder, "none")
                                          }
                                        </span>
                                        <span className={`${formatValueRatio(entry.data[0].broadOrderComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].broadOrderComparison === undefined || entry.data[0].broadOrderComparison === null ? "-" : formatTableValue(entry.data[0].broadOrderComparison, "ratio")}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("cr") &&
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>{
                                          entry.data[0].cr === undefined || entry.data[0].cr === null ? "-" : formatTableValue(entry.data[0].cr, "percentage")
                                        }</span>
                                        <span className={`${formatValueRatio(entry.data[0].crComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].crComparison === undefined || entry.data[0].crComparison === null ? "-" : formatTableValue(entry.data[0].crComparison, "ratio")}
                                        </span>
                                      </div>
                                    </td>
                                  }
                                  {/* blm ada */}
                                  {selectedColumns.includes("broadOrderAmount") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {
                                            entry.data[0].broadOrderAmount === undefined || entry.data[0].broadOrderAmount === null ? "-" : formatTableValue(entry.data[0].broadOrderAmount, "none")
                                          }
                                        </span>
                                        <span className={`${formatValueRatio(entry.data[0].broadOrderAmountComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].broadOrderAmountComparison === undefined || entry.data[0].broadOrderAmountComparison === null ? "-" : formatTableValue(entry.data[0].broadOrderAmountComparison, "ratio")}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("cpc") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {
                                            entry.data[0].cpc === undefined || entry.data[0].cpc === null ? "-" : formatTableValue(entry.data[0].cpc, "currency")
                                          }
                                        </span>
                                        <span className={`${formatValueRatio(entry.data[0].cpcComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].cpcComparison === undefined || entry.data[0].cpcComparison === null ? "-" : formatTableValue(entry.data[0].cpcComparison, "ratio")}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("acos") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {
                                            entry.data[0].acos === undefined || entry.data[0].acos === null ? "-" : formatTableValue(entry.data[0].acos, "percentage")
                                          }
                                        </span>
                                        <span className={`${formatValueRatio(entry.data[0].acosComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].acosComparison === undefined || entry.data[0].acosComparison === null ? "-" : formatTableValue(entry.data[0].acosComparison, "ratio")}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("directOrder") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {
                                            entry.data[0].directOrder === undefined || entry.data[0].directOrder === null ? "-" : formatTableValue(entry.data[0].directOrder, "none")
                                          }
                                        </span>
                                        <span className={`${formatValueRatio(entry.data[0].directOrderComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].directOrderComparison === undefined || entry.data[0].directOrderComparison === null ? "-" : formatTableValue(entry.data[0].directOrderComparison, "ratio")}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("directOrderAmount") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {
                                            entry.data[0].directOrderAmount === undefined || entry.data[0].directOrderAmount === null ? "-" : formatTableValue(entry.data[0].directOrderAmount, "none")
                                          }
                                        </span>
                                        <span className={`${formatValueRatio(entry.data[0].directOrderAmountComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].directOrderAmountComparison === undefined || entry.data[0].directOrderAmountComparison === null ? "-" : formatTableValue(entry.data[0].directOrderAmountComparison, "ratio")}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("directGmv") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {
                                            entry.data[0].directGmv === undefined || entry.data[0].directGmv === null ? "-" : formatTableValue(entry.data[0].directGmv, "currency")
                                          }
                                        </span>
                                        <span className={`${formatValueRatio(entry.data[0].directGmvComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].directGmvComparison === undefined || entry.data[0].directGmvComparison === null ? "-" : formatTableValue(entry.data[0].directGmvComparison, "ratio")}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("directRoi") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {
                                            entry.data[0].directRoi === undefined || entry.data[0].directRoi === null ? "-" : formatTableValue(entry.data[0].directRoi, "none")
                                          }
                                        </span>
                                        <span className={`${formatValueRatio(entry.data[0].directRoiComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].directRoiComparison === undefined || entry.data[0].directRoiComparison === null ? "-" : formatTableValue(entry.data[0].directRoiComparison, "ratio")}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("directCir") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {
                                            entry.data[0].directCir === undefined || entry.data[0].directCir === null ? "-" : formatTableValue(entry.data[0].directCir, "percentage")
                                          }
                                        </span>
                                        <div className={`${formatValueRatio(entry.data[0].directCirComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].directCirComparison === undefined || entry.data[0].directCirComparison === null ? "-" : formatTableValue(entry.data[0].directCirComparison, "ratio")}
                                        </div>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("directCr") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {
                                            entry.data[0].directCr === undefined || entry.data[0].directCr === null ? "-" : formatTableValue(entry.data[0].directCr, "percentage")
                                          }
                                        </span>
                                        <span className={`${formatValueRatio(entry.data[0].directCrComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].directCrComparison === undefined || entry.data[0].directCrComparison === null ? "-" : formatTableValue(entry.data[0].directCrComparison, "ratio")}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("cpdc") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {
                                            entry.data[0].cpdc === undefined || entry.data[0].cpdc === null ? "-" : formatTableValue(entry.data[0].cpdc, "currency")
                                          }
                                        </span>
                                        <span className={`${formatValueRatio(entry.data[0].cpdcComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].cpdcComparison === undefined || entry.data[0].cpdcComparison === null ? "-" : formatTableValue(entry.data[0].cpdcComparison, "ratio")}
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
                    </div>
                  </div>
                  {/* Pagination */}
                  {paginatedData.length > 0 && paginatedData  !== null && renderPagination()}
                </div>
              </div>
            )
          }
        </div>
      </div>
    </>
  );
};

export default AdsTable;