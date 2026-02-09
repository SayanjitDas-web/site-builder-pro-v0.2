const mongoose = require('mongoose');

const FormResponseSchema = new mongoose.Schema({
    siteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Site',
        required: true
    },
    formId: {
        type: String, // Optional, to distinguish multiple forms
        default: 'default'
    },
    data: {
        type: Map,
        of: String, // Simple key-value pairs for form fields
        required: true
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('FormResponse', FormResponseSchema);
