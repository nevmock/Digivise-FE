import React, { useState, useEffect, useCallback, useRef } from "react";
import * as echarts from "echarts";
import Calendar from "react-calendar";
import Select from "react-select";
import toast from "react-hot-toast";
import { FaAngleLeft, FaAngleRight, FaAngleDown, FaAngleUp } from "react-icons/fa6";

import { useAuth } from "../../context/Auth";
import convertStatusToLabel from "../../utils/convertStatusToLabel";
import axiosRequest from "../../utils/request";
import stockJsonData from "../../api/stock.json";
import useDebounce from "../../hooks/useDebounce";
import BaseLayout from "../../components/organisms/BaseLayout";
import iconArrowUp from "../../assets/icon/arrow-up.png";
import iconArrowDown from "../../assets/icon/arrow-down.png";
import Loading from "../../components/atoms/Loading/Loading";


export default function PerformanceStockPage() {
  const { activeMerchant } = useAuth();
  // Data
  const [rawData, setRawData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const chartRef = useRef(null);
  const userData = JSON.parse(localStorage.getItem("userDataApp"));
  const shopId = userData?.merchants[0]?.merchantShopeeId || "252234165";
  const [variantsChartData, setVariantsChartData] = useState([]);
  // Filter
  const [date, setDate] = useState(getAllDaysInLast7Days());
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [statusProductStockFilter, setStatusProductStockFilter] =
    useState("all");
  const [showTableColumn, setShowTableColumn] = useState(false);
  const [selectedClassificationOption, setSelectedClassificationOption] =
    useState([]);
  const [expandedVariantProduct, setExpandedVariantProduct] = useState({});
  const [sortOrderData, setSortOrderData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [paginatedData, setPaginatedData] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  // Other
  const [showCalendar, setShowCalendar] = useState(false);
  const [animateCalendar, setAnimateCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isContentLoading, setIsContentLoading] = useState(false);



  // const merchantData = activeMerchant;
  // if (!merchantData) {
  //   return (
  //     <BaseLayout>
  //       <div className="alert alert-warning">
  //         Tidak ada merchant aktif. Silahkan buat merchant atau login ke merchant terlebih dahulu.
  //       </div>
  //     </BaseLayout>
  //   );
  // };

  const fetchData = async (fromDate, toDate) => {
    // console.log(`Awal data for from ${fromDate} to ${toDate}`);
    const isInitialLoad = !rawData.length;
    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsContentLoading(true);
    }

    const toLocalISOString = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");

      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    try {
      const fromISO =
        fromDate instanceof Date
          ? toLocalISOString(fromDate)
          : toLocalISOString(new Date(fromDate));

      const toISO =
        toDate instanceof Date
          ? toLocalISOString(toDate)
          : toLocalISOString(new Date(toDate));

      // console.log(`Fetching data from ${fromISO} to ${toISO} for shopId: ${shopId}`);

      const apiUrl = `/api/product-stock/by-shop?shopId=${shopId}&from=${fromISO}&to=${toISO}&limit=100000000`;
      // const response = stockJsonData;
      const response = await axiosRequest.get(apiUrl);
      const data = response.data;
      const content = data.content || [];
      setRawData(content);
      setFilteredData(content);
      setTotalPages(data.totalPages || 1);

      return content;
    } catch (error) {
      toast.error("Gagal mengambil data stock produk");
      console.error(
        "Gagal mengambil data stock produk, kesalahan pada server:",
        error
      );
      return [];
    } finally {
      setIsLoading(false);
      setIsContentLoading(false);
    }
  };



  // CUSTOM CHART WITH FILTER DATE & CLICK PRODUCT FEATURE
  // Helper function to get latest stock data
  const getLatestStockData = (product) => {
    if (!product.data || product.data.length === 0) return null;
    return product.data.reduce((latest, current) =>
      new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
    );
  };

  // Handle product click by clicking the product in name column
  const handleProductClick = (product) => {
    setSelectedProduct((prev) => (prev?.productId === product.productId ? null : product));
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
      (_, i) =>
        `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(
          2,
          "0"
        )}`
    );
  };

  // Date utility for getting all hourly intervals for a given date
  function getHourlyIntervals(selectedDate) {
    return Array.from({ length: 24 }, (_, i) => {
      const hour = String(i).padStart(2, "0");
      return `${selectedDate} ${hour}:00`;
    });
  };

  // Complete rewrite of generateChartData function
  function generateChartData(selectedDate = null, product = null) {
    let timeIntervals = [];
    let mode = "daily";
    let fromDate, toDate;
    let isSingleDay = false;

    // Properly declare result object
    let result = {};

    // Helper function untuk get date string tanpa timezone conversion
    const getLocalDateString = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Determine time intervals based on date selection
    if (selectedDate === null || Array.isArray(selectedDate)) {
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
      timeIntervals = [new Date().toISOString().split("T")[0]];
      fromDate = new Date();
      toDate = new Date();
      toDate.setHours(23, 59, 59, 999);
    }

    result.timeIntervals = timeIntervals;
    result.isSingleDay = isSingleDay;

    let chartDataProducts = rawData || [];
    if (product) {
      chartDataProducts = rawData.filter((p) => p.productId === product.productId);
    }

    let dataMap = {};

    // Initialize dataMap with time intervals
    timeIntervals.forEach((time) => {
      dataMap[time] = 0;
    });

    chartDataProducts?.forEach((productItem) => {
      if (!productItem.data || productItem.data.length === 0) return;

      if (isSingleDay) {
        // For single day, aggregate hourly data
        productItem.data.forEach((stockData) => {
          if (!stockData || !stockData.createdAt) return;

          const createdAt = new Date(stockData.createdAt);
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
            if (stockValue !== undefined && stockValue !== null) {
              dataMap[hourOnlyKey] += Number(stockValue);
            }
          }
        });
      } else {
        const dataByDate = {};

        productItem.data.forEach((stockData) => {
          console.log("Processing stock data:", stockData);
          if (!stockData || !stockData.createdAt) return;

          const createdAt = new Date(stockData.createdAt);
          const productYear = createdAt.getFullYear();
          const productMonth = String(createdAt.getMonth() + 1).padStart(2, "0");
          const productDay = String(createdAt.getDate()).padStart(2, "0");
          const dateDayKey = `${productYear}-${productMonth}-${productDay}`;

          const productDateStr = getLocalDateString(createdAt);
          const filterStartStr = Array.isArray(selectedDate)
            ? selectedDate[0]
            : getLocalDateString(fromDate);
          const filterEndStr = Array.isArray(selectedDate)
            ? selectedDate[selectedDate.length - 1]
            : getLocalDateString(toDate);

          if (productDateStr >= filterStartStr && productDateStr <= filterEndStr) {
            if (!dataByDate[dateDayKey] ||
              new Date(dataByDate[dateDayKey].createdAt) < createdAt) {
              dataByDate[dateDayKey] = stockData;
            }
          }
        });

        // Map the latest data to chart data
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

    // Create chart data array
    const chartDataArray = timeIntervals.map((time) => ({
      date: time,
      totalStock: dataMap[time] || 0
    }));

    return chartDataArray;
  };

  // Generate chart data for variants
  function generateVariantsChartData(selectedDate = null, product = null) {
    if (!product) return [];

    let timeIntervals = [];
    let mode = "daily";
    let variantsData = [];

    // Helper function untuk get date string
    const getLocalDateString = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Determine time intervals based on selected date
    if (selectedDate === null || Array.isArray(selectedDate)) {
      timeIntervals = getAllDaysInLast7Days();
    } else if (selectedDate === "Bulan Ini") {
      timeIntervals = getAllDaysInAMonth();
    } else {
      timeIntervals = getHourlyIntervals(selectedDate);
      mode = "hourly";
    }

    // Use rawData instead of raw data
    const selectedProductData = rawData.find((p) => p.productId === product.productId);
    if (!selectedProductData || !selectedProductData.data) return [];
    const allVariants = new Map();

    selectedProductData.data.forEach((stockData) => {
      if (stockData.variants) {
        stockData.variants.forEach((variant) => {
          if (!allVariants.has(variant.id)) {
            allVariants.set(variant.id, {
              id: variant.id,
              name: variant.name
            });
          }
        });
      }
    });

    allVariants.forEach((variantInfo) => {
      let variantStockMap = {};

      // Initialize with 0 to ensure all time intervals are present
      timeIntervals.forEach((time) => {
        variantStockMap[time] = 0;
      });

      if (mode === "hourly") {
        selectedProductData.data.forEach((stockData) => {
          if (!stockData || !stockData.createdAt || !stockData.variants) return;

          const createdAt = new Date(stockData.createdAt);
          const productDateStr = getLocalDateString(createdAt);

          // For hourly, we need to match the selected date
          const filterDate = Array.isArray(selectedDate) ? selectedDate[0] : selectedDate;
          const filterDateStr = getLocalDateString(new Date(filterDate));

          if (productDateStr === filterDateStr) {
            const hourKey = String(createdAt.getHours()).padStart(2, "0");
            const timeKey = `${productDateStr} ${hourKey}:00`;

            // Find this variant in current stockData
            const currentVariant = stockData.variants.find(v => v.id === variantInfo.id);

            if (currentVariant && timeIntervals.includes(timeKey)) {
              variantStockMap[timeKey] = currentVariant.stock || 0;
            }
          }
        });
      } else {
        const dataByDate = {};

        selectedProductData.data.forEach((stockData) => {
          if (!stockData || !stockData.createdAt || !stockData.variants) return;

          const createdAt = new Date(stockData.createdAt);
          const productYear = createdAt.getFullYear();
          const productMonth = String(createdAt.getMonth() + 1).padStart(2, "0");
          const productDay = String(createdAt.getDate()).padStart(2, "0");
          const dateDayKey = `${productYear}-${productMonth}-${productDay}`;

          const productDateStr = getLocalDateString(createdAt);
          const filterStartStr = Array.isArray(selectedDate) ? selectedDate[0] : timeIntervals[0];
          const filterEndStr = Array.isArray(selectedDate) ? selectedDate[selectedDate.length - 1] : timeIntervals[timeIntervals.length - 1];

          if (productDateStr >= filterStartStr && productDateStr <= filterEndStr) {
            // Get latest data for each day
            if (!dataByDate[dateDayKey] ||
              new Date(dataByDate[dateDayKey].createdAt) < createdAt) {
              dataByDate[dateDayKey] = stockData;
            }
          }
        });

        // Map the latest data to variant chart data
        Object.keys(dataByDate).forEach((dateDayKey) => {
          const stockData = dataByDate[dateDayKey];

          if (timeIntervals.includes(dateDayKey) && stockData.variants) {
            const currentVariant = stockData.variants.find(v => v.id === variantInfo.id);

            if (currentVariant) {
              variantStockMap[dateDayKey] = currentVariant.stock || 0;
            }
          }
        });
      }

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

  const handleDateSelection = (selectedDate, close = true) => {
    setDate(selectedDate);
    if (close) {
      setShowCalendar(false);
    }

    let fromDate, toDate;

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

    fetchData(fromDate, toDate);
  };

  useEffect(() => {
    const newChartData = generateChartData(date, selectedProduct);
    setChartData(newChartData);

    if (selectedProduct) {
      const newVariantsChartData = generateVariantsChartData(date, selectedProduct);
      setVariantsChartData(newVariantsChartData);
    } else {
      setVariantsChartData([]);
    }
  }, [date, selectedProduct, rawData]);

  useEffect(() => {
    if (chartRef.current && chartData.length > 0) {
      let xAxisData = chartData.map((item) => item.date);
      let rotateAxisLabel = 0;

      const includesColon = xAxisData.some((item) => item.includes(":"));
      if (includesColon) {
        xAxisData = xAxisData.map((item) => item.split(" ")[1]);
      } else {
        xAxisData = xAxisData.map((item) => item.split("-").slice(1).join("-"));
      }

      if (xAxisData.length > 7 && !includesColon) {
        rotateAxisLabel = 25;
      }

      const chartInstance = echarts.init(chartRef.current);
      const series = [
        {
          name: selectedProduct ? selectedProduct.name : "Total Stock",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: chartData.map((item) => item.totalStock),
          lineStyle: { color: "#5470C6", width: 1.5 },
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
              width: 2,
              type: 'dashed'
            },
            emphasis: { focus: 'series' }
          });
        });
      }

      chartInstance.setOption({
        toolbox: { feature: { saveAsImage: {} } },
        grid: { left: 60, right: 50, bottom: selectedProduct ? 80 : 50, containLabel: false },
        tooltip: {
          trigger: "axis",
          formatter: function (params) {
            let result = `<strong>${params[0].axisValue}</strong><br/>`;
            params.forEach((param) => {
              result += `${param.seriesName}: <strong>${param.value}</strong> Stok<br/>`;
            });
            return result;
          },
          backgroundColor: 'rgba(50, 50, 50, 0.9)',
          borderColor: '#777',
          textStyle: { color: '#fff' }
        },
        legend: {
          data: series.map(s => s.name),
          bottom: 0,
          type: 'scroll',
        },
        xAxis: {
          type: "category",
          data: xAxisData,
          boundaryGap: false,
          axisLabel: {
            interval: 0,
            rotate: rotateAxisLabel,
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

      return () => chartInstance.dispose();
    }
  }, [chartData, variantsChartData, selectedProduct]);



  // FILTER COLUMNS FEATURE
  // Define all columns
  const allColumns = [
    { key: "name", label: "Nama" },
    { key: "stock", label: "Stok" },
    { key: "code", label: "Kode" },
    { key: "availability", label: "Availability" },
    { key: "status", label: "Status" },
    { key: "classification", label: "Sales Clasification" },
  ];

  // Initialize selected columns state
  const [selectedColumns, setSelectedColumns] = useState(
    allColumns.map((col) => col.key)
  );

  // Toggle row to show variant
  const toggleRow = useCallback((productId) => {
    setExpandedVariantProduct((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  }, []);

  // Handle column change
  const handleColumnChange = (colKey) => {
    setSelectedColumns((prev) =>
      prev.includes(colKey)
        ? prev.filter((key) => key !== colKey)
        : [...prev, colKey]
    );
  };



  // SALES CLASSIFICATION ADS FEATURE
  // Define sales classification options
  const typeClasificationOptions = [
    { value: "best_seller", label: "Best Seller" },
    { value: "middle_moving", label: "Middle Moving" },
    { value: "slow_moving", label: "Slow Moving" },
  ];

  // Handle sales classification change by selected options
  const handleClassificationChange = (selectedOptions) => {
    setSelectedClassificationOption(selectedOptions);
  };

  useEffect(() => {
    let filtered = rawData;

    // Filter by search term
    if (debouncedSearchTerm !== "") {
      filtered = filtered.filter((entry) =>
        entry.name
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusProductStockFilter !== "all") {
      filtered = filtered.filter(
        (entry) => entry.state === statusProductStockFilter
      );
    }

    // Filter by classification options
    if (selectedClassificationOption.length > 0) {
      const classificationValues = selectedClassificationOption.map(
        (option) => option.value
      );
      filtered = filtered.filter((entry) => {
        const latestData = getLatestStockData(entry);
        const entryClassification = latestData?.classification;
        return classificationValues.includes(entryClassification);
      });
    }

    setCurrentPage(1);
    setFilteredData(filtered);
  }, [
    debouncedSearchTerm,
    statusProductStockFilter,
    selectedClassificationOption,
    rawData,
  ]);



  // SORTING STOCK FEATURE
  // Handle sort stock by asc or desc
  const handleSortStock = (order) => {
    if (sortOrderData === order) {
      setSortOrderData(null);
      setFilteredData([...rawData]);
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



  // PAGINATION FEATURE
  const getVisiblePageNumbers = () => {
    const pages = [];

    // Jika total halaman <= 10, tampilkan semua
    if (totalPages <= 10) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Jika halaman saat ini di awal (1-3)
    if (currentPage <= 3) {
      pages.push(1, 2, 3);
      if (totalPages > 4) {
        pages.push("...");
        pages.push(totalPages - 1, totalPages);
      }
    }
    // Jika halaman saat ini di akhir (3 halaman terakhir)
    else if (currentPage >= totalPages - 2) {
      pages.push(1, 2);
      if (totalPages > 4) {
        pages.push("...");
      }
      pages.push(totalPages - 2, totalPages - 1, totalPages);
    }
    // Jika halaman saat ini di tengah
    else {
      pages.push(1, 2);
      pages.push("...");
      pages.push(currentPage - 1, currentPage, currentPage + 1);
      pages.push("...");
      pages.push(totalPages - 1, totalPages);
    }

    return pages;
  };

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

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {ad
    const newItemsPerPage = parseInt(e.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Render pagination component to render by visible pages
  const renderPagination = () => {
    const visiblePages = getVisiblePageNumbers();
    const showFirstLastButtons = totalPages > 10;
    const getWidthWindow = window.innerWidth;

    return (
      <div className="custom-container-pagination mt-3">
        <div className="custom-pagination-select d-flex align-items-center gap-2">
          <span
            style={{
              display: `${getWidthWindow < 768 ? "none" : "block"}`,
            }}
          >
            Tampilan
          </span>
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
          <ul
            className="pagination mb-0"
            style={{
              gap: `${totalPages < 10 ? "1rem" : ""}`,
            }}
          >
            {totalPages >= 10 && getWidthWindow >= 768 ? (
              <>
                {/* First page button (hanya muncul jika > 10 halaman) */}
                {showFirstLastButtons && (
                  <li
                    className={`page-item ${currentPage === 1 ? "disabled" : ""
                      }`}
                  >
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
                <li
                  className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                >
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
                  if (page === "...") {
                    return (
                      <li
                        key={`ellipsis-${index}`}
                        className="page-item disabled"
                      >
                        <span className="page-link">...</span>
                      </li>
                    );
                  }

                  return (
                    <li
                      key={page}
                      className={`page-item ${currentPage === page ? "active" : ""
                        }`}
                    >
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
                <li
                  className={`page-item ${currentPage === totalPages ? "disabled" : ""
                    }`}
                >
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
                  <li
                    className={`page-item ${currentPage === totalPages ? "disabled" : ""
                      }`}
                  >
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
                    <li
                      className={`page-item ${currentPage === 1 ? "disabled" : ""
                        }`}
                    >
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
                  <li
                    className={`page-item ${currentPage === 1 ? "disabled" : ""
                      }`}
                  >
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
                    if (page === "...") {
                      return (
                        <li
                          key={`ellipsis-${index}`}
                          className="page-item disabled"
                        >
                          <span className="page-link">...</span>
                        </li>
                      );
                    }

                    return (
                      <li
                        key={page}
                        className={`page-item ${currentPage === page ? "active" : ""
                          }`}
                      >
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
                  <li
                    className={`page-item ${currentPage === totalPages ? "disabled" : ""
                      }`}
                  >
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
                    <li
                      className={`page-item ${currentPage === totalPages ? "disabled" : ""
                        }`}
                    >
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
            )}
          </ul>
        </nav>
      </div>
    );
  };


  // Initial data loading
  useEffect(() => {
    // Load initial data for last 7 days
    const today = new Date();
    const fromDate = new Date();
    fromDate.setDate(today.getDate() - 7);
    const toDate = new Date();
    toDate.setHours(23, 59, 59, 999);

    fetchData(fromDate, toDate);
  }, []);

  return (
    <>
      <BaseLayout>
        <div className="d-flex flex-column gap-1">
          <div className="d-flex align-items-center">
            <h3>Peforma stock</h3>
          </div>
          {
            isLoading ? (
              <div className="d-flex justify-content-center align-items-start vh-100">
                <Loading size={40} />
              </div>
            ) : (
              <div className="card">
                <div className="card-body">
                  {/* Header & Date Filter */}
                  <div className="d-flex justify-content-between align-items-start pb-1">
                    <h5>{rawData.length} total produk</h5>
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={() => setShowCalendar(!showCalendar)}
                        className="btn btn-primary"
                      >
                        {date === null
                          ? "Pilih tanggal"
                          : Array.isArray(date)
                            ? "1 Minggu terakhir"
                            : date === "Bulan Ini"
                              ? "Bulan ini"
                              : date}
                      </button>
                      {showCalendar && (
                        <div
                          className="d-flex custom-calendar-behavior-v2"
                          style={{
                            position: "absolute",
                            top: "40px",
                            right: "0",
                            zIndex: 1000,
                            background: "white",
                            boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
                            borderRadius: "8px",
                            padding: "10px 10px",
                          }}
                        >
                          <div
                            className="custom-content-calendar-v2 d-flex flex-column py-2 px-1"
                            style={{ width: "130px", listStyleType: "none" }}
                          >
                            <p
                              className="mb-2 cursor-pointer"
                              onClick={() => handleDateSelection(new Date().toISOString().split("T")[0])}
                              style={{ cursor: 'pointer' }}
                            >
                              Hari ini
                            </p>
                            <p
                              className="mb-2 cursor-pointer"
                              onClick={() => {
                                const yesterday = new Date();
                                yesterday.setDate(yesterday.getDate() - 1);
                                handleDateSelection(yesterday.toISOString().split("T")[0]);
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              Kemarin
                            </p>
                            <p
                              className="mb-2 cursor-pointer"
                              onClick={() => handleDateSelection(getAllDaysInLast7Days())}
                              style={{ cursor: 'pointer' }}
                            >
                              1 Minggu terakhir
                            </p>
                            <p
                              className="mb-0 cursor-pointer"
                              onClick={() => handleDateSelection("Bulan Ini")}
                              style={{ cursor: 'pointer' }}
                            >
                              Bulan ini
                            </p>
                          </div>
                          <div
                            id="custom-calendar-behavior-barrier-v2"
                            style={{
                              width: "1px",
                              height: "auto",
                              backgroundColor: "#E3E3E3FF",
                              margin: "10px 10px 0",
                            }}
                          ></div>
                          <Calendar
                            onChange={(selectedDate) => {
                              if (selectedDate instanceof Date) {
                                handleDateSelection(selectedDate.toISOString().split("T")[0]);
                              }
                              setShowCalendar(false);
                            }}
                            value={date === "Bulan Ini" ? new Date() : date}
                            maxDate={new Date()}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Chart */}
                  {isContentLoading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
                      <Loading size={40} />
                    </div>
                  ) : (
                    <>
                      <div
                        ref={chartRef}
                        style={{ width: "100%", height: "300px" }}
                        className="mb-2"
                      ></div>
                      {/* Filter & Table */}
                      <div className="d-flex flex-column gap-3 gap-md-2">
                        {/* Status filter */}
                        <div
                          className="d-flex align-items-center gap-1 gap-md-2 flex-wrap"
                          style={{ width: "fit-content", listStyleType: "none" }}
                        >
                          <span>Status Produk</span>
                          <div className="d-flex gap-1 gap-md-2 flex-wrap">
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
                                padding: "1px 12px",
                              }}
                            >
                              Berakhir
                            </div>
                          </div>
                        </div>
                        {/* Other filter*/}
                        <div className="d-flex flex-column mb-3 gap-2">
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
                                  className="form-check form-check-inline"
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
                                  <label className="form-check-label fs-5 ms-1">
                                    {col.label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Container table */}
                        <div className="table-responsive">
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
                                      <div className="d-flex justify-content-start gap-1 align-items-center">
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
                              {paginatedData.length > 0 ? (
                                paginatedData.map((entry) => {
                                  const latestStockData = getLatestStockData(entry);
                                  return (
                                    <>
                                      {/* <tr key={entry.id}> */}
                                      <tr key={entry.productId}>
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
                                              color: selectedProduct?.productId === latestStockData.productId ? "#F6881F" : "",
                                            }}
                                            onClick={() => handleProductClick(latestStockData)}
                                          >
                                            {latestStockData?.name || "-"}
                                          </td>
                                        )}

                                        {selectedColumns.includes("stock") && (
                                          <td>
                                            <div className="d-flex flex-column align-items-start">
                                              <span>{latestStockData?.totalAvailableStock || 0} Stok</span>
                                            </div>
                                          </td>
                                        )}

                                        {selectedColumns.includes("code") && (
                                          <td>{latestStockData?.productId || "-"}</td>
                                        )}

                                        {selectedColumns.includes("availability") && (
                                          <td>
                                            <span>
                                              {latestStockData?.availability || "-"}
                                            </span>
                                          </td>
                                        )}

                                        {selectedColumns.includes("status") && (
                                          <td>
                                            {
                                              latestStockData.state != null ? <span className="">{convertStatusToLabel(latestStockData.state)}</span> : "-"
                                            }
                                          </td>
                                        )}

                                        {selectedColumns.includes("classification") && (
                                          <td>
                                            <span>{latestStockData?.classification || "-"}</span>
                                          </td>
                                        )}
                                      </tr>
                                      {expandedVariantProduct[latestStockData.productId] && (
                                        latestStockData?.variants && latestStockData.variants.length > 0 ? (
                                          <tr className="bg-light">
                                            <td
                                              colSpan={selectedColumns.length + 1}
                                              style={{ padding: "4px 4px", border: "none" }}
                                            >
                                              <ul className="list-group">
                                                {latestStockData.variants.map((variant) => (
                                                  <li
                                                    key={variant.id}
                                                    className="list-group-item d-flex justify-content-start gap-2"
                                                  >
                                                    <span style={{ width: "8px" }}></span>
                                                    <span style={{ width: "388px" }}>
                                                      {variant.name}
                                                    </span>
                                                    <span>{variant.stock || 0} Stok</span>
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
                                    </>
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
                        {/* Pagination */}
                        {filteredData.length > 0 &&
                          filteredData !== null &&
                          renderPagination()}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          }
        </div>
      </BaseLayout>
    </>
  );
};