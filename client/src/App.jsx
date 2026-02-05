import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import NewJob from './pages/NewJob';
import JobDetails from './pages/JobDetails';
import EditJob from './pages/EditJob';
import Clients from './pages/Clients';
import NewClient from './pages/NewClient';
import Admin from './pages/Admin';
import Login from './pages/Login';
import EditClient from './pages/EditClient';
import { Menu, X } from 'lucide-react';
import { NotificationProvider } from './context/NotificationContext';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <NotificationProvider>
      <Router>
        <div className="app-container">
          {/* Mobile Toggle Button */}
          <button className="mobile-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Sidebar Overlay */}
          <div
            className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
            onClick={closeSidebar}
          ></div>

          <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

          <div className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/new-client" element={<NewClient />} />
              <Route path="/client/edit/:id" element={<EditClient />} />
              <Route path="/new" element={<NewJob />} />
              <Route path="/job/:id" element={<JobDetails />} />
              <Route path="/job/edit/:id" element={<EditJob />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </div>
        </div>
      </Router>
    </NotificationProvider>
  );
}

export default App;
