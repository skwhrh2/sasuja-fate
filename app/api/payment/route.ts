import { NextResponse } from "next/server";
import { supabase, getAuthenticatedUser, EXCHANGE_RATE } from "../../../lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency = "KRW", orderId, orderName } = body;

    console.log("[DEBUG] Payment simulation request received (Supabase Mode):", { amount, currency, orderId, orderName });

    // 1. 로그인된 유저가 있는지 확인
    const user = await getAuthenticatedUser(request);

    // 2. 금액 환산 (원화 포인트 기준)
    let paymentAmountInKrw = amount;
    if (currency === "USD") {
      paymentAmountInKrw = amount * EXCHANGE_RATE; // $6.53 * 1500 = 9800원 상당
    } else if (currency === "JPY") {
      paymentAmountInKrw = amount * (EXCHANGE_RATE / 100); 
    }

    // 3. 레퍼럴 포인트 적립 처리 (Supabase)
    let referralRewarded = false;
    let rewardPoints = 0;
    let referrerName = "";

    if (user && user.referredBy) {
      // 추천인 조회
      const { data: referrer, error: referrerError } = await supabase
        .from("users")
        .select("*")
        .eq("referral_code", user.referredBy.toUpperCase())
        .maybeSingle();

      if (!referrerError && referrer) {
        rewardPoints = Math.round(paymentAmountInKrw * 0.1);
        referrerName = referrer.name;

        // 추천인의 포인트 가산 업데이트
        const { error: updateError } = await supabase
          .from("users")
          .update({
            points: referrer.points + rewardPoints,
            total_earned_points: referrer.total_earned_points + rewardPoints,
          })
          .eq("id", referrer.id);

        if (!updateError) {
          // 추천인 포인트 히스토리 추가
          const maskedEmail = user.email.replace(/(.{3})(.*)(@.*)/, "$1***$3");
          await supabase.from("point_histories").insert({
            user_id: referrer.id,
            amount: rewardPoints,
            type: "referral_reward",
            description: `추천 친구(${user.name} / ${maskedEmail}) 결제 리워드 10% 적립`,
          });

          referralRewarded = true;
          console.log(
            `[DEBUG] [추천인 10% 시뮬지급완료 - Supabase] 추천인: ${referrer.name}(+${rewardPoints}P), 결제자: ${user.email}`
          );
        } else {
          console.error("[ERROR] 시뮬 결제 포인트 업데이트 실패:", updateError.message);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "결제가 성공적으로 처리되었습니다.",
      data: {
        amount,
        currency,
        referralRewarded,
        rewardPoints,
        referrerName,
      },
    });
  } catch (error: any) {
    console.error("[ERROR] 결제 시뮬레이션 API 에러:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
