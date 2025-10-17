const User = require('../models/User');

// Authentication middleware
const requireLogin = async (req, res, next) => {
    const { userId } = req.query;
    if (!userId) {
        return res.redirect(`/user/login-${req.app.locals.STUDENT_ID}`);
    }
    try {
        const user = await User.findOne({ userId });
        if (!user || !user.isLoggedIn) {
            return res.redirect(`/user/login-${req.app.locals.STUDENT_ID}`);
        }
        req.user = user; // Attach user to request for later use
        next();
    } catch (err) {
        console.error('Auth error:', err);
        return res.redirect(`/user/login-${req.app.locals.STUDENT_ID}`);
    }
};

// Authorization middleware: only allow users with roles in `allowed`
const authorizeRoles = (allowed) => (req, res, next) => {
    const allowedLower = allowed.map(r => String(r).toLowerCase().trim());
    const userRole = req.user && req.user.role ? String(req.user.role).toLowerCase().trim() : '';
    console.log('authorizeRoles - req.user:', req.user); // debug line
    console.log('authorizeRoles - allowedLower:', allowedLower); // debug line
    if (!req.user || !userRole || !allowedLower.includes(userRole)) {
        return res.status(403).render('errors/403', {
            title: 'Forbidden',
            STUDENT_ID: req.app.locals.STUDENT_ID,
            STUDENT_NAME: req.app.locals.STUDENT_NAME,
            userId: req.user ? req.user.userId : null
        });
    }
    next();
};

module.exports = { requireLogin, authorizeRoles };