import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save, User, ArrowLeft, Trash2 } from 'lucide-react';
import { API_URL } from '../config';

const EditClient = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        email: '',
        phone: '',
        address: '',
        notes: ''
    });

    useEffect(() => {
        fetchClient();
    }, [id]);

    const fetchClient = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/clients/${id}`);
            setFormData(response.data.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            alert('Failed to fetch client details');
            navigate('/clients');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axios.put(`${API_URL}/api/clients/${id}`, formData);
            alert('Client updated successfully!');
            navigate('/clients');
        } catch (error) {
            console.error(error);
            alert('Failed to update client.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this client? This will NOT delete their job orders but will remove the client record.')) {
            try {
                await axios.delete(`${API_URL}/api/clients/${id}`);
                alert('Client deleted successfully');
                navigate('/clients');
            } catch (error) {
                console.error(error);
                alert('Failed to delete client');
            }
        }
    };

    if (loading) return <div className="container" style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

    return (
        <div className="container animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <Link to="/clients" className="btn btn-outline">
                    <ArrowLeft size={16} /> Back to Clients
                </Link>
                <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleDelete}>
                    <Trash2 size={16} /> Delete Client
                </button>
            </div>

            <div className="section-title">
                <h2>Edit Client: {formData.name}</h2>
            </div>

            <div className="card" style={{ maxWidth: '800px' }}>
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col">
                            <label className="form-label">Client Name *</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#888' }} />
                                <input type="text" className="form-control" style={{ paddingLeft: '40px' }} name="name" required value={formData.name} onChange={handleChange} placeholder="Full Name" />
                            </div>
                        </div>
                        <div className="col">
                            <label className="form-label">Company Name</label>
                            <input type="text" className="form-control" name="company" value={formData.company || ''} onChange={handleChange} placeholder="Company / Organization" />
                        </div>
                    </div>

                    <div className="row" style={{ marginTop: '20px' }}>
                        <div className="col">
                            <label className="form-label">Email Address</label>
                            <input type="email" className="form-control" name="email" value={formData.email || ''} onChange={handleChange} />
                        </div>
                        <div className="col">
                            <label className="form-label">Phone Number</label>
                            <input type="text" className="form-control" name="phone" value={formData.phone || ''} onChange={handleChange} />
                        </div>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <label className="form-label">Address</label>
                        <textarea className="form-control" name="address" rows="2" value={formData.address || ''} onChange={handleChange}></textarea>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <label className="form-label">Notes</label>
                        <textarea className="form-control" name="notes" rows="3" value={formData.notes || ''} onChange={handleChange} placeholder="Additional info..."></textarea>
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '30px' }} disabled={saving}>
                        {saving ? 'Updating...' : <><Save size={20} /> Update Client Details</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditClient;
