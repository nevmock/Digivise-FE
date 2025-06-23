import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { getToken } from "../resolver/auth/authApp";
import { isTokenValid } from "../utils/jwtDecode";
import { 
    createMerchant as createMerchantAPI, 
    loginMerchant as loginMerchantAPI,
    verifyMerchantOtp as verifyMerchantOtpAPI 
} from "../resolver/merchant";


const AuthContext = createContext();
const TOKEN_KEY = "userAppToken";
const USER_DATA_KEY = "userDataApp";

export const AuthProvider = ({ children }) => {
    const [isAuth, setIsAuth] = useState(false);
    const [userData, setUserData] = useState(null);
    const [isChecking, setIsChecking] = useState(true);
    const [pendingMerchantLogin, setPendingMerchantLogin] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = getToken();
        const storedUser = localStorage.getItem(USER_DATA_KEY);

        if (token && isTokenValid(token) && storedUser) {
            const parsedUserData = JSON.parse(storedUser);
            setIsAuth(true);
            setUserData(parsedUserData);
        } else {
            logoutSuccess();
        }
        setIsChecking(false);
    }, []);

    const updateData = (data) => {
        setUserData(data);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(data));
    };

    const loginSuccess = (data) => {
        setIsAuth(true);
        setUserData(data);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(data));
        localStorage.setItem(TOKEN_KEY, data.accessToken);
    };

    const logoutSuccess = () => {
        setIsAuth(false);
        setUserData(null);
        localStorage.removeItem(USER_DATA_KEY);
        localStorage.removeItem(TOKEN_KEY);
    };

    const createMerchant = async (merchantData) => {
        try {
            const { merchantName, sectorIndustry, officeAddress, factoryAddress } = merchantData;
            const response = await createMerchantAPI(merchantName, sectorIndustry, officeAddress, factoryAddress);

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
                throw new Error("Invalid response format from server");
            }
        } catch (error) {
            throw error;
        }
    };

    const loginToMerchant = async (username, password, merchantId) => {
        try {
            const response = await loginMerchantAPI(username, password);
            
            if (response === true) {
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
            throw new Error("No pending merchant login");
        }

        try {
            const { username, merchantId } = pendingMerchantLogin;
            const response = await verifyMerchantOtpAPI(username, merchantId, otp);

            if (response.code == 200 || response.status == "OK" || response.status == 200) {
                setPendingMerchantLogin(null);
                
                const selectedMerchant = userData.merchants.find(m => m.id === merchantId);
                if (selectedMerchant) {
                    const updatedUserData = {
                        ...userData,
                        activeMerchant: {
                            ...selectedMerchant,
                            shopeeData: response.data?.data
                        }
                    };
                    updateData(updatedUserData);
                }
                
                return { success: true, data: response.data, shopeeData: response.data?.data };
            } else {
                return { 
                    success: false, 
                    message: response.message || "OTP verification failed" 
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

    return (
        <AuthContext.Provider value={{
            isAuth,
            isChecking,
            loginSuccess,
            logoutSuccess,
            handleUnauthorized,
            userData,
            activeMerchant: userData?.activeMerchant || null,
            createMerchant,
            loginToMerchant,
            verifyMerchantOTP,
            pendingMerchantLogin,
            updateData
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);