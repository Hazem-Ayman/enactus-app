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
import { Member, PointEvent, Committee, Feedback, SessionFeedback } from '@/types';

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

// --- Feedback API (Priority 1: 2 Stars and 1 Wish) ---

export async function submitFeedback(data: {
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  toMemberName: string;
  star1: string;
  star2: string;
  wish: string;
}): Promise<void> {
  // 1. Save feedback
  await addDoc(collection(db, 'feedback'), {
    fromMemberId: data.fromMemberId,
    fromMemberName: data.fromMemberName,
    toMemberId: data.toMemberId,
    toMemberName: data.toMemberName,
    star1: data.star1.trim(),
    star2: data.star2.trim(),
    wish: data.wish.trim(),
    flagged: false,
    createdAt: Date.now(),
  });

  // 2. Award reward points for giving constructive feedback (+5 pts)
  await addPointEvent(
    data.fromMemberId,
    data.fromMemberName,
    5,
    `Gave constructive feedback to ${data.toMemberName}`
  );
}

export async function getReceivedFeedback(memberId: string): Promise<Feedback[]> {
  const q = query(
    collection(db, 'feedback'),
    where('toMemberId', '==', memberId)
  );
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getAllFeedbackForAdmin(): Promise<Feedback[]> {
  const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
}

export async function flagFeedback(feedbackId: string, flagged: boolean = true): Promise<void> {
  const ref = doc(db, 'feedback', feedbackId);
  await updateDoc(ref, { flagged });
}

// --- Session & Coordinator Evaluation API ---

export async function submitSessionFeedback(data: {
  memberId?: string;
  memberName?: string;
  isAnonymous: boolean;
  sessionRating: number;
  coordinatorRating: number;
  keyTakeaway: string;
  improvementWish: string;
}): Promise<void> {
  // 1. Save Session Evaluation
  await addDoc(collection(db, 'session_feedback'), {
    memberId: data.isAnonymous ? null : data.memberId,
    memberName: data.isAnonymous ? 'Anonymous Member' : data.memberName,
    isAnonymous: data.isAnonymous,
    sessionRating: data.sessionRating,
    coordinatorRating: data.coordinatorRating,
    keyTakeaway: data.keyTakeaway.trim(),
    improvementWish: data.improvementWish.trim(),
    createdAt: Date.now(),
  });

  // 2. Award +5 points in both cases (whether anonymous or with name)
  if (data.memberId) {
    await addPointEvent(
      data.memberId,
      data.memberName || 'Member',
      5,
      'Submitted Session & Coordinator Feedback'
    );
  }
}

export async function getAllSessionFeedback(): Promise<SessionFeedback[]> {
  const q = query(collection(db, 'session_feedback'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SessionFeedback));
}

