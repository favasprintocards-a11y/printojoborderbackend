import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Clock, User, Phone, CheckCircle, Printer, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { API_URL } from '../config';

const JobDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

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
            let hours = d.getHours();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
        }

        return `${day}/${month}/${year}`;
    };

    useEffect(() => {
        fetchJob();
    }, [id]);

    const fetchJob = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/jobs/${id}`);
            setJob(response.data.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleStatusChange = async (e) => {
        const newStatus = e.target.value;
        setUpdating(true);
        try {
            await axios.put(`${API_URL}/api/jobs/${id}/status`, { status: newStatus });
            setJob(prev => ({ ...prev, status: newStatus }));
        } catch (error) {
            alert('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this job order? This action cannot be undone.')) {
            try {
                await axios.delete(`${API_URL}/api/jobs/${id}`);
                alert('Job Order Deleted Successfully');
                navigate('/');
            } catch (error) {
                console.error(error);
                alert('Failed to delete job order.');
            }
        }
    };

    if (loading) return <div className="container" style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
    if (!job) return <div className="container">Job not found</div>;

    return (
        <div className="container animate-fade-in">
            {/* Print-only header */}
            <div className="print-only" style={{ display: 'none', textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '15px' }}>
                <h1 style={{ margin: 0, fontSize: '28pt', fontWeight: '700', color: '#000' }}>PRINTO JOB ORDER</h1>
                <p style={{ margin: '5px 0', fontSize: '12pt', fontWeight: '700' }}>Production Slip & Feedback Form</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '10pt', marginTop: '5px' }}>
                    <span>Order Date: {formatDate(job.created_at, true)}</span>
                    <span>Job ID: {job.job_id_display || `#${job.id}`}</span>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <Link to="/" className="btn btn-outline">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link to={`/job/edit/${id}`} className="btn btn-primary" style={{ background: 'var(--info)' }}>
                        <Edit2 size={16} /> Edit
                    </Link>
                    <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleDelete}>
                        <Trash2 size={16} /> Delete
                    </button>
                    <button className="btn btn-outline" onClick={() => window.print()}>
                        <Printer size={16} /> Print Job Slip
                    </button>
                </div>
            </div>

            <div className="card" style={{ borderTop: '4px solid var(--primary)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <h1 style={{ color: 'var(--primary)', marginBottom: '5px' }}>Job Order: {job.job_id_display || `#${job.id}`}</h1>
                        <div style={{ color: '#666', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Clock size={14} /> Created: {formatDate(job.created_at, true)}
                        </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ background: 'var(--bg-surface)', padding: '15px', borderRadius: '8px', minWidth: '220px', border: '1px solid var(--border)', textAlign: 'right' }}>
                            <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Current Status</div>
                            <div style={{ marginBottom: '10px' }}><StatusBadge status={job.status} /></div>

                            <select className="form-control" value={job.status} onChange={handleStatusChange} disabled={updating} style={{ fontSize: '0.9rem', padding: '6px' }}>
                                <option>Received</option>
                                <option>In Design</option>
                                <option>In Production</option>
                                <option>Quality Check</option>
                                <option>Dispatched</option>
                                <option>Completed</option>
                            </select>
                        </div>

                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px', padding: '15px', background: 'rgba(52, 152, 219, 0.05)', borderRadius: '8px', borderLeft: '4px solid var(--info)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <User size={18} style={{ color: 'var(--info)' }} />
                            <span style={{ fontWeight: '700' }}>Staff:</span>
                            <span>{job.submitted_by} {job.submitted_contact && <small style={{ color: '#666' }}>({job.submitted_contact})</small>}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                            <span style={{ fontWeight: '700' }}>Total Items:</span>
                            <span>{(job.items || []).length} items (Qty: {(job.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0)})</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col" style={{ flex: 1 }}>
                    <div className="card" style={{ height: '100%' }}>
                        <h3 className="section-title">Client Information</h3>
                        <p><strong>Name:</strong> {job.client_name}</p>
                        {job.client_company && <p><strong>Company:</strong> {job.client_company}</p>}
                        <p><strong>Phone:</strong> {job.client_phone || 'N/A'}</p>
                        <p><strong>Email:</strong> {job.client_email || 'N/A'}</p>
                        {job.client_address && <p><strong>Address:</strong> {job.client_address}</p>}
                    </div>
                </div>
                <div className="col" style={{ flex: 1 }}>
                    <div className="card" style={{ height: '100%' }}>
                        <h3 className="section-title">Delivery Details</h3>
                        <p><strong>Expected Date:</strong> {formatDate(job.expected_delivery_date)}</p>
                        <p><strong>Priority:</strong> {job.priority}</p>
                        <p><strong>Mode:</strong> {job.delivery_mode}</p>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
                <h3 className="section-title">Product Items - {job.items?.length || 0}</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead style={{ background: 'var(--bg-surface)' }}>
                            <tr style={{ textAlign: 'left' }}>
                                <th style={{ padding: '12px' }}>Product</th>
                                <th style={{ padding: '12px' }}>Details</th>
                                <th style={{ padding: '12px' }}>Quantity</th>
                                <th style={{ padding: '12px' }}>Rate</th>
                                <th style={{ padding: '12px' }}>Advance</th>
                                <th style={{ padding: '12px' }}>Additional Info</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(job.items || []).map((item, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{item.product_type}</div>
                                        {item.card_size && item.card_size.trim() !== '' && (
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>Size: {item.card_size}</div>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px', fontSize: '0.9rem' }}>
                                        {item.material && item.material.trim() !== '' && (
                                            <div><strong>Material:</strong> {item.material}</div>
                                        )}
                                        {(item.printing_type && item.printing_type.trim() !== '') || (item.printing_mode && item.printing_mode.trim() !== '') ? (
                                            <div>
                                                <strong>Printing:</strong> {' '}
                                                {item.printing_type && item.printing_type.trim() !== '' ? item.printing_type : ''}
                                                {item.printing_type && item.printing_mode && item.printing_type.trim() !== '' && item.printing_mode.trim() !== '' ? ' (' : ''}
                                                {item.printing_mode && item.printing_mode.trim() !== '' ? item.printing_mode : ''}
                                                {item.printing_type && item.printing_mode && item.printing_type.trim() !== '' && item.printing_mode.trim() !== '' ? ')' : ''}
                                            </div>
                                        ) : null}
                                        {item.finish && item.finish.trim() !== '' && (
                                            <div><strong>Finish:</strong> {item.finish}</div>
                                        )}
                                        {item.accessories && item.accessories.trim() !== '' && (
                                            <div><strong>Accessories:</strong> {item.accessories}</div>
                                        )}
                                        {item.binding && item.binding.trim() !== '' && (
                                            <div><strong>Binding:</strong> {item.binding}</div>
                                        )}
                                        {item.corner && item.corner.trim() !== '' && (
                                            <div><strong>Corner:</strong> {item.corner}</div>
                                        )}
                                        {item.paper_thickness && item.paper_thickness.trim() !== '' && (
                                            <div><strong>Paper Thickness:</strong> {item.paper_thickness}</div>
                                        )}
                                        {item.variable_data && item.variable_data.trim() !== '' && (
                                            <div><strong>Variable Data:</strong> {item.variable_data}</div>
                                        )}
                                        {/* Dynamic Custom Fields */}
                                        {(() => {
                                            if (!item.custom_fields) return null;
                                            try {
                                                const custom = typeof item.custom_fields === 'string' ? JSON.parse(item.custom_fields) : item.custom_fields;
                                                return Object.entries(custom).map(([key, val]) => (
                                                    val && val.trim() !== '' ? (
                                                        <div key={key}>
                                                            <strong>{key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}:</strong> {val}
                                                        </div>
                                                    ) : null
                                                ));
                                            } catch (e) {
                                                console.error("Error parsing custom fields:", e);
                                                return null;
                                            }
                                        })()}

                                    </td>
                                    <td style={{ padding: '12px' }}>{item.quantity}</td>
                                    <td style={{ padding: '12px' }}>₹{item.rate || 0}</td>
                                    <td style={{ padding: '12px' }}>₹{item.advance_amount || 0}</td>
                                    <td style={{ padding: '12px', fontSize: '0.85rem' }}>
                                        {item.additional_info || <span style={{ color: '#ccc' }}>None</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
                <h3 className="section-title">Instructions</h3>
                <div>
                    <div style={{ background: 'var(--bg-main)', padding: '15px', borderRadius: '4px', marginTop: '10px', whiteSpace: 'pre-wrap', border: '1px solid var(--border)' }}>
                        {job.special_instructions || 'None'}
                    </div>
                </div>
            </div>

            {/* Print Footer Section */}
            <div className="print-only" style={{ display: 'none', marginTop: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '40px' }}>
                    <div style={{ flex: 1 }}>
                        <h4 style={{ borderBottom: '1px solid #000', paddingBottom: '5px', marginBottom: '10px' }}>Terms & Conditions</h4>
                        <ul style={{ fontSize: '9pt', paddingLeft: '20px', margin: 0 }}>
                            <li>Colors may vary slightly from screen to print.</li>
                            <li>Check all spelling and details before approval.</li>
                            <li>No returns or refunds after production starts.</li>
                        </ul>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '50px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ textAlign: 'center', borderTop: '1px solid #000', width: '150px', paddingTop: '5px' }}>
                                <div style={{ fontSize: '10pt', fontWeight: '700' }}>Staff Signature</div>
                            </div>
                            <div style={{ textAlign: 'center', borderTop: '1px solid #000', width: '150px', paddingTop: '5px' }}>
                                <div style={{ fontSize: '10pt', fontWeight: '700' }}>Customer Signature</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '8pt', color: '#666', fontStyle: 'italic' }}>
                    This is a computer-generated document. No seal required.
                </div>
            </div>
        </div>
    );
};

export default JobDetails;
