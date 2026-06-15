const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db, firebaseInitialized } = require('../config/firebase-admin');
const { verifyToken } = require('../middleware/auth');

// ─── Mock Data Store (Demo Mode) ────────────────────────────────────────────
const mockLogs = [];

const seedDemoLogs = () => {
  if (mockLogs.length > 0) return;
  const now = Date.now();
  const entries = [
    {
      logId: uuidv4(),
      userId: 'U1001',
      username: 'admin',
      action: 'LOGIN',
      loginStatus: 'Success',
      otpGenerated: false,
      otpVerified: false,
      lockerOpened: false,
      status: 'Success',
      timestamp: new Date(now - 60000).toISOString(),
    },
    {
      logId: uuidv4(),
      userId: 'U1002',
      username: 'johndoe',
      action: 'LOGIN',
      loginStatus: 'Success',
      otpGenerated: false,
      otpVerified: false,
      lockerOpened: false,
      status: 'Success',
      timestamp: new Date(now - 120000).toISOString(),
    },
    {
      logId: uuidv4(),
      userId: 'U1002',
      username: 'johndoe',
      action: 'OTP_GENERATED',
      loginStatus: 'N/A',
      otpGenerated: true,
      otpVerified: false,
      lockerOpened: false,
      status: 'Success',
      timestamp: new Date(now - 100000).toISOString(),
    },
    {
      logId: uuidv4(),
      userId: 'U1002',
      username: 'johndoe',
      action: 'OTP_VERIFIED',
      loginStatus: 'N/A',
      otpGenerated: true,
      otpVerified: true,
      lockerOpened: true,
      status: 'Success',
      timestamp: new Date(now - 90000).toISOString(),
    },
    {
      logId: uuidv4(),
      userId: 'U1003',
      username: 'janesmith',
      action: 'LOGIN',
      loginStatus: 'Success',
      otpGenerated: false,
      otpVerified: false,
      lockerOpened: false,
      status: 'Success',
      timestamp: new Date(now - 3600000).toISOString(),
    },
    {
      logId: uuidv4(),
      userId: 'U1003',
      username: 'janesmith',
      action: 'OTP_GENERATED',
      loginStatus: 'N/A',
      otpGenerated: true,
      otpVerified: false,
      lockerOpened: false,
      status: 'Success',
      timestamp: new Date(now - 3500000).toISOString(),
    },
    {
      logId: uuidv4(),
      userId: 'U1003',
      username: 'janesmith',
      action: 'OTP_VERIFIED',
      loginStatus: 'N/A',
      otpGenerated: true,
      otpVerified: true,
      lockerOpened: true,
      status: 'Success',
      timestamp: new Date(now - 3400000).toISOString(),
    },
    {
      logId: uuidv4(),
      userId: 'U1003',
      username: 'janesmith',
      action: 'LOCKER_LOCKED',
      loginStatus: 'N/A',
      otpGenerated: false,
      otpVerified: false,
      lockerOpened: false,
      status: 'Success',
      timestamp: new Date(now - 3300000).toISOString(),
    },
    {
      logId: uuidv4(),
      userId: 'unknown',
      username: 'unknown_user',
      action: 'LOGIN',
      loginStatus: 'Failed',
      otpGenerated: false,
      otpVerified: false,
      lockerOpened: false,
      status: 'Failed',
      timestamp: new Date(now - 7200000).toISOString(),
    },
    {
      logId: uuidv4(),
      userId: 'U1002',
      username: 'johndoe',
      action: 'LOCKER_LOCKED',
      loginStatus: 'N/A',
      otpGenerated: false,
      otpVerified: false,
      lockerOpened: false,
      status: 'Success',
      timestamp: new Date(now - 80000).toISOString(),
    },
    {
      logId: uuidv4(),
      userId: 'U1001',
      username: 'admin',
      action: 'OTP_GENERATED',
      loginStatus: 'N/A',
      otpGenerated: true,
      otpVerified: false,
      lockerOpened: false,
      status: 'Success',
      timestamp: new Date(now - 86400000).toISOString(),
    },
    {
      logId: uuidv4(),
      userId: 'U1001',
      username: 'admin',
      action: 'OTP_VERIFIED',
      loginStatus: 'N/A',
      otpGenerated: true,
      otpVerified: true,
      lockerOpened: true,
      status: 'Success',
      timestamp: new Date(now - 86300000).toISOString(),
    },
  ];
  mockLogs.push(...entries);
};

