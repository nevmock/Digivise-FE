export default function NotFound() {
    return (
        <>
            <div className="account-pages">
                <div className="container">
                    <div className="row justify-content-center align-items-center vh-100">
                        <div className="col-xl-6">
                            <div className="card auth-card">
                                <div className="card-body p-0">
                                    <div className="row align-items-center g-0">
                                        <div className="col">
                                            <div className="p-4">
                                                <div className="mx-auto mb-4 text-center">
                                                    <img src="assets/images/404.svg" alt="auth" height="250" className="mt-5 mb-3" />

                                                    <h2 className="fs-22 lh-base">Page Not Found !</h2>
                                                    <p className="text-muted mt-1 mb-4">The page you're trying to reach seems to have gone <br /> missing in the digital wilderness.</p>

                                                    <div className="text-center">
                                                        <a href="/dashboard" className="btn btn-danger">Back to Home</a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};