import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { getToken } from "../resolver/auth/authApp";
import { isTokenValid } from "../utils/jwtDecode";
import { 
    createMerchant as createMerchantAPI, 
    loginMerchant as loginMerchantAPI,
    verifyMerchantOtp as verifyMerchantOtpAPI,
    switchMerchant as switchMerchantAPI
} from "../resolver/merchant";


const AuthContext = createContext();
const TOKEN_KEY = "userAppToken";
const USER_DATA_KEY = "userDataApp";
const SHOP_ID = "shopeeId";

export const AuthProvider = ({ children }) => {
    const [isAuth, setIsAuth] = useState(false);
    const [userData, setUserData] = useState(null);
    const [isChecking, setIsChecking] = useState(true);
    const [pendingMerchantLogin, setPendingMerchantLogin] = useState(null);
    const [isSwitching, setIsSwitching] = useState(false);
    const navigate = useNavigate();

    const normalizeUserData = (data) => {
        if (!data) return null;
        
        const normalizedData = {
            ...data,
            userId: data.userId || data.id,
        };
        
        return normalizedData;
    };

    const validateAndRepairState = () => {
        try {
            const token = getToken();
            const storedUser = localStorage.getItem(USER_DATA_KEY);
            const shopeeId = localStorage.getItem(SHOP_ID);

            if (!token || !isTokenValid(token)) {
                logoutSuccess();
                return false;
            }

            if (storedUser) {
                const parsedUserData = JSON.parse(storedUser);
                const normalizedUserData = normalizeUserData(parsedUserData);
                const expectedShopeeId = normalizedUserData?.activeMerchant?.merchantShopeeId;
                
                if (shopeeId !== expectedShopeeId) {
                    if (expectedShopeeId && expectedShopeeId !== "null" && expectedShopeeId !== "undefined") {
                        localStorage.setItem(SHOP_ID, expectedShopeeId);
                    } else {
                        localStorage.removeItem(SHOP_ID);
                    }
                }
                
                setIsAuth(true);
                setUserData(parsedUserData);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('State validation gagal:', error);
            logoutSuccess();
            return false;
        }
    };

    useEffect(() => {
        validateAndRepairState();
        setIsChecking(false);
    }, []);

    const updateData = (data) => {
        if (!data || typeof data !== 'object') {
            return;
        }

        try {
            const normalizedData = normalizeUserData(data);
            const shopeeId = normalizedData?.activeMerchant?.merchantShopeeId;
            
            setUserData(normalizedData);
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(normalizedData));
            
            if (shopeeId && shopeeId !== "null" && shopeeId !== "undefined") {
                localStorage.setItem(SHOP_ID, shopeeId);
            } else {
                localStorage.removeItem(SHOP_ID);
            }
        } catch (error) {
            const currentData = JSON.parse(localStorage.getItem(USER_DATA_KEY) || "{}");
            setUserData(normalizeUserData(currentData));
        }
    };

    const loginSuccess = (data) => {
        setIsAuth(true);
        updateData(data);
        localStorage.setItem(TOKEN_KEY, data.accessToken);
    };

    const logoutSuccess = () => {
        setIsAuth(false);
        setUserData(null);
        localStorage.removeItem(USER_DATA_KEY);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(SHOP_ID);
    };

    const switchMerchant = async (merchantId) => {
        if (!merchantId) {
            throw new Error("Merchant ID dibutuhkan untuk switch merchant");
        }

        setIsSwitching(true);
        
        try {
            const response = await switchMerchantAPI(merchantId);
            
            if (response &&  (response.success === true || response.code === 200 || response.status === 200 || response.status === "OK")) {
                const currentUser = await getCurrentUserData();
                if (currentUser) {
                    updateData(currentUser);
                    return { 
                        success: true, 
                        data: currentUser,
                        switched: true
                    };
                }
            }
            
            return { 
                success: false, 
                requiresLogin: true,
                message: response?.message || "No active session found for this merchant"
            };
            
        } catch (error) {
            if (error.response?.status === 404 || error.response?.status === 401) {
                return { 
                    success: false, 
                    requiresLogin: true,
                    message: "No active session found for this merchant"
                };
            }
            
            throw error;
        } finally {
            setIsSwitching(false);
        }
    };

    const getCurrentUserData = async () => {
        try {
            if (!userData?.userId) return null;
            
            const response = await axios.get(`${import.meta.env.VITE_BE_API_URL}/api/users/${userData.userId}`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`
                }
            });
            
            if (response.status === 200 && response.data) {
                return response.data;
            }
            
            return null;
        } catch (error) {
            console.error("Failed to get current user data:", error);
            return null;
        }
    };

    const requestPhoneOTP = async () => {
        try {
            const response = await axios.get("http://103.150.116.30:1337/api/v1/shopee-seller/otp-phone", {
                headers: {
                    "Content-Type": "application/json",
                }
            });

            if (response.data.code != 200 || response.data.status != "OK") {
                throw new Error("Gaga untuk mendapatkan OTP, silahkan coba lagi nanti");
            }

            return { success: true, data: response.data };
        } catch (error) {
            throw error;
        }
    };

    const createMerchant = async (merchantData) => {
        try {
            const { name, sectorIndustry, officeAddress, factoryAddress } = merchantData;
            const response = await createMerchantAPI(name, sectorIndustry, officeAddress, factoryAddress);

            let newMerchant = null;

            if (response && response.merchant) {
                newMerchant = response.merchant;
            } else if (response && response.data && response.data.merchant) {
                newMerchant = response.data.merchant;
            } else if (response && !response.merchant && !response.data) {
                newMerchant = response;
            }
            
            if (newMerchant && newMerchant.id) {
                const updatedMerchants = [...(userData.merchants || []), newMerchant];
                
                const updatedUserData = {
                    ...userData,
                    merchants: updatedMerchants
                };
                updateData(updatedUserData);
                return newMerchant;
            } else {
                throw new Error("Invalid response");
            }
        } catch (error) {
            throw error;
        }
    };

    const loginToMerchant = async (username, password, merchantId) => {
        try {
            const response = await loginMerchantAPI(username, password);
            
            if (response === true || response.success === true || response.code === 200 || response.status === 200 || response.status === "OK") {
                setPendingMerchantLogin({
                    username,
                    merchantId
                });
                return { success: true, requiresOTP: true };
            }
            
            return { success: false };
        } catch (error) {
            throw error;
        }
    };

    const verifyMerchantOTP = async (otp) => {
        if (!pendingMerchantLogin) {
            throw new Error("Tidak ada login merchant yang tertunda");
        }

        try {
            const { username, merchantId } = pendingMerchantLogin;
            const response = await verifyMerchantOtpAPI(username, merchantId, otp);

            if (response.code == 200 || response.status == 200 || response.status == "OK" || response.code == 200) {
                setPendingMerchantLogin(null);
                const currentUser = await getCurrentUserData();
                if (currentUser) {
                    updateData(currentUser);
                } else {
                    const selectedMerchant = userData.merchants.find(m => m.id === merchantId);
                    if (selectedMerchant) {
                        const updatedUserData = {
                            ...userData,
                            activeMerchant: {
                                ...selectedMerchant,
                                shopeeData: response.data?.data,
                                lastLogin: new Date().toISOString()
                            }
                        };
                        updateData(updatedUserData);
                    }
                }
                
                return { success: true, data: response.data, shopeeData: response.data?.data };
            } else {
                return { 
                    success: false, 
                    message: response.message || "Gagal verifikasi OTP, silahkan coba lagi nanti" 
                };
            }
        } catch (error) {
            throw error;
        }
    };

    const handleUnauthorized = () => {
        logoutSuccess();
        navigate("/", { replace: true });
    };

    useEffect(() => {
        if (pendingMerchantLogin) {
            const timer = setTimeout(() => {
                setPendingMerchantLogin(null);
            }, 10 * 60 * 1000);

            return () => clearTimeout(timer);
        }
    }, [pendingMerchantLogin]);

    return (
        <AuthContext.Provider value={{
            isAuth,
            isChecking,
            isSwitching,
            loginSuccess,
            logoutSuccess,
            handleUnauthorized,
            userData,
            activeMerchant: userData?.activeMerchant || null,
            createMerchant,
            loginToMerchant,
            verifyMerchantOTP,
            pendingMerchantLogin,
            requestPhoneOTP,
            updateData,
            switchMerchant,
            getCurrentUserData,
            validateAndRepairState
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);