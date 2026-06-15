const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { db, firebaseInitialized } = require('../config/firebase-admin');

// ─── ESP32 API Key Validation ───────────────────────────────────────────────
const ESP32_API_KEY = process.env.ESP32_API_KEY || 'esp32-smart-locker-key-2024';

const verifyEsp32ApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  // In demo mode, allow all ESP32 requests
  if (!firebaseInitialized) {
    return next();
  }

  if (!apiKey || apiKey !== ESP32_API_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or missing API key.',
    });
  }

  next();
};

// ─── Mock Data References (Demo Mode) ───────────────────────────────────────
const getOtpModule = () => {
  try {
    return require('./otp');
  } catch {
    return null;
  }
};

const getMockLockerStatus = () => {
  const otpModule = getOtpModule();
  return otpModule && otpModule._mockLockerStatus
    ? otpModule._mockLockerStatus
    : { lockerId: 'LOCKER-001', status: 'locked', lastAccessBy: null, lastUpdated: new Date().toISOString() };
};

// Mock users for credential verification in demo mode
const getMockUser = (username) => {
  const bcryptLib = require('bcryptjs');
  const demoUsers = {
    admin: {
      userId: 'U1001',
      fullName: 'Admin User',
      username: 'admin',
      email: 'admin@smartlocker.com',
      passwordHash: bcryptLib.hashSync('admin123', 10),
      role: 'admin',
      isActive: true,
    },
    johndoe: {
      userId: 'U1002',
      fullName: 'John Doe',
      username: 'johndoe',
      email: 'john@smartlocker.com',
      passwordHash: bcryptLib.hashSync('john123', 10),
      role: 'user',
      isActive: true,
    },
    janesmith: {
      userId: 'U1003',
      fullName: 'Jane Smith',
      username: 'janesmith',
      email: 'jane@smartlocker.com',
      passwordHash: bcryptLib.hashSync('jane123', 10),
      role: 'user',
      isActive: true,
    },
    bobwilson: {
      userId: 'U1004',
      fullName: 'Bob Wilson',
      username: 'bobwilson',
      email: 'bob@smartlocker.com',
      passwordHash: bcryptLib.hashSync('bob123', 10),
      role: 'user',
      isActive: false,
    },
  };
  return demoUsers[username] || null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// POST /verify-credentials - ESP32 credential verification
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/verify-credentials', verifyEsp32ApiKey, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.',
      });
    }

    if (!firebaseInitialized) {
      const user = getMockUser(username);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials.',
          verified: false,
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is disabled.',
          verified: false,
        });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials.',
          verified: false,
        });
      }

      return res.json({
        success: true,
        message: 'Credentials verified.',
        verified: true,
        data: {
          userId: user.userId,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
        },
      });
    }

    // ── Production Mode ──
    const snapshot = await db
      .collection('users')
      .where('username', '==', username)
      .limit(1)
      .get();

    if (snapshot.empty) {
      // Log failed attempt
      await db.collection('securityEvents').add({
        eventId: uuidv4(),
        userId: 'unknown',
        type: 'FAILED_ESP32_LOGIN',
        details: `Failed ESP32 credential verification for: ${username}`,
        ipAddress: req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString(),
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
        verified: false,
      });
    }

    const userData = snapshot.docs[0].data();

    if (!userData.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is disabled.',
        verified: false,
      });
    }

    const isMatch = await bcrypt.compare(password, userData.passwordHash);
    if (!isMatch) {
      await db.collection('securityEvents').add({
        eventId: uuidv4(),
        userId: userData.userId,
        type: 'FAILED_ESP32_LOGIN',
        details: `Failed ESP32 password verification for: ${username}`,
        ipAddress: req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString(),
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
        verified: false,
      });
    }

    // Log successful ESP32 login
    await db.collection('accessLogs').add({
      logId: uuidv4(),
      userId: userData.userId,
      username: userData.username,
      action: 'ESP32_LOGIN',
      loginStatus: 'Success',
      otpGenerated: false,
      otpVerified: false,
      lockerOpened: false,
      status: 'Success',
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: 'Credentials verified.',
      verified: true,
      data: {
        userId: userData.userId,
        username: userData.username,
        fullName: userData.fullName,
        role: userData.role,
      },
    });
  } catch (error) {
    console.error('ESP32 verify credentials error:', error);
    return res.status(500).json({
      success: false,
      message: 'Verification failed.',
      verified: false,
      error: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /generate-otp - ESP32 OTP generation
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/generate-otp', verifyEsp32ApiKey, async (req, res) => {
  try {
    const { userId, username } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required.',
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const generatedAt = new Date();
    const expiresAt = new Date(generatedAt.getTime() + 60000);

    const otpRecord = {
      otpId: uuidv4(),
      userId,
      username: username || 'unknown',
      otp,
      generatedAt: generatedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'Active',
    };

    if (!firebaseInitialized) {
      const otpModule = getOtpModule();
      if (otpModule && otpModule._mockOtpRecords) {
        // Expire active OTPs for this user
        otpModule._expireMockOtps();
        otpModule._mockOtpRecords.forEach((record) => {
          if (record.userId === userId && record.status === 'Active') {
            record.status = 'Expired';
          }
        });
        otpModule._mockOtpRecords.unshift(otpRecord);
      }

      const mockLocker = getMockLockerStatus();
      mockLocker.status = 'otp_pending';
      mockLocker.lastAccessBy = userId;
      mockLocker.lastUpdated = new Date().toISOString();

      return res.status(201).json({
        success: true,
        message: 'OTP generated successfully.',
        data: {
          otpId: otpRecord.otpId,
          otp: otpRecord.otp,
          expiresAt: otpRecord.expiresAt,
          expiresInSeconds: 60,
        },
      });
    }

    // ── Production Mode ──
    // Expire active OTPs
    const activeOtps = await db
      .collection('otpRecords')
      .where('userId', '==', userId)
      .where('status', '==', 'Active')
      .get();

    const batch = db.batch();
    activeOtps.forEach((doc) => {
      batch.update(doc.ref, { status: 'Expired' });
    });

    const otpRef = db.collection('otpRecords').doc(otpRecord.otpId);
    batch.set(otpRef, otpRecord);

    const lockerRef = db.collection('lockerStatus').doc('LOCKER-001');
    batch.set(
      lockerRef,
      {
        lockerId: 'LOCKER-001',
        status: 'otp_pending',
        lastAccessBy: userId,
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );

    await batch.commit();

    await db.collection('accessLogs').add({
      logId: uuidv4(),
      userId,
      username: username || 'unknown',
      action: 'ESP32_OTP_GENERATED',
      loginStatus: 'N/A',
      otpGenerated: true,
      otpVerified: false,
      lockerOpened: false,
      status: 'Success',
      timestamp: new Date().toISOString(),
    });

    return res.status(201).json({
      success: true,
      message: 'OTP generated successfully.',
      data: {
        otpId: otpRecord.otpId,
        otp: otpRecord.otp,
        expiresAt: otpRecord.expiresAt,
        expiresInSeconds: 60,
      },
    });
  } catch (error) {
    console.error('ESP32 OTP generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate OTP.',
      error: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /verify-otp - ESP32 OTP verification
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/verify-otp', verifyEsp32ApiKey, async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'User ID and OTP are required.',
        verified: false,
      });
    }

    if (!firebaseInitialized) {
      const otpModule = getOtpModule();
      if (otpModule && otpModule._mockOtpRecords) {
        otpModule._expireMockOtps();

        const record = otpModule._mockOtpRecords.find(
          (r) => r.userId === userId && r.otp === otp && r.status === 'Active'
        );

        if (!record) {
          const expiredRecord = otpModule._mockOtpRecords.find(
            (r) => r.userId === userId && r.otp === otp && r.status === 'Expired'
          );
          if (expiredRecord) {
            return res.status(400).json({
              success: false,
              message: 'OTP has expired.',
              verified: false,
            });
          }

          return res.status(400).json({
            success: false,
            message: 'Invalid OTP.',
            verified: false,
          });
        }

        if (new Date(record.expiresAt) < new Date()) {
          record.status = 'Expired';
          return res.status(400).json({
            success: false,
            message: 'OTP has expired.',
            verified: false,
          });
        }

        record.status = 'Used';
        const mockLocker = getMockLockerStatus();
        mockLocker.status = 'unlocked';
        mockLocker.lastAccessBy = userId;
        mockLocker.lastUpdated = new Date().toISOString();

        return res.json({
          success: true,
          message: 'OTP verified. Locker unlocked.',
          verified: true,
          data: {
            lockerStatus: 'unlocked',
          },
        });
      }

      return res.status(400).json({
        success: false,
        message: 'No active OTP found.',
        verified: false,
      });
    }

    // ── Production Mode ──
    const now = new Date();

    // Expire stale OTPs
    const expiredOtps = await db
      .collection('otpRecords')
      .where('userId', '==', userId)
      .where('status', '==', 'Active')
      .where('expiresAt', '<', now.toISOString())
      .get();

    const expireBatch = db.batch();
    expiredOtps.forEach((doc) => {
      expireBatch.update(doc.ref, { status: 'Expired' });
    });
    await expireBatch.commit();

    // Find matching active OTP
    const otpSnapshot = await db
      .collection('otpRecords')
      .where('userId', '==', userId)
      .where('otp', '==', otp)
      .where('status', '==', 'Active')
      .limit(1)
      .get();

    if (otpSnapshot.empty) {
      await db.collection('securityEvents').add({
        eventId: uuidv4(),
        userId,
        type: 'FAILED_ESP32_OTP',
        details: `Failed ESP32 OTP verification for user: ${userId}`,
        ipAddress: req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString(),
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP.',
        verified: false,
      });
    }

    const otpDoc = otpSnapshot.docs[0];
    const otpData = otpDoc.data();

    if (new Date(otpData.expiresAt) < now) {
      await otpDoc.ref.update({ status: 'Expired' });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired.',
        verified: false,
      });
    }

    // Mark as used and unlock
    await otpDoc.ref.update({ status: 'Used' });

    await db.collection('lockerStatus').doc('LOCKER-001').set(
      {
        lockerId: 'LOCKER-001',
        status: 'unlocked',
        lastAccessBy: userId,
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );

    await db.collection('accessLogs').add({
      logId: uuidv4(),
      userId,
      username: otpData.username || 'unknown',
      action: 'ESP32_OTP_VERIFIED',
      loginStatus: 'N/A',
      otpGenerated: true,
      otpVerified: true,
      lockerOpened: true,
      status: 'Success',
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: 'OTP verified. Locker unlocked.',
      verified: true,
      data: {
        lockerStatus: 'unlocked',
      },
    });
  } catch (error) {
    console.error('ESP32 OTP verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'OTP verification failed.',
      verified: false,
      error: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /update-locker-status - ESP32 locker status update
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/update-locker-status', verifyEsp32ApiKey, async (req, res) => {
  try {
    const { status, userId } = req.body;

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
      mockLocker.lastAccessBy = userId || 'ESP32';
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
      lastAccessBy: userId || 'ESP32',
      lastUpdated: new Date().toISOString(),
    };

    await db
      .collection('lockerStatus')
      .doc('LOCKER-001')
      .set(updateData, { merge: true });

    await db.collection('accessLogs').add({
      logId: uuidv4(),
      userId: userId || 'ESP32',
      username: 'ESP32',
      action: `ESP32_LOCKER_${status.toUpperCase()}`,
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
    console.error('ESP32 update locker status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update locker status.',
      error: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /locker-status - ESP32 get locker status
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/locker-status', verifyEsp32ApiKey, async (req, res) => {
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
      const defaultStatus = {
        lockerId: 'LOCKER-001',
        status: 'locked',
        lastAccessBy: null,
        lastUpdated: new Date().toISOString(),
      };
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
    console.error('ESP32 get locker status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get locker status.',
      error: error.message,
    });
  }
});

module.exports = router;
