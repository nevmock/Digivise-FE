const Sidebar = () => {
    const MenuSidebar = [   
        {
            name: "Dashboard",
            requireMerchant: false,
            path: "/dashboard",
            icon: "home",
            subMenu: [] || null,
        },
        {
            name: "Merchant",
            requireMerchant: true,
            path: "/dashboard/merchant",
            icon: "store",
            subMenu: [
                { name: "Information", path: "/dashboard/merchant-information" },
                { name: "Custom KPI", path: "/dashboard/merchant-kpi" },
            ],
        },
        {
            name: "Performance",
            requireMerchant: true,
            path: "/dashboard/performance",
            icon: "speed",
            subMenu: [
                { name: "Stock", path: "/dashboard/performance/stock" },
                { name: "Product", path: "/dashboard/performance/product" },
                { name: "Ads", path: "/dashboard/performance/ads" },
            ],
        }
    ];

    const renderIconSidebarMenu = (icon) => {
        switch (icon) {
            case "home":
                return <iconify-icon icon="mingcute:home-3-line"></iconify-icon>;
            case "store":
                return <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24"><path fill="currentColor" d="M14 22v-3h8v3zM2 20V4h20v7h-2V6h-7v5h-2v9zm10.8-2l1-5h8.4l1 5zM5 16h5v-2H5zm0-3h5v-2H5zm0-3h5V8H5zm9 0V8h5v2z"></path></svg>;
            case "speed":
                return <iconify-icon icon="mingcute:leaf-line"></iconify-icon>;
            default:
                return null;
        }
    };

    return (
        <>
            <div className="app-sidebar">
                <div className="logo-box">
                    <img src="/assets/images/logo.png" className="logo-lg" alt="" />
                    <img src="/assets/images/logo-sm.png" className="logo-sm" alt="" />
                </div>
                <div className="scrollbar" data-simplebar>
                    <ul className="navbar-nav" id="navbar-nav">
                        {
                            MenuSidebar.map((menu, index) => {
                                // if (menu.requireMerchant && !activeMerchant) {
                                //     return null;
                                // }

                                const hasSubMenu = menu.subMenu.length > 0 && menu.subMenu !== null;
                                return (
                                    <li className="nav-item" key={index}>
                                        <a 
                                            className={`nav-link ${hasSubMenu ? "menu-arrow" : ""}`} 
                                            href={
                                                hasSubMenu ? menu.name === "Merchant" ? "#sidebarMultiLevelDemo" : menu.name === "Performance" ? "#sidebarBaseUI" : "" : menu.path
                                            }
                                            {...(menu.name !== "Dashboard" && {
                                                "data-bs-toggle": "collapse",
                                                role: "button",
                                                "aria-expanded": "false",
                                                "aria-controls": menu.name === "Merchant" ? "sidebarMultiLevelDemo" : menu.name === "Performance" ? "sidebarBaseUI" : "",
                                            })}
                                        >
                                            <span className="nav-icon">
                                                {renderIconSidebarMenu(menu.icon)}
                                            </span>
                                            <span className="nav-text"> {menu.name} </span>
                                        </a>
                                        {
                                            menu.subMenu.length > 0 && (
                                                <div className="collapse" id={menu.name === "Merchant" ? "sidebarMultiLevelDemo" : menu.name === "Performance" ? "sidebarBaseUI" : ""}>
                                                    <ul className="nav sub-navbar-nav">
                                                        {
                                                            menu.subMenu.map((subMenu, subIndex) => (
                                                                <li className="sub-nav-item" key={subIndex}>
                                                                    <a className="sub-nav-link" href={subMenu.path}>{subMenu.name}</a>
                                                                </li>
                                                            ))
                                                        }
                                                    </ul>
                                                </div>
                                            )
                                        }
                                    </li>
                                )
                            })
                        }
                        {/* <li className="nav-item">
                            <a className="nav-link" href="/dashboard">
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
                                        <a className="sub-nav-link" href="/dashboard/merchant-information">Information</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="/dashboard/merchant-kpi">Custom KPI</a>
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
                                        <a className="sub-nav-link" href="/dashboard/performance/stock">Stock</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="/dashboard/performance/product">Product</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="/dashboard/performance/ads">Ads</a>
                                    </li>
                                </ul>
                            </div>
                        </li> */}
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