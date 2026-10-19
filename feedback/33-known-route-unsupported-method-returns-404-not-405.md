# Known routes answer unsupported HTTP methods with 404 bad_request instead of 405

Severity: normal
Area: API

## Steps to reproduce
```
PUT /v0/orders          -> 404  {"status":404,"name":"bad_request"}
PUT /v0/account/margin/deposit -> 404 (same shape)
PATCH to read-only GET routes -> 404 bad_request
```
Fresh 2026-10-19 13:24 UTC; the same shape repeated across two fuzz runs (12:25, 12:29 UTC).

## Expected
A route that exists but does not implement the method returns `405 Method Not Allowed` (usually with `Allow`), so HTTP tooling, caches and clients can tell "wrong method" from "wrong URL".

## Actual
Wrong-method requests are indistinguishable from unknown URLs: `404` with the undocumented name `bad_request`. Frameworks and API clients misclassify the endpoint as nonexistent (e.g. feature detection by probing methods always concludes the route is missing).

## Evidence
```
PUT /v0/orders -> HTTP 404 body {"status":404,"name":"bad_request"}
```

## Environment
Testnet 2026-10-19 (UTC):
- API: https://api.testnet.dreamdex.io (chain 50312)
- Auth: fresh SIWE bearer minted for this test
- Re-run: every step is a plain curl
