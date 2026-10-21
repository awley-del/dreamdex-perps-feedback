/**
 * DRY_RUN parser divergence battery — dreamDEX bot-kit 0.1.0.
 *
 * Shows that the SAME repository reads the SAME variable, DRY_RUN, with four
 * incompatible comparison expressions, and that the interaction of those four
 * readers produces the opposite of the documented behaviour for one example.
 *
 * The perp-core reader is exported, so it is imported from a real clone when one
 * is provided. The other three are module-local and are replayed here verbatim
 * from the cited lines — the script says which is which in its output.
 *
 * No chain access, no keys, no transactions. Pure parser evaluation.
 *
 * Run against a clone:
 *     BOTKIT_DIR=/path/to/dreamdex-bot-kit npx tsx repro.ts
 *
 * Run without a clone (all four readers replayed verbatim):
 *     npx tsx repro.ts
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// ---------------------------------------------------------------------------
// Parser 1 — packages/perp-core/src/config.ts:66-70 (exported; imported when possible)
//   const raw = process.env[name];
//   if (raw === undefined || raw.trim() === "") return fallback;   // fallback = true for DRY_RUN
//   return raw !== "false" && raw !== "0";
//   DRY is true for every value except the exact strings "false" and "0".
// ---------------------------------------------------------------------------
const envBoolReplay = (v: string): boolean => {
  const raw: string = v;
  if (raw === undefined || raw.trim() === "") return true; // fallback for DRY_RUN
  return raw !== "false" && raw !== "0";
};

// Parser 2 — strategies/{grid,starter,twap,momentum}/src/config.ts:22
//   function bool(key, fallback) {
//     const v = process.env[key];
//     if (v === undefined || v === "") return fallback;   // fallback = true for DRY_RUN
//     return v === "1" || v.toLowerCase() === "true";
//   }
const spotBool = (v: string): boolean => {
  if (v === undefined || v === "") return true; // fallback for DRY_RUN
  return v === "1" || v.toLowerCase() === "true";
};

// Parser 3 — strategies/perp-maker/src/index.ts:79 (a LIVE flag, not a dry flag)
//   const live = process.env.DRY_RUN === "false";
const perpMakerLive = (v: string): boolean => v === "false";

// Parser 4 — examples/08-regime-multistrategy/src/bot.ts:65 (a LIVE flag)
//   const DRY = process.env.DRY_RUN === "1";
const example08Dry = (v: string): boolean => v === "1";

type EnvBool = (key: string, fallback: boolean) => boolean;

async function resolveEnvBool(
  botkitDir: string,
): Promise<{ fn: EnvBool | null; source: string }> {
  if (!botkitDir) {
    return {
      fn: null,
      source: "replayed verbatim from packages/perp-core/src/config.ts:66",
    };
  }
  const candidates = [
    resolve(botkitDir, "packages/perp-core/src/config.ts"),
    resolve(botkitDir, "packages/perp-core/src/lib/env-bool.ts"),
    resolve(botkitDir, "packages/perp-core/src/env.ts"),
  ];
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    try {
      const mod: Record<string, unknown> = await import(pathToFileURL(p).href);
      if (typeof mod.envBool === "function") {
        return { fn: mod.envBool as EnvBool, source: `imported from ${p}` };
      }
    } catch {
      /* fall through to the next candidate */
    }
  }
  return {
    fn: null,
    source: `no exported envBool under ${botkitDir}; replayed verbatim from config.ts:66`,
  };
}

async function main(): Promise<void> {
  const botkitDir = process.env.BOTKIT_DIR ?? "";
  const { fn: envBool, source } = await resolveEnvBool(botkitDir);

  const perpCoreDry = (v: string): boolean => {
    process.env.DRY_RUN = v;
    return envBool ? envBool("DRY_RUN", true) : envBoolReplay(v);
  };

  const values = [
    "true",
    "TRUE",
    "false",
    "FALSE",
    "0",
    "1",
    "off",
    "no",
    "",
    "yes",
  ];

  console.log(`perp-core reader: ${source}`);
  console.log(
    "DRY_RUN      | perp-core | spot bool | perp-maker=LIVE | example-08=DRY",
  );
  console.log("-".repeat(74));

  const disagreements: string[] = [];
  for (const v of values) {
    const pc = perpCoreDry(v);
    const spot = spotBool(v);
    const makerLive = perpMakerLive(v);
    const e08 = example08Dry(v);

    console.log(
      `${JSON.stringify(v).padEnd(12)} | ${String(pc).padEnd(9)} | ${String(spot).padEnd(9)} | ${String(makerLive).padEnd(15)} | ${e08}`,
    );

    // The two LIVE-shaped readers are normalised to a DRY answer before comparing.
    const asDry = [pc, spot, !makerLive, e08];
    if (new Set(asDry).size > 1) disagreements.push(v);
  }

  console.log("\n=== VALUES THE FOUR READERS DISAGREE ON ===");
  console.log(JSON.stringify(disagreements));

  console.log("\n=== THE SHARP CASE: DRY_RUN=true ===");
  console.log(
    'README.md:81 and docs/getting-started.md:53 say "Every strategy defaults to',
  );
  console.log(
    'DRY_RUN=true - it logs exactly what it would do without sending anything."',
  );
  console.log(
    'docs/railway.md:82 lists the default as "true" and .env.example:51 ships',
  );
  console.log("DRY_RUN=true.\n");

  const docsValue = "true";
  const pc = perpCoreDry(docsValue);
  const spot = spotBool(docsValue);
  const makerLive = perpMakerLive(docsValue);
  const e08 = example08Dry(docsValue);

  console.log(
    `  perp-core   envBool("${docsValue}") = ${pc} -> dry, sends nothing  (matches docs)`,
  );
  console.log(
    `  spot        bool("${docsValue}")    = ${spot} -> dry, sends nothing  (matches docs)`,
  );
  console.log(
    `  perp-maker  LIVE("${docsValue}")    = ${makerLive} -> dry             (matches docs)`,
  );
  console.log(
    `  examples/08 DRY("${docsValue}")     = ${e08} -> LIVE, sends orders  (contradicts docs)`,
  );
  console.log(
    `\nVERDICT: ${
      e08 === false
        ? "CONFIRMED - with DRY_RUN=true, examples/08-regime-multistrategy runs live while every other strategy stays dry"
        : "no contradiction observed"
    }`,
  );
}

void main();
