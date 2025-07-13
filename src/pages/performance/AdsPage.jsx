import BaseLayout from "../../components/organisms/BaseLayout";
import AdsTable from "../../components/organisms/ads/adsTable";


export default function PerformanceAdsPage() {
    const getShopeeId = localStorage.getItem("shopeeId");
    if (getShopeeId == null || getShopeeId === null || getShopeeId === "null" || getShopeeId === "undefined") {
        return (
            <BaseLayout>
                <div className="alert alert-warning">
                    Tidak ada merchant aktif. Silahkan buat merchant atau login ke merchant terlebih dahulu.
                </div>
            </BaseLayout>
        );
    };

    return (
        <>
            <BaseLayout>
                <div className="d-flex flex-column gap-2">
                    <h3>Performa iklan</h3>
                    <AdsTable shoppeeId={getShopeeId} />
                </div>
            </BaseLayout>
        </>
    );
};