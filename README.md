# AICS — AI 고객 문의 분류 시스템

웹 개발 / SI / SM 회사의 고객 문의를 AI가 자동 분류하고, 고객사·담당자 정보와 함께 Notion 작업을 생성해주는 내부 도구입니다.

## 주요 기능

- **자동 분류**: 고객 문의를 계약·견적·개발·유지보수·장애·기술지원·기타 7개 카테고리로 분류
- **고객사 관리**: 업체별 고객코드(C001~) 저장 및 문의 연결, 검색형 콤보박스 선택
- **팀별 담당자 배정**: 고객사마다 개발팀·기획팀·디자인팀 담당자를 독립적으로 배정
- **직원 관리**: 개발팀·기획팀·디자인팀 직원 등록·삭제
- **PII 마스킹**: 주민번호·카드번호·전화번호·이메일·계좌번호·여권번호 자동 제거
- **초안 생성**: 선택한 톤(공식·친근·간결)으로 답변 초안 1개 자동 작성
- **유사 문의 검색**: 과거 처리 사례 기반 유사 문의 참조 (코사인 유사도 0.75 이상)
- **Notion 연동**: 접수 즉시 공통 Notion 데이터베이스에 작업 자동 생성, 담당 팀·직원 자동 매핑
- **문의 삭제**: 히스토리 페이지에서 문의 삭제 가능
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

서버 최초 실행 시 아래 데이터가 자동으로 입력됩니다:
- 고객사 61개 (C001~C061)
- 직원 19명 (개발팀 9명 / 기획팀 5명 / 디자인팀 4명)
- 개발팀 ↔ 담당 업체 초기 배정

## 문의 처리 파이프라인

`POST /api/inquiry/process` 호출 시 순서대로 실행:

1. **PII 마스킹** — 주민번호·카드번호·전화·이메일·계좌번호 등 정규식 치환
2. **분류** — OpenRouter LLM으로 카테고리·신뢰도·요약 반환
3. **임베딩** — `@xenova/transformers` (all-MiniLM-L6-v2) 로컬 실행
4. **유사 문의 검색** — 코사인 유사도 0.75 이상인 과거 문의 최대 2건 조회
5. **초안 생성** — 선택한 톤(공식·친근·간결)으로 초안 1개 생성
6. **DB 저장** — inquiries + drafts 테이블
7. **Notion 작업 생성** — 공통 DB ID로 카테고리·고객사·담당팀·담당자 포함 페이지 생성

## 문의 카테고리

| 카테고리 | 설명 | Notion 우선순위 |
|---|---|---|
| 계약 | 계약 체결·변경·해지 관련 | 낮음 |
| 견적 | 개발 또는 유지보수 견적 요청 | 낮음 |
| 개발 | 신규 기능 개발·추가 요청 | 보통 |
| 유지보수 | 기존 시스템 운영·수정·관리 | 보통 |
| 장애 | 시스템 오류·버그·서비스 중단 | 높음 |
| 기술지원 | 사용법·설정·운영 문의 | 낮음 |
| 기타 | 위 분류에 해당하지 않는 문의 | 낮음 |

## Notion 연동 설정

### 1. Notion 데이터베이스 속성

아래 속성명이 정확히 일치해야 합니다 (속성명 한국어 그대로). 속성 **유형**은 DB 스키마를 런타임에 자동 감지하므로 select·rich_text·multi_select 등 자유롭게 사용 가능합니다.

| 속성명 | 권장 유형 | 비고 |
|---|---|---|
| 작업 이름 | 제목 | AI 요약 자동 입력 |
| 업체명 | 텍스트 | 고객사명 자동 입력 |
| 분류 | 선택 | 카테고리명 자동 입력 |
| 우선순위 | 선택 | `높음` / `보통` / `낮음` |
| 부서 | 텍스트 또는 선택 | 담당 팀명 자동 입력 |
| 업무담당자 | 텍스트 또는 선택 | 담당 직원 이름 자동 입력 |
| 설명 | 텍스트 | 카테고리 + 문의 원문 자동 입력 |

### 2. 담당 팀 자동 결정 규칙

