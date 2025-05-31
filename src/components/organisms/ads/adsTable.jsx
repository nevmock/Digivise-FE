import { useState, useEffect, useRef } from "react";
import Select from "react-select";
import Calendar from "react-calendar";
import * as echarts from "echarts";
import { Link } from "react-router-dom";

import axiosRequest from "../../../utils/request";
import useDebounce from "../../../hooks/useDebounce";
import convertBudgetToIDR from "../../../utils/convertBudgetIDR";
import converTypeAds from "../../../utils/convertTypeAds";
import formatMetricValue from "../../../utils/convertValueMetricFilter";
import Loading from "../../atoms/Loading/Loading";


const AdsTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [filteredData, setFilteredData] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [statusProductFilter, setStatusProductFilter] = useState("all");
  const [selectedClassificationOption, setSelectedClassificationOption] = useState([]);
  const [selectedOptionPlacement, setSelectedOptionPlacement] = useState(null);
  const [selectedTypeAds, setSelectedTypeAds] = useState([{ value: "all", label: "Semua Tipe" }]);
  const [showTableColumn, setShowTableColumn] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [comparatorDate, setComparatorDate] = useState(null);
  const [comaparedDate, setComaparedDate] = useState(null);
  const [date, setDate] = useState(getAllDaysInLast7Days());
  const [showCalendar, setShowCalendar] = useState(false);
  const chartRef = useRef(null);
  const [showAlert, setShowAlert] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedMetrics, setSelectedMetrics] = useState(["daily_budget"]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [paginatedData, setPaginatedData] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [metricsTotals, setMetricsTotals] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);


  // Define metrics with their display names and colors
  const metrics = {
    daily_budget: {
      label: "Biaya",
      color: "#00B69A",
      dataKey: "daily_budget"
    },
    impression: {
      label: "Iklan Dilihat",
      color: "#D50000",
      dataKey: "impression"
    },
    click: {
      label: "Click",
      color: "#00B800",
      dataKey: "click"
    },
    ctr: {
      label: "CTR",
      color: "#DFC100",
      dataKey: "ctr"
    },
    acos: {
      label: "ACOS",
      color: "#C400BA",
      dataKey: "acos"
    },
    broad_order: {
      label: "CPC",
      color: "#AD5F00FF",
      dataKey: "broad_order"
    }
  };

  const userData = JSON.parse(localStorage.getItem("userDataApp"));
  const shopId = userData?.merchants[0]?.merchantShopeeId;

  const fetchData = async (fromDate, toDate) => {
    setIsLoading(true);
    setError(null);

    try {
      const fromISO = fromDate instanceof Date
        ? fromDate.toISOString()
        : new Date(fromDate).toISOString();

      const toISO = toDate instanceof Date
        ? toDate.toISOString()
        : new Date(toDate).toISOString();

      // const response = await axiosRequest.get(`/api/product-ads?shopId=252234165&from=2025-05-05T17:25:01.869&to=2025-05-10T21:00:00`);
      // console.log("Selected Type Ads:", selectedTypeAds[0]?.value);
      // useEffect(() => {
      // }, [selectedTypeAds]);

      const response = await axiosRequest.get(`/api/product-ads/daily?shopId=252234165&from=2025-05-05T17:25:01.869&to=2025-05-10T21:00:00&biddingStrategy=manual`);
      if (!response) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.data;
      setRawData(data.content);
      setFilteredData(data.content);
      setTotalPages(data.totalPages);

      const totals = calculateMetricTotals(data.content);
      setMetricsTotals(totals);

      return data.content;
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error fetching data: ' + err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };


  // Date utility for getting all days in the last 7 days
  function getAllDaysInLast7Days() {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    }).reverse();
  };

  // Date utility for getting all days in the current month
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

  // Date utility for getting all hourly intervals for a given date
  function getHourlyIntervals(selectedDate) {
    const datePart = selectedDate.includes(" ")
      ? selectedDate.split(" ")[0]
      : selectedDate;

    return Array.from({ length: 24 }, (_, i) => {
      const hour = String(i).padStart(2, "0");
      return `${datePart} ${hour}:00`;
    });
  };

  function getDateRangeIntervals(startDate, endDate) {
    const start = startDate instanceof Date ? new Date(startDate) : new Date(startDate);
    const end = endDate instanceof Date ? new Date(endDate) : new Date(endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const dateArray = [];

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      return getHourlyIntervals(start.toISOString().split('T')[0]);
    }

    let currentDate = new Date(start);
    while (currentDate <= end) {
      dateArray.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dateArray;
  };

  function generateMultipleMetricsChartData(selectedDate = null, product = null, selectedMetrics = ["acos"]) {
    let timeIntervals = [];
    let mode = "daily";
    let result = {};
    let isSingleDay = false;
    let fromDate, toDate;

    if (comparatorDate && comaparedDate) {
      const sameDay = comparatorDate.toDateString() === comaparedDate.toDateString();

      if (sameDay) {
        const dateStr = comparatorDate.toISOString().split('T')[0];
        timeIntervals = getHourlyIntervals(dateStr);
        mode = "hourly";
        isSingleDay = true;
        fromDate = comparatorDate;
        toDate = new Date(comparatorDate.getTime() + 24 * 60 * 60 * 1000);
      } else {
        timeIntervals = getDateRangeIntervals(comparatorDate, comaparedDate);
        mode = timeIntervals.length <= 24 ? "hourly" : "daily";
        fromDate = comparatorDate;
        toDate = comaparedDate;
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
      // Single day selected
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

    // Filter data based on selected product
    let filteredProducts = rawData;
    if (product) {
      filteredProducts = rawData.filter((p) => p.campaignId === product.campaignId);
    }

    // Set time-based filtered data for current chart
    const dateFilteredData = filteredProducts;

    // Calculate totals for each metric
    const totals = {};
    Object.keys(metrics).forEach(metricKey => {
      totals[metricKey] = 0;

      dateFilteredData.forEach(product => {
        const dataKey = metrics[metricKey].dataKey;
        totals[metricKey] += product[dataKey] || 0;
      });
    });

    // Set totals to state
    setMetricsTotals(totals);

    // Generate time-based data series for each selected metric
    selectedMetrics?.forEach(metricKey => {
      const metric = metrics[metricKey];
      if (!metric) return;

      const dataKey = metric.dataKey;
      let dataMap = {};

      timeIntervals.forEach((time) => {
        dataMap[time] = 0;
      });

      // Group data by time intervals for chart display
      dateFilteredData?.forEach((product) => {
        // Convert timestamps to Date objects
        const fromTimestamp = parseInt(product.from);
        const productDate = new Date(fromTimestamp * 1000);

        if (isSingleDay) {
          const hourKey = String(productDate.getHours()).padStart(2, "0");

          const productYear = productDate.getFullYear();
          const productMonth = String(productDate.getMonth() + 1).padStart(2, "0");
          const productDay = String(productDate.getDate()).padStart(2, "0");
          const dateHourKey = `${productYear}-${productMonth}-${productDay} ${hourKey}:00`;

          if (timeIntervals.includes(dateHourKey)) {
            dataMap[dateHourKey] += product[dataKey] || 0;
          }
        } else {
          const productYear = productDate.getFullYear();
          const productMonth = String(productDate.getMonth() + 1).padStart(2, "0");
          const productDay = String(productDate.getDate()).padStart(2, "0");
          const dateDayKey = `${productYear}-${productMonth}-${productDay}`;

          if (timeIntervals.includes(dateDayKey)) {
            dataMap[dateDayKey] += product[dataKey] || 0;
          }
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

  // Handle date selection
  function handleDateSelection(selectedDateOption) {
    setComparatorDate(null);
    setComaparedDate(null);
    setDate(selectedDateOption);
  }

  // Handle comparison date confirmation
  function handleComparisonDatesConfirm() {
    if (comparatorDate && comaparedDate) {
      setDate(null);
      setShowCalendar(false);

      // Fetch data for the new date range
      fetchData(comparatorDate, comaparedDate);
    }
  }

  // Handle product click
  const handleProductClick = (product) => {
    if (selectedProduct?.campaignId === product.campaignId) {
      setSelectedProduct(null);
    } else {
      setSelectedProduct(product);
    }
  };

  // Function to calculate totals for each metric based on filtered data
  function calculateMetricTotals(products) {
    const totals = {};

    Object.keys(metrics).forEach(metricKey => {
      totals[metricKey] = 0;
    });

    products.forEach(product => {
      Object.keys(metrics).forEach(metricKey => {
        const dataKey = metrics[metricKey].dataKey;
        if (product[dataKey] !== undefined) {
          totals[metricKey] += product[dataKey];
        }
      });
    });

    return totals;
  };

  // Function to format metric values for display
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
    // Determine date range based on current selection
    let fromDate, toDate;

    if (comparatorDate && comaparedDate) {
      fromDate = comparatorDate;
      toDate = comaparedDate;
    } else if (Array.isArray(date)) {
      // Last 7 days
      fromDate = new Date(date[0]);
      toDate = new Date(date[date.length - 1]);
      toDate.setHours(23, 59, 59, 999);
    } else if (date === "Bulan Ini") {
      // Current month
      const today = new Date();
      fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
      toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      toDate.setHours(23, 59, 59, 999);
    } else if (date) {
      // Single day
      fromDate = new Date(date);
      toDate = new Date(date);
      toDate.setHours(23, 59, 59, 999);
    } else {
      // Default to last 7 days
      const today = new Date();
      fromDate = new Date();
      fromDate.setDate(today.getDate() - 7);
      toDate = today;
    }

    fetchData(fromDate, toDate);
  }, []);

  // Generate chart data when relevant state changes
  useEffect(() => {
    const chartData = generateMultipleMetricsChartData(date, selectedProduct, selectedMetrics);
    setChartData(chartData);
  }, [rawData, date, selectedProduct, selectedMetrics]);

  useEffect(() => {
    if (chartRef.current) {
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

      if (!hasData && (comparatorDate && comaparedDate)) {
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
      return () => chartInstance.dispose();
    }
  }, [chartData, selectedMetrics]);



  // FILTER COLUMNS FEATURE
  // Define all columns
  const allColumns = [
    { key: "info_iklan", label: "Info iklan" },
    { key: "biaya", label: " Biaya" },
    { key: "iklan_dilihat", label: "Iklan Dilihat" },
    { key: "click", label: "Click" },
    { key: "ctr", label: "CTR" },
    { key: "acos", label: "ACOS" },
    { key: "cpc", label: "CPC" },
    { key: "convertion", label: "Convertion" },
    { key: "classification", label: "Sales Clasification" },
    { key: "insight", label: "Insight" },
    { key: "custom_roas", label: "Custom Roas" },
    { key: "detail", label: "" },
  ];

  // Initialize selected columns state
  const [selectedColumns, setSelectedColumns] = useState(
    allColumns.map((col) => col.key)
  );

  // Handle column change
  const handleColumnChange = (colKey) => {
    setSelectedColumns((prev) =>
      prev.includes(colKey)
        ? prev.filter((key) => key !== colKey)
        : [...prev, colKey]
    );
  };

  useEffect(() => {
    let filtered = rawData;

    // Filter by search term
    if (debouncedSearchTerm !== "") {
      filtered = rawData.filter((entry) =>
        entry.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    if (statusProductFilter !== "all") {
      filtered = rawData.filter((entry) => entry.state === statusProductFilter);
    }

    const selectedAdValues = selectedTypeAds.map((ad) => ad.value);
    if (!selectedAdValues.includes("all")) {
      filtered = rawData.filter((entry) => selectedAdValues.includes(entry.biddingStrategy));
    };


    // Filter by placement (if a placement is selected and not "all")
    // if (selectedOptionPlacement && selectedOptionPlacement.value !== "all") {
    //   filtered = filtered.filter((entry) => entry?.manual_product_ads?.product_placement === selectedOptionPlacement.value);
    // };

    setCurrentPage(1);
    setFilteredData(filtered);
  }, [debouncedSearchTerm, rawData, statusProductFilter, selectedTypeAds
    // selectedOptionPlacement
  ]);



  // PAGINATION FEATURE
  useEffect(() => {
    const calculateTotalPages = Math.ceil(filteredData.length / itemsPerPage);
    setTotalPages(calculateTotalPages || 1);

    if (currentPage > calculateTotalPages && calculateTotalPages > 0) {
      setCurrentPage(calculateTotalPages);
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedData(filteredData.slice(startIndex, endIndex));
  }, [filteredData, currentPage, itemsPerPage]);

  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  const renderPagination = () => {
    const pageNumbers = getPageNumbers();

    return (
      <div className="d-flex justify-content-between align-items-center mt-3">
        {/* Items per page dropdown */}
        <div className="d-flex align-items-center gap-2">
          <span>Tampilan</span>
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

        <nav aria-label="Page navigation">
          <ul className="pagination mb-0">
            {/* Previous button */}
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                &laquo;
              </button>
            </li>

            {/* Page numbers */}
            {pageNumbers.map(number => (
              <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(number)}
                >
                  {number}
                </button>
              </li>
            ))}

            {/* Next button */}
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                &raquo;
              </button>
            </li>
          </ul>
        </nav>
      </div>
    );
  };

  // console.log(rawData, "rawData");
  // console.log(filteredData, "filteredData");
  // console.log(paginatedData, "paginatedData");

  // const mappingPage = paginatedData.map((product) => {
  //   console.log(product, "product");
  // });



  // SALES CLASSIFICATION FEATURE
  // Define sales classification options
  const typeClasificationOptions = [
    { value: "best_seller", label: "Best Seller" },
    { value: "middle_moving", label: "Middle Moving" },
    { value: "slow_moving", label: "Slow Moving" },
  ];

  const handleClassificationChange = (selectedOptions) => {
    setSelectedClassificationOption(selectedOptions);
  };



  // PLACEMENT FILTER FEATURE
  // Define placement options
  const placementOptions = [
    { value: "all", label: "Semua" },
    { value: "targeting", label: "Halaman Rekomendasi" },
    { value: "search_product", label: "Halaman Pencarian" },
  ];

  const handlePlacementChange = (selectedOption) => {
    setSelectedOptionPlacement(selectedOption);
  };

  const isTypeManualProductSelected = selectedTypeAds.some(
    (option) => option.value === "product_manual"
  );



  // ADS FILTER FEATURE
  // Define ads type options
  const typeAdsOptions = [
    { value: "all", label: "Semue Tipe" },
    { value: "product_gmv_max_roas", label: "Iklan Produk GMV Max ROAS" },
    { value: "product_gmv_max_auto", label: "Iklan Produk GMV Max Auto" },
    { value: "auto", label: "Iklan Produk Auto" },
    { value: "manual", label: "Iklan Produk Manual" },
    { value: "shop_auto", label: "Iklan Toko Auto" },
    { value: "shop_manual", label: "Iklan Toko Manual" },
  ];

  // Handle ads type change
  const handleAdsChange = (selectedOptions) => {
    // Check if "all" is selected
    const hasAll = selectedOptions.some(option => option.value === "all");
    const hadAll = selectedTypeAds.some(option => option.value === "all");

    // If "all" is newly selected, remove all other options
    if (hasAll && !hadAll) {
      setSelectedTypeAds([{ value: "all", label: "Semua Tipe" }]);
      return;
    }

    // If any other options are selected and "all" is already there, remove "all"
    if (selectedOptions.length > 1 && hasAll) {
      setSelectedTypeAds(selectedOptions.filter(option => option.value !== "all"));
      return;
    }

    // If no options are selected, set back to "all"
    if (selectedOptions.length === 0) {
      setSelectedTypeAds([{ value: "all", label: "Semua Tipe" }]);
      return;
    }

    // Normal case, set selected options
    setSelectedTypeAds(selectedOptions);
  };

  // Handle style for matric filter button
  const handleStyleMatricButton = (metricKey) => {
    const isActive = selectedMetrics.includes(metricKey);
    const metric = metrics[metricKey];

    return {
      backgroundColor: "#ffffff00",
      border: `1px solid ${isActive ? metric.color : "rgb(179.4, 184.2, 189)"}`,
      color: isActive ? metric.color : "#666666",
      padding: "6px 12px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: isActive ? "medium" : "normal",
      transition: "all 0.3s ease"
    };
  };


  // CALCULATE METRIC TOTALS FEATURE
  // Function to calculate totals for each metric based on filtered data
  function calculateMetricTotals(filteredProducts) {
    const totals = {};

    // Inisialisasi totals untuk setiap metrik yang ada
    Object.keys(metrics).forEach(metricKey => {
      totals[metricKey] = 0;
    });

    // Hitung total untuk setiap metrik berdasarkan data yang sudah difilter
    filteredProducts.forEach(product => {
      Object.keys(metrics).forEach(metricKey => {
        const dataKey = metrics[metricKey].dataKey;
        if (product[dataKey] !== undefined) {
          totals[metricKey] += product[dataKey];
        }
      });
    });

    return totals;

  };

  useEffect(() => {
    const totals = calculateMetricTotals(filteredData);
    setMetricsTotals(totals);
  }, [filteredData]);

  // Function to format metric values for display ui
  const formatMetricValue = (metricKey, value) => {
    if (metricKey === "daily_budget") {
      return `Rp ${convertBudgetToIDR(value)}`;
    }
    return value?.toLocaleString() || "0";
  };

  // Function to get the style for each state status
  const getStateStyle = (state) => {
    const stateMap = {
      ongoing: {
        backgroundColor: "#00EB3FFF",
        textColor: "#00D138FF",
        label: "Berjalan",
        isAnimated: true,
      },
      pause: {
        backgroundColor: "#F6881F",
        textColor: "#F6881F",
        label: "Jeda",
        isAnimated: false,
      },
      ended: {
        backgroundColor: "#000000",
        textColor: "#000000",
        label: "Selesai",
        isAnimated: false,
      },
      deleted: {
        backgroundColor: "#F6881F",
        textColor: "#F6881F",
        label: "Dihapus",
        isAnimated: false,
      },
      schedule: {
        backgroundColor: "#F6881F",
        textColor: "#F6881F",
        label: "Terjadwal",
        isAnimated: false,
      },
    };

    return stateMap[state] || {
      backgroundColor: "#F6881F",
      textColor: "#F6881F",
      label: "Tidak Diketahui",
      isAnimated: false,
    };
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
              {error && <div className="alert alert-danger my-3">{error}</div>}
              {/* Header & Date Filter */}
              <div className="d-flex justify-content-between align-items-start pb-3">
                <strong>{filteredData.length} total produk</strong>
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="btn btn-primary"
                  >
                    {comparatorDate && comaparedDate
                      ? `${comparatorDate.toLocaleDateString("id-ID")} - ${comaparedDate.toLocaleDateString("id-ID")}`
                      : (typeof date === 'string' ? date : (Array.isArray(date) ? "1 Minggu terakhir" : "Pilih Tanggal"))}
                  </button>
                  {showCalendar && (
                    <div
                      className="d-flex"
                      style={{
                        position: "absolute",
                        top: "40px",
                        right: "0",
                        zIndex: 1000,
                        background: "white",
                        boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
                        borderRadius: "8px",
                        padding: "0px 10px",
                      }}
                    >
                      <div
                        className="d-flex flex-column py-2 px-1"
                        style={{ width: "130px", listStyleType: "none" }}
                      >
                        <p style={{ cursor: "pointer" }} onClick={() => handleDateSelection(new Date().toISOString().split("T")[0])}>Hari ini</p>
                        <p style={{ cursor: "pointer" }}
                          onClick={() => {
                            const yesterday = new Date();
                            yesterday.setDate(yesterday.getDate() - 1);
                            handleDateSelection(yesterday.toISOString().split("T")[0]);
                          }}
                        >
                          Kemarin
                        </p>
                        <p style={{ cursor: "pointer" }} onClick={() => handleDateSelection(getAllDaysInLast7Days())}>1 Minggu terakhir</p>
                        <p style={{ cursor: "pointer" }} onClick={() => handleDateSelection("Bulan Ini")}>Bulan ini</p>
                      </div>
                      <div style={{ width: "1px", height: "auto", backgroundColor: "#E3E3E3FF", margin: "10px 0" }}></div>
                      {/* Kalender pembanding */}
                      <div>
                        <p className="pt-2" style={{ textAlign: "center" }}>Tanggal Pembanding</p>
                        <Calendar onChange={(date) => setComparatorDate(date)} value={comparatorDate} maxDate={comaparedDate || new Date(2100, 0, 1)} />
                      </div>
                      {/* Kalender dibanding */}
                      <div>
                        <p className="pt-2" style={{ textAlign: "center" }}>Tanggal Dibanding</p>
                        <Calendar onChange={(date) => setComaparedDate(date)} value={comaparedDate} minDate={comparatorDate || new Date()} />
                      </div>
                      {/* Confirm button for date range */}
                      <div className="d-flex align-items-end mb-1">
                        <button
                          className="btn btn-primary"
                          onClick={handleComparisonDatesConfirm}
                          disabled={!comparatorDate || !comaparedDate}
                        >
                          Terapkan
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="d-flex flex-column gap-3">
                {/* Matric filter */}
                <div className="row g-3 justify-content-center">
                  {Object.keys(metrics).map((metricKey) => (
                    <div className="col-12 col-md-6 col-lg-2">
                      <div
                        className="card shadow-md p-2"
                        style={handleStyleMatricButton(metricKey)}
                        onClick={() => handleMetricFilter(metricKey)}
                        key={metricKey}
                      >
                        <h6 className="card-title">
                          {metrics[metricKey].label}
                        </h6>
                        <span className="card-text fs-4 fw-bold">
                          {formatMetricValue(metricKey, metricsTotals[metricKey])}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div ref={chartRef} style={{ width: "100%", height: "300px" }}></div>
                {/* Filter & Table */}
                <div className="d-flex flex-column gap-2">
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
                  {/* Status filter */}
                  <div
                    className="d-flex align-items-center gap-1 gap-md-2 flex-wrap"
                    style={{ width: "fit-content", listStyleType: "none" }}
                  >
                    <span>Status Produk</span>
                    <div className="d-flex gap-1 gap-md-2 flex-wrap">
                      <div
                        className={`status-button-filter rounded-pill d-flex align-items-center  ${statusProductFilter === "all"
                            ? "custom-font-color custom-border-select"
                            : "border border-secondary-subtle"
                          }`}
                        onClick={() => setStatusProductFilter("all")}
                        style={{ cursor: "pointer", fontSize: "12px", padding: "6px 12px", }}
                      >
                        Semua
                      </div>
                      <div
                        className={`status-button-filter rounded-pill d-flex align-items-center ${statusProductFilter === "scheduled"
                            ? "custom-font-color custom-border-select"
                            : "border border-secondary-subtle"
                          }`}
                        onClick={() => setStatusProductFilter("scheduled")}
                        style={{ cursor: "pointer", fontSize: "12px", padding: "6px 12px", }}
                      >
                        Terjadwal
                      </div>
                      <div
                        className={`status-button-filter rounded-pill d-flex align-items-center  ${statusProductFilter === "ongoing"
                            ? "custom-font-color custom-border-select"
                            : "border border-secondary-subtle"
                          }`}
                        onClick={() => setStatusProductFilter("ongoing")}
                        style={{ cursor: "pointer", fontSize: "12px", padding: "6px 12px", }}
                      >
                        Berjalan
                      </div>
                      <div
                        className={`status-button-filter rounded-pill d-flex align-items-center  ${statusProductFilter === "paused"
                            ? "custom-font-color custom-border-select"
                            : "border border-secondary-subtle"
                          }`}
                        onClick={() => setStatusProductFilter("paused")}
                        style={{ cursor: "pointer", fontSize: "12px", padding: "6px 12px", }}
                      >
                        Nonaktif
                      </div>
                      <div
                        className={`status-button-filter rounded-pill d-flex align-items-center ${statusProductFilter === "ended"
                            ? "custom-font-color custom-border-select"
                            : "border border-secondary-subtle"
                          }`}
                        onClick={() => setStatusProductFilter("ended")}
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
                    {showTableColumn && (
                      <div className="border px-2 py-2 rounded">
                        {allColumns.map((col) => (
                          <div key={col.key} className="form-check form-check-inline">
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
                              col.label ? (
                                <span className="text-secondary" style={{ fontSize: "12px" }}>
                                  {col.label}
                                </span>
                              ) : (
                                <span className="text-secondary" style={{ fontSize: "12px" }}>
                                  Detail
                                </span>
                              )
                            }
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Table container */}
                  <div className="table-responsive">
                    <table className="table table-centered">
                      <thead className="table-dark">
                        <tr>
                          {filteredData.length !== 0 && filteredData !== null && <th scope="col">No</th>}
                          {allColumns
                            .filter((col) => selectedColumns.includes(col.key))
                            .map((col) => (
                              <th key={col.key}>
                                <div className="d-flex justify-content-start align-items-center">
                                  {col.label}
                                </div>
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedData.length !== 0 && paginatedData !== null ? (
                          paginatedData?.map((entry, index) => (
                            <>
                              <tr key={entry.campaignId}>
                                {filteredData.length > 0 && filteredData !== null && (
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
                                    onClick={() => handleProductClick(entry)}
                                  >
                                    <img
                                      src={
                                        "https://down-id.img.susercontent.com/file/" +
                                        entry.image
                                      }
                                      alt={entry.title}
                                      className="rounded"
                                      style={{ width: "60px", height: "60px" }}
                                    />
                                    <div className="d-flex flex-column">
                                      <span>{entry.title}</span>
                                      <span style={{ fontSize: "11px"}}>
                                        Tidak terbatas
                                      </span>
                                      {(() => {
                                        const stateStyle = getStateStyle(entry.state);
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
                                {selectedColumns.includes("biaya") && (
                                  <td style={{ width: "200px" }}>
                                    <div className="d-flex flex-column">
                                      <span>
                                        Rp {convertBudgetToIDR(entry.data[0].dailyBudget)}
                                      </span>
                                      <span className="text-success" style={{ fontSize: "10px" }}>
                                        +12.7%
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {selectedColumns.includes("iklan_dilihat") && (
                                  <td style={{ width: "200px" }}>
                                    <div className="d-flex flex-column">
                                      <span>{entry.data[0].impression}</span>
                                      <span className="text-danger" style={{ fontSize: "10px" }}>
                                        -102.7%
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {selectedColumns.includes("click") && (
                                  <td style={{ width: "200px" }}>
                                    <div className="d-flex flex-column">
                                      <span>{entry.data[0].click}</span>
                                      <span className="text-danger" style={{ fontSize: "10px" }}>
                                        -102.7%
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {selectedColumns.includes("ctr") && (
                                  <td style={{ width: "200px" }}>
                                    <div className="d-flex flex-column">
                                      <span>{entry.data[0].ctr}</span>
                                      <span className="text-danger" style={{ fontSize: "10px" }}>
                                        -102.7%
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {selectedColumns.includes("acos") && (
                                  <td style={{ width: "200px" }}>
                                    <div className="d-flex flex-column">
                                      <span>{entry.acos}</span>
                                      <span className="text-danger" style={{ fontSize: "10px" }}>
                                        -102.7%
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {selectedColumns.includes("cpc") && (
                                  <td style={{ width: "200px" }}>
                                    <div className="d-flex flex-column">
                                      <span>{entry.cpc}</span>
                                      <span className="text-danger" style={{ fontSize: "10px" }}>
                                        -102.7%
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {selectedColumns.includes("convertion") && (
                                  <td style={{ width: "200px" }}>
                                    <div className="d-flex flex-column">
                                      <span></span>
                                      {/* <span>{entry.report.checkout}</span> */}
                                      <span className="text-danger" style={{ fontSize: "10px" }}>
                                        -102.7%
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {selectedColumns.includes("classification") &&
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
                                  ))}
                                {selectedColumns.includes("insight") && (
                                  <td style={{ width: "200px" }}>
                                    <span>
                                      {entry.insight}
                                    </span>
                                  </td>
                                )}
                                {selectedColumns.includes("custom_roas") && (
                                  entry.type === "product_gmv_max_roas" ? (
                                    <td style={{ width: "200px" }}>
                                      <input
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
                                        onClick={() => alert("Custom Roas saved")}
                                      >
                                        Simpan
                                      </button>
                                    </td>
                                  ) : (
                                    <td style={{ width: "200px" }}>
                                      <span></span>
                                    </td>
                                  )
                                )}
                                {selectedColumns.includes("detail") && (
                                  <td style={{ width: "200px" }}>
                                    {
                                      entry.data[0].biddingStrategy == "manual" ? (
                                        <Link to={"/dashboard/performance/ads/detail"}>
                                          <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24"><path fill="currentColor" d="m16 8.4l-8.9 8.9q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7L14.6 7H7q-.425 0-.712-.288T6 6t.288-.712T7 5h10q.425 0 .713.288T18 6v10q0 .425-.288.713T17 17t-.712-.288T16 16z"></path></svg>
                                        </Link>
                                      ) : (
                                        <span>test</span>
                                      )
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
                  {/* Pagination */}
                  {filteredData.length > 0 && filteredData !== null && renderPagination()}
                </div>
              </div>
            </div>
          </div>
        )
      }
    </>
  );
};

export default AdsTable;








// const AdsTable = ({ data, datas }) => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const debouncedSearchTerm = useDebounce(searchTerm, 300);
//   const [filteredData, setFilteredData] = useState(data.data.entry_list);
//   const [filteredDataV2, setFilteredDataV2] = useState(datas.content);
//   const [statusProductFilter, setStatusProductFilter] = useState("all");
//   const [selectedClassificationOption, setSelectedClassificationOption] = useState([]);
//   const [selectedOptionPlacement, setSelectedOptionPlacement] = useState(null);
//   const [selectedTypeAds, setSelectedTypeAds] = useState([{ value: "all", label: "Semua Tipe" }]);
//   const [showTableColumn, setShowTableColumn] = useState(false);
//   const [chartData, setChartData] = useState([]);
//   const [comparatorDate, setComparatorDate] = useState(null);
//   const [comaparedDate, setComaparedDate] = useState(null);
//   const [date, setDate] = useState(getAllDaysInLast7Days());
//   const [showCalendar, setShowCalendar] = useState(false);
//   const chartRef = useRef(null);
//   const [showAlert, setShowAlert] = useState(false);
//   const [selectedProduct, setSelectedProduct] = useState(null);
//   const [selectedMetrics, setSelectedMetrics] = useState(["daily_budget"]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(20);
//   const [paginatedData, setPaginatedData] = useState([]);
//   const [totalPages, setTotalPages] = useState(1);
//   const [metricsTotals, setMetricsTotals] = useState({});


//   // Define metrics with their display names and colors
//   const metrics = {
//     daily_budget: { 
//       label: "Biaya", 
//       color: "#00B69A", 
//       dataKey: "daily_budget" 
//     },
//     impression: { 
//       label: "Iklan Dilihat", 
//       color: "#D50000", 
//       dataKey: "impression" 
//     },
//     click: { 
//       label: "Click", 
//       color: "#00B800",
//       dataKey: "click" 
//     },
//     ctr: { 
//       label: "CTR", 
//       color: "#DFC100",
//       dataKey: "ctr" 
//     },
//     acos: { 
//       label: "ACOS", 
//       color: "#C400BA",
//       dataKey: "acos" 
//     },
//     broad_order: { 
//       label: "CPC", 
//       color: "#AD5F00FF",
//       dataKey: "broad_order" 
//     }
//   };

//   // Handle product click by clicking the product in name column
//   const handleProductClick = (product) => {
//     if (selectedProduct?.campaign.campaign_id === product.campaign.campaign_id) {
//       setSelectedProduct(null);
//     } else {
//       setSelectedProduct(product);
//     }
//   };

//   // Get all days in last 7 days in a month
//   function getAllDaysInLast7Days() {
//     return Array.from({ length: 7 }, (_, i) => {
//       const d = new Date();
//       d.setDate(d.getDate() - i);
//       return d.toISOString().split("T")[0];
//     }).reverse();
//   };

//   // Get all days in a month
//   function getAllDaysInAMonth() {
//     const today = new Date();
//     const year = today.getFullYear();
//     const month = today.getMonth() + 1;
//     const days = new Date(year, month, 0).getDate();
//     return Array.from(
//       { length: days },
//       (_, i) => `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`
//     );
//   };

//   // Get all hours in a day
//   function getHourlyIntervals(selectedDate) {
//     const datePart = selectedDate.includes(" ") 
//     ? selectedDate.split(" ")[0] 
//     : selectedDate;
    
//     return Array.from({ length: 24 }, (_, i) => {
//       const hour = String(i).padStart(2, "0");
//       return `${datePart} ${hour}:00`;
//     });
//   };

//   // Get all days in a date range
//   function getDateRangeIntervals(startDate, endDate) {
//     const start = startDate instanceof Date ? new Date(startDate) : new Date(startDate);
//     const end = endDate instanceof Date ? new Date(endDate) : new Date(endDate);
    
//     start.setHours(0, 0, 0, 0);
//     end.setHours(23, 59, 59, 999);
    
//     const dateArray = [];
    
//     const diffTime = Math.abs(end - start);
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
//     if (diffDays <= 1) {
//       return getHourlyIntervals(start.toISOString().split('T')[0]);
//     }
    
//     let currentDate = new Date(start);
//     while (currentDate <= end) {
//       dateArray.push(currentDate.toISOString().split('T')[0]);
//       currentDate.setDate(currentDate.getDate() + 1);
//     }
    
//     return dateArray;
//   };

//   function filterDataByDate(dataList, selectedDate) {
//     let timeIntervals = [];
//     let isSingleDay = false;

//     if (comparatorDate && comaparedDate) {
//         const sameDay = comparatorDate.toDateString() === comaparedDate.toDateString();

//         if (sameDay) {
//             const dateStr = comparatorDate.toISOString().split('T')[0];
//             timeIntervals = getHourlyIntervals(dateStr);
//             isSingleDay = true;
//         } else {
//             timeIntervals = getDateRangeIntervals(comparatorDate, comaparedDate);
//         }
//     } else if (selectedDate === null || Array.isArray(selectedDate)) {
//         timeIntervals = getAllDaysInLast7Days();
//     } else if (selectedDate === "Bulan Ini") {
//         timeIntervals = getAllDaysInAMonth();
//     } else {
//         timeIntervals = getHourlyIntervals(selectedDate);
//         isSingleDay = true;
//     }

//     if (!timeIntervals || timeIntervals.length === 0) {
//         timeIntervals = [new Date().toISOString().split('T')[0]];
//     }

//     return dataList.filter(product => {
//         const productDate = new Date(product.campaign.start_time * 1000);
        
//         if (isSingleDay) {
//             const productYear = productDate.getFullYear();
//             const productMonth = String(productDate.getMonth() + 1).padStart(2, "0");
//             const productDay = String(productDate.getDate()).padStart(2, "0");
//             const productHour = String(productDate.getHours()).padStart(2, "0");
//             const dateHourKey = `${productYear}-${productMonth}-${productDay} ${productHour}:00`;
            
//             return timeIntervals.includes(dateHourKey);
//         } else {
//             const productYear = productDate.getFullYear();
//             const productMonth = String(productDate.getMonth() + 1).padStart(2, "0");
//             const productDay = String(productDate.getDate()).padStart(2, "0");
//             const dateDayKey = `${productYear}-${productMonth}-${productDay}`;
            
//             return timeIntervals.includes(dateDayKey);
//         }
//     });
//   };

//   // Generate chart data for multiple metrics
//   function generateMultipleMetricsChartData(selectedDate = null, product = null, selectedMetrics = ["visitor"]) {
//     let timeIntervals = [];
//     let mode = "daily";
//     let result = {};
//     let isSingleDay = false;

//     if (comparatorDate && comaparedDate) {
//       const sameDay = comparatorDate.toDateString() === comaparedDate.toDateString();
      
//       if (sameDay) {
//         const dateStr = comparatorDate.toISOString().split('T')[0];
//         timeIntervals = getHourlyIntervals(dateStr);
//         mode = "hourly";
//         isSingleDay = true;
//       } else {
//         timeIntervals = getDateRangeIntervals(comparatorDate, comaparedDate);
//         mode = timeIntervals.length <= 24 ? "hourly" : "daily";
//       }
//     } else if (selectedDate === null || Array.isArray(selectedDate)) {
//       timeIntervals = getAllDaysInLast7Days();
//     } else if (selectedDate === "Bulan Ini") {
//       timeIntervals = getAllDaysInAMonth();
//     } else {
//       timeIntervals = getHourlyIntervals(selectedDate);
//       mode = "hourly";
//       isSingleDay = true;
//     }

//     if (!timeIntervals || timeIntervals.length === 0) {
//       timeIntervals = [new Date().toISOString().split('T')[0]];
//     }
  
//     result.timeIntervals = timeIntervals;
//     result.isSingleDay = isSingleDay;
//     result.series = [];

//      // Filter data berdasarkan tanggal terlebih dahulu
//     let dateFilteredData = filterDataByDate(data.data.entry_list, selectedDate);
        
//     // Kemudian filter berdasarkan produk jika ada
//     let filteredProducts = dateFilteredData;
//     if (product) {
//         filteredProducts = dateFilteredData.filter((p) => p.campaign.campaign_id === product.campaign.campaign_id);
//     }
//     // let filteredProducts = data.data.entry_list;
//     // if (product) {
//     //   filteredProducts = data.data.entry_list.filter((p) => p.campaign.campaign_id === product.campaign.campaign_id);
//     // }

//     // Calculate totals for each metric
//     const totals = {};
//     Object.keys(metrics).forEach(metricKey => {
//         totals[metricKey] = 0;
        
//         filteredProducts.forEach(product => {
//             const dataKey = metrics[metricKey].dataKey;
//             if (dataKey === "daily_budget") {
//                 totals[metricKey] += product.campaign[dataKey] || 0;
//             } else {
//                 totals[metricKey] += product.report[dataKey] || 0;
//             }
//         });
//     });
    
//     // Set totals to state
//     setMetricsTotals(totals);

//     selectedMetrics?.forEach(metricKey => {
//       const metric = metrics[metricKey];
//       if (!metric) return;

//       const dataKey = metric.dataKey;
//       let dataMap = {};
      
//       timeIntervals.forEach((time) => {
//         dataMap[time] = 0;
//       });

//       filteredProducts?.forEach((product) => {
//         const productDate = new Date(product.campaign.start_time * 1000);
        
//         if (isSingleDay) {
//           const hourKey = String(productDate.getHours()).padStart(2, "0");
          
//           const productYear = productDate.getFullYear();
//           const productMonth = String(productDate.getMonth() + 1).padStart(2, "0");
//           const productDay = String(productDate.getDate()).padStart(2, "0");
//           const dateHourKey = `${productYear}-${productMonth}-${productDay} ${hourKey}:00`;
          
//           if (timeIntervals.includes(dateHourKey)) {
//             if (dataKey === "daily_budget") {
//               dataMap[dateHourKey] += product.campaign[dataKey] || 0;
//             } else {
//               dataMap[dateHourKey] += product.report[dataKey] || 0;
//             }
//           }
//         } else {
//           const productYear = productDate.getFullYear();
//           const productMonth = String(productDate.getMonth() + 1).padStart(2, "0");
//           const productDay = String(productDate.getDate()).padStart(2, "0");
//           const dateDayKey = `${productYear}-${productMonth}-${productDay}`;
          
//           if (timeIntervals.includes(dateDayKey)) {
//             if (dataKey === "daily_budget") {
//               dataMap[dateDayKey] += product.campaign[dataKey] || 0;
//             } else {
//               dataMap[dateDayKey] += product.report[dataKey] || 0;
//             }
//           }
//         }
//       });

//       const seriesData = {
//         name: metric.label,
//         data: timeIntervals.map((time) => dataMap[time] || 0),
//         color: metric.color
//       };

//       result.series.push(seriesData);
//     });
    
//     return result;
//   };

//   function handleMetricFilter(metricKey) {
//     setSelectedMetrics(prev => {
//       if (prev.includes(metricKey)) {
//         return prev.filter(m => m !== metricKey);
//       } 
//       else if (prev.length < 4) {
//         return [...prev, metricKey];
//       } 
//       else {
//         setShowAlert(true);
//         setTimeout(() => setShowAlert(false), 2000); 
//         return prev;
//       }
//     });
//   };
  
//   function handleDateSelection(selectedDateOption) {
//     setComparatorDate(null);
//     setComaparedDate(null);
//     setDate(selectedDateOption);
//   };

//   function handleComparisonDatesConfirm() {
//     if (comparatorDate && comaparedDate) {
//       setDate(null);
//       setShowCalendar(false);
//     }
//   };

//   useEffect(() => {
//     const chartData = generateMultipleMetricsChartData(date, selectedProduct, selectedMetrics);
//     setChartData(chartData);
//   }, [date, selectedProduct, selectedMetrics, comparatorDate, comaparedDate, data.data.entry_list]);

//   useEffect(() => {
//       if (chartRef.current) {
//         const chartInstance = echarts.init(chartRef.current);
          
//         const series = chartData.series?.map(s => ({
//           name: s.name,
//           type: 'line',
//           smooth: true,
//           showSymbol: false,
//           emphasis: { focus: 'series' },
//           data: s.data,
//           lineStyle: {
//             color: s.color
//           },
//           itemStyle: {
//             color: s.color
//           }
//         })) || [];
  
//         const hasData = series.some(s => s.data && s.data.some(value => value > 0));
  
//         let leftGrid;
//         if (selectedMetrics.length == 1 && (selectedMetrics.includes("daily_budget") || selectedMetrics.includes("impression"))) {
//           leftGrid = 80;
//         } else if (selectedMetrics.length > 1 && selectedMetrics.includes("impression")) {
//           leftGrid = 80;
//         } else {
//           leftGrid = 50;
//         }
  
//         let xAxisData = chartData?.timeIntervals || [];
//         const isSingleDay = chartData?.isSingleDay || false;
        
//         if (isSingleDay) {
//           // Extract only the time portion (HH:00) for hourly view
//           xAxisData = xAxisData.map(interval => {
//             if (!interval) return "";
//             if (interval.includes(" ")) {
//               return interval.split(" ")[1]; // Return only the time part
//             }
//             return interval;
//           });
//         } else {
//           // For multi-day view, normalize date formats first
//           xAxisData = xAxisData.map(date => {
//             if (!date) return "";
//             // If it contains a space (has time component), take only the date part
//             if (date.includes(" ")) {
//               return date.split(" ")[0];
//             }
//             return date;
//           });
          
//           // Format multi-day dates to show just month-day
//           xAxisData = xAxisData.map(data => {
//             if (!data) return "";
//             const parts = data.split("-");
//             if (parts.length >= 3) {
//               return `${parts[1]}-${parts[2]}`;  // month-day format
//             }
//             return data;
//           });
//         };
        
//         let rotateAxisLabel = 0;
//         if (!isSingleDay) {
//           if (xAxisData?.length > 7 && xAxisData?.length <= 20) {
//             rotateAxisLabel = 30;
//           } else if (xAxisData?.length > 20) {
//             rotateAxisLabel = 40;
//           }
//         };

//         for (let i = 0; i < series.length; i++) {
//           if (series[i].name == "Biaya") {
//             series[i].data = series[i].data.map((value) => {
//               if (value > 0) {
//                 return value / 100000;
//               }
//               return 0;
//             });
//           }
//         };
  
//         const option = {
//           toolbox: { feature: { saveAsImage: {} } },
//           grid: { 
//             left: leftGrid,
//             right: 50, 
//             bottom: 50, 
//             containLabel: false 
//           },
//           tooltip: { 
//             trigger: "axis",
//             formatter: function(params) {
//               let result = params[0].axisValue + '<br/>';
//               params.forEach(param => {
//                 result += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${param.color};"></span> ${param.seriesName}: ${param.value}<br/>`;
//               });
//               return result;
//             }
//           },
//           legend: {
//             data: chartData.series?.map(s => s.name) || [],
//             bottom: 0
//           },
//           xAxis: { 
//             name: isSingleDay ? "Time" : "Date", 
//             type: "category", 
//             data: xAxisData || [], 
//             boundaryGap: false,
//             axisLabel: { 
//               rotate: rotateAxisLabel,
//               interval: 0,
//             },
//           },
//           yAxis: { 
//             name: selectedMetrics.length === 1 ? metrics[selectedMetrics[0]]?.label : "Total",
//             type: "value", 
//             splitLine: { show: true },
//           },
//           series: series
//         };
        
//         if (!hasData && (comparatorDate && comaparedDate)) {
//           option.graphic = [
//             {
//               type: 'text',
//               left: 'center',
//               top: 'middle',
//               style: {
//                 text: 'Tidak ada data untuk rentang waktu yang dipilih',
//                 fontSize: 16,
//                 fill: '#999',
//                 fontWeight: 'bold'
//               }
//             }
//           ];
//         }
        
//         chartInstance.setOption(option);
//         return () => chartInstance.dispose();
//       }
//     }, [chartData, selectedMetrics]);



//   // FILTER COLUMNS FEATURE
//   // Define all columns
//   const allColumns = [
//     { key: "info_iklan", label: "Info iklan" },
//     { key: "biaya", label: " Biaya" },
//     { key: "iklan_dilihat", label: "Iklan Dilihat" },
//     { key: "click", label: "Click" },
//     { key: "ctr", label: "CTR" },
//     { key: "acos", label: "ACOS" },
//     { key: "cpc", label: "CPC"},
//     { key: "convertion", label: "Convertion" },
//     { key: "classification", label: "Sales Clasification" },
//     { key: "insight", label: "Insight" },
//     { key: "custom_roas", label: "Custom Roas" },
//     { key: "detail", label: "" },
//   ];

//   // Initialize selected columns state
//   const [selectedColumns, setSelectedColumns] = useState(
//     allColumns.map((col) => col.key)
//   );

//   // Handle column change
//   const handleColumnChange = (colKey) => {
//     setSelectedColumns((prev) =>
//       prev.includes(colKey)
//         ? prev.filter((key) => key !== colKey)
//         : [...prev, colKey]
//     );
//   };

//   useEffect(() => {
//     let filtered = data.data.entry_list;
//     // Filter by search term
//     if (debouncedSearchTerm !== "") {
//       filtered = data.data.entry_list.filter((entry) =>
//         entry.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
//       );
//     };

//     // Filter by status
//     if (statusProductFilter !== "all") {
//       filtered = filtered.filter((entry) => entry.state === statusProductFilter);
//     };

//     // Filter by ads type (exclude "all" from filtering logic)
//     const selectedAdValues = selectedTypeAds.map((ad) => ad.value);
//     // Only filter if "all" is not selected
//     if (!selectedAdValues.includes("all")) {
//       filtered = filtered.filter((entry) => selectedAdValues.includes(entry.type));
//     };

//     // Filter by placement (if a placement is selected and not "all")
//     if (selectedOptionPlacement && selectedOptionPlacement.value !== "all") {
//       filtered = filtered.filter((entry) => entry?.manual_product_ads?.product_placement === selectedOptionPlacement.value);
//     };

//     setCurrentPage(1);
//     setFilteredData(filtered);
//   }, [
//     debouncedSearchTerm,
//     statusProductFilter,
//     selectedOptionPlacement,
//     selectedTypeAds,
//     data.data.entry_list,
//   ]);

//   useEffect(() => {
//     const calculateTotalPages = Math.ceil(filteredData.length / itemsPerPage);
//     setTotalPages(calculateTotalPages || 1);

//     if (currentPage > calculateTotalPages && calculateTotalPages > 0) {
//       setCurrentPage(calculateTotalPages);
//     }

//     const startIndex = (currentPage - 1) * itemsPerPage;
//     const endIndex = startIndex + itemsPerPage;
//     setPaginatedData(filteredData.slice(startIndex, endIndex));
//   }, [filteredData, currentPage, itemsPerPage]);

//   const handleItemsPerPageChange = (e) => {
//     const newItemsPerPage = parseInt(e.target.value, 10);
//     setItemsPerPage(newItemsPerPage);
//     setCurrentPage(1);
//   };

//   const handlePageChange = (pageNumber) => {
//     if (pageNumber >= 1 && pageNumber <= totalPages) {
//       setCurrentPage(pageNumber);
//     }
//   };

//   const getPageNumbers = () => {
//     const pageNumbers = [];
//     for (let i = 1; i <= totalPages; i++) {
//       pageNumbers.push(i);
//     }
//     return pageNumbers;
//   };

//   const renderPagination = () => {
//     const pageNumbers = getPageNumbers();
    
//     return (
//       <div className="d-flex justify-content-between align-items-center mt-3">
//         <div className="d-flex align-items-center gap-2">
//           <span>Tampilan</span>
//           <select 
//             className="form-select"
//             value={itemsPerPage} 
//             onChange={handleItemsPerPageChange}
//             style={{ width: "80px" }}
//           >
//             <option value="20">20</option>
//             <option value="30">30</option>
//             <option value="50">50</option>
//           </select>
//           <span>data per halaman</span>
//         </div>
        
//         <nav aria-label="Page navigation">
//           <ul className="pagination mb-0">
//             <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
//               <button 
//                 className="page-link" 
//                 onClick={() => handlePageChange(currentPage - 1)}
//                 disabled={currentPage === 1}
//               >
//                 &laquo;
//               </button>
//             </li>
            
//             {pageNumbers.map(number => (
//               <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
//                 <button 
//                   className="page-link" 
//                   onClick={() => handlePageChange(number)}
//                 >
//                   {number}
//                 </button>
//               </li>
//             ))}
            
//             <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
//               <button 
//                 className="page-link" 
//                 onClick={() => handlePageChange(currentPage + 1)}
//                 disabled={currentPage === totalPages}
//               >
//                 &raquo;
//               </button>
//             </li>
//           </ul>
//         </nav>
//       </div>
//     );
//   };


//   // SALES CLASSIFICATION FEATURE
//   // Define sales classification options
//   const typeClasificationOptions = [
//     { value: "best_seller", label: "Best Seller" },
//     { value: "middle_moving", label: "Middle Moving" },
//     { value: "slow_moving", label: "Slow Moving" },
//   ];

//   const handleClassificationChange = (selectedOptions) => {
//     setSelectedClassificationOption(selectedOptions);
//   };



//   // PLACEMENT FILTER FEATURE
//   // Define placement options
//   const placementOptions = [
//     { value: "all", label: "Semua" },
//     { value: "targeting", label: "Halaman Rekomendasi" },
//     { value: "search_product", label: "Halaman Pencarian" },
//   ];

//   const handlePlacementChange = (selectedOption) => {
//     setSelectedOptionPlacement(selectedOption);
//   };

//   const isTypeManualProductSelected = selectedTypeAds.some(
//     (option) => option.value === "product_manual"
//   );



//   // ADS FILTER FEATURE
//   // Define ads type options
//   const typeAdsOptions = [
//     { value: "all", label: "Semue Tipe" },
//     { value: "product_gmv_max_roas", label: "Iklan Produk GMV Max ROAS" },
//     { value: "product_gmv_max_auto", label: "Iklan Produk GMV Max Auto" },
//     { value: "product_auto", label: "Iklan Produk Auto" },
//     { value: "product_manual", label: "Iklan Produk Manual" },
//     { value: "shop_auto", label: "Iklan Toko Auto" },
//     { value: "shop_manual", label: "Iklan Toko Manual" },
//   ];

//   // Handle ads type change
//   const handleAdsChange = (selectedOptions) => {
//     // Check if "all" is selected
//     const hasAll = selectedOptions.some(option => option.value === "all");
//     const hadAll = selectedTypeAds.some(option => option.value === "all");
    
//     // If "all" is newly selected, remove all other options
//     if (hasAll && !hadAll) {
//       setSelectedTypeAds([{ value: "all", label: "Semua Tipe" }]);
//       return;
//     }
    
//     // If any other options are selected and "all" is already there, remove "all"
//     if (selectedOptions.length > 1 && hasAll) {
//       setSelectedTypeAds(selectedOptions.filter(option => option.value !== "all"));
//       return;
//     }
    
//     // If no options are selected, set back to "all"
//     if (selectedOptions.length === 0) {
//       setSelectedTypeAds([{ value: "all", label: "Semua Tipe" }]);
//       return;
//     }
    
//     // Normal case, set selected options
//     setSelectedTypeAds(selectedOptions);
//   };

//   // Handle style for matric filter button
//   const handleStyleMatricButton = (metricKey) => {
//     const isActive = selectedMetrics.includes(metricKey);
//     const metric = metrics[metricKey];
    
//     return {
//       backgroundColor: "#ffffff00",
//       border: `1px solid ${isActive ? metric.color : "rgb(179.4, 184.2, 189)"}`,
//       color: isActive ? metric.color : "#666666",
//       padding: "6px 12px",
//       borderRadius: "8px",
//       cursor: "pointer",
//       fontSize: "12px",
//       fontWeight: isActive ? "medium" : "normal",
//       transition: "all 0.3s ease"
//     };
//   };

//   // Covert type ads to ui string
//   const checkTypeAds = (type) => {
//     switch (type) {
//       case "product_manual":
//         return "Iklan Produk Manual";
//       case "shop_auto":
//         return "Iklan Toko Otomatis";
//       case "shop_manual":
//         return "Iklan Toko Manual";
//       case "product_gmv_max_roas":
//         return "Iklan Produk GMV Max ROAS";
//       case "product_gmv_max_auto":
//         return "Iklan Produk GMV Max Auto";
//       case "product_auto":
//         return "Iklan Produk Otomatis";
//       default:
//         return "No Detected";
//     }
//   };

//   // Convert budget to IDR
//   const convertBudgetToIDR = (budget) => {
//     if (budget <= 0) return 0;

//     const convertedBudget = Math.floor(budget / 100000);
//     return new Intl.NumberFormat("id-ID", {
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(convertedBudget);
//   };

//   function calculateMetricTotals(filteredProducts) {
//     const totals = {};
    
//     Object.keys(metrics).forEach(metricKey => {
//         totals[metricKey] = 0;
//     });
    
//     filteredProducts.forEach(product => {
//         if (product.campaign.daily_budget) {
//             totals.daily_budget += product.campaign.daily_budget;
//         }
        
//         Object.keys(metrics).forEach(metricKey => {
//             const dataKey = metrics[metricKey].dataKey;
//             if (dataKey !== 'daily_budget' && product.report[dataKey]) {
//                 totals[metricKey] += product.report[dataKey];
//             }
//         });
//     });
    
//     return totals;
//   }

//   useEffect(() => {
//     const totals = calculateMetricTotals(filteredData);
//     setMetricsTotals(totals);
//   }, [filteredData]);

//   const formatMetricValue = (metricKey, value) => {
//     if (metricKey === "daily_budget") {
//         return `Rp ${convertBudgetToIDR(value)}`;
//     }
//     return value?.toLocaleString() || "0";
//   };

//   return (
//     <div className="card">
//       <div className="card-body">
//         <div className="d-flex justify-content-between align-items-start pb-3">
//           <h5>{data.data.total} total produk</h5>
//           <div style={{ position: "relative" }}>
//             <button
//               onClick={() => setShowCalendar(!showCalendar)}
//               className="btn btn-secondary"
//               style={{ backgroundColor: "#8042D4", border: "none" }}
//             >
//               {comparatorDate && comaparedDate
//               ? `${comparatorDate.toLocaleDateString("id-ID")} - ${comaparedDate.toLocaleDateString("id-ID")}`
//               : (typeof date === 'string' ? date : (Array.isArray(date) ? "1 Minggu terakhir" : "Pilih Tanggal"))}
//             </button>
//             {showCalendar && (
//               <div
//                 className="d-flex"
//                 style={{
//                   position: "absolute",
//                   top: "40px",
//                   right: "0",
//                   zIndex: 1000,
//                   background: "white",
//                   boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
//                   borderRadius: "8px",
//                   padding: "0px 10px",
//                 }}
//               >
//                 <div
//                   className="d-flex flex-column py-2 px-1"
//                   style={{ width: "130px", listStyleType: "none" }}
//                 >
//                     <p style={{ cursor: "pointer" }} onClick={() => handleDateSelection(new Date().toISOString().split("T")[0])}>Hari ini</p>
//                     <p style={{ cursor: "pointer" }}
//                       onClick={() => {
//                         const yesterday = new Date();
//                         yesterday.setDate(yesterday.getDate() - 1);
//                         handleDateSelection(yesterday.toISOString().split("T")[0]);
//                       }}
//                     >
//                       Kemarin
//                     </p>
//                     <p style={{ cursor: "pointer" }} onClick={() => handleDateSelection(getAllDaysInLast7Days())}>1 Minggu terakhir</p>
//                     <p style={{ cursor: "pointer" }} onClick={() => handleDateSelection("Bulan Ini")}>Bulan ini</p>
//                 </div>
//                 <div style={{ width: "1px", height: "auto", backgroundColor: "#E3E3E3FF", margin: "10px 0"}}></div>
//                 <div>
//                   <p className="pt-2" style={{ textAlign: "center" }}>Tanggal Pembanding</p>
//                   <Calendar onChange={(date) => setComparatorDate(date)} value={comparatorDate} maxDate={comaparedDate || new Date(2100, 0, 1)} />
//                 </div>
//                 <div>
//                   <p className="pt-2" style={{ textAlign: "center" }}>Tanggal Dibanding</p>
//                   <Calendar onChange={(date) => setComaparedDate(date)} value={comaparedDate} minDate={comparatorDate || new Date()} />
//                 </div>
//                 <div className="d-flex align-items-end mb-1">
//                   <button 
//                     className="btn btn-primary" 
//                     onClick={handleComparisonDatesConfirm}
//                     disabled={!comparatorDate || !comaparedDate}
//                   >
//                     Terapkan
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//         <div className="d-flex flex-column gap-3">
//           <div className="row g-3 justify-content-center">
//             {Object.keys(metrics).map((metricKey) => (
//                 <div className="col-12 col-md-6 col-lg-2">
//                     <div
//                         className="card border-light shadow-sm h-100 p-2"
//                         style={handleStyleMatricButton(metricKey)}
//                         onClick={() => handleMetricFilter(metricKey)}
//                         key={metricKey}
//                     >
//                         <h6 className="card-title">
//                             {metrics[metricKey].label}
//                         </h6>
//                         <span className="card-text fs-4 fw-bold">
//                           {formatMetricValue(metricKey, metricsTotals[metricKey])}
//                         </span>
//                     </div>
//                 </div>
//             ))}
//           </div>
//           <div ref={chartRef} style={{ width: "100%", height: "300px" }}></div>
//           <div className="d-flex flex-column gap-2">
//             {showAlert && (
//               <div className="alert alert-warning alert-dismissible fade show" role="alert">
//                 Maksimal metrik yang dapat dipilih adalah 4 metrik
//                 <button type="button" className="btn-close" onClick={() => setShowAlert(false)}></button>
//               </div>
//             )}
//             {selectedMetrics.length === 0 && (
//               <div className="alert alert-warning alert-dismissible fade show">
//                 <span >Pilih minimal 1 metrik untuk menampilkan data</span>
//               </div>
//             )}
//             <div
//               className="d-flex align-items-center gap-1 gap-md-2 flex-wrap"
//               style={{ width: "fit-content", listStyleType: "none" }}
//             >
//               <span>Status Produk</span>
//               <div className="d-flex gap-1 gap-md-2 flex-wrap">
//                 <div
//                   className={`status-button-filter rounded-pill d-flex align-items-center  ${
//                     statusProductFilter === "all"
//                       ? "custom-font-color custom-border-select"
//                       : "border border-secondary-subtle"
//                   }`}
//                   onClick={() => setStatusProductFilter("all")}
//                   style={{ cursor: "pointer", fontSize: "12px", padding: "6px 12px", }}
//                 >
//                   Semua
//                 </div>
//                 <div
//                   className={`status-button-filter rounded-pill d-flex align-items-center ${
//                     statusProductFilter === "scheduled"
//                       ? "custom-font-color custom-border-select"
//                       : "border border-secondary-subtle"
//                   }`}
//                   onClick={() => setStatusProductFilter("scheduled")}
//                   style={{ cursor: "pointer", fontSize: "12px", padding: "6px 12px", }}
//                 >
//                   Terjadwal
//                 </div>
//                 <div
//                   className={`status-button-filter rounded-pill d-flex align-items-center  ${
//                     statusProductFilter === "ongoing"
//                       ? "custom-font-color custom-border-select"
//                       : "border border-secondary-subtle"
//                   }`}
//                   onClick={() => setStatusProductFilter("ongoing")}
//                   style={{ cursor: "pointer", fontSize: "12px", padding: "6px 12px", }}
//                 >
//                   Berjalan
//                 </div>
//                 <div
//                   className={`status-button-filter rounded-pill d-flex align-items-center  ${
//                     statusProductFilter === "paused"
//                       ? "custom-font-color custom-border-select"
//                       : "border border-secondary-subtle"
//                   }`}
//                   onClick={() => setStatusProductFilter("paused")}
//                   style={{ cursor: "pointer", fontSize: "12px", padding: "6px 12px", }}
//                 >
//                   Nonaktif
//                 </div>
//                 <div
//                   className={`status-button-filter rounded-pill d-flex align-items-center ${
//                     statusProductFilter === "ended"
//                       ? "custom-font-color custom-border-select"
//                       : "border border-secondary-subtle"
//                   }`}
//                   onClick={() => setStatusProductFilter("ended")}
//                   style={{ cursor: "pointer", fontSize: "12px", padding: "1px 12px", }}
//                 >
//                   Berakhir
//                 </div>
//               </div>
//             </div>
//             <div className="d-flex flex-column mb-3 gap-2">
//               <div id="container-other-filters" className="d-flex w-full justify-content-between align-items-start">
//                 <div id="container-other-filters-left" className="d-flex gap-2 flex-wrap">
//                   <div className="custom-filter-search">
//                     <input
//                       type="text"
//                       className="form-control"
//                       placeholder="Cari berdasarkan nama"
//                       onChange={(e) => setSearchTerm(e.target.value)}
//                     />
//                   </div>
//                   {isTypeManualProductSelected && (
//                     <div className="custom-filter-typePlacement">
//                       <Select
//                         options={placementOptions}
//                         value={selectedOptionPlacement}
//                         onChange={handlePlacementChange}
//                         placeholder="Pilih Penempatan"
//                         styles={{
//                           control: (base) => ({
//                             ...base,
//                             backgroundColor: "#FFFFFF00 !important",
//                             border: "0.5px solid #d8dfe7 !important",
//                             borderColor: "#d8dfe7 !important",
//                             boxShadow: "none",
//                             "&:hover": {
//                               border: "0.5px solid #d8dfe7 !important",
//                               boxShadow: "none",
//                             },
//                             "&:focus": {
//                               border: "0.5px solid #d8dfe7 !important",
//                               boxShadow: "none",
//                             },
//                             "&:active": {
//                               border: "0.5px solid #d8dfe7 !important",
//                               boxShadow: "none",
//                             },
//                             padding: "0.6px 4px",
//                           }),
//                         }}
//                       />
//                     </div>
//                   )}
//                   <div className="custom-filter-typeAds">
//                     <Select
//                       isMulti
//                       options={typeAdsOptions}
//                       value={selectedTypeAds}
//                       onChange={handleAdsChange}
//                       placeholder="Pilih Tipe Iklan"
//                       isClearable={false}
//                       styles={{
//                         control: (base) => ({
//                           ...base,
//                           backgroundColor: "#FFFFFF00 !important",
//                           border: "0.5px solid #d8dfe7 !important",
//                           borderColor: "#d8dfe7 !important",
//                           boxShadow: "none",
//                           "&:hover": {
//                             border: "0.5px solid #d8dfe7 !important",
//                             boxShadow: "none",
//                           },
//                           "&:focus": {
//                             border: "0.5px solid #d8dfe7 !important",
//                             boxShadow: "none",
//                           },
//                           "&:active": {
//                             border: "0.5px solid #d8dfe7 !important",
//                             boxShadow: "none",
//                           },
//                           padding: "0.6px 4px",
//                         }),
//                       }}
//                     />
//                   </div>
//                   <div className="custom-filter-salesClassification">
//                     <Select
//                       isMulti
//                       options={typeClasificationOptions}
//                       value={selectedClassificationOption}
//                       onChange={handleClassificationChange}
//                       placeholder="Filter Klasifikasi"
//                       styles={{
//                         control: (base) => ({
//                           ...base,
//                           backgroundColor: "#FFFFFF00 !important",
//                           border: "0.5px solid #d8dfe7 !important",
//                           borderColor: "#d8dfe7 !important",
//                           boxShadow: "none",
//                           "&:hover": {
//                             border: "0.5px solid #d8dfe7 !important",
//                             boxShadow: "none",
//                           },
//                           "&:focus": {
//                             border: "0.5px solid #d8dfe7 !important",
//                             boxShadow: "none",
//                           },
//                           "&:active": {
//                             border: "0.5px solid #d8dfe7 !important",
//                             boxShadow: "none",
//                           },
//                           padding: "0.6px 4px",
//                         }),
//                         multiValue: (base) => ({
//                           ...base,
//                           backgroundColor: "#F9DBBF",
//                         }),
//                       }}
//                     />
//                   </div>
//                 </div>
//                 <div id="container-other-filters-right">
//                   <button
//                     className="btn btn-secondary dropdown-toggle w-100"
//                     type="button"
//                     onClick={() => setShowTableColumn(!showTableColumn)}
//                     style={{ backgroundColor: "#8042D4", border: "none" }}
//                   >
//                     Pilih kriteria
//                   </button>
//                 </div>
//               </div>
//               {showTableColumn && (
//                 <div className="border px-2 py-2 rounded">
//                   {allColumns.map((col) => (
//                     <div key={col.key} className="form-check form-check-inline">
//                       <input
//                         style={{
//                           border: "1px solid #8042D4",
//                           width: "18px",
//                           height: "18px",
//                           borderRadius: "10%",
//                         }}
//                         className="form-check-input "
//                         type="checkbox"
//                         checked={selectedColumns.includes(col.key)}
//                         onChange={() => handleColumnChange(col.key)}
//                       />
//                       {
//                         col.label ? (
//                           <span className="text-secondary" style={{ fontSize: "12px" }}>
//                             {col.label}
//                           </span>
//                         ) : (
//                           <span className="text-secondary" style={{ fontSize: "12px" }}>
//                             Detail
//                           </span>
//                         )
//                       }
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//             <div className="table-responsive"
              
//             >
//               <table className="table table-centered">
//                 <thead className="table-light">
//                   <tr>
//                     {filteredData.length !== 0 && filteredData !== null && <th scope="col">No</th>}
//                     {allColumns
//                       .filter((col) => selectedColumns.includes(col.key))
//                       .map((col) => (
//                         <th key={col.key}>
//                           <div className="d-flex justify-content-start align-items-center">
//                             {col.label}
//                           </div>
//                         </th>
//                       ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {paginatedData.length !== 0 && paginatedData !== null ? (
//                     paginatedData?.map((entry, index) => (
//                       <>
//                         <tr key={entry.campaign.campaign_id}>
//                           {filteredData.length > 0 && filteredData !== null && (
//                             <td>{index + 1}</td>
//                           )}
//                           {selectedColumns.includes("info_iklan") && (
//                             <td
//                               className="d-flex gap-2"
//                               style={{
//                                 width: "400px",
//                                 maxWidth: "400px",
//                                 cursor: "pointer",
//                                 color:
//                                 selectedProduct?.campaign.campaign_id === entry.campaign.campaign_id
//                                   ? "#F6881F"
//                                   : "",
//                               }}
//                               onClick={() => handleProductClick(entry)}
//                             >
//                                 <img
//                                   src={
//                                     "https://down-id.img.susercontent.com/file/" +
//                                     entry.image
//                                   }
//                                   alt={entry.title}
//                                   className="rounded"
//                                   style={{ width: "60px", height: "60px" }}
//                                 />
//                               <div className="d-flex flex-column">
//                                 <span>{entry.title}</span>
//                                 <span style={{ fontSize: "11px" }}>
//                                   Tidak terbatas
//                                 </span>
//                                 <div className="d-flex gap-1 align-items-center">
//                                   <div
//                                     className={`marker ${entry.state === "ongoing"
//                                         ? "animated-circle"
//                                         : ""
//                                       }`}
//                                     style={{
//                                       backgroundColor:
//                                         entry.state === "ongoing"
//                                           ? "#00EB3FFF"
//                                           : "#F6881F",
//                                     }}
//                                   ></div>
//                                   <span
//                                     style={{
//                                       fontSize: "14px",
//                                       color:
//                                         entry.state === "ongoing"
//                                           ? "#00D138FF"
//                                           : "#F6881F",
//                                     }}
//                                   >
//                                     {entry.state === "ongoing"
//                                       ? "Berjalan"
//                                       : "Nonaktif"}
//                                   </span>
//                                 </div>
//                               </div>
//                             </td>
//                           )}
//                           {selectedColumns.includes("biaya") && (
//                             <td style={{ width: "200px" }}>
//                               <div className="d-flex flex-column">
//                                 <span>
//                                   Rp {convertBudgetToIDR(entry.campaign.daily_budget)}
//                                 </span>
//                                 <span className="text-success" style={{ fontSize: "10px" }}>
//                                   +12.7%
//                                 </span>
//                               </div>
//                             </td>
//                           )}
//                           {selectedColumns.includes("iklan_dilihat") && (
//                             <td style={{ width: "200px" }}>
//                               <div className="d-flex flex-column">
//                                 <span>{entry.report.impression}</span>
//                                 <span className="text-danger" style={{ fontSize: "10px" }}>
//                                   -102.7%
//                                 </span>
//                               </div>
//                             </td>
//                           )}
//                           {selectedColumns.includes("click") && (
//                             <td style={{ width: "200px" }}>
//                               <div className="d-flex flex-column">
//                                 <span>{entry.report.click}</span>
//                                 <span className="text-danger" style={{ fontSize: "10px" }}>
//                                   -102.7%
//                                 </span>
//                               </div>
//                             </td>
//                           )}
//                           {selectedColumns.includes("ctr") && (
//                             <td style={{ width: "200px" }}>
//                               <div className="d-flex flex-column">
//                                 <span>{entry.report.ctr}</span>
//                                 <span className="text-danger" style={{ fontSize: "10px" }}>
//                                   -102.7%
//                                 </span>
//                               </div>
//                             </td>
//                           )}
//                           {selectedColumns.includes("acos") && (
//                             <td style={{ width: "200px" }}>
//                               <div className="d-flex flex-column">
//                                 <span>{entry.report.broad_cir}</span>
//                                 <span className="text-danger" style={{ fontSize: "10px" }}>
//                                   -102.7%
//                                 </span>
//                               </div>
//                             </td>
//                           )}
//                           {selectedColumns.includes("cpc") && (
//                             <td style={{ width: "200px" }}>
//                               <div className="d-flex flex-column">
//                                 <span>{entry.report.cpc}</span>
//                                 <span className="text-danger" style={{ fontSize: "10px" }}>
//                                   -102.7%
//                                 </span>
//                               </div>
//                             </td>
//                           )}
//                           {selectedColumns.includes("convertion") && (
//                             <td style={{ width: "200px" }}>
//                               <div className="d-flex flex-column">
//                                 <span>{entry.report.checkout}</span>
//                                 <span className="text-danger" style={{ fontSize: "10px" }}>
//                                   -102.7%
//                                 </span>
//                               </div>
//                             </td>
//                           )}
//                           {selectedColumns.includes("classification") &&
//                             (index === 0 ? (
//                               <td style={{ width: "200px" }}>
//                                 <div className="d-flex gap-1 align-items-center">
//                                   <div
//                                     className="marker"
//                                     style={{
//                                       backgroundColor: "#007BFF",
//                                     }}
//                                   ></div>
//                                   <span
//                                     style={{
//                                       fontSize: "14px",
//                                     }}
//                                   >
//                                     Middle Moving
//                                   </span>
//                                 </div>
//                               </td>
//                             ) : (
//                               <td style={{ width: "200px" }}>
//                                 <span> </span>
//                               </td>
//                             ))}
//                           {selectedColumns.includes("insight") && (
//                             <td style={{ width: "200px" }}>
//                               <span>
//                                 {entry.bidding
//                                   ? entry.bidding > 5
//                                     ? "Tambahkan Bidding"
//                                     : "Turunkan Bidding"
//                                   : ""}
//                               </span>
//                             </td>
//                           )}
//                           {selectedColumns.includes("custom_roas") && (
//                             <td style={{ width: "200px" }}>
//                               <input
//                                 type="number"
//                                 className="form-control mb-1"
//                                 placeholder="0"
//                                 style={{ width: "100px", height: "30px" }}
//                               />
//                               <button
//                                 className="btn btn-primary"
//                                 style={{
//                                   backgroundColor: "#8042D4",
//                                   border: "none",
//                                   width: "100px",
//                                   padding: "5px 0px",
//                                   fontSize: "12px",
//                                 }}
//                                 onClick={() => alert("Custom Roas saved")}
//                               >
//                                 Simpan
//                               </button>
//                             </td>
//                           )}
//                           {selectedColumns.includes("detail") && (
//                           <td style={{ width: "200px" }}>
//                             {
//                               entry.type === "product_gmv_max_roas" ? (
//                                 <Link to={"/dashboard/performance/ads/detailROAS"}>
//                                   roas
//                                   <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24"><path fill="currentColor" d="m16 8.4l-8.9 8.9q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7L14.6 7H7q-.425 0-.712-.288T6 6t.288-.712T7 5h10q.425 0 .713.288T18 6v10q0 .425-.288.713T17 17t-.712-.288T16 16z"></path></svg>
//                                 </Link>
//                               ) : entry.type === "product_manual" ? (
//                                 entry?.manual_product_ads?.product_placement === "search_product" ? (
//                                   <Link to={"/dashboard/performance/ads/detail"}>
//                                     se
//                                     <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24"><path fill="currentColor" d="m16 8.4l-8.9 8.9q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7L14.6 7H7q-.425 0-.712-.288T6 6t.288-.712T7 5h10q.425 0 .713.288T18 6v10q0 .425-.288.713T17 17t-.712-.288T16 16z"></path></svg>
//                                   </Link>
//                                 ) : entry?.manual_product_ads?.product_placement === "targeting" ? (
//                                   <Link to={"/dashboard/performance/ads/detailRECOM"}>
//                                     re
//                                     <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24"><path fill="currentColor" d="m16 8.4l-8.9 8.9q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7L14.6 7H7q-.425 0-.712-.288T6 6t.288-.712T7 5h10q.425 0 .713.288T18 6v10q0 .425-.288.713T17 17t-.712-.288T16 16z"></path></svg>
//                                   </Link>
//                                 ) : (
//                                   <span></span>
//                                 )
//                               ) : (
//                                 <span></span>
//                               )
//                             }
//                           </td>
//                         )}
//                         </tr>
//                       </>
//                     ))
//                   ) : (
//                     <div className="w-100 d-flex justify-content-center">
//                       <span>Data tidak tersedia</span>
//                     </div>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//             {filteredData.length > 0 && filteredData !== null && renderPagination()}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AdsTable;