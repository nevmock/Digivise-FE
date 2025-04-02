export default function PerformanceStockPage() {
  const [filteredData, setFilteredData] = useState(stockJsonData.data.products);
  const [chartData, setChartData] = useState([]);
  const chartRef = useRef(null);
  const [showCalender, setShowCalender] = useState(false);
  const [date, setDate] = useState(getAllDaysInLast7Days());
  const [selectedProduct, setSelectedProduct] = useState(null);

  // CUSTOM CHART & PRODUCT CLICK FEATURE
  // Handle product click by clicking the product in name column
  const handleProductClick = (product) => {
    // Jika produk yang diklik sama dengan yang sebelumnya dipilih, reset chart kembali ke semua produk
    if (selectedProduct?.id === product.id) {
      setSelectedProduct(null);
    // Jika produk yang diklik berbeda, set chart data sesuai produk yang dipilih
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
  
  // Generate chart data based on selected date and product
  function generateChartData(selectedDate = null, product = null) { 
    let stockMap = {};
    let timeIntervals = [];
    let mode = "daily";
  
    // Find a range of time by selected date/filter
    if (selectedDate === null || Array.isArray(selectedDate)) {
      timeIntervals = getAllDaysInLast7Days();
    } else if (selectedDate === "Bulan Ini") {
      timeIntervals = getAllDaysInAMonth();
    } else {
      timeIntervals = getHourlyIntervals(selectedDate);
      mode = "hourly";
    }
  
    // Initialize stockMap with time intervals
    timeIntervals.forEach((time) => {
      stockMap[time] = 0;
    });
  
    // Filter products based on selected product
    let filteredProducts = stockJsonData.data.products;
    if (product) {
      filteredProducts = stockJsonData.data.products.filter((p) => p.id === product.id);
    }
  
    // Calculate total stock for each time interval
    filteredProducts.forEach((product) => {
      const productDateTime = convertEpochToDate(product.campaign.start_time, mode);
      if (stockMap[productDateTime] !== undefined) {
        stockMap[productDateTime] += product.stock_detail?.total_available_stock || 0;
      }
    });
  
    return timeIntervals.map((time) => ({ date: time, totalStock: stockMap[time] }));
  }  

  // Initialize chart data when the component mounts or when date or selectedProduct changes
  useEffect(() => {
    setChartData(generateChartData(date, selectedProduct));
  }, [date, selectedProduct]);

  // Initialize chart when the component mounts or when chartData changes
  useEffect(() => {
    let xAxisData = chartData?.map((item) => item.date);
    const includesColon = xAxisData?.some((item) => item.includes(":"));
    if (includesColon) {
      xAxisData = xAxisData.map((item) => item.split(" ")[1]);
    } else {
      xAxisData = xAxisData.map((item) => item.split("-").slice(1).join("-"));
    }

    if (chartRef.current) {
      const chartInstance = echarts.init(chartRef.current);
      const option = {
        toolbox: { feature: { saveAsImage: {} } },
        grid: { left: 50, right: 50, bottom: 50, containLabel: false },
        tooltip: { trigger: "axis" },
        xAxis: { name: "Date", type: "category", data: xAxisData, boundaryGap: false },
        yAxis: { name: "Stock", type: "value", splitLine: { show: true } },
        series: [
          {
            type: "line",
            smooth: true,
            showSymbol: false,
            emphasis: { focus: "series" },
            data: chartData.map((item) => item.totalStock),
          },
        ],
      };
      chartInstance.setOption(option);
      return () => chartInstance.dispose();
    }
  }, [chartData]);


  // FILTER COLUMNS FEATURE
  // Define all columns
  const allColumns = [
    { key: "name", label: "Nama" },
    { key: "code", label: "Kode" },
    { key: "stock", label: "Stok" },
    { key: "availability", label: "Availability" }
  ];

  return (
    <>
      <BaseLayout>
        {/* Date filter */}
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
              <Calendar
                onChange={(selectedDate) => {
                  setDate(selectedDate.toISOString().split("T")[0]);
                  setShowCalender(false);
                }}
                value={date === "Bulan Ini" ? new Date() : date} 
                maxDate={new Date()}
              />
            </div>
          )}
        </div>
        {/* Chart */}
        <div ref={chartRef} style={{ width: "100%", height: "300px" }} className="mb-2"></div>
        {/* Table */}
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
            {filteredData?.map((entry) => (
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
            }
          </tbody>
        </table>
      </BaseLayout>
    </>
  );
};