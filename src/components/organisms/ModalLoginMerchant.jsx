import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { loginMerchant } from "../../resolver/auth/authMerchant";


const MerchantModal = ({ onClose }) => {
    const navigate = useNavigate();
    const modalRef = useRef(null);

    const [formData, setFormData] = useState({
        noPhone: "",
        password: "",
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const isEmpty = (value) => !value?.trim();
    const isPhoneValid = (phone) => /^\d{1,11}$/.test(phone);

    const validateFormData = () => {
        const newErrors = {};

        if (isEmpty(formData.noPhone)) {
            newErrors.noPhone = "Phone number is required";
        } else if (!isPhoneValid(formData.noPhone)) {
            newErrors.noPhone = "Phone number must contain only digits (max 11)";
        }

        if (isEmpty(formData.password)) {
            newErrors.password = "Password is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmitFormData = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (!validateFormData()) {
            setIsLoading(false);
            return;
        }

        try {
            await loginMerchant(formData.noPhone, formData.password);
            alert("Login berhasil");
            setFormData({ noPhone: "", password: "" });
            navigate("/dashboard");
        } catch (error) {
            alert("Login gagal, silakan coba lagi");
            console.error("Gagal login, error pada server:", error);
        } finally {
            setIsLoading(false);
            onClose();
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
                        <label className="form-label">Phone number</label>
                        <input
                            type="text"
                            className={`form-control ${errors.noPhone ? "is-invalid" : ""}`}
                            value={formData.noPhone}
                            onChange={(e) =>
                                setFormData({ ...formData, noPhone: e.target.value })
                            }
                        />
                        <div className="invalid-feedback">{errors.noPhone}</div>
                    </div>

                    <div className="mb-2">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className={`form-control ${errors.password ? "is-invalid" : ""}`}
                            value={formData.password}
                            onChange={(e) =>
                                setFormData({ ...formData, password: e.target.value })
                            }
                        />
                        <div className="invalid-feedback">{errors.password}</div>
                    </div>

                    <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
                        {isLoading ? "Logging in..." : "Login"}
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

export default MerchantModal;


// import { useState, useRef } from "react";
// import { loginMerchant } from "../../resolver/auth/authMerchant";
// import { useNavigate } from "react-router-dom";

// const MerchantModal = ({ onClose }) => {
//     const navigate = useNavigate();
//     const modalRef = useRef(null);
//     const [formData, setFormData] = useState({
//         noPhone: "",
//         password: "",
//     });
//     const [errors, setErrors] = useState({});
//     const [isLoading, setIsLoading] = useState(false);

//     const validateformdata = () => {
//         let newErrors = {};
        
//         if (!formData.noPhone) newErrors.noPhone = "Phone number required";
//         if (!formData.password) newErrors.password = "Phone number required";

//         if (formData.noPhone != "" || formData.noPhone != null) {
//             if (!formData.noPhone.match(/^\d+$/)) newErrors.noPhone = "Phone number must be a number";
//             if (formData.noPhone.length > 11) newErrors.noPhone = "Phone number must be valid";
//         }

//         setErrors(newErrors);
//         return Object.keys(newErrors).length === 0;
//     };

//     const handleSubmitFormData = async (e) => {
//         e.preventDefault();
//         setIsLoading(true);
//         if (!validateformdata()) return;

//         try {
//             await loginMerchant(formData.noPhone, formData.password);
//             alert("Login berhasil");
//             setFormData({
//                 noPhone: "",
//                 password: "",
//             });
//             navigate("/dashboard");
//         } catch (error) {
//             alert("Login gagal, silahkan coba lagi");
//             console.error("Gagal login, error pada server:", error);
//         } finally {
//             setIsLoading(false);
//             onClose();
//         }

//         // setTimeout(() => {
//         //     alert("Login berhasil");
//         //     setIsLoading(false);
//         //     onClose();
//         //     window.location.href = "/";
//         // }, 3000);
//     };

//     return (
//         <div
//             className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
//             style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050 }}
//             onClick={onClose}
//         >
//             <div className="bg-white p-4 rounded shadow-lg" style={{ width: "400px", maxHeight: "90vh", overflowY: "auto" }} ref={modalRef} onClick={(e) => e.stopPropagation()}>
//                 <h5 className="text-center">Add Merchant</h5>
//                 <hr />
//                 <form onSubmit={handleSubmitFormData}>
//                     <div className="mb-2">
//                         <label className="form-label">Phone number</label>
//                         <input
//                             type="text"
//                             className={`form-control ${errors.phone ? "is-invalid" : ""}`}
//                             value={formData.noPhone}
//                             onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
//                         />
//                         <div className="invalid-feedback">{errors.noPhone}</div>
//                     </div>
//                     <div className="mb-2">
//                         <label className="form-label">Password</label>
//                         <input
//                             type="password"
//                             className={`form-control ${errors.password ? "is-invalid" : ""}`}
//                             value={formData.password}
//                             onChange={(e) => setFormData({ ...formData, password: e.target.value })}
//                         />
//                         <div className="invalid-feedback">{errors.password}</div>
//                     </div>

//                     <button type="submit" className="btn btn-primary w-100">Login</button>
//                     <button type="button" className="btn btn-secondary w-100 mt-2" onClick={onClose}>Cancel</button>
//                 </form>
//             </div>
//         </div>
//     );
// };

// export default MerchantModal;