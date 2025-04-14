import detailAdsJson from "../../api/detail-ads.json";
export default function DetailAds() {
    const [filteredData, setFilteredData] = useState(detailAdsJson.data);
    const [showTableColumn, setShowTableColumn] = useState(false);
    const [chartData, setChartData] = useState([]);
    const [comparatorDate, setComparatorDate] = useState(null);
    const [comaparedDate, setComaparedDate] = useState(null);
    const [date, setDate] = useState(getAllDaysInLast7Days());
    const [showCalendar, setShowCalendar] = useState(false);
    const chartRef = useRef(null);
    const [showAlert, setShowAlert] = useState(false);
    const [selectedMetrics, setSelectedMetrics] = useState(["impression"]);

    const metrics = {
        impression: {
            label: "Iklan Dilihat", //
            color: "#A50000FF",
            dataKey: "impression"
        },
        clicks: {
            label: "Jumlah Klik", //
            color: "#37009EFF",
            dataKey: "clicks"
        },
        persentage_per_click: {
            label: "Persentase Klik", // 
            color: "#004CBEFF",
            dataKey: "persentage_per_click"
        },
        // dan metric lainnya dibawah 
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

    function getAllDaysInLast7Days() {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split("T")[0];
        }).reverse();
    };

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

    function getHourlyIntervals(selectedDate) {
        return Array.from({ length: 24 }, (_, i) => {
            const hour = String(i).padStart(2, "0");
            return `${selectedDate} ${hour}:00`;
        });
    };

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

    function generateSingleCampaignChartData(selectedDate = null, filteredData = null, selectedMetrics = ["cost_per_click"]) {
        if (!filteredData) return { timeIntervals: [], series: [], isSingleDay: false };

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

        const campaignStartDate = convertEpochToDate(filteredData.campaign.start_time, mode);
        const campaignDateOnly = campaignStartDate.includes(" ") ?
            campaignStartDate.split(" ")[0] : campaignStartDate;

        selectedMetrics?.forEach(metricKey => {
            const metric = metrics[metricKey];
            if (!metric) return;

            const dataKey = metric.dataKey;
            let dataMap = {};

            timeIntervals.forEach((time) => {
                dataMap[time] = 0;
            });

            if (timeIntervals.includes(campaignDateOnly)) {
                if (dataKey === "cost_per_click") {
                    dataMap[campaignDateOnly] = filteredData.campaign[dataKey] || 0;
                } else {
                    dataMap[campaignDateOnly] = filteredData.report[dataKey] || 0;
                }
            }
            else if (comparatorDate && comaparedDate) {
                const campaignDate = new Date(filteredData.campaign.start_time * 1000);
                const startDay = new Date(comparatorDate);
                startDay.setHours(0, 0, 0, 0);
                const endDay = new Date(comaparedDate);
                endDay.setHours(23, 59, 59, 999);

                if (campaignDate >= startDay && campaignDate <= endDay) {
                    if (!timeIntervals.includes(campaignDateOnly)) {
                        timeIntervals.push(campaignDateOnly);
                        timeIntervals.sort();
                    }

                    if (dataKey === "cost_per_click") {
                        dataMap[campaignDateOnly] = filteredData.campaign[dataKey] || 0;
                    } else {
                        dataMap[campaignDateOnly] = filteredData.report[dataKey] || 0;
                    }
                }
            }

            const seriesData = {
                name: metric.label,
                data: timeIntervals.map((time) => dataMap[time] || 0),
                color: metric.color
            };

            result.series.push(seriesData);
        });

        return result;
    };

    function handleMetricFilter(metricKey) {
        setSelectedMetrics(prev => {
            if (prev.includes(metricKey)) {
                return prev.filter(m => m !== metricKey);
            }
            else if (prev.length < 3) {
                return [...prev, metricKey];
            }
            else {
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 2000);
                return prev;
            }
        });
    };

    function handleDateSelection(selectedDateOption) {
        setComparatorDate(null);
        setComaparedDate(null);
        setDate(selectedDateOption);
    };

    function handleComparisonDatesConfirm() {
        if (comparatorDate && comaparedDate) {
            setDate(null);
            setShowCalendar(false);
        }
    };

    const handleStyleMatricButton = (metricKey) => {
        const isActive = selectedMetrics.includes(metricKey);
        const metric = metrics[metricKey];

        return {
            color: isActive ? metric.color : "#666666",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: isActive ? "medium" : "normal",
            transition: "all 0.3s ease"
        };
    };

    useEffect(() => {
        if (filteredData && filteredData.keyword_ads) {
            const chartData = generateSingleCampaignChartData(date, filteredData, selectedMetrics);
            setChartData(chartData);
        }
    }, [date, filteredData, selectedMetrics, comparatorDate, comaparedDate]);

    useEffect(() => {
        if (chartRef.current && chartData.timeIntervals) {
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
            const isSingleDay = chartData.isSingleDay;
            const xAxisData = chartData.timeIntervals;

            const leftGrid = 60; 
            const rotateAxisLabel = 45; 

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
                    formatter: function (params) {
                        let result = params[0].axisValue + '<br/>';
                        params.forEach(param => {
                            result += `<span;background-color:${param.color};"></span> ${param.seriesName}: ${param.value}<br/>`;
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

    const allColumns = [
        { key: "keywords", label: "Kata Pencarian" },
        { key: "mathcing_type", label: "Tipe Pencocokan" },
        { key: "cost_per_click", label: "Per Klik" },
        { key: "impression", label: "Iklan Dilihat" },
        // dan kolom lainnya
    ];

    const calculateTotalMetric = (metricKey) => {
        if (!filteredData || !filteredData.keyword_ads || filteredData.keyword_ads.length === 0) {
            return 0;
        }
        let filteredKeywords = filteredData.keyword_ads;
        if (date || (comparatorDate && comaparedDate)) {
            let startDate, endDate;

            if (comparatorDate && comaparedDate) {
                startDate = new Date(comparatorDate);
                startDate.setHours(0, 0, 0, 0);

                endDate = new Date(comaparedDate);
                endDate.setHours(23, 59, 59, 999);
            } else if (typeof date === 'string' && date === "Bulan Ini") {
                const today = new Date();
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            } else if (Array.isArray(date)) {
                startDate = new Date(date[0]);
                endDate = new Date(date[date.length - 1]);
                endDate.setHours(23, 59, 59, 999);
            } else if (typeof date === 'string') {
                startDate = new Date(date);
                startDate.setHours(0, 0, 0, 0);

                endDate = new Date(date);
                endDate.setHours(23, 59, 59, 999);
            }

            if (startDate && endDate) {
                filteredKeywords = filteredKeywords.filter(keyword => {
                    const keywordDate = new Date(filteredData.campaign.start_time * 1000);
                    return keywordDate >= startDate && keywordDate <= endDate;
                });
            }
        }

        return filteredKeywords.reduce((total, keyword) => {
            return total + (keyword[metricKey] || 0);
        }, 0);
    };


    return (
        <>
            <BaseLayout>
                {/* Peforma */}
                <div className="d-flex">
                    {/* Date filter */}
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
                            <div className="d-flex">
                                <div className="d-flex">
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
                                <div style={{ width: "1px", height: "auto", backgroundColor: "#E3E3E3FF", margin: "10px 0" }}></div>
                                {/* Kalender pembanding */}
                                <div>
                                    <p>Tanggal Pembanding</p>
                                    <Calendar onChange={(date) => setComparatorDate(date)} value={comparatorDate} maxDate={comaparedDate || new Date(2100, 0, 1)} />
                                </div>
                                {/* Kalender dibanding */}
                                <div>
                                    <p>Tanggal Dibanding</p>
                                    <Calendar onChange={(date) => setComaparedDate(date)} value={comaparedDate} minDate={comparatorDate || new Date()} />
                                </div>
                                {/* Confirm button for date range */}
                                <div>
                                    <button
                                        onClick={handleComparisonDatesConfirm}
                                        disabled={!comparatorDate || !comaparedDate}
                                    >
                                        Terapkan
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Matric filter */}
                    <div className="row">
                        {Object.keys(metrics).map((metricKey) => (
                            <div className="col-12">
                                <div
                                    onClick={() => handleMetricFilter(metricKey)}
                                    style={handleStyleMatricButton(metricKey)}
                                    key={metricKey}
                                >
                                    <h6>
                                        {metrics[metricKey].label}
                                    </h6>
                                    <span>
                                        {calculateTotalMetric(metricKey)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Chart */}
                    <div ref={chartRef} style={{ width: "100%", height: "300px" }}></div>
                    {/* Table */}
                    <h5>Keywords</h5>
                    <table className="table table-centered">
                        <thead className="table-light">
                            <tr>
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
                            {filteredData?.keyword_ads.map((entry, index) => (
                                    <>
                                        <tr key={index}>
                                            {selectedColumns.includes("keywords") && (
                                                <td style={{ width: "200px" }}>
                                                    <span>
                                                        {entry.keyword}
                                                    </span>
                                                </td>
                                            )}
                                            {selectedColumns.includes("cost_per_click") && (
                                                <td style={{ width: "200px" }}>
                                                    <span>
                                                        {entry.cost_per_click}
                                                    </span>
                                                </td>
                                            )}
                                            {/* dan kolom lainya dibawah */}
                                        </tr>
                                    </>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            </BaseLayout>
        </>
    )
};