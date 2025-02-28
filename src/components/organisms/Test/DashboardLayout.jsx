import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children }) => {
    return (
        <div className="h-100 w-100 d-flex overflow-auto mw-100" style={{}}>
            {/* Sidebar */}
            <aside className="min-vh-100" style={{width: '20%'}}>
                <Sidebar />
            </aside>
            {/* Main Content */}
            <main className="min-vh-100 d-flex flex-column" style={{width: '80%'}}>
                {/* Header */}
                <Header />
                {/* Content */}
                <div className="p-4 flex-grow-1 w-100 h-100 bg-main-layout">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;