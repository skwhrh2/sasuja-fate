import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Locale, translations } from "../utils/locales";

export default function LoginPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [lang, setLang] = useState<Locale>("ko");
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [hasRefLink, setHasRefLink] = useState(false);

  useEffect(() => {
    // 1. 언어 설정 가져오기
    const savedLang = localStorage.getItem("sasuja_lang") as Locale;
    if (savedLang) setLang(savedLang);

    const handleLangChange = (e: any) => {
      setLang(e.detail);
    };
    window.addEventListener("sasuja_lang_change", handleLangChange);

    // 2. 추천인 코드 감지
    const savedRef = localStorage.getItem("sasuja_ref");
    if (savedRef) {
      setReferredBy(savedRef);
      setHasRefLink(true);
    }

    return () => {
      window.removeEventListener("sasuja_lang_change", handleLangChange);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        window.dispatchEvent(new Event("sasuja_login"));
        alert(translations[lang].loginSuccess);
        
        const hasReportData = sessionStorage.getItem("saju_report_data");
        if (hasReportData) {
          navigate("/report");
        } else {
          navigate("/");
        }
      } else {
        alert(data.error || "로그인에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = translations[lang];

    if (!email || !password || !name) {
      alert(t.fillAllFields);
      return;
    }

    if (password !== passwordConfirm) {
      alert(t.passwordMismatch);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          referredBy: referredBy || null,
          locale: lang,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(t.registerSuccess);
        localStorage.removeItem("sasuja_ref");
        setHasRefLink(false);
        setReferredBy("");
        
        setPassword("");
        setPasswordConfirm("");
        setActiveTab("login");
      } else {
        alert(data.error || "회원가입에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleKakaoLogin = () => {
    // Kakao Client ID: support both Vite env and window configuration
    const clientId = ((import.meta as any).env?.VITE_KAKAO_CLIENT_ID) || "test_kakao_client_id_12345";
    const redirectUri = `${window.location.origin}/api/auth/kakao/callback`;
    
    if (referredBy) {
      document.cookie = `sasuja_ref=${encodeURIComponent(referredBy.trim().toUpperCase())}; path=/; max-age=1800; SameSite=Lax`;
    }
    
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
    
    console.log(`[DEBUG] 카카오 로그인 요청: RedirectUri=${redirectUri}`);
    window.location.href = kakaoAuthUrl;
  };

  const t = translations[lang];

  return (
    <div className="min-h-[calc(100vh-68px)] bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full flex flex-col gap-6">
        
        {/* 브랜드 헤더 */}
        <div className="text-center flex flex-col items-center gap-2">
          <img 
            src="/logo.png" 
            alt="Sasuja Logo" 
            className="w-16 h-16 object-contain rounded-full shadow-2xl mb-2" 
          />
          <h2 className="text-3xl font-serif tracking-wide text-amber-100/90 leading-tight">
            {t.title}
          </h2>
          <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">
            {t.subtitle}
          </p>
        </div>

        {/* 메인 로그인/가입 카드 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-md">
          {/* 네비게이션 탭 */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-3xl border border-slate-800/60 mb-6">
            <button
              onClick={() => setActiveTab("login")}
              className={`py-2.5 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
                activeTab === "login"
                  ? "bg-amber-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t.login}
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`py-2.5 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
                activeTab === "register"
                  ? "bg-amber-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t.register}
            </button>
          </div>

          {/* 로그인 폼 */}
          {activeTab === "login" && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-400 pl-1">{t.email}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full px-5 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-400 pl-1">{t.password}</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3.5 px-6 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? "..." : t.login}
              </button>
            </form>
          )}

          {/* 회원가입 폼 */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-400 pl-1">{t.name}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Hong Gil Dong"
                  className="w-full px-5 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-400 pl-1">{t.email}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full px-5 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-400 pl-1">{t.password}</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-400 pl-1">{t.passwordConfirm}</label>
                <input
                  type="password"
                  required
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* 추천인 코드 */}
              <div className="flex flex-col gap-2 relative">
                <label className="text-xs font-medium text-slate-400 pl-1 flex items-center justify-between">
                  <span>
                    {t.referralCodeLabel} <span className="text-[10px] text-amber-500/85">({lang === "ko" ? "선택사항" : "Optional"})</span>
                  </span>
                  {hasRefLink && (
                    <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full tracking-wider">
                      ✔️ {t.referralCodeDetected}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={referredBy}
                  disabled={hasRefLink}
                  onChange={(e) => setReferredBy(e.target.value)}
                  placeholder="REF-XXXXXX"
                  className="w-full px-5 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase font-mono tracking-wider"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3.5 px-6 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? "..." : t.register}
              </button>
            </form>
          )}

          {/* 소셜 로그인 구분선 */}
          <div className="relative flex items-center justify-center my-6">
            <div className="border-t border-slate-800 w-full"></div>
            <span className="absolute bg-slate-900 px-3 text-[10px] text-slate-500 uppercase tracking-widest">
              OR
            </span>
          </div>

          {/* 카카오 간편가입/로그인 */}
          <button
            onClick={handleKakaoLogin}
            className="w-full py-3.5 px-6 rounded-full bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#191919] font-semibold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01]"
          >
            <span className="text-base">💬</span>
            {lang === "ko" ? "카카오로 3초 만에 시작하기" : lang === "en" ? "Start with Kakao" : lang === "ja" ? "Kakaoでログイン" : lang === "zh" ? "使用 Kakao 快捷登录" : "Bắt đầu với Kakao"}
          </button>
        </div>

        {/* 하단 홈 링크 */}
        <div className="text-center">
          <Link to="/" className="text-xs text-slate-500 hover:text-amber-300 transition-colors">
            {t.backToHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
