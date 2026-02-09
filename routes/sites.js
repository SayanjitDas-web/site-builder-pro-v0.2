const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Site = require('../models/Site');

// Helper to Create Slug
const createSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

// Save Site (Create)
router.post('/', auth, async (req, res) => {
    const { name, content, themes } = req.body;
    try {
        // Simple duplicate check for slug (in real app, handle retry with suffix)
        let slug = createSlug(name) || 'untitled';
        let existingSlug = await Site.findOne({ slug });
        if (existingSlug) slug = `${slug}-${Date.now()}`;

        let site = new Site({
            user: req.user.id,
            name,
            slug,
            content,
            themes
        });
        await site.save();
        res.json(site);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get All Sites
router.get('/', auth, async (req, res) => {
    try {
        const sites = await Site.find({}).sort({ updatedAt: -1 });
        res.json(sites);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get Site by Slug (Public View)
router.get('/slug/:slug', async (req, res) => {
    try {
        const site = await Site.findOne({ slug: req.params.slug });
        if (!site) return res.status(404).json({ msg: 'Site not found' });
        // No auth check for public view
        res.json(site);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get Site by ID (Builder)
router.get('/:id', auth, async (req, res) => {
    try {
        const site = await Site.findById(req.params.id);
        if (!site) return res.status(404).json({ msg: 'Site not found' });
        // if (site.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });
        res.json(site);
    } catch (err) {
        // ... (check if valid Object ID or assume error)
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update a site
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, content, themes, slug } = req.body;
        let site = await Site.findById(req.params.id);

        if (!site) return res.status(404).json({ msg: 'Site not found' });

        // if (site.user.toString() !== req.user.id) {
        //     return res.status(401).json({ msg: 'Not authorized' });
        // }

        site.name = name || site.name;
        site.content = content || site.content;

        if (slug && slug !== site.slug) {
            // Check uniqueness
            const existing = await Site.findOne({ slug });
            if (existing) return res.status(400).json({ msg: 'Slug already taken' });
            site.slug = slug;
        }

        site.updatedAt = Date.now();

        await site.save();
        res.json(site);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete a site
router.delete('/:id', auth, async (req, res) => {
    try {
        const site = await Site.findById(req.params.id);

        // Restrict deletion to Admin only
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Only Admins can delete sites.' });
        }

        if (!site) return res.status(404).json({ msg: 'Site not found' });

        // Make sure user owns site
        // if (site.user.toString() !== req.user.id) {
        //     return res.status(401).json({ msg: 'Not authorized' });
        // }

        await Site.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Site removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Setup Wizard: Create Home Page with Default Content
router.post('/setup', auth, async (req, res) => {
    const { siteName } = req.body;
    try {
        const userId = req.user.id;
        // Check if user already has sites
        const existing = await Site.findOne({ user: userId });
        if (existing) {
            // User already has sites, just return the existing one or create a new "Home" if not exists?
            // But Setup implies fresh start. Let's just create a new 'Home' page.
        }

        // Generate unique slug for home? Just 'home' or 'home-1'
        let slug = 'home';
        let uniqueSlug = slug;
        let counter = 1;
        while (await Site.findOne({ slug: uniqueSlug })) {
            uniqueSlug = `${slug}-${counter}`;
            counter++;
        }

        // Create Default Content
        const defaultContent = [
            {
                id: 'nav_' + Math.random().toString(36).substr(2, 9),
                type: 'navbar',
                tagName: 'nav',
                children: [
                    { id: 'b_' + Math.random().toString(36).substr(2, 9), type: 'header', tagName: 'h3', content: siteName || 'My Website', styles: { fontSize: '24px', fontWeight: 'bold', margin: '0' } },
                    {
                        id: 'm_' + Math.random().toString(36).substr(2, 9), type: 'card', tagName: 'div', children: [
                            { id: 'l1', type: 'link', tagName: 'a', content: 'Home', href: '/p/' + uniqueSlug, styles: { textDecoration: 'none', color: '#333', padding: '5px' } },
                            { id: 'l2', type: 'link', tagName: 'a', content: 'About', href: '#', styles: { textDecoration: 'none', color: '#333', padding: '5px' } }
                        ], styles: { display: 'flex', gap: '20px' }
                    }
                ],
                styles: { padding: '20px 40px', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
            },
            {
                id: 'hero_' + Math.random().toString(36).substr(2, 9),
                type: 'card',
                tagName: 'div',
                children: [
                    { id: 'h1', type: 'header', tagName: 'h1', content: 'Welcome to ' + (siteName || 'My Website'), styles: { fontSize: '48px', fontWeight: '800', margin: '0 0 20px 0', color: '#111827' } },
                    { id: 'p1', type: 'paragraph', tagName: 'p', content: 'This is your new home page. Click "Edit" to customize everything.', styles: { fontSize: '18px', color: '#6b7280', margin: '0 0 30px 0', maxWidth: '600px' } },
                    { id: 'btn1', type: 'button', tagName: 'button', content: 'Get Started', styles: { padding: '12px 24px', backgroundColor: '#4f46e5', color: '#fff', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold' } }
                ],
                styles: { padding: '100px 20px', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }
            },
            {
                id: 'footer_' + Math.random().toString(36).substr(2, 9),
                type: 'card',
                tagName: 'div',
                children: [
                    { id: 'ft', type: 'paragraph', tagName: 'p', content: '© ' + new Date().getFullYear() + ' ' + (siteName || 'My Website') + '. Built with SiteBuilder Pro.', styles: { fontSize: '14px', color: '#9ca3af' } }
                ],
                styles: { padding: '40px 20px', backgroundColor: '#111827', color: '#fff', textAlign: 'center', marginTop: 'auto' }
            }
        ];

        const newSite = new Site({
            user: userId,
            name: 'Home', // Default name
            content: JSON.stringify(defaultContent),
            slug: uniqueSlug
        });

        await newSite.save();
        res.json(newSite);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
