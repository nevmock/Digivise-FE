import { useState, useEffect, useCallback, useRef } from "react";
import * as echarts from "echarts";
import Calendar from "react-calendar";
import Select from "react-select";
import toast from "react-hot-toast";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";

import { useAuth } from "../../context/Auth";
import axiosRequest from "../../utils/request";
import stockJsonData from "../../api/stock.json";
import useDebounce from "../../hooks/useDebounce";
import BaseLayout from "../../components/organisms/BaseLayout";
import iconArrowUp from "../../assets/icon/arrow-up.png";
import iconArrowDown from "../../assets/icon/arrow-down.png";
import Loading from "../../components/atoms/Loading/Loading"


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
  const [classificationFilter, setClassificationFilter] = useState([]);
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
  const [showCalender, setShowCalender] = useState(false);
  const [animateCalendar, setAnimateCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isContentLoading, setIsContentLoading] = useState(false);



  const merchantData = activeMerchant;
  if (!merchantData) {
    return (
      <BaseLayout>
        <div className="alert alert-warning">
          Tidak ada merchant aktif. Silahkan buat merchant atau login ke merchant terlebih dahulu.
        </div>
      </BaseLayout>
    );
  };

  const fetchData = async (fromDate, toDate) => {
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

      const apiUrl = `/api/product-ads/daily?shopId=${shopId}&from=${fromISO}&to=${toISO}&limit=10000`;
      console.log("Fetching data from API:", apiUrl);
      // const apiUrl = `/api/product-ads/daily?shopId=${shopId}&from=2025-06-04T00:00:00.869&to=2025-06-04T23:59:59.99900&limit=10&biddingStrategy=manual`;
      const response = await axiosRequest.get(apiUrl);
      const data = await response.data;
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
    // Get latest data point based on createdAt
    return product.data.reduce((latest, current) => 
      new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
    );
  };

  // Handle product click by clicking the product in name column
  const handleProductClick = (product) => {
    setSelectedProduct((prev) => (prev?.id === product.id ? null : product));
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

    // Filter data based on selected product
    let chartDataProducts = rawData || [];
    if (product) {
      chartDataProducts = rawData.filter((p) => p.id === product.id);
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
            const stockValue = stockData.total_available_stock;
            if (stockValue !== undefined && stockValue !== null) {
              dataMap[hourOnlyKey] += Number(stockValue);
            }
          }
        });
      } else {
        // For multiple days, get latest data per day
        const dataByDate = {};
        
        productItem.data.forEach((stockData) => {
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
            // Get latest data for each day
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
            const stockValue = stockData.total_available_stock;
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

    // Determine time intervals
    if (selectedDate === null || Array.isArray(selectedDate)) {
      timeIntervals = getAllDaysInLast7Days();
    } else if (selectedDate === "Bulan Ini") {
      timeIntervals = getAllDaysInAMonth();
    } else {
      timeIntervals = getHourlyIntervals(selectedDate);
      mode = "hourly";
    }

    // Use rawData instead of stockJsonData
    const selectedProductData = rawData.find((p) => p.id === product.id);

    if (selectedProductData && selectedProductData.data) {
      // Get latest stock data with variants
      const latestStockData = getLatestStockData(selectedProductData);
      
      if (latestStockData && latestStockData.variants) {
        // Variants structure
        latestStockData.variants.forEach((variant) => {
          let variantStockMap = {};

          timeIntervals.forEach((time) => {
              variantStockMap[time] = 0;
          });

          // Use createdAt instead of epoch conversion
          const stockDate = new Date(latestStockData.createdAt);
          const dateKey = mode === "hourly" 
            ? `${stockDate.getFullYear()}-${String(stockDate.getMonth() + 1).padStart(2, "0")}-${String(stockDate.getDate()).padStart(2, "0")} ${String(stockDate.getHours()).padStart(2, "0")}:00`
            : `${stockDate.getFullYear()}-${String(stockDate.getMonth() + 1).padStart(2, "0")}-${String(stockDate.getDate()).padStart(2, "0")}`;

          if (variantStockMap[dateKey] !== undefined) {
            variantStockMap[dateKey] = variant.stock || 0;
          }

          const variantData = {
            name: variant.name,
            id: variant.id,
            data: timeIntervals.map((time) => ({
              date: time,
              totalStock: variantStockMap[time],
            })),
          };

          variantsData.push(variantData);
        });
      }
    }

    return variantsData;
  };

  // Handle date selection
  const handleDateSelection = (selectedDate, close = true) => {
    setDate(selectedDate);
    if (close) {
      setShowCalender(false);
    }

    // Determine date range for API call
    let fromDate, toDate;
    
    if (Array.isArray(selectedDate)) {
      // Last 7 days
      fromDate = new Date(selectedDate[0]);
      toDate = new Date(selectedDate[selectedDate.length - 1]);
      toDate.setHours(23, 59, 59, 999);
    } else if (selectedDate === "Bulan Ini") {
      // Current month
      const today = new Date();
      fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
      toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      toDate.setHours(23, 59, 59, 999);
    } else {
      // Single day
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

  // useEffect(() => {
  //   setChartData(generateChartData(date, selectedProduct));
  //   if (selectedProduct) {
  //     setVariantsChartData(generateVariantsChartData(date, selectedProduct));
  //   } else {
  //     setVariantsChartData([]);
  //   }
  // }, [date, selectedProduct]);

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
          rotateAxisLabel = 45;
      }

      const chartInstance = echarts.init(chartRef.current);

      const series = [
        {
          name: selectedProduct ? selectedProduct.name : "Total Stock",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: chartData.map((item) => item.totalStock),
          lineStyle: { color: "#5470C6" },
        },
      ];

      // Add variant series if we have a selected product
      if (selectedProduct && variantsChartData.length > 0) {
        variantsChartData.forEach((variant, index) => {
          const colors = ["#91CC75", "#FAC858", "#EE6666", "#73C0DE", "#3BA272"];
          series.push({
            name: variant.name,
            type: "line",
            smooth: true,
            showSymbol: false,
            data: variant.data.map((item) => item.totalStock),
            lineStyle: { color: colors[index % colors.length] },
          });
        });
      }

      chartInstance.setOption({
        toolbox: { feature: { saveAsImage: {} } },
        grid: { left: 50, right: 50, bottom: 50, containLabel: false },
        tooltip: {
          trigger: "axis",
          formatter: function (params) {
            let result = params[0].axisValue + "<br/>";
            params.forEach((param) => {
              result += param.seriesName + ": " + param.value + " Stok<br/>";
            });
            return result;
          },
        },
        legend: {
          data: series.map(s => s.name),
          bottom: 0
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
        },
        series: series,
      });

      return () => chartInstance.dispose();
    }
  }, [chartData, variantsChartData, selectedProduct]);

  // useEffect(() => {
  //   let xAxisData = chartData?.map((item) => item.date);
  //   let rotateAaxisLabel = 0;
  //   const includesColon = xAxisData?.some((item) => item.includes(":"));
  //   if (includesColon) {
  //     xAxisData = xAxisData?.map((item) => item.split(" ")[1]);
  //   } else {
  //     xAxisData = xAxisData?.map((item) => item.split("-").slice(1).join("-"));
  //   }

  //   if (xAxisData?.length > 7 && !includesColon) {
  //     rotateAaxisLabel = 45;
  //   }

  //   const chartInstance = echarts.init(chartRef.current);

  //   const series = [
  //     {
  //       name: selectedProduct ? selectedProduct.name : "Total Stock",
  //       type: "line",
  //       smooth: true,
  //       showSymbol: false,
  //       data: chartData.map((item) => item.totalStock),
  //       lineStyle: {
  //         color: "#5470C6",
  //       },
  //     },
  //   ];

  //   // Add variant series if we have a selected product
  //   if (selectedProduct && variantsChartData.length > 0) {
  //     variantsChartData.forEach((variant) => {
  //       series.push({
  //         name: variant.name,
  //         type: "line",
  //         smooth: true,
  //         showSymbol: false,
  //         data: variant.data.map((item) => item.totalStock),
  //         lineStyle: {
  //           color: "#B2B6BE",
  //         },
  //       });
  //     });
  //   }

  //   chartInstance.setOption({
  //     toolbox: { feature: { saveAsImage: {} } },
  //     grid: { left: 50, right: 50, bottom: 50, containLabel: false },
  //     tooltip: {
  //       trigger: "axis",
  //       formatter: function (params) {
  //         let result = params[0].axisValue + "<br/>";

  //         params.forEach((param) => {
  //           result += param.seriesName + ": " + param.value + " Stok<br/>";
  //         });

  //         return result;
  //       },
  //     },
  //     xAxis: {
  //       type: "category",
  //       data: xAxisData,
  //       boundaryGap: false,
  //       axisLabel: {
  //         interval: 0,
  //         rotate: rotateAaxisLabel,
  //       },
  //     },
  //     yAxis: {
  //       type: "value",
  //       splitLine: { show: true },
  //     },
  //     series: series,
  //   });

  //   return () => chartInstance.dispose();
  // }, [chartData, variantsChartData, selectedProduct]);



  // FILTER COLUMNS FEATURE
  // Define all columns
  const allColumns = [
    { key: "name", label: "Nama" },
    { key: "code", label: "Kode" },
    { key: "stock", label: "Stok" },
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
        entry.data[0].title
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusProductStockFilter !== "all") {
      filtered = filtered.filter(
        (entry) => entry.data[0].state === statusProductStockFilter
      );
    }

    // Filter by classification options
    if (selectedClassificationOption.length > 0) {
      const classificationValues = selectedClassificationOption.map(
        (option) => option.value
      );
      filtered = filtered.filter((entry) => {
        const entryClassification = entry.data[0].classification;
        return classificationValues.includes(entryClassification);
      });
    }

    setCurrentPage(1);
    setFilteredData(filtered);
  }, [
    debouncedSearchTerm,
    statusProductStockFilter,
    classificationFilter,
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
        const aStock = aLatestData?.total_available_stock || 0;
        const bStock = bLatestData?.total_available_stock || 0;
        
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
  const handleItemsPerPageChange = (e) => {
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
                    className={`page-item ${
                      currentPage === 1 ? "disabled" : ""
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
                      className={`page-item ${
                        currentPage === page ? "active" : ""
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
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
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
                    className={`page-item ${
                      currentPage === totalPages ? "disabled" : ""
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
                      className={`page-item ${
                        currentPage === 1 ? "disabled" : ""
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
                    className={`page-item ${
                      currentPage === 1 ? "disabled" : ""
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
                        className={`page-item ${
                          currentPage === page ? "active" : ""
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
                    className={`page-item ${
                      currentPage === totalPages ? "disabled" : ""
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
                      className={`page-item ${
                        currentPage === totalPages ? "disabled" : ""
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
                        onClick={() => setShowCalender(!showCalender)}
                        className="btn btn-secondary"
                        style={{ backgroundColor: "#8042D4", border: "none" }}
                      >
                        {date === null
                          ? "Pilih tanggal"
                          : Array.isArray(date)
                            ? "1 Minggu terakhir"
                            : date === "Bulan Ini" 
                              ? "Bulan ini"
                              : date}
                      </button>
                      {showCalender && (
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
                            padding: "10px 10px",
                          }}
                        >
                          <div
                            className="d-flex flex-column py-2 px-1"
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
                              setShowCalender(false);
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
                    <div className="d-flex justify-content-center align-items-center" style={{ height: "300px" }}>
                      <Loading size={40} />
                    </div>
                  ) : (
                    <div
                      ref={chartRef}
                      style={{ width: "100%", height: "300px" }}
                      className="mb-2"
                    ></div>
                  )}
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
                          className={`status-button-filter rounded-pill d-flex align-items-center  ${
                            statusProductStockFilter === "all"
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
                          className={`status-button-filter rounded-pill d-flex align-items-center ${
                            statusProductStockFilter === "scheduled"
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
                          className={`status-button-filter rounded-pill d-flex align-items-center  ${
                            statusProductStockFilter === "ongoing"
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
                          className={`status-button-filter rounded-pill d-flex align-items-center  ${
                            statusProductStockFilter === "paused"
                              ? "custom-font-color custom-border-select fw-bold"
                              : "border border-secondary-subtle"
                          }`}
                          onClick={() => setStatusProductStockFilter("paused")}
                          style={{
                            cursor: "pointer",
                            fontSize: "12px",
                            padding: "6px 12px",
                          }}
                        >
                          Nonaktif
                        </div>
                        <div
                          className={`status-button-filter rounded-pill d-flex align-items-center ${
                            statusProductStockFilter === "ended"
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
                              value={classificationFilter}
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
                            className="btn btn-secondary dropdown-toggle w-100"
                            type="button"
                            onClick={() => setShowTableColumn(!showTableColumn)}
                            style={{ backgroundColor: "#8042D4", border: "none" }}
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
                                <React.Fragment key={entry.id}>
                                  <tr>
                                    {filteredData.length > 0 && (
                                      <td
                                        onClick={() => toggleRow(entry.id)}
                                        style={{ cursor: "pointer" }}
                                      >
                                        {expandedVariantProduct[entry.id] ? "▲" : "▼"}
                                      </td>
                                    )}
                                    
                                    {selectedColumns.includes("name") && (
                                      <td
                                        style={{
                                          cursor: "pointer",
                                          color: selectedProduct?.id === entry.id ? "#F6881F" : "",
                                        }}
                                        onClick={() => handleProductClick(entry)}
                                      >
                                        {entry.name}
                                      </td>
                                    )}
                                    
                                    {selectedColumns.includes("code") && (
                                      <td>{entry.id || "-"}</td>
                                    )}
                                    
                                    {selectedColumns.includes("stock") && (
                                      <td>
                                        <div className="d-flex flex-column align-items-start">
                                          <span>{latestStockData?.total_available_stock || 0} Stok</span>
                                        </div>
                                      </td>
                                    )}
                                    
                                    {selectedColumns.includes("availability") && (
                                      <td>
                                        <span className={`badge ${(latestStockData?.total_available_stock || 0) > 0 ? 'bg-success' : 'bg-danger'}`}>
                                          {(latestStockData?.total_available_stock || 0) > 0 ? 'Tersedia' : 'Habis'}
                                        </span>
                                      </td>
                                    )}
                                    
                                    {selectedColumns.includes("status") && (
                                      <td>
                                        <span className={`badge ${entry.state === 'ongoing' ? 'bg-success' : 'bg-secondary'}`}>
                                          {entry.state === 'ongoing' ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                      </td>
                                    )}
                                      
                                    {selectedColumns.includes("classification") && (
                                      <td>
                                        <span>{latestStockData?.classification || "-"}</span>
                                      </td>
                                    )}
                                  </tr>
                                  
                                  {/* Expanded variant row */}
                                  {expandedVariantProduct[entry.id] && latestStockData?.variants && (
                                    <tr className="bg-light">
                                      <td
                                        colSpan={selectedColumns.length + 1}
                                        style={{ padding: "2px 4px", border: "none" }}
                                      >
                                        <ul className="list-group">
                                          {latestStockData.variants.map((variant) => (
                                            <li
                                              key={variant.id}
                                              className="list-group-item d-flex justify-content-start gap-2"
                                            >
                                              <span style={{ width: "4px" }}></span>
                                              <span style={{ width: "150px" }}>
                                                {variant.name}
                                              </span>
                                              <span>{variant.stock || 0} Stok</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={selectedColumns.length + 1} className="text-center">
                                Data tidak tersedia
                              </td>
                            </tr>
                          )}
                        </tbody>
                        {/* <tbody>
                          {paginatedData.length !== 0 && paginatedData !== null ? (
                            paginatedData?.map((entry, index) => (
                              <>
                                <tr key={entry.id}>
                                  {filteredData.length > 0 && (
                                    <td
                                      onClick={() => toggleRow(entry.id)}
                                      style={{ cursor: "pointer" }}
                                    >
                                      {expandedVariantProduct[entry.id] ? (
                                        <img
                                          src={iconArrowUp}
                                          alt="icon arrow up"
                                          style={{ width: "8px", height: "8px" }}
                                        />
                                      ) : (
                                        <img
                                          src={iconArrowDown}
                                          alt="icon arrow down"
                                          style={{ width: "8px", height: "8px" }}
                                        />
                                      )}
                                    </td>
                                  )}
                                  {selectedColumns.includes("name") && (
                                    <td
                                      style={{
                                        cursor: "pointer",
                                        color:
                                          selectedProduct?.id === entry.id
                                            ? "#F6881F"
                                            : "",
                                      }}
                                      onClick={() => handleProductClick(entry)}
                                    >
                                      {entry.name}
                                    </td>
                                  )}
                                  {selectedColumns.includes("code") && (
                                    <td>{entry.id || "-"}</td>
                                  )}
                                  {selectedColumns.includes("stock") && (
                                    <td>
                                      <div className="d-flex flex-column align-items-center">
                                        {entry.stock_detail.total_available_stock}
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("availability") && (
                                    <td>test</td>
                                  )}
                                  {selectedColumns.includes("status") && (
                                    <td>
                                      <div className="d-flex gap-1 align-items-center">
                                        <div
                                          className={`marker ${
                                            entry.state === "ongoing"
                                              ? "animated-circle"
                                              : ""
                                          }`}
                                          style={{
                                            backgroundColor:
                                              entry.state === "ongoing"
                                                ? "#00EB3FFF"
                                                : "gray",
                                          }}
                                        ></div>
                                        <span
                                          style={{
                                            fontSize: "14px",
                                            color:
                                              entry.state === "ongoing"
                                                ? "inherit"
                                                : "gray",
                                          }}
                                        >
                                          {entry.state === "ongoing"
                                            ? "Berjalan"
                                            : "Nonaktif"}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {selectedColumns.includes("classification") && (
                                    <td>
                                      <div className="d-flex gap-1 align-items-center">
                                        <span>test</span>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                                {expandedVariantProduct[entry.id] && (
                                  <tr className="bg-light">
                                    <td
                                      colSpan={selectedColumns.length + 1}
                                      style={{
                                        padding: "2px 4px",
                                        border: "none",
                                      }}
                                    >
                                      <ul className="list-group">
                                        {entry.model_list.map((variant, index) => (
                                          <li
                                            key={variant.id}
                                            className="list-group-item d-flex justify-content-start gap-2"
                                          >
                                            <span style={{ width: "4px" }}></span>
                                            <span style={{ width: "100px" }}>
                                              {variant.name}
                                            </span>
                                            <span>
                                              {" "}
                                              {
                                                variant.stock_detail
                                                  .total_available_stock
                                              }{" "}
                                              Stok
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    </td>
                                  </tr>
                                )}
                              </>
                            ))
                          ) : (
                            <div
                              className="w-100 d-flex justify-content-center"
                              style={{ width: "max-content" }}
                            >
                              <span>Data tidak tersedia</span>
                            </div>
                          )}
                        </tbody> */}
                      </table>
                    </div>
                    {/* Pagination */}
                    {filteredData.length > 0 &&
                      filteredData !== null &&
                      renderPagination()}
                  </div>
                </div>
              </div>
            )
          }
        </div>
      </BaseLayout>
    </>
  );
};