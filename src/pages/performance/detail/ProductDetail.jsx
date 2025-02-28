import Menu from "../../../components/organisms/Menu";
import Footer from "../../../components/organisms/footer";

export default function PerformanceProductDetail() {
    return (
        <>
            <html lang="en">
                <div className="app-wrapper">
                    <Menu />
                    <div className="page-content">
                        <div className="container-fluid">
                            <div className="d-flex flex-column gap-4">
                                <div className="w-100 bg-secondary-subtle" style={{ height: "300px" }}></div>
                                <div style={{ height: "200px" }} className="w-100 d-flex gap-3">
                                    <div className="w-75 h-100 bg-secondary-subtle d-flex justify-content-center align-items-center">
                                        <p className="text-black fs-2">detail product chart</p>
                                    </div>
                                    <div className="w-25 bg-secondary-subtle d-flex justify-content-center align-items-center">
                                        <p className="text-black fs-2">pie chart keyword</p>
                                    </div>
                                </div>
                                <div style={{ height: "350px" }} className="w-100 bg-secondary-subtle d-flex justify-content-center align-items-center">
                                    <p className="text-black fs-2">keywords table</p>
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