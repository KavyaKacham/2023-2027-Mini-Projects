const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db, firebaseInitialized } = require('../config/firebase-admin');
const { verifyToken } = require('../middleware/auth');

// ─── Mock Security Events (Demo Mode) ──────────────────────────────────────
const mockSecurityEvents = [];

const seedDemoSecurityEvents = () => {
  if (mockSecurityEvents.length > 0) return;
  const now = Date.now();
  const events = [
    {
      eventId: uuidv4(),
      userId: 'unknown',
      type: 'FAILED_LOGIN',
      details: 'Failed login attempt with username: hacker123',
      ipAddress: '192.168.1.105',
      timestamp: new Date(now - 1800000).toISOString(),
    },
    {
      eventId: uuidv4(),
      userId: 'U1002',
      type: 'FAILED_OTP',
      details: 'Failed OTP verification for user johndoe - expired OTP',
      ipAddress: '192.168.1.50',
      timestamp: new Date(now - 3600000).toISOString(),
    },
    {
      eventId: uuidv4(),
      userId: 'unknown',
      type: 'FAILED_LOGIN',
      details: 'Failed login attempt with username: testuser',
      ipAddress: '10.0.0.15',
      timestamp: new Date(now - 7200000).toISOString(),
    },
    {
      eventId: uuidv4(),
      userId: 'U1003',
      type: 'FAILED_OTP',
      details: 'Failed OTP verification for user janesmith - wrong OTP',
      ipAddress: '192.168.1.51',
      timestamp: new Date(now - 14400000).toISOString(),
    },
    {
      eventId: uuidv4(),
      userId: 'unknown',
      type: 'UNAUTHORIZED_ACCESS',
      details: 'Unauthorized API access attempt to /api/admin/users',
      ipAddress: '203.0.113.42',
      timestamp: new Date(now - 21600000).toISOString(),
    },
    {
      eventId: uuidv4(),
      userId: 'unknown',
      type: 'FAILED_LOGIN',
      details: 'Multiple failed login attempts from same IP',
      ipAddress: '198.51.100.23',
      timestamp: new Date(now - 43200000).toISOString(),
    },
    {
      eventId: uuidv4(),
      userId: 'U1004',
      type: 'ACCOUNT_DISABLED',
      details: 'Account bobwilson was disabled by admin',
      ipAddress: '192.168.1.1',
      timestamp: new Date(now - 86400000).toISOString(),
    },
    {
      eventId: uuidv4(),
      userId: 'unknown',
      type: 'FAILED_ESP32_LOGIN',
      details: 'Failed ESP32 credential verification for unknown user',
      ipAddress: '192.168.1.200',
      timestamp: new Date(now - 172800000).toISOString(),
    },
    {
      eventId: uuidv4(),
      userId: 'U1002',
      type: 'FAILED_ESP32_OTP',
      details: 'Failed ESP32 OTP verification - wrong code entered',
      ipAddress: '192.168.1.200',
      timestamp: new Date(now - 259200000).toISOString(),
    },
    {
      eventId: uuidv4(),
      userId: 'unknown',
      type: 'FAILED_LOGIN',
      details: 'Brute force attempt detected from IP 45.33.32.156',
      ipAddress: '45.33.32.156',
      timestamp: new Date(now - 345600000).toISOString(),
    },
  ];
  mockSecurityEvents.push(...events);
};

seedDemoSecurityEvents();

