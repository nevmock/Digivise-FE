import React, { useEffect, useState } from "react";

import { useAuth } from "../../context/Auth";
import axiosRequest from "../../utils/request";
import BaseLayout from "../../components/organisms/BaseLayout";
import AdsTable from "../../components/organisms/ads/adsTable";

export default function PerformanceAdsPage() {
    // const { userData } = useAuth();
    // const [userNow, setUserNow] = useState(null);
    // const [dataShopId, setDataShopId] = useState(null);
    // const [isGetShopLoading, setIsGetShopLoading] = useState(false);

    // const fetchGetCurrentUser = async () => {
    //     setIsGetShopLoading(true);
    //     try {
    //         const response = await axiosRequest.get(`/api/users/${userData.userId}`);
    //         if (response.status === 200 || response.code === 200 || response.status === "OK" || response.code === "OK") {
    //             const currentUser = response.data;
    //             setUserNow(currentUser);
    //         } else {
    //             console.error("Failed to fetch current user, status:", response.status);
    //         }

    //     } catch (error) {
    //         console.error("Error fetching current user:", error);
    //     } finally {
    //         setIsGetShopLoading(false);
    //     }
    // };

    // useEffect(() => {
    //     fetchGetCurrentUser();
    // }, [userData.userId]);

    // const merchantData = userNow && userNow.merchants !== null && userNow.activeMerchant !== null;


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