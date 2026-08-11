import React, { useState } from 'react';
import { SajuInput, CalendarType, Gender } from '../types';
import { User, Calendar as CalendarIcon, Clock, Sparkles, ShieldAlert, ArrowRight } from 'lucide-react';

interface SajuInputFormProps {
  onSubmit: (data: SajuInput) => void;
  isLoading: boolean;
}

export const SajuInputForm: React.FC<SajuInputFormProps> = ({ onSubmit, isLoading }) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [calendarType, setCalendarType] = useState<CalendarType>('solar');
  const [birthYear, setBirthYear] = useState<number>(1995);
  const [birthMonth, setBirthMonth] = useState<number>(5);
  const [birthDay, setBirthDay] = useState<number>(15);
  const [unknownTime, setUnknownTime] = useState<boolean>(false);
  const [birthHour, setBirthHour] = useState<number>(12);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('성함을 입력해 주세요.');
      return;
    }
    onSubmit({
      name: name.trim(),
      gender,
      calendarType,
      birthYear,
      birthMonth,
      birthDay,
      birthHour: unknownTime ? -1 : birthHour,
    });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="bg-slate-900 border border-amber-900/40 rounded-2xl p-6 sm:p-8 shadow-xl text-amber-50 relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-600/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-amber-950/80 text-amber-300 border border-amber-800/60 px-3.5 py-1 rounded-full text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>3대 동양 철학 정밀 통합 진단</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-amber-100 tracking-tight">
            인생의 정밀 운명 리포트 작성
          </h2>
          <p className="text-sm text-amber-300/70 mt-2">
            사주팔자 만세력, 동양 수리학 81수리, 자미두수 12궁 명반을 한 번에 정밀 크로스 검증합니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 이름 & 성별 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-amber-300 mb-2 flex items-center">
                <User className="w-3.5 h-3.5 mr-1.5 text-amber-400" /> 성함 (성명)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                required
                className="w-full bg-slate-950 border border-amber-900/60 rounded-xl px-4 py-3 text-amber-100 placeholder-amber-700/60 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-amber-300 mb-2">성별</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                    gender === 'male'
                      ? 'bg-amber-700 text-amber-50 border-amber-500 shadow-md'
                      : 'bg-slate-950 text-amber-400/70 border-amber-900/50 hover:bg-slate-850'
                  }`}
                >
                  남성 (男性)
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                    gender === 'female'
                      ? 'bg-amber-700 text-amber-50 border-amber-500 shadow-md'
                      : 'bg-slate-950 text-amber-400/70 border-amber-900/50 hover:bg-slate-850'
                  }`}
                >
                  여성 (女性)
                </button>
              </div>
            </div>
          </div>

          {/* 달력 구분 */}
          <div>
            <label className="block text-xs font-medium text-amber-300 mb-2 flex items-center">
              <CalendarIcon className="w-3.5 h-3.5 mr-1.5 text-amber-400" /> 양력 / 음력 구분
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCalendarType('solar')}
                className={`py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition-all ${
                  calendarType === 'solar'
                    ? 'bg-amber-800/90 text-amber-100 border-amber-500'
                    : 'bg-slate-950 text-amber-400/60 border-amber-900/40 hover:bg-slate-850'
                }`}
              >
                양력 (陽曆)
              </button>
              <button
                type="button"
                onClick={() => setCalendarType('lunar_sol')}
                className={`py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition-all ${
                  calendarType === 'lunar_sol'
                    ? 'bg-amber-800/90 text-amber-100 border-amber-500'
                    : 'bg-slate-950 text-amber-400/60 border-amber-900/40 hover:bg-slate-850'
                }`}
              >
                음력 평달 (陰曆)
              </button>
              <button
                type="button"
                onClick={() => setCalendarType('lunar_leap')}
                className={`py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition-all ${
                  calendarType === 'lunar_leap'
                    ? 'bg-amber-800/90 text-amber-100 border-amber-500'
                    : 'bg-slate-950 text-amber-400/60 border-amber-900/40 hover:bg-slate-850'
                }`}
              >
                음력 윤달 (閏月)
              </button>
            </div>
          </div>

          {/* 생년월일 */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-amber-400/80 mb-1">연도</label>
              <select
                value={birthYear}
                onChange={(e) => setBirthYear(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-amber-900/60 rounded-xl px-3 py-2.5 text-amber-100 text-sm focus:border-amber-500 focus:outline-hidden"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}년
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-amber-400/80 mb-1">월</label>
              <select
                value={birthMonth}
                onChange={(e) => setBirthMonth(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-amber-900/60 rounded-xl px-3 py-2.5 text-amber-100 text-sm focus:border-amber-500 focus:outline-hidden"
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}월
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-amber-400/80 mb-1">일</label>
              <select
                value={birthDay}
                onChange={(e) => setBirthDay(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-amber-900/60 rounded-xl px-3 py-2.5 text-amber-100 text-sm focus:border-amber-500 focus:outline-hidden"
              >
                {days.map((d) => (
                  <option key={d} value={d}>
                    {d}일
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 태어난 시간 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-amber-300 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-400" /> 태어난 시 (出生時)
              </label>
              <label className="flex items-center space-x-2 cursor-pointer text-xs text-amber-400/80 hover:text-amber-300">
                <input
                  type="checkbox"
                  checked={unknownTime}
                  onChange={(e) => setUnknownTime(e.target.checked)}
                  className="rounded border-amber-800 text-amber-600 focus:ring-amber-500 bg-slate-950"
                />
                <span>시간 모름</span>
              </label>
            </div>

            {!unknownTime && (
              <select
                value={birthHour}
                onChange={(e) => setBirthHour(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-amber-900/60 rounded-xl px-4 py-3 text-amber-100 text-sm focus:border-amber-500 focus:outline-hidden"
              >
                {hours.map((h) => (
                  <option key={h} value={h}>
                    {h}시 ({h === 0 ? '자시' : `${h}시경`})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Security Notice */}
          <div className="flex items-start space-x-2.5 p-3.5 rounded-xl bg-slate-950/80 border border-amber-950/60 text-xs text-amber-300/70">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p>
              입력하신 인적 사항은 단일 진단 세션 동안에만 유지되며, '다시 진단하기' 시 자동으로 즉시 삭제/초기화됩니다.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white font-serif font-bold text-base shadow-lg hover:shadow-amber-900/40 border border-amber-400/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>만세력 및 3대 동양 철학 분석 중...</span>
              </>
            ) : (
              <>
                <span>3대 동양 철학 정밀 진단 시작하기</span>
                <ArrowRight className="w-5 h-5 text-amber-200" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
