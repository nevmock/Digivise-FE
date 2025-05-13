import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { useAuth } from "../../context/Auth";
import { login } from "../../resolver/auth/authApp";


export default function LoginPage() {
    const { loginSuccess, isAuth } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        if (isAuth) {
            navigate("/dashboard", { replace: true });
        }
    }, [isAuth, navigate]);

    const validate = () => {
        const newErrors = {};
        if (!username.trim()) newErrors.username = "Username required";
        if (!password.trim()) newErrors.password = "Password required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmitLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (!validate()) {
            setIsLoading(false);
            return;
        }

        try {
            const response = await login(username, password);
            loginSuccess(response);
            toast.success("Login berhasil!");
            navigate("/dashboard");
        } catch (error) {
            toast.error("Login gagal, silakan coba lagi");
            console.error("Gagal login, kesalahan pada server:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="account-pages py-5 bg-white vh-100 d-flex justify-content-center align-items-center">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-md-6 col-lg-5">
                            <div className="card border-0 shadow-lg">
                                <div className="card-body p-5">
                                    <div className="text-center">
                                        <h1 className="fw-bold text-dark mb-2">Login</h1>
                                        <p className="text-muted">Sign in to continue to your account</p>
                                    </div>
                                    <form className="mt-5" onSubmit={handleSubmitLogin}>
                                        <div className="mb-3">
                                            <label htmlFor="username" className="form-label">Username</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.username ? "is-invalid" : ""}`}
                                                id="username"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                placeholder="Enter your username"
                                            />
                                            {errors.username && (
                                                <div className="invalid-feedback">{errors.username}</div>
                                            )}
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="password" className="form-label">Password</label>
                                            <input
                                                type="password"
                                                className={`form-control ${errors.password ? "is-invalid" : ""}`}
                                                id="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Enter your password"
                                            />
                                            {errors.password && (
                                                <div className="invalid-feedback">{errors.password}</div>
                                            )}
                                        </div>
                                        <div className="d-grid mt-5">
                                            <button
                                                className="btn btn-dark btn-lg fw-medium"
                                                type="submit"
                                                disabled={isLoading}
                                            >
                                                {isLoading ? (
                                                    <div className="spinner-border spinner-border-sm" role="status">
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                ) : (
                                                    "Login"
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};