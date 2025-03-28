import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";
import Calendar from "react-calendar";
import * as echarts from "echarts";

import useDebounce from "../../hooks/useDebounce";
// import productJsonData from "../../api/product.json";
import productJsonData from "../../api/products.json";
import BaseLayout from "../../components/organisms/BaseLayout";

export default function PerformanceStockPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [filteredData, setFilteredData] = useState(
    productJsonData.result.items
  );
  const [statusProductFilter, setStatusProductFilter] = useState("all");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [showColumn, setShowColumn] = useState(false);
  const [allRevenue, setAllRevenue] = useState(0);
  const [chartData, setChartData] = useState([]);
  // const [selectedProduct, setSelectedProduct] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [date, setDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const chartRef = useRef(null);

  // Convert start_time to date format with epoch method
  const convertEpochToDate = (epoch) => {
    const date = new Date(epoch * 1000);
    return date.toISOString().split("T")[0];
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
      (_, i) =>
        `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(
          2,
          "0"
        )}`
    );
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

      const matrixDataMap = {};
      selectedDates.forEach((day) => {
        matrixDataMap[day] = 0;
      });

      productJsonData.result.items.forEach((product) => {
        const productDate = convertEpochToDate(product.start_time);
        if (matrixDataMap[productDate] !== undefined) {
          matrixDataMap[productDate] +=
            product?.bounce_visitors || 0;
        }
      });

      const formattedData = selectedDates.map((date) => ({
        date,
        totalMatrixData: matrixDataMap[date],
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
        yAxis: { name: "Pengunjung", type: "value", splitLine: { show: true } },
        series: [
          {
            type: "line",
            smooth: true,
            symbolSize: 5,
            emphasis: { focus: "series" },
            data: chartData.map((item) => item.totalMatrixData),
          },
        ],
      };
      chartInstance.setOption(option);
    }
  }, [chartData]);


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

  // Handle column change
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
    // if (selectedTypes.length > 0) {
    //   filtered = filtered.filter((entry) => {
    //     const classification = getClassification(entry);
    //     return selectedTypes.some((type) => type.value === classification);
    //   });
    // }

    setFilteredData(filtered);
  }, [
    debouncedSearchTerm,
    statusProductFilter,
    selectedTypes,
    allRevenue,
    productJsonData.result.items,
  ]);


  // SALES CLASSIFICATION FEATURE
  // Define sales classification options
  const typeOptions = [
    { value: "best_seller", label: "Best Seller" },
    { value: "middle_moving", label: "Middle Moving" },
    { value: "slow_moving", label: "Slow Moving" },
  ];

  // Calculate all revenue
  // const calculateAllRevenue = () => {
  //   return productJsonData.result.items.reduce((sum, product) => {
  //     return (
  //       sum +
  //       parseFloat(product.price_detail.selling_price_max) *
  //         product.statistics.sold_count
  //     );
  //   }, 0);
  // };

  // Get sales classification
  // const getClassification = (entry, allRevenue) => {
  //   if (allRevenue === 0) return "";

  //   const revenue =
  //     parseFloat(entry.price_detail.selling_price_max) *
  //     entry.statistics.sold_count;
  //   const contribution = (revenue / allRevenue) * 100;

  //   if (contribution > 70) return "best_seller";
  //   if (contribution > 20) return "middle_moving";
  //   if (contribution > 10) return "slow_moving";
  //   return "";
  // };

  // Handle type change by list of options sales classification
  const handleTypeChange = (selectedOptions) => {
    setSelectedTypes(selectedOptions);
  };

  // useEffect(() => {
  //   const totalRevenue = calculateAllRevenue();
  //   setAllRevenue(totalRevenue);

  //   let filtered = productJsonData.result.items || [];

  //   if (selectedTypes.length > 0) {
  //     filtered = filtered.filter((entry) => {
  //       const classification = getClassification(entry, totalRevenue);
  //       return selectedTypes.some((type) => type.value === classification);
  //     });
  //   }

  //   setFilteredData(filtered);
  // }, [selectedTypes, productJsonData.result.items]);

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
              <div className="d-flex justify-content-between align-items-start pb-3">
                <h5>{productJsonData.result.total} total produk</h5>
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="btn btn-secondary"
                    style={{ backgroundColor: "#8042D4", border: "none" }}
                  >
                    {startDate && endDate
                      ? `${startDate.toLocaleDateString(
                          "id-ID"
                        )} - ${endDate.toLocaleDateString("id-ID")}`
                      : "Pilih Tanggal"}
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
                        <p
                          style={{ cursor: "pointer" }}
                          onClick={() => setDate(new Date())}
                        >
                          {" "}
                          Hari ini
                        </p>
                        <p
                          style={{ cursor: "pointer" }}
                          onClick={() =>
                            setDate(new Date(Date.now() - 86400000))
                          }
                        >
                          {" "}
                          Kemarin{" "}
                        </p>
                        <p
                          style={{ cursor: "pointer" }}
                          onClick={() => setDate(getAllDaysInLast7Days())}
                        >
                          1 Minggu terakhir
                        </p>
                        <p
                          style={{ cursor: "pointer" }}
                          onClick={() => setDate(null)}
                        >
                          {" "}
                          Bulan ini{" "}
                        </p>
                      </div>
                      {/* Kalender pertama (Start Date) */}
                      <div>
                        <p style={{ textAlign: "center" }}>Tanggal Mulai</p>
                        <Calendar
                          onChange={(date) => setStartDate(date)}
                          value={startDate}
                          maxDate={endDate || new Date(2100, 0, 1)}
                        />
                      </div>
                      {/* Kalender kedua (End Date) */}
                      <div>
                        <p style={{ textAlign: "center" }}>Tanggal Selesai</p>
                        <Calendar
                          onChange={(date) => setEndDate(date)}
                          value={endDate}
                          minDate={startDate || new Date()}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="d-flex flex-column gap-2">
                {/* Chart */}
                <div
                  ref={chartRef}
                  style={{ width: "100%", height: "400px" }}
                ></div>
                {/* Filter & Table */}
                <div className="d-flex flex-column">
                  {/* Matrix filter */}
                  <div
                    className="d-flex align-items-center gap-2 mb-3"
                    style={{ width: "fit-content", listStyleType: "none" }}
                  >
                    <span>Matrix Produk</span>
                    {/* Filter buttons */}
                    <div className="d-flex gap-2">
                      <div
                        className="ads-button-filter px-2 py-1 rounded-pill bg-white custom-font-color custom-border-select"
                        style={{ cursor: "pointer", fontSize: "13px" }}
                      >
                        Pengunjung
                      </div>
                      <div
                        className="ads-button-filter px-2 py-1 rounded-pill bg-white border border-secondary-subtle"
                        style={{ cursor: "pointer", fontSize: "13px" }}
                      >
                        Add To Cart
                      </div>
                      <div
                        className="ads-button-filter px-2 py-1 rounded-pill bg-white border border-secondary-subtle"
                        style={{ cursor: "pointer", fontSize: "13px" }}
                      >
                        Add To Cart (Percentage)
                      </div>
                      <div
                        className="ads-button-filter px-2 py-1 rounded-pill bg-white border border-secondary-subtle"
                        style={{ cursor: "pointer", fontSize: "13px" }}
                      >
                        Siap Dikirim
                      </div>
                      <div
                        className="ads-button-filter px-2 py-1 rounded-pill bg-white border border-secondary-subtle"
                        style={{ cursor: "pointer", fontSize: "13px" }}
                      >
                        Convertion
                      </div>
                      <div
                        className="ads-button-filter px-2 py-1 rounded-pill bg-white border border-secondary-subtle"
                        style={{ cursor: "pointer", fontSize: "13px" }}
                      >
                        Penjualan
                      </div>
                      <div
                        className="ads-button-filter px-2 py-1 rounded-pill bg-white border border-secondary-subtle"
                        style={{ cursor: "pointer", fontSize: "13px" }}
                      >
                        Ratio Penjualan
                      </div>
                    </div>
                  </div>
                  {/* Status filter */}
                  <div
                    className="d-flex align-items-center gap-2 mb-3"
                    style={{ width: "fit-content", listStyleType: "none" }}
                  >
                    <span>Status Produk</span>
                    <div className="d-flex gap-2">
                      <div
                        className={`ads-button-filter px-2 py-1 rounded-pill bg-white ${
                          statusProductFilter === "all"
                            ? "custom-font-color custom-border-select"
                            : "border border-secondary-subtle"
                        }`}
                        onClick={() => setStatusProductFilter("all")}
                        style={{ cursor: "pointer", fontSize: "13px" }}
                      >
                        Semua
                      </div>
                      <div
                        className={`ads-button-filter px-2 py-1 rounded-pill bg-white ${
                          statusProductFilter === "scheduled"
                            ? "custom-font-color custom-border-select"
                            : "border border-secondary-subtle"
                        }`}
                        onClick={() => setStatusProductFilter("scheduled")}
                        style={{ cursor: "pointer", fontSize: "13px" }}
                      >
                        Terjadwal
                      </div>
                      <div
                        className={`ads-button-filter px-2 py-1 rounded-pill bg-white ${
                          statusProductFilter === "ongoing"
                            ? "custom-font-color custom-border-select"
                            : "border border-secondary-subtle"
                        }`}
                        onClick={() => setStatusProductFilter("ongoing")}
                        style={{ cursor: "pointer", fontSize: "13px" }}
                      >
                        Berjalan
                      </div>
                      <div
                        className={`ads-button-filter px-2 py-1 rounded-pill bg-white ${
                          statusProductFilter === "paused"
                            ? "custom-font-color custom-border-select"
                            : "border border-secondary-subtle"
                        }`}
                        onClick={() => setStatusProductFilter("paused")}
                        style={{ cursor: "pointer", fontSize: "13px" }}
                      >
                        Nonaktif
                      </div>
                      <div
                        className={`ads-button-filter px-2 py-1 rounded-pill bg-white ${
                          statusProductFilter === "ended"
                            ? "custom-font-color custom-border-select"
                            : "border border-secondary-subtle"
                        }`}
                        onClick={() => setStatusProductFilter("ended")}
                        style={{ cursor: "pointer", fontSize: "13px" }}
                      >
                        Berakhir
                      </div>
                    </div>
                  </div>
                  {/* Other filter */}
                  <div className="d-flex flex-column mb-3 gap-2">
                    <div className="d-flex gap-2 w-full">
                      {/* search bar */}
                      <div className="w-100">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Cari berdasarkan nama"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      {/* clasification filter */}
                      <div className="w-100">
                        <Select
                          isMulti
                          options={typeOptions}
                          value={selectedTypes}
                          onChange={handleTypeChange}
                          placeholder="Filter Klasifikasi"
                        />
                      </div>
                      {/* column filter */}
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
                  {/* Table container */}
                  <div className="table-responsive">
                    <table className="table table-centered">
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
                                  <td style={{ width: "500px" }}>
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