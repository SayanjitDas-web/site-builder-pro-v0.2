const express = require('express');
const router = express.Router();
const multer = require('multer');
const ImageKit = require('imagekit');
const Media = require('../models/Media');
const auth = require('../middleware/auth');

// ImageKit Init
let imagekit;
if (process.env.IMAGEKIT_PUBLIC_KEY) {
    imagekit = new ImageKit({
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
    });
}

// Use Memory Storage for ImageKit
const storage = multer.memoryStorage();

// File Filter
const fileFilter = (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// @route   POST /api/media
// @desc    Upload media file to ImageKit
// @access  Private
router.post('/', auth, upload.single('media'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded or invalid file type' });
        }

        // Upload to ImageKit
        if (!imagekit) {
             // Init if available now (e.g. after setup without restart)
             if (process.env.IMAGEKIT_PUBLIC_KEY) {
                imagekit = new ImageKit({
                    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
                    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
                    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
                });
             } else {
                 return res.status(500).json({ msg: 'ImageKit not configured' });
             }
        }

        imagekit.upload({
            file: req.file.buffer, // Buffer
            fileName: req.file.originalname,
            folder: '/site-builder-pro/'
        }, async (error, result) => {
            if (error) {
                console.error('ImageKit Upload Error:', error);
                return res.status(500).json({ msg: 'ImageKit Upload Failed' });
            }

            const newMedia = new Media({
                filename: result.name,
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                size: result.size,
                url: result.url,
                fileId: result.fileId,
                filePath: result.filePath,
                uploadedBy: req.user.id
            });

            await newMedia.save();
            res.json(newMedia);
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/media
// @desc    Get all media
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const files = await Media.find().sort({ createdAt: -1 });
        res.json(files);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/media/:id
// @desc    Delete media from DB and ImageKit
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);

        if (!media) return res.status(404).json({ msg: 'Media not found' });

        // Delete from ImageKit if fileId exists
        if (media.fileId && imagekit) {
            imagekit.deleteFile(media.fileId, async (error, result) => {
                if (error) {
                    console.error('ImageKit Delete Error:', error);
                    // Continue to delete from DB even if IK fails (to keep DB clean)
                }
            });
        }

        await Media.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Media deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
