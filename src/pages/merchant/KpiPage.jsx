import { useEffect, useState, useRef, act } from "react";
import { toast } from "react-hot-toast";

import { useAuth } from "../../context/Auth";
import { getKpiData } from "../../resolver/kpi/index";
import axiosRequest from "../../utils/request";
import BaseLayout from "../../components/organisms/BaseLayout";
import KpiSection from "../../components/organisms/kpi/KpiSection";
import Loading from "../../components/atoms/Loading/Loading";


export default function MerchantKpiPage() {
  const { userData } = useAuth();
  const [kpiData, setKpiData] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userNow, setUserNow] = useState(null);
  const isMounted = useRef(false);

  const fetchGetCurrentUser = async () => {
    setIsLoading(true);
    try {
      const response = await axiosRequest.get(`/api/users/${userData.userId}`);
      if (response.status === 200 || response.code === 200 || response.status === "OK" || response.code === "OK") {
        const currentUser = response.data;
        setUserNow(currentUser);
      } else {
        console.error("Failed to fetch current user, status:", response.status);
      }

    } catch (error) {
      console.error("Error fetching current user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.userId) {
      fetchGetCurrentUser();
    }
  }, [userData.userId]);

  const activeMerchant = userNow?.activeMerchant;
  const merchantId = userNow?.activeMerchant?.id;
  const userId = userNow?.id;

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const transformApiDataToKpiList = (apiData) => {
    if (!apiData || typeof apiData !== 'object') {
      throw new Error('Invalid API data format');
    }

    return [
      { name: "CPC", key: "maxCpc", value: apiData.maxCpc || 0, category: "efeciency" },
      { name: "ACOS", key: "maxAcos", value: apiData.maxAcos || 0, category: "efeciency" },
      { name: "Faktor Skala", key: "cpcScaleFactor", value: apiData.cpcScaleFactor || 0, category: "efeciency" },
      { name: "Max Adjustment", key: "maxAdjustment", value: apiData.maxAdjustment || 0, category: "efeciency" },
      { name: "Min Adjustment", key: "minAdjustment", value: apiData.minAdjustment || 0, category: "efeciency" },
      { name: "Minimum Klik", key: "minKlik", value: apiData.minKlik || 0, category: "efeciency" },
      { name: "Max Klik", key: "maxKlik", value: apiData.maxKlik || 0, category: "efeciency" },
      { name: "Min Bid Search", key: "minBidSearch", value: apiData.minBidSearch || 0, category: "efeciency" },
      { name: "Min Bid Reco", key: "minBidReco", value: apiData.minBidReco || 0, category: "efeciency" },
      { name: "Faktor Skala ACOS", key: "acosScaleFactor", value: apiData.acosScaleFactor || 0, category: "scaleup" },
      { name: "Multiplier", key: "multiplier", value: apiData.multiplier || 0, category: "scaleup" },
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
      setIsLoading(true);
      isMounted.current = true;

      const response = await getKpiData(merchantId);
      if ((response && isMounted.current) || response?.status === 200 || response?.code === 200 || response?.status === "OK" || response?.code === "OK") {
        const transformed = transformApiDataToKpiList(response);
        setKpiData(transformed);
      }
    } catch (error) {
      if (isMounted.current) {
        toast.error("Gagal mengambil data KPI");
        console.error("Gagal mengambil KPI data, kesalahan pada server", error);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const handleUpdate = async () => {
    if (!kpiData || kpiData.length === 0) {
      toast.warning("Tidak ada data KPI yang dapat diperbarui");
      return;
    }

    try {
      setIsUpdating(true);
  
      const payload = {
        ...transformKpiListToApiPayload(kpiData),
        merchantId: merchantId,
        id: userId,
      }

      const response = await axiosRequest.put("/api/kpis", payload);
      if (response && (response?.status === 200 || response?.code === 200 || response?.status === "OK" || response?.code === "OK")) {
        toast.success("Data KPI berhasil diperbarui");
        await fetchKPIData(); 
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      if (isMounted.current) {
        toast.error("Gagal memperbarui data KPI");
        console.error("Gagal memperbarui data KPI, kesalahan pada server", error);
      }
    } finally {
      if (isMounted.current) {
        setIsUpdating(false);
      }
    }
  };

  useEffect(() => {
    if (activeMerchant) {
      fetchKPIData();
    }
  }, [activeMerchant]);

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

  return (
    <BaseLayout>
      <div className="d-flex align-items-center pb-1">
        <h3>Merchant</h3>
      </div>
      <div>
        {
          isLoading ? (
            <div className="w-100 d-flex justify-content-center vh-100">
              <Loading size={40} />
            </div>
          ) : (
            <div className="card px-2 px-sm-3 py-3">
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
                    title="Scale Up KPI Metrics"
                    category="scaleup"
                    globalKpiData={kpiData}
                    setGlobalKpiData={setKpiData}
                  />
                </div>
              </div>
              <div className="d-flex justify-content-end mt-3">
                <button type="submit" className="w-100 btn btn-success" onClick={handleUpdate} disabled={isUpdating}>
                  {
                    isUpdating ? (
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Updating...</span>
                      </div>
                    ) : (
                      "Update"
                    )
                  }
                </button>
              </div>
            </div>
          )
        }
      </div>
    </BaseLayout>
  );
};