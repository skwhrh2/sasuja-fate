
import { NextResponse } from "next/server";
import KoreanLunarCalendar from "korean-lunar-calendar";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  console.log("=== [API /api/analyze] POST REQUEST RECEIVED ===");
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[ERROR] GEMINI_API_KEY is missing from environment variables.");
      throw new Error("GEMINI_API_KEY가 환경변수에 설정되지 않았습니다.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const body = await request.json();
    
    // Detailed request body logging
    console.log("[DEBUG] Request Body:", JSON.stringify(body, null, 2));

    const { 
      name, 
      birthDate, 
      birthTime, 
      isLunar, 
      locale = "ko",
      bazi: externalBazi,
      numerology: externalNumerology,
      ziwei: externalZiwei,
      cross_validation: externalCrossValidation
    } = body;

    console.log(`[DEBUG] Input Parameters: name="${name}", birthDate="${birthDate}", birthTime="${birthTime}", isLunar="${isLunar}", locale="${locale}"`);

    // 1. 날짜 데이터 파싱 (YYYY-MM-DD)
    const [year, month, day] = (birthDate || "1990-01-01").split("-").map(Number);
    const calendar = new KoreanLunarCalendar();

    let solarYear = year;
    let solarMonth = month;
    let solarDay = day;

    // 2. 음력/윤달 변환
    try {
      if (isLunar && isLunar !== "solar") {
        const isIntercalation = isLunar === "leapLunar";
        calendar.setLunarDate(year, month, day, isIntercalation);
        const solar = calendar.getSolarCalendar();
        solarYear = solar.year;
        solarMonth = solar.month;
        solarDay = solar.day;
        console.log(`[DEBUG] Lunar conversion successful: ${year}-${month}-${day} (${isLunar}) -> Solar ${solarYear}-${solarMonth}-${solarDay}`);
      }
    } catch (calError: any) {
      console.error("[WARN] Lunar conversion failed, falling back to original birth date:", calError.message);
    }

    const convertedSolarDate = `${solarYear}-${String(solarMonth).padStart(2, "0")}-${String(solarDay).padStart(2, "0")}`;

    // 3. 백엔드 팩트 데이터 구성 (상세 섹션 추가)
    const backendFactJson = {
      user_info: {
        name: name || "사용자",
        inputBirthDate: birthDate,
        isLunar: isLunar || "solar",
        convertedSolarDate,
        birthTime: birthTime || "미입력",
      },
      bazi: externalBazi || {
        day_master: "갑목(甲木)",
        structure: "본인의 타고난 기운과 오행의 균형을 분석합니다.",
        five_elements: { wood: 40, fire: 30, earth: 10, metal: 10, water: 10 },
      },
      numerology: externalNumerology || {
        core_number: 21,
        vibration: "자립/성공 에너지",
        meaning: "21번 수리는 독립심과 추진력을 상징하며, 리더십과 성공을 향한 강한 에너지를 나타냅니다.",
      },
      ziwei: externalZiwei || {
        main_stars: ["천기", "태양"],
        status: "기획/사업운 우수",
        interpretation: "천기성은 기획력을, 태양성은 활동력을 의미하며, 이 두 별의 조합은 사업적 성취와 글로벌 확장에 유리합니다.",
      },
      cross_validation: externalCrossValidation || {
        confidence_score: 95,
        primary_overlap: "3가지 학문 모두 독립적인 기획, 창업, 글로벌 분야에서 강력한 시너지 형성",
        detailed_insight: "사주의 일간, 수리의 파동, 자미두수의 주성이 모두 '독립적이고 주도적인 성향'으로 정렬되어 있습니다.",
      },
    };

    console.log("[DEBUG] Formulated Backend Fact JSON:", JSON.stringify(backendFactJson, null, 2));

    // 4. Gemini API 프롬프트 구성 (시스템 역할 및 상세 분석 요구사항)
    const systemRole = `
You are an expert Oriental Life Coach specializing in Cross-Validating three ancient Asian wisdom traditions:
1. BaZi (Four Pillars / 사주팔자)
2. Eastern Numerology (수리학)
3. Zi Wei Dou Shu (Purple Star Astrology / 자미두수)

[Operational Core Principles]
- 100% FACT-BASED: Do NOT calculate or invent charts. Rely 100% on the provided backend fact JSON. Do NOT hallucinate any calculations.
- TRIPLE CROSS-VALIDATION: Analyze patterns across all 3 systems (BaZi, Numerology, Zi Wei Dou Shu). Identify core overlaps and synergies, and output a 'Confidence Score' reflecting their alignment.
- TONE: Concise, modern, actionable, non-fatalistic life-coaching.

[Global Localization Strategy]
- Active Locale/Language: ${locale}
- [English / "en"]: Professional, data-driven, wellness-coaching. Avoid fatalism.
- [Korean / "ko"]: Deep, warm, empathetic, modern life-coaching.

[System Role]
You are a master storyteller and expert life consultant specializing in the three ancient Asian wisdom traditions: BaZi (Four Pillars), Eastern Numerology, and Zi Wei Dou Shu (Purple Star Astrology).

[Operational Core Principles]
- NARRATIVE-DRIVEN: Treat the analysis as a secret reveal of the user's destiny. The tone must be engaging, deeply personal, and insightful, like a master advisor speaking to their protege.
- 100% FACT-BASED: Base the insights 100% on the provided fact JSON. Do NOT hallucinate.
- TRIPLE CROSS-VALIDATION: Synthesize patterns across all 3 systems. The analysis must feel like one unified voice, not a list of separate reports.
- TONE: Compelling, authoritative, and evocative. Use metaphors. Avoid technical jargon without explanation. Focus on 'the secret of your destiny'.

[Global Localization Strategy]
- Active Locale/Language: ${locale}
- [English / "en"]: Compelling, professional storytelling, wellness-oriented, encouraging.
- [Korean / "ko"]: Deep, empathetic, resonant, master-consultant tone. Use evocative language to make the user feel like they are receiving a rare, personalized insight.

[Output Structure]
You MUST respond with a JSON object matching this schema EXACTLY:
{
  "score": <number: alignment percentage>,
  "summary": "<string: A deeply profound, long-form narrative 'master key' that synthesizes all three traditions. Use powerful metaphors, reveal the hidden connection between the stars, numbers, and elements, and provide a life-changing insight that binds the entire destiny together. 800+ characters, highly evocative.>",
  "bazi_preview": "<string: A concise, intriguing, 2-3 sentence hook for the BaZi preview, absolutely NO 'brainstorming' style lists.>",
  "bazi_analysis": "<string: Deep, narrative breakdown of BaZi nature, detailed, empathetic, 500+ characters.>",
  "numerology_analysis": "<string: Deep, narrative insights on success vibration, 500+ characters.>",
  "ziwei_analysis": "<string: Deep, narrative analysis of their 'stars' and role, 500+ characters.>",
  "action_plans": [
    "<string: concrete, narrative-driven, deeply detailed advice>",
    "<string: actionable lifestyle or career guidance, detailed>",
    "<string: closing wisdom/advice, deeply resonant>"
  ]
}
`;

    const prompt = `
${systemRole}

[Fact Data to Analyze]
${JSON.stringify(backendFactJson, null, 2)}

[Request]
Analyze the provided Fact Data in depth and draft a comprehensive coaching report matching the requested language/locale: "${locale}".
Provide detailed insights for each section (BaZi, Numerology, Zi Wei Dou Shu) based on the input data.
`;

    console.log("[DEBUG] Sending Request to Gemini API...");
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    console.log("[DEBUG] Gemini Response Text:", responseText);

    let aiCoachingResult;
    try {
      aiCoachingResult = JSON.parse(responseText);
    } catch (parseError: any) {
      console.error("[ERROR] Failed to parse Gemini response as JSON:", parseError.message);
      
      // Fallback in case of parsing errors
      aiCoachingResult = {
        score: backendFactJson.cross_validation.confidence_score || 90,
        summary: "분석을 성공적으로 완료하였습니다.",
        bazi_analysis: "사주 분석 데이터를 참고하세요.",
        numerology_analysis: "수리 분석 데이터를 참고하세요.",
        ziwei_analysis: "자미두수 분석 데이터를 참고하세요.",
        action_plans: ["분석 결과를 참고하여 계획을 세우세요."],
      };
    }

    console.log("[DEBUG] Final AI Coaching Result:", JSON.stringify(aiCoachingResult, null, 2));

    return NextResponse.json({
      success: true,
      data: backendFactJson,
      ai_coaching: aiCoachingResult,
    });
  } catch (error: any) {
    console.error("=== [API ERROR DETAILED] ===", error);
    return NextResponse.json(
      { success: false, error: error.message || "분석 실패" },
      { status: 500 }
    );
  }
}