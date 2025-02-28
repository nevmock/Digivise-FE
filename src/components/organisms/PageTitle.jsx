const PageTitle = ({ title, subtitle }) => {
    return (
        <div className="row">
            <div className="col-12">
                <div className="page-title-box">
                    <h4 className="mb-0">{subtitle}</h4>
                    <ol className="breadcrumb mb-0">
                        <li className="breadcrumb-item">
                            <a href="">{title}</a>
                        </li>
                        <li className="breadcrumb-item active">{subtitle}</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default PageTitle;