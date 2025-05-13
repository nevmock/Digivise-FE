import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { getToken } from "../resolver/auth/authApp";
import { isTokenValid } from "../utils/jwtDecode";
import axiosRequest from "../utils/request";


const AuthContext = createContext();
const TOKEN_KEY = "userAppToken";
const USER_DATA_KEY = "userDataApp";
const ACTIVE_MERCHANT_KEY = "activeUserMerchant";

export const AuthProvider = ({ children }) => {
    const [isAuth, setIsAuth] = useState(false);
    const [userData, setUserData] = useState(null);
    const [isChecking, setIsChecking] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = getToken();
        const storedUser = localStorage.getItem(USER_DATA_KEY);
        const storedActiveMerchant = localStorage.getItem(ACTIVE_MERCHANT_KEY);

        if (token && isTokenValid(token) && storedUser) {
            setIsAuth(true);
            const parsedUserData = JSON.parse(storedUser);
            
            if (storedActiveMerchant) {
                parsedUserData.activeMerchant = JSON.parse(storedActiveMerchant);
            }
            
            setUserData(parsedUserData);
        } else {
            logoutSuccess();
        }
        setIsChecking(false);
    }, []);

    // useEffect(() => {
    //     const token = getToken();
    //     const storedUser = localStorage.getItem(USER_DATA_KEY);

    //     if (token && isTokenValid(token) && storedUser) {
    //         setIsAuth(true);
    //         setUserData(JSON.parse(storedUser));
    //     } else {
    //         logoutSuccess();
    //     }
    //     setIsChecking(false);
    // }, []);

    const updateData = (data) => {
        setUserData(data);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(data));
    }

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
        localStorage.removeItem(ACTIVE_MERCHANT_KEY);
    };

    const setActiveMerchant = (merchantObj) => {
        const updatedUserData = {
            ...userData,
            activeMerchant: merchantObj,
        };
        localStorage.setItem(ACTIVE_MERCHANT_KEY, JSON.stringify(merchantObj));
        updateData(updatedUserData);
    };

    const createMerchant = async (merchantData) => {
        try {
            const response = await axiosRequest.post("/api/merchants", merchantData);
            if (response.status === 200 || response.data) {
                const updatedMerchants = [...(userData.merchants || []), response.data.merchant];
                const updatedUserData = {
                    ...userData,
                    merchants: updatedMerchants
                };
                updateData(updatedUserData);
                return response.data.merchant;
            }
            throw new Error("Gagal membuat merchant");
        } catch (error) {
            console.error("Error membuat merchant, kesalahan pada server:", error);
            throw error;
        }
    };

    const loginToMerchant = async (email, password) => {
        const payload = { email, password };
        try {
            const response = await axiosRequest.post("/api/merchants/login", payload);
            if (response.status === 200 || response.data) {
                const merchantData = response.data;
                // setActiveMerchant(merchantData);
                return merchantData;
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
            setActiveMerchant,
            createMerchant,
            loginToMerchant
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);