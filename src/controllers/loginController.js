const loginService = require('../services/loginService');

async function login(req, res) {
    const response = await loginService.login(req.body);

    if (!response.userId) {
        return res.status(401).json(response);
    }
    res.status(200).json(response);
}

async function googleLogin(req, res) {
    const { idToken } = req.body;
    const response = await loginService.handleGoogleLogin(idToken);

    if (!response.userId) {
        return res.status(401).json(response);
    }
    res.status(200).json(response);
}

module.exports = { login, googleLogin };