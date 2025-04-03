import { useState, useEffect, useCallback, useRef } from "react";
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
  const [statusProductFilter, setStatusProductFilter] = useState("all");
  const [classificationFilter, setClassificationFilter] = useState([]);
  const [showTableColumn, setShowTableColumn] = useState(false);
  const [allRevenueStock, setAllRevenueStock] = useState(0);
  const [expandedVariantProduct, setExpandedVariantProduct] = useState({});
  const [chartData, setChartData] = useState([]);
  const chartRef = useRef(null);
  const [sortOrderData, setSortOrderData] = useState(null);
  const [showCalender, setShowCalender] = useState(false);
  const [date, setDate] = useState(getAllDaysInLast7Days());
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // CUSTOM CHART & PRODUCT CLICK FEATURE
  // Handle product click by clicking the product in name column
  const handleProductClick = (product) => {
    setSelectedProduct((prev) => (prev?.id === product.id ? null : product));
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

  // Get all hourly intervals for a specific date
  function getHourlyIntervals(selectedDate) {
    return Array.from({ length: 24 }, (_, i) => {
      return `${selectedDate} ${String(i).padStart(2, "0")}:00`;
    });
  };

  function generateChartData(selectedDate = null, product = null) {
    setIsLoading(true);
    let stockMap = {};
    let timeIntervals = [];
    let mode = "daily";

    if (selectedDate === null || Array.isArray(selectedDate)) {
      timeIntervals = getAllDaysInLast7Days();
    } else if (selectedDate === "Bulan Ini") {
      timeIntervals = getAllDaysInAMonth();
    } else {
      timeIntervals = getHourlyIntervals(selectedDate);
      mode = "hourly";
    }

    timeIntervals.forEach((time) => {
      stockMap[time] = 0;
    });

    let filteredProducts = stockJsonData.data.products;
    if (product) {
      filteredProducts = stockJsonData.data.products.filter((p) => p.id === product.id);
    }

    filteredProducts.forEach((product) => {
      const productDateTime = convertEpochToDate(product.campaign.start_time, mode);
      if (stockMap[productDateTime] !== undefined) {
        stockMap[productDateTime] += product.stock_detail?.total_available_stock || 0;
      }
    });

    setIsLoading(false);
    return timeIntervals.map((time) => ({ date: time, totalStock: stockMap[time] }));
  }

  useEffect(() => {
    setChartData(generateChartData(date, selectedProduct));
  }, [date, selectedProduct]);

  useEffect(() => {
    let xAxisData = chartData?.map((item) => item.date);
    let rotateAaxisLabel = 0;
    const includesColon = xAxisData?.some((item) => item.includes(":"));
    if (includesColon) {
      xAxisData = xAxisData?.map((item) => item.split(" ")[1]);
    } else {
      xAxisData = xAxisData?.map((item) => item.split("-").slice(1).join("-"));
    };

    if (xAxisData?.length > 7 && !includesColon) {
      rotateAaxisLabel = 45;
    };

    if (chartRef.current) {
      const chartInstance = echarts.init(chartRef.current);
      chartInstance.setOption({
        toolbox: { feature: { saveAsImage: {} } },
        grid: { left: 50, right: 50, bottom: 50, containLabel: false },
        tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: xAxisData, boundaryGap: false, axisLabel: { interval: 0, rotate: rotateAaxisLabel }},
        yAxis: { type: "value", splitLine: { show: true } },
        series: [{ type: "line", smooth: true, showSymbol: false, data: chartData.map((item) => item.totalStock) }],
      });
      return () => chartInstance.dispose();
    }
  }, [chartData]);


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

  useEffect(() => {
    let filtered = stockJsonData.data.products;
    // Filter by search term
    if (debouncedSearchTerm !== "") {
      filtered = stockJsonData.data.products.filter((entry) =>
        entry.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusProductFilter !== "all") {
      filtered = filtered.filter((entry) => entry.state === statusProductFilter);
    }

    // Filter by sales classification
    if (classificationFilter.length > 0) {
      filtered = filtered.filter((entry) => {
        const classification = getClassification(entry);
        return classificationFilter.some((type) => type.value === classification);
      });
    }

    setFilteredData(filtered);
  }, [
    debouncedSearchTerm,
    statusProductFilter,
    classificationFilter,
    allRevenueStock,
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
  const getClassification = (entry, allRevenueStock) => {
    if (allRevenueStock === 0) return "";

    const revenue =
      parseFloat(entry.price_detail.selling_price_max) *
      entry.statistics.sold_count;
    const contribution = (revenue / allRevenueStock) * 100;

    if (contribution > 70) return "best_seller";
    if (contribution > 20) return "middle_moving";
    if (contribution > 10) return "slow_moving";
    return "";
  };

  // Handle type change by list of options sales classification
  const handleTypeChange = (selectedOptions) => {
    setClassificationFilter(selectedOptions);
  };

  useEffect(() => {
    const totalRevenue = calculateAllRevenue();
    setAllRevenueStock(totalRevenue);

    let filtered = stockJsonData.data.products || [];

    if (classificationFilter.length > 0) {
      filtered = filtered.filter((entry) => {
        const classification = getClassification(entry, totalRevenue);
        return classificationFilter.some((type) => type.value === classification);
      });
    }

    setFilteredData(filtered);
  }, [classificationFilter, stockJsonData.data.products]);


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


  // SORTING STOCK FEATURE
  // Handle sort stock by asc or desc
  const handleSortStock = (order) => {
    if (sortOrderData === order) {
      setSortOrderData(null);
      setFilteredData(data.products);
    } else {
      setSortOrderData(order);
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
                    {date === null ? "Pilih tanggal" : Array.isArray(date) ? "1 Minggu terakhir" : date}
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
                        <p style={{ cursor: "pointer" }} onClick={() => setDate(new Date().toISOString().split("T")[0])}>Hari ini</p>
                        <p
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            const yesterday = new Date();
                            yesterday.setDate(yesterday.getDate() - 1);
                            setDate(yesterday.toISOString().split("T")[0]);
                          }}
                        >
                          Kemarin
                        </p>
                        <p style={{ cursor: "pointer" }} onClick={() => setDate(getAllDaysInLast7Days())}>1 Minggu terakhir</p>
                        <p style={{ cursor: "pointer" }} onClick={() => setDate("Bulan Ini")}>Bulan ini</p>
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
                            setDate(selectedDate.toISOString().split("T")[0]);
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
              <div ref={chartRef} style={{ width: "100%", height: "300px" }} className="mb-2"></div>
              {/* Filter & Table */}
              <div className="d-flex flex-column gap-2">
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
                {/* Other filter*/}
                <div className="d-flex flex-column mb-3 gap-2">
                  <div className="d-flex w-full justify-content-between align-items-center">
                    <div className="d-flex gap-2">
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
                          value={classificationFilter}
                          onChange={handleTypeChange}
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
                    {/* Column filter */}
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
                  style={{
                    width: "max-content",
                    minWidth: "100%",
                  }}
                >
                  <table className="table table-centered">
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
                                        opacity: sortOrderData === "asc" ? 1 : 0.5,
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
                                        opacity: sortOrderData === "desc" ? 1 : 0.5,
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
                        filteredData?.map((entry) => (
                          <>
                            <tr key={entry.id}>
                              {filteredData.length > 0 && (
                                <td onClick={() => toggleRow(entry.id)} style={{ cursor: "pointer"}}>
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
                              {/* <td onClick={() => toggleRow(entry.id)} style={{ cursor: "pointer"}}>
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
                              </td> */}
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
                                        getClassification(entry, allRevenueStock) !== "" ? "animated-circle" : ""
                                      }`}
                                      style={{
                                        backgroundColor:
                                          getClassification(entry, allRevenueStock) === "best_seller"
                                            ? "#00EB3FFF"
                                            : getClassification(entry, allRevenueStock) === "middle_moving"
                                            ? "#007BFF"
                                            : getClassification(entry, allRevenueStock) === "slow_moving"
                                            ? "#FFC107"
                                            : "#FFFFFF00",
                                      }}
                                    ></div>
                                    <span
                                      style={{
                                        fontSize: "14px",
                                        color:
                                          getClassification(entry, allRevenueStock) !== "" ? "inherit" : "#FFFFFF00",
                                      }}
                                    >
                                      {
                                        typeOptions.find(
                                          (type) => type.value === getClassification(entry, allRevenueStock)
                                        )?.label || ""
                                      }
                                    </span>
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
                        <div className="w-100 d-flex justify-content-center" style={{ width: "max-content" }}>
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