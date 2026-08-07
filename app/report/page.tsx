"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Locale, translations } from "../../lib/locales";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

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

export default function ReportPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Locale>("ko");
  const [user, setUser] = useState<any>(null);
  const [coachingData, setCoachingData] = useState<CoachingData | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<"report" | "qa" | "feedback">("report");

  // 1:1 Q&A State
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loadingQA, setLoadingQA] = useState(false);

  // 주역 흔들기 동적 연출 State
  const [ichingStage, setIchingStage] = useState<"idle" | "shaking" | "revealed">("idle");
  const [hexagramResult, setHexagramResult] = useState<any>(null);

  // 주역 게임화 기믹 State
  const [luckScore, setLuckScore] = useState<number | null>(null);
  const [luckGrade, setLuckGrade] = useState("");
  const [luckyColor, setLuckyColor] = useState("");
  const [luckyItem, setLuckyItem] = useState("");
  const [jinxCaution, setJinxCaution] = useState("");

  // Feedback State
  const [fbName, setFbName] = useState("");
  const [fbRating, setFbRating] = useState(5);
  const [fbComment, setFbComment] = useState("");
  const [submittingFb, setSubmittingFb] = useState(false);

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

  useEffect(() => {
    // 1. 언어 로드
    const savedLang = localStorage.getItem("sasuja_lang") as Locale;
    if (savedLang) setLang(savedLang);

    const handleLangChange = (e: any) => {
      setLang(e.detail);
    };
    window.addEventListener("sasuja_lang_change", handleLangChange);

    // 2. 유저 정보 조회
    fetchUser();

    // 3. 진단 데이터 로드 (캐시 데이터 확인)
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

    return () => {
      window.removeEventListener("sasuja_lang_change", handleLangChange);
    };
  }, []);

  // URL에서 qa_success 감지 및 질문/주역 복원 자동 전송
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const qaSuccess = searchParams.get("qa_success");
    const pendingQuestion = sessionStorage.getItem("saju_pending_question");
    const pendingIChing = sessionStorage.getItem("saju_pending_iching");

    if (qaSuccess === "true" && coachingData) {
      setActiveTab("qa");
      
      if (pendingIChing === "true" || pendingQuestion === "오늘의 주역 괘 조회") {
        console.log("[DEBUG] 결제 완료 후 오늘의 주역 괘 복구 전송 시작");
        (async () => {
          setLoadingQA(true);
          try {
            const res = await fetch("/api/qa", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                question: "오늘 나의 총체적인 명운과 기운에 알맞은 주역 해법을 구합니다.",
                context: coachingData,
              }),
            });
            const result = await res.json();
            if (res.ok && result.success) {
              sessionStorage.removeItem("saju_pending_iching");
              sessionStorage.removeItem("saju_pending_question");
              router.replace("/report");
              window.dispatchEvent(new Event("sasuja_login"));
              fetchUser();
              // 주역 애니메이션 연출 가동
              triggerIChingAnimation(
                result.answer, 
                result.hexagram,
                result.score,
                result.grade,
                result.lucky_color,
                result.lucky_item,
                result.jinx
              );
            } else {
              alert(`주역 분석 실패: ${result.error || "알 수 없는 오류"}`);
            }
          } catch (err) {
            console.error(err);
            alert("네트워크 오류가 발생했습니다.");
          } finally {
            setLoadingQA(false);
          }
        })();
      } else if (pendingQuestion) {
        console.log(`[DEBUG] 결제 완료 후 대피된 질문 복구 전송 시작: ${pendingQuestion}`);
        setQuestion(pendingQuestion);
        (async () => {
          setLoadingQA(true);
          try {
            const res = await fetch("/api/qa", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                question: pendingQuestion,
                context: coachingData,
              }),
            });
            const result = await res.json();
            if (res.ok && result.success) {
              sessionStorage.removeItem("saju_pending_question");
              router.replace("/report");
              window.dispatchEvent(new Event("sasuja_login"));
              fetchUser();
              // 주역 애니메이션 연출 가동
              triggerIChingAnimation(
                result.answer, 
                result.hexagram,
                result.score,
                result.grade,
                result.lucky_color,
                result.lucky_item,
                result.jinx
              );
            } else {
              alert(`질문 처리 실패: ${result.error || "알 수 없는 오류"}`);
            }
          } catch (err) {
            console.error(err);
            alert("네트워크 오류가 발생했습니다.");
          } finally {
            setLoadingQA(false);
          }
        })();
      }
    }
  }, [coachingData]);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
 
          // 현재 세션에 적재되어 있는 진단서 대상 인적사항 정보 파싱
          let currentReportName = "";
          let currentReportBirthDate = "";
          const cachedData = sessionStorage.getItem("saju_report_data");
          if (cachedData) {
            try {
              const parsed = JSON.parse(cachedData);
              if (parsed.data && parsed.data.user_info) {
                currentReportName = parsed.data.user_info.name;
                currentReportBirthDate = parsed.data.user_info.inputBirthDate;
              }
            } catch (e) {}
          }
 
          // DB에 저장된 해금 사주 프로필 정보와 현재 진단서 대상 정보의 일치 여부 확인
          const isProfileMatching = 
            data.user.sajuName === currentReportName && 
            data.user.birthDate === currentReportBirthDate;
 
          // 평생 소장 로직 제거: DB 프로필 기반의 자동 해금 복원은 비활성화하되,
          // 현재 브라우저 세션에서 결제를 완료해 둔 상태(sessionStorage의 saju_report_unlocked)는 유지합니다.
          const isSessionUnlocked = sessionStorage.getItem("saju_report_unlocked") === "true";
          if (isSessionUnlocked) {
            setIsUnlocked(true);
          } else {
            setIsUnlocked(false);
          }
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

  // 실제 토스페이먼츠 일반/글로벌 결제창 호출 로직 (포인트 차감 결제 연동)
  const handlePayment = async () => {
    const t = translations[lang];

    // 대표님 지침: 추천인 적립 10%를 매핑해야 하므로 반드시 결제 전 로그인이 필요함
    if (!user) {
      alert(lang === "ko" ? "로그인 후 결제를 진행해 주세요. (레퍼럴 연동용)" : "Please log in first to proceed with payment.");
      router.push("/login");
      return;
    }

    try {
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "test_ck_GjLJoBN1g2dkM1kXz4K83wYNeZ4Y";
      const tossPayments: any = await loadTossPayments(clientKey);

      // 결제창 호출 인자 구성
      const orderId = `ORD-${Date.now()}-${user.id.substring(0, 5)}`;
      const orderName = "종합 운명 리포트 (평생 소장 분석)";
      
      // 언어에 따라 결제 방식 분기 (글로벌 카드는 FOREIGN_CARD 결제수단 호출)
      const isKo = lang === "ko";
      const method = isKo ? "CARD" : "FOREIGN_CARD"; 
      
      // 금액 설정 (원화 9,800원 동일 기준 호출 또는 포인트 차감 할인 적용)
      let amount = 9800;
      let usedPoints = 0;
      const userPoints = user.points || 0;

      if (userPoints > 0 && userPoints < 9800) {
        const useDiscount = window.confirm(
          lang === "ko"
            ? `보유하신 ${userPoints.toLocaleString()}P를 사용하여 할인 결제하시겠습니까?\n(포인트 적용 시 ${(9800 - userPoints).toLocaleString()}원만 결제됩니다.)`
            : `Would you like to use your ${userPoints.toLocaleString()}P to get a discount?\n(You will only pay ${(9800 - userPoints).toLocaleString()} KRW.)`
        );
        if (useDiscount) {
          amount = 9800 - userPoints;
          usedPoints = userPoints;
        }
      }

      console.log(`[DEBUG] 토스페이먼츠 SDK 호출: method=${method}, amount=${amount}, usedPoints=${usedPoints}`);

      await tossPayments.requestPayment(method, {
        amount,
        orderId,
        orderName,
        successUrl: `${window.location.origin}/report/success?used_points=${usedPoints}`,
        failUrl: `${window.location.origin}/report/fail`,
        customerEmail: user.email,
        customerName: user.name,
      });
    } catch (e: any) {
      console.error("[ERROR] 토스페이먼츠 SDK 오류:", e);
      alert(e.message || "결제 중 오류가 발생했습니다.");
    }
  };

  // 1:1 Q&A 1,500원 일반/글로벌 결제창 호출 로직
  const handleQAPayment = async (questionText: string) => {
    if (!user) {
      alert(lang === "ko" ? "로그인 후 결제를 진행해 주세요." : "Please log in first.");
      router.push("/login");
      return;
    }

    try {
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "test_ck_GjLJoBN1g2dkM1kXz4K83wYNeZ4Y";
      const tossPayments: any = await loadTossPayments(clientKey);

      const orderId = `QA-${Date.now()}-${user.id.substring(0, 5)}`;
      const orderName = "1:1 비책 추가 질문권 (1회)";
      
      const isKo = lang === "ko";
      const method = isKo ? "CARD" : "FOREIGN_CARD"; 
      const amount = 1500;

      sessionStorage.setItem("saju_pending_question", questionText);
      console.log(`[DEBUG] 1:1 질문 결제창 호출: amount=${amount}, 대피질문: ${questionText}`);

      await tossPayments.requestPayment(method, {
        amount,
        orderId,
        orderName,
        successUrl: window.location.origin + "/report/success",
        failUrl: window.location.origin + "/report/fail",
        customerEmail: user.email,
        customerName: user.name,
      });
    } catch (e: any) {
      console.error("[ERROR] 토스페이먼츠 SDK 오류:", e);
      alert(e.message || "결제 중 오류가 발생했습니다.");
    }
  };

  // 포인트로 리포트 해금
  const handlePayWithPoints = async () => {
    const t = translations[lang];
    if (!user) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    if (user.points < 9800) {
      alert(t.pointsShortage);
      return;
    }

    try {
      const res = await fetch("/api/payment/pay-with-points", {
        method: "POST",
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          alert(t.paymentSuccess);
          setIsUnlocked(true);
          sessionStorage.setItem("saju_report_unlocked", "true");
          fetchUser();
          window.dispatchEvent(new Event("sasuja_login")); // 헤더 동기화
        } else {
          alert(`결제 실패: ${result.error}`);
        }
      } else {
        alert("포인트 결제 처리 중 오류가 발생했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("포인트 결제에 실패했습니다.");
    }
  };

  // 결과 다운로드 함수
  const downloadReport = () => {
    if (!coachingData) return;
    const content = `사수자패트 운명 리포트\n\n[총론]\n${coachingData.summary}\n\n[사주 진단]\n${coachingData.bazi_analysis}\n\n[동양 수리학 상세 해설]\n${coachingData.numerology_analysis}\n\n[자미두수 자아 성찰]\n${coachingData.ziwei_analysis}\n\n[나를 빛낼 평생 인생 비책 4단계]\n${coachingData.action_plans.map((p, i) => `${i + 1}. ${p}`).join("\n\n")}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "운명리포트.txt";
    a.click();
  };

  // 주역 괘 흔들기 애니메이션 시퀀스 실행기
  const triggerIChingAnimation = (
    answerText: string, 
    hexagram: any,
    score: number,
    grade: string,
    color: string,
    item: string,
    jinx: string
  ) => {
    setHexagramResult(hexagram);
    setLuckScore(score);
    setLuckGrade(grade);
    setLuckyColor(color);
    setLuckyItem(item);
    setJinxCaution(jinx);
    
    setAnswer(""); 
    setIchingStage("shaking");

    // ☯️ 청동 엽전이 잘그락잘그락 튕기며 산통 속에서 흔들리는 고풍스러운 사운드 효과 재생
    try {
      const audio = new Audio("/coin_sound.ogg");
      audio.volume = 0.6;
      audio.play().catch(err => {
        console.log("[DEBUG] Audio autoplay blocked or failed:", err);
      });
    } catch (e) {
      console.error("[ERROR] Failed to play ancient coin sound:", e);
    }
    
    // 2.5초간 산통 흔들림 모션
    setTimeout(() => {
      setIchingStage("revealed");
      
      // 3.5초간 점지된 괘상 돌출 후 해설 제공
      setTimeout(() => {
        setAnswer(answerText);
        setIchingStage("idle");
      }, 3500);
    }, 2500);
  };

  const handleAskQuestion = async () => {
    if (!question) return;

    if (!user) {
      alert(lang === "ko" ? "로그인 후 질문을 하실 수 있습니다." : "Please log in first.");
      router.push("/login");
      return;
    }

    const isPointsEnough = user.points >= 1500;

    if (isPointsEnough) {
      const proceed = confirm(
        lang === "ko"
          ? `1:1 주역 비책 질문을 전송하시겠습니까?\n(보유하신 포인트에서 즉시 1,500P가 차감됩니다.)`
          : `Would you like to send this I Ching question?\n(1,500P will be deducted from your points.)`
      );
      if (!proceed) return;

      setLoadingQA(true);
      try {
        const response = await fetch("/api/qa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, context: coachingData }),
        });
        const data = await response.json();
        if (data.success) {
          setQuestion("");
          window.dispatchEvent(new Event("sasuja_login"));
          fetchUser();
          // 결과 셋업 및 흔들기 연출 실행
          triggerIChingAnimation(
            data.answer, 
            data.hexagram, 
            data.score, 
            data.grade, 
            data.lucky_color, 
            data.lucky_item, 
            data.jinx
          );
        } else {
          alert(data.error || "비책 문의에 실패했습니다. 다시 시도해 주세요.");
        }
      } catch (err) {
        console.error(err);
        alert("네트워크 통신 중 오류가 발생했습니다.");
      } finally {
        setLoadingQA(false);
      }
    } else {
      const proceed = confirm(
        lang === "ko"
          ? `1:1 주역 비책 질문을 전송하려면 1,500원 결제가 필요합니다.\n결제창으로 이동하시겠습니까?`
          : `To submit a 1:1 I Ching question, a payment of 1,500 KRW is required.\nProceed to checkout?`
      );
      if (!proceed) return;

      handleQAPayment(question);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbComment) return;
    setSubmittingFb(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fbName || "익명 수장",
          rating: fbRating,
          comment: fbComment,
          locale: lang,
          birthDate: coachingData ? "Premium Active Report" : "Free Preview Status"
        }),
      });

      const resJson = await response.json();
      if (response.ok && resJson.success) {
        const newFb: LocalFeedback = {
          id: resJson.data.id || String(Date.now()),
          name: fbName || (lang === "ko" ? "익명의 조언자" : "Anonymous"),
          rating: fbRating,
          comment: fbComment,
          locale: lang,
          createdAt: new Date().toISOString()
        };
        setAccumulatedFeedbacks((prev) => [newFb, ...prev]);
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

  const t = translations[lang];

  return (
    <div className="min-h-[calc(100vh-68px)] bg-slate-950 text-slate-100 p-6 flex justify-center pt-10">
      <div className="max-w-2xl w-full flex flex-col gap-6 py-6">
        
        {/* Header & Logo */}
        <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-3xl border border-slate-800">
          <div className="flex items-center gap-3">
             <img 
               src="/logo.png" 
               alt="Sasuja Logo" 
               className="w-10 h-10 object-contain rounded-full shadow-lg shadow-amber-500/10" 
             />
             <div>
               <h1 className="text-xl font-serif text-amber-100/95 leading-tight">{t.title}</h1>
               <p className="text-[10px] text-slate-400">{t.subtitle}</p>
             </div>
          </div>
          <Link href="/" className="text-xs px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-amber-300 transition-all">
            {t.backToHome}
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-1.5 rounded-3xl border border-slate-800/80">
          <button
            onClick={() => setActiveTab("report")}
            className={`py-3 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
              activeTab === "report"
                ? "bg-amber-600 text-white shadow-md font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            📜 {lang === "ko" ? "종합 운명 리포트" : lang === "en" ? "Full Destiny Report" : lang === "ja" ? "総合鑑定書" : lang === "zh" ? "综合运势报告" : "Báo Cáo Tổng Hợp"}
          </button>
          <button
            onClick={() => setActiveTab("qa")}
            className={`py-3 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
              activeTab === "qa"
                ? "bg-amber-600 text-white shadow-md font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            💎 {lang === "ko" ? "1:1 비책 문의" : lang === "en" ? "1:1 Q&A Consult" : lang === "ja" ? "1:1 相談" : lang === "zh" ? "1:1 咨询" : "Hỏi Đáp 1:1"}
          </button>
          <button
            onClick={() => setActiveTab("feedback")}
            className={`py-3 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
              activeTab === "feedback"
                ? "bg-amber-600 text-white shadow-md font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            💬 {lang === "ko" ? "글로벌 피드백" : lang === "en" ? "Global Feedback" : lang === "ja" ? "フィードバック" : lang === "zh" ? "全球反馈" : "Phản Hồi Toàn Cầu"}
          </button>
        </div>

        {/* Tab 1: Report Content */}
        {activeTab === "report" && (
          <div className="flex flex-col gap-6">
            
            {/* 상단 퀵 해금 안내바 (스크롤 낭비 없이 첫 화면 즉시 결제 대응) */}
            {!isUnlocked && (
              <div className="bg-gradient-to-r from-amber-600/20 via-amber-500/10 to-slate-900/40 border border-amber-500/20 p-4 rounded-[2rem] flex items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl animate-pulse">🔑</span>
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-bold text-amber-200">
                      {lang === "ko" ? "평생 분석 리포트 즉시 해금" : "Unlock Full Premium Report"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {t.priceText} / {t.pointsRequired} ({lang === "ko" ? "보유" : "Own"}: {user?.points?.toLocaleString() || 0}P)
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5 sm:gap-2">
                  <button 
                    onClick={handlePayment}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-3 sm:px-4 rounded-full text-[10px] sm:text-xs shadow-md cursor-pointer transition-transform hover:scale-105"
                  >
                    {lang === "ko" ? "결제" : "Pay"}
                  </button>
                  {user && user.points >= 9800 && (
                    <button 
                      onClick={handlePayWithPoints}
                      className="bg-slate-950 border border-amber-500/40 text-amber-300 font-bold py-2 px-3 sm:px-4 rounded-full text-[10px] sm:text-xs shadow-md cursor-pointer transition-transform hover:scale-105"
                    >
                      {lang === "ko" ? "포인트" : "Points"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Free Tier Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-xl backdrop-blur-sm">
              <h2 className="text-lg font-bold text-amber-300 mb-3 flex items-center gap-2">
                🌱 {lang === "ko" ? "나의 무료 기운 맛보기" : lang === "en" ? "My Free Energy Preview" : lang === "ja" ? "無料鑑定お試し" : lang === "zh" ? "我的免费运势预览" : "Bản Xem Trước Miễn Phí"}
              </h2>
              <p className="text-sm text-slate-300/90 leading-relaxed italic bg-slate-950/55 p-4 rounded-2xl border border-slate-800">
                "{coachingData?.bazi_preview || (lang === "ko" ? "로딩 중... 메인화면에서 생년월일을 먼저 진단해 주세요." : "Loading... Please input your birth date first.")}"
              </p>
            </div>

            {/* Premium Content (Locked/Unlocked) - 모바일 스크롤 낭비 방지를 위해 락 상태 시 높이 380px 제한 */}
            <div className="relative">
              <div 
                className={`flex flex-col gap-5 transition-all ${
                  !isUnlocked 
                    ? "max-h-[380px] overflow-hidden blur-[8px] pointer-events-none select-none" 
                    : ""
                }`}
              >
                <div className="flex justify-between items-center pl-1 pr-1">
                  <h2 className="text-xl font-bold text-amber-400">
                    ✨ {lang === "ko" ? "운명의 비밀 (평생 소장 심화 분석)" : lang === "en" ? "Secrets of Destiny (Premium Analysis)" : lang === "ja" ? "運命의 真実 (精密鑑定書)" : lang === "zh" ? "命运的秘密 (终身精密分析)" : "Bí Mật Vận Mệnh (Phân Tích Chi Tiết)"}
                  </h2>
                  {isUnlocked && (
                    <button 
                      onClick={downloadReport}
                      className="bg-slate-900 border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-slate-950 font-bold py-2 px-4 rounded-full text-xs transition-all cursor-pointer shadow-md"
                    >
                      {lang === "ko" ? "📥 리포트 다운로드" : "📥 Download Report"}
                    </button>
                  )}
                </div>
                
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-xl">
                  <h3 className="font-bold text-amber-300 mb-2 flex items-center gap-2">🌳 {lang === "ko" ? "사주 정밀 진단" : "Saju Analysis"}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {isUnlocked 
                      ? coachingData?.bazi_analysis 
                      : (lang === "ko" 
                          ? "사주 원국의 음양오행 배열과 대운의 흐름을 분석하여, 귀하가 타고난 평생의 격국과 용신(用神)을 도출합니다. 인생의 결정적인 터닝포인트 시기와 조심해야 할 기운의 불균형을 짚어드립니다. (결제 후 전체 공개)" 
                          : "We analyze the yin-yang and five elements distribution of your BaZi chart to derive your lifelong structure and favorable elements. Key turning points will be revealed upon unlocking.")}
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-xl">
                  <h3 className="font-bold text-amber-300 mb-2 flex items-center gap-2">🔢 {lang === "ko" ? "동양 수리학 상세 해설" : "Eastern Numerology"}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {isUnlocked 
                      ? coachingData?.numerology_analysis 
                      : (lang === "ko" 
                          ? "이름과 생년월일 수리를 조합한 81수리 4격(원격, 형격, 이격, 정격)을 풀이하여, 인생 전반부와 후반부에 강하게 작용하는 핵심 숫자의 우주 기운과 길흉 화복을 세밀히 추적합니다. (결제 후 전체 공개)" 
                          : "Based on the 81 mathematical structures, we trace the active core numbers influencing your early and later life stages. Complete numerological interpretation is visible after payment.")}
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-xl">
                  <h3 className="font-bold text-amber-300 mb-2 flex items-center gap-2">🌌 {lang === "ko" ? "자미두수 자아 성찰" : "Zi Wei Dou Shu"}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {isUnlocked 
                      ? coachingData?.ziwei_analysis 
                      : (lang === "ko" 
                          ? "명궁(命宮)을 중심으로 108성 요성의 배치와 정성(자미, 천부, 태양 등)의 묘왕이치를 풀이하여, 귀하가 마주할 인생의 굴곡과 잠재된 내면의 그릇, 평생의 명조를 해석합니다. (결제 후 전체 공개)" 
                          : "Centered on your Destiny Palace, we map the positions of 108 stars to reveal your deep psychological potential and life's primary patterns. Unlock to view details.")}
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-xl">
                  <h3 className="font-bold text-amber-300 mb-3 flex items-center gap-2">🔑 {lang === "ko" ? "운명의 마스터키 종합" : "Destiny Masterkey"}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-5 whitespace-pre-wrap">
                    {isUnlocked 
                      ? coachingData?.summary 
                      : (lang === "ko" 
                          ? "사주, 수리학, 자미두수 3대 동양 철학의 기운을 입체적으로 융합한 인생의 총론입니다. 귀하만의 타고난 강점을 극대화하고 약점을 보완하는 우주적 방향성을 제시합니다. (결제 후 전체 공개)" 
                          : "A multi-dimensional synthesis of BaZi, Numerology, and Zi Wei Dou Shu. This master key reveals your true path by magnifying strengths and mitigating challenges.")}
                  </p>
                  
                  <h3 className="font-bold text-emerald-400 mb-3 flex items-center gap-2">💡 {lang === "ko" ? "나를 빛낼 평생 인생 비책 4단계" : "4 Steps to Shine in Life"}</h3>
                  <ul className="space-y-3">
                    {isUnlocked 
                      ? (coachingData?.action_plans.map((plan, i) => (
                          <li key={i} className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
                            {plan}
                          </li>
                        )))
                      : (lang === "ko" 
                          ? [
                              "귀하의 기운을 다스릴 첫 번째 인생 개운(開運) 비책 (결제 후 해금)",
                              "성공적인 커리어 상승을 위한 두 번째 대길 행동 강령 (결제 후 해금)",
                              "재물과 인덕을 끌어당길 세 번째 공간 및 인연 처방 (결제 후 해금)",
                              "일상이 평온해지고 액운을 막는 네 번째 마음 수련법 (결제 후 해금)"
                            ]
                          : [
                              "First life-opening guideline customized to balance your energy (Locked)",
                              "Second action rule for optimal career progression (Locked)",
                              "Third relational prescription to attract wealth and helpers (Locked)",
                              "Fourth mindfulness practice to neutralize misfortune (Locked)"
                            ]
                        ).map((plan, i) => (
                          <li key={i} className="text-sm text-slate-500 leading-relaxed bg-slate-950/10 p-4 rounded-2xl border border-slate-900/60 italic">
                            🔒 {plan}
                          </li>
                        ))
                    }
                  </ul>
                </div>
              </div>

              {/* Locked Screen - 380px 영역 정중앙에 그라디언트 페이드와 함께 밀착하여 즉시 노출 */}
              {!isUnlocked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-slate-950 via-slate-950/95 to-slate-950/70 rounded-3xl p-6 text-center border border-amber-500/10 shadow-2xl">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-300 text-xl mb-3 animate-bounce">
                    🔒
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 max-w-xs leading-snug">
                    {lang === "ko" ? "3대 동양 철학 융합 평생 인생 설계지도" : "Integrated Life Blueprint of 3 Wisdoms"}
                  </h3>
                  <p className="text-[11px] text-slate-400 max-w-xs mb-5 leading-relaxed">
                    {lang === "ko" 
                      ? "복잡한 군더더기를 전부 걷어낸 프리미엄 분석 리포트를 즉시 해금하세요."
                      : "Unlock the premium destiny analysis report, which excludes all superstitious clutter."}
                  </p>
                  
                  <div className="flex flex-col gap-2.5 w-full max-w-xs">
                    {/* 카드 일반 결제 */}
                    <button 
                      onClick={handlePayment}
                      className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 px-6 rounded-full text-xs shadow-lg transition-all transform hover:scale-[1.02] cursor-pointer"
                    >
                      {t.unlockReport} ({t.priceText})
                    </button>

                    {/* 포인트 결제 옵션 */}
                    {user && (
                      <button
                        onClick={handlePayWithPoints}
                        disabled={user.points < 9800}
                        className={`font-bold py-4 px-8 rounded-full text-sm shadow-lg transition-all transform hover:scale-[1.02] cursor-pointer flex flex-col items-center justify-center leading-tight ${
                          user.points >= 9800
                            ? "bg-slate-900 border border-amber-500/40 text-amber-300 hover:bg-slate-850"
                            : "bg-slate-900/40 border border-slate-800 text-slate-500 opacity-60 cursor-not-allowed"
                        }`}
                      >
                        <span>{t.payWithPoints}</span>
                        <span className="text-[10px] opacity-75">{t.pointsRequired} ({lang === "ko" ? "보유" : "Own"}: {user.points.toLocaleString()}P)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 레퍼럴 홍보 배너 */}
            <div className="bg-gradient-to-r from-amber-600/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-[2rem] p-6 shadow-xl">
              <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2 mb-2">
                {t.referralBannerTitle}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {t.referralBannerDesc}
              </p>
              <Link 
                href={user ? "/mypage" : "/login"}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-white transition-colors"
              >
                {lang === "ko" ? "내 추천 링크 확인하기 →" : lang === "en" ? "Check My Referral Link →" : lang === "ja" ? "紹介リンクを確認する →" : lang === "zh" ? "确认我的推荐链接 →" : "Xem Link Giới Thiệu Của Tôi →"}
              </Link>
            </div>
          </div>
        )}

        {/* Tab 2: Q&A Content */}
        {activeTab === "qa" && (
          <div className="flex flex-col gap-6">
            {!isUnlocked ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-10 text-center flex flex-col items-center">
                <span className="text-4xl mb-4">🔒</span>
                <h3 className="text-lg font-bold text-slate-200 mb-2">
                  {lang === "ko" ? "종합 리포트 잠금 해제 후 사용 가능합니다" : "Unlocked after premium report access"}
                </h3>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-6">
                  {lang === "ko"
                    ? "VIP 세팅 데이터가 있어야 인공지능이 귀하의 사주 및 우주 정렬에 맞춰 맞춤 비책 족집게 코칭을 제안할 수 있습니다."
                    : "AI needs your detailed profile blueprint context to give precise counselor coaching response advice."}
                </p>
                <button
                  onClick={() => setActiveTab("report")}
                  className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 px-6 py-2.5 rounded-full text-sm font-medium transition-all cursor-pointer"
                >
                  {lang === "ko" ? "결제창으로 이동하기" : "Go to unlock report"}
                </button>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-xl flex flex-col gap-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <h2 className="text-lg font-bold text-amber-300 flex items-center gap-2">
                    💎 {lang === "ko" ? "주역(I Ching) 1:1 고민 문답 비책" : "1:1 I Ching Destiny Consultation"}
                  </h2>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-full">
                    {lang === "ko" ? "1문 1답 이용료: 1,500원 / 1,500P" : "1 Ask: 1,500 KRW / 1,500P"}
                  </span>
                </div>
                
                <p className="text-xs text-slate-400 leading-relaxed">
                  {lang === "ko"
                    ? "가장 마음이 쓰이는 구체적인 질문을 입력해 주세요. 회원님의 생년월일과 오늘 날짜, 그리고 고민 텍스트를 조합한 수리 기운으로 주역 64괘 중 하나의 해답 괘를 점지하여 1:1 맞춤 솔루션을 드립니다."
                    : "Submit your specific concern. We draw a unique I Ching hexagram by combining your birth info and question context to provide a custom 1:1 solution."}
                </p>

                {/* 포인트 잔액 카드 */}
                {user && (
                  <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-2xl text-[10px] text-slate-400 flex items-center justify-between">
                    <span>{lang === "ko" ? `나의 잔여 포인트: ${user.points.toLocaleString()}P` : `My Points: ${user.points.toLocaleString()}P`}</span>
                    <span className="font-semibold text-amber-300">
                      {user.points >= 1500
                        ? (lang === "ko" ? "포인트 즉시 차감 사용 가능" : "Ready to pay with points")
                        : (lang === "ko" ? "포인트 부족으로 카드 결제창이 열립니다" : "Will proceed to Toss Card Payment")}
                    </span>
                  </div>
                )}

                {/* 고민 질문란 */}
                <div className="flex flex-col gap-3">
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder={lang === "ko" ? "예: 내년에 이직이나 창업을 계획하고 있는데, 제 사주와 오늘 주역 기운으로 볼 때 성공할 수 있을까요?" : "Describe your concern in detail..."}
                    rows={4}
                    className="w-full p-4 rounded-3xl bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-amber-500"
                  />
                  
                  <button
                    onClick={handleAskQuestion}
                    disabled={loadingQA || !question}
                    className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs sm:text-sm shadow-lg transition-all transform hover:scale-[1.01] cursor-pointer flex justify-center items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loadingQA ? "..." : (
                      <>
                        <span>☯️</span>
                        <span>
                          {user && user.points >= 1500
                            ? (lang === "ko" ? "1,500P 차감하고 주역 1문1답 비책 전송" : "Pay 1,500P & Send Concern")
                            : (lang === "ko" ? "1,500원 결제하고 주역 1문1답 비책 전송" : "Pay 1,500 KRW & Send Concern")
                          }
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* 결과 렌더링 영역 */}
                {answer && (
                  <div className="mt-4 flex flex-col gap-4">
                    {/* 고풍스러운 주역 나무패(Wooden Slate) 비주얼 */}
                    {luckScore && (
                      <div className="p-6 rounded-[2.5rem] bg-gradient-to-br from-[#2c1808] to-[#150d05] border-4 border-[#4a2b12] shadow-[inset_0_0_25px_rgba(0,0,0,0.95),0_10px_20px_rgba(0,0,0,0.5)] flex flex-col gap-4 animate-fadeIn relative overflow-hidden">
                        {/* 나무패 옹이 및 장식 철못 디자인 */}
                        <div className="absolute top-3 left-4 text-[#5c3c21] text-xs select-none">◆</div>
                        <div className="absolute top-3 right-4 text-[#5c3c21] text-xs select-none">◆</div>
                        <div className="absolute bottom-3 left-4 text-[#5c3c21] text-xs select-none">◆</div>
                        <div className="absolute bottom-3 right-4 text-[#5c3c21] text-xs select-none">◆</div>

                        <div className="flex justify-between items-center border-b border-[#4d2d14] pb-3.5 mt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl filter drop-shadow-[0_0_3px_rgba(245,158,11,0.5)]">☯️</span>
                            <span className="text-xs font-bold text-amber-100/90 font-serif tracking-wider">
                              {lang === "ko" ? "오늘 나무패에 각인된 명운" : "Cosmic Wooden Slate"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 font-mono text-xs">
                            <span className="text-amber-200/50">명운 점수:</span>
                            <span className="text-amber-400 font-bold text-sm filter drop-shadow-[0_0_4px_rgba(245,158,11,0.6)]">{luckScore}점</span>
                            <span className="bg-[#4a2b12] border border-[#6b3e1a] text-amber-200 font-bold text-[9px] px-2 py-0.5 rounded-md">{luckGrade}</span>
                          </div>
                        </div>

                        {/* 3대 개운 처방 - 오래된 서판 조각 디자인 */}
                        <div className="grid grid-cols-3 gap-2.5">
                          <div className="bg-[#120a03]/80 p-3 rounded-2xl border border-[#361e0b] text-center flex flex-col gap-1.5 justify-center shadow-inner relative">
                            <span className="text-[9px] font-bold text-amber-600/80 font-serif tracking-wider">◆ {lang === "ko" ? "행운의 색" : "Color"} ◆</span>
                            <span className="text-xs font-bold text-amber-100 font-serif filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{luckyColor || "황금색"}</span>
                          </div>
                          <div className="bg-[#120a03]/80 p-3 rounded-2xl border border-[#361e0b] text-center flex flex-col gap-1.5 justify-center shadow-inner relative">
                            <span className="text-[9px] font-bold text-emerald-500/80 font-serif tracking-wider">◆ {lang === "ko" ? "일일 개운" : "Action"} ◆</span>
                            <span className="text-xs font-bold text-amber-100 font-serif leading-tight filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{luckyItem || "수분 섭취"}</span>
                          </div>
                          <div className="bg-[#120a03]/80 p-3 rounded-2xl border border-[#361e0b] text-center flex flex-col gap-1.5 justify-center shadow-inner relative">
                            <span className="text-[9px] font-bold text-rose-500/80 font-serif tracking-wider">◆ {lang === "ko" ? "피할 징크스" : "Avoid"} ◆</span>
                            <span className="text-xs font-bold text-amber-100 font-serif leading-tight filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{jinxCaution || "조급함"}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-6 rounded-[2rem] bg-slate-950 border border-amber-500/25 text-slate-200 shadow-inner">
                      <h4 className="font-bold text-amber-300 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-slate-850 pb-2">
                        <span>📜</span>
                        <span>{lang === "ko" ? "주역 괘상 점괘 및 1:1 비책 해답" : "Consultation Answer & Hexagram Guide"}</span>
                      </h4>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-slate-300 antialiased">{answer}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Feedback Content */}
        {activeTab === "feedback" && (
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-xl flex flex-col gap-4">
              <h2 className="text-lg font-bold text-amber-300">💬 {lang === "ko" ? "글로벌 한마디 피드백" : "Write Your Feedback"}</h2>
              
              <form onSubmit={handleFeedbackSubmit} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={fbName}
                    onChange={(e) => setFbName(e.target.value)}
                    placeholder={lang === "ko" ? "닉네임" : "Nickname"}
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-amber-500"
                  />
                  <select
                    value={fbRating}
                    onChange={(e) => setFbRating(Number(e.target.value))}
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value={5}>⭐️⭐️⭐️⭐️⭐️ (5/5)</option>
                    <option value={4}>⭐️⭐️⭐️⭐️ (4/5)</option>
                    <option value={3}>⭐️⭐️⭐️ (3/5)</option>
                    <option value={2}>⭐️⭐️ (2/5)</option>
                    <option value={1}>⭐️ (1/5)</option>
                  </select>
                </div>
                
                <textarea
                  required
                  value={fbComment}
                  onChange={(e) => setFbComment(e.target.value)}
                  placeholder={lang === "ko" ? "서비스 이용 경험을 솔직하게 남겨주세요." : "Write your review comment..."}
                  rows={3}
                  className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-amber-500"
                />

                <button
                  type="submit"
                  disabled={submittingFb || !fbComment}
                  className="w-full py-3 px-6 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition-all cursor-pointer disabled:opacity-40"
                >
                  {submittingFb ? "..." : (lang === "ko" ? "피드백 등록하기" : "Submit Feedback")}
                </button>
              </form>
            </div>

            {/* Accumulated Feedbacks */}
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-semibold text-slate-400 pl-1">👥 Users Reviews</h3>
              {accumulatedFeedbacks.map((fb) => (
                <div key={fb.id} className="bg-slate-900/50 border border-slate-800/80 p-5 rounded-2xl flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200">{fb.name}</span>
                    <span className="text-slate-500">{new Date(fb.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-amber-400 text-xs">{"⭐️".repeat(fb.rating)}</div>
                  <p className="text-sm text-slate-300 leading-relaxed italic">"{fb.comment}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ☯️ 주역 괘 산통 흔들기 & 점지 동적 애니메이션 풀스크린 모달 */}
      {ichingStage !== "idle" && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md transition-opacity duration-500">
          <style>{`
            @keyframes iChingShake {
              0%, 100% { transform: rotate(0deg) scale(1); }
              15% { transform: rotate(-18deg) scale(1.06) translateY(-8px); }
              30% { transform: rotate(18deg) scale(1.03) translateY(-3px); }
              45% { transform: rotate(-14deg) scale(1.06) translateY(-6px); }
              60% { transform: rotate(14deg) scale(1.02) translateY(-2px); }
              75% { transform: rotate(-8deg) scale(1.04) translateY(-4px); }
              90% { transform: rotate(8deg) scale(1.01) translateY(0); }
            }
            .animate-iching-shake {
              animation: iChingShake 0.4s ease-in-out infinite;
            }
            @keyframes coinTumble1 {
              0% { transform: translate(0, 0) rotate(0deg) scale(0.9); opacity: 0.9; }
              50% { transform: translate(-70px, -60px) rotate(240deg) scale(1.15); opacity: 1; }
              100% { transform: translate(-30px, 40px) rotate(480deg) scale(0.95); opacity: 0.9; }
            }
            @keyframes coinTumble2 {
              0% { transform: translate(0, 0) rotate(0deg) scale(0.9); opacity: 0.9; }
              50% { transform: translate(80px, -30px) rotate(-280deg) scale(1.15); opacity: 1; }
              100% { transform: translate(40px, 60px) rotate(-560deg) scale(0.95); opacity: 0.9; }
            }
            @keyframes coinTumble3 {
              0% { transform: translate(0, 0) rotate(0deg) scale(0.9); opacity: 0.9; }
              50% { transform: translate(-30px, 90px) rotate(180deg) scale(1.2); opacity: 1; }
              100% { transform: translate(-60px, -40px) rotate(360deg) scale(0.9); opacity: 0.9; }
            }
            .animate-coin-1 {
              animation: coinTumble1 1.4s ease-in-out infinite alternate;
            }
            .animate-coin-2 {
              animation: coinTumble2 1.6s ease-in-out infinite alternate;
            }
            .animate-coin-3 {
              animation: coinTumble3 1.8s ease-in-out infinite alternate;
            }
            @keyframes pulseGold {
              0%, 100% { filter: drop-shadow(0 0 15px rgba(245, 158, 11, 0.4)); transform: scale(1); }
              50% { filter: drop-shadow(0 0 45px rgba(245, 158, 11, 0.9)); transform: scale(1.05); }
            }
            .animate-pulse-gold {
              animation: pulseGold 2s infinite ease-in-out;
            }
            @keyframes revealUp {
              0% { opacity: 0; transform: translateY(50px) scale(0.85); }
              100% { opacity: 1; transform: translateY(0) scale(1); }
            }
            .animate-reveal-up {
              animation: revealUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>

          <div className="max-w-md w-full px-6 text-center flex flex-col items-center gap-8">
            {ichingStage === "shaking" ? (
              <div className="flex flex-col items-center gap-6">
                {/* 산통 형상의 원형 궤 모양 연출 */}
                <div className="w-48 h-48 rounded-full border-4 border-dashed border-amber-500/40 flex items-center justify-center bg-slate-900/40 animate-iching-shake shadow-2xl relative">
                  {/* 중앙 전통 태극 문양 */}
                  <span className="text-8xl select-none filter drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">☯️</span>
                  
                  {/* 3D 텀블링하는 상평통보 청동 엽전들 */}
                  <AncientCoin className="absolute -top-4 -left-4 animate-coin-1" />
                  <AncientCoin className="absolute -bottom-2 -right-6 animate-coin-2" />
                  <AncientCoin className="absolute -bottom-6 -left-2 animate-coin-3" />
                </div>
                
                <div className="flex flex-col gap-2 mt-4">
                  <h3 className="text-xl font-bold text-amber-100/90 tracking-wide animate-pulse">
                    {lang === "ko" ? "운명의 산통을 흔들고 있습니다..." : "Shaking the Fortune Jar..."}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                    {lang === "ko" 
                      ? "귀하의 생년월일과 마음속 고민을 하늘에 고하고 주역 64괘의 수리를 모으는 중입니다."
                      : "Connecting your birth energy and concern to draw the cosmic hexagram."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-8 animate-reveal-up">
                {/* ☯️ 세로형 정통 주역 나무명패(Wooden Talisman) 비주얼 */}
                <div className="w-40 h-64 rounded-2xl border-4 border-[#5c3e21] bg-gradient-to-b from-[#2a1708] to-[#110903] flex flex-col items-center justify-between py-6 px-4 animate-pulse-gold shadow-[0_15px_35px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(0,0,0,0.9)] relative overflow-hidden">
                  {/* 상단 놋쇠 고리 구멍 연출 */}
                  <div className="w-5 h-5 rounded-full bg-slate-950 border-2 border-[#5c3e21] flex items-center justify-center shadow-inner">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/35"></div>
                  </div>
                  
                  {/* 정중앙에 각인된 주역 괘상 기호 */}
                  <span className="text-8xl text-amber-400 select-none font-serif filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mt-2">
                    {hexagramResult?.symbol || "䷡"}
                  </span>
                  
                  {/* 괘 명칭 하단 한문 세김 */}
                  <div className="flex flex-col items-center gap-0.5 mt-2 border-t border-[#4d2d14] pt-2 w-full text-center">
                    <span className="text-[10px] font-bold text-amber-500 font-serif tracking-widest uppercase">I CHING</span>
                    <span className="text-xs font-bold text-amber-200/90 font-serif">{hexagramResult?.name}</span>
                  </div>
                  
                  {/* 장식 나뭇결 라인 */}
                  <div className="absolute top-0 bottom-0 left-2 w-[1px] bg-amber-950/10"></div>
                  <div className="absolute top-0 bottom-0 right-2 w-[1px] bg-amber-950/10"></div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-xs text-amber-500 font-bold tracking-widest uppercase">
                    I Ching Hexagram No.{hexagramResult?.num || "??"}
                  </span>
                  <h2 className="text-3xl font-serif font-extrabold text-white tracking-wide">
                    {hexagramResult?.name || "주역 괘"}
                  </h2>
                  <p className="text-sm font-semibold text-amber-200/90 italic bg-amber-500/10 border border-amber-500/20 py-2 px-5 rounded-full inline-block mx-auto">
                    {hexagramResult?.keyword}
                  </p>
                  
                  {/* 점수 & 등급 비주얼 뱃지 연출 */}
                  {luckScore && (
                    <div className="flex items-center justify-center gap-3 mt-2 bg-slate-900 border border-amber-500/30 py-2 px-4 rounded-2xl w-fit mx-auto shadow-lg animate-bounce">
                      <span className="text-xs text-slate-400 font-semibold">점괘 명운 스코어:</span>
                      <span className="text-base font-mono font-bold text-amber-400">{luckScore}점</span>
                      <span className="text-xs bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-lg">{luckGrade}</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-400 max-w-xs mt-3 leading-relaxed">
                    {hexagramResult?.desc}
                  </p>
                </div>

                <div className="text-[10px] text-slate-500 animate-pulse mt-4">
                  {lang === "ko" ? "잠시 후 비책 해설서가 열립니다..." : "Opening the counseling report shortly..."}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ☯️ 동양 전통 청동 엽전(상평통보) 컴포넌트
function AncientCoin({ className = "" }: { className?: string }) {
  return (
    <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-[#8d714b] via-[#4d3a20] to-[#251b0a] border-2 border-[#a88a5c]/60 shadow-[inset_0_0_10px_rgba(0,0,0,0.95),0_5px_10px_rgba(0,0,0,0.6)] flex items-center justify-center relative select-none ${className}`}>
      {/* 엽전 가운데 뚫린 사각형 구멍 */}
      <div className="w-3.5 h-3.5 bg-slate-950 border border-[#a88a5c]/35 shadow-inner"></div>
      
      {/* 엽전 한문 음각 각인 (常平通寶 - 상평통보) */}
      <span className="absolute text-[8px] font-serif font-extrabold text-[#a88a5c]/85 top-[2px] tracking-tighter scale-90">常</span>
      <span className="absolute text-[8px] font-serif font-extrabold text-[#a88a5c]/85 bottom-[2px] tracking-tighter scale-90">平</span>
      <span className="absolute text-[8px] font-serif font-extrabold text-[#a88a5c]/85 left-[2px] tracking-tighter scale-90">通</span>
      <span className="absolute text-[8px] font-serif font-extrabold text-[#a88a5c]/85 right-[2px] tracking-tighter scale-90">寶</span>
    </div>
  );
}
