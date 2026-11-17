import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  increment, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Member, PointEvent, Committee } from '@/types';

// Check if Firebase is properly configured
export const isFirebaseConfigured = () => {
  return !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && 
         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== 'your_project_id';
};

// --- Members API ---

export async function createMember(data: {
  name: string;
  committee: Committee;
  level: number;
  goal: string;
}): Promise<Member> {
  const memberData = {
    name: data.name.trim(),
    committee: data.committee,
    level: data.level,
    goal: data.goal.trim(),
    totalPoints: 0,
    createdAt: Date.now(),
  };

  const docRef = await addDoc(collection(db, 'members'), memberData);
  return { id: docRef.id, ...memberData };
}

export async function findMembersByName(name: string): Promise<Member[]> {
  const q = query(
    collection(db, 'members'),
    where('name', '==', name.trim())
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
}

export async function getAllMembers(): Promise<Member[]> {
  const q = query(collection(db, 'members'), orderBy('totalPoints', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
}

export async function getMemberById(id: string): Promise<Member | null> {
  const docRef = doc(db, 'members', id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Member;
}

// --- Points API ---

export async function addPointEvent(
  memberId: string, 
  memberName: string, 
  amount: number, 
  reason: string
): Promise<void> {
  // 1. Add Point Event entry
  await addDoc(collection(db, 'point_events'), {
    memberId,
    memberName,
    amount,
    reason: reason.trim(),
    createdAt: Date.now(),
  });

  // 2. Atomically update Member totalPoints
  const memberRef = doc(db, 'members', memberId);
  await updateDoc(memberRef, {
    totalPoints: increment(amount),
  });
}

export async function getPointEvents(): Promise<PointEvent[]> {
  const q = query(collection(db, 'point_events'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PointEvent));
}
