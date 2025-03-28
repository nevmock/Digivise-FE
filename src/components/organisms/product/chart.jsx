import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";

const ProductChart = () => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chartInstance = echarts.init(chartRef.current);

    const dateMonth = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, "0"));
    
    const stockValuesMap = {
      "01": 20,
      "04": 40,
      "10": 10,
      "20": 40,
      "30": 100,
    };

    const stockValues = dateMonth.map(date => stockValuesMap[date] ?? 0);

    const option = {
      tooltip: {
        trigger: "axis"
      },
      grid: {
        left: 30,
        right: 110,
        bottom: 30,
        containLabel: true
      },
      toolbox: {
        feature: {
          saveAsImage: {}
        }
      },
      xAxis: {
        name: "Date",
        type: "category",
        splitLine: {
          show: false
        },
        axisLabel: {
          margin: 30,
          fontSize: 16
        },
        boundaryGap: false,
        data: dateMonth
      },
      yAxis: {
        name: "Stock",
        type: "value",
        axisLabel: {
          margin: 30,
          fontSize: 16,
          formatter: "{value}"
        },
        min: 0,
        max: Math.max(...Object.values(stockValuesMap))
      },
      series: [
        {
          name: "Stock",
          type: "line",
          smooth: true,
          symbolSize: 5,
          lineStyle: {
            width: 2    
          },
          emphasis: {
            focus: "series"
          },
          connectNulls: true,
          data: stockValues
        }
      ]
    };

    chartInstance.setOption(option);

    return () => chartInstance.dispose();
  }, []);

  return <div ref={chartRef} style={{ width: "100%", height: "400px" }} />;
};

export default ProductChart;
