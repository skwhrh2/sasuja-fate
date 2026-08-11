import React from 'react';
import { RotateCcw, ShieldCheck, MessageSquare, CreditCard, Globe } from 'lucide-react';
import { SasujaLogo } from './SasujaLogo';

interface NavbarProps {
  onReset: () => void;
  onOpenFeedback: () => void;
  isUnlocked: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onReset, onOpenFeedback, isUnlocked }) => {
  return (
    <header className="bg-slate-900 border-b border-amber-900/30 text-amber-50 sticky top-0 z-40 shadow-lg">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo & Philosophy Tag */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 min-w-0">
          <SasujaLogo size={36} className="sm:w-10 sm:h-10 shrink-0" />
          <div className="shrink-0 min-w-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-amber-100 font-serif whitespace-nowrap shrink-0">
                사수자패트
              </h1>
              <span className="text-[10px] sm:text-xs text-amber-400 font-sans font-normal border border-amber-500/40 px-1.5 py-0.5 rounded whitespace-nowrap shrink-0">
                SasujaFate
              </span>
              <span className="hidden lg:inline-flex items-center text-[10px] text-amber-300/60 font-sans font-normal ml-1 border border-amber-800/40 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                <Globe className="w-2.5 h-2.5 mr-1 text-amber-400" /> sasuja-fate.com
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-amber-300/80 font-sans hidden sm:block whitespace-nowrap">
              사주 × 동양수리학 × 자미두수 3대 동양 철학 크로스 검증
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          {isUnlocked ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] sm:text-xs font-medium bg-amber-950 text-amber-300 border border-amber-700/60 shadow-xs whitespace-nowrap">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">진단 잠금 해제됨</span>
              <span className="sm:hidden">해제됨</span>
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] sm:text-xs font-medium bg-slate-800 text-amber-300/90 border border-amber-900/40 whitespace-nowrap">
              <CreditCard className="w-3.5 h-3.5 mr-1 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">건당 과금 결제형</span>
              <span className="sm:hidden">개별 결제</span>
            </span>
          )}

          <button
            onClick={onOpenFeedback}
            className="p-1.5 sm:p-2 rounded-lg text-amber-200/80 hover:text-amber-100 hover:bg-slate-800 transition-colors shrink-0"
            title="의견 남기기"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            onClick={onReset}
            className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-200 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/50 transition-all shadow-xs whitespace-nowrap shrink-0"
            title="모든 진단 데이터 및 결제 상태 초기화"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:mr-1.5 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">다시 진단하기</span>
            <span className="sm:hidden">초기화</span>
          </button>
        </div>
      </div>
    </header>
  );
};