| 카테고리 | 기본 배정 팀 | 예외 |
|---|---|---|
| 계약·견적·기타 | 기획팀 | — |
| 개발·유지보수 | 개발팀 | 문의 내용에 디자인 관련 키워드 포함 시 디자인팀 |
| 장애·기술지원 | 개발팀 | — |

팀이 결정되면 해당 고객사의 팀별 배정 직원 이름을 `업무담당자` 속성에 자동 입력합니다.

### 3. 연동 방법

1. Notion 데이터베이스에 Integration 연결 (공유 → Connections)
2. 앱 설정 페이지 → **Notion** 탭에서 **Notion DB ID** 입력:
   - URL `notion.so/{database_id}?v=...`에서 32자리 ID 확인
   - URL 붙여넣기도 지원 (자동 파싱)

## 설정 페이지 구성

| 탭 | 설명 |
|---|---|
| Notion | 공통 Notion Database ID 설정 |
| OpenRouter | 사용할 LLM 모델 목록 설정 |
| 고객사 관리 | 업체 목록 조회·추가·삭제, 팀별(개발/기획/디자인) 담당자 배정, 검색 |
| 직원 관리 | 부서별 직원 목록 조회·추가·삭제 |

## 역할 구분

| 역할 | 권한 |
|---|---|
| `admin` | 설정 관리 (고객사·직원·Notion·OpenRouter), 문의 처리·삭제 |
| `agent` | 문의 처리, 히스토리 조회·삭제 |

## 프로젝트 구조

```
AICS/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.sql   # 테이블 정의 (clients, employees, client_assignments, app_settings 포함)
│   │   │   └── client.ts    # DB 연결 및 마이그레이션·시드 데이터
│   │   ├── middleware/      # JWT 인증
│   │   ├── routes/
│   │   │   ├── auth.ts      # 로그인·회원가입
│   │   │   ├── inquiry.ts   # 문의 처리·삭제 (client_id 포함)
│   │   │   ├── history.ts   # 히스토리 검색·조회
│   │   │   ├── notify.ts    # SSE 알림
│   │   │   └── settings.ts  # Notion·OpenRouter·고객사·직원·담당배정 API
│   │   ├── services/
│   │   │   ├── classifier.ts  # 문의 분류 (7개 카테고리)
│   │   │   ├── drafter.ts     # 답변 초안 생성 (톤 1개)
│   │   │   ├── embedder.ts    # 로컬 임베딩
│   │   │   ├── notifier.ts    # Notion 작업 생성 + 팀 자동 결정
│   │   │   ├── notion.ts      # Notion API 호출 (동적 속성 타입 감지)
│   │   │   ├── openrouter.ts  # LLM 폴백 호출
│   │   │   └── pii.ts         # 개인정보 마스킹
│   │   └── types/
│   │       └── index.ts     # 공유 타입 (Client, Employee 포함)
│   └── data/                # SQLite DB 파일 (자동 생성)
└── frontend/
    └── src/
        ├── components/      # CategoryBadge, DraftCard(마크다운), Layout, NotificationPanel
        ├── hooks/           # useNotifications (SSE)
        ├── lib/             # axios 인스턴스, auth 유틸
        └── pages/
            ├── Inquiry.tsx       # 고객사 콤보박스 + 문의 처리
            ├── InquiryDetail.tsx # 문의 상세 + 초안 확인
            ├── History.tsx       # 히스토리 (7개 카테고리 필터, 삭제)
            ├── Settings.tsx      # 4탭 설정 페이지
            └── Login.tsx         # 좌우 분할 레이아웃
```

## DB 스키마 요약

| 테이블 | 설명 |
|---|---|
| `users` | 시스템 로그인 계정 (admin / agent) |
| `clients` | 고객사 (코드, 업체명) |
| `employees` | 직원 (이름, 부서) |
| `client_assignments` | 고객사 ↔ 팀별 담당자 배정 (client_id + department UNIQUE) |
| `inquiries` | 처리된 문의 (client_id 포함) |
| `drafts` | AI 답변 초안 (variant 1) |
| `assignees` | 카테고리별 Notion 설정 (레거시, 현재 미사용) |
| `app_settings` | 앱 전역 설정 (notion_database_id, openrouter_models 등) |
| `notifications` | 인앱 알림 |
| `inquiries_fts` | FTS5 전문 검색 인덱스 |
