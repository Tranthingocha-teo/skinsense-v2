/**
 * Script Khởi tạo & Kiểm tra Kết nối Dữ liệu Thật trên Supabase
 * Tác giả: Trần Thị Ngọc Hà (Super Admin - hattn.23itb@vku.udn.vn)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// Load .env.local if present
const envPath = resolve(process.cwd(), "apps/web/.env.local");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2]?.replace(/^['"]|['"]$/g, "");
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gzecjsqnehgrvkgnznec.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SERVICE_KEY) {
  console.warn("Cảnh báo: Chưa cung cấp SUPABASE_SERVICE_ROLE_KEY trong biến môi trường.");
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY || "", {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("Kiểm tra kết nối Supabase Cloud:", SUPABASE_URL);

  // 1. Kiểm tra bucket photos & phác đồ
  const { data: file, error: fileErr } = await supabase.storage
    .from("photos")
    .download("real_routine_protocol.json");

  if (file) {
    console.log("✓ Bucket 'photos' đã có phác đồ y khoa thật 'real_routine_protocol.json'.");
  } else {
    console.log("! Lưu ý phác đồ storage:", fileErr?.message);
  }

  // 2. Kiểm tra các bảng cơ sở dữ liệu
  const tables = ["profiles", "specialists", "products", "orders", "routine_entries", "routine_items"];
  for (const t of tables) {
    const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
    if (error) {
      console.log(`- Bảng ${t}: Chưa khả dụng hoặc lỗi (${error.message})`);
    } else {
      console.log(`✓ Bảng ${t}: Đã sẵn sàng (${count ?? 0} bản ghi)`);
    }
  }

  console.log("Hoàn tất kiểm tra dữ liệu thật do Trần Thị Ngọc Hà thiết lập!");
}

main().catch(console.error);
