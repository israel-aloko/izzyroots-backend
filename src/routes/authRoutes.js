const express = require('express');
const router = express.Router();
const { login, googleLogin } = require('../controllers/loginController');

router.post('/login', login);
router.post('/google', googleLogin);

module.exports = router;