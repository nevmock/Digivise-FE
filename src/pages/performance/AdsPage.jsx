import BaseLayout from "../../components/organisms/BaseLayout";
import jsonData from "../../api/ads.json";
import AdsTable from "../../components/organisms/adsTable";
import dummydata from "../../api/product.json";

export default function PerformanceAdsPage() {
    return (
        <>
            <BaseLayout>
                <div className="d-flex flex-column gap-2">
                    <h3>Performa iklan</h3>
                    <AdsTable data={jsonData[0]?.data} dummy={dummydata} />
                </div>
            </BaseLayout>
        </>
    )
};