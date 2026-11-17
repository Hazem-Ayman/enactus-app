export type Committee = 'Presentations';

export interface AvatarConfig {
  color: string; // e.g. 'blue', 'orange', 'pink', 'purple', 'green', 'red'
  shape: 'circle' | 'square' | 'rounded'; // Head shape
  accessory: 'none' | 'glasses' | 'sunglasses' | 'antenna' | 'horns' | 'vr' | 'heart_eyes'; // What to wear on face
}

export interface Member {
  id: string; // Auto-generated short unique ID (e.g. EN-8492)
  name: string;
  email: string;
  committee: Committee;
  avatar: AvatarConfig;
  streak: number; // consecutive attended sessions
  totalPoints: number;
  createdAt: number;
}

export interface Session {
  id: string;
  title: string;
  date: string;
  theme?: string;
  createdAt: number;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  memberId: string;
  memberName: string;
  status: 'present' | 'late' | 'absent' | 'excused';
  createdAt: number;
}

export interface PointEvent {
  id: string;
  memberId: string;
  memberName?: string;
  amount: number;
  reason: string;
  createdAt: number;
}

export interface Feedback {
  id: string;
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  toMemberName: string;
  star1: string;
  star2: string;
  wish: string;
  sessionId?: string;
  flagged?: boolean;
  createdAt: number;
}

export interface SessionFeedback {
  id: string;
  memberId?: string;
  memberName?: string; // Optional if anonymous
  isAnonymous: boolean;
  sessionRating: number; // 1 to 5 stars
  coordinatorRating: number; // 1 to 5 stars
  keyTakeaway: string; // What was most helpful
  improvementWish: string; // What could be improved for next session
  createdAt: number;
}
