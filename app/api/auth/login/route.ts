import { NextResponse } from "next/server";
import { supabase, hashPassword, generateSessionToken, isSupabaseConfigured } from "../../../../lib/db";

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "서버 데이터베이스 설정(Supabase Env)이 누락되었습니다. Vercel 대시보드에서 환경변수를 입력해 주세요." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "이메일과 비밀번호를 모두 입력해 주세요." },
        { status: 400 }
      );
    }

    // 1. Supabase에서 이메일 기준으로 유저 조회
    const { data: user, error: searchError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (searchError) {
      throw new Error(`로그인 조회 중 오류: ${searchError.message}`);
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "가입되지 않은 이메일이거나 비밀번호가 일치하지 않습니다." },
        { status: 401 }
      );
    }

    // 2. 비밀번호 검증
    const hashedInput = hashPassword(password, user.salt);
    if (hashedInput !== user.password_hash) {
      return NextResponse.json(
        { success: false, error: "가입되지 않은 이메일이거나 비밀번호가 일치하지 않습니다." },
        { status: 401 }
      );
    }

    // 3. 세션 토큰 생성 및 Supabase 테이블에 업데이트
    const token = generateSessionToken();
    const { error: updateError } = await supabase
      .from("users")
      .update({ session_token: token })
      .eq("id", user.id);

    if (updateError) {
      throw new Error(`세션 생성 실패: ${updateError.message}`);
    }

    const response = NextResponse.json({
      success: true,
      message: "로그인에 성공했습니다.",
      user: {
        email: user.email,
        name: user.name,
        referralCode: user.referral_code,
        points: user.points,
        locale: user.locale,
      },
      token,
    });

    // 쿠키 심기
    response.headers.set(
      "Set-Cookie",
      `sasuja_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
    );

    return response;
  } catch (error: any) {
    console.error("[ERROR] Supabase 로그인 처리 중 에러:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
