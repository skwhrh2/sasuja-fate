"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Locale } from "../lib/locales";

// 메인 입력 폼 다국어 번역 사전
const formTranslations = {
  ko: {
    badge: "✨ 군더더기 없는 3대 운명학 핵심 추출",
    title: "사수자패트 (SasujaFate)",
    description: "복잡한 한문과 길을 잃게 만드는 미신적 군더더기를 전부 걷어냈습니다. 오직 사주 · 수리학 · 자미두수의 핵심 정수만을 추출하여, 세 가지 고대 지혜의 교집합이 가리키는 명확한 운명의 마스터키를 선사합니다.",
    formTitle: "🔮 운명 진단 시작하기",
    nameLabel: "성함",
    namePlaceholder: "이름을 입력하세요",
    lunarLabel: "양력/음력 구분",
    solar: "양력 (Solar)",
    lunar: "음력 평달",
    leapLunar: "음력 윤달",
    birthLabel: "생년월일",
    yearOpt: "년",
    monthOpt: "월",
    dayOpt: "일",
    birthNote: "※ 선택하신 역법에 따라 정확하게 윤달 및 기운 변환",
    timeLabel: "태어난 시간 (선택)",
    timeUnknown: "시간 모름 (선택안함)",
    minuteOpt: "분 선택",
    timeNote: "※ 자미두수와 상세 사주 시(時) 분석을 위한 필수 입력 정보",
    submitBtn: "무료 운명 진단 시작하기",
    analyzing: "진단 중...",
    failAnalyze: "분석 실패",
    serverError: "분석 중 서버 오류가 발생했습니다.",
    networkError: "서버 통신 오류가 발생했습니다."
  },
  en: {
    badge: "✨ Core Essence of 3 Ancient Destiny Sciences",
    title: "SasujaFate",
    description: "We've removed complex Chinese characters and confusing superstitious clutter. By extracting the core essence of Saju, Numerology, and Zi Wei Dou Shu, we offer the clear master key to your destiny indicated by the intersection of three ancient wisdoms.",
    formTitle: "🔮 Start Destiny Diagnosis",
    nameLabel: "Name",
    namePlaceholder: "Enter your name",
    lunarLabel: "Solar / Lunar Calendar",
    solar: "Solar (Western)",
    lunar: "Lunar Regular",
    leapLunar: "Lunar Leap Month",
    birthLabel: "Date of Birth",
    yearOpt: "Year",
    monthOpt: "Month",
    dayOpt: "Day",
    birthNote: "* Automatically translates lunar calendar dates based on rules",
    timeLabel: "Time of Birth (Optional)",
    timeUnknown: "Time Unknown",
    minuteOpt: "Min",
    timeNote: "* Highly recommended for detailed Saju & Zi Wei analysis",
    submitBtn: "Start Free Diagnosis",
    analyzing: "Analyzing...",
    failAnalyze: "Analysis failed",
    serverError: "Server error occurred during analysis.",
    networkError: "Network error occurred."
  },
  ja: {
    badge: "✨ 無駄を省いた3大運命学の核心抽出",
    title: "四獣者フェ이트 (SasujaFate)",
    description: "複雑な漢文や混乱を招く迷信的な無駄をすべて排除しました。四柱推命・数理학・紫微斗数の核心的なエッセンスのみを抽出し、3つの古代の知恵が交差する明確な運命のマスターキーをお届けします。",
    formTitle: "🔮 運命診断を開始する",
    nameLabel: "お名前",
    namePlaceholder: "名前を入力してください",
    lunarLabel: "陽暦 / 陰暦の区分",
    solar: "陽暦 (Solar)",
    lunar: "陰暦 平月",
    leapLunar: "陰暦 閏月",
    birthLabel: "生年月日",
    yearOpt: "年",
    monthOpt: "月",
    dayOpt: "日",
    birthNote: "※ 選択した暦法に従って正確に閏月と気運を変換",
    timeLabel: "生まれた時間 (任意)",
    timeUnknown: "時間不明 (選択なし)",
    minuteOpt: "分選択",
    timeNote: "※ 紫微斗数と詳細な四柱推命分析のための必須情報",
    submitBtn: "無料運命診断を開始する",
    analyzing: "診断中...",
    failAnalyze: "分析失敗",
    serverError: "分析中にサーバーエラーが発生しました。",
    networkError: "サーバー通信エラーが発生しました."
  },
  zh: {
    badge: "✨ 融合三大东方运势学核心精髓",
    title: "四兽者命运 (SasujaFate)",
    description: "排除了所有复杂的繁琐文字与迷信内容。纯粹提取八字、数理学、紫微斗数的精髓，呈现三大古老智慧交汇所指引的清晰命运钥匙。",
    formTitle: "🔮 开始运势诊断",
    nameLabel: "您的姓名",
    namePlaceholder: "请输入您的姓名",
    lunarLabel: "公历 / 农历类型",
    solar: "公历 (Solar)",
    lunar: "农历 平月",
    leapLunar: "农历 闰月",
    birthLabel: "出生日期",
    yearOpt: "年",
    monthOpt: "月",
    dayOpt: "日",
    birthNote: "※ 系统将根据不同历法自动转换闰月和节气",
    timeLabel: "出生时辰 (选填)",
    timeUnknown: "时辰未知 (不选择)",
    minuteOpt: "分",
    timeNote: "※ 输入准确时辰能大幅提高八字与紫微斗数分析准确度",
    submitBtn: "开始免费命运诊断",
    analyzing: "诊断中...",
    failAnalyze: "诊断失败",
    serverError: "诊断过程中服务器出现异常。",
    networkError: "网络连接失败。"
  },
  vi: {
    badge: "✨ Tinh Hoa Tuyển Chọn Từ 3 Học Thuyết Vận Mệnh Cổ Đại",
    title: "SasujaFate",
    description: "Chúng tôi đã loại bỏ các ký tự Hán tự phức tạp và các chi tiết mê tín gây hoang mang. Chỉ trích xuất phần tinh hoa cốt lõi của Tứ Trụ, Thần Số Học cổ đông và Tử Vi Đẩu Số để mang lại chìa khóa vận mệnh rõ ràng nhất.",
    formTitle: "🔮 Bắt Đầu Chẩn Đoán Vận Mệnh",
    nameLabel: "Họ và Tên",
    namePlaceholder: "Nhập họ và tên của bạn",
    lunarLabel: "Lịch Dương / Lịch Âm",
    solar: "Lịch Dương (Solar)",
    lunar: "Lịch Âm thường",
    leapLunar: "Lịch Âm tháng nhuận",
    birthLabel: "Ngày tháng năm sinh",
    yearOpt: "Năm",
    monthOpt: "Tháng",
    dayOpt: "Ngày",
    birthNote: "※ Tự động quy đổi chính xác tháng nhuận theo quy luật lịch pháp",
    timeLabel: "Giờ sinh (Không bắt buộc)",
    timeUnknown: "Không rõ giờ sinh",
    minuteOpt: "Phút",
    timeNote: "※ Thông tin giờ sinh rất quan trọng để lập lá số Tử Vi & Tứ Trụ chi tiết",
    submitBtn: "Bắt đầu chẩn đoán miễn phí",
    analyzing: "Đang chẩn đoán...",
    failAnalyze: "Chẩn đoán thất bại",
    serverError: "Đã xảy ra lỗi máy chủ trong quá trình chẩn đoán.",
    networkError: "Lỗi kết nối máy chủ."
  }
};

