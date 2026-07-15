const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'izzyroots/support-ticketimages',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }]
    }
});

const uploadTicketimages = multer({
    storage,
    limits: {fileSize: 5 * 1024 * 1024}
});

module.exports = uploadTicketimages;