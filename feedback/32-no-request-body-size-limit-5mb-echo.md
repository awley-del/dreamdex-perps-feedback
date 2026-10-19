# Order endpoints accept a 5MB JSON body, answer 500 instead of 413, and echo ~10MB back

Severity: normal
Area: API

## Steps to reproduce
```
PATCH /v0/markets/WBTC:USDso/orders/1/reduce
Content-Type: application/json
{"newQuantityRemaining":"<1 followed by 5,000,000 ones>"}
```
Response: `500 internal_error`, response body **10,000,431 bytes** (the offending number is echoed back inside the error description). No `413 Payload Too Large` at any tested size (their runs: 1MB, 5MB; fresh run 13:37 UTC: 5MB).

## Expected
Request bodies above a sane cap are rejected with `413` before parsing, and error messages do not mirror multi-megabyte attacker input back to the client.

## Actual
The full 5MB body is accepted and parsed, fails as an unhandled `500`, and the error response is twice the request size (10MB echo) — an amplification vector (1 request → 10MB response) plus a missing standard size guard.

## Evidence
```
fresh run 13:37 UTC: status 500, error-name internal_error, response bytes 10000431
lane runs 12:26/12:29 UTC: 1MB and 5MB bodies, same 500, never 413
```

## Environment
Testnet 2026-10-19 (UTC):
- API: https://api.testnet.dreamdex.io (chain 50312)
- Auth: fresh SIWE bearer minted for this test
- Re-run: every step is a plain curl
