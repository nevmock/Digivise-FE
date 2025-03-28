import BaseLayout from "../../components/organisms/BaseLayout";

export default function MerchantInformationPage() {
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
                  className="rounded-circle"
                  width="100"
                  src="../../assets/images/users/avatar-1.jpg"
                  alt="avatar-3"
                />
              </span>
              <div className="d-flex flex-column gap-1">
                <div className="d-flex flex-column">
                  <span>Nama Toko</span>
                  <h4>Merchant Official Shop</h4>
                </div>
                <div>
                  <span>Deskripsi Toko</span>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Integer nec odio. Praesent libero. Sed cursus ante
                    dapibus diam. Sed nisi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row row-cols-lg-2 gx-3">
          <div className="col">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">Matrix Peforma Toko</h5>
              </div>

              <div class="card-body">
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

          <div className="col">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">Matrix Iklan</h5>
              </div>

              <div class="card-body">
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