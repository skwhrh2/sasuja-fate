import React, { useState } from 'react';
import { CreditCard, ShieldCheck, Lock, Sparkles, X, Check } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  title?: string;
  price?: number;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  title = "사수자패트 정밀 운명 리포트 건당 진단",
  price = 4900,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'toss' | 'card' | 'point'>('toss');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-amber-900/60 rounded-2xl max-w-md w-full p-6 text-amber-50 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-700/60 flex items-center justify-center text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-amber-400 font-medium bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60">
              건당 결제 시스템 (Pay-per-use)
            </span>
            <h3 className="text-lg font-bold text-amber-100 font-serif mt-0.5">
              진단 결제 및 잠금 해제
            </h3>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-amber-950/80 mb-5">
          <div className="text-xs text-amber-300/70 mb-1">신청 상품</div>
          <div className="text-sm font-semibold text-amber-100">{title}</div>
          <div className="mt-3 flex items-baseline justify-between border-t border-slate-800 pt-3">
            <span className="text-xs text-amber-300/70">결제 금액</span>
            <span className="text-xl font-bold text-amber-400">{price.toLocaleString()} 원</span>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="text-xs font-medium text-amber-300 mb-2">결제 수단 선택</div>
          
          <button
            type="button"
            onClick={() => setPaymentMethod('toss')}
            className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
              paymentMethod === 'toss'
                ? 'bg-indigo-950/60 border-indigo-500 text-indigo-100 shadow-md'
                : 'bg-slate-950 border-amber-900/40 text-amber-300/70 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="font-bold text-sm text-blue-400">toss</span>
              <span className="text-xs font-medium">토스페이먼츠 간편결제</span>
            </div>
            {paymentMethod === 'toss' && <Check className="w-4 h-4 text-indigo-400" />}
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
              paymentMethod === 'card'
                ? 'bg-amber-950/60 border-amber-500 text-amber-100 shadow-md'
                : 'bg-slate-950 border-amber-900/40 text-amber-300/70 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center space-x-3">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium">신용/체크카드 결제</span>
            </div>
            {paymentMethod === 'card' && <Check className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('point')}
            className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
              paymentMethod === 'point'
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-100 shadow-md'
                : 'bg-slate-950 border-amber-900/40 text-amber-300/70 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium">체험 포인트 차감 (테스트 무료)</span>
            </div>
            {paymentMethod === 'point' && <Check className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>

        <button
          onClick={handlePay}
          disabled={isProcessing}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white font-bold text-sm shadow-lg border border-amber-400/30 transition-all flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>보안 결제 승인 중...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4 text-amber-200" />
              <span>{price.toLocaleString()}원 결제하고 결과 확인하기</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-center text-amber-400/50 mt-4">
          건당 과금 결제 완료 시 바로 리포트가 생성되며, 다시 진단하기 시 리셋됩니다.
        </p>
      </div>
    </div>
  );
};
