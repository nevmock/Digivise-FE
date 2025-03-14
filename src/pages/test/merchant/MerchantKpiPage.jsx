import DashboardLayout from "../../../components/organisms/Test/DashboardLayout";

export default function MerchantKpiPage() {
    return (
        <>
            <DashboardLayout>
                <div className="d-flex flex-column gap-5">
                    <div className="p-3 d-flex gap-5 bg-secondary-subtle">
                        <div className="bg-white" style={{ width: `150px`, height: `150px`}}></div>
                        <div className="d-flex flex-column gap-3">
                            <div className="bg-white" style={{ width: `300px`, height: `25px`}}></div>
                            <div className="bg-white" style={{ width: `300px`, height: `25px`}}></div>
                            <div className="bg-white" style={{ width: `300px`, height: `25px`}}></div>`
                        </div>
                    </div>
                    <div className="px-3 py-4 d-flex bg-secondary-subtle">
                        <div className="d-flex flex-column gap-3">
                            <div className="d-flex gap-3">
                                <span className="fs-4 text-black" style={{ width: "50px" }}>CPC</span>
                                <div className="bg-white" style={{ width: `300px`, height: `25px`}}></div>
                            </div>
                            <div className="d-flex gap-3">
                                <span className="fs-4 text-black" style={{ width: "50px" }}>ACOS</span>
                                <div className="bg-white" style={{ width: `300px`, height: `25px`}}></div>
                            </div>
                            <div className="d-flex gap-3">
                                <span className="fs-4 text-black" style={{ width: "50px" }}>CTR</span>
                                <div className="bg-white" style={{ width: `300px`, height: `25px`}}></div>
                            </div>
                            <div className="d-flex gap-3">
                                <span className="fs-4 text-black" style={{ width: "50px" }}>CR</span>
                                <div className="bg-white" style={{ width: `300px`, height: `25px`}}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </>
    )
};