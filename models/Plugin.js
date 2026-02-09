const mongoose = require('mongoose');

const PluginSchema = new mongoose.Schema({
    id: { // Internal ID string (e.g. 'smart-form'), useful for official plugins and referencing
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    icon: {
        type: String,
        default: 'fa-cube'
    },
    code: {
        type: String,
        required: true
    },
    isOfficial: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    version: {
        type: String,
        default: '1.0.0'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Plugin', PluginSchema);
