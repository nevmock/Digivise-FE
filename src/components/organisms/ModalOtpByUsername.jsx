import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";

import { useAuth } from "../../context/Auth";


const MerchantModalOTPByUsername = ({ onClose, merchant}) => {
    const { verifyMerchantOTP, requestPhoneOTP, pendingMerchantLogin } = useAuth();
    const navigate = useNavigate();
    const modalRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPhoneLoading, setIsPhoneLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        otp: "",
    });

    const isEmpty = (value) => !value?.trim();
    const validateValueFormData = () => {
        const newErrors = {};

        if (isEmpty(formData.otp)) {
            newErrors.otp = "OTP is required";
        } else if (formData.otp.length !== 6) {
            newErrors.otp = "OTP must be at least 6 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'otp' && (!/^\d*$/.test(value) || value.length > 6)) {
            return;
        }

        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));

        if (errors[name]) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                [name]: "",
            }));
        }
    };

    const handleSubmitFormData = async (e) => {
        e.preventDefault();
        if (!validateValueFormData()) return;

        if (!pendingMerchantLogin) {
            toast.error("Session expired, mohon login ulang");
            onClose();
            return;
        }
        
        setIsLoading(true);

        try {
            const result = await verifyMerchantOTP(formData.otp);
            // console.log("Result verify OTP:", result);
            
            if (result?.success === true || result?.code === 0 || result?.message.contains("succ")){
                onClose();
                navigate("/dashboard", { replace: true });
                toast.success(`Berhasil login ke ${merchant?.name}`);
            } else {
                toast.error("Kode OTP tidak valid atau telah kadaluarsa");
            }
        } catch (error) {
            toast.error("Gagal verifikasi OTP, silakan coba lagi");
            console.error("Gagal verifikasi OTP, kesalahan pada server : ", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePhoneLogin = async () => {
        if (!pendingMerchantLogin) {
            toast.error("Session expired, mohon login ulang");
            onClose();
            return;
        }

        setIsPhoneLoading(true);

        try {
            const result = await requestPhoneOTP();
            if (result.data.success || result.data.code === 200 || result.data.status === "OK" || result.data.status === 200) {
                toast.success("OTP telah dikirim ke handphone Anda");
                onClose();
                navigate("/verification-otp-phone");
            } else {
                toast.error("Gagal mengirim OTP ke handphone");
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || "Failed to request phone OTP";
            toast.error(`Gagal mengirim OTP: ${errorMessage}`);
            console.error("Phone OTP request error:", error);
        } finally {
            setIsPhoneLoading(false);
        }
    };

    return (
        <div
            className="container-modal"
            style={{ zIndex: 1055 }}
            onClick={onClose}
        >
            <div
                className="bg-white p-4 rounded shadow-lg"
                style={{ width: "400px", maxHeight: "90vh", overflowY: "auto" }}
                ref={modalRef}
                onClick={(e) => e.stopPropagation()}
            >
                <h5 className="text-center">Verify OTP</h5>
                <hr />
                <form onSubmit={handleSubmitFormData}>
                    <div className="mb-2">
                        <input
                            name="otp"
                            type="text"
                            value={formData.otp}
                            onChange={handleInputChange}
                            className={`form-control text-center ${errors.otp ? "is-invalid" : ""}`}
                            placeholder="Enter your OTP code"
                            maxLength={6}
                            style={{ 
                                fontSize: "1.2rem", 
                                letterSpacing: "0.2rem"
                            }}
                        />
                        <div className="invalid-feedback">{errors.otp}</div>
                    </div>

                    <button type="submit" className="btn btn-success w-100 mt-2" disabled={isLoading}>
                        {isLoading ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : (
                            "Veirify OTP"
                        )}
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary w-100 mt-2"
                        onClick={() => {
                            onClose();
                            navigate("/dashboard", { replace: true });
                        }}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>

                    <div className="mt-3 d-flex justify-content-center align-items-center">
                        <button
                            type="button"
                            className="btn btn-link p-0 form-label custom-login-link"
                            onClick={handlePhoneLogin}
                            disabled={isPhoneLoading || isLoading}
                            style={{ 
                                textDecoration: "none",
                                color: isPhoneLoading ? "#6c757d" : "#0d6efd"
                            }}
                        >
                            {isPhoneLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    Sending OTP...
                                </>
                            ) : (
                                "Login No.Handphone >"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MerchantModalOTPByUsername;