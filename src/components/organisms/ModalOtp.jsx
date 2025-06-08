import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { useAuth } from "../../context/Auth";


const MerchantModalOTP = ({ onClose, merchant}) => {
    const { verifyOTP, setActiveMerchant  } = useAuth();
    const navigate = useNavigate();
    const modalRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        otp: "",
    });

    const isEmpty = (value) => !value?.trim();

    const validateValueFormData = () => {
        const newErrors = {};

        if (isEmpty(formData.otp)) {
            newErrors.otp = "OTP is required";
        }

        return newErrors;
    };

    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
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
        
        setIsLoading(true);

        try {
            const merchantData = await verifyOTP(formData.otp);
            setActiveMerchant({
                ...merchant,
                ...merchantData
            });
            setFormData({ otp: "" });
            onClose();
            navigate("/dashboard", { replace: true });
            toast.success("Login ke merchant berhasil");
        } catch (error) {
            toast.error("OTP tidak valid atau telah kedaluwarsa");
            console.error("Gagal verifikasi OTP, kesalahan pada server:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
            style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050 }}
            onClick={onClose}
        >
            <div
                className="bg-white p-4 rounded shadow-lg"
                style={{ width: "400px", maxHeight: "90vh", overflowY: "auto" }}
                ref={modalRef}
                onClick={(e) => e.stopPropagation()}
            >
                <h5 className="text-center">Merchant Login</h5>
                <hr />
                <form onSubmit={handleSubmitFormData}>
                    <div className="mb-2">
                        <label className="form-label">Email</label>
                        <input
                            name="otp"
                            type="text"
                            value={formData.otp}
                            onChange={handleInputChange}
                            className={`form-control ${errors.otp ? "is-invalid" : ""}`}
                        />
                        <div className="invalid-feedback">{errors.otp}</div>
                    </div>

                    <button type="submit" className="btn btn-success w-100" disabled={isLoading}>
                        {isLoading ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : (
                            "Veirify OTP"
                        )}
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary w-100 mt-2"
                        onClick={
                            navigate("/dashboard", { replace: true }) || onClose
                        }
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    );
};

export default MerchantModalOTP;