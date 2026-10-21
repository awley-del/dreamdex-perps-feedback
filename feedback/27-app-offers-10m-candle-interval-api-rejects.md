# App ships a 10m candle interval option that the candles endpoint and its own OpenAPI spec reject

Severity: normal
Area: app

## Steps to reproduce
1. Inspect the deployed app bundle: chunk `421juu4xl1rw5.js` (app.testnet.dreamdex.io) defines `EventInterval.TenMinutes` and the interval label map includes `'10m'` as a selectable candle interval (lane evidence: app_env_key_contexts.json, bundle refs in kitapp-20261019).
2. Compare with the published spec: `GET https://api.testnet.dreamdex.io/.well-known/oapi.json` → path `/v0/markets/{symbol}/candles`, parameter `interval` enum = `["1m","5m","15m","1h","4h","1d"]` (no `10m`).
3. Call the endpoint with the advertised value:
   `curl -s 'https://api.testnet.dreamdex.io/v0/markets/WETH:USDso/candles?interval=10m'`
   Response: `400 invalid_param` — `interval: Invalid option: expected one of "1m"|"5m"|"15m"|"1h"|"4h"|"1d"` (reproduced twice, 13:0x UTC).

## Expected
Every interval option the app offers is accepted by the API, or the app only offers the intervals the API and spec define.

## Actual
The deployed bundle offers `10m` as a candle interval; the API (and its own OpenAPI spec) accept only `1m|5m|15m|1h|4h|1d`, so choosing `10m` in the UI makes the candles request fail with a 400 while the page shows no data.

## Evidence
```
bundle:  EventInterval.TenMinutes / '10m' label  (chunk 421juu4xl1rw5.js)
spec:    "enum": ["1m","5m","15m","1h","4h","1d"]
live:    HTTP 400 {"status":400,"name":"invalid_param",
         "description":"interval: Invalid option: expected one of \"1m\"|\"5m\"|\"15m\"|\"1h\"|\"4h\"|\"1d\""}
```

## Environment
- SDK: n/a (raw HTTP/JSON-RPC, no SDK used)
- Wallet: n/a — no wallet, no signature, no transaction broadcast
Testnet 2026-10-19 (UTC):
- App: https://app.testnet.dreamdex.io
- API: https://api.testnet.dreamdex.io
- WebSocket: wss://api.testnet.dreamdex.io/v0/ws/public
- Bot kit: github.com/somnia-chain/dreamdex-bot-kit (cloned for this report)
