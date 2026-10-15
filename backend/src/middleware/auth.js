const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supplyflow-default-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

/**
 * Middleware: Authenticate JWT from Authorization header (Bearer token)
 * Attaches req.user = { loginId, email, role, supplierId | restaurantId }
 */
function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') && authHeader.slice(7);

    if (!token) {
        return res.status(401).json({ error: 'Authentication required. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Session expired. Please log in again.' });
        }
        return res.status(401).json({ error: 'Invalid token. Please log in again.' });
    }
}

/**
 * Middleware factory: Restrict to specific role(s)
 * Usage: authorize('SUPPLIER') or authorize('RESTAURANT')
 */
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required.' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
}

/**
 * Generate a signed JWT for a login record
 */
function generateToken(loginRecord) {
    const payload = {
        loginId:      loginRecord.LOGIN_ID,
        email:        loginRecord.EMAIL,
        role:         loginRecord.ROLE,
        supplierId:   loginRecord.SUPPLIER_ID   || null,
        restaurantId: loginRecord.RESTAURANT_ID || null,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

module.exports = { authenticate, authorize, generateToken };
