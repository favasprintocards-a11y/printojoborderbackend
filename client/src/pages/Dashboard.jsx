import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom'; // Changed from useHistory (v5) to useNavigate (v6)
import { Search, Filter, Download, Bell, Clock, Calendar } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { API_URL } from '../config';

const Dashboard = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [dateFilter, setDateFilter] = useState('');
    const [dueDateFilter, setDueDateFilter] = useState('');
    const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });
    const navigate = useNavigate();
    const location = useLocation();

    // Helper to format dates correctly
    const formatDate = (dateString, includeTime = false) => {
        if (!dateString) return 'N/A';

        // If it's just a date (YYYY-MM-DD), handle it without timezone shifts
        if (dateString.length === 10 && dateString.includes('-')) {
            const [y, m, d] = dateString.split('-');
            return `${d}/${m}/${y}`;
        }

        // For timestamps, handle UTC to Local conversion
        let d = new Date(dateString);
        // If the date string doesn't have a timezone, assume it's UTC (SQLite default)
        if (!dateString.includes('Z') && !dateString.includes('+')) {
            d = new Date(dateString + ' Z');
        }

        if (isNaN(d.getTime())) return dateString;

        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();

        if (includeTime) {
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${day}/${month}/${year} ${hours}:${minutes}`;
        }

        return `${day}/${month}/${year}`;
    };

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const clientId = queryParams.get('client_id');
        fetchJobs(clientId);
    }, [location.search]);

    const fetchJobs = async (clientId = null) => {
        try {
            const url = clientId
                ? `${API_URL}/api/jobs?client_id=${clientId}`
                : `${API_URL}/api/jobs`;

            const response = await axios.get(url);
            const data = response.data.data;
            setJobs(data);

            // Calculate stats
            const total = data.length;
            const completed = data.filter(j => j.status === 'Completed' || j.status === 'Dispatched').length;
            const active = total - completed;
            setStats({ total, active, completed });

            setLoading(false);
        } catch (error) {
            console.error("Error fetching jobs:", error);
            setLoading(false);
        }
    };

    const handleRowClick = (id) => {
        navigate(`/job/${id}`);
    };

    const exportToCSV = () => {
        if (jobs.length === 0) return;

        const headers = ["Job ID", "Date", "Submitted By", "Client", "Product Type", "Material", "Quantity", "Priority", "Status"];
        const csvContent = [
            headers.join(","),
            ...filteredJobs.map(job => [
                job.job_id_display || `ID-${job.id}`,
                formatDate(job.created_at),
                `"${job.submitted_by}"`,
                `"${job.client_name}"`,
                `"${job.product_type}"`,
                `"${job.material || ''}"`,
                job.quantity,
                job.priority,
                job.status
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `job_orders_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    const filteredJobs = jobs.filter(job => {
        const matchesSearch =
            job.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.submitted_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (job.job_id_display && job.job_id_display.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'All' || job.status === statusFilter;

        const matchesDate = !dateFilter || new Date(job.created_at).toISOString().split('T')[0] === dateFilter;

        const matchesDueDate = !dueDateFilter || (job.expected_delivery_date && job.expected_delivery_date.split('T')[0] === dueDateFilter);

        return matchesSearch && matchesStatus && matchesDate && matchesDueDate;
    });

    const upcomingJobs = jobs.filter(job => {
        if (!job.expected_delivery_date || job.status === 'Completed' || job.status === 'Dispatched') return false;
        // Normalize due date and today to local midnight for accurate day-diff
        const dueDate = new Date(job.expected_delivery_date + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diffTime = dueDate - today;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7; // Show overdue and next 7 days
    }).sort((a, b) => new Date(a.expected_delivery_date) - new Date(b.expected_delivery_date));

    return (
        <div className="container animate-fade-in">
            <div className="section-title" style={{ justifyContent: 'space-between', borderBottom: 'none' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    Dashboard
                </h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {new URLSearchParams(location.search).get('client_id') && (
                        <button className="btn btn-outline" onClick={() => navigate('/')}>
                            Show All Jobs
                        </button>
                    )}
                    <button className="btn btn-outline" onClick={exportToCSV}>
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="row" style={{ marginBottom: '25px' }}>
                <div className="card col" style={{ background: 'linear-gradient(135deg, #E36C2D 0%, #f2854b 100%)', color: 'white', border: 'none' }}>
                    <h3 style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '5px' }}>Total Jobs</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.total}</div>
                </div>
                <div className="card col" style={{ borderLeft: '4px solid var(--accent)' }}>
                    <h3 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>Active / Pending</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)' }}>{stats.active}</div>
                </div>
                <div className="card col" style={{ borderLeft: '4px solid var(--success)' }}>
                    <h3 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>Completed</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>{stats.completed}</div>
                </div>
            </div>

            {/* Critical Deadlines Notification Box */}
            {upcomingJobs.length > 0 ? (
                <div className="card animate-fade-in" style={{ marginBottom: '25px', borderLeft: '4px solid var(--danger)', background: 'rgba(231, 76, 60, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                        <Bell size={20} style={{ color: 'var(--danger)' }} />
                        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: '700', margin: 0 }}>Critical Deadlines (Overdue & Upcoming)</h3>
                        <span className="badge" style={{ background: 'var(--danger)', color: 'white', borderRadius: '12px', padding: '2px 10px' }}>{upcomingJobs.length}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                        {upcomingJobs.slice(0, 6).map(job => {
                            const dueDate = new Date(job.expected_delivery_date + 'T00:00:00');
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const diff = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));
                            const isOverdue = diff < 0;

                            return (
                                <div
                                    key={job.id}
                                    onClick={() => handleRowClick(job.id)}
                                    style={{
                                        padding: '12px',
                                        background: 'white',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        cursor: 'pointer',
                                        transition: 'var(--transition)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        boxShadow: isOverdue ? '0 2px 8px rgba(231, 76, 60, 0.1)' : 'none'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.borderColor = isOverdue ? 'var(--danger)' : 'var(--warning)'}
                                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                                >
                                    <div>
                                        <div style={{ fontWeight: '700', color: isOverdue ? 'var(--danger)' : 'var(--primary)', fontSize: '0.9rem' }}>{job.job_id_display || `#${job.id}`}</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '700' }}>{job.client_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                            <Clock size={12} /> Due: {formatDate(job.expected_delivery_date)}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            background: isOverdue ? '#fff5f5' : diff === 0 ? '#fff9db' : '#f8f9fa',
                                            color: isOverdue ? '#e03131' : diff === 0 ? '#f08c00' : '#495057',
                                            fontWeight: '700',
                                            border: isOverdue ? '1px solid #ffc9c9' : 'none'
                                        }}>
                                            {isOverdue ? `${Math.abs(diff)} Days Overdue` : diff === 0 ? 'Due Today' : diff === 1 ? 'Due Tomorrow' : `In ${diff} Days`}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {upcomingJobs.length > 6 && (
                        <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', fontWeight: '700' }}>
                            And {upcomingJobs.length - 6} more critical tasks...
                        </div>
                    )}
                </div>
            ) : (
                <div className="card" style={{ marginBottom: '25px', background: 'rgba(0,0,0,0.02)', borderStyle: 'dashed' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#888' }}>
                        <Bell size={20} style={{ opacity: 0.5 }} />
                        <span style={{ fontWeight: '600' }}>No pending or upcoming critical deadlines.</span>
                    </div>
                </div>
            )}

            <div className="card" style={{ marginBottom: '20px' }}>
                <div className="row" style={{ alignItems: 'flex-end' }}>
                    <div className="col" style={{ flex: 2 }}>
                        <label className="form-label">Search</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#888' }} />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search Client, Staff, or Job ID..."
                                style={{ paddingLeft: '40px' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col">
                        <label className="form-label">Filter Status</label>
                        <div style={{ position: 'relative' }}>
                            <Filter size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#888' }} />
                            <select
                                className="form-control"
                                style={{ paddingLeft: '40px' }}
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="All">All Statuses</option>
                                <option value="Received">Received</option>
                                <option value="In Design">In Design</option>
                                <option value="In Production">In Production</option>
                                <option value="Quality Check">Quality Check</option>
                                <option value="Dispatched">Dispatched</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    </div>
                    <div className="col" style={{ flex: 1 }}>
                        <label className="form-label">Order Date</label>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <input
                                type="date"
                                className="form-control"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            />
                            {dateFilter && (
                                <button
                                    className="btn btn-outline"
                                    style={{ padding: '0 10px', height: 'auto' }}
                                    onClick={() => setDateFilter('')}
                                    title="Clear Date"
                                >
                                    X
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="col" style={{ flex: 1 }}>
                        <label className="form-label">Due Date Search</label>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <input
                                type="date"
                                className="form-control"
                                value={dueDateFilter}
                                onChange={(e) => setDueDateFilter(e.target.value)}
                            />
                            {dueDateFilter && (
                                <button
                                    className="btn btn-outline"
                                    style={{ padding: '0 10px', height: 'auto' }}
                                    onClick={() => setDueDateFilter('')}
                                    title="Clear Due Date"
                                >
                                    X
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: '0' }}>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Job ID</th>
                                <th>Date</th>
                                <th>Due Date</th>
                                <th>Client</th>
                                <th>Product</th>
                                <th>Qty</th>
                                <th>Priority</th>
                                <th>Submitted By</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr>
                            ) : filteredJobs.length === 0 ? (
                                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>No jobs found</td></tr>
                            ) : (
                                filteredJobs.map(job => (
                                    <tr key={job.id} onClick={() => handleRowClick(job.id)} style={{ cursor: 'pointer' }}>
                                        <td style={{ fontWeight: '700', color: 'var(--primary)' }}>
                                            {job.job_id_display || '#' + job.id}
                                        </td>
                                        <td>{formatDate(job.created_at)}</td>
                                        <td style={{
                                            fontWeight: '700',
                                            color: job.priority === 'Urgent' ? 'var(--danger)' : 'var(--text-secondary)'
                                        }}>
                                            {formatDate(job.expected_delivery_date)}
                                        </td>
                                        <td>{job.client_name}</td>
                                        <td>{job.product_type}</td>
                                        <td>{job.quantity}</td>
                                        <td>
                                            <span style={{
                                                color: job.priority === 'Urgent' ? 'var(--danger)' : 'inherit',
                                                fontWeight: job.priority === 'Urgent' ? 'bold' : 'normal'
                                            }}>
                                                {job.priority}
                                            </span>
                                        </td>
                                        <td>{job.submitted_by}</td>
                                        <td><StatusBadge status={job.status} /></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
