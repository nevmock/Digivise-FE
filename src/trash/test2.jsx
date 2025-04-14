import Calendar from "react-calendar";
import * as echarts from "echarts";
const AdsTable = ({ data }) => {
  const [filteredData, setFilteredData] = useState(data.data.entry_list);
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
    // dan matric lainnnya dibawah
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
  }, [date, selectedProduct, selectedMetrics, comparatorDate, comaparedDate, data.data.entry_list]);

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
                result += `<span style="${param.color};"></span> ${param.seriesName}: ${param.value}<br/>`;
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
    // dan colum lainnya dibawah
  ];

  // Handle style for matric filter button
  const handleStyleMatricButton = (metricKey) => {
    const isActive = selectedMetrics.includes(metricKey);
    const metric = metrics[metricKey];
    
    return {
      border: `1px solid ${isActive ? metric.color : "rgb(179.4, 184.2, 189)"}`,
      color: isActive ? metric.color : "#666666",
      fontWeight: isActive ? "medium" : "normal",
    };
  };

  return (
    <div className="card">
        {/* Date Filter */}
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
            >
            <div
                className="d-flex"
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
        <div ref={chartRef} style={{ width: "100%", height: "300px" }}></div>
        {/* Filter & Table */}
        <div className="d-flex">
        {/* Matric filter */}
        <div className="gap-2">
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
        <table className="table table-centered">
            <thead className="table-light">
                <tr>
                {filteredData.length !== 0 && filteredData !== null && <th scope="col">No</th>}
                {allColumns
                    .filter((col) => selectedColumns.includes(col.key))
                    .map((col) => (
                    <th key={col.key}>
                        <div className="d-flex justify-content-start align-items-center">
                        {col.label}
                        </div>
                    </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {filteredData?.map((entry, index) => (
                    <>
                        <tr key={entry.campaign.campaign_id}>
                            {selectedColumns.includes("info_iklan") && (
                            <td
                                style={{
                                color:
                                selectedProduct?.campaign.campaign_id === entry.campaign.campaign_id
                                    ? "#F6881F"
                                    : "",
                                }}
                                onClick={() => handleProductClick(entry)}
                            >
                                <span>{entry.title}</span>
                            </td>
                            )}
                            {selectedColumns.includes("biaya") && (
                            <td style={{ width: "200px" }}>
                                <span>
                                    Rp {convertBudgetToIDR(entry.campaign.daily_budget)}
                                </span>
                            </td>
                            )}
                            {selectedColumns.includes("iklan_dilihat") && (
                            <td style={{ width: "200px" }}>
                                <span>{entry.report.impression}</span>
                            </td>
                            )}
                            {selectedColumns.includes("click") && (
                                <td style={{ width: "200px" }}>
                                    <span>{entry.report.click}</span>
                                </td>
                            )}
                            {/* dan data koolom lainnya */}
                        </tr>
                    </>
                ))}
            </tbody>
        </table>
        </div>
    </div>
  );
};

export default AdsTable;