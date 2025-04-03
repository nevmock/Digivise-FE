import React, { useState, useRef } from "react";

const MerchantModal = ({ onClose }) => {
    const modalRef = useRef(null);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        phone: "",
        sector_industry: "",
        office_address: "",
        factory_address: "",
    });

    const [errors, setErrors] = useState({});

    const validate = () => {
        let newErrors = {};

        if (!formData.username) newErrors.username = "Username required";
        if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = "Email not valid";
        if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
        if (!formData.phone.match(/^\d+$/)) newErrors.phone = "Phone number must be a number";
        if (!formData.sector_industry) newErrors.sector_industry = "Sector industry required";
        if (!formData.office_address) newErrors.office_address = "Office address required";
        if (!formData.factory_address) newErrors.factory_address = "Factory address required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        setTimeout(() => {
            alert("Merchant added successfully!");
            onClose();
            window.location.href = "/";
        }, 1000);
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
                <form onSubmit={handleSubmit}>
                    <div className="mb-2">
                        <label className="form-label">Username</label>
                        <input
                            type="text"
                            className={`form-control ${errors.username ? "is-invalid" : ""}`}
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                        <div className="invalid-feedback">{errors.username}</div>
                    </div>

                    <div className="mb-2">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className={`form-control ${errors.email ? "is-invalid" : ""}`}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        <div className="invalid-feedback">{errors.email}</div>
                    </div>

                    <div className="mb-2">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className={`form-control ${errors.password ? "is-invalid" : ""}`}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        <div className="invalid-feedback">{errors.password}</div>
                    </div>

                    <div className="mb-2">
                        <label className="form-label">Phone number</label>
                        <input
                            type="text"
                            className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                        <div className="invalid-feedback">{errors.phone}</div>
                    </div>

                    <div className="mb-2">
                        <label className="form-label">Sector Industry</label>
                        <input
                            type="text"
                            className={`form-control ${errors.sector_industry ? "is-invalid" : ""}`}
                            value={formData.sector_industry}
                            onChange={(e) => setFormData({ ...formData, sector_industry: e.target.value })}
                        />
                        <div className="invalid-feedback">{errors.sector_industry}</div>
                    </div>

                    <div className="mb-2">
                        <label className="form-label">Office Address</label>
                        <input
                            type="text"
                            className={`form-control ${errors.office_address ? "is-invalid" : ""}`}
                            value={formData.office_address}
                            onChange={(e) => setFormData({ ...formData, office_address: e.target.value })}
                        />
                        <div className="invalid-feedback">{errors.office_address}</div>
                    </div>

                    <div className="mb-2">
                        <label className="form-label">Factory Address</label>
                        <input
                            type="text"
                            className={`form-control ${errors.factory_address ? "is-invalid" : ""}`}
                            value={formData.factory_address}
                            onChange={(e) => setFormData({ ...formData, factory_address: e.target.value })}
                        />
                        <div className="invalid-feedback">{errors.factory_address}</div>
                    </div>

                    <button type="submit" className="btn btn-primary w-100">Add Merchant</button>
                    <button type="button" className="btn btn-secondary w-100 mt-2" onClick={onClose}>Cancel</button>
                </form>
            </div>
        </div>
    );
};

export default MerchantModal;