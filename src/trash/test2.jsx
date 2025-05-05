import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/Auth";
import { login } from "../../resolver/auth/authApp";


export default function LoginPage() {
    const { loginSuccess } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmitLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await login(username, password);
            await loginSuccess();
            navigate("/dashboard");
        } catch (error) {
            alert("Login gagal, silahkan coba lagi");
            console.error("Gagal login, error pada server:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="card-body p-5">
                <div className="text-center">
                    <h1 className="fw-bold text-dark mb-2">Login</h1>
                    <p className="text-muted">Sign in to continue to your account</p>
                </div>
                <form className="mt-5" onSubmit={handleSubmitLogin}>
                    <div className="mb-3">
                        <label htmlFor="username" className="form-label">username</label>
                        <input
                            type="test"
                            className="form-control"
                            id="username"
                            name="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                        />
                    </div>
                    <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <label htmlFor="password" className="form-label">Password</label>
                        </div>
                        <input
                            type="password"
                            className="form-control"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                        />
                    </div>
                    <div className="d-grid mt-5">
                        <button className="btn btn-dark btn-lg fw-medium" type="submit">
                        {isLoading ? (
                            <div className="spinner-border spinner-border-sm" role="status">
                                <span className="visually-hidden ">Loading...</span>
                            </div>
                        ) : (
                            "Login"
                        )}
                        </button>
                    </div>
                </form>
            </div>
        </>
    )
};