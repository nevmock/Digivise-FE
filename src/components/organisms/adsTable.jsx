import React, { useState, useEffect, useCallback, useRef } from "react";
import Select from "react-select";
import Calendar from "react-calendar";
import * as echarts from "echarts";

import useDebounce from "../../hooks/useDebounce";
import iconArrowUp from "../../assets/icon/arrow-up.png";
import iconArrowDown from "../../assets/icon/arrow-down.png";

const AdsTable = ({ data, dummy }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [filteredData, setFilteredData] = useState(data.data.entry_list);
  const [statusProductFilter, setStatusProductFilter] = useState("all");
  const [selectedClassificationOption, setSelectedClassificationOption] = useState([]);
  const [selectedOptionPlacement, setSelectedOptionPlacement] = useState(null);
  const [selectedAds, setSelectedAds] = useState([
    { value: "all", label: "Semua Tipe" },
  ]);
  const [showTableColumn, setShowTableColumn] = useState(false);
  const [chartData, setChartData] = useState([]);
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

      data.data.entry_list.forEach((product) => {
        const productDate = convertEpochToDate(product.campaign.start_time);
      
        if (matrixDataMap[productDate] !== undefined) {
          matrixDataMap[productDate] += product.campaign?.daily_budget || 0;
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
          left: 100,
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
        yAxis: { name: "Biaya", type: "value", splitLine: { show: true } },
        series: [
          {
            type: "line",
            smooth: true,
            symbolSize: 5,
            emphasis: { focus: "series" },
            data: chartData.map((item) => totalMatrixData(item.totalMatrixData)),
          },
        ],
      };
      chartInstance.setOption(option);
    }
  }, [chartData]);


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
    if (statusProductFilter !== "all") {
      filtered = filtered.filter((entry) => entry.state === statusProductFilter);
    }

    // Filter by sales classification
    // if (selectedClassificationOption.length > 0) {
    //   filtered = filtered.filter((entry) => {
    //     const classification = getClassification(entry);
    //     return selectedClassificationOption.some((type) => type.value === classification);
    //   });
    // }

     // Filter by ads type (exclude "all" from filtering logic)
    const selectedAdValues = selectedAds.map((ad) => ad.value);
    if (!selectedAdValues.includes("all")) {
      filtered = filtered.filter((entry) => selectedAdValues.includes(entry.ad_type));
    }

    // Filter by placement (if a placement is selected and not "all")
    if (selectedOptionPlacement && selectedOptionPlacement.value !== "all") {
      filtered = filtered.filter((entry) => entry.placement === selectedOptionPlacement.value);
    }

    setFilteredData(filtered);
  }, [
    debouncedSearchTerm,
    statusProductFilter,
    data.products,
    selectedClassificationOption,
    selectedOptionPlacement,
    selectedAds,
    data.data.entry_list,
  ]);

  const checkTypeAds = (type) => {
    switch (type) {
      case "product_manual":
        return "Iklan Toko Manual";
      case "shop_auto":
        return "Iklan Toko Otomatis";
      default:
        return "No Detected";
    }
  };

  const totalMatrixData = (budget) => {
    if (budget <= 0) return 0;

    const convertedBudget = Math.floor(budget / 100000);
    return convertedBudget;
  };

  const convertBudgetToIDR = (budget) => {
    if (budget <= 0) return 0;

    const convertedBudget = Math.floor(budget / 100000);
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(convertedBudget);
  };


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
    { value: "recommendation", label: "Halaman Rekomendasi" },
    { value: "search", label: "Halaman Pencarian" },
  ];

  const handlePlacementChange = (selectedOption) => {
    setSelectedOptionPlacement(selectedOption);
  };

  const isTypeManualProductSelected = selectedAds.some(
    (option) => option.value === "product_manual"
  );


  // ADS FILTER FEATURE
  const typeAdsOptions = [
    { value: "all", label: "Semue Tipe" },
    { value: "ads_product_gmv_max_roas", label: "Iklan Produk GMV Max ROAS" },
    { value: "ads_product_gmv_max_auto", label: "Iklan Produk GMV Max Auto" },
    { value: "ads_product_auto", label: "Iklan Produk Auto" },
    { value: "product_manual", label: "Iklan Produk Manual" },
    { value: "product_auto", label: "Iklan Auto" },
    { value: "market_manual", label: "Iklan Toko Manual" },
  ];

  const handleAdsChange = (selectedOptions) => {
    const updatedSelection = [
      { value: "all", label: "Semua Tipe" },
      ...selectedOptions.filter((option) => option.value !== "all"),
    ];
    setSelectedAds(updatedSelection);
  };

  return (
    <div className="card">
      <div className="card-body">
        {/* Header & Date Filter */}
        <div className="d-flex justify-content-between align-items-start pb-3">
          <h5>{dummy.data.page_info.total} total produk</h5>
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
                    onClick={() => setDate(new Date(Date.now() - 86400000))}
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
                <div style={{ width: "1px", height: "auto", backgroundColor: "#E3E3E3FF", margin: "10px 0"}}></div>
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
          <div ref={chartRef} style={{ width: "100%", height: "400px" }}></div>
          {/* Filter & Table */}
          <div className="d-flex flex-column">
            {/* Matrix filter */}
            <div
              className="d-flex align-items-center gap-2 mb-3"
              style={{ width: "fit-content", listStyleType: "none" }}
            >
              <span>Matrix Produk</span>
              <div className="d-flex gap-2">
                <div
                  className="status-button-filter px-2 py-1 rounded-pill bg-white custom-font-color custom-border-select"
                  style={{ cursor: "pointer", fontSize: "13px" }}
                >
                  <span>Biaya</span>
                </div>
                <div
                  className="status-button-filter px-2 py-1 rounded-pill bg-white border border-secondary-subtle"
                  style={{ cursor: "pointer", fontSize: "13px" }}
                >
                  <span>Iklan Dilihat</span>
                </div>
                <div
                  className="status-button-filter px-2 py-1 rounded-pill bg-white border border-secondary-subtle"
                  style={{ cursor: "pointer", fontSize: "13px" }}
                >
                  <span>Click</span>
                </div>
                <div
                  className="status-button-filter px-2 py-1 rounded-pill bg-white border border-secondary-subtle"
                  style={{ cursor: "pointer", fontSize: "13px" }}
                >
                  <span>CTR</span>
                </div>
                <div
                  className="status-button-filter px-2 py-1 rounded-pill bg-white border border-secondary-subtle"
                  style={{ cursor: "pointer", fontSize: "13px" }}
                >
                  <span>ACOS</span>
                </div>
                <div
                  className="status-button-filter px-2 py-1 rounded-pill bg-white border border-secondary-subtle"
                  style={{ cursor: "pointer", fontSize: "13px" }}
                >
                  <span>Convertion</span>
                </div>
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
                  className={`status-button-filter px-2 py-1 rounded-pill bg-white ${statusProductFilter === "all"
                      ? "custom-font-color custom-border-select"
                      : "border border-secondary-subtle"
                    }`}
                  onClick={() => setStatusProductFilter("all")}
                  style={{ cursor: "pointer", fontSize: "13px" }}
                >
                  Semua
                </div>
                <div
                  className={`status-button-filter px-2 py-1 rounded-pill bg-white ${statusProductFilter === "scheduled"
                      ? "custom-font-color custom-border-select"
                      : "border border-secondary-subtle"
                    }`}
                  onClick={() => setStatusProductFilter("scheduled")}
                  style={{ cursor: "pointer", fontSize: "13px" }}
                >
                  Terjadwal
                </div>
                <div
                  className={`status-button-filter px-2 py-1 rounded-pill bg-white ${statusProductFilter === "ongoing"
                      ? "custom-font-color custom-border-select"
                      : "border border-secondary-subtle"
                    }`}
                  onClick={() => setStatusProductFilter("ongoing")}
                  style={{ cursor: "pointer", fontSize: "13px" }}
                >
                  Berjalan
                </div>
                <div
                  className={`status-button-filter px-2 py-1 rounded-pill bg-white ${statusProductFilter === "paused"
                      ? "custom-font-color custom-border-select"
                      : "border border-secondary-subtle"
                    }`}
                  onClick={() => setStatusProductFilter("paused")}
                  style={{ cursor: "pointer", fontSize: "13px" }}
                >
                  Nonaktif
                </div>
                <div
                  className={`status-button-filter px-2 py-1 rounded-pill bg-white ${statusProductFilter === "ended"
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
            {/* Other filter*/}
            <div className="d-flex flex-column mb-3 gap-2">
              <div className="d-flex gap-2 w-100 justify-content-between">
                {/* search bar */}
                <div className="w-25">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Cari berdasarkan nama"
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {isTypeManualProductSelected && (
                  <div className="w-25">
                    <Select
                      options={placementOptions}
                      value={selectedOptionPlacement}
                      onChange={handlePlacementChange}
                      placeholder="Pilih Penempatan"
                    />
                  </div>
                )}
                {/* ads filter */}
                <div className="w-25">
                  <Select
                    isMulti
                    options={typeAdsOptions}
                    value={selectedAds}
                    onChange={handleAdsChange}
                    placeholder="Pilih Tipe Iklan"
                    isClearable={false}
                  />
                </div>
                {/* clasification filter */}
                <div className="w-25">
                  <Select
                    isMulti
                    options={typeClasificationOptions}
                    value={selectedClassificationOption}
                    onChange={handleClassificationChange}
                    placeholder="Filter Klasifikasi"
                  />
                </div>
                {/* column filter */}
                <div className="w-25 h-full">
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
            {/* Container table */}
            <div className="table-responsive">
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
                        <tr key={entry.id}>
                          <td>{index + 1}</td>
                          {selectedColumns.includes("info_iklan") && (
                            <td
                              className="d-flex gap-2"
                              style={{
                                width: "400px",
                                maxWidth: "400px",
                                cursor: "pointer",
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