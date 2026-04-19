# AICS — AI 민원 분류 시스템

고객 문의를 AI가 자동 분류하고, 담당자에게 Notion 작업을 생성해주는 내부 도구입니다.

## 주요 기능

- **자동 분류**: 고객 문의를 결제·배송·환불·기술지원·계정·기타 6개 카테고리로 분류
- **PII 마스킹**: 주민번호·카드번호·전화번호·이메일·계좌번호·여권번호 자동 제거
- **초안 생성**: 공식·친근·간결 3가지 톤으로 답변 초안 3개 자동 작성
- **유사 문의 검색**: 과거 처리 사례 기반 유사 문의 참조 (코사인 유사도 0.75 이상)
- **Notion 연동**: 접수 즉시 담당자 Notion 데이터베이스에 작업 자동 생성
- **실시간 알림**: SSE 기반 인앱 알림

## 기술 스택

| 영역 | 기술 |
|---|---|
| 백엔드 | Node.js, Express, TypeScript, better-sqlite3 |
| 프론트엔드 | React 19, TypeScript, Vite, Tailwind CSS v4 |
| AI/LLM | OpenRouter (Gemini, Llama, DeepSeek, Mistral 무료 모델) |
| 임베딩 | @xenova/transformers — all-MiniLM-L6-v2 (로컬 실행) |
| 데이터베이스 | SQLite (FTS5 전문 검색 포함) |
| 외부 연동 | Notion API |

## 시작하기

### 1. 의존성 설치

```bash
npm run install:all
```

### 2. 환경 변수 설정

`backend/.env` 파일을 생성합니다:

```env
PORT=4000
JWT_SECRET=<랜덤 문자열>
OPENROUTER_API_KEY=<openrouter.ai API 키>
FRONTEND_URL=http://localhost:5173
NOTION_API_KEY=<Notion 연동 키>
```

> OpenRouter 무료 계정 발급: https://openrouter.ai

### 3. 개발 서버 실행

터미널 두 개를 열어 각각 실행합니다:

```bash
# 터미널 1 — 백엔드 (포트 4000)
npm run dev:backend

# 터미널 2 — 프론트엔드 (포트 5173)
npm run dev:frontend
```

브라우저에서 `http://localhost:5173` 접속 후 회원가입(`/api/auth/register`)으로 계정 생성.

## Notion 연동 설정

1. Notion에서 데이터베이스 생성 (아래 속성 필요)

| 속성명 | 유형 |
|---|---|
| 작업 이름 | 제목 |
| 상태 | 상태 (시작 전 / 진행 중 / 완료) |
| 우선순위 | 선택 (높음 / 보통 / 낮음) |
| 설명 | 텍스트 |

2. 해당 데이터베이스에 Notion Integration 연결 (공유 → Connections)
3. 앱 설정 페이지(`/settings`)에서 카테고리별 **Notion 데이터베이스 ID** 입력

> 데이터베이스 ID는 URL `notion.so/{database_id}?v=...`에서 확인

## 역할 구분

| 역할 | 권한 |
|---|---|
| `admin` | 담당자·Notion 설정 관리, 문의 처리 |
| `agent` | 문의 처리, 히스토리 조회 |

## 프로젝트 구조

```
AICS/
├── backend/
│   ├── src/
│   │   ├── db/          # SQLite 스키마 및 클라이언트
│   │   ├── middleware/  # JWT 인증
│   │   ├── routes/      # API 엔드포인트
│   │   ├── services/    # 비즈니스 로직 (분류, 임베딩, 초안, Notion 등)
│   │   └── types/       # 공유 타입 정의
│   └── data/            # SQLite DB 파일 (자동 생성)
└── frontend/
    └── src/
        ├── components/  # Layout, NotificationPanel, DraftCard 등
        ├── hooks/       # useNotifications (SSE)
        ├── lib/         # axios 인스턴스, auth 유틸
        └── pages/       # Inquiry, History, Settings, Login
```
