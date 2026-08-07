const { Client } = require("pg");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const dbConfig = {
  host: "db.eelaqxxeochzllvgjgts.supabase.co",
  port: 5432,
  user: "postgres",
  database: "postgres",
  ssl: {
    rejectUnauthorized: false,
  },
};

console.log("🔮 사수자패트(SasujaFate) Supabase DB 스키마 마이그레이션 도구");
console.log("-----------------------------------------------------------------");
console.log("이 도구는 users 테이블에 누락된 사주 관련 필수 컬럼들을 자동으로 추가합니다.");
console.log(`대상 DB 호스트: ${dbConfig.host}`);
console.log("-----------------------------------------------------------------\n");

rl.question("🔑 Supabase 데이터베이스 비밀번호를 입력해 주세요: ", async (password) => {
  if (!password) {
    console.error("❌ 비밀번호가 입력되지 않았습니다. 종료합니다.");
    rl.close();
    return;
  }

  const client = new Client({
    ...dbConfig,
    password: password,
  });

  try {
    console.log("\n⏳ 데이터베이스 연결 시도 중...");
    await client.connect();
    console.log("✅ 데이터베이스 연결 성공!");

    console.log("\n⏳ users 테이블 컬럼 추가(DDL) 실행 중...");
    const queries = [
      "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_unlocked BOOLEAN DEFAULT FALSE;",
      "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS saju_name TEXT;",
      "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS birth_date TEXT;",
      "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS birth_time TEXT;",
      "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_lunar TEXT;",
      "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS saju_data JSONB;"
    ];

    for (const q of queries) {
      console.log(` > 실행: ${q}`);
      await client.query(q);
    }

    console.log("\n🎉 모든 컬럼이 정상적으로 추가/검증되었습니다!");
  } catch (err) {
    console.error("\n❌ 오류 발생 (연결 실패 또는 비밀번호 오류):", err.message);
  } finally {
    await client.end();
    rl.close();
  }
});
