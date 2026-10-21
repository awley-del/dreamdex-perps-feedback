# The margin status reader falls back to "Healthy" for any value outside 0-3, so an unreadable status is reported as the safest one

Severity: normal
Area: SDK

## Steps to reproduce
1. Read the two places the SDK materialises a margin status, `@somnia-chain/markets-sdk@0.32.1`:
   ```ts
   // src/perp/margin.ts:99
   marginStatus: MARGIN_STATUS[Number(statusRaw)] ?? "Healthy",
   // src/perp/margin.ts:213
   return { equity, imReq, mmReq, cmReq, marginStatus: MARGIN_STATUS[Number(statusRaw)] ?? "Healthy" };
   ```
2. Read the table it indexes, `src/perp/margin.ts:29-36`:
   ```ts
   export type MarginStatus = "Healthy" | "MarginCall" | "PartialLiquidation" | "CloseOut";
   // Ordered so index == on-chain enum value (0 Healthy … 3 CloseOut).
   export const MARGIN_STATUS: readonly MarginStatus[] = ["Healthy", "MarginCall", "PartialLiquidation", "CloseOut"];
   ```
3. Note that `MARGIN_STATUS` has four entries, so any `statusRaw` other than `0`, `1`, `2`, `3` yields `undefined` and takes the `?? "Healthy"` branch.
4. The same expression ships in the older SDK that the bot-kit installs: `@somnia-chain/markets-sdk@0.30.0`, `src/perp/margin.ts:91` and `:133`.

## Expected
An unknown or out-of-range enum value is not a healthy account. A reader that cannot classify the status should surface that it could not — throw, or return an explicit `"Unknown"` — rather than answer with the one value that tells a risk check to do nothing.

## Actual
Both readers answer `"Healthy"` for every unrecognised input. Because the value is typed as the four-member union, a caller has no way to distinguish "the chain said 0" from "the chain said something this build does not know", and the documented semantics make that distinction load-bearing: `"Healthy"` (equity ≥ IM) is what suppresses margin calls and close-outs in a strategy loop.

The version spread matters for triage: this is not a regression introduced in the newest release — the identical fallback is present in `0.30.0`, the version the shipped bot-kit resolves from its own lockfile, so a fix needs to land in both.

## Evidence
```
/tmp/ddsdk/node_modules/@somnia-chain/markets-sdk   version 0.32.1
  24: *  `"Healthy"` (equity ≥ IM) · `"MarginCall"` (IM > equity ≥ MM) ·
  29: export type MarginStatus = "Healthy" | "MarginCall" | "PartialLiquidation" | "CloseOut";
  36: export const MARGIN_STATUS: readonly MarginStatus[] = ["Healthy", "MarginCall", "PartialLiquidation", "CloseOut"];
  99:     marginStatus: MARGIN_STATUS[Number(statusRaw)] ?? "Healthy",
 213:   return { equity, imReq, mmReq, cmReq, marginStatus: MARGIN_STATUS[Number(statusRaw)] ?? "Healthy" };

hunts/dreamdex/recon/botkit/node_modules/@somnia-chain/markets-sdk   version 0.30.0
  34: export const MARGIN_STATUS: readonly MarginStatus[] = ["Healthy", "MarginCall", "PartialLiquidation", "CloseOut"];
  91:     marginStatus: MARGIN_STATUS[Number(statusRaw)] ?? "Healthy",
 133:   return { equity, imReq, mmReq, cmReq, marginStatus: MARGIN_STATUS[Number(statusRaw)] ?? "Healthy" };
```

Related, same reader: `src/perp/margin.ts` reports `asOfBlock` alongside the status in the `0.32.1` shape (`:100`), but the account-level read at `:213` returns the same fields without pinning a block, so two consumers of "margin status" can be looking at different chain heights.

## Environment
2026-10-21 (UTC). Static inspection of `@somnia-chain/markets-sdk` `0.32.1` and `0.30.0` as installed, no RPC call and no fabricated chain state. The claim is the shape of the fallback for values outside `0-3`; it does not assert that any live pool currently emits such a value, and no such value was observed on-chain.
