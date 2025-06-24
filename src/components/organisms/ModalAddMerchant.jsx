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
        name: "",
        sectorIndustry: "",
        officeAddress: "",
        factoryAddress: "",
    });

    const isEmpty = (value) => !value?.trim();
    const validatevalueformdata = () => {
        const newErrors = {};

        if (isEmpty(formData.name)) {
            newErrors.name = "Merchant name is required";
        }

        if (isEmpty(formData.sectorIndustry)) {
            newErrors.sectorIndustry = "Sector industry is required";
        }

        if (isEmpty(formData.officeAddress)) {
            newErrors.officeAddress = "Office address is required";
        }

        if (isEmpty(formData.factoryAddress)) {
            newErrors.factoryAddress = "Factory address is required";
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
                name: "",
                sectorIndustry: "",
                officeAddress: "",
                factoryAddress: "",
            });
            onClose();
            navigate("/dashboard", { replace: true });
            toast.success("Merchant berhasil dibuat");
            window.location.reload();
        } catch (error) {
            toast.error("Gagal membuat merchant");
            console.error("Error saat membuat merchant, kesalahan pada server", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="container-modal"
            onClick={onClose}
        >
            <div className="bg-white p-4 rounded shadow-lg" style={{ width: "420px", maxHeight: "90vh", overflowY: "auto" }} ref={modalRef} onClick={(e) => e.stopPropagation()}>
                <h5 className="text-center">Create Merchant</h5>
                <hr />
                <form onSubmit={handleSubmitFormData}>
                    {[
                        { name: "name", label: "Merchant Name", type: "text" },
                        { name: "sectorIndustry", label: "Sector Industry", type: "text" },
                        { name: "officeAddress", label: "Office Address", type: "text" },
                        { name: "factoryAddress", label: "Factory Address", type: "text" },
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

                    <button type="submit" className="btn btn-success w-100 mt-3" disabled={isLoading}>
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