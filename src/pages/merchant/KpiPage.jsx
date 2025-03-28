import { useState, useEffect } from "react";
import BaseLayout from "../../components/organisms/BaseLayout";

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
    <div className="card" style={{ width: "100%" }}>
      <div className="card-body">
          <h5 className="text-left pb-2">{title}</h5>
          <div className="table-responsive" style={{ borderRadius: "0.2rem" }}>
            <table className="table table-centered">
              <thead className="table-dark">
                <tr style={{ borderRadius: "2rem" }}>
                  <th scope="col">Name</th>
                  <th scope="col">Value</th>
                  <th scope="col">New Value</th>
                </tr>
              </thead>
              <tbody>
                {kpiData
                  .filter((item) => item.category === category)
                  .map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.value}</td>
                      <td>
                        <input
                          style={{
                            width: "100%",
                            padding: "0.375rem 0.75rem",
                            fontSize: "1rem",
                            fontWeight: "400",
                            lineHeight: "1.5",
                            color: "#495057",
                            border: "1px solid #ced4da",
                            borderRadius: "0.25rem",
                          }}
                          type="number"
                          value={item.newValue}
                          onChange={(e) => handleInputChange(index, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
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
      <BaseLayout>
        <div className="d-flex align-items-center pb-1">
          <h3>Merchant</h3>
        </div>
        <div>
          <div className="card px-3 py-3">
            <h5 className="text-left">Merchant Key Performance Indicator (KPI)</h5>
            <div className="d-flex justify-content-between gap-2">
              {renderKpiSection("Iklan", "ads")}
              {renderKpiSection("Toko", "store")}
            </div>
          </div>
        </div>
      </BaseLayout>
    </>
  );
};