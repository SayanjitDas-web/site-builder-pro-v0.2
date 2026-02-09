const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PluginData = require('../models/PluginData');

// Middleware to ensure pluginId is provided
const requirePluginId = (req, res, next) => {
    if (!req.params.pluginId) {
        return res.status(400).json({ msg: 'Plugin ID required' });
    }
    next();
};

// GET /api/pl-data/public/:pluginId/:collection
// PUBLIC: List documents in a collection for this plugin (read-only)
// Note: This assumes public data is fine. For better security, we might need a "public" flag in the collection.
// For this E-com implementation, we assume "products" collection is public.
router.get('/public/:pluginId/:collection', async (req, res) => {
    try {
        const { pluginId, collection } = req.params;
        const data = await PluginData.find({
            pluginId,
            collectionName: collection
        }).sort({ createdAt: -1 });
        res.json(data);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/pl-data/:pluginId/:collection
// List documents in a collection for this user + plugin
router.get('/:pluginId/:collection', auth, requirePluginId, async (req, res) => {
    try {
        const { pluginId, collection } = req.params;
        const data = await PluginData.find({
            userId: req.user.id,
            pluginId,
            collectionName: collection
        }).sort({ createdAt: -1 });
        res.json(data);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/pl-data/:pluginId/:collection/:id
// Get single document
router.get('/:pluginId/:collection/:id', auth, requirePluginId, async (req, res) => {
    try {
        const doc = await PluginData.findOne({
            _id: req.params.id,
            userId: req.user.id,
            pluginId: req.params.pluginId
        });
        if (!doc) return res.status(404).json({ msg: 'Document not found' });
        res.json(doc);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/pl-data/:pluginId/:collection
// Create new document
router.post('/:pluginId/:collection', auth, requirePluginId, async (req, res) => {
    try {
        const { pluginId, collection } = req.params;
        const { data } = req.body;

        const newDoc = new PluginData({
            userId: req.user.id,
            pluginId,
            collectionName: collection,
            data
        });

        const doc = await newDoc.save();
        res.json(doc);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// PUT /api/pl-data/:pluginId/:collection/:id
// Update document
router.put('/:pluginId/:collection/:id', auth, requirePluginId, async (req, res) => {
    try {
        const { data } = req.body;
        let doc = await PluginData.findOne({
            _id: req.params.id,
            userId: req.user.id,
            pluginId: req.params.pluginId
        });

        if (!doc) return res.status(404).json({ msg: 'Document not found' });

        doc.data = data;
        doc.updatedAt = Date.now();

        await doc.save();
        res.json(doc);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE /api/pl-data/:pluginId/:collection/:id
// Delete document
router.delete('/:pluginId/:collection/:id', auth, requirePluginId, async (req, res) => {
    try {
        const doc = await PluginData.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id,
            pluginId: req.params.pluginId
        });

        if (!doc) return res.status(404).json({ msg: 'Document not found' });
        res.json({ msg: 'Document removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
