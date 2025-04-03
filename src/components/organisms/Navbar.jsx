import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

import MerchantModal from "../organisms/ModalAddMerchant";

const Navbar = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const dropdownRef = useRef(null);
    const modalRef = useRef(null);

    const toggleDropdown = () => {
        setShowDropdown((prev) => !prev);
    };

    const closeModal = () => setShowModal(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showModal && modalRef.current && !modalRef.current.contains(event.target)) {
                setShowModal(false);
            }            
            // if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            //     setShowDropdown(false);
            // }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

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
                            <div className="topbar-item position-relative" ref={dropdownRef}>
                                <button type="button" className="btn" style={{ backgroundColor: "#8042D4", color: "white" }} onClick={toggleDropdown}>
                                    Switch Merchant
                                </button>
                                {showDropdown && (
                                    <div className="dropdown-menu show position-absolute shadow p-2 rounded" style={{ width: "200px" }}>
                                        <div style={{ cursor: "pointer" }}>
                                            <div className="d-flex align-items-center">
                                                <img
                                                    src="../../assets/images/users/avatar-5.jpg"
                                                    alt="User"
                                                    className="rounded-circle me-2"
                                                    width="40"
                                                    height="40"
                                                />
                                                <div>
                                                    <strong>Madam Lain</strong>
                                                    <p className="mb-0 text-muted">Toko Pakaian</p>
                                                </div>
                                            </div>
                                            <label className="text-center pt-1" style={{ color: "#008D2FFF" }}>Session Active</label>
                                        </div>
                                        <hr />
                                        <div style={{ cursor: "pointer" }}>
                                            <div className="d-flex align-items-center">
                                                <img
                                                    src="../../assets/images/users/avatar-3.jpg"
                                                    alt="User"
                                                    className="rounded-circle me-2"
                                                    width="40"
                                                    height="40"
                                                />
                                                <div>
                                                    <strong>Sir Francisco</strong>
                                                    <p className="mb-0 text-muted">Toko Mainan</p>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center gap-1">
                                                <label className="text-danger text-center">Session Expired</label>
                                                <div className="position-relative">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        style={{ cursor: "pointer" }}
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 24 24"
                                                        title="Klik to refresh session"
                                                    >
                                                        <path fill="currentColor" d="M12 20q-3.35 0-5.675-2.325T4 12t2.325-5.675T12 4q1.725 0 3.3.712T18 6.75V4h2v7h-7V9h4.2q-.8-1.4-2.187-2.2T12 6Q9.5 6 7.75 7.75T6 12t1.75 4.25T12 18q1.925 0 3.475-1.1T17.65 14h2.1q-.7 2.65-2.85 4.325T12 20" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                        <hr />
                                        <button className="btn btn-outline-primary w-100 fs-5" onClick={() => setShowModal(true)}>Add Merchant +</button>
                                    </div>
                                )}
                            </div>

                            {showModal &&
                                    createPortal(
                                        <MerchantModal onClose={closeModal} />,
                                        document.body
                                    )
                            }

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