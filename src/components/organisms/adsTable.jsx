import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";
import Calendar from "react-calendar";
import * as echarts from "echarts";

import useDebounce from "../../hooks/useDebounce";
import iconArrowUp from "../../assets/icon/arrow-up.png";
import iconArrowDown from "../../assets/icon/arrow-down.png";

const AdsTable = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [filteredData, setFilteredData] = useState(data.data.entry_list);
  const [statusProduct, setStatusProduct] = useState("all");
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

  // CUSTOM CHART WITH FILTER DATE, CLICK PRODUCT FEATURE
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
    convertion: { 
      label: "Convertion", 
      color: "#D77600",
      dataKey: "convertion" 
    }
  };

  // Handle product click by clicking the product in name column
  const handleProductClick = (product) => {
    if (selectedProduct?.campaign.campaign_id === product.campaign.campaign_id) {
      setSelectedProduct(null);
    } else {
      setSelectedProduct(product);
    }
  };

  // Convert start_time to date format with epoch method
  const convertEpochToDate = (epoch, mode = "daily") => {
    const date = new Date(epoch * 1000);
    date.setMinutes(0, 0, 0);

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

  // Get all hours in a day
  function getHourlyIntervals(selectedDate) {
    return Array.from({ length: 24 }, (_, i) => {
      const hour = String(i).padStart(2, "0");
      return `${selectedDate} ${hour}:00`;
    });
  };

  // Get all dates in a range of input manual dates
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

    if (comparatorDate && comaparedDate) {
      const sameDay = comparatorDate.toDateString() === comaparedDate.toDateString();
      
      if (sameDay) {
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

    let filteredProducts = data.data.entry_list;
    if (product) {
      filteredProducts = data.data.entry_list.filter((p) => p.campaign.campaign_id === product.campaign.campaign_id);
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
        const productDateTime = convertEpochToDate(product.campaign.start_time, mode);
        const productDateOnly = productDateTime.includes(" ") ? 
        productDateTime.split(" ")[0] : productDateTime;
        
        if (dataMap[productDateOnly] === undefined) {
          if (comparatorDate && comaparedDate) {
            const productDate = new Date(product.campaign.start_time * 1000);
            const startDay = new Date(comparatorDate);
            startDay.setHours(0, 0, 0, 0);
            const endDay = new Date(comaparedDate);
            endDay.setHours(23, 59, 59, 999);
            
            if (productDate >= startDay && productDate <= endDay) {
              if (!timeIntervals.includes(productDateOnly)) {
                timeIntervals.push(productDateOnly);
                timeIntervals.sort();
                dataMap[productDateOnly] = 0;
              }
            }
          }
        }
        
        if (dataMap[productDateOnly] !== undefined) {
          if (dataKey === "daily_budget") {
            dataMap[productDateOnly] += product.campaign[dataKey] || 0;
          } else {
            dataMap[productDateOnly] += product.report[dataKey] || 0;
          }
        }
      });

      const seriesData = {
        name: metric.label,
        data: timeIntervals.map((time) => dataMap[time] || 0), // Use 0 as fallback
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
      else if (prev.length < 3) {
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
        if (selectedMetrics.length == 1 && (selectedMetrics.includes("daily_budget") || selectedMetrics.includes("impression"))) {
          leftGrid = 80;
        } else if (selectedMetrics.length > 1 && selectedMetrics.includes("impression")) {
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

        for (let i = 0; i < series.length; i++) {
          if (series[i].name == "Biaya") {
            series[i].data = series[i].data.map((value) => {
              if (value > 0) {
                return value / 100000;
              }
              return 0;
            });
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
    { key: "convertion", label: "Convertion" },
    { key: "classification", label: "Sales Clasification" },
    { key: "insight", label: "Insight" },
    { key: "custom_roas", label: "Custom Roas" },
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
    let filtered = data.data.entry_list;
    // Filter by search term
    if (debouncedSearchTerm !== "") {
      filtered = data.data.entry_list.filter((entry) =>
        entry.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusProduct !== "all") {
      filtered = filtered.filter((entry) => entry.state === statusProduct);
    }

     // Filter by ads type (exclude "all" from filtering logic)
     const selectedAdValues = selectedTypeAds.map((ad) => ad.value);
     // Hanya filter jika "all" tidak dipilih
     if (!selectedAdValues.includes("all")) {
       filtered = filtered.filter((entry) => selectedAdValues.includes(entry.type));
     }
     

    // Filter by placement (if a placement is selected and not "all")
    if (selectedOptionPlacement && selectedOptionPlacement.value !== "all") {
      console.log("selectedOptionPlacement", selectedOptionPlacement.value);
      filtered = filtered.filter((entry) => entry?.manual_product_ads?.product_placement === selectedOptionPlacement.value);
    }

    setFilteredData(filtered);
  }, [
    debouncedSearchTerm,
    statusProduct,
    selectedOptionPlacement,
    selectedTypeAds,
    data.data.entry_list,
  ]);


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
    { value: "product_auto", label: "Iklan Produk Auto" },
    { value: "product_manual", label: "Iklan Produk Manual" },
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
      backgroundColor: "white",
      border: `1px solid ${isActive ? metric.color : "rgb(179.4, 184.2, 189)"}`,
      color: isActive ? metric.color : "#666666",
      padding: "6px 12px",
      borderRadius: "20px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: isActive ? "medium" : "normal",
      transition: "all 0.3s ease"
    };
  };

  // Covert type ads to ui string
  const checkTypeAds = (type) => {
    switch (type) {
      case "product_manual":
        return "Iklan Product Manual";
      case "shop_auto":
        return "Iklan Toko Otomatis";
      case "shop_manual":
        return "Iklan Toko Manual";
      case "product_gmv_max_roas":
        return "Iklan Produk GMV Max ROAS";
      case "product_gmv_max_auto":
        return "Iklan Produk GMV Max Auto";
      case "product_auto":
        return "Iklan Produk Otomatis";
      default:
        return "No Detected";
    }
  };

  // Convert budget to IDR
  const convertBudgetToIDR = (budget) => {
    if (budget <= 0) return 0;

    const convertedBudget = Math.floor(budget / 100000);
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(convertedBudget);
  };

  return (
    <div className="card">
      <div className="card-body">
        {/* Header & Date Filter */}
        <div className="d-flex justify-content-between align-items-start pb-3">
          <h5>{data.data.total} total produk</h5>
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
          <div ref={chartRef} style={{ width: "100%", height: "300px" }}></div>
          {/* Filter & Table */}
          <div className="d-flex flex-column gap-2">
            {/* Alert validation */}
            {showAlert && (
              <div className="alert alert-warning alert-dismissible fade show" role="alert">
                Maksimal 3 metrik yang dapat dipilih
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
              className="d-flex align-items-center gap-2"
              style={{ width: "fit-content", listStyleType: "none" }}
            >
              <span>Matric Produk</span>
              <div className="d-flex gap-2">
                {Object.keys(metrics).map((metricKey) => (
                  <button 
                    key={metricKey}
                    style={handleStyleMatricButton(metricKey)}
                    onClick={() => handleMetricFilter(metricKey)}
                  >
                    {metrics[metricKey].label}
                  </button>
                ))}
              </div>
            </div>
            {/* Status Filter*/}
            <div
              className="d-flex align-items-center gap-2 mb-3"
              style={{ width: "fit-content", listStyleType: "none" }}
            >
              <span>Status Produk</span>
              <div className="d-flex gap-2">
                <div
                  className={`status-button-filter px-2 py-1 rounded-pill bg-white ${statusProduct === "all"
                      ? "custom-font-color custom-border-select"
                      : "border border-secondary-subtle"
                    }`}
                  onClick={() => setStatusProduct("all")}
                  style={{ cursor: "pointer", fontSize: "13px" }}
                >
                  Semua
                </div>
                <div
                  className={`status-button-filter px-2 py-1 rounded-pill bg-white ${statusProduct === "scheduled"
                      ? "custom-font-color custom-border-select"
                      : "border border-secondary-subtle"
                    }`}
                  onClick={() => setStatusProduct("scheduled")}
                  style={{ cursor: "pointer", fontSize: "13px" }}
                >
                  Terjadwal
                </div>
                <div
                  className={`status-button-filter px-2 py-1 rounded-pill bg-white ${statusProduct === "ongoing"
                      ? "custom-font-color custom-border-select"
                      : "border border-secondary-subtle"
                    }`}
                  onClick={() => setStatusProduct("ongoing")}
                  style={{ cursor: "pointer", fontSize: "13px" }}
                >
                  Berjalan
                </div>
                <div
                  className={`status-button-filter px-2 py-1 rounded-pill bg-white ${statusProduct === "paused"
                      ? "custom-font-color custom-border-select"
                      : "border border-secondary-subtle"
                    }`}
                  onClick={() => setStatusProduct("paused")}
                  style={{ cursor: "pointer", fontSize: "13px" }}
                >
                  Nonaktif
                </div>
                <div
                  className={`status-button-filter px-2 py-1 rounded-pill bg-white ${statusProduct === "ended"
                      ? "custom-font-color custom-border-select"
                      : "border border-secondary-subtle"
                    }`}
                  onClick={() => setStatusProduct("ended")}
                  style={{ cursor: "pointer", fontSize: "13px" }}
                >
                  Berakhir
                </div>
              </div>
            </div>
            {/* Other filter*/}
            <div className="d-flex flex-column mb-3 gap-2">
              <div className="d-flex w-full justify-content-between align-items-start">
                <div className="d-flex gap-2">
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
                    <div className="custom-filter-salesClassification">
                      <Select
                        options={placementOptions}
                        value={selectedOptionPlacement}
                        onChange={handlePlacementChange}
                        placeholder="Pilih Penempatan"
                        styles={{
                          control: (base) => ({
                            ...base,
                            border: "2px solid #d8dfe7 !important",
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
                        }}
                      />
                    </div>
                  )}
                  {/* ads filter */}
                  <div className="custom-filter-salesClassification">
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
                          border: "2px solid #d8dfe7 !important",
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
                          border: "2px solid #d8dfe7 !important",
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
                {/* column filter */}
                <div className="w-full h-full">
                  <button
                    className="btn btn-secondary dropdown-toggle"
                    type="button"
                    onClick={() => setShowTableColumn(!showTableColumn)}
                    style={{ backgroundColor: "#8042D4", border: "none" }}
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
                      <label className="form-check-label fs-5 ms-1">
                        {col.label}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Table container */}
            <div id="container-table" className="table-responsive">
              <table className="table table-centered">
                <thead className="table-light">
                  <tr>
                    <th scope="col">No</th>
                    {allColumns
                      .filter((col) => selectedColumns.includes(col.key))
                      .map((col) => (
                        <th key={col.key}>
                          <div className="d-flex justify-content-start align-items-center">
                            {col.label}
                            {col.key === "stock" && (
                              <div className="d-flex flex-column">
                                <img
                                  src={iconArrowUp}
                                  alt="Sort Asc"
                                  style={{
                                    width: "12px",
                                    height: "12px",
                                    cursor: "pointer",
                                    opacity: sortOrder === "asc" ? 1 : 0.5,
                                  }}
                                  onClick={() => handleSortStock("asc")}
                                />
                                <img
                                  src={iconArrowDown}
                                  alt="Sort Desc"
                                  style={{
                                    width: "12px",
                                    height: "12px",
                                    cursor: "pointer",
                                    opacity: sortOrder === "desc" ? 1 : 0.5,
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
                <tbody>
                  {filteredData.length !== 0 && filteredData !== null ? (
                    filteredData?.map((entry, index) => (
                      <>
                        <tr key={entry.campaign.campaign_id}>
                          <td>{index + 1}</td>
                          {selectedColumns.includes("info_iklan") && (
                            <td
                              className="d-flex gap-2"
                              style={{
                                width: "400px",
                                maxWidth: "400px",
                                cursor: "pointer",
                                color:
                                selectedProduct?.campaign.campaign_id === entry.campaign.campaign_id
                                  ? "#F6881F"
                                  : "",
                              }}
                              onClick={() => handleProductClick(entry)}
                            >
                              <div className="d-flex flex-column align-items-center gap-1">
                                <img
                                  src={
                                    "https://down-id.img.susercontent.com/file/" +
                                    entry.image
                                  }
                                  alt={entry.title}
                                  className="rounded"
                                  style={{ width: "60px", height: "60px" }}
                                />
                                {
                                  entry.type === "product_manual" && (
                                    <a style={{ fontSize: "10px"}} href="#"> 
                                      Details
                                    </a>
                                  )
                                }
                              </div>
                              <div className="d-flex flex-column">
                                <span>{entry.title}</span>
                                <span className="text-secondary">
                                  {checkTypeAds(entry.type)}
                                </span>
                                <span style={{ fontSize: "10px" }}>
                                  Tidak terbatas
                                </span>
                                <div className="d-flex gap-1 align-items-center">
                                  <div
                                    className={`marker ${entry.state === "ongoing"
                                        ? "animated-circle"
                                        : ""
                                      }`}
                                    style={{
                                      backgroundColor:
                                        entry.state === "ongoing"
                                          ? "#00EB3FFF"
                                          : "#F6881F",
                                    }}
                                  ></div>
                                  <span
                                    style={{
                                      fontSize: "14px",
                                      color:
                                        entry.state === "ongoing"
                                          ? "#00D138FF"
                                          : "#F6881F",
                                    }}
                                  >
                                    {entry.state === "ongoing"
                                      ? "Berjalan"
                                      : "Nonaktif"}
                                  </span>
                                </div>
                              </div>
                            </td>
                          )}
                          {selectedColumns.includes("biaya") && (
                            <td style={{ width: "200px" }}>
                              <div className="d-flex flex-column">
                                <span>
                                  Rp {convertBudgetToIDR(entry.campaign.daily_budget)}
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
                                <span>{entry.report.impression}</span>
                                <span className="text-danger" style={{ fontSize: "10px" }}>
                                  -102.7%
                                </span>
                              </div>
                            </td>
                          )}
                          {selectedColumns.includes("click") && (
                            <td style={{ width: "200px" }}>
                              <div className="d-flex flex-column">
                                <span>{entry.report.click}</span>
                                <span className="text-danger" style={{ fontSize: "10px" }}>
                                  -102.7%
                                </span>
                              </div>
                            </td>
                          )}
                          {selectedColumns.includes("ctr") && (
                            <td style={{ width: "200px" }}>
                              <div className="d-flex flex-column">
                                <span>{entry.report.ctr}</span>
                                <span className="text-danger" style={{ fontSize: "10px" }}>
                                  -102.7%
                                </span>
                              </div>
                            </td>
                          )}
                          {selectedColumns.includes("acos") && (
                            <td style={{ width: "200px" }}>
                              <div className="d-flex flex-column">
                                <span>{entry.report.broad_cir}</span>
                                <span className="text-danger" style={{ fontSize: "10px" }}>
                                  -102.7%
                                </span>
                              </div>
                            </td>
                          )}
                          {selectedColumns.includes("convertion") && (
                            <td style={{ width: "200px" }}>
                              <div className="d-flex flex-column">
                                <span>{entry.report.checkout}</span>
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
                                {entry.bidding
                                  ? entry.bidding > 5
                                    ? "Tambahkan Bidding"
                                    : "Turunkan Bidding"
                                  : ""}
                                {/* {entry.campaign.daily_budget / entry.report.click} */}
                              </span>
                            </td>
                          )}
                          {selectedColumns.includes("custom_roas") && (
                            <td style={{ width: "200px" }}>
                              <input
                                type="number"
                                className="form-control mb-1"
                                placeholder="0"
                                style={{ width: "100px", height: "30px" }}
                              />
                              <button
                                className="btn btn-primary"
                                style={{
                                  backgroundColor: "#8042D4",
                                  border: "none",
                                  width: "100px",
                                  padding: "5px 0px",
                                  fontSize: "12px",
                                }}
                                onClick={() => alert("Custom Roas saved")}
                              >
                                Simpan
                              </button>
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
        </div>
      </div>
    </div>
  );
};

export default AdsTable;