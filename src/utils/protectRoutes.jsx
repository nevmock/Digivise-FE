import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/Auth";


export default function PrivateRoute() {
    const { isAuth, isChecking } = useAuth();

    if (isChecking) {
        return <div>Loading...</div>;
    }

    return isAuth ? <Outlet /> : <Navigate to="/" replace />;
};