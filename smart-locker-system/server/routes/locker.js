const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db, firebaseInitialized } = require('../config/firebase-admin');
const { verifyToken } = require('../middleware/auth');

// Access shared mock locker status from OTP module
const getOtpModule = () => {
  try {
    return require('./otp');
  } catch {
    return null;
  }
};

// ─── Mock fallback ──────────────────────────────────────────────────────────
const localMockLocker = {
  lockerId: 'LOCKER-001',
  status: 'locked',
  lastAccessBy: null,
  lastUpdated: new Date().toISOString(),
};

const getMockLockerStatus = () => {
  const otpModule = getOtpModule();
  return otpModule && otpModule._mockLockerStatus
    ? otpModule._mockLockerStatus
    : localMockLocker;
};

// ═══════════════════════════════════════════════════════════════════════════════
// GET /status
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/status', verifyToken, async (req, res) => {
  try {
    if (!firebaseInitialized) {
      const mockLocker = getMockLockerStatus();
      return res.json({
        success: true,
        data: { ...mockLocker },
      });
    }

    const lockerDoc = await db.collection('lockerStatus').doc('LOCKER-001').get();

    if (!lockerDoc.exists) {
      // Initialize locker status if not present
      const defaultStatus = {
        lockerId: 'LOCKER-001',
        status: 'locked',
        lastAccessBy: null,
        lastUpdated: new Date().toISOString(),
      };
      await db.collection('lockerStatus').doc('LOCKER-001').set(defaultStatus);
      return res.json({
        success: true,
        data: defaultStatus,
      });
    }

    return res.json({
      success: true,
      data: lockerDoc.data(),
    });
  } catch (error) {
    console.error('Get locker status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get locker status.',
      error: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PUT /status
// ═══════════════════════════════════════════════════════════════════════════════
router.put('/status', verifyToken, async (req, res) => {
  try {
    const { status, userId } = req.body;
    const reqUserId = userId || req.user.userId;

    const validStatuses = ['locked', 'unlocked', 'otp_pending'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    if (!firebaseInitialized) {
      const mockLocker = getMockLockerStatus();
      mockLocker.status = status;
      mockLocker.lastAccessBy = reqUserId;
      mockLocker.lastUpdated = new Date().toISOString();

      return res.json({
        success: true,
        message: `Locker status updated to '${status}'.`,
        data: { ...mockLocker },
      });
    }

    const updateData = {
      lockerId: 'LOCKER-001',
      status,
      lastAccessBy: reqUserId,
      lastUpdated: new Date().toISOString(),
    };

    await db
      .collection('lockerStatus')
      .doc('LOCKER-001')
      .set(updateData, { merge: true });

    // Create access log
    await db.collection('accessLogs').add({
      logId: uuidv4(),
      userId: reqUserId,
      username: req.user.username || 'unknown',
      action: `LOCKER_${status.toUpperCase()}`,
      loginStatus: 'N/A',
      otpGenerated: false,
      otpVerified: false,
      lockerOpened: status === 'unlocked',
      status: 'Success',
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: `Locker status updated to '${status}'.`,
      data: updateData,
    });
  } catch (error) {
    console.error('Update locker status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update locker status.',
      error: error.message,
    });
  }
});

module.exports = router;
