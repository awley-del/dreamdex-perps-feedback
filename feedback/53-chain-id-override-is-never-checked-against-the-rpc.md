# CHAIN_ID is a free-form override with no range check and no cross-check against the RPC, so a typo signs against one chain while reading another

Severity: normal
Area: SDK

## Steps to reproduce
1. Read the config assembly, `packages/perp-core/src/config.ts:168`:
   ```ts
   chainId: Math.trunc(envNum("CHAIN_ID", ep.chainId)),
   ```
2. Note what is absent around it: `envNum` parses the string, `Math.trunc` drops any fraction, and nothing compares the result with the chain the configured `RPC_URL` actually serves. Nothing in the package calls `eth_chainId` at startup — a grep for `eth_chainId` and `getChainId` across `packages/perp-core/src/*.ts` returns no match.
3. Set `RPC_URL` to a Hideki endpoint and `CHAIN_ID` to `50312` (the Shannon value), or simply typo the digits, then start any strategy that writes.

## Expected
Either the chain id is derived from the endpoint, or an explicit override is validated once at startup — one `eth_chainId` call against the configured RPC, failing loudly on a mismatch. The two values are not independent: the chain id is what the signature covers, and the RPC is what the reads come from.

## Actual
The override is accepted verbatim and used for signing while every read continues to go to whatever endpoint `RPC_URL` names. The perps contracts exist only on one of the two testnets, so the failure this produces is not a clean revert at startup but a run that reads one chain and signs for another.

Two details make the mismatch hard to notice from the bot's own output. `Math.trunc` silently accepts a value the rest of the system will not accept — `50383.9` becomes `50383` rather than an error. And the override propagates into the SDK, whose internal consistency checks compare chain ids between nested objects (`src/writer.ts:509`, `src/syncStatus.ts:421`) rather than against the live endpoint, so a consistently wrong id passes all of them.

The version matters for severity: the shipped SDK resolves `0.30.0`, and the fail-open margin read plus this override ship together, so a bot can be pointed at the wrong chain and still be told its margin is healthy.

## Evidence
```ts
// packages/perp-core/src/config.ts:165-172
  return {
    network,
    chainId: Math.trunc(envNum("CHAIN_ID", ep.chainId)),
    rpcUrl: process.env.RPC_URL ?? ep.rpc,
    wsRpcUrl: process.env.WS_RPC_URL ?? ep.ws,
    indexerUrl: process.env.INDEXER_URL ?? ep.indexer,
```

```
$ grep -rn "eth_chainId\|getChainId" packages/perp-core/src/*.ts
(no match)
```

SDK-side consistency checks that do exist, and what they compare:

```
src/fillHistory.ts:81    if (history.version !== VERSION || history.chainId !== scope.chainId) return false;
src/syncStatus.ts:421    if (chainId !== source.chainId) throw new InvalidInputError("chainId must match the configured owner");
src/writer.ts:509        if (executor.chainId !== chain.id) {
```

Every one of them compares the configured id against another configured id. None of them asks the endpoint what chain it is serving.

## Environment
2026-10-21 (UTC). Read-only source inspection of `@dreamdex-bot-kit/perp-core@0.1.0` and `@somnia-chain/markets-sdk@0.30.0` / `0.32.1`. No transaction was signed and no wrong-chain run was executed; the finding is the missing validation at the point the override is accepted. Related and already reported separately: the testnet chain ids themselves (50383 for the perps contracts, 50312 shipped in the app) — this item is the bot-kit's failure to reconcile the two.
