import adsJsonData from "../../api/ads.json";
import BaseLayout from "../../components/organisms/BaseLayout";
import AdsTable from "../../components/organisms/adsTable";

export default function PerformanceAdsPage() {
    return (
        <>
            <BaseLayout>
                <div className="d-flex flex-column gap-2">
                    <h3>Performa iklan</h3>
                    <AdsTable data={adsJsonData} />
                </div>
            </BaseLayout>
        </>
    )
};