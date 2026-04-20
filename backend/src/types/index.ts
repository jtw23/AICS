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
  | '계약'
  | '견적'
  | '개발'
  | '유지보수'
  | '장애'
  | '기술지원'
  | '기타';

export type ToneType = '공식' | '친근' | '간결';

export interface Client {
  id: number;
  client_code: string;
  name: string;
  created_at: number;
}

export interface Employee {
  id: number;
  name: string;
  department: '개발팀' | '기획팀' | '디자인팀';
  created_at: number;
}

export interface Inquiry {
  id: number;
  user_id: number;
  client_id: number | null;
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
