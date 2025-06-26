import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { useAuth } from "../../context/Auth";


export default function OtpPage() {
    const { verifyMerchantOTP, pendingMerchantLogin, userData } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [otpValue, setOtpValue] = useState("");
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        if (!pendingMerchantLogin) {
            toast.success("Tidak ada login merchant yang tertunda");
            navigate("/dashboard", { replace: true }, window.location.reload());
        }
    }, [pendingMerchantLogin, navigate]);

    const validate = (otp) => {
        const newErrors = {};
        
        if (!otp.trim()) {
            newErrors.otp = "OTP code required";
        } else if (otp.length !== 6) {
            newErrors.otp = "OTP must be 6 digits";
        } else if (!/^\d+$/.test(otp)) {
            newErrors.otp = "OTP must contain only numbers";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { value } = e.target;
        
        if (!/^\d*$/.test(value) || value.length > 6) {
            return;
        }
        
        setOtpValue(value);
        
        if (errors.otp) {
            setErrors({});
        }
    };

    const handleSubmitVerifyOTP = async (e) => {
        e.preventDefault();
        const otp = otpValue.trim();
        
        if (!validate(otp)) {
            toast.error("Please enter a valid 6-digit OTP code");
            return;
        }

        if (!pendingMerchantLogin) {
            toast.error("Session expired, please login again");
            navigate("/dashboard", { replace: true });
            return;
        }

        setIsLoading(true);

        try {
            const result = await verifyMerchantOTP(otp);
            
            if (result?.success === true || result?.status === 200 || result?.status === "success" || result?.status === "OK" || result?.code === "OK") {
                const name = userData?.merchants?.find(
                    m => m.id === pendingMerchantLogin.merchantId
                )?.name || "merchant";

                toast.success(`Berhasil login ke ${name} via handphone`);
                navigate("/dashboard", { replace: true }, window.location.reload());
            } else {
                toast.error("Gagal verifikasi OTP, silakan coba lagi");
            }
        } catch (error) {
            toast.error("Gagal verifikasi OTP",  error.message);
            console.error("Gagal verifikasi OTP, server error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!pendingMerchantLogin) {
        return (
            <div className="account-pages py-5 bg-white vh-100 d-flex justify-content-center align-items-center">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="account-pages py-5 bg-white vh-100 d-flex justify-content-center align-items-center">
            <div className="background-bubbles">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="bubble" />
                ))}
            </div>
            <div className="container position-relative" style={{ zIndex: 10 }}>
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-5">
                        <div className="card border-0 shadow-lg">
                            <div className="card-body p-5">
                                <div className="text-center">
                                    <h1 className="fw-bold text-dark mb-2">OTP Verification</h1>
                                    <p className="text-muted">
                                        Enter the 6-digit code
                                    </p>
                                </div>
                                <form className="mt-5" onSubmit={handleSubmitVerifyOTP}>
                                    <div className="mb-3">
                                        <input 
                                            type="text" 
                                            className={`form-control text-center ${errors.otp ? "is-invalid" : ""}`}
                                            id="otp" 
                                            name="otp" 
                                            value={otpValue}
                                            onChange={handleInputChange}
                                            placeholder="Enter 6-digit code"
                                            maxLength="6"
                                            style={{ 
                                                fontSize: "1.2rem", 
                                                letterSpacing: "0.1rem",
                                                fontFamily: "monospace"
                                            }}
                                        />
                                        {errors.otp && (
                                            <div className="invalid-feedback d-block">{errors.otp}</div>
                                        )}
                                    </div>
                                    <div className="d-grid mt-5">
                                        <button 
                                            className="btn btn-primary btn-lg fw-medium" 
                                            type="submit"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <div className="d-flex align-items-center justify-content-center gap-1">
                                                    Verifying...
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                </div>
                                            ) : (
                                                "Verify"
                                            )}
                                        </button>
                                    </div>
                                    <div className="text-center mt-3">
                                        <button
                                            type="button"
                                            className="btn btn-link"
                                            onClick={() => navigate("/dashboard", { replace: true }, window.location.reload())}
                                            disabled={isLoading}
                                        >
                                            Back to Dashboard
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};