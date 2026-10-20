# HTTP API base-URL table sends testnet developers to stg.api.dreamdex.io; the perps API host api.testnet.dreamdex.io is undocumented anywhere

Severity: normal
Area: docs

## Steps to reproduce
1. The HTTP API "Base URLs" table: Testnet (Somnia Shannon, chain 50312) REST base URL `https://stg.api.dreamdex.io/v0`, WS `wss://stg.api.dreamdex.io/v0/ws/public` (repeated in Quick Start). Grep the whole docs set for "api.testnet.dreamdex" -> zero matches.
2. The perps testnet API serves its own spec at `https://api.testnet.dreamdex.io/.well-known/oapi.json` (54 paths) — this is the host the app's own REST calls go to.
3. Compare: `https://stg.api.dreamdex.io/.well-known/oapi.json` (51 paths, servers list = api.dreamdex.io + stg.api.dreamdex.io) and `GET /v0/markets` on each host.

## Expected
The docs list the host that serves the perps surface — or make clear that the two hosts are different products, so a builder knows which one to point a perps client at.

## Actual
- The documented testnet host is a different deployment: its spec is a strict subset (missing /v0/markets/{symbol}, /v0/markets/{symbol}/event-positions/{address}, /v0/wallets/{wallet}/event-positions) and its market rows carry no chainId field, while the perps testnet spec has 54 paths and every market row has chainId 50312.
- Neither host is the perps chain. The perps developer page puts perps on Hideki, chain 50383 (`https://docs.dreamdex.io/developers/perps-testnet`: RPC api.hideki2.infra.testnet.somnia.network, factory 0xE631fAEE547baeE07353E290f0562ea67d856560), while both HTTP hosts above serve chainId 50312 rows. So the base-URL table documents a third surface (stg, 50312), the perps host is undocumented, and nothing in the docs maps 50312 REST rows to the 50383 chain a perps client actually trades on.

## Evidence
`/tmp/dddocs/developers_http-api*.txt` (docs capture, base-URL table), `stg.api.dreamdex.io/.well-known/oapi.json` vs `api.testnet.dreamdex.io/.well-known/oapi.json` (51 vs 54 paths, servers), `GET /v0/markets` on both hosts (rows carry chainId 50312), `https://docs.dreamdex.io/developers/perps-testnet` (Hideki 50383 block), and `eth_chainId` on both RPCs: `0xc4cf` (50383) vs `0xc488` (50312).

## Environment
Network: docs + unauthenticated GETs, 2026-10-20. Wallet: n/a.
