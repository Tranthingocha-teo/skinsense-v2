#!/usr/bin/env bun
/**
 * SkinSense Environment & Backend Doctor
 * Checks system dependencies, environment configuration, and Supabase backend health.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

type CheckResult = {
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
};

const results: CheckResult[] = [];

function check(name: string, fn: () => { status: "pass" | "warn" | "fail"; message: string }) {
  try {
    const res = fn();
    results.push({ name, ...res });
  } catch (err: any) {
    results.push({ name, status: "fail", message: err.message || String(err) });
  }
}

console.log("\n🏥 SkinSense Health Doctor\n============================\n");

// 1. Check Runtime Tools
check("Bun Runtime", () => {
  const version = typeof Bun !== "undefined" ? Bun.version : process.versions.node;
  return { status: "pass", message: `Bun v${version}` };
});

check("Node.js Compatibility", () => {
  const nodeVer = process.version;
  return { status: "pass", message: `Node.js ${nodeVer}` };
});

check("Git Repository", () => {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    return { status: "pass", message: `Git active on branch '${branch}'` };
  } catch {
    return { status: "warn", message: "Not a git repository or git command missing" };
  }
});

// 2. Check Configuration & Env Files
const rootDir = process.cwd();
const webEnvPath = path.join(rootDir, "apps/web/.env");
const webEnvLocalPath = path.join(rootDir, "apps/web/.env.local");
const mobileEnvPath = path.join(rootDir, "apps/mobile/.env");

check("Environment Files", () => {
  const hasWebEnv = fs.existsSync(webEnvPath) || fs.existsSync(webEnvLocalPath);
  const hasMobileEnv = fs.existsSync(mobileEnvPath);

  if (hasWebEnv && hasMobileEnv) {
    return { status: "pass", message: "Both apps/web and apps/mobile env files found" };
  }
  if (hasWebEnv || hasMobileEnv) {
    return { status: "warn", message: `Partial env setup: web=${hasWebEnv}, mobile=${hasMobileEnv}` };
  }
  return {
    status: "warn",
    message: "No .env found; using demo mode / template. Copy .env.example to .env in apps/web & apps/mobile",
  };
});

// 3. Supabase Variables
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "";

check("Supabase Configuration", () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      status: "warn",
      message: "Supabase credentials not configured in environment (Backend-free Demo mode active)",
    };
  }
  return { status: "pass", message: `Configured for ${supabaseUrl}` };
});

// 4. Supabase Reachability (Async)
async function testSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return;
  }
  try {
    const res = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });
    if (res.ok || res.status === 200 || res.status === 401) {
      results.push({
        name: "Supabase API Reachability",
        status: "pass",
        message: `HTTP ${res.status} OK from ${supabaseUrl}`,
      });
    } else {
      results.push({
        name: "Supabase API Reachability",
        status: "warn",
        message: `HTTP ${res.status} returned from ${supabaseUrl}`,
      });
    }
  } catch (e: any) {
    results.push({
      name: "Supabase API Reachability",
      status: "fail",
      message: `Failed to connect to ${supabaseUrl}: ${e.message}`,
    });
  }
}

async function run() {
  await testSupabase();

  // Print Summary Table
  let hasFailures = false;
  for (const r of results) {
    const icon = r.status === "pass" ? "✅ [PASS]" : r.status === "warn" ? "⚠️  [WARN]" : "❌ [FAIL]";
    console.log(`${icon.padEnd(10)} ${r.name}: ${r.message}`);
    if (r.status === "fail") hasFailures = true;
  }

  console.log("\n============================");
  if (hasFailures) {
    console.log("⚠️  Doctor detected issues that may prevent full backend operation.");
    process.exit(1);
  } else {
    console.log("✨ All doctor checks completed successfully!\n");
    process.exit(0);
  }
}

run();
