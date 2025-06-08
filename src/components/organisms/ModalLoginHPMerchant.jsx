import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { useAuth } from "../../context/Auth";


const MerchantModalLoginWithHandphone = ({ onClose, merchant}) => {
    const { loginToMerchantv2, setActiveMerchant  } = useAuth();
    const navigate = useNavigate();
    const modalRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        handphone: merchant?.handphone || "",
    });

    const isEmpty = (value) => !value?.trim();
    const isHandphoneValid = (handphone) => /^[0-9]{10,12}$/.test(handphone);

    const validateValueFormData = () => {
        const newErrors = {};

        if (isEmpty(formData.handphone)) {
            newErrors.handphone = "Handphone is required";
        } else if (!isHandphoneValid(formData.handphone)) {
            newErrors.handphone = "Handphone is not valid";
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
            const merchantData = await loginToMerchantv2(formData.handphone);
            if (!merchantData) {
                toast.error("Merchant tidak ditemukan, silakan coba lagi");
                return;
            }

            setActiveMerchant({
                ...merchant,
                ...merchantData
            });
            setFormData({ handphone: "" });
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
                        <label className="form-label">No Handphone</label>
                        <input
                            name="handphone"
                            type="text"
                            value={formData.handphone}
                            onChange={handleInputChange}
                            className={`form-control ${errors.handphone ? "is-invalid" : ""}`}
                        />
                        <div className="invalid-feedback">{errors.handphone}</div>
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
                </form>
            </div>
        </div>
    );
};

export default MerchantModalLoginWithHandphone;