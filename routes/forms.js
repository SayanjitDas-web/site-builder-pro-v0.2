const express = require('express');
const router = express.Router();
const FormResponse = require('../models/FormResponse');
const Site = require('../models/Site');
const auth = require('../middleware/auth');

// @route   POST /api/forms/submit/:siteId
// @desc    Submit a form for a specific site
// @access  Public
router.post('/submit/:siteId', async (req, res) => {
    try {
        const { siteId } = req.params;

        // Basic validation: Check if site exists
        const site = await Site.findById(siteId);
        if (!site) return res.status(404).json({ msg: 'Site not found' });

        // Create response
        // Accept both JSON body and URL Encoded body (standard form submit)
        const formData = req.body;

        // If it's a standard form submit, req.body might have a 'redirect' field or similar, 
        // but for now we'll just store everything except maybe system fields if we had any.

        const response = new FormResponse({
            siteId,
            data: formData
        });

        await response.save();

        // If 'ajax' query param is set, return JSON, else redirect back
        if (req.query.ajax === 'true' || req.headers.accept?.includes('application/json')) {
            return res.json({ msg: 'Form submitted successfully' });
        } else {
            // Redirect back to the referrer or the site
            const backURL = req.header('Referer') || `/p/${site.slug || site._id}`;
            // Add a query param for success message handling on frontend if needed
            return res.redirect(backURL + '?form_success=true');
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/forms/:siteId
// @desc    Get all responses for a site
// @access  Private (Owner only)
router.get('/:siteId', auth, async (req, res) => {
    try {
        const site = await Site.findById(req.params.siteId);
        if (!site) return res.status(404).json({ msg: 'Site not found' });

        // Check ownership
        if (site.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const responses = await FormResponse.find({ siteId: req.params.siteId }).sort({ submittedAt: -1 });
        res.json(responses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
