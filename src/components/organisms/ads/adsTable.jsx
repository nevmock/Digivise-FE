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
import formatValueRatio from "../../../utils/convertFormatRatioValue";
import Loading from "../../atoms/Loading/Loading";


const AdsTable = () => {
  // Data
  const [rawData, setRawData] = useState([]);
  const [chartRawData, setChartRawData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const chartRef = useRef(null);
  const userData = JSON.parse(localStorage.getItem("userDataApp"));
  const shopId = userData?.merchants[0]?.merchantShopeeId || "252234165";
  const [tempCustomRoas, setTempCustomRoas] = useState({});
  // Filter
  const [comparatorDate, setComparatorDate] = useState(null);
  const [comparedDate, setComparedDate] = useState(null);
  const [date, setDate] = useState(getAllDaysInLast7Days());
  const [flagCustomRoasDate, setFlagCustomRoasDate] = useState("minggu_ini");
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedMetrics, setSelectedMetrics] = useState(["impression"]);
  const [metricsTotals, setMetricsTotals] = useState({});
  const [statusAdsFilter, setStatusAdsFilter] = useState("all");
  const [selectedClassificationOption, setSelectedClassificationOption] = useState([]);
  // const [selectedOptionPlacement, setSelectedOptionPlacement] = useState(null);
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
  // const [currentPage, setCurrentPage] = useState(1);
  // const [itemsPerPage, setItemsPerPage] = useState(20);
  // const [paginatedData, setPaginatedData] = useState([]);
  // const [totalPages, setTotalPages] = useState(1);
  // Other
  const [showAlert, setShowAlert] = useState(false);
  const [animateCalendar, setAnimateCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [isTableFilterLoading, setIsTableFilterLoading] = useState(false);



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
    },
    checkout: {
      label: "Pesanan",
      color: "#C400BA",
      dataKey: "checkout",
      type: "currency"
    },
    broadOrderAmount: {
      label: "Produk Terjual",
      color: "#35007FFF",
      dataKey: "broadOrderAmount",
      type: "currency"
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

  function calculateMetricTotalsValue(products) {
    const totals = {};
    Object.keys(metrics).forEach(metricKey => {
      totals[metricKey] = 0;
      products.forEach(product => {
        const productData = product.data[0];
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

  const fetchChartData = async (fromDate, toDate) => {
    const toLocalISOString = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    try {
      const fromISO = fromDate instanceof Date
        ? toLocalISOString(fromDate)
        : toLocalISOString(new Date(fromDate));

      const toISO = toDate instanceof Date
        ? toLocalISOString(toDate)
        : toLocalISOString(new Date(toDate));

      const apiUrl = `/api/product-ads/chart?shopId=${shopId}&from=${fromISO}&to=${toISO}&limit=100000000`;
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

  // const fetchTableData = async (fromDate, toDate, page = 1, searchQuery = "", statusFilter = "all") => {
  const fetchTableData = async (fromDate, toDate, page = 1, filters = {}) => {
    // const isInitialLoad = !rawData.length;

    // if (isInitialLoad) {
    //   setIsLoading(true);
    // } else {
    //   setIsTableFilterLoading(true);
    // }

    setIsTableFilterLoading(true);

    const toLocalISOString = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    try {
      const fromISO = fromDate instanceof Date
        ? toLocalISOString(fromDate)
        : toLocalISOString(new Date(fromDate));

      const toISO = toDate instanceof Date
        ? toLocalISOString(toDate)
        : toLocalISOString(new Date(toDate));

      // Convert 1-based page to 0-based for backend
      const backendPage = page - 1;
      let apiUrl = `/api/product-ads/daily?shopId=${shopId}&from=${fromISO}&to=${toISO}&limit=50&page=${backendPage}`;

      // if (searchQuery && searchQuery.trim() !== "") {
      //   apiUrl += `&title=${encodeURIComponent(searchQuery.trim())}`;
      // }

      // if (statusFilter && statusFilter !== "all") {
      //   apiUrl += `&state=${statusFilter}`;
      // }
      

      if (filters.searchQuery && filters.searchQuery.trim() !== "") {
          apiUrl += `&search=${encodeURIComponent(filters.searchQuery.trim())}`;
      }
      
      // Add status filter if not "all"
      if (filters.statusFilter && filters.statusFilter !== "all") {
          apiUrl += `&state=${filters.statusFilter}`;
      }

      // Add type ads filter
      if (filters.typeAds && filters.typeAds.length > 0) {
          const typeValues = filters.typeAds.map(type => type.value);
          if (!typeValues.includes("all")) {
              apiUrl += `&biddingStrategy=${typeValues.join(",")}`;
          }
      }

      // Add classification filter
      if (filters.classification && filters.classification.length > 0) {
          const classificationValues = filters.classification.map(cls => cls.value);
          apiUrl += `&classification=${classificationValues.join(",")}`;
      }

      // Add placement filter
      if (filters.placement && filters.placement.value !== "all") {
          apiUrl += `&productPlacement=${filters.placement.value}`;
      }

      const response = await axiosRequest.get(apiUrl);
      const data = await response.data;
      const content = data.content || [];

      setRawData(content);
      setFilteredData(content);
      setTotalPages(data?.totalPages || 1);
      setTotalElements(data?.totalElements || 0);

      return content;
    } catch (error) {
      toast.error("Gagal mengambil data tabel iklan produk");
      console.error('Gagal mengambil data tabel iklan produk, kesalahan pada server:', error);
      return [];
    } 
    finally {
      // setIsLoading(false);
      setIsTableFilterLoading(false);
    }
  };

  const fetchData = async (fromDate, toDate, page = 0) => {
    setIsLoading(true);
    
    try {
      const currentFilters = {
          searchQuery: debouncedSearchTerm,
          statusFilter: statusAdsFilter,
          typeAds: selectedTypeAds,
          classification: selectedClassificationOption,
          placement: selectedOptionPlacement
      };
      await Promise.all([
        fetchChartData(fromDate, toDate),
        fetchTableData(fromDate, toDate, page, currentFilters)
        // fetchTableData(fromDate, toDate, page, debouncedSearchTerm, statusAdsFilter)
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Gagal mengambil data iklan produk");
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




  // CUSTOM CHART WITH FILTER DATE & CLICK PRODUCT FEATURE
  const handleAdsProductClick = (adsProduct) => {
    if (selectedProduct?.campaignId === adsProduct.campaignId) {
      setSelectedProduct(null);
    } else {
      setSelectedProduct(adsProduct);
    }
  };

  function getAllDaysInLast7Days() {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
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

    if (comparatorDate && comparedDate) {
      const sameDay = comparatorDate.toDateString() === comparedDate.toDateString();
      if (sameDay) {
        const dateStr = getLocalDateString(comparatorDate);
        timeIntervals = getHourlyIntervals(dateStr);
        mode = "hourly";
        isSingleDay = true;
        fromDate = comparatorDate;
        toDate = new Date(comparatorDate);
        toDate.setHours(23, 59, 59, 999);
      } else {
        timeIntervals = getDateRangeIntervals(comparatorDate, comparedDate);
        mode = "daily";
        isSingleDay = false;
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

    let chartDataProducts = chartRawData;
    // if ads product is selected, filter the chart data
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

      // Proses data untuk setiap ads produk
      chartDataProducts?.forEach((adsProduct) => {
        if (!adsProduct.data || adsProduct.data.length === 0) return;

        if (isSingleDay) {
          adsProduct.data.forEach((productData) => {
            if (!productData || !productData.createdAt) return;
            const createdAt = new Date(productData.createdAt);
            const productDateStr = getLocalDateString(createdAt);
            const filterDateStr = getLocalDateString(fromDate);

            // Hanya proses data yang sesuai dengan tanggal filter
            if (productDateStr !== filterDateStr) return;

            // Extract jam saja (tanpa menit & detik) untuk membandingkan dengan timeIntervals
            const hourKey = String(createdAt.getHours()).padStart(2, "0");
            const productYear = createdAt.getFullYear();
            const productMonth = String(createdAt.getMonth() + 1).padStart(2, "0");
            const productDay = String(createdAt.getDate()).padStart(2, "0");

            // Buat key untuk pemetaan (hanya jam, tanpa menit & detik)
            const hourOnlyKey = `${productYear}-${productMonth}-${productDay} ${hourKey}:00`;

            if (timeIntervals.includes(hourOnlyKey)) {
              const value = productData[dataKey];
              if (value !== undefined && value !== null) {
                // Simpan nilai di dataMap dengan key sesuai format timeIntervals
                dataMap[hourOnlyKey] += Number(value);
              }
            }
          });
        } else {
          const dataByDate = {};
          adsProduct.data.forEach(productData => {
            if (!productData || !productData.createdAt) return;

            const createdAt = new Date(productData.createdAt);
            const productYear = createdAt.getFullYear();
            const productMonth = String(createdAt.getMonth() + 1).padStart(2, "0");
            const productDay = String(createdAt.getDate()).padStart(2, "0");
            const dateDayKey = `${productYear}-${productMonth}-${productDay}`;

            const productDateStr = getLocalDateString(createdAt);
            const filterStartStr = Array.isArray(selectedDate) ? selectedDate[0] : getLocalDateString(fromDate);
            const filterEndStr = Array.isArray(selectedDate) ? selectedDate[selectedDate.length - 1] : getLocalDateString(toDate);

            if (productDateStr >= filterStartStr && productDateStr <= filterEndStr) {
              if (!dataByDate[dateDayKey]) {
                dataByDate[dateDayKey] = 0;
              }

              const value = productData[dataKey];
              if (value !== undefined && value !== null) {
                dataByDate[dateDayKey] += Number(value);
              }
            }
          });

          Object.keys(dataByDate).forEach(dateDayKey => {
            if (timeIntervals.includes(dateDayKey)) {
              dataMap[dateDayKey] += dataByDate[dateDayKey];
            }
          });

          // Object.keys(dataByDate).forEach(dateDayKey => {
          //     const productData = dataByDate[dateDayKey];
          //     if (timeIntervals.includes(dateDayKey)) {
          //       const value = productData[dataKey];
          //       if (value !== undefined && value !== null) {
          //         dataMap[dateDayKey] += Number(value);
          //       }
          //     }
          // });
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

  function handleDateSelection(selectedDateOption, type = "minggu_ini") {
    setComparatorDate(null);
    setComparedDate(null);
    setDate(selectedDateOption);

    let fromDate, toDate;
    if (type == "minggu_ini") {
      fromDate = new Date(selectedDateOption[0] + 'T00:00:00');
      toDate = new Date(selectedDateOption[selectedDateOption.length - 1] + 'T23:59:59.999');
      setFlagCustomRoasDate(type);
    } else if (type == "bulan_ini") {
      const today = new Date();
      fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
      toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      toDate.setHours(23, 59, 59, 999);
      setFlagCustomRoasDate(type);
    } else {
      fromDate = new Date(selectedDateOption + 'T00:00:00');
      toDate = new Date(selectedDateOption + 'T23:59:59.999');
      setFlagCustomRoasDate(type);
    }

    setShowCalendar(false);
    setCurrentPage(1);
    fetchData(fromDate, toDate, 1);
  };

  function handleComparisonDatesConfirm() {
    if (comparatorDate && comparedDate) {
      const fromDate = new Date(comparatorDate);
      const toDate = new Date(comparedDate);

      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 999);

      setDate(null);
      setShowCalendar(false);
      setCurrentPage(1);

      fetchData(fromDate, toDate, 1);
    }
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

  useEffect(() => {
    let fromDate, toDate;

    if (comparatorDate && comparedDate) {
      fromDate = comparatorDate;
      toDate = comparedDate;
    } else if (Array.isArray(date)) {
      fromDate = new Date(date[0]);
      toDate = new Date(date[date.length - 1]);
      toDate.setHours(23, 59, 59, 999);
    } else if (date === "Bulan Ini") {
      const today = new Date();
      fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
      toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      toDate.setHours(23, 59, 59, 999);
    } else if (date) {
      fromDate = new Date(date);
      toDate = new Date(date);
      toDate.setHours(23, 59, 59, 999);
    } else {
      const today = new Date();
      fromDate = new Date();
      fromDate.setDate(today.getDate() - 7);
      toDate = today;
    }

    fetchData(fromDate, toDate, 1);
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
  }, [date, selectedProduct, selectedMetrics, chartRawData]);

  useEffect(() => {
    if (chartRef.current && chartData.series && chartData.series.length > 0) {
      const initChart = () => {
        try {
          const existingInstance = echarts.getInstanceByDom(chartRef.current);
          if (existingInstance) {
            existingInstance.dispose();
          }

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

          return () => {
            if (chartInstance && !chartInstance.isDisposed()) {
              chartInstance.dispose();
            }
          };

        } catch (err) {
          console.error("Error when dispose chart", err);
        }
      };

      const timer = setTimeout(initChart, 100);
      return () => clearTimeout(timer);
    }
  }, [chartData, selectedMetrics, comparatorDate, comparedDate]);

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
    { key: "analyze", label: "Analisis" },
    { key: "insight", label: "Insight" },
    { key: "cost", label: "Biaya Iklan" },
    { key: "broadGmv", label: "Penjualan dari iklan" },
    { key: "roas", label: "ROAS" },
    { key: "custom_roas", label: "Custom ROAS" },
    { key: "impression", label: "Iklan dilihat" },
    { key: "click", label: "Jumlah Klik" },
    { key: "ctr", label: "Presentase Klik" },
    { key: "broadOrder", label: "Konversi" },
    { key: "cr", label: "Tingkat Konversi" },
    { key: "broadOrderAmount", label: "Produk Terjual" },
    { key: "cpc", label: "Biaya per Konversi" },
    { key: "acos", label: "ACOS (Presentase Biaya Iklan)" },
    { key: "directOrder", label: "Konversi Langung" },
    { key: "directOrderAmount", label: "Produk Terjual Langsung" },
    { key: "directGmv", label: "Penjualan dari Iklan Langsung" },
    { key: "directRoi", label: "ROAS (Efektifitas Iklan) Langsung" },
    { key: "directCir", label: "ACOS Langsung" },
    { key: "directCr", label: "Tingkat Konversi Langsung" },
    { key: "cpdc", label: "Biaya per Konversi Langsung" },
    { key: "salesClassification", label: "Sales Classification" },
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

      let fromDate, toDate;
      if (comparatorDate && comparedDate) {
        fromDate = comparatorDate;
        toDate = comparedDate;
      } else if (Array.isArray(date)) {
        fromDate = new Date(date[0]);
        toDate = new Date(date[date.length - 1]);
        toDate.setHours(23, 59, 59, 999);
      } else if (date === "Bulan Ini") {
        const today = new Date();
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        toDate.setHours(23, 59, 59, 999);
      } else if (date) {
        fromDate = new Date(date);
        toDate = new Date(date);
        toDate.setHours(23, 59, 59, 999);
      } else {
        const today = new Date();
        fromDate = new Date();
        fromDate.setDate(today.getDate() - 7);
        toDate = today;
      }

      const currentFilters = buildCurrentFilters();

      fetchTableData(fromDate, toDate, pageNumber, currentFilters);
      // fetchTableData(fromDate, toDate, pageNumber, debouncedSearchTerm, statusAdsFilter);
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

    let fromDate, toDate;
    if (comparatorDate && comparedDate) {
      fromDate = comparatorDate;
      toDate = comparedDate;
    } else if (Array.isArray(date)) {
      fromDate = new Date(date[0]);
      toDate = new Date(date[date.length - 1]);
      toDate.setHours(23, 59, 59, 999);
    } else if (date === "Bulan Ini") {
      const today = new Date();
      fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
      toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      toDate.setHours(23, 59, 59, 999);
    } else if (date) {
      fromDate = new Date(date);
      toDate = new Date(date);
      toDate.setHours(23, 59, 59, 999);
    } else {
      const today = new Date();
      fromDate = new Date();
      fromDate.setDate(today.getDate() - 7);
      toDate = today;
    }

    const currentFilters = buildCurrentFilters();
    fetchTableData(fromDate, toDate, 1, currentFilters);
    // fetchTableData(fromDate, toDate, 1, debouncedSearchTerm, statusAdsFilter);
  }, [debouncedSearchTerm, statusAdsFilter, selectedTypeAds, selectedOptionPlacement, selectedClassificationOption]);
  // }, [debouncedSearchTerm, statusAdsFilter]);



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
  // Define placement options
  const placementOptions = [
    { value: "all", label: "Semua" },
    { value: "targeting", label: "Halaman Rekomendasi" },
    { value: "search_product", label: "Halaman Pencarian" },
  ];

  // Handle placement change by selected options
  const handlePlacementChange = (selectedOption) => {
    setSelectedOptionPlacement(selectedOption);
  };

  // Check if "manual" is selected in the type ads filter
  const isTypeManualProductSelected = selectedTypeAds.some(
    (option) => option.value === "manual"
  );



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
        label: "Selesai",
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
      }
    };

    return stateMap[state] || {
      backgroundColor: "#000000FF",
      textColor: "#000000FF",
      label: "Tidak Diketahui",
      isAnimated: false,
    };
  };



  useEffect(() => {
    if (debouncedSearchTerm !== "" || statusAdsFilter !== "all") {
      setCurrentPage(1);

      let fromDate, toDate;
      if (comparatorDate && comparedDate) {
        fromDate = comparatorDate;
        toDate = comparedDate;
      } else if (Array.isArray(date)) {
        fromDate = new Date(date[0]);
        toDate = new Date(date[date.length - 1]);
        toDate.setHours(23, 59, 59, 999);
      } else if (date === "Bulan Ini") {
        const today = new Date();
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        toDate.setHours(23, 59, 59, 999);
      } else if (date) {
        fromDate = new Date(date);
        toDate = new Date(date);
        toDate.setHours(23, 59, 59, 999);
      } else {
        const today = new Date();
        fromDate = new Date();
        fromDate.setDate(today.getDate() - 7);
        toDate = today;
      }

      fetchTableData(fromDate, toDate, 1, debouncedSearchTerm, statusAdsFilter);
    }
  }, [debouncedSearchTerm, statusAdsFilter]);



  // // FILTER DATA FOR TABLE FEATURE
  // useEffect(() => {
  //   let filtered = rawData;

  //   // Filter by search term
  //   if (debouncedSearchTerm !== "") {
  //     filtered = filtered.filter((entry) =>
  //       entry.data[0].title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  //     );
  //   }

  //   // Filter by status
  //   if (statusAdsFilter !== "all") {
  //     filtered = filtered.filter((entry) => entry.data[0].state === statusAdsFilter);
  //   }

  //   // Filter by classification options
  //   if (selectedClassificationOption.length > 0) {
  //     const classificationValues = selectedClassificationOption.map((option) => option.value);
  //     filtered = filtered.filter((entry) => {
  //       const entryClassification = entry.data[0].classification;
  //       return classificationValues.includes(entryClassification);
  //     });
  //   }

  // const selectedAdsTypeValues = selectedTypeAds.map((ad) => ad.value);
  // if (!selectedAdsTypeValues.includes("all")) {
  //   filtered = filtered.filter((entry) => {
  //     const entryBiddingStrategy = entry.data[0].biddingStrategy;
  //     return selectedAdsTypeValues.includes(entryBiddingStrategy);
  //   });
  // }

  // // Filter by placement (if a placement is selected and not "all")
  // if (selectedOptionPlacement && selectedOptionPlacement.value !== "all") {
  //   filtered = filtered.filter((entry) => entry.data[0].productPlacement === selectedOptionPlacement.value);
  // }

  //   setCurrentPage(1);
  //   setFilteredData(filtered);
  // }, [debouncedSearchTerm, rawData, statusAdsFilter, selectedTypeAds, selectedClassificationOption, selectedOptionPlacement]);



  const toggleOpenCalendar = () => {
    if (showCalendar) {
      setAnimateCalendar(false);
      setTimeout(() => setShowCalendar(false), 100);
    } else {
      setShowCalendar(true);
      setTimeout(() => setAnimateCalendar(true), 100);
    }
  };



  // CUSTOM ROAS FEATURE
  const handleUpdateCustomRoas = async (shopId, campaignId, customRoasValue) => {
    try {
      // setIsContentLoading(true);
      await updateCustomRoasProduct(shopId, campaignId, customRoasValue);
      toast.success("Berhasil mengupdate ROAS");
      window.location.reload();
    } catch (error) {
      console.error("Gagal mengupdate ROAS, kesalahan pada server:", error);
      toast.error("Gagal menyimpan perubahan ROAS");
    } 
    // finally {
    //   // setIsContentLoading(false);
    // }
  };



  // AVERAGE VALUE CALCULATION FEATURE
  const isMultiDayFilter = () => {
    // Jika menggunakan comparator date range
    if (comparatorDate && comparedDate) {
      return comparatorDate.toDateString() !== comparedDate.toDateString();
    }

    // Jika menggunakan preset date options
    if (Array.isArray(date)) {
      // "1 Minggu terakhir" - lebih dari 1 hari
      return date.length > 1;
    }

    if (date === "Bulan Ini") {
      // "Bulan ini" - lebih dari 1 hari
      return true;
    }

    // "Hari ini", "Kemarin", atau single date - 1 hari saja
    return false;
  };

  const calculateTableValue = (entry, metricKey) => {
    if (!entry.data || entry.data.length === 0) {
      return null;
    }

    // Metrics yang harus ditotal (tidak di-average)
    const totalMetrics = ['dailyBudget', 'cost'];

    // Jika filter single day, ambil data terbaru saja (seperti sebelumnya)
    if (!isMultiDayFilter()) {
      // Ambil data terbaru berdasarkan createdAt
      const sortedData = [...entry.data].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      return sortedData[0][metricKey];
    }

    // Jika filter multi-day, hitung average atau total
    let total = 0;
    let validDataCount = 0;

    entry.data.forEach(dataItem => {
      const value = dataItem[metricKey];
      if (value !== undefined && value !== null && !isNaN(value)) {
        total += Number(value);
        validDataCount++;
      }
    });

    if (validDataCount === 0) {
      return null;
    }

    // Jika metric termasuk yang harus ditotal
    if (totalMetrics.includes(metricKey)) {
      return total;
    }

    return total / validDataCount;
  };

  const formatTableValue = (entry, metricKey, formatType = 'default') => {
    const value = calculateTableValue(entry, metricKey);

    if (value === null || value === undefined) {
      return "-";
    }

    // Format berdasarkan tipe metric
    switch (metricKey) {
      case 'dailyBudget':
      case 'cost':
        // Selalu format sebagai currency
        return `Rp ${convertBudgetToIDR(value, formatType)}`;

      case 'roas':
      case 'ctr':
      case 'acos':
        // Metrics yang biasanya dalam bentuk ratio/percentage
        if (isMultiDayFilter()) {
          // Jika average, tampilkan dengan 2 desimal
          return Number(value).toFixed(2);
        } else {
          // Jika single day, tampilkan sesuai format asli
          return Number(value).toFixed(2);
        }

      case 'impression':
        return formatRupiahFilter(value);
      case 'click':
        // Metrics yang berupa angka bulat
        if (isMultiDayFilter()) {
          // Jika average, tampilkan dengan 1 desimal
          return Number(value).toFixed(1);
        } else {
          // Jika single day, tampilkan sebagai integer
          return Math.round(value).toLocaleString('id-ID');
        }

      default:
        if (isMultiDayFilter()) {
          return Number(value).toFixed(2);
        } else {
          return value.toString();
        }
    }
  };



  const formatStyleSalesClassification = (classification) => {
    if (classification === "Best Seller") {
      return { backgroundColor: "#009127FF", color: "#FFFFFF", label: "Best Seller" };
    } else if (classification === "Middle Moving") {
      return { backgroundColor: "#AF8000FF", color: "#FFFFFF", label: "Middle Moving" };
    } else if (classification === "Slow Moving") {
      return { backgroundColor: "#960000FF", color: "#FFFFFF", label: "Slow Moving" };
    } else {
      return { backgroundColor: "#E3E3E3", color: "#000000", label: "Unknown" };
    }
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
                <strong>{totalElements} total produk</strong>
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
                      <div
                        className="custom-content-calendar d-flex flex-column py-2 px-1"
                        style={{ width: "130px", listStyleType: "none" }}
                      >
                        <p style={{ cursor: "pointer" }} onClick={() => handleDateSelection(new Date().toISOString().split("T")[0], "hari_ini")}>Hari ini</p>
                        <p style={{ cursor: "pointer" }}
                          onClick={() => {
                            const yesterday = new Date();
                            yesterday.setDate(yesterday.getDate() - 1);
                            handleDateSelection(yesterday.toISOString().split("T")[0], "kemarin");
                          }}
                        >
                          Kemarin
                        </p>
                        <p style={{ cursor: "pointer" }} onClick={() => handleDateSelection(getAllDaysInLast7Days(), "minggu_ini")}>1 Minggu terakhir</p>
                        <p style={{ cursor: "pointer" }} onClick={() => handleDateSelection("Bulan Ini", "bulan_ini")}>Bulan ini</p>
                      </div>
                      <div id="custom-calendar-behavior-barrier" style={{ width: "1px", height: "auto", backgroundColor: "#E3E3E3FF", margin: "10px 4px" }}></div>
                      {/* Kalender pembanding */}
                      <div>
                        <p className="pt-2" style={{ textAlign: "center" }}>Tanggal Pembanding</p>
                        <Calendar onChange={(date) => setComparatorDate(date)} value={comparatorDate} maxDate={comparedDate || new Date(2100, 0, 1)} />
                      </div>
                      {/* Kalender dibanding */}
                      <div>
                        <p className="pt-2" style={{ textAlign: "center" }}>Tanggal Dibanding</p>
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
              {/* {
                isContentLoading ? (
                  <div className="d-flex justify-content-center align-items-start vh-100">
                    <Loading size={40} />
                  </div>
                ) : ( */}
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
                {/* Alert */}
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
                <div ref={chartRef} style={{ width: "100%", height: "300px" }}></div>
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
                        style={{ cursor: "pointer", fontSize: "12px", padding: "1px 12px", }}
                      >
                        Berakhir
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
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          zIndex: 10,
                          minHeight: '200px'
                        }}
                      >
                        <Loading size={40} />
                      </div>
                    )}
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
                            {paginatedData.length !== 0 && paginatedData !== null && <th scope="col">No</th>}
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
                                      <div className="d-flex flex-column">
                                        <span>
                                          {formatTableValue(entry, 'dailyBudget', 'default')}
                                          {/* {
                                            entry.data[0].dailyBudget === undefined ? "-" : entry.data[0].dailyBudget === null ? "0" : `Rp ${convertBudgetToIDR(entry.data[0].dailyBudget, "default")}`
                                          } */}
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
                                  {selectedColumns.includes("insight") && (
                                    <td style={{ width: "260px" }}>
                                      <span>
                                        {entry.data[0].insight === undefined ? "-" : entry.data[0].insight === null ? "Tidak ada keterangan" : entry.data[0].insight}
                                      </span>
                                    </td>
                                  )}
                                  {selectedColumns.includes("cost") && (
                                    <td style={{ width: "180px" }}>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {
                                            entry.data[0].cost === undefined ? "-" : entry.data[0].cost === null ? "0" : `Rp ${convertBudgetToIDR(entry.data[0].cost, "cost")}`
                                          }
                                        </span>
                                        <span className={`${formatValueRatio(entry.data[0].costRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {
                                            entry.data[0].costRatio === undefined ? "-" : entry.data[0].costRatio === null ? "0" : formatValueRatio(entry.data[0].costRatio).rounded
                                          }
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("broadGmv") && (
                                    <td style={{ width: "180px" }}>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {entry.data[0].broadGmv === undefined ? "-" : entry.data[0].broadGmv === null ? "0" : `Rp ${convertBudgetToIDR(entry.data[0].broadGmv, "cost")}`}</span>
                                        <span className={`${formatValueRatio(entry.data[0].broadGmvRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].broadGmvRatio === undefined ? "-" : entry.data[0].broadGmvRatio === null ? "0" : `${formatValueRatio(entry.data[0].broadGmvRatio).rounded}%`}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("roas") && (
                                    <td style={{ width: "120px" }}>
                                      <div className="d-flex flex-column">
                                        <span>{
                                          entry.data[0].customRoas === undefined ? "-" : entry.data[0].customRoas === null ? "0" : `${(entry.data[0].customRoas).toFixed(2)}%`
                                        }</span>
                                        <span className={`${formatValueRatio(entry.data[0].roasRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].roasRatio === undefined ? "-" : entry.data[0].roasRatio === null ? "0" : `${formatValueRatio(entry.data[0].roasRatio).rounded}%`}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("custom_roas") && flagCustomRoasDate !== "minggu_ini" && flagCustomRoasDate !== "bulan_ini" && (
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
                                        {/* {
                                          isContentLoading ? (
                                            "Updating..."
                                          ) : (
                                            "Simpan"
                                          )
                                        } */}
                                      </button>
                                    </td>
                                  )}
                                  {selectedColumns.includes("impression") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>{
                                          entry.data[0].impression === undefined ? "-" : entry.data[0].impression === null ? "0" : formatRupiahFilter(entry.data[0].impression)
                                        }</span>
                                        <span className={`${formatValueRatio(entry.data[0].impressionRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].impressionRatio === undefined ? "-" : entry.data[0].impressionRatio === null ? "0" : `${formatValueRatio(entry.data[0].impressionRatio).rounded}%`}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("click") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>{
                                          entry.data[0].click === undefined ? "-" : entry.data[0].click === null ? "0" : formatRupiahFilter(entry.data[0].click)
                                        }</span>
                                        <span className={`${formatValueRatio(entry.data[0].clickRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].clickRatio === undefined ? "-" : entry.data[0].clickRatio === null ? "0" : `${formatValueRatio(entry.data[0].clickRatio).rounded}%`}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("ctr") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>{
                                          entry.data[0].ctr === undefined ? "-" : entry.data[0].ctr === null ? "0" : `${entry.data[0].ctr}%`
                                        }</span>
                                        <span className={`${formatValueRatio(entry.data[0].ctrRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].ctrRatio === undefined ? "-" : entry.data[0].ctrRatio === null ? "0" : `${formatValueRatio(entry.data[0].ctrRatio).rounded}%`}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("broadOrder") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {
                                            entry.data[0].broadOrder === undefined ? "-" : entry.data[0].broadOrder === null ? "0" : formatRupiahFilter(entry.data[0].broadOrder)
                                          }
                                        </span>
                                        <span className={`${formatValueRatio(entry.data[0].broadOrderRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].broadOrderRatio === undefined ? "-" : entry.data[0].broadOrderRatio === null ? "0" : `${formatValueRatio(entry.data[0].broadOrderRatio).rounded}%`}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("cr") &&
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>{
                                          entry.data[0].cr === undefined ? "-" : entry.data[0].cr === null ? "0" : `${Number(entry.data[0].cr).toFixed(2)}%`
                                        }</span>
                                        <span className={`${formatValueRatio(entry.data[0].crRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].crRatio === undefined ? "-" : entry.data[0].crRatio === null ? "0" : `${formatValueRatio(entry.data[0].crRatio).rounded}%`}
                                        </span>
                                      </div>
                                    </td>
                                  }
                                  {selectedColumns.includes("broadOrderAmount") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {
                                            entry.data[0].broadOrderAmount === undefined ? "-" : entry.data[0].broadOrderAmount === null ? "0" : convertBudgetToIDR(entry.data[0].broadOrderAmount)
                                          }
                                        </span>
                                        <span className={`${formatValueRatio(entry.data[0].broadOrderAmountRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].broadOrderAmountRatio === undefined ? "-" : entry.data[0].broadOrderAmountRatio === null ? "0" : `${formatValueRatio(entry.data[0].broadOrderAmountRatio).rounded}%`}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("cpc") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {
                                            entry.data[0].cpc === undefined ? "-" : entry.data[0].cpc === null ? "0" : `Rp ${formatRupiahFilter(entry.data[0].cpc, "cpc")}`
                                          }
                                        </span>
                                        <span className={`${formatValueRatio(entry.data[0].cpcRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].cpcRatio === undefined ? "-" : entry.data[0].cpcRatio === null ? "0" : `${formatValueRatio(entry.data[0].cpcRatio).rounded}%`}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("acos") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {
                                            entry.data[0].acos === undefined ? "-" : entry.data[0].acos === null ? "0" : `${Number(entry.data[0].acos).toFixed(2)}%`
                                          }
                                        </span>
                                        <span className={`${formatValueRatio(entry.data[0].acosRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].acosRatio === undefined ? "-" : entry.data[0].acosRatio === null ? "0" : `${formatValueRatio(entry.data[0].acosRatio).rounded}%`}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("directOrder") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {
                                            entry.data[0].directOrder === undefined ? "-" : entry.data[0].directOrder === null ? "0" : formatRupiahFilter(entry.data[0].directOrder, "directOrder")
                                          }
                                        </span>
                                        <span className={`${formatValueRatio(entry.data[0].directOrderRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].directOrderRatio === undefined ? "-" : entry.data[0].directOrderRatio === null ? "0" : `${formatValueRatio(entry.data[0].directOrderRatio).rounded}%`}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("directOrderAmount") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {
                                            entry.data[0].directOrderAmount === undefined ? "-" : entry.data[0].directOrderAmount === null ? "0" : formatRupiahFilter(entry.data[0].directOrderAmount, "directOrderAmount")
                                          }
                                        </span>
                                        <span className={`${formatValueRatio(entry.data[0].directOrderAmountRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].directOrderAmountRatio === undefined ? "-" : entry.data[0].directOrderAmountRatio === null ? "0" : `${formatValueRatio(entry.data[0].directOrderAmountRatio).rounded}%`}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("directGmv") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {
                                            entry.data[0].directGmv === undefined ? "-" : entry.data[0].directGmv === null ? "0" : `Rp ${convertBudgetToIDR(entry.data[0].directGmv, "directGmv")}`
                                          }
                                        </span>
                                        <span className={`${formatValueRatio(entry.data[0].directGmvRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].directGmvRatio === undefined ? "-" : entry.data[0].directGmvRatio === null ? "0" : `${formatValueRatio(entry.data[0].directGmvRatio).rounded}%`}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("directRoi") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {
                                            entry.data[0].directRoi === undefined ? "-" : entry.data[0].directRoi === null ? "0" : `${Number(entry.data[0].directRoi).toFixed(2)}%`
                                          }
                                        </span>
                                        <span className={`${formatValueRatio(entry.data[0].directRoiRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].directRoiRatio === undefined ? "-" : entry.data[0].directRoiRatio === null ? "0" : `${formatValueRatio(entry.data[0].directRoiRatio).rounded}%`}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("directCir") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {
                                            entry.data[0].directCir === undefined ? "-" : entry.data[0].directCir === null ? "0" : `${Number(entry.data[0].directCir).toFixed(2)}%`
                                          }
                                        </span>
                                        <div className={`${formatValueRatio(entry.data[0].directCirRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].directCirRatio === undefined ? "-" : entry.data[0].directCirRatio === null ? "0" : `${formatValueRatio(entry.data[0].directCirRatio).rounded}%`}
                                        </div>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("directCr") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {
                                            entry.data[0].directCr === undefined ? "-" : entry.data[0].directCr === null ? "0" : `${Number(entry.data[0].directCr).toFixed(2)}%`
                                          }
                                        </span>
                                        <span className={`${formatValueRatio(entry.data[0].directCrRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].directCrRatio === undefined ? "-" : entry.data[0].directCrRatio === null ? "0" : `${formatValueRatio(entry.data[0].directCrRatio).rounded}%`}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("cpdc") && (
                                    <td style={{ width: "200px" }}>
                                      <div className="d-flex flex-column">
                                        <span>
                                          {
                                            entry.data[0].cpdc === undefined ? "-" : entry.data[0].cpdc === null ? "0" : `Rp ${convertBudgetToIDR(entry.data[0].cpdc, "cpdc")}`
                                          }
                                        </span>
                                        <span className={`${formatValueRatio(entry.data[0].cpdcRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                          {entry.data[0].cpdcRatio === undefined ? "-" : entry.data[0].cpdcRatio === null ? "0" : `${formatValueRatio(entry.data[0].cpdcRatio).rounded}%`}
                                        </span>
                                      </div>
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
                                            entry.data[0].salesClassification === undefined ? "-" : entry.data[0].salesClassification === null ? "Not Found" : formatStyleSalesClassification(entry.data[0].salesClassification).label
                                          }
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
                        {/* <thead className="table-dark">
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
                            {filteredData.length !== 0 && filteredData !== null ? (
                              filteredData?.map((entry, index) => (
                                <>
                                  <tr key={entry.campaignId}>
                                    {filteredData.length > 0 && filteredData !== null && (
                                      <td>{index + 1}</td>
                                    )}
                                    {selectedColumns.includes("info_iklan") && (
                                      <td
                                        className="d-flex gap-2"
                                        style={{
                                          width: "320px",
                                          maxWidth: "320px",
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
                                        <div className="d-flex flex-column">
                                          <span>
                                            {formatTableValue(entry, 'dailyBudget', 'default')}
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
                                    {selectedColumns.includes("insight") && (
                                      <td style={{ width: "260px" }}>
                                        <span>
                                          {entry.data[0].insight === undefined ? "-" : entry.data[0].insight === null ? "Tidak ada keterangan" : entry.data[0].insight}
                                        </span>
                                      </td>
                                    )}
                                    {selectedColumns.includes("cost") && (
                                      <td style={{ width: "180px" }}>
                                        <div className="d-flex flex-column">
                                          <span>
                                            {
                                              entry.data[0].cost === undefined ? "-" : entry.data[0].cost === null ? "0" : `Rp ${convertBudgetToIDR(entry.data[0].cost, "cost")}`
                                            }
                                          </span>
                                          <span className={`${formatValueRatio(entry.data[0].costRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                            {
                                              entry.data[0].costRatio === undefined ? "-" : entry.data[0].costRatio === null ? "0" : formatValueRatio(entry.data[0].costRatio).rounded
                                            }
                                          </span>
                                        </div>
                                      </td>
                                    )}
                                    {selectedColumns.includes("broadGmv") && (
                                      <td style={{ width: "180px" }}>
                                        <div className="d-flex flex-column">
                                          <span>
                                            {entry.data[0].broadGmv === undefined ? "-" : entry.data[0].broadGmv === null ? "0" : `Rp ${convertBudgetToIDR(entry.data[0].broadGmv, "cost")}`}</span>
                                          <span className={`${formatValueRatio(entry.data[0].broadGmvRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                            {entry.data[0].broadGmvRatio === undefined ? "-" : entry.data[0].broadGmvRatio === null ? "0" : `${formatValueRatio(entry.data[0].broadGmvRatio).rounded}%`}
                                          </span>
                                        </div>
                                      </td>
                                    )}
                                    {selectedColumns.includes("roas") && (
                                      <td style={{ width: "120px" }}>
                                        <div className="d-flex flex-column">
                                          <span>{
                                            entry.data[0].customRoas === undefined ? "-" : entry.data[0].customRoas === null ? "0" : `${(entry.data[0].customRoas).toFixed(2)}%`
                                          }</span>
                                          <span className={`${formatValueRatio(entry.data[0].roasRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                            {entry.data[0].roasRatio === undefined ? "-" : entry.data[0].roasRatio === null ? "0" : `${formatValueRatio(entry.data[0].roasRatio).rounded}%`}
                                          </span>
                                        </div>
                                      </td>
                                    )}
                                    {selectedColumns.includes("custom_roas") && flagCustomRoasDate !== "minggu_ini" && flagCustomRoasDate !== "bulan_ini" && (
                                      <td style={{ width: "200px" }}>
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
                                          {
                                            isContentLoading ? (
                                              "Updating..."
                                            ) : (
                                              "Simpan"
                                            )
                                          }
                                        </button>
                                      </td>
                                    )}
                                    {selectedColumns.includes("impression") && (
                                      <td style={{ width: "200px" }}>
                                        <div className="d-flex flex-column">
                                          <span>{
                                            formatTableValue(entry, 'impression')
                                            // entry.data[0].impression === undefined ? "-" : entry.data[0].impression === null ? "0" : formatRupiahFilter(entry.data[0].impression)
                                          }</span>
                                          <span className={`${formatValueRatio(entry.data[0].impressionRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                            {entry.data[0].impressionRatio === undefined ? "-" : entry.data[0].impressionRatio === null ? "0" : `${formatValueRatio(entry.data[0].impressionRatio).rounded}%`}
                                          </span>
                                        </div>
                                      </td>
                                    )}
                                    {selectedColumns.includes("click") && (
                                      <td style={{ width: "200px" }}>
                                        <div className="d-flex flex-column">
                                          <span>{
                                            entry.data[0].click === undefined ? "-" : entry.data[0].click === null ? "0" : formatRupiahFilter(entry.data[0].click)
                                          }</span>
                                          <span className={`${formatValueRatio(entry.data[0].clickRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                            {entry.data[0].clickRatio === undefined ? "-" : entry.data[0].clickRatio === null ? "0" : `${formatValueRatio(entry.data[0].clickRatio).rounded}%`}
                                          </span>
                                        </div>
                                      </td>
                                    )}
                                    {selectedColumns.includes("ctr") && (
                                      <td style={{ width: "200px" }}>
                                        <div className="d-flex flex-column">
                                          <span>{
                                            entry.data[0].ctr === undefined ? "-" : entry.data[0].ctr === null ? "0" : `${entry.data[0].ctr}%`
                                          }</span>
                                          <span className={`${formatValueRatio(entry.data[0].ctrRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                            {entry.data[0].ctrRatio === undefined ? "-" : entry.data[0].ctrRatio === null ? "0" : `${formatValueRatio(entry.data[0].ctrRatio).rounded}%`}
                                          </span>
                                        </div>
                                      </td>
                                    )}
                                    {selectedColumns.includes("broadOrder") && (
                                      <td style={{ width: "200px" }}>
                                        <div className="d-flex flex-column">
                                          <span>
                                            {
                                              entry.data[0].broadOrder === undefined ? "-" : entry.data[0].broadOrder === null ? "0" : formatRupiahFilter(entry.data[0].broadOrder)
                                            }
                                          </span>
                                          <span className={`${formatValueRatio(entry.data[0].broadOrderRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                            {entry.data[0].broadOrderRatio === undefined ? "-" : entry.data[0].broadOrderRatio === null ? "0" : `${formatValueRatio(entry.data[0].broadOrderRatio).rounded}%`}
                                          </span>
                                        </div>
                                      </td>
                                    )}
                                    {selectedColumns.includes("cr") &&
                                      <td style={{ width: "200px" }}>
                                        <div className="d-flex flex-column">
                                          <span>{
                                            entry.data[0].cr === undefined ? "-" : entry.data[0].cr === null ? "0" : `${Number(entry.data[0].cr).toFixed(2)}%`
                                          }</span>
                                          <span className={`${formatValueRatio(entry.data[0].crRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                            {entry.data[0].crRatio === undefined ? "-" : entry.data[0].crRatio === null ? "0" : `${formatValueRatio(entry.data[0].crRatio).rounded}%`}
                                          </span>
                                        </div>
                                      </td>
                                    }
                                    {selectedColumns.includes("broadOrderAmount") && (
                                      <td style={{ width: "200px" }}>
                                        <div className="d-flex flex-column">
                                          <span>
                                            {
                                              entry.data[0].broadOrderAmount === undefined ? "-" : entry.data[0].broadOrderAmount === null ? "0" : convertBudgetToIDR(entry.data[0].broadOrderAmount)
                                            }
                                          </span>
                                          <span className={`${formatValueRatio(entry.data[0].broadOrderAmountRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                            {entry.data[0].broadOrderAmountRatio === undefined ? "-" : entry.data[0].broadOrderAmountRatio === null ? "0" : `${formatValueRatio(entry.data[0].broadOrderAmountRatio).rounded}%`}
                                          </span>
                                        </div>
                                      </td>
                                    )}
                                    {selectedColumns.includes("cpc") && (
                                      <td style={{ width: "200px" }}>
                                        <div className="d-flex flex-column">
                                          <span>
                                            {
                                              entry.data[0].cpc === undefined ? "-" : entry.data[0].cpc === null ? "0" : `Rp ${formatRupiahFilter(entry.data[0].cpc, "cpc")}`
                                            }
                                          </span>
                                          <span className={`${formatValueRatio(entry.data[0].cpcRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                            {entry.data[0].cpcRatio === undefined ? "-" : entry.data[0].cpcRatio === null ? "0" : `${formatValueRatio(entry.data[0].cpcRatio).rounded}%`}
                                          </span>
                                        </div>
                                      </td>
                                    )}
                                    {selectedColumns.includes("acos") && (
                                      <td style={{ width: "200px" }}>
                                        <div className="d-flex flex-column">
                                          <span>
                                            {
                                              entry.data[0].acos === undefined ? "-" : entry.data[0].acos === null ? "0" : `${Number(entry.data[0].acos).toFixed(2)}%`
                                            }
                                          </span>
                                          <span className={`${formatValueRatio(entry.data[0].acosRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                            {entry.data[0].acosRatio === undefined ? "-" : entry.data[0].acosRatio === null ? "0" : `${formatValueRatio(entry.data[0].acosRatio).rounded}%`}
                                          </span>
                                        </div>
                                      </td>
                                    )}
                                    {selectedColumns.includes("directOrder") && (
                                      <td style={{ width: "200px" }}>
                                        <div className="d-flex flex-column">
                                          <span>
                                            {
                                              entry.data[0].directOrder === undefined ? "-" : entry.data[0].directOrder === null ? "0" : formatRupiahFilter(entry.data[0].directOrder, "directOrder")
                                            }
                                          </span>
                                          <span className={`${formatValueRatio(entry.data[0].directOrderRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                            {entry.data[0].directOrderRatio === undefined ? "-" : entry.data[0].directOrderRatio === null ? "0" : `${formatValueRatio(entry.data[0].directOrderRatio).rounded}%`}
                                          </span>
                                        </div>
                                      </td>
                                    )}
                                    {selectedColumns.includes("directOrderAmount") && (
                                      <td style={{ width: "200px" }}>
                                        <div className="d-flex flex-column">
                                          <span>
                                            {
                                              entry.data[0].directOrderAmount === undefined ? "-" : entry.data[0].directOrderAmount === null ? "0" : formatRupiahFilter(entry.data[0].directOrderAmount, "directOrderAmount")
                                            }
                                          </span>
                                          <span className={`${formatValueRatio(entry.data[0].directOrderAmountRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                            {entry.data[0].directOrderAmountRatio === undefined ? "-" : entry.data[0].directOrderAmountRatio === null ? "0" : `${formatValueRatio(entry.data[0].directOrderAmountRatio).rounded}%`}
                                          </span>
                                        </div>
                                      </td>
                                    )}
                                    {selectedColumns.includes("directGmv") && (
                                      <td style={{ width: "200px" }}>
                                        <div className="d-flex flex-column">
                                          <span>
                                            {
                                              entry.data[0].directGmv === undefined ? "-" : entry.data[0].directGmv === null ? "0" : `Rp ${convertBudgetToIDR(entry.data[0].directGmv, "directGmv")}`
                                            }
                                          </span>
                                          <span className={`${formatValueRatio(entry.data[0].directGmvRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                            {entry.data[0].directGmvRatio === undefined ? "-" : entry.data[0].directGmvRatio === null ? "0" : `${formatValueRatio(entry.data[0].directGmvRatio).rounded}%`}
                                          </span>
                                        </div>
                                      </td>
                                    )}
                                    {selectedColumns.includes("directRoi") && (
                                      <td style={{ width: "200px" }}>
                                        <div className="d-flex flex-column">
                                          <span>
                                            {
                                              entry.data[0].directRoi === undefined ? "-" : entry.data[0].directRoi === null ? "0" : `${Number(entry.data[0].directRoi).toFixed(2)}%`
                                            }
                                          </span>
                                          <span className={`${formatValueRatio(entry.data[0].directRoiRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                            {entry.data[0].directRoiRatio === undefined ? "-" : entry.data[0].directRoiRatio === null ? "0" : `${formatValueRatio(entry.data[0].directRoiRatio).rounded}%`}
                                          </span>
                                        </div>
                                      </td>
                                    )}
                                    {selectedColumns.includes("directCir") && (
                                      <td style={{ width: "200px" }}>
                                        <div className="d-flex flex-column">
                                          <span>
                                            {
                                              entry.data[0].directCir === undefined ? "-" : entry.data[0].directCir === null ? "0" : `${Number(entry.data[0].directCir).toFixed(2)}%`
                                            }
                                          </span>
                                          <div className={`${formatValueRatio(entry.data[0].directCirRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                            {entry.data[0].directCirRatio === undefined ? "-" : entry.data[0].directCirRatio === null ? "0" : `${formatValueRatio(entry.data[0].directCirRatio).rounded}%`}
                                          </div>
                                        </div>
                                      </td>
                                    )}
                                    {selectedColumns.includes("directCr") && (
                                      <td style={{ width: "200px" }}>
                                        <div className="d-flex flex-column">
                                          <span>
                                            {
                                              entry.data[0].directCr === undefined ? "-" : entry.data[0].directCr === null ? "0" : `${Number(entry.data[0].directCr).toFixed(2)}%`
                                            }
                                          </span>
                                          <span className={`${formatValueRatio(entry.data[0].directCrRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                            {entry.data[0].directCrRatio === undefined ? "-" : entry.data[0].directCrRatio === null ? "0" : `${formatValueRatio(entry.data[0].directCrRatio).rounded}%`}
                                          </span>
                                        </div>
                                      </td>
                                    )}
                                    {selectedColumns.includes("cpdc") && (
                                      <td style={{ width: "200px" }}>
                                        <div className="d-flex flex-column">
                                          <span>
                                            {
                                              entry.data[0].cpdc === undefined ? "-" : entry.data[0].cpdc === null ? "0" : `Rp ${convertBudgetToIDR(entry.data[0].cpdc, "cpdc")}`
                                            }
                                          </span>
                                          <span className={`${formatValueRatio(entry.data[0].cpdcRatio).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                            {entry.data[0].cpdcRatio === undefined ? "-" : entry.data[0].cpdcRatio === null ? "0" : `${formatValueRatio(entry.data[0].cpdcRatio).rounded}%`}
                                          </span>
                                        </div>
                                      </td>
                                    )}
                                    {selectedColumns.includes("classification") && (
                                      (index === 0 ? (
                                        <td style={{ width: "200px" }}>
                                          <div className="d-flex gap-1 align-items-center">
                                            <div
                                              className="marker"
                                              style={{
                                                backgroundColor: "#007BFF",
                                              }}
                                            ></div>
                                            <span
                                              style={{
                                                fontSize: "14px",
                                              }}
                                            >
                                              Middle Moving
                                            </span>
                                          </div>
                                        </td>
                                      ) : (
                                        <td style={{ width: "200px" }}>
                                          <span> </span>
                                        </td>
                                      ))
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
                          </tbody> */}
                      </table>
                    </div>
                  </div>
                  {/* Pagination */}
                  {paginatedData.length > 0 && paginatedData  !== null && renderPagination()}
                </div>
              </div>
              {/* )
              } */}
            </div>
          </div>
        )
      }
    </>
  );
};

export default AdsTable;