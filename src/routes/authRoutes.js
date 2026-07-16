const express = require('express');
const router = express.Router();
const { login, googleLogin } = require('../controllers/loginController');
const {forgotPassword, verifyResetOtp, resetPassword} = require('../controllers/loginController');

router.post('/login', login);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);

module.exports = router;