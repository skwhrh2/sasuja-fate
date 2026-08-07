"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("정밀한 진단을 시작합니다...");
  const [formData, setFormData] = useState({
    name: "",
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    birthHour: "",
    birthMinute: "",
    isLunar: "solar", // solar, lunar, leapLunar (양력, 음력 평달, 음력 윤달)
  });

  const years = Array.from({ length: 100 }, (_, i) => String(new Date().getFullYear() - i));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  const loadingMessages = [
    "정밀한 진단을 위한 데이터를 수집 중입니다...",
    "사주 팔자의 기운을 분석하고 있습니다...",
    "동양 수리학의 파동을 계산 중입니다...",
    "자미두수 명반을 정렬하는 중입니다...",
    "운명의 마스터키를 생성하고 있습니다...",
    "마지막으로 따뜻한 조언을 다듬고 있습니다..."
  ];

  // 로딩 메시지 순환 로직
  useEffect(() => {
    if (!loading) return;
    
    let msgIdx = 0;
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[msgIdx]);
    }, 2000);

    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadingMessage("정밀한 진단을 시작합니다...");

    try {
      const locale = typeof window !== "undefined" && navigator.language.startsWith("ko") ? "ko" : "en";
      const birthDate = `${formData.birthYear}-${formData.birthMonth}-${formData.birthDay}`;
      
      // birthHour와 birthMinute가 지정된 경우에만 birthTime 조합 ("HH:MM")
      let birthTime = "";
      if (formData.birthHour) {
        const min = formData.birthMinute || "00";
        birthTime = `${formData.birthHour}:${min}`;
      }

      const payload = {
        name: formData.name,
        birthDate,
        birthTime,
        isLunar: formData.isLunar,
        locale,
      };

      console.log("[DEBUG] Submitting form payload:", JSON.stringify(payload, null, 2));

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
        const errJson = await response.json().catch(() => ({}));
        alert(`분석 중 서버 오류가 발생했습니다: ${errJson.error || "상세 오류 없음"}`);
      }
    } catch (error) {
      console.error(error);
      alert("서버 통신 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 시 선택 변경 시 분 초기화 및 연동 처리
  const handleHourChange = (hour: string) => {
    setFormData((prev) => ({
      ...prev,
      birthHour: hour,
      // 시를 '시 선택(빈값)'으로 돌리면 분도 비워버림, 그렇지 않으면 '00'으로 기본 설정
      birthMinute: hour ? (prev.birthMinute || "00") : "",
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <main className="max-w-3xl w-full flex flex-col items-center text-center gap-6 py-12">
        
        {/* Premium Essence Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-xs font-semibold text-amber-300/90 tracking-widest animate-pulse">
          ✨ 군더더기 없는 3대 운명학 핵심 추출
        </div>

        <h1 className="text-4xl sm:text-6xl font-serif tracking-wide text-amber-100/95 leading-tight">
          사수자패트 (SasujaFate)
        </h1>

        <p className="text-base sm:text-lg text-slate-300/90 max-w-xl leading-relaxed bg-slate-900/50 p-6 rounded-[2rem] border border-slate-800/80 shadow-2xl backdrop-blur-md">
          복잡한 한문과 길을 잃게 만드는 미신적 군더더기를 전부 걷어냈습니다.<br />
          오직 <span className="font-bold text-amber-300">사주 · 수리학 · 자미두수</span>의 핵심 정수만을 추출하여, 
          세 가지 고대 지혜의 교집합이 가리키는 <span className="text-white font-semibold underline decoration-amber-500/50 decoration-2 underline-offset-4">명확한 운명의 마스터키</span>를 선사합니다.
        </p>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-[2rem] p-8 shadow-2xl backdrop-blur-md text-left gap-6 flex flex-col"
        >
          <h2 className="text-xl font-medium text-amber-100 border-b border-slate-700 pb-4 text-center">
            🔮 운명 진단 시작하기
          </h2>

          {/* 성함 입력 */}
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

          {/* 양력/음력 선택 */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-slate-400 pl-1">양력/음력 구분</label>
            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-3xl border border-slate-800">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isLunar: "solar" })}
                className={`py-2 px-3 text-sm font-medium rounded-2xl transition-all cursor-pointer ${
                  formData.isLunar === "solar"
                    ? "bg-amber-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                양력 (Solar)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isLunar: "lunar" })}
                className={`py-2 px-3 text-sm font-medium rounded-2xl transition-all cursor-pointer ${
                  formData.isLunar === "lunar"
                    ? "bg-amber-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                음력 평달
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isLunar: "leapLunar" })}
                className={`py-2 px-3 text-sm font-medium rounded-2xl transition-all cursor-pointer ${
                  formData.isLunar === "leapLunar"
                    ? "bg-amber-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                음력 윤달
              </button>
            </div>
          </div>

          {/* 생년월일 선택 */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-slate-400 pl-1">생년월일</label>
            <div className="grid grid-cols-3 gap-3">
              <select 
                required
                value={formData.birthYear} 
                onChange={(e) => setFormData({...formData, birthYear: e.target.value})} 
                className="w-full px-3 py-3.5 rounded-3xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
              >
                <option value="">년</option>
                {years.map(y => <option key={y} value={y}>{y}년</option>)}
              </select>
              <select 
                required
                value={formData.birthMonth} 
                onChange={(e) => setFormData({...formData, birthMonth: e.target.value})} 
                className="w-full px-3 py-3.5 rounded-3xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
              >
                <option value="">월</option>
                {months.map(m => <option key={m} value={m}>{m}월</option>)}
              </select>
              <select 
                required
                value={formData.birthDay} 
                onChange={(e) => setFormData({...formData, birthDay: e.target.value})} 
                className="w-full px-3 py-3.5 rounded-3xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
              >
                <option value="">일</option>
                {days.map(d => <option key={d} value={d}>{d}일</option>)}
              </select>
            </div>
            <p className="text-[11px] text-slate-500 pl-1">※ 선택하신 역법에 따라 정확하게 윤달 및 기운 변환</p>
          </div>

          {/* 태어난 시간 (드롭다운 개선) */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-slate-400 pl-1">태어난 시간 (선택)</label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={formData.birthHour}
                onChange={(e) => handleHourChange(e.target.value)}
                className="w-full px-5 py-3.5 rounded-3xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
              >
                <option value="">시간 모름 (선택안함)</option>
                {hours.map((h) => <option key={h} value={h}>{h}시</option>)}
              </select>
              <select
                value={formData.birthMinute}
                disabled={!formData.birthHour}
                onChange={(e) => setFormData({ ...formData, birthMinute: e.target.value })}
                className="w-full px-5 py-3.5 rounded-3xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">분 선택</option>
                {minutes.map((m) => <option key={m} value={m}>{m}분</option>)}
              </select>
            </div>
            <p className="text-[11px] text-slate-500 pl-1">※ 자미두수와 상세 사주 시(時) 분석을 위한 필수 입력 정보</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-4 px-6 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-medium shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{loadingMessage}</span>
              </div>
            ) : (
              "무료 운명 진단 시작하기"
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
