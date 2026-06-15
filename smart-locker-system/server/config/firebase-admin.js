const admin = require('firebase-admin');

let db = null;
let auth = null;
let firebaseInitialized = false;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase environment variables');
  }

  if (privateKey.includes('DEMO_KEY_REPLACE_ME')) {
    throw new Error('Firebase credentials are placeholder/demo values');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  db = admin.firestore();
  auth = admin.auth();
  firebaseInitialized = true;

  console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.warn('⚠️  Firebase Admin SDK initialization failed:', error.message);
  console.warn('⚠️  Running in DEMO MODE with mock data');
  firebaseInitialized = false;
}

module.exports = { db, auth, admin, firebaseInitialized };
