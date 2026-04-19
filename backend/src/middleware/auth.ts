import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, UserRole } from '../types';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  // SSE 연결은 EventSource가 헤더를 보낼 수 없으므로 query string 토큰도 허용
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token as string | undefined;

  const rawToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : queryToken;

  if (!rawToken) {
    res.status(401).json({ error: '인증 토큰이 없습니다.' });
    return;
  }

  const token = rawToken;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
  }
}

export function requireRole(role: UserRole) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: '인증이 필요합니다.' });
      return;
    }
    if (req.user.role !== role) {
      res.status(403).json({ error: '권한이 없습니다.' });
      return;
    }
    next();
  };
}
