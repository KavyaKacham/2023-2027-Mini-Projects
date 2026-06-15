const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db, firebaseInitialized } = require('../config/firebase-admin');
const { verifyToken } = require('../middleware/auth');

// ─── Mock Data Store (Demo Mode) ────────────────────────────────────────────
const mockOtpRecords = [];
const mockLockerStatus = {
  lockerId: 'LOCKER-001',
  status: 'locked',
  lastAccessBy: null,
  lastUpdated: new Date().toISOString(),
};

// Seed some demo OTP history
const seedDemoOtpRecords = () => {
  if (mockOtpRecords.length > 0) return;
  const now = Date.now();
  const records = [
    {
      otpId: uuidv4(),
      userId: 'U1002',
      username: 'johndoe',
      otp: '4829',
      generatedAt: new Date(now - 3600000).toISOString(),
      expiresAt: new Date(now - 3540000).toISOString(),
      status: 'Used',
    },
    {
      otpId: uuidv4(),
      userId: 'U1002',
      username: 'johndoe',
      otp: '7156',
      generatedAt: new Date(now - 7200000).toISOString(),
      expiresAt: new Date(now - 7140000).toISOString(),
      status: 'Expired',
    },
    {
      otpId: uuidv4(),
      userId: 'U1003',
      username: 'janesmith',
      otp: '3041',
      generatedAt: new Date(now - 1800000).toISOString(),
      expiresAt: new Date(now - 1740000).toISOString(),
      status: 'Used',
    },
    {
      otpId: uuidv4(),
      userId: 'U1001',
      username: 'admin',
      otp: '9920',
      generatedAt: new Date(now - 86400000).toISOString(),
      expiresAt: new Date(now - 86340000).toISOString(),
      status: 'Expired',
    },
  ];
  mockOtpRecords.push(...records);
};

seedDemoOtpRecords();

