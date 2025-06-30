import { useEffect, useState } from "react";

import { useAuth } from "../../context/Auth";
import axiosRequest from "../../utils/request";
import BaseLayout from "../../components/organisms/BaseLayout";
import Loading from "../../components/atoms/Loading/Loading";


export default function MerchantInformationPage() {
  const { userData } = useAuth();
  const [userNow, setUserNow] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchGetCurrentUser = async () => {
    setIsLoading(true);
    try {
      const response = await axiosRequest.get(`/api/users/${userData.userId}`);
      if (response.status === 200) {
        const currentUser = response.data;
        setUserNow(currentUser);
      } else {
        console.error("Failed to fetch current user, status:", response.status);
      }

    } catch (error) {
      console.error("Error fetching current user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGetCurrentUser();
  }, [userData.userId]);

  const merchantData = userNow && userNow.merchants !== null && userNow.activeMerchant !== null;
  if (!merchantData) {
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
        <div className="d-flex align-items-center">
          <h3>Merchant</h3>
        </div>
        {
          isLoading ? (
            <div className="d-flex justify-content-center align-items-start vh-100">
              <Loading size={40} />
            </div>
          ) : (
            <>
              <div className="card">
                <div className="card-body">
                  <h5 className="text-left pb-3">Informasi Merchant</h5>
                  <div className="d-flex gap-2 align-items-start">
                    <span className="d-flex align-items-center">
                      <img
                        id="custom-image-profile-merchant-information"
                        className="rounded-circle"
                        width="100"
                        src="../../assets/images/users/avatar-1.jpg"
                        alt="image-profile-merchant"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/100";
                        }}
                      />
                    </span>
                    <div className="d-flex flex-column gap-1">
                      <div className="d-flex flex-column">
                        <span>Nama Merchant</span>
                        <h4>
                          {userNow?.activeMerchant?.merchantName || "-"}
                        </h4>
                      </div>
                      <div className="d-flex flex-column">
                        <span>Shopee ID</span>
                        <h4>
                          {userNow?.activeMerchant?.merchantShopeeId || "-"}
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* <div className="row gx-3">
                <div className="col-12 col-md-6">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="card-title mb-0">Matrix Peforma Toko</h5>
                    </div>
                    <div className="card-body">
                      <div>
                        <div>
                          <div className="d-flex w-full gap-2">
                            <span>Omset :</span>
                            <p>20</p>
                          </div>
                          <div className="d-flex w-full gap-2">
                            <span>Traffic :</span>
                            <p>20</p>
                          </div>
                          <div className="d-flex w-full gap-2">
                            <span>Click Add To Cart :</span>
                            <p>20</p>
                          </div>
                          <div className="d-flex w-full gap-2">
                            <span>Convertion Rate : </span>
                            <p>20</p>
                          </div>
                          <div className="d-flex w-full gap-2">
                            <span>Ratio pengungjung baru dan lama :</span>
                            <p>20</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="card-title mb-0">Matrix Iklan</h5>
                    </div>
                    <div className="card-body">
                      <div>
                        <div>
                          <div className="d-flex w-full gap-2">
                            <span>Custom harian :</span>
                            <p>20</p>
                          </div>
                          <div className="d-flex w-full gap-2">
                            <span>ACOS bulan:</span>
                            <p>20</p>
                          </div>
                          <div className="d-flex w-full gap-2">
                            <span>CPC bulan :</span>
                            <p>20</p>
                          </div>
                          <div className="d-flex w-full gap-2">
                            <span>CTR bulan berjalan :</span>
                            <p>20</p>
                          </div>
                          <div className="d-flex w-full gap-2">
                            <span>Biaya Iklan :</span>
                            <p>20</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div> */}
            </>
          )
        }
      </BaseLayout>
    </>
  );
};