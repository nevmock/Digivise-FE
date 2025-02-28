import Menu from "../../../components/organisms/Menu";
import Footer from "../../../components/organisms/Footer";

export default function PerformanceAdsDetail() {
    return (
        <>
            <html lang="en">
                <div className="app-wrapper">
                    <Menu />
                    <div className="page-content">
                        <div className="container-fluid">
                            <div className="d-flex flex-column gap-4">
                                <div className="w-100 bg-secondary-subtle" style={{ height: "300px" }}></div>
                                <div style={{ height: "200px" }} className="w-100 bg-secondary-subtle d-flex justify-content-center align-items-center">
                                    <p className="text-black fs-2">detail ads chart</p>
                                </div>
                                <div style={{ height: "350px" }} className="w-100 bg-secondary-subtle d-flex justify-content-center align-items-center">
                                    <p className="text-black fs-2">ads keywords table</p>
                                </div>
                            </div>
                        </div>
                        <Footer />
                    </div>
                </div>
            </html>
        </>
    )
};