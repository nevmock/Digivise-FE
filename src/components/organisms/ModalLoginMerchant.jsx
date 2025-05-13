import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { useAuth } from "../../context/Auth";


const MerchantModalLogin = ({ onClose, merchant}) => {
    const { loginToMerchant, setActiveMerchant  } = useAuth();
    const navigate = useNavigate();
    const modalRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        email: merchant?.email || "",
        password: "",
    });

    const isEmpty = (value) => !value?.trim();
    const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const validateValueFormData = () => {
        const newErrors = {};

        if (isEmpty(formData.email)) {
            newErrors.email = "Email is required";
        } else if (!isEmailValid(formData.email)) {
            newErrors.email = "Email is not valid";
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
            const merchantData = await loginToMerchant(formData.email, formData.password);
            setActiveMerchant({
                ...merchant,
                ...merchantData
            });
            setFormData({ email: "", password: "" });
            onClose();
            navigate("/dashboard", { replace: true });
            toast.success("Login ke merchant berhasil");
        } catch (error) {
            toast.error("Gagal login ke merchant, silakan coba lagi");
            console.error("Gagal login, error pada server:", error);
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
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`form-control ${errors.email ? "is-invalid" : ""}`}
                        />
                        <div className="invalid-feedback">{errors.email}</div>
                    </div>

                    <div className="mb-2">
                        <label className="form-label">Password</label>
                        <input
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className={`form-control ${errors.password ? "is-invalid" : ""}`}
                        />
                        <div className="invalid-feedback">{errors.password}</div>
                    </div>

                    <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
                        {isLoading ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
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
                </form>
            </div>
        </div>
    );
};

export default MerchantModalLogin;