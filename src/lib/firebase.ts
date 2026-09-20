import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import type { UserProfile, StoredSessionRecord, CaseVignette } from '../types';

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;

export function getFirebaseConfig() {
  return {
    projectId: "gen-lang-client-0394726610",
    appId: "1:681337330422:web:3ab91e060ae1b6411c2ad7",
    apiKey: "AIzaSyDBoz9OgpeEkxJwk3x5TLUZSgliYU7n30Y",
    authDomain: "gen-lang-client-0394726610.firebaseapp.com",
    firestoreDatabaseId: "ai-studio-counsellortraini-33b32e31-7396-4500-aa53-b295adb395e8",
    storageBucket: "gen-lang-client-0394726610.firebasestorage.app",
    messagingSenderId: "681337330422",
  };
}

export function initFirebase() {
  if (!firebaseApp) {
    const config = getFirebaseConfig();
    firebaseApp = getApps().length === 0 ? initializeApp(config) : getApp();
    try {
      firestoreDb = getFirestore(firebaseApp, config.firestoreDatabaseId);
    } catch (e) {
      firestoreDb = getFirestore(firebaseApp);
    }
  }
  return { app: firebaseApp, db: firestoreDb };
}

export function getDb(): Firestore {
  if (!firestoreDb) {
    initFirebase();
  }
  return firestoreDb!;
}

// ---------------------------------------------
// FIRESTORE SERVICES FOR USERS, SESSIONS & CASES
// ---------------------------------------------

/**
 * Save or update user profile in Firestore
 */
export async function saveUserToFirestore(user: UserProfile): Promise<void> {
  try {
    const db = getDb();
    const cleanEmail = user.email.toLowerCase().trim();
    const rawEmailKey = cleanEmail.replace(/[^a-z0-9]/g, '_');
    const userDocId = user.id || `user_${rawEmailKey}`;

    const payload = {
      id: userDocId,
      name: user.name,
      email: cleanEmail,
      password: user.password || '',
      institution: user.institution || '',
      level: user.level || 'Novice Counselor',
      registeredAt: user.registeredAt || new Date().toISOString(),
      isAdmin: Boolean(user.isAdmin),
      role: user.role || (user.isAdmin ? 'admin' : 'trainee'),
      isPremium: user.isPremium !== false,
      premiumGrantedAt: user.premiumGrantedAt || new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    };

    // Save under primary ID (e.g., user_email)
    await setDoc(doc(db, 'users', userDocId), payload, { merge: true });

    // Also alias under raw email key if different to guarantee zero-mismatch lookups
    if (userDocId !== rawEmailKey && rawEmailKey.length > 0) {
      await setDoc(doc(db, 'users', rawEmailKey), payload, { merge: true });
    }
  } catch (error) {
    console.error('Firestore saveUser error:', error);
  }
}

/**
 * Fetch user profile from Firestore by email or ID
 */
