import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { calculateFourPillars, calculateNumerology, calculateZiWei } from "./src/utils/sajuCalculator.ts";
import { SajuInput } from "./src/types.ts";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client with standard Telemetry Header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "SasujaFate AI Engine" });
});

// 1. 3대 동양철학 크로스 검증 사주 분석 API
app.post("/api/saju/analyze", async (req, res) => {
  try {
    const input: SajuInput = req.body;

    if (!input.name || !input.birthYear || !input.birthMonth || !input.birthDay) {
      return res.status(400).json({ error: "필수 생년월일시 데이터가 누락되었습니다." });
    }

    // 로컬 알고리즘을 통한 기본 만세력/수리학/자미두수 데이터 산출
    const pillars = calculateFourPillars(input);
    const numerology = calculateNumerology(input);
    const ziwei = calculateZiWei(input);

    const timeString = input.birthHour >= 0 ? `${input.birthHour}시` : "시간 미상";
    const calendarTypeString =
      input.calendarType === "solar"
        ? "양력"
        : input.calendarType === "lunar_sol"
        ? "음력 (평달)"
        : "음력 (윤달)";

    const prompt = `
당신은 대한민국 최고의 동양 철학 대가이자 '사수자패트(SasujaFate)'의 수석 운명 코치입니다.
다음 사용자의 사주 팔자, 동양 수리학, 자미두수 데이터를 종합적으로 **크로스 검증(Cross-validation)**하여 명쾌하고 정밀한 인생 코칭 리포트를 작성하세요.

[사용자 기본 정보]
- 이름: ${input.name}
- 성별: ${input.gender === "male" ? "남성" : "여성"}
- 생년월일: ${input.birthYear}년 ${input.birthMonth}월 ${input.birthDay}일 (${calendarTypeString}) ${timeString}

[만세력 산출 데이터]
- 년주: ${pillars.yearPillar.stemHanja}(${pillars.yearPillar.stem})${pillars.yearPillar.branchHanja}(${pillars.yearPillar.branch})
- 월주: ${pillars.monthPillar.stemHanja}(${pillars.monthPillar.stem})${pillars.monthPillar.branchHanja}(${pillars.monthPillar.branch})
- 일주: ${pillars.dayPillar.stemHanja}(${pillars.dayPillar.stem})${pillars.dayPillar.branchHanja}(${pillars.dayPillar.branch})
- 시주: ${pillars.hourPillar ? `${pillars.hourPillar.stemHanja}(${pillars.hourPillar.stem})${pillars.hourPillar.branchHanja}(${pillars.hourPillar.branch})` : "미상"}
- 오행 분포: 목(${pillars.fiveElementsDistribution.wood}), 화(${pillars.fiveElementsDistribution.fire}), 토(${pillars.fiveElementsDistribution.earth}), 금(${pillars.fiveElementsDistribution.metal}), 수(${pillars.fiveElementsDistribution.water})

[수리학 및 자미두수 산출 데이터]
- 수리학 격국: ${numerology.primaryGrid} (수리수 ${numerology.birthNumber}, 이름 수리 ${numerology.nameLengthNumber})
- 자미두수 명궁 주성: ${ziwei.lifeHouse}, 재백궁 주성: ${ziwei.wealthHouse}, 관록궁 주성: ${ziwei.careerHouse}

다음 요구사항에 맞춰 JSON 형식으로 응답하세요:
1. masterKeySummary: 사주, 수리학, 자미두수의 공통분모를 추출한 '운명의 마스터키' 핵심 종합 총론 (3~4문장, 품격있고 진중한 어조)
2. sajuDetail: 사주 팔자 깊이 분석 (분석 내용, 강점 3가지, 보완점 2가지)
3. numerologyDetail: 수리학 성격 및 수리 격국 분석 (분석 내용, 행운의 숫자 3개)
4. ziWeiDetail: 자미두수 명반/주성 중심의 기운 분석
5. lifeStrategies: 인생 비책 4단계 (재물운 비책, 애정/궁합 비책, 직업/건강 비책, 올해의 핵심 총운 비책)
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "당신은 사주, 수리학, 자미두수를 통합 해석하는 최고의 운명학 거장입니다. 지혜롭고 권위있으며 따뜻하고 명쾌한 문체로 정밀 분석 결과를 JSON으로 작성하세요.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            masterKeySummary: { type: Type.STRING, description: "통합 총론 - 운명의 마스터키" },
            sajuDetail: {
              type: Type.OBJECT,
              properties: {
                analysis: { type: Type.STRING },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["analysis", "strengths", "weaknesses"],
            },
            numerologyDetail: {
              type: Type.OBJECT,
              properties: {
                analysis: { type: Type.STRING },
                luckyNumbers: { type: Type.ARRAY, items: { type: Type.INTEGER } },
              },
              required: ["analysis", "luckyNumbers"],
            },
            ziWeiDetail: {
              type: Type.OBJECT,
              properties: {
                analysis: { type: Type.STRING },
                starPatterndesc: { type: Type.STRING },
              },
              required: ["analysis", "starPatterndesc"],
            },
            lifeStrategies: {
              type: Type.OBJECT,
              properties: {
                wealth: { type: Type.STRING, description: "재물운 비책" },
                relationship: { type: Type.STRING, description: "애정/궁합 비책" },
                careerAndHealth: { type: Type.STRING, description: "직업/건강 비책" },
                yearFortune: { type: Type.STRING, description: "올해의 핵심 총운 비책" },
              },
              required: ["wealth", "relationship", "careerAndHealth", "yearFortune"],
            },
          },
          required: ["masterKeySummary", "sajuDetail", "numerologyDetail", "ziWeiDetail", "lifeStrategies"],
        },
      },
    });

    const reportData = JSON.parse(response.text || "{}");

    res.json({
      success: true,
      pillars,
      numerology,
      ziwei,
      reportData,
    });
  } catch (err: any) {
    console.error("Saju Analysis Error:", err);
    res.status(500).json({
      error: "사주 분석 처리 중 오류가 발생했습니다. 나중에 다시 시도해 주세요.",
      details: err.message,
    });
  }
});

// 2. 주역 1:1 비책 문의 API (신탁 애니메이션 연동)
app.post("/api/iching/consult", async (req, res) => {
  try {
    const { question, sajuName, dayPillarStem } = req.body;

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return res.status(400).json({ error: "질문을 입력해 주세요." });
    }

    const HEXAGRAMS = [
      { name: "건위천 (乾爲天)", symbol: "☰☰", meaning: "창대함, 강건함, 비상하는 용의 기상" },
      { name: "곤위지 (坤爲地)", symbol: "☷☷", meaning: "유순함, 모든 것을 품어안는 대지의 수용성" },
      { name: "수뢰둔 (水雷屯)", symbol: "☵☳", meaning: "새로운 시작의 어려움, 시련을 딛고 터져나오는 싹" },
      { name: "산수몽 (山水蒙)", symbol: "☶☵", meaning: "계몽과 스승의 가르침, 겸손한 준비" },
      { name: "수천수 (水天需)", symbol: "☵☰", meaning: "때를 기다리는 지혜, 축적과 유유자적" },
      { name: "천수송 (天水訟)", symbol: "☰☵", meaning: "다툼과 송사, 조화와 절제의 중요성" },
      { name: "지수사 (地水師)", symbol: "☷☵", meaning: "군사와 통솔력, 엄격한 질서와 전략" },
      { name: "수지비 (水地比)", symbol: "☵☷", meaning: "친목과 연대, 서로 협력하여 이루는 태평" },
      { name: "풍천소축 (風天小畜)", symbol: "☴☰", meaning: "조금씩 쌓이는 기운, 조급함을 버린 인내" },
      { name: "천택리 (天澤履)", symbol: "☰☱", meaning: "호랑이 꼬리를 밟듯 조심스러운 예의와 실천" },
      { name: "지천태 (地天泰)", symbol: "☷☰", meaning: "음양이 상통하는 대길, 만물이 번창함" },
      { name: "천지피 (天地否)", symbol: "☰☷", meaning: "소통이 막힌 시기, 내부 충실과 묵묵한 내실 다지기" },
      { name: "화천대유 (火天大有)", symbol: "☲☰", meaning: "풍요로움과 만인의 인정, 태양처럼 빛나는 성취" },
      { name: "화산려 (火山旅)", symbol: "☲☶", meaning: "나그네의 길, 순응과 겸손함으로 위기를 지혜롭게 피함" },
      { name: "풍뢰익 (風雷益)", symbol: "☴☳", meaning: "더욱 유익해지는 시기, 적극적 전진과 과감한 실행" },
    ];

    // 질문 및 사주에 기초하여 괘를 추첨
    const hexIndex = Math.abs(question.length * 7 + (sajuName ? sajuName.length : 3)) % HEXAGRAMS.length;
    const selectedHex = HEXAGRAMS[hexIndex];

    const prompt = `
사용자가 주역 1:1 비책 문의를 신청했습니다.

[사용자 정보]
- 질문자 성함: ${sajuName || "상담자"}
- 일주 천간 기운: ${dayPillarStem || "기본"}
- 고민 질문: "${question}"

[추출된 주역 64괘 신탁 괘]
- 괘 이름: ${selectedHex.name}
- 괘 상징: ${selectedHex.symbol} (${selectedHex.meaning})

Gemini의 주역 신탁 직관으로 질문자의 질문에 대해 명쾌하고 통찰력 넘치며 구체적인 비책을 제시하세요.
다음 JSON 형식으로 출력하세요:
1. hexagramName: "${selectedHex.name}"
2. hexagramSymbol: "${selectedHex.symbol}"
3. interpretation: 이 괘가 질문자의 현실 상황에 던지는 깊은 신탁풀이 및 성찰 (3~4문장)
4. actionPlan: 고민 해결을 위해 즉시 실행해야 할 3가지 구체적 비책/처방 행동 지침
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "당신은 주역 64괘의 신탁을 다루는 최고의 주역 신통 대가입니다. 질문자의 질문과 괘에 맞춘 깊이 있고 선명하며 현실적인 처방을 JSON으로 작성하세요.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hexagramName: { type: Type.STRING },
            hexagramSymbol: { type: Type.STRING },
            interpretation: { type: Type.STRING },
            actionPlan: { type: Type.STRING },
          },
          required: ["hexagramName", "hexagramSymbol", "interpretation", "actionPlan"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");

    res.json({
      success: true,
      result: {
        ...result,
        question,
        timestamp: new Date().toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    });
  } catch (err: any) {
    console.error("IChing Consultation Error:", err);
    res.status(500).json({
      error: "주역 상담 처리 중 오류가 발생했습니다. 다시 시도해 주세요.",
      details: err.message,
    });
  }
});

// 3. 사용자 피드백 제출 API
app.post("/api/feedback", (req, res) => {
  const { feedback, rating, email } = req.body;
  console.log(`[Feedback Received] Rating: ${rating}, Email: ${email}, Msg: ${feedback}`);
  res.json({ success: true, message: "피드백이 성공적으로 전달되었습니다." });
});

// Serve frontend / Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✨ SasujaFate Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
