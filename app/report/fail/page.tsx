"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Locale, translations } from "../../../lib/locales";

function FailDetails() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<Locale>("ko");

  useEffect(() => {
    const savedLang = localStorage.getItem("sasuja_lang") as Locale;
    if (savedLang) setLang(savedLang);
  }, []);

  const message = searchParams.get("message") || "결제가 취소되었거나 실패했습니다.";
  const code = searchParams.get("code") || "PAYMENT_CANCELLED";

  const t = translations[lang];

  return (
    <div className="min-h-[calc(100vh-68px)] bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-slate-900/60 border border-slate-800 rounded-[2rem] p-8 shadow-2xl backdrop-blur-md flex flex-col items-center gap-6">
        
        {/* 경고 아이콘 */}
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 text-3xl">
          ⚠️
        </div>

        <div>
          <h2 className="text-xl font-bold text-rose-400">
            {lang === "ko" ? "결제 실패" : lang === "en" ? "Payment Failed" : "決済失敗"}
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-1">Code: {code}</p>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 w-full whitespace-pre-wrap">
          {message}
        </p>

        <div className="flex flex-col gap-3 w-full mt-2">
          <Link
            href="/report"
            className="w-full py-3.5 px-6 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            {lang === "ko" ? "결제 다시 시도하기" : lang === "en" ? "Retry Payment" : "決済を再試行する"}
          </Link>
          
          <Link
            href="/"
            className="w-full py-3.5 px-6 rounded-full bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors"
          >
            {t.backToHome}
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <span className="animate-pulse text-amber-300">Loading error page...</span>
      </div>
    }>
      <FailDetails />
    </Suspense>
  );
}
