import { NextResponse } from "next/server";
import { supabase, hashPassword, generateSalt, generateReferralCode, isSupabaseConfigured } from "../../../../lib/db";

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "서버 데이터베이스 설정(Supabase Env)이 누락되었습니다. Vercel 대시보드에서 환경변수를 입력해 주세요." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, password, name, referredBy, locale = "ko" } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: "이메일, 비밀번호, 이름을 모두 입력해 주세요." },
        { status: 400 }
      );
    }

    // 1. 이메일 중복 체크 (Supabase)
    const { data: existingUser, error: searchError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (searchError) {
      throw new Error(`이메일 조회 중 오류: ${searchError.message}`);
    }

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "이미 가입된 이메일 주소입니다." },
        { status: 400 }
      );
    }

    // 2. 추천인 코드 유효성 검증
    let validatedReferredBy: string | null = null;
    if (referredBy) {
      const { data: referrer, error: referrerError } = await supabase
        .from("users")
        .select("referral_code")
        .eq("referral_code", referredBy.trim().toUpperCase())
        .maybeSingle();

      if (!referrerError && referrer) {
        validatedReferredBy = referrer.referral_code;
      }
    }

    // 3. 솔트 및 비밀번호 해싱
    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);

    // 4. 고유 추천인 코드 생성 및 중복 확인
    let referralCode = "";
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      referralCode = generateReferralCode();
      const { data: dupCode } = await supabase
        .from("users")
        .select("id")
        .eq("referral_code", referralCode)
        .maybeSingle();

      if (!dupCode) {
        isUnique = true;
      }
      attempts++;
    }

    // 5. Supabase 테이블에 신규 가입자 인서트
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        salt,
        name,
        referral_code: referralCode,
        referred_by: validatedReferredBy,
        points: 0,
        total_earned_points: 0,
        locale: (locale === "ja" || locale === "en" || locale === "zh" || locale === "vi" ? locale : "ko"),
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`회원정보 저장 실패: ${insertError.message}`);
    }

    console.log(`[DEBUG] Supabase 회원가입 완료: ${newUser.email}, 추천코드: ${newUser.referral_code}`);

    return NextResponse.json({
      success: true,
      message: "회원가입이 완료되었습니다.",
      user: {
        email: newUser.email,
        name: newUser.name,
        referralCode: newUser.referral_code,
      },
    });
  } catch (error: any) {
    console.error("[ERROR] Supabase 회원가입 처리 중 에러:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
