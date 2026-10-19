# State-changing POST /api/sponsor/warm accepts unauthenticated calls without rate limiting
Severity: normal
Area: API

## Steps to reproduce
1. `curl -i -X POST 'https://app.testnet.dreamdex.io/api/sponsor/warm' -H 'Content-Type: application/json' -d '{}'` (GET returns 405, so POST is the mutating method).
2. Repeat 10 times back-to-back; observe status codes and timing.

## Expected
Authentication on the endpoint, or at minimum a rate limit on an unauthenticated state-changing route.

## Actual
Every call returns `204` empty body with no auth challenge; 10 sequential calls completed in 3.41 s, codes `[204 x10]` — no throttle, no backoff, no 429. The endpoint performs server-side sponsor warm-up driven purely by anonymous requests, so it can be amplified for free (resource burn / cache churn) by any party.

## Evidence
Burst: evidence/reval-20261019/probe_summary.json -> F10_burst10; single call: F10_warm_POST

## Environment
Network: Somnia Tokyo testnet (app.testnet.dreamdex.io, Vercel). SDK: n/a. Wallet: n/a (unauthenticated).
Evidence date: 2026-10-19 09:47-09:52 UTC
