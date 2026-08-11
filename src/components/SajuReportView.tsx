import React, { useState } from 'react';
import { FourPillars, NumerologyAnalysis, ZiWeiAnalysis, SajuReportData, SajuInput } from '../types';
import {
  Compass,
  Award,
  BookOpen,
  PieChart,
  Download,
  RotateCcw,
  Sparkles,
  Heart,
  Briefcase,
  Calendar,
  Flame,
  HelpCircle,
} from 'lucide-react';

interface SajuReportViewProps {
  input: SajuInput;
  pillars: FourPillars;
  numerology: NumerologyAnalysis;
  ziwei: ZiWeiAnalysis;
  reportData: SajuReportData;
  onReset: () => void;
  onOpenIChing: () => void;
}

export const SajuReportView: React.FC<SajuReportViewProps> = ({
  input,
  pillars,
  numerology,
  ziwei,
  reportData,
  onReset,
  onOpenIChing,
}) => {
  const [activeTab, setActiveTab] = useState<'master' | 'saju' | 'numerology' | 'ziwei' | 'strategies'>('master');

  // 텍스트 파일 저장 기능
  const handleDownloadTxt = () => {
    const textContent = `
====================================================
  [사수자패트 SasujaFate] 3대 동양 철학 통합 운명 리포트
====================================================
신청자: ${input.name} (${input.gender === 'male' ? '남성' : '여성'})
생년월일: ${input.birthYear}년 ${input.birthMonth}월 ${input.birthDay}일
발행일자: ${new Date().toLocaleDateString('ko-KR')}

----------------------------------------------------
1. [통합 총론] 운명의 마스터키
----------------------------------------------------
${reportData.masterKeySummary}

----------------------------------------------------
2. 사주팔자 (Four Pillars) 명반
----------------------------------------------------
- 년주: ${pillars.yearPillar.stemHanja}(${pillars.yearPillar.stem}) ${pillars.yearPillar.branchHanja}(${pillars.yearPillar.branch})
- 월주: ${pillars.monthPillar.stemHanja}(${pillars.monthPillar.stem}) ${pillars.monthPillar.branchHanja}(${pillars.monthPillar.branch})
- 일주: ${pillars.dayPillar.stemHanja}(${pillars.dayPillar.stem}) ${pillars.dayPillar.branchHanja}(${pillars.dayPillar.branch})
- 시주: ${pillars.hourPillar ? `${pillars.hourPillar.stemHanja}(${pillars.hourPillar.stem}) ${pillars.hourPillar.branchHanja}(${pillars.hourPillar.branch})` : '시간 미상'}

[사주 심층 분석]
${reportData.sajuDetail.analysis}

[운명의 강점]
${reportData.sajuDetail.strengths.map((s) => `• ${s}`).join('\n')}

[보완해야 할 부분]
${reportData.sajuDetail.weaknesses.map((w) => `• ${w}`).join('\n')}

----------------------------------------------------
3. 동양 수리학 (Numerology) 81수리
----------------------------------------------------
- 수리 격국: ${numerology.primaryGrid}
- 생년월일 수리수: ${numerology.birthNumber}
- 이름 획수 수리: ${numerology.nameLengthNumber}

[수리학 분석]
${reportData.numerologyDetail.analysis}
- 행운의 숫자: ${reportData.numerologyDetail.luckyNumbers.join(', ')}

----------------------------------------------------
4. 자미두수 (Zi Wei Dou Shu) 12궁 명반
----------------------------------------------------
- 명궁 주성: ${ziwei.lifeHouse}
- 재백궁 주성: ${ziwei.wealthHouse}
- 관록궁 주성: ${ziwei.careerHouse}
- 부처궁 주성: ${ziwei.marriageHouse}

[자미두수 분석]
${reportData.ziWeiDetail.analysis}

----------------------------------------------------
5. 인생 비책 4단계
----------------------------------------------------
[1] 재물운 비책:
${reportData.lifeStrategies.wealth}

[2] 애정/궁합 비책:
${reportData.lifeStrategies.relationship}

[3] 직업/건강 비책:
${reportData.lifeStrategies.careerAndHealth}

[4] 올해의 핵심 총운:
${reportData.lifeStrategies.yearFortune}

====================================================
사수자패트 (SasujaFate) - 크로스 검증 정밀 운명 서비스
`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${input.name}_사수자패트_운명리포트.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Upper Action Banner */}
      <div className="bg-slate-900 border border-amber-900/50 rounded-2xl p-6 text-amber-50 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-950 border border-amber-700/60 flex items-center justify-center text-amber-400 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold font-serif text-amber-100">{input.name} 님의 정밀 운명 리포트</h2>
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] px-2 py-0.5 rounded-full font-medium">
                분석 완료
              </span>
            </div>
            <p className="text-xs text-amber-300/70 mt-1">
              사주팔자 만세력 · 81수리학 · 자미두수 12궁 3중 크로스 검증 결과
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          <button
            onClick={handleDownloadTxt}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-200 text-xs font-medium transition-all shadow-xs flex items-center justify-center space-x-1.5"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>결과 저장 (TXT)</span>
          </button>

          <button
            onClick={onOpenIChing}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white text-xs font-bold font-serif transition-all shadow-md border border-amber-400/30 flex items-center justify-center space-x-1.5"
          >
            <HelpCircle className="w-4 h-4 text-amber-200" />
            <span>1:1 주역 비책 문의</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex md:overflow-x-auto justify-between md:justify-start space-x-1 border-b border-amber-900/40 pb-px scrollbar-none w-full">
        <button
          onClick={() => setActiveTab('master')}
          className={`flex-1 md:flex-none px-2 sm:px-5 py-2.5 sm:py-3 text-[11px] sm:text-xs md:text-sm font-medium font-serif rounded-t-xl transition-all border-t border-x border-b-transparent whitespace-nowrap flex items-center justify-center space-x-1 sm:space-x-2 ${
            activeTab === 'master'
              ? 'bg-slate-900 text-amber-300 border-amber-700/60 shadow-md'
              : 'bg-slate-950/60 text-amber-400/60 border-transparent hover:text-amber-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          <span>통합 총론</span>
        </button>

        <button
          onClick={() => setActiveTab('saju')}
          className={`flex-1 md:flex-none px-2 sm:px-5 py-2.5 sm:py-3 text-[11px] sm:text-xs md:text-sm font-medium font-serif rounded-t-xl transition-all border-t border-x border-b-transparent whitespace-nowrap flex items-center justify-center space-x-1 sm:space-x-2 ${
            activeTab === 'saju'
              ? 'bg-slate-900 text-amber-300 border-amber-700/60 shadow-md'
              : 'bg-slate-950/60 text-amber-400/60 border-transparent hover:text-amber-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          <span>사주학</span>
        </button>

        <button
          onClick={() => setActiveTab('numerology')}
          className={`flex-1 md:flex-none px-2 sm:px-5 py-2.5 sm:py-3 text-[11px] sm:text-xs md:text-sm font-medium font-serif rounded-t-xl transition-all border-t border-x border-b-transparent whitespace-nowrap flex items-center justify-center space-x-1 sm:space-x-2 ${
            activeTab === 'numerology'
              ? 'bg-slate-900 text-amber-300 border-amber-700/60 shadow-md'
              : 'bg-slate-950/60 text-amber-400/60 border-transparent hover:text-amber-200'
          }`}
        >
          <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          <span>동양 수리학</span>
        </button>

        <button
          onClick={() => setActiveTab('ziwei')}
          className={`flex-1 md:flex-none px-2 sm:px-5 py-2.5 sm:py-3 text-[11px] sm:text-xs md:text-sm font-medium font-serif rounded-t-xl transition-all border-t border-x border-b-transparent whitespace-nowrap flex items-center justify-center space-x-1 sm:space-x-2 ${
            activeTab === 'ziwei'
              ? 'bg-slate-900 text-amber-300 border-amber-700/60 shadow-md'
              : 'bg-slate-950/60 text-amber-400/60 border-transparent hover:text-amber-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          <span>자미두수</span>
        </button>

        <button
          onClick={() => setActiveTab('strategies')}
          className={`flex-1 md:flex-none px-2 sm:px-5 py-2.5 sm:py-3 text-[11px] sm:text-xs md:text-sm font-medium font-serif rounded-t-xl transition-all border-t border-x border-b-transparent whitespace-nowrap flex items-center justify-center space-x-1 sm:space-x-2 ${
            activeTab === 'strategies'
              ? 'bg-slate-900 text-amber-300 border-amber-700/60 shadow-md'
              : 'bg-slate-950/60 text-amber-400/60 border-transparent hover:text-amber-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          <span>인생 비책</span>
        </button>
      </div>

      {/* Tab 1: 통합 총론 (운명의 마스터키) */}
      {activeTab === 'master' && (
        <div className="bg-slate-900 border border-amber-900/40 rounded-b-2xl rounded-tr-2xl p-6 sm:p-8 text-amber-50 space-y-6 shadow-xl">
          <div className="bg-gradient-to-br from-amber-950/80 via-slate-900 to-amber-900/30 p-6 rounded-2xl border border-amber-700/40">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Cross Validation Summary</span>
            </div>
            <h3 className="text-2xl font-bold font-serif text-amber-100 mb-4">
              운명의 마스터키 (Master Key)
            </h3>
            <p className="text-base sm:text-lg leading-relaxed text-amber-100/90 font-serif">
              "{reportData.masterKeySummary}"
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="bg-slate-950 p-5 rounded-xl border border-amber-900/40">
              <div className="text-xs text-amber-400 font-medium mb-1">1. 사주 오행의 균형</div>
              <div className="text-sm font-semibold text-amber-100">일주: {pillars.dayPillar.stemHanja}{pillars.dayPillar.branchHanja} ({pillars.dayPillar.stem}{pillars.dayPillar.branch})</div>
              <p className="text-xs text-amber-300/70 mt-2">
                목({pillars.fiveElementsDistribution.wood}) 火({pillars.fiveElementsDistribution.fire}) 土({pillars.fiveElementsDistribution.earth}) 金({pillars.fiveElementsDistribution.metal}) 水({pillars.fiveElementsDistribution.water}) 오행 상생 기운 형성
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-xl border border-amber-900/40">
              <div className="text-xs text-amber-400 font-medium mb-1">2. 수리학 격국</div>
              <div className="text-sm font-semibold text-amber-100">{numerology.primaryGrid}</div>
              <p className="text-xs text-amber-300/70 mt-2">
                생년월일 수리 {numerology.birthNumber}수와 이름 수리 {numerology.nameLengthNumber}격의 자장 조화
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-xl border border-amber-900/40">
              <div className="text-xs text-amber-400 font-medium mb-1">3. 자미두수 명궁 주성</div>
              <div className="text-sm font-semibold text-amber-100">{ziwei.lifeHouse}</div>
              <p className="text-xs text-amber-300/70 mt-2">
                재백궁({ziwei.wealthHouse}) 및 관록궁({ziwei.careerHouse}) 별 배치의 길흉 총괄
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: 사주학 (Four Pillars) */}
      {activeTab === 'saju' && (
        <div className="bg-slate-900 border border-amber-900/40 rounded-b-2xl rounded-tr-2xl p-6 sm:p-8 text-amber-50 space-y-6 shadow-xl">
          <h3 className="text-xl font-bold font-serif text-amber-100 mb-4 flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span>만세력 사주팔자 (四柱八字) 분석</span>
          </h3>

          {/* 사주 명반 표 */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4 bg-slate-950 p-4 sm:p-6 rounded-2xl border border-amber-900/60 text-center font-serif">
            <div>
              <div className="text-xs text-amber-400/70 mb-2">시주 (時柱)</div>
              {pillars.hourPillar ? (
                <>
                  <div className="text-2xl font-bold text-amber-200">{pillars.hourPillar.stemHanja}</div>
                  <div className="text-2xl font-bold text-amber-100 mt-1">{pillars.hourPillar.branchHanja}</div>
                  <div className="text-[11px] text-amber-400/60 mt-2">({pillars.hourPillar.stem}{pillars.hourPillar.branch})</div>
                </>
              ) : (
                <div className="text-xs text-amber-600 py-6">시간 미상</div>
              )}
            </div>

            <div>
              <div className="text-xs text-amber-400/70 mb-2">일주 (日柱) - 나</div>
              <div className="text-2xl font-bold text-amber-300">{pillars.dayPillar.stemHanja}</div>
              <div className="text-2xl font-bold text-amber-200 mt-1">{pillars.dayPillar.branchHanja}</div>
              <div className="text-[11px] text-amber-400/80 mt-2">({pillars.dayPillar.stem}{pillars.dayPillar.branch})</div>
            </div>

            <div>
              <div className="text-xs text-amber-400/70 mb-2">월주 (月柱)</div>
              <div className="text-2xl font-bold text-amber-200">{pillars.monthPillar.stemHanja}</div>
              <div className="text-2xl font-bold text-amber-100 mt-1">{pillars.monthPillar.branchHanja}</div>
              <div className="text-[11px] text-amber-400/60 mt-2">({pillars.monthPillar.stem}{pillars.monthPillar.branch})</div>
            </div>

            <div>
              <div className="text-xs text-amber-400/70 mb-2">년주 (年柱)</div>
              <div className="text-2xl font-bold text-amber-200">{pillars.yearPillar.stemHanja}</div>
              <div className="text-2xl font-bold text-amber-100 mt-1">{pillars.yearPillar.branchHanja}</div>
              <div className="text-[11px] text-amber-400/60 mt-2">({pillars.yearPillar.stem}{pillars.yearPillar.branch})</div>
            </div>
          </div>

          <div className="bg-slate-950 p-6 rounded-xl border border-amber-950 shadow-inner">
            <h4 className="text-base font-bold text-amber-300 mb-3 font-serif">사주 정밀 해석</h4>
            <p className="text-base text-amber-100/90 leading-loose font-sans">{reportData.sajuDetail.analysis}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-emerald-950/40 p-5 rounded-xl border border-emerald-900/40">
              <h5 className="text-sm font-bold text-emerald-400 mb-2">타고난 운명의 핵심 강점</h5>
              <ul className="space-y-2 text-sm sm:text-base text-emerald-200">
                {reportData.sajuDetail.strengths.map((s, idx) => (
                  <li key={idx} className="flex items-start space-x-1.5">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-950/40 p-5 rounded-xl border border-amber-900/40">
              <h5 className="text-sm font-bold text-amber-400 mb-2">보완해야 할 기운</h5>
              <ul className="space-y-2 text-sm sm:text-base text-amber-200">
                {reportData.sajuDetail.weaknesses.map((w, idx) => (
                  <li key={idx} className="flex items-start space-x-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: 동양 수리학 (Numerology) */}
      {activeTab === 'numerology' && (
        <div className="bg-slate-900 border border-amber-900/40 rounded-b-2xl rounded-tr-2xl p-6 sm:p-8 text-amber-50 space-y-6 shadow-xl">
          <h3 className="text-xl font-bold font-serif text-amber-100 mb-4 flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-amber-400" />
            <span>동양 수리학 (81수리 격국) 분석</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-5 rounded-xl border border-amber-900/40">
              <div className="text-xs text-amber-400/80 mb-1">성명 및 획수 수리격</div>
              <div className="text-xl font-bold text-amber-200 font-serif">{numerology.primaryGrid}</div>
              <p className="text-xs text-amber-300/60 mt-2">이름 수리 {numerology.nameLengthNumber}격 자장 형성</p>
            </div>

            <div className="bg-slate-950 p-5 rounded-xl border border-amber-900/40">
              <div className="text-xs text-amber-400/80 mb-1">생년월일 신기 수리수</div>
              <div className="text-xl font-bold text-amber-200 font-serif">제 {numerology.birthNumber} 수리수</div>
              <p className="text-xs text-amber-300/60 mt-2">우주 파동수 계산 결과</p>
            </div>
          </div>

          <div className="bg-slate-950 p-6 rounded-xl border border-amber-950 shadow-inner">
            <h4 className="text-base font-bold text-amber-300 mb-3 font-serif">수리학 파동 풀이</h4>
            <p className="text-base text-amber-100/90 leading-loose font-sans">{reportData.numerologyDetail.analysis}</p>
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center space-x-3 text-sm">
              <span className="text-amber-400 font-semibold">행운의 수리 숫자:</span>
              <span className="text-amber-200 font-bold bg-amber-950 px-3 py-1.5 rounded border border-amber-800/60">
                {reportData.numerologyDetail.luckyNumbers.join(', ')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: 자미두수 (Zi Wei Dou Shu) */}
      {activeTab === 'ziwei' && (
        <div className="bg-slate-900 border border-amber-900/40 rounded-b-2xl rounded-tr-2xl p-6 sm:p-8 text-amber-50 space-y-6 shadow-xl">
          <h3 className="text-xl font-bold font-serif text-amber-100 mb-4 flex items-center space-x-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <span>자미두수 12궁 명반 (紫微斗數)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ziwei.houses.map((house, idx) => (
              <div key={idx} className="bg-slate-950 p-5 rounded-xl border border-amber-900/50">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-base font-bold text-amber-200 font-serif">{house.name}</span>
                  <span className="text-xs sm:text-sm text-amber-400 bg-amber-950 px-2.5 py-1 rounded border border-amber-800">
                    주성: {house.stars.join(', ')}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-amber-300/80 leading-relaxed">{house.description}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-950 p-6 rounded-xl border border-amber-950 shadow-inner">
            <h4 className="text-base font-bold text-amber-300 mb-3 font-serif">자미두수 총평 해석</h4>
            <p className="text-base text-amber-100/90 leading-loose font-sans">{reportData.ziWeiDetail.analysis}</p>
          </div>
        </div>
      )}

      {/* Tab 5: 인생 비책 4단계 */}
      {activeTab === 'strategies' && (
        <div className="bg-slate-900 border border-amber-900/40 rounded-b-2xl rounded-tr-2xl p-6 sm:p-8 text-amber-50 space-y-6 shadow-xl">
          <h3 className="text-xl font-bold font-serif text-amber-100 mb-4 flex items-center space-x-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <span>인생 비책 4단계 (4-Step Life Strategy)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-950 p-6 rounded-2xl border border-amber-900/50">
              <div className="flex items-center space-x-2 text-amber-400 mb-3">
                <Award className="w-5 h-5" />
                <h4 className="text-base font-bold font-serif text-amber-200">1. 재물운 비책</h4>
              </div>
              <p className="text-base text-amber-100/90 leading-loose font-sans">{reportData.lifeStrategies.wealth}</p>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-amber-900/50">
              <div className="flex items-center space-x-2 text-amber-400 mb-3">
                <Heart className="w-5 h-5" />
                <h4 className="text-base font-bold font-serif text-amber-200">2. 애정 / 궁합 비책</h4>
              </div>
              <p className="text-base text-amber-100/90 leading-loose font-sans">{reportData.lifeStrategies.relationship}</p>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-amber-900/50">
              <div className="flex items-center space-x-2 text-amber-400 mb-3">
                <Briefcase className="w-5 h-5" />
                <h4 className="text-base font-bold font-serif text-amber-200">3. 직업 / 건강 비책</h4>
              </div>
              <p className="text-base text-amber-100/90 leading-loose font-sans">{reportData.lifeStrategies.careerAndHealth}</p>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-amber-900/50">
              <div className="flex items-center space-x-2 text-amber-400 mb-3">
                <Calendar className="w-5 h-5" />
                <h4 className="text-base font-bold font-serif text-amber-200">4. 올해의 핵심 총운</h4>
              </div>
              <p className="text-base text-amber-100/90 leading-loose font-sans">{reportData.lifeStrategies.yearFortune}</p>
            </div>
          </div>
        </div>
      )}

      {/* 텅 빈 하단부를 채우는 프리미엄 행운 수칙 마감 장식 */}
      <div className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/30 p-6 rounded-2xl border border-amber-800/40 text-center space-y-2 mt-8">
        <Sparkles className="w-5 h-5 text-amber-400 mx-auto animate-pulse" />
        <h4 className="text-base font-bold font-serif text-amber-200">인생의 흐름을 지배하는 황금률</h4>
        <p className="text-sm text-amber-300/80 max-w-xl mx-auto leading-relaxed">
          "운명은 정해진 종착지가 아니라, 자신에게 유리한 바람을 타고 노를 젓는 여정입니다. 사주와 자미두수가 알려준 기운을 바탕으로 매 순간 긍정적인 파동을 끌어당기십시오."
        </p>
      </div>
    </div>
  );
};
