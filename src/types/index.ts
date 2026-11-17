export type Committee = 'Presentations';

export interface AvatarConfig {
  type: 'robot' | 'human' | 'monster' | 'alien'; // Character Archetype
  color: string; // e.g. 'blue', 'orange', 'pink', 'purple', 'green', 'red', 'yellow'
  shape: 'circle' | 'square' | 'rounded'; // Head shape
  accessory: 'none' | 'glasses' | 'sunglasses' | 'antenna' | 'horns' | 'vr' | 'heart_eyes' | 'cap' | 'crown' | 'mask'; // What to wear
  expression?: 'smile' | 'cool' | 'wink' | 'open'; // Face expression
}

export interface Member {
  id: string; // Auto-generated short unique ID (e.g. EN-8492) or ENC-2302
  name: string;
  email: string;
  committee: Committee;
  avatar: AvatarConfig;
  streak: number; // consecutive attended sessions
  totalPoints: number;
  role?: 'member' | 'admin';
  titleBadge?: string; // e.g. "Most Improved", "Stage Presence", "Breakthrough Storyteller"
  createdAt: number;
}

export interface Session {
  id: string;
  title: string;
  date: string;
  theme?: string;
  createdAt: number;
}

export interface SavedGroup {
  id: string;
  name: string; // e.g. "Session 1 Groups"
  createdAt: number;
  groups: {
    teamNumber: number;
    members: { id: string; name: string }[];
  }[];
}

export interface BuddyConnection {
  id: string;
  memberAId: string;
  memberAName: string;
  memberBId: string;
  memberBName: string;
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
