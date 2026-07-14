const loginService = require('../services/loginService');

function setAuthCookie(res, token) {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, //7 days
    });
}

async function login(req, res) {
    const response = await loginService.login(req.body);

    if (!response.userId) {
        return res.status(401).json(response);
    }

    setAuthCookie(res, response.token);
    const { toke, ...safeResponse } = response;
    res.status(200).json(response);
}

async function googleLogin(req, res) {
    const { idToken } = req.body;
    const response = await loginService.handleGoogleLogin(idToken);

    if (!response.userId) {
        return res.status(401).json(response);
    }

    setAuthCookie(res, response.token);
    const { token, ...safeResponse } = response;
    res.status(200).json(response);
}

module.exports = { login, googleLogin };