const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

// Static Files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- SETUP MODE LOGIC ---
const isConfigured = () => {
    return process.env.MONGO_URI && process.env.MONGO_URI.length > 0;
};

// Database Connection
const connectDB = require('./config/db');

if (isConfigured()) {
    connectDB();
}

// SETUP ROUTE
app.get('/setup', (req, res) => {
    if (isConfigured()) return res.redirect('/login');
    res.render('setup');
});

app.post('/api/setup', async (req, res) => {
    if (isConfigured()) return res.status(400).json({ msg: 'CMS already configured' });

    const { siteTitle, mongoUri, email, password } = req.body;

    if (!siteTitle || !mongoUri || !email || !password) {
        return res.status(400).json({ msg: 'All fields are required' });
    }

    try {
        // 1. Test Info & DB Connection
        await mongoose.connect(mongoUri);

        // 2. Create Admin User
        const User = require('./models/User');
        const bcrypt = require('bcryptjs');

        // Clear existing (optional, but good for retries on fresh DBs)
        await User.deleteMany({});

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const adminUser = new User({
            email,
            password: hashedPassword,
            role: 'admin'
        });
        await adminUser.save();

        // 3. Create Home Page
        const Site = require('./models/Site');
        await Site.deleteMany({}); // Clean slate
        const homePage = new Site({
            name: 'Home',
            slug: 'home',
            content: JSON.stringify([
                {
                    "tagName": "section",
                    "styles": { "padding": "50px 20px", "textAlign": "center", "backgroundColor": "#f3f4f6", "minHeight": "100vh", "display": "flex", "flexDirection": "column", "justifyContent": "center", "alignItems": "center" },
                    "children": [
                        { "tagName": "h1", "content": "Welcome to SiteBuilder Pro", "styles": { "fontSize": "3rem", "marginBottom": "20px", "color": "#1f2937", "fontWeight": "bold" } },
                        { "tagName": "p", "content": "This is your new home page. You can edit this page in the Dashboard.", "styles": { "fontSize": "1.25rem", "color": "#4b5563", "marginBottom": "30px" } },
                        { "tagName": "button", "content": "Go to Dashboard", "styles": { "padding": "12px 24px", "backgroundColor": "#2563eb", "color": "white", "borderRadius": "8px", "fontSize": "1rem", "cursor": "pointer", "border": "none" }, "href": "/dashboard" } // page.ejs handles href on any element if added to logic, or we use 'a' tag. The renderer uses tagName. Let's use 'a' for safety or ensure renderer handles href. Renderer logic: if (el.href) node.href = el.href. But button with href doesn't work natively. Page.ejs line 70 checks href. Let's use 'a' tag to be standard.
                    ]
                }
            ]).replace('button', 'a').replace('"content": "Go to Dashboard"', '"content": "Go to Dashboard", "tagName": "a", "styles": { "display": "inline-block", "textDecoration": "none", "padding": "12px 24px", "backgroundColor": "#2563eb", "color": "white", "borderRadius": "8px", "fontSize": "1rem", "cursor": "pointer", "border": "none" }'), // Quick fix to JSON for 'a' tag
            themes: '{}',
            user: adminUser.id
        });
        await homePage.save();

        // 4. Write .env file
        let envContent = `PORT=3000\nMONGO_URI=${mongoUri}\nJWT_SECRET=${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}`;

        if (req.body.ikPublic && req.body.ikPrivate && req.body.ikUrl) {
            envContent += `\nIMAGEKIT_PUBLIC_KEY=${req.body.ikPublic}\nIMAGEKIT_PRIVATE_KEY=${req.body.ikPrivate}\nIMAGEKIT_URL_ENDPOINT=${req.body.ikUrl}`;

            // Update process.env runtime
            process.env.IMAGEKIT_PUBLIC_KEY = req.body.ikPublic;
            process.env.IMAGEKIT_PRIVATE_KEY = req.body.ikPrivate;
            process.env.IMAGEKIT_URL_ENDPOINT = req.body.ikUrl;
        }

        await fs.writeFile('.env', envContent);

        // Update process.env runtime
        process.env.MONGO_URI = mongoUri;

        res.json({ msg: 'Setup success' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Setup failed: ' + err.message });
    }
});

// Enforce Setup on all other routes
app.use((req, res, next) => {
    if (!isConfigured() && req.path !== '/setup' && req.path !== '/api/setup') {
        return res.redirect('/setup');
    }
    next();
});

// --- NORMAL APP ROUTES ---

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sites', require('./routes/sites'));
app.use('/api/users', require('./routes/users'));
app.use('/api/users', require('./routes/users'));
app.use('/api/media', require('./routes/media')); // Media Manager Routes
app.use('/api/plugins', require('./routes/plugins'));
app.use('/api/forms', require('./routes/forms'));
app.use('/api/pl-data', require('./routes/pluginData'));



const Site = require('./models/Site');

// Dashboard (Protected)
app.get('/dashboard', (req, res) => {
    res.render('dashboard');
});

// User Management (Admin Only - Client side redirected if not admin, but view is here)
app.get('/users', (req, res) => {
    res.render('users');
});

// Builder with ID (Protected)
app.get('/builder/:id', (req, res) => {
    res.render('builder', { siteId: req.params.id });
});

app.get('/media', (req, res) => {
    if (!isConfigured()) return res.redirect('/setup');
    const token = req.cookies.token;
    if (!token) return res.redirect('/login');
    try {
        const jwt = require('jsonwebtoken'); // Ensure jwt is available here if not global
        jwt.verify(token, process.env.JWT_SECRET || 'secret');
        res.render('media');
    } catch (err) {
        res.redirect('/login');
    }
});
app.get('/p/:slug', (req, res) => {
    res.render('page', { siteSlug: req.params.slug });
});

app.get('/login', (req, res) => {
    if (!isConfigured()) return res.redirect('/setup');
    res.render('login');
});

app.get('/register', (req, res) => {
    // Disable public registration UI
    res.redirect('/login');
});

// Home -> Serve "home" slug if exists
app.get('/', async (req, res) => {
    if (!isConfigured()) return res.redirect('/setup');
    try {
        const homeSite = await Site.findOne({ slug: 'home' });
        if (homeSite) {
            res.render('page', { siteSlug: 'home' });
        } else {
            res.redirect('/login');
        }
    } catch (e) {
        console.error(e);
        res.redirect('/login');
    }
});

// --- PUBLIC STORE API ---
app.post('/api/store/orders', async (req, res) => {
    try {
        const { siteId, orderData } = req.body;
        if (!siteId || !orderData) return res.status(400).json({ msg: 'Missing data' });

        const Site = require('./models/Site');
        const PluginData = require('./models/PluginData');

        const site = await Site.findById(siteId);
        if (!site) return res.status(404).json({ msg: 'Site not found' });

        // Save order for the site owner
        await PluginData.create({
            userId: site.user,
            pluginId: 'ecom-store', // Must match the ID in presetPlugins.js
            collectionName: 'orders',
            data: orderData
        });

        res.json({ success: true });
    } catch (err) {
        console.error('Order Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

app.get('/api/store/settings/:siteId', async (req, res) => {
    try {
        const { siteId } = req.params;
        const Site = require('./models/Site');
        const PluginData = require('./models/PluginData');

        const site = await Site.findById(siteId).populate('user');
        if (!site) return res.status(404).json({ msg: 'Site not found' });

        // Check if plugin is installed for the owner
        if (!site.user || !site.user.installedPlugins.includes('ecom-store')) {
            return res.json({ disabled: true });
        }

        const settings = await PluginData.findOne({
            userId: site.user._id,
            pluginId: 'ecom-store',
            collectionName: 'store_settings',
            'data.id': 'global_styles'
        }).sort({ updatedAt: -1 });

        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.json(settings ? settings.data : { showOnAll: true });
    } catch (err) {
        console.error('Settings Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Fallback
app.get(/(.*)/, (req, res) => {
    res.redirect('/dashboard');
});

const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Keep-alive for Setup Mode (prevents process exit when DB is not connected)
setInterval(() => { }, 10000);

// --- PLUGIN SEEDING ---
const seedPlugins = async () => {
    if (!isConfigured()) return;
    try {
        const Plugin = require('./models/Plugin');
        const PRESET_PLUGINS = require('./data/presetPlugins');

        // We need to upsert plugins to apply code changes
        for (const p of PRESET_PLUGINS) {
            // Check if plugin exists and if it is official
            const existing = await Plugin.findOne({ id: p.id });
            if (existing && existing.isOfficial) {
                // Update the code to ensure new logic is applied
                existing.code = p.code;
                await existing.save();
                console.log(`Updated plugin: ${p.name}`);
            } else if (!existing) {
                await Plugin.create({ ...p, isOfficial: true });
                console.log(`Seeded plugin: ${p.name}`);
            }
        }
    } catch (err) {
        console.error('Plugin Seeding Error:', err);
    }
};

// Run seeding after DB connection (roughly) or on interval if lazy
setTimeout(seedPlugins, 5000);
