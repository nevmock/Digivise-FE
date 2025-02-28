const Header = () => {
    return (
        <nav className="navbar navbar-expand-lg w-100 bg-secondary-subtle">
            <div className="container-fluid d-flex justify-content-between">
                <span className="navbar-brand"></span>
                <img
                    src="https://www.shutterstock.com/image-vector/user-icon-trendy-flat-style-600nw-1697898655.jpg"
                    alt="Account"
                    className="rounded-circle img-fluid"
                    style={{ cursor: 'pointer', objectFit: 'cover', width: '55px', height: '55px' }}
                />
            </div>
        </nav>
    );
};

export default Header;