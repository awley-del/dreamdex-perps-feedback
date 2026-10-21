# The bot-kit ships four different DRY_RUN parsers, and the value the docs recommend makes one of the shipped examples trade live

Severity: major
Area: SDK

## Steps to reproduce
1. Clone the bot-kit and read the four places that decide whether a run is a simulation:
   - `packages/perp-core/src/config.ts:66` — `return raw !== "false" && raw !== "0";`
   - `strategies/grid/src/config.ts:22` — `return v === "1" || v.toLowerCase() === "true";`
   - `strategies/perp-maker/src/index.ts:79` — `const live = process.env.DRY_RUN === "false";`
   - `examples/08-regime-multistrategy/src/bot.ts:65` — `const DRY = process.env.DRY_RUN === "1";`
2. Evaluate all four against the same environment values. The script below imports the real `envBool` from `perp-core` and replays the other three comparisons verbatim, so it measures the shipped source rather than a paraphrase:
   ```ts
   import { envBool } from "../packages/perp-core/src/config.js";
   const spotBool  = (v: string) => v === "1" || v.toLowerCase() === "true";   // grid/starter/twap/…
   const makerLive = (v: string) => v === "false";                             // perp-maker
   const example08Dry = (v: string) => v === "1";                              // examples/08
   for (const v of ["true","TRUE","false","FALSE","0","1","off","no","","yes"]) {
     process.env.DRY_RUN = v;
     console.log(v, envBool("DRY_RUN", true), spotBool(v), !makerLive(v), example08Dry(v));
   }
   ```
   Run with `npx tsx scratch/dryrun-repro.ts` from the repo root.
3. Set `DRY_RUN=true`, the value the shipped `.env.example` files and the README recommend as the safe default, and start `examples/08-regime-multistrategy`.

## Expected
One meaning for `DRY_RUN` across the repo, and a default that cannot place real orders. The docs are explicit that the flag is a safety switch, and the shipped example environment file repeats it: `# 1 = simulation (mock, no real orders). Remove/set 0 for a live/testnet run.`

## Actual
Four parsers, four different truth tables. They disagree on eight of ten probe values (`true`, `TRUE`, `FALSE`, `0`, `off`, `no`, empty string, `yes`), which means the same `.env` means a different thing depending on which strategy imports it:

```
DRY_RUN value | perp-core envBool | spot bool() | perp-maker(live) | example-08(dry)
"true"        | dry               | dry         | dry              | LIVE
"TRUE"        | dry               | dry         | dry              | LIVE
"false"       | LIVE              | LIVE        | LIVE             | dry
"FALSE"       | dry               | LIVE        | dry              | dry
"0"           | LIVE              | LIVE        | dry              | dry
"1"           | dry               | dry         | dry              | LIVE
"off"         | dry               | LIVE        | dry              | dry
"no"          | dry               | LIVE        | dry              | dry
""            | dry               | LIVE        | dry              | dry
"yes"         | dry               | LIVE        | dry              | dry
```

The sharp case is `DRY_RUN=true`, the documented safe value: every strategy that reads `envBool` or `bool()` stays in simulation, `perp-maker` stays in simulation, and `examples/08-regime-multistrategy` goes live because its parser only treats the literal string `"1"` as dry. A user who exports the recommended default and runs the regime-switching example places real orders.

One caveat on that example, stated plainly: its own README does not tell the user to export `DRY_RUN=true` — it says `npm run dry`, and that script is `cross-env DRY_RUN=1 tsx src/bot.ts`, which sets the one spelling this parser accepts. The contradiction therefore bites the user who follows the repository-level docs, the root `.env.example` (`DRY_RUN=true`, commented "Every ec-* bot honours these"), or the perps guide (`docs/perps.md:43`), and then runs the example directly; it does not bite the user who follows the example's local run block. That local README also carries the note `# npm start — live (reads config.json + .env)`, so the gap is one line apart in the same file: the tutorial's dry path works, and the two live-capable paths next to it do not share its meaning.

Two smaller inversions in the same table: `DRY_RUN=0` is live in `perp-core` and in the strategies but dry in `examples/08`, and `DRY_RUN=FALSE` is dry in `perp-core` and `perp-maker` but live in the strategies — so the spellings people reach for when they mean the opposite of the default are the exact ones where the packages stop agreeing.

## Evidence
Runtime output from `npx tsx scratch/dryrun-repro.ts` against the shipped source, bot-kit `0.1.0`, `packages/perp-core@0.1.0`:

```
=== VALUES THE FOUR PARSERS DISAGREE ON ===
["true","TRUE","FALSE","0","off","no","","yes"]

=== THE SHARP CASE: DRY_RUN=true (the value every doc tells users to set) ===
  perp-core envBool("true")  = true   -> dry, sends nothing  (matches docs)
  spot bool("true")          = true   -> dry, sends nothing  (matches docs)
  perp-maker live            = false  -> dry                 (matches docs)
  examples/08 DRY            = false  -> LIVE, sends real orders  (CONTRADICTS docs)
```

Source lines behind each column:

```ts
// packages/perp-core/src/config.ts:66
export function envBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  return raw !== "false" && raw !== "0";
}

// strategies/grid/src/config.ts:22  (identical helper in starter, twap, momentum,
// mean-reversion, market-making, ensemble, treasury, yield-optimizer)
function bool(key: string, fallback: boolean): boolean {
  const v = process.env[key];
  if (v === undefined || v === "") return fallback;
  return v === "1" || v.toLowerCase() === "true";

// strategies/perp-maker/src/index.ts:79
  const live = process.env.DRY_RUN === "false";

// examples/08-regime-multistrategy/src/bot.ts:65
const DRY = process.env.DRY_RUN === "1";
```

The consumer side is what makes the difference real rather than cosmetic — `strategies/starter/src/index.ts:48` gates the live order loop on the parsed value directly:

```ts
    if (config.dryRun) {
      for (const q of quotes) { log(`[dry-run] would ${q.side} …`); }
      return;
    }
    // Live: pull last tick's quotes, then place the fresh set.
```

Reproduction artefacts: `scratch/dryrun-repro.ts`, output in `scratch/dryrun-matrix.txt`.

## Environment
2026-10-21 (UTC). bot-kit `dreamdex-bot-kit@0.1.0`, `@dreamdex-bot-kit/perp-core@0.1.0`, Node with `tsx`. No RPC endpoint, no wallet, no private key, no chain access — the battery evaluates the shipped parsers against environment strings only, so it runs offline and cannot place an order. The claim stops at the parser boundary: that a live run then reaches the order path is shown by reading the consumer (`starter:48`, `perp-maker:125-137` cancelling and re-placing resting quotes), not by executing a funded order, which this environment cannot do.
