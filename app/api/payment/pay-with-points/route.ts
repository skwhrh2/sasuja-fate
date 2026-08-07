import { NextResponse } from "next/server";
import { supabase, getAuthenticatedUser } from "../../../../lib/db";

const SAJU_PRICE_POINTS = 9800;

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요한 서비스입니다." },
        { status: 401 }
      );
    }

    if (user.points < SAJU_PRICE_POINTS) {
      return NextResponse.json(
        { success: false, error: `포인트가 부족합니다. (필요: ${SAJU_PRICE_POINTS}P, 보유: ${user.points}P)` },
        { status: 400 }
      );
    }

    // 1. 유저 포인트 차감 및 해금 업데이트
    const currentPoints = user.points || 0;
    const { error: updateError } = await supabase
      .from("users")
      .update({ 
        points: currentPoints - SAJU_PRICE_POINTS,
        is_unlocked: true
      })
      .eq("id", user.id);

    if (updateError) {
      throw new Error(`포인트 차감 실패: ${updateError.message}`);
    }

    // 2. 포인트 사용 이력 추가
    await supabase.from("point_histories").insert({
      user_id: user.id,
      amount: -SAJU_PRICE_POINTS,
      type: "saju_purchase",
      description: "종합 운명 리포트 (평생 소장 분석) 포인트 결제 잠금 해제",
    });

    console.log(`[DEBUG] Supabase 포인트 결제 완료: ${user.email} - ${SAJU_PRICE_POINTS}P 차감`);

    return NextResponse.json({
      success: true,
      message: "포인트 결제가 정상적으로 처리되었습니다.",
      points: user.points - SAJU_PRICE_POINTS,
    });
  } catch (error: any) {
    console.error("[ERROR] 포인트 결제 에러:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
