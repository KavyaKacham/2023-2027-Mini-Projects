// ============================================================
// useFirestore — Real-time Firestore hooks
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  doc,
  query,
  onSnapshot,
  where,
  orderBy,
  limit,
  startAfter,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';

// ── Constraint helpers ─────────────────────────────────────
// Translate a plain-object constraint list into Firestore query constraints.
function buildConstraints(constraints = []) {
  return constraints.map((c) => {
    switch (c.type) {
      case 'where':
        return where(c.field, c.operator, c.value);
      case 'orderBy':
        return orderBy(c.field, c.direction ?? 'asc');
      case 'limit':
        return limit(c.value);
      case 'startAfter':
        return startAfter(c.value);
      default:
        console.warn(`[useFirestore] Unknown constraint type: ${c.type}`);
        return null;
    }
  }).filter(Boolean);
}

// ============================================================
// useCollection — subscribe to a Firestore collection in real-time
// ============================================================
/**
 * @param {string}   collectionName  Firestore collection path
 * @param {Array}    constraints     Array of { type, field, operator, value, direction }
 * @returns {{ data: Array, loading: boolean, error: Error|null }}
 *
 * Example usage:
 * ```js
 * const { data: users, loading } = useCollection('users', [
 *   { type: 'where', field: 'isActive', operator: '==', value: true },
 *   { type: 'orderBy', field: 'createdAt', direction: 'desc' },
 *   { type: 'limit', value: 20 },
 * ]);
 * ```
 */
export function useCollection(collectionName, constraints = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Serialize constraints so useEffect can properly diff them
  const constraintsKey = JSON.stringify(constraints);
  const constraintsRef = useRef(constraints);
  constraintsRef.current = constraints;

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setData([]);
      setLoading(false);
      return;
    }

    if (!collectionName) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let q;
    try {
      const collRef = collection(db, collectionName);
      const builtConstraints = buildConstraints(constraintsRef.current);
      q = builtConstraints.length > 0
        ? query(collRef, ...builtConstraints)
        : collRef;
    } catch (err) {
      console.error('[useCollection] Error building query:', err);
      setError(err);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setData(docs);
        setLoading(false);
      },
      (err) => {
        console.error(`[useCollection] ${collectionName} error:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, constraintsKey]);

  return { data, loading, error };
}

// ============================================================
// useDocument — subscribe to a single Firestore document
// ============================================================
/**
 * @param {string} collectionName  Firestore collection path
 * @param {string} docId           Document ID to watch
 * @returns {{ data: object|null, loading: boolean, error: Error|null }}
 */
export function useDocument(collectionName, docId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setData(null);
      setLoading(false);
      return;
    }

    if (!collectionName || !docId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const docRef = doc(db, collectionName, docId);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setData({ id: docSnap.id, ...docSnap.data() });
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error(
          `[useDocument] ${collectionName}/${docId} error:`,
          err
        );
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, docId]);

  return { data, loading, error };
}

// ============================================================
// useFirestore — combined export for convenience
// ============================================================
/**
 * Returns both hooks for easy destructuring:
 * ```js
 * const { useCollection, useDocument } = useFirestore();
 * ```
 */
export function useFirestore() {
  return { useCollection, useDocument };
}

export default useFirestore;
