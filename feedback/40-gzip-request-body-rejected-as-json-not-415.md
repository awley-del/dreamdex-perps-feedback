# gzip-compressed request body is rejected as invalid JSON instead of 415 Unsupported Media Type

Severity: normal
Area: API

## Steps to reproduce
```
PATCH /v0/markets/WBTC:USDso/orders/1/reduce
Content-Type: application/json
Content-Encoding: gzip
<gzip of '{"newQuantityRemaining":"1"}'>
-> 400 invalid_request_body  "the request body is not valid JSON"
```
Fresh 2026-10-19 13:24 UTC; the same response twice in the fuzz runs (12:26, 12:29 UTC).

## Expected
`Content-Encoding` the server does not support is answered `415 Unsupported Media Type` (or the encoding is honored); the body is never judged "not valid JSON" while still compressed.

## Actual
The compressed body is treated as the JSON text itself, so clients that enable transport compression — which proxies commonly add — get a misleading `invalid_request_body` pointing at content that was never parsed. The wrong status/name misdirects debugging and breaks generic HTTP retry logic keyed on 415.

## Evidence
```
Content-Encoding: gzip + valid gzipped JSON -> 400 invalid_request_body
```

## Environment
Testnet 2026-10-19 (UTC):
- API: https://api.testnet.dreamdex.io (chain 50312)
- Auth: fresh SIWE bearer minted for this test
- Re-run: every step is a plain curl
