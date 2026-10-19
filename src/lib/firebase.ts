import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
export type { FirebaseUser };
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { DiaryEntry, AwardData } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 1. Initialize Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL: Always pass the specific database ID as requested
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// 2. Validate Connection to Firestore on startup
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration: client is offline.');
    }
  }
}
testConnection();

// 3. Auth helper methods
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Sync user profile to Firestore
    if (result.user) {
      const userRef = doc(db, 'users', result.user.uid);
      await setDoc(userRef, {
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || '연구원',
        photoURL: result.user.photoURL || '',
        createdAt: new Date().toISOString()
      }, { merge: true });
    }
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function logoutUser() {
  return fbSignOut(auth);
}

// 4. Firestore Data Persistence for Diaries
export async function saveDiaryToFirestore(userId: string, entry: DiaryEntry) {
  const docPath = `users/${userId}/diaries/${entry.id}`;
  try {
    const diaryDoc = doc(db, 'users', userId, 'diaries', entry.id);
    await setDoc(diaryDoc, {
      ...entry,
      userId
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteDiaryFromFirestore(userId: string, entryId: string) {
  const docPath = `users/${userId}/diaries/${entryId}`;
  try {
    const diaryDoc = doc(db, 'users', userId, 'diaries', entryId);
    await deleteDoc(diaryDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function loadUserDiaries(userId: string): Promise<DiaryEntry[]> {
  const colPath = `users/${userId}/diaries`;
  try {
    const q = query(collection(db, 'users', userId, 'diaries'), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    const list: DiaryEntry[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as DiaryEntry);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colPath);
    return [];
  }
}

// 5. Firestore Persistence for Award Certificates
export interface StoredAward extends AwardData {
  id: string;
  userId: string;
  createdAt: number;
}

export async function saveAwardToFirestore(userId: string, award: AwardData) {
  const id = `award-${Date.now()}`;
  const docPath = `users/${userId}/awards/${id}`;
  try {
    const awardDoc = doc(db, 'users', userId, 'awards', id);
    const payload: StoredAward = {
      ...award,
      id,
      userId,
      createdAt: Date.now()
    };
    await setDoc(awardDoc, payload);
    return payload;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}
