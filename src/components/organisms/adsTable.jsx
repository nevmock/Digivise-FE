import React, { useState, useEffect, useCallback } from "react";
import Select from "react-select";
import useDebounce from "../../hooks/useDebounce";

import iconArrowUp from "../../assets/icon/arrow-up.png";
import iconArrowDown from "../../assets/icon/arrow-down.png";

const AdsTable = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState(data.products);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [showColumn, setShowColumn] = useState(false);
  const [allRevenue, setAllRevenue] = useState(0);
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);

  const handleSortStock = (order) => {
    if (sortOrder === order) {
      setSortOrder(null);
      setFilteredData(data.products);
    } else {
      setSortOrder(order);
      const sortedData = [...filteredData].sort((a, b) => {
        return order === "asc"
          ? a.stock_detail.total_available_stock -
              b.stock_detail.total_available_stock
          : b.stock_detail.total_available_stock -
              a.stock_detail.total_available_stock;
      });
      setFilteredData(sortedData);
    }
  };

  // FILTER COLUMNS FEATURE
  // Define all columns
  const allColumns = [
    { key: "name", label: "Nama" },
    { key: "code", label: "Kode" },
    { key: "stock", label: "Stok" },
    { key: "status", label: "Status" },
    { key: "classification", label: "Sales Clasification" },
  ];

  // Initialize selected columns state
  const [selectedColumns, setSelectedColumns] = useState(
    allColumns.map((col) => col.key)
  );

  // Toggle row to show variant
  const toggleRow = useCallback((productId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  }, []);

  // Handle column change
  const handleColumnChange = (colKey) => {
    setSelectedColumns((prev) =>
      prev.includes(colKey)
        ? prev.filter((key) => key !== colKey)
        : [...prev, colKey]
    );
  };

  useEffect(() => {
    let filtered = data.products;
    // Filter by search term
    if (debouncedSearchTerm !== "") {
      filtered = data.products.filter((entry) =>
        entry.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (activeFilter !== "all") {
      filtered = filtered.filter((entry) => entry.state === activeFilter);
    }

    // Filter by sales classification
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((entry) => {
        const classification = getClassification(entry);
        return selectedTypes.some((type) => type.value === classification);
      });
    }

    setFilteredData(filtered);
  }, [
    debouncedSearchTerm,
    activeFilter,
    selectedTypes,
    allRevenue,
    data.products,
  ]);

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="mb-3">{data.page_info.total} total produk</h5>
        <div className="d-flex flex-column">
          {/*status filter*/}
          <div
            className="d-flex flex-column gap-1 mb-3"
            style={{ width: "fit-content", listStyleType: "none" }}
          >
            <span>Status Iklan</span>
            {/* Filter buttons */}
            <div className="d-flex gap-2">
              <div
                className={`ads-button-filter px-3 py-1 rounded-pill bg-white ${
                  activeFilter === "all"
                    ? "custom-font-color custom-border-select"
                    : "border border-secondary-subtle"
                }`}
                onClick={() => setActiveFilter("all")}
                style={{ cursor: "pointer" }}
              >
                Semua
              </div>
              <div
                className={`ads-button-filter px-3 py-1 rounded-pill bg-white ${
                  activeFilter === "ongoing"
                    ? "custom-font-color custom-border-select"
                    : "border border-secondary-subtle"
                }`}
                onClick={() => setActiveFilter("ongoing")}
                style={{ cursor: "pointer" }}
              >
                Ongoing
              </div>
              <div
                className={`ads-button-filter px-3 py-1 rounded-pill bg-white ${
                  activeFilter === undefined
                    ? "custom-font-color custom-border-select"
                    : "border border-secondary-subtle"
                }`}
                onClick={() => setActiveFilter(undefined)}
                style={{ cursor: "pointer" }}
              >
                Nonaktif
              </div>
            </div>
          </div>
          {/* container filter*/}
          <div className="d-flex flex-column mb-3 gap-2">
            <div className="d-flex gap-2 w-full">
              {/* search bar */}
              <div className="w-100">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cari berdasarkan nama"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {/* clasification filter */}
              <div className="w-100">
                <Select
                  isMulti
                  options={typeOptions}
                  value={selectedTypes}
                  onChange={handleTypeChange}
                  placeholder="Filter Klasifikasi"
                />
              </div>
              {/* column filter */}
              <div className="w-100 h-full">
                <button
                  class="btn btn-secondary dropdown-toggle"
                  type="button"
                  onClick={() => setShowColumn(!showColumn)}
                  style={{ backgroundColor: "#8042D4", border: "none" }}
                >
                  Pilih kriteria
                </button>
              </div>
            </div>
            {showColumn && (
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
          </div>
          {/* container table */}
          <div className="table-responsive">
            <table className="table table-centered">
              <thead className="table-light">
                <tr>
                  <th scope="col">No</th>
                  {allColumns
                    .filter((col) => selectedColumns.includes(col.key))
                    .map((col) => (
                      <th key={col.key}>
                        <div className="d-flex justify-content-start gap-1 align-items-center">
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
                {filteredData.length !== 0 && filteredData !== null ? (
                  filteredData?.map((entry, index) => (
                    <>
                      <tr key={entry.id}>
                        <td>{index + 1}</td>
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
                          <td>{entry.code || "-"}</td>
                        )}
                        {selectedColumns.includes("stock") && (
                          <td>
                            <div className="d-flex flex-column align-items-center">
                              <div>
                                {entry.stock_detail.total_available_stock}
                                <button
                                  onClick={() => toggleRow(entry.id)}
                                  className="btn btn-sm"
                                >
                                  {expandedRows[entry.id] ? (
                                    <img
                                      src={iconArrowUp}
                                      alt="icon arrow up"
                                      style={{ width: "10px", height: "10px" }}
                                    />
                                  ) : (
                                    <img
                                      src={iconArrowDown}
                                      alt="icon arrow down"
                                      style={{ width: "10px", height: "10px" }}
                                    />
                                  )}
                                </button>
                              </div>
                              {checkStockIsRecommended(
                                entry.model_list,
                                entry.stock_detail.total_available_stock
                              )}
                            </div>
                          </td>
                        )}
                        {selectedColumns.includes("status") && (
                          <td>
                            <div className="d-flex gap-1 align-items-center">
                              <div
                                className={`marker ${
                                  entry.state === "ongoing"
                                    ? "animated-circle"
                                    : ""
                                }`}
                                style={{
                                  backgroundColor:
                                    entry.state === "ongoing"
                                      ? "#00EB3FFF"
                                      : "gray",
                                }}
                              ></div>
                              <span
                                style={{
                                  fontSize: "14px",
                                  color:
                                    entry.state === "ongoing"
                                      ? "inherit"
                                      : "gray",
                                }}
                              >
                                {entry.state === "ongoing"
                                  ? "Berjalan"
                                  : "Nonaktif"}
                              </span>
                            </div>
                          </td>
                        )}
                        {selectedColumns.includes("classification") && (
                          <td>
                            <span
                              className={`badge ${
                                getClassification(entry, allRevenue) ===
                                "best_seller"
                                  ? "badge bg-primary me-1"
                                  : getClassification(entry, allRevenue) ===
                                    "middle_moving"
                                  ? "badge bg-info me-1"
                                  : getClassification(entry, allRevenue) ===
                                    "slow_moving"
                                  ? "badge bg-warning me-1"
                                  : ""
                              }`}
                            >
                              {
                                typeOptions.find(
                                  (type) =>
                                    type.value ===
                                    getClassification(entry, allRevenue)
                                )?.label
                              }
                            </span>
                          </td>
                        )}
                      </tr>
                      {expandedRows[entry.id] && (
                        <tr className="bg-light">
                          <td
                            colSpan={selectedColumns.length + 1}
                            className="p-1"
                          >
                            <ul className="list-group">
                              {entry.model_list.map((variant, index) => (
                                <li
                                  key={variant.id}
                                  className="list-group-item d-flex justify-content-start gap-2"
                                >
                                  <span style={{ width: "20px" }}></span>
                                  <span style={{ width: "100px" }}>
                                    {variant.name}
                                  </span>
                                  <span>
                                    {" "}
                                    {
                                      variant.stock_detail.total_available_stock
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
                ) : (
                  <div className="w-100 d-flex justify-content-center">
                    <span>Data </span>
                  </div>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdsTable;

{
  /* <ResponsiveContainer width="100%" height={400}>
  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="totalStock" stroke="#ff0000" dot={{ r: 3 }} />
  </LineChart>
</ResponsiveContainer> */
}