import { useEffect, useState, useRef } from "react";
import { toast } from "react-hot-toast";

import { useAuth } from "../../context/Auth";
import { getKpiData } from "../../resolver/kpi/index";
import axiosRequest from "../../utils/request";
import BaseLayout from "../../components/organisms/BaseLayout";
import KpiSection from "../../components/organisms/kpi/KpiSection";
import Loading from "../../components/atoms/Loading/Loading"


export default function MerchantKpiPage() {
  const { userData, activeMerchant } = useAuth();
  const [kpiData, setKpiData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const isMounted = useRef(false);

  if (!activeMerchant) {
    return (
      <BaseLayout>
        <div className="alert alert-warning">
          Tidak ada merchant aktif. Silahkan buat merchant atau login ke merchant terlebih dahulu.
        </div>
      </BaseLayout>
    );
  };

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
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
    if (!activeMerchant) {
      return (
        <BaseLayout>
          <div className="alert alert-warning">
            Tidak ada merchant aktif. Login ke merchant terlebih dahulu.
          </div>
        </BaseLayout>
      )
    };

    try {
      setIsLoading(true);
      const merchantId = activeMerchant.id;
      const response = await getKpiData(merchantId);
      if (response && isMounted.current) {
        const transformed = transformApiDataToKpiList(response);
        setKpiData(transformed);
      }
    } catch (error) {
      if (isMounted.current) {
        toast.error("Gagal mengambil data KPI");
        console.error("Gagal mengambil KPI data, kesehalan pada server", error);
      }
      console.error("Gagal mengambli KPI data:", error);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const handleUpdate = async () => {
    if (!activeMerchant) {
      toast.error("Tidak ada merchant aktif, Silakan login terlebih dahulu.");
      return;
    }

    try {
      setIsUpdating(true);

      const merchantId = activeMerchant.id;
      const userId = userData?.userId;

      if (!userId) {
        throw new Error("Data user ID tidak ditemukan");
      }
  
      const payload = {
        ...transformKpiListToApiPayload(kpiData),
        merchantId: merchantId,
        id: userId,
      }

      const response = await axiosRequest.put("/api/kpis", payload);
      if (response?.status == 200 && response) {
        toast.success("Data KPI berhasil diperbarui");
        await fetchKPIData(); 
      } else {
        toast.error("Gagal memperbarui data KPI");
      }
    } catch (error) {
      if (isMounted.current) {
        console.error("Gagal memperbarui data KPI, kesalahan pada server", error);
      }
    } finally {
      if (isMounted.current) {
        setIsUpdating(false);
      }
    }
  };

  useEffect(() => {
    fetchKPIData();
  }, [activeMerchant]);

  return (
    <BaseLayout>
      <div className="d-flex align-items-center pb-1">
        <h3>Merchant</h3>
      </div>
      <div>
        {
          isLoading ? (
            <div className="flex justify-content-center align-items-center vh-100">
              <Loading />
            </div>
          ) : (
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
                    title="Scale Up KPI Metrics"
                    category="scaleup"
                    globalKpiData={kpiData}
                    setGlobalKpiData={setKpiData}
                  />
                </div>
              </div>
              <div className="d-flex justify-content-end mt-3">
                <button type="submit" className="btn btn-primary" onClick={handleUpdate} disabled={isUpdating}>
                  {
                    isUpdating ? (
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
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





// export default function MerchantKpiPage() {
//   const [kpiData, setKpiData] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isUpdating, setIsUpdating] = useState(false);
  
//   const transformApiDataToKpiList = (apiData) => {
//     return [
//       { name: "CPC", key: "maxCpc", value: apiData.maxCpc, category: "efeciency" },
//       { name: "ACOS", key: "maxAcos", value: apiData.maxAcos, category: "efeciency" },
//       { name: "Faktor Skala", key: "cpcScaleFactor", value: apiData.cpcScaleFactor, category: "efeciency" },
//       { name: "Max Adjustment", key: "maxAdjustment", value: apiData.maxAdjustment, category: "efeciency" },
//       { name: "Min Adjustment", key: "minAdjustment", value: apiData.minAdjustment, category: "efeciency" },
//       { name: "Minimum Klik", key: "minKlik", value: apiData.minKlik, category: "efeciency" },
//       { name: "Max Klik", key: "maxKlik", value: apiData.maxKlik, category: "efeciency" },
//       { name: "Min Bid Search", key: "minBidSearch", value: apiData.minBidSearch, category: "efeciency" },
//       { name: "Min Bid Reco", key: "minBidReco", value: apiData.minBidReco, category: "efeciency" },
//       { name: "Faktor Skala ACOS", key: "acosScaleFactor", value: apiData.acosScaleFactor, category: "scaleup" },
//       { name: "Multiplier", key: "multiplier", value: apiData.multiplier, category: "scaleup" },
//     ];
//   };

//   const transformKpiListToApiPayload = (listKpiData) => {
//     const payload = {};
//     listKpiData.forEach(item => {
//       payload[item.key] = Number(item.newValue ?? item.value);
//     });
//     return payload;
//   };

//   const fetchKPIData = async () => {
//     try {
//       setIsLoading(true);
//       const userData = JSON.parse(localStorage.getItem("userDataApp"));
//       const merchantId = userData?.activeMerchant?.id || userData?.merchants[0]?.id;
//       if (!merchantId) throw new Error("Data unik dari merchant tidak ditemukan");

//       const response = await getKpiData(merchantId);
//       if (response) {
//         const transformed = transformApiDataToKpiList(response);
//         setKpiData(transformed);
//       }
//     } catch (error) {
//       console.error("Gagal mengambli KPI data:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleUpdate = async () => {
//     try {
//       setIsUpdating(true);
//       const userDataStr = localStorage.getItem("userDataApp");
//       if (!userDataStr) {
//         throw new Error("Data pengguna tidak ditemukan di localStorage. Silakan login kembali.");
//       }
      
//       const userData = JSON.parse(userDataStr);
//       if (!userData) {
//         throw new Error("Data pengguna tidak valid");
//       }
      
//       const merchantId = userData?.merchants?.[0]?.id;
//       const userId = userData?.userId;
      
//       if (!merchantId || !userId) {
//         throw new Error("Data unik dari merchant dan user tidak ditemukan");
//       }
  
//       const payload = {
//         ...transformKpiListToApiPayload(kpiData),
//         merchantId: merchantId,
//         id: userId,
//       }
  
//       const response = await axiosRequest.put("/api/kpis", payload);
//       if (response?.status === 200 && response) {
//         toast.success("Data KPI berhasil diperbarui");
//         await fetchKPIData(); 
//       }
//     } catch (error) {
//       toast.error(`Gagal memperbarui data KPI: ${error.message || "Kesalahan pada server"}`);
//       console.error("Gagal update KPI:", error);
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   useEffect(() => {
//     fetchKPIData();
//   }, []);

//   return (
//     <BaseLayout>
//       <div className="d-flex align-items-center pb-1">
//         <h3>Merchant</h3>
//       </div>
//       <div>
//         <div className="card px-3 py-3">
//           <h5 className="text-left">Merchant Key Performance Indicator (KPI)</h5>
//           <div className="row row-cols-1 row-cols-md-2 g-3">
//             <div className="col">
//               {
//                 isLoading ? (
//                   <div className="flex justify-content-center align-items-center">
//                     <Loading />
//                   </div>
//                 ) : (
//                   <KpiSection
//                     title="Efeceiency Uptumize KPI Metrics"
//                     category="efeciency"
//                     globalKpiData={kpiData}
//                     setGlobalKpiData={setKpiData}
//                   />
//                 )
//               }
//             </div>
//             <div className="col">
//               {
//                 isLoading ? (
//                   <div className="flex justify-content-center align-items-center">
//                     <Loading />
//                   </div>
//                 ) : (
//                   <KpiSection
//                     title="Scale Up KPI Metrics"
//                     category="scaleup"
//                     globalKpiData={kpiData}
//                     setGlobalKpiData={setKpiData}
//                   />
//                 )
//               }
//             </div>
//           </div>
//           <div className="d-flex justify-content-end mt-3">
//             <button type="submit" className="btn btn-primary" onClick={handleUpdate} disabled={isUpdating}>
//               {
//                 isUpdating ? (
//                   <div className="spinner-border spinner-border-sm" role="status">
//                     <span className="visually-hidden">Loading...</span>
//                   </div>
//                 ) : (
//                   "Update"
//                 )
//               }
//             </button>
//           </div>
//         </div>
//       </div>
//     </BaseLayout>
//   );
// };