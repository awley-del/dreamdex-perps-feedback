# Cancel and reduce prepares return calldata for an order id that does not exist

Severity: normal
Area: API

## Steps to reproduce
1. Sign in with SIWE to obtain a bearer token (POST /v0/auth/login flow), then confirm it works: GET /v0/portfolio returns 200.
2. GET /v0/markets/ADA:USDso/orders/999999999999999 -> 404, name `order_not_found`, description "no order was found with that id".
3. DELETE /v0/markets/ADA:USDso/orders/999999999999999 (same bearer) -> 200 with transaction calldata.
4. PATCH /v0/markets/ADA:USDso/orders/999999999999999/reduce with body {"newQuantityRemaining":"1"} -> 200 with transaction calldata.
5. Repeat steps 2-4. Reproduced 4 times across two independent sessions on 19 October 2026 (two runs with one bearer, two runs with a freshly minted bearer from a fresh wallet).

## Expected
The mutating endpoints should validate order existence the same way GET does and answer 404 `order_not_found` (or 400), so clients never build a transaction for an order that is not on the book.

## Actual
DELETE and PATCH both answer 200 and return a ready-to-sign transaction for id `999999999999999`:
- DELETE -> {"to":"0x440f5a79857cd632ae45439410969c3f4049cc41","data":"0xdbc9139600000000000000000000000000000000000000000000000e34f05401ffff...", ...}
- PATCH reduce -> {"to":"0x440f5a79857cd632ae45439410969c3f4049cc41","data":"0x58b91c4200000000000000000000000000000000000000000000000e34f054010000...","chainId":"0xc488", ...}

The same id that GET resolves as not found is accepted by both mutating endpoints, so a client following the API can prepare, sign, and broadcast a cancel/reduce for an order that never existed.

## Evidence
Session A (19 Oct 2026, ~11:03 UTC):
- run1: GET=404 order_not_found | DELETE=200 | PATCH=200
- run2: GET=404 order_not_found | DELETE=200 | PATCH=200
Session B (19 Oct 2026, ~12:15 UTC, fresh wallet + fresh bearer):
- run1: GET=404 order_not_found | DELETE=200 | PATCH=200
- run2: GET=404 order_not_found | DELETE=200 | PATCH=200

Raw request/response captures kept alongside this file for each run.
On-chain verification, 19 October 2026 (~12:35 UTC), eth_call against https://50312.rpc.thirdweb.com on pool 0x440f5a79857cd632ae45439410969c3f4049cc41:
- DELETE calldata 0xdbc91396...038d7ea4c67fff -> execution reverted, data "0x8080c2ed" -> IncorrectOrder()
- PATCH reduce calldata 0x58b91c42... -> execution reverted, data "0x8080c2ed" -> IncorrectOrder()
So the API's 200 prepare is a guaranteed-failing transaction: the caller signs and broadcasts a revert.


On-chain check (read-only eth_call, no transaction): both prepared calldata payloads revert on the pool contract with the custom error `IncorrectOrder()` (selector 0x8080c2ed) — the "ready to sign" transaction the API returns can never succeed.

## Environment
- SDK: n/a (raw HTTP/JSON-RPC, no SDK used)
- API: https://api.testnet.dreamdex.io (v0), 19 October 2026
- Network: Somnia Tokyo testnet, chainId 50312 (calldata chainId field `0xc488`)
- Auth: bearer from SIWE login, own fresh testnet wallet
