/**
 * Role-Based Access Control (RBAC) authorization middleware.
 * Restricts access to routes based on user role (e.g. ADMIN, USER).
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Access token missing or invalid"
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Forbidden: Access restricted. Required role(s): [${roles.join(", ")}]`
            });
        }

        next();
    };
};

module.exports = authorize;
