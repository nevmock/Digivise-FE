// import React, { useState, useEffect, useRef } from "react";
// import { Link } from "react-router-dom";
// import Select from "react-select";
// import Calendar from "react-calendar";
// import * as echarts from "echarts";
// import useDebounce from "../../hooks/useDebounce";
// const AdsTable = ({ data }) => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const debouncedSearchTerm = useDebounce(searchTerm, 300);
//   const [filteredData, setFilteredData] = useState(data.data.entry_list);
//   const [statusProduct, setStatusProduct] = useState("all");
//   const [selectedOptionPlacement, setSelectedOptionPlacement] = useState(null);
//   const [selectedTypeAds, setSelectedTypeAds] = useState([{ value: "all", label: "Semua Tipe" }]);
//   const [showTableColumn, setShowTableColumn] = useState(false);
//   const [chartData, setChartData] = useState([]);
//   const [comparatorDate, setComparatorDate] = useState(null);
//   const [comaparedDate, setComaparedDate] = useState(null);
//   const [date, setDate] = useState(getAllDaysInLast7Days());
//   const [showCalendar, setShowCalendar] = useState(false);
//   const chartRef = useRef(null);
//   const [showAlert, setShowAlert] = useState(false);
//   const [selectedProduct, setSelectedProduct] = useState(null);
//   const [selectedMetrics, setSelectedMetrics] = useState(["daily_budget"]);

//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(20);
//   const [paginatedData, setPaginatedData] = useState([]);
//   const [totalPages, setTotalPages] = useState(1);

//   // CUSTOM CHART WITH FILTER DATE, CLICK PRODUCT FEATURE
//   // Define metrics with their display names and colors
//   const metrics = {
//     daily_budget: { 
//       label: "Biaya", 
//       color: "#00B69A", 
//       dataKey: "daily_budget" 
//     },
//     impression: { 
//       label: "Iklan Dilihat", 
//       color: "#D50000", 
//       dataKey: "impression" 
//     },
//   };

//   // Handle product click by clicking the product in name column
//   const handleProductClick = (product) => {
//   };


//   // Get all days in last 7 days in a month
//   function getAllDaysInLast7Days() {
//   };

//   // Get all days in a month
//   function getAllDaysInAMonth() {
//   };

//   // Get all hours in a day
//   function getHourlyIntervals(selectedDate) {
//   };

//   function getDateRangeIntervals(startDate, endDate) {
//   };

//   function generateMultipleMetricsChartData(selectedDate = null, product = null, selectedMetrics = ["visitor"]) {
//   };

//   function handleMetricFilter(metricKey) {
//     setSelectedMetrics(prev => {
//       if (prev.includes(metricKey)) {
//         return prev.filter(m => m !== metricKey);
//       } 
//       else if (prev.length < 3) {
//         return [...prev, metricKey];
//       } 
//       else {
//         setShowAlert(true);
//         setTimeout(() => setShowAlert(false), 2000); 
//         return prev;
//       }
//     });
//   };
  
//   function handleDateSelection(selectedDateOption) {
//     setComparatorDate(null);
//     setComaparedDate(null);
//     setDate(selectedDateOption);
//   };

//   useEffect(() => {
//     const chartData = generateMultipleMetricsChartData(date, selectedProduct, selectedMetrics);
//     setChartData(chartData);
//   }, [date, selectedProduct, selectedMetrics, comparatorDate, comaparedDate, data.data.entry_list]);


//   // FILTER COLUMNS FEATURE
//   // Define all columns
//   const allColumns = [
//     { key: "info_iklan", label: "Info iklan" },
//     { key: "biaya", label: " Biaya" },
//   ];

//   // Initialize selected columns state
//   const [selectedColumns, setSelectedColumns] = useState(
//     allColumns.map((col) => col.key)
//   );

//   // Handle column change
//   const handleColumnChange = (colKey) => {
//     setSelectedColumns((prev) =>
//       prev.includes(colKey)
//         ? prev.filter((key) => key !== colKey)
//         : [...prev, colKey]
//     );
//   };

