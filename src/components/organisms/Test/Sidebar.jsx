import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Sidebar = () => {
    const pathLocation = useLocation();
    const navigate = useNavigate();
    const [openDropdown, setOpenDropdown] = useState({ merchant: false, performance: false });

    useEffect(() => {
        if (pathLocation.pathname.startsWith("/merchant-")) {
            setOpenDropdown((prev) => ({ ...prev, merchant: true }));
        } else if (pathLocation.pathname.startsWith("/performance-")) {
            setOpenDropdown((prev) => ({ ...prev, performance: true }));
        }
    }, [pathLocation.pathname]);

    const toggleDropdown = (menu) => {
        setOpenDropdown((prevState) => ({
            ...prevState,
            [menu]: !prevState[menu],
        }));
    };

    return (
        <div className="d-flex flex-column bg-black text-white h-100 justify-content-between">
            <div className="py-3">
                <Link
                    to="/"
                    className="text-white link-offset-2 link-underline link-underline-opacity-0"
                >
                    <h1 className="fs-1 fw-bold mb-3 text-center">MENU</h1>
                </Link>
                <ul className="fw-light h-full nav flex-column">
                    <li className="nav-item py-2 ps-3">
                        <Link
                            to="/"
                            className={`nav-link fs-4 ${pathLocation.pathname === "/"
                                    ? " bg-info-subtle text-black"
                                    : "text-white"
                                } hover-effect`}
                        >
                            HOME
                        </Link>
                    </li>
                    <div style={{ height: `4px` }} className="bg-white"></div>
                    {/* Merchant Menu */}
                    <li className="nav-item py-1">
                        <div
                            className={`d-flex justify-content-between align-items-center nav-link ps-4 ${openDropdown.merchant ? "text-white" : "text-white"
                                }`}
                            onClick={() => toggleDropdown("merchant")}
                            style={{ cursor: "pointer" }}
                        >
                            <span className="fs-4">Merchant</span>
                            <i
                                className={`bi bi-chevron-${openDropdown.merchant ? "up" : "down"}`}
                            ></i>
                        </div>
                        {openDropdown.merchant && (
                            <ul className="nav flex-column gap-1 bg-dark ps-3">
                                <li className="nav-item">
                                    <Link
                                        to="/dashboard/merchant-information"
                                        className={`nav-link py-[5px] fs-4 ${pathLocation.pathname === "/merchant-information"
                                                ? " bg-info-subtle text-black"
                                                : "text-white"
                                            } hover-effect`}
                                    >
                                        Information
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link
                                        to="/dashboard/merchant-kpi"
                                        className={`nav-link fs-4 ${pathLocation.pathname === "/merchant-kpi"
                                                ? " bg-info-subtle text-black"
                                                : "text-white"
                                            } hover-effect`}
                                    >
                                        Custom KPI
                                    </Link>
                                </li>
                            </ul>
                        )}
                    </li>
                    <div style={{ height: `4px` }} className="bg-white"></div>  
                    {/* Perfomance Menu */}
                    <li className="nav-item py-1">
                        <div
                            className={`d-flex justify-content-between align-items-center nav-link ps-4 ${openDropdown.performance ? "text-white" : "text-white"
                                }`}
                            onClick={() => toggleDropdown("performance")}
                            style={{ cursor: "pointer" }}
                        >
                            <span className="fs-4">Performance</span>
                            <i
                                className={`bi bi-chevron-${openDropdown.merchant ? "up" : "down"
                                    }`}
                            ></i>
                        </div>
                        {openDropdown.performance && (
                            <ul className="nav flex-column gap-1 bg-dark ps-3">
                                <li className="nav-item">
                                    <Link
                                        to="/dashboard/performance/product"
                                        className={`nav-link py-[5px] fs-4 ${pathLocation.pathname === "/performance-information"
                                                ? " bg-info-subtle text-black"
                                                : "text-white"
                                            } hover-effect`}
                                    >
                                        Product
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link
                                        to="/dashboard/performance/ads"
                                        className={`nav-link fs-4 ${pathLocation.pathname === "/performance-kpi"
                                                ? " bg-info-subtle text-black"
                                                : "text-white"
                                            } hover-effect`}
                                    >
                                        Ads
                                    </Link>
                                </li>
                            </ul>
                        )}
                    </li>
                </ul>
            </div>
            {/* <div className="p-3">
                <button
                    type="submit"
                    className="btn btn-danger w-100 fw-medium"
                    style={{ color: "white" }}
                    disabled={isLoading}
                    onClick={handleSubmit}
                >
                    {isLoading ? (
                        <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden ">Loading...</span>
                        </div>
                    ) : (
                        "Sign Out"
                    )}
                </button>
            </div> */}
        </div>
    );
};

export default Sidebar;