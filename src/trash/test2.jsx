// import { useAuth } from "./context/Auth";
// import { setUnauthorizedHandler } from "./utils/request";
// import PrivateRoute from "./utils/protectRoutes";
// import GlobalJsScripts from './assets/global';


// function App() {
//   const { handleUnauthorized } = useAuth();

//   useEffect(() => {
//     setUnauthorizedHandler(handleUnauthorized);
//   }
//   , [handleUnauthorized]);

//   return (
//     <>
//       <Toaster position="top-center" />
//       <GlobalJsScripts />
//       <Routes>
//         <Route path="/" element={<LoginPage />} />

//         <Route element={<PrivateRoute />}>
//           <Route path="/verification-otp" element={<OtpPage />} />
//           <Route path="/dashboard" element={<HomeDashboardPage />} />
//           <Route path="/dashboard/merchant-information" element={<MerchantInformationPage />} />
//           <Route path="/dashboard/merchant-kpi" element={<MerchantKPIPage />} />
//           <Route path="/dashboard/performance/ads" element={<PerformanceAdsPage />} />
//           <Route path="/dashboard/performance/product" element={<PerformanceProductPage />} />
//           <Route path="/dashboard/performance/stock" element={<PerformanceStockPage />} />
//           <Route path="/dashboard/performance/ads/detail" element={<TetsDetailAdsPage />} />
//           <Route path="/dashboard/performance/ads/detailRECOM" element={<TestDetailDuaAdsPage />} />
//           <Route path="/dashboard/performance/ads/detailROAS" element={<TestDetailTigaAdsPage />} />
//         </Route>
        
//         <Route path="*" element={<NotFoundPage />} />
//       </Routes>
//     </>
//   );
// };

// export default App;