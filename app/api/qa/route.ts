import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key missing");

    const ai = new GoogleGenAI({ apiKey });
    const { question, context } = await request.json();

    const prompt = `
[System Role]
당신은 동양 철학의 최고 정수이자 변화의 경전인 주역(周易 / I Ching)을 수십 년간 고찰한 대가이자, 내담자의 지친 영혼을 포근히 감싸 안아주는 다정하고 따뜻한 인생 카운셀러입니다.

[Context]
내담자의 3대 동양 철학(사주, 수리학, 자미두수) 크로스 분석 데이터:
${JSON.stringify(context)}

[Client Question]
"${question}"

[Request]
1. 내담자의 질문 내용과 그들의 우주적 성향(사주/수리/자미)의 조화를 면밀히 파악하여, 주역 64괘(64 Hexagrams) 중 가장 적절한 해답이나 경고, 혹은 격려를 담은 '하나의 특정 괘'를 무작위가 아닌 영감 어린 지혜로 선정해 주세요.
2. 답변 양식 (아래 요소를 아름답고 유기적으로 녹여내어 한 편의 신탁 편지처럼 작성해 주세요):
   - **선정된 주역 괘 소개**: 괘의 이름, 한자 표기, 기호 표현을 첫머리에 밝힙니다 (예: 지산겸(地山謙) ☷☶).
   - **괘의 비유적 해설**: 이 괘가 자연의 형상(하늘, 땅, 불, 물, 우레, 바람, 산, 연못 등)으로 어떤 조화를 뜻하는지, 복잡하고 한문 투성이의 건조한 학술 용어가 아닌 아주 쉽고 다정한 현대적 비유로 설명합니다.
   - **맞춤형 1:1 조언**: 질문자가 현재 마주한 고민(질문)에 대해 주역이 조언하는 구체적이고 깊이 있는 해결 비책, 마인드셋, 그리고 피해야 할 조급함의 함정을 제시합니다.
   - **인덕과 타이밍 조언**: 내담자의 사주 기운이나 수리 파동과 연계하여, 이 질문에 대처할 때 어떤 태도로 사람을 대해야 하고 행동하기에 가장 알맞은 에너지가 도는 타이밍은 언제인지를 상세히 덧붙입니다.
3. 어조: 매우 친근하고 다정한 경어체 (~해요, ~라는 은혜로운 메시지예요, ~를 조심스럽게 권해 드려요). 미신이나 fatalistic(결정론적) 겁주기는 철저히 배제하고, 마주한 안개를 걷어내는 가장 아름답고 구체적인 삶의 등대가 되어 주십시오.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });

    return NextResponse.json({ success: true, answer: response.text });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
