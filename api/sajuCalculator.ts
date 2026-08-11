import KoreanLunarCalendar from 'korean-lunar-calendar';
import { SajuInput, FourPillars, Ganji, NumerologyAnalysis, ZiWeiAnalysis } from '../src/types';

const STEMS = [
  { kor: '갑', hanja: '甲', element: '木' },
  { kor: '을', hanja: '乙', element: '木' },
  { kor: '병', hanja: '丙', element: '火' },
  { kor: '정', hanja: '丁', element: '火' },
  { kor: '무', hanja: '戊', element: '土' },
  { kor: '기', hanja: '己', element: '土' },
  { kor: '경', hanja: '庚', element: '金' },
  { kor: '신', hanja: '辛', element: '金' },
  { kor: '임', hanja: '壬', element: '水' },
  { kor: '계', hanja: '癸', element: '水' },
];

const BRANCHES = [
  { kor: '자', hanja: '子', element: '水', animal: '쥐' },
  { kor: '축', hanja: '丑', element: '土', animal: '소' },
  { kor: '인', hanja: '寅', element: '木', animal: '호랑이' },
  { kor: '묘', hanja: '卯', element: '木', animal: '토끼' },
  { kor: '진', hanja: '辰', element: '土', animal: '용' },
  { kor: '사', hanja: '巳', element: '火', animal: '뱀' },
  { kor: '오', hanja: '午', element: '火', animal: '말' },
  { kor: '미', hanja: '未', element: '土', animal: '양' },
  { kor: '신', hanja: '申', element: '金', animal: '원숭이' },
  { kor: '유', hanja: '酉', element: '金', animal: '닭' },
  { kor: '술', hanja: '戌', element: '土', animal: '개' },
  { kor: '해', hanja: '亥', element: '水', animal: '돼지' },
];

