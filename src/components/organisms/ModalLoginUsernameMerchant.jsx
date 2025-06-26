import { useState, useRef } from "react";
import { toast } from "react-hot-toast";

import { useAuth } from "../../context/Auth";


const MerchantModalLoginWithUsername = ({ onClose, merchant, onOTPRequired }) => {
    const { loginToMerchant  } = useAuth();
    const modalRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });

    const isEmpty = (value) => !value?.trim();

    const validateValueFormData = () => {
        const newErrors = {};

        if (isEmpty(formData.username)) {
            newErrors.username = "Username is required";
        }

        if (isEmpty(formData.password)) {
            newErrors.password = "Password is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
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
            const result = await loginToMerchant(
                formData.username, 
                formData.password, 
                merchant.id
            );

            if (result.success == true && result.requiresOTP == true) {
                toast.success("Kode OTP telah dikirim ke email Anda");
                setFormData({ username: "", password: "" });
                onClose();
                onOTPRequired(merchant);
            } else {
                toast.error("Username atau password salah");
            }
        } catch (error) {
            toast.error("Gagal login ke merchant, silakan coba lagi");
            console.error("Gagal login ke merchant, kesalahan pada server:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="container-modal"
            onClick={onClose}
        >
            <div
                className="bg-white p-4 rounded shadow-lg"
                style={{ width: "400px", maxHeight: "90vh", overflowY: "auto" }}
                ref={modalRef}
                onClick={(e) => e.stopPropagation()}
            >
                <h5 className="text-center">Login To Merchant</h5>
                <hr />
                <form onSubmit={handleSubmitFormData} className="mt-4">
                    <div className="mb-2">
                        <label className="form-label">Username</label>
                        <input
                            name="username"
                            type="text"
                            value={formData.username}
                            onChange={handleInputChange}
                            className={`form-control ${errors.username ? "is-invalid" : ""}`}
                            placeholder="Enter your username"
                        />
                        <div className="invalid-feedback">{errors.username}</div>
                    </div>

                    <div className="mb-2">
                        <label className="form-label">Password</label>
                        <input
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className={`form-control ${errors.password ? "is-invalid" : ""}`}
                            placeholder="Enter your password"
                        />
                        <div className="invalid-feedback">{errors.password}</div>
                    </div>

                    <div className="mt-4">
                        <button type="submit" className="btn btn-success w-100" disabled={isLoading}>
                            {isLoading ? (
                                <div className="d-flex gap-1 align-items-center justify-content-center">
                                    <span>Loading...</span>
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                </div>
                            ) : (
                                "Login"
                            )}
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary w-100 mt-2"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MerchantModalLoginWithUsername;