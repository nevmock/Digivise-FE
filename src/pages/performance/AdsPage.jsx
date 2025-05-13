import BaseLayout from "../../components/organisms/BaseLayout";
import AdsTable from "../../components/organisms/ads/adsTable";


export default function PerformanceAdsPage() {
    return (
        <>
            <BaseLayout>
                <div className="d-flex flex-column gap-2">
                    <h3>Performa iklan</h3>
                    <AdsTable />
                    {/* <AdsTable data={adsJsonData} datas={adsData} /> */}
                </div>
            </BaseLayout>
        </>
    )
};