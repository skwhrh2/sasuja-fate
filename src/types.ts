export type CalendarType = 'solar' | 'lunar_sol' | 'lunar_leap';
export type Gender = 'male' | 'female';

export interface SajuInput {
  name: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number; // -1 for unknown
  birthMinute?: number;
  gender: Gender;
  calendarType: CalendarType;
}

export interface Ganji {
  stem: string; // 천간 (갑, 을, 병, 정...)
  stemHanja: string;
  branch: string; // 지지 (자, 축, 인, 묘...)
  branchHanja: string;
  element: string; // 오행 (木, 火, 土, 金, 水)
}

export interface FourPillars {
  yearPillar: Ganji;
  monthPillar: Ganji;
  dayPillar: Ganji;
  hourPillar: Ganji | null;
  fiveElementsDistribution: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
}

export interface NumerologyAnalysis {
  birthNumber: number;
  nameLengthNumber: number;
  primaryGrid: string; // 원격, 형격, 이격, 정격
  summary: string;
}

export interface ZiWeiHouse {
  name: string; // 명궁, 관록궁, 재백궁, 부처궁 등
  stars: string[]; // 자미, 태양, 무곡 등
  description: string;
}

export interface ZiWeiAnalysis {
  lifeHouse: string; // 명궁 주성
  wealthHouse: string; // 재백궁 주성
  careerHouse: string; // 관록궁 주성
  marriageHouse: string; // 부처궁 주성
  houses: ZiWeiHouse[];
}

export interface SajuReportData {
  masterKeySummary: string; // 통합 총론: 운명의 마스터키
  sajuDetail: {
    analysis: string;
    strengths: string[];
    weaknesses: string[];
  };
  numerologyDetail: {
    analysis: string;
    luckyNumbers: number[];
  };
  ziWeiDetail: {
    analysis: string;
    starPatterndesc: string;
  };
  lifeStrategies: {
    wealth: string; // 재물 비책
    relationship: string; // 애정/궁합 비책
    careerAndHealth: string; // 직업/건강 비책
    yearFortune: string; // 올해의 핵심 총운
  };
}

export interface IChingResult {
  question: string;
  hexagramName: string; // 예: 乾爲天 (건위천), 水雷屯 (수뢰둔)
  hexagramSymbol: string; // 예: ☰☰
  interpretation: string; // 주역 신탁 풀이
  actionPlan: string; // 구체적 1:1 처방 비책
  timestamp: string;
}
