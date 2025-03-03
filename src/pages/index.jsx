import Menu from "../components/organisms/Menu";
import PageTitle from "../components/organisms/PageTitle";
import Footer from "../components/organisms/Footer";


export default function Home() {
    const subtitle = "Dashboard";
    const title = "Digivise";

    return (
        <>
            <html lang="en">
                {/* <!-- START Wrapper --> */}
                <div className="app-wrapper">
                    <Menu />
                    <div className="page-content">
                        <div className="container-fluid">
                            <PageTitle title={title} subtitle={subtitle} />
                            <div className="row d-flex justify-content-center align-items-center">
                                <h1 className="text-dark text-center">WELCOME TO DIGIVISE APP</h1>
                            </div>
                            {/* Stats */}
                            {/* <div className="row">
                                <div className="col-md-6 col-xl-3">
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-6">
                                                    <p className="text-muted mb-0 text-truncate">Total Income</p>
                                                    <h3 className="text-dark mt-2 mb-0">$78.8k</h3>
                                                </div>

                                                <div className="col-6">
                                                    <div className="ms-auto avatar-md bg-soft-primary rounded">
                                                        <iconify-icon icon="solar:globus-outline" className="fs-32 avatar-title text-primary"></iconify-icon>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div id="chart01"></div>
                                    </div>
                                </div>

                                <div className="col-md-6 col-xl-3">
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-6">
                                                    <p className="text-muted mb-0 text-truncate">New Users</p>
                                                    <h3 className="text-dark mt-2 mb-0">2,150</h3>
                                                </div>

                                                <div className="col-6">
                                                    <div className="ms-auto avatar-md bg-soft-primary rounded">
                                                        <iconify-icon icon="solar:users-group-two-rounded-broken"
                                                            className="fs-32 avatar-title text-primary"></iconify-icon>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div id="chart02"></div>
                                    </div>
                                </div>

                                <div className="col-md-6 col-xl-3">
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-6">
                                                    <p className="text-muted mb-0 text-truncate">Orders</p>
                                                    <h3 className="text-dark mt-2 mb-0">1,784</h3>
                                                </div>

                                                <div className="col-6">
                                                    <div className="ms-auto avatar-md bg-soft-primary rounded">
                                                        <iconify-icon icon="solar:cart-5-broken"
                                                            className="fs-32 avatar-title text-primary"></iconify-icon>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div id="chart03"></div>
                                    </div>
                                </div>

                                <div className="col-md-6 col-xl-3">
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-6">
                                                    <p className="text-muted mb-0 text-truncate">Conversion Rate</p>
                                                    <h3 className="text-dark mt-2 mb-0">12.3%</h3>
                                                </div>

                                                <div className="col-6">
                                                    <div className="ms-auto avatar-md bg-soft-primary rounded">
                                                        <iconify-icon icon="solar:pie-chart-2-broken"
                                                            className="fs-32 avatar-title text-primary"></iconify-icon>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div id="chart04"></div>
                                    </div>
                                </div>
                            </div> */}
                            
                            {/* Chart */}
                            {/* <div className="row">
                                <div className="col-lg-4">
                                    <div className="card card-height-100">
                                        <div className="card-header d-flex align-items-center justify-content-between gap-2">
                                            <h4 className=" mb-0 flex-grow-1 mb-0">Revenue</h4>
                                            <div>
                                                <button type="button" className="btn btn-sm btn-outline-light">ALL</button>
                                                <button type="button" className="btn btn-sm btn-outline-light">1M</button>
                                                <button type="button" className="btn btn-sm btn-outline-light">6M</button>
                                                <button type="button" className="btn btn-sm btn-outline-light active">1Y</button>
                                            </div>
                                        </div>

                                        <div className="card-body pt-0">
                                            <div dir="ltr">
                                                <div id="dash-performance-chart" className="apex-charts"></div>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                <div className="col-lg-4">
                                    <div className="card card-height-100">
                                        <div className="card-header d-flex align-items-center justify-content-between gap-2">
                                            <h4 className="card-title flex-grow-1 mb-0">Sales By Category</h4>
                                            <div>
                                                <button type="button" className="btn btn-sm btn-outline-light">ALL</button>
                                                <button type="button" className="btn btn-sm btn-outline-light">1M</button>
                                                <button type="button" className="btn btn-sm btn-outline-light">6M</button>
                                                <button type="button" className="btn btn-sm btn-outline-light active">1Y</button>
                                            </div>
                                        </div>

                                        <div className="card-body">
                                            <div dir="ltr">
                                                <div id="conversions" className="apex-charts"></div>
                                            </div>
                                            <div className="table-responsive mb-n1 mt-2">
                                                <table className="table table-nowrap table-borderless table-sm table-centered mb-0">
                                                    <thead className="bg-light bg-opacity-50 thead-sm">
                                                        <tr>
                                                            <th className="py-1">
                                                                Category
                                                            </th>
                                                            <th className="py-1">Orders</th>
                                                            <th className="py-1">Perc.</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td>Grocery</td>
                                                            <td>187,232</td>
                                                            <td>
                                                                48.63%
                                                                <span className="badge badge-soft-success float-end">2.5% Up</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>Electonics</td>
                                                            <td>126,874</td>
                                                            <td>
                                                                36.08%
                                                                <span className="badge badge-soft-success float-end">8.5% Up</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>Other</td>
                                                            <td>90,127</td>
                                                            <td>
                                                                23.41%
                                                                <span className="badge badge-soft-danger float-end">10.98% Down</span>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-lg-4">
                                    <div className="card">
                                        <div
                                            className="d-flex card-header justify-content-between align-items-center border-bottom border-dashed">
                                            <h4 className="card-title mb-0">Sessions by Country</h4>
                                            <div className="dropdown">
                                                <a href="#" className="dropdown-toggle btn btn-sm btn-outline-light"
                                                    data-bs-toggle="dropdown" aria-expanded="false">
                                                    View Data
                                                </a>
                                                <div className="dropdown-menu dropdown-menu-end">
                                                    <a href="" className="dropdown-item">Download</a>
                                                    <a href="" className="dropdown-item">Export</a>
                                                    <a href="" className="dropdown-item">Import</a>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="card-body pt-0">
                                            <div id="world-map-markers" className="mt-3" style={{height: "309px"}}>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div> */}
                            
                            {/* Table */}
                            {/* <div className="row">
                                <div className="col-xl-6">
                                    <div className="card">
                                        <div className="card-header d-flex justify-content-between align-items-center">
                                            <h4 className="card-title mb-0">New Accounts</h4>
                                            <a href="#!" className="btn btn-sm btn-light">
                                                View All
                                            </a>
                                        </div>

                                        <div className="card-body pb-1">
                                            <div className="table-responsive">
                                                <table className="table table-hover mb-0 table-centered">
                                                    <thead>
                                                        <th className="py-1">ID</th>
                                                        <th className="py-1">Date</th>
                                                        <th className="py-1">User</th>
                                                        <th className="py-1">Account</th>
                                                        <th className="py-1">Username</th>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td>#US523</td>
                                                            <td>24 April, 2024</td>
                                                            <td>
                                                                <img src="assets/images/users/avatar-2.jpg" alt="avatar-2"
                                                                    className="img-fluid avatar-xs rounded-circle" />
                                                                <span className="align-middle ms-1">Dan Adrick</span>
                                                            </td>
                                                            <td>
                                                                <span className="badge badge-soft-success">Verified</span>
                                                            </td>
                                                            <td>@omions</td>
                                                        </tr>
                                                        <tr>
                                                            <td>#US652</td>
                                                            <td>24 April, 2024</td>
                                                            <td>
                                                                <img src="assets/images/users/avatar-3.jpg" alt="avatar-2"
                                                                    className="img-fluid avatar-xs rounded-circle" />
                                                                <span className="align-middle ms-1">Daniel Olsen</span>
                                                            </td>
                                                            <td>
                                                                <span className="badge badge-soft-success">Verified</span>
                                                            </td>
                                                            <td>@alliates</td>
                                                        </tr>
                                                        <tr>
                                                            <td>#US862</td>
                                                            <td>20 April, 2024</td>
                                                            <td>
                                                                <img src="assets/images/users/avatar-4.jpg" alt="avatar-2"
                                                                    className="img-fluid avatar-xs rounded-circle" />
                                                                <span className="align-middle ms-1">Jack Roldan</span>
                                                            </td>
                                                            <td>
                                                                <span className="badge badge-soft-warning">Pending</span>
                                                            </td>
                                                            <td>@griys</td>
                                                        </tr>
                                                        <tr>
                                                            <td>#US756</td>
                                                            <td>18 April, 2024</td>
                                                            <td>
                                                                <img src="assets/images/users/avatar-5.jpg" alt="avatar-2"
                                                                    className="img-fluid avatar-xs rounded-circle" />
                                                                <span className="align-middle ms-1">Betty Cox</span>
                                                            </td>
                                                            <td>
                                                                <span className="badge badge-soft-success">Verified</span>
                                                            </td>
                                                            <td>@reffon</td>
                                                        </tr>
                                                        <tr>
                                                            <td>#US420</td>
                                                            <td>18 April, 2024</td>
                                                            <td>
                                                                <img src="assets/images/users/avatar-6.jpg" alt="avatar-2"
                                                                    className="img-fluid avatar-xs rounded-circle" />
                                                                <span className="align-middle ms-1">Carlos
                                                                    Johnson</span>
                                                            </td>
                                                            <td>
                                                                <span className="badge badge-soft-danger">Blocked</span>
                                                            </td>
                                                            <td>@bebo</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-6">
                                    <div className="card">
                                        <div className="card-header d-flex justify-content-between align-items-center">
                                            <h4 className="card-title mb-0">
                                                Recent Transactions
                                            </h4>

                                            <a href="#!" className="btn btn-sm btn-light">
                                                View All
                                            </a>
                                        </div>

                                        <div className="card-body">
                                            <div className="table-responsive">
                                                <table className="table table-hover mb-0 table-centered">
                                                    <thead>
                                                        <th className="py-1">ID</th>
                                                        <th className="py-1">Date</th>
                                                        <th className="py-1">Amount</th>
                                                        <th className="py-1">Status</th>
                                                        <th className="py-1">
                                                            Description
                                                        </th>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td>#98521</td>
                                                            <td>24 April, 2024</td>
                                                            <td>$120.55</td>
                                                            <td>
                                                                <span className="badge bg-success">Cr</span>
                                                            </td>
                                                            <td>Commisions</td>
                                                        </tr>
                                                        <tr>
                                                            <td>#20158</td>
                                                            <td>24 April, 2024</td>
                                                            <td>$9.68</td>
                                                            <td>
                                                                <span className="badge bg-success">Cr</span>
                                                            </td>
                                                            <td>Affiliates</td>
                                                        </tr>
                                                        <tr>
                                                            <td>#36589</td>
                                                            <td>20 April, 2024</td>
                                                            <td>$105.22</td>
                                                            <td>
                                                                <span className="badge bg-danger">Dr</span>
                                                            </td>
                                                            <td>Grocery</td>
                                                        </tr>
                                                        <tr>
                                                            <td>#95362</td>
                                                            <td>18 April, 2024</td>
                                                            <td>$80.59</td>
                                                            <td>
                                                                <span className="badge bg-success">Cr</span>
                                                            </td>
                                                            <td>Refunds</td>
                                                        </tr>
                                                        <tr>
                                                            <td>#75214</td>
                                                            <td>18 April, 2024</td>
                                                            <td>$750.95</td>
                                                            <td>
                                                                <span className="badge bg-danger">Dr</span>
                                                            </td>
                                                            <td>Bill Payments</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>   */}
                        </div>
                        <Footer />
                    </div>
                </div>
                {/* <!-- END Wrapper --> */}
            </html>
        </>
    )
};