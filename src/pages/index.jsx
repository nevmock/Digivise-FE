import Menu from "../components/organisms/Menu";
import Footer from "../components/organisms/Footer";

export default function Home() {
    return (
        <>
            <html lang="en">
                {/* <!-- START Wrapper --> */}
                <div className="app-wrapper">
                    <Menu />
                    <div className="page-content">
                        <div className="container-fluid">
                            <div className="row d-flex justify-content-center align-items-center">
                                <h1 className="text-dark text-center">WELCOME TO DIGIVISE APP</h1>
                            </div>
                        </div>
                        <Footer />
                    </div>
                </div>
                {/* <!-- END Wrapper --> */}
            </html>
        </>
    )
};