export function calculateFourPillars(input: SajuInput): FourPillars {
  const calendar = new KoreanLunarCalendar();
  
  let solarYear = input.birthYear;
  let solarMonth = input.birthMonth;
  let solarDay = input.birthDay;

  if (input.calendarType !== 'solar') {
    const isIntercalation = input.calendarType === 'lunar_leap';
    calendar.setLunarDate(input.birthYear, input.birthMonth, input.birthDay, isIntercalation);
    const solarCal = calendar.getSolarCalendar();
    if (solarCal) {
      solarYear = solarCal.year;
      solarMonth = solarCal.month;
      solarDay = solarCal.day;
    }
  }

  // 1. 년주 (Year Pillar)
  // 1900년 = 경자년 (Stem 6, Branch 0)
  const yearStemIdx = (solarYear - 4) % 10 < 0 ? ((solarYear - 4) % 10) + 10 : (solarYear - 4) % 10;
  const yearBranchIdx = (solarYear - 4) % 12 < 0 ? ((solarYear - 4) % 12) + 12 : (solarYear - 4) % 12;

  const yearPillar: Ganji = {
    stem: STEMS[yearStemIdx].kor,
    stemHanja: STEMS[yearStemIdx].hanja,
    branch: BRANCHES[yearBranchIdx].kor,
    branchHanja: BRANCHES[yearBranchIdx].hanja,
    element: `${STEMS[yearStemIdx].element}/${BRANCHES[yearBranchIdx].element}`,
  };

  // 2. 월주 (Month Pillar) - 대략적 오운육기 월건 계산
  const monthBranchIdx = (solarMonth + 1) % 12;
  const monthStemIdx = ((yearStemIdx % 5) * 2 + (solarMonth + 1)) % 10;

  const monthPillar: Ganji = {
    stem: STEMS[monthStemIdx].kor,
    stemHanja: STEMS[monthStemIdx].hanja,
    branch: BRANCHES[monthBranchIdx].kor,
    branchHanja: BRANCHES[monthBranchIdx].hanja,
    element: `${STEMS[monthStemIdx].element}/${BRANCHES[monthBranchIdx].element}`,
  };

  // 3. 일주 (Day Pillar) - 기준일(1900년 1월 31일 = 갑진일)을 기반으로 계산
  const baseDate = new Date(1900, 0, 31);
  const targetDate = new Date(solarYear, solarMonth - 1, solarDay);
  const diffDays = Math.floor((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const dayStemIdx = Math.abs(diffDays) % 10;
  const dayBranchIdx = Math.abs(diffDays) % 12;

  const dayPillar: Ganji = {
    stem: STEMS[dayStemIdx].kor,
    stemHanja: STEMS[dayStemIdx].hanja,
    branch: BRANCHES[dayBranchIdx].kor,
    branchHanja: BRANCHES[dayBranchIdx].hanja,
    element: `${STEMS[dayStemIdx].element}/${BRANCHES[dayBranchIdx].element}`,
  };

  // 4. 시주 (Hour Pillar)
  let hourPillar: Ganji | null = null;
  if (input.birthHour >= 0) {
    // 2시간 단위 시지 (자시: 23~01시)
    const hourBranchIdx = Math.floor((input.birthHour + 1) / 2) % 12;
    const hourStemIdx = ((dayStemIdx % 5) * 2 + hourBranchIdx) % 10;

    hourPillar = {
      stem: STEMS[hourStemIdx].kor,
      stemHanja: STEMS[hourStemIdx].hanja,
      branch: BRANCHES[hourBranchIdx].kor,
      branchHanja: BRANCHES[hourBranchIdx].hanja,
      element: `${STEMS[hourStemIdx].element}/${BRANCHES[hourBranchIdx].element}`,
    };
  }

  // 5. 오행 분포
  const dist = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const addElement = (elem: string) => {
    if (elem === '木') dist.wood += 1;
    else if (elem === '火') dist.fire += 1;
    else if (elem === '土') dist.earth += 1;
    else if (elem === '金') dist.metal += 1;
    else if (elem === '水') dist.water += 1;
  };

  addElement(STEMS[yearStemIdx].element);
  addElement(BRANCHES[yearBranchIdx].element);
  addElement(STEMS[monthStemIdx].element);
  addElement(BRANCHES[monthBranchIdx].element);
  addElement(STEMS[dayStemIdx].element);
  addElement(BRANCHES[dayBranchIdx].element);

  if (hourPillar) {
    const hourBranchIdx = Math.floor((input.birthHour + 1) / 2) % 12;
    const hourStemIdx = ((dayStemIdx % 5) * 2 + hourBranchIdx) % 10;
    addElement(STEMS[hourStemIdx].element);
    addElement(BRANCHES[hourBranchIdx].element);
  }

  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    fiveElementsDistribution: dist,
  };
}

export function calculateNumerology(input: SajuInput): NumerologyAnalysis {
  const nameLen = input.name.length;
  const digitsSum = String(input.birthYear)
    .split('')
    .concat(String(input.birthMonth).split(''))
    .concat(String(input.birthDay).split(''))
    .reduce((acc, curr) => acc + parseInt(curr, 10), 0);

  const birthNumber = (digitsSum % 9) || 9;
  const nameLengthNumber = (nameLen * 7) % 81 || 81;

  let primaryGrid = '길격 (吉格)';
  if ([21, 23, 24, 31, 32, 33, 35, 37, 39, 41, 45, 47, 48, 52, 61, 63, 65, 67, 68, 81].includes(nameLengthNumber)) {
    primaryGrid = '대길격 (大吉格)';
  } else if ([2, 4, 9, 10, 12, 14, 19, 20, 22, 28, 34, 44, 54, 59, 62, 64, 66, 69, 70, 72, 74, 76, 79, 80].includes(nameLengthNumber)) {
    primaryGrid = '흉격 (凶格) - 상충 및 보안 요망';
  }

  return {
    birthNumber,
    nameLengthNumber,
    primaryGrid,
    summary: `수리 $${nameLengthNumber}격과 수리수 $${birthNumber}의 결합`,
  };
}

export function calculateZiWei(input: SajuInput): ZiWeiAnalysis {
  const starsList = ['자미 (紫微)', '천부 (天府)', '태양 (太陽)', '태음 (太陰)', '무곡 (武曲)', '칠살 (七殺)', '파군 (破軍)', '천상 (天相)'];
  const index = (input.birthYear + input.birthMonth + input.birthDay) % starsList.length;
  
  const mainStar = starsList[index];
  const wealthStar = starsList[(index + 2) % starsList.length];
  const careerStar = starsList[(index + 4) % starsList.length];
  const marriageStar = starsList[(index + 6) % starsList.length];

  return {
    lifeHouse: mainStar,
    wealthHouse: wealthStar,
    careerHouse: careerStar,
    marriageHouse: marriageStar,
    houses: [
      { name: '명궁 (命宮)', stars: [mainStar, '좌보'], description: '본인의 성품, 근본 운명, 삶의 태도를 관장' },
      { name: '재백궁 (財帛宮)', stars: [wealthStar, '우필'], description: '재물 운, 수입 및 지출 방식과 금전적 그릇' },
      { name: '관록궁 (官祿宮)', stars: [careerStar, '문창'], description: '직업, 사회적 성취, 명예와 사업운' },
      { name: '부처궁 (夫妻宮)', stars: [marriageStar, '문곡'], description: '배우자 인연, 결혼 생활, 애정 기운' },
    ],
  };
}
