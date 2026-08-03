"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    birthTime: "",
  });

  const years = Array.from({ length: 100 }, (_, i) => String(new Date().getFullYear() - i));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const locale = typeof window !== "undefined" && navigator.language.startsWith("ko") ? "ko" : "en";
      const birthDate = `${formData.birthYear}-${formData.birthMonth}-${formData.birthDay}`;
      
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, birthDate, locale, isLunar: "solar" }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          sessionStorage.setItem("saju_report_data", JSON.stringify(result));
          router.push("/report");
        } else {
          alert(`분석 실패: ${result.error || "알 수 없는 오류"}`);
        }
      } else {
        alert("분석 중 서버 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error(error);
      alert("서버 통신 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <main className="max-w-3xl w-full flex flex-col items-center text-center gap-8 py-12">
        <h1 className="text-4xl sm:text-6xl font-serif tracking-wide text-amber-100/95 leading-tight">
          사수자패트 (SasujaFate)
        </h1>

        <p className="text-lg sm:text-xl text-amber-200/80 max-w-xl leading-relaxed bg-slate-800/40 p-4 rounded-2xl border border-amber-500/20">
          <span className="font-bold text-amber-300">사주, 수리학, 자미두수.</span> 3가지 운명학을 통계 내어<br />
          당신의 삶을 바꿀 마스터키를 제공합니다.
        </p>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-[2rem] p-8 shadow-2xl backdrop-blur-md text-left gap-6 flex flex-col"
        >
          <h2 className="text-xl font-medium text-amber-100 border-b border-slate-700 pb-4 text-center">
            🔮 운명 진단 시작하기
          </h2>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-slate-400 pl-1">성함</label>
            <input
              type="text"
              required
              placeholder="이름을 입력하세요"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-5 py-3.5 rounded-3xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-slate-400 pl-1">생년월일</label>
            <div className="grid grid-cols-3 gap-3">
              <select value={formData.birthYear} onChange={(e) => setFormData({...formData, birthYear: e.target.value})} className="w-full px-3 py-3.5 rounded-3xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer">
                <option value="">년</option>
                {years.map(y => <option key={y} value={y}>{y}년</option>)}
              </select>
              <select value={formData.birthMonth} onChange={(e) => setFormData({...formData, birthMonth: e.target.value})} className="w-full px-3 py-3.5 rounded-3xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer">
                <option value="">월</option>
                {months.map(m => <option key={m} value={m}>{m}월</option>)}
              </select>
              <select value={formData.birthDay} onChange={(e) => setFormData({...formData, birthDay: e.target.value})} className="w-full px-3 py-3.5 rounded-3xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer">
                <option value="">일</option>
                {days.map(d => <option key={d} value={d}>{d}일</option>)}
              </select>
            </div>
            <p className="text-[11px] text-slate-500 pl-1">※ 입력된 날짜를 기준으로 동양 역법 자동 계산</p>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-slate-400 pl-1">태어난 시간 (선택)</label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={formData.birthTime ? formData.birthTime.split(":")[0] : ""}
                onChange={(e) => {
                  const h = e.target.value;
                  const m = formData.birthTime ? formData.birthTime.split(":")[1] || "00" : "00";
                  setFormData({ ...formData, birthTime: h ? `${h}:${m}` : "" });
                }}
                className="w-full px-5 py-3.5 rounded-3xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
              >
                <option value="">시 선택</option>
                {hours.map((h) => <option key={h} value={h}>{h}시</option>)}
              </select>
              <select
                value={formData.birthTime ? formData.birthTime.split(":")[1] || "" : ""}
                disabled={!formData.birthTime}
                onChange={(e) => {
                  const h = formData.birthTime ? formData.birthTime.split(":")[0] || "00" : "00";
                  setFormData({ ...formData, birthTime: `${h}:${e.target.value || "00"}` });
                }}
                className="w-full px-5 py-3.5 rounded-3xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer disabled:opacity-50"
              >
                <option value="">분 선택</option>
                {minutes.map((m) => <option key={m} value={m}>{m}분</option>)}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-4 px-6 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-medium shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? "진단 중..." : "무료 운명 진단 시작하기"}
          </button>
        </form>
      </main>
    </div>
  );
}
