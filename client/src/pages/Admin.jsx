import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Settings, Plus, Trash2, Package, List, Users, Briefcase, Edit2, Check, X, LogOut } from 'lucide-react';
import { API_URL } from '../config';

const Admin = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [settings, setSettings] = useState([]);
    const [categories, setCategories] = useState([]);
    const [staff, setStaff] = useState([]);
    const [newProduct, setNewProduct] = useState('');
    const [newCategory, setNewCategory] = useState({ name: '', display_name: '' });
    const [newSetting, setNewSetting] = useState({ category: 'printing_type', value: '', product_id: '' });
    const [newStaff, setNewStaff] = useState({ name: '', phone: '', email: '', department: '' });
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [activeTab, setActiveTab] = useState('config'); // 'config' or 'staff'
    const [loading, setLoading] = useState(true);

    // Editing State
    const [editingProductId, setEditingProductId] = useState(null);
    const [editProductName, setEditProductName] = useState('');

    const [editingStaffId, setEditingStaffId] = useState(null);
    const [editStaffData, setEditStaffData] = useState({});

    const [editingSettingId, setEditingSettingId] = useState(null);
    const [editSettingData, setEditSettingData] = useState({});

    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editCategoryData, setEditCategoryData] = useState({});

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        navigate('/login');
    };

    const fetchData = async () => {
        try {
            const [prodRes, setRes, staffRes, catRes] = await Promise.all([
                axios.get(API_URL + '/api/products'),
                axios.get(API_URL + '/api/settings'),
                axios.get(API_URL + '/api/staff'),
                axios.get(API_URL + '/api/categories')
            ]);
            setProducts(prodRes.data.data);
            setSettings(setRes.data.data);
            setStaff(staffRes.data.data);
            setCategories(catRes.data.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    // --- Product Actions ---
    const addProduct = async (e) => {
        e.preventDefault();
        try {
            await axios.post(API_URL + '/api/products', { name: newProduct });
            setNewProduct('');
            fetchData();
        } catch (error) {
            alert('Error adding product (likely duplicate).');
        }
    };

    const deleteProduct = async (id) => {
        if (!window.confirm("Remove this product? This will leave its custom options orphaned (but still viewable).")) return;
        try {
            await axios.delete(`${API_URL}/api/products/${id}`);
            fetchData();
        } catch (error) {
            alert('Error deleting product.');
        }
    };

    const startEditProduct = (p) => {
        setEditingProductId(p.id);
        setEditProductName(p.name);
    };

    const saveProductEdit = async (id) => {
        try {
            await axios.put(`${API_URL}/api/products/${id}`, { name: editProductName });
            setEditingProductId(null);
            fetchData();
        } catch (error) {
            alert('Error updating product.');
        }
    };

    // --- Setting Actions ---
    const addSetting = async (e) => {
        e.preventDefault();
        try {
            const settingToAdd = {
                category: newSetting.category,
                value: newSetting.value,
                product_id: newSetting.product_id || null
            };
            console.log('Adding setting:', settingToAdd);
            await axios.post(API_URL + '/api/settings', settingToAdd);
            setNewSetting({ ...newSetting, value: '' });
            fetchData();
        } catch (error) {
            console.error('Error adding setting:', error);
            alert('Error adding setting: ' + (error.response?.data?.error || error.message));
        }
    };

    const deleteSetting = async (id) => {
        if (!window.confirm("Remove this option?")) return;
        try {
            await axios.delete(`${API_URL}/api/settings/${id}`);
            fetchData();
        } catch (error) {
            alert('Error deleting setting.');
        }
    };

    const startEditSetting = (s) => {
        setEditingSettingId(s.id);
        setEditSettingData({ category: s.category, value: s.value, product_id: s.product_id || '' });
    };

    const saveSettingEdit = async (id) => {
        try {
            await axios.put(`${API_URL}/api/settings/${id}`, editSettingData);
            setEditingSettingId(null);
            fetchData();
        } catch (error) {
            alert('Error updating setting.');
        }
    };

    // --- Category Actions ---
    const addCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.display_name) return;
        const name = newCategory.display_name.toLowerCase().replace(/\s+/g, '_');
        try {
            await axios.post(API_URL + '/api/categories', { ...newCategory, name });
            setNewCategory({ name: '', display_name: '' });
            fetchData();
        } catch (error) {
            alert('Error adding category.');
        }
    };

    const deleteCategory = async (id, name) => {
        if (!window.confirm(`Remove category "${name}"? This will not delete existing options but they may not show up correctly on forms.`)) return;
        try {
            await axios.delete(`${API_URL}/api/categories/${id}`);
            fetchData();
        } catch (error) {
            alert('Error deleting category.');
        }
    };

    const startEditCategory = (cat) => {
        setEditingCategoryId(cat.id);
        setEditCategoryData({ display_name: cat.display_name });
    };

    const saveCategoryEdit = async (id) => {
        try {
            await axios.put(`${API_URL}/api/categories/${id}`, editCategoryData);
            setEditingCategoryId(null);
            fetchData();
        } catch (error) {
            alert('Error updating category.');
        }
    };

    // --- Staff Actions ---
    const addStaff = async (e) => {
        e.preventDefault();
        try {
            await axios.post(API_URL + '/api/staff', newStaff);
            setNewStaff({ name: '', phone: '', email: '', department: '' });
            fetchData();
        } catch (error) {
            alert('Error adding staff member.');
        }
    };

    const deleteStaff = async (id) => {
        if (!window.confirm("Remove this staff member?")) return;
        try {
            await axios.delete(`${API_URL}/api/staff/${id}`);
            fetchData();
        } catch (error) {
            alert('Error deleting staff.');
        }
    };

    const startEditStaff = (member) => {
        setEditingStaffId(member.id);
        setEditStaffData({ ...member });
    };

    const saveStaffEdit = async (id) => {
        try {
            await axios.put(`${API_URL}/api/staff/${id}`, editStaffData);
            setEditingStaffId(null);
            fetchData();
        } catch (error) {
            alert('Error updating staff member.');
        }
    };

    const filteredSettings = selectedProductId
        ? settings.filter(s => !s.product_id || s.product_id === selectedProductId)
        : settings;

    const groupedSettings = filteredSettings.reduce((acc, curr) => {
        if (!acc[curr.category]) acc[curr.category] = [];
        acc[curr.category].push(curr);
        return acc;
    }, {});

    const getProductName = (id) => {
        if (!id) return 'All Products';
        const p = products.find(prod => prod.id === id);
        return p ? p.name : 'Unknown Product';
    };

    const categoryLabels = categories.reduce((acc, cat) => {
        acc[cat.name] = cat.display_name;
        return acc;
    }, {});

    const availableCategories = categories.map(c => c.name);

    if (loading) return <div className="container">Loading...</div>;

    return (
        <div className="container animate-fade-in">
            <div className="section-title admin-header">
                <h2>Admin & Configurations</h2>
                <div className="tab-buttons">
                    <button
                        className={`btn ${activeTab === 'config' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setActiveTab('config')}
                    >
                        <Settings size={18} /> Configuration
                    </button>
                    <button
                        className={`btn ${activeTab === 'staff' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setActiveTab('staff')}
                    >
                        <Users size={18} /> Staff
                    </button>
                    <button className="btn btn-outline" onClick={handleLogout} style={{ marginLeft: 'auto', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </div>

            {activeTab === 'config' ? (
                <div className="row">
                    {/* Products Management */}
                    <div className="col" style={{ flex: 1, minWidth: '300px' }}>
                        <div className="card h-100">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                <Package className="text-primary" />
                                <h3>Product Types</h3>
                            </div>

                            <form onSubmit={addProduct} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="New Product"
                                    value={newProduct}
                                    onChange={(e) => setNewProduct(e.target.value)}
                                    required
                                />
                                <button type="submit" className="btn btn-primary"><Plus size={18} /></button>
                            </form>

                            <div className="list-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <div
                                    style={{
                                        padding: '12px',
                                        cursor: 'pointer',
                                        background: selectedProductId === null ? 'var(--primary-subtle)' : 'transparent',
                                        borderLeft: selectedProductId === null ? '4px solid var(--accent)' : '4px solid transparent',
                                        borderRadius: '4px',
                                        transition: 'var(--transition)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}
                                    onClick={() => {
                                        setSelectedProductId(null);
                                        setNewSetting({ ...newSetting, product_id: '' });
                                    }}
                                >
                                    <List size={18} className={selectedProductId === null ? "text-primary" : ""} style={{ opacity: selectedProductId === null ? 1 : 0.5 }} />
                                    <strong>All Customizations</strong>
                                </div>
                                <div style={{ margin: '10px 0', fontSize: '0.75rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', paddingLeft: '5px' }}>Filter by Product</div>
                                {products.map(p => (
                                    <div
                                        key={p.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            borderBottom: '1px solid var(--border)',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            background: selectedProductId === p.id ? 'var(--primary-subtle)' : 'transparent',
                                            borderLeft: selectedProductId === p.id ? '4px solid var(--accent)' : '4px solid transparent',
                                            borderRadius: '4px',
                                            transition: 'var(--transition)'
                                        }}
                                        onClick={() => {
                                            setSelectedProductId(p.id);
                                            setNewSetting({ ...newSetting, product_id: p.id });
                                        }}
                                    >
                                        {editingProductId === p.id ? (
                                            <div style={{ display: 'flex', gap: '5px', flex: 1 }} onClick={e => e.stopPropagation()}>
                                                <input
                                                    className="form-control"
                                                    style={{ height: '30px', fontSize: '0.9rem' }}
                                                    value={editProductName}
                                                    onChange={e => setEditProductName(e.target.value)}
                                                    autoFocus
                                                />
                                                <button onClick={() => saveProductEdit(p.id)} className="btn btn-primary" style={{ padding: '2px 8px' }}><Check size={14} /></button>
                                                <button onClick={() => setEditingProductId(null)} className="btn btn-outline" style={{ padding: '2px 8px' }}><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <>
                                                <span style={{ fontWeight: selectedProductId === p.id ? '600' : '400' }}>{p.name}</span>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <button
                                                        className="btn btn-outline"
                                                        style={{ border: 'none', padding: '5px', color: '#aaa' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            startEditProduct(p);
                                                        }}
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        className="btn btn-outline"
                                                        style={{ color: 'var(--danger)', border: 'none', padding: '5px' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteProduct(p.id);
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Categories Management */}
                        <div className="card h-100" style={{ marginTop: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                <Settings className="text-primary" />
                                <h3>Customization Categories</h3>
                            </div>

                            <form onSubmit={addCategory} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="New Category (e.g. Packing)"
                                    value={newCategory.display_name}
                                    onChange={(e) => setNewCategory({ ...newCategory, display_name: e.target.value })}
                                    required
                                />
                                <button type="submit" className="btn btn-primary"><Plus size={18} /></button>
                            </form>

                            <div className="list-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {categories.map(cat => (
                                    <div
                                        key={cat.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '12px',
                                            borderBottom: '1px solid var(--border)',
                                            alignItems: 'center',
                                            borderRadius: '4px',
                                            transition: 'var(--transition)'
                                        }}
                                    >
                                        {editingCategoryId === cat.id ? (
                                            <div style={{ display: 'flex', flex: 1, gap: '5px', alignItems: 'center' }}>
                                                <input
                                                    className="form-control"
                                                    style={{ height: '30px', fontSize: '0.85rem', flex: 1 }}
                                                    value={editCategoryData.display_name}
                                                    onChange={e => setEditCategoryData({ ...editCategoryData, display_name: e.target.value })}
                                                />
                                                <button onClick={() => saveCategoryEdit(cat.id)} className="btn btn-primary" style={{ padding: '2px 8px' }}><Check size={14} /></button>
                                                <button onClick={() => setEditingCategoryId(null)} className="btn btn-outline" style={{ padding: '2px 8px' }}><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 600 }}>{cat.display_name}</span>
                                                    <span style={{ fontSize: '0.7rem', color: '#666' }}>ID: {cat.name}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <button
                                                        className="btn btn-outline"
                                                        style={{ color: '#ccc', border: 'none', padding: '5px' }}
                                                        onClick={() => startEditCategory(cat)}
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        className="btn btn-outline"
                                                        style={{ color: 'var(--danger)', border: 'none', padding: '5px' }}
                                                        onClick={() => deleteCategory(cat.id, cat.name)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Customizations Management */}
                    <div className="col" style={{ flex: 2, minWidth: '300px' }}>
                        <div className="card h-100">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                <List className="text-primary" />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <h3>Customizations & Options</h3>
                                    {selectedProductId ? (
                                        <span style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 500 }}>
                                            Showing options for: <span style={{ textDecoration: 'underline' }}>{getProductName(selectedProductId)}</span>
                                        </span>
                                    ) : (
                                        <span style={{ fontSize: '0.85rem', color: '#888' }}>
                                            Showing all universal and product-specific options
                                        </span>
                                    )}
                                </div>
                            </div>

                            <form onSubmit={addSetting} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                                <select
                                    className="form-control"
                                    style={{ width: 'auto' }}
                                    value={newSetting.category}
                                    onChange={(e) => setNewSetting({ ...newSetting, category: e.target.value })}
                                >
                                    {availableCategories.map(c => <option key={c} value={c}>{categoryLabels[c] || c}</option>)}
                                </select>

                                <select
                                    className="form-control"
                                    style={{ width: 'auto' }}
                                    value={newSetting.product_id}
                                    onChange={(e) => setNewSetting({ ...newSetting, product_id: e.target.value ? parseInt(e.target.value) : '' })}
                                >
                                    <option value="">Apply to All</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>

                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Option Value"
                                    style={{ flex: 1 }}
                                    value={newSetting.value}
                                    onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                                    required
                                />
                                <button type="submit" className="btn btn-primary"><Plus size={18} /> Add</button>
                            </form>

                            <div className="row">
                                {Object.entries(groupedSettings).map(([catName, settingItems]) => {
                                    const cat = categories.find(c => c.name === catName);

                                    return (
                                        <div key={catName} className="col" style={{ flex: '1 0 45%', marginBottom: '20px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border)', paddingBottom: '5px', marginBottom: '10px' }}>
                                                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>
                                                    {categoryLabels[catName] || catName}
                                                </h4>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {cat && (
                                                        <>
                                                            <button
                                                                onClick={() => startEditCategory(cat)}
                                                                className="btn btn-outline"
                                                                style={{ padding: '2px 5px', height: 'auto', border: 'none', color: '#888' }}
                                                                title="Edit Category Name"
                                                            >
                                                                <Edit2 size={12} />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteCategory(cat.id, cat.name)}
                                                                className="btn btn-outline"
                                                                style={{ padding: '2px 5px', height: 'auto', border: 'none', color: 'var(--danger)' }}
                                                                title="Delete Category"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                {settingItems.map(s => (
                                                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid var(--border)', alignItems: 'center', background: editingSettingId === s.id ? 'var(--primary-subtle)' : 'transparent', borderRadius: '4px' }}>
                                                        {editingSettingId === s.id ? (
                                                            <div style={{ display: 'flex', flex: 1, gap: '5px', alignItems: 'center' }}>
                                                                <input
                                                                    className="form-control"
                                                                    style={{ height: '30px', fontSize: '0.85rem', flex: 1 }}
                                                                    value={editSettingData.value}
                                                                    onChange={e => setEditSettingData({ ...editSettingData, value: e.target.value })}
                                                                />
                                                                <select
                                                                    className="form-control"
                                                                    style={{ height: '30px', fontSize: '0.85rem', width: '100px' }}
                                                                    value={editSettingData.product_id}
                                                                    onChange={e => setEditSettingData({ ...editSettingData, product_id: e.target.value ? parseInt(e.target.value) : '' })}
                                                                >
                                                                    <option value="">Universal</option>
                                                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                                </select>
                                                                <button onClick={() => saveSettingEdit(s.id)} className="btn btn-primary" style={{ padding: '2px 8px' }}><Check size={14} /></button>
                                                                <button onClick={() => setEditingSettingId(null)} className="btn btn-outline" style={{ padding: '2px 8px' }}><X size={14} /></button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div style={{ flex: 1 }}>
                                                                    <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{s.value}</span>
                                                                    <div style={{ fontSize: '0.7rem', color: s.product_id ? 'var(--primary)' : '#999' }}>
                                                                        {getProductName(s.product_id)}
                                                                    </div>
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                                    <button onClick={() => startEditSetting(s)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}><Edit2 size={14} /></button>
                                                                    <button onClick={() => deleteSetting(s.id)} style={{ background: 'none', border: 'none', color: '#ff8080', cursor: 'pointer' }}><X size={16} /></button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="animate-fade-in">
                    <div className="row">
                        <div className="col" style={{ flex: 1 }}>
                            <div className="card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <Users className="text-primary" />
                                    <h3>{editingStaffId ? 'Update Staff Member' : 'Add New Staff Member'}</h3>
                                </div>
                                <form onSubmit={e => {
                                    e.preventDefault();
                                    editingStaffId ? saveStaffEdit(editingStaffId) : addStaff(e);
                                }}>
                                    <div className="form-group">
                                        <label className="form-label">Full Name *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="John Doe"
                                            value={editingStaffId ? editStaffData.name : newStaff.name}
                                            onChange={(e) => editingStaffId
                                                ? setEditStaffData({ ...editStaffData, name: e.target.value })
                                                : setNewStaff({ ...newStaff, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Department</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Sales, Design, etc."
                                            value={editingStaffId ? editStaffData.department : newStaff.department}
                                            onChange={(e) => editingStaffId
                                                ? setEditStaffData({ ...editStaffData, department: e.target.value })
                                                : setNewStaff({ ...newStaff, department: e.target.value })}
                                        />
                                    </div>
                                    <div className="row">
                                        <div className="col">
                                            <div className="form-group">
                                                <label className="form-label">Phone</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={editingStaffId ? editStaffData.phone : newStaff.phone}
                                                    onChange={(e) => editingStaffId
                                                        ? setEditStaffData({ ...editStaffData, phone: e.target.value })
                                                        : setNewStaff({ ...newStaff, phone: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="col">
                                            <div className="form-group">
                                                <label className="form-label">Email</label>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    value={editingStaffId ? editStaffData.email : newStaff.email}
                                                    onChange={(e) => editingStaffId
                                                        ? setEditStaffData({ ...editStaffData, email: e.target.value })
                                                        : setNewStaff({ ...newStaff, email: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                            {editingStaffId ? 'Update Staff Member' : 'Add Staff Member'}
                                        </button>
                                        {editingStaffId && (
                                            <button type="button" className="btn btn-outline" onClick={() => setEditingStaffId(null)}>Cancel</button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div className="col" style={{ flex: 2 }}>
                            <div className="card h-100">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <Briefcase className="text-primary" />
                                    <h3>Team Directory</h3>
                                </div>
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Department</th>
                                                <th>Contact</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {staff.length === 0 ? (
                                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No staff members added yet.</td></tr>
                                            ) : (
                                                staff.map(member => (
                                                    <tr key={member.id} style={{ background: editingStaffId === member.id ? 'var(--primary-subtle)' : 'transparent' }}>
                                                        <td>
                                                            <strong>{member.name}</strong>
                                                        </td>
                                                        <td>{member.department || '-'}</td>
                                                        <td style={{ fontSize: '0.85rem' }}>
                                                            <div>{member.phone}</div>
                                                            <div style={{ color: '#888' }}>{member.email}</div>
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                                                                <button
                                                                    className="btn"
                                                                    style={{ color: '#aaa', padding: '5px' }}
                                                                    onClick={() => startEditStaff(member)}
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button
                                                                    className="btn"
                                                                    style={{ color: 'var(--danger)', padding: '5px' }}
                                                                    onClick={() => deleteStaff(member.id)}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
