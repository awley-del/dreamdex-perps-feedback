# Duplicate JSON keys in an order request are accepted silently (last-key-wins) and produce calldata

Severity: normal
Area: API

## Steps to reproduce
```
PATCH /v0/markets/WBTC:USDso/orders/1/reduce
Content-Type: application/json
{"newQuantityRemaining":"1","newQuantityRemaining":"2"}
```
Response: `200` with transaction calldata — the duplicate is silently resolved last-key-wins (`"2"`), no ambiguity error. Fresh 2026-10-19 13:25 UTC; same acceptance in two fuzz runs (12:26, 12:29 UTC).

## Expected
A field that appears twice is ambiguous input: reject as `invalid_request_body` (RFC 7159 notes the behavior is undefined; APIs that move funds should not silently pick one value).

## Actual
The server silently uses the last occurrence and builds a ready-to-sign transaction from it. Any proxy, signer or logging layer that saw a different occurrence of the duplicated field ends up disagreeing with what the chain will execute, with no error at the API boundary.

## Evidence
```
{"newQuantityRemaining":"1","newQuantityRemaining":"2"} -> HTTP 200 + calldata
```

## Environment
- SDK: n/a (raw HTTP/JSON-RPC, no SDK used)
- Wallet: n/a — no wallet, no signature, no transaction broadcast
Testnet 2026-10-19 (UTC):
- API: https://api.testnet.dreamdex.io (chain 50312)
- Auth: fresh SIWE bearer minted for this test
- Re-run: every step is a plain curl
