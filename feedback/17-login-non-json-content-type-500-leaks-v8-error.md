# POST /v0/auth/login with a non-JSON Content-Type returns 500 internal_error and leaks a V8 exception string
Severity: normal
Area: API

## Steps to reproduce
1. Send the SIWE login endpoint a body whose Content-Type is not JSON:
   `curl -i -X POST 'https://api.testnet.dreamdex.io/v0/auth/login' -H 'Content-Type: text/plain' -d 'x'`
2. Repeat with `Content-Type: application/x-www-form-urlencoded` and with no Content-Type at all (three variants x two runs).
3. Control: same body with `Content-Type: application/json` -> 400.

## Expected
HTTP 400 `invalid_request_body` ("JSON body could not be parsed or fails schema validation") per the Error Handling table, since the body/schema is invalid either way.

## Actual
Six of six non-JSON-Content-Type requests return:
`500 {"status":500,"name":"internal_error","description":"Cannot read properties of undefined (reading 'split')","context":{"detail":"Cannot read properties of undefined (reading 'split')"}}`
The unauthenticated public auth endpoint 500s on a plain malformed request and echoes the engine-internal exception (undefined.split on the missing/unsupported Content-Type header) in the public error contract. The documented JSON-control path correctly returns 400.

## Evidence
Fresh runs 10:39 UTC, 2 runs x 3 variants, bodies as quoted (this lane's session capture), docs capture evidence/reval-20261019/docs/developers_http-api_error-handling.txt (invalid_request_body row + internal_error row), earlier one-off in evidence/reval-20261019/sdk/stress-run3.jsonl.

## Environment
- SDK: python requests 2.x / curl 8.5.0.
- Network: Somnia Tokyo testnet, `https://api.testnet.dreamdex.io/v0/auth/login`.
- Wallet: n/a (unauthenticated, request rejected before signature parsing).
- Evidence date: 2026-10-19 10:30-10:50 UTC.
