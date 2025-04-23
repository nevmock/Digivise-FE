import { useState, useEffect, useRef } from "react";
import Select from "react-select";
import Calendar from "react-calendar";
import * as echarts from "echarts";

import useDebounce from "../../hooks/useDebounce";
import productJsonData from "../../api/products.json";
import BaseLayout from "../../components/organisms/BaseLayout";


export default function PerformanceProductPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [filteredData, setFilteredData] = useState(productJsonData.result.items);
  const [statusProductFilter, setStatusProductFilter] = useState("all");
  const [showTableColumn, setShowTableColumn] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [comparatorDate, setComparatorDate] = useState(null);
  const [comaparedDate, setComaparedDate] = useState(null);
  const [date, setDate] = useState(getAllDaysInLast7Days());
  const [showCalendar, setShowCalendar] = useState(false);
  const [chartData, setChartData] = useState([]);
  const chartRef = useRef(null);
  const [selectedMetrics, setSelectedMetrics] = useState(["visitor"]);
  const [showAlert, setShowAlert] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [paginatedData, setPaginatedData] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  // CUSTOM CHART WITH FILTER DATE, CLICK PRODUCT FEATURE
  // Define metrics with their display names and colors
  const metrics = {
    visitor: { 
      label: "Pengunjung", 
      color: "#0050C8",
      dataKey: "uv" 
    },
    add_to_cart: { 
      label: "Add To Cart", 
      color: "#D50000", 
      dataKey: "add_to_cart_units" 
    },
    add_to_cart_pr: { 
      label: "Add To Cart (Percentage)", 
      color: "#00B800",
      dataKey: "uv_to_add_to_cart_rate" 
    },
    ready: { 
      label: "Siap Dikirim", 
      color: "#DFC100",
      dataKey: "confirmed_units" 
    },
    convertion: { 
      label: "Convertion", 
      color: "#C400BA",
      dataKey: "uv_to_paid_buyers_rate" 
    },
    sell: { 
      label: "Penjualan", 
      color: "#D77600",
      dataKey: "paid_sales" 
    },
    sell_ratio: { 
      label: "Ratio Penjualan", 
      color: "#00A8C6FF",
      dataKey: "placed_to_paid_buyers_rate" 
    },
  };

  // Handle product click by clicking the product in name column
  const handleProductClick = (product) => {
    if (selectedProduct?.id === product.id) {
      setSelectedProduct(null);
    } else {
      setSelectedProduct(product);
    }
  };  

  // Convert start_time to date format with epoch method
  const convertEpochToDate = (epoch, mode = "daily") => {
    const date = new Date(epoch * 1000);
    // date.setMinutes(0, 0, 0);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return mode === "hourly" ? `${year}-${month}-${day} ${hours}:${minutes}` : `${year}-${month}-${day}`;
  };

  // Get all days in last 7 days in a month
  function getAllDaysInLast7Days() {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    }).reverse();
  };

  // Get all days in a month
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
    const datePart = selectedDate.includes(" ") 
    ? selectedDate.split(" ")[0] 
    : selectedDate;
    
    return Array.from({ length: 24 }, (_, i) => {
      const hour = String(i).padStart(2, "0");
      return `${datePart} ${hour}:00`;
    });
    // return Array.from({ length: 24 }, (_, i) => {
    //   const hour = String(i).padStart(2, "0");
    //   return `${selectedDate} ${hour}:00`;
    // });
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

  // Generate chart data for multiple metrics
  function generateMultipleMetricsChartData(selectedDate = null, product = null, selectedMetrics = ["visitor"]) {
    let timeIntervals = [];
    let mode = "daily";
    let result = {};
    let isSingleDay = false;

    // Generate time intervals based on selection
    if (comparatorDate && comaparedDate) {
      // Check if both dates are the same day
      const sameDay = comparatorDate.toDateString() === comaparedDate.toDateString();
      
      if (sameDay) {
        // For same day, use hourly intervals
        const dateStr = comparatorDate.toISOString().split('T')[0];
        timeIntervals = getHourlyIntervals(dateStr);
        mode = "hourly";
        isSingleDay = true;
      } else {
        timeIntervals = getDateRangeIntervals(comparatorDate, comaparedDate);
        mode = timeIntervals.length <= 24 ? "hourly" : "daily";
      }
    } else if (selectedDate === null || Array.isArray(selectedDate)) {
      timeIntervals = getAllDaysInLast7Days();
    } else if (selectedDate === "Bulan Ini") {
      timeIntervals = getAllDaysInAMonth();
    } else {
      // This is a single day selection (today or yesterday)
      timeIntervals = getHourlyIntervals(selectedDate);
      mode = "hourly";
      isSingleDay = true;
    }

    if (!timeIntervals || timeIntervals.length === 0) {
      timeIntervals = [new Date().toISOString().split('T')[0]];
    }
  
    result.timeIntervals = timeIntervals;
    result.isSingleDay = isSingleDay;
    result.series = [];

    let filteredProducts = productJsonData.result.items;
    if (product) {
      filteredProducts = productJsonData.result.items.filter((p) => p.id === product.id);
    }

    selectedMetrics?.forEach(metricKey => {
      const metric = metrics[metricKey];
      if (!metric) return;

      const dataKey = metric.dataKey;
      let dataMap = {};
      
      timeIntervals.forEach((time) => {
        dataMap[time] = 0;
      });

      filteredProducts?.forEach((product) => {
        // Get the exact date and time from epoch for proper mapping
        const productDate = new Date(product.start_time * 1000);
        
        if (isSingleDay) {
          // For hourly view, we need the specific hour
          const hourKey = String(productDate.getHours()).padStart(2, "0");
          // const minutesKey = String(productDate.getMinutes()).padStart(2, "0");
          
          // Format to match timeIntervals format: "YYYY-MM-DD HH:00"
          const productYear = productDate.getFullYear();
          const productMonth = String(productDate.getMonth() + 1).padStart(2, "0");
          const productDay = String(productDate.getDate()).padStart(2, "0");
          const dateHourKey = `${productYear}-${productMonth}-${productDay} ${hourKey}:00`;
          
          // Check if this date/hour matches our currently displayed day
          if (timeIntervals.includes(dateHourKey)) {
            dataMap[dateHourKey] += product[dataKey] || 0;
          } else {
            // If the hour is not in the time intervals, we can ignore it
            return;
          }
        } else {
          // For daily view, just need the date part
          const productYear = productDate.getFullYear();
          const productMonth = String(productDate.getMonth() + 1).padStart(2, "0");
          const productDay = String(productDate.getDate()).padStart(2, "0");
          const dateDayKey = `${productYear}-${productMonth}-${productDay}`;
          
          if (timeIntervals.includes(dateDayKey)) {
            dataMap[dateDayKey] += product[dataKey] || 0;
          } else {
            return;
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

  // Handle metric toggle
  function handleMetricFilter(metricKey) {
    setSelectedMetrics(prev => {
      // If already selected, remove it
      if (prev.includes(metricKey)) {
        return prev.filter(m => m !== metricKey);
      } 
      // If not selected and less than 3 selected, add it
      else if (prev.length < 4) {
        return [...prev, metricKey];
      } 
      // If not selected but already have 3, show alert and don't change
      else {
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 2000); 
        return prev;
      }
    });
  };

  // Handle date selection
  function handleDateSelection(selectedDateOption) {
    // Clear comparison dates when selecting a preset
    setComparatorDate(null);
    setComaparedDate(null);
    setDate(selectedDateOption);
  };

  // Handle comparison dates confirmation
  function handleComparisonDatesConfirm() {
    if (comparatorDate && comaparedDate) {
      // When comparison dates are selected, set date to null to indicate we're using comparison dates
      setDate(null);
      setShowCalendar(false);
    }
  };

  useEffect(() => {
    const chartData = generateMultipleMetricsChartData(date, selectedProduct, selectedMetrics);
    setChartData(chartData);
  }, [date, selectedProduct, selectedMetrics, comparatorDate, comaparedDate]);

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

      let leftGrid;
      if (selectedMetrics.length == 1 && (selectedMetrics.includes("add_to_cart_pr") || selectedMetrics.includes("sell"))) {
        leftGrid = 80;
      } else if (selectedMetrics.length > 1 && selectedMetrics.includes("sell")) {
        leftGrid = 80;
      } else {
        leftGrid = 50;
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
          formatter: function(params) {
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
          name: selectedMetrics.length === 1 ? metrics[selectedMetrics[0]].label : "Total",
          type: "value", 
          splitLine: { show: true } 
        },
        series: series,
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


  // FILTER COLUMNS TABLE FEATURE
  // Define all columns
  const allColumns = [
    { key: "name", label: "Nama" },
    { key: "visitor", label: "Pengunjung" },
    { key: "add_to_cart", label: "Add To Cart" },
    { key: "add_to_cart_pr", label: "Add To Cart (Percentage)" },
    { key: "ready", label: "Siap Dikirim" },
    { key: "convertion", label: "Convertion" },
    { key: "sell", label: "Penjualan" },
    { key: "sell_ratio", label: "Ratio Penjualan" },
    { key: "classification", label: "Sales Clasification" },
    { key: "insight", label: "Insight" },
  ];

  // Initialize selected columns state
  const [selectedColumns, setSelectedColumns] = useState(
    allColumns.map((col) => col.key)
  );

  // Handle column table change
  const handleColumnChange = (colKey) => {
    setSelectedColumns((prev) =>
      prev.includes(colKey)
        ? prev.filter((key) => key !== colKey)
        : [...prev, colKey]
    );
  };

  useEffect(() => {
    let filtered = productJsonData.result.items;
    // Filter by search term
    if (debouncedSearchTerm !== "") {
      filtered = productJsonData.result.items.filter((entry) =>
        entry.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusProductFilter !== "all") {
      filtered = filtered.filter(
        (entry) => entry.state === statusProductFilter
      );
    }

    setCurrentPage(1);
    setFilteredData(filtered);
  }, [
    debouncedSearchTerm,
    statusProductFilter,
    productJsonData.result.items
  ]);


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


  // SALES CLASSIFICATION FEATURE
  // Define sales classification options
  const typeOptions = [
    { value: "best_seller", label: "Best Seller" },
    { value: "middle_moving", label: "Middle Moving" },
    { value: "slow_moving", label: "Slow Moving" },
  ];

  // Handle style for matric filter button
  const handleStyleMatricButton = (metricKey) => {
    const isActive = selectedMetrics.includes(metricKey);
    const metric = metrics[metricKey];
    
    return {
      color: isActive ? metric.color : "",
      border: `1px solid ${isActive ? metric.color : ""}`,
      padding: "6px 12px",
      borderRadius: "20px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: isActive ? "medium" : "normal",
      transition: "all 0.3s ease"
    };
  };

  const handleClassisActiveMetricButton = (metricKey) => {
    return selectedMetrics.includes(metricKey) ? "" : "border border-secondary-subtle";
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
                <h5>{productJsonData.result.total} total produk</h5>
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="btn btn-secondary"
                    style={{ backgroundColor: "#8042D4", border: "none" }}
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
                      <div style={{ width: "1px", height: "auto", backgroundColor: "#E3E3E3FF", margin: "10px 0"}}></div>
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
                {/* Chart */}
                <div ref={chartRef} style={{ width: "100%", height: "300px" }}></div>
                {/* Filters & Table */}
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
                  {/* Matric filter */}
                  <div
                    id="custom-product-container-filter-metric"
                    className="d-flex align-items-center gap-2"
                    style={{ width: "fit-content", listStyleType: "none" }}
                  >
                    <span>Matric Produk</span>
                    <div className="custom-metric-filter-buttons-wrapper">
                      {Object.keys(metrics).map((metricKey) => (
                        <div 
                          key={metricKey}
                          style={handleStyleMatricButton(metricKey)}
                          onClick={() => handleMetricFilter(metricKey)}
                          className={handleClassisActiveMetricButton(metricKey)}
                        >
                          {metrics[metricKey].label}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Status filter */}
                  <div
                    className="d-flex align-items-center gap-1 gap-md-2 flex-wrap"
                    style={{ width: "fit-content", listStyleType: "none" }}
                  >
                    <span>Status Produk</span>
                    <div className="d-flex gap-1 gap-md-2 flex-wrap">
                      <div
                        className={`status-button-filter rounded-pill d-flex align-items-center  ${
                          statusProductFilter === "all"
                            ? "custom-font-color custom-border-select"
                            : "border border-secondary-subtle"
                        }`}
                        onClick={() => setStatusProductFilter("all")}
                        style={{ cursor: "pointer", fontSize: "12px", padding: "6px 12px", }}
                      >
                        Semua
                      </div>
                      <div
                        className={`status-button-filter rounded-pill d-flex align-items-center ${
                          statusProductFilter === "scheduled"
                            ? "custom-font-color custom-border-select"
                            : "border border-secondary-subtle"
                        }`}
                        onClick={() => setStatusProductFilter("scheduled")}
                        style={{ cursor: "pointer", fontSize: "12px", padding: "6px 12px", }}
                      >
                        Terjadwal
                      </div>
                      <div
                        className={`status-button-filter rounded-pill d-flex align-items-center  ${
                          statusProductFilter === "ongoing"
                            ? "custom-font-color custom-border-select"
                            : "border border-secondary-subtle"
                        }`}
                        onClick={() => setStatusProductFilter("ongoing")}
                        style={{ cursor: "pointer", fontSize: "12px", padding: "6px 12px", }}
                      >
                        Berjalan
                      </div>
                      <div
                        className={`status-button-filter rounded-pill d-flex align-items-center  ${
                          statusProductFilter === "paused"
                            ? "custom-font-color custom-border-select"
                            : "border border-secondary-subtle"
                        }`}
                        onClick={() => setStatusProductFilter("paused")}
                        style={{ cursor: "pointer", fontSize: "12px", padding: "6px 12px", }}
                      >
                        Nonaktif
                      </div>
                      <div
                        className={`status-button-filter rounded-pill d-flex align-items-center ${
                          statusProductFilter === "ended"
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
                  {/* Other filter */}
                  <div className="d-flex flex-column mb-3 gap-2">
                    <div id="container-filter-stock" className="d-flex w-full justify-content-between align-items-center">
                      <div id="container-filter-stock-left" className="d-flex gap-2 flex-wrap">
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
                            options={typeOptions}
                            placeholder="Filter Klasifikasi"
                            styles={{
                              control: (base) => ({
                                ...base,
                                backgroundColor: "#FFFFFF00 !important",
                                border: "2px solid #d8dfe7 !important",
                                borderColor: "#d8dfe7 !important",
                                borderRadius: "6px",
                                boxShadow: "none",
                                "&:hover": {
                                  border: "2px solid #d8dfe7 !important",
                                  boxShadow: "none",
                                },
                                "&:focus": {
                                  border: "2px solid #d8dfe7 !important",
                                  boxShadow: "none",
                                },
                                "&:active": {
                                  border: "2px solid #d8dfe7 !important",
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
                      <div id="container-filter-stock-right">
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
                  <div className="table-responsive"
                    // style={{
                    //   width: "max-content",
                    //   minWidth: "100%",
                    // }}
                  >
                    <table className="table">
                      {/* Table head */}
                      <thead className="table-light">
                        <tr>
                        {filteredData.length > 0 && filteredData !== null && <th scope="col"></th>}
                          {allColumns
                            .filter((col) => selectedColumns.includes(col.key))
                            .map((col) => (
                              <th key={col.key}>
                                <div className="d-flex justify-content-start gap-1 align-items-center">
                                  {col.label}
                                </div>
                              </th>
                            ))}
                        </tr>
                      </thead>
                      {/* Table body */}
                      <tbody>
                        {paginatedData.length > 0 && paginatedData !== null ? (
                          paginatedData?.map((entry, index) => (
                            <>
                              <tr key={entry.id}>
                                {filteredData.length > 0 && filteredData !== null && (
                                  <td>{index + 1}</td>
                                )}
                                {selectedColumns.includes("name") && (
                                  <td style={{
                                    maxWidth: "400px",
                                    cursor: "pointer",
                                    color:
                                    selectedProduct?.id === entry.id
                                      ? "#F6881F"
                                      : "",
                                  }} onClick={() => handleProductClick(entry)}>
                                    <div className="d-flex flex-column">
                                      <span>{entry.name}</span>
                                    </div>
                                  </td>
                                )}
                                {selectedColumns.includes("visitor") && (
                                  <td>
                                    <div className="d-flex flex-column">
                                      <span>{entry.uv}</span>
                                    </div>
                                  </td>
                                )}
                                {selectedColumns.includes("add_to_cart") && (
                                  <td>
                                    <div className="d-flex flex-column">
                                      <span>{entry.add_to_cart_units}</span>
                                      <span className="text-success" style={{ fontSize: "10px" }}>
                                        +1.7%
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {selectedColumns.includes("add_to_cart_pr") && (
                                <td>
                                  <div className="d-flex flex-column">
                                    <span>{entry.uv_to_add_to_cart_rate}</span>
                                    <span className="text-danger" style={{ fontSize: "10px" }}>
                                      -45.7%
                                    </span>
                                  </div>
                                </td>
                                )}
                                {selectedColumns.includes("ready") && (
                                  <td>
                                    <div className="d-flex flex-column">
                                      <span>{entry.confirmed_units}</span>
                                      <span className="text-danger" style={{ fontSize: "10px" }}>
                                        -5.1%
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {selectedColumns.includes(
                                  "convertion"
                                ) && (
                                  <td>
                                    <div className="d-flex flex-column">
                                      <span>{entry.uv_to_paid_buyers_rate}</span>
                                      <span className="text-danger" style={{ fontSize: "10px" }}>
                                        -5.1%
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {selectedColumns.includes("sell") && (
                                  <td>
                                    <div className="d-flex flex-column">
                                      <span>{entry.paid_sales}</span>
                                      <span className="text-danger" style={{ fontSize: "10px" }}>
                                        -5.1%
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {selectedColumns.includes("sell_ratio") && (
                                  <td>
                                    <div className="d-flex flex-column">
                                      <span>{entry.placed_to_paid_buyers_rate}</span>
                                      <span className="text-danger" style={{ fontSize: "10px" }}>
                                        -5.1%
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {selectedColumns.includes("classification") &&
                                  (index === 0 ? (
                                    <td>
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
                                }
                                {selectedColumns.includes("insight") && (
                                  <td style={{ width: "100px" }}>
                                    <span>
                                      {entry.bidding
                                        ? entry.bidding > 5
                                          ? "Tambahkan Bidding"
                                          : "Turunkan Bidding"
                                        : ""}
                                      {/* {entry.campaign.daily_budget / entry.report.click} */}
                                    </span>
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
        </div>
      </BaseLayout>
    </>
  );
};