//   useEffect(() => {
//     let filtered = data.data.entry_list;
//     // Filter by search term
//     if (debouncedSearchTerm !== "") {
//       filtered = data.data.entry_list.filter((entry) =>
//         entry.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
//       );
//     }

//     // Filter by status
//     if (statusProduct !== "all") {
//       filtered = filtered.filter((entry) => entry.state === statusProduct);
//     }

//     // Filter by ads type (exclude "all" from filtering logic)
//     const selectedAdValues = selectedTypeAds.map((ad) => ad.value);
//     // Only filter if "all" is not selected
//     if (!selectedAdValues.includes("all")) {
//       filtered = filtered.filter((entry) => selectedAdValues.includes(entry.type));
//     }

//     // Filter by placement (if a placement is selected and not "all")
//     if (selectedOptionPlacement && selectedOptionPlacement.value !== "all") {
//       filtered = filtered.filter((entry) => entry?.manual_product_ads?.product_placement === selectedOptionPlacement.value);
//     }

//     setFilteredData(filtered);
//     setCurrentPage(1);
//   }, [
//     debouncedSearchTerm,
//     statusProduct,
//     selectedOptionPlacement,
//     selectedTypeAds,
//     data.data.entry_list,
//   ]);

//   useEffect(() => {
//     // Calculate total pages
//     const calculateTotalPages = Math.ceil(filteredData.length / itemsPerPage);
//     setTotalPages(calculateTotalPages);

//     // Ensure current page is valid
//     if (currentPage > calculateTotalPages && calculateTotalPages > 0) {
//       setCurrentPage(calculateTotalPages);
//     }

//     // Get paginated data for current page
//     const startIndex = (currentPage - 1) * itemsPerPage;
//     const endIndex = startIndex + itemsPerPage;
//     setPaginatedData(filteredData.slice(startIndex, endIndex));
//   }, [filteredData, currentPage, itemsPerPage]);

//   // Handle style for matric filter button
//   const handleStyleMatricButton = (metricKey) => {
//   };

