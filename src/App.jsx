import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import { useAuth } from "./context/Auth";
import { setUnauthorizedHandler } from "./utils/request";
import PrivateRoute from "./utils/protectRoutes";
import GlobalJsScripts from './assets/global';
import LoginPage from './pages/auth/LoginPage';
import OtpPage from './pages/auth/OtpPage';
import HomeDashboardPage from "./pages/index";
import MerchantInformationPage from './pages/merchant/InformatioPage';
import MerchantKPIPage from './pages/merchant/KpiPage';
import PerformanceAdsPage from './pages/performance/AdsPage';
import PerformanceProductPage from './pages/performance/ProductPage';
import PerformanceStockPage from "./pages/performance/StockPage";
import TetsDetailAdsPage from './pages/performance/DetailAds';
import TestDetailDuaAdsPage from './pages/performance/DetailDuaAds';
import TestDetailTigaAdsPage from './pages/performance/DetailTigaAds';
import NotFoundPage from "./pages/NotFound";

function App() {
  const { handleUnauthorized } = useAuth();

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
  }
  , [handleUnauthorized]);

  return (
    <>
      <GlobalJsScripts />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/verification-otp" element={<OtpPage />} />
        <Route path="/dashboard" element={
          <PrivateRoute>
            <HomeDashboardPage />
          </PrivateRoute>
          } 
        />
        <Route path="/dashboard/merchant-information" element={<MerchantInformationPage />} />
        <Route path="/dashboard/merchant-kpi" element={<MerchantKPIPage />} />
        <Route path="/dashboard/performance/ads" element={<PerformanceAdsPage />} />
        <Route path="/dashboard/performance/product" element={<PerformanceProductPage />} />
        <Route path="/dashboard/performance/stock" element={<PerformanceStockPage />} />
        <Route path="/dashboard/performance/ads/detail" element={<TetsDetailAdsPage />} />
        <Route path="/dashboard/performance/ads/detailRECOM" element={<TestDetailDuaAdsPage />} />
        <Route path="/dashboard/performance/ads/detailROAS" element={<TestDetailTigaAdsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
};

export default App;