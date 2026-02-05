import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Printer, List, PlusCircle } from 'lucide-react';

const Header = () => {
    const location = useLocation();

    return (
        <header className="header">
            <div className="container header-content">
                <Link to="/" className="brand">
                    <Printer size={28} />
                    <span>Printo Cards Task Manager</span>
                </Link>
                <nav className="nav-links">
                    <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
                        <List size={18} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }} />
                        Dashboard
                    </Link>
                    <Link to="/new" className={`nav-item ${location.pathname === '/new' ? 'active' : ''}`}>
                        <PlusCircle size={18} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }} />
                        New Job Order
                    </Link>
                </nav>
            </div>
        </header>
    );
};

export default Header;
