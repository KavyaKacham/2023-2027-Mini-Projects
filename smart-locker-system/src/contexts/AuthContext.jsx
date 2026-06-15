// ============================================================
// AuthContext — Firebase Authentication Provider
// ============================================================
import {
  createContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, set } from 'firebase/database';
import { auth, db, rtdb } from '../config/firebase';

export const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  resetPassword: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch extended profile from Firestore ──────────────────
  const fetchUserProfile = useCallback(async (firebaseUser) => {
    if (!firebaseUser) return null;
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc    = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          uid:          firebaseUser.uid,
          userId:       data.userId       ?? '',
          fullName:     data.fullName     ?? firebaseUser.displayName ?? '',
          username:     data.username     ?? '',
          email:        data.email        ?? firebaseUser.email ?? '',
          mobileNumber: data.mobileNumber ?? '',
          lockerPin:    data.lockerPin    ?? '',
          role:         data.role         ?? 'user',
          isActive:     data.isActive     !== undefined ? data.isActive : true,
          photoURL:     data.photoURL     ?? firebaseUser.photoURL ?? null,
          createdAt:    data.createdAt    ?? null,
        };
      }
      // Profile doc doesn't exist yet — return minimal info
      return {
        uid:          firebaseUser.uid,
        userId:       '',
        fullName:     firebaseUser.displayName ?? '',
        username:     '',
        email:        firebaseUser.email ?? '',
        mobileNumber: '',
        lockerPin:    '',
        role:         'user',
        isActive:     true,
        photoURL:     firebaseUser.photoURL ?? null,
        createdAt:    null,
      };
    } catch (error) {
      console.error('[Auth] Error fetching user profile:', error);
      return {
        uid:      firebaseUser.uid,
        email:    firebaseUser.email ?? '',
        role:     'user',
        isActive: true,
      };
    }
  }, []);

  // ── Auth state listener ────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await fetchUserProfile(firebaseUser);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchUserProfile]);

  // ── Register ───────────────────────────────────────────────
  const register = useCallback(
    async ({ email, password, fullName, username, mobileNumber, userId, lockerPin }) => {

      // 1. Create Firebase Auth account
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = credential.user.uid;

      // 2. Save full profile to Firestore (web app reads this)
      const profileData = {
        userId:       userId       || '',
        fullName:     fullName     || '',
        username:     username     || '',
        email,
        mobileNumber: mobileNumber || '',
        lockerPin:    lockerPin    || '',
        role:         'user',
        isActive:     true,
        createdAt:    serverTimestamp(),
      };
      await setDoc(doc(db, 'users', uid), profileData);

      // 3. Write ESP32-readable data to Realtime Database
      //    ESP32 reads /users/{uid}/pin to verify locker PIN
      //    ESP32 reads /userIdMap/{userId} to find uid from numeric ID
      await set(ref(rtdb, `users/${uid}`), {
        pin:      lockerPin  || '',
        fullName: fullName   || '',
        userId:   userId     || '',
        email,
      });

      // /userIdMap/1001 = "firebase_uid_abc123"
      // This lets ESP32 look up uid just by typing 1001 on keypad
      if (userId) {
        await set(ref(rtdb, `userIdMap/${userId}`), uid);
      }

      const profile = { uid, ...profileData, createdAt: new Date() };
      setUser(profile);
      return profile;
    },
    []
  );

  // ── Login ──────────────────────────────────────────────────
  const login = useCallback(
    async (email, password) => {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const profile    = await fetchUserProfile(credential.user);
      setUser(profile);
      return profile;
    },
    [fetchUserProfile]
  );

  // ── Logout ─────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, []);

  // ── Reset Password ─────────────────────────────────────────
  const resetPassword = useCallback(async (email) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  // ── Context value ──────────────────────────────────────────
  const value = useMemo(
    () => ({ user, loading, login, logout, register, resetPassword }),
    [user, loading, login, logout, register, resetPassword]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;