import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, Building, Phone, Mail, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { API_URL } from '../config';

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const response = await axios.get(API_URL + '/api/clients');
            setClients(response.data.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching clients:", error);
            setLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete ${name}? This will remove their record but keep their job history.`)) {
            try {
                await axios.delete(`${API_URL}/api/clients/${id}`);
                setClients(clients.filter(c => c.id !== id));
            } catch (error) {
                alert('Failed to delete client');
            }
        }
    };

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.phone && client.phone.includes(searchTerm))
    );

    return (
        <div className="container animate-fade-in">
            <div className="section-title" style={{ justifyContent: 'space-between', borderBottom: 'none' }}>
                <h2>Clients</h2>
                <Link to="/new-client" className="btn btn-primary">
                    <PlusCircle size={18} /> Add Client
                </Link>
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#888' }} />
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search Clients..."
                        style={{ paddingLeft: '40px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {loading ? (
                    <p>Loading clients...</p>
                ) : filteredClients.length === 0 ? (
                    <p>No clients found.</p>
                ) : (
                    filteredClients.map(client => (
                        <div key={client.id} className="card" style={{ padding: '20px', borderTop: '4px solid var(--accent)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '50%',
                                            background: '#e3f2fd', color: '#1565c0', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                                        }}>
                                            {client.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{client.name}</h3>
                                            {client.company && <div style={{ fontSize: '0.9rem', color: '#666' }}>{client.company}</div>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <Link to={`/client/edit/${client.id}`} className="btn btn-outline" style={{ padding: '6px', height: 'auto' }} title="Edit Client">
                                            <Edit2 size={16} />
                                        </Link>
                                        <button className="btn btn-outline" style={{ padding: '6px', height: 'auto', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleDelete(client.id, client.name)} title="Delete Client">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95rem', color: '#555' }}>
                                    {client.email && (
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <Mail size={16} color="#888" /> {client.email}
                                        </div>
                                    )}
                                    {client.phone && (
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <Phone size={16} color="#888" /> {client.phone}
                                        </div>
                                    )}
                                    {client.address && (
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <Building size={16} color="#888" /> {client.address}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                                <Link to={`/?client_id=${client.id}`} className="btn btn-outline btn-block" style={{ fontSize: '0.9rem', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <ExternalLink size={14} /> View Orders
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Clients;
