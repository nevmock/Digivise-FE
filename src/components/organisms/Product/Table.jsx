import React, { useState, useEffect } from "react";
import Select from "react-select";
import useDebounce from "../../../hooks/useDebounce";

const ProductTable = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState(data.products);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const typeOptions = [
    { value: "best_seller", label: "Best Seller" },
    { value: "middle_moving", label: "Middle Moving" },
    { value: "slow_moving", label: "Slow Moving" },
    { value: "no_movement", label: "No Movement" },
  ];

  useEffect(() => {
    let filtered = data.products;
    if (debouncedSearchTerm !== "") {
        filtered = data.products.filter((entry) =>
            entry.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );
    }

    if (activeFilter !== "all") {
      filtered = filtered.filter((entry) => entry.state === activeFilter);
    }

    if (selectedTypes.length > 0) {
        filtered = filtered.filter((entry) => {
          const classification = getClassification(entry);
          return selectedTypes.some((type) => type.value === classification);
        });
      }

    setFilteredData(filtered);
  }, [debouncedSearchTerm, activeFilter, selectedTypes]);

  const getClassification = (entry) => {
    const sumRevenue = data.products.map(
      (data) =>
        parseFloat(data.price_detail.selling_price_max) *
        data.statistics.sold_count
    );

    const allRevenue = sumRevenue.reduce((a, b) => a + b, 0);

    if (allRevenue === 0) return "no_movement";

    const revenue =
      parseFloat(entry.price_detail.selling_price_max) *
      entry.statistics.sold_count;
    const contribution = (revenue / allRevenue) * 100;

    if (contribution > 70) return "best_seller";
    if (contribution > 20 && contribution <= 70) return "middle_moving";
    if (contribution > 10 && contribution <= 20) return "slow_moving";
    return "no_movement";
  };

    const handleTypeChange = (selectedOptions) => {
        setSelectedTypes(selectedOptions);
      };

//   const labelClasification = (entry) => {
//     const sumRevenue = filteredData.map(
//       (data) =>
//         parseFloat(data.price_detail.selling_price_max) *
//         data.statistics.sold_count
//     );

//     const allRevenue = sumRevenue.reduce((a, b) => a + b, 0);

//     if (allRevenue === 0)
//       return <span className="badge bg-secondary">No Sales</span>;

//     const revenue =
//       parseFloat(entry.price_detail.selling_price_max) *
//       entry.statistics.sold_count;
//     const contribution = (revenue / allRevenue) * 100; // Konversi ke persentase

//     if (contribution > 70) {
//       return <span className="badge bg-success">Best Seller</span>;
//     } else if (contribution > 20 && contribution <= 70) {
//       return <span className="badge bg-warning">Middle Moving</span>;
//     } else if (contribution > 10 && contribution <= 20) {
//       return <span className="badge bg-danger">Slow Moving</span>;
//     } else {
//       return <span className="badge bg-secondary">No Movement</span>;
//     }
//   };

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="mb-3">{data.page_info.total} total produk</h5>
        <div className="d-flex flex-column">
          {/* filter status iklan */}
          <div
            className="d-flex gap-3 justify-content-between align-items-center mb-3"
            style={{ width: "fit-content", listStyleType: "none" }}
          >
            <span>Status Iklan</span>
            {/* Filter buttons */}
            <div
              className={`ads-button-filter px-3 py-1 border border-info rounded-pill ${
                activeFilter === "all" ? "bg-info bg-opacity-25" : ""
              }`}
              onClick={() => setActiveFilter("all")}
              style={{ cursor: "pointer" }}
            >
              Semua
            </div>
            <div
              className={`ads-button-filter px-3 py-1 border border-info rounded-pill ${
                activeFilter === "ongoing" ? "bg-info bg-opacity-25" : ""
              }`}
              onClick={() => setActiveFilter("ongoing")}
              style={{ cursor: "pointer" }}
            >
              Ongoing
            </div>
            <div
              className={`ads-button-filter px-3 py-1 border border-info rounded-pill ${
                activeFilter === undefined ? "bg-info bg-opacity-25" : ""
              }`}
              onClick={() => setActiveFilter(undefined)}
              style={{ cursor: "pointer" }}
            >
              Non Active
            </div>
          </div>
          <input
            type="text"
            className="form-control mb-3 py-2"
            placeholder="Cari berdasarkan nama"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
            <Select
            isMulti
            options={typeOptions}
            value={selectedTypes}
            onChange={handleTypeChange}
            placeholder="Filter berdasarkan klasifikasi"
            className="mb-3"
          />
          <div className="table-responsive">
            <table className="table table-centered">
              <thead className="table-light">
                <tr>
                  <th scope="col">No</th>
                  <th scope="col">Nama</th>
                  <th scope="col">Kode</th>
                  <th scope="col">Stok</th>
                  <th scope="col">Status</th>
                  <th scope="col">Sales Clasification</th>
                </tr>
              </thead>
              <tbody>
                {filteredData?.map((entry, index) => (
                  <React.Fragment key={entry.id}>
                    {/* Row main products */}
                    <tr className="border">
                      <td style={{ width: "10px" }}>{index + 1}</td>
                      <td>{entry.name}</td>
                      <td style={{ width: "70px", maxWidth: "70px" }}>
                        {" "}
                        <span
                          className="text-muted"
                          style={{ fontSize: "12px" }}
                        >
                          {entry.code === null || entry.code === undefined
                            ? "-"
                            : entry.code}
                        </span>
                      </td>
                      <td>{entry.stock_detail.total_available_stock}</td>
                      <td>
                        {" "}
                        <div className="w-full d-flex gap-1 align-items-center">
                          <div
                            className={`marker ${
                              entry.state === "ongoing" ? "animated-circle" : ""
                            }`}
                            style={{
                              backgroundColor:
                                entry.state === "ongoing"
                                  ? "#00EB3FFF"
                                  : "gray",
                            }}
                          ></div>
                          <span
                            className="fw-light"
                            style={{
                              fontSize: "14px",
                              color:
                                entry.state === "ongoing" ? "inherit" : "gray",
                            }}
                          >
                            {entry.state === "ongoing"
                              ? "Ongoing"
                              : "Non Active"}
                          </span>
                        </div>
                      </td>
                      <td className={`badge ${getClassification(entry) === "best_seller" ? "bg-success" : getClassification(entry) === "middle_moving" ? "bg-warning" : getClassification(entry) === "slow_moving" ? "bg-danger" : "bg-secondary"}`}>
                          {typeOptions.find((type) => type.value === getClassification(entry))?.label}
                        </td>
                      {/* <td>{labelClasification(entry)}</td> */}
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductTable;