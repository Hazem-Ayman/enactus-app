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
import { Member, PointEvent, Committee, Feedback, SessionFeedback, AvatarConfig, Session, AttendanceRecord } from '@/types';

// Helper to generate readable short ID like EN-7492
export function generateMemberId(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `EN-${randomNum}`;
}

// Check if Firebase is properly configured
export const isFirebaseConfigured = () => {
  return !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && 
         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== 'your_project_id';
};

// --- Members API ---

export async function createMember(data: {
  name: string;
  email: string;
  avatar: AvatarConfig;
}): Promise<Member> {
  const shortId = generateMemberId();

  const memberData: Omit<Member, 'id'> = {
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    committee: 'Presentations',
    avatar: data.avatar,
    streak: 0,
    totalPoints: 0,
    createdAt: Date.now(),
  };

  // Use the short ID as the Firestore document ID so it never changes
  const docRef = doc(db, 'members', shortId);
  await updateDoc(docRef, memberData as any).catch(async () => {
    // If not existing, set it
    const { setDoc } = await import('firebase/firestore');
    await setDoc(docRef, memberData);
  });

  return { id: shortId, ...memberData };
}

export async function updateMemberAvatar(memberId: string, avatar: AvatarConfig): Promise<void> {
  const memberRef = doc(db, 'members', memberId);
  await updateDoc(memberRef, { avatar });
}

export async function findMemberByEmailAndId(email: string, id: string): Promise<Member | null> {
  const cleanId = id.trim().toUpperCase();
  const cleanEmail = email.trim().toLowerCase();

  const docRef = doc(db, 'members', cleanId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;
  const data = snapshot.data() as Omit<Member, 'id'>;

  if (data.email.toLowerCase() === cleanEmail) {
    return { id: snapshot.id, ...data };
  }
  return null;
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

// --- Priority 2: Sessions & Attendance API ---

export async function createSession(title: string, date: string, theme?: string): Promise<Session> {
  const sessionData = {
    title: title.trim(),
    date,
    theme: theme?.trim() || '',
    createdAt: Date.now(),
  };
  const docRef = await addDoc(collection(db, 'sessions'), sessionData);
  return { id: docRef.id, ...sessionData };
}

export async function getAllSessions(): Promise<Session[]> {
  const q = query(collection(db, 'sessions'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
}

export async function markAttendance(
  sessionId: string,
  records: { memberId: string; memberName: string; status: 'present' | 'late' | 'absent' | 'excused' }[]
): Promise<void> {
  for (const record of records) {
    // 1. Record attendance
    await addDoc(collection(db, 'attendance'), {
      sessionId,
      memberId: record.memberId,
      memberName: record.memberName,
      status: record.status,
      createdAt: Date.now(),
    });

    const memberRef = doc(db, 'members', record.memberId);
    const memberSnap = await getDoc(memberRef);
    if (!memberSnap.exists()) continue;
    const currentStreak = memberSnap.data().streak || 0;

    if (record.status === 'present') {
      const newStreak = currentStreak + 1;
      // Bonus formula: Base 10 points for attending + (streak * 5) bonus for EVERY streak session!
      // Streak 1: 10 + 5 = 15 pts
      // Streak 2: 10 + 10 = 20 pts
      // Streak 3: 10 + 15 = 25 pts
      // Streak 4: 10 + 20 = 30 pts, etc.
      const streakBonus = newStreak * 5;
      const totalSessionPoints = 10 + streakBonus;

      await updateDoc(memberRef, {
        streak: newStreak,
        totalPoints: increment(totalSessionPoints),
      });

      await addDoc(collection(db, 'point_events'), {
        memberId: record.memberId,
        memberName: record.memberName,
        amount: totalSessionPoints,
        reason: `Session Present (+10 pts) + Streak #${newStreak} Bonus (+${streakBonus} pts) 🔥`,
        createdAt: Date.now(),
      });
    } else if (record.status === 'late') {
      // Late: ONLY 5 base points. NO streak bonus, and streak does not advance.
      await updateDoc(memberRef, {
        totalPoints: increment(5),
      });

      await addDoc(collection(db, 'point_events'), {
        memberId: record.memberId,
        memberName: record.memberName,
        amount: 5,
        reason: 'Session Attendance (Late arrival: +5 pts, no streak bonus)',
        createdAt: Date.now(),
      });
    } else if (record.status === 'absent') {
      // Streak breaks unless excused
      await updateDoc(memberRef, {
        streak: 0,
      });
    }
  }
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

