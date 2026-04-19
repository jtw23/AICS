# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### 개발 서버 실행 (동시에 두 터미널 필요)
```bash
# 백엔드 (포트 4000)
npm run dev:backend

# 프론트엔드 (포트 5173, Vite dev server)
npm run dev:frontend
```

### 의존성 설치
```bash
npm run install:all
```

### 백엔드 타입 체크 / 빌드
```bash
cd backend && npx tsc --noEmit   # 타입 체크만
cd backend && npm run build       # dist/ 생성
```

### 프론트엔드 린트 / 빌드
```bash
cd frontend && npm run lint
cd frontend && npm run build
```

## 환경 변수 (`backend/.env`)

| 변수 | 설명 |
|---|---|
| `PORT` | 백엔드 포트 (기본 4000) |
| `JWT_SECRET` | JWT 서명 키 |
| `OPENROUTER_API_KEY` | LLM API 키 (openrouter.ai) |
| `FRONTEND_URL` | CORS 허용 오리진 |
| `NOTION_API_KEY` | Notion 연동 키 |

## 아키텍처

### 전체 구조
- **백엔드**: Node.js + Express + TypeScript, SQLite(better-sqlite3), 포트 4000
- **프론트엔드**: React 19 + TypeScript + Vite + Tailwind CSS v4, 포트 5173
- Vite가 `/api` 요청을 백엔드로 프록시 (별도 CORS 설정 불필요)

### 문의 처리 파이프라인 (`backend/src/routes/inquiry.ts`)
`POST /api/inquiry/process` 호출 시 순서대로 실행:
1. **PII 마스킹** (`services/pii.ts`) — 주민번호·카드번호·전화·이메일·계좌번호 등 정규식 치환
2. **분류** (`services/classifier.ts`) — OpenRouter LLM으로 카테고리·신뢰도·요약 반환
3. **임베딩** (`services/embedder.ts`) — `@xenova/transformers` (all-MiniLM-L6-v2) 로컬 실행, 첫 실행 시 모델 ~30MB 다운로드
4. **유사 문의 검색** — 코사인 유사도 0.75 이상인 과거 문의 최대 2건 조회
5. **초안 생성** (`services/drafter.ts`) — 3가지 톤(공식/친근/간결)으로 각 1개씩 초안 생성
6. **DB 저장** — inquiries + drafts 테이블
7. **알림 발송** (`services/notifier.ts`) — 인앱 SSE 알림 + Notion 페이지 생성

### LLM 연동 (`services/openrouter.ts`)
무료 모델 4개를 순서대로 시도하며 429/503/502 시 다음 모델로 폴백:
`gemini-2.0-flash-exp → llama-3.3-70b → deepseek-chat-v3 → mistral-7b`

### Notion 연동 (`services/notion.ts`)
- 카테고리별 담당자 설정의 `notion_database_id`가 있을 때만 동작
- **작업 트래커** DB 속성 매핑: `작업 이름`(title), `상태`(시작 전), `우선순위`(카테고리별 자동 설정), `설명`(AI 요약)
- 우선순위: 결제/환불 → 높음, 배송/기술지원 → 보통, 계정/기타 → 낮음
- 페이지 본문: 고객 문의 원문 + AI 분류 결과 + 초안 1~3

### 인증
- JWT 기반, `localStorage`에 `token`·`user` 저장
- 역할: `admin`(설정 관리 가능), `agent`(문의 처리만)
- SSE 연결(`/api/notify/stream`)은 EventSource 헤더 제약으로 query string `?token=` 방식 사용

### 실시간 알림
- SSE로 구현 (`routes/notify.ts`, `services/notifier.ts`)
- 프론트엔드 `useNotifications` 훅이 EventSource 연결 관리
- 하트비트 25초마다 전송

### DB
- SQLite 파일: `backend/data/aics.db` (서버 시작 시 자동 생성)
- 스키마: `backend/src/db/schema.sql` — `CREATE TABLE IF NOT EXISTS` + FTS5 가상 테이블(inquiries_fts)
- 마이그레이션: `backend/src/db/client.ts`에서 `ALTER TABLE`로 처리 (오류 무시 패턴)

### 프론트엔드 API 호출
`frontend/src/lib/api.ts`의 axios 인스턴스(`api`) 사용. 401 응답 시 자동으로 로그인 페이지로 리다이렉트.
