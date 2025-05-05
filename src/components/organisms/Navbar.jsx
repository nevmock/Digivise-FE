import { useState, useRef, useEffect, use } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { useAuth } from "../../context/Auth";
import { logout } from "../../resolver/auth/authApp";
import CreateMerchantModal from "../organisms/ModalAddMerchant";
import LoginMerchantModal from "../organisms/ModalLoginMerchant";
import axiosRequest from "../../utils/request";


const Navbar = () => {
    const { logoutSuccess } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showModalFormCreateMerchant, setShowModalFormCreateMerchant] = useState(false);
    const [showModalFormLoginMerchant, setShowModalFormLoginMerchant] = useState(false);
    const dropdownRef = useRef(null);
    const modalRef = useRef(null);
    const navigate = useNavigate();
    const [themeMode, setThemeMode] = useState(() => localStorage.getItem("appModeTheme") || "light");
    const [merchantList, setMerchantList] = useState([]);
    
    const toggleTheme = () => {
        setThemeMode(prev => (prev === "light" ? "dark" : "light"));
    };
    const toggleDropdown = () => {
        setShowDropdown((prev) => !prev);
    };
    const closeModalCreateMerchant = () => setShowModalFormCreateMerchant(false);
    const closeModalLoginMerchant = () => setShowModalFormLoginMerchant(false);
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showModalFormCreateMerchant && modalRef.current && !modalRef.current.contains(event.target)) {
                setShowModalFormCreateMerchant(false);
            }  
            if (showDropdown && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }   
            if (showModalFormLoginMerchant && modalRef.current && !modalRef.current.contains(event.target)) {
                setShowModalFormLoginMerchant(false);
            }       
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute("data-bs-theme", themeMode);
        localStorage.setItem("appModeTheme", themeMode);
    }, [themeMode]);

    const handleClickLogout = async () => {
        setIsLoading(true);
        try {
            await logout();
            logoutSuccess();
            toast.success("Logout berhasil!");
            navigate("/");
        } catch (error) {
            toast.error("Logout gagal, silakan coba lagi");
            console.error("Gagal logout, error pada server:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getMerchantList = async () => {
        try {
            const getUserData = localStorage.getItem("userDataApp");
            const response = await axiosRequest.get(`/api/merchants/user/${JSON.parse(getUserData).userId}`);
            if (response.status === 200) {
                setMerchantList(response.data);
            }
        }
        catch (error) {
            console.error("Error saat mengambil daftar merchant:", error);
        }
    }

    useEffect(() => {
        getMerchantList();
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
                                        className="align-middle" 
                                        style={{ fontSize: "22px", verticalAlign: "middle" }}></iconify-icon>
                                </button>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <div className="topbar-item position-relative" ref={dropdownRef}>
                                {merchantList.length > 0 ? (
                                    <>
                                        <button type="button" className="btn" style={{ backgroundColor: "#8042D4", color: "white" }} onClick={toggleDropdown}>
                                            Switch Merchant
                                        </button>
                                        
                                        {showDropdown && (
                                            <div className="dropdown-menu show position-absolute shadow p-2 rounded" style={{ width: "200px" }}>
                                                {
                                                    merchantList.map((merchant, index) => (
                                                        <>
                                                            <div style={{ cursor: "pointer" }}>
                                                                <div className="d-flex align-items-center">
                                                                    <img
                                                                        src={merchant.merchantLogo || "../../assets/images/users/avatar-1.jpg"}
                                                                        className="rounded-circle me-2"
                                                                        width="40"
                                                                        height="40"
                                                                    />
                                                                    <div>
                                                                        <strong>{merchant.merchantName}</strong>
                                                                        <p className="mb-0 text-muted">{merchant.merchantShopeeId}</p>
                                                                    </div>
                                                                </div>
                                                                <label className="text-center pt-1" style={{ color: "#008D2FFF" }}>Session Active</label>
                                                            </div>
                                                            <hr />
                                                        </>
                                                    ))
                                                }
                                                <button className="btn btn-outline-primary w-100 fs-5" onClick={() => setShowModalFormCreateMerchant(true)}>Add Merchant +</button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <button type="button" className="btn" style={{ backgroundColor: "#8042D4", color: "white" }} onClick={() => setShowModalFormCreateMerchant(true)}>
                                            Create Merchant
                                        </button>
                                    </>
                                )}
                            </div>

                            {showModalFormCreateMerchant &&
                                createPortal(
                                    <CreateMerchantModal onClose={closeModalCreateMerchant} />,
                                    document.body
                                )
                            }
                            
                            {showModalFormLoginMerchant &&
                                createPortal(
                                    <LoginMerchantModal onClose={closeModalLoginMerchant} />,
                                    document.body
                                )
                            }

                            <div className="topbar-item">
                                <button type="button" className="topbar-button" id="light-dark-mode" onClick={toggleTheme}>
                                    {themeMode === "light" ? (
                                        <iconify-icon icon="solar:moon-outline" class="fs-22 align-middle light-mode" />
                                    ) : (
                                        <iconify-icon icon="solar:sun-2-outline" class="fs-22 align-middle dark-mode" />
                                    )}
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
                                    <a className="dropdown-item d-flex align-items-center gap-1 custom-cursor-pointer">
                                        <iconify-icon icon="solar:user-outline"
                                            className="align-middle fs-18"></iconify-icon><span className="align-middle">My
                                                Account</span>
                                    </a>

                                    <div className="dropdown-divider my-1"></div>

                                    <button className="dropdown-item text-danger d-flex align-items-center gap-1 custom-cursor-pointer" onClick={handleClickLogout} >
                                        <iconify-icon icon="solar:logout-3-outline"
                                            className="align-middle fs-18"></iconify-icon><span
                                                className="align-middle">Logout</span>
                                    </button>
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