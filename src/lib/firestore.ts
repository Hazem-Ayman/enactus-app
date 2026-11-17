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
  deleteDoc,
  setDoc,
  onSnapshot,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Member, PointEvent, Committee, Feedback, SessionFeedback, AvatarConfig, Session, AttendanceRecord, SavedGroup, BuddyConnection } from '@/types';

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
  await setDoc(docRef, memberData, { merge: true });

  return { id: shortId, ...memberData };
}

// --- Member Management & Admin Controls ---

export async function updateMemberAvatar(memberId: string, avatar: AvatarConfig): Promise<void> {
  const memberRef = doc(db, 'members', memberId);
  await updateDoc(memberRef, { avatar });
}

export async function updateMemberProfile(
  memberId: string,
  data: { name: string; email: string; titleBadge?: string }
): Promise<void> {
  const memberRef = doc(db, 'members', memberId);
  await updateDoc(memberRef, {
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    titleBadge: data.titleBadge || '',
  });
}

export async function deleteMember(memberId: string, docId?: string): Promise<void> {
  // 1. Delete by docId if known
  if (docId) {
    try {
      await deleteDoc(doc(db, 'members', docId));
    } catch (e) {
      console.warn('Error deleting by docId:', e);
    }
  }

  // 2. Delete by memberId directly
  try {
    await deleteDoc(doc(db, 'members', memberId));
  } catch (e) {
    console.warn('Error deleting by memberId:', e);
  }

  // 3. Delete any document that holds this ID inside its data
  try {
    const q = query(collection(db, 'members'), where('id', '==', memberId));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (e) {
    console.warn('Error cleaning up query matches:', e);
  }
}

// --- Live Broadcast of Random Picker to All Members ---

export async function broadcastPickerState(data: {
  isSpinning: boolean;
  selectedMember: Member | null;
  timestamp: number;
}): Promise<void> {
  const docRef = doc(db, 'settings', 'live_picker');
  await setDoc(docRef, data);
}

export function subscribeToLivePicker(callback: (data: { isSpinning: boolean; selectedMember: Member | null; timestamp: number } | null) => void) {
  const docRef = doc(db, 'settings', 'live_picker');
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as any);
    } else {
      callback(null);
    }
  });
}

// --- Live Broadcast of Shuffled Groups to All Members ---

export interface LiveGroupsState {
  isShuffling: boolean;
  groups: {
    teamNumber: number;
    members: { id: string; name: string }[];
  }[];
  timestamp: number;
}

export async function broadcastGroupsState(data: LiveGroupsState): Promise<void> {
  const docRef = doc(db, 'settings', 'live_groups');
  await setDoc(docRef, data);
}

export function subscribeToLiveGroups(callback: (data: LiveGroupsState | null) => void) {
  const docRef = doc(db, 'settings', 'live_groups');
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as LiveGroupsState);
    } else {
      callback(null);
    }
  });
}

// --- Real-time Game Center Broadcast & Audience Voting ---

export interface LiveGameState {
  activeGame: 'hub' | 'impromptu' | 'hottake' | 'pitch' | 'emotion' | 'bomb' | 'debate';
  selectedSpeaker: Member | null;
  selectedSpeakerB?: Member | null;
  prompt?: string;
  product?: { name: string; pitch: string } | null;
  bomb?: { topic: string; banned: string[] } | null;
  debate?: { topic: string; sideA: string; sideB: string } | null;
  duration: number;
  timeLeft: number;
  isRunning: boolean;
  isFinished: boolean;
  bombExploded: boolean;
  debateTurn?: 'A' | 'B';
  votes?: { [memberId: string]: string }; // Member votes e.g. "A" | "B" or star ratings
  reactions?: { [type: string]: number }; // Reaction tally
  updatedAt: number;
}

export async function broadcastGameState(data: LiveGameState): Promise<void> {
  const docRef = doc(db, 'settings', 'live_game');
  await setDoc(docRef, data);
}

export function subscribeToLiveGame(callback: (data: LiveGameState | null) => void) {
  const docRef = doc(db, 'settings', 'live_game');
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as LiveGameState);
    } else {
      callback(null);
    }
  });
}

export async function castGameVote(memberId: string, vote: string): Promise<void> {
  const docRef = doc(db, 'settings', 'live_game');
  await updateDoc(docRef, {
    [`votes.${memberId}`]: vote,
    updatedAt: Date.now(),
  }).catch(async () => {
    await setDoc(docRef, { votes: { [memberId]: vote }, updatedAt: Date.now() }, { merge: true });
  });
}

export async function sendGameReaction(reaction: string): Promise<void> {
  const docRef = doc(db, 'settings', 'live_game');
  await updateDoc(docRef, {
    [`reactions.${reaction}`]: increment(1),
    updatedAt: Date.now(),
  }).catch(async () => {
    await setDoc(docRef, { reactions: { [reaction]: 1 }, updatedAt: Date.now() }, { merge: true });
  });
}

