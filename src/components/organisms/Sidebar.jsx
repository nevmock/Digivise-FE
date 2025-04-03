const Sidebar = () => {
    return (
        <>
            <div className="app-sidebar">
                <div className="logo-box">
                    <img src="/assets/images/logo.png" className="logo-lg" alt="" />
                    <img src="/assets/images/logo-sm.png" className="logo-sm" alt="" />
                </div>

                <div className="scrollbar" data-simplebar>
                    <ul className="navbar-nav" id="navbar-nav">
                        <li className="nav-item">
                            <a className="nav-link" href="/">
                                <span className="nav-icon">
                                    <iconify-icon icon="mingcute:home-3-line"></iconify-icon>
                                </span>
                                <span className="nav-text"> Dashboard </span>
                            </a>
                        </li>

                        <li className="nav-item">
                            <a className="nav-link menu-arrow" href="#sidebarBaseUI" data-bs-toggle="collapse" role="button"
                                aria-expanded="false" aria-controls="sidebarBaseUI">
                                <span className="nav-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24"><path fill="currentColor" d="M14 22v-3h8v3zM2 20V4h20v7h-2V6h-7v5h-2v9zm10.8-2l1-5h8.4l1 5zM5 16h5v-2H5zm0-3h5v-2H5zm0-3h5V8H5zm9 0V8h5v2z"></path></svg>
                                </span>
                                <span className="nav-text"> Merchant </span>
                            </a>
                            <div className="collapse" id="sidebarBaseUI">
                                <ul className="nav sub-navbar-nav">
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="/merchant-information">Information</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="/merchant-kpi">Custom KPI</a>
                                    </li>
                                </ul>
                            </div>
                        </li>

                        <li className="nav-item">
                            <a className="nav-link menu-arrow" href="#sidebarMultiLevelDemo" data-bs-toggle="collapse" role="button"
                                aria-expanded="false" aria-controls="sidebarMultiLevelDemo">
                                <span className="nav-icon">
                                    <iconify-icon icon="mingcute:leaf-line"></iconify-icon>
                                </span>
                                <span className="nav-text"> Performance </span>
                            </a>
                            <div className="collapse" id="sidebarMultiLevelDemo">
                                <ul className="nav sub-navbar-nav">
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="/performance/stock">Stock</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="/performance/product">Product</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="/performance/ads">Ads</a>
                                    </li>
                                </ul>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

            {/* <div className="animated-stars">
                <div className="shooting-star"></div>
                <div className="shooting-star"></div>
                <div className="shooting-star"></div>
                <div className="shooting-star"></div>
                <div className="shooting-star"></div>
                <div className="shooting-star"></div>
                <div className="shooting-star"></div>
                <div className="shooting-star"></div>
                <div className="shooting-star"></div>
                <div className="shooting-star"></div>
                <div className="shooting-star"></div>
                <div className="shooting-star"></div>
                <div className="shooting-star"></div>
                <div className="shooting-star"></div>
                <div className="shooting-star"></div>
                <div className="shooting-star"></div>
                <div className="shooting-star"></div>
                <div className="shooting-star"></div>
                <div className="shooting-star"></div>
                <div className="shooting-star"></div>
            </div> */}
        </>
    );
};

export default Sidebar;