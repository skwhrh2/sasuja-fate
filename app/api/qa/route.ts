import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getAuthenticatedUser, supabase } from "../../../lib/db";

const QA_PRICE_POINTS = 1500;

// 동양 주역 64괘 중 대표적인 8대 핵심 괘 데이터
const ICHING_HEXAGRAMS = [
  { num: 1, name: "중천건(重天乾)", symbol: "䷀", keyword: "하늘 / 창조와 시작", desc: "모든 기운이 힘차게 시작되는 극상의 대길괘입니다. 용이 하늘을 날듯 씩씩한 추진력과 강한 주체성이 빛을 발하는 타이밍입니다." },
  { num: 2, name: "중지곤(重地坤)", symbol: "䷁", keyword: "대지 / 수용과 포용", desc: "봄 대지가 만물을 품어 기르듯, 겸손하고 부드러운 포용력이 성공을 부르는 시기입니다. 억지로 이끌려 하기보다 순리를 따를 때 길합니다." },
  { num: 3, name: "수뢰준(水雷屯)", symbol: "䷂", keyword: "싹틈 / 웅크림과 개척", desc: "단단한 겨울 얼음땅을 뚫고 파릇한 새싹이 돋아나는 기운입니다. 초기에는 다소 막힘과 어려움이 있으나 인내하면 눈부시게 번성합니다." },
  { num: 11, name: "지천태(地天泰)", symbol: "䷊", keyword: "태평 / 조화와 번영", desc: "하늘와 땅이 만나 만물이 무르익고 평화가 깃드는 최고의 길괘입니다. 안팎의 갈등이 눈 녹듯 풀리고 재물과 안정이 조화롭게 찾아옵니다." },
  { num: 12, name: "천지비(天地否)", symbol: "䷋", keyword: "막힘 / 대기방처", desc: "하늘과 땅이 서로 어긋나 소통이 막히는 괘입니다. 조급하게 도망치거나 승부를 보려 하지 말고, 신중하게 내실을 다지며 때를 기다려야 합니다." },
  { num: 14, name: "화천대유(火天大有)", symbol: "䷍", keyword: "대유 / 풍요와 명예", desc: "하늘 위에 태양이 눈부시게 빛나며 세상 온 누리를 비추는 대단한 수확과 풍요의 괘입니다. 노력한 모든 대가가 결실로 돌아옵니다." },
  { num: 24, name: "지뢰복(地雷復)", symbol: "䷗", keyword: "되돌아옴 / 회복과 순환", desc: "추운 겨울이 가고 봄의 따스한 새 생명이 돌아오는 회복의 기운입니다. 잃어버린 기운이나 건강, 재물이 상쾌하게 제자리를 찾게 됩니다." },
  { num: 64, name: "화수미제(火수未濟)", symbol: "䷿", keyword: "미완 / 가능성과 희망", desc: "아직 강을 다 건너지 못했으나, 눈앞에 새로운 희망의 여명이 밝아오는 괘입니다. 완성을 향해 한 걸음만 더 내디디면 대길로 향합니다." }
];

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 유료 결제 회원 검증 가드 (birthDate 컬럼 확인)
    if (!user.birthDate) {
      return NextResponse.json(
        { success: false, error: "종합 운명 리포트를 결제하여 본인의 생년월일이 정상 등록된 회원님만 이용 가능한 서비스입니다." },
        { status: 403 }
      );
    }

    if (user.points < QA_PRICE_POINTS) {
      return NextResponse.json(
        { success: false, error: `포인트가 부족합니다. (필요: ${QA_PRICE_POINTS}P, 보유: ${user.points}P)` },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key missing");

    const ai = new GoogleGenAI({ apiKey });
    const { question, context } = await request.json();

    if (!question) {
      return NextResponse.json(
        { success: false, error: "질문 내용이 누락되었습니다." },
        { status: 400 }
      );
    }

    // 1. 포인트 차감
    const { error: updateError } = await supabase
      .from("users")
      .update({ points: user.points - QA_PRICE_POINTS })
      .eq("id", user.id);

    if (updateError) {
      throw new Error(`포인트 차감에 실패했습니다: ${updateError.message}`);
    }

    // 2. 포인트 사용 히스토리 기록
    await supabase.from("point_histories").insert({
      user_id: user.id,
      amount: -QA_PRICE_POINTS,
      type: "qa_consult",
      description: `주역 1문1답 비책 질문: ${question.substring(0, 15)}...`,
    });

    // 3. 결정론적 주역 괘 산출 (유저 생년월일 + 질문 글자 수 + 오늘 날짜 숫자 해시 조합)
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const birthStr = user.birthDate; // YYYY-MM-DD
    const qLen = question.length;
    
    const combinedSum = todayStr.split("-").map(Number).reduce((a, b) => a + b, 0) + 
                        birthStr.split("-").map(Number).reduce((a, b) => a + b, 0) + 
                        qLen;
    
    // 64괘 인덱스 결정론적 점지 (1~64)
    const hexagramIndex = combinedSum % 64; 
    const hexagramNum = (hexagramIndex === 0) ? 64 : hexagramIndex;

    // 8대 주역 괘셋에서 대조하고 없으면 기본 괘 구성
    const matched = ICHING_HEXAGRAMS.find(h => h.num === hexagramNum);
    const systemIChingData = matched || {
      num: hexagramNum,
      name: `주역 제 ${hexagramNum}괘`,
      symbol: "䷡",
      keyword: "조화와 변화",
      desc: "하늘의 거대한 흐름 속에서 자연의 이치를 따를 때 길함을 얻을 수 있는 점진적인 성장의 수리 괘상입니다."
    };

    // 4. 게임화 점수 및 길흉 등급 산출 (시드 연산 기반)
    const luckScore = 60 + (combinedSum % 41); // 60 ~ 100점 분포
    let luckGrade = "평평(平平)";
    if (luckScore >= 90) {
      luckGrade = "대길(大吉) 👑";
    } else if (luckScore >= 75) {
      luckGrade = "소길(小吉) ✨";
    } else if (luckScore < 68) {
      luckGrade = "대비(待備) 🛡️";
    }

    // 5. 주역 융합형 프롬프트 작성 (JSON 반환 규정)
    const prompt = `
[System Role]
You are an expert Oriental Life Coach and a master of the I Ching (주역/周易) specializing in gamified, addictive daily consultations. You provide a deep, highly engaging, and comforting 1:1 answer for a premium user's specific concern, resolved using an I Ching Hexagram.

[Client Profile Context]
- Name: ${user.name}
- Birth Date: ${user.birthDate}
- BaZi Day Master: ${context?.bazi?.day_master || "알 수 없음"}

[Client's Question (고민 내용)]
"${question}"

[Determined I Ching Hexagram for this Question]
- Hexagram Number: ${systemIChingData.num}
- Name: ${systemIChingData.name}
- Symbol: ${systemIChingData.symbol}
- Key Concept: ${systemIChingData.keyword}
- Core Traditional Meaning: ${systemIChingData.desc}

[Determined Luck Metrics]
- Fortune Score (운세 점수): ${luckScore}
- Grade (길흉 등급): ${luckGrade}

[Output Requirements]
You MUST respond with a single JSON object matching this schema EXACTLY:
{
  "score": ${luckScore},
  "grade": "${luckGrade}",
  "hexagram_symbol": "${systemIChingData.symbol}",
  "hexagram_name": "${systemIChingData.name}",
  "lucky_color": "<string: A specific lucky color for today in Korean, e.g. '로얄 골드', '포레스트 그린'>",
  "lucky_item": "<string: A specific everyday action or item that opens luck in Korean, e.g. '오전 중 시원한 물 한 잔 마시기', '은색 액세서리 착용'>",
  "jinx": "<string: A caution/avoidance for today in Korean, e.g. '북쪽 방향으로의 섣부른 이동 금지', '오후 3시 이후 충동적인 지출'>",
  "answer": "<string: Markdown formatted text. 1:1 response that addresses their question directly. Write it in Korean (ko) using 3 sections: 1. 🌟 주역으로 해석한 해답, 2. 💡 구체적인 실천 행동 비책, 3. 🕊️ 마음가짐과 인덕 조언. Wrap each section with clear markdown headers.>"
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const resultData = JSON.parse(response.text || "{}");

    return NextResponse.json({ 
      success: true, 
      points: user.points - QA_PRICE_POINTS,
      score: luckScore,
      grade: luckGrade,
      hexagram: systemIChingData,
      lucky_color: resultData.lucky_color || "엠버 골드",
      lucky_item: resultData.lucky_item || "가벼운 산책",
      jinx: resultData.jinx || "조급한 결정",
      answer: resultData.answer || "답변을 불러오지 못했습니다.",
    });
  } catch (error: any) {
    console.error("[ERROR] QA API 처리 중 에러:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
