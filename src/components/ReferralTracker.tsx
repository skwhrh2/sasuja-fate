import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export default function ReferralTracker() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      console.log(`[DEBUG] 레퍼럴 추천인 코드 감지됨: ${ref}`);
      localStorage.setItem("sasuja_ref", ref.trim());
    }
  }, [searchParams]);

  return null;
}
