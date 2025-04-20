import { useState } from "react";
import BaseLayout from "../../components/organisms/BaseLayout";
import KpiSection from "../../components/organisms/kpi/KpiSection";

export default function MerchantKpiPage() {
  const defaultKpiData = [
    { name: "CPC", value: 0, newValue: 0, category: "efeciency" },
    { name: "ACOS", value: 0, newValue: 0, category: "efeciency" },
    { name: "Faktor Skala", value: 0, newValue: 0, category: "efeciency" },
    { name: "Max Adjustment", value: 0, newValue: 0, category: "efeciency" },
    { name: "Min Adjustment", value: 0, newValue: 0, category: "efeciency" },
    { name: "Minimum Klik", value: 0, newValue: 0, category: "efeciency" },
    { name: "Max Klik", value: 0, newValue: 0, category: "efeciency" },
    { name: "Min Bid Search", value: 0, newValue: 0, category: "efeciency" },
    { name: "Min Bid Reco", value: 0, newValue: 0, category: "efeciency" },
    { name: "CPC", value: 0, newValue: 0, category: "scaleup" },
    { name: "ACOS", value: 0, newValue: 0, category: "scaleup" },
    { name: "Faktor Skala", value: 0, newValue: 0, category: "scaleup" },
    { name: "Max Adjustment", value: 0, newValue: 0, category: "scaleup" },
    { name: "Min Adjustment", value: 0, newValue: 0, category: "scaleup" },
    { name: "Minimum Klik", value: 0, newValue: 0, category: "scaleup" },
    { name: "Max Klik", value: 0, newValue: 0, category: "scaleup" },
    { name: "Min Bid Search", value: 0, newValue: 0, category: "scaleup" },
    { name: "Min Bid Reco", value: 0, newValue: 0, category: "scaleup" },
  ];

  const [kpiData, setKpiData] = useState(() => {
    const stored = localStorage.getItem("kpiData");
    return stored ? JSON.parse(stored) : defaultKpiData;
  });

  return (
    <BaseLayout>
      <div className="d-flex align-items-center pb-1">
        <h3>Merchant</h3>
      </div>
      <div>
        <div className="card px-3 py-3">
          <h5 className="text-left">Merchant Key Performance Indicator (KPI)</h5>
          <div className="d-flex justify-content-between gap-2">
            <KpiSection
              title="Efeceiency Uptumize KPI Metrics"
              category="efeciency"
              globalKpiData={kpiData}
              setGlobalKpiData={setKpiData}
            />
            <KpiSection
              title="Scale up KPI Metrics"
              category="scaleup"
              globalKpiData={kpiData}
              setGlobalKpiData={setKpiData}
            />
          </div>
        </div>
      </div>
    </BaseLayout>
  );
};