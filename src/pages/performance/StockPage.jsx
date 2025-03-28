import React, { useState, useEffect, useCallback, useRef } from "react";
import * as echarts from "echarts";
import Calendar from "react-calendar";
import Select from "react-select";

import stockJsonData from "../../api/stock.json";
import useDebounce from "../../hooks/useDebounce";
import BaseLayout from "../../components/organisms/BaseLayout";
import iconArrowUp from "../../assets/icon/arrow-up.png";
import iconArrowDown from "../../assets/icon/arrow-down.png";
import "react-calendar/dist/Calendar.css";

export default function PerformanceStockPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [filteredData, setFilteredData] = useState(stockJsonData.data.products);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [showColumn, setShowColumn] = useState(false);
  const [allRevenue, setAllRevenue] = useState(0);
  const [expandedRows, setExpandedRows] = useState({});
  const [chartData, setChartData] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);
  const [date, setDate] = useState(null);
  const [showCalender, setShowCalender] = useState(false);
  const chartRef = useRef(null);

  // Convert start_time to date format with epoch method
  const convertEpochToDate = (epoch) => {
    const date = new Date(epoch * 1000);
    return date.toISOString().split("T")[0];
  };

  // Handle product click by clicking the product in name column
  const handleProductClick = (product) => {
    if (selectedProduct?.id === product.id) {
      setSelectedProduct(null);
      setChartData(generateChartData());
      return;
    }
    setSelectedProduct(product);
    setChartData([
      {
        date: convertEpochToDate(product.campaign.start_time),
        totalStock: product.stock_detail?.total_available_stock || 0,
      },
    ]);
  };

  // Get last 7 days
  const getAllDaysInLast7Days = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    }).reverse();
  };

  // Get all days in a month
  const getAllDaysInAMonth = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const days = new Date(year, month, 0).getDate();
    return Array.from(
      { length: days },
      (_, i) => `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`
    );
  };
  
  // Generate chart data for the selected date
  const generateChartData = (selectedDate = null) => {
    const stockMap = {};
    const monthDays = getAllDaysInAMonth();

    monthDays.forEach((day) => {
      stockMap[day] = 0;
    });

    stockJsonData.data.products.forEach((product) => {
      const date = convertEpochToDate(product.campaign.start_time);
      if (stockMap[date] !== undefined) {
        stockMap[date] += product.stock_detail?.total_available_stock || 0;
      }
    });

    if (selectedDate) {
      return [{
        date: selectedDate,
        totalStock: stockMap[selectedDate] || 0,
      }];
    }

    return monthDays.map((date) => ({ date, totalStock: stockMap[date] }));
  };

  useEffect(() => {
    const updateChartData = () => {
      let selectedDates = [];
  
      if (date === null) {
        selectedDates = getAllDaysInAMonth();
      } else if (Array.isArray(date)) {
        selectedDates = date;
      } else if (date instanceof Date) {
        selectedDates = [date.toISOString().split("T")[0]];
      }
  
      const stockMap = {};
      selectedDates.forEach((day) => {
        stockMap[day] = 0;
      });
  
      stockJsonData.data.products.forEach((product) => {
        const productDate = convertEpochToDate(product.campaign.start_time);
        if (stockMap[productDate] !== undefined) {
          stockMap[productDate] += product.stock_detail?.total_available_stock || 0;
        }
      });
  
      const formattedData = selectedDates.map((date) => ({
        date,
        totalStock: stockMap[date],
      }));
  
      setChartData(formattedData);
    };
  
    updateChartData();
  }, [date]);

  useEffect(() => {
    if (chartRef.current) {
      const chartInstance = echarts.init(chartRef.current);
      const option = {
        toolbox: {
          feature: {
            saveAsImage: {},
          },
        },
        grid: {
          left: 50,
          right: 50,
          bottom: 50,
          containLabel: false,
        },
        tooltip: { trigger: "axis" },
        xAxis: {
          name: "Date",
          type: "category",
          data: chartData.map((item) => item.date),
          boundaryGap: false,
        },
        yAxis: { name: "Stock", type: "value", splitLine: { show: true } },
        series: [
          {
            type: "line",
            smooth: true,
            symbolSize: 5,
            emphasis: { focus: "series" },
            data: chartData.map((item) => item.totalStock),
          },
        ],
      };
      chartInstance.setOption(option);
    }
  }, [chartData]);

  // Set chart data when selected product stock is null
  // useEffect(() => {
  //   if (!selectedProduct) {
  //     setChartData(generateChartData());
  //   }
  // }, [stockJsonData.data.products]);


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
    setExpandedRows((prev) => ({
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

  useEffect(() => {
    let filtered = stockJsonData.data.products;
    // Filter by search term
    if (debouncedSearchTerm !== "") {
      filtered = stockJsonData.data.products.filter((entry) =>
        entry.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (activeFilter !== "all") {
      filtered = filtered.filter((entry) => entry.state === activeFilter);
    }

    // Filter by sales classification
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((entry) => {
        const classification = getClassification(entry);
        return selectedTypes.some((type) => type.value === classification);
      });
    }

    setFilteredData(filtered);
  }, [
    debouncedSearchTerm,
    activeFilter,
    selectedTypes,
    allRevenue,
    stockJsonData.data.products,
  ]);


  // SALES CLASSIFICATION FEATURE
  // Define sales classification options
  const typeOptions = [
    { value: "best_seller", label: "Best Seller" },
    { value: "middle_moving", label: "Middle Moving" },
    { value: "slow_moving", label: "Slow Moving" }
  ];

  // Calculate all revenue
  const calculateAllRevenue = () => {
    return stockJsonData.data.products.reduce((sum, product) => {
      return (
        sum +
        parseFloat(product.price_detail.selling_price_max) *
          product.statistics.sold_count
      );
    }, 0);
  };

  // Get sales classification
  const getClassification = (entry, allRevenue) => {
    if (allRevenue === 0) return "";

    const revenue =
      parseFloat(entry.price_detail.selling_price_max) *
      entry.statistics.sold_count;
    const contribution = (revenue / allRevenue) * 100;

    if (contribution > 70) return "best_seller";
    if (contribution > 20) return "middle_moving";
    if (contribution > 10) return "slow_moving";
    return "";
  };

  // Handle type change by list of options sales classification
  const handleTypeChange = (selectedOptions) => {
    setSelectedTypes(selectedOptions);
  };

  useEffect(() => {
    const totalRevenue = calculateAllRevenue();
    setAllRevenue(totalRevenue);

    let filtered = stockJsonData.data.products || [];

    if (selectedTypes.length > 0) {
      filtered = filtered.filter((entry) => {
        const classification = getClassification(entry, totalRevenue);
        return selectedTypes.some((type) => type.value === classification);
      });
    }

    setFilteredData(filtered);
  }, [selectedTypes, stockJsonData.data.products]);


  // STOCK AVAILABILITY FEATURE
  // Classify stock is more than 70% of default stock
  const checkStock = (variants, defaultStock) => {
    const totalNewStock = variants.reduce(
      (acc, variant) => acc + variant.stock_detail.total_available_stock,
      0
    );
    return totalNewStock > 0.7 * defaultStock + 1;
  };

  // Check if stock is recommended
  const checkStockIsRecommended = (variants, defaultStock) => {
    return checkStock(variants, defaultStock) ? (
      ""
    ) : (
      <span className="custom-text-danger" style={{ fontSize: "12px" }}>
        *stok &#60;=70%
      </span>
    );
  };


  // SORTING FEATURE
  // Handle sort stock by asc or desc
  const handleSortStock = (order) => {
    if (sortOrder === order) {
      setSortOrder(null);
      setFilteredData(data.products);
    } else {
      setSortOrder(order);
      const sortedData = [...filteredData].sort((a, b) => {
        return order === "asc"
          ? a.stock_detail.total_available_stock -
              b.stock_detail.total_available_stock
          : b.stock_detail.total_available_stock -
              a.stock_detail.total_available_stock;
      });
      setFilteredData(sortedData);
    }
  };

  return (
    <>
      <BaseLayout>
        <div className="d-flex flex-column gap-1">
          <div className="d-flex align-items-center">
            <h3>Performa stock</h3>
          </div>
          <div className="card">
            <div className="card-body">
              {/* Header & Date Filter */}
              <div className="d-flex justify-content-between align-items-start pb-1">
                <h5>{stockJsonData.data.page_info.total} total produk</h5>
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
                    : date instanceof Date
                    ? date.toLocaleDateString("id-ID")
                    : "Tanggal tidak valid"}
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
                        padding: "0px 10px",
                      }}
                    >
                      <div className="d-flex flex-column py-2 px-1" style={{ width: "130px", listStyleType: "none" }}>
                        <p style={{ cursor: "pointer" }} onClick={() => setDate(new Date())}> Hari ini</p>
                        <p style={{ cursor: "pointer" }} onClick={() => setDate(new Date(Date.now() - 86400000))}> Kemarin </p>
                        <p style={{ cursor: "pointer" }} onClick={() => setDate(getAllDaysInLast7Days())}>1 Minggu terakhir</p>
                        <p style={{ cursor: "pointer" }} onClick={() => setDate(null)}> Bulan ini </p>
                      </div>                      
                      <Calendar
                        onChange={(selectedDate) => {
                          setDate(selectedDate);
                          setShowCalender(false);
                        }}
                        value={date}
                        maxDate={new Date()}
                      />
                    </div>
                  )}
                </div>
              </div>
              {/* Chart */}
              <div ref={chartRef} style={{ width: "100%", height: "400px" }}></div>
              {/* Filter & Table */}
              <div className="d-flex flex-column">
                {/* Status filter*/}
                <div
                  className="d-flex flex-column gap-1 mb-3"
                  style={{ width: "fit-content", listStyleType: "none" }}
                >
                  <span>Status Produk</span>
                  {/* Filter buttons */}
                  <div className="d-flex gap-2">
                    <div
                      className={`ads-button-filter px-2 py-1 rounded-pill bg-white ${
                        activeFilter === "all"
                          ? "custom-font-color custom-border-select"
                          : "border border-secondary-subtle"
                      }`}
                      onClick={() => setActiveFilter("all")}
                      style={{ cursor: "pointer", fontSize: "13px" }}
                    >
                      Semua
                    </div>
                    <div
                      className={`ads-button-filter px-2 py-1 rounded-pill bg-white ${
                        activeFilter === "scheduled"
                          ? "custom-font-color custom-border-select"
                          : "border border-secondary-subtle"
                      }`}
                      onClick={() => setActiveFilter("scheduled")}
                      style={{ cursor: "pointer", fontSize: "13px" }}
                    >
                      Terjadwal
                    </div>
                    <div
                      className={`ads-button-filter px-2 py-1 rounded-pill bg-white ${
                        activeFilter === "ongoing"
                          ? "custom-font-color custom-border-select"
                          : "border border-secondary-subtle"
                      }`}
                      onClick={() => setActiveFilter("ongoing")}
                      style={{ cursor: "pointer", fontSize: "13px" }}
                    >
                      Berjalan
                    </div>
                    <div
                      className={`ads-button-filter px-2 py-1 rounded-pill bg-white ${
                        activeFilter === "paused"
                          ? "custom-font-color custom-border-select"
                          : "border border-secondary-subtle"
                      }`}
                      onClick={() => setActiveFilter("paused")}
                      style={{ cursor: "pointer", fontSize: "13px" }}
                    >
                      Nonaktif
                    </div>
                    <div
                      className={`ads-button-filter px-2 py-1 rounded-pill bg-white ${
                        activeFilter === "ended"
                          ? "custom-font-color custom-border-select"
                          : "border border-secondary-subtle"
                      }`}
                      onClick={() => setActiveFilter("ended")}
                      style={{ cursor: "pointer", fontSize: "13px" }}
                    >
                      Berakhir
                    </div>
                  </div>
                </div>
                {/* Other filter*/}
                <div className="d-flex flex-column mb-3 gap-2">
                  <div className="d-flex gap-2 w-full">
                    {/* Search bar */}
                    <div className="w-100">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Cari berdasarkan nama"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    {/* Clasification filter */}
                    <div className="w-100">
                      <Select
                        isMulti
                        options={typeOptions}
                        value={selectedTypes}
                        onChange={handleTypeChange}
                        placeholder="Filter Klasifikasi"
                      />
                    </div>
                    {/* Column filter */}
                    <div className="w-100 h-full">
                      <button
                        class="btn btn-secondary dropdown-toggle"
                        type="button"
                        onClick={() => setShowColumn(!showColumn)}
                        style={{ backgroundColor: "#8042D4", border: "none" }}
                      >
                        Pilih kriteria
                      </button>
                    </div>
                  </div>
                  {/* Option column filter */}
                  {showColumn && (
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
                  <table className="table table-centered">
                    {/* Head table */}
                    <thead className="table-light">
                      <tr>
                        <th scope="col"></th>
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
                                        opacity: sortOrder === "asc" ? 1 : 0.5,
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
                    {/* Body Table */}
                    <tbody>
                      {filteredData.length !== 0 && filteredData !== null ? (
                        filteredData?.map((entry, index) => (
                          <>
                            <tr key={entry.id}>
                              <td onClick={() => toggleRow(entry.id)} style={{ cursor: "pointer"}}>
                                {expandedRows[entry.id] ? (
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
                                <td>
                                    {checkStockIsRecommended(
                                      entry.model_list,
                                      entry.stock_detail.total_available_stock
                                    )}
                                </td>
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
                                    <div
                                      className={`marker ${
                                        getClassification(entry, allRevenue) !== "" ? "animated-circle" : ""
                                      }`}
                                      style={{
                                        backgroundColor:
                                          getClassification(entry, allRevenue) === "best_seller"
                                            ? "#00EB3FFF"
                                            : getClassification(entry, allRevenue) === "middle_moving"
                                            ? "#007BFF"
                                            : getClassification(entry, allRevenue) === "slow_moving"
                                            ? "#FFC107"
                                            : "#FFFFFF00",
                                      }}
                                    ></div>
                                    <span
                                      style={{
                                        fontSize: "14px",
                                        color:
                                          getClassification(entry, allRevenue) !== "" ? "inherit" : "#FFFFFF00",
                                      }}
                                    >
                                      {
                                        typeOptions.find(
                                          (type) => type.value === getClassification(entry, allRevenue)
                                        )?.label || ""
                                      }
                                    </span>
                                  </div>
                                </td>
                              )}
                            </tr>
                            {expandedRows[entry.id] && (
                              <tr className="bg-light">
                                <td
                                  colSpan={selectedColumns.length + 1}
                                  className="p-1"
                                >
                                  <ul className="list-group">
                                    {entry.model_list.map((variant, index) => (
                                      <li
                                        key={variant.id}
                                        className="list-group-item d-flex justify-content-start gap-2"
                                      >
                                        <span style={{ width: "20px" }}></span>
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
      </BaseLayout>
    </>
  );
};