# One WebSocket feed is published under three different path shapes and the spec's own path variant with a trailing slash 404s

Severity: normal
Area: docs

## Steps to reproduce
1. Fetch the machine-readable spec: `curl -s https://api.testnet.dreamdex.io/.well-known/async.json` → servers declare `wss://api.testnet.dreamdex.io` + `"pathname": "/v0/ws"` for testnet and production.
2. The HTTP docs and the bot kit use `wss://api.testnet.dreamdex.io/v0/ws/public` (kit: its default WS URL).
3. Test all three shapes (2026-10-19, 3 probe runs: ws_probe run1/runB/runC):
   - `/v0/ws` — upgrade accepted (the spec's declared path)
   - `/v0/ws/public` — upgrade accepted (the documented path)
   - `/v0/ws/` (spec path + trailing slash) — upgrade rejected with `HTTP 404`

## Expected
The spec's declared pathname and the documented pathname are the same path, or a helper normalizes them; a trailing slash does not hard-fail the endpoint the machine-readable spec advertises.

## Actual
The AsyncAPI spec publishes `/v0/ws`, the docs and kit publish `/v0/ws/public`, and `/v0/ws/` — the spec path as copied with a trailing slash — returns 404 on upgrade. Three surface shapes for one feed: generated clients from the spec and readers of the docs start from different URLs, and the slash variant of the spec's own path is dead.

## Evidence
```
async.json servers:  wss://api.testnet.dreamdex.io  pathname=/v0/ws
probe /v0/ws        → connected
probe /v0/ws/public → connected
probe /v0/ws/       → InvalidStatus: server rejected WebSocket connection: HTTP 404  (3/3 runs)
```

## Environment
Testnet 2026-10-19 (UTC):
- App: https://app.testnet.dreamdex.io
- API: https://api.testnet.dreamdex.io
- WebSocket: wss://api.testnet.dreamdex.io/v0/ws/public
- Bot kit: github.com/somnia-chain/dreamdex-bot-kit (cloned for this report)
