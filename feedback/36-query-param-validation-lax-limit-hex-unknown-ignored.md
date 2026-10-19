# Query parameter validation is lax: limit accepts non-integer syntax and unknown/negative params are silently ignored

Severity: normal
Area: API

## Steps to reproduce
The OpenAPI spec defines `limit` as `{"type":"integer","minimum":1,"maximum":1000,"default":100}`.

1. Non-integer values accepted:
```
GET /v0/markets?limit=0x10   -> 200 (hex literal accepted)
GET /v0/markets?limit=1e3    -> 200 (exponent notation accepted)
GET /v0/markets?limit=+1     -> 200 (plus prefix accepted)
```
2. Unknown/out-of-range params accepted and ignored with no feedback:
```
GET /v0/markets?offset=-1&page=-1&limit[]=1   -> 200, default page, no warning
```
Fresh 2026-10-19 13:24 UTC; the same behaviors appeared twice in the fuzz runs (12:26, 12:29 UTC).

## Expected
Parameter parsing matches the published schema: non-integer `limit` is `400 invalid_param`, unknown or out-of-range parameters produce a validation error instead of disappearing.

## Actual
`0x10`, `1e3` and `+1` are coerced as integers, and negative/array-form parameters are dropped silently — clients get a 200 for requests the spec says are invalid, so pagination bugs and misconstructed URLs fail silently instead of surfacing.

## Evidence
```
spec:  "type":"integer","minimum":1,"maximum":1000,"default":100
live:  limit=0x10 / 1e3 / +1 / offset=-1 / page=-1 / limit[]=1  -> 200
```

## Environment
Testnet 2026-10-19 (UTC):
- API: https://api.testnet.dreamdex.io (chain 50312)
- Auth: fresh SIWE bearer minted for this test
- Re-run: every step is a plain curl
