import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// 피드백 데이터 저장 경로 (프로젝트 루트의 feedback.json)
const FEEDBACK_FILE_PATH = path.join(process.cwd(), "feedback.json");

export async function POST(request: Request) {
  console.log("=== [API /api/feedback] POST FEEDBACK RECEIVED ===");
  try {
    const body = await request.json();
    const { name, rating, comment, locale = "ko", birthDate } = body;

    console.log(`[DEBUG] Feedback Content:
      - Name: "${name || "Anonymous"}"
      - Rating: ${rating} / 5
      - Comment: "${comment}"
      - Locale: "${locale}"
      - Birth Date Context: "${birthDate || "None"}"
    `);

    if (!rating || !comment) {
      return NextResponse.json(
        { success: false, error: "평점과 의견 내용은 필수 항목입니다." },
        { status: 400 }
      );
    }

    const newFeedbackEntry = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name || "Anonymous",
      rating: Number(rating),
      comment,
      locale,
      birthDateContext: birthDate || null,
      createdAt: new Date().toISOString()
    };

    // 1. 기존 피드백 파일 읽기 및 생성
    let feedbacks = [];
    try {
      const fileContent = await fs.readFile(FEEDBACK_FILE_PATH, "utf-8");
      feedbacks = JSON.parse(fileContent);
    } catch (readError: any) {
      console.log("[DEBUG] feedback.json not found or empty, creating new file.");
    }

    // 2. 신규 의견 추가
    feedbacks.push(newFeedbackEntry);

    // 3. 파일에 영구 보존 저장
    await fs.writeFile(
      FEEDBACK_FILE_PATH,
      JSON.stringify(feedbacks, null, 2),
      "utf-8"
    );

    console.log(`=== [FEEDBACK SUCCESS] Total accumulated feedbacks: ${feedbacks.length} ===`);

    return NextResponse.json({
      success: true,
      message: "피드백이 성공적으로 등록되었습니다. 한 달에 한 번씩 적극 검토하여 더 완벽한 맞춤형 동양 철학 코칭 리포트로 진화해 가겠습니다.",
      data: newFeedbackEntry
    });

  } catch (error: any) {
    console.error("=== [API FEEDBACK ERROR] ===", error);
    return NextResponse.json(
      { success: false, error: error.message || "의견 등록 중 서버 오류가 발생하였습니다." },
      { status: 500 }
    );
  }
}
