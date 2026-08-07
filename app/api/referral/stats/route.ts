import { NextResponse } from "next/server";
import { supabase, getAuthenticatedUser } from "../../../../lib/db";

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요한 서비스입니다." },
        { status: 401 }
      );
    }

    // 1. 나를 추천해서 가입한 친구들 목록 조회
    const { data: dbFriends, error: friendsError } = await supabase
      .from("users")
      .select("email, name, created_at")
      .eq("referred_by", user.referralCode)
      .order("created_at", { ascending: false });

    if (friendsError) throw friendsError;

    const friends = (dbFriends || []).map((u) => {
      const maskedEmail = u.email.replace(/(.{3})(.*)(@.*)/, "$1***$3");
      return {
        email: maskedEmail,
        name: u.name,
        createdAt: u.created_at,
      };
    });

    // 2. 내 포인트 거래 내역 조회
    const { data: dbHistory, error: historyError } = await supabase
      .from("point_histories")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (historyError) throw historyError;

    const history = (dbHistory || []).map((h) => ({
      id: h.id,
      userId: h.user_id,
      amount: h.amount,
      type: h.type,
      description: h.description,
      createdAt: h.created_at,
    }));

    // 3. 내 출금 신청 내역 조회
    const { data: dbWithdrawals, error: withdrawalsError } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (withdrawalsError) throw withdrawalsError;

    const withdrawals = (dbWithdrawals || []).map((w) => ({
      id: w.id,
      userId: w.user_id,
      amount: w.amount,
      tax: w.tax,
      netAmount: w.net_amount,
      bankName: w.bank_name,
      accountNumber: w.account_number,
      accountHolder: w.account_holder,
      status: w.status,
      createdAt: w.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: {
        friends,
        history,
        withdrawals,
      },
    });
  } catch (error: any) {
    console.error("[ERROR] Supabase 레퍼럴 통계 조회 중 에러:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