export async function getUserFromFirestore(emailOrId: string): Promise<UserProfile | null> {
  try {
    const db = getDb();
    const cleanInput = emailOrId.toLowerCase().trim();
    const rawKey = cleanInput.replace(/[^a-z0-9]/g, '_');
    const prefixedKey = `user_${rawKey}`;

    // 1. Try raw email document key (e.g. alex_smith_gmail_com)
    let snap = await getDoc(doc(db, 'users', rawKey));
    if (snap.exists() && snap.data()?.name && snap.data().name.trim().length > 0) {
      const data = snap.data() as UserProfile;
      return { ...data, isPremium: data.isPremium !== false };
    }

    // 2. Try prefixed document key (e.g. user_alex_smith_gmail_com)
    snap = await getDoc(doc(db, 'users', prefixedKey));
    if (snap.exists() && snap.data()?.name && snap.data().name.trim().length > 0) {
      const data = snap.data() as UserProfile;
      return { ...data, isPremium: data.isPremium !== false };
    }

    // 3. Try exact input key if passed as ID
    if (cleanInput !== rawKey && cleanInput !== prefixedKey) {
      snap = await getDoc(doc(db, 'users', cleanInput));
      if (snap.exists() && snap.data()?.name && snap.data().name.trim().length > 0) {
        const data = snap.data() as UserProfile;
        return { ...data, isPremium: data.isPremium !== false };
      }
    }

    // 4. Fallback: Query by email field
    if (cleanInput.includes('@')) {
      const usersCol = collection(db, 'users');
      const q = query(usersCol, where('email', '==', cleanInput), limit(1));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const data = querySnap.docs[0].data() as UserProfile;
        if (data?.name && data.name.trim().length > 0) {
          return { ...data, isPremium: data.isPremium !== false };
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Firestore getUser error:', error);
    return null;
  }
}

/**
 * Save counseling session record to Firestore
 */
export async function saveSessionToFirestore(record: StoredSessionRecord): Promise<void> {
  try {
    const db = getDb();
    const sessionRef = doc(db, 'sessions', record.id);
    await setDoc(
      sessionRef,
      {
        ...record,
        userEmail: record.user?.email ? record.user.email.toLowerCase().trim() : '',
        userId: record.user?.id || '',
        userName: record.user?.name || 'Anonymous Counselor',
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Firestore saveSession error:', error);
  }
}

/**
 * Fetch recent sessions for a specific user or all sessions (for admin)
 */
export async function fetchSessionsFromFirestore(userEmail?: string): Promise<StoredSessionRecord[]> {
  try {
    const db = getDb();
    const sessionsCol = collection(db, 'sessions');
    let q;
    if (userEmail) {
      q = query(sessionsCol, where('userEmail', '==', userEmail.toLowerCase().trim()), limit(100));
    } else {
      q = query(sessionsCol, limit(200));
    }
    const snap = await getDocs(q);
    const results: StoredSessionRecord[] = [];
    snap.forEach((d) => {
      results.push(d.data() as StoredSessionRecord);
    });
    // Sort descending by timestamp
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return results;
  } catch (error) {
    console.error('Firestore fetchSessions error:', error);
    return [];
  }
}

/**
 * Save custom clinical cases to Firestore
 */
export async function saveCaseToFirestore(vignette: CaseVignette): Promise<void> {
  try {
    const db = getDb();
    const caseRef = doc(db, 'cases', vignette.id);
    await setDoc(
      caseRef,
      {
        ...vignette,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Firestore saveCase error:', error);
  }
}

/**
 * Fetch all cases from Firestore
 */
export async function fetchCasesFromFirestore(): Promise<CaseVignette[]> {
  try {
    const db = getDb();
    const casesCol = collection(db, 'cases');
    const snap = await getDocs(casesCol);
    const results: CaseVignette[] = [];
    snap.forEach((d) => {
      results.push(d.data() as CaseVignette);
    });
    return results;
  } catch (error) {
    console.error('Firestore fetchCases error:', error);
    return [];
  }
}

/**
 * Delete a user and all their associated session documents from Firestore
 */
export async function deleteUserFromFirestore(emailOrId: string): Promise<boolean> {
  try {
    const db = getDb();
    const cleanId = emailOrId.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const cleanEmail = emailOrId.toLowerCase().trim();

    // 1. Delete user document
    const userRef = doc(db, 'users', cleanId);
    await setDoc(userRef, { deleted: true, deletedAt: serverTimestamp() }, { merge: true });

    // 2. Query and delete or mark deleted their sessions
    const sessionsCol = collection(db, 'sessions');
    const q = query(sessionsCol, where('userEmail', '==', cleanEmail), limit(100));
    const snap = await getDocs(q);
    const updates = snap.docs.map((docSnap) =>
      setDoc(docSnap.ref, { deleted: true, deletedAt: serverTimestamp() }, { merge: true })
    );
    await Promise.all(updates);
    return true;
  } catch (error) {
    console.error('Firestore deleteUser error:', error);
    return false;
  }
}

/**
 * Reset a user's password in Firestore
 */
export async function resetUserPasswordInFirestore(email: string, newPassword: string): Promise<boolean> {
  try {
    const db = getDb();
    const cleanId = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const userRef = doc(db, 'users', cleanId);
    await setDoc(
      userRef,
      {
        password: newPassword,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error('Firestore resetUserPassword error:', error);
    return false;
  }
}

/**
 * Update user's admin role in Firestore
 */
export async function updateUserAdminRoleInFirestore(email: string, isAdmin: boolean): Promise<boolean> {
  try {
    const db = getDb();
    const cleanId = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const userRef = doc(db, 'users', cleanId);
    await setDoc(
      userRef,
      {
        isAdmin,
        role: isAdmin ? 'admin' : 'trainee',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error('Firestore updateUserAdminRole error:', error);
    return false;
  }
}


