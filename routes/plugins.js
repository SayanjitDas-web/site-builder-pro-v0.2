const express = require('express');
const router = express.Router();
const Plugin = require('../models/Plugin');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET /api/plugins/store
// @desc    Get all official plugins
// @access  Public (or Private)
router.get('/store', auth, async (req, res) => {
    try {
        const plugins = await Plugin.find({ isOfficial: true }).select('-code'); // Don't send code for store listing if not needed, or send it.
        // Actually, for the store we might want description etc. Code is needed only when installed? 
        // For now let's send everything except maybe heavy fields if we had them. 
        // Sending code is fine for now as they are small.
        res.json(plugins);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/plugins/me
// @desc    Get installed plugins (Official + Custom)
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // 1. Get Official Plugins that are installed
        // The installedPlugins array in User model stores the string 'id' of the plugin (e.g. 'smart-form')
        const installedIDs = user.installedPlugins || [];
        const officialPlugins = await Plugin.find({
            id: { $in: installedIDs },
            isOfficial: true
        });

        // 2. Get Custom Plugins created by this user
        const customPlugins = await Plugin.find({
            createdBy: req.user.id,
            isOfficial: false
        });

        // Combine
        res.json([...officialPlugins, ...customPlugins]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/plugins/install/:id
// @desc    Install an official plugin
// @access  Private
router.post('/install/:id', auth, async (req, res) => {
    try {
        const plugin = await Plugin.findOne({ id: req.params.id, isOfficial: true });
        if (!plugin) return res.status(404).json({ msg: 'Plugin not found' });

        const user = await User.findById(req.user.id);
        if (user.installedPlugins.includes(plugin.id)) {
            return res.status(400).json({ msg: 'Result: Plugin already installed' });
        }

        user.installedPlugins.push(plugin.id);
        await user.save();

        res.json({ msg: 'Plugin installed', plugin });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/plugins/install/:id
// @desc    Uninstall a plugin
// @access  Private
router.delete('/install/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.installedPlugins = user.installedPlugins.filter(id => id !== req.params.id);
        await user.save();
        res.json({ msg: 'Plugin uninstalled' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/plugins/custom
// @desc    Create a custom plugin
// @access  Private
router.post('/custom', auth, async (req, res) => {
    const { name, code } = req.body;
    if (!name || !code) return res.status(400).json({ msg: 'Name and Code are required' });

    try {
        const id = 'custom_' + Math.random().toString(36).substr(2, 9);
        const newPlugin = new Plugin({
            id,
            name,
            code,
            isOfficial: false,
            createdBy: req.user.id,
            icon: 'fa-puzzle-piece', // Default icon
            description: 'Custom Plugin'
        });

        await newPlugin.save();
        res.json(newPlugin);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/plugins/custom/:id
// @desc    Delete a custom plugin
// @access  Private
router.delete('/custom/:id', auth, async (req, res) => {
    try {
        const plugin = await Plugin.findOne({ id: req.params.id });
        if (!plugin) return res.status(404).json({ msg: 'Plugin not found' });

        if (plugin.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await Plugin.findOneAndDelete({ id: req.params.id });
        res.json({ msg: 'Plugin deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
