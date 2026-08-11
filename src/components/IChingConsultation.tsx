import React, { useState, useEffect } from 'react';
import { HelpCircle, Sparkles, Lock, ShieldCheck, ArrowRight, RotateCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { IChingResult, FourPillars } from '../types';
import { SasujaLogo } from './SasujaLogo';

interface IChingConsultationProps {
  sajuName?: string;
  pillars?: FourPillars | null;
  onOpenPaymentModal: (onPaid: () => void) => void;
}

export const IChingConsultation: React.FC<IChingConsultationProps> = ({
  sajuName,
  pillars,
  onOpenPaymentModal,
}) => {
  const [question, setQuestion] = useState('');
  const [isUnlockedForQuestion, setIsUnlockedForQuestion] = useState(false);
  const [isCasting, setIsProcessingCasting] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [activeTrigramIdx, setActiveTrigramIdx] = useState(0);
  const [result, setResult] = useState<IChingResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const TRIGRAMS = [
    { symbol: '☰', name: '건 (乾) - 하늘' },
    { symbol: '☱', name: '태 (兌) - 못' },
    { symbol: '☲', name: '리 (離) - 불' },
    { symbol: '☳', name: '진 (震) - 우레' },
    { symbol: '☴', name: '손 (巽) - 바람' },
    { symbol: '☵', name: '감 (坎) - 물' },
    { symbol: '☶', name: '간 (艮) - 산' },
    { symbol: '☷', name: '곤 (坤) - 땅' },
  ];

  // 15초 카운트다운 및 8괘 회전 효과
  useEffect(() => {
    let timer: any;
    let trigramInterval: any;

    if (isCasting) {
      trigramInterval = setInterval(() => {
        setActiveTrigramIdx((prev) => (prev + 1) % TRIGRAMS.length);
      }, 180);

      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            clearInterval(trigramInterval);
            fetchIChingOracle();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(timer);
      clearInterval(trigramInterval);
    };
  }, [isCasting]);

  const handleRequestPayment = () => {
    if (!question.trim()) {
      alert('질문을 입력해 주세요.');
      return;
    }
    // 결제 창 팝업 후 승인 시
    onOpenPaymentModal(() => {
      setIsUnlockedForQuestion(true);
    });
  };

  const startCasting = () => {
    if (!question.trim()) {
      alert('질문을 입력해 주세요.');
      return;
    }
    if (!isUnlockedForQuestion) {
      alert('질문 결제 승인 후 괘를 흔들 수 있습니다.');
      return;
    }
    setErrorMsg(null);
    setResult(null);
    setCountdown(15);
    setIsProcessingCasting(true);
  };

  const fetchIChingOracle = async () => {
    try {
      const response = await fetch('/api/iching/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          sajuName: sajuName || '상담자',
          dayPillarStem: pillars?.dayPillar?.stem || '갑',
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || '주역 응답 생성 중 오류가 발생했습니다.');
      }

      setResult(data.result);
      setIsProcessingCasting(false);
      // 건당 과금 규정에 따라 답변 확인 후 1:1 질문 상태는 다시 잠금(재결제) 상태로 초기화
      setIsUnlockedForQuestion(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '주역 신탁 생성에 실패했습니다.');
      setIsProcessingCasting(false);
    }
  };

  const resetConsultation = () => {
    setQuestion('');
    setResult(null);
    setIsUnlockedForQuestion(false);
  };

  return (
    <div className="bg-slate-900 border border-amber-900/50 rounded-2xl p-6 sm:p-8 text-amber-50 shadow-xl relative overflow-hidden">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <SasujaLogo size={52} />
          </div>
          <div className="inline-flex items-center space-x-2 bg-amber-950/80 text-amber-300 border border-amber-800/60 px-3.5 py-1 rounded-full text-xs font-medium mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>주역 64괘 1:1 신탁 처방</span>
          </div>
          <h3 className="text-2xl font-bold font-serif text-amber-100">
            주역(周易) 1:1 비책 문의
          </h3>
          <p className="text-xs text-amber-300/70 mt-1">
            간절한 질문을 입력하고 결제 후 괘를 흔들면 15초간 8괘 신탁 회전과 함께 명쾌한 비책을 내려드립니다.
          </p>
        </div>

        {/* 1. 질문 입력 및 결제 상태 */}
        {!isCasting && !result && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-amber-300 mb-2">
                1:1 문의 질문 작성 (사업, 연애, 이직, 시험, 계약 등)
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="예: 이번에 준비 중인 신규 계약 건을 진행하는 것이 좋을까요? 시기적으로 주의할 점은 무엇인가요?"
                rows={3}
                className="w-full bg-slate-950 border border-amber-900/60 rounded-xl p-4 text-amber-100 placeholder-amber-700/60 focus:outline-hidden focus:border-amber-500 text-sm leading-relaxed"
              />
            </div>

            {/* 결제 상태 안내 및 버튼 */}
            <div className="bg-slate-950 p-4 rounded-xl border border-amber-950 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                {isUnlockedForQuestion ? (
                  <div className="w-9 h-9 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400 shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="text-xs font-semibold text-amber-200">
                    {isUnlockedForQuestion ? '주역 질문 결제 완료' : '주역 1:1 질문 결제 (3,300원)'}
                  </div>
                  <div className="text-[11px] text-amber-400/60">
                    {isUnlockedForQuestion
                      ? '아래 [주역 괘 흔들기] 버튼을 눌러 신탁을 구하세요.'
                      : '질문 입력 후 결제를 진행하시면 괘 흔들기 버튼이 활성화됩니다.'}
                  </div>
                </div>
              </div>

              {!isUnlockedForQuestion ? (
                <button
                  type="button"
                  onClick={handleRequestPayment}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs shadow-md border border-amber-500/40 transition-all flex items-center justify-center space-x-1.5 shrink-0"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-200" />
                  <span>결제 후 괘 흔들기</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startCasting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-extrabold font-serif text-xs shadow-lg transition-all flex items-center justify-center space-x-1.5 shrink-0 animate-pulse"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>주역 괘 흔들기 (15초 신탁)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2. 15초 8괘 회전 애니메이션 & 카운트다운 */}
        {isCasting && (
          <div className="py-10 text-center space-y-6 bg-slate-950 rounded-2xl border border-amber-900/60 p-6">
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              {/* Outer Glow Ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-600/30 to-amber-700/20 animate-spin-slow"></div>
              
              {/* Active Trigram display */}
              <div className="text-6xl text-amber-300 font-serif drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all transform scale-110">
                {TRIGRAMS[activeTrigramIdx].symbol}
              </div>

              {/* Countdown badge */}
              <div className="absolute -bottom-2 bg-amber-950 border border-amber-600 text-amber-300 font-mono font-bold text-xs px-3 py-1 rounded-full shadow-md">
                {countdown}초
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-lg font-bold font-serif text-amber-200">
                {TRIGRAMS[activeTrigramIdx].name} 회전 중...
              </h4>
              <p className="text-xs text-amber-300/70">
                우주의 8괘(☰☱☲☳☴☵☶☷) 자장을 모아 신탁을 추출하고 있습니다.
              </p>
            </div>

            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-amber-900/40">
              <div
                className="bg-amber-500 h-full transition-all duration-1000 ease-linear"
                style={{ width: `${((15 - countdown) / 15) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* 3. 신탁 결과 표시 */}
        {result && (
          <div className="space-y-6 bg-slate-950 rounded-2xl p-6 sm:p-8 border border-amber-900/60 animate-fade-in">
            <div className="flex items-center justify-between border-b border-amber-900/40 pb-4">
              <div className="flex items-center space-x-2">
                <span className="text-3xl font-serif text-amber-400">{result.hexagramSymbol}</span>
                <div>
                  <span className="text-xs text-amber-400 font-medium bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                    신탁 괘
                  </span>
                  <h4 className="text-lg font-bold font-serif text-amber-100 mt-0.5">
                    {result.hexagramName}
                  </h4>
                </div>
              </div>
              <span className="text-[11px] text-amber-400/50">{result.timestamp}</span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-xs text-amber-400 font-semibold mb-1">문의 질문</div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs text-amber-200/90 font-medium">
                  "{result.question}"
                </div>
              </div>

              <div>
                <div className="text-xs text-amber-400 font-semibold mb-1">주역 괘 신탁 풀이</div>
                <p className="text-sm text-amber-100/90 leading-relaxed font-serif bg-slate-900 p-4 rounded-xl border border-amber-950">
                  {result.interpretation}
                </p>
              </div>

              <div>
                <div className="text-xs text-amber-400 font-semibold mb-1">구체적 처방 및 실행 비책</div>
                <p className="text-sm text-amber-200 leading-relaxed font-sans bg-amber-950/60 p-4 rounded-xl border border-amber-800/60 whitespace-pre-line">
                  {result.actionPlan}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={resetConsultation}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-amber-300 text-xs border border-amber-900/60 transition-colors flex items-center space-x-1.5"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>새로운 주역 질문하기 (재결제)</span>
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-4 rounded-xl bg-red-950/60 border border-red-800/60 text-xs text-red-200 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