export default function Home() {
  const router = useRouter();
  const [lang, setLang] = useState<Locale>("ko");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    birthHour: "",
    birthMinute: "",
    isLunar: "solar",
  });

  useEffect(() => {
    const savedLang = localStorage.getItem("sasuja_lang") as Locale;
    if (savedLang) setLang(savedLang);

    const handleLangChange = (e: any) => {
      setLang(e.detail);
    };
    window.addEventListener("sasuja_lang_change", handleLangChange);
    return () => window.removeEventListener("sasuja_lang_change", handleLangChange);
  }, []);

  const years = Array.from({ length: 100 }, (_, i) => String(new Date().getFullYear() - i));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ft = formTranslations[lang];

    try {
      const birthDate = `${formData.birthYear}-${formData.birthMonth}-${formData.birthDay}`;
      let birthTime = "";
      if (formData.birthHour) {
        const min = formData.birthMinute || "00";
        birthTime = `${formData.birthHour}:${min}`;
      }

      const payload = {
        name: formData.name,
        birthDate,
        birthTime,
        isLunar: formData.isLunar,
        locale: lang,
      };

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          sessionStorage.setItem("saju_report_data", JSON.stringify(result));
          router.push("/report");
        } else {
          alert(`${ft.failAnalyze}: ${result.error || "Unknown Error"}`);
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        alert(`${ft.serverError} ${errJson.error || ""}`);
      }
    } catch (error) {
      console.error(error);
      alert(ft.networkError);
    } finally {
      setLoading(false);
    }
  };

  const handleHourChange = (hour: string) => {
    setFormData((prev) => ({
      ...prev,
      birthHour: hour,
      birthMinute: hour ? (prev.birthMinute || "00") : "",
    }));
  };

  const ft = formTranslations[lang];

  return (
    <div className="min-h-[calc(100vh-68px)] bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 pt-12 sm:pt-20">
      <main className="max-w-3xl w-full flex flex-col items-center text-center gap-6 py-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-xs font-semibold text-amber-300/90 tracking-widest animate-pulse">
          {ft.badge}
        </div>

        <h1 className="text-4xl sm:text-6xl font-serif tracking-wide text-amber-100/95 leading-tight">
          {ft.title}
        </h1>

        <p className="text-sm sm:text-base text-slate-300/90 max-w-xl leading-relaxed bg-slate-900/50 p-6 rounded-[2rem] border border-slate-800/80 shadow-2xl backdrop-blur-md">
          {ft.description}
        </p>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-[2rem] p-8 shadow-2xl backdrop-blur-md text-left gap-6 flex flex-col"
        >
          <h2 className="text-xl font-medium text-amber-100 border-b border-slate-700 pb-4 text-center">
            {ft.formTitle}
          </h2>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-slate-400 pl-1">{ft.nameLabel}</label>
            <input
              type="text"
              required
              placeholder={ft.namePlaceholder}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-5 py-3.5 rounded-3xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-slate-400 pl-1">{ft.lunarLabel}</label>
            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-3xl border border-slate-800">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isLunar: "solar" })}
                className={`py-2 px-1 text-xs font-medium rounded-2xl transition-all cursor-pointer ${
                  formData.isLunar === "solar" ? "bg-amber-600 text-white" : "text-slate-400"
                }`}
              >
                {ft.solar}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isLunar: "lunar" })}
                className={`py-2 px-1 text-xs font-medium rounded-2xl transition-all cursor-pointer ${
                  formData.isLunar === "lunar" ? "bg-amber-600 text-white" : "text-slate-400"
                }`}
              >
                {ft.lunar}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isLunar: "leapLunar" })}
                className={`py-2 px-1 text-xs font-medium rounded-2xl transition-all cursor-pointer ${
                  formData.isLunar === "leapLunar" ? "bg-amber-600 text-white" : "text-slate-400"
                }`}
              >
                {ft.leapLunar}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-slate-400 pl-1">{ft.birthLabel}</label>
            <div className="grid grid-cols-3 gap-3">
              <select 
                required
                value={formData.birthYear} 
                onChange={(e) => setFormData({...formData, birthYear: e.target.value})} 
                className="w-full px-3 py-3.5 rounded-3xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer text-sm"
              >
                <option value="">{ft.yearOpt}</option>
                {years.map(y => <option key={y} value={y}>{y}{ft.yearOpt}</option>)}
              </select>
              <select 
                required
                value={formData.birthMonth} 
                onChange={(e) => setFormData({...formData, birthMonth: e.target.value})} 
                className="w-full px-3 py-3.5 rounded-3xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer text-sm"
              >
                <option value="">{ft.monthOpt}</option>
                {months.map(m => <option key={m} value={m}>{m}{ft.monthOpt}</option>)}
              </select>
              <select 
                required
                value={formData.birthDay} 
                onChange={(e) => setFormData({...formData, birthDay: e.target.value})} 
                className="w-full px-3 py-3.5 rounded-3xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer text-sm"
              >
                <option value="">{ft.dayOpt}</option>
                {days.map(d => <option key={d} value={d}>{d}{ft.dayOpt}</option>)}
              </select>
            </div>
            <p className="text-[11px] text-slate-500 pl-1">{ft.birthNote}</p>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-slate-400 pl-1">{ft.timeLabel}</label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={formData.birthHour}
                onChange={(e) => handleHourChange(e.target.value)}
                className="w-full px-4 py-3.5 rounded-3xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer text-xs"
              >
                <option value="">{ft.timeUnknown}</option>
                {hours.map((h) => <option key={h} value={h}>{h}시</option>)}
              </select>
              <select
                value={formData.birthMinute}
                disabled={!formData.birthHour}
                onChange={(e) => setFormData({ ...formData, birthMinute: e.target.value })}
                className="w-full px-4 py-3.5 rounded-3xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">{ft.minuteOpt}</option>
                {minutes.map((m) => <option key={m} value={m}>{m}분</option>)}
              </select>
            </div>
            <p className="text-[11px] text-slate-500 pl-1">{ft.timeNote}</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-4 px-6 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-medium shadow-lg transition-all cursor-pointer disabled:opacity-50 text-sm"
          >
            {loading ? ft.analyzing : ft.submitBtn}
          </button>
        </form>
      </main>
    </div>
  );
}
