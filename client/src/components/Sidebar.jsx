import React from 'react';
import logo from '../assets/PrintoLogoPNG.png';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardList, PlusCircle, Printer, Settings, Bell } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const Sidebar = ({ isOpen, onClose }) => {
    const { criticalCount } = useNotifications();

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-brand" style={{ gap: '12px', display: 'flex', alignItems: 'center' }}>
                <img src={logo} alt="Printo Logo" style={{ width: '35px', height: '35px', objectFit: 'contain' }} />
                <span>Job Order</span>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">
                    <span className="nav-label">Main</span>
                    <NavLink
                        to="/"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={onClose}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <LayoutDashboard size={20} />
                            <span>Dashboard</span>
                        </div>
                        {criticalCount > 0 && (
                            <span className="badge pulse" style={{ background: 'var(--danger)', color: 'white', fontSize: '0.7rem', minWidth: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                                {criticalCount}
                            </span>
                        )}
                    </NavLink>
                </div>

                <div className="nav-section">
                    <span className="nav-label">Customer</span>
                    <NavLink
                        to="/clients"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={onClose}
                    >
                        <Users size={20} />
                        <span>Clients</span>
                    </NavLink>
                    <NavLink
                        to="/new-client"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={onClose}
                    >
                        <PlusCircle size={20} />
                        <span>Add Client</span>
                    </NavLink>
                </div>

                <div className="nav-section">
                    <span className="nav-label">Orders</span>
                    <NavLink
                        to="/new"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={onClose}
                    >
                        <PlusCircle size={20} />
                        <span>New Order</span>
                    </NavLink>
                </div>

                <div className="nav-section">
                    <span className="nav-label">System</span>
                    <NavLink
                        to="/admin"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={onClose}
                    >
                        <Settings size={20} />
                        <span>Admin & Settings</span>
                    </NavLink>
                </div>
            </nav>

            <div className="sidebar-footer">
                <p>© Printo Cards</p>
            </div>
        </aside>
    );
};

export default Sidebar;
