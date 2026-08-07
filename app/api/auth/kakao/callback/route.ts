import { NextResponse } from "next/server";
import { supabase, generateSalt, hashPassword, generateReferralCode, generateSessionToken } from "../../../../../lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    console.error("[ERROR] 카카오 인가 코드가 누락되었습니다.");
    return NextResponse.redirect(new URL("/login?code=NO_CODE", request.url));
  }

  try {
    const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || "test_kakao_client_id_12345";
    
    // 카카오 디벨로퍼스에 등록된 redirect_uri와 정확히 매치되도록 동적 추출
    const origin = new URL(request.url).origin;
    const redirectUri = `${origin}/api/auth/kakao/callback`;

    console.log(`[DEBUG] 카카오 토큰 요청 송신: redirectUri=${redirectUri}`);

    // 1. 카카오 토큰 발급 API 호출
    const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        redirect_uri: redirectUri,
        code,
      }),
    });

    const tokenResult = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("[ERROR] 카카오 토큰 발급 실패:", tokenResult);
      return NextResponse.redirect(
        new URL(`/report/fail?message=${encodeURIComponent("카카오 인증 토큰 발급에 실패했습니다.")}`, request.url)
      );
    }

    const accessToken = tokenResult.access_token;

    // 2. 카카오 사용자 정보 조회 API 호출
    const userMeResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
    });

    const kakaoUser = await userMeResponse.json();

    if (!userMeResponse.ok) {
      console.error("[ERROR] 카카오 유저 정보 조회 실패:", kakaoUser);
      return NextResponse.redirect(
        new URL(`/report/fail?message=${encodeURIComponent("카카오 유저 프로필 조회에 실패했습니다.")}`, request.url)
      );
    }

    // 카카오 이메일 및 닉네임 파싱
    const kakaoId = kakaoUser.id;
    const nickname = kakaoUser.properties?.nickname || `KakaoUser_${kakaoId}`;
    
    // 이메일 선택동의 거부 시 고유 가상 이메일 생성
    const email = kakaoUser.kakao_account?.email || `kakao_${kakaoId}@sasuja.user`;

    // 3. Supabase 회원 매핑 또는 생성
    const { data: existingUser, error: searchError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (searchError) throw searchError;

    let targetUser = existingUser;
    const sessionToken = generateSessionToken();

    if (!targetUser) {
      // 신규 회원 가입 처리
      console.log(`[DEBUG] 카카오 간편 가입 진행: email=${email}, name=${nickname}`);

      // 쿠키나 헤더로부터 추천인 코드(sasuja_ref) 검출
      let referredBy: string | null = null;
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const cookies = cookieHeader.split(";").reduce((acc, c) => {
          const [key, val] = c.trim().split("=");
          if (key && val) acc[key] = decodeURIComponent(val);
          return acc;
        }, {} as Record<string, string>);
        
        const cookieRef = cookies["sasuja_ref"];
        if (cookieRef) {
          // 추천인 유효성 체크
          const { data: referrer } = await supabase
            .from("users")
            .select("referral_code")
            .eq("referral_code", cookieRef.trim().toUpperCase())
            .maybeSingle();
            
          if (referrer) {
            referredBy = referrer.referral_code;
          }
        }
      }

      // 비밀번호 난수 설정 (간편 로그인이므로 직접 쓸 일은 없음)
      const randomPassword = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString();
      const salt = generateSalt();
      const passwordHash = hashPassword(randomPassword, salt);

      // 고유 추천인 코드 생성
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

        if (!dupCode) isUnique = true;
        attempts++;
      }

      // Supabase 인서트
      const { data: insertedUser, error: insertError } = await supabase
        .from("users")
        .insert({
          email: email.toLowerCase(),
          password_hash: passwordHash,
          salt,
          name: nickname,
          referral_code: referralCode,
          referred_by: referredBy,
          points: 0,
          total_earned_points: 0,
          locale: "ko", // 기본 로케일 한국어
          session_token: sessionToken,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      targetUser = insertedUser;
    } else {
      // 기존 회원 로그인 처리 (세션 토큰 갱신)
      console.log(`[DEBUG] 카카오 간편 로그인 진행: email=${email}`);
      const { error: updateError } = await supabase
        .from("users")
        .update({ session_token: sessionToken })
        .eq("id", targetUser.id);

      if (updateError) throw updateError;
    }

    // 4. 로그인 성공 리다이렉트 및 쿠키 심기
    const successRedirect = NextResponse.redirect(new URL("/report", request.url));
    successRedirect.headers.set(
      "Set-Cookie",
      `sasuja_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
    );

    // 가입 완료 후 추천인 쿠키 소거
    successRedirect.headers.append(
      "Set-Cookie",
      `sasuja_ref=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
    );

    return successRedirect;
  } catch (error: any) {
    console.error("[ERROR] 카카오 OAuth 콜백 중 에러:", error);
    return NextResponse.redirect(
      new URL(`/report/fail?message=${encodeURIComponent(error.message || "카카오 간편 가입 실패")}`, request.url)
    );
  }
}
