import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { useAuth } from "../../context/Auth";


const MerchantModalLoginWithUsername = ({ onClose, merchant}) => {
    const { loginToMerchant, setActiveMerchant  } = useAuth();
    const navigate = useNavigate();
    const modalRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        username: merchant?.username || "",
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
            const merchantData = await loginToMerchant(formData.email, formData.password);
            if (!merchantData) {
                toast.error("Merchant tidak ditemukan, silakan coba lagi");
                return;
            }

            setActiveMerchant({
                ...merchant,
                ...merchantData
            });
            setFormData({ username: "", password: "" });
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
                        <label className="form-label">Username</label>
                        <input
                            name="username"
                            type="text"
                            value={formData.username}
                            onChange={handleInputChange}
                            className={`form-control ${errors.username ? "is-invalid" : ""}`}
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
                        />
                        <div className="invalid-feedback">{errors.password}</div>
                    </div>

                    <button type="submit" className="btn btn-success w-100" disabled={isLoading}>
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

                    <div className="mt-3 d-flex justify-content-center align-items-center">
                        <Link className="form-label">Login menggunakan No.Handphone</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MerchantModalLoginWithUsername;