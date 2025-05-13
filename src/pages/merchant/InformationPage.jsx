import { useAuth } from "../../context/Auth";
import BaseLayout from "../../components/organisms/BaseLayout";

export default function MerchantInformationPage() {
  const { userData, activeMerchant } = useAuth();
  const merchantData = activeMerchant || (userData?.merchants && userData.merchants[0]);

  if (!merchantData) {
    return (
        <BaseLayout>
            <div className="alert alert-warning">
                Tidak ada merchant aktif. Pilih merchant di navbar atau buat merchant baru terlebih dahulu.
            </div>
        </BaseLayout>
    );
  };
  // const dataMerchant = localStorage.getItem("userDataApp");
  return (
    <>
      <BaseLayout>
        <div className="d-flex align-items-center">
          <h3>Merchant</h3>
        </div>
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
                    <span>Nama Toko</span>
                    <h3>
                        {merchantData.merchantName}
                    </h3>
                </div>
                <div>
                    <span>ID Shopee</span>
                    <p>
                        {merchantData.merchantShopeeId}
                    </p>
                </div>
                <div>
                    <span>Merchant ID</span>
                    <p>
                        {merchantData.id}
                    </p>
                </div>
              </div>
              {/* <div className="d-flex flex-column gap-1">
                <div className="d-flex flex-column">
                  <span>Nama Toko</span>
                  <h3>
                    {dataMerchant && JSON.parse(dataMerchant).merchants[0].merchantName}
                  </h3>
                </div>
                <div>
                  <span>Deskripsi Toko</span>
                  <p>
                    {dataMerchant && JSON.parse(dataMerchant).merchants[0].merchantShopeeId}
                  </p>
                </div>
              </div> */}
            </div>
          </div>
        </div>

        <div className="row gx-3">
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
        </div>
      </BaseLayout>
    </>
  );
};