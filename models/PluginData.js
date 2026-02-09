const mongoose = require('mongoose');

const PluginDataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    pluginId: {
        type: String,
        required: true,
        index: true
    },
    collectionName: {
        type: String,
        required: true,
        default: 'default'
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure unique index for specific data points if needed, 
// but for now we might want multiple documents per collection.
// Let's just index for fast lookup.
PluginDataSchema.index({ userId: 1, pluginId: 1, collectionName: 1 });

module.exports = mongoose.model('PluginData', PluginDataSchema);
