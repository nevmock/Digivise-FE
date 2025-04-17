import { useState, useEffect } from "react";
import BaseLayout from "../../components/organisms/BaseLayout";

const KPI_METRICS = [
  { name: "CPC", category: "efeciency" },
  { name: "ACOS", category: "efeciency" },
  { name: "Faktor Skala", category: "efeciency" },
  { name: "Max Adjustment", category: "efeciency", isPercentage: true },
  { name: "Min Adjustment", category: "efeciency", isPercentage: true },
  { name: "Minimum Klik", category: "efeciency" },
  { name: "Max Klik", category: "efeciency" },
  { name: "Min Bid Search", category: "efeciency" },
  { name: "Min Bid Reco", category: "efeciency" },

  { name: "CPC", category: "scaleup" },
  { name: "ACOS", category: "scaleup" },
  { name: "Faktor Skala", category: "scaleup" },
  { name: "Max Adjustment", category: "scaleup", isPercentage: true },
  { name: "Min Adjustment", category: "scaleup", isPercentage: true },
  { name: "Minimum Klik", category: "scaleup" },
  { name: "Max Klik", category: "scaleup" },
  { name: "Min Bid Search", category: "scaleup" },
  { name: "Min Bid Reco", category: "scaleup" },
];

export default function MerchantKpiPage() {
  const initializeKpiData = () => {
    const stored = localStorage.getItem("kpiData");
    if (stored) return JSON.parse(stored);

    return KPI_METRICS.map((metric) => ({
      ...metric,
      value: 0,
      newValue: 0,
    }));
  };

  const [kpiData, setKpiData] = useState(initializeKpiData);

  useEffect(() => {
    setKpiData((prevData) =>
      prevData.map((item) => ({
        ...item,
        newValue: item.newValue ?? item.value,
      }))
    );
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

  const formatValue = (value, isPercentage) =>
    isPercentage ? `${value}%` : value;

  const renderKpiSection = (title, category) => (
    <div className="card" style={{ width: "100%" }}>
      <div className="card-body">
        <h5 className="text-left pb-2">{title}</h5>
        <div className="table-responsive" style={{ borderRadius: "0.2rem" }}>
          <table className="table table-centered">
            <thead className="table-dark">
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Value</th>
                <th scope="col">New Value</th>
              </tr>
            </thead>
            <tbody>
              {kpiData
                .map((item, index) => ({ ...item, index }))
                .filter((item) => item.category === category)
                .map((item) => (
                  <tr key={item.index}>
                    <td>{item.name}</td>
                    <td>{formatValue(item.value, item.isPercentage)}</td>
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
                        onChange={(e) =>
                          handleInputChange(item.index, e.target.value)
                        }
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="w-full d-flex justify-content-end">
          <button
            className="fw-semibold btn btn-primary w-25"
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
    <BaseLayout>
      <div className="d-flex align-items-center pb-1">
        <h3>Merchant</h3>
      </div>
      <div>
        <div className="card px-3 py-3">
          <h5 className="text-left">Merchant Key Performance Indicator (KPI)</h5>
          <div className="d-flex justify-content-between gap-2">
            {renderKpiSection("Efeciency Uptomize KPI Metrics", "efeciency")}
            {renderKpiSection("Scale up KPI Metrics", "scaleup")}
          </div>
        </div>
      </div>
    </BaseLayout>
  );
};


// import { useState } from "react";
// import BaseLayout from "../../components/organisms/BaseLayout";
// import KpiSection from "../../components/organisms/kpi/KpiSection";

// export default function MerchantKpiPage() {
//   const defaultKpiData = [
//     { name: "CPC", value: 0, newValue: 0, category: "efeciency" },
//     { name: "ACOS", value: 0, newValue: 0, category: "efeciency" },
//     { name: "Faktor Skala", value: 0, newValue: 0, category: "efeciency" },
//     { name: "Max Adjustment", value: 0, newValue: 0, category: "efeciency" },
//     { name: "Min Adjustment", value: 0, newValue: 0, category: "efeciency" },
//     { name: "Minimum Klik", value: 0, newValue: 0, category: "efeciency" },
//     { name: "Max Klik", value: 0, newValue: 0, category: "efeciency" },
//     { name: "Min Bid Search", value: 0, newValue: 0, category: "efeciency" },
//     { name: "Min Bid Reco", value: 0, newValue: 0, category: "efeciency" },
//     { name: "CPC", value: 0, newValue: 0, category: "scaleup" },
//     { name: "ACOS", value: 0, newValue: 0, category: "scaleup" },
//     { name: "Faktor Skala", value: 0, newValue: 0, category: "scaleup" },
//     { name: "Max Adjustment", value: 0, newValue: 0, category: "scaleup" },
//     { name: "Min Adjustment", value: 0, newValue: 0, category: "scaleup" },
//     { name: "Minimum Klik", value: 0, newValue: 0, category: "scaleup" },
//     { name: "Max Klik", value: 0, newValue: 0, category: "scaleup" },
//     { name: "Min Bid Search", value: 0, newValue: 0, category: "scaleup" },
//     { name: "Min Bid Reco", value: 0, newValue: 0, category: "scaleup" },
//   ];

//   const [kpiData, setKpiData] = useState(() => {
//     const stored = localStorage.getItem("kpiData");
//     return stored ? JSON.parse(stored) : defaultKpiData;
//   });

//   return (
//     <BaseLayout>
//       <div className="d-flex align-items-center pb-1">
//         <h3>Merchant</h3>
//       </div>
//       <div>
//         <div className="card px-3 py-3">
//           <h5 className="text-left">Merchant Key Performance Indicator (KPI)</h5>
//           <div className="d-flex justify-content-between gap-2">
//             <KpiSection
//               title="Efeceiency Uptumize KPI Metrics"
//               category="efeciency"
//               globalKpiData={kpiData}
//               setGlobalKpiData={setKpiData}
//             />
//             <KpiSection
//               title="Scale up KPI Metrics"
//               category="scaleup"
//               globalKpiData={kpiData}
//               setGlobalKpiData={setKpiData}
//             />
//           </div>
//         </div>
//       </div>
//     </BaseLayout>
//   );
// };