const { auth, firebaseInitialized } = require('../config/firebase-admin');
const jwt = require('jsonwebtoken');

const DEMO_USER = {
  uid: 'U1001',
  userId: 'U1001',
  email: 'admin@smartlocker.com',
  username: 'admin',
  fullName: 'Demo Admin',
  role: 'admin',
  isActive: true,
};

/**
 * Verify JWT / Firebase token from Authorization header.
 * In demo mode (Firebase not configured), allows requests through with a mock user.
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (!firebaseInitialized) {
        console.warn('⚠️  Demo mode: No token provided, using demo user');
        req.user = { ...DEMO_USER };
        return next();
      }
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!firebaseInitialized) {
      // Demo mode: try to decode JWT locally
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
      } catch {
        // If JWT decode fails in demo mode, use demo user
        req.user = { ...DEMO_USER };
      }
      return next();
    }

    // Production: verify with Firebase Auth
    try {
      const decodedFirebase = await auth.verifyIdToken(token);
      req.user = decodedFirebase;
      return next();
    } catch {
      // Fallback: try local JWT verification
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        return next();
      } catch {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token.',
        });
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Authentication error.',
    });
  }
};

/**
 * Verify that the authenticated user has admin role.
 */
const verifyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }

  next();
};

module.exports = { verifyToken, verifyAdmin };
