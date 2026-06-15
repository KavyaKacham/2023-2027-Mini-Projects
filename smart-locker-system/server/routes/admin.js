const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db, auth, firebaseInitialized } = require('../config/firebase-admin');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// ─── Access mock data from other modules ─────────────────────────────────────
const getAuthMockUsers = () => {
  try {
    const authModule = require('./auth');
    // Auth module exports router; mock users are module-level in auth.js
    // We access them via a shared reference trick - re-require reads same cache
    return null; // We'll use our own copy approach below
  } catch {
    return null;
  }
};

// We keep a reference to auth module's mock data via a shared approach
// Since Node.js caches modules, we can read from the same file
let _mockUsersRef = null;
const getMockUsers = () => {
  if (_mockUsersRef) return _mockUsersRef;
  // Build from same seed data as auth.js
  const bcrypt = require('bcryptjs');
  _mockUsersRef = new Map();
  const demoUsers = [
    {
      userId: 'U1001',
      fullName: 'Admin User',
      username: 'admin',
      email: 'admin@smartlocker.com',
      mobileNumber: '+1234567890',
      passwordHash: bcrypt.hashSync('admin123', 10),
      role: 'admin',
      isActive: true,
      createdAt: new Date('2024-01-15').toISOString(),
      lastLogin: new Date().toISOString(),
    },
    {
      userId: 'U1002',
      fullName: 'John Doe',
      username: 'johndoe',
      email: 'john@smartlocker.com',
      mobileNumber: '+1234567891',
      passwordHash: bcrypt.hashSync('john123', 10),
      role: 'user',
      isActive: true,
      createdAt: new Date('2024-02-20').toISOString(),
      lastLogin: new Date().toISOString(),
    },
    {
      userId: 'U1003',
      fullName: 'Jane Smith',
      username: 'janesmith',
      email: 'jane@smartlocker.com',
      mobileNumber: '+1234567892',
      passwordHash: bcrypt.hashSync('jane123', 10),
      role: 'user',
      isActive: true,
      createdAt: new Date('2024-03-10').toISOString(),
      lastLogin: new Date().toISOString(),
    },
    {
      userId: 'U1004',
      fullName: 'Bob Wilson',
      username: 'bobwilson',
      email: 'bob@smartlocker.com',
      mobileNumber: '+1234567893',
      passwordHash: bcrypt.hashSync('bob123', 10),
      role: 'user',
      isActive: false,
      createdAt: new Date('2024-04-05').toISOString(),
      lastLogin: new Date('2024-05-01').toISOString(),
    },
  ];
  demoUsers.forEach((u) => _mockUsersRef.set(u.userId, u));
  return _mockUsersRef;
};

const sanitizeUser = (user) => {
  const { passwordHash, ...safe } = user;
  return safe;
};

