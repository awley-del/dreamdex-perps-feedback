# perp-maker's link gate answers `ok: true` when there is no trading key, so it can never fail and the live bot runs on without warning

Severity: normal
Area: SDK

## Steps to reproduce
1. Read the gate as the live bot calls it, `strategies/perp-maker/src/index.ts:78-93`:
   ```ts
   const live = process.env.DRY_RUN === "false";
   const ctx = createExchange({ withSigner: live });
   …
   const link = await tradingKeyCheck(ctx, market);
   if (link.message) console.log(link.message);
   if (!link.ok && live) process.exit(1);
   ```
2. Read what the gate returns when no trading key was loaded, `packages/perp-core/src/exchange.ts:92-98`:
   ```ts
   export async function tradingKeyCheck(ctx: PerpContext, market: PerpMarket): Promise<{ ok: boolean; message?: string }> {
     const key = ctx.tradingKey;
     if (!key) {
       return ctx.config.owner
         ? { ok: true, message: `watching ${ctx.config.owner} read-only: set PRIVATE_KEY to the bot key linked to it to trade` }
         : { ok: true };
     }
   ```
3. Note what `createExchange({ withSigner: true })` actually enforces, `packages/perp-core/src/exchange.ts:45` — only that a private key string exists, never that a trading key was derived:

## Expected
In live mode the bot either has a trading key or stops. A precondition check named for the link state should report the missing signer as a failure, and a quote loop that cannot sign should not keep running.

## Actual
`tradingKeyCheck` returns `{ ok: true }` whenever `ctx.tradingKey` is undefined, which is exactly the case the caller is trying to detect. `!link.ok` is therefore always false, `process.exit(1)` is unreachable, and the live path continues on a read-only context.

The guard is not vacuous by accident — it covers a real setup. `createExchange` in owner mode (`exchange.ts:58-69`) builds `new SomniaMarkets({ … account: config.owner })` with a comment stating the intent plainly: the SDK "cannot send anything" for a bare address; writes go through `tradingKey`. Setting `DRY_RUN=false` plus an `OWNER_ADDRESS` and no `PRIVATE_KEY` is the documented read-only arrangement, and it passes the live-mode gate.

Downstream, `perp-core/src/orders.ts:176` has no signer check of its own — it dispatches `ctx.tradingKey ? placeFor(...) : ctx.exchange.trader.placePerpOrder(order)` and treats anything other than the two named "ordinary outcome" errors as a throw. So a live maker either places through the account at `perp-core/src/orders.ts:165` — `if (ctx.config.dryRun)`, which is false once `DRY_RUN=false` — or the run becomes a per-cycle failing loop. The consequence of the specific branch is unverified here; what is verified is that the gate built to stop it cannot fire.

## Evidence
```ts
// strategies/perp-maker/src/index.ts:79
  const live = process.env.DRY_RUN === "false";
// :80
  const ctx = createExchange({ withSigner: live });
// :91-93
    const link = await tradingKeyCheck(ctx, market);
    if (link.message) console.log(link.message);
    if (!link.ok && live) process.exit(1);

// packages/perp-core/src/exchange.ts:94-98
  if (!key) {
    return ctx.config.owner
      ? { ok: true, message: `watching ${ctx.config.owner} read-only: set PRIVATE_KEY to the bot key linked to it to trade` }
      : { ok: true };
  }

// packages/perp-core/src/exchange.ts:45-49  — withSigner checks only for a string
  if (opts.withSigner && !config.privateKey) {
    throw new Error(
      "PRIVATE_KEY is required for trading. Set it in .env, or run with DRY_RUN=true to log intended orders instead.",
    );
  }
```

Note the related gap in the same message: `linkProblem` (`packages/perp-core/src/operator.ts:128-133`) reports on `place`, `cancel` and `reduce`, but only returns `undefined` — "linked" — when `place` and `cancel` are both set, so a key missing only `reduce` is reported as a problem while the message names `reduce` alone.

## Environment
- SDK: n/a (raw HTTP/JSON-RPC, no SDK used)
- Wallet: n/a — no wallet, no signature, no transaction broadcast
- Network: n/a — offline evaluation of shipped source, no RPC and no endpoint contacted
2026-10-21 (UTC). Read-only source inspection of `@dreamdex-bot-kit/perp-core@0.1.0` and `perp-maker@0.1.0`. No key, no RPC call, no order placed. The reachability of `process.exit(1)` is shown statically: `tradingKeyCheck` has no return path producing `ok: false` when `ctx.tradingKey` is undefined, and none of the three `!key` branches sets it.
