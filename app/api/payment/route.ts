import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, orderId, orderName } = body;

    // TODO: 여기에 실제 토스페이먼츠 API 연동 로직을 추가합니다.
    // 현재는 결제 준비 단계임을 알리는 뼈대입니다.
    console.log("[DEBUG] Payment request received:", { amount, orderId, orderName });

    return NextResponse.json({
      success: true,
      message: "결제 요청 준비 완료",
      // 실제 API 호출 후 응답받을 데이터 구조
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
