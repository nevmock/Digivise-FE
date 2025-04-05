import stockJsonData from "../../api/stock.json";
export default function PerformanceStockPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [filteredData, setFilteredData] = useState(stockJsonData.data.products);
  const [expandedVariantProduct, setExpandedVariantProduct] = useState({});
  const [chartData, setChartData] = useState([]);
  const chartRef = useRef(null);
  const [showCalender, setShowCalender] = useState(false);
  const [date, setDate] = useState(getAllDaysInLast7Days());
  const [selectedProduct, setSelectedProduct] = useState(null);

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

  useEffect(() => {
    let filtered = stockJsonData.data.products;
    // Filter by search term
    if (debouncedSearchTerm !== "") {
      filtered = stockJsonData.data.products.filter((entry) =>
        entry.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    setFilteredData(filtered);
  }, [
    debouncedSearchTerm,
    stockJsonData.data.products,
  ]);

  return (
    <>
        <BaseLayout>
            <div className="card">
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
                {/* Chart */}
                <div ref={chartRef} style={{ width: "100%", height: "300px" }} className="mb-2"></div>
                {/* Filter & Table */}
                <div className="custom-filter-search">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Cari berdasarkan nama"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                </div>
                <table className="table table-centered">
                <thead className="table-light">
                    <tr>
                    {filteredData.length > 0 && <th scope="col"></th>}
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
                    {filteredData?.map((entry) => (
                        <>
                        <tr key={entry.id}>
                            {filteredData.length > 0 && (
                            <td onClick={() => toggleRow(entry.id)} style={{ cursor: "pointer"}}>
                                {expandedVariantProduct[entry.id] (
                                <img
                                    src={iconArrowUp}
                                    alt="icon arrow up"
                                    style={{ width: "8px", height: "8px" }}
                                />
                                )}
                            </td>
                            )}
                            {selectedColumns.includes("name") && (
                            <td
                                onClick={() => handleProductClick(entry)}
                            >
                                {entry.name}
                            </td>
                            )}
                        </tr>
                        {expandedVariantProduct[entry.id] && (
                            <tr className="bg-light">
                            <td
                                colSpan={selectedColumns.length + 1}
                            >
                                <ul className="list-group">
                                {entry.model_list.map((variant, index) => (
                                    <li
                                    key={variant.id}
                                    className="list-group-item d-flex justify-content-start gap-2"
                                    >
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
                    }
                </tbody>
                </table>
            </div>
        </BaseLayout>
    </>
  );
};