import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Calendar from "react-calendar";
import * as echarts from "echarts";
import toast from "react-hot-toast";
import Skeleton from 'react-loading-skeleton';

import axiosRequest from "../../utils/request";
import formatTableValue from "../../utils/formatTableValue";
import formatValueRatio from "../../utils/convertFormatRatioValue";
import formatStyleSalesClassification from "../../utils/convertFormatSalesClassification";
import Loading from "../../components/atoms/Loading/Loading";
import BaseLayout from "../../components/organisms/BaseLayout";

export default function DetailAds() {
    const navigate = useNavigate();
    const { campaignId } = useParams();

    // Data
    const [keywordsData, setKeywordsData] = useState([]);
    const [productData, setProductData] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [chartRawData, setChartRawData] = useState([]);
    const chartRef = useRef(null);

    // Filter
    const [comparatorDateRange, setComparatorDateRange] = useState(null);
    const [comparedDateRange, setComparedDateRange] = useState(null);
    const [rangeParameters, setRangeParameters] = useState(null);
    const [date, setDate] = useState(getAllDaysInLast7Days());
    const [flagCustomRoasDate, setFlagCustomRoasDate] = useState("minggu_ini");
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedMetrics, setSelectedMetrics] = useState(["impression"]);
    const [metricsTotals, setMetricsTotals] = useState({});
    const [showTableColumn, setShowTableColumn] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [paginatedData, setPaginatedData] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    // Other
    const [showAlert, setShowAlert] = useState(false);
    const [animateCalendar, setAnimateCalendar] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isTableFilterLoading, setIsTableFilterLoading] = useState(false);

    // const getShopeeId = "252234165";
    const getShopeeId = localStorage.getItem("shopeeId");
    if (getShopeeId == null || getShopeeId === null || getShopeeId === "null" || getShopeeId === "undefined") {
        return (
            <BaseLayout>
                <div className="alert alert-warning">
                    Tidak ada merchant aktif. Silahkan buat merchant atau login ke merchant terlebih dahulu.
                </div>
            </BaseLayout>
        );
    };

    // Define metrics with their display names and colors
    const metrics = {
        impression: {
            label: "Iklan Dilihat",
            color: "#D50000",
            dataKey: "impression",
            type: "simple_currency"
        },
        click: {
            label: "Jumlah Klik",
            color: "#00B800",
            dataKey: "click",
            type: "simple_currency"
        },
        ctr: {
            label: "Persentase Klik",
            color: "#DFC100",
            dataKey: "ctr",
            type: "percentage"
        },
        checkout: {
            label: "Pesanan",
            color: "#C400BA",
            dataKey: "checkout",
            type: "simple_currency"
        },
        broadOrderAmount: {
            label: "Produk Terjual",
            color: "#35007FFF",
            dataKey: "broadOrderAmount",
            type: "simple_currency"
        },
        broadGmv: {
            label: "Penjualan dari Iklan",
            color: "#AD5F00",
            dataKey: "broadGmv",
            type: "currency"
        },
        dailyBudget: {
            label: "Biaya Iklan",
            color: "#00B69A",
            dataKey: "dailyBudget",
            type: "currency"
        },
        roas: {
            label: "ROAS",
            color: "#743A00FF",
            dataKey: "roas",
            type: "coma"
        }
    };

    const toLocalISOString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    const generateComparisonDateRanges = (currentSelection, selectionType) => {
        let currentFrom, currentTo, previousFrom, previousTo;

        switch (selectionType) {
            case "hari_ini":
                currentFrom = new Date();
                currentFrom.setHours(0, 0, 0, 0);
                currentTo = new Date();
                currentTo.setHours(23, 59, 59, 999);

                previousFrom = new Date();
                previousFrom.setDate(previousFrom.getDate() - 1);
                previousFrom.setHours(0, 0, 0, 0);
                previousTo = new Date();
                previousTo.setDate(previousTo.getDate() - 1);
                previousTo.setHours(23, 59, 59, 999);
                break;

            case "kemarin":
                currentFrom = new Date();
                currentFrom.setDate(currentFrom.getDate() - 1);
                currentFrom.setHours(0, 0, 0, 0);
                currentTo = new Date();
                currentTo.setDate(currentTo.getDate() - 1);
                currentTo.setHours(23, 59, 59, 999);

                previousFrom = new Date();
                previousFrom.setDate(previousFrom.getDate() - 2);
                previousFrom.setHours(0, 0, 0, 0);
                previousTo = new Date();
                previousTo.setDate(previousTo.getDate() - 2);
                previousTo.setHours(23, 59, 59, 999);
                break;

            case "minggu_ini":
                currentTo = new Date();
                currentTo.setHours(23, 59, 59, 999);
                currentFrom = new Date();
                currentFrom.setDate(currentFrom.getDate() - 6);
                currentFrom.setHours(0, 0, 0, 0);

                previousTo = new Date();
                previousTo.setDate(previousTo.getDate() - 7);
                previousTo.setHours(23, 59, 59, 999);
                previousFrom = new Date();
                previousFrom.setDate(previousFrom.getDate() - 13);
                previousFrom.setHours(0, 0, 0, 0);
                break;

            case "bulan_ini":
                const today = new Date();
                currentFrom = new Date(today.getFullYear(), today.getMonth(), 1);
                currentFrom.setHours(0, 0, 0, 0);
                currentTo = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                currentTo.setHours(23, 59, 59, 999);

                previousFrom = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                previousFrom.setHours(0, 0, 0, 0);
                previousTo = new Date(today.getFullYear(), today.getMonth(), 0);
                previousTo.setHours(23, 59, 59, 999);
                break;

            case "custom_range":
                if (Array.isArray(currentSelection)) {
                    currentFrom = new Date(currentSelection[0]);
                    currentFrom.setHours(0, 0, 0, 0);
                    currentTo = new Date(currentSelection[currentSelection.length - 1]);
                    currentTo.setHours(23, 59, 59, 999);
                } else {
                    currentFrom = new Date(currentSelection);
                    currentFrom.setHours(0, 0, 0, 0);
                    currentTo = new Date(currentSelection);
                    currentTo.setHours(23, 59, 59, 999);
                }

                const duration = currentTo.getTime() - currentFrom.getTime();
                previousTo = new Date(currentFrom.getTime() - 24 * 60 * 60 * 1000);
                previousTo.setHours(23, 59, 59, 999);
                previousFrom = new Date(previousTo.getTime() - duration);
                previousFrom.setHours(0, 0, 0, 0);
                break;

            default:
                currentTo = new Date();
                currentTo.setHours(23, 59, 59, 999);
                currentFrom = new Date();
                currentFrom.setDate(currentFrom.getDate() - 6);
                currentFrom.setHours(0, 0, 0, 0);

                previousTo = new Date();
                previousTo.setDate(previousTo.getDate() - 7);
                previousTo.setHours(23, 59, 59, 999);
                previousFrom = new Date();
                previousFrom.setDate(previousFrom.getDate() - 13);
                previousFrom.setHours(0, 0, 0, 0);
        }

        return {
            current: { from: currentFrom, to: currentTo },
            previous: { from: previousFrom, to: previousTo },
        };
    };

    const fetchProductData = async () => {
        try {
            const apiUrl = `/api/product-ads/newest?campaignId=${campaignId}`;
            const response = await axiosRequest.get(apiUrl);
            const data = response.data;
            setProductData(data);
        } catch (error) {
            console.error("Gagal mengambil data produk:", error);
        }
    };

    const fetchChartData = async (dateRanges) => {
        try {
            const from1ISO = toLocalISOString(dateRanges.current.from);
            const to1ISO = toLocalISOString(dateRanges.current.to);

            const apiUrl = `/api/product-keyword/chart?shopId=${getShopeeId}&campaignId=${campaignId}&from=${from1ISO}&to=${to1ISO}`;

            const response = await axiosRequest.get(apiUrl);
            const data = response.data;
            const content = Array.isArray(data) ? data : [];

            setChartRawData(content);
            const totals = calculateMetricTotalsValue(content);
            setMetricsTotals(totals);

            return data;
        } catch (error) {
            toast.error("Gagal mengambil data chart keyword");
            console.error("Gagal mengambil data chart keyword:", error);
            setChartRawData([]);
            setMetricsTotals({});
            return [];
        }
    };

    const fetchTableData = async (dateRanges, page = 1) => {
        setIsTableFilterLoading(true);

        try {
            const from1ISO = toLocalISOString(dateRanges?.current?.from);
            const to1ISO = toLocalISOString(dateRanges?.current?.to);
            const from2ISO = toLocalISOString(dateRanges?.previous?.from);
            const to2ISO = toLocalISOString(dateRanges?.previous?.to);

            const backendPage = Math.max(0, page - 1);
            const apiUrl = `/api/product-keyword?shopId=${getShopeeId}&campaignId=${campaignId}&from1=${from1ISO}&to1=${to1ISO}&from2=${from2ISO}&to2=${to2ISO}&limit=${itemsPerPage}&page=${backendPage}`;

            const response = await axiosRequest.get(apiUrl);
            const data = response.data;
            const content = data.content || [];

            setKeywordsData(content);
            setTotalPages(data?.totalPages || 1);
            setTotalElements(data?.totalElements || 0);

            return content;
        } catch (error) {
            toast.error("Gagal mengambil data tabel keyword");
            console.error("Gagal mengambil data tabel keyword:", error);
            return [];
        } finally {
            setIsTableFilterLoading(false);
        }
    };

    const fetchData = async (currentSelection, selectionType, page = 1) => {
        setIsLoading(true);

        try {
            const dateRanges = generateComparisonDateRanges(currentSelection, selectionType);

            setRangeParameters({
                isComparison: true,
                current: dateRanges.current,
                previous: dateRanges.previous,
                selectionType: selectionType,
            });

            await Promise.all([
                fetchChartData(dateRanges),
                fetchTableData(dateRanges, page),
            ]);
        } catch (error) {
            toast.error("Gagal mengambil data keyword");
            console.error("Gagal mengambil data keyword:", error);
        } finally {
            setIsLoading(false);
        }
    };

    function calculateMetricTotalsValue(keywordProducts) {
        const totals = {};
        Object.keys(metrics).forEach((metricKey) => {
            totals[metricKey] = 0;
            keywordProducts.forEach((keywordProduct) => {
                if (keywordProduct.data && keywordProduct.data.length > 0) {
                    keywordProduct.data.forEach((keywordData) => {
                        const dataKey = metrics[metricKey].dataKey;
                        const value = keywordData[dataKey];
                        if (value !== undefined && value !== null) {
                            totals[metricKey] += Number(value);
                        }
                    });
                }
            });
        });
        return totals;
    };

    function getAllDaysInLast7Days() {
        const getLocalDateString = (date) => {
            const localDate = date instanceof Date ? date : new Date(date);
            const year = localDate.getFullYear();
            const month = String(localDate.getMonth() + 1).padStart(2, "0");
            const day = String(localDate.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        };

        const today = new Date();
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            return getLocalDateString(d);
        }).reverse();
    };

    function getAllDaysInAMonth() {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const days = new Date(year, month, 0).getDate();
        return Array.from(
            { length: days },
            (_, i) =>
                `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`
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
        const getLocalDateString = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        };

        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays == 0) {
            return getHourlyIntervals(getLocalDateString(start));
        }

        let currentDate = new Date(start);
        while (currentDate <= end) {
            dateArray.push(getLocalDateString(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dateArray;
    };

    function generateMultipleKeywordChartData(selectedDate = null, selectedMetrics = ["impression"]) {
        let timeIntervals = [];
        let result = {};
        let isSingleDay = false;
        let fromDate, toDate;

        const getLocalDateString = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        };

        const convertShopeeTimestampToDate = (timestamp) => {
            return new Date(timestamp * 1000);
        };

        const getDataDate = (keywordData) => {
            if (keywordData.shopeeFrom) {
                return convertShopeeTimestampToDate(keywordData.shopeeFrom);
            } else if (keywordData.createdAt) {
                return new Date(keywordData.createdAt);
            }
            return null;
        };

        if (rangeParameters && rangeParameters.isComparison) {
            fromDate = rangeParameters.current.from;
            toDate = rangeParameters.current.to;

            const sameDay = fromDate.toDateString() === toDate.toDateString();
            if (sameDay) {
                const dateStr = getLocalDateString(fromDate);
                timeIntervals = getHourlyIntervals(dateStr);
                isSingleDay = true;
            } else {
                timeIntervals = getDateRangeIntervals(fromDate, toDate);
                isSingleDay = false;
            }
        } else {
            if (selectedDate === null || Array.isArray(selectedDate)) {
                timeIntervals = getAllDaysInLast7Days();
                fromDate = new Date(timeIntervals[0] + "T00:00:00");
                toDate = new Date(timeIntervals[timeIntervals.length - 1] + "T23:59:59");
            } else if (selectedDate === "Bulan Ini") {
                timeIntervals = getAllDaysInAMonth();
                const today = new Date();
                fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
                toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                fromDate.setHours(0, 0, 0, 0);
                toDate.setHours(23, 59, 59, 999);
            } else {
                timeIntervals = getHourlyIntervals(selectedDate);
                isSingleDay = true;
                fromDate = new Date(selectedDate);
                toDate = new Date(selectedDate);
                fromDate.setHours(0, 0, 0, 0);
                toDate.setHours(23, 59, 59, 999);
            }
        }

        if (timeIntervals.length === 0 || !timeIntervals) {
            timeIntervals = [getLocalDateString(new Date())];
            fromDate = new Date();
            toDate = new Date();
            fromDate.setHours(0, 0, 0, 0);
            toDate.setHours(23, 59, 59, 999);
        }

        result.timeIntervals = timeIntervals;
        result.isSingleDay = isSingleDay;
        result.series = [];

        let chartDataKeywords = chartRawData;
        selectedMetrics?.forEach((metricKey) => {
            const metric = metrics[metricKey];
            if (!metric) return;

            const dataKey = metric.dataKey;
            let dataMap = {};

            timeIntervals.forEach((time) => {
                dataMap[time] = 0;
            });

            chartDataKeywords?.forEach((keywordProduct) => {
                if (keywordProduct.data.length === 0 || !keywordProduct.data) return;

                if (isSingleDay) {
                    keywordProduct?.data?.forEach((keywordData) => {
                        if (keywordData.shopeeFrom === null || !keywordData.shopeeFrom) return;

                        const dataDate = getDataDate(keywordData);
                        const productDateStr = getLocalDateString(dataDate);
                        const filterDateStr = getLocalDateString(fromDate);

                        if (productDateStr !== filterDateStr) return;

                        const hourKey = String(dataDate.getHours()).padStart(2, "0");
                        const keywordYear = dataDate.getFullYear();
                        const keywordMonth = String(dataDate.getMonth() + 1).padStart(2, "0");
                        const keywordDay = String(dataDate.getDate()).padStart(2, "0");
                        const hourOnlyKey = `${keywordYear}-${keywordMonth}-${keywordDay} ${hourKey}:00`;

                        if (timeIntervals.includes(hourOnlyKey)) {
                            const value = keywordData[dataKey];
                            if (value !== null && value !== undefined) {
                                dataMap[hourOnlyKey] += Number(value);
                            }
                        }
                    });
                } else {
                    const dataByDate = {};

                    keywordProduct.data.forEach((keywordData) => {
                        if (keywordData.shopeeFrom === null || !keywordData.shopeeFrom) return;

                        const dataDate = getDataDate(keywordData);
                        const keywordDateStr = getLocalDateString(dataDate);
                        const filterStartStr = getLocalDateString(fromDate);
                        const filterEndStr = getLocalDateString(toDate);

                        if (keywordDateStr >= filterStartStr && keywordDateStr <= filterEndStr) {
                            if (!dataByDate[keywordDateStr]) {
                                dataByDate[keywordDateStr] = 0;
                            }

                            const value = keywordData[dataKey];
                            if (value !== undefined && value !== null) {
                                dataByDate[keywordDateStr] += Number(value);
                            }
                        }
                    });

                    Object.keys(dataByDate).forEach(dateKey => {
                        if (timeIntervals.includes(dateKey)) {
                            dataMap[dateKey] += dataByDate[dateKey];
                        }
                    });
                }
            });

            const seriesData = {
                name: metric.label,
                data: timeIntervals.map((time) => dataMap[time] || 0),
                color: metric.color,
            };

            result.series.push(seriesData);
        });

        return result;
    };

    function handleMetricFilter(metricKey) {
        setSelectedMetrics((prev) => {
            if (prev.includes(metricKey)) {
                return prev.filter((m) => m !== metricKey);
            } else if (prev.length < 4) {
                return [...prev, metricKey];
            } else {
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 2000);
                return prev;
            }
        });
    };

    const handleComparatorDateChange = (date) => {
        if (Array.isArray(date) && date.length === 2) {
            setComparatorDateRange(date);
        }
    };

    const handleComparedDateChange = (date) => {
        if (Array.isArray(date) && date.length === 2) {
            setComparedDateRange(date);
        }
    };

    const resetComparisonDates = () => {
        setComparatorDateRange(null);
        setComparedDateRange(null);
        setRangeParameters(null);
    };

    const getDateButtonText = () => {
        if (comparatorDateRange || comparedDateRange) {
            let startText = "";
            let endText = "";

            if (comparatorDateRange) {
                startText = `${comparatorDateRange[0].toLocaleDateString("id-ID")} - ${comparatorDateRange[1].toLocaleDateString("id-ID")}`;
            }

            if (comparedDateRange) {
                endText = `${comparedDateRange[0].toLocaleDateString("id-ID")} - ${comparedDateRange[1].toLocaleDateString("id-ID")}`;
            }

            if (startText && endText) {
                return `${startText} vs ${endText}`;
            }
        }

        return typeof date === "string"
            ? date
            : Array.isArray(date)
                ? "1 Minggu terakhir"
                : "Pilih Tanggal";
    };

    const isConfirmButtonDisabled = () => {
        const hasComparatorSelection = !!comparatorDateRange;
        const hasComparedSelection = !!comparedDateRange;
        return !(hasComparatorSelection && hasComparedSelection);
    };

    const validateDateRanges = () => {
        let hasValidSelection = false;
        let errorMessage = "";

        const hasComparatorRange = !!comparatorDateRange;
        const hasComparedRange = !!comparedDateRange;

        if (hasComparatorRange && !hasComparedRange) {
            errorMessage = "Untuk mode perbandingan, kedua kalender harus diisi. Silakan pilih tanggal atau range di kalender kedua (Tanggal Dibanding).";
            return { isValid: false, message: errorMessage };
        }

        if (hasComparedRange && !hasComparatorRange) {
            errorMessage = "Untuk mode perbandingan, kedua kalender harus diisi. Silakan pilih tanggal atau range di kalender pertama (Tanggal Pembanding).";
            return { isValid: false, message: errorMessage };
        }

        if (comparatorDateRange) {
            if (comparatorDateRange[0] > comparatorDateRange[1]) {
                errorMessage = "Tanggal mulai tidak boleh lebih besar dari tanggal akhir pada kalender pertama";
                return { isValid: false, message: errorMessage };
            }
            hasValidSelection = true;
        }

        if (comparedDateRange) {
            if (comparedDateRange[0] > comparedDateRange[1]) {
                errorMessage = "Tanggal mulai tidak boleh lebih besar dari tanggal akhir pada kalender kedua";
                return { isValid: false, message: errorMessage };
            }
            hasValidSelection = true;
        }

        if (!hasValidSelection) {
            errorMessage = "Pilih setidaknya satu range pada salah satu kalender";
            return { isValid: false, message: errorMessage };
        }

        return { isValid: true, message: "" };
    };

    function handleComparisonDatesConfirm() {
        const validation = validateDateRanges();

        if (!validation.isValid) {
            toast.error("Filter tanggal tidak valid, silakan periksa kembali tanggal yang dipilih.");
            return;
        }

        if (comparatorDateRange && comparedDateRange) {
            const manualDateRanges = {
                current: {
                    from: new Date(comparatorDateRange[0]),
                    to: new Date(comparatorDateRange[1]),
                },
                previous: {
                    from: new Date(comparedDateRange[0]),
                    to: new Date(comparedDateRange[1]),
                },
            };

            manualDateRanges.current.from.setHours(0, 0, 0, 0);
            manualDateRanges.current.to.setHours(23, 59, 59, 999);
            manualDateRanges.previous.from.setHours(0, 0, 0, 0);
            manualDateRanges.previous.to.setHours(23, 59, 59, 999);

            setDate(null);
            setShowCalendar(false);
            setCurrentPage(1);

            setRangeParameters({
                isComparison: true,
                isManual: true,
                current: manualDateRanges.current,
                previous: manualDateRanges.previous,
                selectionType: "manual_comparison",
            });

            Promise.all([
                fetchChartData(manualDateRanges),
                fetchTableData(manualDateRanges, 1),
            ]).catch((error) => {
                toast.error("Gagal mengambil data keyword");
                console.error("Error in manual comparison:", error);
            });
        }
    };

    function handleDateSelectionPreset(selectedDateOption, type = "minggu_ini") {
        setComparatorDateRange(null);
        setComparedDateRange(null);
        setDate(selectedDateOption);
        setFlagCustomRoasDate(type);
        setShowCalendar(false);
        setCurrentPage(1);

        fetchData(selectedDateOption, type, 1);
    };

    const getVisiblePageNumbers = () => {
        const pages = [];
        if (totalPages <= 10) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
            return pages;
        }

        if (currentPage <= 3) {
            pages.push(1, 2, 3);
            if (totalPages > 4) {
                pages.push('...');
                pages.push(totalPages - 1, totalPages);
            }
        } else if (currentPage >= totalPages - 2) {
            pages.push(1, 2);
            if (totalPages > 4) {
                pages.push('...');
            }
            pages.push(totalPages - 2, totalPages - 1, totalPages);
        } else {
            pages.push(1, 2);
            pages.push('...');
            pages.push(currentPage - 1, currentPage, currentPage + 1);
            pages.push('...');
            pages.push(totalPages - 1, totalPages);
        }

        return pages;
    };

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
            setCurrentPage(pageNumber);

            if (rangeParameters && rangeParameters.isComparison) {
                const dateRanges = {
                    current: rangeParameters.current,
                    previous: rangeParameters.previous
                };
                fetchTableData(dateRanges, pageNumber);
            } else {
                const dateRanges = generateComparisonDateRanges(date, flagCustomRoasDate);
                fetchTableData(dateRanges, pageNumber);
            }
        }
    };

    const handleItemsPerPageChange = (e) => {
        const newItemsPerPage = parseInt(e.target.value, 10);
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    const renderPagination = () => {
        const visiblePages = getVisiblePageNumbers();
        const showFirstLastButtons = totalPages > 10;
        const getWidthWindow = window.innerWidth;

        return (
            <div className="custom-container-pagination mt-3">
                <div className="custom-pagination-select d-flex align-items-center gap-2">
                    {/* <span style={{ display: `${getWidthWindow < 768 ? 'none' : 'block'}` }}>
                        Tampilan
                    </span> */}
                    <select
                        className="form-select"
                        value={itemsPerPage}
                        onChange={handleItemsPerPageChange}
                        style={{ width: "80px" }}
                    >
                        <option value="20">20</option>
                        <option value="30">30</option>
                        <option value="50">50</option>
                    </select>
                    <span>data per halaman</span>
                </div>

                <nav className="custom-pagination-list" aria-label="Page navigation">
                    <ul className="pagination mb-0" style={{ gap: `${totalPages < 10 ? '1rem' : ''}` }}>
                        {totalPages >= 10 && getWidthWindow >= 768 ? (
                            <>
                                {showFirstLastButtons && (
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link sm-me-2"
                                            onClick={() => handlePageChange(1)}
                                            disabled={currentPage === 1}
                                            title="Ke halaman pertama"
                                        >
                                            Awal
                                        </button>
                                    </li>
                                )}
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        title="Halaman sebelumnya"
                                    >
                                        ‹
                                    </button>
                                </li>

                                {visiblePages.map((page, index) => {
                                    if (page === '...') {
                                        return (
                                            <li key={`ellipsis-${index}`} className="page-item disabled">
                                                <span className="page-link">...</span>
                                            </li>
                                        );
                                    }

                                    return (
                                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => handlePageChange(page)}
                                            >
                                                {page}
                                            </button>
                                        </li>
                                    );
                                })}

                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        title="Halaman selanjutnya"
                                    >
                                        ›
                                    </button>
                                </li>
                                {showFirstLastButtons && (
                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link sm-ms-2"
                                            onClick={() => handlePageChange(totalPages)}
                                            disabled={currentPage === totalPages}
                                            title="Ke halaman terakhir"
                                        >
                                            Akhir
                                        </button>
                                    </li>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="d-flex">
                                    {showFirstLastButtons && (
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="d-none sm-d-block page-link"
                                                onClick={() => handlePageChange(1)}
                                                disabled={currentPage === 1}
                                                title="Ke halaman pertama"
                                            >
                                                Awal
                                            </button>
                                        </li>
                                    )}

                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            title="Halaman sebelumnya"
                                        >
                                            ‹
                                        </button>
                                    </li>
                                </div>

                                <div className="d-flex">
                                    {visiblePages.map((page, index) => {
                                        if (page === '...') {
                                            return (
                                                <li key={`ellipsis-${index}`} className="page-item disabled">
                                                    <span className="page-link">...</span>
                                                </li>
                                            );
                                        }

                                        return (
                                            <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => handlePageChange(page)}
                                                >
                                                    {page}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </div>

                                <div className="d-flex">
                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            title="Halaman selanjutnya"
                                        >
                                            ›
                                        </button>
                                    </li>

                                    {showFirstLastButtons && (
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button
                                                className="d-none sm-d-block page-link"
                                                onClick={() => handlePageChange(totalPages)}
                                                disabled={currentPage === totalPages}
                                                title="Ke halaman terakhir"
                                            >
                                                Akhir
                                            </button>
                                        </li>
                                    )}
                                </div>
                            </>
                        )}
                    </ul>
                </nav>
            </div>
        );
    };

    const allColumns = [
        { key: "keyword", label: "Kata Pencarian" },
        { key: "dailyBudget", label: "Modal" },
        { key: "insight", label: "Insight" },
        { key: "salesClassification", label: "Sales Classification" },
        { key: "cost", label: "Biaya Iklan" },
        { key: "broadGmv", label: "Penjualan dari iklan" },
        { key: "roas", label: "ROAS" },
        { key: "impression", label: "Iklan dilihat" },
        { key: "click", label: "Jumlah Klik" },
        { key: "ctr", label: "Presentase Klik" },
        { key: "broadOrder", label: "Konversi" },
        { key: "cr", label: "Tingkat Konversi" },
        { key: "broadOrderAmount", label: "Produk Terjual" },
        { key: "cpc", label: "Biaya per Konversi" },
        { key: "acos", label: "Presentase Biaya Iklan (ACOS)" },
        { key: "directOrder", label: "Konversi Langung" },
        { key: "directOrderAmount", label: "Produk Terjual Langsung" },
        { key: "directGmv", label: "Penjualan dari Iklan Langsung" },
        { key: "directRoi", label: "ROAS (Efektifitas Iklan) Langsung" },
        { key: "directCir", label: "ACOS Langsung" },
        { key: "directCr", label: "Tingkat Konversi Langsung" },
        { key: "cpdc", label: "Biaya per Konversi Langsung" },
    ];

    const [selectedColumns, setSelectedColumns] = useState(
        allColumns.map((col) => col.key)
    );

    const handleColumnChange = (colKey) => {
        setSelectedColumns((prev) =>
            prev.includes(colKey)
                ? prev.filter((key) => key !== colKey)
                : [...prev, colKey]
        );
    };

    const handleStyleMatricButton = (metricKey) => {
        const isActive = selectedMetrics.includes(metricKey);
        const metric = metrics[metricKey];

        return {
            backgroundColor: "#ffffff00",
            borderTop: `solid ${isActive ? `${metric.color} 3px` : "rgb(179.4, 184.2, 189) 1px"}`,
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: isActive ? "medium" : "normal",
            transition: "all 0.3s ease",
            flex: "1 1 200px",
            height: "auto",
            justifyContent: "center",
        };
    };

    const formatMetricValue = (metricKey, value) => {
        if (value === undefined || value === null) return "-";

        switch (metricKey) {
            case "impression":
            case "click":
            case "broadOrderAmount":
                return Number(value).toLocaleString("id-ID");
            case "ctr":
            case "cr":
                return (Number(value) * 100).toFixed(2) + "%";
            case "cost":
            case "cpc":
            case "broadGmv":
            case "directGmv":
                return "Rp " + Number(value).toLocaleString("id-ID");
            case "roas":
            case "directRoi":
                return Number(value).toFixed(2);
            case "acos":
            case "directCir":
                return (Number(value) * 100).toFixed(2) + "%";
            default:
                return Number(value).toLocaleString("id-ID");
        }
    };

    const toggleOpenCalendar = () => {
        if (showCalendar) {
            setAnimateCalendar(false);
            setTimeout(() => setShowCalendar(false), 100);
        } else {
            setShowCalendar(true);
            setTimeout(() => setAnimateCalendar(true), 100);
        }
    };

    useEffect(() => {
        fetchProductData();
        fetchData(getAllDaysInLast7Days(), "minggu_ini", 1);
    }, []);

    useEffect(() => {
        if (chartRawData.length > 0) {
            const totals = calculateMetricTotalsValue(chartRawData);
            setMetricsTotals(totals);
        }
    }, [chartRawData]);

    useEffect(() => {
        const chartData = generateMultipleKeywordChartData(date, selectedMetrics);
        setChartData(chartData);
    }, [date, selectedMetrics, chartRawData, rangeParameters, comparatorDateRange, comparedDateRange]);

    const [isChartContainerReady, setIsChartContainerReady] = useState(false);
    const chartInstance = useRef(null);
    const [isMounted, setIsMounted] = useState(false);

    const chartRefCallback = useCallback((node) => {
        if (node) {
            chartRef.current = node;
            setIsChartContainerReady(true);
        } else {
            setIsChartContainerReady(false);
        }
    }, []);

    const initializeChart = useCallback(() => {
        if (!isMounted || !chartRef.current || !isChartContainerReady) {
            return;
        }

        try {
            if (chartInstance.current) {
                chartInstance.current.dispose();
                chartInstance.current = null;
            }

            chartInstance.current = echarts.init(chartRef.current);

            const activeSeries = chartData.series?.filter(series =>
                selectedMetrics.some(metric =>
                    metrics[metric]?.label === series.name
                )
            ) || [];

            if (activeSeries.length === 0) {
                return;
            }

            const seriesConfig = activeSeries.map(s => ({
                name: s.name,
                type: 'line',
                smooth: true,
                showSymbol: false,
                emphasis: { focus: 'series' },
                data: s.data,
                lineStyle: {
                    color: s.color,
                    width: 2
                },
                itemStyle: {
                    color: s.color
                }
            }));

            const hasData = seriesConfig.some(s =>
                s.data?.some(value => value !== null && value !== undefined)
            );

            let xAxisData = chartData.timeIntervals || [];
            const isSingleDay = chartData.isSingleDay || false;

            if (xAxisData.some(item => item.includes(":"))) {
                xAxisData = xAxisData.map(item => item.split(" ")[1]);
            } else {
                xAxisData = xAxisData.map(item => item.split("-").slice(1).join("/"));
            }

            const option = {
                toolbox: { feature: { saveAsImage: {} } },
                grid: {
                    left: calculateLeftMargin(seriesConfig),
                    right: 50,
                    bottom: 50,
                    containLabel: false
                },
                tooltip: {
                    trigger: "axis",
                    extraCssText: 'box-shadow: none;',
                    backgroundColor: "transparent",
                    borderWidth: 0,
                    formatter: generateTooltipContent
                },
                legend: {
                    data: activeSeries.map(s => s.name),
                    bottom: 0,
                    icon: 'circle',
                    itemWidth: 8,
                },
                xAxis: {
                    name: isSingleDay ? "Time" : "Date",
                    type: "category",
                    data: xAxisData,
                    boundaryGap: false,
                    axisLabel: {
                        rotate: 0,
                        interval: 0,
                        formatter: getAxisLabelFormatter(xAxisData.length)
                    },
                },
                yAxis: {
                    // name: selectedMetrics.length === 1 ? metrics[selectedMetrics[0]]?.label : "Total",
                    type: "value",
                    splitLine: { show: true },
                },
                series: seriesConfig
            };

            // Handle no data case
            if (!hasData) {
                option.graphic = [{
                    type: 'text',
                    left: 'center',
                    top: 'middle',
                    style: {
                        text: 'Tidak ada data untuk rentang waktu yang dipilih',
                        fontSize: 16,
                        fill: '#999',
                        fontWeight: 'bold'
                    }
                }];
            }

            chartInstance.current.setOption(option);

        } catch (err) {
            console.error("Chart initialization error:", err);
            toast.error("Gagal memuat chart iklan produk");
        }
    }, [chartData, selectedMetrics, isMounted, isChartContainerReady]);

    useEffect(() => {
        setIsMounted(true);
        return () => {
            setIsMounted(false);
            setIsChartContainerReady(false);
            if (chartInstance.current) {
                chartInstance.current.dispose();
                chartInstance.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (isChartContainerReady && chartData.series?.length > 0) {
            const timer = setTimeout(() => {
                initializeChart();
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [initializeChart, isChartContainerReady]);

    useEffect(() => {
        if (!isMounted || !chartRef.current || !isChartContainerReady) return;

        const resizeObserver = new ResizeObserver(() => {
            if (chartInstance.current) {
                chartInstance.current.resize();
            }
        });

        resizeObserver.observe(chartRef.current);
        return () => resizeObserver.disconnect();
    }, [isMounted, isChartContainerReady]);

    useEffect(() => {
        setCurrentPage(1);

        let dateRanges;
        if (rangeParameters && rangeParameters.isComparison) {
            dateRanges = {
                current: rangeParameters.current,
                previous: rangeParameters.previous
            };
        } else {
            dateRanges = generateComparisonDateRanges(date, flagCustomRoasDate);
        }

        fetchTableData(dateRanges, 1);
    }, [itemsPerPage]);

    const calculateLeftMargin = (series) => {
        const maxY = Math.max(...series.flatMap(s => s.data || []));
        if (maxY >= 1_000_000_000) return 110;
        if (maxY >= 100_000_000) return 100;
        if (maxY >= 10_000_000) return 90;
        if (maxY >= 1_000_000) return 80;
        if (maxY >= 100_000) return 70;
        if (maxY >= 10_000) return 60;
        if (maxY >= 1_000) return 50;
        return 35;
    };

    const getAxisLabelFormatter = (length) => {
        let modulus = 1;
        if (length > 56) modulus = 5;
        else if (length > 42) modulus = 4;
        else if (length > 28) modulus = 3;
        else if (length > 14) modulus = 2;
        return (value, index) => (index % modulus === 0 ? value : '');
    };

    const generateTooltipContent = (params) => {
        const date = params[0].axisValue;
        let html = `
      <div style="
        background: white;
        border-radius: 6px;
        box-shadow: 0 0 4px rgba(0,0,0,0.1);
        overflow: hidden;
        font-family: sans-serif;
      ">
        <div style="
          background: #EDEDED;
          padding: 6px 12px;
          font-weight: bold;
          font-size: 13px;
          border-bottom: 1px solid #ddd;
          color: #101010;
        ">${date}</div>
        <div style="padding: 6px 12px; font-size: 13px;">
    `;

        params.forEach(param => {
            html += `
        <div style="display: flex; align-items: center; justify-content: space-between; margin: 4px 0; gap: 4px;">
          <div style="display: flex; align-items: center;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${param.color}; margin-right:6px;"></span>
            ${param.seriesName}
          </div>
          <strong>${formatTableValue(param.value, "number")}</strong>
        </div>
      `;
        });

        html += `</div></div>`;
        return html;
    };


    const convertNameKeyword = (keyword) => {
        if (!keyword || keyword == null || keyword === undefined) return "-";

        if (keyword == "targeting") {
            return "Rekomendasi";
        } else if (keyword == "search_product") {
            return "Pencarian";
        } else {
            return keyword;
        }
    }

    return (
        <BaseLayout>
            <button
                className="btn btn-secondary mb-3"
                onClick={() => {
                    navigate("/dashboard/performance/ads", { replace: true });
                    window.location.reload();
                }}
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
                        <div className="w-100 d-flex gap-3">
                            {
                                isLoading ? (
                                    <Skeleton count={1} width={100} height={100} />
                                ) : (
                                    <img
                                        src={
                                            productData?.image
                                                ? `https://down-id.img.susercontent.com/file/${productData.image}`
                                                : "/default-product.png"
                                        }
                                        alt={productData?.title || "Product"}
                                        className="rounded"
                                        style={{
                                            width: "100px",
                                            height: "100px",
                                            objectFit: "cover",
                                            aspectRatio: "1/1",
                                        }}
                                    />
                                )
                            }
                            <div className="d-flex flex-column pt-1">
                                {
                                    isLoading ? (
                                        <Skeleton count={1} width={200} height={20} />
                                    ) : (
                                        <h5>{productData?.title || "-"}</h5>
                                    )
                                }
                                {
                                    isLoading ? (
                                        <Skeleton count={1} width={150} height={15} />
                                    ) : (
                                        <div>
                                            <span className="text-secondary">Mode Bidding : </span>
                                            <span
                                                style={{ borderRadius: "3px", color: "#1ab0f8" }}
                                                className="fw-bold bg-info-subtle px-2 py-1"
                                            >
                                                {productData?.biddingStrategy === "manual" ? "Manual" : "Otomatis" || "-"}
                                            </span>
                                        </div>
                                    )
                                }
                            </div>
                        </div>

                        {/* Details */}
                        <div className="w-100 border rounded p-3" style={{ marginBottom: "0" }}>
                            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
                                {
                                    isLoading ? (
                                        <div className="w-100">
                                            <Skeleton height={60} />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="d-flex flex-column align-items-center align-items-sm-start">
                                                <span>Modal</span>
                                                <span className="fw-bold">
                                                    {productData?.dailyBudget
                                                        ? `Rp ${Number(productData.dailyBudget).toLocaleString("id-ID")}`
                                                        : "Loading..."}
                                                </span>
                                            </div>
                                            <div
                                                className="d-none d-sm-block"
                                                style={{
                                                    width: "1.6px",
                                                    height: "40px",
                                                    backgroundColor: "#CECECE",
                                                }}
                                            ></div>
                                            <div
                                                className="d-block d-sm-none"
                                                style={{
                                                    width: "100%",
                                                    height: "1.6px",
                                                    backgroundColor: "#CECECE",
                                                }}
                                            ></div>
                                            <div className="d-flex flex-column">
                                                <div className="d-flex justify-content-between flex-column align-items-center">
                                                    <span>Periode Iklan</span>
                                                    <span className="fw-bold">Tidak terbatas</span>
                                                </div>
                                            </div>
                                            <div
                                                className="d-none d-sm-block"
                                                style={{
                                                    width: "1.6px",
                                                    height: "40px",
                                                    backgroundColor: "#CECECE",
                                                }}
                                            ></div>
                                            <div
                                                className="d-block d-sm-none"
                                                style={{
                                                    width: "100%",
                                                    height: "1.6px",
                                                    backgroundColor: "#CECECE",
                                                }}
                                            ></div>
                                            <div className="d-flex flex-column">
                                                <div className="d-flex flex-column d-flex flex-column align-items-center align-items-sm-end">
                                                    <span>Penempatan Iklan</span>
                                                    <span className="fw-bold">
                                                        {productData?.productPlacement === "targeting" ? "Rekomendasi" : "Pencarian"}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    )
                                }
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance */}
                <div className="d-flex gap-1 flex-column">
                    <h4 className="fw-bold">Keywords Performance</h4>
                    <div className="card d-flex flex-column p-2 gap-2">
                        {/* Keywords Performance Header */}
                        <div className="d-flex flex-column gap-1">
                            <div className="d-flex gap-3 flex-column rounded p-2">
                                {/* Header & Date filter */}
                                <div className="d-flex justify-content-between align-items-start pb-3">
                                    <div className="d-flex flex-column">
                                        <strong>{totalElements} total keywords</strong>
                                    </div>
                                    <div style={{ position: "relative" }}>
                                        <button
                                            onClick={toggleOpenCalendar}
                                            className="btn btn-primary"
                                        >
                                            {getDateButtonText()}
                                        </button>
                                        {showCalendar && (
                                            <div
                                                className={`card custom-calendar-behavior ${animateCalendar ? "show" : ""}`}
                                                style={{
                                                    flexDirection: "row",
                                                    position: "absolute",
                                                    top: "44px",
                                                    right: "0",
                                                    zIndex: 1000,
                                                    boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
                                                    borderRadius: "8px",
                                                    padding: "5px 10px",
                                                }}
                                            >
                                                <div>
                                                    <p className="pt-2" style={{ textAlign: "center" }}>
                                                        Tanggal Pembanding
                                                    </p>
                                                    <Calendar
                                                        selectRange={true}
                                                        onChange={handleComparatorDateChange}
                                                        value={comparatorDateRange}
                                                        maxDate={
                                                            comparedDateRange ? comparedDateRange[1] :
                                                                new Date(2100, 0, 1)
                                                        }
                                                        minDate={new Date(2000, 0, 1)}
                                                    />
                                                    {(comparatorDateRange) && (
                                                        <div className="text-center mt-1">
                                                            <small className="text-success">
                                                                {comparatorDateRange[0].toLocaleDateString("id-ID")} - ${comparatorDateRange[1].toLocaleDateString("id-ID")}
                                                            </small>
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <p className="pt-2" style={{ textAlign: "center" }}>
                                                        Tanggal Dibanding
                                                    </p>
                                                    <Calendar
                                                        selectRange={true}
                                                        onChange={handleComparedDateChange}
                                                        value={comparedDateRange}
                                                        minDate={
                                                            comparatorDateRange ? comparatorDateRange[0] :
                                                                new Date()
                                                        }
                                                    />
                                                    {(comparedDateRange) && (
                                                        <div className="text-center mt-1">
                                                            <small className="text-success">
                                                                {comparedDateRange[0].toLocaleDateString("id-ID")} - ${comparedDateRange[1].toLocaleDateString("id-ID")}
                                                            </small>
                                                        </div>
                                                    )}
                                                </div>

                                                <div id="custom-calendar-behavior-barrier" style={{ width: "1px", height: "auto", backgroundColor: "#D2D2D2FF", margin: "10px 12px" }}></div>

                                                <div id="custom-calendar-behavior-button" className="d-flex justify-content-between mb-1">
                                                    <div
                                                        className="custom-content-calendar d-flex flex-column py-2 px-1"
                                                        style={{ width: "130px", listStyleType: "none" }}
                                                    >
                                                        <p style={{ cursor: "pointer" }} onClick={() => handleDateSelectionPreset(new Date().toISOString().split("T")[0], "hari_ini")}>Hari ini</p>
                                                        <p style={{ cursor: "pointer" }}
                                                            onClick={() => {
                                                                const yesterday = new Date();
                                                                yesterday.setDate(yesterday.getDate() - 1);
                                                                handleDateSelectionPreset(yesterday.toISOString().split("T")[0], "kemarin");
                                                            }}
                                                        >
                                                            Kemarin
                                                        </p>
                                                        <p style={{ cursor: "pointer" }} onClick={() => handleDateSelectionPreset(getAllDaysInLast7Days(), "minggu_ini")}>1 Minggu terakhir</p>
                                                        <p style={{ cursor: "pointer" }} onClick={() => handleDateSelectionPreset("Bulan Ini", "bulan_ini")}>Bulan ini</p>
                                                    </div>
                                                    <div className="d-flex gap-1 flex-column">
                                                        <button
                                                            className="btn btn-secondary w-100"
                                                            onClick={resetComparisonDates}
                                                            disabled={!comparatorDateRange && !comparedDateRange}
                                                        >
                                                            Reset
                                                        </button>
                                                        <button
                                                            className="btn btn-primary w-100"
                                                            onClick={handleComparisonDatesConfirm}
                                                            disabled={isConfirmButtonDisabled()}
                                                            style={
                                                                isConfirmButtonDisabled() ? { cursor: "not-allowed" } : { cursor: "pointer" }
                                                            }
                                                        >
                                                            Terapkan
                                                            {rangeParameters && rangeParameters.isRange && (
                                                                <small className="d-block" style={{ fontSize: "10px" }}>
                                                                    Mode Perbandingan Range
                                                                </small>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {
                                    isLoading ? (
                                        <div className="d-flex justify-content-center align-items-start vh-100">
                                            <Loading size={40} />
                                        </div>
                                    ) : (
                                        <>
                                            {/* Metrics filter */}
                                            <div className="d-flex flex-column gap-3">
                                                <div className="row g-3">
                                                    {Object.keys(metrics).map((metricKey) => (
                                                        <div
                                                            className="col-12 col-sm-6 col-lg-3"
                                                            key={metricKey}
                                                        >
                                                            <div
                                                                className="card shadow-md px-2 py-1 h-100"
                                                                style={handleStyleMatricButton(metricKey)}
                                                                onClick={() => handleMetricFilter(metricKey)}
                                                            >
                                                                <strong style={{ color: "#5d7186" }}>
                                                                    {metrics[metricKey].label}
                                                                </strong>
                                                                <span className="card-text fs-4 fw-bold">
                                                                    {
                                                                        metrics[metricKey].type === "currency"
                                                                            ? <span>Rp. {formatTableValue(metricsTotals[metricKey], "simple_currency")}</span>
                                                                            : metrics[metricKey].type === "simple_currency"
                                                                                ? <span>{formatTableValue(metricsTotals[metricKey], "simple_currency")}</span>
                                                                                : metrics[metricKey].type === "percentage"
                                                                                    ? <span>{formatTableValue(metricsTotals[metricKey], "percentage")}</span>
                                                                                    : <span>{formatTableValue(metricsTotals[metricKey], "coma")}</span>
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* Alert validation */}
                                                {showAlert && (
                                                    <div className="alert alert-warning alert-dismissible fade show" role="alert">
                                                        Maksimal 4 metrik yang dapat dipilih
                                                        <button
                                                            type="button"
                                                            className="btn-close"
                                                            onClick={() => setShowAlert(false)}
                                                        ></button>
                                                    </div>
                                                )}
                                                {selectedMetrics.length === 0 && (
                                                    <div className="alert alert-warning alert-dismissible fade show">
                                                        <span>Pilih minimal 1 metrik untuk menampilkan data secara akurat</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Chart */}
                                            <div ref={chartRefCallback} style={{ width: "100%", height: "340px" }}></div>
                                        </>
                                    )
                                }
                            </div>
                        </div>

                        {/* Keywords Table */}
                        <div style={{ position: 'relative' }}>
                            {isTableFilterLoading && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        zIndex: 10,
                                        minHeight: '200px'
                                    }}
                                >
                                    <Loading size={40} />
                                </div>
                            )}
                            <div className="p-2 d-flex flex-column gap-1">
                                <div className="d-flex justify-content-between align-items-center mb-2">
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
                                            <div key={col.key} className="form-check form-check-inline py-1">
                                                <input
                                                    style={{
                                                        border: "1px solid #8042D4",
                                                        width: "18px",
                                                        height: "18px",
                                                        borderRadius: "10%",
                                                    }}
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={selectedColumns.includes(col.key)}
                                                    onChange={() => handleColumnChange(col.key)}
                                                />
                                                <label className="form-check-label fs-6 ms-1">
                                                    {col.label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="table-responsive" style={{ borderRadius: "4px" }}>
                                    <table className="table table-centered" style={{
                                        width: "100%",
                                        minWidth: "max-content",
                                        maxWidth: "none",
                                    }}>
                                        <thead className="table-dark">
                                            <tr>
                                                {keywordsData.length !== 0 && keywordsData !== null && <th scope="col">No</th>}
                                                {allColumns
                                                    .filter((col) => selectedColumns.includes(col.key))
                                                    .map((col) => (
                                                        <th key={col.key}>
                                                            <div className="d-flex justify-content-start align-items-center">
                                                                {col.label}
                                                            </div>
                                                        </th>
                                                    ))
                                                }
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {keywordsData.length !== 0 && keywordsData !== null ? (
                                                keywordsData?.map((entry, index) => (
                                                    <tr key={entry.campaignId || index}>
                                                        {keywordsData.length > 0 && keywordsData !== null && (
                                                            <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                                        )}
                                                        {selectedColumns.includes("keyword") && (
                                                            <td style={{ width: "200px" }}>
                                                                <span>{
                                                                    convertNameKeyword(entry.data[0].keyword)
                                                                }</span>
                                                            </td>
                                                        )}
                                                        {selectedColumns.includes("dailyBudget") && (
                                                            <td style={{ width: "180px" }}>
                                                                <span>
                                                                    {
                                                                        entry.data[0].dailyBudget === undefined || entry.data[0].dailyBudget === null ? "-" : formatTableValue(entry.data[0].dailyBudget, "currency")
                                                                    }
                                                                </span>
                                                            </td>
                                                        )}
                                                        {selectedColumns.includes("insight") && (
                                                            <td style={{ width: "260px" }}>
                                                                <span>
                                                                    {entry.data[0].insight === undefined || entry.data[0].insight === null ? "-" : entry.data[0].insight}
                                                                </span>
                                                            </td>
                                                        )}
                                                        {selectedColumns.includes("salesClassification") && (
                                                            <td style={{ width: "200px" }}>
                                                                <div className="d-flex gap-1 align-items-center">
                                                                    <div
                                                                        className="marker"
                                                                        style={{
                                                                            backgroundColor: formatStyleSalesClassification(entry.data[0].salesClassification).backgroundColor,
                                                                        }}
                                                                    ></div>
                                                                    <span
                                                                        style={{
                                                                            fontSize: "14px",
                                                                        }}
                                                                    >
                                                                        {
                                                                            entry.data[0].salesClassification === undefined || entry.data[0].salesClassification === null ? "-" : formatStyleSalesClassification(entry.data[0].salesClassification).label
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        )}
                                                        {selectedColumns.includes("cost") && (
                                                            <td style={{ width: "180px" }}>
                                                                <div className="d-flex flex-column">
                                                                    <span>
                                                                        {
                                                                            entry.data[0].cost === undefined || entry.data[0].cost === null ? "-" : formatTableValue(entry.data[0].cost, "currency")
                                                                        }
                                                                    </span>
                                                                    <span className={`${formatValueRatio(entry.data[0].costComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                                                        {
                                                                            entry.data[0].costComparison === undefined || entry.data[0].costComparison === null ? "-" : formatTableValue(entry.data[0].costComparison, "ratio")
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        )}
                                                        {selectedColumns.includes("broadGmv") && (
                                                            <td style={{ width: "180px" }}>
                                                                <div className="d-flex flex-column">
                                                                    <span>
                                                                        {entry.data[0].broadGmv === undefined || entry.data[0].broadGmv === null ? "-" : formatTableValue(entry.data[0].broadGmv, "currency")}</span>
                                                                    <span className={`${formatValueRatio(entry.data[0].broadGmvComparisson).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                                                        {entry.data[0].broadGmvComparison === undefined || entry.data[0].broadGmvComparison === null ? "-" : formatTableValue(entry.data[0].broadGmvComparison, "ratio")}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        )}
                                                        {selectedColumns.includes("roas") && (
                                                            <td style={{ width: "120px" }}>
                                                                <div className="d-flex flex-column">
                                                                    <span>{
                                                                        entry.data[0].roas === undefined || entry.data[0].roas === null ? "-" : formatTableValue(entry.data[0].roas, "coma")
                                                                    }</span>
                                                                    <span className={`${formatValueRatio(entry.data[0].roasComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                                                        {entry.data[0].roasComparison === undefined || entry.data[0].roasComparison === null ? "-" : formatTableValue(entry.data[0].roasComparison, "ratio")}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        )}
                                                        {selectedColumns.includes("impression") && (
                                                            <td style={{ width: "200px" }}>
                                                                <div className="d-flex flex-column">
                                                                    <span>{
                                                                        entry.data[0].impression === undefined || entry.data[0].impression === null ? "-" : formatTableValue(entry.data[0].impression, "simple_currency")
                                                                    }</span>
                                                                    <span className={`${formatValueRatio(entry.data[0].impressionComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                                                        {entry.data[0].impressionComparison === undefined || entry.data[0].impressionComparison === null ? "-" : formatTableValue(entry.data[0].impressionComparison, "ratio")}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        )}
                                                        {selectedColumns.includes("click") && (
                                                            <td style={{ width: "200px" }}>
                                                                <div className="d-flex flex-column">
                                                                    <span>{
                                                                        entry.data[0].click === undefined || entry.data[0].click === null ? "-" : formatTableValue(entry.data[0].click, "simple_currency")
                                                                    }</span>
                                                                    <span className={`${formatValueRatio(entry.data[0].clickComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                                                        {entry.data[0].clickComparison === undefined || entry.data[0].clickComparison === null ? "-" : formatTableValue(entry.data[0].clickComparison, "ratio")}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        )}
                                                        {selectedColumns.includes("ctr") && (
                                                            <td style={{ width: "200px" }}>
                                                                <div className="d-flex flex-column">
                                                                    <span>{
                                                                        entry.data[0].ctr === undefined || entry.data[0].ctr === null ? "-" : formatTableValue(entry.data[0].ctr, "percentage")
                                                                    }</span>
                                                                    <span className={`${formatValueRatio(entry.data[0].ctrComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                                                        {entry.data[0].ctrComparison === undefined || entry.data[0].ctrComparison === null ? "-" : formatTableValue(entry.data[0].ctrComparison, "ratio")}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        )}
                                                        {/* blm ada */}
                                                        {selectedColumns.includes("broadOrder") && (
                                                            <td style={{ width: "200px" }}>
                                                                <div className="d-flex flex-column">
                                                                    <span>
                                                                        {
                                                                            entry.data[0].broadOrder === undefined || entry.data[0].broadOrder === null ? "-" : formatTableValue(entry.data[0].broadOrder, "simple_currency")
                                                                        }
                                                                    </span>
                                                                    <span className={`${formatValueRatio(entry.data[0].broadOrderComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                                                        {entry.data[0].broadOrderComparison === undefined || entry.data[0].broadOrderComparison === null ? "-" : formatTableValue(entry.data[0].broadOrderComparison, "ratio")}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        )}
                                                        {selectedColumns.includes("cr") &&
                                                            <td style={{ width: "200px" }}>
                                                                <div className="d-flex flex-column">
                                                                    <span>{
                                                                        entry.data[0].cr === undefined || entry.data[0].cr === null ? "-" : formatTableValue(entry.data[0].cr, "percentage")
                                                                    }</span>
                                                                    <span className={`${formatValueRatio(entry.data[0].crComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                                                        {entry.data[0].crComparison === undefined || entry.data[0].crComparison === null ? "-" : formatTableValue(entry.data[0].crComparison, "ratio")}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        }
                                                        {/* blm ada */}
                                                        {selectedColumns.includes("broadOrderAmount") && (
                                                            <td style={{ width: "200px" }}>
                                                                <div className="d-flex flex-column">
                                                                    <span>
                                                                        {
                                                                            entry.data[0].broadOrderAmount === undefined || entry.data[0].broadOrderAmount === null ? "-" : formatTableValue(entry.data[0].broadOrderAmount, "simple_currency")
                                                                        }
                                                                    </span>
                                                                    <span className={`${formatValueRatio(entry.data[0].broadOrderAmountComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                                                        {entry.data[0].broadOrderAmountComparison === undefined || entry.data[0].broadOrderAmountComparison === null ? "-" : formatTableValue(entry.data[0].broadOrderAmountComparison, "ratio")}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        )}
                                                        {selectedColumns.includes("cpc") && (
                                                            <td style={{ width: "200px" }}>
                                                                <div className="d-flex flex-column">
                                                                    <span>
                                                                        {
                                                                            entry.data[0].cpc === undefined || entry.data[0].cpc === null ? "-" : formatTableValue(entry.data[0].cpc, "currency")
                                                                        }
                                                                    </span>
                                                                    <span className={`${formatValueRatio(entry.data[0].cpcComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                                                        {entry.data[0].cpcComparison === undefined || entry.data[0].cpcComparison === null ? "-" : formatTableValue(entry.data[0].cpcComparison, "ratio")}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        )}
                                                        {selectedColumns.includes("acos") && (
                                                            <td style={{ width: "200px" }}>
                                                                <div className="d-flex flex-column">
                                                                    <span>
                                                                        {
                                                                            entry.data[0].acos === undefined || entry.data[0].acos === null ? "-" : formatTableValue(entry.data[0].acos, "percentage")
                                                                        }
                                                                    </span>
                                                                    <span className={`${formatValueRatio(entry.data[0].acosComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                                                        {entry.data[0].acosComparison === undefined || entry.data[0].acosComparison === null ? "-" : formatTableValue(entry.data[0].acosComparison, "ratio")}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        )}
                                                        {selectedColumns.includes("directOrder") && (
                                                            <td style={{ width: "200px" }}>
                                                                <div className="d-flex flex-column">
                                                                    <span>
                                                                        {
                                                                            entry.data[0].directOrder === undefined || entry.data[0].directOrder === null ? "-" : formatTableValue(entry.data[0].directOrder, "simple_currency")
                                                                        }
                                                                    </span>
                                                                    <span className={`${formatValueRatio(entry.data[0].directOrderComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                                                        {entry.data[0].directOrderComparison === undefined || entry.data[0].directOrderComparison === null ? "-" : formatTableValue(entry.data[0].directOrderComparison, "ratio")}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        )}
                                                        {selectedColumns.includes("directOrderAmount") && (
                                                            <td style={{ width: "200px" }}>
                                                                <div className="d-flex flex-column">
                                                                    <span>
                                                                        {
                                                                            entry.data[0].directOrderAmount === undefined || entry.data[0].directOrderAmount === null ? "-" : formatTableValue(entry.data[0].directOrderAmount, "simple_currency")
                                                                        }
                                                                    </span>
                                                                    <span className={`${formatValueRatio(entry.data[0].directOrderAmountComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                                                        {entry.data[0].directOrderAmountComparison === undefined || entry.data[0].directOrderAmountComparison === null ? "-" : formatTableValue(entry.data[0].directOrderAmountComparison, "ratio")}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        )}
                                                        {selectedColumns.includes("directGmv") && (
                                                            <td style={{ width: "200px" }}>
                                                                <div className="d-flex flex-column">
                                                                    <span>
                                                                        {
                                                                            entry.data[0].directGmv === undefined || entry.data[0].directGmv === null ? "-" : formatTableValue(entry.data[0].directGmv, "currency")
                                                                        }
                                                                    </span>
                                                                    <span className={`${formatValueRatio(entry.data[0].directGmvComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                                                        {entry.data[0].directGmvComparison === undefined || entry.data[0].directGmvComparison === null ? "-" : formatTableValue(entry.data[0].directGmvComparison, "ratio")}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        )}
                                                        {selectedColumns.includes("directRoi") && (
                                                            <td style={{ width: "200px" }}>
                                                                <div className="d-flex flex-column">
                                                                    <span>
                                                                        {
                                                                            entry.data[0].directRoi === undefined || entry.data[0].directRoi === null ? "-" : formatTableValue(entry.data[0].directRoi, "simple_currency")
                                                                        }
                                                                    </span>
                                                                    <span className={`${formatValueRatio(entry.data[0].directRoiComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                                                        {entry.data[0].directRoiComparison === undefined || entry.data[0].directRoiComparison === null ? "-" : formatTableValue(entry.data[0].directRoiComparison, "ratio")}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        )}
                                                        {selectedColumns.includes("directCir") && (
                                                            <td style={{ width: "200px" }}>
                                                                <div className="d-flex flex-column">
                                                                    <span>
                                                                        {
                                                                            entry.data[0].directCir === undefined || entry.data[0].directCir === null ? "-" : formatTableValue(entry.data[0].directCir, "percentage")
                                                                        }
                                                                    </span>
                                                                    <div className={`${formatValueRatio(entry.data[0].directCirComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                                                        {entry.data[0].directCirComparison === undefined || entry.data[0].directCirComparison === null ? "-" : formatTableValue(entry.data[0].directCirComparison, "ratio")}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        )}
                                                        {selectedColumns.includes("directCr") && (
                                                            <td style={{ width: "200px" }}>
                                                                <div className="d-flex flex-column">
                                                                    <span>
                                                                        {
                                                                            entry.data[0].directCr === undefined || entry.data[0].directCr === null ? "-" : formatTableValue(entry.data[0].directCr, "percentage")
                                                                        }
                                                                    </span>
                                                                    <span className={`${formatValueRatio(entry.data[0].directCrComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                                                        {entry.data[0].directCrComparison === undefined || entry.data[0].directCrComparison === null ? "-" : formatTableValue(entry.data[0].directCrComparison, "ratio")}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        )}
                                                        {selectedColumns.includes("cpdc") && (
                                                            <td style={{ width: "200px" }}>
                                                                <div className="d-flex flex-column">
                                                                    <span>
                                                                        {
                                                                            entry.data[0].cpdc === undefined || entry.data[0].cpdc === null ? "-" : formatTableValue(entry.data[0].cpdc, "currency")
                                                                        }
                                                                    </span>
                                                                    <span className={`${formatValueRatio(entry.data[0].cpdcComparison).isNegative ? "text-danger" : "text-success"}`} style={{ fontSize: "10px" }}>
                                                                        {entry.data[0].cpdcComparison === undefined || entry.data[0].cpdcComparison === null ? "-" : formatTableValue(entry.data[0].cpdcComparison, "ratio")}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={selectedColumns.length + 1} className="text-left">
                                                        <span>Tidak ada keyword untuk produk ini</span>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {keywordsData.length > 0 && keywordsData !== null && renderPagination()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </BaseLayout>
    );
};