import { Link } from "react-router-dom";
import Menu from "../../components/organisms/Menu";
import Footer from "../../components/organisms/Footer";

export default function PerformanceAdsPage() {
    return (
        <>
            <html lang="en">
                <div className="app-wrapper">
                    <Menu />
                    <div className="page-content">
                        <div className="container-fluid">
                            <div className="d-flex flex-column gap-4">
                                <div className="w-100 bg-secondary-subtle" style={{ height: "80px" }}></div>
                                <div style={{ height: "200px" }} className="w-100 d-flex gap-3">
                                    <div className="w-75 h-100 bg-secondary-subtle d-flex justify-content-center align-items-center">
                                        <p className="text-dark fs-2">performance chart</p>
                                    </div>
                                    <div className="w-25 h-100 bg-secondary-subtle d-flex justify-content-center align-items-center">
                                        <p className="text-dark fs-2">rank</p>
                                    </div>
                                </div>
                                <Link to="/performance/product/detail" style={{ height: "350px" }} className="w-100 bg-secondary-subtle d-flex justify-content-center align-items-center">
                                    <p className="text-dark fs-2">Product Table</p>
                                </Link>
                            </div>
                        </div>
                        <Footer />
                    </div>
                </div>
            </html>
        </>
    )
};