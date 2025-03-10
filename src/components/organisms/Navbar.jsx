import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

const Navbar = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const dropdownRef = useRef(null);

    const toggleDropdown = () => {
        setShowDropdown((prev) => !prev);
    };
    const closeModal = () => setShowModal(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
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
                                <button type="button" className="btn btn-primary" onClick={toggleDropdown}>
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
                            )}

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

function MerchantModal({ onClose }) {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        phone: "",
        sector_industry: "",
        office_address: "",
        factory_address: "",
    });

    const [errors, setErrors] = useState({});

    const validate = () => {
        let newErrors = {};

        if (!formData.username) newErrors.username = "Username required";
        if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = "Email not valid";
        if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
        if (!formData.phone.match(/^\d+$/)) newErrors.phone = "Phone number must be a number";
        if (!formData.sector_industry) newErrors.sector_industry = "Sector industry required";
        if (!formData.office_address) newErrors.office_address = "Office address required";
        if (!formData.factory_address) newErrors.factory_address = "Factory address required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        window.location.href = "/";
    };

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
            style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050 }}
        >
            <div className="bg-white p-4 rounded shadow-lg" style={{ width: "400px" }}>
                <h5 className="text-center">Add Merchant</h5>
                <hr />
                <form onSubmit={handleSubmit}>
                    <div className="mb-2">
                        <label className="form-label">Username</label>
                        <input
                            type="text"
                            className={`form-control ${errors.username ? "is-invalid" : ""}`}
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                        <div className="invalid-feedback">{errors.username}</div>
                    </div>

                    <div className="mb-2">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className={`form-control ${errors.email ? "is-invalid" : ""}`}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        <div className="invalid-feedback">{errors.email}</div>
                    </div>

                    <div className="mb-2">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className={`form-control ${errors.password ? "is-invalid" : ""}`}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        <div className="invalid-feedback">{errors.password}</div>
                    </div>

                    <div className="mb-2">
                        <label className="form-label">Phone number</label>
                        <input
                            type="text"
                            className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                        <div className="invalid-feedback">{errors.phone}</div>
                    </div>

                    <div className="mb-2">
                        <label className="form-label">Sector Industry</label>
                        <input
                            type="text"
                            className={`form-control ${errors.sector_industry ? "is-invalid" : ""}`}
                            value={formData.sector_industry}
                            onChange={(e) => setFormData({ ...formData, sector_industry: e.target.value })}
                        />
                        <div className="invalid-feedback">{errors.sector_industry}</div>
                    </div>

                    <div className="mb-2">
                        <label className="form-label">Office Address</label>
                        <input
                            type="text"
                            className={`form-control ${errors.office_address ? "is-invalid" : ""}`}
                            value={formData.office_address}
                            onChange={(e) => setFormData({ ...formData, office_address: e.target.value })}
                        />
                        <div className="invalid-feedback">{errors.office_address}</div>
                    </div>

                    <div className="mb-2">
                        <label className="form-label">Factory Address</label>
                        <input
                            type="text"
                            className={`form-control ${errors.factory_address ? "is-invalid" : ""}`}
                            value={formData.factory_address}
                            onChange={(e) => setFormData({ ...formData, factory_address: e.target.value })}
                        />
                        <div className="invalid-feedback">{errors.factory_address}</div>
                    </div>

                    <button type="submit" className="btn btn-primary w-100">Add Merchant</button>
                    <button type="button" className="btn btn-secondary w-100 mt-2" onClick={onClose}>Cancel</button>
                </form>
            </div>
        </div>
    );
}