import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const WEB_DIR = path.resolve(import.meta.dirname, "..");
const REPO_ROOT = path.resolve(WEB_DIR, "..", "..");
const ENV_LOCAL_PATH = path.join(WEB_DIR, ".env.local");

const ALLOWED_ENVIRONMENTS = new Set(["production", "preview", "development"]);

const ENV_SPEC = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", sensitive: false, required: true },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", sensitive: false, required: true },
  { key: "NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID", sensitive: false, required: true },
  { key: "CLOUDINARY_CLOUD_NAME", sensitive: false, required: true },
  { key: "CLOUDINARY_FOLDER", sensitive: false, required: false, defaultValue: "skinsense/products" },
  { key: "SUPABASE_SERVICE_ROLE_KEY", sensitive: true, required: true },
  { key: "CLOUDINARY_API_KEY", sensitive: true, required: true },
  { key: "CLOUDINARY_API_SECRET", sensitive: true, required: true },
];

function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const parsed = new Map();

  for (const rawLine of content.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const cleanLine = trimmed.startsWith("export ") ? trimmed.slice(7).trim() : trimmed;
    const eqIndex = cleanLine.indexOf("=");
    if (eqIndex <= 0) continue;

    const key = cleanLine.slice(0, eqIndex).trim();
    let value = cleanLine.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
      (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
    ) {
      value = value.slice(1, -1);
    }

    parsed.set(key, value);
  }

  return parsed;
}

function parseCliArgs(argv) {
  let dryRun = false;
  let deploy = false;
  let help = false;
  let environment = "production";

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--deploy") {
      deploy = true;
    } else if (arg === "-h" || arg === "--help") {
      help = true;
    } else if (arg === "--environment" || arg === "--env") {
      const next = argv[i + 1];
      if (!next || !ALLOWED_ENVIRONMENTS.has(next)) {
        throw new Error(`Invalid environment "${next ?? ""}". Expected one of: production, preview, development.`);
      }
      environment = next;
      i += 1;
    } else if (arg.startsWith("--environment=") || arg.startsWith("--env=")) {
      const value = arg.split("=")[1] ?? "";
      if (!ALLOWED_ENVIRONMENTS.has(value)) {
        throw new Error(`Invalid environment "${value}". Expected one of: production, preview, development.`);
      }
      environment = value;
    } else if (arg === "--") {
      continue;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return { dryRun, deploy, help, environment };
}

function printHelp() {
  console.log(`SkinSense Vercel Env Sync (apps/web)

Usage:
  bun run vercel:env-sync [--dry-run] [--environment production|preview|development] [--deploy]

Notes:
  - Reads apps/web/.env.local locally without ever printing secret values or passing them in CLI arguments.
  - Sensitive server secrets (SUPABASE_SERVICE_ROLE_KEY, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)
    are uploaded with --sensitive via stdin so they are never exposed in shell history or client bundles.
  - Requires interactive 'bunx vercel login' (or VERCEL_TOKEN) and linked project in apps/web/.vercel/project.json.`);
}

function checkVercelAuth() {
  const res = spawnSync("bunx", ["vercel", "whoami"], {
    cwd: WEB_DIR,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    authenticated: res.status === 0,
    account: (res.stdout || "").trim(),
  };
}

function findLinkedProjectPath() {
  const candidates = [
    path.join(WEB_DIR, ".vercel", "project.json"),
    path.join(REPO_ROOT, ".vercel", "project.json"),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function main() {
  let options;
  try {
    options = parseCliArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  if (options.help) {
    printHelp();
    return;
  }

  if (!fs.existsSync(ENV_LOCAL_PATH)) {
    console.error(`Missing ${path.relative(REPO_ROOT, ENV_LOCAL_PATH)}. Create it from apps/web/.env.example first.`);
    process.exit(1);
  }

  const envMap = parseEnvFile(ENV_LOCAL_PATH);
  const resolvedItems = [];
  const missingRequired = [];

  for (const spec of ENV_SPEC) {
    const rawValue = envMap.get(spec.key)?.trim();
    const effectiveValue = rawValue || (!spec.required ? spec.defaultValue : undefined);

    if (!effectiveValue) {
      missingRequired.push(spec.key);
      continue;
    }

    resolvedItems.push({
      key: spec.key,
      sensitive: spec.sensitive,
      value: effectiveValue,
      fromDefault: !rawValue,
    });
  }

  const authStatus = checkVercelAuth();
  const linkedProjectPath = findLinkedProjectPath();

  console.log(`Target environment : ${options.environment}`);
  console.log(`Vercel CLI auth    : ${authStatus.authenticated ? `authenticated (${authStatus.account || "ok"})` : "logged out"}`);
  console.log(`Linked project     : ${linkedProjectPath ? path.relative(REPO_ROOT, linkedProjectPath) : "not linked"}`);
  console.log("Variables plan     :");
  for (const spec of ENV_SPEC) {
    const item = resolvedItems.find((entry) => entry.key === spec.key);
    const statusLabel = item
      ? item.fromDefault
        ? "READY (default)"
        : "READY"
      : "MISSING";
    const visibility = spec.sensitive ? "Sensitive Secret" : "Config";
    console.log(`  - ${spec.key} [${visibility}] -> ${statusLabel}`);
  }

  if (missingRequired.length > 0) {
    console.error(`\nMissing required keys in apps/web/.env.local: ${missingRequired.join(", ")}`);
    process.exit(1);
  }

  if (options.dryRun) {
    console.log("\nDry run complete. No environment variables were modified and no values were printed.");
    return;
  }

  if (!authStatus.authenticated) {
    console.error("\nVercel CLI is not logged in. Run this one-time step first:\n  cd apps/web && bunx vercel login");
    process.exit(1);
  }

  if (!linkedProjectPath) {
    console.error(
      "\nProject is not linked yet. Run this one-time step first:\n  cd apps/web && bunx vercel link --project skinsense-v2",
    );
    process.exit(1);
  }

  console.log("");
  for (const item of resolvedItems) {
    const args = [
      "vercel",
      "env",
      "add",
      item.key,
      "--environment",
      options.environment,
      "--force",
      "--yes",
      item.sensitive ? "--sensitive" : "--no-sensitive",
    ];

    const res = spawnSync("bunx", args, {
      cwd: WEB_DIR,
      input: item.value,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (res.status !== 0) {
      console.error(`Failed to sync ${item.key} (exit code ${res.status}).`);
      const safeErr = (res.stderr || res.stdout || "").trim();
      if (safeErr) console.error(safeErr);
      process.exit(res.status || 1);
    }

    console.log(`Synced ${item.key} (${item.sensitive ? "sensitive" : "config"}) -> ${options.environment}`);
  }

  if (options.deploy) {
    console.log("\nTriggering production deployment via Vercel CLI...");
    const deployArgs = options.environment === "production" ? ["vercel", "--prod", "--yes"] : ["vercel", "--yes"];
    const deployRes = spawnSync("bunx", deployArgs, {
      cwd: WEB_DIR,
      stdio: "inherit",
    });
    if (deployRes.status !== 0) {
      process.exit(deployRes.status || 1);
    }
  }
}

main();
