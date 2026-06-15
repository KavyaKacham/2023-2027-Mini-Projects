const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { db, auth, firebaseInitialized } = require('../config/firebase-admin');
const { verifyToken } = require('../middleware/auth');

// ─── Mock Data Store (Demo Mode) ────────────────────────────────────────────
const mockUsers = new Map();
let mockUserCounter = 1000;

// Seed demo users
const seedDemoUsers = () => {
  if (mockUsers.size > 0) return;
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
  demoUsers.forEach((u) => mockUsers.set(u.userId, u));
  mockUserCounter = 1004;
};

seedDemoUsers();

// ─── Helper: Generate next userId ───────────────────────────────────────────
const getNextUserId = async () => {
  if (!firebaseInitialized) {
    mockUserCounter++;
    return `U${mockUserCounter}`;
  }

  const counterRef = db.collection('counters').doc('userCounter');
  const counterDoc = await counterRef.get();

  if (!counterDoc.exists) {
    await counterRef.set({ value: 1001 });
    return 'U1001';
  }

  const newValue = counterDoc.data().value + 1;
  await counterRef.update({ value: newValue });
  return `U${newValue}`;
};

// ─── Helper: sanitize user for response ─────────────────────────────────────
const sanitizeUser = (user) => {
  const { passwordHash, ...safe } = user;
  return safe;
};

// ─── Helper: generate JWT ───────────────────────────────────────────────────
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.userId,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// POST /register
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/register', async (req, res) => {
  try {
    const { fullName, username, email, mobileNumber, password, role } = req.body;

    // Validate required fields
    if (!fullName || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, username, email, and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // ── Demo Mode ──
    if (!firebaseInitialized) {
      // Check duplicate username/email
      for (const [, user] of mockUsers) {
        if (user.username === username) {
          return res.status(409).json({
            success: false,
            message: 'Username already exists.',
          });
        }
        if (user.email === email) {
          return res.status(409).json({
            success: false,
            message: 'Email already registered.',
          });
        }
      }

      const userId = await getNextUserId();
      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = {
        userId,
        fullName,
        username,
        email,
        mobileNumber: mobileNumber || '',
        passwordHash,
        role: role || 'user',
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: null,
      };

      mockUsers.set(userId, newUser);

      const token = generateToken(newUser);

      return res.status(201).json({
        success: true,
        message: 'User registered successfully.',
        data: {
          user: sanitizeUser(newUser),
          token,
        },
      });
    }

    // ── Production Mode ──
    // Check if username exists in Firestore
    const usernameSnapshot = await db
      .collection('users')
      .where('username', '==', username)
      .get();

    if (!usernameSnapshot.empty) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists.',
      });
    }

    // Check if email exists
    const emailSnapshot = await db
      .collection('users')
      .where('email', '==', email)
      .get();

    if (!emailSnapshot.empty) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered.',
      });
    }

    const userId = await getNextUserId();
    const passwordHash = await bcrypt.hash(password, 10);

    // Create Firebase Auth user
    let firebaseUser = null;
    try {
      firebaseUser = await auth.createUser({
        uid: userId,
        email,
        displayName: fullName,
        password,
      });
    } catch (authError) {
      console.error('Firebase Auth user creation failed:', authError.message);
    }

    const userData = {
      userId,
      fullName,
      username,
      email,
      mobileNumber: mobileNumber || '',
      passwordHash,
      role: role || 'user',
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: null,
    };

    await db.collection('users').doc(userId).set(userData);

    const token = generateToken(userData);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        user: sanitizeUser(userData),
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /login
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.',
      });
    }

    // ── Demo Mode ──
    if (!firebaseInitialized) {
      let foundUser = null;
      for (const [, user] of mockUsers) {
        if (user.username === username) {
          foundUser = user;
          break;
        }
      }

      if (!foundUser) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password.',
        });
      }

      if (!foundUser.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is disabled. Contact administrator.',
        });
      }

      const isMatch = await bcrypt.compare(password, foundUser.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password.',
        });
      }

      foundUser.lastLogin = new Date().toISOString();
      const token = generateToken(foundUser);

      return res.json({
        success: true,
        message: 'Login successful.',
        data: {
          user: sanitizeUser(foundUser),
          token,
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
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    if (!userData.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is disabled. Contact administrator.',
      });
    }

    const isMatch = await bcrypt.compare(password, userData.passwordHash);
    if (!isMatch) {
      // Log failed attempt
      await db.collection('securityEvents').add({
        eventId: uuidv4(),
        userId: userData.userId,
        type: 'FAILED_LOGIN',
        details: `Failed login attempt for user: ${username}`,
        ipAddress: req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString(),
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    // Update last login
    await db.collection('users').doc(userData.userId).update({
      lastLogin: new Date().toISOString(),
    });
    userData.lastLogin = new Date().toISOString();

    // Create access log
    await db.collection('accessLogs').add({
      logId: uuidv4(),
      userId: userData.userId,
      username: userData.username,
      action: 'LOGIN',
      loginStatus: 'Success',
      otpGenerated: false,
      otpVerified: false,
      lockerOpened: false,
      status: 'Success',
      timestamp: new Date().toISOString(),
    });

    const token = generateToken(userData);

    return res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: sanitizeUser(userData),
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
      error: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /forgot-password
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    if (!firebaseInitialized) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Generate password reset link via Firebase Auth
    try {
      await auth.generatePasswordResetLink(email);
    } catch {
      // Don't reveal whether the email exists
    }

    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process request.',
      error: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /profile/:userId
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/profile/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!firebaseInitialized) {
      const user = mockUsers.get(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        });
      }
      return res.json({
        success: true,
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

    return res.json({
      success: true,
      data: sanitizeUser(userDoc.data()),
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user profile.',
      error: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PUT /profile/:userId
// ═══════════════════════════════════════════════════════════════════════════════
router.put('/profile/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, email, mobileNumber } = req.body;

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (mobileNumber !== undefined) updateData.mobileNumber = mobileNumber;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update.',
      });
    }

    if (!firebaseInitialized) {
      const user = mockUsers.get(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        });
      }
      Object.assign(user, updateData);
      return res.json({
        success: true,
        message: 'Profile updated successfully.',
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

    await db.collection('users').doc(userId).update(updateData);
    const updatedDoc = await db.collection('users').doc(userId).get();

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: sanitizeUser(updatedDoc.data()),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
      error: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PUT /profile/:userId/password
// ═══════════════════════════════════════════════════════════════════════════════
router.put('/profile/:userId/password', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    if (!firebaseInitialized) {
      const user = mockUsers.get(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect.',
        });
      }

      user.passwordHash = await bcrypt.hash(newPassword, 10);
      return res.json({
        success: true,
        message: 'Password changed successfully.',
      });
    }

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const userData = userDoc.data();
    const isMatch = await bcrypt.compare(currentPassword, userData.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.collection('users').doc(userId).update({ passwordHash: newHash });

    // Update Firebase Auth password
    try {
      await auth.updateUser(userId, { password: newPassword });
    } catch {
      // Firebase Auth user may not exist
    }

    return res.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to change password.',
      error: error.message,
    });
  }
});

module.exports = router;
