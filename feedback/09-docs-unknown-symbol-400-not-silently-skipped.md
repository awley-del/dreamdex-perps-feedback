# Market Data docs promise unknown symbols are silently skipped (empty []), live API returns 400 invalid_param
Severity: normal
Area: docs

## Steps to reproduce
1. Read the Market Data docs page: "Unknown or malformed symbols are silently skipped rather than erroring, so a serialization mismatch shows up as an empty [] rather than a 4xx."
2. Run: `curl 'https://api.testnet.dreamdex.io/v0/orderbooks?symbols=NOPE:USDso'`
3. Repeat on tickers: `curl 'https://api.testnet.dreamdex.io/v0/tickers?symbols=NOPE:USDso'`

## Expected
Per the docs: HTTP 200 with an empty array — the unknown symbol is skipped.

## Actual
HTTP 400 `{"status":400,"name":"invalid_param","description":"unknown market symbols: NOPE:USDso","context":{"invalid_symbols":["NOPE:USDso"]}}` on both endpoints. The behavior is fine on its own (strict validation is defensible), but the documented behavior is the opposite of what ships, so every developer following the page writes skip-and-continue handling that their client never receives — their serialization-mismatch diagnosis flow (check for `[]`) silently breaks.

## Evidence
evidence/reval-20261019/docs/ob_unknown.body + ob_unknown.hdr (fresh 10:30 UTC re-run returned the same 400 body quoted above); docs capture evidence/reval-20261019/docs/developers_http-api_market-data.txt (contains both quoted passages).

## Environment
- SDK: curl 8.5.0 / any HTTP client.
- Network: Somnia Tokyo testnet, `https://api.testnet.dreamdex.io/v0`.
- Wallet: n/a (unauthenticated GET).
- Evidence date: 2026-10-19 10:30-10:50 UTC.
