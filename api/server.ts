import express from "express";
import path from "path";
import dotenv from "dotenv";

// Load local environmental variables first
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { calculateFourPillars, calculateNumerology, calculateZiWei } from "./sajuCalculator";
import { SajuInput } from "../src/types";
import { 
  supabase, 
  hashPassword, 
  generateSalt, 
  generateReferralCode, 
  generateSessionToken, 
  getAuthenticatedUser, 
  isSupabaseConfigured, 
  EXCHANGE_RATE, 
  KR_WITHHOLDING_TAX, 
  GLOBAL_WITHHOLDING_TAX 
} from "./db";
import crypto from "crypto";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client with standard Telemetry Header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "SasujaFate AI Engine" });
});

// 1. 3대 동양철학 크로스 검증 사주 분석 API
app.post("/api/saju/analyze", async (req, res) => {
  try {
    const input: SajuInput = req.body;

    if (!input.name || !input.birthYear || !input.birthMonth || !input.birthDay) {
      return res.status(400).json({ error: "필수 생년월일시 데이터가 누락되었습니다." });
    }

    // 로컬 알고리즘을 통한 기본 만세력/수리학/자미두수 데이터 산출
    const pillars = calculateFourPillars(input);
    const numerology = calculateNumerology(input);
    const ziwei = calculateZiWei(input);

    const timeString = input.birthHour >= 0 ? `${input.birthHour}시` : "시간 미상";
    const calendarTypeString =
      input.calendarType === "solar"
        ? "양력"
        : input.calendarType === "lunar_sol"
        ? "음력 (평달)"
        : "음력 (윤달)";

    const prompt = `
당신은 대한민국 최고의 동양 철학 대가이자 '사수자패트(SasujaFate)'의 수석 운명 코치입니다.
다음 사용자의 사주 팔자, 동양 수리학, 자미두수 데이터를 종합적으로 **크로스 검증(Cross-validation)**하여 명쾌하고 정밀한 인생 코칭 리포트를 작성하세요.

[사용자 기본 정보]
- 이름: ${input.name}
- 성별: ${input.gender === "male" ? "남성" : "여성"}
- 생년월일: ${input.birthYear}년 ${input.birthMonth}월 ${input.birthDay}일 (${calendarTypeString}) ${timeString}

[만세력 산출 데이터]
- 년주: ${pillars.yearPillar.stemHanja}(${pillars.yearPillar.stem})${pillars.yearPillar.branchHanja}(${pillars.yearPillar.branch})
- 월주: ${pillars.monthPillar.stemHanja}(${pillars.monthPillar.stem})${pillars.monthPillar.branchHanja}(${pillars.monthPillar.branch})
- 일주: ${pillars.dayPillar.stemHanja}(${pillars.dayPillar.stem})${pillars.dayPillar.branchHanja}(${pillars.dayPillar.branch})
- 시주: ${pillars.hourPillar ? `${pillars.hourPillar.stemHanja}(${pillars.hourPillar.stem})${pillars.hourPillar.branchHanja}(${pillars.hourPillar.branch})` : "미상"}
- 오행 분포: 목(${pillars.fiveElementsDistribution.wood}), 화(${pillars.fiveElementsDistribution.fire}), 토(${pillars.fiveElementsDistribution.earth}), 금(${pillars.fiveElementsDistribution.metal}), 수(${pillars.fiveElementsDistribution.water})

[수리학 및 자미두수 산출 데이터]
- 수리학 격국: ${numerology.primaryGrid} (수리수 ${numerology.birthNumber}, 이름 수리 ${numerology.nameLengthNumber})
- 자미두수 명궁 주성: ${ziwei.lifeHouse}, 재백궁 주성: ${ziwei.wealthHouse}, 관록궁 주성: ${ziwei.careerHouse}

다음 요구사항에 맞춰 JSON 형식으로 응답하세요:
1. masterKeySummary: 사주, 수리학, 자미두수의 공통분모를 추출한 '운명의 마스터키' 핵심 종합 총론 (3~4문장, 품격있고 진중한 어조)
2. sajuDetail: 사주 팔자 깊이 분석 (분석 내용, 강점 3가지, 보완점 2가지)
3. numerologyDetail: 수리학 성격 및 수리 격국 분석 (분석 내용, 행운의 숫자 3개)
4. ziWeiDetail: 자미두수 명반/주성 중심의 기운 분석
5. lifeStrategies: 인생 비책 4단계 (재물운 비책, 애정/궁합 비책, 직업/건강 비책, 올해의 핵심 총운 비책)
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "당신은 사주, 수리학, 자미두수를 통합 해석하는 최고의 운명학 거장입니다. 지혜롭고 권위있으며 따뜻하고 명쾌한 문체로 정밀 분석 결과를 JSON으로 작성하세요.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            masterKeySummary: { type: Type.STRING, description: "통합 총론 - 운명의 마스터키" },
            sajuDetail: {
              type: Type.OBJECT,
              properties: {
                analysis: { type: Type.STRING },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["analysis", "strengths", "weaknesses"],
            },
            numerologyDetail: {
              type: Type.OBJECT,
              properties: {
                analysis: { type: Type.STRING },
                luckyNumbers: { type: Type.ARRAY, items: { type: Type.INTEGER } },
              },
              required: ["analysis", "luckyNumbers"],
            },
            ziWeiDetail: {
              type: Type.OBJECT,
              properties: {
                analysis: { type: Type.STRING },
                starPatterndesc: { type: Type.STRING },
              },
              required: ["analysis", "starPatterndesc"],
            },
            lifeStrategies: {
              type: Type.OBJECT,
              properties: {
                wealth: { type: Type.STRING, description: "재물운 비책" },
                relationship: { type: Type.STRING, description: "애정/궁합 비책" },
                careerAndHealth: { type: Type.STRING, description: "직업/건강 비책" },
                yearFortune: { type: Type.STRING, description: "올해의 핵심 총운 비책" },
              },
              required: ["wealth", "relationship", "careerAndHealth", "yearFortune"],
            },
          },
          required: ["masterKeySummary", "sajuDetail", "numerologyDetail", "ziWeiDetail", "lifeStrategies"],
        },
      },
    });

    const reportData = JSON.parse(response.text || "{}");

    res.json({
      success: true,
      pillars,
      numerology,
      ziwei,
      reportData,
    });
  } catch (err: any) {
    console.error("Saju Analysis Error:", err);
    res.status(500).json({
      error: "사주 분석 처리 중 오류가 발생했습니다. 나중에 다시 시도해 주세요.",
      details: err.message,
    });
  }
});

// 2. 주역 1:1 비책 문의 API (신탁 애니메이션 연동)
app.post("/api/iching/consult", async (req, res) => {
  try {
    const { question, sajuName, dayPillarStem } = req.body;

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return res.status(400).json({ error: "질문을 입력해 주세요." });
    }

    const HEXAGRAMS = [
      { name: "건위천 (乾爲天)", symbol: "☰☰", meaning: "창대함, 강건함, 비상하는 용의 기상" },
      { name: "곤위지 (坤爲地)", symbol: "☷☷", meaning: "유순함, 모든 것을 품어안는 대지의 수용성" },
      { name: "수뢰둔 (水雷屯)", symbol: "☵☳", meaning: "새로운 시작의 어려움, 시련을 딛고 터져나오는 싹" },
      { name: "산수몽 (山수蒙)", symbol: "☶☵", meaning: "계몽과 스승의 가르침, 겸손한 준비" },
      { name: "수천수 (水天需)", symbol: "☵☰", meaning: "때를 기다리는 지혜, 축적과 유유자적" },
      { name: "천수송 (天水訟)", symbol: "☰☵", meaning: "다툼과 송사, 조화와 절제의 중요성" },
      { name: "지수사 (地수사)", symbol: "☷☵", meaning: "군사와 통솔력, 엄격한 질서와 전략" },
      { name: "수지비 (수지비)", symbol: "☵☷", meaning: "친목과 연대, 서로 협력하여 이루는 태평" },
      { name: "풍천소축 (풍천소축)", symbol: "☴☰", meaning: "조금씩 쌓이는 기운, 조급함을 버린 인내" },
      { name: "천택리 (천택리)", symbol: "☰☱", meaning: "호랑이 꼬리를 밟듯 조심스러운 예의와 실천" },
      { name: "지천태 (지천태)", symbol: "☷☰", meaning: "음양이 상통하는 대길, 만물이 번창함" },
      { name: "천지피 (천지피)", symbol: "☰☷", meaning: "소통이 막힌 시기, 내부 충실과 묵묵한 내실 다지기" },
      { name: "화천대유 (화천대유)", symbol: "☲☰", meaning: "풍요로움과 만인의 인정, 태양처럼 빛나는 성취" },
      { name: "화산려 (화산려)", symbol: "☲☶", meaning: "나그네의 길, 순응과 겸손함으로 위기를 지혜롭게 피함" },
      { name: "풍뢰익 (풍뢰익)", symbol: "☴☳", meaning: "더욱 유익해지는 시기, 적극적 전진과 과감한 실행" },
    ];

    // 질문 및 사주에 기초하여 괘를 추첨
    const hexIndex = Math.abs(question.length * 7 + (sajuName ? sajuName.length : 3)) % HEXAGRAMS.length;
    const selectedHex = HEXAGRAMS[hexIndex];

    const prompt = `
사용자가 주역 1:1 비책 문의를 신청했습니다.

[사용자 정보]
- 질문자 성함: ${sajuName || "상담자"}
- 일주 천간 기운: ${dayPillarStem || "기본"}
- 고민 질문: "${question}"

[추출된 주역 64괘 신탁 괘]
- 괘 이름: ${selectedHex.name}
- 괘 상징: ${selectedHex.symbol} (${selectedHex.meaning})

Gemini의 주역 신탁 직관으로 질문자의 질문에 대해 명쾌하고 통찰력 넘치며 구체적인 비책을 제시하세요.
다음 JSON 형식으로 출력하세요:
1. hexagramName: "${selectedHex.name}"
2. hexagramSymbol: "${selectedHex.symbol}"
3. interpretation: 이 괘가 질문자의 현실 상황에 던지는 깊은 신탁풀이 및 성찰 (3~4문장)
4. actionPlan: 고민 해결을 위해 즉시 실행해야 할 3가지 구체적 비책/처방 행동 지침
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "당신은 주역 64괘의 신탁을 다루는 최고의 주역 신통 대가입니다. 질문자의 질문과 괘에 맞춘 깊이 있고 선명하며 현실적인 처방을 JSON으로 작성하세요.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hexagramName: { type: Type.STRING },
            hexagramSymbol: { type: Type.STRING },
            interpretation: { type: Type.STRING },
            actionPlan: { type: Type.STRING },
          },
          required: ["hexagramName", "hexagramSymbol", "interpretation", "actionPlan"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");

    res.json({
      success: true,
      result: {
        ...result,
        question,
        timestamp: new Date().toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    });
  } catch (err: any) {
    console.error("IChing Consultation Error:", err);
    res.status(500).json({
      error: "주역 상담 처리 중 오류가 발생했습니다. 다시 시도해 주세요.",
      details: err.message,
    });
  }
});

// 3. 사용자 피드백 제출 API
app.post("/api/feedback", (req, res) => {
  const { feedback, rating, email } = req.body;
  console.log(`[Feedback Received] Rating: ${rating}, Email: ${email}, Msg: ${feedback}`);
  res.json({ success: true, message: "피드백이 성공적으로 전달되었습니다." });
});

// ================================================================
// 회원 인증 및 추천인, 결제 API 복구
// ================================================================

// 1. 회원가입 API
app.post("/api/auth/register", async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: "서버 데이터베이스 설정(Supabase Env)이 누락되었습니다." });
    }

    const { email, password, name, referredBy, locale = "ko" } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: "이메일, 비밀번호, 이름을 모두 입력해 주세요." });
    }

    const { data: existingUser, error: searchError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (searchError) throw searchError;
    if (existingUser) {
      return res.status(400).json({ success: false, error: "이미 가입된 이메일 주소입니다." });
    }

    let validatedReferredBy: string | null = null;
    if (referredBy) {
      const { data: referrer } = await supabase
        .from("users")
        .select("referral_code")
        .eq("referral_code", referredBy.trim().toUpperCase())
        .maybeSingle();

      if (referrer) {
        validatedReferredBy = referrer.referral_code;
      }
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);

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

    if (insertError) throw insertError;

    res.json({
      success: true,
      message: "회원가입이 완료되었습니다.",
      user: {
        email: newUser.email,
        name: newUser.name,
        referralCode: newUser.referral_code,
      },
    });
  } catch (error: any) {
    console.error("Register Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. 로그인 API
app.post("/api/auth/login", async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: "서버 데이터베이스 설정이 누락되었습니다." });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "이메일과 비밀번호를 모두 입력해 주세요." });
    }

    const { data: user, error: searchError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (searchError) throw searchError;
    if (!user) {
      return res.status(401).json({ success: false, error: "가입되지 않은 이메일이거나 비밀번호가 일치하지 않습니다." });
    }

    const hashedInput = hashPassword(password, user.salt);
    if (hashedInput !== user.password_hash) {
      return res.status(401).json({ success: false, error: "가입되지 않은 이메일이거나 비밀번호가 일치하지 않습니다." });
    }

    const token = generateSessionToken();
    const { error: updateError } = await supabase
      .from("users")
      .update({ session_token: token })
      .eq("id", user.id);

    if (updateError) throw updateError;

    res.cookie("sasuja_session", token, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 2592000000 });
    res.json({
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
  } catch (error: any) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. 로그아웃 API
app.post("/api/auth/logout", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (user) {
      await supabase
        .from("users")
        .update({ session_token: null })
        .eq("id", user.id);
    }
    res.clearCookie("sasuja_session", { path: "/" });
    res.json({ success: true, message: "로그아웃 성공" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. 내 정보 API
app.get("/api/auth/me", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: "로그인이 필요합니다." });
    }
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        points: user.points,
        totalEarnedPoints: user.totalEarnedPoints,
        locale: user.locale,
        sajuName: user.sajuName,
        birthDate: user.birthDate,
        birthTime: user.birthTime,
        isLunar: user.isLunar,
        sajuData: user.sajuData,
        isUnlocked: user.isUnlocked,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. 카카오 간편로그인 콜백 API
app.get("/api/auth/kakao/callback", async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    console.error("[ERROR] 카카오 인가 코드가 누락되었습니다.");
    return res.redirect("/login?code=NO_CODE");
  }

  try {
    const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || "test_kakao_client_id_12345";
    const origin = `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${origin}/api/auth/kakao/callback`;

    console.log(`[DEBUG] 카카오 토큰 요청 송신: redirectUri=${redirectUri}`);

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

    const tokenResult: any = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error("[ERROR] 카카오 토큰 발급 실패:", tokenResult);
      return res.redirect(`/report/fail?message=${encodeURIComponent("카카오 인증 토큰 발급에 실패했습니다.")}`);
    }

    const accessToken = tokenResult.access_token;
    const userMeResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
    });

    const kakaoUser: any = await userMeResponse.json();
    if (!userMeResponse.ok) {
      console.error("[ERROR] 카카오 유저 정보 조회 실패:", kakaoUser);
      return res.redirect(`/report/fail?message=${encodeURIComponent("카카오 유저 프로필 조회에 실패했습니다.")}`);
    }

    const kakaoId = kakaoUser.id;
    const nickname = kakaoUser.properties?.nickname || `KakaoUser_${kakaoId}`;
    const email = kakaoUser.kakao_account?.email || `kakao_${kakaoId}@sasuja.user`;

    const { data: existingUser, error: searchError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (searchError) throw searchError;

    let targetUser = existingUser;
    const sessionToken = generateSessionToken();

    if (!targetUser) {
      console.log(`[DEBUG] 카카오 간편 가입 진행: email=${email}, name=${nickname}`);

      let referredBy: string | null = null;
      const cookieHeader = req.headers["cookie"];
      if (cookieHeader) {
        const cookies = cookieHeader.split(";").reduce((acc: any, c: any) => {
          const [key, val] = c.trim().split("=");
          if (key && val) acc[key] = decodeURIComponent(val);
          return acc;
        }, {} as Record<string, string>);
        
        const cookieRef = cookies["sasuja_ref"];
        if (cookieRef) {
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

      const randomPassword = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString();
      const salt = generateSalt();
      const passwordHash = hashPassword(randomPassword, salt);

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
          locale: "ko",
          session_token: sessionToken,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      targetUser = insertedUser;
    } else {
      console.log(`[DEBUG] 카카오 간편 로그인 진행: email=${email}`);
      const { error: updateError } = await supabase
        .from("users")
        .update({ session_token: sessionToken })
        .eq("id", targetUser.id);

      if (updateError) throw updateError;
    }

    res.cookie("sasuja_session", sessionToken, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 2592000000 });
    res.clearCookie("sasuja_ref", { path: "/" });
    res.redirect("/report");
  } catch (error: any) {
    console.error("[ERROR] 카카오 OAuth 콜백 중 에러:", error);
    res.redirect(`/report/fail?message=${encodeURIComponent(error.message || "카카오 간편 가입 실패")}`);
  }
});

