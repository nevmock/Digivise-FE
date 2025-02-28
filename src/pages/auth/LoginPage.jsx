import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);

        setTimeout(() => {
            setIsLoading(false);
            navigate("/verification-otp");
        }, 2000);
    };

    return (
        <>
            <div class="account-pages py-5 bg-white vh-100 d-flex justify-content-center align-items-center">
                <div class="container">
                    <div class="row justify-content-center">
                        <div class="col-md-6 col-lg-5">
                            <div class="card border-0 shadow-lg">
                                <div class="card-body p-5">
                                    <div class="text-center">
                                        <h1 class="fw-bold text-dark mb-2">Login</h1>
                                        <p class="text-muted">Sign in to continue to your account</p>
                                    </div>
                                    <form class="mt-5" onSubmit={handleSubmit}>
                                        <div class="mb-3">
                                            <label for="email" class="form-label">Email</label>
                                            <input type="email" class="form-control" id="email" name="email" placeholder="Enter your email" />
                                        </div>
                                        <div class="mb-3">
                                            <div class="d-flex justify-content-between align-items-center">
                                                <label for="password" class="form-label">Password</label>
                                            </div>
                                            <input type="password" class="form-control" id="password" placeholder="Enter your password" />
                                        </div>
                                        <div class="d-grid mt-5">
                                            <button class="btn btn-dark btn-lg fw-medium" type="submit">
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