// ═══════════════════════════════════════════════════════════════════════════════
// GET /users - Get all users (admin only)
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { search, role, isActive } = req.query;

    if (!firebaseInitialized) {
      const mockUsers = getMockUsers();
      let users = Array.from(mockUsers.values()).map(sanitizeUser);

      if (search) {
        const searchLower = search.toLowerCase();
        users = users.filter(
          (u) =>
            u.fullName.toLowerCase().includes(searchLower) ||
            u.username.toLowerCase().includes(searchLower) ||
            u.email.toLowerCase().includes(searchLower) ||
            u.userId.toLowerCase().includes(searchLower)
        );
      }

      if (role) {
        users = users.filter((u) => u.role === role);
      }

      if (isActive !== undefined) {
        const activeFilter = isActive === 'true';
        users = users.filter((u) => u.isActive === activeFilter);
      }

      return res.json({
        success: true,
        data: users,
        total: users.length,
      });
    }

    let query = db.collection('users');

    if (role) {
      query = query.where('role', '==', role);
    }

    const snapshot = await query.get();
    let users = snapshot.docs.map((doc) => sanitizeUser(doc.data()));

    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(
        (u) =>
          u.fullName.toLowerCase().includes(searchLower) ||
          u.username.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower) ||
          u.userId.toLowerCase().includes(searchLower)
      );
    }

    if (isActive !== undefined) {
      const activeFilter = isActive === 'true';
      users = users.filter((u) => u.isActive === activeFilter);
    }

    return res.json({
      success: true,
      data: users,
      total: users.length,
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get users.',
      error: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE /users/:userId - Delete user (admin only)
// ═══════════════════════════════════════════════════════════════════════════════
router.delete('/users/:userId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own admin account.',
      });
    }

    if (!firebaseInitialized) {
      const mockUsers = getMockUsers();
      if (!mockUsers.has(userId)) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        });
      }
      mockUsers.delete(userId);
      return res.json({
        success: true,
        message: 'User deleted successfully.',
      });
    }

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Delete from Firebase Auth
    try {
      await auth.deleteUser(userId);
    } catch {
      // User may not exist in Firebase Auth
    }

    // Delete from Firestore
    await db.collection('users').doc(userId).delete();

    // Log the deletion
    await db.collection('securityEvents').add({
      eventId: uuidv4(),
      userId: req.user.userId,
      type: 'USER_DELETED',
      details: `Admin ${req.user.username} deleted user ${userId}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: 'User deleted successfully.',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user.',
      error: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PUT /users/:userId/status - Toggle user active status (admin only)
// ═══════════════════════════════════════════════════════════════════════════════
router.put('/users/:userId/status', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value.',
      });
    }

    if (userId === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own account status.',
      });
    }

    if (!firebaseInitialized) {
      const mockUsers = getMockUsers();
      const user = mockUsers.get(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        });
      }
      user.isActive = isActive;
      return res.json({
        success: true,
        message: `User ${isActive ? 'enabled' : 'disabled'} successfully.`,
        data: sanitizeUser(user),
      });
    }

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    await db.collection('users').doc(userId).update({ isActive });

    // Disable/enable in Firebase Auth
    try {
      await auth.updateUser(userId, { disabled: !isActive });
    } catch {
      // Firebase Auth user may not exist
    }

    const updatedDoc = await db.collection('users').doc(userId).get();

    return res.json({
      success: true,
      message: `User ${isActive ? 'enabled' : 'disabled'} successfully.`,
      data: sanitizeUser(updatedDoc.data()),
    });
  } catch (error) {
    console.error('Update user status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user status.',
      error: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /stats - Dashboard statistics (admin only)
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/stats', verifyToken, verifyAdmin, async (req, res) => {
  try {
    if (!firebaseInitialized) {
      const mockUsers = getMockUsers();
      const users = Array.from(mockUsers.values());
      const totalUsers = users.length;
      const activeUsers = users.filter((u) => u.isActive).length;

      // Get mock logs for today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let otpRequestsToday = 5;
      let successfulUnlocks = 3;
      let failedAttempts = 1;

      // Try to get real mock log data
      try {
        const logsModule = require('./logs');
        const mockLogs = logsModule._mockLogs || [];
        const todayLogs = mockLogs.filter(
          (l) => new Date(l.timestamp) >= today
        );
        otpRequestsToday = todayLogs.filter(
          (l) => l.action === 'OTP_GENERATED'
        ).length || otpRequestsToday;
        successfulUnlocks = todayLogs.filter(
          (l) => l.action === 'OTP_VERIFIED' && l.status === 'Success'
        ).length || successfulUnlocks;
        failedAttempts = todayLogs.filter(
          (l) => l.status === 'Failed'
        ).length || failedAttempts;
      } catch {
        // Use defaults
      }

      return res.json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          otpRequestsToday,
          successfulUnlocks,
          failedAttempts,
          lockerStatus: 'locked',
          recentActivity: {
            lastLogin: new Date().toISOString(),
            lastOtpGenerated: new Date(Date.now() - 3600000).toISOString(),
            lastLockerAccess: new Date(Date.now() - 1800000).toISOString(),
          },
        },
      });
    }

    // ── Production Mode ──
    // Total users
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map((doc) => doc.data());
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.isActive).length;

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const todayLogsSnapshot = await db
      .collection('accessLogs')
      .where('timestamp', '>=', todayISO)
      .get();

    const todayLogs = todayLogsSnapshot.docs.map((doc) => doc.data());
    const otpRequestsToday = todayLogs.filter(
      (l) => l.action === 'OTP_GENERATED'
    ).length;
    const successfulUnlocks = todayLogs.filter(
      (l) => l.action === 'OTP_VERIFIED' && l.status === 'Success'
    ).length;
    const failedAttempts = todayLogs.filter(
      (l) => l.status === 'Failed'
    ).length;

    // Get locker status
    const lockerDoc = await db
      .collection('lockerStatus')
      .doc('LOCKER-001')
      .get();
    const lockerStatus = lockerDoc.exists
      ? lockerDoc.data().status
      : 'locked';

    return res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        otpRequestsToday,
        successfulUnlocks,
        failedAttempts,
        lockerStatus,
        recentActivity: {
          lastLogin:
            todayLogs
              .filter((l) => l.action === 'LOGIN')
              .sort(
                (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
              )[0]?.timestamp || null,
          lastOtpGenerated:
            todayLogs
              .filter((l) => l.action === 'OTP_GENERATED')
              .sort(
                (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
              )[0]?.timestamp || null,
          lastLockerAccess:
            todayLogs
              .filter((l) => l.lockerOpened)
              .sort(
                (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
              )[0]?.timestamp || null,
        },
      },
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics.',
      error: error.message,
    });
  }
});

module.exports = router;
