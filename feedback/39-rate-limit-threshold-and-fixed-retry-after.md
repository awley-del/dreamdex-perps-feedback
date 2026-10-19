# Rate limiting only trips after high-RPS bursts and every 429 advertises Retry-After: 1

Severity: normal
Area: API

## Steps to reproduce
Rate-limit headers exist (`x-ratelimit-limit`: login 40, public 200, authed 400) but the limiter only engages under sustained bursts:
1. `login_burst`: 916 requests / 9.05s (~101 RPS) -> 589 x 429, `x-ratelimit-remaining` reaches 0, `Retry-After: 1` on every 429.
2. `public_burst`: 1243 requests / 7.1s (~175 RPS) -> 104 x 429, same fixed `Retry-After: 1`.
3. Moderate load sails through: 400 concurrent public GETs at ~12 RPS -> 400/400 `200`, no throttling; a fresh 300-request burst at ~48 RPS (13:40 UTC) -> 300/400 `200`.
Evidence: burst-summary-run1.json, rate-summary-run1/2.json (two full rate runs, 1065 requests each), fresh burst 13:40 UTC.

## Expected
429 responses carry a `Retry-After` that reflects the window (or backoff guidance), and the advertised limit (`200/min` style) matches when enforcement actually starts.

## Actual
Up to ~175 RPS passes with zero throttling despite `x-ratelimit-limit: 200`, then enforcement snaps on and every 429 says `Retry-After: 1` regardless of remaining window — clients either under-utilize (trusting the header blindly) or hammer (since honest load never trips it). Integrators cannot calibrate backpressure from the documented headers alone.

## Evidence
```
login burst   101 RPS -> 589/916 = 429, Retry-After: 1
public burst  175 RPS -> 104/1243 = 429, Retry-After: 1
12 RPS / 48 RPS fresh -> 0 x 429
```

## Environment
Testnet 2026-10-19 (UTC):
- API: https://api.testnet.dreamdex.io (chain 50312)
- Auth: fresh SIWE bearer minted for this test
- Re-run: every step is a plain curl
