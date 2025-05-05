import { Navigate } from "react-router-dom";
import { useAuth } from "../context/Auth";

export default function PrivateRoute({ children }) {
    const { isAuth } = useAuth();

    return isAuth ? children : <Navigate to="/" replace />;
};