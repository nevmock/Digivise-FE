import { useEffect, useState } from "react";

import adsJsonData from "../../api/ads.json";
import BaseLayout from "../../components/organisms/BaseLayout";
import AdsTable from "../../components/organisms/ads/adsTable";
import { getAdsData } from "../../resolver/ads/index";


export default function PerformanceAdsPage() {
    const [adsData, setAdsData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAdsData = async () => {
            try {
                setIsLoading(true);
                const data = await getAdsData();
                setAdsData(data);
            } catch (error) {
                console.error("Error saat mengambil data iklan:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAdsData();
    }, []);

    return (
        <>
            <BaseLayout>
                <div className="d-flex flex-column gap-2">
                    <h3>Performa iklan</h3>
                    {isLoading ? (
                        <p>Loading...</p>
                    ) : (
                        <AdsTable data={adsJsonData} datas={adsData} />
                    )}
                </div>
            </BaseLayout>
        </>
    )
};