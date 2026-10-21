# example-08's template .env ships DRY_RUN=0, so a copied template is a live configuration and `npm start` reflects no deliberate choice

Severity: normal
Area: docs

## Steps to reproduce
1. Read the template environment file that ships with the regime-switching example, `examples/08-regime-multistrategy/.env.example:1-18`:
   ```
   # Copy to .env and fill in. NEVER commit .env and never share your private key with anyone.

   # Private key of your FUNDED dev wallet (the one issued for the program). Local only!
   DREAMDEX_PRIVATE_KEY=
   …
   # 1 = simulation (mock, no real orders). Remove/set 0 for a live/testnet run.
   DRY_RUN=0
   ```
2. Follow the example's own run block, `examples/08-regime-multistrategy/README.md:37-43`:
   ```bash
   cp .env.example .env                  # add your funded dev-wallet key + RPC
   npm run dry                           # simulation, no real orders
   # npm start                           # live (reads config.json + .env)
   ```
3. Note the parser that consumes the value, `examples/08-regime-multistrategy/src/bot.ts:65`: `const DRY = process.env.DRY_RUN === "1";` — the shipped `0` evaluates to not-dry.
4. Compare with the repository's other template, `.env.example:50-51`:
   ```
   # Every ec-* bot honours these.
   DRY_RUN=true
   ```

## Expected
A template environment file should ship the value its own comment describes as the safe one, and a live run should be a deliberate edit rather than the state of the file as copied. The comment here — `# 1 = simulation (mock, no real orders). Remove/set 0 for a live/testnet run.` — states the convention correctly. Shipping `DRY_RUN=0` underneath it is the opposite of that convention.

## Actual
The template's value and its comment disagree, and the two examples in the same repository disagree about the default: one ships `true`, this one ships `0`.

The documented path is safe, because `npm run dry` is `cross-env DRY_RUN=1 tsx src/bot.ts` (`package.json:5`) and overrides whatever the file holds. The hazard is the state the file leaves behind: after `cp .env.example .env` — the step the README tells the user to take, after being prompted two lines earlier for their funded wallet key — `.env` is a live configuration. `npm start` (also given in the run block) then trades, and the user's decision between dry and live has already been made by the template rather than by them. `READ_ONLY` (`src/bot.ts:66`) is the only read-without-orders mode offered, and it appears in neither the template nor the README.

Two further details make the mismatch easy to miss. `DRY_RUN=0` and the absence of `DRY_RUN` are the same state for this parser, so deleting the line to "remove" it — the phrasing in the comment — does not change the mode. And the value `0` is the one spelling that this example treats as live while `perp-core` also treats it as live and the strategies do not, which is reported separately as parser divergence; here the concern is only that the shipped default is the live one.

## Evidence
```
examples/08-regime-multistrategy/.env.example:1-18
# Copy to .env and fill in. NEVER commit .env and never share your private key with anyone.

# Private key of your FUNDED dev wallet (the one issued for the program). Local only!
DREAMDEX_PRIVATE_KEY=
…
# 1 = simulation (mock, no real orders). Remove/set 0 for a live/testnet run.
DRY_RUN=0

.env.example:50-51
# Every ec-* bot honours these.
DRY_RUN=true
```

```
examples/08-regime-multistrategy/src/bot.ts:65-66
const DRY = process.env.DRY_RUN === "1";
const READONLY = process.env.READ_ONLY === "1"; // live dreamDEX, but WITHOUT orders (only reads prices/balances)

examples/08-regime-multistrategy/package.json:3-6
 "start": "tsx src/bot.ts",
 "dry": "cross-env DRY_RUN=1 tsx src/bot.ts",
```

```
$ grep -rn "READ_ONLY" examples/08-regime-multistrategy/.env.example docs/*.md examples/08-regime-multistrategy/README.md
(no match — the read-only mode is implemented but documented nowhere)
```

## Environment
- SDK: n/a (raw HTTP/JSON-RPC, no SDK used)
- Wallet: n/a — no wallet, no signature, no transaction broadcast
- Network: n/a — offline evaluation of shipped source for Somnia Tokyo testnet; no RPC and no endpoint contacted
2026-10-21 (UTC). Read-only inspection of the shipped bot-kit `0.1.0` templates and run scripts; no `.env` was created from them and no order was placed. The finding is the template shipping the live value under a comment describing the safe one; it is not an observed live trade, and the README's `npm run dry` line is acknowledged above as overriding the file correctly.
