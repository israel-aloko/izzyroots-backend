const express = require('express');
const router = express.Router();
const {
    adminLogin,
    adminGoogleLogin,
    getAdminProfile,
    adminLogout,
} = require('../controllers/adminAuthController');

const isAdmin = require('../middleware/isAdmin');

router.post('/login', adminLogin);
router.post('/google-login', adminGoogleLogin);
router.post('/logout', adminLogout);
router.get('/me', isAdmin, getAdminProfile);

module.exports = router;