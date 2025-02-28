import { Routes, Route } from "react-router-dom";
import GlobalScripts from './assets/global';
import LoginPage from './pages/auth/LoginPage';
import OtpPage from './pages/auth/OtpPage';
import HomeDashboardPage from "./pages/index";
import MerchantInformationPage from './pages/merchant/InformatioPage';
import MerchantKPIPage from './pages/merchant/KpiPage';
import PerformanceAdsPage from './pages/performance/AdsPage';
import PerformanceProductPage from './pages/performance/ProductPage';
import PerformanceAdsDetail from "./pages/performance/detail/AdsDetail";
import PerformanceProductDetail from "./pages/performance/detail/ProductDetail";
import NotFoundPage from "./pages/NotFound";

// Wireframe
// import LoginPage from './pages/test/auth/LoginPage';
// import OtpPage from './pages/test/auth/OtpPage';
// import HomeDashboardPage from "./pages/test/index";
// import MerchantInformationPage from './pages/test/merchant/MerchantInformationPage';
// import MerchantKPIPage from './pages/test/merchant/MerchantKpiPage';
// import PerformanceAdsPage from './pages/test/performance/PerformanceAdsPage';
// import PerformanceProductPage from './pages/test/performance/PerformanceProductPage';
// import PerformanceAdsDetail from "./pages/test/performance/detail/AdsDetail";
// import PerformanceProductDetail from "./pages/test/performance/detail/ProductDetail";

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
        <Route path="/performance/ads/detail" element={<PerformanceAdsDetail />} />
        <Route path="/performance/product/detail" element={<PerformanceProductDetail />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>

    // Wireframe
    // <>
    //   <Routes>
    //     <Route path="/login" element={<LoginPage />} />
    //     <Route path="/verification-otp" element={<OtpPage />} />
    //     <Route path="/" element={<HomeDashboardPage />} />
    //     <Route path="/dashboard/merchant-information" element={<MerchantInformationPage />} />
    //     <Route path="/dashboard/merchant-kpi" element={<MerchantKPIPage />} />
    //     <Route path="/dashboard/performance/ads" element={<PerformanceAdsPage />} />
    //     <Route path="/dashboard/performance/product" element={<PerformanceProductPage />} />        
    //     <Route path="/dashboard/performance/ads/detail" element={<PerformanceAdsDetail />} />
    //     <Route path="/dashboard/performance/product/detail" element={<PerformanceProductDetail />} />
    //   </Routes>
    // </>
  );
};

export default App;