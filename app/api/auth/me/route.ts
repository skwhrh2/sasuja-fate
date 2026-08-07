import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../lib/db";

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    return NextResponse.json({
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