seedDemoLogs();

// ═══════════════════════════════════════════════════════════════════════════════
// GET / - Get all logs with filters and pagination
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/', verifyToken, async (req, res) => {
  try {
    const {
      userId,
      status,
      action,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (!firebaseInitialized) {
      let filtered = [...mockLogs];

      if (userId) {
        filtered = filtered.filter((l) => l.userId === userId);
      }
      if (status) {
        filtered = filtered.filter((l) => l.status === status);
      }
      if (action) {
        filtered = filtered.filter((l) => l.action === action);
      }
      if (dateFrom) {
        const from = new Date(dateFrom);
        filtered = filtered.filter((l) => new Date(l.timestamp) >= from);
      }
      if (dateTo) {
        const to = new Date(dateTo);
        filtered = filtered.filter((l) => new Date(l.timestamp) <= to);
      }

      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      const total = filtered.length;
      const startIdx = (pageNum - 1) * limitNum;
      const paginated = filtered.slice(startIdx, startIdx + limitNum);

      return res.json({
        success: true,
        data: paginated,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }

    // ── Production Mode ──
    let query = db.collection('accessLogs').orderBy('timestamp', 'desc');

    if (userId) {
      query = query.where('userId', '==', userId);
    }
    if (status) {
      query = query.where('status', '==', status);
    }
    if (action) {
      query = query.where('action', '==', action);
    }
    if (dateFrom) {
      query = query.where('timestamp', '>=', dateFrom);
    }
    if (dateTo) {
      query = query.where('timestamp', '<=', dateTo);
    }

    const snapshot = await query.limit(limitNum * pageNum).get();
    const allDocs = snapshot.docs.map((doc) => doc.data());
    const startIdx = (pageNum - 1) * limitNum;
    const paginated = allDocs.slice(startIdx, startIdx + limitNum);

    return res.json({
      success: true,
      data: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allDocs.length,
        totalPages: Math.ceil(allDocs.length / limitNum),
      },
    });
  } catch (error) {
    console.error('Get logs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get access logs.',
      error: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /:userId - Get logs for specific user
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (!firebaseInitialized) {
      const userLogs = mockLogs
        .filter((l) => l.userId === userId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      const total = userLogs.length;
      const startIdx = (pageNum - 1) * limitNum;
      const paginated = userLogs.slice(startIdx, startIdx + limitNum);

      return res.json({
        success: true,
        data: paginated,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }

    const snapshot = await db
      .collection('accessLogs')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limitNum * pageNum)
      .get();

    const allDocs = snapshot.docs.map((doc) => doc.data());
    const startIdx = (pageNum - 1) * limitNum;
    const paginated = allDocs.slice(startIdx, startIdx + limitNum);

    return res.json({
      success: true,
      data: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allDocs.length,
        totalPages: Math.ceil(allDocs.length / limitNum),
      },
    });
  } catch (error) {
    console.error('Get user logs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user logs.',
      error: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST / - Create new access log entry
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      userId,
      username,
      action,
      loginStatus = 'N/A',
      otpGenerated = false,
      otpVerified = false,
      lockerOpened = false,
      status = 'Success',
    } = req.body;

    const reqUserId = userId || req.user.userId;
    const reqUsername = username || req.user.username;

    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Action is required.',
      });
    }

    const logEntry = {
      logId: uuidv4(),
      userId: reqUserId,
      username: reqUsername || 'unknown',
      action,
      loginStatus,
      otpGenerated,
      otpVerified,
      lockerOpened,
      status,
      timestamp: new Date().toISOString(),
    };

    if (!firebaseInitialized) {
      mockLogs.unshift(logEntry);
      return res.status(201).json({
        success: true,
        message: 'Access log created.',
        data: logEntry,
      });
    }

    await db.collection('accessLogs').doc(logEntry.logId).set(logEntry);

    return res.status(201).json({
      success: true,
      message: 'Access log created.',
      data: logEntry,
    });
  } catch (error) {
    console.error('Create log error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create access log.',
      error: error.message,
    });
  }
});

module.exports = router;
module.exports._mockLogs = mockLogs;
