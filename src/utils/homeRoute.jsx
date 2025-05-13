import { Navigate } from "react-router-dom";
import { useAuth } from "../context/Auth";


export default function HomeRoute() {
    const { isAuth, isChecking } = useAuth();
    
    if (isChecking) {
        return <div>Loading...</div>;
    }
    
    return isAuth ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}