// --- Feature Toggles (Disable/Enable Sections) ---

export interface SectionToggles {
  feedbackEnabled: boolean;
  gameCenterEnabled: boolean;
}

export async function getSectionToggles(): Promise<SectionToggles> {
  const docRef = doc(db, 'settings', 'toggles');
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    return { feedbackEnabled: true, gameCenterEnabled: false };
  }
  return snap.data() as SectionToggles;
}

export async function updateSectionToggles(toggles: Partial<SectionToggles>): Promise<void> {
  const docRef = doc(db, 'settings', 'toggles');
  await setDoc(docRef, toggles, { merge: true });
}

export function subscribeToSectionToggles(callback: (toggles: SectionToggles) => void) {
  const docRef = doc(db, 'settings', 'toggles');
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as SectionToggles);
    } else {
      callback({ feedbackEnabled: true, gameCenterEnabled: false });
    }
  });
}

export async function awardTitleBadge(memberId: string, titleBadge: string): Promise<void> {
  const memberRef = doc(db, 'members', memberId);
  await updateDoc(memberRef, {
    titleBadge: titleBadge.trim(),
  });
}

export async function findMemberByEmailAndId(
  email: string,
  id: string,
  password?: string
): Promise<Member | null> {
  const cleanId = id.trim().toUpperCase();
  const cleanEmail = email.trim().toLowerCase();

  // Special Coordinator Admin check
  if (cleanId === 'ENC-2302') {
    if (password !== '23022006Ha#') {
      return null;
    }

    // Check if admin document already exists in Firestore
    const docRef = doc(db, 'members', 'ENC-2302');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: 'ENC-2302', ...snap.data(), role: 'admin' } as Member;
    }

    // Auto-seed admin user if first time
    const adminUser: Member = {
      id: 'ENC-2302',
      name: 'Coordinator Admin',
      email: cleanEmail,
      committee: 'Presentations',
      avatar: {
        type: 'robot',
        color: 'yellow',
        shape: 'rounded',
        accessory: 'crown',
      },
      streak: 99,
      totalPoints: 999,
      role: 'admin',
      createdAt: Date.now(),
    };

    await setDoc(docRef, adminUser);
    return adminUser;
  }

  // Regular Member lookup
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
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      ...data,
      docId: docSnap.id,
      id: data.id || docSnap.id,
    } as Member;
  });
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

export async function getSessionAttendance(sessionId: string): Promise<AttendanceRecord[]> {
  const q = query(collection(db, 'attendance'), where('sessionId', '==', sessionId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord));
}

export async function markAttendance(
  sessionId: string,
  records: { memberId: string; memberName: string; status: 'present' | 'late' | 'absent' | 'excused' }[],
  isUpdate: boolean = false
): Promise<void> {
  const sessionRef = doc(db, 'sessions', sessionId);

  let present = 0;
  let late = 0;
  let absent = 0;
  let excused = 0;

  for (const record of records) {
    if (record.status === 'present') present++;
    else if (record.status === 'late') late++;
    else if (record.status === 'absent') absent++;
    else if (record.status === 'excused') excused++;

    // 1. Record attendance using deterministic ID per session & member
    const recordDocRef = doc(db, 'attendance', `${sessionId}_${record.memberId}`);
    await setDoc(recordDocRef, {
      sessionId,
      memberId: record.memberId,
      memberName: record.memberName,
      status: record.status,
      updatedAt: Date.now(),
      createdAt: Date.now(),
    }, { merge: true });

    // 2. Only award streaks & points if this is the FIRST time submitting attendance for this session!
    // Prevents infinite points and streaks farming on repeat submissions
    if (!isUpdate) {
      const memberRef = doc(db, 'members', record.memberId);
      const memberSnap = await getDoc(memberRef);
      if (!memberSnap.exists()) continue;
      const currentStreak = memberSnap.data().streak || 0;

      if (record.status === 'present') {
        const newStreak = currentStreak + 1;
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
        await updateDoc(memberRef, {
          streak: 0,
        });
      }
    }
  }

  // 3. Update session document status and summary
  await updateDoc(sessionRef, {
    attendanceSubmitted: true,
    submittedAt: Date.now(),
    attendanceSummary: { present, late, absent, excused },
  });
}

export async function deleteSession(sessionId: string): Promise<void> {
  // Delete session document
  await deleteDoc(doc(db, 'sessions', sessionId));

  // Delete all attendance records for this session
  const q = query(collection(db, 'attendance'), where('sessionId', '==', sessionId));
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    await deleteDoc(d.ref);
  }
}

export async function clearSessionAttendance(sessionId: string): Promise<void> {
  // Delete all attendance records for this session
  const q = query(collection(db, 'attendance'), where('sessionId', '==', sessionId));
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    await deleteDoc(d.ref);
  }

  // Reset session status
  await updateDoc(doc(db, 'sessions', sessionId), {
    attendanceSubmitted: false,
    submittedAt: null,
    attendanceSummary: null,
  });
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

