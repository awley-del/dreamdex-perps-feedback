# NUL byte in the URL path returns 400 with empty body and no Error-Name header, violating the documented JSON error contract
Severity: normal
Area: API

## Steps to reproduce
1. Docs, Error Handling: "All error responses use a consistent JSON format" (status/name/description) and "The Error-Name response header also contains the error name".
2. Run: `curl -i --path-as-is 'https://api.testnet.dreamdex.io/v0/markets/WBTC:USDso%00x'`
3. Repeat (two independent runs).

## Expected
HTTP 400 with the documented JSON envelope and the Error-Name header, like every other 4xx.

## Actual
`HTTP/2 400` with `content-length: 0`, NO content-type, NO Error-Name header, and no body at all — bare edge-server response (headers: via, date, alt-svc only). Reproduced twice on 19 Oct (plus a third time on the staging host by an earlier pass). JSON-parsing SDK clients crash on an empty body where the docs guarantee an envelope, and monitoring keyed on Error-Name sees nothing.

## Evidence
evidence/reval-20261019/sdk/repro-A.json, evidence/reval-20261019/sdk/stress-run1.jsonl (raw header captures, first occurrence), fresh re-run 10:37 UTC twice with identical empty 400 responses; docs capture evidence/reval-20261019/docs/developers_http-api_error-handling.txt.

## Environment
SDK: curl 8.5.0 (--path-as-is) / python requests. Network: Somnia Tokyo testnet, `https://api.testnet.dreamdex.io/v0`. Wallet: n/a (unauthenticated). Evidence date: 2026-10-19 10:30-10:50 UTC.
