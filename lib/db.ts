import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { EXCHANGE_RATE, KR_WITHHOLDING_TAX, GLOBAL_WITHHOLDING_TAX } from "./constants";

export { EXCHANGE_RATE, KR_WITHHOLDING_TAX, GLOBAL_WITHHOLDING_TAX };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-supabase-url.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key";

// Supabase 설정 유효성 검사 헬퍼
export function isSupabaseConfigured(): boolean {
  return (
    supabaseUrl !== "" &&
    supabaseUrl !== "https://your-supabase-url.supabase.co" &&
    supabaseAnonKey !== "" &&
    supabaseAnonKey !== "your-anon-key"
  );
}

// Supabase 클라이언트 초기화
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  name: string;
  referralCode: string;
  referredBy: string | null;
  points: number;
  totalEarnedPoints: number;
  locale: "ko" | "en" | "ja" | "zh" | "vi";
  sessionToken?: string | null;
  createdAt: string;
  sajuName?: string | null;
  birthDate?: string | null;
  birthTime?: string | null;
  isLunar?: string | null;
  sajuData?: any | null;
  isUnlocked?: boolean;
}

// 비밀번호 해싱
export function hashPassword(password: string, salt: string): string {
  return crypto.createHmac("sha256", salt).update(password).digest("hex");
}

// 고유 솔트 생성
export function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

// 8자리 랜덤 추천 코드 생성
export function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "REF-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 인증 토큰 생성
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// 인증 확인 헬퍼 (Supabase 기반)
export async function getAuthenticatedUser(request: Request): Promise<User | null> {
  try {
    const authHeader = request.headers.get("Authorization");
    let token = "";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const cookies = cookieHeader.split(";").reduce((acc, c) => {
          const [key, val] = c.trim().split("=");
          if (key && val) acc[key] = decodeURIComponent(val);
          return acc;
          }, {} as Record<string, string>);
        token = cookies["sasuja_session"] || "";
      }
    }

    if (!token) return null;

    // Supabase에서 세션 토큰 조회
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("session_token", token)
      .single();

    if (error || !user) return null;

    // DB 스네이크 케이스를 카멜 케이스로 바인딩
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.password_hash,
      salt: user.salt,
      name: user.name,
      referralCode: user.referral_code,
      referredBy: user.referred_by,
      points: user.points,
      totalEarnedPoints: user.total_earned_points,
      locale: user.locale,
      sessionToken: user.session_token,
      createdAt: user.created_at,
      sajuName: user.saju_name || null,
      birthDate: user.birth_date || null,
      birthTime: user.birth_time || null,
      isLunar: user.is_lunar || null,
      sajuData: user.saju_data || null,
      isUnlocked: !!user.is_unlocked,
    };
  } catch (e) {
    console.error("인증 처리 중 오류:", e);
    return null;
  }
}
