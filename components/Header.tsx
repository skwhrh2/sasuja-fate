"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Locale, translations } from "../lib/locales";
import { EXCHANGE_RATE } from "../lib/constants";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [lang, setLang] = useState<Locale>("ko");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // 로컬스토리지 언어 설정 감지 및 유저 프로필 로드
  useEffect(() => {
    const savedLang = localStorage.getItem("sasuja_lang") as Locale;
    if (savedLang) {
      setLang(savedLang);
    } else {
      const browserLang = navigator.language.substring(0, 2);
      const initialLang: Locale = 
        browserLang === "ja" ? "ja" : 
        browserLang === "zh" ? "zh" : 
        browserLang === "vi" ? "vi" : 
        browserLang === "ko" ? "ko" : "en";
      setLang(initialLang);
      localStorage.setItem("sasuja_lang", initialLang);
    }

    // 유저 정보 조회
    fetchUser();

    // 로그인 이벤트 수신 (로그인 시 즉시 반영용)
    const handleLoginEvent = () => fetchUser();
    window.addEventListener("sasuja_login", handleLoginEvent);
    return () => window.removeEventListener("sasuja_login", handleLoginEvent);
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
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
    localStorage.setItem("sasuja_lang", selected);
    setDropdownOpen(false);
    // 변경 이벤트 전파
    window.dispatchEvent(new CustomEvent("sasuja_lang_change", { detail: selected }));
    router.refresh();
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setUser(null);
        // 로그아웃 이벤트 전파
        window.dispatchEvent(new Event("sasuja_logout"));
        router.push("/");
      }
    } catch (e) {
      console.error("로그아웃 실패:", e);
    }
  };

  const t = translations[lang];

  // 포인트 환산 표시 유틸리티
  const formatPoints = (points: number) => {
    if (lang === "ko") {
      return `${points.toLocaleString()}P (${points.toLocaleString()}원)`;
    } else if (lang === "en") {
      const usd = (points / EXCHANGE_RATE).toFixed(2);
      return `${points.toLocaleString()}P ($${usd})`;
    } else if (lang === "zh") {
      const cny = (points / (EXCHANGE_RATE / 5)).toFixed(1); // 1위안 = 200원 상당 대입
      return `${points.toLocaleString()}P (¥${cny})`;
    } else if (lang === "vi") {
      const vnd = Math.round(points * 16.5); // 1원 = 16.5동 대입
      return `${points.toLocaleString()}P (${vnd.toLocaleString()}₫)`;
    } else {
      const jpy = Math.round(points / (EXCHANGE_RATE / 100));
      return `${points.toLocaleString()}P (¥${jpy.toLocaleString()})`;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/80 border-b border-slate-900/60 backdrop-blur-lg">
      <div className="max-w-4xl mx-auto px-3.5 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
        
        {/* 로고 영역 (모바일 폰트 크기 및 마진 축소로 반응형 완성) */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <img 
            src="/logo.png" 
            alt="Sasuja Logo" 
            className="w-7 h-7 sm:w-8 h-8 object-contain rounded-full shadow-md shadow-amber-500/10 group-hover:scale-105 transition-all" 
          />
          <div>
            <span className="text-xs sm:text-lg font-serif font-semibold tracking-wider text-amber-100/90 group-hover:text-amber-300 transition-colors">
              {t.title}
            </span>
            <span className="hidden md:inline text-[9px] text-slate-500 ml-2 font-mono uppercase tracking-widest">
              {t.subtitle}
            </span>
          </div>
        </Link>
 
        {/* 네비게이션 & 액션 영역 (모바일 갭 축소) */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          
          {/* 언어 선택 드롭다운 (모바일 크기 콤팩트 타이트화) */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-0.5 sm:gap-1 px-2 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] sm:text-xs font-semibold text-slate-300 hover:text-amber-300 hover:border-amber-500/30 transition-all cursor-pointer"
            >
              🌐 <span className="uppercase">{lang}</span> <span className="text-[8px] sm:text-[10px] opacity-60">▼</span>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-28 bg-slate-900 border border-slate-800 rounded-2xl p-1 shadow-2xl z-50">
                <button
                  onClick={() => handleLangChange("ko")}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-xl cursor-pointer ${
                    lang === "ko" ? "bg-amber-600 text-white" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  한국어
                </button>
                <button
                  onClick={() => handleLangChange("en")}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-xl cursor-pointer ${
                    lang === "en" ? "bg-amber-600 text-white" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => handleLangChange("ja")}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-xl cursor-pointer ${
                    lang === "ja" ? "bg-amber-600 text-white" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  日本語
                </button>
                <button
                  onClick={() => handleLangChange("zh")}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-xl cursor-pointer ${
                    lang === "zh" ? "bg-amber-600 text-white" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  简体中文
                </button>
                <button
                  onClick={() => handleLangChange("vi")}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-xl cursor-pointer ${
                    lang === "vi" ? "bg-amber-600 text-white" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  Tiếng Việt
                </button>
              </div>
            )}
          </div>
 
          {/* 인증 상태별 버튼 (모바일 콤팩트 가로폭 최적화) */}
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* 내 포인트 정보 (모바일에서는 글자 없이 포인트 숫자로만 콤팩트 축소) */}
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] sm:text-xs font-bold text-amber-300">
                🪙 <span className="hidden sm:inline">{formatPoints(user.points)}</span>
                <span className="sm:hidden">{user.points.toLocaleString()}P</span>
              </div>
 
              {/* 마이페이지 버튼 */}
              <Link
                href="/mypage"
                className="text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 transition-all font-semibold"
              >
                {t.mypage}
              </Link>
 
              {/* 로그아웃 버튼 */}
              <button
                onClick={handleLogout}
                className="text-[10px] sm:text-xs text-slate-500 hover:text-red-400 transition-colors cursor-pointer px-1 py-1"
              >
                {t.logout}
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-[10px] sm:text-xs px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-md shadow-amber-600/10 transition-all cursor-pointer"
            >
              {t.login}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
