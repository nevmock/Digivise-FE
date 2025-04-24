import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/Auth";


export default function LoginPage() {
    // const { loginSuccess } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmitLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // try {
        //     await login(username, password);
        //     loginSuccess();
        //     navigate("/dashboard");
        // } catch (err) {
        //     alert("Login gagal");
        //     console.error("Gagal login: ", error);
        // };

        setTimeout(() => {
            setIsLoading(false);
            navigate("/verification-otp");
        }, 2000);
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
                                            <label for="email" className="form-label">Email</label>
                                            <input type="email" className="form-control" id="email" name="email" placeholder="Enter your email" />
                                        </div>
                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <label for="password" className="form-label">Password</label>
                                            </div>
                                            <input type="password" className="form-control" id="password" placeholder="Enter your password" />
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
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
};