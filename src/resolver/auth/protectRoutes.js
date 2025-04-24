import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
    const { isAuth } = useAuth();
    return isAuth ? children : <Navigate to="/" />;
};

export default ProtectedRoute;