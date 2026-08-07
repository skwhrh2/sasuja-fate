import { NextResponse } from "next/server";
import { supabase, getAuthenticatedUser, EXCHANGE_RATE } from "../../../../lib/db";

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { paymentKey, orderId, amount, usedPoints = 0 } = body;

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { success: false, error: "결제 승인 인자(paymentKey, orderId, amount)가 누락되었습니다." },
        { status: 400 }
      );
    }

    const secretKey = process.env.TOSS_SECRET_KEY || "test_sk_Z5LzZgNxjWdpMw45KzLV3wGyd7Pv";
    const basicAuthToken = Buffer.from(secretKey + ":").toString("base64");

    console.log(`[DEBUG] 토스페이먼츠 승인 요청 송신 (Supabase 모드): orderId=${orderId}, amount=${amount}`);

    // 1. 토스페이먼츠 서버 승인 API 호출
    const tossResponse = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuthToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });

    const tossResult = await tossResponse.json();

    if (!tossResponse.ok) {
      console.error("[ERROR] 토스페이먼츠 승인 실패 (Supabase 모드):", tossResult);
      return NextResponse.json(
        { success: false, error: tossResult.message || "결제 승인에 실패했습니다." },
        { status: tossResponse.status }
      );
    }

    // 2. 레퍼럴 10% 적립 처리 (Supabase)
    const currency = tossResult.currency || "KRW";
    let paymentAmountInKrw = Number(amount);

    if (currency === "USD") {
      paymentAmountInKrw = Number(amount) * EXCHANGE_RATE; // $ 결제액을 원화 포인트로 환산
    }

    let referralRewarded = false;
    let rewardPoints = 0;
    let referrerName = "";

    // 유저의 referredBy 확인
    if (user.referredBy) {
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
          // 추천인의 포인트 히스토리 추가
          const maskedEmail = user.email.replace(/(.{3})(.*)(@.*)/, "$1***$3");
          await supabase.from("point_histories").insert({
            user_id: referrer.id,
            amount: rewardPoints,
            type: "referral_reward",
            description: `추천 가입 친구(${user.name}) 결제 완료 리워드 10% 지급`,
          });

          referralRewarded = true;
          console.log(
            `[DEBUG] [추천인 10% 지급완료 - Supabase] 추천인: ${referrer.name}(+${rewardPoints}P), 결제자: ${user.email}`
          );
        } else {
          console.error("[ERROR] 추천인 포인트 업데이트 실패:", updateError.message);
        }
      }
    }

    // 3. 결제자 본인의 속성 업데이트 (주문 번호 식별자로 분기)
    const isReportUnlock = orderId.startsWith("ORD-");

    if (!isReportUnlock) {
      // 1:1 Q&A 질문권 결제 (1,500원 상당): 유저에게 1500P 즉시 충전
      const { error: chargeError } = await supabase
        .from("users")
        .update({
          points: (user.points || 0) + 1500,
        })
        .eq("id", user.id);

      if (!chargeError) {
        await supabase.from("point_histories").insert({
          user_id: user.id,
          amount: 1500,
          type: "charge",
          description: "1:1 비책 추가 질문용 1,500P 결제 충전 완료",
        });
        console.log(`[DEBUG] 1:1 Q&A 1500P 충전 완료: User ID: ${user.id}`);
      } else {
        console.error("[ERROR] 유저 포인트 충전 실패:", chargeError.message);
      }
    } else {
      // 종합 리포트 해금 결제 (9,800원 상당): users 테이블에는 usedPoints 차감만 반영 (is_unlocked 컬럼 없음)
      let pointsToSet = user.points || 0;
      const pointsUsedNum = Number(usedPoints) || 0;

      if (pointsUsedNum > 0) {
        pointsToSet = Math.max(0, pointsToSet - pointsUsedNum);
      }

      const { error: unlockError } = await supabase
        .from("users")
        .update({
          points: pointsToSet,
          is_unlocked: true
        })
        .eq("id", user.id);

      if (!unlockError) {
        console.log(`[DEBUG] 종합 리포트 결제 완료 (포인트 차감 적용): User ID: ${user.id}`);
        
        // 1. 현금 결제 성공 구매 내역 추가 (이 내역이 존재하면 해금된 유저로 판단함)
        await supabase.from("point_histories").insert({
          user_id: user.id,
          amount: 0,
          type: "saju_purchase_toss",
          description: `종합 운명 리포트 현금 결제 완료 (승인 금액: ${amount}원)`,
        });

        // 2. 만약 포인트를 동시 차감 사용했다면 이력 추가
        if (pointsUsedNum > 0) {
          await supabase.from("point_histories").insert({
            user_id: user.id,
            amount: -pointsUsedNum,
            type: "saju_purchase_discount",
            description: `종합 운명 리포트 결제 시 포인트 차감 사용: ${pointsUsedNum}P`,
          });
        }
      } else {
        console.error("[ERROR] 유저 결제 처리 중 포인트 반영 실패:", unlockError.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: "결제 승인 및 속성 반영이 완료되었습니다.",
      data: {
        orderId: tossResult.orderId,
        paymentKey: tossResult.paymentKey,
        amount: tossResult.totalAmount,
        currency,
        referralRewarded,
        rewardPoints,
        referrerName,
      },
    });
  } catch (error: any) {
    console.error("[ERROR] 토스페이먼츠 컨펌 라우트 에러:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
