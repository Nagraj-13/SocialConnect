// scripts/create-admin.mjs
import "dotenv/config";
import { spawnSync } from "child_process";
import fs from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
  process.exit(1);
}
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Missing ADMIN_EMAIL or ADMIN_PASSWORD in env");
  process.exit(1);
}

const projectRoot = process.cwd();
const generatedClientDir = path.join(projectRoot, "lib", "generated", "prisma");
const prismaSchema = path.join(projectRoot, "prisma", "schema.prisma");

async function rmIfExists(p) {
  try {
    await fs.rm(p, { recursive: true, force: true });
    console.log("Removed (if existed):", p);
  } catch {
    /* ignore */
  }
}

function runPrismaGenerate() {
  console.log("Running: npx prisma generate --schema", prismaSchema);
  const r = spawnSync("npx", ["prisma", "generate", "--schema", prismaSchema], {
    stdio: "inherit",
    shell: true,
  });
  return r.status === 0;
}

async function ensureGenerated() {
  const MAX_TRIES = 3;
  for (let i = 1; i <= MAX_TRIES; i++) {
    try {
      // try to generate
      const ok = runPrismaGenerate();
      if (ok) return true;
      console.warn(`prisma generate failed (attempt ${i}/${MAX_TRIES})`);
    } catch (err) {
      console.warn("generate attempt error:", err?.message ?? err);
    }
    if (i < MAX_TRIES) {
      console.log("Waiting 1s before retrying...");
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return false;
}

async function importPrismaClientAndInstantiate() {
  // Try normal import first
  try {
    console.log("Trying import('@prisma/client')...");
    const mod = await import("@prisma/client");
    const PrismaClientCtor =
      mod?.PrismaClient || (mod?.default && mod.default.PrismaClient) || (mod?.default || null);

    if (!PrismaClientCtor) {
      throw new Error("PrismaClient constructor not found on '@prisma/client' module");
    }

    try {
      const prisma = new PrismaClientCtor();
      console.log("Instantiated PrismaClient from @prisma/client successfully.");
      return { prisma, source: "@prisma/client" };
    } catch (instErr) {
      console.warn("Instantiation of PrismaClient from @prisma/client failed:", instErr.message);
      // fallthrough to fallback import
    }
  } catch (err) {
    console.warn("import('@prisma/client') failed:", err?.message ?? err);
  }

  // Fallback: import generated client directly
  try {
    // look for likely entry files
    const candidates = [
      path.join(generatedClientDir, "index.js"),
      path.join(generatedClientDir, "index.cjs"),
      path.join(generatedClientDir, "index.mjs"),
    ];

    let chosen = null;
    for (const c of candidates) {
      try {
        await fs.access(c);
        chosen = c;
        break;
      } catch {}
    }

    // If none of the above exist, use the directory as module import (package.json + main)
    const importTarget = chosen ? chosen : generatedClientDir;
    const importUrl = pathToFileURL(importTarget).href;
    console.log("Fallback importing generated client from:", importUrl);

    const generatedMod = await import(importUrl);
    const PrismaClientCtor =
      generatedMod?.PrismaClient || (generatedMod?.default && generatedMod.default.PrismaClient) || generatedMod?.default || null;

    if (!PrismaClientCtor) {
      throw new Error("PrismaClient constructor not found in generated client module");
    }

    const prisma = new PrismaClientCtor();
    console.log("Instantiated PrismaClient from generated client successfully.");
    return { prisma, source: importTarget };
  } catch (err) {
    console.error("Failed to import or instantiate Prisma client:", err?.message ?? err);
    throw err;
  }
}

(async function main() {
  // ensure the generated client exists
  const ok = await ensureGenerated();
  if (!ok) {
    console.error("Failed to run `prisma generate`. Try manual cleanup (stop dev server, delete lib/generated/prisma, run as admin).");
    process.exit(1);
  }

  // import + instantiate Prisma client (with fallback)
  let prisma, clientSource;
  try {
    const result = await importPrismaClientAndInstantiate();
    prisma = result.prisma;
    clientSource = result.source;
    console.log("Prisma client source used:", clientSource);
  } catch (err) {
    console.error("Could not obtain Prisma client. Aborting.");
    process.exit(1);
  }

  // create Supabase admin auth user and upsert Prisma row
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  try {
    console.log("Creating admin auth user in Supabase…");
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { createdByScript: true },
    });

    if (error) {
      console.warn("Supabase admin.createUser returned error:", error.message);
      console.error("If user exists already, get their auth user id from Supabase dashboard and run the Prisma upsert manually.");
      process.exit(1);
    }

    const userId = data?.user?.id ?? data?.id;
    if (!userId) {
      console.error("Couldn't determine user id from Supabase response:", data);
      process.exit(1);
    }

    console.log("Supabase auth user created:", userId);
    console.log("Upserting user in database with role = ADMIN...");

    await prisma.user.upsert({
      where: { id: userId },
      update: {
        email: ADMIN_EMAIL,
        username: ADMIN_EMAIL.split("@")[0],
        role: "ADMIN",
        isActive: true,
        isVerified: true,
      },
      create: {
        id: userId,
        email: ADMIN_EMAIL,
        username: ADMIN_EMAIL.split("@")[0],
        role: "ADMIN",
        isActive: true,
        isVerified: true,
      },
    });

    console.log("Admin user upserted in DB. id =", userId);
  } catch (err) {
    console.error("Script error:", err);
    process.exit(1);
  } finally {
    try { await prisma.$disconnect(); } catch {}
    process.exit(0);
  }
})();
