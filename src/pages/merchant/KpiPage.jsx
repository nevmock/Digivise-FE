import { useState, useEffect } from "react";

import Menu from "../../components/organisms/Menu";
import Footer from "../../components/organisms/Footer";


export default function MerchantKpiPage() {
  const defaultKpiData = [
    { name: "CPC", value: 0, newValue: 0, category: "ads" },
    { name: "ACOS", value: 0, newValue: 0, category: "ads" },
    { name: "CTR", value: 0, newValue: 0, category: "ads" },
    { name: "Click To AddToCard", value: 0, newValue: 0, category: "store" },
    { name: "Convertion Rate", value: 0, newValue: 0, category: "store" },
    { name: "Growth Omset", value: 0, newValue: 0, category: "store" },
  ];

  const [kpiData, setKpiData] = useState(() => {
    const storedData = localStorage.getItem("kpiData");
    return storedData ? JSON.parse(storedData) : defaultKpiData;
  });

  useEffect(() => {
    const updatedData = kpiData.map((item) => ({
      ...item,
      newValue: item.newValue || item.value,
    }));
    setKpiData(updatedData);
  }, []);

  const handleInputChange = (index, newValue) => {
    const updatedData = [...kpiData];
    updatedData[index].newValue = newValue || "";
    setKpiData(updatedData);
  };

  const handleUpdate = () => {
    const updatedData = kpiData.map((item) => ({
      ...item,
      value: item.newValue === "" ? 0 : Number(item.newValue),
      newValue: item.newValue === "" ? 0 : Number(item.newValue),
    }));
    setKpiData(updatedData);
    localStorage.setItem("kpiData", JSON.stringify(updatedData));
  };

  const renderKpiSection = (title, category) => (
    <div className="card">
      <div className="card-body">
        <h5 className="text-left pb-2">{title}</h5>
        <div className="d-flex justify-content-between align-items-center bg-dark text-white py-2 rounded-top">
          <div className="ps-3" style={{ flex: 1 }}>
            Name
          </div>
          <div className="ps-3" style={{ flex: 1 }}>
            Value
          </div>
          <div className="ps-3" style={{ flex: 1 }}>
            New Value
          </div>
        </div>
        {kpiData
          .filter((item) => item.category === category)
          .map((item, index) => (
            <div
              key={index}
              className="d-flex justify-content-between align-items-center border"
            >
              <div className="ps-3" style={{ flex: 1 }}>
                {item.name}
              </div>
              <div className="ps-3" style={{ flex: 1 }}>
                {item.value}
              </div>
              <div className="ps-3" style={{ flex: 1 }}>
                <input
                  style={{
                    width: "100%",
                    padding: "0.375rem 0.75rem",
                    fontSize: "1rem",
                    fontWeight: "400",
                    lineHeight: "1.5",
                    color: "#495057",
                    border: "none",
                  }}
                  type="number"
                  value={item.newValue}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                />
              </div>
            </div>
          ))}
        <div className="w-full d-flex justify-content-end">
          <button
            className="fw-semibold btn btn-primary mt-3 w-25"
            type="submit"
            onClick={handleUpdate}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
  return (
    <>
      <div className="app-wrapper">
        <Menu />
        <div className="page-content">
          <div className="container-fluid">
            <h4 className="text-left pb-3">
              Custom Key Performance Indicator (KPI)
            </h4>
            {renderKpiSection("Iklan", "ads")}
            {renderKpiSection("Toko", "store")}
          </div>
          <Footer />
        </div>
      </div>
    </>
  );
};