import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { useAuth } from "./context/Auth";
import { setUnauthorizedHandler } from "./utils/request";
import PrivateRoute from "./utils/protectRoutes";
import GlobalJsScripts from './assets/global';
import HomeRoute from "./utils/homeRoute";
import LoginPage from './pages/auth/LoginPage';
import OtpPage from './pages/auth/OtpPage';
import HomeDashboardPage from "./pages/index";
import MerchantInformationPage from './pages/merchant/InformationPage';
import MerchantKPIPage from './pages/merchant/KpiPage';
import PerformanceAdsPage from './pages/performance/AdsPage';
import PerformanceProductPage from './pages/performance/ProductPage';
import PerformanceStockPage from "./pages/performance/StockPage";
import TetsDetailAdsPage from './pages/performance/DetailAds';
import TestDetailDuaAdsPage from './pages/performance/DetailDuaAds';
import TestDetailTigaAdsPage from './pages/performance/DetailTigaAds';
import NotFoundPage from "./pages/NotFound";


function App() {
  const { handleUnauthorized, isChecking } = useAuth();

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
  }
  , [handleUnauthorized]);

  if (isChecking) {
    return <div></div>;
  }

  return (
    <>
      <Toaster position="top-center" />
      <GlobalJsScripts />
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<PrivateRoute />}>
          <Route path="/verification-otp" element={<OtpPage />} />
          <Route path="/dashboard" element={<HomeDashboardPage />} />
          <Route path="/dashboard/merchant-information" element={<MerchantInformationPage />} />
          <Route path="/dashboard/merchant-kpi" element={<MerchantKPIPage />} />
          <Route path="/dashboard/performance/ads" element={<PerformanceAdsPage />} />
          <Route path="/dashboard/performance/product" element={<PerformanceProductPage />} />
          <Route path="/dashboard/performance/stock" element={<PerformanceStockPage />} />
          <Route path="/dashboard/performance/ads/detail" element={<TetsDetailAdsPage />} />
          <Route path="/dashboard/performance/ads/detail/:campaignId" element={<TetsDetailAdsPage />} />
          <Route path="/dashboard/performance/ads/detailRECOM" element={<TestDetailDuaAdsPage />} />
          <Route path="/dashboard/performance/ads/detailROAS" element={<TestDetailTigaAdsPage />} />
        </Route>
        
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
};

export default App;