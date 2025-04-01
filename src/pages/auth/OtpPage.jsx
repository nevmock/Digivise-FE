import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function OtpPage() {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);

        setTimeout(() => {
            setIsLoading(false);
            navigate("/");
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
                                        <h1 className="fw-bold text-dark mb-2">OTP Verification</h1>
                                        <p className="text-muted">Input OTP code that sent to your email to verify your account</p>
                                    </div>
                                    <form className="mt-5" onSubmit={handleSubmit}>
                                        <div className="mb-3">
                                            <input type="text" className="form-control" id="otp" name="otp" placeholder="Enter your code" />
                                        </div>
                                        <div className="d-grid mt-5">
                                            <button className="btn btn-dark btn-lg fw-medium" type="submit">
                                            {isLoading ? (
                                                <div className="spinner-border spinner-border-sm" role="status">
                                                    <span className="visually-hidden ">Loading...</span>
                                                </div>
                                            ) : (
                                                "Verify"
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