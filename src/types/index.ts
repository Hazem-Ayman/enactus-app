export type Committee = 'Presentations';

export interface Member {
  id: string;
  name: string;
  committee: Committee;
  level: number; // 1 to 5
  goal: string;
  totalPoints: number;
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
