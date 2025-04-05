import { Routes, Route } from "react-router-dom";
import GlobalScripts from './assets/global';
import LoginPage from './pages/auth/LoginPage';
import OtpPage from './pages/auth/OtpPage';
import HomeDashboardPage from "./pages/index";
import MerchantInformationPage from './pages/merchant/InformatioPage';
import MerchantKPIPage from './pages/merchant/KpiPage';
import PerformanceAdsPage from './pages/performance/AdsPage';
import PerformanceProductPage from './pages/performance/ProductPage';
import PerformanceStockPage from "./pages/performance/StockPage";
import TetsDetailAdsPage from './pages/performance/DetailAds';
import NotFoundPage from "./pages/NotFound";

function App() {
  return (
    <>
      <GlobalScripts />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verification-otp" element={<OtpPage />} />
        <Route path="/" element={<HomeDashboardPage />} />
        <Route path="/merchant-information" element={<MerchantInformationPage />} />
        <Route path="/merchant-kpi" element={<MerchantKPIPage />} />
        <Route path="/performance/ads" element={<PerformanceAdsPage />} />
        <Route path="/performance/product" element={<PerformanceProductPage />} />
        <Route path="/performance/stock" element={<PerformanceStockPage />} />
        <Route path="/performance/ads/detail" element={<TetsDetailAdsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
};

export default App;