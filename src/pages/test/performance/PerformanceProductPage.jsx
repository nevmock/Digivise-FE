import { Link } from "react-router-dom";
import DashboardLayout from "../../../components/organisms/Test/DashboardLayout";

export default function PerformanceProduct() {
    return (
        <>
            <DashboardLayout>
                <div className="d-flex flex-column gap-4">
                    <div className="w-100 bg-secondary-subtle" style={{ height: "80px"}}></div>
                    <div style={{ height: "200px"}} className="w-100 d-flex gap-3">
                        <div className="w-75 h-100 bg-secondary-subtle d-flex justify-content-center align-items-center">
                            <p className="text-black fs-2">performance chart</p>
                        </div>
                        <div className="w-25 h-100 bg-secondary-subtle d-flex justify-content-center align-items-center">
                            <p className="text-black fs-2">rank</p>    
                        </div>
                    </div>
                    <Link to="/dashboard/performance/product/detail" style={{ height: "350px"}} className="w-100 bg-secondary-subtle d-flex justify-content-center align-items-center">
                        <p className="text-black fs-2">Product Table</p>  
                    </Link>
                </div>
            </DashboardLayout>
        </>
    )
};