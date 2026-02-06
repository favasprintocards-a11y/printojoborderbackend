const mongoose = require('mongoose');

const JobItemSchema = new mongoose.Schema({
    product_type: String,
    card_size: String,
    quantity: Number,
    printing_type: String,
    printing_mode: String,
    finish: String,
    accessories: String,
    material: String,
    variable_data: String,
    file_path: String,
    rate: { type: Number, default: 0 },
    common_front: { type: Boolean, default: false },
    common_back: { type: Boolean, default: false },
    binding: String,
    corner: String,
    paper_thickness: String,
    custom_fields: { type: mongoose.Schema.Types.Mixed, default: {} },
    additional_info: String,
    advance_amount: { type: Number, default: 0 }
});

const JobSchema = new mongoose.Schema({
    job_id_display: String,
    submitted_by: { type: String, required: true },
    submitted_contact: String,

    client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    client_name: { type: String, required: true },
    client_phone: String,
    client_email: String,
    client_company: String,
    client_address: String,

    items: [JobItemSchema],

    special_instructions: String,
    expected_delivery_date: String,
    priority: { type: String, default: 'Normal' },
    delivery_mode: String,

    status: { type: String, default: 'Received' },
    total_amount: { type: Number, default: 0 },
    advance_amount: { type: Number, default: 0 },
    gst_rate: { type: Number, default: 0 },
    courier_charge: { type: Number, default: 0 }
}, { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model('Job', JobSchema);
