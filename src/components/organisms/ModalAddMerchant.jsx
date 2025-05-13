import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { useAuth } from "../../context/Auth";


const MerchantModalCreate = ({ onClose }) => {
    const { createMerchant } = useAuth();
    const navigate = useNavigate();
    const modalRef = useRef(null);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        phone: "",
        sector_industry: "",
        office_address: "",
        factory_address: "",
        merchantName: "",
        sessionPath: "merchant",
        MerchantShoopeId: "",
    });

    const isEmpty = (value) => !value?.trim();
    const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isPhoneValid = (phone) => /^\d+$/.test(phone);

    const validatevalueformdata = () => {
        const newErrors = {};

        if (isEmpty(formData.username)) {
            newErrors.username = "Username is required";
        }

        if (isEmpty(formData.email)) {
            newErrors.email = "Email is required";
        } else if (!isEmailValid(formData.email)) {
            newErrors.email = "Email is not valid";
        }

        if (isEmpty(formData.password)) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        if (isEmpty(formData.phone)) {
            newErrors.phone = "Phone number is required";
        } else if (!isPhoneValid(formData.phone)) {
            newErrors.phone = "Phone number must contain only digits";
        } else if (formData.phone.length < 10) {
            newErrors.phone = "Phone number must be at least 10 digits";
        }

        if (isEmpty(formData.merchantName)) {
            newErrors.merchantName = "Merchant name is required";
        }

        if (isEmpty(formData.MerchantShoopeId)) {
            newErrors.MerchantShoopeId = "Merchant Shoope ID is required";
        }

        if (isEmpty(formData.sessionPath)) {
            newErrors.sessionPath = "Session path is required";
        }

        if (isEmpty(formData.sector_industry)) {
            newErrors.sector_industry = "Sector industry is required";
        }

        if (isEmpty(formData.office_address)) {
            newErrors.office_address = "Office address is required";
        }

        if (isEmpty(formData.factory_address)) {
            newErrors.factory_address = "Factory address is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));

        if (errors[name]) {
            setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
        }
    };

    const handleSubmitFormData = async (e) => {
        e.preventDefault();
        if (!validatevalueformdata()) return;

        setIsLoading(true);
        
        try {
            await createMerchant(formData);
            setFormData({
                username: "",
                email: "",
                password: "",
                passwordConfirmation: "",
                address: "",
                phoneNumber: ""
            });
            onClose();
            navigate("/dashboard", { replace: true });
            toast.success("Merchant berhasil dibuat");
        } catch (error) {
            toast.error("Gagal membuat merchant");
            console.error("Error saat membuat merchant, kesalahan pada server", error);
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
            <div className="bg-white p-4 rounded shadow-lg" style={{ width: "400px", maxHeight: "90vh", overflowY: "auto" }} ref={modalRef} onClick={(e) => e.stopPropagation()}>
                <h5 className="text-center">Add Merchant</h5>
                <hr />
                <form onSubmit={handleSubmitFormData}>
                    {[
                        { name: "username", label: "Username", type: "text" },
                        { name: "email", label: "Email", type: "email" },
                        { name: "password", label: "Password", type: "password" },
                        { name: "phone", label: "Phone number", type: "text" },
                        { name: "merchantName", label: "Merchant Name", type: "text" },
                        { name: "MerchantShoopeId", label: "Merchant Shoope Id", type: "text" },
                        { name: "sessionPath", label: "Session Path", type: "text" },
                        { name: "sector_industry", label: "Sector Industry", type: "text" },
                        { name: "office_address", label: "Office Address", type: "text" },
                        { name: "factory_address", label: "Factory Address", type: "text" },
                    ].map(({ name, label, type }) => (
                        <div className="mb-2" key={name}>
                            <label className="form-label" htmlFor={name}>
                                {label}
                            </label>
                            <input
                                type={type}
                                className={`form-control ${errors[name] ? "is-invalid" : ""}`}
                                name={name}
                                value={formData[name]}
                                onChange={handleInputChange}
                                style={{
                                    paddingLeft: "0.25rem !important",
                                }}
                            />
                            <div className="invalid-feedback">{errors[name]}</div>
                        </div>
                    ))}

                    <button type="submit" className="btn btn-success w-100" disabled={isLoading}>
                        {isLoading ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : (
                            "Add Merchant"
                        )}
                    </button>
                    <button type="button" className="btn btn-secondary w-100 mt-2" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    );
};

export default MerchantModalCreate;