// ═══════════════════════════════════════════════════════════════════════════════
// GET /events - Get security events with filters
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/events', verifyToken, async (req, res) => {
  try {
    const {
      type,
      userId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (!firebaseInitialized) {
      let filtered = [...mockSecurityEvents];

      if (type) {
        filtered = filtered.filter((e) => e.type === type);
      }
      if (userId) {
        filtered = filtered.filter((e) => e.userId === userId);
      }
      if (dateFrom) {
        const from = new Date(dateFrom);
        filtered = filtered.filter((e) => new Date(e.timestamp) >= from);
      }
      if (dateTo) {
        const to = new Date(dateTo);
        filtered = filtered.filter((e) => new Date(e.timestamp) <= to);
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
    let query = db.collection('securityEvents').orderBy('timestamp', 'desc');

    if (type) {
      query = query.where('type', '==', type);
    }
    if (userId) {
      query = query.where('userId', '==', userId);
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
    console.error('Get security events error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get security events.',
      error: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /analytics - Security analytics data
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/analytics', verifyToken, async (req, res) => {
  try {
    const { period = 'weekly' } = req.query; // daily, weekly, monthly

    if (!firebaseInitialized) {
      const now = new Date();
      const analytics = {
        period,
        generatedAt: now.toISOString(),
        summary: {
          totalEvents: mockSecurityEvents.length,
          failedLogins: mockSecurityEvents.filter((e) => e.type === 'FAILED_LOGIN').length,
          failedOtps: mockSecurityEvents.filter((e) => e.type === 'FAILED_OTP').length,
          unauthorizedAccess: mockSecurityEvents.filter((e) => e.type === 'UNAUTHORIZED_ACCESS').length,
          esp32Failures: mockSecurityEvents.filter(
            (e) => e.type === 'FAILED_ESP32_LOGIN' || e.type === 'FAILED_ESP32_OTP'
          ).length,
        },
        dailyBreakdown: [],
        topIpAddresses: [],
        eventTypeDistribution: {},
      };

      // Generate daily breakdown for last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayEvents = mockSecurityEvents.filter((e) => {
          const t = new Date(e.timestamp);
          return t >= date && t < nextDate;
        });

        analytics.dailyBreakdown.push({
          date: date.toISOString().split('T')[0],
          totalEvents: dayEvents.length,
          failedLogins: dayEvents.filter((e) => e.type === 'FAILED_LOGIN').length,
          failedOtps: dayEvents.filter((e) => e.type === 'FAILED_OTP').length,
          unauthorizedAccess: dayEvents.filter((e) => e.type === 'UNAUTHORIZED_ACCESS').length,
        });
      }

      // Top IP addresses
      const ipCounts = {};
      mockSecurityEvents.forEach((e) => {
        ipCounts[e.ipAddress] = (ipCounts[e.ipAddress] || 0) + 1;
      });
      analytics.topIpAddresses = Object.entries(ipCounts)
        .map(([ip, count]) => ({ ipAddress: ip, eventCount: count }))
        .sort((a, b) => b.eventCount - a.eventCount)
        .slice(0, 10);

      // Event type distribution
      mockSecurityEvents.forEach((e) => {
        analytics.eventTypeDistribution[e.type] =
          (analytics.eventTypeDistribution[e.type] || 0) + 1;
      });

      // Access success/failure ratio (from logs module)
      try {
        const logsModule = require('./logs');
        const mockLogs = logsModule._mockLogs || [];
        const successCount = mockLogs.filter((l) => l.status === 'Success').length;
        const failedCount = mockLogs.filter((l) => l.status === 'Failed').length;
        analytics.accessRatio = {
          successful: successCount,
          failed: failedCount,
          total: successCount + failedCount,
          successRate:
            successCount + failedCount > 0
              ? ((successCount / (successCount + failedCount)) * 100).toFixed(1)
              : '0.0',
        };
      } catch {
        analytics.accessRatio = {
          successful: 15,
          failed: 2,
          total: 17,
          successRate: '88.2',
        };
      }

      return res.json({
        success: true,
        data: analytics,
      });
    }

    // ── Production Mode ──
    const now = new Date();
    let daysBack = 7;
    if (period === 'daily') daysBack = 1;
    if (period === 'monthly') daysBack = 30;

    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysBack);
    startDate.setHours(0, 0, 0, 0);

    const eventsSnapshot = await db
      .collection('securityEvents')
      .where('timestamp', '>=', startDate.toISOString())
      .orderBy('timestamp', 'desc')
      .get();

    const events = eventsSnapshot.docs.map((doc) => doc.data());

    const analytics = {
      period,
      generatedAt: now.toISOString(),
      summary: {
        totalEvents: events.length,
        failedLogins: events.filter((e) => e.type === 'FAILED_LOGIN').length,
        failedOtps: events.filter((e) => e.type === 'FAILED_OTP').length,
        unauthorizedAccess: events.filter((e) => e.type === 'UNAUTHORIZED_ACCESS').length,
        esp32Failures: events.filter(
          (e) => e.type === 'FAILED_ESP32_LOGIN' || e.type === 'FAILED_ESP32_OTP'
        ).length,
      },
      dailyBreakdown: [],
      topIpAddresses: [],
      eventTypeDistribution: {},
    };

    // Daily breakdown
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayEvents = events.filter((e) => {
        const t = new Date(e.timestamp);
        return t >= date && t < nextDate;
      });

      analytics.dailyBreakdown.push({
        date: date.toISOString().split('T')[0],
        totalEvents: dayEvents.length,
        failedLogins: dayEvents.filter((e) => e.type === 'FAILED_LOGIN').length,
        failedOtps: dayEvents.filter((e) => e.type === 'FAILED_OTP').length,
        unauthorizedAccess: dayEvents.filter((e) => e.type === 'UNAUTHORIZED_ACCESS').length,
      });
    }

    // Top IPs
    const ipCounts = {};
    events.forEach((e) => {
      if (e.ipAddress) {
        ipCounts[e.ipAddress] = (ipCounts[e.ipAddress] || 0) + 1;
      }
    });
    analytics.topIpAddresses = Object.entries(ipCounts)
      .map(([ip, count]) => ({ ipAddress: ip, eventCount: count }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);

    // Event type distribution
    events.forEach((e) => {
      analytics.eventTypeDistribution[e.type] =
        (analytics.eventTypeDistribution[e.type] || 0) + 1;
    });

    // Access ratio from logs
    const logsSnapshot = await db
      .collection('accessLogs')
      .where('timestamp', '>=', startDate.toISOString())
      .get();
    const logs = logsSnapshot.docs.map((doc) => doc.data());
    const successCount = logs.filter((l) => l.status === 'Success').length;
    const failedCount = logs.filter((l) => l.status === 'Failed').length;
    analytics.accessRatio = {
      successful: successCount,
      failed: failedCount,
      total: successCount + failedCount,
      successRate:
        successCount + failedCount > 0
          ? ((successCount / (successCount + failedCount)) * 100).toFixed(1)
          : '0.0',
    };

    return res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Get security analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get security analytics.',
      error: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /events - Create security event
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/events', verifyToken, async (req, res) => {
  try {
    const { userId, type, details } = req.body;

    if (!type || !details) {
      return res.status(400).json({
        success: false,
        message: 'Event type and details are required.',
      });
    }

    const event = {
      eventId: uuidv4(),
      userId: userId || req.user.userId || 'unknown',
      type,
      details,
      ipAddress: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString(),
    };

    if (!firebaseInitialized) {
      mockSecurityEvents.unshift(event);
      return res.status(201).json({
        success: true,
        message: 'Security event created.',
        data: event,
      });
    }

    await db.collection('securityEvents').doc(event.eventId).set(event);

    return res.status(201).json({
      success: true,
      message: 'Security event created.',
      data: event,
    });
  } catch (error) {
    console.error('Create security event error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create security event.',
      error: error.message,
    });
  }
});

module.exports = router;
