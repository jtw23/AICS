import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { setAuth, type AuthUser } from '../lib/auth';

type Mode = 'login' | 'register';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = mode === 'login' ? { email, password } : { email, name, password };
      const res = await api.post<{ token: string; user: AuthUser }>(endpoint, payload);
      setAuth(res.data.token, res.data.user);
      navigate('/');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3 border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-outline";

  return (
    <div className="min-h-screen flex bg-background">
      {/* 왼쪽 브랜드 패널 */}
      <div className="hidden lg:flex w-[420px] flex-shrink-0 flex-col items-center justify-center p-14 bg-slate-900">
        <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mb-8 shadow-2xl">
          <span className="material-symbols-outlined ms-fill text-white" style={{ fontSize: 32 }}>business</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight mb-3">AICS</h1>
        <p className="text-slate-400 text-center text-[15px] leading-relaxed mb-12">
          AI 기반 민원 자동 분류 및<br/>답변 초안 생성 시스템
        </p>
        <div className="space-y-5 w-full max-w-xs">
          {[
            { icon: 'auto_awesome', text: 'AI가 카테고리를 자동 분류' },
            { icon: 'edit_note',    text: '3가지 톤의 답변 초안 생성' },
            { icon: 'link',         text: 'Notion 작업 트래커 자동 연동' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-slate-400 text-sm">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-indigo-400" style={{ fontSize: 16 }}>{icon}</span>
              </div>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* 오른쪽 폼 */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* 모바일 로고 */}
          <div className="lg:hidden text-center mb-10">
            <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined ms-fill text-white" style={{ fontSize: 28 }}>business</span>
            </div>
            <h1 className="text-2xl font-black text-on-surface tracking-tight">AICS</h1>
          </div>

          <div className="bg-surface-container-lowest rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.02)] border border-outline-variant p-8">
            <h2 className="text-h2 font-h2 text-on-surface mb-1">
              {mode === 'login' ? '안녕하세요' : '계정 만들기'}
            </h2>
            <p className="text-body-md text-on-surface-variant mb-8">
              {mode === 'login' ? 'AICS에 로그인하세요.' : '새 계정을 생성합니다.'}
            </p>

            {/* 탭 */}
            <div className="flex gap-1 bg-surface-container rounded-lg p-1 mb-6">
              {(['login', 'register'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 font-label-md text-label-md rounded-md transition-all ${
                    mode === m
                      ? 'bg-surface-container-lowest shadow text-on-surface'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {m === 'login' ? '로그인' : '회원가입'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1.5">이름</label>
                  <input type="text" placeholder="홍길동" value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
                </div>
              )}
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1.5">이메일</label>
                <input type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1.5">비밀번호</label>
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className={inputCls} />
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-error-container rounded-lg text-on-error-container text-body-md">
                  <span className="material-symbols-outlined text-error" style={{ fontSize: 16 }}>error</span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-on-primary rounded-full font-label-md text-label-md disabled:opacity-60 transition-colors mt-2 flex items-center justify-center gap-2 shadow-md hover:bg-primary-container"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                    </svg>
                    처리 중...
                  </>
                ) : mode === 'login' ? '로그인' : '가입하기'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
