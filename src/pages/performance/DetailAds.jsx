import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import * as echarts from "echarts";
import BaseLayout from "../../components/organisms/BaseLayout";
import detailAdsJson from "../../api/detail-ads.json";

export default function DetailAds() {
    const navigate = useNavigate();
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

    // CUSTOM CHART WITH FILTER DATE, CLICK PRODUCT FEATURE
    // Define metrics with their display names and colors
    const metrics = {
        // cost_per_click: { 
        //     label: "Per click", 
        //     color: "#00A088FF", 
        //     dataKey: "cost_per_click" 
        // },
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
        cost: {
            label: "Biaya Iklan", // 
            color: "#009200FF",
            dataKey: "cost"
        },
        selled_ads: {
            label: "Penjualan dari Iklan", // 
            color: "#D3B700FF",
            dataKey: "selled_ads"
        },
        // convertion: { 
        //     label: "Konversi", 
        //     color: "#990091FF",
        //     dataKey: "convertion" 
        // },
        selled: {
            label: "Produk terjual", // 
            color: "#990091FF",
            dataKey: "selled"
        },
        roas: {
            label: "ROAS", //
            color: "#AA5E00FF",
            dataKey: "roas"
        },
        // presentage_cost: { 
        //     label: "Persentase Biaya Iklan (ACOS)", 
        //     color: "#AA5E00FF",
        //     dataKey: "presentage_cost" 
        // },
        // level_convertion: { 
        //     label: "Tingkat Konversi", 
        //     color: "#AA5E00FF",
        //     dataKey: "level_convertion" 
        // },
        // cost_per_convertion: { 
        //     label: "Biaya Per Konversi", 
        //     color: "#4100B9FF",
        //     dataKey: "cost_per_convertion" 
        // },
        // average_rank: { 
        //     label: "Peringkat rata-rata", 
        //     color: "#85AA00FF",
        //     dataKey: "average_rank" 
        // },
        // live_convertion: { 
        //     label: "Konversi Langsung", 
        //     color: "#85AA00FF",
        //     dataKey: "live_convertion" 
        // },
        // product_selled_live: {
        //     label: "Produk terjual langsung", 
        //     color: "#85AA00FF",
        //     dataKey: "product_selled_live" 
        // },
        // sell_by_live_ads: {
        //     label: "Penjualan dari iklan langsung", 
        //     color: "#85AA00FF",
        //     dataKey: "sell_by_live_ads" 
        // },
        // live_roas: {
        //     label: "ROAS Langsung", 
        //     color: "#85AA00FF",
        //     dataKey: "live_roas" 
        // },
        // live_acos: {
        //     label: "ACOS Langsung", 
        //     color: "#85AA00FF",
        //     dataKey: "live_acos" 
        // },
        // level_convertion_live: {
        //     label: "Tingkat Konversi Langsung",
        //     color: "#85AA00FF",
        //     dataKey: "level_convertion_live"
        // },
        // cost_per_convertion_live: {
        //     label: "Biaya Per Konversi Langsung",
        //     color: "#85AA00FF",
        //     dataKey: "cost_per_convertion_live"
        // }
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
    function generateSingleCampaignChartData(selectedDate = null, filteredData = null, selectedMetrics = ["impression"]) {
        if (!filteredData) return { timeIntervals: [], series: [], isSingleDay: false };

        let timeIntervals = [];
        let mode = "daily";
        let result = {};
        let isSingleDay = false;

        // Determine time intervals based on date selection
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

        // Get the campaign start date
        const campaignStartDate = convertEpochToDate(filteredData.campaign.start_time, mode);
        const campaignDateOnly = campaignStartDate.includes(" ") ?
            campaignStartDate.split(" ")[0] : campaignStartDate;

        // Process each selected metric
        selectedMetrics?.forEach(metricKey => {
            const metric = metrics[metricKey];
            if (!metric) return;

            const dataKey = metric.dataKey;
            let dataMap = {};

            // Initialize all time intervals with zero values
            timeIntervals.forEach((time) => {
                dataMap[time] = 0;
            });

            // Jika tanggal ads ada dalam interval waktu yang dipilih
            if (timeIntervals.includes(campaignDateOnly)) {
                // Hitung total metrik dari semua keyword untuk tanggal ads
                let total = 0;
                filteredData.keyword_ads.forEach(keyword => {
                    total += keyword[dataKey] || 0;
                });
                
                // Set nilai untuk tanggal ads
                dataMap[campaignDateOnly] = total;
            } 
            // Jika menggunakan perbandingan tanggal dan tanggal ads berada dalam rentang
            else if (comparatorDate && comaparedDate) {
                const campaignDate = new Date(filteredData.campaign.start_time * 1000);
                const startDay = new Date(comparatorDate);
                startDay.setHours(0, 0, 0, 0);
                const endDay = new Date(comaparedDate);
                endDay.setHours(23, 59, 59, 999);
                
                if (campaignDate >= startDay && campaignDate <= endDay) {
                    // Tambahkan tanggal ads ke interval jika belum ada
                    if (!timeIntervals.includes(campaignDateOnly)) {
                        timeIntervals.push(campaignDateOnly);
                        timeIntervals.sort();
                    }
                    
                    // Hitung total metrik dari semua keyword untuk tanggal ads
                    let total = 0;
                    filteredData.keyword_ads.forEach(keyword => {
                        total += keyword[dataKey] || 0;
                    });
                    
                    // Set nilai untuk tanggal ads
                    dataMap[campaignDateOnly] = total;
                }
            }

            // Create series data for the chart
            const seriesData = {
                name: metric.label,
                data: timeIntervals.map((time) => dataMap[time] || 0),
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
                // Implement your alert logic here
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

    // Handle style for matric filter button
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
                showSymbol: true,
                symbolSize: 6,
                emphasis: { focus: 'series' },
                data: s.data,
                lineStyle: {
                    color: s.color,
                    width: 2
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
                    name: isSingleDay ? "Time" : "Date",
                    type: "category",
                    data: xAxisData || [],
                    boundaryGap: false,
                    axisLabel: {
                        rotate: rotateAxisLabel,
                        interval: 0,
                        formatter: function (value) {
                            // Format tanggal untuk tampilan yang lebih baik
                            if (value.includes(" ")) {
                                return value.split(" ")[1]; // Untuk tampilan jam
                            } else {
                                const parts = value.split("-");
                                return `${parts[2]}/${parts[1]}`; // Format DD/MM
                            }
                        }
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
        { key: "keywords", label: "Kata Pencarian" },
        { key: "mathcing_type", label: "Tipe Pencocokan" },
        { key: "cost_per_click", label: "Per Klik" },
        { key: "impression", label: "Iklan Dilihat" },
        { key: "clicks", label: "Jumlah Klik" },
        { key: "persentage_per_click", label: "Persentase Klik" },
        { key: "cost", label: "Biaya Iklan" },
        { key: "selled_ads", label: "Penjualan dari Iklan" },
        { key: "convertion", label: "Konversi" },
        { key: "selled", label: "Produk terjual" },
        { key: "roas", label: "ROAS" },
        { key: "presentage_cost", label: "Persentase Biaya Iklan (ACOS)" },
        { key: "level_convertion", label: "Tingkat Konversi" },
        { key: "cost_per_convertion", label: "Biaya Per Konversi" },
        { key: "average_rank", label: "Peringkat rata-rata" },
        { key: "live_convertion", label: "Konversi Langsung" },
        { key: "product_selled_live", label: "Produk terjual langsung" },
        { key: "sell_by_live_ads", label: "Penjualan dari iklan langsung" },
        { key: "live_roas", label: "ROAS Langsung" },
        { key: "live_acos", label: "ACOS Langsung" },
        { key: "level_convertion_live", label: "Tingkat Konversi Langsung" },
        { key: "cost_per_convertion_live", label: "Biaya Per Konversi Langsung" }
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

    // Convert budget to IDR
    const convertBudgetToIDR = (budget) => {
        if (budget <= 0) return 0;

        const convertedBudget = Math.floor(budget / 100000);
        return new Intl.NumberFormat("id-ID", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(convertedBudget);
    };

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
                <button
                    className="btn btn-secondary mb-3"
                    onClick={() => navigate(-1)}
                    style={{ backgroundColor: "#8042D4", border: "none" }}
                >
                    Kembali
                </button>
                <div className="gap-3 d-flex flex-column">
                    {/* Detail iklan */}
                    <div className="d-flex flex-column gap-1">
                        <h4 className="fw-bold">Detail Iklan</h4>
                        <div className="card d-flex flex-column align-items-center gap-3 p-2">
                            {/* Info iklan */}
                            <div className="w-100 d-flex align-items-center">
                                <img src={"https://down-id.img.susercontent.com/file/" + filteredData?.image} alt={filteredData.title} className="rounded" style={{ width: "100px", height: "100px", objectFit: "cover", aspectRatio: "1/1" }} />
                                <div>
                                    <h5 className="mb-1">
                                        {filteredData?.title}
                                    </h5>
                                    <div>
                                        <span className="text-secondary">Mode Bidding : </span> <span style={{ borderRadius: "3px", color: "#1ab0f8" }} className="fw-bold bg-info-subtle px-2 py-1">{
                                            filteredData?.type == "product_manual" ? "Manual" : "Otomatis"
                                        }</span>
                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="w-100 border rounded p-3" style={{ marginBottom: "0" }} >
                                <div className="d-flex justify-content-between align-items-center gap-3">
                                    <div className="d-flex flex-column align-items-center">
                                        <div className="d-flex flex-column">
                                            <span>Modal</span>
                                            <span className="fw-bold">
                                                Rp.{filteredData?.campaign?.daily_budget.toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ width: "1.6px", height: "40px", backgroundColor: "#CECECE" }}></div>
                                    <div className="d-flex flex-column">
                                        <div className="d-flex justify-content-between flex-column align-items-center">
                                            <span>Periode Iklan</span>
                                            <span className="fw-bold">
                                                {filteredData?.campaign.end_time == 0 ? "Tidak Terbatas" : new Date(filteredData?.campaign.end_time * 1000).toISOString().split('T')[0]}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ width: "1.6px", height: "40px", backgroundColor: "#CECECE" }}></div>
                                    <div className="d-flex flex-column">
                                        <div className="d-flex flex-column align-items-end">
                                            <span>Penempatan Iklan</span>
                                            <span className="fw-bold">
                                                {filteredData?.manual_product_ads.product_placement == "search_product" ? "Halaman Pencarian" : "Rekomendasi"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Analysis Section */}
                            <div className="w-100 rounded d-flex flex-column gap-1">
                                <span>Analisis</span>
                                <div className="row g-2">
                                    <div className="col-6 col-lg-3">
                                        <div className="p-3 border rounded text-center">
                                            <p className="mb-1">Bidding</p>
                                            <span className="text-success fw-bold">Baik</span>
                                        </div>
                                    </div>
                                    <div className="col-6 col-lg-3">
                                        <div className="p-3 border rounded text-center">
                                            <p className="mb-1">Modal</p>
                                            <span className="text-success fw-bold">Baik</span>
                                        </div>
                                    </div>
                                    <div className="col-6 col-lg-3">
                                        <div className="p-3 border rounded text-center">
                                            <p className="mb-1">Saldo Iklan</p>
                                            <span className="text-danger fw-bold">Perlu Ditingkatkan</span>
                                        </div>
                                    </div>
                                    <div className="col-6 col-lg-3">
                                        <div className="p-3 border rounded text-center">
                                            <p className="mb-1">Stabilitas Iklan</p>
                                            <span className="text-muted fw-bold">Tidak Tersedia</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Peforma */}
                    <div className="d-flex gap-1 flex-column">
                        <h4 className="fw-bold">Peforma</h4>
                        <div className="card d-flex flex-column p-2 gap-2">
                            {/* Ads Performance */}
                            <div className="d-flex flex-column gap-1">
                                <div className="d-flex gap-3 flex-column bg-white rounded p-2">
                                    {/* Header & Date filter */}
                                    <div className="d-flex justify-content-between">
                                        <h5 className="fw-bold">klan</h5>
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
                                    </div>
                                    {/* Alert validation */}
                                    {showAlert && (
                                        <div className="alert alert-warning alert-dismissible fade show" role="alert">
                                            Maksimal 3 metrik yang dapat dipilih
                                            <button type="button" className="btn-close" onClick={() => setShowAlert(false)}></button>
                                        </div>
                                    )}
                                    {selectedMetrics.length === 0 && (
                                        <div className="alert alert-warning alert-dismissible fade show">
                                            <span >Pilih minimal 1 metrik untuk menampilkan data</span>
                                        </div>
                                    )}
                                    {/* Matric filter */}
                                    <div className="row g-3 justify-content-center">
                                        {Object.keys(metrics).map((metricKey) => (
                                            <div className="col-12 col-md-6 col-lg-2">
                                                <div
                                                    className="card border-light shadow-sm h-100 p-2"
                                                    onClick={() => handleMetricFilter(metricKey)}
                                                    style={handleStyleMatricButton(metricKey)}
                                                    key={metricKey}
                                                >
                                                    <h6 className="card-title">
                                                        {metrics[metricKey].label}
                                                    </h6>
                                                    <span className="card-text fs-4 fw-bold">
                                                        {calculateTotalMetric(metricKey)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Chart */}
                                    <div ref={chartRef} style={{ width: "100%", height: "300px" }}></div>
                                </div>
                            </div>

                            {/* Keyword Performance */}
                            <div className="p-2 d-flex flex-column gap-1">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5>Keywords</h5>
                                    <button
                                        className="btn btn-secondary dropdown-toggle"
                                        type="button"
                                        onClick={() => setShowTableColumn(!showTableColumn)}
                                        style={{ backgroundColor: "#8042D4", border: "none" }}
                                    >
                                        Pilih kriteria
                                    </button>
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
                                {/* Table container */}
                                <div className="table-responsive"
                                // style={{
                                //     width: "max-content",
                                //     minWidth: "100%",
                                // }}
                                >
                                    <table className="table table-centered">
                                        <thead className="table-light">
                                            <tr>
                                                {filteredData.keyword_ads.length !== 0 && filteredData.keyword_ads !== null && <th scope="col">No</th>}
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
                                            {filteredData?.keyword_ads.length !== 0 && filteredData?.keyword_ads !== null ? (
                                                filteredData?.keyword_ads.map((entry, index) => (
                                                    <>
                                                        <tr key={index}>
                                                            {filteredData.keyword_ads.length > 0 && filteredData.keyword_ads !== null && (
                                                                <td>{index + 1}</td>
                                                            )}
                                                            {selectedColumns.includes("keywords") && (
                                                                <td style={{ width: "200px" }}>
                                                                    <span>
                                                                        {entry.keyword}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            {selectedColumns.includes("mathcing_type") && (
                                                                <td style={{ width: "200px" }}>
                                                                    <span>
                                                                        {entry?.matching_type == "wide" ? "Luas" : "Spesifik"}
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
                                                            {selectedColumns.includes("impression") && (
                                                                <td style={{ width: "200px" }}>
                                                                    <span>
                                                                        {entry.impression}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            {selectedColumns.includes("clicks") && (
                                                                <td style={{ width: "200px" }}>
                                                                    <span>
                                                                        {entry.clicks}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            {selectedColumns.includes("persentage_per_click") && (
                                                                <td style={{ width: "200px" }}>
                                                                    <span>
                                                                        {entry.persentage_per_click}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            {selectedColumns.includes("cost") && (
                                                                <td style={{ width: "200px" }}>
                                                                    <span>
                                                                        {entry.cost}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            {selectedColumns.includes("selled_ads") && (
                                                                <td style={{ width: "200px" }}>
                                                                    <span>
                                                                        {entry.selled_ads}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            {selectedColumns.includes("convertion") && (
                                                                <td style={{ width: "200px" }}>
                                                                    <span>
                                                                        {entry.convertion}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            {selectedColumns.includes("selled") && (
                                                                <td style={{ width: "200px" }}>
                                                                    <span>
                                                                        {entry.selled}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            {selectedColumns.includes("roas") && (
                                                                <td style={{ width: "200px" }}>
                                                                    <span>
                                                                        {entry.roas}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            {selectedColumns.includes("presentage_cost") && (
                                                                <td style={{ width: "200px" }}>
                                                                    <span>
                                                                        {entry.presentage_cost}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            {selectedColumns.includes("level_convertion") && (
                                                                <td style={{ width: "200px" }}>
                                                                    <span>
                                                                        {entry.level_convertion}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            {selectedColumns.includes("cost_per_convertion") && (
                                                                <td style={{ width: "200px" }}>
                                                                    <span>
                                                                        {entry.cost_per_convertion}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            {selectedColumns.includes("average_rank") && (
                                                                <td style={{ width: "200px" }}>
                                                                    <span>
                                                                        {entry.average_rank}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            {selectedColumns.includes("live_convertion") && (
                                                                <td style={{ width: "200px" }}>
                                                                    <span>
                                                                        {entry.live_convertion}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            {selectedColumns.includes("product_selled_live") && (
                                                                <td style={{ width: "200px" }}>
                                                                    <span>
                                                                        {entry.product_selled_live}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            {selectedColumns.includes("sell_by_live_ads") && (
                                                                <td style={{ width: "200px" }}>
                                                                    <span>
                                                                        {entry.sell_by_live_ads}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            {selectedColumns.includes("live_roas") && (
                                                                <td style={{ width: "200px" }}>
                                                                    <span>
                                                                        {entry.live_roas}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            {selectedColumns.includes("live_acos") && (
                                                                <td style={{ width: "200px" }}>
                                                                    <span>
                                                                        {entry.live_acos}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            {selectedColumns.includes("level_convertion_live") && (
                                                                <td style={{ width: "200px" }}>
                                                                    <span>
                                                                        {entry.level_convertion_live}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            {selectedColumns.includes("cost_per_convertion_live") && (
                                                                <td style={{ width: "200px" }}>
                                                                    <span>
                                                                        {entry.cost_per_convertion_live}
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
            </BaseLayout>
        </>
    )
};