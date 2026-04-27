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
  const [showPassword, setShowPassword] = useState(false);
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

  const inputBase = "w-full border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-outline";

  return (
    <div style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden', background: '#f7f9fb' }}>

      {/* ── 왼쪽 브랜드 패널 ── */}
      <section className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-primary"
        style={{ width: '50%', flexShrink: 0, padding: '2rem' }}>

        {/* 배경 blur 장식 */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.4, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '60%', height: '60%', background: '#4f46e5', borderRadius: '9999px', filter: 'blur(120px)' }} />
          <div style={{ position: 'absolute', bottom: '-5%', right: '-5%', width: '50%', height: '50%', background: '#4b4dd8', borderRadius: '9999px', filter: 'blur(100px)' }} />
        </div>

        {/* 로고 */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined ms-fill text-on-primary" style={{ fontSize: 32 }}>hub</span>
          <h1 className="text-on-primary font-black tracking-tight" style={{ fontSize: '1.875rem' }}>AICS</h1>
        </div>

        {/* 중앙 비주얼 */}
        <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 0' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '20rem', aspectRatio: '1 / 1' }}>

            {/* 메인 카드 */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px rgba(0,0,0,0.4)', background: 'linear-gradient(135deg, rgba(30,27,75,0.95) 0%, rgba(67,56,202,0.7) 60%, rgba(99,102,241,0.5) 100%)' }}>
              {/* 신경망 SVG 장식 */}
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.25 }} viewBox="0 0 400 400">
                {[80, 130, 170].map((r) => (
                  <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="white" strokeWidth="0.5" />
                ))}
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
                  const rad = (deg * Math.PI) / 180;
                  const x1 = 200 + 80 * Math.cos(rad);
                  const y1 = 200 + 80 * Math.sin(rad);
                  const x2 = 200 + 130 * Math.cos(rad);
                  const y2 = 200 + 130 * Math.sin(rad);
                  const x3 = 200 + 170 * Math.cos(rad);
                  const y3 = 200 + 170 * Math.sin(rad);
                  return (
                    <g key={deg}>
                      <circle cx={x1} cy={y1} r="3" fill="white" opacity="0.8" />
                      <circle cx={x2} cy={y2} r="2" fill="white" opacity="0.5" />
                      <circle cx={x3} cy={y3} r="1.5" fill="white" opacity="0.3" />
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="0.4" opacity="0.3" />
                      <line x1={x2} y1={y2} x2={x3} y2={y3} stroke="white" strokeWidth="0.4" opacity="0.2" />
                    </g>
                  );
                })}
                <text x="200" y="220" textAnchor="middle" fill="white" fontSize="72" fontWeight="900" opacity="0.85" fontFamily="Inter, sans-serif">Ai</text>
              </svg>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top right, rgba(53,37,205,0.7), transparent)' }} />
            </div>

            {/* 우상단 플로팅 칩 */}
            <div style={{ position: 'absolute', top: '-1.5rem', right: '-1.5rem', width: '7rem', height: '7rem', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined ms-fill text-on-primary" style={{ fontSize: 44 }}>memory</span>
            </div>

            {/* 좌하단 설명 카드 */}
            <div style={{ position: 'absolute', bottom: '-2.5rem', left: '-2rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', padding: '0.875rem 1.25rem', maxWidth: '13rem' }}>
              <p className="text-white font-medium" style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>AI 기반 자동화 민원 처리 시스템</p>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.6 }}>
          <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.5)' }} />
          <p className="text-on-primary font-semibold uppercase tracking-widest whitespace-nowrap" style={{ fontSize: '0.625rem' }}>Enterprise Support Architecture</p>
        </div>
      </section>

      {/* ── 오른쪽 폼 패널 ── */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '2rem', background: '#f7f9fb' }}>
        
        {/* 모바일 로고 */}
        <div className="lg:hidden" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '9999px', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
            <span className="material-symbols-outlined ms-fill text-on-primary" style={{ fontSize: 28 }}>hub</span>
          </div>
          <h1 className="font-black text-on-surface tracking-tight" style={{ fontSize: '1.5rem' }}>AICS</h1>
        </div>

        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* 헤더 */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 className="font-black text-on-surface tracking-tight" style={{ fontSize: '1.875rem', lineHeight: '2.375rem', marginBottom: '0.5rem' }}>
              {mode === 'login' ? '안녕하세요' : '계정 만들기'}
            </h2>
            <p className="text-secondary" style={{ fontSize: '1rem', lineHeight: '1.5rem' }}>
              {mode === 'login' ? '자격 증명을 입력하여 계정에 접속하세요.' : '새 계정을 생성합니다.'}
            </p>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* 이름 (회원가입만) */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-on-surface-variant" style={{ marginBottom: '0.5rem' }}>이름</label>
                <div className="group" style={{ position: 'relative' }}>
                  <div className="pointer-events-none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, display: 'flex', alignItems: 'center', paddingLeft: '1rem' }}>
                    <span className="material-symbols-outlined text-outline" style={{ fontSize: 20 }}>person</span>
                  </div>
                  <input type="text" placeholder="홍길동" value={name} onChange={(e) => setName(e.target.value)} required
                    className={inputBase} style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', paddingLeft: '3rem', paddingRight: '1rem', fontSize: '0.875rem' }} />
                </div>
              </div>
            )}

            {/* 이메일 */}
            <div>
              <label className="block text-sm font-medium text-on-surface-variant" style={{ marginBottom: '0.5rem' }}>이메일 주소</label>
              <div className="group" style={{ position: 'relative' }}>
                <div className="pointer-events-none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, display: 'flex', alignItems: 'center', paddingLeft: '1rem' }}>
                  <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors" style={{ fontSize: 20 }}>mail</span>
                </div>
                <input type="email" placeholder="admin@aics.local" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className={inputBase} style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', paddingLeft: '3rem', paddingRight: '1rem', fontSize: '0.875rem' }} />
              </div>
            </div>

            {/* 비밀번호 */}
            <div>
              <div style={{ marginBottom: '0.5rem' }}>
                <label className="text-sm font-medium text-on-surface-variant">비밀번호</label>
              </div>
              <div className="group" style={{ position: 'relative' }}>
                <div className="pointer-events-none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, display: 'flex', alignItems: 'center', paddingLeft: '1rem' }}>
                  <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors" style={{ fontSize: 20 }}>lock</span>
                </div>
                <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required
                  className={inputBase} style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', paddingLeft: '3rem', paddingRight: '3rem', fontSize: '0.875rem' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center text-outline hover:text-on-surface transition-colors"
                  style={{ paddingRight: '1rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* 에러 */}
            {error && (
              <div className="flex items-center gap-2 bg-error-container rounded-lg text-on-error-container"
                style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
                <span className="material-symbols-outlined text-error" style={{ fontSize: 16 }}>error</span>
                {error}
              </div>
            )}

            {/* 제출 버튼 */}
            <button type="submit" disabled={loading}
              className="w-full bg-primary-container hover:bg-primary text-on-primary font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex justify-center items-center gap-2 disabled:opacity-60 active:scale-[0.98]"
              style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', fontSize: '0.9375rem' }}>
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  처리 중...
                </>
              ) : (
                <>
                  {mode === 'login' ? '로그인' : '가입하기'}
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{mode === 'login' ? 'login' : 'person_add'}</span>
                </>
              )}
            </button>
          </form>

          {/* 구분선 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ height: '1px', flex: 1, background: '#c7c4d8' }} />
            <span className="text-outline font-semibold uppercase tracking-wider" style={{ fontSize: '0.6875rem' }}>접속 방식</span>
            <div style={{ height: '1px', flex: 1, background: '#c7c4d8' }} />
          </div>

          {/* 모드 전환 */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
              {mode === 'login' ? '계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
              <button type="button"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                className="text-primary font-semibold hover:underline underline-offset-4 decoration-2">
                {mode === 'login' ? '회원가입' : '로그인하기'}
              </button>
            </p>
          </div>

          {/* 카피라이트 */}
          <div style={{ textAlign: 'center' }}>
            <p className="text-outline" style={{ fontSize: '0.75rem' }}>
              © 2024 AICS Enterprise Suite. All rights reserved.
            </p>
          </div>
        </div>

        {/* 우하단 장식 점 */}
        <div className="hidden lg:flex" style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', gap: '0.5rem', opacity: 0.3, pointerEvents: 'none' }}>
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-outline-variant" />
          <div className="w-2 h-2 rounded-full bg-outline-variant" />
        </div>
      </section>
    </div>
  );
}
