# Error Handling table documents error name invalid_interval, live API returns invalid_param for the same case
Severity: normal
Area: docs

## Steps to reproduce
1. Read the Error Handling docs page: the Validation (400) table lists `invalid_interval` — "Unsupported candle interval".
2. Run: `curl 'https://api.testnet.dreamdex.io/v0/markets/WBTC:USDso/candles?interval=99m'`

## Expected
HTTP 400 with `"name":"invalid_interval"` as documented.

## Actual
HTTP 400 with `"name":"invalid_param"` and a zod detail payload: `{"status":400,"name":"invalid_param","description":"interval: Invalid option: expected one of ...","context":{"detail":[{"code":"invalid_value",...}]}}`. `invalid_interval` never appears. Any client branching on the documented machine-readable name (the whole point of the table) never matches this case.

## Evidence
evidence/reval-20261019/docs/p_candles_bad_interval.body + .hdr, fresh re-run 10:31 UTC (identical), docs capture evidence/reval-20261019/docs/developers_http-api_error-handling.txt (table with invalid_interval).

## Environment
SDK: curl 8.5.0. Network: Somnia Tokyo testnet, `https://api.testnet.dreamdex.io/v0`. Wallet: n/a (unauthenticated GET). Evidence date: 2026-10-19 10:30-10:50 UTC.
