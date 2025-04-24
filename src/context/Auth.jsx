import { createContext, useContext, useState } from "react";
import { getToken } from "../resolver/auth/authApp";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuth, setIsAuth] = useState(!!getToken());

    const loginSuccess = () => setIsAuth(true);
    const logoutSuccess = () => setIsAuth(false);

    return (
        <AuthContext.Provider value={{ isAuth, loginSuccess, logoutSuccess }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);