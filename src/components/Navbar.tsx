import React, { useEffect, useState } from 'react';
import { RotateCcw, ShieldCheck, MessageSquare, CreditCard, Globe } from 'lucide-react';
import { SasujaLogo } from './SasujaLogo';
import { Link, useNavigate } from 'react-router-dom';
import { Locale, translations } from '../utils/locales';

interface NavbarProps {
  onReset: () => void;
  onOpenFeedback: () => void;
  isUnlocked: boolean;
}

const EXCHANGE_RATE = 1500;

export const Navbar: React.FC<NavbarProps> = ({ onReset, onOpenFeedback, isUnlocked }) => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<Locale>('ko');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 1. 언어 로드
    const savedLang = localStorage.getItem('sasuja_lang') as Locale;
    if (savedLang) setLang(savedLang);

    // 2. 로그인 상태 로드
    fetchUser();

    // 3. 글로벌 이벤트 리스너
    const handleLoginEvent = () => fetchUser();
    const handleLogoutEvent = () => setUser(null);
    const handleLangChangeEvent = (e: any) => setLang(e.detail);

    window.addEventListener('sasuja_login', handleLoginEvent);
    window.addEventListener('sasuja_logout', handleLogoutEvent);
    window.addEventListener('sasuja_lang_change', handleLangChangeEvent);

    return () => {
      window.removeEventListener('sasuja_login', handleLoginEvent);
      window.removeEventListener('sasuja_logout', handleLogoutEvent);
      window.removeEventListener('sasuja_lang_change', handleLangChangeEvent);
    };
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    }
  };

  const handleLangChange = (selected: Locale) => {
    setLang(selected);
    localStorage.setItem('sasuja_lang', selected);
    setDropdownOpen(false);
    // 변경 이벤트 전파
    window.dispatchEvent(new CustomEvent('sasuja_lang_change', { detail: selected }));
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        window.dispatchEvent(new Event('sasuja_logout'));
        navigate('/');
      }
    } catch (e) {
      console.error('로그아웃 실패:', e);
    }
  };

  const formatPoints = (points: number) => {
    if (lang === 'ko') {
      return `${points.toLocaleString()}P (${points.toLocaleString()}원)`;
    } else if (lang === 'en') {
      const usd = (points / EXCHANGE_RATE).toFixed(2);
      return `${points.toLocaleString()}P ($${usd})`;
    } else {
      const jpy = Math.round(points / (EXCHANGE_RATE / 100));
      return `${points.toLocaleString()}P (¥${jpy.toLocaleString()})`;
    }
  };

  const t = translations[lang] || translations['ko'];

  return (
    <header className="bg-slate-900 border-b border-amber-900/30 text-amber-50 sticky top-0 z-40 shadow-lg">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo & Tag */}
        <Link to="/" className="flex items-center space-x-2 sm:space-x-3 shrink-0 min-w-0">
          <SasujaLogo size={36} className="w-9 h-9 sm:w-10 sm:h-10 shrink-0" />
          <div className="shrink-0 min-w-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-amber-100 font-serif whitespace-nowrap shrink-0">
                사수자패트
              </h1>
              <span className="text-[10px] sm:text-xs text-amber-400 font-sans font-normal border border-amber-500/40 px-1.5 py-0.5 rounded whitespace-nowrap shrink-0">
                SasujaFate
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-amber-300/80 font-sans hidden sm:block whitespace-nowrap">
              3대 동양 철학 크로스 검증
            </p>
          </div>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          
          {/* 언어 드롭다운 */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-0.5 sm:gap-1 px-2 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] sm:text-xs font-semibold text-slate-300 hover:text-amber-300 hover:border-amber-500/30 transition-all cursor-pointer"
            >
              🌐 <span className="uppercase">{lang}</span> <span className="text-[8px] sm:text-[10px] opacity-60">▼</span>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-28 bg-slate-900 border border-slate-800 rounded-2xl p-1 shadow-2xl z-50">
                {['ko', 'en', 'ja', 'zh', 'vi'].map((l) => (
                  <button
                    key={l}
                    onClick={() => handleLangChange(l as Locale)}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-xl cursor-pointer uppercase ${
                      lang === l ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-850'
                    }`}
                  >
                    {l === 'ko' ? '한국어' : l === 'en' ? 'English' : l === 'ja' ? '日本語' : l === 'zh' ? '简体中文' : 'Tiếng Việt'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 인증 상태별 영역 */}
          {user ? (
            <div className="flex items-center space-x-1 sm:space-x-2.5">
              {/* 포인트 */}
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] sm:text-xs font-bold text-amber-300">
                🪙 <span className="hidden md:inline">{formatPoints(user.points)}</span>
                <span className="md:hidden">{user.points.toLocaleString()}P</span>
              </div>
              
              {/* 마이페이지 */}
              <Link
                to="/mypage"
                className="text-[10px] sm:text-xs px-2.5 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300 hover:text-amber-300 transition-all font-semibold"
              >
                {t.mypage || '마이페이지'}
              </Link>

              {/* 로그아웃 */}
              <button
                onClick={handleLogout}
                className="text-[10px] sm:text-xs text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
              >
                {t.logout || '로그아웃'}
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-[10px] sm:text-xs px-3 py-1.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-md shadow-amber-600/10 transition-all cursor-pointer"
            >
              {t.login || '로그인'}
            </Link>
          )}

          {/* 해금/결제 구분 배지 */}
          {isUnlocked ? (
            <span className="hidden md:inline-flex items-center px-2 py-1 rounded-full text-[11px] sm:text-xs font-medium bg-amber-950 text-amber-300 border border-amber-700/60 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400 shrink-0" />
              <span>진단 잠금 해제됨</span>
            </span>
          ) : (
            <span className="hidden md:inline-flex items-center px-2 py-1 rounded-full text-[11px] sm:text-xs font-medium bg-slate-800 text-amber-300/90 border border-amber-900/40">
              <CreditCard className="w-3.5 h-3.5 mr-1 text-amber-400 shrink-0" />
              <span>건당 과금 결제형</span>
            </span>
          )}

          <button
            onClick={onOpenFeedback}
            className="p-1.5 sm:p-2 rounded-lg text-amber-200/80 hover:text-amber-100 hover:bg-slate-800 transition-colors shrink-0"
            title="의견 남기기"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            onClick={onReset}
            className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-200 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/50 transition-all shadow-xs whitespace-nowrap shrink-0"
            title="모든 진단 데이터 및 결제 상태 초기화"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:mr-1.5 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">다시 진단하기</span>
            <span className="sm:hidden">초기화</span>
          </button>

        </div>
      </div>
    </header>
  );
};
