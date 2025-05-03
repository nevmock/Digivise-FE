import { Routes, Route } from "react-router-dom";
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
// import TestDetailDuaAdsPage from './pages/performance/DetailDuaAds';
// import TestDetailTigaAdsPage from './pages/performance/DetailTigaAds';
import NotFoundPage from "./pages/NotFound";

function App() {
  return (
    <>
      <GlobalJsScripts />
      <Routes>
        {/* route login akan menjadi "/" jika sudah implmentasi api */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verification-otp" element={<OtpPage />} />
        {/* route dashboard akan menjadi "/dashboard" jika sudah implmentasi api */}
        <Route path="/" element={<HomeDashboardPage />} />
        {/* route children dari dashboard akan menjadi "/dashboard/..." jika sudah implementasi api */}
        <Route path="/merchant-information" element={<MerchantInformationPage />} />
        <Route path="/merchant-kpi" element={<MerchantKPIPage />} />
        <Route path="/performance/ads" element={<PerformanceAdsPage />} />
        <Route path="/performance/product" element={<PerformanceProductPage />} />
        <Route path="/performance/stock" element={<PerformanceStockPage />} />
        <Route path="/performance/ads/detail" element={<TetsDetailAdsPage />} />
        {/* <Route path="/performance/ads/detailRECOM" element={<TestDetailDuaAdsPage />} />
        <Route path="/performance/ads/detailROAS" element={<TestDetailTigaAdsPage />} /> */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
};

export default App;