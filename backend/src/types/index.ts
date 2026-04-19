export type UserRole = 'admin' | 'agent';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  created_at: number;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

export type InquiryCategory =
  | '결제'
  | '배송'
  | '환불'
  | '기술지원'
  | '계정'
  | '기타';

export type ToneType = '공식' | '친근' | '간결';

export interface Inquiry {
  id: number;
  user_id: number;
  content_masked: string;
  category: InquiryCategory;
  category_confidence: number;
  tone: ToneType;
  summary: string;
  embedding: Buffer | null;
  created_at: number;
}

export interface Draft {
  id: number;
  inquiry_id: number;
  variant: 1 | 2 | 3;
  content: string;
  selected: number;
}

export interface Notification {
  id: number;
  inquiry_id: number;
  user_id: number;
  channel: 'in-app' | 'notion';
  message: string;
  read: number;
  created_at: number;
}

export interface Assignee {
  id: number;
  category: InquiryCategory;
  user_id: number | null;
  notion_database_id: string | null;
}
