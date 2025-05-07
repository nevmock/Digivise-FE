import { createContext, useContext, useState, useEffect } from "react";

const MerchantContext = createContext();

export const MerchantProvider = ({ children }) => {
    const [activeMerchant, setActiveMerchant] = useState(null);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem("userDataApp"));
        if (userData?.activeMerchant) {
            setActiveMerchant(userData.activeMerchant);
        }
    }, []);

    const loginMerchant = (merchant) => {
        const userData = JSON.parse(localStorage.getItem("userDataApp")) || {};
        const updatedUserData = { ...userData, activeMerchant: merchant };
        localStorage.setItem("userDataApp", JSON.stringify(updatedUserData));
        setActiveMerchant(merchant);
    };

    const logoutMerchant = () => {
        const userData = JSON.parse(localStorage.getItem("userDataApp")) || {};
        delete userData.activeMerchant;
        localStorage.setItem("userDataApp", JSON.stringify(userData));
        setActiveMerchant(null);
    };

    return (
        <MerchantContext.Provider value={{ activeMerchant, loginMerchant, logoutMerchant }}>
            {children}
        </MerchantContext.Provider>
    );
};

export const useMerchant = () => useContext(MerchantContext);