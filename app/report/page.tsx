"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CoachingData {
  score: number;
  summary: string;
  bazi_preview: string;
  bazi_analysis: string;
  numerology_analysis: string;
  ziwei_analysis: string;
  action_plans: string[];
}

export default function ReportPage() {
  const [coachingData, setCoachingData] = useState<CoachingData | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loadingQA, setLoadingQA] = useState(false);

  // 환율 설정
  const isKo = typeof window !== "undefined" && navigator.language.startsWith("ko");
  const priceReport = isKo ? "10,500원" : "$6.99";
  const priceQA = isKo ? "1,500" : "$1.00";

  useEffect(() => {
    const cachedData = sessionStorage.getItem("saju_report_data");
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        if (parsed.success && parsed.ai_coaching) {
          setCoachingData(parsed.ai_coaching);
        }
      } catch (err) {
        console.error("[ERROR] Failed to parse cached report data:", err);
      }
    }
  }, []);

  const handlePayment = () => {
    alert(`${priceReport} 결제가 완료되었습니다! 운명의 모든 비밀이 해제됩니다.`);
    setIsUnlocked(true);
  };

  const handleAskQuestion = async () => {
    if (!question) return;
    setLoadingQA(true);
    try {
      const response = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, context: coachingData }),
      });
      const data = await response.json();
      if (data.success) {
        setAnswer(data.answer);
        setQuestion(""); // 질문 후 입력창 비우기
      } else {
        alert("비책 문의에 실패했습니다. 다시 시도해 주세요.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQA(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex justify-center">
      <div className="max-w-2xl w-full flex flex-col gap-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
             <img src="/logo.jpg" alt="SasujaFate Logo" className="w-12 h-12 rounded-full border border-amber-500/30" />
             <h1 className="text-3xl font-serif text-amber-100/90">당신의 운명 진단 결과</h1>
          </div>
          <Link href="/" className="text-sm text-slate-400 hover:text-amber-300 transition-colors">← 다시 진단</Link>
        </div>
        {/* Free Tier */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-amber-300 mb-4">📜 나의 사주 맛보기</h2>
          <p className="text-sm text-slate-300 italic">{coachingData?.bazi_preview || "진단 중..."}</p>
        </div>

        {/* Premium Content (Locked) */}
        <div className="relative">
          <div className={`flex flex-col gap-4 ${!isUnlocked ? 'blur-[8px] pointer-events-none' : ''}`}>
            <h2 className="text-xl font-bold text-amber-400">✨ 운명의 비밀 (심화 분석)</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="font-bold text-amber-300 mb-2">사주 정밀 진단</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{coachingData?.bazi_analysis}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="font-bold text-amber-300 mb-2">수리학 상세</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{coachingData?.numerology_analysis}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="font-bold text-amber-300 mb-2">자미두수 상세</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{coachingData?.ziwei_analysis}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="font-bold text-amber-300 mb-2">운명의 마스터키</h3>
              <p className="text-slate-300 mb-4">{coachingData?.summary}</p>
              <h3 className="font-bold mb-2">당신을 위한 비책</h3>
              <ul className="list-disc list-inside text-sm text-slate-300 space-y-2">
                {coachingData?.action_plans.map((plan, i) => <li key={i}>{plan}</li>)}
              </ul>
            </div>
          </div>
          {!isUnlocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 rounded-2xl p-6 text-center border border-amber-500/30">
              <h3 className="text-xl font-bold text-white mb-4">3가지 학문의 통합 정밀 분석 결과가 숨겨져 있습니다.</h3>
              <button 
                onClick={handlePayment}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-8 rounded-xl transition-all"
              >
                {priceReport} 결제하고 운명의 비밀 열기
              </button>
            </div>
          )}
        </div>

        {/* Premium Q&A Section */}
        {isUnlocked && (
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 text-center">
            <h2 className="text-lg font-bold text-amber-200">💎 비책 문의하기</h2>
            <p className="text-sm text-slate-300 mt-2 mb-4">운명에 대해 더 깊이 알고 싶다면 1비책 문의 ({priceQA})</p>
            <input 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 mb-4 text-sm" 
              placeholder="질문을 입력하세요..." 
            />
            <button 
              onClick={handleAskQuestion}
              disabled={loadingQA}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50"
            >
              {loadingQA ? "비책을 찾는 중..." : `1비책 문의 ${priceQA}`}
            </button>
            {answer && (
              <div className="mt-6 text-left bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-200">
                <h4 className="font-bold text-amber-300 mb-2">비책 답변</h4>
                <p>{answer}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
