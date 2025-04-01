export default function PerformanceProductPage() {
  const [filteredData, setFilteredData] = useState(productJsonData.result.items);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [comparatorDate, setComparatorDate] = useState(null);
  const [comaparedDate, setComaparedDate] = useState(null);
  const [date, setDate] = useState(getAllDaysInLast7Days());
  const [showCalendar, setShowCalendar] = useState(false);
  const [chartData, setChartData] = useState([]);
  const chartRef = useRef(null);
  const [selectedMetrics, setSelectedMetrics] = useState(["visitor"]);
  const [showAlert, setShowAlert] = useState(false);

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
      color: "#DFC100FF",
      dataKey: "confirmed_units" 
    },
  };

  // Handle product click by clicking the product in name column
  const handleProductClick = (product) => {
    // same as like before u code
  };  

  // Convert start_time to date format with epoch method
  const convertEpochToDate = (epoch, mode = "daily") => {
    // same as like before u code
  };

  // Get all days in last 7 days in a month
  function getAllDaysInLast7Days() {
    // same as like before u code
  }

  // Get all days in a month
  function getAllDaysInAMonth() {
    // same as like before u code
  }

  // Get all hourly intervals for a specific date
  function getHourlyIntervals(selectedDate) {
    // same as like before u code
  }

  function getDateRangeIntervals(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dateArray = [];
    
    // Check if dates are the same or only one day apart
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) {
      // If same day or only one day apart, return hourly intervals
      return getHourlyIntervals(startDate.toISOString().split('T')[0]);
    }
    
    // Otherwise return daily intervals
    let currentDate = new Date(start);
    while (currentDate <= end) {
      dateArray.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dateArray;
  }

  // Generate chart data for multiple metrics
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
      
      // Initialize dataMap with zeros
      timeIntervals.forEach((time) => {
        dataMap[time] = 0;
      });

      // Aggregate data
      filteredProducts.forEach((product) => {
        const productDateTime = convertEpochToDate(product.start_time, mode);
        if (dataMap[productDateTime] !== undefined) {
          dataMap[productDateTime] += product[dataKey] || 0;
        }
      });

      // Create series data
      const seriesData = {
        name: metric.label,
        data: timeIntervals.map((time) => dataMap[time]),
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
      
      // Prepare series for the chart
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

      const option = {
        toolbox: { feature: { saveAsImage: {} } },
        grid: { left: 50, right: 50, bottom: 50, containLabel: false },
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
          data: chartData.timeIntervals || [], 
          boundaryGap: false 
        },
        yAxis: { 
          name: "Value",
          type: "value", 
          splitLine: { show: true } 
        },
        series: series,
      };
      
      chartInstance.setOption(option);
      return () => chartInstance.dispose();
    }
  }, [chartData]);

  // Handle button 
  const handleStyleMatrixButton = (metricKey) => {
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
        {showAlert && (
          <div className="alert alert-warning alert-dismissible fade show" role="alert">
            Maksimal 3 metrik yang dapat dipilih sekaligus
            <button type="button" className="btn-close" onClick={() => setShowAlert(false)}></button>
          </div>
        )}
        {/* Date Filter */}
        <div className="d-flex justify-content-between align-items-start pb-3">
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
                <div className="d-flex align-items-end pb-3">
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
          <div ref={chartRef} style={{ width: "100%", height: "400px" }}></div>
          {/* Matric filter */}
          <div
            className="d-flex align-items-center gap-2"
            style={{ width: "fit-content", listStyleType: "none" }}
          >
            <span>Matrix Produk</span>
            <div className="d-flex gap-2">
              {Object.keys(metrics).map((metricKey) => (
                <button 
                  key={metricKey}
                  style={handleStyleMatrixButton(metricKey)}
                  onClick={() => handleMetricFilter(metricKey)}
                >
                  {metrics[metricKey].label}
                </button>
              ))}
            </div>
            {selectedMetrics.length === 0 && (
              <div className="alert bg-warning">
                Pilih minimal satu metrik untuk menampilkan data
              </div>
            )}
          </div>
          {/* Table */}
          <table className="table table-centered">
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
            <tbody>
              {(filteredData?.map((entry, index) => (
                  <>
                    <tr key={entry.id}>
                      {selectedColumns.includes("name") && (
                        <td style={{
                          width: "400px",
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
                    </tr>
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </BaseLayout>
    </>
  );
};