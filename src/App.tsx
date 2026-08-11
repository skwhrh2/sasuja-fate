import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { SajuInputForm } from './components/SajuInputForm';
import { PaymentModal } from './components/PaymentModal';
import { SajuReportView } from './components/SajuReportView';
import { IChingConsultation } from './components/IChingConsultation';
import { FeedbackModal } from './components/FeedbackModal';
import LoginPage from './components/LoginPage';
import MyPage from './components/MyPage';
import ReferralTracker from './components/ReferralTracker';
import { SajuInput, FourPillars, NumerologyAnalysis, ZiWeiAnalysis, SajuReportData } from './types';
import { HelpCircle, FileText, Globe } from 'lucide-react';

function MainPage() {
  // 메인 탭 상태: 기본값이 'saju' (3대 철학 종합 운명 리포트)
  const [activeMainTab, setActiveMainTab] = useState<'iching' | 'saju'>('saju');

  const [sajuInput, setSajuInput] = useState<SajuInput | null>(null);
  const [isSajuUnlocked, setIsSajuUnlocked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 사주 분석 결과 데이터
  const [pillars, setPillars] = useState<FourPillars | null>(null);
  const [numerology, setNumerology] = useState<NumerologyAnalysis | null>(null);
  const [ziwei, setZiWei] = useState<ZiWeiAnalysis | null>(null);
  const [reportData, setReportData] = useState<SajuReportData | null>(null);

  // 모달 및 결제 액션 상태
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);
  const [paymentActionCallback, setPaymentActionCallback] = useState<(() => void) | null>(null);
  const [paymentTitle, setPaymentTitle] = useState<string>('주역 1:1 신탁 질문 (건당 3,300원)');
  const [paymentPrice, setPaymentPrice] = useState<number>(3300);

  // 1. 사주 폼 제출 시 -> 9,800원 건별 결제 모달 오픈
  const handleSajuFormSubmit = (data: SajuInput) => {
    setSajuInput(data);
    setPaymentTitle(`${data.name} 님의 3대 동양 철학 정밀 운명 분석`);
    setPaymentPrice(9800);
    
    setPaymentActionCallback(() => () => {
      setIsSajuUnlocked(true);
      executeSajuAnalysis(data);
    });
    setIsPaymentModalOpen(true);
  };

  // 2. 서버 백엔드로 사주 분석 요청 (결제 승인 콜백 후에만 실행)
  const executeSajuAnalysis = async (data: SajuInput) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/saju/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.error || '사주 분석 요청 중 오류가 발생했습니다.');
      }

      setPillars(resData.pillars);
      setNumerology(resData.numerology);
      setZiWei(resData.ziwei);
      setReportData(resData.reportData);
    } catch (err: any) {
      console.error(err);
      alert(err.message || '분석 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. 주역 1:1 신탁 결제 모달 (3,300원 건별 결제)
  const handleOpenIChingPayment = (onPaid: () => void) => {
    setPaymentTitle('주역 1:1 신탁 질문 및 15초 8괘 비책 문의');
    setPaymentPrice(3300);
    setPaymentActionCallback(() => onPaid);
    setIsPaymentModalOpen(true);
  };

  // 4. 결제 승인 성공 처리
  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    if (paymentActionCallback) {
      paymentActionCallback();
      setPaymentActionCallback(null);
    }
  };

  // 5. 전체 초기화 (다른 사람 보거나 새로 시작할 때 기존 결제 상태 및 결과 완벽 삭제)
  const handleReset = () => {
    setSajuInput(null);
    setIsSajuUnlocked(false);
    setPillars(null);
    setNumerology(null);
    setZiWei(null);
    setReportData(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-amber-50 font-sans antialiased selection:bg-amber-900 selection:text-amber-100 flex flex-col justify-between">
      <div>
        {/* Navigation Bar */}
        <Navbar
          onReset={handleReset}
          onOpenFeedback={() => setIsFeedbackOpen(true)}
          isUnlocked={isSajuUnlocked}
        />

        {/* Main Content Area */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
          {/* Sub-Header Navigation Switcher Banner */}
          <div className="flex justify-center">
            <div className="bg-slate-900 border border-amber-900/60 p-1.5 rounded-2xl flex space-x-2 shadow-xl">
              <button
                onClick={() => setActiveMainTab('iching')}
                className={`px-4 sm:px-6 py-3 rounded-xl text-xs sm:text-sm font-bold font-serif transition-all flex items-center space-x-2 ${
                  activeMainTab === 'iching'
                    ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white shadow-lg border border-amber-400/40'
                    : 'text-amber-300/70 hover:text-amber-100'
                }`}
              >
                <HelpCircle className="w-4 h-4 text-amber-300" />
                <span>주역 1:1 비책 문의 (건당 3,300원)</span>
              </button>

              <button
                onClick={() => setActiveMainTab('saju')}
                className={`px-4 sm:px-6 py-3 rounded-xl text-xs sm:text-sm font-bold font-serif transition-all flex items-center space-x-2 ${
                  activeMainTab === 'saju'
                    ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white shadow-lg border border-amber-400/40'
                    : 'text-amber-300/70 hover:text-amber-100'
                }`}
              >
                <FileText className="w-4 h-4 text-amber-300" />
                <span>3대 철학 종합 운명 리포트 (9,800원)</span>
              </button>
            </div>
          </div>

          {/* TAB 1: Main Feature - 주역 1:1 비책 문의 */}
          {activeMainTab === 'iching' && (
            <div className="space-y-8 animate-fade-in">
              <IChingConsultation
                sajuName={sajuInput?.name}
                pillars={pillars}
                onOpenPaymentModal={handleOpenIChingPayment}
              />
            </div>
          )}

          {/* TAB 2: 3대 동양철학 종합 사주 리포트 */}
          {activeMainTab === 'saju' && (
            <div className="space-y-8 animate-fade-in">
              {!isSajuUnlocked || !reportData ? (
                <SajuInputForm onSubmit={handleSajuFormSubmit} isLoading={isLoading} />
              ) : (
                pillars &&
                numerology &&
                ziwei &&
                sajuInput && (
                  <SajuReportView
                    input={sajuInput}
                    pillars={pillars}
                    numerology={numerology}
                    ziwei={ziwei}
                    reportData={reportData}
                    onReset={handleReset}
                    onOpenIChing={() => setActiveMainTab('iching')}
                  />
                )
              )}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-amber-900/30 bg-slate-900 py-8 text-center text-xs text-amber-400/50 mt-12">
        <div className="max-w-5xl mx-auto px-4 space-y-2">
          <p className="font-serif text-amber-300/80">
            사수자패트 (SasujaFate) — 주역 1:1 신탁 (건당 3,300원) & 3대 동양 철학 종합 리포트 (건당 9,800원)
          </p>
          <p className="text-[11px] text-amber-400/40">
            모든 진단과 질문은 건당 개별 결제형 서비스입니다. 다른 사람을 진단하거나 새로 시작할 때 이전 결제 상태는 초기화되며 매회 신규 결제가 적용됩니다.
          </p>
        </div>
      </footer>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        title={paymentTitle}
        price={paymentPrice}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ReferralTracker />
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/mypage" element={<MyPage />} />
      </Routes>
    </Router>
  );
}
