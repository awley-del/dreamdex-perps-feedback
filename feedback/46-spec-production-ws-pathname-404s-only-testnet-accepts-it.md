# The spec's declared production WebSocket pathname 404s on production and staging while testnet accepts it, so spec-generated clients connect only on testnet

Severity: major
Area: API

## Steps to reproduce
1. Fetch both published specs and read the production server block:
   - `curl -s https://api.testnet.dreamdex.io/.well-known/async.json` → `servers.production = {host: api.dreamdex.io, pathname: /v0/ws, protocol: wss}`
   - `curl -s https://api.dreamdex.io/.well-known/async.json` → same `servers.production = {host: api.dreamdex.io, pathname: /v0/ws}`
2. Build the URL the spec describes — host plus pathname, which is what any generated client does — and upgrade one WebSocket to it: `wss://api.dreamdex.io/v0/ws`.
3. Repeat on `wss://stg.api.dreamdex.io/v0/ws` and on `wss://api.testnet.dreamdex.io/v0/ws`.
4. As a control, upgrade the same three hosts on `…/v0/ws/public` (the path the HTTP docs and the bot kit use).
5. Each probe sends `{"operation":"ping"}` and reads one frame back.

## Expected
The pathname the machine-readable spec advertises for production resolves to the production feed, the same way it does on testnet. AsyncAPI 3 puts the channel address (`channels.public.address = /public`) on top of the server pathname, so a spec consumer computing `host + pathname` should reach a live socket, and a spec that requires the extra `/public` segment should say so.

## Actual
The spec path is live on testnet and dead on the other two hosts, 3 probe runs out of 3 on 2026-10-20:

```
run1 | api.dreamdex.io: /v0/ws=404 /v0/ws/public=OK | stg.api.dreamdex.io: /v0/ws=404 /v0/ws/public=OK | api.testnet.dreamdex.io: /v0/ws=OK /v0/ws/public=OK
run2 | api.dreamdex.io: /v0/ws=404 /v0/ws/public=OK | stg.api.dreamdex.io: /v0/ws=404 /v0/ws/public=OK | api.testnet.dreamdex.io: /v0/ws=OK /v0/ws/public=OK
run3 | api.dreamdex.io: /v0/ws=404 /v0/ws/public=OK | stg.api.dreamdex.io: /v0/ws=404 /v0/ws/public=OK | api.testnet.dreamdex.io: /v0/ws=OK /v0/ws/public=OK
```

Production rejects the upgrade with a plain-text 404 from the front end, not a protocol error frame, so a client cannot tell the endpoint exists at all. Testnet accepting both shapes hides this during development: a builder who follows the spec against testnet gets a working socket, and the same code fails against production with a 404 on the very first connection.

This extends the earlier path-shapes report (feedback/30), which compared `/v0/ws`, `/v0/ws/public` and the trailing-slash variant on testnet only. The per-environment split is the part that costs a builder a debugging cycle: the spec path is the correct one on testnet and the wrong one on production.

## Evidence
```
spec servers (both spec files) : wss api.dreamdex.io  pathname=/v0/ws
probe api.dreamdex.io/v0/ws           -> HTTP 404 (3/3)
probe api.dreamdex.io/v0/ws/public    -> {"operation":"pong","serverTimestamp":…}
probe stg.api.dreamdex.io/v0/ws       -> HTTP 404 (3/3)
probe stg.api.dreamdex.io/v0/ws/public-> {"operation":"pong","serverTimestamp":…}
probe api.testnet.dreamdex.io/v0/ws   -> {"operation":"pong","serverTimestamp":…} (3/3)
```
Probe script and raw JSON: `ws_paths.py`, `ws_matrix_prod_vs_testnet_20261020.json`.

## Environment
- SDK: n/a (raw HTTP/JSON-RPC, no SDK used)
- Wallet: n/a — no wallet, no signature, no transaction broadcast
- Network: Somnia Tokyo testnet, HTTP/WebSocket deployment on chainId 50312 (no chain RPC call in this item)
2026-10-20 (UTC):
- Specs: `https://api.testnet.dreamdex.io/.well-known/async.json` (sha256 d74f2c0a…, 62,793 bytes), `https://api.dreamdex.io/.well-known/async.json` (sha256 04778aa3…, 41,094 bytes)
- Hosts probed: api.dreamdex.io, stg.api.dreamdex.io, api.testnet.dreamdex.io
- Only read-only frames were sent (`ping`, and `subscribe` on public market data); no auth token, no order, no state change.
