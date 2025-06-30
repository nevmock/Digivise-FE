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
import convertNotifySessionExpired from "../../utils/convertNotifySessionExpired";
import avatarProfile from "../../assets/images/users/avatar-1.jpg";


const Navbar = () => {
    const { 
        userData, 
        logoutSuccess, 
        switchMerchant, 
        isSwitching,
        // loginToMerchant
    } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showModalFormCreateMerchant, setShowModalFormCreateMerchant] = useState(false);
    const [showModalFormLoginUsernameMerchant, setShowModalFormLoginUsernameMerchant] = useState(false);
    const [showModalFormOTPUsername, setShowModalFormOTPUsername] = useState(false);
    const [selectedMerchant, setSelectedMerchant] = useState(null);
    const [switchingMerchantId, setSwitchingMerchantId] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const [themeMode, setThemeMode] = useState(() => localStorage.getItem("appModeTheme") || "light");
    const [userNow, setUserNow] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchGetCurrentUser = async () => {
        setIsLoading(true);
        try {
            const response = await axiosRequest.get(`/api/users/${userData.userId}`);
            if (response.status === 200 || response.code === 200 || response.status === "OK" || response.code === "OK" || response.data) {
                const currentUser = response.data;
                setUserNow(currentUser);
            }
        } catch (error) {
            console.error("Error fetching current user:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (userData?.userId) {
            fetchGetCurrentUser();
        }
    }, [userData?.userId]);

    useEffect(() => {
        if (userData && userNow) {
            if (userData.activeMerchant?.id !== userNow.activeMerchant?.id) {
                setUserNow(prev => ({
                    ...prev,
                    activeMerchant: userData.activeMerchant
                }));
            }
        }
    }, [userData?.activeMerchant, userNow]);

    const toggleTheme = () => {
        setThemeMode(prev => (prev === "light" ? "dark" : "light"));
    };

    const toggleDropdown = () => {
        setShowDropdown((prev) => !prev);
    };

    const closeModalCreateMerchant = () => setShowModalFormCreateMerchant(false);
    const closeModalLoginMerchant = () => setShowModalFormLoginUsernameMerchant(false);
    const closeModalOTPUsername = () => setShowModalFormOTPUsername(false);

    const handleMerchantClick = async (merchant) => {
        if (event.target.closest('.refresh-icon-area')) {
            return;
        }

        if (userNow?.activeMerchant?.id === merchant.id) {
            toast.error(`Kamu sudah login ke ${merchant?.name || "Merchant tersebut"}`);
            // toast.error(`Kamu sudah login ke ${merchant?.merchantName || "Merchant tersebut"}`);
            return;
        }

        setSwitchingMerchantId(merchant.id);
        
        try {
            const result = await switchMerchant(merchant.id);
            
            if (result.success === true && result.switched === true) {
                toast.success(`Berhasil switch ke merchant ${merchant.name || "tersebut"}`);
                // toast.success(`Berhasil switch ke merchant ${merchant.merchantName || "tersebut"}`);
                setShowDropdown(false);
                await fetchGetCurrentUser();
                navigate("/dashboard", { replace: true });
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else if (result.requiresLogin === true) {
                toast.error("Kamu harus login terlebih dahulu untuk merchant tersebut");
                handleOpenLoginModal(merchant);
            } else {
                handleOpenLoginModal(merchant);
            }
        } catch (error) {
            toast.error('Gagal switch merchant, silakan coba lagi');
            handleOpenLoginModal(merchant);
        } finally {
            setSwitchingMerchantId(null);
        }
    };

    const handleRefreshIconClick = (merchant, event) => {
        event.stopPropagation();
        handleOpenLoginModal(merchant);
    };

    const handleOpenLoginModal = (merchant) => {
        setSelectedMerchant(merchant);
        setShowModalFormLoginUsernameMerchant(true);
        setShowDropdown(false);
    };

    const handleOTPRequired = (merchant) => {
        setSelectedMerchant(merchant);
        setShowModalFormOTPUsername(true);
    };

    const handleMerchantLoginSuccess = async () => {
        await fetchGetCurrentUser();
        setSelectedMerchant(null);
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

    // const handleMerchantClickV2 = async (merchantId) => {
    //     e.stopPropagation();
    //     setIsLoading(true);

    //     try {
    //         const result = await loginToMerchant(merchantId);

    //         if (result.success == true && result.requiresOTP == true) {
    //             toast.success("Kode OTP telah dikirim ke email Anda");
    //             onClose();
    //             onOTPRequired(result);
    //         } else {
    //             toast.error("Username atau password salah");
    //         }
    //     } catch (error) {
    //         toast.error("Gagal login ke merchant, silakan coba lagi");
    //         console.error("Gagal login ke merchant, kesalahan pada server:", error);
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

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
                                        <button 
                                            type="button" 
                                            className="btn btn-primary" 
                                            onClick={toggleDropdown}
                                            disabled={isSwitching}
                                        >
                                            {isSwitching ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" />
                                                    Switching...
                                                </>
                                            ) : (
                                                'Switch Merchant'
                                            )}
                                        </button>
                                        
                                        {showDropdown && (
                                            <div className="dropdown-menu show position-absolute shadow p-2 rounded" style={{ width: "280px" }} title="Switch Merchant">
                                                {userNow?.merchants.map((merchant) => {
                                                    const isActive = activeMerchant?.id === merchant.id;
                                                    const isSwitchingThis = switchingMerchantId === merchant.id;
                                                    
                                                    return (
                                                        <div 
                                                            key={merchant.id} 
                                                            className="d-flex flex-column mb-2 position-relative merchant-item"
                                                            style={{
                                                                cursor: isSwitchingThis ? "not-allowed" : "pointer",
                                                                borderRadius: "8px",
                                                                padding: "12px", 
                                                                backgroundColor: isActive ? "#7F42D421" : "transparent",
                                                                border: isActive ? "2px solid #7F42D4" : "1px solid #e9ecef",
                                                                opacity: isSwitchingThis ? 0.6 : 1
                                                            }}
                                                            onClick={(e) => !isSwitchingThis && handleMerchantClick(merchant, e)}
                                                        >
                                                            <div className="d-flex align-items-center">
                                                                <img
                                                                    src={avatarProfile}
                                                                    className="rounded-circle me-2"
                                                                    width="45"
                                                                    height="45"
                                                                />
                                                                <div className="flex-grow-1">
                                                                    <div className="d-flex flex-column gap-1">
                                                                        <div className="d-flex align-items-center justify-content-between">
                                                                            <strong className="" style={{ maxWidth: "160px" }}>
                                                                                {merchant.name || "-"}
                                                                                {/* {merchant.merchantName || "-"} */}
                                                                            </strong>
                                                                        </div>
                                                                        
                                                                        <div className="d-flex align-items-center gap-2">
                                                                            <small className={`text-${convertNotifySessionExpired(merchant.lastLogin).type === "urgent" ? "danger" : "success"}`}>
                                                                                {convertNotifySessionExpired(merchant.lastLogin).text}
                                                                            </small>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div 
                                                                    className="ms-1 refresh-icon-area"
                                                                    // onClick={(e) => !isSwitchingThis && handleMerchantClickV2(merchant.id)}
                                                                    onClick={(e) => !isSwitchingThis && handleRefreshIconClick(merchant, e)}
                                                                    style={{
                                                                        padding: "4px",
                                                                        borderRadius: "4px",
                                                                        cursor: isSwitchingThis ? "not-allowed" : "pointer"
                                                                    }}
                                                                    title="Refresh & login to this merchant"
                                                                >
                                                                    {isSwitchingThis ? (
                                                                        <div className="spinner-border spinner-border-sm text-primary" />
                                                                    ) : (
                                                                        <IoMdRefresh 
                                                                            size={28} 
                                                                            className="text-primary"
                                                                            style={{
                                                                                transition: "transform 0.2s ease"
                                                                            }}
                                                                            onMouseEnter={(e) => e.target.style.transform = "rotate(180deg)"}
                                                                            onMouseLeave={(e) => e.target.style.transform = "rotate(0deg)"}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                
                                                <button 
                                                    title="Add a new merchant"
                                                    className="btn btn-success w-100 mt-2" 
                                                    onClick={() => setShowModalFormCreateMerchant(true)}
                                                    disabled={isSwitching}
                                                >
                                                    Add Merchant
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <button 
                                        type="button" 
                                        className="btn btn-success" 
                                        onClick={() => setShowModalFormCreateMerchant(true)}
                                    >
                                        Add Merchant
                                    </button>
                                )}
                            </div>

                            {showModalFormCreateMerchant &&
                                createPortal(
                                    <CreateMerchantModal 
                                        onClose={closeModalCreateMerchant}
                                        onSuccess={fetchGetCurrentUser}
                                    />,
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
                                        onSuccess={handleMerchantLoginSuccess}
                                    />,
                                    document.body
                                )
                            }

                            <div className="topbar-item">
                                <button type="button" className="topbar-button custom-size-icon" id="light-dark-mode" onClick={toggleTheme}>
                                    {themeMode === "light" ? (
                                        <iconify-icon icon="solar:moon-outline" className="fs-26 align-middle light-mode" />
                                    ) : (
                                        <iconify-icon icon="solar:sun-2-outline" className="fs-26 align-middle dark-mode" />
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
                                    <button 
                                        className="dropdown-item text-danger d-flex align-items-center gap-1" 
                                        onClick={handleLogout} 
                                        disabled={isLoading} 
                                        style={{ cursor: isLoading ? "not-allowed" : "pointer" }}
                                    >
                                        <iconify-icon icon="solar:logout-3-outline" className="align-middle fs-18" />
                                        <span className="align-middle">Logout</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        </>
    );
};

export default Navbar;