//   return (
//     <div className="card">
//           <div style={{ position: "relative" }}>
//             <button
//               onClick={() => setShowCalendar(!showCalendar)}
//               className="btn btn-secondary"
//               style={{ backgroundColor: "#8042D4", border: "none" }}
//             >
//               {comparatorDate && comaparedDate
//               ? `${comparatorDate.toLocaleDateString("id-ID")} - ${comaparedDate.toLocaleDateString("id-ID")}`
//               : (typeof date === 'string' ? date : (Array.isArray(date) ? "1 Minggu terakhir" : "Pilih Tanggal"))}
//             </button>
//             {showCalendar && (
//               <div
//               >
//                 <div
//                   className="d-flex flex-column py-2 px-1"
//                   style={{ width: "130px", listStyleType: "none" }}
//                 >
//                     <p style={{ cursor: "pointer" }} onClick={() => handleDateSelection(new Date().toISOString().split("T")[0])}>Hari ini</p>
//                     <p style={{ cursor: "pointer" }}
//                       onClick={() => {
//                         const yesterday = new Date();
//                         yesterday.setDate(yesterday.getDate() - 1);
//                         handleDateSelection(yesterday.toISOString().split("T")[0]);
//                       }}
//                     >
//                       Kemarin
//                     </p>
//                     <p style={{ cursor: "pointer" }} onClick={() => handleDateSelection(getAllDaysInLast7Days())}>1 Minggu terakhir</p>
//                     <p style={{ cursor: "pointer" }} onClick={() => handleDateSelection("Bulan Ini")}>Bulan ini</p>
//                 </div>
//                 <div style={{ width: "1px", height: "auto", backgroundColor: "#E3E3E3FF", margin: "10px 0"}}></div>
//                 {/* Kalender pembanding */}
//                 <div>
//                   <p className="pt-2" style={{ textAlign: "center" }}>Tanggal Pembanding</p>
//                   <Calendar onChange={(date) => setComparatorDate(date)} value={comparatorDate} maxDate={comaparedDate || new Date(2100, 0, 1)} />
//                 </div>
//                 {/* Kalender dibanding */}
//                 <div>
//                   <p className="pt-2" style={{ textAlign: "center" }}>Tanggal Dibanding</p>
//                   <Calendar onChange={(date) => setComaparedDate(date)} value={comaparedDate} minDate={comparatorDate || new Date()} />
//                 </div>
//               </div>
//             )}
//           </div>
//           <div ref={chartRef} style={{ width: "100%", height: "300px" }}></div>
//           {/* Filter & Table */}
//           <div>
//             {/* Matric filter */}
//             <span>Matric Produk</span>
//             <div className="d-flex gap-2">
//               {Object.keys(metrics).map((metricKey) => (
//                 <button 
//                   key={metricKey}
//                   style={handleStyleMatricButton(metricKey)}
//                   onClick={() => handleMetricFilter(metricKey)}
//                 >
//                   {metrics[metricKey].label}
//                 </button>
//               ))}
//             </div>
//             {/* Other filter*/}
//             <div className="d-flex flex-column mb-3 gap-2">
//               {/* search bar */}
//               <input
//                 type="text"
//                 placeholder="Cari berdasarkan nama"
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//               {/* column filter */}
//               <button
//                 className="btn btn-secondary dropdown-toggle"
//                 type="button"
//                 onClick={() => setShowTableColumn(!showTableColumn)}
//                 style={{ backgroundColor: "#8042D4", border: "none" }}
//               >
//                 Pilih kriteria
//               </button>
//               {showTableColumn && (
//                 <div className="border px-2 py-2 rounded">
//                   {allColumns.map((col) => (
//                     <div key={col.key} className="form-check form-check-inline">
//                       <input
//                         type="checkbox"
//                         checked={selectedColumns.includes(col.key)}
//                         onChange={() => handleColumnChange(col.key)}
//                       />
//                       <label className="form-check-label fs-5 ms-1">
//                         {col.label}
//                       </label>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//             <div className="table-responsive"
//             >
//               <table className="table table-centered">
//                 <thead className="table-light">
//                   <tr>
//                     {filteredData.length !== 0 && filteredData !== null && <th scope="col">No</th>}
//                     {allColumns
//                       .filter((col) => selectedColumns.includes(col.key))
//                       .map((col) => (
//                         <th key={col.key}>
//                           <div className="d-flex justify-content-start align-items-center">
//                             {col.label}
//                           </div>
//                         </th>
//                       ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {filteredData.length !== 0 && filteredData !== null ? (
//                     filteredData?.map((entry, index) => (
//                       <>
//                         <tr key={entry.campaign.campaign_id}>
//                           {filteredData.length > 0 && filteredData !== null && (
//                             <td>{index + 1}</td>
//                           )}
//                           {selectedColumns.includes("info_iklan") && (
//                             <td
//                               style={{
//                                 color:
//                                 selectedProduct?.campaign.campaign_id === entry.campaign.campaign_id
//                                   ? "#F6881F"
//                                   : "",
//                               }}
//                               onClick={() => handleProductClick(entry)}
//                             >
//                               {entry.title}
//                             </td>
//                           )}
//                           {selectedColumns.includes("biaya") && (
//                             <td style={{ width: "200px" }}>
//                               <div className="d-flex flex-column">
//                                 <span>{entry.campaign.daily_budget}</span>
//                               </div>
//                             </td>
//                           )}
//                           {selectedColumns.includes("iklan_dilihat") && (
//                             <td style={{ width: "200px" }}>
//                               <span>{entry.report.impression}</span>
//                             </td>
//                           )}
//                         </tr>
//                       </>
//                     ))
//                   ) : (
//                     <div className="w-100 d-flex justify-content-center">
//                       <span>Data tidak tersedia</span>
//                     </div>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//     </div>
//   );
// };

// export default AdsTable;