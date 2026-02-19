const jwt = require('jsonwebtoken');
const stringFile = require('./stringify.json');

exports.jwtverification = function (req, res, next) {
    try {
        const excludedUrls = process.env.JWT_EXCEPTIONAL_URL || "";
        const authHeader = req.headers.authorization;

        // Skip JWT for exceptional URLs
        if (excludedUrls.includes(req.path)) {
            return next();
        }

        // Check if Authorization header exists
        if (!authHeader) {
            return res.status(stringFile.AUTHORIZATION_ERROR_CODE).send({
                message: stringFile.PROVIDE_AUTHORIZATION_DETAILS
            });
        }

        // Remove Bearer prefix if present
        const token = authHeader.includes("Bearer")
            ? authHeader.replace('Bearer', '').trim()
            : authHeader.trim();

        // Verify token
        jwt.verify(token, process.env.AUTHKEY, (err, result) => {
            if (err) {
                return res.status(stringFile.AUTHORIZATION_ERROR_CODE).send({
                    message: stringFile.PROVIDE_AUTHORIZATION_DETAILS
                });
            } else {
                req.authResult = result;
                next();
            }
        });

    } catch (err) {
        return res.status(500).send({
            message: "Internal server error",
            error: err.message
        });
    }
};
