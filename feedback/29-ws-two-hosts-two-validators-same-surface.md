# Same malformed WebSocket frame returns two different validator messages on the two hosts the kit and docs call "testnet"

Severity: normal
Area: API

## Steps to reproduce
Open one WebSocket to each host, send the identical malformed frame `{"type":"subscribe","channel":"orderbook","symbol":"WETH:USDso"}`, read the first frame back:
1. `wss://stg.api.dreamdex.io/v0/ws/public` (the URL the bot kit uses as its testnet default)
   → `{"type":"error","errorName":"invalid_request","message":"missing operation field"}`
2. `wss://api.testnet.dreamdex.io/v0/ws/public` (the documented testnet host)
   → `{"type":"error","errorName":"invalid_request","message":"operation field must be a non-empty string"}`
Reproduced 3 times each (2026-10-19 12:4x and 13:0x UTC; identical results for frames `{"op":...}` and `{"type":"ping"}`; evidence ws_probe_run1/runB/runC).

## Expected
Both "testnet" entry points run the same validator build, or the kit/docs point at a single canonical host — one surface, one contract.

## Actual
Two hosts presented as the testnet feed answer the exact same malformed frame with different validator strings, showing two different builds behind the same published surface. Clients that branch on message text (retry logic, error mapping) behave differently depending on which host they reach, and neither message matches the other.

## Evidence
```
stg.api.dreamdex.io      → "missing operation field"
api.testnet.dreamdex.io  → "operation field must be a non-empty string"
run1 / runB / runC       → byte-identical per host, all 3 runs
```

## Environment
- SDK: n/a (raw HTTP/JSON-RPC, no SDK used)
- Wallet: n/a — no wallet, no signature, no transaction broadcast
Testnet 2026-10-19 (UTC):
- App: https://app.testnet.dreamdex.io
- API: https://api.testnet.dreamdex.io
- WebSocket: wss://api.testnet.dreamdex.io/v0/ws/public
- Bot kit: github.com/somnia-chain/dreamdex-bot-kit (cloned for this report)
