import Menu from "../../components/organisms/Menu";
import Footer from "../../components/organisms/Footer";


export default function MerchantInformationPage() {
  return (
    <>
      <div className="app-wrapper">
        <Menu />
        <div className="page-content">
          <div className="container-fluid">
            <div className="d-flex flex-column gap-3 justify-content-center card">
              <div className="card-body">
                <h4 className="text-left pb-3">Informasi Merchant</h4>
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
                    <div>
                      <span>Nama Toko</span>
                      <h4>Merchant Official Shop</h4>
                    </div>
                    <div>
                      <span>Deskripsi Toko</span>
                      <p className="text-black">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        Integer nec odio. Praesent libero. Sed cursus ante
                        dapibus diam. Sed nisi.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </>
  );
};