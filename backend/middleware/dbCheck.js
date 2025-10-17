const { isDatabaseConnected } = require('../db/connection');

module.exports = function dbCheck(req, res, next) {
    if (isDatabaseConnected()) return next();

    // return plain text 503
    return res.status(503).send('Service unavailable: database is down');
};
