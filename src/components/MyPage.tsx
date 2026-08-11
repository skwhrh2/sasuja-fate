import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Locale, translations } from "../utils/locales";

const EXCHANGE_RATE = 1500; // 1 USD = 1500 KRW
const KR_WITHHOLDING_TAX = 0.033; // 3.3% 한국 사업소득세
const GLOBAL_WITHHOLDING_TAX = 0.10; // 10.0% 글로벌 원천세

export default function MyPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<Locale>("ko");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Stats data
  const [friends, setFriends] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  // Withdrawal form
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(30000);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  useEffect(() => {
    // 1. 언어 설정 가져오기
    const savedLang = localStorage.getItem("sasuja_lang") as Locale;
    if (savedLang) setLang(savedLang);

    const handleLangChange = (e: any) => {
      setLang(e.detail);
    };
    window.addEventListener("sasuja_lang_change", handleLangChange);

    // 2. 유저 정보 조회 및 리다이렉트 처리
    initMyPage();

    return () => {
      window.removeEventListener("sasuja_lang_change", handleLangChange);
    };
  }, []);

  const initMyPage = async () => {
    setLoading(true);
    try {
      const userRes = await fetch("/api/auth/me");
      if (!userRes.ok) {
        navigate("/login");
        return;
      }
      const userData = await userRes.json();
      if (userData.success) {
        setUser(userData.user);
        await fetchStats();
      } else {
        navigate("/login");
      }
    } catch (e) {
      console.error(e);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/referral/stats");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setFriends(data.data.friends || []);
          setHistory(data.data.history || []);
          setWithdrawals(data.data.withdrawals || []);
        }
      }
    } catch (e) {
      console.error("통계 로딩 실패:", e);
    }
  };

  const handleCopyLink = () => {
    if (!user) return;
    const inviteLink = `${window.location.origin}/login?ref=${user.referralCode}`;
    navigator.clipboard.writeText(inviteLink);
    alert(translations[lang].linkCopied);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = translations[lang];

    if (!withdrawAmount || !bankName || !accountNumber || !accountHolder) {
      alert(t.fillAllFields);
      return;
    }

    if (withdrawAmount < 30000) {
      alert(t.withdrawalMinAlert);
      return;
    }

    if (user.points < withdrawAmount) {
      alert(t.invalidWithdrawalAmount);
      return;
    }

    setSubmittingWithdraw(true);
    try {
      const res = await fetch("/api/referral/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: withdrawAmount,
          bankName,
          accountNumber,
          accountHolder,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(t.withdrawalSuccess);
        setWithdrawOpen(false);
        setWithdrawAmount(30000);
        setBankName("");
        setAccountNumber("");
        setAccountHolder("");
        initMyPage();
        window.dispatchEvent(new Event("sasuja_login"));
      } else {
        alert(data.error || "인출 신청에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("서버 연결에 실패했습니다.");
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  const t = translations[lang];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <span className="animate-pulse text-amber-300">Loading Sasuja Hub...</span>
      </div>
    );
  }

  // 포인트 환산 표시 헬퍼
  const formatPoints = (points: number) => {
    if (lang === "ko") {
      return `${points.toLocaleString()}P (${points.toLocaleString()}원)`;
    } else if (lang === "en") {
      const usd = (points / EXCHANGE_RATE).toFixed(2);
      return `${points.toLocaleString()}P ($${usd})`;
    } else {
      const jpy = Math.round(points / (EXCHANGE_RATE / 100));
      return `${points.toLocaleString()}P (¥${jpy.toLocaleString()})`;
    }
  };

  // 실시간 세율 계산
  const taxRate = lang === "ko" ? KR_WITHHOLDING_TAX : GLOBAL_WITHHOLDING_TAX;
  const currentTax = Math.round(withdrawAmount * taxRate);
  const netWithdraw = withdrawAmount - currentTax;

  const formatTaxDetails = () => {
    if (lang === "ko") {
      return {
        tax: `${currentTax.toLocaleString()}원`,
        net: `${netWithdraw.toLocaleString()}원`,
        rate: "3.3%",
      };
    } else if (lang === "en") {
      const usdTax = (currentTax / EXCHANGE_RATE).toFixed(2);
      const usdNet = (netWithdraw / EXCHANGE_RATE).toFixed(2);
      return {
        tax: `$${usdTax}`,
        net: `$${usdNet}`,
        rate: "10.0%",
      };
    } else {
      const jpyTax = Math.round(currentTax / (EXCHANGE_RATE / 100));
      const jpyNet = Math.round(netWithdraw / (EXCHANGE_RATE / 100));
      return {
        tax: `¥${jpyTax.toLocaleString()}`,
        net: `¥${jpyNet.toLocaleString()}`,
        rate: "10.0%",
      };
    }
  };

  const taxDetails = formatTaxDetails();

  return (
    <div className="min-h-[calc(100vh-68px)] bg-slate-950 text-slate-100 p-6 flex justify-center">
      <div className="max-w-3xl w-full flex flex-col gap-6 py-6">
        
        {/* 헤더 */}
        <div>
          <h1 className="text-3xl font-serif text-amber-100/90">{t.referralHubTitle}</h1>
          <p className="text-xs text-slate-400 mt-1">{user?.name} ({user?.email})</p>
        </div>

        {/* 상단 2열 정보 (추천인 코드 / 포인트지갑) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 코드 카드 */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-6 flex flex-col justify-between shadow-xl backdrop-blur-sm">
            <div>
              <h3 className="text-sm font-semibold text-slate-400 mb-2">{t.myReferralCode}</h3>
              <div className="font-mono text-2xl font-bold text-amber-300 tracking-wider bg-slate-950/70 py-3 px-5 rounded-2xl border border-slate-800 inline-block">
                {user?.referralCode}
              </div>
            </div>
            <button
              onClick={handleCopyLink}
              className="mt-6 w-full py-3.5 px-6 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              🔗 {t.copyInviteLink}
            </button>
          </div>

          {/* 지갑 카드 */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-6 flex flex-col justify-between shadow-xl backdrop-blur-sm">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-1">{t.currentPoints}</h3>
                <span className="text-3xl font-bold text-white font-mono">
                  {formatPoints(user?.points || 0)}
                </span>
              </div>
              <div className="border-t border-slate-800/80 pt-3">
                <h3 className="text-xs font-semibold text-slate-500 mb-0.5">{t.totalEarned}</h3>
                <span className="text-sm text-amber-300/80 font-mono">
                  {formatPoints(user?.totalEarnedPoints || 0)}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (user?.points < 30000) {
                  alert(t.withdrawalMinAlert);
                } else {
                  setWithdrawOpen(true);
                }
              }}
              disabled={user?.points < 30000}
              className="mt-6 w-full py-3.5 px-6 rounded-full bg-slate-950 border border-slate-800 hover:border-amber-600/55 hover:text-amber-300 text-slate-300 font-medium text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              💸 {t.requestWithdrawal}
            </button>
          </div>
        </div>

        {/* 추천 가입 친구 목록 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-6 shadow-xl">
          <h3 className="text-base font-semibold text-amber-100/90 mb-4">👥 {t.referredFriends}</h3>
          {friends.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">{t.noFriends}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs">
                    <th className="pb-3">{t.name}</th>
                    <th className="pb-3">{t.friendEmail}</th>
                    <th className="pb-3 text-right">{t.joinedDate}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {friends.map((friend, i) => (
                    <tr key={i} className="hover:bg-slate-850/40">
                      <td className="py-3 font-medium text-slate-200">{friend.name}</td>
                      <td className="py-3 font-mono">{friend.email}</td>
                      <td className="py-3 text-right text-xs text-slate-400">
                        {new Date(friend.createdAt).toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 포인트 히스토리 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-6 shadow-xl">
          <h3 className="text-base font-semibold text-amber-100/90 mb-4">🪙 {t.pointHistory}</h3>
          {history.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">{t.noHistory}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {history.map((item, i) => {
                const isPlus = item.amount > 0;
                const typeLabel = (t as any)[`type_${item.type}`] || item.type;
                return (
                  <div
                    key={i}
                    className="flex justify-between items-center p-4 rounded-2xl bg-slate-950/40 border border-slate-800"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-slate-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                      <span className="text-xs bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full inline-block w-fit">
                        {typeLabel}
                      </span>
                      <span className="text-sm text-slate-300 font-medium mt-1">
                        {item.description}
                      </span>
                    </div>
                    <span
                      className={`text-base font-mono font-bold ${
                        isPlus ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isPlus ? "+" : ""}
                      {item.amount.toLocaleString()}P
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* 출금 신청 팝업 모달 */}
      {withdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative">
            <h3 className="text-xl font-bold text-amber-100 mb-2">{t.withdrawalTitle}</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              {t.withdrawalDesc}
            </p>

            <form onSubmit={handleWithdrawSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 pl-1">{t.withdrawalAmount}</label>
                <input
                  type="number"
                  required
                  min={30000}
                  max={user?.points || 0}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full px-5 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-slate-200 text-sm font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* 실수령액 계산결과 */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs flex flex-col gap-2">
                <div className="flex justify-between text-slate-400">
                  <span>{t.withholdingTax} ({taxDetails.rate})</span>
                  <span className="text-rose-400 font-mono">-{taxDetails.tax}</span>
                </div>
                <div className="flex justify-between text-slate-200 font-bold border-t border-slate-800/80 pt-2 text-sm">
                  <span>{t.netAmount}</span>
                  <span className="text-emerald-400 font-mono">{taxDetails.net}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 pl-1">{t.bankName}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kakao Bank, Paypal"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-5 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 pl-1">{t.accountNumber}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 123-456-7890 / paypal@email.com"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-5 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-slate-200 text-sm font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 pl-1">{t.accountHolder}</label>
                <input
                  type="text"
                  required
                  placeholder="Name of account holder"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full px-5 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setWithdrawOpen(false)}
                  className="flex-1 py-3 rounded-full bg-slate-950 border border-slate-800 text-slate-400 text-xs font-semibold hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWithdraw}
                  className="flex-1 py-3 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submittingWithdraw ? "..." : t.submitWithdrawal}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
