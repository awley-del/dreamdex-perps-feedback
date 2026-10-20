# builder/approve encodes any max fee the caller asks for, including values above the pool cap, producing a transaction the pool always reverts

Severity: normal
Area: API

## Steps to reproduce
1. Read the pool's own ceiling on-chain: `eth_call getMaxBuilderFeeBpsTimes1k()` on `0x440f5a79857cd632ae45439410969c3f4049cc41` (ADA:USDso) -> `10000`.
2. Confirm the API agrees: `GET /v0/markets/ADA:USDso/builder/max-fee` -> `{"maxFeeBpsTimes1k":10000}`.
3. Prepare an approval asking for exactly the cap: `POST /v0/markets/ADA:USDso/builder/approve` with `{"builder":"<wallet>","maxFeeBpsTimes1k":10000}`.
4. Prepare the same call asking for one unit above the cap: `maxFeeBpsTimes1k: 10001`, then `100000`, then `1000000000`.

## Expected
The prepare step either clamps the requested value to the pool ceiling, or rejects it, since the contract cannot accept anything above it. `BuilderFeeExceedsCap()` is a shipped custom error, so the ceiling is enforced by design.

## Actual
Every request returns `200` with calldata encoding the requested value verbatim:

| requested | HTTP | encoded in calldata | eth_call result |
|---|---|---|---|
| 10000 | 200 | 10000 | OK |
| 10001 | 200 | 10001 | revert `BuilderFeeExceedsCap()` (0xf559e808) |
| 100000 | 200 | 100000 | revert `BuilderFeeExceedsCap()` |
| 1000000000 | 200 | 1000000000 | revert `BuilderFeeExceedsCap()` |

So the API hands a builder a transaction that can never succeed, with no local validation and no error until the wallet broadcasts it. The same happens on SOMI:USDso, whose cap is 100000: `100001`, `1000000` and `1000000000` are all encoded and all revert on-chain.

The affected surface is the whole approval path, because a builder that follows the documented flow has no way to learn the ceiling from the approve call itself: the field is typed `integer, minimum: 0` in the spec with no maximum, and the pool-specific ceiling is only reachable through a separate undocumented endpoint.

## Evidence
- `evidence/lane-new-20261020/approve_clamp.json` — requested vs encoded value per market, including the `-1` rejection which shows the only bound applied is `>= 0`.
- `evidence/lane-new-20261020/approve_chain.json` — `eth_call` of each prepared approval against the live pool: cap passes, one above the cap reverts with the cap error.
- `evidence/lane-new-20261020/final_builder.json` — on-chain `getMaxBuilderFeeBpsTimes1k()` = 10000, matching the API's own reported ceiling.
- Custom errors resolved from the shipped ABI: `BuilderFeeExceedsCap()` = `0xf559e808`.

## Environment
Chain: Somnia Tokyo testnet, chainId 50312, RPC `https://50312.rpc.thirdweb.com`. API `https://api.testnet.dreamdex.io/v0`. Pool `0x440f5a79857cd632ae45439410969c3f4049cc41`. Evidence date: 2026-10-20.
