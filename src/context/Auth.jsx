import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../resolver/auth/authApp";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuth, setIsAuth] = useState(!!getToken());
    const navigate = useNavigate();

    const loginSuccess = () => setIsAuth(true);
    const logoutSuccess = () => {
        setIsAuth(false);
        localStorage.removeItem("userAppToken");
    };

    const handleUnauthorized = () => {
        logoutSuccess();
        navigate("/", { replace: true });
    };

    return (
        <AuthContext.Provider value={{ isAuth, loginSuccess, logoutSuccess, handleUnauthorized }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);