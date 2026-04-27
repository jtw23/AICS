import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearAuth, getUser } from '../lib/auth';
import { useNotifications } from '../hooks/useNotifications';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUser();
  useNotifications(); // SSE 연결 유지

  const handleLogout = () => { clearAuth(); navigate('/login'); };

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const navItems = [
    { to: '/',         icon: 'input',    label: '문의 처리' },
    { to: '/history',  icon: 'history',  label: '히스토리' },
    ...(user?.role === 'admin' ? [{ to: '/settings', icon: 'settings', label: '설정' }] : []),
  ];

  return (
    <div className="h-screen flex overflow-hidden">
      {/* ── 사이드바 ── */}
      <nav className="dark-scroll w-64 h-full flex flex-col flex-shrink-0 bg-slate-900 border-r border-slate-800 z-50">
        {/* 로고 */}
        <div className="flex items-center gap-3" style={{ paddingTop: '1rem', paddingBottom: '1rem', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}>
          <div className="w-11 h-11 rounded-lg bg-primary-container flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined ms-fill text-white" style={{ fontSize: 24 }}>business</span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-black text-xl leading-none tracking-tight">AICS</p>
            <p className="text-slate-400 text-xs mt-1.5 truncate">Enterprise Support</p>
          </div>
        </div>

        {/* 메뉴 */}
        <ul className="flex-1 overflow-y-auto" style={{ paddingTop: '1.5rem', paddingLeft: '0.75rem', paddingRight: '0.75rem', display: 'flex', flexDirection: 'column' }}>
          {navItems.map(({ to, icon, label }) => {
            const active = isActive(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`flex items-center gap-3 rounded-md text-base font-medium transition-colors duration-150 ${
                    active
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                  style={{ paddingTop: '1rem', paddingBottom: '1rem', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}
                >
                  <span className={`material-symbols-outlined ${active ? 'text-indigo-400' : ''}`} style={{ fontSize: 22 }}>{icon}</span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* 하단 사용자 */}
        <div className="border-t border-slate-800" style={{ paddingTop: '1rem', paddingBottom: '1rem', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white text-base font-bold flex-shrink-0">
              {user?.name?.[0] ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-200 text-base font-semibold truncate">{user?.name}</p>
              <p className="text-slate-500 text-sm truncate mt-0.5">{user?.role === 'admin' ? '관리자' : '에이전트'}</p>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-slate-200 transition-colors flex-shrink-0" title="로그아웃">
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── 우측 전체 ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top App Bar */}
        <header className="sticky top-0 z-40 h-20 flex items-center bg-white border-b border-slate-200 flex-shrink-0" style={{ paddingLeft: '2.5rem', paddingRight: '2rem' }}>
          <div className="hidden md:flex items-center gap-2.5 bg-white border border-slate-200 rounded-lg w-80" style={{ paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
            <span className="material-symbols-outlined text-on-surface-variant flex-shrink-0" style={{ fontSize: 18 }}>search</span>
            <input
              className="flex-1 border-none bg-transparent text-sm focus:ring-0 outline-none placeholder:text-on-surface-variant text-on-surface"
              placeholder="검색..."
              type="text"
            />
          </div>
        </header>

        {/* Main Canvas */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="w-full" style={{ paddingLeft: '2.5rem', paddingRight: '1.5rem', paddingTop: '1.5rem', paddingBottom: '2rem' }}>{children}</div>
        </main>
      </div>
    </div>
  );
}
