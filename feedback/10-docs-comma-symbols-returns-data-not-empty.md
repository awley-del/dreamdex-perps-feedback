# Market Data docs show comma-separated symbols returning [], live API parses both symbols (200 with data)
Severity: normal
Area: docs

## Steps to reproduce
1. Read the Market Data docs page: the example marks `curl "$BASE_URL/orderbooks?symbols=SOMI:USDso,WETH:USDso"` as "Wrong — parsed as one literal symbol ... which matches no market and is silently skipped, so the response is []".
2. Run the "Wrong" example against testnet: `curl 'https://api.testnet.dreamdex.io/v0/orderbooks?symbols=WBTC:USDso,WETH:USDso'`

## Expected
Per the docs: HTTP 200 with `[]` (single literal symbol, skipped).

## Actual
HTTP 200 `{"orderbooks":[{"symbol":"WBTC:USDso",...},{"symbol":"WETH:USDso",...}]}` — BOTH symbols parsed correctly. The docs' "Wrong" example is actually handled correctly by the server, and the documented `[]` never happens. Developers who trust the page will "fix" working code and avoid a perfectly valid query form. (On the staging host the same request 400s, so the two documented testnet surfaces disagree with each other as well.)

## Evidence
evidence/reval-20261019/docs/ob_comma.body (200, both books) + fresh re-run 10:31 UTC returning `orderbooks` length 2; stg comparison evidence/reval-20261019/docs/stg_ob_comma.body (400); docs capture evidence/reval-20261019/docs/developers_http-api_market-data.txt.

## Environment
- SDK: curl 8.5.0 / python requests.
- Network: Somnia Tokyo testnet, `https://api.testnet.dreamdex.io/v0`.
- Wallet: n/a (unauthenticated GET).
- Evidence date: 2026-10-19 10:30-10:50 UTC.
