import React, { useState, useEffect, useRef } from "react";
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
  const [classificationFilter, setClassificationFilter] = useState([]);
  const [showTableColumn, setShowTableColumn] = useState(false);
  const [allRevenueStock, setAllRevenueStock] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [comparatorDate, setComparatorDate] = useState(null);
  const [comaparedDate, setComaparedDate] = useState(null);
  const [date, setDate] = useState(getAllDaysInLast7Days());
  const [showCalendar, setShowCalendar] = useState(false);
  const [chartData, setChartData] = useState([]);
  const chartRef = useRef(null);
  const [selectedMetrics, setSelectedMetrics] = useState(["visitor"]);
  const [showAlert, setShowAlert] = useState(false);

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
  }

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
  }

  // Get all hourly intervals for a specific date
  function getHourlyIntervals(selectedDate) {
    return Array.from({ length: 24 }, (_, i) => {
      return `${selectedDate} ${String(i).padStart(2, "0")}:00`;
    });
  }

  // Get all daily intervals between two dates
  function getDateRangeIntervals(startDate, endDate) {
    // Ensure we're working with Date objects
    const start = startDate instanceof Date ? new Date(startDate) : new Date(startDate);
    const end = endDate instanceof Date ? new Date(endDate) : new Date(endDate);
    
    // Set time to beginning and end of day to ensure full day coverage
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    const dateArray = [];
    
    // Check if dates are the same or only one day apart
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    
    if (diffDays <= 1) {
      // If same day or only one day apart, return hourly intervals
      return getHourlyIntervals(start.toISOString().split('T')[0]);
    }
    
    // Otherwise return daily intervals
    let currentDate = new Date(start);
    while (currentDate <= end) {
      dateArray.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dateArray;
  }

  // // Generate chart data for multiple metrics
  function generateMultipleMetricsChartData(selectedDate = null, product = null, selectedMetrics = ["visitor"]) {
    let timeIntervals = [];
    let mode = "daily";
    let result = {};

    // Generate time intervals based on selection
    if (comparatorDate && comaparedDate) {
      timeIntervals = getDateRangeIntervals(comparatorDate, comaparedDate);
      mode = timeIntervals.length <= 24 ? "hourly" : "daily";
    } else if (selectedDate === null || Array.isArray(selectedDate)) {
      timeIntervals = getAllDaysInLast7Days();
    } else if (selectedDate === "Bulan Ini") {
      timeIntervals = getAllDaysInAMonth();
    } else {
      timeIntervals = getHourlyIntervals(selectedDate);
      mode = "hourly";
    }

    // Initialize result object with time intervals
    result.timeIntervals = timeIntervals;
    result.series = [];

    let filteredProducts = productJsonData.result.items;
    if (product) {
      filteredProducts = productJsonData.result.items.filter((p) => p.id === product.id);
    }

    // Generate data for each selected metric
    selectedMetrics?.forEach(metricKey => {
      const metric = metrics[metricKey];
      if (!metric) return;

      const dataKey = metric.dataKey;
      let dataMap = {};
      
      // Initialize dataMap with zeros for all time intervals
      timeIntervals.forEach((time) => {
        dataMap[time] = 0;
      });

      filteredProducts.forEach((product) => {
        const productDateTime = convertEpochToDate(product.start_time, mode);
        
        // Check if this time exists in our range (for debug purposes)
        if (dataMap[productDateTime] === undefined) {
          
          // If we're using a custom date range, force-add this time if it falls within range
          if (comparatorDate && comaparedDate) {
            const productDate = new Date(product.start_time * 1000);
            const startDay = new Date(comparatorDate);
            startDay.setHours(0, 0, 0, 0);
            const endDay = new Date(comaparedDate);
            endDay.setHours(23, 59, 59, 999);
            
            if (productDate >= startDay && productDate <= endDay) {
              // Force add this date to our intervals
              if (!timeIntervals.includes(productDateTime)) {
                timeIntervals.push(productDateTime);
                // Sort timeIntervals to maintain chronological order
                timeIntervals.sort();
                // Initialize with zero
                dataMap[productDateTime] = 0;
              }
            }
          }
        }
        
        // Now add the data if the time exists in our map
        if (dataMap[productDateTime] !== undefined) {
          dataMap[productDateTime] += product[dataKey] || 0;
        }
      });

      // Create series data - ensure it's in the same order as timeIntervals
      const seriesData = {
        name: metric.label,
        data: timeIntervals.map((time) => dataMap[time] || 0), // Use 0 as fallback
        color: metric.color
      };

      result.series.push(seriesData);
    });
    
    return result;
  }

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
  }

  // Handle date selection
  function handleDateSelection(selectedDateOption) {
    // Clear comparison dates when selecting a preset
    setComparatorDate(null);
    setComaparedDate(null);
    setDate(selectedDateOption);
  }

  // Handle comparison dates confirmation
  function handleComparisonDatesConfirm() {
    if (comparatorDate && comaparedDate) {
      // When comparison dates are selected, set date to null to indicate we're using comparison dates
      setDate(null);
      setShowCalendar(false);
    }
  }

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

      // Check if we have any non-zero data
      const hasData = series.some(s => s.data && s.data.some(value => value > 0));

      // Set grid left position based on selected metrics
      let leftGrid;
      if (selectedMetrics.length == 1 && (selectedMetrics.includes("add_to_cart_pr") || selectedMetrics.includes("sell"))) {
        leftGrid = 80;
      } else if (selectedMetrics.length > 1 && selectedMetrics.includes("sell")) {
        leftGrid = 80;
      } else {
        leftGrid = 50;
      }

      // Set x-axis data based on selected date and time intervals
      let xAxisData = chartData?.timeIntervals;
      const includesColon = xAxisData?.some((data) => data.includes(":"));
      if (includesColon) {
        xAxisData = xAxisData?.map((data) => data.split(" ")[1]);
      } else {
        xAxisData = xAxisData?.map((data) => data.split("-").slice(1).join("-"));
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
          name: "Date", 
          type: "category", 
          data: xAxisData || [], 
          boundaryGap: false 
        },
        yAxis: { 
          name: selectedMetrics.length === 1 ? metrics[selectedMetrics[0]].label : "Total",
          type: "value", 
          splitLine: { show: true } 
        },
        series: series,
      };
      
      // Add a "no data" message if there's no data
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

    // Filter by sales classification
    // if (classificationFilter.length > 0) {
    //   filtered = filtered.filter((entry) => {
    //     const classification = getClassification(entry);
    //     return classificationFilter.some((type) => type.value === classification);
    //   });
    // }

    setFilteredData(filtered);
  }, [
    debouncedSearchTerm,
    statusProductFilter,
    classificationFilter,
    productJsonData.result.items
  ]);


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
                  {/* Status filter */}
                  <div
                    className="d-flex align-items-center gap-2"
                    style={{ width: "fit-content", listStyleType: "none" }}
                  >
                    <span>Status Produk</span>
                    <div className="d-flex gap-2">
                      <div
                        className={`status-button-filter rounded-pill bg-white d-flex align-items-center  ${
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
                        className={`status-button-filter rounded-pill bg-white d-flex align-items-center ${
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
                        className={`status-button-filter rounded-pill bg-white d-flex align-items-center  ${
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
                        className={`status-button-filter rounded-pill bg-white d-flex align-items-center  ${
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
                        className={`status-button-filter rounded-pill bg-white d-flex align-items-center ${
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
                    <div className="d-flex w-full justify-content-between align-items-center">
                      {/* Search & classification Filter */}
                      <div className="d-flex gap-2">
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
                        {/*  classification */}
                        <div className="custom-filter-salesClassification">
                          <Select
                            isMulti
                            options={typeOptions}
                            value={classificationFilter}
                            // onChange={handleTypeChange}
                            placeholder="Filter Klasifikasi"
                            styles={{
                              control: (base) => ({
                                ...base,
                                border: "2px solid #d8dfe7",
                                "&:hover": {
                                  border: "2px solid #d8dfe7",
                                },
                                padding: "0.6px 4px",
                              }),
                              multiValue: (base) => ({
                                ...base,
                                backgroundColor: "#8042D4",
                              }),
                            }}
                          />
                        </div>
                      </div>
                      {/* column filter */}
                      <div className="h-full w-full">
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
                        {allColumns.filter((column) => column.key !== "name")
                          .map((col) => (
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
                  {/* Table container */}
                  <div id="container-table" className="table-responsive">
                    <table className="table">
                      {/* Table head */}
                      <thead className="table-light">
                        <tr>
                          <th scope="col"></th>
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
                        {filteredData.length !== 0 && filteredData !== null ? (
                          filteredData?.map((entry, index) => (
                            <>
                              <tr key={entry.id}>
                                <td>{index + 1}</td>
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </BaseLayout>
    </>
  );
};