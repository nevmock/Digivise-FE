import DashboardLayout from "../../../../components/organisms/Test/DashboardLayout";

export default function PerformanceAdsDetail() {
    return (
        <>
            <DashboardLayout>
                <div className="d-flex flex-column gap-4">
                    <div className="w-100 bg-secondary-subtle" style={{ height: "300px" }}></div>
                    <div style={{ height: "200px" }} className="w-100 bg-secondary-subtle d-flex justify-content-center align-items-center">
                        <p className="text-black fs-2">detail ads chart</p>
                    </div>
                    <div style={{ height: "350px" }} className="w-100 bg-secondary-subtle d-flex justify-content-center align-items-center">
                        <p className="text-black fs-2">ads keywords table</p>
                    </div>
                </div>
            </DashboardLayout>
        </>
    )
};