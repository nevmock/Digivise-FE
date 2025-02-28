import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);

        setTimeout(() => {
            setIsLoading(false);
            navigate("/verification-otp");
        }, 2000);
    };

    return (
        <>
            <div className="vh-100 container d-flex justify-content-center align-items-center">
                <div className="bg-secondary-subtle" style={{ width: '450px' }}>
                    <div className="px-4 gap-4 d-flex flex-column py-5">
                        <h1 className="text-black">Login</h1>
                        <form onSubmit={handleSubmit}>
                            <div class="mb-3">
                                <label htmlFor="exampleInputEmail1" class="form-label">Email</label>
                                <input type="email" class="form-control py-2" id="exampleInputEmail1" aria-describedby="emailHelp" />
                            </div>
                            <div class="mb-3">
                                <label htmlFor="exampleInputPassword1" class="form-label">Password</label>
                                <input type="password" class="form-control py-2" id="exampleInputPassword1" />
                            </div>
                            <button type="submit" className="w-100 py-2 btn btn-dark" disabled={isLoading}>
                                {isLoading ? (
                                    <div className="spinner-border spinner-border-sm" role="status">
                                        <span className="visually-hidden ">Loading...</span>
                                    </div>
                                ) : (
                                    "Login"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
};