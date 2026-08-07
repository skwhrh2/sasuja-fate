"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Locale, translations } from "../../../lib/locales";

function SuccessBridge() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<Locale>("ko");
  const [statusText, setStatusText] = useState("결제를 승인하는 중입니다...");

  useEffect(() => {
    // 1. 언어 설정 읽기
    const savedLang = localStorage.getItem("sasuja_lang") as Locale;
    if (savedLang) {
      setLang(savedLang);
      if (savedLang === "en") setStatusText("Confirming your payment, please wait...");
      else if (savedLang === "ja") setStatusText("決済を承認しています。少々お待ちください...");
      else if (savedLang === "zh") setStatusText("正在确认您的支付，请稍候...");
      else if (savedLang === "vi") setStatusText("Đang xác nhận thanh toán, vui lòng chờ...");
    }

    // 2. 토스페이먼츠 결제 승인 인자 파싱
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");
    const usedPoints = searchParams.get("used_points") || "0";

    if (!paymentKey || !orderId || !amount) {
      router.push("/report/fail?message=결제 승인 파라미터가 누락되었습니다.");
      return;
    }

    confirmPayment(paymentKey, orderId, amount, usedPoints);
  }, [searchParams]);

  const confirmPayment = async (paymentKey: string, orderId: string, amount: string, usedPoints: string) => {
    try {
      const res = await fetch("/api/payment/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          paymentKey, 
          orderId, 
          amount, 
          usedPoints: parseInt(usedPoints, 10) 
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        // 헤더 포인트 갱신 전파를 위해 트리거
        window.dispatchEvent(new Event("sasuja_login"));
 
        if (Number(amount) === 1500) {
          // Q&A 1500원 결제 성공 시 -> Q&A 전송 쿼리 파라미터 부여
          router.push("/report?qa_success=true");
        } else {
          // 종합 리포트 결제 성공 시
          sessionStorage.setItem("saju_report_unlocked", "true");
          router.push("/report");
        }
      } else {
        router.push(`/report/fail?message=${encodeURIComponent(result.error || "승인 실패")}`);
      }
    } catch (e) {
      console.error(e);
      router.push("/report/fail?message=서버 통신 실패");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="flex flex-col items-center gap-4">
        {/* 프리미엄 로딩 서클 */}
        <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin"></div>
        <p className="text-base text-slate-300 font-medium tracking-wide mt-2">
          {statusText}
        </p>
        <span className="text-xs text-slate-500">SasujaFate Secure Checkout</span>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <span className="animate-pulse text-amber-300">Loading checkout...</span>
      </div>
    }>
      <SuccessBridge />
    </Suspense>
  );
}
