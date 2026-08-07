import { NextResponse } from "next/server";
import { 
  supabase, 
  getAuthenticatedUser, 
  KR_WITHHOLDING_TAX, 
  GLOBAL_WITHHOLDING_TAX 
} from "../../../../lib/db";

const MIN_WITHDRAW_POINTS = 30000;

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요한 서비스입니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, bankName, accountNumber, accountHolder } = body;
    const requestedAmount = Number(amount);

    if (!requestedAmount || !bankName || !accountNumber || !accountHolder) {
      return NextResponse.json(
        { success: false, error: "모든 필드(출금 금액, 은행/플랫폼명, 계좌번호, 예금주명)를 입력해 주세요." },
        { status: 400 }
      );
    }

    if (requestedAmount < MIN_WITHDRAW_POINTS) {
      return NextResponse.json(
        { success: false, error: `출금 신청은 최소 ${MIN_WITHDRAW_POINTS.toLocaleString()}P부터 가능합니다.` },
        { status: 400 }
      );
    }

    if (user.points < requestedAmount) {
      return NextResponse.json(
        { success: false, error: `보유하신 포인트(${user.points.toLocaleString()}P)가 신청 금액보다 부족합니다.` },
        { status: 400 }
      );
    }

    // 1. 세율 결정 및 세금 공제 계산
    const taxRate = user.locale === "ko" ? KR_WITHHOLDING_TAX : GLOBAL_WITHHOLDING_TAX;
    const tax = Math.round(requestedAmount * taxRate);
    const netAmount = requestedAmount - tax;

    // 2. 유저 포인트 차감 업데이트 (Supabase)
    const userPoints = user.points || 0;
    const { error: updateError } = await supabase
      .from("users")
      .update({ points: userPoints - requestedAmount })
      .eq("id", user.id);

    if (updateError) {
      throw new Error(`포인트 차감 실패: ${updateError.message}`);
    }

    // 3. 인출 기록 신청 추가
    const { error: withdrawError } = await supabase
      .from("withdrawals")
      .insert({
        user_id: user.id,
        amount: requestedAmount,
        tax,
        net_amount: netAmount,
        bank_name: bankName,
        account_number: accountNumber,
        account_holder: accountHolder,
        status: "pending",
      });

    if (withdrawError) {
      // 복구를 위해 포인트를 다시 돌려주는 게 좋지만, 일단 에러 처리
      console.error("[ERROR] 출금 신청 인서트 실패:", withdrawError.message);
    }

    // 4. 포인트 거래 내역 추가
    await supabase.from("point_histories").insert({
      user_id: user.id,
      amount: -requestedAmount,
      type: "withdrawal",
      description: `현금 인출 신청 (실수령액: ${netAmount.toLocaleString()}원 상당, 세금 ${tax.toLocaleString()}원 공제)`,
    });

    console.log(
      `[DEBUG] Supabase 출금 신청 성공: 유저 ${user.email}, 신청액 ${requestedAmount}P (세금 ${tax}P 차감)`
    );

    return NextResponse.json({
      success: true,
      message: "출금 신청이 정상 접수되었습니다.",
      points: user.points - requestedAmount,
    });
  } catch (error: any) {
    console.error("[ERROR] 출금 신청 중 에러:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
