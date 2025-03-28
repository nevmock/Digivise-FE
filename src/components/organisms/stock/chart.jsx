import React, { useEffect, useState } from "react";
import * as echarts from "echarts";

const StockChart = ({ chartData }) => {
  const chartRef = React.useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chartInstance = echarts.init(chartRef.current);

    // Dapatkan bulan dan tahun saat ini
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Buat array tanggal dari awal hingga akhir bulan
    const dateRange = [];
    let currentDate = new Date(firstDayOfMonth);
    while (currentDate <= lastDayOfMonth) {
      dateRange.push(currentDate.toISOString().split("T")[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Buat mapping total stok berdasarkan tanggal
    const stockMap = new Map();
    chartData.forEach(({ date, totalStock }) => {
      if (!stockMap.has(date)) {
        stockMap.set(date, 0);
      }
      stockMap.set(date, stockMap.get(date) + totalStock);
    });

    // Siapkan data untuk chart
    const seriesData = dateRange.map((date) => ({
      date,
      totalStock: stockMap.get(date) || 0,
    }));

    // Konfigurasi ECharts
    const option = {
      tooltip: {
        trigger: "axis",
        formatter: (params) => {
          const data = params[0].data;
          return `${data.date}: ${data.totalStock}`;
        },
      },
      xAxis: {
        type: "category",
        data: dateRange,
      },
      yAxis: {
        type: "value",
      },
      series: [
        {
          name: "Total Stok",
          type: "line",
          data: seriesData.map((item) => item.totalStock),
        },
      ],
    };

    chartInstance.setOption(option);

    return () => {
      chartInstance.dispose();
    };
  }, [chartData]);

  return <div ref={chartRef} style={{ width: "100%", height: "400px" }} />;
};

export default StockChart;
  