// 6. 추천인 통계 API
app.get("/api/referral/stats", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: "로그인이 필요한 서비스입니다." });
    }

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

    res.json({
      success: true,
      data: {
        friends,
        history,
        withdrawals,
      },
    });
  } catch (error: any) {
    console.error("Referral Stats Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. 포인트 출금 신청 API
app.post("/api/referral/withdraw", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: "로그인이 필요한 서비스입니다." });
    }

    const { amount, bankName, accountNumber, accountHolder } = req.body;
    const requestedAmount = Number(amount);

    if (!requestedAmount || !bankName || !accountNumber || !accountHolder) {
      return res.status(400).json({ success: false, error: "모든 필드를 입력해 주세요." });
    }

    if (requestedAmount < 30000) {
      return res.status(400).json({ success: false, error: "출금 신청은 최소 30,000P부터 가능합니다." });
    }

    if (user.points < requestedAmount) {
      return res.status(400).json({ success: false, error: "보유하신 포인트가 신청 금액보다 부족합니다." });
    }

    const taxRate = user.locale === "ko" ? KR_WITHHOLDING_TAX : GLOBAL_WITHHOLDING_TAX;
    const tax = Math.round(requestedAmount * taxRate);
    const netAmount = requestedAmount - tax;

    const { error: updateError } = await supabase
      .from("users")
      .update({ points: user.points - requestedAmount })
      .eq("id", user.id);

    if (updateError) throw updateError;

    await supabase
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

    await supabase.from("point_histories").insert({
      user_id: user.id,
      amount: -requestedAmount,
      type: "withdrawal",
      description: `현금 인출 신청 (실수령액: ${netAmount.toLocaleString()}원 상당, 세금 ${tax.toLocaleString()}원 공제)`,
    });

    res.json({
      success: true,
      message: "출금 신청이 정상 접수되었습니다.",
      points: user.points - requestedAmount,
    });
  } catch (error: any) {
    console.error("Withdraw Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. 결제 준비 / 시뮬레이션 API
app.post("/api/payment", async (req, res) => {
  try {
    const { amount, currency = "KRW", orderId, orderName } = req.body;
    console.log("[DEBUG] Sim payment:", { amount, currency, orderId, orderName });

    const user = await getAuthenticatedUser(req);
    let paymentAmountInKrw = amount;
    if (currency === "USD") {
      paymentAmountInKrw = amount * EXCHANGE_RATE;
    } else if (currency === "JPY") {
      paymentAmountInKrw = amount * (EXCHANGE_RATE / 100);
    }

    let referralRewarded = false;
    let rewardPoints = 0;
    let referrerName = "";

    if (user && user.referredBy) {
      const { data: referrer, error: referrerError } = await supabase
        .from("users")
        .select("*")
        .eq("referral_code", user.referredBy.toUpperCase())
        .maybeSingle();

      if (!referrerError && referrer) {
        rewardPoints = Math.round(paymentAmountInKrw * 0.1);
        referrerName = referrer.name;

        const { error: updateError } = await supabase
          .from("users")
          .update({
            points: referrer.points + rewardPoints,
            total_earned_points: referrer.total_earned_points + rewardPoints,
          })
          .eq("id", referrer.id);

        if (!updateError) {
          const maskedEmail = user.email.replace(/(.{3})(.*)(@.*)/, "$1***$3");
          await supabase.from("point_histories").insert({
            user_id: referrer.id,
            amount: rewardPoints,
            type: "referral_reward",
            description: `추천 친구(${user.name} / ${maskedEmail}) 결제 리워드 10% 적립`,
          });
          referralRewarded = true;
        }
      }
    }

    res.json({
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
    res.status(500).json({ success: false, error: error.message });
  }
});

// 9. 결제 승인 API (토스페이먼츠 연동)
app.post("/api/payment/confirm", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: "로그인이 필요합니다." });
    }

    const { paymentKey, orderId, amount, usedPoints = 0 } = req.body;
    if (!paymentKey || !orderId || !amount) {
      return res.status(400).json({ success: false, error: "결제 승인 인자가 누락되었습니다." });
    }

    const secretKey = process.env.TOSS_SECRET_KEY || "test_sk_Z5LzZgNxjWdpMw45KzLV3wGyd7Pv";
    const basicAuthToken = Buffer.from(secretKey + ":").toString("base64");

    const tossResponse = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuthToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const tossResult: any = await tossResponse.json();
    if (!tossResponse.ok) {
      return res.status(tossResponse.status).json({ success: false, error: tossResult.message || "결제 승인 실패" });
    }

    const currency = tossResult.currency || "KRW";
    let paymentAmountInKrw = Number(amount);
    if (currency === "USD") {
      paymentAmountInKrw = Number(amount) * EXCHANGE_RATE;
    }

    let referralRewarded = false;
    let rewardPoints = 0;
    let referrerName = "";

    if (user.referredBy) {
      const { data: referrer, error: referrerError } = await supabase
        .from("users")
        .select("*")
        .eq("referral_code", user.referredBy.toUpperCase())
        .maybeSingle();

      if (!referrerError && referrer) {
        rewardPoints = Math.round(paymentAmountInKrw * 0.1);
        referrerName = referrer.name;

        const { error: updateError } = await supabase
          .from("users")
          .update({
            points: referrer.points + rewardPoints,
            total_earned_points: referrer.total_earned_points + rewardPoints,
          })
          .eq("id", referrer.id);

        if (!updateError) {
          await supabase.from("point_histories").insert({
            user_id: referrer.id,
            amount: rewardPoints,
            type: "referral_reward",
            description: `추천 가입 친구(${user.name}) 결제 완료 리워드 10% 지급`,
          });
          referralRewarded = true;
        }
      }
    }

    const isReportUnlock = orderId.startsWith("ORD-");
    if (!isReportUnlock) {
      await supabase
        .from("users")
        .update({ points: (user.points || 0) + 1500 })
        .eq("id", user.id);

      await supabase.from("point_histories").insert({
        user_id: user.id,
        amount: 1500,
        type: "charge",
        description: "1:1 비책 추가 질문용 1,500P 결제 충전 완료",
      });
    } else {
      let pointsToSet = user.points || 0;
      const pointsUsedNum = Number(usedPoints) || 0;
      if (pointsUsedNum > 0) {
        pointsToSet = Math.max(0, pointsToSet - pointsUsedNum);
      }

      await supabase
        .from("users")
        .update({ points: pointsToSet, is_unlocked: true })
        .eq("id", user.id);

      await supabase.from("point_histories").insert({
        user_id: user.id,
        amount: 0,
        type: "saju_purchase_toss",
        description: `종합 운명 리포트 현금 결제 완료 (승인 금액: ${amount}원)`,
      });

      if (pointsUsedNum > 0) {
        await supabase.from("point_histories").insert({
          user_id: user.id,
          amount: -pointsUsedNum,
          type: "saju_purchase_discount",
          description: `종합 운명 리포트 결제 시 포인트 차감 사용: ${pointsUsedNum}P`,
        });
      }
    }

    res.json({
      success: true,
      message: "결제 승인 완료",
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
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10. 포인트 구매/결제 API
app.post("/api/payment/pay-with-points", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: "로그인이 필요한 서비스입니다." });
    }

    if (user.points < 9800) {
      return res.status(400).json({ success: false, error: `포인트가 부족합니다. (필요: 9,800P, 보유: ${user.points}P)` });
    }

    await supabase
      .from("users")
      .update({ points: user.points - 9800, is_unlocked: true })
      .eq("id", user.id);

    await supabase.from("point_histories").insert({
      user_id: user.id,
      amount: -9800,
      type: "saju_purchase",
      description: "종합 운명 리포트 (평생 소장 분석) 포인트 결제 잠금 해제",
    });

    res.json({
      success: true,
      message: "포인트 결제가 정상적으로 처리되었습니다.",
      points: user.points - 9800,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve frontend / Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✨ SasujaFate Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
