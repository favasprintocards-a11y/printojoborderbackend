import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Save, User, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';

const NewClient = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        email: '',
        phone: '',
        address: '',
        notes: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(API_URL + '/api/clients', formData);
            alert('Client added successfully!');
            navigate('/clients');
        } catch (error) {
            console.error(error);
            alert('Failed to add client.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container animate-fade-in">
            <div style={{ marginBottom: '20px' }}>
                <Link to="/clients" className="btn btn-outline">
                    <ArrowLeft size={16} /> Back to Clients
                </Link>
            </div>

            <div className="section-title">
                <h2>Add New Client</h2>
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
                            <input type="text" className="form-control" name="company" value={formData.company} onChange={handleChange} placeholder="Company / Organization" />
                        </div>
                    </div>

                    <div className="row" style={{ marginTop: '20px' }}>
                        <div className="col">
                            <label className="form-label">Email Address</label>
                            <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} />
                        </div>
                        <div className="col">
                            <label className="form-label">Phone Number</label>
                            <input type="text" className="form-control" name="phone" value={formData.phone} onChange={handleChange} />
                        </div>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <label className="form-label">Address</label>
                        <textarea className="form-control" name="address" rows="2" value={formData.address} onChange={handleChange}></textarea>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <label className="form-label">Notes</label>
                        <textarea className="form-control" name="notes" rows="3" value={formData.notes} onChange={handleChange} placeholder="Additional info..."></textarea>
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '30px' }} disabled={loading}>
                        {loading ? 'Saving...' : <><Save size={20} /> Save Client</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default NewClient;
