import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { IoMdRefresh } from "react-icons/io";

import { useAuth } from "../../context/Auth";
import { logout } from "../../resolver/auth/authApp";
import axiosRequest from "../../utils/request";
import CreateMerchantModal from "../organisms/ModalAddMerchant";
import LoginMerchantUsernameModal from "./ModalLoginUsernameMerchant";
import ModalOtpByUsername from "./ModalOtpByUsername";
import avatarProfile from "../../assets/images/users/avatar-1.jpg";
import convertNotifySessionExpired from "../../utils/convertNotifySessionExpired";


const Navbar = () => {
    const { userData, logoutSuccess } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showModalFormCreateMerchant, setShowModalFormCreateMerchant] = useState(false);
    const [showModalFormLoginUsernameMerchant, setShowModalFormLoginUsernameMerchant] = useState(false);
    const [showModalFormOTPUsername, setShowModalFormOTPUsername] = useState(false);
    const [selectedMerchant, setSelectedMerchant] = useState(null);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const [themeMode, setThemeMode] = useState(() => localStorage.getItem("appModeTheme") || "light");
    const [userNow, setUserNow] = useState(null);
    const [isLoading, setIsLoading] = useState(false);


    const fetchGetCurrentUser = async () => {
        setIsLoading(true);
        try {
            const response = await axiosRequest.get(`/api/users/${userData.userId}`);
            if (response.status === 200 || response) {
                const currentUser = response.data;
                setUserNow(currentUser);
            } else {
                console.error("Gagal mengambil data pengguna saat ini, status:", response.status);
            }

        } catch (error) {
        console.error("Error fetching current user:", error);
        } finally {
        setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchGetCurrentUser();
    }, [userData.userId]);

    const toggleTheme = () => {
        setThemeMode(prev => (prev === "light" ? "dark" : "light"));
    };

    const toggleDropdown = () => {
        setShowDropdown((prev) => !prev);
    };

    const closeModalCreateMerchant = () => setShowModalFormCreateMerchant(false);
    const closeModalLoginMerchant = () => setShowModalFormLoginUsernameMerchant(false);
    const closeModalOTPUsername = () => setShowModalFormOTPUsername(false);

    const handleOpenLoginModal = (merchant) => {
        setSelectedMerchant(merchant);
        setShowModalFormLoginUsernameMerchant(true);
    };

    const handleOTPRequired = (merchant) => {
        setSelectedMerchant(merchant);
        setShowModalFormOTPUsername(true);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showDropdown && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showDropdown]);

    useEffect(() => {
        document.documentElement.setAttribute("data-bs-theme", themeMode);
        localStorage.setItem("appModeTheme", themeMode);
    }, [themeMode]);

    const handleLogout = async () => {
        setIsLoading(true);

        try {
            await logout();
            logoutSuccess();
            navigate("/");
            toast.success("Logout berhasil!");
        } catch (error) {
            toast.error("Logout gagal, silakan coba lagi");
            console.error("Gagal logout, kesalahan pada server :", error);
        } finally {
            setIsLoading(false);
        }
    };

    const activeMerchant = userNow?.activeMerchant || null;

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
                                {userNow?.merchants && userNow?.merchants.length > 0 ? (
                                    <>
                                        <button type="button" className="btn btn-primary" onClick={toggleDropdown}>
                                            Switch Merchant
                                        </button>
                                        
                                        {showDropdown && (
                                            <div className="dropdown-menu show position-absolute shadow p-2 rounded" style={{ width: "220px" }}>
                                                {userNow?.merchants.map((merchant) => (
                                                    <div key={merchant.id} id="custom-hover-login-navbar" className="d-flex flex-column mb-2 position-relative"
                                                        style={{
                                                            cursor: "pointer",
                                                            borderRadius: "5px",
                                                            justifyContent: "center",
                                                            padding: "8px 8px", 
                                                            backgroundColor: activeMerchant?.id === merchant.id ? "#7F42D421" : "transparent"
                                                        }}
                                                    >
                                                        <span className="custom-tooltip">Login ke {merchant.name}</span>
                                                        <div className="d-flex align-items-center">
                                                            <img
                                                                src={avatarProfile}
                                                                className="rounded-circle me-2"
                                                                width="40"
                                                                height="40"
                                                            />
                                                            <div className="d-flex flex-column flex-grow-1">
                                                                <div className="d-flex flex-column gap-1">
                                                                    <strong>{activeMerchant?.id === merchant.id ? activeMerchant.name : merchant.name}</strong>
                                                                    <p style={{ margin: 0, fontSize: "11px" }} className={`text-${convertNotifySessionExpired(merchant.lastLogin).type == "urgent" ? "danger" : "success"}`}>
                                                                        {convertNotifySessionExpired(merchant.lastLogin).text}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex-grow-1" style={{ cursor: "pointer" }} onClick={() => handleOpenLoginModal(merchant)}>
                                                                <IoMdRefresh size={30} />
                                                            </div>
                                                        </div>
                                                        <hr
                                                            style={{ 
                                                                margin: "8px 0 0 0",
                                                                display: activeMerchant?.id === merchant.id ? "none" : "block",
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                                <button className="btn btn-success w-100 fs-5" onClick={() => setShowModalFormCreateMerchant(true)}>Add Merchant</button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <button 
                                        type="button" 
                                        className="btn btn-success" 
                                        onClick={() => setShowModalFormCreateMerchant(true)}
                                    >
                                        Create Merchant
                                    </button>
                                )}
                            </div>

                            {showModalFormCreateMerchant &&
                                createPortal(
                                    <CreateMerchantModal onClose={closeModalCreateMerchant} />,
                                    document.body
                                )
                            }
                            {showModalFormLoginUsernameMerchant &&
                                createPortal(
                                    <LoginMerchantUsernameModal 
                                        onClose={closeModalLoginMerchant} 
                                        merchant={selectedMerchant}
                                        onOTPRequired={handleOTPRequired}
                                    />,
                                    document.body
                                )
                            }
                            {showModalFormOTPUsername &&
                                createPortal(
                                    <ModalOtpByUsername 
                                        onClose={closeModalOTPUsername} 
                                        merchant={selectedMerchant}
                                    />,
                                    document.body
                                )
                            }

                            <div className="topbar-item">
                                <button type="button" className="topbar-button" id="light-dark-mode" onClick={toggleTheme}>
                                    {themeMode === "light" ? (
                                        <iconify-icon icon="solar:moon-outline" className="fs-22 align-middle light-mode" />
                                    ) : (
                                        <iconify-icon icon="solar:sun-2-outline" className="fs-22 align-middle dark-mode" />
                                    )}
                                </button>
                            </div>

                            <div className="dropdown topbar-item">
                                <a type="button" className="topbar-button" id="page-header-user-dropdown" data-bs-toggle="dropdown"
                                    aria-haspopup="true" aria-expanded="false">
                                    <span className="d-flex align-items-center">
                                        <img className="rounded-circle" width="32" src={avatarProfile}
                                            alt="avatar" />
                                    </span>
                                </a>
                                <div className="dropdown-menu dropdown-menu-end rounded py-1">
                                    <button className="dropdown-item text-danger d-flex align-items-center gap-1" onClick={handleLogout} disabled={isLoading} style={{ cursor: isLoading ? "not-allowed" : "pointer" }}>
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