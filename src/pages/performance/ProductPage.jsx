import { Link } from "react-router-dom";
import Menu from "../../components/organisms/Menu";
import Footer from "../../components/organisms/Footer";
import ProductTable from "../../components/organisms/Product/Table";
import jsonData from '../../api/product.json';

export default function PerformanceProductPage() {
    return (
        <>
            <html lang="en">
                <div className="app-wrapper">
                    <Menu />
                    <div className="page-content">
                        <div className="container-fluid">
                            <div className="d-flex flex-column gap-4">
                                <ProductTable data={jsonData.data} />
                            </div>
                        </div>
                        <Footer />
                    </div>
                </div>
            </html>
        </>
    );
};