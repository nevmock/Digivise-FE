import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Calendar from "react-calendar";
import * as echarts from "echarts";
import toast from "react-hot-toast";

import axiosRequest from "../../utils/request";
import Loading from "../../components/atoms/Loading/Loading";
import BaseLayout from "../../components/organisms/BaseLayout";
import { ssrImportMetaKey } from "vite/module-runner";

export default function DetailAds() {
    const navigate = useNavigate();
    const { campaignId } = useParams();
    // Data
    const [filteredData, setFilteredData] = useState([]);
    const [productData, setProductData] = useState([]);
    const [keywordsData, setKeywordsData] = useState([]);
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
    const [isContentLoading, setIsContentLoading] = useState(false);
    const [isTableFilterLoading, setIsTableFilterLoading] = useState(false);

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

    // CUSTOM CHART WITH FILTER DATE, CLICK PRODUCT FEATURE
    // Define metrics with their display names and colors
    const metrics = {
        impression: {
            label: "Iklan Dilihat",
            color: "#D50000",
            dataKey: "impression",
            type: "currency",
        },
        click: {
            label: "Jumlah Klik",
            color: "#00B800",
            dataKey: "click",
            type: "currency",
        },
        ctr: {
            label: "Persentase Klik",
            color: "#DFC100",
            dataKey: "ctr",
            type: "percentage",
        },
        checkout: {
            label: "Pesanan",
            color: "#C400BA",
            dataKey: "checkout",
            type: "currency",
        },
        broadOrderAmount: {
            label: "Produk Terjual",
            color: "#35007FFF",
            dataKey: "broadOrderAmount",
            type: "currency",
        },
        broadGmv: {
            label: "Penjualan dari Iklan",
            color: "#AD5F00",
            dataKey: "broadGmv",
            type: "currency",
        },
        dailyBudget: {
            label: "Biaya Iklan",
            color: "#00B69A",
            dataKey: "dailyBudget",
            type: "currency",
        },
        roas: {
            label: "ROAS",
            color: "#743A00FF",
            dataKey: "roas",
            type: "comma",
        },
    };

    const toLocalISOString = (date) => {
        console.log("Converting date to ISO string:", date);
        if (!date || !(date instanceof Date)) {
            console.error("Invalid date passed to toLocalISOString:", date);
            return null;
        }

        const year = date?.getFullYear();
        const month = String(date?.getMonth() + 1).padStart(2, "0");
        const day = String(date?.getDate()).padStart(2, "0");
        const hours = String(date?.getHours()).padStart(2, "0");
        const minutes = String(date?.getMinutes()).padStart(2, "0");
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

    const fetchChartData = async (dateRanges) => {
        try {
            const from1ISO = toLocalISOString(dateRanges.current.from);
            const to1ISO = toLocalISOString(dateRanges.current.to);

            const apiUrl = `/api/product-keyword?shopId=${getShopeeId}&campaignId=${campaignId}&from=${from1ISO}&to=${to1ISO}&limit=50`;

            const response = await axiosRequest.get(apiUrl);
            const data = await response.data;
            const content = data.content || [];

            setChartRawData(content);
            const totals = calculateMetricTotalsValue(content);
            setMetricsTotals(totals);

            return content;
        } catch (error) {
            toast.error("Gagal mengambil data chart iklan produk");
            console.error(
                "Gagal mengambil data chart iklan produk, kesalahan pada server:",
                error
            );
            return [];
        }
    };

    const fetchTableData = async (dateRanges, page = 1) => {
        setIsTableFilterLoading(true);
        // console.log('Fetching table data with date ranges:', dateRanges);

        try {
            const from1ISO = toLocalISOString(dateRanges?.current?.from);
            const to1ISO = toLocalISOString(dateRanges?.current?.to);
            const from2ISO = toLocalISOString(dateRanges?.previous?.from);
            const to2ISO = toLocalISOString(dateRanges?.previous?.to);

            const backendPage = Math.max(0, page - 1);
            const apiUrl = `/api/product-keyword?shopId=${getShopeeId}&campaignId=${campaignId}&from1=${from1ISO}&to1=${to1ISO}&from2=${from2ISO}&to2=${to2ISO}&limit=50&page=${backendPage}`;

            console.log("API URL Table Data:", apiUrl);
            const response = await axiosRequest.get(apiUrl);
            const data = await response.data;
            const content = data.content || [];

            setFilteredData(content);
            setTotalPages(data?.totalPages || 1);
            setTotalElements(data?.totalElements || 0);

            return content;
        } catch (error) {
            toast.error("Gagal mengambil data tabel iklan produk");
            console.error(
                "Gagal mengambil data tabel iklan produk, kesalahan pada server:",
                error
            );
            return [];
        } finally {
            setIsTableFilterLoading(false);
        }
    };

    const fetchData = async (currentSelection, selectionType, page = 1) => {
        setIsLoading(true);

        try {
            const dateRanges = generateComparisonDateRanges(
                currentSelection,
                selectionType
            );

            // console.log('Generated Date Ranges:', {
            //   previous: `${dateRanges.previous.from.toISOString()} - ${dateRanges.previous.to.toISOString()}`,
            //   current: `${dateRanges.current.from.toISOString()} - ${dateRanges.current.to.toISOString()}`
            // });

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
            toast.error("Gagal mengambil data iklan produk");
            console.error(
                "Gagal mengambil data iklan produk, kesalahan pada server:",
                error
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Function to calculate totals for each metric based on raw data affected by time filter
    function calculateMetricTotalsValue(products) {
        // Make an object to store totals for each available metric
        const totals = {};
        // Foreach metric on all available metrics
        Object.keys(metrics).forEach((metricKey) => {
            totals[metricKey] = 0;
            products.forEach((product) => {
                if (product.data.length === 0) return;
                product.data.forEach((productData) => {
                    const dataKey = metrics[metricKey].dataKey;
                    const value = productData[dataKey];
                    if (value !== undefined && value !== null) {
                        totals[metricKey] += Number(value);
                    }
                });
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
                `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(
                    2,
                    "0"
                )}`
        );
    };

    function getHourlyIntervals(selectedDate) {
        return Array.from({ length: 24 }, (_, i) => {
            const hour = String(i).padStart(2, "0");
            return `${selectedDate} ${hour}:00`;
        });
    };

    function getDateRangeIntervals(startDate, endDate) {
        // Set start and end dates to the beginning and end of the day
        const start =
            startDate instanceof Date ? new Date(startDate) : new Date(startDate);
        const end = endDate instanceof Date ? new Date(endDate) : new Date(endDate);
        // Set start to the beginning of the day and end to the end of the day
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const dateArray = [];
        const getLocalDateString = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        };

        // Calculate the difference in days between start and end dates
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays == 0) {
            return getHourlyIntervals(getLocalDateString(start));
        }

        // Otherwise, return daily intervals
        let currentDate = new Date(start);
        while (currentDate <= end) {
            dateArray.push(getLocalDateString(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dateArray;
    };

    function generateMultipleKeywordChartData(
        selectedDate = null,
        selectedMetrics = ["impression"]
    ) {
        let timeIntervals = [];
        let mode = "daily";
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

        const getDataDate = (productData) => {
            if (productData.shopeeFrom) {
                return convertShopeeTimestampToDate(productData.shopeeFrom);
            } else if (productData.createdAt) {
                return new Date(productData.createdAt);
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
                mode = "hourly";
                isSingleDay = true;
            } else {
                timeIntervals = getDateRangeIntervals(fromDate, toDate);
                mode = "daily";
                isSingleDay = false;
            }
        } else {
            if (selectedDate === null || Array.isArray(selectedDate)) {
                timeIntervals = getAllDaysInLast7Days();
                fromDate = new Date(timeIntervals[0] + "T00:00:00");
                toDate = new Date(
                    timeIntervals[timeIntervals.length - 1] + "T23:59:59"
                );
            } else if (selectedDate === "Bulan Ini") {
                timeIntervals = getAllDaysInAMonth();
                const today = new Date();
                fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
                toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                fromDate.setHours(0, 0, 0, 0);
                toDate.setHours(23, 59, 59, 999);
            } else {
                timeIntervals = getHourlyIntervals(selectedDate);
                mode = "hourly";
                isSingleDay = true;
                fromDate = new Date(selectedDate);
                toDate = new Date(selectedDate);
                fromDate.setHours(0, 0, 0, 0);
                toDate.setHours(23, 59, 59, 999);
            }
        }

        if (!timeIntervals || timeIntervals.length === 0) {
            timeIntervals = [getLocalDateString(new Date())];
            fromDate = new Date();
            toDate = new Date();
            fromDate.setHours(0, 0, 0, 0);
            toDate.setHours(23, 59, 59, 999);
        }

        result.timeIntervals = timeIntervals;
        result.isSingleDay = isSingleDay;
        result.series = [];

        if (!keywordsData || keywordsData.length === 0) {
            return result;
        }

        // Filter keywords based on selected keyword
        let chartDataKeywords = keywordsData;

        // Generate time-based data series for each selected metric
        selectedMetrics?.forEach((metricKey) => {
            const metric = metrics[metricKey];
            if (!metric) return;

            const dataKey = metric.dataKey;
            let dataMap = {};

            // Inisialisasi dataMap dengan nilai 0 untuk setiap interval waktu
            timeIntervals.forEach((time) => {
                dataMap[time] = 0;
            });

            // Proses data untuk setiap keyword
            chartDataKeywords?.forEach((keyword) => {
                if (!keyword) return;

                // Kita perlu menangani kasus single day vs range day
                if (isSingleDay) {
                    // Untuk mode hourly (single day), kita perlu membagi data keyword berdasarkan jam
                    // Karena keyword tidak memiliki timestamp per jam, kita buat distribusi berdasarkan createdAt

                    if (keyword.createdAt) {
                        const createdAt = new Date(keyword.createdAt);

                        // Extract jam saja (tanpa menit & detik)
                        const hourKey = String(createdAt.getHours()).padStart(2, "0");
                        const keywordYear = createdAt.getFullYear();
                        const keywordMonth = String(createdAt.getMonth() + 1).padStart(
                            2,
                            "0"
                        );
                        const keywordDay = String(createdAt.getDate()).padStart(2, "0");

                        // Buat key untuk pemetaan (hanya jam, tanpa menit & detik)
                        const hourOnlyKey = `${keywordYear}-${keywordMonth}-${keywordDay} ${hourKey}:00`;

                        // Cek apakah jam tersebut ada dalam timeIntervals
                        if (timeIntervals.includes(hourOnlyKey)) {
                            const value = keyword[dataKey];
                            if (value !== undefined && value !== null) {
                                // Simpan nilai di dataMap
                                dataMap[hourOnlyKey] += Number(value);
                            }
                        }
                    } else {
                        // Jika keyword tidak memiliki createdAt, distribusikan nilai secara merata
                        // Ini hanya fallback jika data tidak lengkap
                        const value = keyword[dataKey];
                        if (value !== undefined && value !== null) {
                            // Ambil jam tertentu (misalnya jam 12 siang) untuk menampilkan data
                            const midDayHour = `${fromDate.toISOString().split("T")[0]
                                } 12:00`;
                            if (timeIntervals.includes(midDayHour)) {
                                dataMap[midDayHour] += Number(value);
                            }
                        }
                    }
                } else {
                    // Untuk mode daily (range day), kita perlu mengelompokkan berdasarkan tanggal
                    if (keyword.createdAt) {
                        const createdAt = new Date(keyword.createdAt);
                        const keywordYear = createdAt.getFullYear();
                        const keywordMonth = String(createdAt.getMonth() + 1).padStart(
                            2,
                            "0"
                        );
                        const keywordDay = String(createdAt.getDate()).padStart(2, "0");
                        const dateDayKey = `${keywordYear}-${keywordMonth}-${keywordDay}`;

                        if (timeIntervals.includes(dateDayKey)) {
                            const value = keyword[dataKey];
                            if (value !== undefined && value !== null) {
                                dataMap[dateDayKey] += Number(value);
                            }
                        }
                    } else {
                        // Distribusikan nilai secara proporsional di seluruh interval waktu
                        // Ini fallback jika tidak ada createdAt
                        const value = keyword[dataKey];
                        if (value !== undefined && value !== null) {
                            // Distribusikan nilai total secara merata di semua interval waktu
                            const valuePerInterval = Number(value) / timeIntervals.length;
                            timeIntervals.forEach((interval) => {
                                dataMap[interval] += valuePerInterval;
                            });
                        }
                    }
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

            // Get start date text
            if (comparatorDateRange) {
                startText = `${comparatorDateRange[0].toLocaleDateString(
                    "id-ID"
                )} - ${comparatorDateRange[1].toLocaleDateString("id-ID")}`;
            }

            // Get end date text
            if (comparedDateRange) {
                endText = `${comparedDateRange[0].toLocaleDateString(
                    "id-ID"
                )} - ${comparedDateRange[1].toLocaleDateString("id-ID")}`;
            }

            // Combine texts
            if (startText && endText) {
                return `${startText} vs ${endText}`;
            }
        }

        // Default text
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
            errorMessage =
                "Untuk mode perbandingan, kedua kalender harus diisi. Silakan pilih tanggal atau range di kalender kedua (Tanggal Dibanding).";
            return { isValid: false, message: errorMessage };
        }

        if (hasComparedRange && !hasComparatorRange) {
            errorMessage =
                "Untuk mode perbandingan, kedua kalender harus diisi. Silakan pilih tanggal atau range di kalender pertama (Tanggal Pembanding).";
            return { isValid: false, message: errorMessage };
        }

        if (comparatorDateRange) {
            if (comparatorDateRange[0] > comparatorDateRange[1]) {
                errorMessage =
                    "Tanggal mulai tidak boleh lebih besar dari tanggal akhir pada kalender pertama";
                return { isValid: false, message: errorMessage };
            }
            hasValidSelection = true;
        }

        if (comparedDateRange) {
            if (comparedDateRange[0] > comparedDateRange[1]) {
                errorMessage =
                    "Tanggal mulai tidak boleh lebih besar dari tanggal akhir pada kalender kedua";
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
            console.error('Validation error:', validation.message);
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

            const currentFilters = {
                searchQuery: debouncedSearchTerm,
                statusFilter: statusAdsFilter,
                typeAds: selectedTypeAds,
                classification: selectedClassificationOption,
                placement: selectedOptionPlacement,
            };

            Promise.all([
                fetchChartData(manualDateRanges),
                fetchTableData(manualDateRanges, 1, currentFilters),
            ]).catch((error) => {
                toast.error("Gagal mengambil data iklan produk");
                console.error("Error in manual comparison:", error);
            });
        }
    };

    function handleDateSelectionPreset(selectedDateOption, type = "minggu_ini") {
        // Reset manual comparison dates
        setComparatorDateRange(null);
        setComparedDateRange(null);
        setDate(selectedDateOption);
        setFlagCustomRoasDate(type);
        setShowCalendar(false);
        setCurrentPage(1);

        // Use new automatic comparison logic
        fetchData(selectedDateOption, type, 1);
    };

    useEffect(() => {
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
    }, [date, selectedMetrics, chartRawData, productData]);

    useEffect(() => {
        if (chartRef.current) {
            const chartInstance = echarts.init(chartRef.current);

            const series =
                chartData.series?.map((s) => ({
                    name: s.name,
                    type: "line",
                    smooth: true,
                    showSymbol: true,
                    symbolSize: false,
                    emphasis: { focus: "series" },
                    data: s.data,
                    lineStyle: {
                        color: s.color,
                    },
                    itemStyle: {
                        color: s.color,
                    },
                })) || [];

            const hasData = series.some(
                (s) => s.data && s.data.some((value) => value > 0)
            );

            const option = {
                toolbox: { feature: { saveAsImage: {} } },
                grid: {
                    left: 12,
                    right: 50,
                    bottom: 50,
                    containLabel: false,
                },
                tooltip: {
                    trigger: "axis",
                    formatter: function (params) {
                        let result = "";

                        // Add the original time interval for context
                        if (params[0] && params[0].axisIndex === 0) {
                            const index = params[0].dataIndex;
                            if (index >= 0 && index < timeIntervals.length) {
                                result = timeIntervals[index] + "<br/>";
                            } else {
                                result = params[0].axisValue + "<br/>";
                            }
                        }

                        // Add each series value
                        params.forEach((param) => {
                            const metricKey = Object.keys(metrics).find(
                                (key) => metrics[key].label === param.seriesName
                            );

                            const formattedValue = metricKey
                                ? formatMetricValue(metricKey, param.value)
                                : param.value;

                            result += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${param.color};"></span> ${param.seriesName}: ${formattedValue}<br/>`;
                        });
                        return result;
                    },
                },
                legend: {
                    data: chartData.series?.map((s) => s.name) || [],
                    bottom: 0,
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
                    name:
                        selectedMetrics.length === 1
                            ? metrics[selectedMetrics[0]]?.label
                            : "Total",
                    type: "value",
                    splitLine: { show: true },
                },
                series: series,
            };

            if (!hasData && comparedDateRange && comparedDate) {
                option.graphic = [
                    {
                        type: "text",
                        left: "center",
                        top: "middle",
                        style: {
                            text: "Tidak ada data untuk rentang waktu yang dipilih",
                            fontSize: 16,
                            fill: "#999",
                            fontWeight: "bold",
                        },
                    },
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
        { key: "info_iklan", label: "Info iklan" },
        { key: "dailyBudget", label: "Modal" },
        { key: "insight", label: "Insight" },
        { key: "salesClassification", label: "Sales Classification" },
        { key: "cost", label: "Biaya Iklan" },
        { key: "broadGmv", label: "Penjualan dari iklan" },
        { key: "roas", label: "ROAS" },
        { key: "custom_roas", label: "Custom ROAS" },
        { key: "impression", label: "Iklan dilihat" },
        { key: "click", label: "Jumlah Klik" },
        { key: "ctr", label: "Presentase Klik" },
        { key: "broadOrder", label: "Konversi" },
        { key: "cr", label: "Tingkat Konversi" },
        { key: "broadOrderAmount", label: "Produk Terjual" },
        { key: "cpc", label: "Biaya per Konversi" },
        { key: "acos", label: "ACOS (Presentase Biaya Iklan)" },
        { key: "directOrder", label: "Konversi Langung" },
        { key: "directOrderAmount", label: "Produk Terjual Langsung" },
        { key: "directGmv", label: "Penjualan dari Iklan Langsung" },
        { key: "directRoi", label: "ROAS (Efektifitas Iklan) Langsung" },
        { key: "directCir", label: "ACOS Langsung" },
        { key: "directCr", label: "Tingkat Konversi Langsung" },
        { key: "cpdc", label: "Biaya per Konversi Langsung" },
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

    // Handle style for matric filter button
    const handleStyleMatricButton = (metricKey) => {
        const isActive = selectedMetrics.includes(metricKey);
        const metric = metrics[metricKey];

        return {
            backgroundColor: "#ffffff00",
            borderTop: `solid ${isActive ? `${metric.color} 3px` : "rgb(179.4, 184.2, 189) 1px"
                }`,
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

    // Format metric value based on its type
    const formatMetricValue = (metricKey, value) => {
        if (value === undefined || value === null) return "-";

        switch (metricKey) {
            case "impression":
            case "click":
                return value.toLocaleString("id-ID");
            case "ctr":
                return (value * 100).toFixed(2) + "%";
            case "cost":
                return "Rp " + (value / 1000).toLocaleString("id-ID");
            default:
                return value.toLocaleString("id-ID");
        }
    };

    // SHOW CALENDER FEATURE
    const toggleOpenCalendar = () => {
        if (showCalendar) {
            setAnimateCalendar(false);
            setTimeout(() => setShowCalendar(false), 100);
        } else {
            setShowCalendar(true);
            setTimeout(() => setAnimateCalendar(true), 100);
        }
    };

    return (
        <>
            <BaseLayout>
                <button
                    className="btn btn-secondary mb-3"
                    onClick={() => navigate("/dashboard/performance/ads")}
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
                            <div className="w-100 d-flex gap-1">
                                <img
                                    src={
                                        "https://down-id.img.susercontent.com/file/" +
                                        productData?.data[0].image
                                    }
                                    alt={productData?.data[0].title}
                                    className="rounded"
                                    style={{
                                        width: "100px",
                                        height: "100px",
                                        objectFit: "cover",
                                        aspectRatio: "1/1",
                                    }}
                                />
                                <div className="d-flex flex-column pt-1">
                                    <h5>{productData?.data[0].title}</h5>
                                    <div>
                                        <span className="text-secondary">Mode Bidding : </span>{" "}
                                        <span
                                            style={{ borderRadius: "3px", color: "#1ab0f8" }}
                                            className="fw-bold bg-info-subtle px-2 py-1"
                                        >
                                            {productData?.data[0].biddingStrategy == "manual"
                                                ? "Manual"
                                                : "Otomatis"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div
                                className="w-100 border rounded p-3"
                                style={{ marginBottom: "0" }}
                            >
                                <div className="d-flex justify-content-between align-items-center gap-3">
                                    <div className="d-flex flex-column align-items-center">
                                        <div className="d-flex flex-column">
                                            <span>Modal</span>
                                            <span className="fw-bold">
                                                Rp.
                                                {productData?.data[0].dailyBudget.toLocaleString(
                                                    "id-ID"
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            width: "1.6px",
                                            height: "40px",
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
                                        style={{
                                            width: "1.6px",
                                            height: "40px",
                                            backgroundColor: "#CECECE",
                                        }}
                                    ></div>
                                    <div className="d-flex flex-column">
                                        <div className="d-flex flex-column align-items-end">
                                            <span>Penempatan Iklan</span>
                                            <span className="fw-bold">Pencarian</span>
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
                                <div className="d-flex gap-3 flex-column rounded p-2">
                                    {/* Header & Date filter */}
                                    <div className="d-flex justify-content-between">
                                        <h5 className="fw-bold">Keyword</h5>
                                        <strong>{totalElements} total produk</strong>
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
                                    {/* Matric filter */}
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
                                                            {(() => {
                                                                const value = metricsTotals[metricKey];
                                                                const safeValue = isNaN(value) ? 0 : value;

                                                                if (
                                                                    metrics[metricKey].type === "currency"
                                                                ) {
                                                                    return (
                                                                        <span>
                                                                            {formatMetricValue(safeValue)}
                                                                        </span>
                                                                    );
                                                                } else if (
                                                                    metrics[metricKey].type === "percentage"
                                                                ) {
                                                                    return (
                                                                        <span>
                                                                            {Number(safeValue).toFixed(2)}%
                                                                        </span>
                                                                    );
                                                                } else {
                                                                    return (
                                                                        <span>
                                                                            {Number(safeValue).toFixed(2)}
                                                                        </span>
                                                                    );
                                                                }
                                                            })()}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Alert validation */}
                                        {showAlert && (
                                            <div
                                                className="alert alert-warning alert-dismissible fade show"
                                                role="alert"
                                            >
                                                Maksimal 3 metrik yang dapat dipilih
                                                <button
                                                    type="button"
                                                    className="btn-close"
                                                    onClick={() => setShowAlert(false)}
                                                ></button>
                                            </div>
                                        )}
                                        {selectedMetrics.length === 0 && (
                                            <div className="alert alert-warning alert-dismissible fade show">
                                                <span>
                                                    Pilih minimal 1 metrik untuk menampilkan data
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {/* Chart */}
                                    <div
                                        ref={chartRef}
                                        style={{ width: "100%", height: "300px" }}
                                    ></div>
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
                                            <div
                                                key={col.key}
                                                className="form-check form-check-inline"
                                            >
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
                                <div
                                    className="table-responsive"
                                    style={{
                                        width: "100%",
                                        minWidth: "max-content",
                                        maxWidth: "none",
                                    }}
                                >
                                    <table className="table table-centered">
                                        <thead className="table-light">
                                            <tr>
                                                {keywordsData.length !== 0 &&
                                                    keywordsData !== null && <th scope="col">No</th>}
                                                {allColumns
                                                    .filter((col) =>
                                                        selectedColumns.includes(col.key)
                                                    )
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
                                            {hasKeywords || keywordsData.length !== 0 ? (
                                                keywordsData?.map((entry, index) => (
                                                    <>
                                                        <tr key={index}>
                                                            {keywordsData.length > 0 &&
                                                                keywordsData !== null && (
                                                                    <td>{index + 1}</td>
                                                                )}
                                                            {selectedColumns.includes("keywords") && (
                                                                <td style={{ width: "200px" }}>
                                                                    <span>{entry.key}</span>
                                                                </td>
                                                            )}
                                                            {selectedColumns.includes("cpc") && (
                                                                <td style={{ width: "200px" }}>
                                                                    <span>{entry.cpc}</span>
                                                                </td>
                                                            )}
                                                            {selectedColumns.includes("impression") && (
                                                                <td style={{ width: "200px" }}>
                                                                    <span>{entry.impression}</span>
                                                                </td>
                                                            )}
                                                            {selectedColumns.includes("click") && (
                                                                <td style={{ width: "200px" }}>
                                                                    <span>{entry.click}</span>
                                                                </td>
                                                            )}
                                                            {selectedColumns.includes("acos") && (
                                                                <td style={{ width: "200px" }}>
                                                                    <span>{entry.acos}</span>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    </>
                                                ))
                                            ) : (
                                                <div className="w-100 d-flex justify-content-center">
                                                    <span>Produk tidak mempunyai keyword</span>
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
    );
}
