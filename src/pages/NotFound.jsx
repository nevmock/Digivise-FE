export default function NotFound() {
    return (
        <>
            <div class="account-pages">
                <div class="container">
                    <div class="row justify-content-center align-items-center vh-100">
                        <div class="col-xl-6">
                            <div class="card auth-card">
                                <div class="card-body p-0">
                                    <div class="row align-items-center g-0">
                                        <div class="col">
                                            <div class="p-4">
                                                <div class="mx-auto mb-4 text-center">
                                                    <img src="assets/images/404.svg" alt="auth" height="250" class="mt-5 mb-3" />

                                                    <h2 class="fs-22 lh-base">Page Not Found !</h2>
                                                    <p class="text-muted mt-1 mb-4">The page you're trying to reach seems to have gone <br /> missing in the digital wilderness.</p>

                                                    <div class="text-center">
                                                        <a href="/" class="btn btn-danger">Back to Home</a>
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