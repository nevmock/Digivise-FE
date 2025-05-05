import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";

import { verifyOtp } from "../../resolver/auth/otp";


export default function OtpPage() {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const validate = (otp) => {
        const newErrors = {};
        if (!otp.trim()) newErrors.otp = "OTP code required";
        return Object.keys(newErrors).length === 0;
    }

    const handleSubmitVerifyOTP = async (e) => {
        e.preventDefault();
        const otp = e.target.otp.value.trim();
        setIsLoading(true);

        if (!validate(otp)) {
            setIsLoading(false);
            toast.error("OTP code is required");
            return;
        }

        try {
            await verifyOtp(otp);
            toast.success("OTP berhasil diverifikasi!");
            navigate("/dashboard");
        } catch (error) {
            toast.error("Gagal verifikasi OTP, silakan coba lagi");
            console.error("Gagal verifikasi OTP, server error:", error);
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
                                        <h1 className="fw-bold text-dark mb-2">OTP Verification</h1>
                                        <p className="text-muted">Input OTP code that sent to your email to verify your account</p>
                                    </div>
                                    <form className="mt-5" onSubmit={handleSubmitVerifyOTP}>
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