export async function getMemberPointHistory(memberId: string): Promise<PointEvent[]> {
  const q = query(
    collection(db, 'point_events'),
    where('memberId', '==', memberId)
  );
  const snapshot = await getDocs(q);
  const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PointEvent));
  return events.sort((a, b) => b.createdAt - a.createdAt);
}

// --- Priority 4: Saved Session Groups ---

export async function saveSessionGroups(name: string, groups: { teamNumber: number; members: { id: string; name: string }[] }[]): Promise<void> {
  const docRef = doc(db, 'settings', 'latest_groups');
  await setDoc(docRef, {
    name,
    groups,
    createdAt: Date.now(),
  });
}

export async function getLatestSavedGroups(): Promise<SavedGroup | null> {
  const docRef = doc(db, 'settings', 'latest_groups');
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as SavedGroup;
}

// --- Priority 4: Editable & Deletable Guidelines ---

export async function getGuidelinesContent(): Promise<string | null> {
  const docRef = doc(db, 'settings', 'guidelines');
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data().content || null;
}

export async function updateGuidelinesContent(content: string): Promise<void> {
  const docRef = doc(db, 'settings', 'guidelines');
  await setDoc(docRef, {
    content,
    updatedAt: Date.now(),
  });
}

export async function deleteGuidelinesContent(): Promise<void> {
  const docRef = doc(db, 'settings', 'guidelines');
  try {
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('deleteDoc error:', e);
  }
  try {
    await setDoc(docRef, { content: '', updatedAt: Date.now() });
  } catch (e) {
    console.warn('setDoc empty guidelines error:', e);
  }
}

// --- Priority 4: Buddy System via Code / QR ---

export async function connectBuddies(
  memberA: { id: string; name: string },
  memberBId: string
): Promise<{ success: boolean; message: string; buddyName?: string }> {
  const cleanBId = memberBId.trim().toUpperCase();

  if (memberA.id === cleanBId) {
    return { success: false, message: 'You cannot add yourself as a buddy!' };
  }

  // Lookup Member B
  const bRef = doc(db, 'members', cleanBId);
  const bSnap = await getDoc(bRef);
  if (!bSnap.exists()) {
    return { success: false, message: 'Invalid Member ID. Please check the code.' };
  }
  const bData = bSnap.data() as Member;

  // Check if already buddies
  const q1 = query(
    collection(db, 'buddies'),
    where('memberAId', 'in', [memberA.id, cleanBId])
  );
  const existingSnaps = await getDocs(q1);
  const alreadyConnected = existingSnaps.docs.some((d) => {
    const data = d.data();
    return (
      (data.memberAId === memberA.id && data.memberBId === cleanBId) ||
      (data.memberAId === cleanBId && data.memberBId === memberA.id)
    );
  });

  if (alreadyConnected) {
    return { success: false, message: `You and ${bData.name} are already buddies!` };
  }

  // Record buddy connection
  await addDoc(collection(db, 'buddies'), {
    memberAId: memberA.id,
    memberAName: memberA.name,
    memberBId: cleanBId,
    memberBName: bData.name,
    createdAt: Date.now(),
  });

  // Award +15 Buddy Points to Member A
  await addPointEvent(
    memberA.id,
    memberA.name,
    15,
    `Connected with Buddy ${bData.name} [${cleanBId}]! 🤝`
  );

  // Award +15 Buddy Points to Member B
  await addPointEvent(
    cleanBId,
    bData.name,
    15,
    `Connected with Buddy ${memberA.name} [${memberA.id}]! 🤝`
  );

  return { success: true, message: `Successfully connected with ${bData.name}! You both earned +15 points! 🎉`, buddyName: bData.name };
}

export async function getMemberBuddies(memberId: string): Promise<{ id: string; name: string }[]> {
  const qA = query(collection(db, 'buddies'), where('memberAId', '==', memberId));
  const qB = query(collection(db, 'buddies'), where('memberBId', '==', memberId));

  const [snapA, snapB] = await Promise.all([getDocs(qA), getDocs(qB)]);

  const buddies: { id: string; name: string }[] = [];
  snapA.docs.forEach((d) => {
    const data = d.data();
    buddies.push({ id: data.memberBId, name: data.memberBName });
  });
  snapB.docs.forEach((d) => {
    const data = d.data();
    buddies.push({ id: data.memberAId, name: data.memberAName });
  });

  return buddies;
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

export async function deleteFeedbackItem(feedbackId: string): Promise<void> {
  const ref = doc(db, 'feedback', feedbackId);
  await deleteDoc(ref);
}

export async function deleteSessionFeedbackItem(feedbackId: string): Promise<void> {
  const ref = doc(db, 'session_feedback', feedbackId);
  await deleteDoc(ref);
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

