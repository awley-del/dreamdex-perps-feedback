# Unauthenticated /metrics on api.testnet.dreamdex.io exposes internal route table and traffic stats
Severity: normal
Area: API

## Steps to reproduce
1. `curl -i 'https://api.testnet.dreamdex.io/metrics'`

## Expected
`/metrics` not reachable from the public internet (internal listener or auth only).

## Actual
`200 text/plain` Prometheus exposition of 128331 bytes served to anyone: `operation="..."` labels for the full internal route table (35 operations incl. `/v0/account/margin/deposit`, `/v0/markets/{symbol}/builder/approve`, `/v0/markets/{symbol}/vault/withdraw`, `/v0/auth/login`, `/v0/ws`, plus `/readyz`, `/healthz`, `/metrics`, `/docs/ws`, `/*`) and per-route traffic statistics (rates, latencies, error rates of live testnet usage).

## Evidence
Raw scrape: evidence/reval-20261019/F20_metrics.txt; auth matrix: evidence/reval-20261019/F20_v0_matrix.json; public spec: `https://api.testnet.dreamdex.io/.well-known/oapi.json`

## Environment
Network: Somnia Tokyo testnet (chainId 50312). SDK: n/a (raw HTTP). Wallet: n/a.
Evidence date: 2026-10-19 09:47-09:52 UTC
