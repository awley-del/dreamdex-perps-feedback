# The bot-kit ships four different DRY_RUN parsers, and the value the docs recommend makes one shipped example trade live

Severity: major
Area: SDK

## Steps to reproduce
1. Clone the bot-kit and read the four places that decide whether a run is a simulation:
   - `packages/perp-core/src/config.ts:66-70` — `return raw !== "false" && raw !== "0";`, after `if (raw === undefined || raw.trim() === "") return fallback;`
   - `strategies/grid/src/config.ts:22` — `return v === "1" || v.toLowerCase() === "true";`, after the same empty-value guard
   - `strategies/perp-maker/src/index.ts:79` — `const live = process.env.DRY_RUN === "false";`
   - `examples/08-regime-multistrategy/src/bot.ts:65` — `const DRY = process.env.DRY_RUN === "1";`
2. Evaluate all four against the same environment values. `scripts/dry-run-parsers/repro.ts` in this repository does exactly that: it imports the exported `envBool` from `perp-core` when a clone is available, and replays the other three comparisons verbatim from the cited lines.
3. Set `DRY_RUN=true`, the value the shipped `.env.example` and the repository docs recommend as the safe default, and start `examples/08-regime-multistrategy`.

## Expected
One meaning for `DRY_RUN` across the repository, and a default that cannot place real orders. The docs state the flag is a safety switch and the root `.env.example:51` repeats the value:

```
DRY_RUN=true
```

## Actual
Four parsers, four different truth tables. They disagree on eight of the ten values probed, so the same `.env` means a different thing depending on which package reads it:

```
DRY_RUN value | perp-core envBool | spot bool() | perp-maker | example-08
--------------|-------------------|-------------|------------|-----------
"true"        | simulation        | simulation  | simulation | LIVE
"TRUE"        | simulation        | simulation  | simulation | LIVE
"false"       | simulation        | simulation  | LIVE       | LIVE
"FALSE"       | simulation        | simulation  | simulation | LIVE
"0"           | simulation        | simulation  | simulation | LIVE
"1"           | simulation        | simulation  | simulation | simulation
"off"         | simulation        | simulation  | simulation | LIVE
"no"          | simulation        | simulation  | simulation | LIVE
""            | simulation        | simulation  | simulation | LIVE
"yes"         | simulation        | simulation  | simulation | LIVE
```

The sharp case is `DRY_RUN=true`. Every reader that honours the documented meaning stays in simulation. `examples/08-regime-multistrategy` does not: its parser only treats the literal string `"1"` as dry, so `"true"` evaluates to live. A user who exports the recommended default and runs the regime-switching example reaches the order path instead of the simulation path.

One caveat, stated plainly rather than rounded off. The example's own README does not tell the user to export `DRY_RUN=true`; it says `npm run dry`, and that script is `cross-env DRY_RUN=1 tsx src/bot.ts`, which sets the single spelling this parser accepts. The contradiction therefore bites the user who follows the repository-level docs (`README.md:81`, `docs/getting-started.md:53`, `docs/perps.md:43`, `docs/railway.md:82` which lists the default as `true`) and then runs the example directly. It does not bite the user who follows the example's local run block. The local README carries `npm start — live (reads config.json + .env)` immediately next to that dry path, so the two live-capable entries and the one dry entry do not share a meaning.

The same table shows the inverse failure on the values people reach for when they do mean to go live: `DRY_RUN=false` is live in `perp-core` but dry in `examples/08` and in `perp-maker`. Stripe-and-comment edits to a `.env` are the ordinary way these files are used, and either direction can land a user in the mode opposite to the one they wrote.

## Evidence
Runtime output, `scripts/dry-run-parsers/repro.ts`, bot-kit `dreamdex-bot-kit@0.1.0`, Node v22.23.1, 2026-10-21T03:22:55Z. The perp-core column is imported from a real clone, not reimplemented:

```
perp-core reader: imported from packages/perp-core/src/config.ts
DRY_RUN      | perp-core | spot bool | perp-maker=LIVE | example-08=DRY
--------------------------------------------------------------------------
"true"       | true      | true      | false           | false
"TRUE"       | true      | true      | false           | false
"false"      | false     | false     | true            | false
"FALSE"      | true      | false     | false           | false
"0"          | false     | false     | false           | false
"1"          | true      | true      | false           | true
"off"        | true      | false     | false           | false
"no"         | true      | false     | false           | false
""           | true      | false     | false           | false
"yes"        | true      | false     | false           | false

=== VALUES THE FOUR READERS DISAGREE ON ===
["true","TRUE","FALSE","0","off","no","","yes"]

=== THE SHARP CASE: DRY_RUN=true ===
  perp-core   envBool("true") = true  -> simulation, sends nothing   (matches docs)
  spot        bool("true")    = true  -> simulation, sends nothing   (matches docs)
  perp-maker  LIVE("true")    = false -> simulation                  (matches docs)
  examples/08 DRY("true")     = false -> LIVE, sends orders          (contradicts docs)
```

Full captured output with the invocation is in `scripts/dry-run-parsers/run.log`. The script runs without a clone too, in which case all four readers are replayed verbatim and it says so in its first line; both modes produce identical tables.

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
}

// strategies/perp-maker/src/index.ts:79
  const live = process.env.DRY_RUN === "false";

// examples/08-regime-multistrategy/src/bot.ts:65
const DRY = process.env.DRY_RUN === "1";
```

The consumer side is what makes the difference operational rather than cosmetic: `strategies/starter/src/index.ts:48` gates the live order loop on the parsed value directly.

```ts
    if (config.dryRun) {
      for (const q of quotes) { log(`[dry-run] would ${q.side} ...`); }
      return;
    }
    // Live: pull last tick's quotes, then place the fresh set.
```

## Environment
- SDK: `@dreamdex-bot-kit/perp-core@0.1.0` as shipped in the bot-kit repository, plus `@somnia-chain/markets-sdk@0.30.0` resolved in the same tree
- Wallet: n/a — no wallet, no signature, no transaction broadcast
- Network: n/a — offline evaluation of shipped source, no RPC and no endpoint contacted

2026-10-21 (UTC). Node v22.23.1 with `tsx`. The battery evaluates the shipped parsers against environment strings only, so it runs offline and cannot place an order. The claim stops at the parser boundary: that a live-typed run reaches the order path is shown by reading the consumer (`starter:48`, and `perp-maker:125-137` which cancels and re-places resting quotes), not by executing a funded order, which this environment cannot do.
