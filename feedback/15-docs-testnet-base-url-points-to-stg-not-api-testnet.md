# HTTP API base-URL table sends testnet developers to stg.api.dreamdex.io while the perps testnet host api.testnet.dreamdex.io is undocumented anywhere
Severity: normal
Area: docs

## Steps to reproduce
1. The HTTP API "Base URLs" table: Testnet (Somnia Shannon, chain 50312) REST base URL `https://stg.api.dreamdex.io/v0`, WS `wss://stg.api.dreamdex.io/v0/ws/public` (repeated in Quick Start). Grep the whole docs set for "api.testnet.dreamdex" -> zero matches.
2. The perps testnet API this program targets serves its own spec at `https://api.testnet.dreamdex.io/.well-known/oapi.json` (54 paths).
3. Compare: `https://stg.api.dreamdex.io/.well-known/oapi.json` (51 paths, servers list = api.dreamdex.io + stg.api.dreamdex.io) and `GET /v0/markets` on each host.

## Expected
Docs list the host the perps testnet API actually runs on, with one spec per environment.

## Actual
- The documented testnet host is a different deployment: its spec is a strict subset (missing /v0/markets/{symbol}, /v0/markets/{symbol}/event-positions/{address}, /v0/wallets/{wallet}/event-positions) and its market rows carry no chainId field, while the live perps testnet spec has 54 paths and every market row has chainId 50312.
- Developers building on this bounty (whose app, spec and login chainId all live on api.testnet.dreamdex.io) cannot find that host in the docs at all; those who follow the table end up on an API without the perps/event endpoints and without chain identification.

## Evidence
evidence/reval-20261019/docs/stg_wellknown.json vs evidence/reval-20261019/docs/oapi.json (51 vs 54 paths, servers), evidence/reval-20261019/docs/http-api.txt (base-URL table quote), zero-match grep for api.testnet across all captured docs (this lane's *.txt captures), markets comparison in evidence/reval-20261019/sdk/stg-probe.json.

## Environment
SDK: curl 8.5.0. Network: Somnia Tokyo testnet (50312) vs documented stg host. Wallet: n/a (unauthenticated GET). Evidence date: 2026-10-19 10:30-10:50 UTC.
