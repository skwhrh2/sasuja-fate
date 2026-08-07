import { NextResponse } from "next/server";
import { supabase, getAuthenticatedUser } from "../../../../lib/db";

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (user) {
      // Supabase 테이블의 세션 삭제
      await supabase
        .from("users")
        .update({ session_token: null })
        .eq("id", user.id);
    }

    const response = NextResponse.json({
      success: true,
      message: "로그아웃 성공",
    });

    // 쿠키 제거
    response.headers.set(
      "Set-Cookie",
      `sasuja_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
    );

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
