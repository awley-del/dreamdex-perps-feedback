# 404 envelopes use an undocumented error name and skip the Error-Name header the docs promise

Severity: normal
Area: API

## Steps to reproduce
1. Unknown route:
```
GET /v0/definitely-not-a-route
-> 404 {"status":404,"name":"bad_request"}
   (response has NO `error-name` header)
```
2. Wrong method on a known route: `PUT /v0/orders` -> same `404 bad_request`, no `error-name` header.
3. Compare with the docs (HTTP API → Error handling):
   - `Not Found (404)` documents exactly two names: `market_not_found`, `order_not_found`.
   - `bad_request` appears nowhere in the error tables.
   - The page states: "The `Error-Name` response header also contains the error name for quick inspection without parsing the body."
Fresh 2026-10-19 13:24-13:41 UTC; both shapes also seen in two fuzz runs (12:25, 12:29 UTC).

## Expected
Unknown routes use a documented 404 name (or a documented generic one), and every error response carries the `Error-Name` header as documented.

## Actual
Unknown-route 404s return the undocumented name `bad_request` and omit the header entirely. Header-based error handling — the exact use the docs advertise — silently fails for the whole 404-unknown family, and `bad_request` is absent from every error table.

## Evidence
```
GET /v0/definitely-not-a-route
status 404, body name=bad_request, header error-name=absent
docs 404 section: market_not_found | order_not_found   (no bad_request)
```
Re-run 2026-10-20 15:45 UTC — the header mechanism itself still works, so this is an omission on one family, not a removed feature:
```
GET /v0/definitely-not-a-route    -> 404 {"status":404,"name":"bad_request"}      error-name: ABSENT
PUT /v0/orders                    -> 404 {"status":404,"name":"bad_request"}      error-name: ABSENT
GET /v0/markets/NOPE:USDso        -> 404 {"status":404,"name":"market_not_found"} error-name: market_not_found
```
So a client that reads `Error-Name` as documented gets an answer for a known-symbol miss and nothing at all for any unknown path.

## Environment
- SDK: n/a (raw HTTP/JSON-RPC, no SDK used)
- Network: Auth: fresh SIWE bearer minted for this test
- Wallet: n/a — no wallet, no signature, no transaction broadcast
- Somnia Tokyo testnet — REST API deployment on chain 50312 (`https://api.testnet.dreamdex.io`). Tested 2026-10-19, re-run 2026-10-20 15:45 UTC.
- Re-run: every step is a plain curl
