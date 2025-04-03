import Menu from "../../components/organisms/Menu";
import Footer from "../../components/organisms/Footer";

export default function BaseLayout({ children }) {
    return (
        <>
            <html lang="en">
                <div className="app-wrapper">
                    <Menu />
                    <div className="page-content">
                        <div className="container-fluid">
                            {children}
                        </div>
                        <Footer />
                    </div>
                </div>
            </html>
        </>
    );
};