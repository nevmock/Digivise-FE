import React, { useState, useEffect, useCallback, useRef } from "react";
import * as echarts from "echarts";
import Calendar from "react-calendar";

import stockJsonData from "../../api/stock.json";
import BaseLayout from "../../components/organisms/BaseLayout";
import "react-calendar/dist/Calendar.css";

export default function PerformanceStockPage() {
  const [filteredData, setFilteredData] = useState(stockJsonData.data.products);
  const [chartData, setChartData] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [date, setDate] = useState(null);
  const [showCalender, setShowCalender] = useState(false);
  const chartRef = useRef(null);

  // Convert date from json to readable date with epoch
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

  // Get all days in last 7 days
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

  // Configure chart data by parent(calender)
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
      } else {
        selectedDates = [date.toISOString().split("T")[0]];
      }
      
      if (typeof date === "string" && date === "last7days") {
        selectedDates = getAllDaysInLast7Days();
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
                      : typeof date === "string"
                      ? "1 Minggu terakhir"
                      : date.toLocaleDateString("id-ID")}
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
                        <p style={{ cursor: "pointer" }} onClick={() => setDate("last7days")}> 1 Minggu terakhir </p>
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
              <div className="d-flex flex-column">
                {/* Status filter*/}
                <div
                  className="d-flex flex-column gap-1 mb-3"
                  style={{ width: "fit-content", listStyleType: "none" }}
                >
                  <span>Status Iklan</span>
                  {/* Filter buttons */}
                </div>
                {/* Other filter*/}
                <div className="d-flex flex-column mb-3 gap-2">
                  <div className="d-flex gap-2 w-full">
                    {/* Search bar */}
                    {/* Clasification filter */}
                    {/* Column filter */}
                  </div>
                  {/* Option column filter */}
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
      </BaseLayout>
    </>
  );
};