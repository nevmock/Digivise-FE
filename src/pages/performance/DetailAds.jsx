import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import Calendar from "react-calendar";
import * as echarts from "echarts";

import useDebounce from "../../hooks/useDebounce";
import BaseLayout from "../../components/organisms/BaseLayout";
import detailAdsJson from "../../api/detail-ads.json";

export default function DetailAds() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [filteredData, setFilteredData] = useState(detailAdsJson.data);
    const [showTableColumn, setShowTableColumn] = useState(false);
    const [chartData, setChartData] = useState([]);
    const [comparatorDate, setComparatorDate] = useState(null);
    const [comaparedDate, setComaparedDate] = useState(null);
    const [date, setDate] = useState(getAllDaysInLast7Days());
    const [showCalendar, setShowCalendar] = useState(false);
    const chartRef = useRef(null);
    const [showAlert, setShowAlert] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedMetrics, setSelectedMetrics] = useState(["cost_per_click"]);

    // CUSTOM CHART WITH FILTER DATE, CLICK PRODUCT FEATURE
    // Define metrics with their display names and colors
    const metrics = {
        cost_per_click: { 
            label: "Per click", 
            color: "#00A088FF", 
            dataKey: "cost_per_click" 
        },
        impression: { 
            label: "Jumlah Klik", 
            color: "#A50000FF", 
            dataKey: "impression" 
        },
        cost: { 
            label: "Biaya Iklan", 
            color: "#009200FF",
            dataKey: "cost" 
        },
        selled_ads: { 
            label: "Penjualan dari Iklan", 
            color: "#D3B700FF",
            dataKey: "selled_ads" 
        },
        convertion: { 
            label: "Konversi", 
            color: "#990091FF",
            dataKey: "convertion" 
        },
        roas: { 
            label: "ROAS", 
            color: "#AA5E00FF",
            dataKey: "roas" 
        },
        convertion_rate: { 
            label: "Tingkat Konversi", 
            color: "#4100B9FF",
            dataKey: "convertion_rate" 
        },
        average_rank: { 
            label: "Peringkat rata-rata", 
            color: "#85AA00FF",
            dataKey: "average_rank" 
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
    function generateSingleCampaignChartData(selectedDate = null, filteredData = null, selectedMetrics = ["cost_per_click"]) {
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

            // For single campaign data, we only need to map its data to the correct date
            // Check if the campaign's date is within our time intervals
            if (timeIntervals.includes(campaignDateOnly)) {
                // Set the value for the campaign's date
                if (dataKey === "cost_per_click") {
                    dataMap[campaignDateOnly] = filteredData.campaign[dataKey] || 0;
                } else {
                    dataMap[campaignDateOnly] = filteredData.report[dataKey] || 0;
                }
            } 
            // If using date comparison and the campaign date falls within the range
            else if (comparatorDate && comaparedDate) {
                const campaignDate = new Date(filteredData.campaign.start_time * 1000);
                const startDay = new Date(comparatorDate);
                startDay.setHours(0, 0, 0, 0);
                const endDay = new Date(comaparedDate);
                endDay.setHours(23, 59, 59, 999);
                
                if (campaignDate >= startDay && campaignDate <= endDay) {
                    // Add the campaign date to our intervals if not already there
                    if (!timeIntervals.includes(campaignDateOnly)) {
                        timeIntervals.push(campaignDateOnly);
                        timeIntervals.sort();
                    }
                    
                    // Set the value for the campaign's date
                    if (dataKey === "cost_per_click") {
                        dataMap[campaignDateOnly] = filteredData.campaign[dataKey] || 0;
                    } else {
                        dataMap[campaignDateOnly] = filteredData.report[dataKey] || 0;
                    }
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
        if (filteredData) {
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
            
            // Define these variables if they're used in the chart options
            const leftGrid = 60; // Adjust based on your needs
            const rotateAxisLabel = 45; // Adjust based on your needs
        
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
        { key: "impression", label: "Jumlah Klik" },
        { key: "cost", label: "Biaya Iklan" },
        { key: "selled_ads", label: "Penjualan dari Iklan" },
        { key: "convertion", label: "Konversi" },
        { key: "roas", label: "ROAS" },
        { key: "convertion_rate", label: "Tingkat Konversi" },
        { key: "average_rank", label: "Peringkat rata-rata" },
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
        let filtered = detailAdsJson.data;
        // Filter by search term
        if (debouncedSearchTerm !== "") {
            filtered = detailAdsJson.data.filter((entry) =>
            entry.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
            );
        }

        setFilteredData(filtered);
        }, [
        debouncedSearchTerm,
        detailAdsJson.data
    ]);

    // Covert type ads to ui string
    const checkTypeAds = (type) => {
        switch (type) {
        case "product_manual":
            return "Iklan Product Manual";
        case "shop_auto":
            return "Iklan Toko Otomatis";
        case "shop_manual":
            return "Iklan Toko Manual";
        case "product_gmv_max_roas":
            return "Iklan Produk GMV Max ROAS";
        case "product_gmv_max_auto":
            return "Iklan Produk GMV Max Auto";
        case "product_auto":
            return "Iklan Produk Otomatis";
        default:
            return "No Detected";
        }
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
                                    <span className="text-secondary">Mode Bidding : </span> <span style={{ borderRadius: "3px", color: "#1ab0f8"}} className="fw-bold bg-info-subtle px-2 py-1">{
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
                                    <div style={{ width: "1.6px", height: "40px", backgroundColor: "#CECECE"}}></div>
                                    <div className="d-flex flex-column">
                                        <div className="d-flex justify-content-between flex-column align-items-center">
                                            <span>Periode Iklan</span>
                                            <span className="fw-bold">
                                                {filteredData?.campaign.end_time == 0 ? "Tidak Terbatas" : new Date(filteredData?.campaign.end_time * 1000).toISOString().split('T')[0]}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ width: "1.6px", height: "40px", backgroundColor: "#CECECE"}}></div>
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
                    
                    <div className="d-flex gap-1 flex-column">
                        <h4 className="fw-bold">Peforma</h4>
                        <div className="card d-flex flex-column p-2">
                            {/* Ads Performance */}
                            <div className="d-flex flex-column gap-1">
                                <div className="d-flex gap-3 flex-column bg-white rounded p-2">
                                    {/* Header & Date filter */}
                                    <div className="d-flex justify-content-between">
                                        <h5 className="fw-bold">Performa Iklan</h5>
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
                                                            {filteredData.keyword_ads[metricKey]}
                                                        </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Chart */}
                                    <div>
                                        <span className="text-muted">*Klik pada kotak untuk menampilkan data lebih detail</span>
                                    </div>
                                </div>
                            </div>

                            {/* Keyword Performance */}
                            <div className="p-2 d-flex flex-column gap-1">
                                <h5>Keywords</h5>
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
                                        {filteredData?.keyword_ads.length !== 0 && filteredData?.keyword_ads !== null ? (
                                            filteredData?.keyword_ads.map((entry, index) => (
                                            <>
                                                <tr key={index}>
                                                    {filteredData.keyword_ads.length > 0 && filteredData.keyword_ads !== null && (
                                                        <td>{index + 1}</td>
                                                    )}
                                                    {selectedColumns.includes("biaya") && (
                                                        <td style={{ width: "200px" }}>
                                                        <div className="d-flex flex-column">
                                                            <span>
                                                                {entry.keyword}
                                                            </span>
                                                            <span className="text-success" style={{ fontSize: "10px" }}>
                                                            +12.7%
                                                            </span>
                                                        </div>
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