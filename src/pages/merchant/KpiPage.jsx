import { useEffect, useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import BaseLayout from "../../components/organisms/BaseLayout";
import KpiSection from "../../components/organisms/kpi/KpiSection";
import { getKpiData } from "../../resolver/kpi/index";
import { se } from "date-fns/locale";

export default function MerchantKpiPage() {
  const [kpiData, setKpiData] = useState([]);
  const [kpiId, setKpiId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const transformApiDataToKpiList = (apiData) => {
    return [
      { name: "CPC", key: "maxCpc", value: apiData.maxCpc, category: "efeciency" },
      { name: "ACOS", key: "maxAcos", value: apiData.maxAcos, category: "efeciency" },
      { name: "Faktor Skala", key: "cpcScaleFactor", value: apiData.cpcScaleFactor, category: "efeciency" },
      { name: "Max Adjustment", key: "maxAdjustment", value: apiData.maxAdjustment, category: "efeciency" },
      { name: "Min Adjustment", key: "minAdjustment", value: apiData.minAdjustment, category: "efeciency" },
      { name: "Minimum Klik", key: "minKlik", value: apiData.minKlik, category: "efeciency" },
      { name: "Max Klik", key: "maxKlik", value: apiData.maxKlik, category: "efeciency" },
      { name: "Min Bid Search", key: "minBidSearch", value: apiData.minBidSearch, category: "efeciency" },
      { name: "Min Bid Reco", key: "minBidReco", value: apiData.minBidReco, category: "efeciency" },
      { name: "Faktor Skala ACOS", key: "acosScaleFactor", value: apiData.acosScaleFactor, category: "scaleup" },
      { name: "Multiplier", key: "multiplier", value: apiData.multiplier, category: "scaleup" },
    ];
  };

  const transformKpiListToApiPayload = (listKpiData) => {
    const payload = {};
    listKpiData.forEach(item => {
      payload[item.key] = Number(item.newValue ?? item.value);
    });
    return payload;
  };

  const fetchKPIData = async () => {
    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem("userDataApp"));
      const merchantId = userData?.activeMerchant?.id || userData?.merchants[0]?.id;
      if (!merchantId) throw new Error("No merchant found");

      const response = await getKpiData(merchantId);
      if (response) {
        const transformed = transformApiDataToKpiList(response);
        setKpiData(transformed);
        setKpiId(response.id);
      }
    } catch (error) {
      console.error("Gagal mengambli KPI data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const payload = transformKpiListToApiPayload(kpiData);
      console.log("test", payload);
      await updateKpiData(kpiId, payload);
      toast.success("Data KPI berhasil diperbarui");
    } catch (error) {
      toast.error("Gagal memperbarui data KPI");
      console.error("Gagal update KPI, kesalahan pada server:", error);
    }
  };

  useEffect(() => {
    fetchKPIData();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <BaseLayout>
      <div className="d-flex align-items-center pb-1">
        <h3>Merchant</h3>
      </div>
      <div>
        <div className="card px-3 py-3">
          <h5 className="text-left">Merchant Key Performance Indicator (KPI)</h5>
          <div className="row row-cols-1 row-cols-md-2 g-3">
            <div className="col">
              <KpiSection
                title="Efeceiency Uptumize KPI Metrics"
                category="efeciency"
                globalKpiData={kpiData}
                setGlobalKpiData={setKpiData}
              />
            </div>
            <div className="col">
              <KpiSection
                title="Scale up KPI Metrics"
                category="scaleup"
                globalKpiData={kpiData}
                setGlobalKpiData={setKpiData}
              />
            </div>
          </div>
          <div className="d-flex justify-content-end mt-3">
            <button className="btn btn-primary" onClick={handleUpdate}>
              Simpan
            </button>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
};