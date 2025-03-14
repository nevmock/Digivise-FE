import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Menu from "../../components/organisms/Menu";
import Footer from "../../components/organisms/Footer";
import jsonData from "../../api/ads.json";

export default function PerformanceAdsPage() {
    const [totalProduk, setTotalProduk] = useState(0);

    useEffect(() => {
        if (jsonData && jsonData.length > 0) {
            const entryList = jsonData[0]?.data?.data?.entry_list || [];
            setTotalProduk(entryList.length);
        }
    }, []);
    
    return (
        <>
            <html lang="en">
                <div className="app-wrapper">
                    <Menu />
                    <div className="page-content">
                        <div className="container-fluid">
                            <h5 className="mb-2">Total Produk {totalProduk}</h5>
                            <div className="d-flex flex-column gap-4">
                                <div className="row g-3">
                                    <div className="col-12 col-md-6 col-lg-3">
                                        <div
                                            style={{ cursor: "pointer" }}
                                            className="card border-light shadow-sm h-100 ads-bg-button-filter-impression text-white"
                                        >
                                            <div className="card-body">
                                                <h6 className="card-title text-primary">Biaya</h6>
                                                <p className="card-text fs-4 fw-bold">
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-12 col-md-6 col-lg-3">
                                        <div
                                            style={{ cursor: "pointer" }}
                                            className="card border-light shadow-sm h-100 ads-bg-button-filter-impression text-white"
                                        >
                                            <div className="card-body">
                                                <h6 className="card-title text-primary">Iklan Dilihat</h6>
                                                <p className="card-text fs-4 fw-bold">
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-12 col-md-6 col-lg-3">
                                        <div
                                            style={{ cursor: "pointer" }}
                                            className="card border-light shadow-sm h-100 ads-bg-button-filter-impression text-white"
                                        >
                                            <div className="card-body">
                                                <h6 className="card-title text-primary">Click</h6>
                                                <p className="card-text fs-4 fw-bold">
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-12 col-md-6 col-lg-3">
                                        <div
                                            style={{ cursor: "pointer" }}
                                            className="card border-light shadow-sm h-100 ads-bg-button-filter-impression text-white"
                                        >
                                            <div className="card-body">
                                                <h6 className="card-title text-primary">CTR</h6>
                                                <p className="card-text fs-4 fw-bold">
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-12 col-md-6 col-lg-3">
                                        <div
                                            style={{ cursor: "pointer" }}
                                            className="card border-light shadow-sm h-100 ads-bg-button-filter-impression text-white"
                                        >
                                            <div className="card-body">
                                                <h6 className="card-title text-primary">ACOS</h6>
                                                <p className="card-text fs-4 fw-bold">
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-12 col-md-6 col-lg-3">
                                        <div
                                            style={{ cursor: "pointer" }}
                                            className="card border-light shadow-sm h-100 ads-bg-button-filter-impression text-white"
                                        >
                                            <div className="card-body">
                                                <h6 className="card-title text-primary">ROAS</h6>
                                                <p className="card-text fs-4 fw-bold">
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ height: "200px" }} className="w-100 d-flex gap-3">
                                    <div className="w-100 h-100 bg-secondary-subtle d-flex justify-content-center align-items-center">
                                        <p className="text-dark fs-2">performance chart</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Footer />
                    </div>
                </div>
            </html>
        </>
    )
};