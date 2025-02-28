import { useState } from "react";

const Navbar = () => {
    const [searchValue, setSearchValue] = useState("");
    
    return (
        <>
            <header className="app-topbar">
                <div className="container-fluid">
                    <div className="navbar-header">
                        <div className="d-flex align-items-center gap-2">
                            <div className="topbar-item">
                                <button type="button" className="button-toggle-menu topbar-button">
                                    <iconify-icon icon="solar:hamburger-menu-outline"
                                        className="fs-24 align-middle"></iconify-icon>
                                </button>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <div className="topbar-item">
                                <button type="button" className="topbar-button" id="light-dark-mode">
                                    <iconify-icon icon="solar:moon-outline"
                                        className="fs-22 align-middle light-mode"></iconify-icon>
                                    <iconify-icon icon="solar:sun-2-outline"
                                        className="fs-22 align-middle dark-mode"></iconify-icon>
                                </button>
                            </div>

                            <div className="dropdown topbar-item">
                                <a type="button" className="topbar-button" id="page-header-user-dropdown" data-bs-toggle="dropdown"
                                    aria-haspopup="true" aria-expanded="false">
                                    <span className="d-flex align-items-center">
                                        <img className="rounded-circle" width="32" src="../../assets/images/users/avatar-1.jpg"
                                            alt="avatar-3" />
                                    </span>
                                </a>
                                <div className="dropdown-menu dropdown-menu-end">
                                    <a className="dropdown-item" href="#">
                                        <iconify-icon icon="solar:user-outline"
                                            className="align-middle me-2 fs-18"></iconify-icon><span className="align-middle">My
                                                Account</span>
                                    </a>

                                    <div className="dropdown-divider my-1"></div>

                                    <a className="dropdown-item text-danger" href="auth-signin.php">
                                        <iconify-icon icon="solar:logout-3-outline"
                                            className="align-middle me-2 fs-18"></iconify-icon><span
                                                className="align-middle">Logout</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        </>
    )
};

export default Navbar;