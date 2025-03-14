import React, { useState, useEffect, useCallback } from "react";
import {  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer  } from "recharts";
import Select from "react-select";
import useDebounce from "../../hooks/useDebounce";

import iconArrowUp from "../../assets/icon/arrow-up.png";
import iconArrowDown from "../../assets/icon/arrow-down.png";

const ProductTable = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState(data.products);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [showColumn, setShowColumn] = useState(false);
  const [allRevenue, setAllRevenue] = useState(0);
  const [expandedRows, setExpandedRows] = useState({});
  const [chartData, setChartData] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const convertEpochToDate = (epoch) => {
  };

  useEffect(() => {
    if (data.products.length > 0) {
      const stockMap = {};

      data.products.forEach((product) => {
        const date = convertEpochToDate(product.campaign.start_time);
        const stock = product.stock_detail?.total_available_stock || 0;

        if (!stockMap[date]) {
          stockMap[date] = 0;
        }
        stockMap[date] += stock;
      });

      const formattedData = Object.keys(stockMap).map((date) => ({
        date,
        totalStock: stockMap[date],
      }));

      setChartData(formattedData);
    }
  }, [data]);

  const handleProductClick = (product) => {
  };  

  const getDaysInMonth = () => {
  };  

  const generateChartData = (product = null) => {
  };  

  useEffect(() => {
  }, [data.products]);  


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
  }, []);

  // Handle column change 
  const handleColumnChange = (colKey) => {
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
  }, [debouncedSearchTerm, activeFilter, selectedTypes, allRevenue, data.products]);


  // SALES CLASSIFICATION FEATURE
  // Define sales classification options
  const typeOptions = [
    { value: "best_seller", label: "Best Seller" },
    { value: "middle_moving", label: "Middle Moving" },
    { value: "slow_moving", label: "Slow Moving" },
  ];

  // Calculate all revenue
  const calculateAllRevenue = () => {
  };
  
  // Get sales classification
  const getClassification = (entry, allRevenue) => {
  };

  // Handle type change by list of options sales classification
  const handleTypeChange = (selectedOptions) => {
    setSelectedTypes(selectedOptions);
  };
  
  useEffect(() => {
    const totalRevenue = calculateAllRevenue();
    setAllRevenue(totalRevenue);
  
    let filtered = data.products || [];
  
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((entry) => {
        const classification = getClassification(entry, totalRevenue);
        return selectedTypes.some((type) => type.value === classification);
      });
    }
  
    setFilteredData(filtered);
  }, [selectedTypes, data.products]);

  
  // STOCK DETAILING FEATURE
  // Classify stock is more than 70% of default stock
  const checkStock = (variants, defaultStock) => {
  };

  // Check if stock is recommended
  const checkStockIsRecommended = (variants, defaultStock) => {
  };

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="mb-3">{data.page_info.total} total produk</h5>
        <div className="card p-3 shadow">
          {/* Bar Chart */}
          <h6 className="text-center">Data Stock</h6>
      </div>
        <div className="d-flex flex-column">
          {/*status filter*/}

          {/* container filter*/}

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
                        </div>
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.length !== 0 &&
                filteredData !== null ? (
                  filteredData?.map((entry, index) => (
                    <>
                      <tr key={entry.id}>
                        <td>{index + 1}</td>
                        {selectedColumns.includes("name") && (
                          <td style={{ cursor: "pointer", color: selectedProduct?.id === entry.id ? "#F6881F" : "" }}
                          onClick={() => handleProductClick(entry)}>{entry.name}</td>
                        )}
                        {selectedColumns.includes("stock") && (
                          <td>
                            <div className="d-flex flex-column align-items-center">
                              <div>
                                {entry.stock_detail.total_available_stock}
                              </div>
                              {checkStockIsRecommended(entry.model_list, entry.stock_detail.total_available_stock)}
                            </div>
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

export default ProductTable;

{/* <ResponsiveContainer width="100%" height={400}>
  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="totalStock" stroke="#ff0000" dot={{ r: 3 }} />
  </LineChart>
</ResponsiveContainer> */}