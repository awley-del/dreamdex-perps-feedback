# Numeric input overflows return 500/503 that leak internal library versions, package names and RPC method names

Severity: major
Area: API

## Steps to reproduce
With a valid bearer token:

1. Body field overflow (500 + viem version):
```
POST /v0/markets/SOMI:USDso/orders
{"type":"market","side":"buy","amount":"1","expiresAt":253402300799000}
```
Response: `500 internal_error` — `Number "253402300799000000000" is not in safe 64-bit unsigned integer range ... Version: viem@2.55.19`

2. Same class on another endpoint (500 + viem version):
```
PATCH /v0/markets/WBTC:USDso/orders/999999999/reduce
{"newQuantityRemaining":"1111...(300 digits)"}
```
Response: `500 internal_error` — `Number ... is not in safe 256-bit unsigned integer range ... Version: viem@2.55.19`

3. Path parameter overflow (503 + internal SDK package and RPC method):
```
GET /v0/markets/WBTC:USDso/orders/999...999 (250 nines)
```
Response: `503 rpc_unavailable` — `@somnia-chain/markets-sdk: rpc readContract getOrder failed: Number ...`

Reproduced fresh 2026-10-19 13:24-13:41 UTC (each case also seen in two independent fuzz runs at 12:26-12:29 UTC).

## Expected
Out-of-range numeric input is rejected as `400 invalid_param` (or similar client error) with no internal details, per the documented 400 error family.

## Actual
Any crafted numeric string that overflows a 64/256-bit conversion becomes a `500/503` with the raw exception text in the response body, including the exact `viem` version, the internal package name `@somnia-chain/markets-sdk`, and the internal RPC call `readContract getOrder`. A single untrusted parameter turns into server-error noise plus a precise fingerprint of the backend stack for anyone probing the API.

## Evidence
```
500 internal_error  "Version: viem@2.55.19"
503 rpc_unavailable "@somnia-chain/markets-sdk: rpc readContract getOrder failed: ..."
```

## Environment
Testnet 2026-10-19 (UTC):
- API: https://api.testnet.dreamdex.io (chain 50312)
- Auth: fresh SIWE bearer minted for this test
- Re-run: every step is a plain curl
