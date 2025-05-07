import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/Auth";


export default function PrivateRoute() {
    const { isAuth } = useAuth();

    if (!isAuth) {
        return <Navigate to="/" replace />;
    }

    // Render children routes jika terautentikasi
    return <Outlet />;
};