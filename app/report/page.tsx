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

interface LocalFeedback {
  id: string;
  name: string;
  rating: number;
  comment: string;
  locale: string;
  createdAt: string;
}

const trigrams = [
  { symbol: "☰", name: "일천건 (乾)", meaning: "하늘 · 창조 · 극적인 원동력" },
  { symbol: "☱", name: "이택태 (兌)", meaning: "연못 · 기쁨 · 화합과 소통" },
  { symbol: "☲", name: "삼화이 (離)", meaning: "불 · 밝음 · 문명과 지혜" },
  { symbol: "☳", name: "사뢰진 (震)", meaning: "우레 · 새로운 기상과 용맹함" },
  { symbol: "☴", name: "오풍손 (巽)", meaning: "바람 · 부드러움 · 스며드는 신용" },
  { symbol: "☵", name: "육수감 (坎)", meaning: "물 · 깊은 흐름 · 장애를 이기는 기획력" },
  { symbol: "☶", name: "칠간간 (艮)", meaning: "산 · 든든한 멈춤 · 고요한 축적" },
  { symbol: "☷", name: "팔지곤 (坤)", meaning: "땅 · 무한한 수용 · 포용과 안정" }
];

export default function ReportPage() {
  const [coachingData, setCoachingData] = useState<CoachingData | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isDivinationUnlocked, setIsDivinationUnlocked] = useState(false); // 점괘 전용 결제 상태
  const [activeTab, setActiveTab] = useState<"report" | "qa" | "feedback">("report");

  // 1:1 Q&A (주역 1:1 맞춤 비책) State
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loadingQA, setLoadingQA] = useState(false);
  
  // 주역 괘 회전 애니메이션용 State
  const [isSpinning, setIsSpinning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [currentTrigramIdx, setCurrentTrigramIdx] = useState(0);

  // Feedback State
  const [fbName, setFbName] = useState("");
  const [fbRating, setFbRating] = useState(5);
  const [fbComment, setFbComment] = useState("");
  const [submittingFb, setSubmittingFb] = useState(false);
  const [fbSuccess, setFbSuccess] = useState(false);
  const [accumulatedFeedbacks, setAccumulatedFeedbacks] = useState<LocalFeedback[]>([
    {
      id: "fb_1",
      name: "이지민 (ko)",
      rating: 5,
      comment: "사주풀이가 너무 다정하고 쉬워서 눈물이 났어요. 미신적인 겁주기가 없어서 참 좋습니다.",
      locale: "ko",
      createdAt: "2026-08-01T12:00:00.000Z"
    },
    {
      id: "fb_2",
      name: "John S. (en)",
      rating: 5,
      comment: "Very professional self-discovery guide. Friendly tone with excellent psychological mindfulness advice.",
      locale: "en",
      createdAt: "2026-08-02T09:15:00.000Z"
    },
    {
      id: "fb_3",
      name: "타카하시 (ja)",
      rating: 4,
      comment: "難しい漢字表現が少なく、心温まる手紙を読んでいるような快適さがありました。月次改善が楽しみです。",
      locale: "ja",
      createdAt: "2026-08-03T18:40:00.000Z"
    }
  ]);

  // 환율 설정
  const isKo = typeof window !== "undefined" && navigator.language.startsWith("ko");
  const priceReport = isKo ? "9,800원" : "$6.99";
  const priceQA = isKo ? "1,300" : "$1.00";

  // 평생 소장 로직 제거를 위해 useEffect에서 결제 정보 캐싱 제거
  useEffect(() => {
    const cachedData = sessionStorage.getItem("saju_report_data");
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        if (parsed.success && parsed.ai_coaching) {
          setCoachingData(parsed.ai_coaching);
          // 결제 상태는 캐싱하지 않음: 매번 결제하도록 함
          setIsUnlocked(false); 
          setIsDivinationUnlocked(false);
        }
      } catch (err) {
        console.error("[ERROR] Failed to parse cached report data:", err);
      }
    }
  }, []);

  const handlePayment = () => {
    // 실제 결제 API 호출 로직으로 교체될 부분
    alert(`${priceReport} 결제가 확인되었습니다. 이번 진단 결과를 리포트로 확인하세요.`);
    setIsUnlocked(true);
  };

  // 결과 다운로드 함수
  const downloadReport = () => {
    if (!coachingData) return;
    const content = `사수자패트 운명 리포트\n\n총론: ${coachingData.summary}\n\n사주 진단: ${coachingData.bazi_analysis}\n\n수리학: ${coachingData.numerology_analysis}\n\n자미두수: ${coachingData.ziwei_analysis}\n\n인생 비책: ${coachingData.action_plans.join("\n")}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "운명리포트.txt";
    a.click();
  };

  const handleAskQuestion = async () => {
    if (!question) return;
    
    // 1. 애니메이션 시작
    setIsSpinning(true);
    setLoadingQA(true);
    setAnswer("");
    setTimeLeft(15);
    
    // 2. 15초 카운트다운 타이머
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
      setCurrentTrigramIdx((prev) => (prev + 1) % trigrams.length);
    }, 1000);

    try {
      // 3. API 호출
      const response = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, context: coachingData }),
      });
      
      const data = await response.json();
      
      // 4. 애니메이션 종료 후 결과 반영
      if (data.success) {
        setAnswer(data.answer);
        setQuestion("");
      } else {
        alert("비책 문의에 실패했습니다. 다시 시도해 주세요.");
      }
    } catch (err) {
      console.error(err);
      alert("서버 연결에 실패했습니다.");
    } finally {
      setIsSpinning(false);
      setLoadingQA(false);
      clearInterval(timer); // 타이머 안전 종료
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbComment) return;
    setSubmittingFb(true);

    try {
      const locale = typeof window !== "undefined" && navigator.language.startsWith("ko") ? "ko" : "en";
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fbName || "익명 수장",
          rating: fbRating,
          comment: fbComment,
          locale,
          birthDate: coachingData ? "Premium Active Report" : "Free Preview Status"
        }),
      });

      const resJson = await response.json();
      if (response.ok && resJson.success) {
        // 성공 시 로컬 리스트에 즉시 렌더 추가
        const newFb: LocalFeedback = {
          id: resJson.data.id || String(Date.now()),
          name: fbName || (isKo ? "익명의 조언자" : "Anonymous"),
          rating: fbRating,
          comment: fbComment,
          locale,
          createdAt: new Date().toISOString()
        };
        setAccumulatedFeedbacks((prev) => [newFb, ...prev]);
        setFbSuccess(true);
        setFbComment("");
        setFbName("");
      } else {
        alert(`제출 실패: ${resJson.error || "알 수 없는 에러"}`);
      }
    } catch (err) {
      console.error(err);
      alert("서버 연결에 실패했습니다.");
    } finally {
      setSubmittingFb(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex justify-center">
      <div className="max-w-2xl w-full flex flex-col gap-6 py-6">
        
        {/* Header & Logo */}
        <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-3xl border border-slate-800">
          <div className="flex items-center gap-3">
             <img 
               src="/logo.png" 
               onError={(e) => {
                 e.currentTarget.src = "/logo.jpg"; // png 로딩 실패시 jpg fallback
               }} 
               alt="SasujaFate Logo" 
               className="w-12 h-12 rounded-full border border-amber-500/30 object-cover" 
             />
             <div>
               <h1 className="text-2xl font-serif text-amber-100/95 leading-tight">사수자패트</h1>
               <p className="text-[10px] text-slate-400">3중 크로스 운명 웰니스</p>
             </div>
          </div>
          <Link href="/" className="text-sm px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-amber-300 transition-all">
            ← 다시 진단하기
          </Link>
        </div>

        {/* Premium Tab Navigation */}
        <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-1.5 rounded-3xl border border-slate-800/80">
          <button
            onClick={() => setActiveTab("report")}
            className={`py-3 text-sm font-medium rounded-2xl transition-all cursor-pointer ${
              activeTab === "report"
                ? "bg-amber-600 text-white shadow-md font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            📜 종합 운명 리포트
          </button>
          <button
            onClick={() => setActiveTab("qa")}
            className={`py-3 text-sm font-medium rounded-2xl transition-all cursor-pointer ${
              activeTab === "qa"
                ? "bg-amber-600 text-white shadow-md font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            💎 1:1 비책 문의
          </button>
          <button
            onClick={() => setActiveTab("feedback")}
            className={`py-3 text-sm font-medium rounded-2xl transition-all cursor-pointer ${
              activeTab === "feedback"
                ? "bg-amber-600 text-white shadow-md font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            💬 글로벌 피드백 탭
          </button>
        </div>

        {/* Tab 1: Report Content */}
        {activeTab === "report" && (
          <div className="flex flex-col gap-6">
            {/* Free Tier Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-xl backdrop-blur-sm">
              <h2 className="text-lg font-bold text-amber-300 mb-3 flex items-center gap-2">
                🌱 나의 무료 기운 맛보기
              </h2>
              <p className="text-sm text-slate-300/90 leading-relaxed italic bg-slate-950/55 p-4 rounded-2xl border border-slate-800">
                "{coachingData?.bazi_preview || "로딩 중... 메인화면에서 생년월일을 먼저 진단해 주세요."}"
              </p>
            </div>

            {/* Premium Content (Locked/Unlocked) */}
            <div className="relative">
              {/* 콘텐츠가 잠겨있을 때의 스타일: 가시성 숨김 + 상호작용 차단 */}
              <div className={`flex flex-col gap-5 ${!isUnlocked ? "opacity-0 blur-[20px] h-[300px] overflow-hidden pointer-events-none select-none" : "opacity-100 transition-all duration-500"}`}>
                <h2 className="text-xl font-bold text-amber-400 pl-1">✨ 운명의 비밀 (평생 소장 심화 분석)</h2>
                
                {/* 1. 3대 동양 철학 통합 총론 */}
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-xl">
                  <h3 className="font-bold text-amber-300 mb-3 flex items-center gap-2">🔑 3대 동양 철학 통합 총론 (운명의 마스터키)</h3>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{coachingData?.summary}</p>
                </div>

                {/* 2. 사주 정밀 진단 */}
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-xl">
                  <h3 className="font-bold text-amber-300 mb-2 flex items-center gap-2">🌳 사주 정밀 진단</h3>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{coachingData?.bazi_analysis}</p>
                </div>

                {/* 3. 동양 수리학 상세 해설 */}
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-xl">
                  <h3 className="font-bold text-amber-300 mb-2 flex items-center gap-2">🔢 동양 수리학 상세 해설</h3>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{coachingData?.numerology_analysis}</p>
                </div>

                {/* 4. 자미두수 정밀 성찰 */}
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-xl">
                  <h3 className="font-bold text-amber-300 mb-2 flex items-center gap-2">🌌 자미두수 정밀 성찰</h3>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{coachingData?.ziwei_analysis}</p>
                </div>

                {/* 5. 나를 빛낼 평생 인생 비책 4단계 */}
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-xl">
                  <h3 className="font-bold text-emerald-400 mb-3 flex items-center gap-2">💡 나를 빛낼 평생 인생 비책 4단계</h3>
                  <ul className="space-y-3">
                    {coachingData?.action_plans.map((plan, i) => (
                      <li key={i} className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
                        {plan}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {!isUnlocked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 rounded-[2rem] p-8 text-center border border-amber-500/30 shadow-2xl z-10">
                  <h3 className="text-2xl font-bold text-white mb-4">3대 동양 철학이 융합된 인생 설계지도</h3>
                  <p className="text-sm text-slate-300 max-w-sm mb-8 leading-relaxed">
                    복잡한 군더더기를 모두 빼고 오직 핵심 정수만 엄선한 프리미엄 분석 리포트가 잠겨 있습니다.
                  </p>
                  <button 
                    onClick={handlePayment}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 px-10 rounded-full text-base shadow-lg transition-all transform hover:scale-[1.02] cursor-pointer"
                  >
                    {priceReport} 결제하고 운명의 마스터키 풀기
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Q&A Content */}
        {activeTab === "qa" && (
          <div className="flex flex-col gap-6">
            {!isUnlocked ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-10 text-center flex flex-col items-center">
                <span className="text-4xl mb-4">🔒</span>
                <h3 className="text-lg font-bold text-slate-200 mb-2">종합 리포트 잠금 해제 후 사용 가능합니다</h3>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-6">
                  VIP 세팅 데이터가 있어야 인공지능이 귀하의 사주 및 우주 정렬에 맞춰 맞춤 비책 족집게 코칭을 제안할 수 있습니다.
                </p>
                <button
                  onClick={() => setActiveTab("report")}
                  className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 px-6 py-2.5 rounded-full text-sm font-medium transition-all cursor-pointer"
                >
                  결제창으로 이동하기
                </button>
              </div>
            ) : isSpinning ? (
              <div className="bg-slate-900 border border-amber-500/25 rounded-[2rem] p-10 shadow-2xl flex flex-col items-center justify-center gap-6 text-center">
                <h2 className="text-2xl font-bold text-amber-300 animate-pulse">주역의 괘를 돌리는 중...</h2>
                <div className="text-7xl font-bold text-amber-500 animate-spin">
                  {trigrams[currentTrigramIdx].symbol}
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-lg font-bold text-slate-100">{trigrams[currentTrigramIdx].name}</p>
                  <p className="text-sm text-slate-400">{trigrams[currentTrigramIdx].meaning}</p>
                </div>
                <div className="text-4xl font-mono text-amber-200 font-bold">
                  {timeLeft}초
                </div>
                <p className="text-xs text-slate-500 max-w-xs">
                  우주의 기운이 당신의 질문과 가장 조화로운 답을 찾아 괘를 구성하고 있습니다. 잠시만 기다려 주세요.
                </p>
              </div>
            ) : !isDivinationUnlocked ? (
              <div className="bg-slate-900 border border-amber-500/25 rounded-[2rem] p-10 shadow-2xl flex flex-col items-center text-center gap-4">
                <h2 className="text-xl font-bold text-amber-200">💎 주역 점괘로 비책 보기</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  궁금한 고민을 물어보고, 당신만의 주역 괘를 받아보세요. 15초간의 신비로운 괘 회전과 함께 족집게 코칭을 드립니다.
                </p>
                <button 
                  onClick={handleDivinationPayment}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-6 rounded-full transition-all cursor-pointer"
                >
                  {priceQA} 결제하고 점괘 시작하기
                </button>
              </div>
            ) : (
              <div className="bg-slate-900 border border-amber-500/25 rounded-[2rem] p-6 shadow-2xl flex flex-col gap-4">
                <h2 className="text-lg font-bold text-amber-200">🔮 괘를 흔들어보세요!</h2>
                
                <textarea 
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm focus:outline-none focus:border-amber-500 text-slate-200 leading-relaxed" 
                  placeholder="지금 가장 고민되는 질문을 입력하세요." 
                />
                
                <button 
                  onClick={handleAskQuestion}
                  disabled={loadingQA}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-full transition-all disabled:opacity-50 cursor-pointer"
                >
                  주역 괘 흔들기 (점괘 보기)
                </button>

                {answer && (
                  <div className="mt-4 text-left bg-slate-950 p-5 rounded-2xl border border-slate-800 text-sm text-slate-200 leading-relaxed">
                    <h4 className="font-bold text-amber-300 mb-2 flex items-center gap-2">💡 맞춤형 비책 답변</h4>
                    <p className="whitespace-pre-wrap">{answer}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Multilingual Feedback Tab (New) */}
        {activeTab === "feedback" && (
          <div className="flex flex-col gap-6">
            
            {/* Multilingual Notice & Monthly Retraining Info */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
              <h2 className="text-lg font-bold text-amber-300 mb-3 flex items-center gap-2">
                💬 글로벌 소리 창구 (AI Monthly Learning)
              </h2>
              <p className="text-xs text-slate-300/90 leading-relaxed mb-4">
                사수자패트는 전 세계 사용자 여러분의 목소리를 경청해요. 
                각기 다른 국가의 언어(한국어, 영어, 일어, 중국어 등)로 들어온 피드백들을 
                <span className="font-bold text-amber-300"> 매달 초 일괄 수집하여, AI가 직접 학습(Retraining)하고 프롬프트를 보완</span>해 나갑니다. 
                더 이해하기 쉽고 눈물나게 따뜻한 인생의 등대가 되도록 소중한 조언을 남겨주세요!
              </p>
              <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 text-[11px] text-slate-400">
                💡 <span className="text-slate-300 font-semibold">"사용자 중심의 지혜"</span>: 남겨주신 별점과 의견은 매월 말 백엔드 엔진 튜닝의 절대 기준으로 삼고 반영됩니다.
              </div>
            </div>

            {/* Submission Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-xl">
              <h3 className="font-bold text-slate-200 mb-4 pl-1">✏️ 의견과 소장 후기 작성하기</h3>
              
              {fbSuccess ? (
                <div className="bg-slate-950 p-6 rounded-2xl border border-emerald-500/20 text-center flex flex-col items-center">
                  <span className="text-3xl mb-2">🎉</span>
                  <h4 className="text-sm font-bold text-emerald-400 mb-1">성공적으로 접수되었습니다!</h4>
                  <p className="text-xs text-slate-400 mb-4 max-w-xs leading-relaxed">
                    보내주신 귀중한 의견은 다음 달 Retraining 세션의 피드백 코퍼스로 활용되어 한층 더 나은 서비스로 보답할게요.
                  </p>
                  <button 
                    onClick={() => setFbSuccess(false)}
                    className="text-xs text-amber-400 underline cursor-pointer"
                  >
                    추가 의견 제출하기
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="flex flex-col gap-4 text-left">
                  {/* Name or Nickname */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 pl-1">성함 또는 닉네임 (선택)</label>
                    <input 
                      type="text" 
                      placeholder="예시: 지혜로운개척가"
                      value={fbName}
                      onChange={(e) => setFbName(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Rating Selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 pl-1">만족도 평점</label>
                    <div className="flex items-center gap-1 bg-slate-950 p-3 rounded-2xl border border-slate-800 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFbRating(star)}
                          className="text-2xl transition-all cursor-pointer hover:scale-110 px-1"
                        >
                          <span className={star <= fbRating ? "text-amber-400" : "text-slate-700"}>★</span>
                        </button>
                      ))}
                      <span className="text-xs text-slate-400 ml-3 font-semibold">{fbRating}점</span>
                    </div>
                  </div>

                  {/* Comment Area */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 pl-1">개선 제안 및 후기 내용 (다국어 지원)</label>
                    <textarea 
                      required
                      rows={3}
                      value={fbComment}
                      onChange={(e) => setFbComment(e.target.value)}
                      placeholder="예시: 사주풀이에 일상적인 비유가 더 많아져서 한결 읽기 부드러워졌어요. 다만 비책 조언에 조금 더 디테일한 연도별 타이밍 수치가 들어갔으면 좋겠습니다!"
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingFb}
                    className="w-full mt-2 py-3 px-5 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submittingFb ? "의견 등록 중..." : "글로벌 소리창구에 의견 전달하기"}
                  </button>
                </form>
              )}
            </div>

            {/* Simulated Live Feedback Feed */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-xl">
              <h3 className="font-bold text-slate-200 mb-4 pl-1">🌍 실시간 수집된 글로벌 의견 피드 (매월 자동 학습)</h3>
              <div className="flex flex-col gap-3">
                {accumulatedFeedbacks.map((fb) => (
                  <div key={fb.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-amber-200">{fb.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-400 text-xs">{"★".repeat(fb.rating)}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(fb.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" })}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed italic mt-1">
                      "{fb.comment}"
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