// ─── Helper: Generate 4-digit OTP ───────────────────────────────────────────
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// ─── Helper: mark expired OTPs in mock store ────────────────────────────────
const expireMockOtps = () => {
  const now = new Date();
  mockOtpRecords.forEach((record) => {
    if (record.status === 'Active' && new Date(record.expiresAt) < now) {
      record.status = 'Expired';
    }
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// POST /generate
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/generate', verifyToken, async (req, res) => {
  try {
    const { userId, username } = req.body;
    const reqUserId = userId || req.user.userId;
    const reqUsername = username || req.user.username;

    if (!reqUserId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required.',
      });
    }

    const otp = generateOTP();
    const generatedAt = new Date();
    const expiresAt = new Date(generatedAt.getTime() + 60000); // 60 seconds

    const otpRecord = {
      otpId: uuidv4(),
      userId: reqUserId,
      username: reqUsername || 'unknown',
      otp,
      generatedAt: generatedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'Active',
    };

    if (!firebaseInitialized) {
      // Expire any currently active OTPs for this user
      expireMockOtps();
      mockOtpRecords.forEach((record) => {
        if (record.userId === reqUserId && record.status === 'Active') {
          record.status = 'Expired';
        }
      });

      mockOtpRecords.unshift(otpRecord);
      mockLockerStatus.status = 'otp_pending';
      mockLockerStatus.lastUpdated = new Date().toISOString();

      return res.status(201).json({
        success: true,
        message: 'OTP generated successfully.',
        data: {
          otpId: otpRecord.otpId,
          otp: otpRecord.otp,
          generatedAt: otpRecord.generatedAt,
          expiresAt: otpRecord.expiresAt,
          expiresInSeconds: 60,
        },
      });
    }

    // ── Production Mode ──
    // Expire any active OTPs for this user
    const activeOtps = await db
      .collection('otpRecords')
      .where('userId', '==', reqUserId)
      .where('status', '==', 'Active')
      .get();

    const batch = db.batch();
    activeOtps.forEach((doc) => {
      batch.update(doc.ref, { status: 'Expired' });
    });

    // Create new OTP record
    const otpRef = db.collection('otpRecords').doc(otpRecord.otpId);
    batch.set(otpRef, otpRecord);

    // Update locker status to otp_pending
    const lockerRef = db.collection('lockerStatus').doc('LOCKER-001');
    batch.set(
      lockerRef,
      {
        lockerId: 'LOCKER-001',
        status: 'otp_pending',
        lastAccessBy: reqUserId,
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );

    await batch.commit();

    // Create access log
    await db.collection('accessLogs').add({
      logId: uuidv4(),
      userId: reqUserId,
      username: reqUsername || 'unknown',
      action: 'OTP_GENERATED',
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
        generatedAt: otpRecord.generatedAt,
        expiresAt: otpRecord.expiresAt,
        expiresInSeconds: 60,
      },
    });
  } catch (error) {
    console.error('OTP generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate OTP.',
      error: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /verify
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/verify', verifyToken, async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const reqUserId = userId || req.user.userId;

    if (!reqUserId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'User ID and OTP are required.',
      });
    }

    if (!firebaseInitialized) {
      expireMockOtps();

      const record = mockOtpRecords.find(
        (r) => r.userId === reqUserId && r.otp === otp && r.status === 'Active'
      );

      if (!record) {
        // Check if OTP was correct but expired
        const expiredRecord = mockOtpRecords.find(
          (r) => r.userId === reqUserId && r.otp === otp && r.status === 'Expired'
        );

        if (expiredRecord) {
          return res.status(400).json({
            success: false,
            message: 'OTP has expired. Please generate a new one.',
          });
        }

        // Check if OTP was already used
        const usedRecord = mockOtpRecords.find(
          (r) => r.userId === reqUserId && r.otp === otp && r.status === 'Used'
        );

        if (usedRecord) {
          return res.status(400).json({
            success: false,
            message: 'OTP has already been used.',
          });
        }

        return res.status(400).json({
          success: false,
          message: 'Invalid OTP.',
        });
      }

      // Check expiry
      if (new Date(record.expiresAt) < new Date()) {
        record.status = 'Expired';
        return res.status(400).json({
          success: false,
          message: 'OTP has expired. Please generate a new one.',
        });
      }

      record.status = 'Used';
      mockLockerStatus.status = 'unlocked';
      mockLockerStatus.lastAccessBy = reqUserId;
      mockLockerStatus.lastUpdated = new Date().toISOString();

      return res.json({
        success: true,
        message: 'OTP verified successfully. Locker unlocked.',
        data: {
          verified: true,
          lockerStatus: 'unlocked',
        },
      });
    }

    // ── Production Mode ──
    // First expire any past-due OTPs
    const now = new Date();
    const expiredOtps = await db
      .collection('otpRecords')
      .where('userId', '==', reqUserId)
      .where('status', '==', 'Active')
      .where('expiresAt', '<', now.toISOString())
      .get();

    const expireBatch = db.batch();
    expiredOtps.forEach((doc) => {
      expireBatch.update(doc.ref, { status: 'Expired' });
    });
    await expireBatch.commit();

    // Find active OTP matching the provided code
    const otpSnapshot = await db
      .collection('otpRecords')
      .where('userId', '==', reqUserId)
      .where('otp', '==', otp)
      .orderBy('generatedAt', 'desc')
      .limit(1)
      .get();

    if (otpSnapshot.empty) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP.',
      });
    }

    const otpDoc = otpSnapshot.docs[0];
    const otpData = otpDoc.data();

    if (otpData.status === 'Used') {
      return res.status(400).json({
        success: false,
        message: 'OTP has already been used.',
      });
    }

    if (otpData.status === 'Expired' || new Date(otpData.expiresAt) < now) {
      await otpDoc.ref.update({ status: 'Expired' });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please generate a new one.',
      });
    }

    // Mark OTP as used
    await otpDoc.ref.update({ status: 'Used' });

    // Update locker status to unlocked
    await db.collection('lockerStatus').doc('LOCKER-001').set(
      {
        lockerId: 'LOCKER-001',
        status: 'unlocked',
        lastAccessBy: reqUserId,
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );

    // Create access log
    await db.collection('accessLogs').add({
      logId: uuidv4(),
      userId: reqUserId,
      username: otpData.username || 'unknown',
      action: 'OTP_VERIFIED',
      loginStatus: 'N/A',
      otpGenerated: true,
      otpVerified: true,
      lockerOpened: true,
      status: 'Success',
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: 'OTP verified successfully. Locker unlocked.',
      data: {
        verified: true,
        lockerStatus: 'unlocked',
      },
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify OTP.',
      error: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /history/:userId
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/history/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!firebaseInitialized) {
      expireMockOtps();
      const records = mockOtpRecords
        .filter((r) => r.userId === userId)
        .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));

      return res.json({
        success: true,
        data: records.map(({ otp, ...rest }) => ({
          ...rest,
          otp: `${otp.substring(0, 2)}**`, // Partially mask OTP in history
        })),
        total: records.length,
      });
    }

    const snapshot = await db
      .collection('otpRecords')
      .where('userId', '==', userId)
      .orderBy('generatedAt', 'desc')
      .limit(50)
      .get();

    // Auto-expire old OTPs
    const now = new Date();
    const batch = db.batch();
    let hasUpdates = false;

    const records = snapshot.docs.map((doc) => {
      const data = doc.data();
      if (data.status === 'Active' && new Date(data.expiresAt) < now) {
        batch.update(doc.ref, { status: 'Expired' });
        data.status = 'Expired';
        hasUpdates = true;
      }
      return {
        ...data,
        otp: `${data.otp.substring(0, 2)}**`,
      };
    });

    if (hasUpdates) {
      await batch.commit();
    }

    return res.json({
      success: true,
      data: records,
      total: records.length,
    });
  } catch (error) {
    console.error('OTP history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get OTP history.',
      error: error.message,
    });
  }
});

module.exports = router;
module.exports._mockLockerStatus = mockLockerStatus;
module.exports._mockOtpRecords = mockOtpRecords;
module.exports._expireMockOtps = expireMockOtps;
