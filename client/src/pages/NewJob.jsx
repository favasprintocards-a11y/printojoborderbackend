import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Save, Upload, Plus, Trash2 } from 'lucide-react';
import { API_URL } from '../config';

const NewJob = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);

    // Dynamic Options
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [rawSettings, setRawSettings] = useState([]);
    const [staff, setStaff] = useState([]);
    const [settingsList, setSettingsList] = useState([]); // Array of settings objects (one per item)

    // Form Data (Parent)
    const [formData, setFormData] = useState({
        submitted_by: '',
        submitted_contact: '',
        client_id: '',
        client_name: '',
        client_phone: '',
        client_email: '',
        client_company: '',
        client_address: '',
        special_instructions: '',
        expected_delivery_date: '',
        priority: 'Normal',
        delivery_mode: 'Pickup',
    });

    // Items list
    const [items, setItems] = useState([]);

    // Temporary file storage for each item (indexed)
    const [files, setFiles] = useState({});

    // Fetch clients and options on mount
    React.useEffect(() => {
        const fetchAll = async () => {
            try {
                const [cli, prod, opt, staffRes, catRes] = await Promise.all([
                    axios.get(API_URL + '/api/clients'),
                    axios.get(API_URL + '/api/products'),
                    axios.get(API_URL + '/api/settings'),
                    axios.get(API_URL + '/api/staff'),
                    axios.get(API_URL + '/api/categories')
                ]);

                setClients(cli.data.data);
                setProducts(prod.data.data);
                setRawSettings(opt.data.data);
                setStaff(staffRes.data.data);
                setCategories(catRes.data.data);

                // Initialize with one item if empty
                setItems(prev => {
                    if (prev.length > 0) return prev;
                    const initialProduct = prod.data.data[0];
                    const initialProductName = initialProduct?.name || '';
                    const itemSettings = groupSettingsForProduct(initialProductName, prod.data.data, opt.data.data);

                    setSettingsList([itemSettings]);

                    return [{
                        product_type: initialProductName,
                        card_size: itemSettings['card_size']?.[0] || 'Standard',
                        quantity: '',
                        printing_type: itemSettings['printing_type']?.[0] || '',
                        printing_mode: itemSettings['printing_mode']?.[0] || '',
                        finish: itemSettings['finish']?.[0] || '',
                        material: itemSettings['material']?.[0] || '',
                        accessories: [],
                        binding: itemSettings['binding']?.[0] || '',
                        corner: itemSettings['corner']?.[0] || '',
                        paper_thickness: itemSettings['paper_thickness']?.[0] || '',
                        variable_data: '',
                        rate: '',
                        advance_amount: '',
                        additional_info: '',
                        custom_fields: {}
                    }];
                });

            } catch (error) {
                console.error(error);
            }
        };
        fetchAll();
    }, []);

    const addItem = (allProds, allOpts) => {
        const prods = allProds || products;
        const opts = allOpts || rawSettings;

        const initialProduct = prods[0];
        const initialProductName = initialProduct?.name || '';

        // Group settings for this item
        const itemSettings = groupSettingsForProduct(initialProductName, prods, opts);

        const newItem = {
            product_type: initialProductName,
            card_size: itemSettings['card_size']?.[0] || 'Standard',
            quantity: '',
            printing_type: itemSettings['printing_type']?.[0] || '',
            printing_mode: itemSettings['printing_mode']?.[0] || '',
            finish: itemSettings['finish']?.[0] || '',
            material: itemSettings['material']?.[0] || '',
            accessories: [],
            binding: itemSettings['binding']?.[0] || '',
            corner: itemSettings['corner']?.[0] || '',
            paper_thickness: itemSettings['paper_thickness']?.[0] || '',
            variable_data: '',
            rate: '',
            advance_amount: '',
            additional_info: '',
            custom_fields: {}
        };

        setItems(prev => [...prev, newItem]);
        setSettingsList(prev => [...prev, itemSettings]);
    };

    const removeItem = (index) => {
        if (items.length === 1) return;
        setItems(prev => prev.filter((_, i) => i !== index));
        setSettingsList(prev => prev.filter((_, i) => i !== index));

        // Re-index files to match new item indices
        const newFiles = {};
        Object.keys(files).forEach(key => {
            const k = parseInt(key);
            if (k < index) {
                newFiles[k] = files[k];
            } else if (k > index) {
                newFiles[k - 1] = files[k];
            }
        });
        setFiles(newFiles);
    };

    const groupSettingsForProduct = (productName, allProds, allOpts) => {
        const product = allProds.find(p => p.name === productName);
        const productId = product ? product.id : null;
        const filtered = allOpts.filter(s => s.product_id === null || s.product_id === productId);

        return filtered.reduce((acc, curr) => {
            if (!acc[curr.category]) acc[curr.category] = [];
            acc[curr.category].push(curr.value);
            return acc;
        }, {});
    };

    const handleItemChange = (index, name, value) => {
        const newItems = [...items];
        const coreFields = ['product_type', 'card_size', 'quantity', 'rate', 'advance_amount', 'variable_data', 'printing_type', 'printing_mode', 'finish', 'material', 'accessories', 'binding', 'corner', 'paper_thickness', 'additional_info'];

        if (coreFields.includes(name)) {
            newItems[index][name] = value;
        } else {
            if (!newItems[index].custom_fields) newItems[index].custom_fields = {};
            newItems[index].custom_fields[name] = value;
        }

        if (name === 'product_type') {
            const newSettings = groupSettingsForProduct(value, products, rawSettings);
            const newList = [...settingsList];
            newList[index] = newSettings;
            setSettingsList(newList);

            // Reset defaults for this item
            newItems[index].printing_type = newSettings['printing_type']?.[0] || '';
            newItems[index].printing_mode = newSettings['printing_mode']?.[0] || '';
            newItems[index].finish = newSettings['finish']?.[0] || '';
            newItems[index].material = newSettings['material']?.[0] || '';
            newItems[index].card_size = newSettings['card_size']?.[0] || 'Standard';
            newItems[index].binding = newSettings['binding']?.[0] || '';
            newItems[index].corner = newSettings['corner']?.[0] || '';
            newItems[index].paper_thickness = newSettings['paper_thickness']?.[0] || '';
            newItems[index].additional_info = '';
        }

        setItems(newItems);
    };

    const handleItemCheckboxChange = (index, value, checked) => {
        const newItems = [...items];
        let acc = [...newItems[index].accessories];
        if (checked) {
            acc.push(value);
        } else {
            acc = acc.filter(a => a !== value);
        }
        newItems[index].accessories = acc;
        setItems(newItems);
    };

    const handleClientSelect = (e) => {
        const selectedId = e.target.value;
        if (!selectedId) {
            setFormData(prev => ({ ...prev, client_id: '', client_name: '', client_phone: '', client_email: '', client_company: '', client_address: '' }));
            return;
        }

        const client = clients.find(c => c.id == selectedId);
        if (client) {
            setFormData(prev => ({
                ...prev,
                client_id: client.id,
                client_name: client.name,
                client_phone: client.phone || '',
                client_email: client.email || '',
                client_company: client.company || '',
                client_address: client.address || ''
            }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };


    // Auto-calculate Total Amount

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        // Append parent fields
        Object.keys(formData).forEach(key => data.append(key, formData[key]));

        // Append items as JSON
        const cleanedItems = items.map(item => ({
            ...item,
            rate: item.rate === '' ? 0 : item.rate,
            advance_amount: item.advance_amount === '' ? 0 : item.advance_amount,
            accessories: item.accessories.join(', ')
        }));
        data.append('items', JSON.stringify(cleanedItems));


        try {
            await axios.post(API_URL + '/api/jobs', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Job Order Submitted Successfully!');
            navigate('/');
        } catch (error) {
            console.error(error);
            alert('Error submitting job order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAdd = async (index, category) => {
        const item = items[index];
        const product = products.find(p => p.name === item.product_type);
        if (!product) return alert("Please select a product first.");

        const value = window.prompt(`Enter new ${category.replace('_', ' ')} for ${product.name}:`);
        if (!value) return;

        try {
            // Optimistic update
            const newSetting = {
                category,
                value,
                product_id: product.id
            };

            const res = await axios.post(API_URL + '/api/settings', newSetting);
            newSetting.id = res.data.id || Date.now();

            setRawSettings(prev => {
                const updated = [...prev, newSetting];
                // Update settings lists for all items
                setSettingsList(currentList => currentList.map((_, i) => {
                    const iProdName = items[i].product_type;
                    return groupSettingsForProduct(iProdName, products, updated);
                }));
                return updated;
            });

            // Select the new value
            handleItemChange(index, category, value);

        } catch (error) {
            console.error(error);
            alert("Failed to add option.");
        }
    };

    return (
        <div className="container animate-fade-in">
            <div className="section-title">
                <h2>New Job Order</h2>
            </div>

            <form onSubmit={handleSubmit}>
                {/* 1. Submitted By */}
                <div className="card form-group">
                    <h3 className="form-label" style={{ fontSize: '1.2rem', marginBottom: '15px', color: 'var(--primary)' }}>Staff Information</h3>
                    <div className="row">
                        <div className="col">
                            <label className="form-label">Submitted By (Staff Member) *</label>
                            <select
                                className="form-control"
                                name="submitted_by"
                                required
                                value={formData.submitted_by}
                                onChange={handleChange}
                            >
                                <option value="">-- Select Staff Member --</option>
                                {staff.map(s => (
                                    <option key={s.id} value={s.name}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* 2. Client Details */}
                <div className="card form-group">
                    <h3 className="form-label" style={{ fontSize: '1.2rem', marginBottom: '15px', color: 'var(--primary)' }}>Client Details</h3>

                    {/* Client Selector */}
                    <div style={{ marginBottom: '15px', padding: '10px', background: 'rgba(227, 108, 45, 0.05)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <select className="form-control" onChange={handleClientSelect} value={formData.client_id || ''}>
                            <option value="">-- Select or Enter Manually --</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                            ))}
                        </select>
                    </div>

                    <div className="row">
                        <div className="col">
                            <label className="form-label">Client Name *</label>
                            <input type="text" className="form-control" name="client_name" required value={formData.client_name} onChange={handleChange} />
                        </div>
                        <div className="col">
                            <label className="form-label">Contact Number</label>
                            <input type="text" className="form-control" name="client_phone" value={formData.client_phone} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                {/* 3. Product Items */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 className="form-label" style={{ fontSize: '1.2rem', color: 'var(--primary)', margin: 0 }}>Product Items</h3>
                        <button type="button" className="btn btn-outline" onClick={() => addItem()} style={{ padding: '8px 15px' }}>
                            <Plus size={18} /> Add Product
                        </button>
                    </div>
                    {items.map((item, index) => (
                        <div key={index} className="card form-group animate-slide-in" style={{ borderLeft: '4px solid var(--primary)', position: 'relative' }}>
                            {items.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    style={{ position: 'absolute', top: '10px', right: '10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Remove Item"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}

                            {/* Removed Item #X header */}
                            <div className="row">
                                <div className="col">
                                    <label className="form-label">Product Type</label>
                                    <select
                                        className="form-control"
                                        value={item.product_type}
                                        onChange={(e) => handleItemChange(index, 'product_type', e.target.value)}
                                    >
                                        {products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                    </select>
                                </div>
                                {settingsList[index]?.['card_size']?.length > 0 && (
                                    <div className="col">
                                        <label className="form-label">Size</label>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <select
                                                className="form-control"
                                                style={{ flex: 1 }}
                                                value={item.card_size}
                                                onChange={(e) => handleItemChange(index, 'card_size', e.target.value)}
                                            >
                                                {settingsList[index]?.['card_size']?.map(v => <option key={v}>{v}</option>)}
                                            </select>
                                            <button type="button" className="btn btn-outline" style={{ padding: '0 10px' }} onClick={() => handleQuickAdd(index, 'card_size')}>+</button>
                                        </div>
                                    </div>
                                )}
                                <div className="col">
                                    <label className="form-label">Quantity *</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        required
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                    />
                                </div>
                                <div className="col">
                                    <label className="form-label">Rate per Piece</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={item.rate}
                                        onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="col">
                                    <label className="form-label">Advance Amount</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={item.advance_amount}
                                        onChange={(e) => handleItemChange(index, 'advance_amount', e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>

                            </div>

                            {(settingsList[index]?.['material']?.length > 0 ||
                                settingsList[index]?.['printing_type']?.length > 0 ||
                                settingsList[index]?.['printing_mode']?.length > 0 ||
                                settingsList[index]?.['finish']?.length > 0) && (
                                    <div className="row" style={{ marginTop: '15px' }}>
                                        {settingsList[index]?.['material']?.length > 0 && (
                                            <div className="col">
                                                <label className="form-label">Material</label>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <select
                                                        className="form-control"
                                                        style={{ flex: 1 }}
                                                        value={item.material}
                                                        onChange={(e) => handleItemChange(index, 'material', e.target.value)}
                                                    >
                                                        {settingsList[index]?.['material']?.map(v => <option key={v}>{v}</option>)}
                                                    </select>
                                                    <button type="button" className="btn btn-outline" style={{ padding: '0 10px' }} onClick={() => handleQuickAdd(index, 'material')}>+</button>
                                                </div>
                                            </div>
                                        )}
                                        {settingsList[index]?.['printing_type']?.length > 0 && (
                                            <div className="col">
                                                <label className="form-label">Printing Type</label>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <select
                                                        className="form-control"
                                                        style={{ flex: 1 }}
                                                        value={item.printing_type}
                                                        onChange={(e) => handleItemChange(index, 'printing_type', e.target.value)}
                                                    >
                                                        {settingsList[index]?.['printing_type']?.map(v => <option key={v}>{v}</option>)}
                                                    </select>
                                                    <button type="button" className="btn btn-outline" style={{ padding: '0 10px' }} onClick={() => handleQuickAdd(index, 'printing_type')}>+</button>
                                                </div>
                                            </div>
                                        )}
                                        {settingsList[index]?.['printing_mode']?.length > 0 && (
                                            <div className="col">
                                                <label className="form-label">Printing Mode</label>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <select
                                                        className="form-control"
                                                        style={{ flex: 1 }}
                                                        value={item.printing_mode}
                                                        onChange={(e) => handleItemChange(index, 'printing_mode', e.target.value)}
                                                    >
                                                        {settingsList[index]?.['printing_mode']?.map(v => <option key={v}>{v}</option>)}
                                                    </select>
                                                    <button type="button" className="btn btn-outline" style={{ padding: '0 10px' }} onClick={() => handleQuickAdd(index, 'printing_mode')}>+</button>
                                                </div>
                                            </div>
                                        )}
                                        {settingsList[index]?.['finish']?.length > 0 && (
                                            <div className="col">
                                                <label className="form-label">Finish</label>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <select
                                                        className="form-control"
                                                        style={{ flex: 1 }}
                                                        value={item.finish}
                                                        onChange={(e) => handleItemChange(index, 'finish', e.target.value)}
                                                    >
                                                        {settingsList[index]?.['finish']?.map(v => <option key={v}>{v}</option>)}
                                                    </select>
                                                    <button type="button" className="btn btn-outline" style={{ padding: '0 10px' }} onClick={() => handleQuickAdd(index, 'finish')}>+</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                            {(settingsList[index]?.['binding']?.length > 0 ||
                                settingsList[index]?.['corner']?.length > 0 ||
                                settingsList[index]?.['paper_thickness']?.length > 0) && (
                                    <div className="row" style={{ marginTop: '15px' }}>
                                        {settingsList[index]?.['binding']?.length > 0 && (
                                            <div className="col">
                                                <label className="form-label">Binding</label>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <select
                                                        className="form-control"
                                                        style={{ flex: 1 }}
                                                        value={item.binding || ''}
                                                        onChange={(e) => handleItemChange(index, 'binding', e.target.value)}
                                                    >
                                                        <option value="">-- Select Binding --</option>
                                                        {settingsList[index]?.['binding']?.map(v => <option key={v}>{v}</option>)}
                                                    </select>
                                                    <button type="button" className="btn btn-outline" style={{ padding: '0 10px' }} onClick={() => handleQuickAdd(index, 'binding')}>+</button>
                                                </div>
                                            </div>
                                        )}
                                        {settingsList[index]?.['corner']?.length > 0 && (
                                            <div className="col">
                                                <label className="form-label">Corner</label>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <select
                                                        className="form-control"
                                                        style={{ flex: 1 }}
                                                        value={item.corner || ''}
                                                        onChange={(e) => handleItemChange(index, 'corner', e.target.value)}
                                                    >
                                                        <option value="">-- Select Corner --</option>
                                                        {settingsList[index]?.['corner']?.map(v => <option key={v}>{v}</option>)}
                                                    </select>
                                                    <button type="button" className="btn btn-outline" style={{ padding: '0 10px' }} onClick={() => handleQuickAdd(index, 'corner')}>+</button>
                                                </div>
                                            </div>
                                        )}
                                        {settingsList[index]?.['paper_thickness']?.length > 0 && (
                                            <div className="col">
                                                <label className="form-label">Paper Thickness</label>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <select
                                                        className="form-control"
                                                        style={{ flex: 1 }}
                                                        value={item.paper_thickness || ''}
                                                        onChange={(e) => handleItemChange(index, 'paper_thickness', e.target.value)}
                                                    >
                                                        <option value="">-- Select Thickness --</option>
                                                        {settingsList[index]?.['paper_thickness']?.map(v => <option key={v}>{v}</option>)}
                                                    </select>
                                                    <button type="button" className="btn btn-outline" style={{ padding: '0 10px' }} onClick={() => handleQuickAdd(index, 'paper_thickness')}>+</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                            {settingsList[index]?.['accessories']?.length > 0 && (
                                <div style={{ marginTop: '20px' }}>
                                    <label className="form-label">Accessories</label>
                                    <div className="checkbox-group">
                                        {settingsList[index]?.['accessories']?.map(acc => (
                                            <label key={acc} className="checkbox-item">
                                                <input
                                                    type="checkbox"
                                                    value={acc}
                                                    checked={item.accessories.includes(acc)}
                                                    onChange={(e) => handleItemCheckboxChange(index, acc, e.target.checked)}
                                                />
                                                {acc}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Additional Custom Fields */}
                            {(() => {
                                const coreFields = ['printing_type', 'printing_mode', 'finish', 'accessories', 'card_size', 'material', 'binding', 'corner', 'paper_thickness'];
                                const customCats = categories.filter(c =>
                                    !coreFields.includes(c.name) &&
                                    settingsList[index]?.[c.name]?.length > 0
                                );

                                if (customCats.length === 0) return null;

                                return (
                                    <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <div className="row">
                                            {customCats.map(cat => (
                                                <div className="col" key={cat.name}>
                                                    <div className="form-group">
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                            <label className="form-label" style={{ marginBottom: 0 }}>{cat.display_name}</label>
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline"
                                                                style={{ padding: '2px 6px', fontSize: '0.7rem', height: 'auto' }}
                                                                onClick={() => handleQuickAdd(index, cat.name)}
                                                            >
                                                                <Plus size={12} /> Add
                                                            </button>
                                                        </div>
                                                        <select
                                                            className="form-control"
                                                            value={item.custom_fields?.[cat.name] || ''}
                                                            onChange={(e) => {
                                                                const newItems = [...items];
                                                                if (!newItems[index].custom_fields) newItems[index].custom_fields = {};
                                                                newItems[index].custom_fields[cat.name] = e.target.value;
                                                                setItems(newItems);
                                                            }}
                                                        >
                                                            <option value="">-- None --</option>
                                                            {(settingsList[index]?.[cat.name] || []).map(val => (
                                                                <option key={val} value={val}>{val}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="row" style={{ marginTop: '20px' }}>
                                <div className="col">
                                    <label className="form-label">Additional Information</label>
                                    <textarea
                                        className="form-control"
                                        rows="2"
                                        value={item.additional_info || ''}
                                        onChange={(e) => handleItemChange(index, 'additional_info', e.target.value)}
                                        placeholder="Any specific instructions for this product item..."
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 4. Production & Delivery */}
                <div className="card form-group">
                    <h3 className="form-label" style={{ fontSize: '1.2rem', marginBottom: '15px', color: 'var(--primary)' }}>Production & Delivery</h3>

                    <div className="row">
                        <div className="col">
                            <label className="form-label">Special Instructions (General)</label>
                            <textarea
                                className="form-control"
                                name="special_instructions"
                                rows="3"
                                value={formData.special_instructions}
                                onChange={handleChange}
                                placeholder="Any overall instructions for this entire job..."
                            ></textarea>
                        </div>
                    </div>

                    <div className="row" style={{ marginTop: '20px' }}>
                        <div className="col">
                            <label className="form-label">Expected Delivery Date</label>
                            <input type="date" className="form-control" name="expected_delivery_date" value={formData.expected_delivery_date} onChange={handleChange} />
                        </div>
                        <div className="col">
                            <label className="form-label">Priority</label>
                            <select className="form-control" name="priority" value={formData.priority} onChange={handleChange}>
                                <option>Normal</option>
                                <option>Urgent</option>
                            </select>
                        </div>
                        <div className="col">
                            <label className="form-label">Delivery Mode</label>
                            <select className="form-control" name="delivery_mode" value={formData.delivery_mode} onChange={handleChange}>
                                <option>Pickup</option>
                                <option>Courier</option>
                                <option>Internal Delivery</option>
                            </select>
                        </div>
                    </div>
                </div >


                <button type="submit" className="btn btn-primary btn-block" style={{ fontSize: '1.1rem', padding: '15px' }} disabled={loading}>
                    {loading ? 'Submitting...' : <><Save size={20} /> Submit Complete Job Order</>}
                </button>
            </form >
        </div >
    );
};

export default NewJob;
