# PATCH with no body and no Content-Type reports invalid_amount instead of invalid_request_body

Severity: normal
Area: API

## Steps to reproduce
```
PATCH /v0/markets/WBTC:USDso/orders/1/reduce      (no body, no Content-Type header)
-> 400 invalid_amount  "the amount is invalid for this market"

PATCH same URL, Content-Type: application/json, empty body
-> 400 invalid_request_body  "the request body is not valid JSON"
```
Both fresh 2026-10-19 13:24 UTC; the no-header variant also seen twice in the fuzz runs (12:26, 12:29 UTC).

## Expected
A missing/absent body is a body problem: `invalid_request_body` (as the second case already does), regardless of the Content-Type header's presence.

## Actual
Drop the Content-Type header and the identical failure is reported as `invalid_amount` — an amount error that points investigation at market limits instead of the request body. The wrong error name breaks the documented error-name semantics and client error handling.

## Evidence
```
no Content-Type + no body -> 400 invalid_amount
Content-Type json + empty -> 400 invalid_request_body
```

## Environment
Testnet 2026-10-19 (UTC):
- API: https://api.testnet.dreamdex.io (chain 50312)
- Auth: fresh SIWE bearer minted for this test
- Re-run: every step is a plain curl
