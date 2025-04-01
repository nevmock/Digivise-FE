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

                        {/* <li className="menu-title">UI Kit...</li>

                        <li className="nav-item">
                            <a className="nav-link menu-arrow" href="#sidebarBaseUI" data-bs-toggle="collapse" role="button"
                                aria-expanded="false" aria-controls="sidebarBaseUI">
                                <span className="nav-icon"><iconify-icon icon="mingcute:leaf-line"></iconify-icon></span>
                                <span className="nav-text"> Base UI </span>
                            </a>
                            <div className="collapse" id="sidebarBaseUI">
                                <ul className="nav sub-navbar-nav">
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="ui-accordion.php">Accordion</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="ui-alerts.php">Alerts</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="ui-avatar.php">Avatar</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="ui-badge.php">Badge</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="ui-breadcrumb.php">Breadcrumb</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="ui-buttons.php">Buttons</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="ui-card.php">Card</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="ui-carousel.php">Carousel</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="ui-collapse.php">Collapse</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="ui-dropdown.php">Dropdown</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="ui-list-group.php">List Group</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="ui-modal.php">Modal</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="ui-tabs.php">Tabs</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="ui-offcanvas.php">Offcanvas</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="ui-pagination.php">Pagination</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="ui-placeholders.php">Placeholders</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="ui-popovers.php">Popovers</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="ui-progress.php">Progress</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="ui-scrollspy.php">Scrollspy</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="ui-spinners.php">Spinners</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="ui-toasts.php">Toasts</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="ui-tooltips.php">Tooltips</a>
                                    </li>
                                </ul>
                            </div>
                        </li>

                        <li className="nav-item">
                            <a className="nav-link" href="charts.php">
                                <span className="nav-icon">
                                    <iconify-icon icon="mingcute:chart-bar-line"></iconify-icon>
                                </span>
                                <span className="nav-text"> Apex Charts </span>
                            </a>
                        </li>

                        <li className="nav-item">
                            <a className="nav-link menu-arrow" href="#sidebarForms" data-bs-toggle="collapse" role="button"
                                aria-expanded="false" aria-controls="sidebarForms">
                                <span className="nav-icon">
                                    <iconify-icon icon="mingcute:box-line"></iconify-icon>
                                </span>
                                <span className="nav-text"> Forms </span>
                            </a>
                            <div className="collapse" id="sidebarForms">
                                <ul className="nav sub-navbar-nav">
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="forms-basic.php">Basic Elements</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="forms-flatpicker.php">Flatpicker</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="forms-validation.php">Validation</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="forms-fileuploads.php">File Upload</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="forms-editors.php">Editors</a>
                                    </li>
                                </ul>
                            </div>
                        </li>

                        <li className="nav-item">
                            <a className="nav-link menu-arrow" href="#sidebarTables" data-bs-toggle="collapse" role="button"
                                aria-expanded="false" aria-controls="sidebarTables">
                                <span className="nav-icon">
                                    <iconify-icon icon="mingcute:table-line"></iconify-icon>
                                </span>
                                <span className="nav-text"> Tables </span>
                            </a>
                            <div className="collapse" id="sidebarTables">
                                <ul className="nav sub-navbar-nav">
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="tables-basic.php">Basic Tables</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="tables-gridjs.php">Grid Js</a>
                                    </li>
                                </ul>
                            </div>
                        </li>

                        <li className="nav-item">
                            <a className="nav-link menu-arrow" href="#sidebarIcons" data-bs-toggle="collapse" role="button"
                                aria-expanded="false" aria-controls="sidebarIcons">
                                <span className="nav-icon">
                                    <iconify-icon icon="mingcute:dribbble-line"></iconify-icon>
                                </span>
                                <span className="nav-text"> Icons </span>
                            </a>
                            <div className="collapse" id="sidebarIcons">
                                <ul className="nav sub-navbar-nav">
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="icons-boxicons.php">Boxicons</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="icons-solar.php">Solar Icons</a>
                                    </li>
                                </ul>
                            </div>
                        </li>

                        <li className="nav-item">
                            <a className="nav-link menu-arrow" href="#sidebarMaps" data-bs-toggle="collapse" role="button"
                                aria-expanded="false" aria-controls="sidebarMaps">
                                <span className="nav-icon">
                                    <iconify-icon icon="mingcute:map-line"></iconify-icon>
                                </span>
                                <span className="nav-text"> Maps </span>
                            </a>
                            <div className="collapse" id="sidebarMaps">
                                <ul className="nav sub-navbar-nav">
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="maps-google.php">Google Maps</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="maps-vector.php">Vector Maps</a>
                                    </li>
                                </ul>
                            </div>
                        </li>

                        <li className="menu-title">Other</li>

                        <li className="nav-item">
                            <a className="nav-link menu-arrow" href="#sidebarLayouts" data-bs-toggle="collapse" role="button"
                                aria-expanded="false" aria-controls="sidebarLayouts">
                                <span className="nav-icon">
                                    <iconify-icon icon="mingcute:layout-line"></iconify-icon>
                                </span>
                                <span className="nav-text"> Layouts </span>
                            </a>
                            <div className="collapse" id="sidebarLayouts">
                                <ul className="nav sub-navbar-nav">
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="layouts-dark-sidenav.php" target="_blank">Dark
                                            Sidenav</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="layouts-dark-topnav.php" target="_blank">Dark
                                            Topnav</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="layouts-small-sidenav.php" target="_blank">Small
                                            Sidenav</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="layouts-hidden-sidenav.php" target="_blank">Hidden
                                            Sidenav</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" target="_blank" href="layouts-light.php">
                                            <span className="nav-text">Light Mode</span>
                                            <span className="badge badge-soft-danger badge-pill text-end">Hot</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </li>

                        <li className="nav-item">
                            <a className="nav-link menu-arrow" href="#sidebarMultiLevelDemo" data-bs-toggle="collapse" role="button"
                                aria-expanded="false" aria-controls="sidebarMultiLevelDemo">
                                <span className="nav-icon">
                                    <iconify-icon icon="mingcute:menu-line"></iconify-icon>
                                </span>
                                <span className="nav-text"> Menu Item </span>
                            </a>
                            <div className="collapse" id="sidebarMultiLevelDemo">
                                <ul className="nav sub-navbar-nav">
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link" href="">Menu Item 1</a>
                                    </li>
                                    <li className="sub-nav-item">
                                        <a className="sub-nav-link  menu-arrow" href="#sidebarItemDemoSubItem"
                                            data-bs-toggle="collapse" role="button" aria-expanded="false"
                                            aria-controls="sidebarItemDemoSubItem">
                                            <span> Menu Item 2 </span>
                                        </a>
                                        <div className="collapse" id="sidebarItemDemoSubItem">
                                            <ul className="nav sub-navbar-nav">
                                                <li className="sub-nav-item">
                                                    <a className="sub-nav-link" href="">Menu Sub item</a>
                                                </li>
                                            </ul>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </li>

                        <li className="nav-item">
                            <a className="nav-link disabled" href="">
                                <span className="nav-icon">
                                    <iconify-icon icon="mingcute:close-circle-line"></iconify-icon>
                                </span>
                                <span className="nav-text"> Disable Item </span>
                            </a>
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